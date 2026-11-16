# Actualización: 4 juegos nuevos (del 56 al 59)

Este zip trae **solo lo nuevo** respecto a la entrega de los 5 juegos anteriores. Con él el sitio queda en **59 juegos**.

## Cómo instalarlo

Descomprímelo y copia `trabajoyjuego-v2` y `vista-previa` encima de las que ya tienes, aceptando reemplazar los archivos que coincidan (en Mac, mantén pulsada Opción y elige «Combinar»). Instálalo **después** de los zips anteriores: la portada y el listado de `vista-previa/` ya incluyen todo lo anterior.

## Los juegos

| Orden | Juego | Categoría | Qué es |
|---|---|---|---|
| 56 | Laberinto: encuentra la salida | Arcade | Laberinto perfecto generado en cada partida (8×8, 12×12, 16×16); flechas, WASD o botones; compara tus pasos con el camino mínimo. |
| 57 | Calcula 24: llega a 24 con cuatro números | Matemáticas | Operaciones exactas con fracciones; solo se muestran puzles con solución; pista y deshacer. |
| 58 | Ordena los frascos de colores | Lógica | Frascos de 4 capas con letra además de color; un buscador comprueba que el puzle tiene solución. |
| 59 | Test de colores: encuentra el diferente | Habilidad | 30 segundos, cuadrículas hasta 8×8 y diferencias de tono cada vez menores; los fallos restan 3 s. |

Siguen las reglas del sitio: no se guarda nada en el navegador, todo en memoria, y funciona con teclado y en móvil.

## Pruebas

- `pruebas/juegos/cuatro-nuevos.mjs` resuelve partidas completas en Chrome (móvil de 390 px) con un buscador propio: camino mínimo del laberinto, solución del 24, solución de los frascos y rondas del test de colores con el castigo de tiempo.
- `pruebas/test_juegos_datos.py` incluye ya los nueve juegos añadidos tras los 50 iniciales.
- `python3 sitio.py comprobar`: 0 errores.

## A tener en cuenta

- El test de colores depende del color por naturaleza: no es un diagnóstico ni sirve para nada médico, y la página lo dice. Cada pantalla muestra los tonos de forma distinta.
- En Ordena los frascos, el buscador de soluciones tiene un tope de pasos; en el caso improbable de que no encuentre una solución tras varios intentos, el juego muestra el último puzle generado (siempre se puede pulsar «Otro puzle»).
