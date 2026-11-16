# Actualización final de Tests: series, idiomas y buscador

Con esta entrega se cierra la parte de Tests: **13 tests nuevos**, un motor nuevo para los tests de nivel (`tests/quiz.js`) y el listado de `/tests/` con un buscador pequeño.

## Dónde ponerlo

Descomprime el zip y copia las carpetas `trabajoyjuego-v2` y `vista-previa` **encima de las que ya tienes**, aceptando reemplazar los archivos que coincidan
(en Mac, mantén pulsada Opción y elige «Combinar»). Cada test es una carpeta dentro de `tests/` y entra solo; no hay que tocar nada más.
Después: `python3 sitio.py probar` para comprobar y `python3 sitio.py servir` para verlo.

El zip «solo estos tests» lleva los 13 tests y, forzosamente, los archivos que comparten: el motor `tests/quiz.js`, el CSS de la sección y el listado con el buscador.

## Los 13 tests

| Orden | Test | Categoría | Resultado |
|---|---|---|---|
| 67 | Percy Jackson: tu cabaña | Series, libros y cine | Una de 12 cabañas, con barras de afinidad |
| 68 | Juego de Tronos: tu casa | Series, libros y cine | Una casa, con barras de afinidad |
| 69 | Universo DC: ¿qué héroe eres? | Series, libros y cine | Un personaje, con barras de afinidad |
| 70 | South Park: ¿qué personaje eres? | Series, libros y cine | Un personaje, con barras de afinidad |
| 80 | Nivel de vocabulario de español | Idiomas: español | Cinco niveles, de Cotidiano a Raro |
| 81 | Jerga española | Idiomas: español | Básica, Habitual, Avanzada o Nativa |
| 82 | Internacional de español | Idiomas: español | Palabras de España y América por regiones |
| 83 | Errores ortográficos comunes | Idiomas: español | Básicos, Frecuentes, Delicados o Expertos |
| 84 | Nivel de vocabulario de inglés | Idiomas y geografía | A1 a C1 |
| 85 | Nivel de vocabulario de francés | Idiomas y geografía | A1 a C1 |
| 86 | Nivel de vocabulario de ruso (cirílico y transcripción) | Idiomas y geografía | A1 a C1 |
| 87 | Nivel de vocabulario de japonés (con lectura) | Idiomas y geografía | N5 a N1 |
| 88 | ¿De dónde vienes? | Idiomas y geografía | Región con más coincidencia (8 regiones) |

## Cómo funcionan

- **Tests de nivel (80 a 87):** 24 o 30 preguntas por franjas de dificultad. Se corrige al momento (verde/rojo con texto «Correcta» o «Tu respuesta», no solo color) y se explica cada respuesta. Una franja se supera con un **60 %** de aciertos, siguiendo el orden; el nivel es la última franja superada seguida. El resultado trae gráfica por franja y «Qué repasar» con todo lo fallado. Las respuestas se barajan en cada intento y se puede responder con las teclas 1 a 4.
- **Tests de series (67 a 70):** cada personaje, cabaña o casa se define con sus tres rasgos principales; el resultado es el más parecido a tus respuestas. Si hay empate exacto, se elige al azar entre los empatados y el texto lo dice.
- **¿De dónde vienes? (88):** compara las palabras y costumbres que declaras con las de ocho regiones. **No escucha la voz ni analiza el acento.**

## El buscador de `/tests/`

El buscador ya existía en las secciones; ahora, en Tests, es **compacto**: una casilla de búsqueda, un desplegable de categorías (con el número de tests de cada una) y una línea de estado con «Quitar filtros». Busca por título, descripción, categoría y etiquetas, sin distinguir tildes. Los controles solo aparecen cuando el JavaScript funciona, así que sin él la lista completa sigue visible y no hay botones muertos. `?categoria=<id>` abre el listado ya filtrado.

Categorías nuevas: «Cultura pop: series, libros y cine», «Idiomas: español» e «Idiomas y geografía».

## Comprobado

340 pruebas unitarias, recorrido de los 13 tests en navegador (acierto, fallo, umbrales de nivel, teclas, contraste de los estados correcto/fallo, móvil), recorrido de todos los tests publicados en dos tamaños y prueba del buscador. Sin errores de consola ni almacenamiento en el navegador.

## Tenlo en cuenta

- Los tests de idiomas son **orientativos**: miden vocabulario que reconoces, no son un examen ni dan certificado.
- Los tests de series son **no oficiales**, solo de texto, sin imágenes ni marcas de terceros.
- Siguen sin hacerse los tests de CI (33 a 41 y 51), y «IA vs cuadros reales» sigue en «Próximamente» hasta que aportes las imágenes.
- Antes de publicar falta rellenar `config/titular.json` y el entorno (`preproduccion`); `python3 sitio.py comprobar` los avisa.
