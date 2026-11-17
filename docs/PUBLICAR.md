# Publicar el sitio

No se ha elegido alojamiento. El resultado es una carpeta de archivos estáticos (`dist/`) y vale cualquier proveedor que los sirva.

**Antes de publicar de verdad, completa lo de `LEGAL-PENDIENTE.md`**: los datos del titular (`config/titular.json`) y, si habrá anuncios, la publicidad
(`config/publicidad.json`) y el mensaje de consentimiento de Google. Las seis páginas legales ya están escritas; sin tus datos, `comprobar` no te dejará publicar.

## 1. Preparar

1. Contenido: las 120 herramientas (`HERRAMIENTAS.md`), las 32 guías y los 69 juegos (`JUEGOS.md`) ya están. La sección de tests está vacía hasta que añadas carpetas (ver `CARPETAS.md`).
2. Rellena `config/titular.json` (ver `LEGAL-PENDIENTE.md`, apartado 1).
3. En `config/sitio.json`, cambia `"entorno"` a `"produccion"` y comprueba que `"url"` es la dirección definitiva (con `https://`).
4. Si vas a poner anuncios y AdSense ya ha aprobado tu cuenta: `config/publicidad.json` (ver `LEGAL-PENDIENTE.md`, apartado 2). Si no, déjalo como está: **el sitio no carga nada de Google**.
5. Revisa y construye:
   ```
   python3 sitio.py comprobar
   python3 sitio.py construir
   ```
   `comprobar` construye una copia limpia y la revisa. Si termina con errores, no publiques todavía: avisa de enlaces rotos, títulos o descripciones vacíos,
   páginas sin un único `<h1>`, imágenes sin `alt`, textos de plantilla sin rellenar (`ESCRIBE…`), y, en producción, de páginas sin `canonical` o con `noindex`, de un sitemap incompleto
   y de **datos del titular sin completar** («[COMPLETAR POR EL TITULAR]» en las páginas legales).
6. Prueba el sitio: `python3 sitio.py probar` (datos, reglas y librerías) y, si tienes Chrome y Node 22, `python3 sitio.py probar --navegador` (abre y usa herramientas y juegos en un navegador real).
7. Míralo en local con `python3 sitio.py servir`.

## 2. Qué subir

El **contenido** de `dist/` (no la carpeta `dist` en sí) a la raíz del dominio. `index.html` queda en la raíz, junto a `404.html`, `robots.txt`, `sitemap.xml`, `favicon.ico`, la carpeta `assets/`,
las carpetas de las secciones (`juegos/`, `legal/`…) y, solo si hay publicidad activa, `ads.txt`.
`python3 sitio.py paquete --dist` te prepara un .zip con exactamente eso.

El sitio está pensado para un **dominio propio en la raíz**, no para una subcarpeta.

## 3. Qué tiene que hacer el alojamiento

| Requisito | Por qué |
|---|---|
| Servir `index.html` al pedir una carpeta (`/juegos/`) | Las direcciones son carpetas |
| Usar `404.html` como página de error, **con código HTTP 404** | Una página de error que devuelve 200 cuenta como «soft 404» para Google |
| HTTPS válido y redirección de `http://` a `https://` | Seguridad y posicionamiento |
| Una sola dirección (con o sin `www`) y redirección de la otra | Evita contenido duplicado. Debe coincidir con `url` |
| `robots.txt` y `sitemap.xml` accesibles en la raíz | Los lee Google |
| Compresión gzip o brotli | El HTML y el CSS se comprimen muy bien |

## 4. Cabeceras recomendadas

- **Caché:** los CSS de `assets/css/` y los `app.css`/`app.js` de cada elemento llevan `?v=huella` en la dirección, así que admiten caché larga
  (`Cache-Control: public, max-age=31536000, immutable`). Imágenes y fuentes (no llevan huella): un mes. HTML: sin caché o muy corta, para que los cambios se vean.
- **Seguridad básica:** `X-Content-Type-Options: nosniff` y `Referrer-Policy: strict-origin-when-cross-origin`.

## 5. Después de publicar

- `http://` redirige a `https://`, y la dirección alternativa redirige a la principal.
- `/robots.txt` permite rastrear y apunta al sitemap; `/sitemap.xml` lista las páginas.
- Una dirección inventada (`/no-existe/`) devuelve **404** y muestra tu página de error.
- Da de alta el sitio en Search Console (la verificación por DNS es la más cómoda, porque `dist/` se regenera en cada construcción) y envía `sitemap.xml`.

