# Actualización: 30 herramientas nuevas, 32 guías y portada de Herramientas con buscador

Este zip trae **solo lo nuevo y lo modificado** respecto a `trabajoyjuego-completo.zip` (50 juegos y 90 herramientas). Con esta actualización el sitio queda en **120 herramientas** y **32 guías**.

## Cómo instalarlo

1. Descomprime este zip **encima de tu carpeta actual**, de modo que `trabajoyjuego-v2/` se mezcle con la que ya tienes y acepta reemplazar los archivos que existan. Las rutas son las mismas que en el zip completo, así que no se pierde nada: lo que no viene aquí se queda como estaba.
2. Si tienes `vista-previa/` (el sitio ya construido para mirarlo), haz lo mismo: este zip la trae actualizada.
3. Abre `trabajoyjuego-v2` en VS Code y ejecuta `py sitio.py servir` (Windows) o `python3 sitio.py servir` (Mac y Linux). Las herramientas están en <http://localhost:8080/herramientas/> y las guías en <http://localhost:8080/recursos/>.

Si prefieres ver el resultado sin instalar nada, abre `vista-previa/herramientas/index.html` con *Live Server*. La carpeta `vista-previa/` no se sube al hosting.

## Qué hay de nuevo

### 1. Treinta herramientas (20 nuevas y las 10 «Utilidades» que estaban pendientes)

| Categoría | Herramientas |
|---|---|
| **Audio** (8) | Conversor de audio, Recortador de audio, Unir audios, Cambiar velocidad y volumen de audio, Extractor de audio de vídeo, Texto a voz, Afinador de guitarra online, Metrónomo online |
| **Texto** (4) | Humanizador de texto, Detector de patrones de IA en textos, Resumidor de texto, Conversor de números a letras |
| **Contraseñas y cuentas** (4) | Generador de contraseñas, Generador de frases de contraseña, Comprobador de fortaleza de contraseñas, Generador de nombres de usuario |
| **Azar y juegos de mesa** (5) | Generador de números aleatorios, Selector aleatorio de nombres, Generador de equipos aleatorios, Generador de sorteos, Lanzador de dados |
| **Utilidades** (5) | Bloc de notas online, Grabadora de voz, Test de mecanografía, Calculadora de la letra del DNI y NIE, Generador de enlaces de WhatsApp |
| **Imágenes, diseño e informática** (3) | Generador de códigos de barras, Generador de sombras CSS, Generador de etiquetas meta SEO |
| **Conversores** (1) | Conversor de números romanos |

Todas siguen las reglas del sitio: funcionan en el navegador, sin registro, sin subir archivos a ningún servidor y **sin guardar nada** (ni `localStorage`, ni cookies, ni caché).

Lo que conviene saber de las que tienen más miga:

- **Conversor de audio y herramientas de audio.** Leen casi cualquier formato que el navegador sepa abrir y guardan en **WAV, FLAC y Opus** (en un contenedor Ogg). **No hay salida MP3** (lee MP3, pero no lo crea: preferimos no ofrecer un codificador mediocre); la página y la guía lo explican y proponen la alternativa adecuada. Qué formatos se pueden *abrir* depende del navegador, y la salida en Opus depende de que el navegador incluya el codificador (la página lo avisa si no).
- **Extractor de audio de vídeo y Grabadora de voz.** El vídeo se procesa en tu equipo; la grabadora pide permiso al micrófono la primera vez y no guarda nada: lo grabado vive solo hasta que lo descargas o cierras la pestaña.
- **Texto a voz.** Usa las voces que ya tiene tu navegador o tu sistema. Con ellas se puede **escuchar**, pero los navegadores no permiten capturar ese audio, así que no se puede guardar como archivo.
- **Detector de patrones de IA.** Es un **analizador de patrones con avisos**: mide seis señales (frases de longitud muy uniforme, frases que empiezan igual, fórmulas típicas, conectores al abrir frase, vocabulario poco variado y secuencias de tres palabras repetidas) y enseña el número que ha medido en cada una. **No da un porcentaje de certeza y no sirve para acusar a nadie**: ningún detector es fiable en eso y la página lo advierte sin rodeos.
- **Humanizador de texto.** Es un **editor de estilo**: hace una limpieza mecánica de aperturas vacías, fórmulas largas y conectores repetidos, con tres niveles, y muestra una a una qué ha cambiado. No inventa sinónimos ni reescribe el texto. **No promete esquivar ningún detector.**
- **Generador de códigos de barras.** Crea EAN-13, EAN-8, UPC-A y Code 128 con dígito de control correcto y descarga en SVG o PNG. Un código válido no es un código *asignado*: en comercio, los números de producto los asigna GS1 (AECOC en España). La página lo explica.

### 2. Treinta y dos guías en Recursos (una por cada grupo de herramientas)

Cada una tiene entre 540 y 720 palabras, enlaza a todas las herramientas de su grupo y cruza con las guías vecinas. Entre las 32 cubren **las 120 herramientas, cada una exactamente una vez**.

