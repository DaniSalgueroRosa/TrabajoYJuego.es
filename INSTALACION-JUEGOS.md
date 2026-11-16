# Instalación de la ampliación: juegos, herramientas, apartado legal, portada actualizada y arquitectura modular

> Este documento nació con la ampliación de los 20 primeros juegos; los pasos de instalación y de prueba valen igual para el sitio completo (50 juegos, 120 herramientas, 32 guías). Las cifras de más abajo ("20 juegos") son las de aquel momento: el estado actual está en `LEEME.md` y en `ACTUALIZACION-30-HERRAMIENTAS.md`.

`juegos.zip` trae el sitio **completo y funcional**. Dentro hay dos carpetas:

| Carpeta | Qué es | Para qué sirve |
|---|---|---|
| `trabajoyjuego-v2/` | El **proyecto** (código, contenido y pruebas) | Es la que abres en VS Code y la que sigues editando |
| `vista-previa/` | El sitio **ya construido**, solo para mirarlo | Verlo sin instalar Python (con la extensión *Live Server*). **No se sube al hosting** |

## En 1 minuto

1. Descomprime `juegos.zip` en cualquier carpeta de tu ordenador (por ejemplo, Documentos).
2. En VS Code: *Archivo → Abrir carpeta…* y elige **`trabajoyjuego-v2`** (la que contiene `sitio.py`).
3. Abre la terminal de VS Code y escribe `py sitio.py servir` (Windows) o `python3 sitio.py servir` (Mac y Linux). Hace falta **Python 3.11 o superior**.
   También vale el doble clic en `ver-el-sitio.bat` (Windows) o `ver-el-sitio.command` (Mac; la primera vez, clic derecho → Abrir).
4. Se abre el navegador. Los juegos están en <http://localhost:8080/juegos/> (si el puerto 8080 está ocupado, la terminal te dice cuál usa).

Si no arranca, la tabla «Si no arranca» de `LEEME.md` cubre los casos habituales (Python antiguo, `python3` que no se reconoce en Windows, carpeta equivocada…).

---

## 1. Archivos añadidos (145)

Son los que **no existían** en la entrega anterior de la v2. Los juegos y las páginas legales van agrupados por carpeta.

