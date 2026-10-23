from dataclasses import dataclass

from piel.profundidad import Profundidad
from piel.temperatura import Temperatura


@dataclass(frozen=True)
class ColorRopa:
    """Registro de nombre, temperatura y profundidad de un color de prenda.

    Solo almacena metadatos; AnalizadorColor calcula la puntuación.
    """

    # ------------------------------------------------------------------
    # Etiqueta visible y metadatos cromáticos de la prenda
    # ------------------------------------------------------------------
    nombre: str
    temperatura: Temperatura
    profundidad: Profundidad
