# Actualización: sección Tests, grupo 3 «Reacción y puntería» (6 tests)

Este zip trae **solo lo nuevo y lo cambiado** respecto a la entrega del grupo 2 (ratón y teclado). Instálalo **después** de ella.

## Cómo instalarlo

Descomprímelo y copia `trabajoyjuego-v2` y `vista-previa` encima de las que ya tienes, aceptando reemplazar los archivos que coincidan (en Mac, mantén pulsada Opción y elige «Combinar»).

## Los tests

| Orden | Test | Qué hace |
|---|---|---|
| 12 | Test de tiempo de reacción | La zona pasa de rojo a verde tras una espera al azar (1,5–4,5 s). Cinco intentos válidos; pulsar antes de tiempo no cuenta. Media, mediana, mejor, peor y variación, con gráfico por intento. Vale ratón, dedo, Intro o barra espaciadora. |
| 13 | Reacción auditiva | Igual, pero con un pitido y la pantalla neutra (no delata la señal). Botón para probar el sonido, estimación del instante de salida con el reloj de audio y aviso sobre el retraso de los auriculares Bluetooth. |
| 14 | Test de puntería | 30 círculos de uno en uno, siempre lejos del anterior. Mide el tiempo medio por objetivo (el primero solo empieza), fallos, precisión y tiempo total. |
| 15 | Entrenador de puntería | Sesión de 30 o 60 s con tamaño grande, mediano o pequeño y dos modos: «Un objetivo» o «Que se encogen» (hasta tres a la vez que se esfuman). Aciertos, fallos, objetivos perdidos, precisión y aciertos por tramo. |
| 16 | Coordinación mano-ojo | Seguimiento de un círculo en movimiento durante 10, 20 o 30 s a tres velocidades. Porcentaje del tiempo dentro, mejor racha, distancia media y porcentaje por segundo. El recorrido cambia en cada intento. |
| 17 | APM (acciones por minuto) | Clics en la zona y pulsaciones de tecla durante 10 s, 30 s o 1 min. Desglose clics/teclas, teclas distintas y mejor tramo de 5 s. Ignora la repetición automática, Ctrl/Alt/Mayús/Tab/Esc y atajos con Ctrl. |

Cambios comunes: nuevo motor `TT.reaccion` y `TT.rangoMax` en `tests/base.js`, opción `factor` del motor de ritmo (APM = acciones/s × 60) y estilos de reacción en `tests/tests.css`.

## Pruebas

`pruebas/tests/reaccion-punteria.mjs` juega los seis en Chrome: intento anticipado, intentos con 200–250 ms de espera medidos, uso con teclado, pitido detectado con la zona sin cambiar de color, 30 aciertos y 1 fallo (97 %), sesión completa de ambos modos del entrenador (reloj acelerado ×6), seguimiento fiel (≥ 85 %) frente a quedarse en una esquina (< 40 %), y 20 teclas + 10 clics = 180 APM. Los seis pasan también la carga en escritorio y móvil con contraste. `comprobar`: 0 errores.

## A tener en cuenta

- **Reacción auditiva:** el retraso real de tus altavoces o auriculares no se puede conocer desde el navegador; sirve para comparar contigo en el mismo equipo.
- **Puntería, entrenador y coordinación** son para ratón o pantalla táctil (los círculos no se pueden pulsar con teclado); con el dedo los tiempos no son comparables con los del ratón.
- Todos son pasatiempos: no son pruebas médicas ni de aptitud, y no guardan nada.
