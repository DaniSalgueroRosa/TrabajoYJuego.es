// Herramientas de audio con navegador real: conversor, extractor de audio de vídeo, recortador, unir audios y cambiar velocidad y volumen.
// Los archivos de entrada los crea ffmpeg y los de salida se comprueban fuera del navegador con ffmpeg, ffprobe y numpy (audio_py.py).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { abrirChrome } from '../cdp.mjs';
import { preparar } from './ayudas.mjs';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const A = preparar(c);
const { fallos, ok, esperar, escribir, elegir, marcar, clic, texto, valor, k, kt, hastaQue, subir, entregas, reiniciarEntregas, esperarEntregas, estadoTexto, ext } = A;
const q = (s) => JSON.stringify(s);
const ir = async (s) => { await c.ir(`${base}/herramientas/${s}/`, 400); await hastaQue(() => c.js(`!document.querySelector('#herr-carga') && !!document.querySelector('#herr input')`), 8000); };
const sinErrores = (t) => ok(c.consola().length === 0, `${t}: sin errores en la consola` + (c.consola().length ? ' → ' + c.consola().join(' | ') : ''));
const py = (codigo) => { const r = execFileSync('python3', ['-c', `import sys, json; sys.path.insert(0, ${q(aqui)}); from audio_py import *\n` + codigo], { encoding: 'utf8', maxBuffer: 1 << 28 }); return r.trim() ? JSON.parse(r.trim().split('\n').pop()) : null; };

