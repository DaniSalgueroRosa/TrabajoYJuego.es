# Herramientas y guías

La sección `herramientas/` tiene **164 herramientas** y la sección `recursos/` **39 guías**, una por cada grupo de herramientas relacionadas. Todo funciona en el navegador, sin registro y sin enviar nada a ningún servidor: **no se guarda nada** (ni `localStorage`, ni cookies, ni caché; una prueba automática lo vigila).

## Cómo está hecha una herramienta

Es una carpeta como cualquier otro elemento (`ficha.json`, `pagina.html`, `app.js`, `app.css`; ver `CARPETAS.md`). Lo que hace especial a esta sección:

- **Texto SEO en la propia página**: al menos 220 palabras, cuatro `<h2>` (uno de ellos «Preguntas frecuentes» con `<details>`), `<noscript>` y sin frases largas repetidas entre páginas. `comprobar` lo revisa.
- **Utilidades compartidas** en `comun`: el objeto `TH` (filas de resultados, editor de texto con opciones, copiar, descargar, dibujar en lienzo, azar criptográfico…). El código de cada herramienta se envuelve en `TH.alCargar(function (raiz) { … })`.
- **Librerías propias** en `herramientas/datos/lib/` (se publican tal cual y se cargan con `TH.script('lib/<nombre>.js')`). Las piezas de terceros (JSZip, pdf-lib y pdf.js, para Word y PDF, con sus licencias en `LICENCIAS.txt`) están en `herramientas/datos/vendor/`. Las librerías de cálculo funcionan en Node y en el navegador y tienen su prueba en Python. Las de esta entrega: `sinonimos.js` (diccionario propio de sinónimos y antónimos), `diferencias.js` (comparación de textos por líneas y palabras, usada por el comparador de PDF), `excel.js` (CSV → libro .xlsx), `horario.js` (rejilla del horario semanal) y `diagrama.js` (lectura del texto, disposición por capas y SVG de los diagramas de flujo).

| Librería | Para qué | Prueba |
|---|---|---|
| `azar.js` | Azar criptográfico sin sesgo (números, sorteos, equipos, dados) | `test_azar_lib.py` |
| `barras.js` | Códigos EAN-13, EAN-8, UPC-A y Code 128 (SVG y lienzo) | `test_barras_lib.py` (contrasta con reportlab y OpenCV) |
| `calendario.js` | Calendarios, semanas ISO, festivos nacionales, Pascua | `test_calendario.py` |
| `color.js` | HEX, RGB, HSL, CMYK, contraste WCAG y nombre CSS más cercano | `imagenes-color-qr.mjs` |
| `documentos.js` | Leer y escribir Word (.docx) y OpenDocument (.odt) y dibujar texto en PDF | `pdf.mjs` |
| `imagenes.js` | Abrir, escalar, exportar (PNG, JPG, WebP, BMP) y crear `.ico` | `imagenes-archivos.mjs`, `imagenes-editores.mjs` |
| `estilo.js` | Humanizador y analizador de patrones de texto | `test_estilo_lib.py` |
| `hash.js` | MD5, SHA-1, SHA-2 y UUID | `test_hash_lib.py` |
| `json.js` | Validación y formateo estricto de JSON, CSV | `test_json_lib.py` |
| `minificar.js` | Minificador de HTML, CSS y JavaScript | `test_minificar_lib.py` |
| `negocio.js` | Préstamos (cuota, cuadro con carencia, TAE), precio ideal, amortización de equipos, jubilación, alquiler o compra, comisiones de cobro, rentabilidad de Amazon y de Etsy | `test_negocio_lib.py` (simulaciones mes a mes y TAE por otro método), `casos.json` en Chrome |
| `numeros.js` | Números romanos, números a letras, bases, letra del DNI | `test_numeros_lib.py` |
| `palabras-es.js` | Listas de palabras en español (frases de contraseña, nombres de usuario) | `test_palabras_lib.py` |
| `qr.js` | Códigos QR | `test_qr_codificador.py` |
| `sonido.js` | Decodificar, mezclar, remuestrear y codificar WAV, FLAC y Opus | `test_sonido_lib.py`, `audio.mjs`, `audio-vivo.mjs` |
| `pistas.js` | Abrir audio (o el de un vídeo), dibujar la onda, reproducir un tramo y guardar en WAV, FLAC u Opus | `audio.mjs`, `audio-vivo.mjs` |

