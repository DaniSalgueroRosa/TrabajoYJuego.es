# Actualización: sección Tests, grupo 5 «Memoria y percepción» (7 tests, el último)

Este zip trae **solo lo nuevo y lo cambiado** respecto a la entrega del grupo 4 (vista y oído). Instálalo **después** de ella. Con este grupo la sección Tests queda completa: **30 de 30**.

## Cómo instalarlo

Descomprímelo y copia `trabajoyjuego-v2` y `vista-previa` encima de las que ya tienes, aceptando reemplazar los archivos que coincidan (en Mac, mantén pulsada Opción y elige «Combinar»).

## Los tests

| Orden | Test | Qué hace |
|---|---|---|
| 24 | Test de memoria verbal | Salen palabras una a una (unas 300, de uso cotidiano): «Nueva» o «Ya vista» (también teclas N y V). Tres vidas. Puntos, nuevas y vistas acertadas, palabras distintas, mejor racha y tiempo medio. |
| 25 | Test de memoria numérica | Número que se muestra y se oculta (0,6 s + 0,45 s por cifra, con barra); se escribe de memoria. Empieza en 3 cifras y sube una por acierto; dos fallos en el mismo nivel terminan. |
| 26 | Test de memoria a corto plazo | Cuadrícula de 3 × 3 que ilumina una secuencia que crece en una casilla por ronda. Termina al primer fallo; señala la casilla equivocada y la correcta. |
| 27 | Test de percepción del tiempo | Cinco rondas (3, 5, 8, 10 y 15 s en orden aleatorio) sin reloj a la vista. Error por ronda, error medio en % y tendencia a pasarse o quedarse corto. |
| 28 | Dibuja un círculo perfecto | Tres intentos a mano alzada sobre un lienzo (ratón o dedo). Se ajusta el mejor círculo por mínimos cuadrados y se puntúa sobre 100 por desviación del radio y por cerrar la vuelta. Rechaza trazos sin cerrar, de más de una vuelta, diminutos o muy cortos sin gastar intento. |
| 29 | Test de edad cerebral | Tres tareas: cálculo rápido (10 operaciones), colores y palabras tipo Stroop (12) y tabla de números del 1 al 16. Edad «de juego» entre 20 y 80 a partir de tiempos de referencia fijados por nosotros. |
| 30 | Test de razonamiento visual-espacial | Diez preguntas de rotación mental con figuras de 5 a 8 cuadrados generadas al azar: una opción es la figura girada; dos son reflejadas y una tiene un cuadrado movido. |

## Pruebas

`pruebas/tests/memoria-percepcion.mjs` juega los siete en Chrome: 40 palabras sin incoherencias entre «nueva» y «vista» y fin por tres vidas; los niveles 3, 4 y 5 de cifras con sus dos intentos; cuatro rondas de secuencia y un fallo; las cinco rondas de percepción del tiempo en tiempo real (error de pocas centésimas de segundo); círculo perfecto (100), elipse (5), círculo con temblor en sentido contrario (73) y los trazos no válidos; las tres tareas de edad cerebral con aciertos y fallos conocidos; y dos partidas completas de razonamiento visual con **comprobación independiente** de cada pregunta (exactamente una opción es un giro de la figura y las demás no, y el tamaño sube de 5 a 8). También abre los siete en móvil. Los 30 tests pasan la carga en escritorio y móvil con contraste (337 pruebas OK). `comprobar`: 260 páginas, 0 errores.

Cambio durante las pruebas: en memoria numérica el marcador «Intento» pasaba a 2/2 solo al pulsar «Continuar»; ahora lo hace en cuanto fallas.

## A tener en cuenta

- **Edad cerebral** es un pasatiempo: la «edad» solo compara tu rapidez con tiempos de referencia que hemos fijado (2 s por operación, unos 0,7 s por palabra y 20 s para la tabla dan los 100 puntos de cada tarea). La página y el resultado lo dicen de forma visible; no mide inteligencia ni salud.
- **Razonamiento visual-espacial** es una interpretación del título: rotación mental de figuras planas, sin límite de tiempo. No es una prueba psicotécnica ni de aptitudes.
- **Dibuja un círculo perfecto:** la puntuación es exigente (una elipse muy marcada puntúa casi cero; un círculo humano normal suele quedar entre 40 y 70). Un trackpad da trazos más irregulares que un ratón.
- **Percepción del tiempo** y **memoria numérica** dependen del ritmo real del navegador; el cronómetro usa `performance.now` y, en el primero, la marca de tiempo del evento.
- Ninguno guarda nada: ni puntuaciones, ni dibujos, ni mejores marcas.
