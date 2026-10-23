from dataclasses import dataclass

from piel.matiz_piel import MatizPiel


@dataclass(frozen=True)
class ResultadoFotografia:
    """Contenedor del perfil y de los valores medidos durante el muestreo.

    No calcula métricas; conserva el conteo de rostros y píxeles, L* y b* - a*.
    """

    # Es un objeto de resultado creado por cada análisis. Al no permitir
    # atributos dinámicos reducimos memoria por instancia sin cambiar su API.
    __slots__ = (
        "matiz_piel",
        "rostros_detectados",
        "pixeles_analizados",
        "luminosidad_lab",
        "indice_calidez",
    )

    # ------------------------------------------------------------------
    # Perfil categórico y contadores del muestreo
    # ------------------------------------------------------------------
    matiz_piel: MatizPiel
    rostros_detectados: int
    pixeles_analizados: int

    # ------------------------------------------------------------------
    # Valores de color conservados para explicar/revisar la estimación
    # ------------------------------------------------------------------
    luminosidad_lab: float
    indice_calidez: float
