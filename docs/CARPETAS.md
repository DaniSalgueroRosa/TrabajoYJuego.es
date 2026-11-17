# El contrato de carpetas

Todo lo que se publica sale de carpetas. Esta página dice qué reconoce el generador y qué pasa si algo no cuadra.
Todos los errores salen en español, con el archivo y la línea.

## Secciones

Una **sección** es una carpeta de primer nivel que contiene un `seccion.json`. Hay cinco: `herramientas`, `recursos`, `juegos`, `tests` y `legal` (esta última no sale en el menú ni en «Lo último»: sus páginas se enlazan en el pie y en el bloque «Información y transparencia» de la portada).
Para añadir una quinta basta con crear otra carpeta con ese archivo y sus plantillas (copia una existente).

| Archivo | Para qué |
|---|---|
| `seccion.json` | Datos de la sección (abajo) |
| `listado.html` | La página que lista los elementos (`<sección>/index.html`) |
| `ficha.html` | La plantilla de cada elemento: cabecera y hueco para su contenido |
| `<sección>.css` | El CSS de la sección (cualquier `.css` directamente dentro de la carpeta se suma, por orden alfabético, en `assets/css/<sección>.css`) |
| `*.js` sueltos | Código compartido por todos los elementos de la sección (cualquier `.js` directamente dentro de la carpeta). Se agrupan, por orden alfabético, en `assets/js/<sección>.js` y se cargan **antes** del `app.js` de cada elemento |
| `datos/` | Archivos que se publican **tal cual** en `/<sección>/datos/` (listas de palabras, etc.). No es un elemento |
| `_partes/` | Trozos de HTML reutilizables dentro de las páginas de la sección: se insertan con `{{> <sección>/_partes/nombre}}` (los usa `legal/`) |
| `_plantilla/` | Un elemento en blanco para copiar. Las carpetas que empiezan por `_` o `.` se ignoran |

### seccion.json

| Campo | Obligatorio | Qué es |
|---|---|---|
| `titulo` | sí | Nombre en el menú y en el `<h1>` del listado («Juegos») |
| `singular`, `plural` | sí | «juego», «juegos»: se usan en textos como «3 juegos» |
| `descripcion` | sí | Meta description del listado y texto bajo el título |
| `resumen` | sí | Una frase corta para la portada |
| `mundo` | sí | `trabajo` o `juego` (están definidos en `config/sitio.json`): decide en qué mitad de la portada y del menú aparece |
| `aspecto` | no | Por defecto igual que `mundo`. Con `libre` la sección no impone estilo a sus elementos (así funcionan los tests) |
| `orden` | sí | Número entero, único: posición en el menú |
| `vacio` | sí | Mensaje mientras no hay nada publicado |
| `ordenar_por` | no | `fecha` (lo más nuevo primero, por defecto), `titulo` o `orden` (usa el número `orden` de cada ficha; a igual número, lo más nuevo y luego el título). `juegos` usa `orden` |
| `schema` | no | Datos estructurados de sus elementos: `{"tipo": "WebApplication", "categoria": "GameApplication"}`. Por defecto `WebPage` |
| `categorias` | no | Lista de `{"id": "palabras", "nombre": "Palabras"}`. Si la sección las define, **cada elemento publicado debe declarar una** y el listado muestra chips para filtrar por ellas |
| `buscador` | no | `true` muestra el buscador y los filtros (solo con JavaScript; sin él se ve la lista completa) |
| `anuncios` | no | `true` permite un anuncio dentro del texto de las fichas de la sección (solo si hay publicidad activa; ver `motor/anuncios.py`). Lo usan `herramientas/`, `recursos/`, `juegos/` y `tests/` |
| `agrupar` | no | `true` (con `categorias`) muestra el listado en bloques, uno por categoría, con su título y su cuenta; el buscador y los chips siguen filtrando. Lo usan `herramientas/` y `recursos/` |
| `accion` | no | Verbo del botón de cada tarjeta («Jugar»). Por defecto, «Ver» |
| `ubicacion` | no | `menu` (por defecto: cabecera, portada, «Lo último» y pie) o `pie` (enlaces en el pie y en el bloque «Información y transparencia» de la portada; ni menú, ni «Lo último», ni mitades «Trabajo \| Juego», como `legal/`) |
| `dinamico` | no | `true` hace que las `pagina.html` de la sección sean **plantillas** con datos del sitio y del titular (ver «Secciones dinámicas»). Con `false` (por defecto) el HTML se inserta tal cual, y puedes escribir `{{` con libertad |

Un campo que no existe se rechaza y, si parece una errata, el error propone el correcto («el campo `titol` no existe. ¿Querías poner `titulo`?»).

## Elementos

