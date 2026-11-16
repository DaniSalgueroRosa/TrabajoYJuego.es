# Los 69 juegos

Todos viven en `juegos/<nombre>/` y se publican en `/juegos/<nombre>/`. Cada juego es una carpeta con su ficha, su página, su código y sus datos.
**Ninguno guarda nada** en el dispositivo (ni `localStorage`, `sessionStorage`, `IndexedDB`, cookies ni cachés): las partidas, las rachas y las puntuaciones
viven en la memoria de la pestaña y desaparecen al recargar. Una prueba automática lo vigila (`pruebas/test_juegos_datos.py`).

Orden de publicación: 1–50 son los del encargo inicial, 51–59 los nueve juegos sueltos que vinieron después y 60–69 la tanda de **cinco de fútbol y cinco variados**.

| # | Carpeta | Categoría | Dificultad | Datos (`juegos/<carpeta>/`) | Cómo funciona |
|---|---|---|---|---|---|
| 1 | `palabra-infinita` | Palabras | Media | `juegos/datos/palabras.json` | Tipo Wordle, de 4 a 7 letras, 6 intentos, partidas ilimitadas, teclado en pantalla y físico, letras repetidas bien evaluadas |
| 2 | `una-entre-un-millon` | Cultura general | Media | `preguntas.json` | Siete preguntas «nombra un…»: cuanto más rara la respuesta, más puntos. Es una **carrera**: el coche avanza con cada respuesta y la meta son los **700 puntos** (siete aciertos de la respuesta más rara de cada pregunta). Tolera acentos y erratas |
| 3 | `conexiones` | Lógica | Media | `puzzles.json` | 16 palabras, 4 grupos, 4 errores permitidos, aviso de «casi» y de combinación repetida |
| 4 | `que-palabra-soy` | Palabras | Media | `palabras.json` | Adivina la palabra por su descripción, con pistas |
| 5 | `el-intruso` | Lógica | Fácil | `conjuntos.json` | Encuentra la palabra que no pertenece al grupo |
| 6 | `mente-matematica` | Matemáticas | Media | (se genera) | 10 operaciones de cálculo mental con dificultad creciente, 20 s cada una; se generan al azar y los resultados son exactos |
| 7 | `quien-soy` | Cultura general | Media | `personajes.json` | Cinco pistas de más difícil a más fácil: cada pista extra resta 20 puntos (100, 80, 60, 40, 20); 8 rondas de 45 s |
| 8 | `memoria-visual` | Memoria | Media | (se genera) | Memoriza casillas iluminadas y repítelas; el tablero crece con el nivel; 3 vidas |
| 9 | `acertijos` | Lógica | Media | `acertijos.json` | Acertijo del día (el mismo para todos ese día) o modo sin fin; pistas y 3 intentos |
| 10 | `mayor-menor` | Geografía | Fácil | `datos.json` | Compara población, altitud, longitud de ríos y fechas; 2 vidas |
| 11 | `cultura-general` | Cultura general | Fácil | `preguntas.json` | Test de 10 preguntas con 4 opciones y explicación |
| 12 | `donde-esta` | Geografía | Media | `lugares.json`, `mapa.json` | Sitúa 8 lugares en un mapa dibujado por el propio juego; puntúa por distancia; se juega con ratón, dedo o teclado |
| 13 | `palabras-encadenadas` | Palabras | Media | `juegos/datos/palabras.json` | Contra el ordenador: cada palabra empieza por la última letra de la anterior; el tiempo baja |
| 14 | `velocidad-mental` | Matemáticas | Media | (se genera) | Un minuto y tres vidas: cada operación ya viene resuelta y hay que decir si es verdadera o falsa |
| 15 | `detecta-el-patron` | Lógica | Difícil | (se genera) | Series de números y letras con una regla: elige el siguiente entre 4 opciones; 10 rondas de 25 s |
| 16 | `el-impostor` | Lógica | Media | `afirmaciones.json` | Tres afirmaciones verdaderas y una falsa: descubre la falsa; 10 rondas de 25 s |
| 17 | `ordena-la-historia` | Lógica | Media | `cronologias.json` | Ordena 5 hechos por fecha, 6 rondas |
| 18 | `reflejos` | Habilidad | Fácil | (ninguno) | Mide tu tiempo de reacción en 5 intentos; las salidas en falso restan |
| 19 | `2048` | Arcade | Media | (ninguno) | El clásico; flechas, WASD, deslizar o botones en pantalla |
| 20 | `el-superviviente` | Arcade | Difícil | (ninguno) | Esquiva bloques que caen cada vez más rápido y recoge estrellas en un `<canvas>`; 3 vidas; se pausa si cambias de pestaña |
| 21 | `sudoku` | Lógica | Difícil | (ninguno) | Sudoku online sin registrarte: tres niveles, notas a lápiz, pistas y comprobación. Cada tablero es nuevo y tiene una única solución. |
| 22 | `buscaminas` | Lógica | Media | (ninguno) | Despeja el campo sin pisar ninguna mina. Tres tamaños, banderas, primera casilla siempre segura y juego con teclado, ratón o dedo. |
| 23 | `banderas` | Geografía | Media | `banderas.json` | Adivina de qué país es cada bandera entre cuatro opciones. Diez rondas con banderas dibujadas, descripción para lectores de pantalla y repaso. |
| 24 | `serpiente` | Arcade | Media | (ninguno) | Guía a la serpiente para comer sin chocar con los muros ni con tu propia cola. Con muros o sin ellos, controles táctiles y de teclado. |
| 25 | `ahorcado` | Palabras | Fácil | `juegos/datos/palabras.json` | Adivina la palabra letra a letra antes de que se complete el dibujo. Palabras de 5, 6 o 7 letras, teclado con Ñ y pista opcional. |
| 26 | `tres-en-raya` | Lógica | Fácil | (ninguno) | Juega al tres en raya contra la máquina en nivel fácil o difícil, o con un amigo en el mismo dispositivo. Elige quién empieza. |
| 27 | `cuatro-en-raya` | Lógica | Media | (ninguno) | Suelta fichas en un tablero de 7×6 y alinea cuatro antes que tu rival. Tres niveles de máquina o dos jugadores, con teclas del 1 al 7. |
| 28 | `capitales` | Geografía | Media | `paises.json` | Pon a prueba tus capitales: 10 preguntas de cuatro respuestas sobre más de 100 países de Europa, América, Asia, África y Oceanía. |
| 29 | `test-de-clics` | Habilidad | Fácil | (ninguno) | Mide tus clics por segundo en 5, 10 o 30 segundos. Funciona con ratón, dedo o teclado y te da un nivel al terminar. |
| 30 | `parejas` | Memoria | Fácil | (ninguno) | Da la vuelta a las cartas de dos en dos y encuentra todas las parejas. Tres tamaños de tablero, figuras con forma y color propios. |
| 31 | `bloques-que-caen` | Arcade | Media | (ninguno) | Juego de bloques tipo Tetris, gratis y sin registro: gira y encaja piezas, completa líneas, sube de nivel y juega con teclado o con el dedo. |
| 32 | `ladrillos` | Arcade | Media | (ninguno) | Rompe el muro de ladrillos rebotando la bola con la pala. Tres vidas, niveles cada vez más rápidos y control con ratón, dedo o teclado. |
| 33 | `repite-la-secuencia` | Memoria | Media | (ninguno) | Entrena la memoria repitiendo secuencias de colores que crecen en cada ronda. Con sonido opcional, tres velocidades y juego con teclado. |
| 34 | `recuerda-el-numero` | Memoria | Media | (ninguno) | Memoriza un número durante unos segundos y escríbelo de memoria. Cada acierto añade una cifra. Tres vidas y tres velocidades. |
| 35 | `anagramas` | Palabras | Media | `juegos/datos/palabras.json` | Juego de anagramas en español: ordena las letras desordenadas y escribe la palabra. Diez rondas de 4 a 7 letras con tiempo y puntos. |
| 36 | `sopa-de-letras` | Palabras | Fácil | `temas.json` | Encuentra las palabras escondidas en la sopa de letras: nueve temas, tres tamaños, pistas y juego táctil, con ratón o con teclado. |
| 37 | `torre-de-hanoi` | Lógica | Media | (ninguno) | Resuelve la Torre de Hanói con 3 a 7 discos: mueve la pila de una torre a otra sin poner un disco grande sobre uno pequeño. Con pista y deshacer. |
| 38 | `apaga-las-luces` | Lógica | Difícil | (ninguno) | Puzle de lógica: cada pulsación cambia una luz y sus vecinas, y tienes que dejarlas todas apagadas. Tres tamaños y pista calculada. |
| 39 | `puzle-deslizante` | Lógica | Media | (ninguno) | Ordena las fichas deslizándolas hacia el hueco, del 1 en adelante. Tamaños de 3×3, 4×4 y 5×5, siempre con solución y con teclado o pantalla táctil. |
| 40 | `codigo-secreto` | Lógica | Media | (ninguno) | Descifra la combinación de colores escondida con las pistas de cada intento. Tres niveles, símbolos para cada color y juego con teclado. |
| 41 | `las-cifras` | Matemáticas | Difícil | (ninguno) | Juego de números: combina seis cifras con sumas, restas, multiplicaciones y divisiones para llegar a un objetivo de tres cifras. Tres rondas con tiempo. |
| 42 | `test-de-mecanografia` | Habilidad | Media | `textos.json` | Test de mecanografía en español: copia textos de 30, 60 o 120 segundos y mide tus palabras por minuto y tu precisión. Con o sin tildes. Sin registro. |
| 43 | `tablas-de-multiplicar` | Matemáticas | Fácil | (ninguno) | Practica las tablas de multiplicar del 1 al 10: elige las tablas, haz el reto de 60 segundos o la práctica de 20 preguntas y repasa tus fallos. |
| 44 | `provincias-de-espana` | Geografía | Media | `provincias.json` | Quiz de las 50 provincias de España: comunidad autónoma de cada provincia, capitales y provincias de cada comunidad. Diez rondas con tiempo y puntos. |
| 45 | `verdadero-o-falso` | Cultura general | Fácil | `afirmaciones.json` | Juego de verdadero o falso con mitos y curiosidades de ciencia, animales, geografía, historia y lengua. Quince afirmaciones por partida con tiempo. |
| 46 | `quiz-de-ciencia` | Cultura general | Media | `preguntas.json` | Quiz de ciencia en español con 65 preguntas de física, química, biología y ciencias de la Tierra. Diez preguntas por partida con tiempo y puntos. |
| 47 | `quiz-de-historia` | Cultura general | Media | `preguntas.json` | Quiz de historia en español: 65 preguntas sobre Egipto, Grecia, Roma, la Edad Media, los descubrimientos, España y el siglo XX. Con tiempo y puntos. |
| 48 | `refranes` | Palabras | Fácil | `refranes.json` | Juego de refranes en español: completa cada refrán con el final correcto entre cuatro opciones y descubre su significado. Diez rondas con puntos. |
| 49 | `faltas-de-ortografia` | Palabras | Media | `preguntas.json` | Test de ortografía en español: elige la palabra bien escrita o completa la frase con la forma correcta (haber, a ver, porque, tilde). Diez rondas. |
| 50 | `sinonimos-y-antonimos` | Palabras | Fácil | `palabras.json` | Quiz de sinónimos y antónimos en español: elige la palabra que significa lo mismo o lo contrario. Diez rondas con tiempo, puntos y repaso final. |
| 51 | `piedra-papel-o-tijera` | Habilidad | Fácil | — | Contra la máquina al mejor de 3, 5 o 7 rondas, con historial de rondas |
| 52 | `adivina-el-numero` | Matemáticas | Fácil | — | Pistas «más alto» o «más bajo»; tres rangos (50, 100 y 1000) y una **recta numérica** que se estrecha con cada intento |
| 53 | `juego-del-nim` | Lógica | Media | — | Palillos contra la máquina: quitas 1, 2 o 3 por turno; quien se lleva el último pierde |
| 54 | `tabla-de-schulte` | Habilidad | Media | — | Pulsa los números del 1 al 25 en orden lo más rápido posible |
| 55 | `inundacion` | Lógica | Media | — | Cambia el color de la esquina para absorber todo el tablero en pocos movimientos |
| 56 | `laberinto` | Arcade | Fácil | — | Laberinto distinto en cada partida: de una esquina a la opuesta |
| 57 | `el-24` | Matemáticas | Media | — | Combina cuatro números con las cuatro operaciones hasta obtener 24 |
| 58 | `ordena-los-frascos` | Lógica | Media | — | Vierte colores de un frasco a otro hasta dejar un solo color en cada uno |
| 59 | `encuentra-el-color` | Habilidad | Media | — | Encuentra la casilla de otro tono en una cuadrícula que crece |
| 60 | `quiz-de-futbol` | Cultura general | Media | `preguntas.json` | Diez preguntas de Mundiales, Eurocopas, Champions, clubes, ligas y estrellas; 20 s cada una y **ruta de rondas** |
| 61 | `que-futbolista-soy` | Cultura general | Media | `futbolistas.json` | Cinco pistas de más difícil a más fácil (100, 80, 60, 40, 20 puntos); acepta apellido, nombre completo o apodo; 8 rondas de 45 s |
| 62 | `tanda-de-penaltis` | Arcade | Media | — | Tanda de cinco penaltis contra el ordenador, con muerte súbita: eliges la zona y la fuerza (barra) al chutar y te lanzas de portero cuando chuta el rival. Portería, portero y balón de píxeles |
| 63 | `estadios-de-futbol` | Geografía | Media | `estadios.json` | Diez preguntas: en qué ciudad está un estadio y qué equipo juega en él; 15 s cada una |
| 64 | `reglas-del-futbol` | Cultura general | Media | `preguntas.json` | Diez preguntas sobre el reglamento (fuera de juego, faltas, tarjetas, penaltis, saques…) con explicación de cada regla |
| 65 | `hundir-la-flota` | Lógica | Media | — | Tablero de 10×10 y cinco barcos (5, 4, 3, 3, 2) contra el ordenador, que caza en tablero de ajedrez y luego sigue la línea del barco. 100 puntos por el mínimo (17 disparos), −1 por disparo extra |
| 66 | `nonogramas` | Lógica | Media | — | Nonogramas 5×5, 8×8 y 10×10 generados al momento; un resolutor interno comprueba que cada uno se resuelve **por lógica, sin adivinar**. 10 puntos por casilla − 2 por segundo − 50 por ayuda |
| 67 | `reversi` | Lógica | Difícil | — | Reversi 8×8 contra el ordenador, con tres niveles (azar, esquinas y voltear mucho, y búsqueda a cuatro jugadas). Pasa turno solo; muestra las jugadas posibles |
| 68 | `pilla-al-topo` | Habilidad | Fácil | — | 30 segundos, nueve agujeros: topos +10, bombas −15, agujero vacío −3; teclas 1 a 9 |
| 69 | `raquetas` | Arcade | Media | — | Duelo de palas contra el ordenador a 7 puntos; ratón, dedo, flechas o botones; la bola acelera con cada golpe; tres niveles |