- `(carpeta principal)` → `INSTALACION-JUEGOS.md`
- `comun/anuncio/` → `anuncio-elemento.html`, `anuncio-listado.html`, `anuncio.css`
- `comun/consentimiento/` → `consentimiento.js`
- `comun/filtro/` → `filtro.css`, `filtro.js`
- `config/` → `publicidad.json`, `titular.json`
- `docs/` → `JUEGOS.md`, `LEGAL-PENDIENTE.md`
- `juegos/` → `catalogo.css`, `componentes.css`, `juegos.js`, `rondas.js`, `utilidades.js`
- `juegos/2048/` → `app.css`, `app.js`, `ficha.json`, `pagina.html`
- `juegos/acertijos/` → `acertijos.json`, `app.css`, `app.js`, `ficha.json`, `pagina.html`
- `juegos/conexiones/` → `app.css`, `app.js`, `ficha.json`, `pagina.html`, `puzzles.json`
- `juegos/cultura-general/` → `app.js`, `ficha.json`, `pagina.html`, `preguntas.json`
- `juegos/datos/` → `palabras.json`
- `juegos/detecta-el-patron/` → `app.js`, `ficha.json`, `pagina.html`
- `juegos/donde-esta/` → `app.css`, `app.js`, `ficha.json`, `lugares.json`, `mapa.json`, `pagina.html`
- `juegos/el-impostor/` → `afirmaciones.json`, `app.js`, `ficha.json`, `pagina.html`
- `juegos/el-intruso/` → `app.js`, `conjuntos.json`, `ficha.json`, `pagina.html`
- `juegos/el-superviviente/` → `app.css`, `app.js`, `ficha.json`, `pagina.html`
- `juegos/mayor-menor/` → `app.js`, `datos.json`, `ficha.json`, `pagina.html`
- `juegos/memoria-visual/` → `app.css`, `app.js`, `ficha.json`, `pagina.html`
- `juegos/mente-matematica/` → `app.js`, `ficha.json`, `pagina.html`
- `juegos/ordena-la-historia/` → `app.css`, `app.js`, `cronologias.json`, `ficha.json`, `pagina.html`
- `juegos/palabra-infinita/` → `app.css`, `app.js`, `ficha.json`, `pagina.html`
- `juegos/palabras-encadenadas/` → `app.css`, `app.js`, `ficha.json`, `pagina.html`
- `juegos/que-palabra-soy/` → `app.js`, `ficha.json`, `pagina.html`, `palabras.json`
- `juegos/quien-soy/` → `app.css`, `app.js`, `ficha.json`, `pagina.html`, `personajes.json`
- `juegos/reflejos/` → `app.css`, `app.js`, `ficha.json`, `pagina.html`
- `juegos/una-entre-un-millon/` → `app.css`, `app.js`, `ficha.json`, `pagina.html`, `preguntas.json`
- `juegos/velocidad-mental/` → `app.js`, `ficha.json`, `pagina.html`
- `legal/` → `ficha.html`, `legal.css`, `listado.html`, `seccion.json`
- `legal/_partes/` → `enlaces.html`, `titular.html`
- `legal/_plantilla/` → `ficha.json`, `pagina.html`
- `legal/aviso-legal/` → `ficha.json`, `pagina.html`
- `legal/condiciones-de-uso/` → `ficha.json`, `pagina.html`
- `legal/contacto/` → `ficha.json`, `pagina.html`
- `legal/politica-de-cookies/` → `ficha.json`, `pagina.html`
- `legal/politica-de-privacidad/` → `ficha.json`, `pagina.html`
- `legal/publicidad-y-transparencia/` → `ficha.json`, `pagina.html`
- `motor/` → `legal.py`, `scripts.py`
- `portada/explorar/` → `explorar.css`, `explorar.html`
- `portada/informacion/` → `informacion.css`, `informacion.html`
- `pruebas/` → `contraste.mjs`, `legal.mjs`, `portada.mjs`, `test_contrato_ampliado.py`, `test_juegos_datos.py`, `test_legal.py`, `test_paquete.py`, `test_portada.py`
- `pruebas/juegos/` → `ayudas.mjs`, `conexiones.mjs`, `encadenadas-y-2048.mjs`, `humo.mjs`, `memoria-acertijos-historia-reflejos.mjs`, `palabra-infinita.mjs`, `rondas-1.mjs`, `rondas-2.mjs`, `superviviente-y-donde-esta.mjs`, `una-entre-un-millon.mjs`

Lo más importante:

- `juegos/<20 carpetas>/` → los 20 juegos. Cada uno es una carpeta autónoma (`ficha.json`, `pagina.html`, `app.js` y, si los tiene, sus datos en JSON).
- `juegos/utilidades.js`, `juegos/juegos.js`, `juegos/rondas.js`, `juegos/componentes.css`, `juegos/catalogo.css` → el código y el estilo **compartidos** por los 20 juegos.
- `juegos/datos/palabras.json` → la lista de palabras de los tres juegos de letras.
- `legal/` → la sección nueva con las seis páginas legales.
- `portada/explorar/` y `portada/informacion/` → las dos partes **nuevas de la portada**: el índice «Juegos por categoría» (los 20 juegos enlazados) y el bloque «Información y transparencia» (sin registro, partidas que no se guardan, estado de la publicidad y las seis páginas legales).
- `config/titular.json` y `config/publicidad.json` → **los dos archivos que rellenas tú** (apartados 7 y 8).
- `motor/legal.py` → lee esos dos archivos y decide qué se publica. `motor/scripts.py` → agrupa el JavaScript compartido de cada sección.
- `comun/filtro/` → el buscador y los botones de filtro por categoría de los listados.
- `comun/anuncio/` y `comun/consentimiento/` → los huecos reservados para anuncios y el botón de cambiar el consentimiento (no hacen nada mientras la publicidad esté desactivada).
- `docs/LEGAL-PENDIENTE.md`, `docs/JUEGOS.md`, este archivo → documentación.
- `pruebas/…` → las pruebas nuevas (datos de los juegos, legal, contrato de carpetas y las de navegador de cada juego).

