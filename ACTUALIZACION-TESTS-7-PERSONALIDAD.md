# Actualización: sección Tests, grupo 7 «Personalidad» (tests 42 a 50)

Este zip trae **solo lo nuevo y lo cambiado** respecto a la entrega del grupo 6 (utilidades). Instálalo **después** de ella.

## Dónde ponerlo

Descomprime el zip y copia las carpetas `trabajoyjuego-v2` y `vista-previa` **encima de las que ya tienes**, aceptando reemplazar los archivos que coincidan
(en Mac, mantén pulsada Opción y elige «Combinar»). Los tests nuevos van solos a su sitio: cada uno es una carpeta dentro de `tests/` y no hay que tocar nada más.
Después, `python3 sitio.py probar` para comprobar y `python3 sitio.py servir` para verlo.

## Los tests (todos con gráficas)

| Orden | Test | Preguntas | Gráfica del resultado |
|---|---|---|---|
| 42 | Test de edad mental (clásico) | 16, en cuatro áreas | Espectro de 10 a 70 años y barras por área |
| 43 | Test de los 16 tipos de personalidad | 28 (A/B) | Cuatro ejes opuestos con el porcentaje de cada lado |
| 44 | Test de pureza de Rice | 100 casillas, cinco bloques | Medidor sobre 100 y barras por bloque |
| 45 | Test: ¿Soldado, poeta o rey? | 14 | Triángulo de tres polos |
| 46 | Test del color del alma | 10 (seis colores) | Muestra del color y radar de seis ejes |
| 47 | Test de la brújula de talentos | 14 | Brújula con aguja (analizar, crear, conectar, construir) |
| 48 | Test de color de personalidad | 16 | Plano de ritmo y foco y barras de los cuatro colores |
| 49 | Test del hemisferio cerebral dominante | 15 | Espectro y tres ejes; explica que el «hemisferio dominante» es un mito |
| 50 | Reloj de la Muerte (de juego) | edad + 6 hábitos | Vida en semanas (canvas) y balanza de lo que suma o resta |

## Decisiones de contenido

- **Todo el texto es propio.** La pureza de Rice es una lista nueva de cien experiencias para todos los públicos (sin las preguntas explícitas de la clásica); los 16 tipos usan nombres y descripciones propios y avisan de que no son el MBTI®.
- **Hemisferio cerebral:** se mantiene el nombre pedido, pero el test mide «estilo de pensar» y lo dice en la introducción, en el resultado y en el texto de la página.
- **Reloj de la Muerte:** parte de la esperanza de vida del INE para 2024 (81,38 hombres, 86,53 mujeres, 84,01 total), con ajustes redondos por seis hábitos. Es un cálculo de juego, no muestra fechas, garantiza al menos 5 años por delante a quien ya supera la media y recuerda el 024 (línea gratuita 24 h). Edad, sexo y hábitos no salen de la página ni se guardan.
- Los resultados con empate no inventan un «segundo color» o «segundo talento» sin puntos.

## Pruebas

`pruebas/tests/personalidad.mjs` juega los nueve en Chrome (respuestas fijas que dan un resultado conocido, mezclas, empates, «Anterior», teclas, repetir, cálculo del reloj con casos de 30, 40 y 95 años, y móvil de 390 px). `probar` y `comprobar` sin errores. Regla ajustada en `pruebas/test_tests_datos.py`: los tests de cuestionario montan su pieza con el motor.

## A tener en cuenta

- Son juegos de entretenimiento, sin valor psicológico; cada página lo dice.
- Pequeñas mejoras de las gráficas en `tests/graficos.js` y `tests/tests.css` (etiquetas de los ejes, marcas del espectro, muestra de color).
