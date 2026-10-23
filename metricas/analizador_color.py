from piel.contraste import Contraste
from piel.matiz_piel import MatizPiel
from piel.profundidad import Profundidad
from piel.temperatura import Temperatura
from ropa.color_ropa import ColorRopa
from .recomendacion import Recomendacion


class AnalizadorColor:
    """Puntúa armonía térmica y contraste aproximado, nunca como prohibición.

    Fórmula: temperatura aporta 0, 1 o 2 puntos; contraste aporta
    2 - |contraste_estimado - contraste_preferido|. Total: de 0 a 4.
    """

    # ------------------------------------------------------------------
    # Conversión ordinal de categorías a niveles de contraste
    # ------------------------------------------------------------------
    _ORDEN_PROFUNDIDAD = {
        Profundidad.CLARA: 0,
        Profundidad.MEDIA: 1,
        Profundidad.OSCURA: 2,
    }
    _ORDEN_CONTRASTE = {
        Contraste.BAJO: 0,
        Contraste.MEDIO: 1,
        Contraste.ALTO: 2,
    }
    _CONTRASTE_POR_DIFERENCIA = {
        0: Contraste.BAJO,
        1: Contraste.MEDIO,
        2: Contraste.ALTO,
    }

    def analizar(self, piel: MatizPiel, prenda: ColorRopa) -> Recomendacion:
        """Compara dos perfiles y devuelve puntuación, nivel y motivos."""
        puntuacion = 0
        motivos: list[str] = []

        # Temperaturas coincidentes suman más; neutros funcionan como puente.
        if piel.subtono == prenda.temperatura:
            puntuacion += 2
            motivos.append(
                f"La temperatura {prenda.temperatura.value} acompaña "
                f"el subtono {piel.subtono.value}."
            )
        elif (
            piel.subtono == Temperatura.NEUTRA
            or prenda.temperatura == Temperatura.NEUTRA
        ):
            puntuacion += 1
            motivos.append("El matiz neutro puede servir de puente.")
        else:
            motivos.append(
                "La temperatura contrasta con el subtono; puede ser una "
                "eleccion intencional, aunque no es la mas armonica segun "
                "este criterio."
            )

        # La distancia entre profundidades aproxima el contraste del conjunto.
        diferencia = abs(
            self._ORDEN_PROFUNDIDAD[piel.profundidad]
            - self._ORDEN_PROFUNDIDAD[prenda.profundidad]
        )
        contraste_estimado = self._CONTRASTE_POR_DIFERENCIA[diferencia]
        ajuste_contraste = abs(
            self._ORDEN_CONTRASTE[contraste_estimado]
            - self._ORDEN_CONTRASTE[piel.contraste_preferido]
        )
        puntuacion += 2 - ajuste_contraste
        motivos.append(
            f"El contraste estimado es {contraste_estimado.value}; "
            f"la preferencia indicada es {piel.contraste_preferido.value}."
        )

        if puntuacion == 4:
            nivel = "Muy alineada con los criterios estimados"
        elif puntuacion == 3:
            nivel = "Buena opcion para probar"
        elif puntuacion == 2:
            nivel = "Depende del efecto buscado"
        else:
            nivel = "Menos alineada con los criterios estimados"

        return Recomendacion(
            puntuacion=puntuacion,
            nivel=nivel,
            motivos=tuple(motivos),
            nota=(
                "Es una orientacion, no una prohibicion. Prueba el color "
                "cerca del rostro con luz natural."
            ),
        )