## 2. Archivos modificados (27)

Existían ya y **cambian** respecto a la entrega anterior:

- `LEEME.md`
- `comun/base.css`
- `comun/cabeza.html`
- `comun/pie/pie.css`
- `comun/pie/pie.html`
- `comun/tarjeta/tarjeta.html`
- `docs/CARPETAS.md`
- `docs/PENDIENTES.md`
- `docs/PUBLICAR.md`
- `juegos/_plantilla/app.css`
- `juegos/_plantilla/app.js`
- `juegos/_plantilla/ficha.json`
- `juegos/_plantilla/pagina.html`
- `juegos/ficha.html`
- `juegos/listado.html`
- `juegos/seccion.json`
- `motor/comprobar.py`
- `motor/empaquetar.py`
- `motor/paginas.py`
- `motor/secciones.py`
- `portada/portada.css`
- `portada/portada.html`
- `pruebas/ejemplos.py`
- `pruebas/navegador.mjs`
- `pruebas/test_carpetas.py`
- `pruebas/todo.py`
- `sitio.py`

**No se ha borrado ningún archivo** (0 eliminados). Y **no cambia** `config/sitio.json`: si lo habías editado, tus ajustes siguen valiendo.

Qué cambia en los más relevantes:

| Archivo | Qué cambia |
|---|---|
| `motor/secciones.py` | Campos nuevos: en `seccion.json` (`categorias`, `buscador`, `accion`, `ubicacion`, `dinamico`, orden por número) y en `ficha.json` (`categoria`, `dificultad`, `duracion`, `orden`), todos validados con mensajes en español |
| `motor/paginas.py` | Carga los datos del titular y de la publicidad, copia `datos/`, agrupa los `.js` compartidos y crea `ads.txt` solo con publicidad activa |
| `motor/comprobar.py` | Avisa (y en producción **bloquea**) si quedan «[COMPLETAR POR EL TITULAR]» en las páginas legales |
| `motor/empaquetar.py`, `sitio.py` | La opción `paquete --vista-previa` que genera este zip |
| `comun/base.css`, `comun/cabeza.html` | Estilo de las marcas «por completar» y el único punto donde, **solo con la publicidad activa**, se carga el script de AdSense |
| `portada/portada.html`, `portada/portada.css` | Ensamblan las dos partes nuevas entre «Lo último» y el pie (el resto de la portada no cambia) |
| `motor/paginas.py` (portada) | Calcula el índice por categoría y desempata «Lo último» por el `orden` de la ficha (antes, por orden alfabético: con 20 juegos del mismo día enseñaba 2048, Acertijos, Conexiones…) |
| `comun/filtro/filtro.js` | Entiende `/juegos/?categoria=palabras`: el listado se abre ya filtrado desde la portada |
| `comun/pie/*`, `comun/tarjeta/tarjeta.html` | El pie con los enlaces legales y «Configurar cookies»; la tarjeta con categoría, dificultad, duración y botón «Jugar» |
| `juegos/seccion.json`, `listado.html`, `ficha.html` | Las 8 categorías, el buscador y los filtros, y la ficha de cada juego con su botón de volver |
| `juegos/_plantilla/*` | La plantilla para el juego número 21, ahora un juego de ejemplo que funciona |
| `docs/*`, `LEEME.md` | Documentación actualizada |
| `pruebas/*` | Ajustadas a lo anterior |

---

## 3. Dónde colocar o reemplazar cada archivo

No hay que colocar archivos uno a uno: **el zip es el proyecto entero** y se instala como una carpeta.

