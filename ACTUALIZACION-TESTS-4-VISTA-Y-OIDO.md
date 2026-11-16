# Actualización: sección Tests, grupo 4 «Vista y oído» (6 tests)

Este zip trae **solo lo nuevo y lo cambiado** respecto a la entrega del grupo 3 (reacción y puntería). Instálalo **después** de ella.

## Cómo instalarlo

Descomprímelo y copia `trabajoyjuego-v2` y `vista-previa` encima de las que ya tienes, aceptando reemplazar los archivos que coincidan (en Mac, mantén pulsada Opción y elige «Combinar»).

## Los tests

| Orden | Test | Qué hace |
|---|---|---|
| 18 | Diferenciación de colores | 60 s: en cada cuadrícula (de 2×2 a 8×8) una casilla es algo más clara u oscura. Cada acierto sube de nivel y reduce la diferencia (de 22 a 0,7 puntos de luminosidad); cada fallo resta 3 s. Nivel, fallos, diferencia más fina y aciertos por tramo. |
| 19 | Tono de color | Ordenar fichas de un degradado de tono entre dos extremos fijos (8, 12 o 16 fichas) tocando dos para intercambiarlas. Fichas bien colocadas, error total, movimientos, tiempo y comparación con el orden correcto. |
| 20 | Sensibilidad a los colores | Tres series (rojo, verde, azul) de cuatro cuadros, uno con más saturación. Método escalonado (dos aciertos bajan la diferencia, un fallo la sube) y umbral medio de los puntos de inversión. |
| 21 | Visión del color | Ocho láminas de puntos generadas al azar (una de control y siete de parejas rojo-verde) con un número de dos cifras escondido. Pasatiempo, con aviso explícito de que no es un diagnóstico. |
| 22 | Prueba de audición (edad auditiva) | Tonos de 8 a 20 kHz a volumen bajo, con botón de prueba de volumen, 1–2 silencios de control y fin tras dos «no» seguidos. Techo en kHz y rango de edad orientativo con aviso de límites del equipo. |
| 23 | Test de ritmo | 4 pitidos de cuenta, 8 pulsos con pitido y 8 sin pitido, a 60, 90 o 120 ppm. Irregularidad (desviación típica), desfase medio, tempo mantenido sin pitido y variación entre pulsos. |

Cambio de carpeta: el test 22 vive en `tests/prueba-de-audicion-edad-auditiva/` (el slug previsto en el encargo).

## Pruebas

`pruebas/tests/vista-oido.mjs` juega los seis en Chrome: cuadrículas de 2×2 a 8×8 con el reloj acelerado, resolución completa del degradado, tres estrategias de la escalera de sensibilidad (siempre bien, siempre mal y alternando), láminas respondidas con aciertos, blancos y errores, la prueba de audición con pitidos contados (techo de 16 kHz y caso de falso positivo en un silencio) y el test de ritmo a 120 ppm (12 pitidos, 8 de 8 emparejados, 120 ppm sin pitido) más el caso sin pulsaciones. Los 23 tests pasan la carga en escritorio y móvil con contraste. `comprobar`: 0 errores.

## A tener en cuenta

- **Visión del color y Prueba de audición** no son pruebas médicas ni de diagnóstico, y la página lo dice de forma visible. Las láminas se generan con código y no copian ninguna lámina real. En la audición el volumen es bajo a propósito y la página pide no subirlo.
- La **edad auditiva** es una correspondencia aproximada entre el techo en kHz y rangos de edad habituales; el equipo (altavoces, Bluetooth) puede ser el límite real.
- **Sensibilidad a los colores** es una interpretación del título (umbral de saturación por color) para distinguirla de la diferenciación (luminosidad) y del tono (matiz).
- **Test de ritmo:** necesita sonido; la irregularidad no depende del retraso del equipo, pero el desfase medio sí.
- Todos son pasatiempos y no guardan nada.