## Las herramientas, por categoría

### PDF y documentos (11)

[PDF a Word](../herramientas/pdf-a-word/), [Word a PDF](../herramientas/word-a-pdf/), [Unir PDF](../herramientas/unir-pdf/), [Dividir PDF](../herramientas/dividir-pdf/), [Comprimir PDF](../herramientas/comprimir-pdf/), [PDF a JPG/PNG](../herramientas/pdf-a-jpg-png/), [JPG/PNG a PDF](../herramientas/jpg-png-a-pdf/), [Girar PDF](../herramientas/girar-pdf/), [Eliminar páginas de PDF](../herramientas/eliminar-paginas-de-pdf/), [Extraer páginas de PDF](../herramientas/extraer-paginas-de-pdf/), [Comparador de documentos PDF](../herramientas/comparador-de-pdf/).

### Calculadoras (10)

[Calculadora básica](../herramientas/calculadora-basica/), [Calculadora científica](../herramientas/calculadora-cientifica/), [Calculadora de porcentajes](../herramientas/calculadora-de-porcentajes/), [Calculadora de descuentos](../herramientas/calculadora-de-descuentos/), [Calculadora de IVA](../herramientas/calculadora-de-iva/), [Calculadora de regla de tres](../herramientas/calculadora-de-regla-de-tres/), [Calculadora de fracciones](../herramientas/calculadora-de-fracciones/), [Calculadora de potencias y raíces](../herramientas/calculadora-de-potencias-y-raices/), [Calculadora de proporciones](../herramientas/calculadora-de-proporciones/), [Calculadora de redondeo](../herramientas/calculadora-de-redondeo/).

### Estudiantes y FP (10)

[Calculadora de faltas de FP](../herramientas/calculadora-de-faltas-de-fp/), [Calculadora de notas](../herramientas/calculadora-de-notas/), [Calculadora de nota necesaria](../herramientas/calculadora-de-nota-necesaria/), [Calculadora de media ponderada](../herramientas/calculadora-de-media-ponderada/), [Calculadora de nota final](../herramientas/calculadora-de-nota-final/), [Calculadora de asistencia](../herramientas/calculadora-de-asistencia/), [Calculadora de horas lectivas](../herramientas/calculadora-de-horas-lectivas/), [Generador de horarios de estudio](../herramientas/generador-de-horarios-de-estudio/), [Temporizador Pomodoro](../herramientas/temporizador-pomodoro/), [Generador de citas APA](../herramientas/generador-de-citas-apa/).

### Conversores (11)

[Conversor de almacenamiento digital](../herramientas/conversor-de-almacenamiento-digital/), [Conversor de longitud](../herramientas/conversor-de-longitud/), [Conversor de peso y masa](../herramientas/conversor-de-peso-y-masa/), [Conversor de volumen](../herramientas/conversor-de-volumen/), [Conversor de temperatura](../herramientas/conversor-de-temperatura/), [Conversor de superficie](../herramientas/conversor-de-superficie/), [Conversor de tiempo](../herramientas/conversor-de-tiempo/), [Conversor de velocidad](../herramientas/conversor-de-velocidad/), [Conversor de presión](../herramientas/conversor-de-presion/), [Conversor de energía](../herramientas/conversor-de-energia/), [Conversor de números romanos](../herramientas/conversor-de-numeros-romanos/).

### Imágenes y diseño (13)

[Convertidor universal de imágenes](../herramientas/convertidor-universal-de-imagenes/), [Compresor de imágenes](../herramientas/compresor-de-imagenes/), [Redimensionador de imágenes](../herramientas/redimensionador-de-imagenes/), [Recortador de imágenes](../herramientas/recortador-de-imagenes/), [Rotador de imágenes](../herramientas/rotador-de-imagenes/), [Selector de colores](../herramientas/selector-de-colores/), [Generador de paletas de colores](../herramientas/generador-de-paletas-de-colores/), [Generador de degradados](../herramientas/generador-de-degradados/), [Generador de códigos QR](../herramientas/generador-de-codigos-qr/), [Generador de favicons](../herramientas/generador-de-favicons/), [Generador de códigos de barras](../herramientas/generador-de-codigos-de-barras/), [Generador de sombras CSS](../herramientas/generador-de-sombras-css/), [Generador de diagramas de flujo](../herramientas/generador-de-diagramas-de-flujo/).

### Audio y sonido (8)