Un **elemento** es una subcarpeta de una sección. **El nombre de la carpeta es la dirección web**: `juegos/juego1/` se publica como `/juegos/juego1/`.
Solo minúsculas sin acentos, números y guiones. Si el nombre no vale, el error propone uno que sí.

| Archivo | Obligatorio | Qué es |
|---|---|---|
| `ficha.json` | sí | Los datos del elemento (abajo) |
| `pagina.html` | no, pero avisa si falta | El contenido: solo el interior de la página, sin `<html>`, `<head>` ni `<body>` |
| `app.css` | no | CSS propio del elemento. Si existe, se enlaza solo, con `?v=` para que el navegador no use una copia vieja |
| `app.js` | no | Código propio. Si existe, se enlaza solo (con `defer`: el HTML ya existe cuando se ejecuta) |
| cualquier otro | no | Imágenes, sonidos, datos… se copian tal cual junto a la página |

No se publica `ficha.json`. No puede haber un `index.html` dentro de un elemento: lo genera el sitio.

### ficha.json

| Campo | Obligatorio | Qué es |
|---|---|---|
| `titulo` | sí | Nombre del elemento |
| `descripcion` | si está publicado: mínimo 40 caracteres | Una frase que diga qué es y para quién (lo ideal, 70 a 160). Sale en Google y en las tarjetas |
| `fecha` | si está publicado | `AAAA-MM-DD`. Ordena los listados y alimenta `lastmod` del sitemap |
| `estado` | no | `publicado` (por defecto), `proximamente` o `borrador` |
| `etiquetas` | no | Lista de textos cortos: `["un jugador", "clásico"]` |
| `tema` | no | Colores propios, pensado para tests (abajo) |
| `categoria` | si la sección define `categorias` | El `id` de una de ellas. Si no existe, el error lista las válidas |
| `dificultad` | no | `facil`, `media` o `dificil`: sale en la tarjeta y en la ficha, y se puede filtrar |
| `duracion` | no | Texto corto: `"3-5 min"` |
| `orden` | no | Entero (0, 1, 2…): posición en secciones con `ordenar_por: orden` |

### Estados

- **publicado**: tiene página, sale en el listado, en la portada y en el sitemap.
- **proximamente**: sale en el listado como tarjeta con borde discontinuo, **sin enlace y sin página**. Solo necesita `titulo` (y una `descripcion` si quieres que se vea).
- **borrador**: se ignora por completo. Es la forma de ir trabajando en algo dentro del proyecto sin publicarlo.

### tema

```json
"tema": { "fondo": "#2B1B4A", "texto": "#FFFFFF", "acento": "#FFB400" }
```

Tres colores con formato `#RRGGBB`. Pintan la tarjeta del listado y toda la zona de la página del elemento
(`--t-fondo`, `--t-texto` y `--t-acento` disponibles en su CSS). **El contraste entre texto y fondo tiene que ser de 4.5:1 como mínimo**; si no,
el generador se niega a construir y dice la proporción que tiene.

## Secciones dinámicas (`dinamico: true`) y `legal/`

La sección `legal/` es un ejemplo completo: `ubicacion: "pie"`, `dinamico: true`, `ordenar_por: "orden"`. Sus `pagina.html` son plantillas.
Datos que tienen a mano:

| Dato | Qué es |
|---|---|
| `{{sitio.nombre}}`, `{{sitio.url}}`, `{{sitio.idioma}}` | De `config/sitio.json` |
| `{{{titular.nombre}}}`, `{{{titular.nif}}}`, `{{{titular.domicilio}}}`, `{{{titular.email}}}`, `{{{titular.telefono}}}`, `{{{titular.registro}}}`, `{{{titular.alojamiento}}}` | De `config/titular.json`. **Con tres llaves**: ya vienen escapados, y si faltan valen `<mark class="pendiente">[COMPLETAR POR EL TITULAR]</mark>` |
| `{{#titular.tiene_telefono}}…{{/titular.tiene_telefono}}` (y `tiene_registro`) | Bloques opcionales |
| `{{^titular.completo}}…{{/titular.completo}}` | Se muestra mientras falte algún dato obligatorio |
| `{{#publicidad.activa}}…{{/publicidad.activa}}` y `{{^publicidad.activa}}…{{/publicidad.activa}}` | El texto cambia según haya o no anuncios activos |
| `{{raiz}}` | Prefijo para enlaces relativos (`../../`) |
| `{{item.titulo}}`, `{{item.fecha_texto}}` | La ficha de la propia página |
| `{{> legal/_partes/titular}}` | Una parte compartida |

## Configuración del titular y de la publicidad

