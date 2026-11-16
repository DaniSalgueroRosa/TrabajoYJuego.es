# Actualización: 30 juegos más (de 20 a 50)

Este paquete **no es el proyecto entero**: solo trae lo que cambia respecto al `juegos.zip` anterior. Se descomprime **encima** de tu carpeta
`trabajoyjuego-v2/` (la ruta de cada archivo ya incluye `trabajoyjuego-v2/`) y, si el sistema pregunta, se aceptan los reemplazos.

## Qué contiene

- **30 carpetas nuevas** en `juegos/` (juegos 21 a 50). Cada una es autónoma, como las demás: `ficha.json`, `pagina.html`, `app.js` y, si lo necesita, `app.css` y datos en JSON.
  Se publican solas en el catálogo, el buscador, su categoría, el sitemap y el índice de la portada; no hay que registrar nada.
- **Cambios en archivos que ya tenías (9):**
  - `juegos/palabra-infinita/ficha.json` y `pagina.html`: el SEO ahora dice **«Palabra Infinita: juego tipo Wordle en español»**, con la aclaración de que Wordle es marca de The New York Times Company y de que el juego no tiene relación con ella.
  - `juegos/rondas.js`: nueva opción `exacta: true` para respuestas escritas sin perdonar erratas (la usa «Anagramas»). Los demás juegos no cambian.
  - `pruebas/test_juegos_datos.py`, `pruebas/test_portada.py`, `pruebas/portada.mjs`, `pruebas/juegos/humo.mjs`: dejan de tener «20» fijado y cuentan los 50 juegos; el primero añade pruebas de los datos nuevos.
  - `docs/JUEGOS.md` (tabla con los 50 juegos y los archivos de datos nuevos) y `LEEME.md` (cifras).
- **11 guiones de prueba nuevos** en `pruebas/juegos/` que juegan cada juego nuevo en un Chrome real.

## Los 30 juegos nuevos

| Orden | Juego | Categoría |
|---|---|---|
| 21–30 | Sudoku, Buscaminas, Banderas, Serpiente, Ahorcado, Tres en raya, Cuatro en raya, Capitales, Test de clics, Parejas | Lógica, Geografía, Arcade, Palabras, Habilidad, Memoria |
| 31–40 | Bloques que caen (tipo Tetris), Ladrillos, Repite la secuencia (tipo Simon), Recuerda el número, Anagramas, Sopa de letras, Torre de Hanoi, Apaga las luces, Puzle deslizante, Código secreto | Arcade, Memoria, Palabras, Lógica |
| 41–50 | Las cifras, Test de mecanografía, Tablas de multiplicar, Provincias de España, Verdadero o falso, Quiz de ciencia, Quiz de historia, Refranes, Faltas de ortografía, Sinónimos y antónimos | Matemáticas, Habilidad, Geografía, Cultura general, Palabras |

## Cómo comprobarlo

```
python3 sitio.py construir
python3 sitio.py comprobar            # 0 errores; siguen los dos avisos de siempre (preproducción y datos del titular)
python3 sitio.py probar               # pruebas automáticas
python3 sitio.py probar --navegador   # además juega los 50 juegos en Chrome (necesita Chrome y Node 22; tarda varios minutos)
```

## Lo que conviene saber

- **Ningún juego guarda nada** en el dispositivo (ni `localStorage`, ni cookies, ni nada parecido): una prueba automática lo vigila en los 50.
- Los textos de cada juego para buscadores son originales y las pruebas comprueban que ninguna frase larga se repite entre juegos.
- **Nombres de terceros.** «Wordle», «Tetris» y «Simon» solo aparecen de forma descriptiva («tipo Wordle», «tipo Tetris») y con aviso de que no hay relación con sus titulares. Convendría que lo revises con tu asesor antes de publicar.
- Las preguntas, refranes, datos de provincias y banderas se han escrito y revisado para este sitio, pero pueden contener algún error de hecho: el enlace de contacto sirve para avisar.
- `INSTALACION-JUEGOS.md` y otros documentos antiguos siguen hablando de «20 juegos»; no afecta al funcionamiento. `docs/JUEGOS.md` sí está al día.
