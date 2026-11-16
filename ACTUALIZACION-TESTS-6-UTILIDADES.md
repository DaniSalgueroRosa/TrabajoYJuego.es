# Actualización: sección Tests, grupo 6 «Utilidades» (tests 31 y 32) + base para los siguientes

Este zip trae **solo lo nuevo y lo cambiado** respecto a la entrega del grupo 5 (memoria y percepción). Instálalo **después** de ella.

## Dónde ponerlo

Descomprime el zip y copia las carpetas `trabajoyjuego-v2` y `vista-previa` **encima de las que ya tienes**, aceptando reemplazar los archivos que coincidan
(en Mac, mantén pulsada Opción y elige «Combinar»). Los tests nuevos van solos a su sitio: cada uno es una carpeta dentro de `tests/` y no hay que tocar nada más.
Después, `python3 sitio.py probar` para comprobar y `python3 sitio.py servir` para verlo.

## Los tests

| Orden | Test | Qué hace |
|---|---|---|
| 31 | Test de velocidad de internet | Mide la latencia (peticiones mínimas) y la velocidad de descarga (cuatro descargas a la vez de un archivo de prueba de 1 MiB de este mismo sitio, durante 5, 8 o 12 s, con tope de unos 120 MB). Resultado en Mbps con rango, gráfica de la velocidad a lo largo de la prueba, comparación con lo que piden la videollamada y el vídeo HD y 4K, latencia, variación, tiempo para bajar 1 GB y datos usados. |
| 32 | IA vs cuadros reales | Motor listo: diez imágenes por partida, «Cuadro real» o «Hecho con IA», ficha con autor/fuente/licencia/pista tras responder, resultado con aciertos por tipo y medidor. **Necesita tus imágenes** (ver `docs/TEST-IA-VS-CUADROS.md`); mientras tanto sale como «Próximamente». |

## Base nueva (la usan los grupos siguientes)

- Cuatro categorías nuevas en `tests/seccion.json`: Utilidades, Personalidad, Relaciones y Cultura pop.
- `tests/graficos.js` (`TT.graf`): barras, ejes opuestos, radar, triángulo, brújula, medidor, espectro, plano, línea y semanas de vida.
- `tests/cuestionario.js` (`TT.cuestionario` y `TT.lista`): preguntas una a una con barra de avance, botón «Anterior» y teclas 1-9, y listas de casillas.
- Estilos de todo lo anterior en `tests/tests.css`; el resultado admite un `titular` grande.

## Pruebas

`pruebas/tests/utilidades.mjs` juega el test de velocidad en Chrome: una medición real (localhost), una red simulada de 10 Mbps (sale 10 Mbps, 25 ms y «13 min 20 s» para 1 GB), un fallo de red, una cancelación y el móvil, y comprueba que todas las peticiones van al propio sitio. El motor de imágenes se probó con imágenes de prueba (10 rondas, 7 aciertos y 3 fallos contados bien, ficha, resultado y móvil) que luego se retiraron; la prueba vuelve a ejecutarse sola con tu banco cuando publiques el test. `probar`: 340 pruebas OK; `comprobar`: 261 páginas, 0 errores.

## A tener en cuenta

- **Velocidad de internet:** mide hasta este sitio, no hasta un servidor de mediciones; no mide la subida (un sitio estático no puede recibir datos) y gasta datos (tope de unos 120 MB, lo avisa en la página). Abierto como archivo suelto desde el disco no funciona (el navegador bloquea la petición): usa `ver-el-sitio` o el hosting.
- **Regla de «sin red»:** estos dos tests son los únicos que usan `fetch`, y solo con rutas relativas y sin caché; las pruebas lo vigilan. El resto sigue sin pedir nada.
- Se añade 1 MiB al proyecto por `prueba.bin` (bytes pseudoaleatorios).
- Los números 33 a 41 (inteligencia) y 51 no llegaron en el encargo; cuando los envíes entran con el mismo sistema.