| Categoría | Guías |
|---|---|
| PDF y documentos | Organizar un PDF · Convertir entre PDF, Word e imágenes · Reducir el peso de un PDF o una foto |
| Imágenes y diseño | Preparar una foto · Colores, degradados y sombras · Códigos QR y de barras |
| Audio y sonido | Editar y convertir audio · Música y voz en el navegador |
| Calculadoras | Qué calculadora usar para cada cuenta · Proporciones, fracciones y potencias |
| Finanzas y economía | Descuentos, IVA, propinas y gastos · Hipotecas y préstamos · Ahorro, inversión e inflación · Del sueldo bruto al neto y las vacaciones |
| Estudiantes y FP | Notas: media, ponderada y examen final · Asistencia y faltas del curso · Organizar el estudio y citar fuentes en APA |
| Fecha y organización | Fechas: edad, plazos y días laborables · Cronómetro, temporizador y cuenta atrás · Calendarios y planificador semanal |
| Conversores | Longitud, peso, volumen y superficie · Temperatura, presión, energía y datos · Números: romanos, letras, bases y DNI |
| Informática y programación | Antes de publicar tu web · Trabajar con JSON y CSV · Base64, hashes y UUID |
| Texto y escritura | Contar y medir un texto · Limpiar, ordenar y comparar textos · Escribir con IA con criterio · Notas, mecanografía y texto limpio |
| Generadores y utilidades | Contraseñas seguras y nombres de usuario · Sorteos, equipos, dados y números al azar |

### 3. Portada de Herramientas actualizada, con buscador

`/herramientas/` ahora tiene **buscador** (filtra por título y descripción mientras escribes, sin recargar) y las herramientas **agrupadas en 11 categorías** con su recuento. `/recursos/` funciona igual. Sin JavaScript se ve la lista completa agrupada.

La portada del sitio (`/`) también muestra los bloques «Herramientas por categoría» y «Recursos por categoría», y el recuento total sube solo.

Para que esto fuera posible se ha ampliado el motor con una opción nueva de `seccion.json`, **`agrupar`**: agrupa el listado por categoría. Está documentada en `docs/CARPETAS.md`. Cualquier otra sección puede activarla (`"agrupar": true`) sin tocar código.

### 4. Pruebas

- Nuevas pruebas de las librerías de cálculo (`test_azar_lib.py`, `test_barras_lib.py`, `test_estilo_lib.py`, `test_numeros_lib.py`, `test_palabras_lib.py`, `test_sonido_lib.py`). Los códigos de barras se contrastan con `reportlab` y OpenCV cuando están instalados.
- Pruebas en Chrome real para audio (`audio.mjs`, `audio-vivo.mjs`), utilidades, códigos de barras y sombras CSS, además de `humo.mjs`, que abre **las 120 herramientas** en móvil y escritorio.
- `python3 sitio.py probar --navegador` ahora también prueba el **sitio real** (herramientas y guías), no solo el de ejemplos.
- Sigue vigente la prueba que vigila que el sitio **no guarde nada** en el navegador.

## Límites que conviene tener presentes

- **Cifras orientativas.** Las calculadoras de sueldo neto, IVA, vacaciones e hipotecas dan estimaciones con los criterios que explica cada página; no sustituyen a una nómina, a una gestoría ni al banco.
- **Faltas de FP:** el cálculo sigue la normativa de **Andalucía**; en otra comunidad los límites pueden ser distintos.
- **Audio:** sin MP3 de salida; formatos de entrada y Opus según el navegador; el texto a voz no se puede guardar como archivo.
- **IA:** el detector muestra señales, no pruebas, y el humanizador no garantiza nada frente a ningún detector.
- `config/titular.json` sigue **vacío**: las páginas legales no se pueden dar por válidas hasta que pongas tus datos (ver `docs/LEGAL-PENDIENTE.md`).
- El sitio sigue en **modo preproducción**: pasos para publicarlo en `docs/PUBLICAR.md`.

## Qué archivos incluye este zip

- **Nuevos:** las 30 carpetas de `herramientas/<slug>/`, las 32 guías de `recursos/<slug>/`, siete librerías en `herramientas/datos/lib/`, las pruebas nuevas y `docs/HERRAMIENTAS.md`, que describe todo lo anterior con enlaces.
- **Modificados:** `LEEME.md`, `INSTALACION-JUEGOS.md`, `docs/CARPETAS.md`, `docs/PENDIENTES.md`, `docs/PUBLICAR.md`, `docs/LEGAL-PENDIENTE.md`, el motor (`motor/secciones.py`, `motor/paginas.py`), el filtro compartido (`comun/filtro/filtro.js`), la portada y los estilos de Herramientas y de Recursos, `herramientas/utilidades.js` y las pruebas (`pruebas/todo.py`, `pruebas/ejemplos.py`, `pruebas/cdp.mjs`, `pruebas/herramientas/casos.json`).
