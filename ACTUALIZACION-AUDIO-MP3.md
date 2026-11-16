# Actualización: las herramientas de audio ya guardan en MP3

Seis herramientas de audio pasan a ofrecer **MP3** como formato de salida, además de WAV, FLAC y Ogg Opus: el conversor de audio, el extractor de audio de vídeo, el recortador, unir audios, cambiar velocidad y volumen, y la grabadora de voz. Convertir M4A, OGG, FLAC, WAV o el audio de un vídeo a MP3 ya funciona en el navegador, sin subir nada.

## Dónde ponerlo

Descomprime el zip y copia las carpetas `trabajoyjuego-v2` y `vista-previa` **encima de las que ya tienes**, aceptando reemplazar los archivos que coincidan
(en Mac, mantén pulsada Opción y elige «Combinar»). Este zip lleva **solo los archivos que han cambiado o son nuevos**. Después: `python3 sitio.py probar` y `python3 sitio.py servir`.

## Qué hay de nuevo

- **`herramientas/datos/lib/mp3.js` (nuevo):** codificador MP3 propio, en JavaScript puro, sin librerías ni peticiones a otros dominios. MPEG-1 Capa III de tasa constante, mono o estéreo, a 32, 44,1 o 48 kHz y de 32 a 320 kb/s, con reserva de bits y estéreo conjunto (M/S) cuando compensa. Solo se descarga cuando alguien elige MP3.
- **Selector de calidad del MP3** (96 a 320 kb/s, por defecto 192) en las seis herramientas. El de Opus sigue como estaba.
- **Avisos claros:** si el audio tiene más de dos canales se guardan los dos primeros; si su frecuencia no es de 32, 44,1 o 48 kHz, el MP3 se guarda a 44,1 o 48 kHz y la nota del archivo lo dice.
- **Textos actualizados:** fichas, páginas y preguntas frecuentes de las herramientas, la guía «Editar y convertir audio» y `docs/HERRAMIENTAS.md`. Antes decían que no se creaba MP3.

## Cómo suena

Es un codificador sencillo: no usa el modelo psicoacústico ni la conmutación de bloques de los programas profesionales. A 192 kb/s o más suena muy bien; a 128 kb/s es correcto; por debajo de 96 kb/s se nota más la compresión, sobre todo en percusión. Las páginas lo cuentan así. En señales de prueba, la relación señal/ruido iguala o supera a la de LAME a 128, 192 y 320 kb/s, pero LAME ajusta mejor lo que el oído nota.
Como cualquier MP3 sin etiqueta de gapless, el archivo empieza con unos 24 ms de silencio (retardo del codificador y del decodificador).

## Comprobado

- `pruebas/test_mp3_lib.py` (nuevo, 11 pruebas): las 14 tasas × 3 frecuencias × mono/estéreo, cabeceras y relleno de cada trama, decodificación estricta con los dos decodificadores de ffmpeg, ganancia y notas correctas, M/S, silencio, señales saturadas, entradas de 1 muestra, frecuencias de 8 a 96 kHz, 3 canales y calidad frente a LAME.
- `pruebas/herramientas/audio-mp3.mjs` (nuevo, 43 comprobaciones en Chrome): conversor, extractor, recortador, unir y velocidad con MP3 verificado por ffmpeg; la grabadora se prueba en `audio-vivo.mjs`, que ahora incluye MP3.
- Pasan las 351 pruebas del sitio y las de navegador de audio (`audio.mjs`, `audio-vivo.mjs`).

## Pendiente

Las herramientas por gremios y oficios: dime la lista y las preparo con el mismo formato y pruebas.