/* ---- Audios de entrada hechos con ffmpeg ---- */
const dir = fs.mkdtempSync('/tmp/tyj-audio-');
const ff = (...args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
ff('-f', 'lavfi', '-i', 'sine=frequency=440:duration=3:sample_rate=44100', '-f', 'lavfi', '-i', 'sine=frequency=660:duration=3:sample_rate=44100', '-filter_complex', '[0][1]amerge=inputs=2[a]', '-map', '[a]', '-c:a', 'pcm_s16le', dir + '/tono.wav');
ff('-i', dir + '/tono.wav', '-c:a', 'libmp3lame', '-b:a', '128k', dir + '/tono.mp3');
ff('-i', dir + '/tono.wav', '-c:a', 'aac', '-b:a', '128k', dir + '/tono.m4a');
ff('-i', dir + '/tono.wav', '-c:a', 'libvorbis', dir + '/tono.ogg');
ff('-i', dir + '/tono.wav', '-c:a', 'flac', dir + '/tono.flac');
ff('-f', 'lavfi', '-i', 'sine=frequency=440:duration=2:sample_rate=44100', '-af', 'volume=6', '-c:a', 'pcm_s16le', dir + '/fuerte.wav');
ff('-f', 'lavfi', '-i', 'sine=frequency=523.25:duration=3:sample_rate=22050', '-c:a', 'pcm_s16le', dir + '/mono.wav');
ff('-f', 'lavfi', '-i', 'testsrc=duration=3:size=160x120:rate=24', '-f', 'lavfi', '-i', 'sine=frequency=330:duration=3:sample_rate=48000', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', dir + '/video.mp4');
fs.writeFileSync(dir + '/falso.mp3', 'esto no es audio, solo texto');
fs.writeFileSync(dir + '/notas.txt', 'hola');
const spec = (f, mime = '') => ({ t: 'b64', b64: fs.readFileSync(`${dir}/${f}`).toString('base64'), nombre: f, mime });
const guardarSalida = async (i = 0) => { const e = (await entregas())[i]; const f = ext.guardar(e.buf, '.' + e.nombre.split('.').pop()); return { f, nombre: e.nombre, tam: e.buf.length }; };
const original = `${dir}/tono.wav`;

try {
  await c.vista(1100, 900, 'light', false);

  // ============================================================ CONVERSOR DE AUDIO
  console.log('CONVERSOR DE AUDIO');
  await ir('conversor-de-audio');
  ok(await c.js(`document.querySelector('#f-ejecutar').disabled`), 'sin archivos el botón está desactivado');
  await subir('#f-archivos', [{ t: 'b64', b64: Buffer.from('hola').toString('base64'), nombre: 'notas.txt', mime: 'text/plain' }]);
  ok((await estadoTexto()).includes('no es de un tipo admitido'), 'un .txt se rechaza con un aviso');
  // MP3 → WAV 16 (por defecto)
  await subir('#f-archivos', [spec('tono.mp3', 'audio/mpeg')]);
  await clic('Convertir'); ok(await esperarEntregas(), 'MP3 → WAV: hay archivo');
  let s = await guardarSalida();
  let i = py(`print(json.dumps(info(${q(s.f)})))`);
  ok(s.nombre === 'tono.wav' && i.codec === 'pcm_s16le' && i.hz === 44100 && i.canales === 2 && Math.abs(i.dur - 3) < 0.1, `MP3 → WAV: tono.wav, 16 bits, 44,1 kHz, estéreo, ${i.dur.toFixed(3)} s`);
  let r = py(`a = pcm(${q(dir + '/tono.mp3')}); b = pcm(${q(s.f)}); print(json.dumps(snr_alineado(a, b)))`);
  ok(r[0] > 35 && Math.abs(r[1]) <= 1500, `el WAV suena como la decodificación del MP3 por ffmpeg (relación señal/ruido ${r[0].toFixed(1)} dB, desfase ${r[1]})`);
  ok((await estadoTexto()).startsWith('Listo: 1 archivo convertido a WAV 16 bits'), 'mensaje final: «' + (await estadoTexto()).slice(0, 70) + '»');
  // FLAC → WAV 16: idéntico muestra a muestra
  await reiniciarEntregas(); await c.ir(`${base}/herramientas/conversor-de-audio/`, 500); await hastaQue(() => c.js(`!document.querySelector('#herr-carga')`));
  await subir('#f-archivos', [spec('tono.flac', 'audio/flac')]); await clic('Convertir'); await esperarEntregas();
  s = await guardarSalida();
  r = py(`a = pcm(${q(original)}); b = pcm(${q(s.f)}); print(json.dumps([bool((a == b).all()), a.shape == b.shape]))`);
  ok(r[0] && r[1], 'FLAC → WAV 16 bits: las muestras son idénticas a las del original sin pérdidas');
  // WAV → FLAC 16 y 24, comprobando CRC y MD5 con ffmpeg
  for (const [fmt, bits] of [['flac16', 16], ['flac24', 24]]) {
    await reiniciarEntregas(); await c.ir(`${base}/herramientas/conversor-de-audio/`, 500); await hastaQue(() => c.js(`!document.querySelector('#herr-carga')`));
    await subir('#f-archivos', [spec('tono.wav', 'audio/wav')]); await elegir('#c-formato', fmt); await clic('Convertir'); await esperarEntregas();
    s = await guardarSalida();
    i = py(`print(json.dumps(info(${q(s.f)})))`);
    r = py(`a = pcm(${q(original)}, 's32le'); b = pcm(${q(s.f)}, 's32le'); print(json.dumps([bool(((a >> 16) == (b >> 16)).all()), a.shape == b.shape]))`);
    ok(s.nombre === 'tono-convertido.' + 'flac' || s.nombre === 'tono.flac', `WAV → ${fmt}: nombre ${s.nombre}`);
    ok(i.codec === 'flac' && i.hz === 44100 && i.canales === 2 && r[0] && r[1], `WAV → ${fmt}: FLAC válido (CRC correctos), mismas muestras que el original, ${(s.tam / 1000).toFixed(0)} kB frente a ${(fs.statSync(original).size / 1000).toFixed(0)} kB`);
  }
  // mono 22 kHz → WAV 24 bits a 48 kHz, subiendo el volumen
  await reiniciarEntregas(); await c.ir(`${base}/herramientas/conversor-de-audio/`, 500); await hastaQue(() => c.js(`!document.querySelector('#herr-carga')`));
  await subir('#f-archivos', [spec('mono.wav', 'audio/wav')]); await elegir('#c-formato', 'wav24'); await elegir('#c-hz', '48000'); await marcar('#c-normalizar', true); await clic('Convertir'); await esperarEntregas();
  s = await guardarSalida();
  i = py(`print(json.dumps(info(${q(s.f)})))`);
  r = py(`b = pcm(${q(s.f)}, 's32le').astype('int64') >> 8; f = frecuencia(b[:, 0], 48000); print(json.dumps([f, int(abs(b).max())]))`);
  ok(i.codec === 'pcm_s24le' && i.hz === 48000 && i.canales === 1 && Math.abs(i.dur - 3) < 0.01, `mono 22,05 kHz → WAV 24 bits a 48 kHz: ${i.codec}, ${i.hz} Hz, ${i.canales} canal, ${i.dur.toFixed(3)} s`);
  ok(Math.abs(r[0] - 523.25) < 0.5, `la nota sigue siendo 523,25 Hz tras remuestrear (${r[0].toFixed(2)} Hz)`);
  ok(Math.abs(r[1] - 0.98 * 8388608) < 3000, `normalizado al 98 % del máximo (pico ${r[1]} de ${Math.round(0.98 * 8388608)})`);
  // M4A → Ogg Opus 96 kb/s
  await reiniciarEntregas(); await c.ir(`${base}/herramientas/conversor-de-audio/`, 500); await hastaQue(() => c.js(`!document.querySelector('#herr-carga')`));
  await subir('#f-archivos', [spec('tono.m4a', 'audio/mp4')]); await elegir('#c-formato', 'opus');
  ok(await c.js(`!document.querySelector('#c-kbps').closest('.campo').hidden`), 'al elegir Opus aparece la calidad en kb/s');
  await elegir('#c-kbps', '96'); await clic('Convertir'); ok(await esperarEntregas(), 'M4A → Opus: hay archivo');
  s = await guardarSalida();
  i = py(`print(json.dumps(info(${q(s.f)})))`);
  r = py(`b = pcm(${q(s.f)}, 'f32le', False); print(json.dumps([frecuencia(b[:, 0], 48000), frecuencia(b[:, 1], 48000), amplitud_en(b[:, 0], 48000, 440), amplitud_en(b[:, 1], 48000, 660)]))`);
  ok(s.nombre === 'tono.opus' && i.codec === 'opus' && i.canales === 2 && Math.abs(i.dur - 3) < 0.05, `M4A → Opus: ${s.nombre}, ${i.codec}, ${i.canales} canales, ${i.dur.toFixed(3)} s, ${(s.tam / 1000).toFixed(1)} kB`);
  ok(Math.abs(r[0] - 440) < 1 && Math.abs(r[1] - 660) < 1 && r[2] > 0.1 && r[3] > 0.1, `el Opus conserva las dos notas (${r[0].toFixed(1)} Hz y ${r[1].toFixed(1)} Hz; amplitudes ${r[2].toFixed(2)} y ${r[3].toFixed(2)})`);
  // OGG Vorbis → mono
  await reiniciarEntregas(); await c.ir(`${base}/herramientas/conversor-de-audio/`, 500); await hastaQue(() => c.js(`!document.querySelector('#herr-carga')`));
  await subir('#f-archivos', [spec('tono.ogg', 'audio/ogg')]); await elegir('#c-canales', 'mono'); await clic('Convertir'); await esperarEntregas();
  s = await guardarSalida(); i = py(`print(json.dumps(info(${q(s.f)})))`);
  r = py(`b = pcm(${q(s.f)}, 'f32le'); print(json.dumps([amplitud_en(b[:, 0], 44100, 440), amplitud_en(b[:, 0], 44100, 660)]))`);
  ok(i.canales === 1 && Math.abs(r[0] - 0.5 * 0.5 * 2 / 2 * 2 / 2) < 0.2 && Math.abs(r[0] - r[1]) < 0.03, `OGG → WAV mono: mezcla de los dos canales (440 Hz: ${r[0].toFixed(3)}, 660 Hz: ${r[1].toFixed(3)} de amplitud, iguales y la mitad que antes)`);
  // varios a la vez y nombres repetidos
  await reiniciarEntregas(); await c.ir(`${base}/herramientas/conversor-de-audio/`, 500); await hastaQue(() => c.js(`!document.querySelector('#herr-carga')`));
  await subir('#f-archivos', [spec('tono.wav', 'audio/wav'), spec('tono.mp3', 'audio/mpeg'), spec('falso.mp3', 'audio/mpeg')]);
  await elegir('#c-formato', 'wav16'); await clic('Convertir'); await esperarEntregas();
  const lista = await entregas(); const msg = await estadoTexto();
  ok(lista.length === 2 && new Set(lista.map(e => e.nombre)).size === 2, `tres archivos, uno falso: se entregan 2 con nombres distintos (${lista.map(e => e.nombre).join(', ')})`);
  ok(msg.includes('No se ha podido') && msg.includes('falso.mp3'), 'el archivo falso se avisa por nombre y no impide los demás: «' + msg.slice(0, 160) + '»');
  await reiniciarEntregas(); await c.ir(`${base}/herramientas/conversor-de-audio/`, 500); await hastaQue(() => c.js(`!document.querySelector('#herr-carga')`));
  await subir('#f-archivos', [spec('falso.mp3', 'audio/mpeg')]); await clic('Convertir'); await esperar(1200);
  ok((await estadoTexto()).includes('No se ha podido leer el audio de «falso.mp3»') && !(await c.js(`!!(TH.entregas && TH.entregas.length)`)), 'solo un archivo falso: error claro y sin descargas');
  sinErrores('conversor de audio');

  // ============================================================ EXTRACTOR
  console.log('EXTRACTOR DE AUDIO DE VÍDEO');
  await ir('extractor-de-audio-de-video');
  await subir('#f-archivos', [spec('video.mp4', 'video/mp4')]); await clic('Extraer el audio'); ok(await esperarEntregas(), 'MP4 → FLAC: hay archivo');
  s = await guardarSalida(); i = py(`print(json.dumps(info(${q(s.f)})))`);
  r = py(`b = pcm(${q(s.f)}, 'f32le'); print(json.dumps(frecuencia(b[:, 0], 48000)))`);
  ok(s.nombre === 'video-audio.flac' && i.codec === 'flac' && i.hz === 48000 && i.canales === 1 && Math.abs(i.dur - 3) < 0.1, `video-audio.flac: ${i.codec}, ${i.hz} Hz, ${i.canales} canal, ${i.dur.toFixed(3)} s`);
  ok(Math.abs(r - 330) < 0.5, `el audio del vídeo es la nota de 330 Hz (${r.toFixed(2)} Hz)`);
  ok(/Listo: 1 audio extraído a FLAC 16 bits/.test(await estadoTexto()), 'mensaje: «' + (await estadoTexto()).slice(0, 60) + '»');
  sinErrores('extractor');

  // ============================================================ RECORTADOR
  console.log('RECORTADOR DE AUDIO');
  await ir('recortador-de-audio');
  ok(await c.js(`document.querySelector('.recorte').hidden`), 'al abrir no se ve el panel de recorte');
  await subir('#f-archivos', [spec('tono.wav', 'audio/wav')]);
  ok(await hastaQue(() => c.js(`!document.querySelector('.recorte').hidden`)), 'al elegir un audio aparece la onda y los campos');
  ok((await texto('#r-info')).includes('0:03,0') && (await texto('#r-info')).includes('estéreo'), 'la información dice la duración y que es estéreo: «' + (await texto('#r-info')).slice(0, 80) + '»');
  const oscuros = await c.js(`(() => { const cv = document.querySelector('#r-onda'); const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; })()`);
  ok(oscuros > 5000, `la onda está dibujada (${oscuros} píxeles)`);
  // conservar 1:00 a 2,5
  await escribir('#c-inicio', '0:01'); await escribir('#c-fin', '0:02,5'); await clic('Recortar'); ok(await esperarEntregas(), 'recorte: hay archivo');
  s = await guardarSalida(); i = py(`print(json.dumps(info(${q(s.f)})))`);
  r = py(`a = pcm(${q(original)}); b = pcm(${q(s.f)}); print(json.dumps([bool((a[44100:110250] == b).all()), len(b)]))`);
  ok(s.nombre === 'tono-recortado.wav' && r[1] === 66150 && r[0], `conservar de 0:01 a 0:02,5: ${r[1]} muestras (1,5 s) idénticas al tramo del original`);
  ok(await k('resultado') === '1.5' && await kt('resultado') === '0:01,5' && await kt('original') === '0:03,0', 'resultados: original 0:03,0 y resultado 0:01,5');
  // quitar
  await reiniciarEntregas(); await elegir('#c-modo', 'quitar'); await clic('Recortar'); await esperarEntregas();
  s = await guardarSalida();
  r = py(`a = pcm(${q(original)}); b = pcm(${q(s.f)}); e = np.concatenate([a[:44100], a[110250:]]); print(json.dumps([bool((e == b).all()), len(b), len(e)]))`);
  ok(r[0] && r[1] === r[2], `quitar el tramo: queda lo anterior y lo posterior unidos (${r[1]} muestras)`);
  // fundidos
  await reiniciarEntregas(); await elegir('#c-modo', 'conservar'); await marcar('#c-fundido', true); await clic('Recortar'); await esperarEntregas();
  s = await guardarSalida();
  r = py(`a = pcm(${q(original)}).astype(float); b = pcm(${q(s.f)}).astype(float); a = a[44100:110250]; n = 22050; w = np.ones(len(a)); w[:n] = np.arange(n) / n; w[-n:] = np.minimum(w[-n:], np.arange(n)[::-1] / n); e = np.floor(a * w[:, None] + 0.5); print(json.dumps([float(np.abs(e - b).max()), float(abs(b[0]).max()), float(abs(b[-1]).max())]))`);
  ok(r[0] <= 1 && r[1] === 0 && r[2] <= 3, `fundido de medio segundo: coincide con la fórmula (error máximo ${r[0]}; primera muestra ${r[1]}, última ${r[2]})`);
  // errores
  await escribir('#c-inicio', '2'); await escribir('#c-fin', '1'); await clic('Recortar');
  ok((await estadoTexto()).includes('posterior al inicio'), 'final antes que inicio: «' + (await estadoTexto()) + '»');
  await escribir('#c-inicio', 'abc'); await clic('Recortar'); ok((await estadoTexto()).includes('No entiendo el inicio'), 'inicio ilegible: aviso');
  await escribir('#c-inicio', '0'); await escribir('#c-fin', '9'); await clic('Recortar'); ok((await estadoTexto()).includes('pasa de la duración'), 'final más allá de la duración: aviso');
  await escribir('#c-inicio', '5'); await escribir('#c-fin', ''); await clic('Recortar'); ok((await estadoTexto()).includes('dentro del audio'), 'inicio fuera del audio: aviso');
  // clic en la onda: lo más cercano cambia
  await escribir('#c-inicio', '0:00'); await escribir('#c-fin', '');
  await c.js(`(() => { const cv = document.querySelector('#r-onda'); const r = cv.getBoundingClientRect(); cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + r.width * 0.25, clientY: r.top + 10, bubbles: true })); })()`);
  ok((await valor('#c-inicio')) === '0:00,8' && (await valor('#c-fin')) === '', `pulsar al 25 % de la onda mueve el inicio a 0:00,8 (${await valor('#c-inicio')})`);
  await c.js(`(() => { const cv = document.querySelector('#r-onda'); const r = cv.getBoundingClientRect(); cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + r.width * 0.75, clientY: r.top + 10, bubbles: true })); })()`);
  ok((await valor('#c-fin')) === '0:02,3', `pulsar al 75 % mueve el final a 0:02,3 (${await valor('#c-fin')})`);
  // escuchar
  await clic('Escuchar el resultado'); await esperar(300);
  ok((await texto('#r-escuchar')) === 'Parar', 'al escuchar el botón pasa a «Parar»');
  await clic('Parar'); ok((await texto('#r-escuchar')) === 'Escuchar el resultado', 'al parar vuelve a «Escuchar el resultado»');
  sinErrores('recortador');

  // ============================================================ UNIR AUDIOS
  console.log('UNIR AUDIOS');
  await ir('unir-audios');
  await subir('#f-archivos', [spec('tono.wav', 'audio/wav')]);
  ok(await c.js(`document.querySelector('#f-ejecutar').disabled`), 'con un solo audio no se puede unir');
  await subir('#f-archivos', [spec('mono.wav', 'audio/wav')]);
  ok(!(await c.js(`document.querySelector('#f-ejecutar').disabled`)) && (await texto('#f-info')).includes('1. tono.wav'), 'con dos audios se activa y se muestra el orden');
  await escribir('#c-pausa', '1'); await clic('Unir los audios'); ok(await esperarEntregas(), 'unir: hay archivo');
  s = await guardarSalida(); i = py(`print(json.dumps(info(${q(s.f)})))`);
  r = py(`a = pcm(${q(original)}); b = pcm(${q(s.f)}, 'f32le'); bi = pcm(${q(s.f)}); print(json.dumps([bool((a == bi[:132300]).all()), float(abs(bi[132300:176400]).max()), frecuencia(b[176400:, 0], 44100), frecuencia(b[176400:, 1], 44100), bool(np.abs(b[176400:, 0] - b[176400:, 1]).max() < 1e-6), len(b)]))`);
  ok(s.nombre === 'audios-unidos.wav' && i.hz === 44100 && i.canales === 2 && r[5] === 308700, `audios-unidos.wav: 44,1 kHz, estéreo, ${r[5]} muestras (7 s)`);
  ok(r[0] && r[1] === 0, 'el primer audio queda idéntico y la pausa de 1 s es silencio exacto');
  ok(Math.abs(r[2] - 523.25) < 0.5 && r[4], `el segundo audio (mono a 22,05 kHz) se adapta: ${r[2].toFixed(2)} Hz en los dos canales`);
  ok((await estadoTexto()).includes('otra frecuencia de muestreo'), 'avisa de la adaptación de frecuencia: «' + (await estadoTexto()).slice(0, 140) + '»');
  // cambiar el orden
  await reiniciarEntregas(); await clic('Bajar tono.wav'); ok((await texto('#f-info')).includes('1. mono.wav'), 'las flechas cambian el orden');
  await escribir('#c-pausa', '0'); await clic('Unir los audios'); await esperarEntregas();
  s = await guardarSalida(); r = py(`b = pcm(${q(s.f)}, 'f32le'); print(json.dumps([len(b), frecuencia(b[:132000, 0], 44100)]))`);
  ok(r[0] === 264600 && Math.abs(r[1] - 523.25) < 0.5, `invertido y sin pausa: 6 s y empieza por 523,25 Hz (${r[0]} muestras, ${r[1].toFixed(2)} Hz)`);
  await escribir('#c-pausa', 'abc'); await clic('Unir los audios'); await esperar(300);
  ok((await estadoTexto()).includes('entre 0 y 60'), 'pausa no válida: aviso');
  sinErrores('unir audios');

  // ============================================================ VELOCIDAD Y VOLUMEN
  console.log('CAMBIAR VELOCIDAD Y VOLUMEN');
  await ir('cambiar-velocidad-y-volumen-de-audio');
  await subir('#f-archivos', [spec('tono.wav', 'audio/wav')]);
  await escribir('#c-velocidad', '150'); await clic('Aplicar cambios'); ok(await esperarEntregas(), 'velocidad 150 %: hay archivo');
  s = await guardarSalida(); r = py(`b = pcm(${q(s.f)}, 'f32le'); print(json.dumps([len(b), frecuencia(b[10000:-10000, 0], 44100), frecuencia(b[10000:-10000, 1], 44100)]))`);
  ok(s.nombre === 'tono-modificado.wav' && Math.abs(r[0] - 88200) <= 1, `150 %: ${r[0]} muestras (2 s)`);
  ok(Math.abs(r[1] - 440) < 2 && Math.abs(r[2] - 660) < 3, `con el tono mantenido sigue siendo 440 y 660 Hz (${r[1].toFixed(1)} y ${r[2].toFixed(1)})`);
  ok(await kt('duracion') === '0:02,0' && await kt('duracion-original') === '0:03,0', 'resumen: de 0:03,0 a 0:02,0');
  await reiniciarEntregas(); await escribir('#c-velocidad', '200'); await elegir('#c-tono', 'cambiar'); await clic('Aplicar cambios'); await esperarEntregas();
  s = await guardarSalida(); r = py(`b = pcm(${q(s.f)}, 'f32le'); print(json.dumps([len(b), frecuencia(b[5000:-5000, 0], 44100), frecuencia(b[5000:-5000, 1], 44100)]))`);
  ok(Math.abs(r[0] - 66150) <= 1 && Math.abs(r[1] - 880) < 2 && Math.abs(r[2] - 1320) < 3, `200 % cambiando el tono: 1,5 s y 880/1320 Hz (${r[0]} muestras, ${r[1].toFixed(1)} y ${r[2].toFixed(1)} Hz)`);
  // volumen exacto
  await reiniciarEntregas(); await escribir('#c-velocidad', '100'); await escribir('#c-volumen', '50'); await clic('Aplicar cambios'); await esperarEntregas();
  s = await guardarSalida();
  r = py(`a = pcm(${q(original)}).astype(float); b = pcm(${q(s.f)}).astype(float); e = np.clip(np.floor(a * 0.5 + 0.5), -32768, 32767); print(json.dumps([float(np.abs(e - b).max()), a.shape == b.shape]))`);
  ok(r[0] <= 1 && r[1], `volumen al 50 %: cada muestra es la mitad (error máximo ${r[0]})`);
  // saturación (un tono de amplitud 0,75 al 500 %)
  await reiniciarEntregas(); await c.ir(`${base}/herramientas/cambiar-velocidad-y-volumen-de-audio/`, 500); await hastaQue(() => c.js(`!document.querySelector('#herr-carga')`));
  await subir('#f-archivos', [spec('fuerte.wav', 'audio/wav')]); await escribir('#c-volumen', '500'); await clic('Aplicar cambios'); await esperarEntregas();
  const msgSat = await estadoTexto(), m = /([\d.]+) muestras pasan/.exec(msgSat);
  s = await guardarSalida();
  r = py(`a = pcm(${q(dir + '/fuerte.wav')}).astype(float); b = pcm(${q(s.f)}); print(json.dumps([int((np.abs(a) * 5 > 32768).sum()), int(b.max()), int(b.min())]))`);
  ok(msgSat.includes('se han recortado') && m && +m[1].replace(/\./g, '') === r[0] && r[0] > 1000, `volumen 500 % sobre un audio fuerte: avisa de ${r[0]} muestras recortadas (mensaje: «${msgSat.slice(0, 90)}…»)`);
  ok(r[1] === 32767 && r[2] === -32768, `las muestras recortadas quedan en los extremos (${r[2]} y ${r[1]})`);
  // normalizar
  await reiniciarEntregas(); await escribir('#c-volumen', '100'); await marcar('#c-normalizar', true); await clic('Aplicar cambios'); await esperarEntregas();
  s = await guardarSalida(); r = py(`b = pcm(${q(s.f)}); print(json.dumps(int(abs(b).max())))`);
  ok(Math.abs(r - 0.98 * 32768) <= 2, `normalizar: pico en ${r} de ${Math.round(0.98 * 32768)}`);
  // errores
  await escribir('#c-velocidad', '10'); await clic('Aplicar cambios'); await esperar(300); ok((await estadoTexto()).includes('entre 25 % y 400 %'), 'velocidad fuera de rango: aviso');
  await escribir('#c-velocidad', '100'); await marcar('#c-normalizar', false); await escribir('#c-volumen', '900'); await clic('Aplicar cambios'); await esperar(300); ok((await estadoTexto()).includes('entre 0 % y 500 %'), 'volumen fuera de rango: aviso');
  // adelanto
  await escribir('#c-volumen', '100'); await clic('Escuchar un adelanto de 10 s'); await hastaQue(async () => (await texto('#v-adelanto')) === 'Parar el adelanto', 5000);
  ok((await texto('#v-adelanto')) === 'Parar el adelanto', 'el adelanto se reproduce y el botón pasa a «Parar el adelanto»');
  await clic('Parar el adelanto'); ok((await texto('#v-adelanto')) === 'Escuchar un adelanto de 10 s', 'se puede parar');
  sinErrores('velocidad y volumen');
  ok(await c.js(`localStorage.length === 0 && sessionStorage.length === 0 && document.cookie === ''`), 'no se guarda nada en el navegador');
} catch (e) {
  console.log('  ✗ Excepción: ' + (e && e.stack || e)); fallos.push('excepción');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
  ext.limpiar();
  await c.cerrar();
}
console.log(fallos.length ? `\n${fallos.length} fallos:\n- ` + fallos.join('\n- ') : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
