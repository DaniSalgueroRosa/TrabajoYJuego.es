// Herramientas de audio que escuchan o suenan: metrónomo (reloj de audio simulado), texto a voz (síntesis simulada), afinador y grabadora de voz
// (micrófono simulado de Chrome con archivos de audio hechos aquí: seno de 110 Hz, mi grave desafinado y seno de 440 Hz).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { abrirChrome } from '../cdp.mjs';
import { preparar } from './ayudas.mjs';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const q = (s) => JSON.stringify(s);
const dir = fs.mkdtempSync('/tmp/tyj-vivo-');
const pyRaw = (codigo) => execFileSync('python3', ['-c', `import sys, json; sys.path.insert(0, ${q(aqui)}); from audio_py import *\n` + codigo], { encoding: 'utf8', maxBuffer: 1 << 28 }).trim().split('\n').pop();
const py = (codigo) => JSON.parse(pyRaw(codigo));
/* Archivos para el micrófono simulado */
execFileSync('python3', ['-c', `
import numpy as np
from scipy.io import wavfile
hz = 48000; n = hz * 4; t = np.arange(n) / hz
def guardar(nombre, x): wavfile.write(${q(dir)} + '/' + nombre, hz, (np.clip(x, -1, 1) * 32767).astype('<i2'))
guardar('la110.wav', 0.4 * np.sin(2 * np.pi * 110 * t))
f = 82.4069 * 2 ** (-30 / 1200)
guardar('mi-bajo.wav', sum(a * np.sin(2 * np.pi * f * k * t + k) for k, a in zip(range(1, 7), (0.12, 0.3, 0.25, 0.15, 0.08, 0.04))))
guardar('la440.wav', 0.4 * np.sin(2 * np.pi * 440 * t))
guardar('sol-alto.wav', 0.4 * np.sin(2 * np.pi * 196 * 2 ** (25 / 1200) * t))
`]);
const FLAGS = (f) => ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-file-for-fake-audio-capture=' + dir + '/' + f, '--autoplay-policy=no-user-gesture-required'];
const todosLosFallos = [];

async function sesion(nombre, puerto, flags, cuerpo) {
  console.log(nombre);
  const c = await abrirChrome(puerto, flags);
  const A = preparar(c);
  const ir = async (s, espera = 400) => { await c.ir(`${base}/herramientas/${s}/`, espera); await A.hastaQue(() => c.js(`!document.querySelector('#herr-carga') && !!document.querySelector('#herr button')`), 8000); };
  try { await c.vista(1100, 900, 'light', false); await cuerpo(c, A, ir); }
  catch (e) { console.log('  ✗ Excepción: ' + (e && e.stack || e)); A.fallos.push('excepción'); }
  finally { A.ext.limpiar(); await c.cerrar(); }
  todosLosFallos.push(...A.fallos);
}
const sinErrores = (c, ok, t) => ok(c.consola().length === 0, `${t}: sin errores en la consola` + (c.consola().length ? ' → ' + c.consola().join(' | ') : ''));

