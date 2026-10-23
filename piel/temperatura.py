from enum import Enum


class Temperatura(str, Enum):
    """Categorías discretas de temperatura; no aplica una fórmula propia."""

    # ------------------------------------------------------------------
    # Valores de subtono de piel y temperatura de prendas
    # ------------------------------------------------------------------
    CALIDA = "calida"
    FRIA = "fria"
    NEUTRA = "neutra"
