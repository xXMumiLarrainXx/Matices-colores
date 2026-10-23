from functools import lru_cache
from pathlib import Path
from typing import Union

import cv2
import numpy as np

from piel.contraste import Contraste
from piel.matiz_piel import MatizPiel
from piel.profundidad import Profundidad
from piel.temperatura import Temperatura
from .resultado_fotografia import ResultadoFotografia


class AnalizadorFotografia:
    """Estima profundidad y subtono usando el color mediano de ambas mejillas.

    Métricas: L* de CIELAB determina profundidad; b* - a* estima calidez.
    Son umbrales heurísticos, no una evaluación profesional calibrada para
    cada cámara o condición de iluminación.
    """

    # ------------------------------------------------------------------
    # Umbrales heurísticos para seleccionar piel y clasificar el color
    # ------------------------------------------------------------------
    _CR_MINIMO = 125
    _CR_MAXIMO = 185
    _CB_MINIMO = 65
    _CB_MAXIMO = 145
    _L_MINIMO = 25
    _L_MAXIMO = 250
    _UMBRAL_CALIDEZ = 4.5
    _PIEL_MINIMA = np.array((_L_MINIMO, _CR_MINIMO, _CB_MINIMO), dtype=np.uint8)
    _PIEL_MAXIMA = np.array((_L_MAXIMO, _CR_MAXIMO, _CB_MAXIMO), dtype=np.uint8)

    @staticmethod
    @lru_cache(maxsize=1)
    def _obtener_detector() -> cv2.CascadeClassifier:
        """Carga el clasificador una sola vez por proceso.

        Leer y construir el clasificador Haar es más costoso que reutilizarlo.
        La función cacheada conserva exactamente el mismo detector y evita
        repetir esa inicialización en cada fotografía analizada.
        """
        detector = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        if detector.empty():
            raise RuntimeError("No se pudo cargar el detector de rostros de OpenCV.")
        return detector

    def analizar(self, ruta_fotografia: Union[str, Path]) -> ResultadoFotografia:
        """Detecta el rostro mayor y calcula el perfil desde las mejillas."""
        ruta = Path(ruta_fotografia).expanduser()
        if not ruta.is_file():
            raise FileNotFoundError(f"No se encontro la fotografia: {ruta}")

        imagen = cv2.imread(str(ruta), cv2.IMREAD_COLOR)
        if imagen is None:
            raise ValueError(
                "No se pudo abrir la imagen. Usa un archivo JPG o PNG valido."
            )

        gris = cv2.cvtColor(imagen, cv2.COLOR_BGR2GRAY)
        detector = self._obtener_detector()

        rostros = detector.detectMultiScale(
            gris,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(100, 100),
        )
        if len(rostros) == 0:
            raise ValueError(
                "No se detecto un rostro frontal. Prueba una foto nitida, "
                "bien iluminada y con la cara mirando a la camara."
            )

        x, y, ancho, alto = max(rostros, key=lambda rostro: rostro[2] * rostro[3])
        pixeles = self._obtener_pixeles_de_mejillas(imagen, x, y, ancho, alto)
        if len(pixeles) < 100:
            raise ValueError(
                "No se pudieron obtener suficientes pixeles de piel. "
                "Prueba una foto con el rostro despejado y luz uniforme."
            )

        mediana_bgr = np.median(pixeles, axis=0).astype(np.uint8)
        muestra_bgr = np.array([[mediana_bgr]], dtype=np.uint8)
        muestra_lab = cv2.cvtColor(muestra_bgr, cv2.COLOR_BGR2LAB)[0, 0]
        # OpenCV codifica L* en 0..255 y a*/b* con neutro en 128.
        # Por eso la métrica térmica es (b_codificado - 128) - (a_codificado - 128).
        luminosidad = float(muestra_lab[0]) * 100 / 255
        componente_a = float(muestra_lab[1]) - 128
        componente_b = float(muestra_lab[2]) - 128
        indice_calidez = componente_b - componente_a

        if luminosidad >= 66:
            profundidad = Profundidad.CLARA
        elif luminosidad < 48:
            profundidad = Profundidad.OSCURA
        else:
            profundidad = Profundidad.MEDIA

        if indice_calidez > self._UMBRAL_CALIDEZ:
            subtono = Temperatura.CALIDA
        elif indice_calidez < -self._UMBRAL_CALIDEZ:
            subtono = Temperatura.FRIA
        else:
            subtono = Temperatura.NEUTRA

        return ResultadoFotografia(
            matiz_piel=MatizPiel(
                subtono=subtono,
                profundidad=profundidad,
                contraste_preferido=Contraste.MEDIO,
            ),
            rostros_detectados=len(rostros),
            pixeles_analizados=len(pixeles),
            luminosidad_lab=round(luminosidad, 1),
            indice_calidez=round(indice_calidez, 1),
        )

    # ------------------------------------------------------------------
    # Extracción de muestras en regiones aproximadas de las mejillas
    # ------------------------------------------------------------------

    def _obtener_pixeles_de_mejillas(
        self,
        imagen: np.ndarray,
        x: int,
        y: int,
        ancho: int,
        alto: int,
    ) -> np.ndarray:
        zonas = (
            (x + int(ancho * 0.16), y + int(alto * 0.50),
             x + int(ancho * 0.41), y + int(alto * 0.72)),
            (x + int(ancho * 0.59), y + int(alto * 0.50),
             x + int(ancho * 0.84), y + int(alto * 0.72)),
        )
        muestras = []
        for x_inicio, y_inicio, x_fin, y_fin in zonas:
            mejilla = imagen[y_inicio:y_fin, x_inicio:x_fin]
            if mejilla.size == 0:
                continue
            ycrcb = cv2.cvtColor(mejilla, cv2.COLOR_BGR2YCrCb)
            # inRange aplica los seis límites en una sola operación nativa,
            # evitando separar los canales y crear varias máscaras NumPy.
            mascara = cv2.inRange(ycrcb, self._PIEL_MINIMA, self._PIEL_MAXIMA)
            pixeles_piel = mejilla[mascara != 0]
            if len(pixeles_piel):
                muestras.append(pixeles_piel)

        if not muestras:
            return np.empty((0, 3), dtype=np.uint8)
        if len(muestras) == 1:
            return muestras[0]
        return np.concatenate(muestras, axis=0)
