# Actualización: 10 juegos más (de 59 a 69) y interfaz visual en varios juegos

Este paquete **no es el proyecto entero**: solo trae lo que cambia respecto al `juegos.zip` anterior. Se descomprime **encima** de tu carpeta
`trabajoyjuego-v2/` (la ruta de cada archivo ya incluye `trabajoyjuego-v2/`) y, si el sistema pregunta, se aceptan los reemplazos.

## Los 10 juegos nuevos (orden 60 a 69)

| Orden | Juego | Categoría | Qué es |
|---|---|---|---|
| 60 | Quiz de fútbol | Cultura general | 10 preguntas (70 en el banco) de Mundiales, Eurocopas, Champions, clubes, ligas y estrellas |
| 61 | ¿Qué futbolista soy? | Cultura general | Cinco pistas de más difícil a más fácil (100, 80, 60, 40, 20 puntos); 33 futbolistas |
| 62 | Tanda de penaltis | Arcade | Chutas con barra de fuerza y paras de portero; cinco tiros cada uno y muerte súbita |
| 63 | Estadios de fútbol | Geografía | Ciudad de cada estadio y equipo que juega en él (56 estadios) |
| 64 | Reglas del fútbol | Cultura general | Preguntas sobre el reglamento, con la regla explicada en cada una |
| 65 | Hundir la flota | Lógica | Tablero 10×10 contra el ordenador (caza en ajedrez y sigue la línea del barco) |
| 66 | Nonogramas | Lógica | 5×5, 8×8 y 10×10 generados al momento y siempre resolubles por lógica |
| 67 | Reversi | Lógica | 8×8 contra el ordenador, tres niveles |
| 68 | Pilla al topo | Habilidad | 30 segundos, nueve agujeros, bombas que restan; teclas 1 a 9 |
| 69 | Raquetas | Arcade | Duelo de palas contra el ordenador a 7 puntos; ratón, dedo o teclado |

Se publican solos en el catálogo, el buscador, su categoría, el sitemap y la portada: no hay que registrar nada.

## Interfaz visual (cambios en juegos que ya tenías)

- **Una entre un millón → carrera.** Un coche de píxeles avanza por una pista con cada respuesta y la meta es la bandera de cuadros en los **700 puntos**
  (siete preguntas × 100). Para que 700 sea alcanzable en cualquier pregunta, la respuesta más rara que conoce el juego en cada una vale ahora los 100 completos y
  las demás puntúan en proporción (escala logarítmica). Los niveles se reescalan a 0/100/…/600. Si llegas a 700, el juego lo celebra con «¡Meta perfecta!».
- **Test de mecanografía → carrera.** Una vuelta a la pista por cada texto terminado.
- **Ruta de rondas** (un recuadro por ronda que se pinta de verde o rosa) en los juegos de rondas fijas: Cultura general, Quiz de ciencia, Quiz de historia, Banderas, Capitales, Provincias de España, ¿Quién soy?, Verdadero o falso y los cuatro quizes nuevos.
- **Reflejos:** semáforo de tres luces (solo acompaña; no anticipa el cambio). **Adivina el número:** recta numérica que se estrecha con cada intento.
- Todo con movimiento a saltos de píxel, respetando `prefers-reduced-motion`, con texto equivalente para lectores de pantalla y sin imágenes externas.

## Otros cambios

- `juegos/juegos.js` (nuevas piezas `TYJ.carrera` y `TYJ.etapas`), `juegos/componentes.css` (sus estilos) y `juegos/rondas.js` (opción `ruta: true`).
- **Inundación:** el color que ya tiene la zona inundada se marcaba con transparencia y el número perdía contraste; ahora se marca con rayas claras.
- `pruebas/test_juegos_datos.py` (ahora vigila los 69 juegos y los datos de fútbol), `pruebas/juegos/humo.mjs` (arranque de los 69 en móvil, tablet y escritorio) y un guion nuevo,
  `pruebas/juegos/futbol-y-variados.mjs`, que juega los 10 juegos nuevos enteros en Chrome real. `pruebas/juegos/una-entre-un-millon.mjs` y el de mecanografía se adaptan a la carrera.
- `docs/JUEGOS.md` (tabla de los 69, interfaz, cómo añadir preguntas, futbolistas y estadios), y las cifras en `LEEME.md`, `docs/PENDIENTES.md` y `docs/PUBLICAR.md`.

## Cómo comprobarlo

```
python3 sitio.py construir
python3 sitio.py comprobar            # 0 errores; siguen los dos avisos de siempre (preproducción y datos del titular)
python3 sitio.py probar               # pruebas automáticas
python3 sitio.py probar --navegador   # partidas reales en Chrome
```

## Lo que conviene saber

- **Datos de fútbol:** comprobados con fuentes públicas y vigentes **hasta julio de 2026** (incluidos el Mundial 2026 y la Champions 2025-26). Cambian: conviene repasar el Quiz de fútbol y «¿Qué futbolista soy?» cada temporada.
  Se amplían editando `quiz-de-futbol/preguntas.json`, `que-futbolista-soy/futbolistas.json`, `estadios-de-futbol/estadios.json` y `reglas-del-futbol/preguntas.json` (la estructura está en la clave `_nota` de cada uno y en `docs/JUEGOS.md`).
- **Sin escudos, logotipos ni fotos** de clubes o jugadores: solo texto.
- Como siempre, ningún juego guarda nada en el dispositivo ni llama a servidores externos (lo vigila `pruebas/test_juegos_datos.py`).
