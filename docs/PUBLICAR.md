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
| Hueco de anuncio rotulado «Publicidad» (listados) | Al final de `juegos/listado.html` (`comun/anuncio/anuncio-listado.html`) | Solo si hay número en `bloques.listado` |
| Hueco de anuncio rotulado «Publicidad» (juego) | Al final de cada página de juego, **después** del texto y del botón de volver, nunca junto al tablero (`comun/anuncio/anuncio-elemento.html`) | Solo si hay número en `bloques.juego` |
| `ads.txt` | `dist/ads.txt` | Solo con publicidad activa, con tu identificador real |
| Botón «Cambiar mi consentimiento» | `legal/politica-de-cookies/` (`comun/consentimiento/consentimiento.js`) | Solo con publicidad activa |

Si quieres anuncios en otra sección, añade `{{> comun/anuncio/anuncio-listado}}` o `{{> comun/anuncio/anuncio-elemento}}` al final de su `listado.html` o `ficha.html`
(y apunta el número de bloque que corresponda). Mantén los anuncios lejos de botones y áreas de juego.

El sitio no promete que AdSense lo apruebe ni muestra anuncios falsos: mientras `activa` sea `false` no hay huecos vacíos ni código de terceros.
