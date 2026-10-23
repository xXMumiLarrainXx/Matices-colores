"""Analiza una fotografia local y recomienda colores de ropa orientativos."""

import argparse

from metricas.analisis_fotografia import AnalizadorFotografia
from metricas.analizador_color import AnalizadorColor
from ropa.paleta import PALETA_REFERENCIA


def main() -> None:
    """Coordina entrada de consola, análisis fotográfico y recomendaciones."""
    parser = argparse.ArgumentParser(
        description="Sugiere colores de ropa a partir de una fotografia."
    )
    parser.add_argument(
        "fotografia",
        nargs="?",
        help="ruta a una fotografia JPG o PNG (si se omite, se solicitara)",
    )
    argumentos = parser.parse_args()
    ruta_fotografia = argumentos.fotografia or input(
        "Ruta de la fotografia JPG o PNG: "
    ).strip().strip('"')

    try:
        resultado = AnalizadorFotografia().analizar(ruta_fotografia)
    except (FileNotFoundError, ValueError, RuntimeError) as error:
        raise SystemExit(f"No se pudo completar el analisis: {error}") from error

    piel = resultado.matiz_piel
    print("\nAnalisis orientativo de la fotografia")
    print(f"Subtono estimado: {piel.subtono.value}")
    print(f"Profundidad estimada: {piel.profundidad.value}")
    print(f"Rostros detectados: {resultado.rostros_detectados}")
    if resultado.rostros_detectados > 1:
        print("Se analizo el rostro de mayor tamaño en la imagen.")
    print(f"Pixeles de mejillas analizados: {resultado.pixeles_analizados}")

    analizador = AnalizadorColor()
    recomendaciones = sorted(
        (
            (analizador.analizar(piel, prenda), prenda)
            for prenda in PALETA_REFERENCIA
        ),
        key=lambda elemento: elemento[0].puntuacion,
        reverse=True,
    )
    print("\nColores sugeridos para probar:")
    for recomendacion, prenda in recomendaciones[:5]:
        print(
            f"- {prenda.nombre}: {recomendacion.nivel} "
            f"({recomendacion.puntuacion}/4)"
        )
        for motivo in recomendacion.motivos:
            print(f"  - {motivo}")
    print(
        "\nLa fotografia se procesa localmente; el programa no la sube ni "
        "guarda una copia. El resultado es orientativo: la iluminacion, "
        "la camara, el maquillaje y la pantalla pueden cambiar los colores. "
        "Prueba las prendas con luz natural."
    )


if __name__ == "__main__":
    main()