| Tu situación | Qué hacer |
|---|---|
| **No tenías la v2** | Descomprime y abre `trabajoyjuego-v2/` en VS Code. Ya está |
| **Ya tenías la v2 y no has tocado nada** | Renombra tu carpeta a `trabajoyjuego-v2-antigua`, descomprime el zip (crea una `trabajoyjuego-v2` nueva) y, cuando compruebes que va bien, borra la antigua |
| **Ya tenías la v2 y has añadido contenido** (herramientas, recursos o tests propios) | Igual que arriba y después **copia a la carpeta nueva** tus carpetas de contenido: lo que hayas metido en `herramientas/`, `recursos/` y `tests/` (cada subcarpeta con su `ficha.json`) y tu `config/sitio.json` si lo cambiaste |
| **Has editado a mano alguno de los 27 archivos modificados** | Guarda una copia de ese archivo **antes** y, después, vuelve a aplicar tus cambios a mano sobre el nuevo. Si lo descomprimes encima, se sobrescribe |

Atajo: descomprimir el zip **encima** de tu carpeta (aceptando «reemplazar») da el mismo resultado, porque no hay archivos que se borren. Pero si no estás seguro de lo que tenías, usa el método de renombrar: es el que no pierde nada.

Dos cosas que **no** vienen en el zip y que se generan solas: la carpeta `dist/` (se crea con `python3 sitio.py construir`) y las copias de `__pycache__`.

## 4. ¿Descomprimir en la raíz o copiar una carpeta?

- **No se descomprime «en la raíz» del hosting.** El zip es el proyecto de trabajo, no el sitio publicado. Lo que va al hosting es **el contenido de `dist/`** después de `python3 sitio.py construir` (y `python3 sitio.py comprobar` antes). Con `python3 sitio.py paquete --dist` te prepara un zip con exactamente eso.
- **Se descomprime en cualquier carpeta de tu ordenador** y se abre `trabajoyjuego-v2/` en VS Code.
- **No copies solo `juegos/` a tu proyecto antiguo**: los juegos dependen de cambios en el motor y en `comun/` (la tabla del apartado 2). Copiar solo esa carpeta daría errores. Reemplaza el proyecto entero.
- Cuidado con el doble nivel: algunos programas de Windows descomprimen en una carpeta con el nombre del zip y queda `juegos/trabajoyjuego-v2/…`. La carpeta que tienes que abrir en VS Code es **la que contiene `sitio.py`**, la de dentro.

## 5. Cómo se integra `juegos/`

Funciona con el mismo contrato de carpetas que el resto del sitio (detalle en `docs/CARPETAS.md`):

- **Cada juego es una subcarpeta de `juegos/` y se publica solo.** `juegos/reflejos/` aparece en `/juegos/reflejos/`, en el catálogo `/juegos/`, en el menú, en el índice por categoría de la portada (y en «Lo último» si es de los más recientes), en el `sitemap.xml` y con su marcado de buscadores. No se registra en ningún sitio: basta con que la carpeta tenga `ficha.json` con `"estado": "publicado"` y su `pagina.html`.
- **El orden del catálogo** lo da el campo `orden` de cada `ficha.json` (1 a 20, el de tu lista).
- **Las 8 categorías** (Palabras, Lógica, Cultura general, Matemáticas, Memoria, Geografía, Habilidad, Arcade) están declaradas en `juegos/seccion.json`. Cada juego elige una con `"categoria"`. Los botones de filtro solo muestran las categorías que tienen juegos.
- **Código compartido:** cualquier `.js` suelto dentro de `juegos/` (`utilidades.js`, `juegos.js`, `rondas.js`) se agrupa en un único archivo que se carga **antes** del `app.js` de cada juego; los `.css` sueltos (`juegos.css`, `componentes.css`, `catalogo.css`) también. Un juego solo escribe lo suyo.
- **Datos:** el JSON de un juego vive en su carpeta (por ejemplo `juegos/acertijos/acertijos.json`) y se copia tal cual. Lo común (la lista de palabras) está en `juegos/datos/`.
- **Sin persistencia:** ningún juego guarda nada (ni `localStorage`, ni `sessionStorage`, ni cookies, ni IndexedDB, ni cachés). Una prueba automática lo vigila.
- **Añadir el juego 21:** copia `juegos/_plantilla/` con otro nombre, cambia `ficha.json` y `"estado": "publicado"`. Pasos completos y cómo ampliar los datos de cada juego en `docs/JUEGOS.md`.

