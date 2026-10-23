from dataclasses import dataclass

from ropa.color_ropa import ColorRopa


@dataclass(frozen=True)
class Recomendacion:
    """Presentación de la puntuación (0-4), la etiqueta y sus motivos.

    No calcula métricas: conserva el resultado generado por AnalizadorColor.
    """

    # ------------------------------------------------------------------
    # Métrica y etiqueta producidas por AnalizadorColor
    # ------------------------------------------------------------------
    puntuacion: int
    nivel: str

    # ------------------------------------------------------------------
    # Explicación para el cliente
    # ------------------------------------------------------------------
    motivos: tuple[str, ...]
    nota: str

    # ------------------------------------------------------------------
    # Presentación en la versión de consola
    # ------------------------------------------------------------------
    def mostrar(self, prenda: ColorRopa) -> None:
        print(f"\nPrenda: {prenda.nombre}")
        print(f"Orientacion: {self.nivel} ({self.puntuacion}/4)")
        for motivo in self.motivos:
            print(f"- {motivo}")
        print(f"Nota: {self.nota}")
