// Salida en MP3 de las herramientas de audio, con navegador real: conversor, extractor de vídeo, recortador, unir audios y cambiar velocidad.
// El codificador MP3 es propio (lib/mp3.js): aquí se comprueba que ffmpeg lo decodifica sin errores, con la duración, la tasa, los canales, la frecuencia
// y las notas correctas, y que la librería solo se descarga cuando se elige MP3.
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
const { fallos, ok, esperar, escribir, elegir, marcar, clic, texto, valor, hastaQue, subir, entregas, reiniciarEntregas, esperarEntregas, estadoTexto, ext } = A;
const q = (s) => JSON.stringify(s);
const ir = async (s) => { await c.ir(`${base}/herramientas/${s}/`, 400); await hastaQue(() => c.js(`!document.querySelector('#herr-carga') && !!document.querySelector('#herr input')`), 8000); };
const sinErrores = (t) => ok(c.consola().length === 0, `${t}: sin errores en la consola` + (c.consola().length ? ' → ' + c.consola().join(' | ') : ''));
const py = (codigo) => { const r = execFileSync('python3', ['-c', `import sys, json; sys.path.insert(0, ${q(aqui)}); from audio_py import *\n` + codigo], { encoding: 'utf8', maxBuffer: 1 << 28 }); return r.trim() ? JSON.parse(r.trim().split('\n').pop()) : null; };