---

## 6. Cómo probar los 20 juegos

### 6.1 A mano, en el navegador (lo que más importa)

Con `python3 sitio.py servir` en marcha (se reconstruye solo cada vez que guardas):

0. **La portada**, <http://localhost:8080/>: tras «Lo último» debe verse el bloque **«Juegos por categoría»** con 8 categorías y los 20 juegos enlazados (pulsa el nombre de una categoría, por ejemplo «Palabras»: abre `/juegos/?categoria=palabras` ya filtrado, con 3 juegos), y después **«Información y transparencia»**: «Sin registro», «Tus partidas no se guardan», la frase de publicidad («Ahora mismo no muestra anuncios…» mientras `activa` sea `false`) y las seis páginas legales. Pruébala también a 375 px de ancho.
1. Abre <http://localhost:8080/juegos/>. Debe verse el texto de introducción, el buscador, el desplegable de dificultad y los botones de categoría con estos recuentos: **Todas 20 · Palabras 3 · Lógica 6 · Cultura general 3 · Matemáticas 2 · Memoria 1 · Geografía 2 · Habilidad 1 · Arcade 2**. Escribe «cultura» en el buscador y comprueba que quedan solo los que la mencionan.
2. Abre cada juego **por su dirección directa**, `http://localhost:8080/juegos/<carpeta>/`, y haz la prueba rápida de la tabla (1 o 2 minutos cada uno).
3. En **todos**: debe haber una pantalla de inicio con instrucciones y botón de empezar; al terminar, resultado con «jugar otra vez» (y «compartir» cuando tiene sentido); dos botones «Volver a todos los juegos» (arriba y abajo) que llevan a `/juegos/`; y si **recargas la página**, todo vuelve a empezar (no se guarda nada).
4. **Móvil y tablet sin móvil:** en Chrome o Edge, `F12` → icono de dispositivo (o `Ctrl+Mayús+M`) → elige 375 px de ancho. No debe haber barra de desplazamiento horizontal.
5. **Que no guarda nada:** `F12` → *Application* (Aplicación) → *Local storage*, *Session storage*, *Cookies* e *IndexedDB*: deben estar **vacíos** tras jugar.

