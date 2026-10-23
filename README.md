# Asesor orientativo de color de ropa

Interfaz web local para Chrome que estima subtono y profundidad desde un
retrato, recomienda colores y permite armar conjuntos con productos públicos
de Falabella Chile. El maniquí es una representación ilustrada orientativa;
al analizar la fotografía, la ilustración se recorta con rembg, se refuerza
como dibujo a lápiz y recibe una aguada de acuarela basada en el tono mediano
de las mejillas. Las prendas recortadas se superponen en sus zonas. La prueba
virtual funciona sin depender de un modelo externo: usa una composición local
como respaldo y, si configuras Gemini de Google AI Studio, puede usar edición
generativa para un resultado más realista al agregar prendas.

## Preparación y ejecución

Se requiere Python 3.9 o posterior y conexión a Internet. En la carpeta del
proyecto, crea un entorno e instala las dependencias:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python3 app.py
```

Abre `http://127.0.0.1:8000` en Chrome. Para detener el servidor, vuelve a la
terminal y presiona `Ctrl+C`.

La primera vez que el servidor prepara un maniquí, rembg descarga su modelo
U2Net para CPU y crea las ilustraciones transparentes y máscaras de acuarela
en `web/assets/`. Puede tardar y requiere conexión; el modelo se conserva en
la caché local. El procesamiento del maniquí y la detección del tono de piel
son locales: la fotografía personal no se envía a rembg ni se usa para quitar
fondos. Se fija `rembg[cpu]` en 2.0.60 para mantener compatibilidad con Python
3.9.

### Configurar Google AI Studio