[Conversor de audio](../herramientas/conversor-de-audio/), [Recortador de audio](../herramientas/recortador-de-audio/), [Unir audios](../herramientas/unir-audios/), [Cambiar velocidad y volumen de audio](../herramientas/cambiar-velocidad-y-volumen-de-audio/), [Extractor de audio de vídeo](../herramientas/extractor-de-audio-de-video/), [Metrónomo online](../herramientas/metronomo-online/), [Afinador de guitarra online](../herramientas/afinador-de-guitarra-online/), [Texto a voz](../herramientas/texto-a-voz/).

### Texto y escritura (15)

[Contador de palabras](../herramientas/contador-de-palabras/), [Contador de caracteres](../herramientas/contador-de-caracteres/), [Conversor de mayúsculas y minúsculas](../herramientas/conversor-de-mayusculas-y-minusculas/), [Corrector de espacios](../herramientas/corrector-de-espacios/), [Eliminador de líneas duplicadas](../herramientas/eliminador-de-lineas-duplicadas/), [Comparador de textos](../herramientas/comparador-de-textos/), [Ordenador de listas](../herramientas/ordenador-de-listas/), [Inversor de texto](../herramientas/inversor-de-texto/), [Generador Lorem Ipsum](../herramientas/generador-lorem-ipsum/), [Calculadora de tiempo de lectura](../herramientas/calculadora-de-tiempo-de-lectura/), [Humanizador de texto](../herramientas/humanizador-de-texto/), [Detector de patrones de IA en textos](../herramientas/detector-de-ia/), [Resumidor de texto](../herramientas/resumidor-de-texto/), [Conversor de números a letras](../herramientas/conversor-de-numeros-a-letras/), [Generador de sinónimos](../herramientas/generador-de-sinonimos/).

### Finanzas y economía (16)

[Calculadora de hipotecas](../herramientas/calculadora-de-hipotecas/), [Calculadora de préstamos](../herramientas/calculadora-de-prestamos/), [Calculadora de interés compuesto](../herramientas/calculadora-de-interes-compuesto/), [Calculadora de ahorro](../herramientas/calculadora-de-ahorro/), [Calculadora de sueldo bruto y neto](../herramientas/calculadora-de-sueldo-bruto-y-neto/), [Calculadora de nómina](../herramientas/calculadora-de-nomina/), [Calculadora de gastos compartidos](../herramientas/calculadora-de-gastos-compartidos/), [Calculadora de rentabilidad](../herramientas/calculadora-de-rentabilidad/), [Calculadora de inflación](../herramientas/calculadora-de-inflacion/), [Calculadora de propinas](../herramientas/calculadora-de-propinas/), [Comparador de préstamos](../herramientas/comparador-de-prestamos/), [Calculadora de patrimonio neto](../herramientas/calculadora-de-patrimonio-neto/), [Calculadora de endeudamiento](../herramientas/calculadora-de-endeudamiento/), [Calculadora de jubilación](../herramientas/calculadora-de-jubilacion/), [Calculadora de coste de un coche](../herramientas/calculadora-de-coste-de-un-coche/), [Calculadora de alquiler vs. compra](../herramientas/calculadora-de-alquiler-vs-compra/).

### Negocio y autónomos (18)

[Calculadora de precio de venta ideal](../herramientas/calculadora-de-precio-de-venta-ideal/), [Calculadora de margen de beneficio](../herramientas/calculadora-de-margen-de-beneficio/), [Calculadora de punto de equilibrio](../herramientas/calculadora-de-punto-de-equilibrio/), [Calculadora de beneficio neto](../herramientas/calculadora-de-beneficio-neto/), [Calculadora de costes fijos y variables](../herramientas/calculadora-de-costes-fijos-y-variables/), [Calculadora de sueldo necesario](../herramientas/calculadora-de-sueldo-necesario/), [Calculadora de flujo de caja](../herramientas/calculadora-de-flujo-de-caja/), [Calculadora de financiación empresarial](../herramientas/calculadora-de-financiacion-empresarial/), [Calculadora de amortización de equipos](../herramientas/calculadora-de-amortizacion-de-equipos/), [Calculadora de coste de contratar a un trabajador](../herramientas/calculadora-del-coste-de-contratar-a-un-trabajador/), [Calculadora de horas extraordinarias](../herramientas/calculadora-de-horas-extraordinarias/), [Calculadora de absentismo laboral](../herramientas/calculadora-de-absentismo-laboral/), [Calculadora de productividad](../herramientas/calculadora-de-productividad/), [Calculadora de coste de reuniones](../herramientas/calculadora-de-coste-de-reuniones/), [Calculadora de presupuestos por fases](../herramientas/calculadora-de-presupuestos-por-fases/), [Calculadora de vencimientos de facturas](../herramientas/calculadora-de-vencimientos-de-facturas/), [Calculadora de descuentos por pronto pago](../herramientas/calculadora-de-descuentos-por-pronto-pago/), [Calculadora de intereses de demora](../herramientas/calculadora-de-intereses-de-demora/).

