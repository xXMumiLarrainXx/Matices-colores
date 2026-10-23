from dataclasses import dataclass

from .contraste import Contraste
from .profundidad import Profundidad
from .temperatura import Temperatura


@dataclass(frozen=True)
class MatizPiel:
    """Perfil usado para comparar ropa; agrupa categorías y no calcula métricas.

    En la interfaz web, subtono y profundidad se estiman con muestras de foto.
    """

    # ------------------------------------------------------------------
    # Categorías del perfil (no contienen valores de píxel)
    # ------------------------------------------------------------------
    subtono: Temperatura
    profundidad: Profundidad
    contraste_preferido: Contraste = Contraste.MEDIO
