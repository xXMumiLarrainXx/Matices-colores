from enum import Enum


class Contraste(str, Enum):
    """Preferencia ordinal de contraste; no mide una foto por sí sola."""

    # ------------------------------------------------------------------
    # Preferencia declarada o valor por defecto de la aplicación
    # ------------------------------------------------------------------
    BAJO = "bajo"
    MEDIO = "medio"
    ALTO = "alto"