La prueba virtual puede usar Gemini API y el modelo de imagen
`gemini-nano-banana-2.1`. Crea una clave en
[Google AI Studio](https://aistudio.google.com/apikey). Para iniciar y escribir
la clave en el cuadro seguro de macOS:

```bash
./"Iniciar Matices.command"
```

La app carga la clave desde `.env` al iniciar; el archivo está excluido del
control de versiones. La clave se usa solo en el servidor local y no se expone
al navegador. El cuadro del iniciador conserva la clave solo para ese proceso.
Para ejecuciones directas, también puedes configurar `GEMINI_API_KEY` en el
entorno o en `.env`; no subas ni compartas ese archivo. Consulta la
[documentación de Gemini para generar y editar imágenes](https://ai.google.dev/gemini-api/docs/image-generation)
y los [precios](https://ai.google.dev/gemini-api/docs/pricing) antes de usarla.
La fotografía y las imágenes de las prendas se envían a Google para cada
generación. La edición generativa puede cambiar detalles de la cara, el cuerpo
o la ropa y no ofrece ajuste preciso ni es un modelo especializado de virtual
try-on.

En macOS puedes iniciar la app con **Iniciar Matices.command**; el iniciador
solicita la clave en un cuadro de diálogo seguro. También puedes iniciar
directamente con `python3 app.py` si `GEMINI_API_KEY` está en `.env` o en el
entorno. Sin clave, la app sigue funcionando y usa un modo local: descarga las
imágenes de Falabella, elimina el fondo claro típico del catálogo y compone las
prendas sobre la fotografía. Es una referencia visual aproximada, no un modelo
especializado de ajuste de ropa.

### Limpiar los maniquíes con PhotoRoom

El script opcional de PhotoRoom puede generar versiones alternativas con el
fondo eliminado. El flujo normal de la app no llama a PhotoRoom: usa rembg local
para procesar el maniquí y aplica el tono de piel detectado con una máscara de
acuarela.

Para procesar las imágenes una sola vez, configura la clave de PhotoRoom en
`PHOTOROOM_API_KEY` en la terminal (no la guardes en el código) y ejecuta:

```bash
python3 scripts/process_mannequins_photoroom.py
```

El script guarda los PNG nuevos en `web/assets/` para uso o inspección manual.
Las claves sandbox permiten probar sin coste, pero PhotoRoom puede añadir una
marca de agua a las imágenes procesadas.

## Armar y comparar conjuntos

1. Selecciona una foto JPG, PNG o WEBP, o tómala desde la cámara.
2. Pulsa **Analizar mi paleta**. El botón **Conjuntos guardados** abre, junto
   a la lectura de color, los conjuntos que guardaste previamente con
   **Guardar conjunto**; puedes cerrarlo con la **×**.
3. Elige categoría superior o inferior. En los filtros laterales, selecciona
   género y tipo de prenda; la talla verificada comienza en **Todos** y puedes
   elegir una talla concreta para acotar los resultados. El color se elige
   debajo. **Todos** incluye todas las tallas. **Todos** en tipo de prenda busca ropa de la
   categoría seleccionada y excluye accesorios y ropa interior. Los resultados
   se actualizan automáticamente al cambiar los filtros, sin botón de búsqueda.
   El género seleccionado se incluye en la consulta; se descartan prendas
   identificadas explícitamente como del género contrario o como infantiles,
   mientras se conservan los resultados cuyo nombre no especifica género.
   También se aceptan prendas unisex.
   Las prendas agregadas de otro género se quitan del conjunto al cambiar el
   filtro.
   **Todos los colores** despliega la paleta completa; al elegir un tono, los
   resultados se filtran por ese color. El botón cambia a **Colores
   recomendados** para volver a las sugerencias y cerrar la paleta completa.
   Los colores sin productos comprables para el género, tipo y talla elegidos
   aparecen en gris y no se pueden seleccionar.
   Se muestran todos los productos comprables que devuelve la búsqueda pública
   de Falabella para cada término consultado, con tallas verificadas.
   Cada producto indica cuántas tallas tiene disponibles; Falabella no publica
   el número de unidades de cada talla.
4. Pulsa **Agregar al conjunto** en los productos elegidos. Si la talla global
   está en **Todos**, elige una talla disponible en la tarjeta antes de agregar.
   La imagen de cada prenda seleccionada se segmenta para mostrar solo la ropa
   en la zona correspondiente del maniquí. El recorte conserva su transparencia,
   se ajusta al torso o las piernas y se mezcla con la ilustración a lápiz para
   integrar sus trazos con la prenda. Si Gemini está configurado, el maniquí conserva la guía de color y evita
   cargar otro modelo de IA mientras se genera la prueba virtual. Si Gemini no
   está disponible, el recorte ilustrativo ocurre en el navegador con un modelo
   descargado desde Hugging Face; las fotos no se envían a ese servicio. La
   primera carga puede tardar unos segundos.
   Si no se identifica la categoría de ropa, la app informa del error y no
   muestra la foto completa. Si una foto de variante falla, se intenta la imagen
   principal del producto. El recorte automático puede equivocarse en algunas
   poses; revisa la silueta resultante antes de usarla como referencia.
   El tono mediano de las mejillas detectado en **Tu fotografía** colorea con
   una aguada de acuarela las zonas claras del dibujo del maniquí, sin cambiar
   la fotografía ni enviarla a rembg. El panel de conjunto
   muestra el precio de cada prenda y el total estimado; puedes guardar el
   conjunto en este navegador y comparar dos conjuntos guardados.
   El conjunto admite una prenda por categoría; una prenda enteriza (vestido o
   body) reemplaza las demás prendas y las superiores/inferiores reemplazan otra
   de su misma categoría.
   Para prendas superiores se pueden filtrar las tallas XS, S, M, L, XL y XXL.
   Para prendas inferiores, se pueden filtrar las tallas 38 (XS), 40 (XS/S),
   42 (S), 44 (M), 46 (M/L), 48 (L), 50 (XL), 52 (XL/XXL) y 54 (XXL). El
   selector indica cuántos productos tienen cada talla verificada disponible y
   deshabilita en gris las tallas sin disponibilidad. Las tarjetas detallan la
   disponibilidad de cada talla. Falabella publica si una variante es
   comprable, pero no el número de unidades; la interfaz lo indica y no inventa
   cantidades. Si no hay coincidencias, se informa que no hay productos
   disponibles para esos filtros.
5. Al agregar una prenda con una foto cargada, la vista virtual se genera
   automáticamente. Con una clave válida usa la edición de imágenes de Gemini;
   sin clave usa la composición local y mantiene la fotografía en este equipo.
   Cambiar o quitar prendas vuelve a generar la vista con el conjunto actualizado. La
   solicitud empieza después de una breve pausa para agrupar cambios; si ya
   hay una solicitud en curso, se espera a que termine antes de enviar la
   actualización más reciente, y se descartan los resultados obsoletos. Con
   Gemini puede haber costo según el modelo y los precios vigentes de Google;
   el modo local no tiene ese costo ni envía la fotografía fuera del equipo.
   El resultado puede guardarse junto al conjunto.
   Configura `GEMINI_API_KEY` en `.env` si quieres usar Gemini. La app
   intenta primero la foto de la variante elegida y usa la imagen principal del
   producto como respaldo si Falabella no entrega la primera. Antes de cada
   paso, reduce las imágenes de persona y prenda para que no superen 1024 × 768
   px y las comprime como JPEG de 2 MB como máximo. Reduce la calidad y, si es
   necesario,    la resolución hasta cumplir el límite de tamaño. Gemini devuelve
   la imagen editada en la respuesta.

Las explicaciones breves se muestran como un signo **?**. Mantén el puntero
encima durante un segundo para ver el detalle; también se pueden abrir con
teclado.

La búsqueda de Falabella no necesita API key. El servidor local consulta la
página pública de búsqueda de Falabella y lee su metadata JSON-LD de productos;
también lee las variantes publicadas en la página para validar tallas
comprables. No usa el endpoint SellerCenter, que requiere una firma. El género
seleccionado determina la ilustración del maniquí; el tono de piel estimado
guía los colores recomendados y la acuarela del relleno.

La consulta se ejecuta automáticamente cuando se completan o cambian los
filtros y valida que los enlaces de producto e imágenes pertenezcan a dominios
de Falabella. Presenta todos los resultados de búsqueda que la página pública
devuelve para cada término; no recorre el catálogo completo ni garantiza
disponibilidad, precio o vendedor. Los precios pueden cambiar y el total suma
únicamente las prendas cuyo precio se pudo leer.

## Privacidad y límites

El análisis de piel se ejecuta en el navegador. La búsqueda de productos se
realiza automáticamente después de completar los filtros. La foto no se
transmite durante el análisis; cuando agregas prendas al conjunto, se envía
junto con sus imágenes a Gemini mediante el servidor local para la edición.
El uso de Gemini API puede tener costo según el modelo y la configuración.
Los conjuntos guardados se conservan en IndexedDB del navegador y contienen
nombres, enlaces, imágenes y precios; las pruebas virtuales guardadas incluyen
también la imagen generada.

La foto recomendada es frontal, nítida y con luz uniforme. Iluminación,
cámara, maquillaje y balance de blancos afectan la lectura. El análisis es
orientativo y no garantiza un tono exacto. El maniquí es ilustrativo; la
acuarela adapta aproximadamente el tono de piel detectado, pero no representa
con exactitud el color de la persona, el ajuste ni la talla. La
prueba virtual puede alterar detalles de la persona o la ropa y no representa
el ajuste real por talla; confirma disponibilidad y calce en la tienda.

## Clases, carpetas y métricas

### `piel/`

`Temperatura`, `Profundidad` y `Contraste` son categorías, no fórmulas.
`MatizPiel` reúne esas categorías en el perfil que se compara con la ropa.

### `ropa/`

`ColorRopa` conserva nombre, temperatura y profundidad. `PALETA_REFERENCIA`
es una lista de colores con etiquetas asignadas manualmente; no se mide una
tela física.

### `metricas/`

- `AnalizadorFotografia` es el analizador de la versión Python de consola.
  OpenCV localiza rostros con Haar Cascade y toma píxeles de regiones
  aproximadas de mejillas. Un filtro YCrCb retiene píxeles con luminancia
  25–250, Cr 125–185 y Cb 65–145; obtiene la mediana BGR y la convierte a
  CIELAB.
  - `L* = L_opencv × 100 / 255`; `L* >= 66` → clara, `< 48` → oscura; si no,
    media.
  - `calidez = b* - a*`; mayor que `4.5` → cálida, menor que `-4.5` → fría;
    entre ambos → neutra. En la codificación de OpenCV, a* y b* se centran
    restando 128.
  - Son umbrales heurísticos y dependen de la iluminación y la cámara.
- `ResultadoFotografia` conserva el perfil, conteos de rostros y píxeles, L*
  e índice de calidez; no los calcula.
- `AnalizadorColor` calcula la puntuación:
  - Temperatura `T`: 2 si coincide, 1 si uno de los colores es neutro, 0 si
    se oponen.
  - Convierte clara/media/oscura a `0/1/2` y calcula
    `D = abs(profundidad_piel - profundidad_prenda)`. `D=0/1/2` se interpreta
    como contraste bajo/medio/alto.
  - Contraste `C = 2 - abs(contraste_estimado - contraste_preferido)`.
  - Total `S = T + C`, de 0 a 4. Es una recomendación, no una prohibición.
- `Recomendacion` guarda y muestra la puntuación y sus motivos.

### `web/`

`app.js` no define clases; separa funciones para selección/captura de foto,
landmarks del rostro, muestreo de mejillas, conversión sRGB a CIELAB,
clasificación cromática, búsqueda de productos, maniquí ilustrado y guardado/
comparación local de conjuntos.

La web convierte RGB a CIELAB y calcula `calidez = b* - a*`: mayor que 7 →
cálida, menor que -7 → fría, en otro caso neutra. Usa `L* >= 68` para clara,
`L* < 47` para oscura y media en el intervalo. Estima el contraste como medio
y puntúa colores de forma parecida a `AnalizadorColor`. La interfaz explica
junto al resultado los valores `b* - a*` y `L*` medidos y los umbrales que
determinaron el subtono y la profundidad.

### Archivos raíz

- `app.py`: `AsesorRequestHandler` sirve la web, extrae resultados y variantes
  de las búsquedas públicas de Falabella y genera la prueba virtual local o con Gemini.
- `asesor_color_ropa.py`: `main()` inicia la alternativa Python de consola.
- `requirements.txt`: dependencias Python del servidor, análisis local y
  comunicación HTTP con Gemini API.
# Matices-colores
# Matrices-Colores