Cada juego trae: ficha, pantalla de inicio con instrucciones, puntuación, repetición inmediata, botón de compartir cuando tiene sentido, botón «Volver a todos los juegos»,
y un texto original para buscadores (cómo se juega, puntuación, consejos, un apartado propio y preguntas frecuentes).

## Lo que conviene saber de la calidad del contenido (límites honestos)

- **Palabras (juegos 1, 4 y 13).** La lista de `juegos/datos/palabras.json` (3 060 palabras de 4 a 7 letras) está elaborada a mano para este proyecto.
  **No es el diccionario de la RAE** y puede faltarle alguna palabra válida o incluir alguna dudosa. Si alguien escribe una palabra real que no figura,
  el juego avisa de que «no está en mi lista» y deja usarla igualmente pulsando Intro otra vez. Ampliarla es añadir palabras (ver abajo).
- **Una entre un millón.** Las frecuencias («1 de cada n personas») son una **estimación editorial**, no de una encuesta; así lo dice el propio juego.
- **Mayor o menor.** Las cifras (población, altitudes, longitudes) son aproximadas y redondeadas; el juego evita comparar valores casi iguales.
- **¿Dónde está?** El mapa es un **dibujo esquemático** hecho para el juego (precisión de unos 200 km, sin la Antártida), no un mapa oficial.
- **Ordena la historia.** Los años son «hacia» cuando la fecha exacta es discutida.
- **Reflejos.** El tiempo depende también del aparato (pantalla, ratón, táctil), y el propio juego lo avisa.
- **Juegos de fútbol.** Los datos (resultados, campeones, estadios, plantillas) están comprobados con fuentes públicas y llegan **hasta julio de 2026**
  (incluido el Mundial 2026 y la Champions 2025-26). Cambian con el tiempo: conviene revisar el Quiz de fútbol y «¿Qué futbolista soy?» cada temporada.
  No se usan escudos, logotipos ni fotografías de clubes o jugadores: solo texto. La **Tanda de penaltis** es un juego de azar y reflejos con pesos propios, no un simulador.
