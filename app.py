"""Servidor local para la interfaz, Falabella y la prueba virtual con Gemini."""

from __future__ import annotations

import base64
import importlib
import json
import mimetypes
import os
import re
import threading
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from html import unescape
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import lru_cache
from pathlib import Path
from typing import TypedDict



class _LazyModule:
    """Carga dependencias pesadas solo cuando una ruta realmente las necesita."""

    def __init__(self, module_name: str) -> None:
        self._module_name = module_name
        self._module = None

    def _load(self):
        if self._module is None:
            self._module = importlib.import_module(self._module_name)
        return self._module

    def __getattr__(self, name: str):
        return getattr(self._load(), name)


cv2 = _LazyModule("cv2")
httpx = _LazyModule("httpx")
np = _LazyModule("numpy")


HOST = "127.0.0.1"
PORT = 8000
WEB_DIRECTORY = Path(__file__).resolve().parent / "web"
EXPECTED_HOST = f"{HOST}:{PORT}"
EXPECTED_ORIGIN = f"http://{EXPECTED_HOST}"
MAX_SEARCH_REQUEST_BYTES = 64 * 1024
MAX_TRYON_REQUEST_BYTES = 34 * 1024 * 1024
MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_TRYON_IMAGE_WIDTH = 1024
MAX_TRYON_IMAGE_HEIGHT = 768
MAX_TRYON_IMAGE_BYTES = 2 * 1024 * 1024
TRYON_JPEG_QUALITY = 82
MIN_TRYON_JPEG_QUALITY = 42
# Las páginas de búsqueda de Falabella incluyen metadata de variantes y pueden
# crecer bastante según la categoría. Se mantiene un límite finito, pero amplio
# para evitar rechazos normales sin permitir respuestas ilimitadas.
MAX_FALABELLA_RESPONSE_BYTES = 32 * 1024 * 1024
FALABELLA_CACHE_SIZE = 16
FALABELLA_IMAGE_CACHE_SIZE = 24
_MANNEQUIN_ARTWORK_LOCK = threading.Lock()
_MANNEQUIN_REMBG_SESSION = None
FALABELLA_QUERY = re.compile(r"^[\wÀ-ÿ -]{1,100}$")
IMAGE_DATA_URI = re.compile(
    r"^data:image/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$"
)
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
GEMINI_IMAGE_MODEL = "gemini-nano-banana-2.1"
GEMINI_IMAGE_EDIT_ENDPOINT = (
    f"{GEMINI_API_BASE}/models/{GEMINI_IMAGE_MODEL}:generateContent"
)


def _load_project_env() -> None:
    if os.environ.get("GEMINI_API_KEY", "").strip():
        return
    if os.environ.get("GOOGLE_API_KEY", "").strip():
        os.environ["GEMINI_API_KEY"] = os.environ["GOOGLE_API_KEY"].strip()
        return
    env_path = Path(__file__).resolve().parent / ".env"
    try:
        lines = env_path.read_text(encoding="utf-8").splitlines()
    except FileNotFoundError:
        return
    for line in lines:
        key, separator, value = line.partition("=")
        if separator and key.strip() in {"GEMINI_API_KEY", "GOOGLE_API_KEY"}:
            os.environ["GEMINI_API_KEY"] = value.strip().strip("\"'")
            return


_load_project_env()


class FalabellaError(RuntimeError):
    """Error al consultar la búsqueda pública de Falabella."""


class TryOnError(RuntimeError):
    """Error al generar una prueba virtual remota."""


class TryOnGarment(TypedDict):
    image_urls: list[str]
    category: str


class _StructuredDataParser(HTMLParser):
    """Extrae bloques JSON-LD de una página de resultados."""

    def __init__(self) -> None:
        super().__init__()
        self.documents: list[str] = []
        self.next_data: str | None = None
        self._inside_json_ld = False
        self._inside_next_data = False
        self._parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "script":
            return
        attributes = dict(attrs)
        script_type = attributes.get("type")
        self._inside_json_ld = (
            isinstance(script_type, str)
            and script_type.lower() == "application/ld+json"
        )
        self._inside_next_data = (
            attributes.get("id") == "__NEXT_DATA__"
            and script_type == "application/json"
        )
        self._parts = []

    def handle_data(self, data: str) -> None:
        if self._inside_json_ld:
            self._parts.append(data)
        if self._inside_next_data:
            self._parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "script" and self._inside_json_ld:
            self.documents.append("".join(self._parts))
            self._parts = []
            self._inside_json_ld = False
        elif tag.lower() == "script" and self._inside_next_data:
            self.next_data = "".join(self._parts)
            self._parts = []
            self._inside_next_data = False