| # | Dirección (`/juegos/…/`) | Prueba rápida |
|---|---|---|
| 1 | `palabra-infinita` | Elige 4, 5, 6 o 7 letras. Escribe una palabra y Intro: casillas verde / amarilla / gris, con teclado en pantalla y con el físico. Prueba una palabra inventada: avisa de que no está en la lista |
| 2 | `una-entre-un-millon` | 7 preguntas de «nombra un…» con 25 s. Una respuesta muy común puntúa poco, una rara puntúa mucho, una inventada 0; «Paso» suma 0. Final con nivel |
| 3 | `conexiones` | Elige 4 de las 16 palabras y «Comprobar». Acierto: el grupo se descubre. Fallo: pierdes una de las 4 vidas; con 3 de 4 bien avisa de que estás cerca |
| 4 | `que-palabra-soy` | 10 adivinanzas de 30 s. «Pista» te da la letra inicial y la longitud y baja la ronda a 60 puntos |
| 5 | `el-intruso` | 10 rondas de 15 s: pulsa (o teclas 1 a 4) la palabra que no encaja. Tras responder se explica qué tenían en común las otras tres |
| 6 | `mente-matematica` | 10 operaciones de 20 s. Escribe el resultado (los decimales valen con coma o con punto) |
| 7 | `quien-soy` | 8 rondas de 45 s. Escribe la respuesta o pide «Otra pista»: cada pista extra resta 20 puntos |
| 8 | `memoria-visual` | Se iluminan casillas; cuando se apagan, pulsa las que recuerdes. Tablero creciente, 3 vidas; al fallar enseña dónde estaban |
| 9 | `acertijos` | Dos modos: acertijo del día y sin fin. Un fallo resta 20, la pista 25, tres fallos muestran la solución |
| 10 | `mayor-menor` | «Más» o «menos» (o teclas 1 y 2) en 12 s; si aciertas, el dato nuevo es la referencia. 2 vidas |
| 11 | `cultura-general` | 10 preguntas con 4 opciones y 20 s (teclas 1 a 4). Tras cada una, una explicación breve |
| 12 | `donde-esta` | Clic o toque en el mapa; enseña el sitio real, los km y los puntos. Con teclado: Tab hasta el mapa, flechas (Mayús, más rápido) e Intro |
| 13 | `palabras-encadenadas` | El ordenador dice una palabra; tú una que empiece por su última letra (mínimo 3 letras, sin repetir). El tiempo baja |
| 14 | `velocidad-mental` | Un minuto y 3 vidas: «verdadero» (1) o «falso» (2) para cada operación ya resuelta |
| 15 | `detecta-el-patron` | 10 series de 25 s: elige la continuación entre 4 opciones (teclas 1 a 4) |
| 16 | `el-impostor` | 10 rondas de 25 s: tres afirmaciones verdaderas y una falsa; pulsa la falsa |
| 17 | `ordena-la-historia` | 6 rondas: ordena 5 hechos con los botones subir y bajar y pulsa «Comprobar»; verás el año de cada uno |
| 18 | `reflejos` | Pulsa el recuadro, espera a «¡Ya!» y púlsalo (ratón, toque, espacio o Intro). Pulsar antes de tiempo no cuenta. 5 intentos válidos |
| 19 | `2048` | Flechas, WASD, deslizar el dedo o los botones en pantalla. Las fichas iguales se fusionan |
| 20 | `el-superviviente` | Flechas o A y D, arrastrar o botones en pantalla para esquivar bloques y recoger estrellas. 3 vidas; se pausa si cambias de pestaña |

También las páginas legales: <http://localhost:8080/legal/> y, enlazadas desde el **pie de todas las páginas**: `/legal/aviso-legal/`, `/legal/politica-de-privacidad/`, `/legal/politica-de-cookies/`, `/legal/condiciones-de-uso/`, `/legal/publicidad-y-transparencia/` y `/legal/contacto/`.

### 6.2 Con las pruebas automáticas

Desde la carpeta `trabajoyjuego-v2/`:

| Comando | Qué hace | Requisitos |
|---|---|---|
| `python3 sitio.py probar` | Valida el motor, el contrato de carpetas, que todos los datos de los juegos están bien formados, los textos legales, el paquete… (183 pruebas, unos 5 segundos) | Solo Python 3.11+ |
| `python3 sitio.py probar --navegador` | Además **juega de verdad** los 20 juegos en un Chrome real en móvil, tablet y escritorio: sin errores de consola, sin desbordes, contraste, nada guardado, y partidas completas con 8 guiones de prueba que cubren los 20 juegos; también revisa la portada (índice por categoría, información legal, enlaces y filtro desde la portada) y las páginas legales (unos 6 minutos) | Chrome y Node 22 |
| `python3 sitio.py comprobar` | Revisa el sitio construido: enlaces, títulos, descripciones, `alt`, un solo `<h1>` por página y marcas «[COMPLETAR POR EL TITULAR]» | Solo Python 3.11+ |

Hoy, con el entorno en preproducción y los datos del titular vacíos, `comprobar` termina con **0 errores y 2 avisos**: «cambia el entorno a producción» y «completa los datos del titular». El segundo pasa a ser un **error** cuando el entorno es producción.

### 6.3 Sin Python