- **Hundir la flota, Reversi, Nonogramas.** El ordenador de Hundir la flota no ve tu tablero. El de Reversi usa una valoración posicional clásica (esquinas, movilidad)
  y, en el nivel difícil, busca cuatro jugadas hacia delante. Los nonogramas se generan al azar y se aceptan solo si un resolutor por líneas los resuelve sin adivinar.
- **Preguntas, acertijos y datos** se han escrito para este sitio; aun así, puede haber algún error de hecho. Hay un enlace de contacto para avisar.

## Añadir contenido a un juego que ya existe

Los datos están en archivos JSON dentro de la carpeta del juego; **no hay que tocar el código**. Cada archivo tiene una clave `_nota` que explica su estructura.
Después de editar: `python3 sitio.py probar` valida que los datos están bien formados (opciones repetidas, respuestas que no están entre las opciones, palabras de longitud equivocada…).

| Quiero añadir… | Archivo | Forma de cada entrada |
|---|---|---|
| Una pregunta de cultura general | `cultura-general/preguntas.json` → `preguntas` | `{"p": "enunciado", "o": ["A","B","C","D"], "c": 0, "e": "explicación", "t": "Tema"}` (`c` es la posición de la correcta, de 0 a 3) |
| Un acertijo | `acertijos/acertijos.json` → `acertijos` | `{"p": "enunciado", "r": ["respuesta", "variante"], "pista": "…", "e": "explicación"}` |
| Un puzle de Conexiones | `conexiones/puzzles.json` → `puzzles` | `{"id": "c13", "grupos": [{"n": "nombre del grupo", "p": ["p1","p2","p3","p4"], "e": "explicación"}, … 4 grupos]}`; 16 palabras distintas |
| Una pregunta de «Una entre un millón» | `una-entre-un-millon/preguntas.json` → `preguntas` | `{"id": "p23", "pregunta": "Nombra…", "respuestas": [{"t": ["Francia", "francia"], "n": 4}, …]}` donde `n` = «1 de cada n personas la diría»; al menos 15 respuestas |
| Un lugar de «¿Dónde está?» | `donde-esta/lugares.json` → `lugares` | `{"n": "Madrid (España)", "t": "Ciudad", "lat": 40.42, "lon": -3.7}` (latitud entre 84 y −60) |
| Un personaje de «¿Quién soy?» | `quien-soy/personajes.json` → `elementos` | `{"n": "Picasso", "r": ["Picasso", "Pablo Picasso"], "p": [5 pistas de difícil a fácil]}`; la última pista puede nombrar la obra, nunca el nombre |
| Un grupo de «El intruso» | `el-intruso/conjuntos.json` → `conjuntos` | `{"t": "Frutas", "g": ["manzana","pera","uva"], "i": "zanahoria", "e": "explicación"}` |
| Un conjunto de «El impostor» | `el-impostor/afirmaciones.json` → `conjuntos` | `{"t": "Animales", "v": [3 afirmaciones verdaderas], "f": "la falsa", "e": "por qué es falsa"}` |
| Una cronología | `ordena-la-historia/cronologias.json` → `conjuntos` | `{"t": "Tema", "e": [{"n": "hecho", "a": 1492}, … al menos 5, años distintos]}` |
| Una descripción para «¿Qué palabra soy?» | `que-palabra-soy/palabras.json` → `palabras` | `{"d": "descripción", "r": ["libro", "libros"], "e": "explicación"}` |
| Un dato para «Mayor o menor» | `mayor-menor/datos.json` → `categorias[].items` | `["Nombre", valor]` |
| Una palabra para los juegos de letras | `juegos/datos/palabras.json` → `longitudes.<4-7>` | Minúsculas, con tildes, de la longitud exacta, en `soluciones` (puede salir como oculta) o en `validas` (solo se acepta como intento) |
| Una pregunta del Quiz de fútbol o de Reglas del fútbol | `quiz-de-futbol/preguntas.json`, `reglas-del-futbol/preguntas.json` → `preguntas` | Igual que el quiz de ciencia: `{"p", "o": [correcta primero, 3 falsas], "c": 0, "e", "t"}`. En fútbol, solo datos comprobados |
| Un futbolista de «¿Qué futbolista soy?» | `que-futbolista-soy/futbolistas.json` → `futbolistas` | `{"n": "Nombre completo", "r": ["Apellido", "Nombre completo", "apodo"], "p": [5 pistas de difícil a fácil]}`; ninguna pista nombra al futbolista (los apodos sí pueden ser pista) |
| Un estadio | `estadios-de-futbol/estadios.json` → `estadios` | `{"n": "Nombre", "c": "Ciudad", "p": "País", "e": "Equipo" (o null si lo comparten o es de selecciones), "d": "Dato curioso." (o null)}` |
| Una pregunta de «Quiz de ciencia» o «Quiz de historia» | `quiz-de-ciencia/preguntas.json`, `quiz-de-historia/preguntas.json` → `preguntas` | `{"p": "enunciado", "o": ["correcta","falsa","falsa","falsa"], "c": 0, "e": "explicación", "t": "Tema"}`; **la correcta va siempre la primera** (el juego baraja al mostrarla) |
| Una afirmación de «Verdadero o falso» | `verdadero-o-falso/afirmaciones.json` → `afirmaciones` | `{"p": "Afirmación.", "v": true, "e": "por qué", "t": "Tema"}` |
| Un refrán | `refranes/refranes.json` → `refranes` | `{"p": "Comienzo del refrán,", "o": ["final correcto","falso","falso","falso"], "c": 0, "e": "Significado."}` |
| Una pregunta de ortografía | `faltas-de-ortografia/preguntas.json` → `preguntas` | `{"p": "Frase con ___ hueco." (o "Palabra bien escrita:"), "o": ["correcta","mala","mala","mala"], "c": 0, "e": "regla"}` |
| Un sinónimo o antónimo | `sinonimos-y-antonimos/palabras.json` → `preguntas` | `{"k": "sinonimo" (o "antonimo"), "p": "palabra", "o": ["correcta","falsa","falsa","falsa"], "c": 0, "e": "explicación"}` |
| Una provincia | `provincias-de-espana/provincias.json` → `provincias` | `{"n": "Provincia", "ca": "Comunidad", "cap": "Capital"}` (la capital igual al nombre si coinciden) |
| Un texto de mecanografía | `test-de-mecanografia/textos.json` → `textos` | Una cadena de 90 a 175 caracteres, sin dobles espacios y acabada en punto |
| Una bandera | `banderas/banderas.json` → `banderas` | `{"n": "País", "v": [ancho, alto], "d": "descripción", "f": [formas]}` |
| Un país y su capital | `capitales/paises.json` → `paises` | `{"p": "País", "c": "Capital", "r": "región"}` |
| Un tema de «Sopa de letras» | `sopa-de-letras/temas.json` → `temas` | `{"id": "animales", "titulo": "Animales", "palabras": ["GATO", …]}`; al menos 12 palabras en mayúsculas, sin tilde, 3 a 12 letras |

