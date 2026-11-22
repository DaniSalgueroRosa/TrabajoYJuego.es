# Actualización: «Una entre un millón» rehecho y 12 juegos de fútbol más (de 69 a 81)

Este paquete **no es el proyecto entero**: solo trae lo que cambia respecto al paquete anterior. Se descomprime **encima** de tu carpeta
`trabajoyjuego-v2/` (la ruta de cada archivo ya incluye `trabajoyjuego-v2/`) y, si el sistema pregunta, se aceptan los reemplazos.

## Una entre un millón

- **Segunda oportunidad.** Si lo que escribes **no está registrado** (y no se ha acabado el tiempo), el juego te deja **probar otra respuesta** con 15 segundos nuevos.
  Si la usas, esa ronda suma **10 puntos seguros como mínimo**: si la nueva respuesta sí está registrada y vale más de 10, se queda con lo que valga.
  No hay segunda oportunidad al agotar el tiempo ni al pasar, y no se puede repetir la misma respuesta.
- **Cambio de interfaz.** Sigue siendo retro, pero mucho más trabajado: una carrera nocturna dibujada en un lienzo (cielo con estrellas, montes, carretera en perspectiva,
  coche con faros, confeti en la meta) y un marcador de rodillo. Sin imágenes externas, con texto equivalente para lectores de pantalla y respetando `prefers-reduced-motion`.
- Si prefieres que los 10 puntos **se sumen encima** de lo normal en vez de ser un mínimo, es un cambio de una línea: la constante `BONO_OTRA` y la línea de `registrar`
  en `juegos/una-entre-un-millon/app.js`.

## Los 12 juegos nuevos (orden 70 a 81)

Diez de cultura y de adivinar:

| # | Juego | Qué haces |
|---|---|---|
| 70 | Adivina el once | Escribes los apellidos de los once titulares de una final y se destapan en su sitio del campo |
| 71 | Futbolista oculto | Averiguas un futbolista secreto en ocho intentos con una tabla de pistas |
| 72 | Camino de clubes | Dices quién es por la cadena de clubes de su carrera |
| 73 | Apodos de clubes | Eliges a qué club pertenece cada mote |
| 74 | Balón de Oro | Ganadores y número de premios de 1956 a 2025 |
| 75 | Goleadores históricos | Pichichi y Bota de Oro del Mundial: quién y cuántos goles |
| 76 | Entrenador campeón | Los técnicos de las 34 Ligas de Campeones desde 1992-93 |
| 77 | El intruso del fútbol | Cuatro futbolistas, uno no encaja en el grupo |
| 78 | ¿De qué país es el club? | País o ciudad de más de cien clubes |
| 79 | Ahorcado de fútbol | Palabras de fútbol con categoría y seis goles que encajar |

Y dos para jugar, en lienzo de píxeles:

| # | Juego | Qué haces |
|---|---|---|
| 80 | Tiro libre | Cinco faltas: fijas dirección, altura y potencia contra una barrera y un portero |
| 81 | Regates | Esquivas defensas que bajan por cinco carriles; tres vidas y el campo se acelera |

Todos con su ficha, texto propio para buscadores (cada texto se contrastó con los datos y las reglas reales del juego), datos en JSON dentro de su carpeta
(con una clave `_nota` que explica la estructura) y sin guardar nada en el dispositivo. Solo texto y dibujo: sin escudos, logotipos ni fotografías.

## Otros cambios

- `pruebas/test_juegos_datos.py` (vigila los 81 juegos y que los datos nuevos no tengan respuestas ambiguas: apodos repetidos, alias de dos futbolistas, cadenas de clubes iguales…),
  `pruebas/juegos/humo.mjs` (arranque de los 81) y un guion nuevo, `pruebas/juegos/futbol-2.mjs`, que juega los 12 juegos enteros en Chrome real.
  `pruebas/juegos/una-entre-un-millon.mjs` se reescribe para la carrera y la segunda oportunidad.
- `docs/JUEGOS.md` (tabla de los 81, cómo añadir datos a los nuevos), y las cifras en `LEEME.md`, `docs/PENDIENTES.md` y `docs/PUBLICAR.md`.

## Qué conviene saber

- Los datos de fútbol llegan hasta 2026 (Mundial 2026 y Champions 2025-26 incluidos). El palmarés de los futbolistas en activo y las carreras de clubes cambian cada temporada.
- Se han descartado a propósito los datos dudosos o ambiguos (un apodo de dos clubes, españoles en activo en «Futbolista oculto», alineaciones de las que no había certeza).
- Todo se ha probado en Chrome; no en Safari ni Firefox.

## Cómo comprobarlo

```
python3 sitio.py construir
python3 sitio.py comprobar            # 0 errores; siguen los dos avisos de siempre (preproducción y datos del titular)
python3 sitio.py probar               # pruebas automáticas
python3 sitio.py probar --navegador   # partidas reales en Chrome
```