### Venta online y publicidad (9)

[Calculadora de comisiones de PayPal](../herramientas/calculadora-de-comisiones-de-paypal/), [Calculadora de comisiones de Stripe](../herramientas/calculadora-de-comisiones-de-stripe/), [Calculadora de rentabilidad de Amazon](../herramientas/calculadora-de-rentabilidad-de-amazon/), [Calculadora de rentabilidad de Etsy](../herramientas/calculadora-de-rentabilidad-de-etsy/), [Calculadora de ROAS](../herramientas/calculadora-de-roas/), [Calculadora de coste por adquisición (CPA)](../herramientas/calculadora-de-coste-por-adquisicion/), [Calculadora de valor de vida del cliente (LTV)](../herramientas/calculadora-de-valor-de-vida-del-cliente/), [Calculadora de tasa de conversión](../herramientas/calculadora-de-tasa-de-conversion/), [Calculadora de gastos de envío](../herramientas/calculadora-de-gastos-de-envio/).

### Fecha y organización (11)

[Calculadora de edad](../herramientas/calculadora-de-edad/), [Calculadora de días entre fechas](../herramientas/calculadora-de-dias-entre-fechas/), [Calculadora de días laborables](../herramientas/calculadora-de-dias-laborables/), [Cuenta atrás online](../herramientas/cuenta-atras-online/), [Cronómetro online](../herramientas/cronometro-online/), [Temporizador online](../herramientas/temporizador-online/), [Generador de calendarios](../herramientas/generador-de-calendarios/), [Calculadora de semanas del año](../herramientas/calculadora-de-semanas-del-ano/), [Planificador semanal](../herramientas/planificador-semanal/), [Calculadora de vacaciones](../herramientas/calculadora-de-vacaciones/), [Generador de tablas de horarios](../herramientas/generador-de-tablas-de-horarios/).

### Informática y programación (12)

[Formateador JSON](../herramientas/formateador-json/), [Validador JSON](../herramientas/validador-json/), [Conversor JSON a CSV](../herramientas/conversor-json-a-csv/), [Conversor CSV a JSON](../herramientas/conversor-csv-a-json/), [Codificador y decodificador Base64](../herramientas/codificador-y-decodificador-base64/), [Generador UUID](../herramientas/generador-uuid/), [Generador de hashes](../herramientas/generador-de-hashes/), [Conversor de sistemas numéricos](../herramientas/conversor-de-sistemas-numericos/), [Minificador de HTML, CSS y JavaScript](../herramientas/minificador-de-html-css-y-javascript/), [Generador de código QR Wi-Fi](../herramientas/generador-de-codigo-qr-wifi/), [Generador de etiquetas meta SEO](../herramientas/generador-de-etiquetas-meta/), [Conversor de CSV a Excel](../herramientas/conversor-csv-a-excel/).

### Generadores y utilidades (14)

[Generador de contraseñas](../herramientas/generador-de-contrasenas/), [Comprobador de fortaleza de contraseñas](../herramientas/comprobador-de-fortaleza-de-contrasenas/), [Generador de números aleatorios](../herramientas/generador-de-numeros-aleatorios/), [Selector aleatorio de nombres](../herramientas/selector-aleatorio-de-nombres/), [Generador de sorteos](../herramientas/generador-de-sorteos/), [Lanzador de dados](../herramientas/lanzador-de-dados/), [Generador de equipos aleatorios](../herramientas/generador-de-equipos-aleatorios/), [Test de mecanografía](../herramientas/test-de-mecanografia/), [Grabadora de voz](../herramientas/grabadora-de-voz/), [Bloc de notas online](../herramientas/bloc-de-notas-online/), [Calculadora de la letra del DNI y NIE](../herramientas/calculadora-de-letra-del-dni/), [Generador de enlaces de WhatsApp](../herramientas/generador-de-enlaces-de-whatsapp/), [Generador de nombres de usuario](../herramientas/generador-de-nombres-de-usuario/), [Generador de frases de contraseña](../herramientas/generador-de-frases-de-contrasena/).

