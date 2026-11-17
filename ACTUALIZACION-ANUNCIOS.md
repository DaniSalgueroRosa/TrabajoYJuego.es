# Actualización: nueva colocación de los anuncios y modo «verificación» de AdSense

Este paquete **no es el proyecto entero**: solo trae lo que cambia respecto a la entrega anterior (los 69 juegos). Se descomprime **encima** de tu carpeta
`trabajoyjuego-v2/` (la ruta de cada archivo ya incluye `trabajoyjuego-v2/`) y, si el sistema pregunta, se aceptan los reemplazos.
Con la publicidad apagada (como está ahora) el sitio se ve exactamente igual que antes.
**Un archivo sobra y hay que borrarlo a mano:** `comun/anuncio/anuncio-elemento.html` (ya no se usa; el zip no puede borrar archivos). La carpeta `vista-previa/` va regenerada.

## Dónde van ahora los anuncios

Tres posiciones, siempre con la etiqueta «Publicidad», y ninguna junto a un juego, herramienta o test:

| Hueco | Dónde | Detalle |
|---|---|---|
| `texto` | Dentro del texto de cada juego, herramienta, test y guía | Entre dos apartados, después de varios párrafos. Sobre el sitio real queda a unos 550 px del juego o test. Si la ficha tiene muy poco texto, no se pone |
| `final` | Al final de cada ficha | Después del texto (y del botón de volver, en los juegos) |
| `listado` | En los listados | Entre dos bloques de tarjetas y al final de la página |

Antes solo había dos huecos (final de los listados y final de cada juego). **No hay anuncios** en la portada, las páginas legales (contacto incluido) ni la 404.
Si Google no tiene anuncio que mostrar, el hueco desaparece entero (sin espacio vacío).

## `config/publicidad.json`: un bloque basta

Cambian los nombres de los bloques: `general`, `texto`, `final` y `listado` (el antiguo `juego` ya no existe). Crea **un** bloque de display adaptable en AdSense y pon su
número en `general`: lo usan los tres huecos. Si más adelante quieres medir cada posición por separado, rellena también `texto`, `final` y `listado`.

## Modo verificación (para pedir la revisión a AdSense)

AdSense necesita ver tu identificador en la web publicada **antes** de aprobarla. Con `"cliente"` relleno, `"activa": false` y `"entorno": "produccion"`, el sitio publica solo
`ads.txt` y la etiqueta `<meta name="google-adsense-account">`: es texto, no carga nada de Google, no hay anuncios y las páginas legales siguen diciendo la verdad.
Cuando aprueben el sitio: número de bloque en `general`, `"activa": true`, reconstruir y volver a subir.

## Textos

- Reescrita **«Publicidad y transparencia»** con las tres posiciones reales (y en futuro mientras no haya anuncios) y las reglas: nada cerca de controles, sin ventanas
  emergentes, sin anuncios fijos ni a pantalla completa, nada que cambie mientras juegas, el hueco desaparece si no hay anuncio, ninguna petición de pulsar.
- Actualizados `docs/PUBLICAR.md`, `docs/LEGAL-PENDIENTE.md`, `docs/CARPETAS.md`, `docs/PENDIENTES.md` e `INSTALACION-JUEGOS.md`.
- **En AdSense, desactiva los anuncios automáticos y los anclados/viñetas**: si no, Google puede poner anuncios donde el sitio no los ha previsto y la página de transparencia dejaría de ser cierta.

## Para el desarrollo

- Nuevo `motor/anuncios.py` (coloca el anuncio del texto), campo `"anuncios": true` en el `seccion.json` de juegos, herramientas, tests y recursos, y parciales `comun/anuncio/anuncio-texto.html` y `anuncio-final.html`
  (desaparece `anuncio-elemento.html`).
- Pruebas: nuevo `pruebas/test_anuncios.py` (recorre las 340 fichas con publicidad simulada y comprueba la posición de cada anuncio) y ampliados `test_legal.py` y `test_portada.py`.
  Resultado: 457 pruebas automáticas, todas OK; en navegador, el humo de los 69 juegos, las 164 herramientas y los 68 tests, la portada y las páginas legales, sin fallos; y `comprobar` sin errores.
