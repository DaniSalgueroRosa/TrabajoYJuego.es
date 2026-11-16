# Actualización: sección Tests, grupo 9 «Anime» (tests 62 a 66)

Este zip trae **solo lo nuevo y lo cambiado** respecto a la entrega del grupo 8 (relaciones). Instálalo **después** de ella.

## Dónde ponerlo

Descomprime el zip y copia las carpetas `trabajoyjuego-v2` y `vista-previa` **encima de las que ya tienes**, aceptando reemplazar los archivos que coincidan
(en Mac, mantén pulsada Opción y elige «Combinar»). Los tests nuevos van solos a su sitio: cada uno es una carpeta dentro de `tests/` y no hay que tocar nada más.
Después, `python3 sitio.py probar` para comprobar y `python3 sitio.py servir` para verlo.

## Los tests (todos con gráficas)

| Orden | Test | Personajes que pueden salir |
|---|---|---|
| 62 | Test de Naruto | Naruto Uzumaki, Sasuke Uchiha, Sakura Haruno, Kakashi Hatake, Shikamaru Nara, Hinata Hyuga, Rock Lee, Gaara |
| 63 | Test de Dragon Ball | Goku, Vegeta, Gohan, Piccolo, Bulma, Krilin, Trunks, Maestro Roshi |
| 64 | Test de Jujutsu Kaisen | Yuji Itadori, Megumi Fushiguro, Nobara Kugisaki, Satoru Gojo, Maki Zen'in, Toge Inumaki, Panda, Kento Nanami |
| 65 | Test de Haikyu!! | Shoyo Hinata, Tobio Kageyama, Kei Tsukishima, Koshi Sugawara, Daichi Sawamura, Yu Nishinoya, Ryunosuke Tanaka, Tooru Oikawa |
| 66 | Test de JoJo's Bizarre Adventure | Jonathan Joestar, Joseph Joestar, Jotaro Kujo, Josuke Higashikata, Giorno Giovanna, Jolyne Cujoh, Jean Pierre Polnareff, Noriaki Kakyoin |

Cada test son diez situaciones con cinco respuestas (una por rasgo). El resultado muestra tu personaje con un título y una descripción, un **radar de tus cinco rasgos**, **barras de afinidad** con los cinco personajes más parecidos y tu segundo personaje.

## Cómo se decide el personaje

Cada personaje se define por sus tres rasgos principales (con pesos distintos) y se compara con tus respuestas por similitud de perfiles. Se comprobó con miles de partidas simuladas que **los ocho pueden salir** y que ninguno domina (entre el 4 % y el 22 %). Si tus respuestas no distinguen entre varios personajes (por ejemplo, un reparto exactamente igual entre los cinco rasgos), el test elige uno entre los empatados al azar y lo dice en el resultado, en lugar de favorecer al primero de la lista.

## Decisiones de contenido

- **Test de fans, no oficial:** textos propios, **sin imágenes** de las obras y sin spoilers (las descripciones solo hablan de rasgos de carácter generales). Cada página y cada resultado lo dicen y aclaran que no hay relación con los autores, los estudios ni las editoriales. Esto mantiene el contenido seguro para AdSense: no reproduce texto, imágenes ni material de terceros.
- Los nombres de personajes y obras se usan únicamente para identificar de qué trata el test.
- Todo se calcula en el navegador; no se guarda ni se envía nada.

## Pruebas

`pruebas/tests/anime.mjs` juega los cinco en Chrome: respuesta pura a cada rasgo (sale uno de los personajes esperados y se explica el empate si lo hay), reparto equilibrado, reparto desigual sin aviso de empate, radar, cinco barras, aviso de fans y móvil de 390 px sin desbordes. `probar`, `comprobar` (285 páginas, 0 errores) y la prueba de humo de los 55 tests, en dos tamaños, sin errores.