Los enlaces son relativos a la carpeta del proyecto y sirven para saber qué carpeta es cada herramienta (`herramientas/<slug>/`).

## Las guías (`recursos/`)

Cada guía explica cuándo usar un grupo de herramientas, en qué orden y qué errores evitar, y enlaza a todas las herramientas del grupo. Entre ellas se enlazan con rutas relativas (`../<slug>/`). La sección usa `buscador`, `agrupar` y `categorias` (trece, las mismas que `herramientas/`) y `ordenar_por: orden`.

| Nº | Guía | Categoría | Carpeta |
|---|---|---|---|
| 1 | Organizar un PDF: unir, dividir y girar | PDF y documentos | `recursos/organizar-un-pdf/` |
| 2 | Convertir entre PDF, Word e imágenes | PDF y documentos | `recursos/convertir-pdf-word-e-imagenes/` |
| 3 | Reducir el peso de un PDF o una foto | PDF y documentos | `recursos/reducir-el-peso-de-pdf-e-imagenes/` |
| 4 | Preparar una foto: girar, recortar, tamaño | Imágenes y diseño | `recursos/preparar-fotos-recortar-girar-y-cambiar-tamano/` |
| 5 | Colores, degradados y sombras para tu web | Imágenes y diseño | `recursos/colores-degradados-y-sombras/` |
| 6 | Códigos QR y de barras: cuál usar y cómo | Imágenes y diseño | `recursos/codigos-qr-y-de-barras/` |
| 7 | Antes de publicar tu web: icono, SEO y peso | Informática y programación | `recursos/antes-de-publicar-una-web/` |
| 8 | Editar y convertir audio paso a paso | Audio y sonido | `recursos/editar-y-convertir-audio/` |
| 9 | Música y voz: afinar, marcar pulso y grabar | Audio y sonido | `recursos/musica-y-voz-en-el-navegador/` |
| 10 | Qué calculadora usar para cada cuenta | Calculadoras | `recursos/que-calculadora-usar-para-cada-cuenta/` |
| 11 | Proporciones, fracciones y potencias | Calculadoras | `recursos/proporciones-fracciones-y-potencias/` |
| 12 | Descuentos, IVA, propinas y gastos | Finanzas y economía | `recursos/descuentos-iva-propinas-y-gastos-compartidos/` |
| 13 | Hipotecas y préstamos: cuánto cuestan | Finanzas y economía | `recursos/hipotecas-y-prestamos-cuanto-cuestan/` |
| 14 | Ahorro, inversión e inflación | Finanzas y economía | `recursos/ahorro-inversion-e-inflacion/` |
| 15 | Del sueldo bruto al neto y las vacaciones | Finanzas y economía | `recursos/del-sueldo-bruto-al-neto/` |
| 16 | Notas: media, ponderada y examen final | Estudiantes y FP | `recursos/notas-medias-ponderadas-y-examen-final/` |
| 17 | Asistencia y faltas: no te pases del límite | Estudiantes y FP | `recursos/asistencia-y-faltas-del-curso/` |
| 18 | Organizar el estudio y citar fuentes en APA | Estudiantes y FP | `recursos/organizar-el-estudio-y-citar-fuentes/` |
| 19 | Fechas: edad, plazos y días laborables | Fecha y organización | `recursos/fechas-edad-plazos-y-semanas/` |
| 20 | Cronómetro, temporizador y cuenta atrás | Fecha y organización | `recursos/cronometro-temporizador-y-cuenta-atras/` |
| 21 | Calendarios y planificador semanal | Fecha y organización | `recursos/calendarios-y-planificador-semanal/` |
| 22 | Longitud, peso, volumen y superficie | Conversores | `recursos/longitud-peso-volumen-y-superficie/` |
| 23 | Temperatura, presión, energía y datos | Conversores | `recursos/temperatura-velocidad-presion-energia-y-datos/` |
| 24 | Números: romanos, letras, bases y DNI | Conversores | `recursos/numeros-romanos-letras-bases-y-dni/` |
| 25 | Trabajar con JSON y CSV | Informática y programación | `recursos/trabajar-con-json-y-csv/` |
| 26 | Base64, hashes y UUID | Informática y programación | `recursos/base64-hashes-y-uuid/` |
| 27 | Contraseñas seguras y nombres de usuario | Generadores y utilidades | `recursos/contrasenas-seguras/` |
| 28 | Contar y medir un texto | Texto y escritura | `recursos/contar-palabras-y-caracteres/` |
| 29 | Limpiar, ordenar y comparar textos | Texto y escritura | `recursos/limpiar-ordenar-y-comparar-texto/` |
| 30 | Escribir con IA con criterio | Texto y escritura | `recursos/escribir-con-ia-con-criterio/` |
| 31 | Sorteos, equipos, dados y números al azar | Generadores y utilidades | `recursos/sorteos-equipos-dados-y-numeros-al-azar/` |
| 32 | Notas, mecanografía y texto limpio | Texto y escritura | `recursos/bloc-de-notas-mecanografia-y-texto-limpio/` |
| 33 | Precio, margen y punto de equilibrio | Negocio y autónomos | `recursos/precio-margen-y-punto-de-equilibrio/` |
| 34 | Sueldo, caja y financiación de un negocio | Negocio y autónomos | `recursos/sueldo-caja-y-financiacion-de-un-negocio/` |
| 35 | Vender online: comisiones y rentabilidad | Venta online y publicidad | `recursos/vender-online-comisiones-y-rentabilidad/` |
| 36 | Patrimonio, deudas y jubilación | Finanzas y economía | `recursos/patrimonio-deudas-y-jubilacion/` |
| 37 | Cuánto cuesta un cliente y cuánto vale | Venta online y publicidad | `recursos/cuanto-cuesta-un-cliente-y-cuanto-vale/` |
| 38 | Cuánto cuesta un trabajador y su tiempo | Negocio y autónomos | `recursos/cuanto-cuesta-un-trabajador-y-su-tiempo/` |
| 39 | Cobrar a tiempo: vencimientos y demora | Negocio y autónomos | `recursos/cobrar-a-tiempo-vencimientos-pronto-pago-y-demora/` |