- `config/titular.json`: nombre, NIF, domicilio, correo, teléfono, registro, alojamiento. Vacío = «[COMPLETAR POR EL TITULAR]» (y error del comprobador en producción).
- `config/publicidad.json`: `activa`, `cliente` (`ca-pub-` y 16 cifras), `bloques` (`general`, `cabecera`, `portada`, `texto`, `final`, `listado`; basta con `general`). Solo se cargan anuncios con `activa: true`, un `cliente` válido **y** `entorno: produccion`.

Los pasos completos están en [LEGAL-PENDIENTE.md](LEGAL-PENDIENTE.md) y [PUBLICAR.md](PUBLICAR.md).

## La página de cada sección

- **herramientas**: cabecera pizarra con rejilla, y un `.panel` con `.campo` y `.boton` listos para usar.
- **recursos**: cabecera con subrayador limón y el cuerpo con estilo de texto largo (títulos, listas, citas).
- **juegos**: fondo oscuro retro. `.pantalla` (marco de píxeles), `.boton-retro`, `.hud`, `.opciones`, `.final`… (ver [JUEGOS.md](JUEGOS.md)).
- **legal**: versión de lectura: texto con medida cómoda, tablas que se apilan en el móvil y estilos de impresión.
- **tests**: el sitio solo pone la cabecera, el pie y las migas. **Todo lo demás es del test**: tipografías, formas, colores, animaciones.
  Si la `pagina.html` no tiene `<h1>`, se añade uno invisible con el título de la ficha, para que la página siga teniendo un único `<h1>`.

## Cómo se arma el CSS

| Archivo generado | Contenido |
|---|---|
| `assets/css/comun.css` | `comun/tokens.css`, `base.css`, `fuentes/fuentes.css` y el CSS de cada parte de `comun/` |
| `assets/css/portada.css` | `portada/portada.css` y el de cada parte de la portada (solo en la portada) |
| `assets/css/<sección>.css` | El de la sección (solo en sus páginas) |
| `assets/js/<sección>.js` | Los `.js` sueltos de la sección (solo en sus páginas) |
| `assets/js/filtro.js` | Buscador y filtros (solo en listados con `buscador: true`) |
| `assets/js/consentimiento.js` | Botón de consentimiento (solo en `legal/` y con publicidad activa) |
| `<sección>/<elemento>/app.css` | El del elemento (solo en su página) |

Cada página lleva `data-seccion` y `data-item` en el `<body>`, así que el CSS de un elemento se puede acotar con `body[data-item="juego1"]`.

## Añadir una parte nueva a la portada

Crea `portada/<parte>/<parte>.html` y `<parte>.css` y añade `{{> portada/<parte>/<parte>}}` en `portada/portada.html`.
Los dos archivos se recogen solos.

## Qué lleva la portada y de dónde salen sus datos

| Parte | Qué enseña | De dónde sale |
|---|---|---|
| `hero` | Las dos mitades «Trabajo \| Juego» con sus secciones y cuántos elementos tiene cada una | `seccion.json` de cada sección del menú (`resumen`, `mundo`) |
| `novedades` | «Lo último»: las 6 tarjetas más recientes (`novedades_en_portada` en `config/sitio.json`) | Fichas publicadas. Si varias comparten fecha, manda su `orden` y, a igualdad, el título |
| `explorar` | Un bloque «<Sección> por categoría» por cada sección del menú que tenga `categorias` y algo publicado: cada categoría con la cuenta y todos sus elementos enlazados | `categorias` de `seccion.json` y `categoria` de cada ficha. Una categoría sin nada publicado no sale |
| `sobre` | Qué es el sitio, en dos frases | Texto fijo y `sitio.nombre` |
| `informacion` | «Sin registro», «Tus partidas no se guardan», el estado de la publicidad y un enlace a cada página de las secciones con `ubicacion: "pie"` | `config/publicidad.json` (activa o no) y las fichas publicadas de `legal/` |

Los enlaces de categoría de `explorar` apuntan a `<sección>/?categoria=<id>`. Si la sección tiene buscador, `comun/filtro/filtro.js` abre el listado ya filtrado
(una categoría que no exista en la dirección se ignora y se ve todo); si no lo tiene, el enlace abre el listado entero. No se guarda nada en el navegador.
El texto de publicidad de `informacion` coincide con el de la política de privacidad: sin publicidad activa dice que no hay anuncios ni elementos de terceros; con ella,
que es AdSense, que cada anuncio lleva la etiqueta «Publicidad» y dónde cambiar la elección.

## Plantillas

Es un subconjunto estricto de Mustache: `{{dato}}` (escapa HTML), `{{{dato}}}` (sin escapar), `{{#lista}}…{{/lista}}`, `{{^vacío}}…{{/vacío}}`
y `{{> parcial}}`. Si una plantilla usa un dato que no existe, el error dice cuál y en qué línea, en vez de dejarlo en blanco.