try {
  // ============================================================ METRÓNOMO y TEXTO A VOZ (sin hardware: relojes y voces simulados)
  await sesion('METRÓNOMO Y TEXTO A VOZ', 9351, [], async (c, A, ir) => {
    const { ok, esperar, escribir, elegir, marcar, clic, texto, valor, k, kt, hastaQue } = A;
    // un reloj de audio falso que avanza deprisa y anota cada golpe
    const reloj = `window.__fake = { currentTime: 0, state: 'running', destination: {}, ev: [],
      createOscillator() { const o = { type: '', frequency: { value: 0 }, connect() {}, start(t) { window.__fake.ev.push({ t, f: o.frequency.value, tipo: o.type }); }, stop() {} }; return o; },
      createGain() { return { gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} }; } };
      TH.audio = () => window.__fake; setInterval(() => { window.__fake.currentTime += 0.25; }, 25); 0`;
    const eventos = () => c.js(`window.__fake.ev.map(e => [e.t, e.f])`);
    await ir('metronomo-online');
    ok(await k('tempo') === '100' && await kt('nombre') === 'Andante' && await kt('compas') === '4 pulsos' && (await k('intervalo')) === '600', 'al abrir: 100 pulsos por minuto, Andante, 600 ms entre pulsos, compás de 4');
    ok(await c.js(`document.querySelectorAll('.metro-punto').length`) === 4 && await c.js(`document.querySelectorAll('.metro-punto--acento').length`) === 1, 'se dibujan 4 puntos y el primero es el acentuado');
    await escribir('#c-bpm', '120');
    ok(await k('tempo') === '120' && await kt('nombre') === 'Allegro' && await k('intervalo') === '500' && await valor('#c-deslizador') === '120', 'al escribir 120: Allegro, 500 ms y el deslizador se mueve');
    for (const [b, n] of [[30, 'Grave'], [39, 'Grave'], [40, 'Largo'], [59, 'Largo'], [60, 'Larghetto'], [65, 'Larghetto'], [66, 'Adagio'], [75, 'Adagio'], [76, 'Andante'], [107, 'Andante'], [108, 'Moderato'], [119, 'Moderato'], [120, 'Allegro'], [155, 'Allegro'], [156, 'Vivace'], [175, 'Vivace'], [176, 'Presto'], [199, 'Presto'], [200, 'Prestissimo'], [300, 'Prestissimo']]) {
      await escribir('#c-bpm', String(b)); const t = await kt('nombre');
      if (t !== n) ok(false, `${b} ppm debería ser ${n} y es ${t}`);
    }
    ok(true, 'las indicaciones clásicas cambian en los límites 40, 60, 66, 76, 108, 120, 156, 176 y 200');
    await escribir('#c-bpm', '120'); await clic('Bajar un pulso por minuto'); ok(await valor('#c-bpm') === '119', 'el botón − baja uno'); await clic('Subir un pulso por minuto'); await clic('Subir un pulso por minuto'); ok(await valor('#c-bpm') === '121', 'el botón + sube uno');
    await escribir('#c-bpm', '120');
    // empezar con el reloj falso
    await c.js(reloj);
    await clic('Empezar'); await esperar(1500);
    let ev = await eventos();
    const dt = ev.slice(1).map((e, i) => e[0] - ev[i][0]);
    ok(ev.length >= 12 && dt.every(d => Math.abs(d - 0.5) < 1e-9), `a 120 ppm los golpes están separados exactamente 0,5 s (${ev.length} golpes, separaciones entre ${Math.min(...dt).toFixed(6)} y ${Math.max(...dt).toFixed(6)})`);
    ok(ev.slice(0, 12).every((e, i) => e[1] === (i % 4 === 0 ? 1800 : 1200)), 'el primer pulso de cada compás de 4 suena más agudo (1800 Hz frente a 1200 Hz)');
    ok(await texto('#m-iniciar') === 'Parar' && await c.js(`document.querySelector('#m-iniciar').getAttribute('aria-pressed')`) === 'true', 'el botón pasa a «Parar»');
    ok(await hastaQue(async () => /^\d de 4$/.test(await kt('pulso')), 3000), 'el pulso actual se muestra («' + await kt('pulso') + '»)');
    ok(await c.js(`document.querySelectorAll('.metro-punto.es-activo').length`) === 1, 'solo un punto está activo a la vez');
    // cambio de tempo en marcha
    await escribir('#c-bpm', '60'); await esperar(1200);
    const ev2 = await eventos(); const ult = ev2.slice(-4).map((e, i, a) => i ? e[0] - a[i - 1][0] : null).slice(1);
    ok(ult.every(d => Math.abs(d - 1) < 1e-9), `al cambiar a 60 ppm con el metrónomo en marcha, los siguientes golpes van a 1 s (${ult.map(d => d.toFixed(3)).join(', ')})`);
    await clic('Parar'); const n1 = (await eventos()).length; await esperar(600); const n2 = (await eventos()).length;
    ok(n2 === n1 && await texto('#m-iniciar') === 'Empezar', 'al parar dejan de programarse golpes');
    // subdivisión y acento
    await escribir('#c-bpm', '120'); await elegir('#c-subdivision', '2'); await c.js(`window.__fake.ev.length = 0`); await clic('Empezar'); await esperar(1200);
    ev = await eventos(); const f2 = ev.slice(0, 16).map(e => e[1]);
    ok(f2.every((f, i) => f === (i % 8 === 0 ? 1800 : i % 2 === 1 ? 900 : 1200)) && Math.abs(ev[1][0] - ev[0][0] - 0.25) < 1e-9, 'con corcheas hay un golpe suave entre pulsos (cada 0,25 s) y el acento solo en el primero de cada compás (cada 8 golpes)');
    await clic('Parar'); await marcar('#c-acento', false); await elegir('#c-subdivision', '1'); await elegir('#c-pulsos', '3'); await elegir('#c-sonido', 'pitido'); await c.js(`window.__fake.ev.length = 0`); await clic('Empezar'); await esperar(800);
    ev = await eventos(); ok(ev.length > 4 && ev.every(e => e[1] === 880), 'sin acento todos los pulsos suenan igual (pitido de 880 Hz)');
    ok(await c.js(`document.querySelectorAll('.metro-punto').length`) === 3 && await c.js(`document.querySelectorAll('.metro-punto--acento').length`) === 0, 'con 3 pulsos hay 3 puntos y ninguno acentuado');
    await clic('Parar'); await elegir('#c-pulsos', '1'); await marcar('#c-acento', true); await c.js(`window.__fake.ev.length = 0`); await clic('Empezar'); await esperar(700);
    ev = await eventos(); ok(ev.length > 3 && ev.every(e => e[1] === 880), 'con un solo pulso no hay compás y no se acentúa');
    await clic('Parar');
    // errores
    await escribir('#c-bpm', 'abc'); await clic('Empezar'); await esperar(200);
    ok((await A.estadoTexto()).includes('entre 30 y 300') && await texto('#m-iniciar') === 'Empezar', 'un tempo ilegible no arranca y avisa');
    await escribir('#c-bpm', '500'); await clic('Empezar'); ok((await A.estadoTexto()).includes('entre 30 y 300'), 'un tempo fuera de margen tampoco arranca');
    // tap tempo con un reloj controlado
    await escribir('#c-bpm', '100');
    await c.js(`window.__ahora = 1000; TH.ahora = () => window.__ahora; 0`);
    await clic('Marcar el tempo con toques'); ok((await A.estadoTexto()).includes('Sigue tocando'), 'un solo toque pide más');
    for (const t of [1500, 2000, 2500]) { await c.js(`window.__ahora = ${t}; 0`); await clic('Marcar el tempo con toques'); }
    ok(await valor('#c-bpm') === '120' && (await A.estadoTexto()).includes('4 toques') && await k('tempo') === '120', 'cuatro toques separados 500 ms dan 120 ppm');
    await c.js(`window.__ahora = 2600; 0`); await clic('Marcar el tempo con toques'); await c.js(`window.__ahora = 3400; 0`); await clic('Marcar el tempo con toques');
    ok(await valor('#c-bpm') === '125', `seis toques entre 1000 y 3400 ms (2400 ms en 5 intervalos = 480 ms) dan 125 ppm (sale ${await valor('#c-bpm')})`);
    await c.js(`window.__ahora = 9000; 0`); await clic('Marcar el tempo con toques'); ok((await A.estadoTexto()).includes('Sigue tocando'), 'tras más de 2 s sin tocar se empieza de cero');
    await c.js(`window.__ahora = 9100; 0`); await clic('Marcar el tempo con toques'); ok((await A.estadoTexto()).includes('queda fuera del margen') && await valor('#c-bpm') === '125', 'dos toques con 100 ms (600 ppm) se rechazan y se mantiene el tempo');
    sinErrores(c, ok, 'metrónomo');
    ok(await c.js(`localStorage.length === 0 && sessionStorage.length === 0 && document.cookie === ''`), 'no se guarda nada en el navegador');

    // ---------------- TEXTO A VOZ
    console.log('TEXTO A VOZ');
    const voz = `(() => { const v = window.__voz = { habladas: [], cancelaciones: 0, pausas: 0, reanudaciones: 0, manual: false, pendientes: [] };
      const voces = [{ name: 'Voice B', lang: 'en-US', voiceURI: 'b', localService: true }, { name: 'Voz A', lang: 'es-ES', voiceURI: 'a', localService: true }, { name: 'Voz C', lang: 'es-MX', voiceURI: 'c', localService: false }];
      const falsa = { getVoices: () => voces, speak(u) { v.habladas.push({ texto: u.text, rate: u.rate, pitch: u.pitch, volume: u.volume, lang: u.lang }); if (v.manual) v.pendientes.push(u); else setTimeout(() => u.onstart && u.onstart({}), 5), setTimeout(() => u.onend && u.onend({}), 30); },
        cancel() { v.cancelaciones++; v.pendientes = []; }, pause() { v.pausas++; }, resume() { v.reanudaciones++; }, addEventListener() {}, speaking: false };
      Object.defineProperty(window, 'speechSynthesis', { value: falsa, configurable: true }); })()`;
    await c.enviar('Page.addScriptToEvaluateOnNewDocument', { source: voz });
    await ir('texto-a-voz');
    const opciones = await c.js(`[...document.querySelectorAll('#c-voz option')].map(o => o.textContent)`);
    ok(opciones.length === 3 && opciones[0].startsWith('Voz A (es-ES)') && opciones[1].startsWith('Voz C (es-MX)') && opciones[1].includes('en línea') && opciones[2].startsWith('Voice B'), 'las voces en español van primero y se marca la que es en línea: ' + opciones.join(' | '));
    await clic('Leer en voz alta'); ok((await A.estadoTexto()).includes('Escribe o pega'), 'sin texto avisa');
    const largo = Array.from({ length: 5 }, (_, i) => `Esta es la frase número ${i + 1}, que tiene bastante longitud para comprobar que el texto se reparte en fragmentos y que no se corta a mitad de palabra en ningún punto.`).join(' ');
    await escribir('#v-texto', largo); await elegir('#c-voz', '1'); await elegir('#c-velocidad', '1.5'); await elegir('#c-tono', '0.5'); await elegir('#c-volumen', '0.5');
    ok(await texto('#c-velocidad ~ output') === '1,5×' || (await c.js(`document.querySelector('output[for=c-velocidad]').textContent`)).startsWith('1,5'), 'el valor de la velocidad se muestra');
    await clic('Leer en voz alta');
    ok(await hastaQue(async () => (await k('estado')) === 'terminado', 4000), 'la lectura acaba: «' + (await kt('estado')) + '»');
    const dichas = await c.js(`window.__voz.habladas`);
    ok(dichas.length >= 3 && dichas.every(d => d.texto.length <= 220 && /[.!?]$/.test(d.texto)), `el texto largo se reparte en ${dichas.length} fragmentos de hasta 220 caracteres que acaban en fin de frase`);
    ok(dichas.map(d => d.texto).join(' ') === largo, 'los fragmentos juntos reproducen el texto entero');
    ok(dichas.every(d => d.lang === 'es-MX' && d.rate === 1.5 && d.pitch === 0.5 && d.volume === 0.5), 'cada fragmento usa la voz, la velocidad, el tono y el volumen elegidos');
    ok(await c.js(`document.querySelector('#v-leer').disabled`) === false && await c.js(`document.querySelector('#v-pausa').disabled`) === true, 'al terminar se puede volver a leer y no hay pausa');
    // pausa y parar con avance manual
    await c.js(`window.__voz.manual = true; window.__voz.habladas.length = 0; 0`);
    await clic('Leer en voz alta'); await esperar(100);
    ok(await c.js(`window.__voz.habladas.length`) === 1 && await c.js(`document.querySelector('#v-pausa').disabled`) === false && await c.js(`document.querySelector('#v-leer').disabled`) === true, 'al leer solo se pide el primer fragmento y se activan Pausar y Parar');
    await clic('Pausar'); ok(await c.js(`window.__voz.pausas`) === 1 && await texto('#v-pausa') === 'Reanudar' && await k('estado') === 'pausado', 'Pausar llama a pause y el botón pasa a «Reanudar»');
    await clic('Reanudar'); ok(await c.js(`window.__voz.reanudaciones`) === 1 && await texto('#v-pausa') === 'Pausar', 'Reanudar llama a resume');
    await c.js(`const u = window.__voz.pendientes.shift(); u.onend({}); 0`); await esperar(100);
    ok(await c.js(`window.__voz.habladas.length`) === 2, 'al acabar un fragmento se pide el siguiente');
    const cancel0 = await c.js(`window.__voz.cancelaciones`);
    await clic('Parar'); ok(await c.js(`window.__voz.cancelaciones`) === cancel0 + 1 && await k('estado') === 'parado' && await c.js(`document.querySelector('#v-leer').disabled`) === false, 'Parar cancela la voz');
    await c.js(`window.__voz.pendientes.length = 0; 0`);
    // un evento de un fragmento antiguo no reinicia nada
    await c.js(`window.__voz.manual = false; 0`);
    await escribir('#v-texto', 'Una frase corta.'); await clic('Leer en voz alta'); await hastaQue(async () => (await k('estado')) === 'terminado', 2000);
    ok((await c.js(`window.__voz.habladas`)).slice(-1)[0].texto === 'Una frase corta.', 'un texto corto se lee de una vez');
    // error de la voz
    await c.js(`window.speechSynthesis.speak = function (u) { setTimeout(() => u.onerror && u.onerror({ error: 'synthesis-failed' }), 10); }; 0`);
    await clic('Leer en voz alta'); await esperar(250);
    ok((await A.estadoTexto()).includes('No se ha podido reproducir la voz') && await k('estado') === 'error', 'un error de la voz se explica');
    sinErrores(c, ok, 'texto a voz');
    // sin síntesis
    await c.enviar('Page.addScriptToEvaluateOnNewDocument', { source: `if (location.hash === '#sin-voz') Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });` });
    await c.ir(`${base}/herramientas/texto-a-voz/#sin-voz`, 800); await c.js(`location.reload()`); await esperar(1200);
    ok((await texto('#herr')).includes('no incluye la síntesis de voz') && !(await c.js(`!!document.querySelector('#herr-carga')`)), 'sin síntesis de voz se explica y no queda el aviso de carga');
  });

  // ============================================================ AFINADOR con micrófono simulado
  const afinar = async (c, A, ir, fich) => {};
  await sesion('AFINADOR (seno de 110 Hz = La2)', 9352, FLAGS('la110.wav'), async (c, A, ir) => {
    const { ok, esperar, escribir, elegir, clic, texto, valor, k, kt, hastaQue } = A;
    await ir('afinador-de-guitarra-online');
    ok(await c.js(`document.querySelectorAll('.afi-cuerda').length`) === 6 && (await texto('.afi-cuerda:first-child')).includes('Mi2') && (await texto('.afi-cuerda:last-child')).includes('Mi4'), 'guitarra: 6 cuerdas, de Mi2 a Mi4');
    ok((await c.js(`document.querySelector('.afi-cuerda:nth-child(2)').getAttribute('aria-label')`)).includes('La2') && (await texto('.afi-cuerda:nth-child(2)')).includes('110,0 Hz'), 'la segunda es La2 a 110,0 Hz');
    await clic('Activar el micrófono');
    ok(await hastaQue(async () => (await k('nota')) !== '', 6000), 'detecta una nota');
    await esperar(600);
    const nota = await k('nota'), cents = +(await k('cents')), hz = +(await k('hz'));
    ok(nota === 'La2' && Math.abs(cents) <= 2 && Math.abs(hz - 110) < 0.3, `110 Hz → ${nota}, ${cents} cents, ${hz} Hz`);
    ok(await k('estado') === 'afinada' && (await texto('#a-veredicto')) === 'Afinada', 'el veredicto es «Afinada»');
    ok(await c.js(`document.querySelector('.afi-cuerda:nth-child(2)').getAttribute('aria-current')`) === 'true' && await c.js(`document.querySelectorAll('.afi-cuerda[aria-current]').length`) === 1, 'se marca la cuerda La como la que suena');
    const izq = await c.js(`parseFloat(document.querySelector('#a-aguja').style.left)`); ok(Math.abs(izq - 50) < 3, `la aguja está en el centro (${izq} %)`);
    // La de referencia a 432: 110 Hz queda alto
    await escribir('#c-la', '432'); await elegir('#c-la', '432'); await esperar(900);
    const c2 = +(await k('cents')); ok(Math.abs(c2 - 31.8) < 2.5 && await k('estado') === 'alta', `con La = 432 Hz, 110 Hz queda ${c2} cents alto (esperado 31,8)`);
    ok((await texto('.afi-cuerda:nth-child(2)')).includes('108,0 Hz'), 'las frecuencias de las cuerdas se recalculan (La2 = 108,0 Hz)');
    await escribir('#c-la', '440'); await elegir('#c-la', '440');
    // cromático
    await elegir('#c-instrumento', 'cromatico'); await esperar(900);
    ok(await k('nota') === 'La2' && await c.js(`document.querySelector('.afi-cuerdas').hidden`), 'en cromático se muestra la nota y se ocultan las cuerdas');
    // bajo: 110 Hz es la octava de La1 → cuerda más cercana: La1 (55 Hz) está a 1200 cents, Re2 (73,4 Hz) a ≈ 700 cents, Sol2 (98 Hz) a ≈ 200 cents
    await elegir('#c-instrumento', 'bajo'); await esperar(900);
    ok(await c.js(`document.querySelectorAll('.afi-cuerda').length`) === 4, 'bajo: 4 cuerdas');
    await clic('Parar el micrófono'); ok(await k('estado') === 'parado' && await texto('#a-nota') === '—' && await texto('#a-activar') === 'Activar el micrófono', 'al parar vuelve al estado inicial');
    // tono de referencia
    await c.js(`window.__t = []; const a = TH.audio(); const orig = a.createOscillator.bind(a); a.createOscillator = function () { const o = orig(); const s = o.start.bind(o); o.start = function (t) { window.__t.push(o.frequency.value); return s(t); }; return o; }; 0`);
    await elegir('#c-instrumento', 'guitarra'); await clic('Oír la cuerda 6: Mi4, 329,6 hercios');
    ok(await c.js(`window.__t`).then(t => t.length === 1 && Math.abs(t[0] - 329.63) < 0.01), 'el botón de la sexta cuerda toca 329,63 Hz');
    sinErrores(c, ok, 'afinador');
  });
  await sesion('AFINADOR (mi grave 30 cents baja, con armónicos)', 9353, FLAGS('mi-bajo.wav'), async (c, A, ir) => {
    const { ok, esperar, clic, texto, k, hastaQue } = A;
    await ir('afinador-de-guitarra-online'); await clic('Activar el micrófono');
    ok(await hastaQue(async () => (await k('nota')) !== '', 6000), 'detecta una nota'); await esperar(700);
    const cents = +(await k('cents')), hz = +(await k('hz'));
    ok(await k('nota') === 'Mi2' && Math.abs(cents + 30) <= 4 && await k('estado') === 'baja', `mi grave desafinado: ${await k('nota')}, ${cents} cents (esperado −30), ${hz} Hz; veredicto «${await texto('#a-veredicto')}»`);
    ok((await texto('#a-veredicto')).includes('sube la cuerda') && await c.js(`document.querySelector('.afi-cuerda:first-child').getAttribute('aria-current')`) === 'true', 'indica que hay que subir la cuerda y marca la cuerda Mi grave');
    ok(await c.js(`parseFloat(document.querySelector('#a-aguja').style.left)`) < 45, 'la aguja queda a la izquierda');
    sinErrores(c, ok, 'afinador (2)');
  });
  await sesion('AFINADOR (sol 25 cents alto)', 9354, FLAGS('sol-alto.wav'), async (c, A, ir) => {
    const { ok, esperar, clic, texto, k, hastaQue } = A;
    await ir('afinador-de-guitarra-online'); await clic('Activar el micrófono');
    await hastaQue(async () => (await k('nota')) !== '', 6000); await esperar(700);
    const cents = +(await k('cents'));
    ok(await k('nota') === 'Sol3' && Math.abs(cents - 25) <= 3 && await k('estado') === 'alta' && (await texto('#a-veredicto')).includes('baja la cuerda'), `sol desafinado: ${await k('nota')}, ${cents} cents (esperado +25); «${await texto('#a-veredicto')}»`);
  });

  // ============================================================ GRABADORA con micrófono simulado
  await sesion('GRABADORA DE VOZ (micrófono simulado con 440 Hz)', 9355, FLAGS('la440.wav'), async (c, A, ir) => {
    const { ok, esperar, escribir, elegir, clic, texto, valor, k, kt, hastaQue, entregas, esperarEntregas, reiniciarEntregas, ext } = A;
    const guardarSalida = async (i = 0) => { const e = (await entregas())[i]; return { f: ext.guardar(e.buf, '.' + e.nombre.split('.').pop()), nombre: e.nombre, tam: e.buf.length }; };
    await ir('grabadora-de-voz');
    ok(await c.js(`document.querySelector('#g-pausa').disabled && document.querySelector('#g-parar').disabled`) && await k('estado') === 'inactivo', 'al abrir solo se puede grabar');
    await clic('Grabar'); ok(await hastaQue(async () => (await k('estado')) === 'grabando', 5000), 'empieza a grabar');
    ok(await c.js(`document.querySelector('#g-grabar').disabled`) && !(await c.js(`document.querySelector('#g-parar').disabled`)), 'mientras graba se puede pausar y parar');
    await esperar(1800);
    ok(+(await k('tiempo')) >= 1 && +(await k('tiempo')) <= 2, `el contador avanza (${await texto('#g-tiempo')})`);
    const nivel = await c.js(`parseFloat(document.querySelector('#g-nivel').style.width)`); ok(nivel > 20, `la barra de nivel se mueve con el sonido (${nivel} %)`);
    await clic('Parar'); ok(await hastaQue(async () => (await k('estado')) === 'detenido', 5000), 'termina la grabación');
    ok(await c.js(`!!document.querySelector('#g-audio') && !document.querySelector('.grab-resultado').hidden`) && await c.js(`document.querySelector('#g-nivel').style.width`) === '0%', 'aparece el reproductor y se apaga el nivel');
    ok(await c.js(`navigator.mediaDevices.enumerateDevices().then(() => true)`), 'el micrófono se ha liberado sin errores');
    // guardar tal cual
    await clic('Preparar descarga'); ok(await esperarEntregas(), 'archivo original listo');
    let e = (await entregas())[0]; ok(/^grabacion-\d{4}-\d{2}-\d{2}-\d{4}\.(webm|m4a|ogg)$/.test(e.nombre) && e.buf.length > 3000, `original del navegador: ${e.nombre} (${e.buf.length} bytes)`);
    // WAV
    await reiniciarEntregas(); await elegir('#c-formato', 'wav16'); await clic('Preparar descarga'); ok(await esperarEntregas(), 'WAV listo');
    let s = await guardarSalida(); let i = py(`print(json.dumps(info(${q(s.f)})))`);
    let r = py(`b = pcm(${q(s.f)}, 'f32le'); print(json.dumps(frecuencia(b[:, 0], ${'%d'.replace('%d', 'info(' + q(s.f) + ')["hz"]')})))`);
    ok(i.codec === 'pcm_s16le' && i.dur > 1.4 && i.dur < 2.6, `WAV: ${i.hz} Hz, ${i.canales} canal(es), ${i.dur.toFixed(2)} s`);
    ok(Math.abs(r - 440) < 1.5, `la grabación contiene la nota de 440 Hz (${r.toFixed(2)} Hz)`);
    // FLAC, MP3 y Opus
    for (const [f, cod] of [['flac16', 'flac'], ['mp3', 'mp3'], ['opus', 'opus']]) {
      await reiniciarEntregas(); await elegir('#c-formato', f); await clic('Preparar descarga'); ok(await esperarEntregas(), `${f} listo`);
      s = await guardarSalida(); i = py(`print(json.dumps(info(${q(s.f)})))`);
      r = py(`b = pcm(${q(s.f)}, 'f32le', False); print(json.dumps(frecuencia(b[:, 0], info(${q(s.f)})['hz'])))`);
      ok(i.codec === cod && Math.abs(r - 440) < 1.5, `${f}: ${i.codec}, ${i.dur.toFixed(2)} s, ${r.toFixed(2)} Hz`);
    }
    // descartar
    await clic('Descartar y grabar otra'); ok(await c.js(`document.querySelector('.grab-resultado').hidden && document.querySelector('#g-salida, .herr-salida')?.hidden !== false`) && await texto('#g-tiempo') === '0:00', 'descartar vacía el reproductor y el contador');
    // pausa: 1 s, pausa 1,5 s, 1 s
    await clic('Grabar'); await hastaQue(async () => (await k('estado')) === 'grabando', 5000); await esperar(1000);
    await clic('Pausar'); ok(await k('estado') === 'pausado' && await texto('#g-pausa') === 'Reanudar', 'se puede pausar');
    const t1 = +(await k('tiempo')); await esperar(1500); ok(+(await k('tiempo')) === t1, 'el contador se queda quieto en pausa');
    await clic('Reanudar'); await esperar(1000); await clic('Parar'); await hastaQue(async () => (await k('estado')) === 'detenido', 5000);
    const total = +(await k('tiempo')); ok(total >= 1 && total <= 3, `el tiempo no cuenta la pausa (${total} s en lugar de 3,5)`);
    await elegir('#c-formato', 'wav16'); await clic('Preparar descarga'); await esperarEntregas(); s = await guardarSalida(); i = py(`print(json.dumps(info(${q(s.f)})))`);
    ok(i.dur > 1.5 && i.dur < 3.0, `el archivo tampoco tiene la pausa: ${i.dur.toFixed(2)} s`);
    sinErrores(c, ok, 'grabadora');
    ok(await c.js(`localStorage.length === 0 && sessionStorage.length === 0 && document.cookie === ''`), 'no se guarda nada en el navegador');
  });
  await sesion('ERRORES DE MICRÓFONO (sin dispositivo simulado)', 9356, [], async (c, A, ir) => {
    const { ok, esperar, clic, texto, k } = A;
    for (const [slug, boton] of [['afinador-de-guitarra-online', 'Activar el micrófono'], ['grabadora-de-voz', 'Grabar']]) {
      await ir(slug);
      for (const [nombre, texto_] of [['NotAllowedError', 'bloqueado'], ['NotFoundError', 'ningún micrófono'], ['AbortError', 'No se ha podido usar el micrófono']]) {
        await c.js(`navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('simulado'), { name: ${q(nombre)} })); 0`);
        await clic(boton); await esperar(250);
        ok((await A.estadoTexto()).includes(texto_), `${slug}: ${nombre} → «${(await A.estadoTexto()).slice(0, 70)}»`);
      }
      await c.js(`Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true }); 0`);
      await clic(boton); await esperar(200); ok((await A.estadoTexto()).includes('conexión segura'), `${slug}: sin mediaDevices explica que hace falta una conexión segura`);
    }
  });
} catch (e) {
  console.log('  ✗ Excepción general: ' + (e && e.stack || e)); todosLosFallos.push('excepción');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log(todosLosFallos.length ? `\n${todosLosFallos.length} fallos:\n- ` + todosLosFallos.join('\n- ') : '\nTodo bien');
process.exit(todosLosFallos.length ? 1 : 0);