Para añadir una guía nueva: copia `recursos/_plantilla/`, rellena `ficha.json` (incluida `categoria`) y `pagina.html` (sin `<h1>`: lo pone la plantilla) y enlaza las herramientas con `<a href="../../herramientas/<slug>/">`. `comprobar` avisa de enlaces rotos.

## Límites que conviene conocer

- **Audio**: se lee lo que el navegador sepa decodificar. Se guarda en WAV, FLAC, MP3 u Ogg Opus. El MP3 lo crea un codificador propio (`herramientas/datos/lib/mp3.js`, MPEG-1 Capa III de tasa constante, sin modelo psicoacústico; se carga solo cuando se elige MP3). Opus y la captura de voz dependen de las capacidades del navegador. El texto a voz **no puede guardar el audio** (el navegador no lo permite).
- **Humanizador de texto**: es un editor de estilo; no promete que el texto evite ningún detector.
- **Detector de IA**: es un **analizador de patrones**. Enseña seis señales medidas y **no da ningún porcentaje**; el propio texto de la página avisa de que no sirve para acusar a nadie.
- **Códigos de barras**: el formato y el dígito de control son correctos, pero para vender en tiendas los números los asigna GS1 (en España, AECOC).
- **Comisiones y tarifas de plataformas** (PayPal, Stripe, Amazon, Etsy): son las publicadas por cada empresa a noviembre de 2026 (PayPal España del 4 de noviembre, Stripe España, Amazon.es y Etsy) y **todas son editables** en la propia herramienta. La tarifa regulatoria operativa de Etsy en España no se ha podido confirmar en una fuente oficial: se ofrece como valor orientativo y se avisa en la página. En Amazon, las categorías con tramos de precio se eligen con la opción «escribo yo el %».
- **Calculadora de sueldo necesario y comparador de préstamos**: el sueldo necesario no calcula el bruto (para eso está la calculadora de sueldo bruto y neto); el comparador supone tipo fijo en todas las ofertas.
- **Cálculos con normativa** (nómina, IVA, vacaciones, faltas de FP de Andalucía): usan las cifras que indica cada página y son orientativos; las normas cambian y cada convenio o comunidad puede tener sus variantes.
- **Calculadora de faltas de FP**: solo Andalucía; las horas anuales se estiman con 32 semanas por curso.
