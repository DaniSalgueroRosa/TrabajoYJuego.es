# Actualización: sección Tests, grupo 2 «Ratón y teclado» (6 tests)

Este zip trae **solo lo nuevo y lo cambiado** respecto a la entrega del grupo 1 (velocidad y clics). Instálalo **después** de ella.

## Cómo instalarlo

Descomprímelo y copia `trabajoyjuego-v2` y `vista-previa` encima de las que ya tienes, aceptando reemplazar los archivos que coincidan (en Mac, mantén pulsada Opción y elige «Combinar»).

## Los tests

| Orden | Test | Qué hace |
|---|---|---|
| 6 | Prueba del mouse | Dibuja un ratón que se enciende al usar el botón izquierdo, derecho, central, los dos laterales y la rueda (arriba y abajo). Cuenta cada pulsación y avisa de dobles clics sospechosos (dos pulsaciones del mismo botón en menos de 40 ms). |
| 7 | Polling rate del mouse | Estima la frecuencia de sondeo a partir de los intervalos entre eventos sin agrupar (`pointerrawupdate`). Compara con 125, 250, 500, 1000, 2000, 4000 y 8000 Hz. Si el navegador solo da un evento por fotograma, lo dice y no inventa la cifra. |
| 8 | Test de scroll del mouse | Pasos de rueda por segundo en 5, 10 o 15 s, con modo de un solo sentido, pasos en sentido contrario, cambios de sentido y detección de rueda con pasos o suave. |
| 9 | Giros de ratón | Mide el ángulo del cursor alrededor del centro: vueltas completas, vueltas por segundo, sentido y regularidad del círculo. Mover el cursor de lado a lado no suma. |
| 10 | Arrastrar y hacer clic | Drag click: CPS más ráfagas (3 o más clics con menos de 70 ms entre ellos), ráfaga más larga y mejor medio segundo. |
| 11 | Test de tipeo (PPM) | Textos en español (36 frases originales), 15 s a 2 min, con o sin tildes, PPM netas y brutas, precisión y errores. Pegar está bloqueado y el texto se amplía solo. |

## Pruebas

`pruebas/tests/raton-teclado.mjs` juega los seis en Chrome: clics y eventos de rueda simulados, muestras de polling a 1 ms, 2 ms y 8 ms (resultado 1000, 500 y 125 Hz), tres vueltas horarias y dos antihorarias, una ráfaga de 30 clics y escritura real con un error. Los seis pasan además la prueba de carga en escritorio y móvil con contraste. `comprobar`: 0 errores.

## A tener en cuenta

- **Polling rate:** el navegador limita lo que se puede medir. Solo Chrome y Edge entregan los eventos sin agrupar; en otros navegadores la cifra sería la de la pantalla, y el test lo avisa. La resolución del reloj hace poco fiable distinguir 4000 de 8000 Hz.
- **Prueba del mouse:** los botones laterales pueden hacer navegar al navegador antes de que la página los bloquee; la página lo explica.
- **Giros de ratón** y **Arrastrar y hacer clic** son interpretaciones de los títulos del encargo (círculos con el cursor y la técnica de drag click). Si pensabas en otra mecánica, dímelo.
- Son tests de entretenimiento: miden tu ritmo con tu ratón, tu teclado y tu navegador, y no guardan nada.