## Añadir otro juego (el 70 y siguientes)

1. Copia `juegos/_plantilla/` y llama a la copia como quieres que sea su dirección (`juegos/mi-juego/`).
2. En `ficha.json` pon título, descripción (40 a 160 caracteres), categoría (una de las 8), dificultad, duración y `"estado": "publicado"`.
3. Escribe `pagina.html` (la pantalla y el texto para Google) y `app.js`. La plantilla trae un ejemplo mínimo que ya funciona: sustitúyelo.
4. Si necesita datos, un `.json` dentro de la carpeta, que se lee con `TYJ.datos('mi-juego/archivo.json')`.
5. `python3 sitio.py servir` para verlo; `python3 sitio.py probar` y `python3 sitio.py comprobar` antes de publicar.
   Aparece solo en el catálogo, en el buscador, en su categoría, en el sitemap, en el índice por categoría de la portada y, si es de los más recientes, en «Lo último».

### Piezas compartidas (no hace falta reescribirlas)

- `juegos/utilidades.js`: `TYJ.util` (azar, barajar, normalizar texto, distancia de edición, evaluar palabras, tiempos, nivel…).
- `juegos/juegos.js`: `TYJ.h` (crear elementos sin `innerHTML`), `TYJ.hud`, `TYJ.Temporizador`, `TYJ.barraDeTiempo`, `TYJ.Sesion` (cifras de la sesión **solo en memoria**),
  `TYJ.final` (pantalla de resultado con «Jugar otra vez» y «Compartir resultado»), `TYJ.compartir`, `TYJ.datos`, `TYJ.anunciar` (avisos para lectores de pantalla).
