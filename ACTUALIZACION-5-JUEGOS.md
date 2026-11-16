# Actualización: 5 juegos nuevos (del 51 al 55)

Este zip trae **solo lo nuevo** respecto a la entrega de las 30 herramientas. Con él el sitio queda en **55 juegos**.

## Cómo instalarlo

1. Descomprímelo y copia las carpetas `trabajoyjuego-v2` y `vista-previa` encima de las que ya tienes, aceptando reemplazar los archivos que coincidan (en Mac, mantén pulsada la tecla Opción y elige «Combinar»; si eliges «Reemplazar» se borraría la carpeta antigua).
2. **Hazlo después de instalar el zip de las herramientas**, no antes: la portada y el listado de `vista-previa/` de este zip ya incluyen las herramientas y los juegos a la vez.
3. `py sitio.py servir` (o `python3 sitio.py servir`) y abre <http://localhost:8080/juegos/>.

## Los juegos

| Orden | Juego | Categoría | Qué es |
|---|---|---|---|
| 51 | Piedra, papel o tijera contra la máquina | Habilidad | Al mejor de 3, 5 o 7 rondas. La máquina sortea con igual probabilidad. |
| 52 | Adivina el número: más alto o más bajo | Matemáticas | Rangos de 1 a 50, 100 o 1000, con el límite de intentos de la búsqueda por mitades más uno. |
| 53 | Juego de los palillos (Nim) | Lógica | Se quitan 1, 2 o 3 y pierde quien coge el último. La máquina difícil aplica la regla de los cuatro. |
| 54 | Tabla de Schulte: encuentra los números | Habilidad | Cuadrículas de 4×4, 5×5 o 6×6 con cronómetro y fallos. |
| 55 | Inundación: llena el tablero de un color | Lógica | Tableros de 8×8, 10×10 y 12×12 con número de movimientos limitado. |

Cumplen las reglas del sitio: nada se guarda en el navegador (las estadísticas de la sesión viven solo en memoria), el color nunca es la única señal (las casillas de Inundación llevan número) y se juegan con teclado y en móvil.

## Pruebas

- `pruebas/juegos/cinco-nuevos.mjs` juega partidas completas en Chrome (móvil de 390 px): comprueba reglas, marcadores, rechazo de entradas no válidas, que la estrategia correcta gane al Nim difícil, que la búsqueda por mitades acierte en siete intentos y que Inundación termine con el tablero de un solo color.
- `pruebas/test_juegos_datos.py` incluye ahora los cinco juegos nuevos.
- `python3 sitio.py comprobar`: 0 errores en 220 páginas. Batería unitaria: 324 pruebas.

## A tener en cuenta

- Inundación genera tableros al azar y los límites de movimientos (16, 22 y 27) se ajustaron con una simulación; una buena estrategia los cumple casi siempre, pero no está garantizado que todos los tableros se puedan resolver dentro del límite.
- El Nim con 21 palillos es una partida perdida para quien empieza frente a la máquina difícil: está explicado en la página del juego.