Abre la carpeta `vista-previa/` en VS Code, clic derecho en `index.html` → *Open with Live Server*. **No la abras con doble clic sobre `index.html`**: las direcciones son carpetas (`/juegos/`) y sin servidor el navegador no las resuelve.

### 6.4 Una limitación a tener en cuenta

El servidor local solo es accesible **desde el propio ordenador**. Para probar en un móvil real tienes que publicarlo en un hosting de pruebas. El modo dispositivo del navegador (6.1, punto 4) sirve para comprobar el diseño, pero no sustituye a un móvil de verdad.

---

## 7. Documentos legales que debe completar el titular

Las seis páginas legales están **escritas y publicadas con el sitio**, pero hay datos que solo tienes tú y que **no se han inventado**. Mientras falten, aparece **«[COMPLETAR POR EL TITULAR]»** resaltado en amarillo, y `python3 sitio.py comprobar` no te dejará publicar en producción.

**Todo se rellena en un solo archivo: `config/titular.json`.**

| Campo | ¿Obligatorio? | Qué poner |
|---|---|---|
| `nombre` | Sí | Tu nombre y apellidos, o la razón social si es una empresa |
| `nif` | Sí | NIF, NIE o CIF (la LSSI exige identificar al titular) |
| `domicilio` | Sí | Dirección postal completa o domicilio social |
| `email` | Sí | Un correo real que leas: es el **único** canal de contacto (no hay formulario) |
| `alojamiento` | Sí | Nombre de tu proveedor de hosting |
| `telefono` | No | Solo si quieres publicarlo; vacío = no aparece |
| `registro` | No | Registro Mercantil u otro, solo si estás inscrito; vacío = no aparece |

| Página | Dirección | Qué debes saber |
|---|---|---|
| Aviso legal | `/legal/aviso-legal/` | Usa nombre, NIF, domicilio, correo y (si los hay) teléfono y registro |
| Política de privacidad | `/legal/politica-de-privacidad/` | Usa nombre, domicilio, correo y alojamiento. Hoy dice que el sitio no guarda datos; si cambia, hay que actualizarla |
| Política de cookies | `/legal/politica-de-cookies/` | Con la publicidad desactivada explica que no hay cookies; activada, describe el consentimiento de Google y muestra «Cambiar mi consentimiento» |
| Condiciones de uso | `/legal/condiciones-de-uso/` | Reglas de uso y propiedad intelectual |
| Publicidad y transparencia | `/legal/publicidad-y-transparencia/` | Explica si hay anuncios y cómo se distinguen |
| Contacto | `/legal/contacto/` | Solo el correo |

Después de rellenar: `python3 sitio.py construir`, abre `/legal/aviso-legal/` y comprueba que no queda ningún «[COMPLETAR POR EL TITULAR]». Cada página tiene su «Última actualización» (campo `fecha` de su `ficha.json`).

**Los textos son una base honesta de lo que el sitio hace de verdad. No son asesoramiento jurídico.** Antes de publicar, que los revise quien lleve tu asesoría, sobre todo si vas a ingresar dinero con AdSense. Lista de revisión completa en `docs/LEGAL-PENDIENTE.md`.

## 8. Dónde poner el código de AdSense

**No pegues nada de AdSense en el HTML.** Todo va en **`config/publicidad.json`**; el sitio genera el resto solo.

```json
{
  "activa": true,
  "cliente": "ca-pub-0000000000000000",
  "bloques": { "listado": "0000000000", "juego": "0000000000" }
}
```

(Las cifras son de ejemplo. Usa las de tu cuenta.)

| Campo | De dónde sale |
|---|---|
| `cliente` | Tu identificador de editor de AdSense (`pub-…`); aquí se escribe con `ca-` delante: `ca-pub-` y 16 cifras |
| `bloques.listado` | El número de un bloque de display adaptable que crees en AdSense para los **listados** (solo cifras) |
| `bloques.juego` | El número de otro bloque para las **páginas de juego** (solo cifras) |
| `activa` | `true` solo cuando tu cuenta esté aprobada |