const dir = fs.mkdtempSync('/tmp/tyj-mp3-');
const ff = (...args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
ff('-f', 'lavfi', '-i', 'sine=frequency=440:duration=3:sample_rate=44100', '-f', 'lavfi', '-i', 'sine=frequency=660:duration=3:sample_rate=44100', '-filter_complex', '[0][1]amerge=inputs=2[a]', '-map', '[a]', '-c:a', 'pcm_s16le', dir + '/tono.wav');
ff('-i', dir + '/tono.wav', '-c:a', 'aac', '-b:a', '128k', dir + '/tono.m4a');
ff('-f', 'lavfi', '-i', 'sine=frequency=523.25:duration=3:sample_rate=22050', '-c:a', 'pcm_s16le', dir + '/mono.wav');
ff('-f', 'lavfi', '-i', 'sine=frequency=300:duration=2:sample_rate=48000', '-f', 'lavfi', '-i', 'sine=frequency=500:duration=2:sample_rate=48000', '-f', 'lavfi', '-i', 'sine=frequency=700:duration=2:sample_rate=48000', '-filter_complex', '[0][1][2]amerge=inputs=3[a]', '-map', '[a]', '-c:a', 'pcm_s16le', dir + '/trio.wav');
ff('-f', 'lavfi', '-i', 'testsrc=duration=3:size=160x120:rate=24', '-f', 'lavfi', '-i', 'sine=frequency=330:duration=3:sample_rate=48000', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', dir + '/video.mp4');
const spec = (f, mime = '') => ({ t: 'b64', b64: fs.readFileSync(`${dir}/${f}`).toString('base64'), nombre: f, mime });
const guardarSalida = async (i = 0) => { const e = (await entregas())[i]; const f = ext.guardar(e.buf, '.' + e.nombre.split('.').pop()); return { f, nombre: e.nombre, tam: e.buf.length }; };
/* Datos de un MP3 con ffprobe y una decodificación estricta (cualquier error de la trama hace fallar a ffmpeg). */
const mp3 = (f) => py(`
r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_name,sample_rate,channels,bit_rate:format=duration,bit_rate', '-of', 'json', ${q(f)}], capture_output=True, text=True)
d = json.loads(r.stdout); s = d['streams'][0]
x = pcm(${q(f)}, 'f32le')
print(json.dumps({'codec': s['codec_name'], 'hz': int(s['sample_rate']), 'canales': s['channels'], 'kbps': round(int(s.get('bit_rate') or d['format']['bit_rate']) / 1000), 'dur': float(d['format']['duration']), 'muestras': len(x)}))`);
const notas = (f, hz, desde = 20000, largo = 30000) => py(`b = pcm(${q(f)}, 'f32le'); print(json.dumps([frecuencia(b[${desde}:${desde + largo}, k], ${hz}) for k in range(b.shape[1])]))`);
const cargadoMp3 = () => c.js(`performance.getEntriesByType('resource').some(r => /lib\\/mp3\\.js/.test(r.name))`);

try {
  await c.vista(1100, 900, 'light', false);

  // ============================================================ CONVERSOR
  console.log('CONVERSOR → MP3');
  await ir('conversor-de-audio');
  ok(!(await cargadoMp3()), 'el codificador MP3 no se descarga al abrir la herramienta');
  ok(await c.js(`[...document.querySelectorAll('#c-formato option')].some(o => o.value === 'mp3' && /MP3/.test(o.textContent))`), 'la lista de formatos ofrece MP3');
  await subir('#f-archivos', [spec('tono.wav', 'audio/wav')]);
  await elegir('#c-formato', 'mp3');
  ok(await c.js(`!document.querySelector('#c-kbpsMp3').closest('.campo').hidden && document.querySelector('#c-kbps').closest('.campo').hidden`), 'al elegir MP3 aparece su calidad y se oculta la de Opus');
  ok((await valor('#c-kbpsMp3')) === '192', 'la calidad por defecto del MP3 es 192 kb/s');
  await clic('Convertir'); ok(await esperarEntregas(), 'WAV → MP3: hay archivo');
  ok(await cargadoMp3(), 'el codificador MP3 se descarga al elegir MP3');
  let s = await guardarSalida(); let i = mp3(s.f);
  ok(s.nombre === 'tono.mp3' && i.codec === 'mp3' && i.hz === 44100 && i.canales === 2 && i.kbps === 192, `tono.mp3: ${i.codec}, ${i.hz} Hz, ${i.canales} canales, ${i.kbps} kb/s`);
  ok(Math.abs(i.dur - 3.03) < 0.06 && Math.abs(s.tam - i.dur * 192000 / 8) < 700, `duración ${i.dur.toFixed(3)} s y ${(s.tam / 1000).toFixed(1)} kB (tasa constante)`);
  let r = py(`a = pcm(${q(dir + '/tono.wav')}); b = pcm(${q(s.f)}); print(json.dumps(snr_alineado(a, b)))`);
  ok(r[0] > 25 && Math.abs(Math.abs(r[1]) - 1057) <= 1, `suena como el original: relación señal/ruido ${r[0].toFixed(1)} dB y retardo del codificador ${r[1]} muestras`);
  r = notas(s.f, 44100, 4000);
  ok(Math.abs(r[0] - 440) < 1 && Math.abs(r[1] - 660) < 1, `conserva las dos notas (${r[0].toFixed(1)} Hz y ${r[1].toFixed(1)} Hz)`);
  ok(/Listo: 1 archivo convertido a MP3/.test(await estadoTexto()), 'mensaje final: «' + (await estadoTexto()).slice(0, 60) + '»');

  // M4A → MP3 mono a 96 kb/s
  await reiniciarEntregas(); await ir('conversor-de-audio');
  await subir('#f-archivos', [spec('tono.m4a', 'audio/mp4')]); await elegir('#c-formato', 'mp3'); await elegir('#c-kbpsMp3', '96'); await elegir('#c-canales', 'mono');
  await clic('Convertir'); ok(await esperarEntregas(), 'M4A → MP3 mono: hay archivo');
  s = await guardarSalida(); i = mp3(s.f);
  ok(i.codec === 'mp3' && i.canales === 1 && i.kbps === 96 && i.hz === 44100, `M4A → MP3 mono a 96 kb/s: ${i.canales} canal, ${i.kbps} kb/s, ${i.hz} Hz`);
  r = py(`b = pcm(${q(s.f)}, 'f32le')[20000:50000, 0]; print(json.dumps([amplitud_en(b, 44100, 440), amplitud_en(b, 44100, 660)]))`);
  ok(Math.abs(r[0] - 0.0625) < 0.01 && Math.abs(r[1] - 0.0625) < 0.01, `la mezcla a mono mantiene las dos notas (cada una a la mitad: 0,0625) (amplitudes ${r[0].toFixed(2)} y ${r[1].toFixed(2)})`);

  // mono a 22,05 kHz: el MP3 no admite esa frecuencia
  await reiniciarEntregas(); await ir('conversor-de-audio');
  await subir('#f-archivos', [spec('mono.wav', 'audio/wav')]); await elegir('#c-formato', 'mp3'); await elegir('#c-kbpsMp3', '128');
  await clic('Convertir'); await esperarEntregas();
  s = await guardarSalida(); i = mp3(s.f); r = notas(s.f, 44100);
  ok(i.hz === 44100 && i.canales === 1 && i.kbps === 128 && Math.abs(i.dur - 3.03) < 0.06, `22,05 kHz → el MP3 se guarda a ${i.hz} Hz, ${i.canales} canal, ${i.kbps} kb/s, ${i.dur.toFixed(2)} s`);
  ok(Math.abs(r[0] - 523.25) < 1, `la nota sigue siendo 523,25 Hz (${r[0].toFixed(2)} Hz)`);
  const nota = await texto('.herr-entrega, #f-salida, .herr-salida');
  ok(nota.includes('el MP3 se guarda a 44,1 kHz'), 'avisa del cambio de frecuencia: «' + nota.replace(/\s+/g, ' ').slice(0, 120) + '»');

  // tres canales: solo caben dos
  await reiniciarEntregas(); await ir('conversor-de-audio');
  await subir('#f-archivos', [spec('trio.wav', 'audio/wav')]); await elegir('#c-formato', 'mp3');
  await clic('Convertir'); await esperarEntregas();
  s = await guardarSalida(); i = mp3(s.f); r = notas(s.f, 48000);
  ok(i.canales === 2 && i.hz === 48000 && Math.abs(r[0] - 300) < 1 && Math.abs(r[1] - 500) < 1, `3 canales → se guardan los dos primeros (${r[0].toFixed(0)} y ${r[1].toFixed(0)} Hz, ${i.hz} Hz)`);
  ok((await texto('.herr-entrega, #f-salida, .herr-salida')).includes('MP3 admite dos canales'), 'avisa de que solo caben dos canales');
  sinErrores('conversor');

  // ============================================================ EXTRACTOR
  console.log('EXTRACTOR → MP3');
  await ir('extractor-de-audio-de-video');
  await subir('#f-archivos', [spec('video.mp4', 'video/mp4')]); await elegir('#c-formato', 'mp3'); await elegir('#c-kbpsMp3', '128');
  await clic('Extraer el audio'); ok(await esperarEntregas(), 'MP4 → MP3: hay archivo');
  s = await guardarSalida(); i = mp3(s.f); r = notas(s.f, 48000);
  ok(s.nombre === 'video-audio.mp3' && i.hz === 48000 && i.canales === 1 && i.kbps === 128 && Math.abs(i.dur - 3.03) < 0.06, `video-audio.mp3: ${i.hz} Hz, ${i.canales} canal, ${i.kbps} kb/s, ${i.dur.toFixed(2)} s`);
  ok(Math.abs(r[0] - 330) < 1, `el audio del vídeo es la nota de 330 Hz (${r[0].toFixed(2)} Hz)`);
  ok(/Listo: 1 audio extraído a MP3/.test(await estadoTexto()), 'mensaje: «' + (await estadoTexto()).slice(0, 60) + '»');
  sinErrores('extractor');

  // ============================================================ RECORTADOR
  console.log('RECORTADOR → MP3');
  await ir('recortador-de-audio');
  await subir('#f-archivos', [spec('tono.wav', 'audio/wav')]);
  ok(await hastaQue(() => c.js(`!document.querySelector('.recorte').hidden`)), 'aparece la onda');
  ok(await c.js(`document.querySelector('#c-kbps').closest('.campo').hidden && document.querySelector('#c-kbps-mp3').closest('.campo').hidden`), 'con WAV no se ve ninguna calidad');
  await elegir('#c-formato', 'mp3');
  ok(await c.js(`!document.querySelector('#c-kbps-mp3').closest('.campo').hidden && document.querySelector('#c-kbps').closest('.campo').hidden`), 'con MP3 aparece solo la calidad del MP3');
  await elegir('#c-kbps-mp3', '160'); await escribir('#c-inicio', '0:01'); await escribir('#c-fin', '0:02,5');
  await clic('Recortar'); ok(await esperarEntregas(), 'recorte: hay archivo');
  s = await guardarSalida(); i = mp3(s.f); r = notas(s.f, 44100, 8000, 20000);
  ok(s.nombre === 'tono-recortado.mp3' && i.kbps === 160 && i.canales === 2 && Math.abs(i.dur - 1.53) < 0.06, `tono-recortado.mp3: ${i.kbps} kb/s, ${i.canales} canales, ${i.dur.toFixed(2)} s`);
  ok(Math.abs(r[0] - 440) < 1.5 && Math.abs(r[1] - 660) < 1.5, `el recorte conserva las dos notas (${r[0].toFixed(1)} y ${r[1].toFixed(1)} Hz)`);
  await elegir('#c-formato', 'opus');
  ok(await c.js(`document.querySelector('#c-kbps-mp3').closest('.campo').hidden && !document.querySelector('#c-kbps').closest('.campo').hidden`), 'al volver a Opus se ve la calidad de Opus y no la del MP3');
  sinErrores('recortador');

  // ============================================================ UNIR
  console.log('UNIR → MP3');
  await ir('unir-audios');
  await subir('#f-archivos', [spec('tono.wav', 'audio/wav'), spec('mono.wav', 'audio/wav')]); await escribir('#c-pausa', '1'); await elegir('#c-formato', 'mp3'); await elegir('#c-kbpsMp3', '256');
  await clic('Unir los audios'); ok(await esperarEntregas(), 'unir: hay archivo');
  s = await guardarSalida(); i = mp3(s.f); r = notas(s.f, 44100, 190000, 30000);
  ok(s.nombre === 'audios-unidos.mp3' && i.kbps === 256 && i.canales === 2 && i.hz === 44100 && Math.abs(i.dur - 7.03) < 0.08, `audios-unidos.mp3: ${i.kbps} kb/s, ${i.canales} canales, ${i.hz} Hz, ${i.dur.toFixed(2)} s`);
  ok(Math.abs(r[0] - 523.25) < 1.5 && Math.abs(r[1] - 523.25) < 1.5, `el segundo audio suena a 523,25 Hz en los dos canales (${r[0].toFixed(1)} y ${r[1].toFixed(1)})`);
  sinErrores('unir');

  // ============================================================ VELOCIDAD
  console.log('VELOCIDAD → MP3');
  await ir('cambiar-velocidad-y-volumen-de-audio');
  await subir('#f-archivos', [spec('tono.wav', 'audio/wav')]); await escribir('#c-velocidad', '150'); await elegir('#c-formato', 'mp3');
  await clic('Aplicar cambios'); ok(await esperarEntregas(), 'velocidad: hay archivo');
  s = await guardarSalida(); i = mp3(s.f); r = notas(s.f, 44100, 8000, 20000);
  ok(s.nombre === 'tono-modificado.mp3' && i.kbps === 192 && Math.abs(i.dur - 2.03) < 0.06, `tono-modificado.mp3: ${i.kbps} kb/s, ${i.dur.toFixed(2)} s`);
  ok(Math.abs(r[0] - 440) < 2 && Math.abs(r[1] - 660) < 3, `con el tono mantenido sigue en 440 y 660 Hz (${r[0].toFixed(1)} y ${r[1].toFixed(1)})`);
  sinErrores('velocidad');

  // ============================================================ GENERAL
  console.log('GENERAL (la grabadora con micrófono simulado se prueba en audio-vivo.mjs)');
  ok(await c.js(`localStorage.length === 0 && sessionStorage.length === 0 && document.cookie === ''`), 'no se guarda nada en el navegador');
  const externas = await c.js(`performance.getEntriesByType('resource').filter(r => new URL(r.name).origin !== location.origin).map(r => r.name)`);
  ok(externas.length === 0, 'ninguna petición a otros dominios' + (externas.length ? ': ' + externas.join(', ') : ''));
} catch (e) {
  console.log('  ✗ Excepción: ' + (e && e.stack || e)); fallos.push('excepción');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
  ext.limpiar();
  await c.cerrar();
}
console.log(fallos.length ? `\n${fallos.length} fallos:\n- ` + fallos.join('\n- ') : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
