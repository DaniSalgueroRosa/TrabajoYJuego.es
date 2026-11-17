# Actualización: dos banners nuevos que se ven nada más entrar

Se añaden **dos huecos de publicidad** a los tres que ya había. Siguen sin cargarse mientras `config/publicidad.json` no esté activa (`activa: true`, `cliente` y `entorno: produccion`).

| Hueco | Dónde | Detalle |
|---|---|---|
| `cabecera` | Bajo el menú y **por encima del título**, en los 4 listados y en cada juego, herramienta, test y guía | Banner fino (formato horizontal, 728 × 90 en ordenador y 320 × 100 en móvil). Va centrado. Es lo primero que se ve al entrar y deja el juego o la herramienta a una pantalla de distancia (unos 450 px en ordenador y 610 px en móvil). Lo pone el marco de página, no hay que tocar ninguna ficha |
| `portada` | Portada, justo debajo del bloque «Trabajo \| Juego» | Un solo banner fino, centrado. En pantallas anchas el bloque «Trabajo \| Juego» se acorta 6 rem para que el banner entre entero en la primera pantalla de un portátil. En móvil aparece al bajar un poco, detrás de las dos mitades apiladas |

Siguen igual `texto`, `final` y `listado`. La portada era la única página sin anuncios y ahora lleva este banner; las páginas legales (contacto incluido) y la 404 siguen sin ninguno.

## `config/publicidad.json`

`bloques` admite ahora `general`, `cabecera`, `portada`, `listado`, `texto` y `final`.

- **Con un solo bloque en `general` funcionan los cinco huecos.**
- `portada` usa su número; si está vacío, el de `cabecera`; y si tampoco, `general`.
- Para los dos banners finos conviene un bloque de AdSense de formato horizontal (o el adaptable: el sitio ya le pide formato horizontal).
- Si dejas un hueco sin número y sin `general`, el comprobador te avisa y ese hueco no sale.

## Textos y documentación

- «Publicidad y transparencia» lista ahora las cinco posiciones y dice que solo las páginas legales y la 404 no llevan anuncios. Cambia solo la parte de «dónde se colocan».
- Actualizados `docs/PUBLICAR.md`, `docs/LEGAL-PENDIENTE.md`, `docs/CARPETAS.md` y `docs/PENDIENTES.md`.
- En AdSense siguen desactivados los anuncios automáticos, los anclados y las viñetas.

## Para el desarrollo

- `comun/anuncio/anuncio-cabecera.html` y `anuncio-portada.html` (nuevos); el de cabecera lo incluye `comun/marco.html` cuando la sección tiene `"anuncios": true`.
- `motor/legal.py` (`HUECOS`, `BLOQUES`, resolución de `portada`) y `motor/paginas.py` (parámetro `cabecera`, 404 sin ningún bloque).
- `portada/portada.html` y `portada.css` (clase `portada--anuncio`); `comun/anuncio/anuncio.css`.
- Pruebas: 461 pasan (nuevas: banner de cabecera antes de cualquier título, banner de la portada entre el bloque principal y «Lo último», resolución de números de bloque, formato horizontal).
