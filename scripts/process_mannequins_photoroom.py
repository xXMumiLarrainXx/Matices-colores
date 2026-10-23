"""Remove mannequin-photo backgrounds once using PhotoRoom's segmentation API."""

from __future__ import annotations

import os
import urllib.error
import urllib.request
import uuid
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ASSET_DIRECTORY = PROJECT_ROOT / "web" / "assets"
PHOTOROOM_SEGMENT_URL = "https://sdk.photoroom.com/v1/segment"
MAX_OUTPUT_BYTES = 16 * 1024 * 1024
MANNEQUINS = {
    "femenino": ASSET_DIRECTORY / "maniqui-femenino.jpeg",
    "masculino": ASSET_DIRECTORY / "maniqui-masculino.jpeg",
}


def _make_multipart(image_path: Path, boundary: str) -> bytes:
    image_data = image_path.read_bytes()
    content_type = "image/jpeg"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="image_file"; filename="{image_path.name}"\r\n'
        f"Content-Type: {content_type}\r\n\r\n"
    ).encode("utf-8")
    return body + image_data + f"\r\n--{boundary}--\r\n".encode("ascii")


def _process_image(image_path: Path, api_key: str) -> Path:
    boundary = uuid.uuid4().hex
    request = urllib.request.Request(
        PHOTOROOM_SEGMENT_URL,
        data=_make_multipart(image_path, boundary),
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Accept": "image/png",
            "x-api-key": api_key,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            content_type = response.headers.get_content_type()
            image_data = response.read(MAX_OUTPUT_BYTES + 1)
    except urllib.error.HTTPError as error:
        detail = error.read(1000).decode("utf-8", "replace").strip()
        raise RuntimeError(
            f"PhotoRoom rechazó {image_path.name} (HTTP {error.code})"
            + (f": {detail}" if detail else "")
        ) from error
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        raise RuntimeError(
            f"No se pudo conectar con PhotoRoom al procesar {image_path.name}."
        ) from error

    if content_type != "image/png" or not image_data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise RuntimeError(
            f"PhotoRoom no devolvió un PNG válido para {image_path.name}."
        )
    if len(image_data) > MAX_OUTPUT_BYTES:
        raise RuntimeError(
            f"La imagen procesada de {image_path.name} supera 16 MB."
        )

    output_path = image_path.with_name(
        image_path.stem + "-photoroom.png"
    )
    temporary_path = output_path.with_suffix(".png.tmp")
    try:
        temporary_path.write_bytes(image_data)
        temporary_path.replace(output_path)
    finally:
        temporary_path.unlink(missing_ok=True)
    return output_path


def main() -> None:
    api_key = os.environ.get("PHOTOROOM_API_KEY", "").strip()
    if not api_key:
        raise SystemExit(
            "Configura PHOTOROOM_API_KEY en el entorno y vuelve a ejecutar."
        )
    for image_path in MANNEQUINS.values():
        if not image_path.is_file():
            raise FileNotFoundError(f"No se encontró la imagen original: {image_path}")
        output_path = _process_image(image_path, api_key)
        print(f"Maniquí procesado: {output_path.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    main()
