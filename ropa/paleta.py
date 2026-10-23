from piel.profundidad import Profundidad
from piel.temperatura import Temperatura
from .color_ropa import ColorRopa


# ----------------------------------------------------------------------
# Paleta de referencia: etiquetas manuales, no colores medidos de tela
# ----------------------------------------------------------------------
PALETA_REFERENCIA = (
    ColorRopa("terracota", Temperatura.CALIDA, Profundidad.MEDIA),
    ColorRopa("coral", Temperatura.CALIDA, Profundidad.CLARA),
    ColorRopa("mostaza", Temperatura.CALIDA, Profundidad.MEDIA),
    ColorRopa("camel", Temperatura.CALIDA, Profundidad.MEDIA),
    ColorRopa("verde oliva", Temperatura.CALIDA, Profundidad.OSCURA),
    ColorRopa("chocolate", Temperatura.CALIDA, Profundidad.OSCURA),
    ColorRopa("lavanda", Temperatura.FRIA, Profundidad.CLARA),
    ColorRopa("azul royal", Temperatura.FRIA, Profundidad.MEDIA),
    ColorRopa("azul marino", Temperatura.FRIA, Profundidad.OSCURA),
    ColorRopa("fucsia", Temperatura.FRIA, Profundidad.MEDIA),
    ColorRopa("verde esmeralda", Temperatura.FRIA, Profundidad.MEDIA),
    ColorRopa("ciruela", Temperatura.FRIA, Profundidad.OSCURA),
    ColorRopa("marfil", Temperatura.NEUTRA, Profundidad.CLARA),
    ColorRopa("gris perla", Temperatura.NEUTRA, Profundidad.CLARA),
    ColorRopa("taupe", Temperatura.NEUTRA, Profundidad.MEDIA),
    ColorRopa("gris carbon", Temperatura.NEUTRA, Profundidad.OSCURA),
    ColorRopa("negro", Temperatura.NEUTRA, Profundidad.OSCURA),
)