class _RestrictedRedirectHandler(urllib.request.HTTPRedirectHandler):
    def __init__(self, allowed_host: str, allowed_path_prefix: str) -> None:
        super().__init__()
        self.allowed_host = allowed_host
        self.allowed_path_prefix = allowed_path_prefix

    def redirect_request(
        self,
        request: urllib.request.Request,
        file,
        code: int,
        message: str,
        headers,
        new_url: str,
    ):
        parsed = urllib.parse.urlsplit(new_url)
        try:
            port = parsed.port
        except ValueError:
            return None
        if (
            parsed.scheme != "https"
            or parsed.hostname != self.allowed_host
            or not parsed.path.startswith(self.allowed_path_prefix)
            or parsed.username is not None
            or parsed.password is not None
            or port is not None
        ):
            return None
        return super().redirect_request(
            request,
            file,
            code,
            message,
            headers,
            new_url,
        )


_FALABELLA_SEARCH_OPENER = urllib.request.build_opener(
    _RestrictedRedirectHandler("www.falabella.com", "/falabella-cl/")
)
_FALABELLA_IMAGE_OPENER = urllib.request.build_opener(
    _RestrictedRedirectHandler("media.falabella.com", "/falabellaCL/")
)


class AsesorRequestHandler(SimpleHTTPRequestHandler):
    """Sirve la interfaz y productos públicos de Falabella."""

    # ------------------------------------------------------------------
    # Configuración y rutas HTTP
    # ------------------------------------------------------------------

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIRECTORY), **kwargs)

    def do_GET(self) -> None:
        if self.path == "/api/config":
            self._send_json(200, self._get_tryon_config())
            return
        parsed_path = urllib.parse.urlsplit(self.path)
        if parsed_path.path == "/api/mannequin-image":
            self._serve_mannequin_image(parsed_path.query)
            return
        if parsed_path.path == "/api/falabella-image":
            self._serve_falabella_image(parsed_path.query)
            return
        super().do_GET()

    def _serve_falabella_image(self, query: str) -> None:
        image_urls = urllib.parse.parse_qs(query).get("url", [])
        if len(image_urls) != 1 or not self._is_falabella_image_url(image_urls[0]):
            self._send_json(400, {"error": "La imagen solicitada no es válida."})
            return
        try:
            image_data, mime_type = self._fetch_falabella_image(image_urls[0])
        except FalabellaError as error:
            self._send_json(502, {"error": str(error)})
            return
        self.send_response(200)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Length", str(len(image_data)))
        self.send_header("Cache-Control", "public, max-age=300")
        self.end_headers()
        self.wfile.write(image_data)

    def _serve_mannequin_image(self, query: str) -> None:
        parameters = urllib.parse.parse_qs(query)
        gender_values = parameters.get("gender", [])
        layer_values = parameters.get("layer", ["artwork"])
        if len(gender_values) != 1 or gender_values[0] not in {
            "mujer",
            "hombre",
        } or len(layer_values) != 1 or layer_values[0] not in {
            "artwork",
            "skin-mask",
        }:
            self._send_json(400, {"error": "El maniquí solicitado no es válido."})
            return
        asset_gender = {
            "mujer": "femenino",
            "hombre": "masculino",
        }[gender_values[0]]
        asset_dir = WEB_DIRECTORY / "assets"
        original_path = asset_dir / f"maniqui-{asset_gender}.jpeg"
        artwork_path = asset_dir / f"maniqui-{asset_gender}-rembg.png"
        skin_mask_path = asset_dir / f"maniqui-{asset_gender}-piel-mask.png"
        try:
            if not artwork_path.is_file() or not skin_mask_path.is_file():
                self._prepare_mannequin_artwork(
                    original_path,
                    artwork_path,
                    skin_mask_path,
                )
            image_path = (
                skin_mask_path if layer_values[0] == "skin-mask" else artwork_path
            )
            image_data = image_path.read_bytes()
        except FileNotFoundError:
            self._send_json(404, {"error": "No se encontró la imagen del maniquí."})
            return
        except (ImportError, OSError, RuntimeError, ValueError, cv2.error) as error:
            self.log_error("No se pudo preparar el maniquí con rembg: %s", error)
            self._send_json(
                500,
                {
                    "error": (
                        "No se pudo editar el maniquí con rembg. "
                        "Revisa la conexión y las dependencias del modelo."
                    )
                },
            )
            return
        self.send_response(200)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(image_data)))
        self.send_header("Cache-Control", "public, max-age=3600")
        self.end_headers()
        self.wfile.write(image_data)

    @staticmethod
    def _prepare_mannequin_artwork(
        original_path: Path,
        artwork_path: Path,
        skin_mask_path: Path,
    ) -> None:
        global _MANNEQUIN_REMBG_SESSION
        with _MANNEQUIN_ARTWORK_LOCK:
            if artwork_path.is_file() and skin_mask_path.is_file():
                return
            from rembg import new_session, remove

            original_data = original_path.read_bytes()
            image = cv2.imdecode(
                np.frombuffer(original_data, dtype=np.uint8),
                cv2.IMREAD_COLOR,
            )
            if image is None:
                raise ValueError("La imagen fuente del maniquí no es válida.")
            if _MANNEQUIN_REMBG_SESSION is None:
                _MANNEQUIN_REMBG_SESSION = new_session("u2net")
            cutout_data = remove(
                original_data,
                session=_MANNEQUIN_REMBG_SESSION,
                post_process_mask=True,
            )
            cutout = cv2.imdecode(
                np.frombuffer(cutout_data, dtype=np.uint8),
                cv2.IMREAD_UNCHANGED,
            )
            if cutout is None or cutout.ndim != 3 or cutout.shape[2] != 4:
                raise RuntimeError("rembg no devolvió una imagen PNG con transparencia.")
            if cutout.shape[:2] != image.shape[:2]:
                raise RuntimeError("rembg cambió el tamaño de la imagen del maniquí.")

            graphite, _ = cv2.pencilSketch(
                image,
                sigma_s=60,
                sigma_r=0.07,
                shade_factor=0.05,
            )
            source_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            graphite = cv2.addWeighted(source_gray, 0.55, graphite, 0.45, 0)
            artwork = cv2.cvtColor(graphite, cv2.COLOR_GRAY2BGRA)
            alpha = cutout[:, :, 3]
            artwork[:, :, 3] = alpha

            luminance = source_gray.astype(np.float32)
            watercolor = np.clip((luminance - 165) / 75, 0, 1)
            watercolor *= alpha.astype(np.float32) / 255
            height, width = image.shape[:2]
            body_region = np.zeros((height, width), dtype=np.float32)
            cv2.rectangle(
                body_region,
                (int(width * 0.2), int(height * 0.04)),
                (int(width * 0.8), int(height * 0.9)),
                1,
                thickness=cv2.FILLED,
            )
            watercolor *= body_region
            noise_size = (max(2, image.shape[1] // 32), max(2, image.shape[0] // 32))
            noise = np.random.default_rng(17).uniform(0.72, 1.0, noise_size).astype(
                np.float32
            )
            watercolor_texture = cv2.resize(
                noise,
                (image.shape[1], image.shape[0]),
                interpolation=cv2.INTER_CUBIC,
            )
            watercolor *= watercolor_texture
            skin_mask = np.uint8(np.clip(watercolor * 255, 0, 255))
            skin_mask = cv2.GaussianBlur(skin_mask, (5, 5), 1)
            mask_rgba = cv2.cvtColor(skin_mask, cv2.COLOR_GRAY2BGRA)
            mask_rgba[:, :, 3] = alpha

            artwork_path.parent.mkdir(parents=True, exist_ok=True)
            artwork_tmp = artwork_path.with_name(artwork_path.stem + ".tmp.png")
            mask_tmp = skin_mask_path.with_name(skin_mask_path.stem + ".tmp.png")
            try:
                if not cv2.imwrite(str(artwork_tmp), artwork):
                    raise OSError("No se pudo guardar el dibujo del maniquí.")
                if not cv2.imwrite(str(mask_tmp), mask_rgba):
                    raise OSError("No se pudo guardar la máscara de acuarela.")
                artwork_tmp.replace(artwork_path)
                mask_tmp.replace(skin_mask_path)
            finally:
                artwork_tmp.unlink(missing_ok=True)
                mask_tmp.unlink(missing_ok=True)

    @staticmethod
    def _get_tryon_config() -> dict:
        if not os.environ.get("GEMINI_API_KEY", "").strip():
            return {
                "tryon_available": True,
                "tryon_mode": "local",
                "tryon_unavailable_reason": "",
            }
        return {
            "tryon_available": True,
            "tryon_mode": "gemini",
            "tryon_unavailable_reason": "",
        }

    def do_POST(self) -> None:
        if self.path not in {"/api/falabella-search", "/api/tryon"}:
            self._send_json(404, {"error": "Ruta no encontrada."})
            return
        if not self._is_same_origin_request():
            self._send_json(403, {"error": "Solicitud de origen no permitido."})
            return

        if self.path == "/api/tryon":
            self._run_virtual_tryon()
            return
        self._search_falabella()

    def _search_falabella(self) -> None:
        try:
            payload = self._read_json(MAX_SEARCH_REQUEST_BYTES)
            query = payload.get("query")
            if not isinstance(query, str):
                raise ValueError("La búsqueda no es válida.")
            query = " ".join(query.split())
            if not FALABELLA_QUERY.fullmatch(query):
                raise ValueError("La búsqueda contiene datos no permitidos.")
            products = self._get_falabella_products(query)
            self._send_json(200, {"products": products})
        except FalabellaError as error:
            self._send_json(502, {"error": str(error)})
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"error": "La búsqueda no contiene datos válidos."})

    def _run_virtual_tryon(self) -> None:
        try:
            payload = self._read_json(MAX_TRYON_REQUEST_BYTES)
            person_image = self._validate_image(payload.get("person_image"))
            garments = payload.get("garments")
            if not isinstance(garments, list) or not 1 <= len(garments) <= 8:
                raise ValueError("Selecciona entre una y ocho prendas.")
            normalized_garments: list[TryOnGarment] = []
            for garment in garments:
                if not isinstance(garment, dict):
                    raise ValueError("Una prenda seleccionada no es válida.")
                image_url = garment.get("image_url")
                fallback_image_url = garment.get("fallback_image_url")
                category = garment.get("category")
                if (
                    not isinstance(image_url, str)
                    or not self._is_falabella_image_url(image_url)
                ):
                    raise ValueError("Las imágenes de prendas deben provenir de Falabella.")
                image_urls = [image_url]
                if fallback_image_url is not None:
                    if (
                        not isinstance(fallback_image_url, str)
                        or not self._is_falabella_image_url(fallback_image_url)
                    ):
                        raise ValueError(
                            "La imagen alternativa debe provenir de Falabella."
                        )
                    if fallback_image_url != image_url:
                        image_urls.append(fallback_image_url)
                if not isinstance(category, str) or category not in {
                    "tops",
                    "bottoms",
                    "one-pieces",
                }:
                    raise ValueError("La categoría de una prenda no es válida.")
                normalized_garments.append(
                    {"image_urls": image_urls, "category": category}
                )
            image = self._run_tryon(person_image, normalized_garments)
            self._send_json(200, {"image": image})
        except TryOnError as error:
            self._send_json(502, {"error": str(error)})
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"error": "La solicitud no contiene datos válidos."})

    @staticmethod
    @lru_cache(maxsize=FALABELLA_CACHE_SIZE)
    def _get_falabella_products(query: str) -> list[dict[str, object]]:
        search_url = (
            "https://www.falabella.com/falabella-cl/search?Ntt="
            + urllib.parse.quote_plus(query)
        )
        request = urllib.request.Request(
            search_url,
            headers={
                "Accept": "text/html",
                "User-Agent": "MaticesLookbook/1.0 (public product search)",
            },
        )
        try:
            with _FALABELLA_SEARCH_OPENER.open(request, timeout=15) as response:
                if response.headers.get_content_type() != "text/html":
                    raise FalabellaError("Falabella no devolvió una página de búsqueda.")
                html_bytes = response.read(MAX_FALABELLA_RESPONSE_BYTES + 1)
                if len(html_bytes) > MAX_FALABELLA_RESPONSE_BYTES:
                    raise FalabellaError("La respuesta de Falabella supera el límite.")
                charset = response.headers.get_content_charset() or "utf-8"
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            raise FalabellaError(
                "No se pudo consultar la búsqueda pública de Falabella."
            ) from error

        parser = _StructuredDataParser()
        parser.feed(html_bytes.decode(charset, errors="replace"))
        sizes_by_product = AsesorRequestHandler._get_size_variants(parser.next_data)
        products: list[dict[str, object]] = []
        seen_product_urls: set[str] = set()
        for document in parser.documents:
            try:
                structured_data = json.loads(unescape(document))
            except json.JSONDecodeError:
                continue
            if not isinstance(structured_data, dict):
                continue
            entries = structured_data.get("itemListElement", [])
            if not isinstance(entries, list):
                continue
            for entry in entries:
                if not isinstance(entry, dict):
                    continue
                product = entry.get("item")
                if not isinstance(product, dict) or product.get("@type") != "Product":
                    continue
                product_url = product.get("url")
                product_image = product.get("image")
                if not isinstance(product_url, str) or not isinstance(product_image, str):
                    continue
                if not AsesorRequestHandler._is_falabella_product_url(product_url):
                    continue
                if not AsesorRequestHandler._is_falabella_image_url(product_image):
                    continue
                if product_url in seen_product_urls:
                    continue
                brand = product.get("brand", {})
                if isinstance(brand, dict):
                    brand_name = brand.get("name", "")
                else:
                    brand_name = brand if isinstance(brand, str) else ""
                offers = product.get("offers", [])
                if isinstance(offers, dict):
                    offers = [offers]
                price = ""
                if isinstance(offers, list) and offers and isinstance(offers[0], dict):
                    raw_price = offers[0].get("price")
                    if raw_price is not None:
                        price = str(raw_price)
                name = product.get("name")
                if not isinstance(name, str) or not name.strip():
                    continue
                gender_metadata = " ".join(
                    value.strip()
                    for value in (
                        product.get("gender"),
                        product.get("category"),
                        product.get("description"),
                        product.get("audience"),
                    )
                    if isinstance(value, str) and value.strip()
                )
                product_sizes = sizes_by_product.get(
                    AsesorRequestHandler._falabella_product_id(product_url),
                    [],
                )
                if not product_sizes:
                    continue
                products.append(
                    {
                        "name": name.strip()[:160],
                        "brand": str(brand_name)[:100],
                        "price": price[:30],
                        "currency": "CLP",
                        "url": product_url,
                        "image_url": product_image,
                        "sizes": product_sizes,
                        "gender_metadata": gender_metadata[:500],
                    }
                )
                seen_product_urls.add(product_url)

        return products

    @staticmethod
    def _falabella_product_id(url: str) -> str:
        match = re.search(r"/product/(\d+)(?:/|$)", urllib.parse.urlsplit(url).path)
        return match.group(1) if match else ""

    @staticmethod
    def _get_size_variants(next_data: str | None) -> dict[str, list[dict[str, str]]]:
        if not next_data:
            return {}
        try:
            state = json.loads(next_data)
        except json.JSONDecodeError:
            return {}
        if not isinstance(state, dict):
            return {}
        props = state.get("props", {})
        page_props = props.get("pageProps", {}) if isinstance(props, dict) else {}
        if not isinstance(page_props, dict):
            return {}
        results = page_props.get("results", [])
        if not isinstance(results, list):
            return {}
        variants_by_product: dict[str, list[dict[str, str]]] = {}
        for product in results:
            if not isinstance(product, dict):
                continue
            product_id = str(product.get("productId", ""))
            if not product_id.isdigit():
                product_url = product.get("url") or product.get("productUrl") or ""
                if not isinstance(product_url, str):
                    continue
                product_id = AsesorRequestHandler._falabella_product_id(product_url)
            if not product_id:
                continue
            variants = product.get("variants", [])
            sizes: list[dict[str, str]] = []
            if isinstance(variants, list):
                for variant in variants:
                    if not isinstance(variant, dict) or variant.get("type") != "SIZES":
                        continue
                    options = variant.get("options", [])
                    if not isinstance(options, list):
                        continue
                    for option in options:
                        if (
                            not isinstance(option, dict)
                            or option.get("available") is not True
                            or option.get("isPurchaseable") is not True
                        ):
                            continue
                        size = option.get("size")
                        if not isinstance(size, str) or not size.strip() or len(size) > 24:
                            continue
                        url = option.get("url")
                        if not isinstance(url, str) or not AsesorRequestHandler._is_falabella_product_url(url):
                            url = ""
                        price = option.get("prices")
                        if isinstance(price, list) and price:
                            price = price[0]
                        if isinstance(price, dict):
                            price = price.get("price", "")
                        image_url = ""
                        media_id = option.get("mediaId")
                        if isinstance(media_id, (str, int)) and str(media_id).isdigit():
                            image_url = (
                                "https://media.falabella.com/falabellaCL/"
                                + str(media_id)
                                + "_01/public"
                            )
                        sizes.append(
                            {
                                "size": size.strip(),
                                "url": url,
                                "price": str(price)[:30] if price is not None else "",
                                "image_url": image_url,
                            }
                        )
            variants_by_product[product_id] = sizes
        return variants_by_product

    @staticmethod
    def _validate_image(data_uri: object) -> tuple[bytes, str]:
        if not isinstance(data_uri, str):
            raise ValueError("Selecciona una fotografía válida.")
        match = IMAGE_DATA_URI.fullmatch(data_uri)
        if not match or len(data_uri) > MAX_IMAGE_BYTES * 4 // 3 + 256:
            raise ValueError("La foto debe ser JPG, PNG o WEBP y no superar 8 MB.")
        try:
            image_data = base64.b64decode(match.group(1), validate=True)
        except (ValueError, base64.binascii.Error) as error:
            raise ValueError("La fotografía no tiene un formato válido.") from error
        if not image_data or len(image_data) > MAX_IMAGE_BYTES:
            raise ValueError("La foto debe ser JPG, PNG o WEBP y no superar 8 MB.")
        mime_type = data_uri[5 : data_uri.index(";")]
        is_valid_image = (
            mime_type == "image/jpeg" and image_data.startswith(b"\xff\xd8\xff")
        ) or (
            mime_type == "image/png"
            and image_data.startswith(b"\x89PNG\r\n\x1a\n")
        ) or (
            mime_type == "image/webp"
            and image_data.startswith(b"RIFF")
            and image_data[8:12] == b"WEBP"
        )
        if not is_valid_image:
            raise ValueError("La fotografía no coincide con su tipo de imagen.")
        return image_data, mime_type

    @staticmethod
    def _fetch_garment_data(urls: list[str]) -> tuple[bytes, str]:
        failures: list[str] = []
        for url in urls:
            try:
                return AsesorRequestHandler._fetch_falabella_image(url)
            except FalabellaError as error:
                failures.append(str(error))

        detail = "; ".join(failures)
        raise TryOnError(
            "No se pudo descargar una imagen de prenda desde Falabella."
            + (f" Detalle: {detail}." if detail else "")
        )

    @staticmethod
    @lru_cache(maxsize=FALABELLA_IMAGE_CACHE_SIZE)
    def _fetch_falabella_image(url: str) -> tuple[bytes, str]:
        if not AsesorRequestHandler._is_falabella_image_url(url):
            raise FalabellaError("La URL de imagen no pertenece a Falabella.")
        request = urllib.request.Request(
            url,
            headers={
                "Accept": "image/webp,image/png,image/jpeg,*/*;q=0.8",
                "Referer": "https://www.falabella.com/",
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
            },
        )
        try:
            with _FALABELLA_IMAGE_OPENER.open(request, timeout=20) as response:
                content_type = response.headers.get_content_type()
                if content_type not in {"image/jpeg", "image/png", "image/webp"}:
                    raise FalabellaError(
                        f"Falabella devolvió un formato no compatible: {content_type}."
                    )
                image_data = response.read(MAX_IMAGE_BYTES + 1)
                if len(image_data) > MAX_IMAGE_BYTES:
                    raise FalabellaError("La imagen de Falabella supera el límite de 8 MB.")
                if not image_data:
                    raise FalabellaError("Falabella devolvió una imagen vacía.")
                return image_data, content_type
        except FalabellaError:
            raise
        except urllib.error.HTTPError as error:
            raise FalabellaError(
                f"Falabella no pudo entregar la imagen (HTTP {error.code})."
            ) from error
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            raise FalabellaError("No se pudo descargar la imagen de Falabella.") from error

    @staticmethod
    def _run_tryon(
        person_image: tuple[bytes, str],
        garments: list[TryOnGarment],
    ) -> str:
        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        prepared_person = AsesorRequestHandler._prepare_tryon_image(
            (
                person_image[0],
                person_image[1],
                "person" + (mimetypes.guess_extension(person_image[1]) or ".jpg"),
            )
        )
        try:
            prepared_garments: list[tuple[bytes, str, str]] = []
            for index, garment in enumerate(garments):
                garment_data, garment_mime = AsesorRequestHandler._fetch_garment_data(
                    garment["image_urls"]
                )
                prepared_garments.append(
                    AsesorRequestHandler._prepare_tryon_image(
                        (garment_data, garment_mime, f"garment-{index}")
                    )
                )

            if not api_key:
                return AsesorRequestHandler._request_local_tryon(
                    prepared_person,
                    prepared_garments,
                    garments,
                )
            return AsesorRequestHandler._request_gemini_image_edit(
                prepared_person,
                prepared_garments,
                garments,
                api_key,
            )
        except httpx.HTTPStatusError as error:
            status_code = error.response.status_code
            if status_code == 401:
                raise TryOnError(
                    "Google rechazó GEMINI_API_KEY (HTTP 401). Revisa que la clave "
                    "de Google AI Studio sea válida y esté activa."
                ) from error
            if status_code == 403:
                raise TryOnError(
                    "Google rechazó la solicitud (HTTP 403). Revisa que la clave "
                    "de AI Studio esté habilitada para Gemini API y que el proyecto "
                    "tenga acceso al modelo de imágenes."
                ) from error
            if status_code == 429:
                raise TryOnError(
                    "Gemini limitó la solicitud (HTTP 429). Revisa la cuota y "
                    "los límites de uso del proyecto e inténtalo más tarde."
                ) from error
            try:
                error_payload = error.response.json()
            except json.JSONDecodeError:
                error_payload = {}
            error_detail = error_payload.get("error", {})
            detail = (
                error_detail.get("message", "")
                if isinstance(error_detail, dict)
                else ""
            )
            raise TryOnError(
                f"Google Gemini respondió con HTTP {status_code}."
                + (f" Detalle: {detail[:300]}" if isinstance(detail, str) and detail else "")
            ) from error
        except httpx.HTTPError as error:
            detail = str(error).strip()
            raise TryOnError(
                "No se pudo completar la solicitud a Gemini."
                + (f" Detalle: {detail[:300]}" if detail else "")
            ) from error
        except (FalabellaError, urllib.error.URLError, TimeoutError, OSError) as error:
            raise TryOnError(
                "No se pudo preparar o descargar una imagen para la prueba virtual. "
                "Revisa la conexión e inténtalo de nuevo."
            ) from error

    @staticmethod
    def _request_local_tryon(
        person_image: tuple[bytes, str, str],
        garments: list[tuple[bytes, str, str]],
        garment_details: list[TryOnGarment],
    ) -> str:
        """Compone una prueba local de respaldo sin un modelo remoto."""
        person_data, _mime_type, _filename = person_image
        person = cv2.imdecode(
            np.frombuffer(person_data, dtype=np.uint8),
            cv2.IMREAD_COLOR,
        )
        if person is None:
            raise TryOnError("No se pudo preparar la fotografía para la prueba local.")

        height, width = person.shape[:2]
        placements = {
            "tops": (0.34, 0.43),
            "bottoms": (0.56, 0.46),
            "one-pieces": (0.35, 0.48),
        }
        for garment, details in zip(garments, garment_details):
            garment_image = cv2.imdecode(
                np.frombuffer(garment[0], dtype=np.uint8),
                cv2.IMREAD_COLOR,
            )
            if garment_image is None:
                continue
            category = details["category"]
            x_ratio, width_ratio = placements[category]
            garment_height, garment_width = garment_image.shape[:2]
            if garment_height == 0 or garment_width == 0:
                continue

            # Elimina el fondo blanco típico de las fotos de catálogo y conserva
            # los bordes para que la prenda quede integrada sobre la fotografía.
            foreground = cv2.inRange(
                garment_image,
                np.array([0, 0, 0], dtype=np.uint8),
                np.array([242, 242, 242], dtype=np.uint8),
            )
            points = cv2.findNonZero(foreground)
            if points is not None:
                crop_x, crop_y, crop_width, crop_height = cv2.boundingRect(points)
                garment_image = garment_image[
                    crop_y:crop_y + crop_height,
                    crop_x:crop_x + crop_width,
                ]
                foreground = foreground[
                    crop_y:crop_y + crop_height,
                    crop_x:crop_x + crop_width,
                ]
            else:
                foreground = np.full(
                    garment_image.shape[:2], 220, dtype=np.uint8
                )

            target_width = max(1, min(width, round(width * width_ratio)))
            target_height = max(
                1,
                round(target_width * garment_image.shape[0] / garment_image.shape[1]),
            )
            garment_image = cv2.resize(
                garment_image,
                (target_width, target_height),
                interpolation=cv2.INTER_AREA,
            )
            foreground = cv2.resize(
                foreground,
                (target_width, target_height),
                interpolation=cv2.INTER_AREA,
            )
            alpha = cv2.GaussianBlur(foreground, (5, 5), 0).astype(np.float32) / 255
            x = max(0, min(width - target_width, round(width * x_ratio - target_width / 2)))
            y_ratio = placements[category][0]
            y = max(0, min(height - target_height, round(height * y_ratio)))
            end_x = min(width, x + target_width)
            end_y = min(height, y + target_height)
            overlay = garment_image[:end_y - y, :end_x - x]
            blend = alpha[:end_y - y, :end_x - x, None] * 0.88
            person[y:end_y, x:end_x] = (
                person[y:end_y, x:end_x].astype(np.float32) * (1 - blend)
                + overlay.astype(np.float32) * blend
            ).astype(np.uint8)

        encoded, result = cv2.imencode(
            ".jpg",
            person,
            [cv2.IMWRITE_JPEG_QUALITY, TRYON_JPEG_QUALITY],
        )
        if not encoded:
            raise TryOnError("No se pudo crear la prueba virtual local.")
        data = base64.b64encode(result.tobytes()).decode("ascii")
        return f"data:image/jpeg;base64,{data}"

    @staticmethod
    def _prepare_tryon_image(
        image: tuple[bytes, str, str],
    ) -> tuple[bytes, str, str]:
        image_data, _mime_type, filename = image
        try:
            decoded = cv2.imdecode(
                np.frombuffer(image_data, dtype=np.uint8),
                cv2.IMREAD_COLOR,
            )
        except cv2.error as error:
            raise TryOnError(
                f"No se pudo leer la imagen «{Path(filename).name}»."
            ) from error
        if decoded is None:
            raise TryOnError(
                f"No se pudo leer la imagen «{Path(filename).name}»."
            )

        height, width = decoded.shape[:2]
        scale = min(
            1,
            MAX_TRYON_IMAGE_WIDTH / width,
            MAX_TRYON_IMAGE_HEIGHT / height,
        )
        if scale < 1:
            resized_dimensions = (
                max(1, round(width * scale)),
                max(1, round(height * scale)),
            )
            decoded = cv2.resize(
                decoded,
                resized_dimensions,
                interpolation=cv2.INTER_AREA,
            )

        quality = TRYON_JPEG_QUALITY
        while True:
            encoded, compressed = cv2.imencode(
                ".jpg",
                decoded,
                [cv2.IMWRITE_JPEG_QUALITY, quality],
            )
            if not encoded:
                raise TryOnError(
                    f"No se pudo reducir la calidad de «{Path(filename).name}»."
                )
            if compressed.size <= MAX_TRYON_IMAGE_BYTES:
                return (
                    compressed.tobytes(),
                    "image/jpeg",
                    Path(filename).stem + ".jpg",
                )
            if quality > MIN_TRYON_JPEG_QUALITY:
                quality = max(MIN_TRYON_JPEG_QUALITY, quality - 8)
                continue

            height, width = decoded.shape[:2]
            if width <= 1 or height <= 1:
                raise TryOnError(
                    f"No se pudo reducir «{Path(filename).name}» a menos de 2 MB."
                )
            decoded = cv2.resize(
                decoded,
                (max(1, int(width * 0.8)), max(1, int(height * 0.8))),
                interpolation=cv2.INTER_AREA,
            )
            quality = TRYON_JPEG_QUALITY

    @staticmethod
    def _request_gemini_image_edit(
        person_image: tuple[bytes, str, str],
        garments: list[tuple[bytes, str, str]],
        garment_details: list[TryOnGarment],
        api_key: str,
    ) -> str:
        person_data, person_mime, _ = person_image
        image_references = [(person_data, person_mime), *[
            (garment_data, garment_mime)
            for garment_data, garment_mime, _ in garments
        ]]
        garment_instructions: list[str] = []
        for index, garment in enumerate(garment_details, start=2):
            category = {
                "tops": "upper-body garment",
                "bottoms": "lower-body garment",
                "one-pieces": "one-piece garment",
            }[garment["category"]]
            garment_instructions.append(
                f"Reference image {index} shows the exact {category} to put on the person."
            )
        prompt = (
            "Create a realistic virtual clothing try-on. The first image is the person "
            "and must remain the base image. Preserve the person's identity, face, hair, "
            "body shape, pose, hands, lighting, background, and framing. Change only "
            "the clothing, naturally fitted to the existing pose and body. Reproduce "
            "the actual colors, cut, fabric, patterns, and details of each garment "
            "reference. Do not add accessories, text, logos, or extra garments. "
            + " ".join(garment_instructions)
        )
        parts = [{"text": prompt}, *(
            {
                "inlineData": {
                    "mimeType": mime_type,
                    "data": base64.b64encode(image_data).decode("ascii"),
                }
            }
            for image_data, mime_type in image_references
        )]
        try:
            with httpx.Client(timeout=httpx.Timeout(180, connect=20)) as client:
                response = client.post(
                    GEMINI_IMAGE_EDIT_ENDPOINT,
                    headers={"x-goog-api-key": api_key},
                    json={
                        "contents": [{"role": "user", "parts": parts}],
                        "generationConfig": {
                            "responseModalities": ["TEXT", "IMAGE"],
                        },
                    },
                )
            response.raise_for_status()
        except httpx.HTTPStatusError:
            raise
        except httpx.HTTPError as error:
            raise TryOnError(
                "No se pudo conectar con Gemini API."
            ) from error
        try:
            result = response.json()
        except json.JSONDecodeError as error:
            raise TryOnError("Gemini devolvió una respuesta JSON no válida.") from error
        candidates = result.get("candidates") if isinstance(result, dict) else None
        content = (
            candidates[0].get("content")
            if isinstance(candidates, list) and candidates
            else None
        )
        response_parts = content.get("parts") if isinstance(content, dict) else None
        image_part = next(
            (
                part
                for part in response_parts or []
                if isinstance(part, dict)
                and isinstance(part.get("inlineData"), dict)
                and isinstance(part["inlineData"].get("data"), str)
            ),
            None,
        )
        if image_part is None:
            prompt_feedback = result.get("promptFeedback", {})
            block_reason = (
                prompt_feedback.get("blockReason")
                if isinstance(prompt_feedback, dict)
                else None
            )
            if block_reason:
                raise TryOnError(
                    f"Gemini no generó la imagen; la solicitud fue bloqueada ({block_reason})."
                )
            raise TryOnError("Gemini no devolvió una imagen utilizable.")
        image_data_payload = image_part["inlineData"]
        try:
            image_data = base64.b64decode(image_data_payload["data"], validate=True)
        except (ValueError, base64.binascii.Error) as error:
            raise TryOnError("Gemini devolvió datos de imagen no válidos.") from error
        if not image_data or len(image_data) > MAX_IMAGE_BYTES:
            raise TryOnError("La imagen generada está vacía o supera el límite de 8 MB.")
        mime_type = image_data_payload.get("mimeType")
        if mime_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise TryOnError("Gemini devolvió un formato de imagen no compatible.")
        encoded = base64.b64encode(image_data).decode("ascii")
        image_data, mime_type = AsesorRequestHandler._validate_image(
            f"data:{mime_type};base64,{encoded}"
        )
        return f"data:{mime_type};base64,{encoded}"

    @staticmethod
    def _is_falabella_product_url(url: str) -> bool:
        parsed = urllib.parse.urlsplit(url)
        try:
            port = parsed.port
        except ValueError:
            return False
        return (
            parsed.scheme == "https"
            and parsed.hostname == "www.falabella.com"
            and parsed.path.startswith("/falabella-cl/product/")
            and parsed.username is None
            and parsed.password is None
            and port is None
        )

    @staticmethod
    def _is_falabella_image_url(url: str) -> bool:
        parsed = urllib.parse.urlsplit(url)
        try:
            port = parsed.port
        except ValueError:
            return False
        return (
            parsed.scheme == "https"
            and parsed.hostname == "media.falabella.com"
            and parsed.path.startswith("/falabellaCL/")
            and parsed.username is None
            and parsed.password is None
            and port is None
        )

    def _is_same_origin_request(self) -> bool:
        return (
            self.headers.get("Host") == EXPECTED_HOST
            and self.headers.get("Origin") == EXPECTED_ORIGIN
            and self.headers.get_content_type() == "application/json"
        )

    def _read_json(self, max_bytes: int) -> dict:
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise ValueError("Tamaño de solicitud inválido.") from error
        if content_length <= 0 or content_length > max_bytes:
            raise ValueError("La solicitud está vacía o supera el límite de tamaño.")
        payload = json.loads(self.rfile.read(content_length))
        if not isinstance(payload, dict):
            raise ValueError("El cuerpo debe ser un objeto JSON.")
        return payload

    # ------------------------------------------------------------------
    # Respuesta JSON del servidor local
    # ------------------------------------------------------------------

    def _send_json(self, status: int, payload: dict) -> None:
        response_body = json.dumps(
            payload,
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(response_body)


# ----------------------------------------------------------------------
# Inicio del servidor web local
# ----------------------------------------------------------------------
def main() -> None:
    ThreadingHTTPServer.daemon_threads = True
    server = ThreadingHTTPServer((HOST, PORT), AsesorRequestHandler)
    url = f"http://{HOST}:{PORT}"
    print(f"Interfaz disponible en {url}")
    print("Presiona Ctrl+C para detener.")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
