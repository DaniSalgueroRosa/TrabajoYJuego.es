# Actualización: sección Tests, grupo 1 «Velocidad y clics» (5 tests)

Este zip trae **solo lo nuevo y lo cambiado** respecto a la entrega de las 6 herramientas. Con él la sección Tests deja de estar vacía: tiene listado con buscador, cinco categorías y los cinco primeros tests.

## Cómo instalarlo

Descomprímelo y copia `trabajoyjuego-v2` y `vista-previa` encima de las que ya tienes, aceptando reemplazar los archivos que coincidan (en Mac, mantén pulsada Opción y elige «Combinar»). Instálalo **después** de los zips anteriores.

## Qué hay

| Orden | Test | Qué mide |
|---|---|---|
| 1 | Test de velocidad de cliqueo (CPS) | Clics por segundo en 1, 2, 5, 10, 15, 30 o 60 s, con rango, mejor segundo, intervalo medio y gráfico por tramos. |
| 2 | Click Jitter | CPS más caída de ritmo (primera y segunda mitad), regularidad y pausa más larga. |
| 3 | Click de Kohi | 10 s fijos, CPS en vivo de los últimos 2 s y nueve rangos propios (Aprendiz a General). |
| 4 | CPS con clic derecho | Cuenta solo el botón derecho (evento de menú contextual, bloqueado dentro de la zona) y anota los clics izquierdos ignorados. |
| 5 | Prueba de la barra espaciadora | Pulsaciones reales por segundo; descarta la repetición automática y separa teclas de toques. |

## Qué cambia en el sitio

- `tests/seccion.json`: buscador, agrupación y las cinco categorías definitivas (Velocidad y clics, Ratón y teclado, Reacción y puntería, Vista y oído, Memoria y percepción). Las otras cuatro aparecerán en el listado cuando tengan tests.
- `tests/listado.html` y `tests/tests.css`: listado agrupado con buscador y el «kit» de estilos `.tt-` (zona de prueba, chips, botones, cifras en vivo, resultado, barras, texto para buscadores). Cada categoría tiene su sello visual.
- `tests/base.js`: librería común `TT` (estadística, chips, resultado con «Copiar resultado», audio, y `TT.ritmo`, el motor de cronometraje de pulsaciones que también usarán los tests de scroll, drag click y APM).
- Pruebas: `pruebas/test_tests_datos.py` (ficha, orden, texto SEO, ninguna escritura en el dispositivo, cálculos de `base.js` ejecutados con Node), `pruebas/tests/humo.mjs` (todos los tests en escritorio y móvil, con contraste) y `pruebas/tests/velocidad-clics.mjs` (los cinco se juegan de verdad en Chrome). `pruebas/todo.py`, `pruebas/ejemplos.py` y `pruebas/test_carpetas.py` se adaptan a que Tests ahora tiene categorías.

## A tener en cuenta

- Son tests de entretenimiento: miden tu ritmo en tu navegador, con tu ratón o teclado y tu pantalla. Una pantalla táctil, el ahorro de energía o el propio navegador pueden limitar la rapidez con que se detectan pulsaciones seguidas.
- «Click de Kohi» toma el nombre del formato popular de diez segundos; los nueve rangos son propios y la página lo dice. No hay relación con ese servidor.
- Los rangos de cada test (animales, grados…) son una escala nuestra y orientativa.
- Los colores de cada test están en su `ficha.json` (`tema`). Nada se guarda en el navegador ni se pide a ninguna red.