Para que tenga efecto, además, `config/sitio.json` debe tener `"entorno": "produccion"`. Con `activa: false`, sin `cliente` o en preproducción, **el sitio no carga ni una línea de Google** (y las páginas legales lo dicen así).

Dónde aparece, para que sepas qué se genera (no lo edites a mano):

| Qué | Archivo | Detalle |
|---|---|---|
| Script de AdSense | `comun/cabeza.html` | Va en el `<head>` de todas las páginas, solo con publicidad activa |
| Hueco en el catálogo | `comun/anuncio/anuncio-listado.html` | Al final de `/juegos/`, lejos de los filtros y las tarjetas. Solo si pones `bloques.listado` |
| Hueco en cada juego | `comun/anuncio/anuncio-elemento.html` | Al final de la página de cada juego, **nunca junto a los controles**. Solo si pones `bloques.juego` |
| `ads.txt` | `dist/ads.txt` | Se crea solo en producción con anuncios activos |
| Botón «Cambiar mi consentimiento» | `comun/consentimiento/` y la política de cookies | Reabre el mensaje de Google |

Pasos, en este orden:

1. Alta de `trabajoyjuego.es` en AdSense y espera de la revisión. **Nadie garantiza la aprobación**: Google decide en cada caso.
2. Rellena `config/titular.json` (apartado 7). Sin eso, el sitio no está listo.
3. Copia tu identificador en `cliente` y los dos números en `bloques`; pon `activa` en `true` y el entorno en `produccion`.
4. En AdSense, apartado **Privacidad y mensajes**, crea y publica el **mensaje de consentimiento** de Google para el EEE y el Reino Unido, con aceptar, rechazar y gestionar con la misma facilidad. El sitio **no incluye un sistema de consentimiento propio** ni se presenta como certificado.
5. En AdSense, **desactiva los anuncios automáticos** para este sitio, para que solo salgan los huecos reservados.
6. `python3 sitio.py comprobar`, luego `python3 sitio.py construir`, y sube el contenido de `dist/` a tu hosting.
7. Tras publicar, mira en AdSense el estado de `ads.txt` y abre el sitio en una ventana privada con las herramientas de desarrollador abiertas para ver que el mensaje de consentimiento aparece y no hay errores.

---

## 9. Lo que NO se ha podido verificar

Dilo tal cual, para que sepas dónde mirar tú:

- **Nada contra los servidores de Google.** El entorno donde se ha construido no tiene Internet: no se han probado el script de AdSense, el mensaje de consentimiento (Privacy & messaging), el botón de cambiar el consentimiento ni `ads.txt`. Se ha comprobado con anuncios simulados que **la estructura, los huecos y las condiciones de activación son correctas**, y que sin publicidad no se carga ningún recurso de terceros.
- **No se garantiza que AdSense apruebe el sitio.** Es decisión de Google. Haber cumplido lo técnico no lo asegura.
- **Los textos legales no son asesoramiento jurídico** y dependen de datos tuyos. Revísalos con tu asesoría.
- **Solo se ha probado en Chrome**, con móvil y tablet **emulados**. No en móviles reales, ni en Safari o Firefox, ni con lectores de pantalla, ni con Lighthouse. Sí se han comprobado automáticamente el contraste, el desborde horizontal, los errores de consola y que no se guarda nada.
- **Contenido:** la lista de palabras es propia y **no es el diccionario de la RAE** (puede faltar alguna palabra válida o colarse alguna dudosa). Las frecuencias de «Una entre un millón» son una estimación editorial. Los datos de «Mayor o menor» son aproximados. El mapa de «¿Dónde está?» es un dibujo esquemático (precisión de unos 200 km, sin la Antártida). Las preguntas y acertijos están escritos para este sitio y puede haber algún error de hecho. El tiempo de «Reflejos» depende también del aparato.
- **Hosting:** no se ha asumido ninguno ni se ha probado en uno. El resultado de `dist/` son archivos estáticos que sirve cualquier proveedor.
