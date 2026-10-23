from enum import Enum


class Profundidad(str, Enum):
    """Niveles ordinales de profundidad; sus umbrales se definen en el analizador."""

    # ------------------------------------------------------------------
    # Valores de menor a mayor luminosidad aproximada
    # ------------------------------------------------------------------
    CLARA = "clara"
    MEDIA = "media"
    OSCURA = "oscura"