## 6. Publicidad (AdSense): dónde va cada cosa

**No se pega código de AdSense a mano en ningún archivo.** Todo sale de `config/publicidad.json` y del entorno:

| Pieza | Dónde se genera | Cuándo |
|---|---|---|
| Script de AdSense (`adsbygoogle.js?client=ca-pub-…`) | `<head>` de todas las páginas (`comun/cabeza.html`) | Solo con `activa: true` + `cliente` + `entorno: produccion` |
| Banner «Publicidad» **bajo el menú** | En los listados y en cada juego, herramienta, test y guía, por encima del título: se ve nada más entrar y queda lejos del juego o la herramienta. Banner fino (formato horizontal, 728 px como mucho). Lo pone el marco de página (`comun/marco.html` → `comun/anuncio/anuncio-cabecera.html`) en las secciones con `"anuncios": true` | Solo si el hueco tiene número (`bloques.cabecera` o `bloques.general`) |
| Banner «Publicidad» **en la portada** | Justo debajo del bloque «Trabajo \| Juego» (`portada/portada.html` → `comun/anuncio/anuncio-portada.html`). Fino, como el de la cabecera | Solo con número (`bloques.portada`; si está vacío usa `bloques.cabecera` y luego `bloques.general`) |
| Hueco «Publicidad» **dentro del texto** | En juegos, herramientas, tests y guías: entre dos apartados, tras bastante texto y lejos del juego, la herramienta o el test. Lo coloca el motor (`motor/anuncios.py`; plantilla `comun/anuncio/anuncio-texto.html`). Si la ficha tiene muy poco texto, no se pone | Solo si el hueco tiene número (`bloques.texto` o `bloques.general`) |
| Hueco «Publicidad» **al final** | Al final de cada ficha, después del texto (y, en los juegos, del botón de volver): `comun/anuncio/anuncio-final.html` | Solo con número (`bloques.final` o `bloques.general`) |
| Hueco «Publicidad» **en los listados** | Entre dos bloques de tarjetas y al final de la página (`comun/anuncio/anuncio-listado.html`) | Solo con número (`bloques.listado` o `bloques.general`) |
| `ads.txt` y etiqueta `<meta name="google-adsense-account">` | `dist/ads.txt` y el `<head>` de las páginas (salvo la 404) | Con `cliente` + `entorno: produccion`, esté `activa` en true **o en false** (modo verificación: AdSense los pide para revisar el sitio; no hay anuncios ni código de Google) |
| Botón «Cambiar mi consentimiento» | `legal/politica-de-cookies/` (`comun/consentimiento/consentimiento.js`) | Solo con publicidad activa |

**Con un solo bloque de AdSense basta:** créalo (display adaptable) y pon su número en `bloques.general`; lo usan los cinco huecos (AdSense permite reutilizar un bloque
en varias posiciones). Si más adelante quieres ver en AdSense cuánto rinde cada posición, crea un bloque por hueco y rellena `cabecera`, `portada`, `texto`, `final` y `listado` (los dos banners de arriba pueden compartir bloque: crea uno de tipo horizontal para `cabecera` y deja `portada` vacío).

**Orden recomendado:** 1) publica el sitio con tu `cliente` y `activa: false`; 2) en AdSense añade el sitio, verifícalo y pide la revisión; 3) cuando lo aprueben, crea el bloque, ponlo en `bloques.general`, pon `activa: true`, reconstruye y vuelve a subir.

**Las páginas legales (contacto incluido) y la 404 no llevan anuncios**, a propósito: son páginas de texto obligatorio o de error. La portada lleva solo el banner fino de debajo del bloque «Trabajo | Juego».

**Imprescindible en AdSense:** desactiva los **anuncios automáticos** y los formatos que se quedan fijos o a pantalla completa (anclados, viñetas). Si no, Google puede
poner anuncios en sitios que este sitio no ha previsto, y la página «Publicidad y transparencia» dejaría de decir la verdad.

Si quieres anuncios en una sección nueva: pon `"anuncios": true` en su `seccion.json` (activa el del texto) (eso activa también el banner de cabecera, que pone el marco solo) y añade `{{> comun/anuncio/anuncio-final}}` al final de su `ficha.html`
y `{{> comun/anuncio/anuncio-listado}}` al final de su `listado.html`. Mantén los anuncios lejos de botones y áreas de juego.

El sitio no promete que AdSense lo apruebe ni muestra anuncios falsos: mientras `activa` sea `false` no hay huecos vacíos ni código de terceros.