- `juegos/rondas.js`: `TYJ.Rondas`, el motor de los juegos de preguntas con vidas, tiempo, racha y niveles (lo usan veintitrés juegos, de «Cultura general» a «Estadios de fútbol»).
  Con `ruta: true` en su configuración dibuja encima de la pregunta la **ruta de rondas** (`TYJ.etapas`): un recuadro por ronda que se marca en verde (acierto) o rosa (fallo).
- **Interfaz visual compartida** (`juegos/juegos.js` y `juegos/componentes.css`): `TYJ.carrera({meta, unidad, hitos, …})` dibuja una pista con un coche de píxeles que avanza hasta una bandera de cuadros
  (la usan «Una entre un millón», con meta en 700 puntos, y el «Test de mecanografía», una vuelta por texto); `TYJ.etapas(total, historial)` es la ruta de rondas.
  Los movimientos son a saltos de píxel, respetan `prefers-reduced-motion` y el avance se anuncia también en texto (`role="progressbar"`).
  Otras interfaces propias: el **semáforo** de «Reflejos» (no revela el cambio: solo acompaña), la **recta numérica** de «Adivina el número» y la portería de la «Tanda de penaltis».
- `juegos/componentes.css`: la identidad retro compartida (`.pantalla`, `.hud`, `.boton-retro`, `.opciones`, `.final`, `.sesion`, `.mensaje`…).

## Pruebas de los juegos

| Prueba | Qué comprueba | Cómo se lanza |
|---|---|---|
| `pruebas/test_juegos_datos.py` | Fichas completas, los 69 en su orden, las 8 categorías, textos propios sin repetir, datos bien formados, **ningún `localStorage`/`sessionStorage`/`IndexedDB`/cookie/caché/petición externa** | `python3 sitio.py probar` |
| `pruebas/juegos/humo.mjs` | Los 69 juegos arrancan en móvil, tablet y escritorio: sin errores de consola, sin desbordes, contraste del texto, botón de volver, nada guardado; y el catálogo (buscador, filtros, enlaces) | `python3 sitio.py probar --navegador` |
| `pruebas/test_portada.py` y `pruebas/portada.mjs` | La portada con todos los juegos: el índice por categoría enlaza cada juego una vez y con la cuenta correcta, el enlace de categoría abre el catálogo ya filtrado, «Lo último» sigue el orden de las fichas, el bloque de información enlaza las seis páginas legales y cuenta la verdad sobre la publicidad; en móvil, tablet y escritorio sin desbordes, con contraste y con foco visible | `python3 sitio.py probar` y `--navegador` |
| `pruebas/juegos/futbol-y-variados.mjs` | Los diez juegos 60–69: los cuatro quizes se juegan enteros leyendo la respuesta del banco (ruta de rondas incluida), la tanda de penaltis y Hundir la flota hasta el final, los nonogramas se resuelven con la solución lógica (con ayudas y puntuación), Reversi (reglas, pasar, nivel difícil), Pilla al topo (puntos, bombas, teclas) y Raquetas (teclado, pausa, puntero y final a 7) | `python3 sitio.py probar --navegador` |
| `pruebas/juegos/*.mjs` | Partidas completas de cada juego en Chrome real (acertar, fallar, perder, pausar, repetir, teclado y táctil); 2048 se compara con una implementación independiente | `python3 sitio.py probar --navegador` |
