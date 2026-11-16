// Tests de «Reacción y puntería»: se juegan de verdad en Chrome (eventos dentro de la página) y se comprueban las cifras.
import { iniciar, ptr, esperar } from './ayudas.mjs';
const { c, ok, texto, clic, abrir, cerrar } = await iniciar(['--autoplay-policy=no-user-gesture-required']);
const ARENA = `document.querySelector('.tt-arena')`;
const dato = (i) => c.js(`document.querySelectorAll('.tt-dato-v')[${i}]?.textContent || ''`);
const hayResultado = async (t = 4000) => { for (let i = 0; i < t / 100; i++) { if (await c.js(`!!document.querySelector('.tt-res')`)) return true; await esperar(100); } return false; };
const estado = () => c.js(`document.querySelector('.tt-arena')?.getAttribute('data-estado')`);
const num = (s) => parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.'));
/** Un intento completo de reacción: empieza, espera a la señal (según `senal()`), aguarda `retraso` ms y pulsa. */
const intento = (senal, retraso) => c.js(`(async () => {
  const a = ${ARENA}, pausa = (ms) => new Promise(r => setTimeout(r, ms));
  a.dispatchEvent(${ptr()}); await pausa(150);
  const limite = performance.now() + 8000;
  while (!(${senal}) && performance.now() < limite) await pausa(4);
  await pausa(${retraso});
  a.dispatchEvent(${ptr()});
  return true; })()`);
try {
  await c.vista(1100, 900, 'light', false);

  console.log('TIEMPO DE REACCIÓN');
  await abrir('test-de-tiempo-de-reaccion');
  ok((await texto('.tt-arena')).includes('Pulsa para empezar'), 'antes de empezar invita a pulsar');
  await c.js(`${ARENA}.dispatchEvent(${ptr()})`); await esperar(120);
  ok(await estado() === 'espera' && (await texto('.tt-arena')).includes('Espera'), 'tras pulsar, la zona pasa a «Espera…» (roja)');
  await esperar(320);
  await c.js(`${ARENA}.dispatchEvent(${ptr()})`); await esperar(100);
  ok(await estado() === 'pronto' && (await texto('.tt-arena')).includes('Demasiado pronto'), 'pulsar antes de tiempo se avisa y no cuenta');
  ok(await dato(0) === '1/5' && await dato(1) === '—', 'el intento anticipado no suma');
  await esperar(450);
  await intento(`a.getAttribute('data-estado') === 'ya'`, 250);
  const u = num(await dato(1));
  ok(u >= 240 && u < 420, 'un intento con 250 ms de espera mide unos 250 ms (' + u + ')');
  ok(await dato(0) === '2/5', 'el marcador avanza a 2/5');
  await esperar(350);
  await c.js(`(async () => { const a = ${ARENA}, p = (ms) => new Promise(r => setTimeout(r, ms)); a.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); await p(150); while (a.getAttribute('data-estado') !== 'ya') await p(4); await p(200); a.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })); })()`);
  ok(await dato(0) === '3/5', 'con el teclado (Intro y barra) también se puede jugar');
  for (let i = 0; i < 3; i++) { await esperar(350); await intento(`a.getAttribute('data-estado') === 'ya'`, 200); }
  ok(await hayResultado(3000), 'tras cinco intentos sale el resultado');
  let r = await texto('.tt-res');
  ok(/\d+\s*ms/.test(r) && r.includes('Mejor intento') && r.includes('Peor intento') && r.includes('Mediana') && r.includes('Variación'), 'el resultado trae media, mejor, peor, mediana y variación');
  ok((await c.js(`document.querySelectorAll('.tt-barra').length`)) === 5, 'el gráfico tiene cinco barras');
  await clic('Repetir el test'); await esperar(200);
  ok(!(await c.js(`!!document.querySelector('.tt-res')`)) && await dato(0) === '1/5', 'repetir limpia el resultado');
  ok((await c.js(`document.querySelectorAll('.tt-texto h2').length`)) >= 4, 'tiene al menos cuatro apartados de texto');

  console.log('REACCIÓN AUDITIVA');
  await abrir('reaccion-auditiva');
  await c.js(`window.__pit = 0; const o = AudioContext.prototype.createOscillator; AudioContext.prototype.createOscillator = function () { window.__pit++; return o.apply(this, arguments); };`);
  ok(await clic('Probar el sonido'), 'hay botón para probar el sonido');
  await esperar(150);
  ok((await texto('.tt-aviso')).toLowerCase().includes('pitido') && await c.js(`window.__pit === 1`), 'probar el sonido emite un pitido y lo explica');
  await c.js(`window.__pit = 0`);
  await c.js(`${ARENA}.dispatchEvent(${ptr()})`);
  let vistoCambio = false;
  const limite = Date.now() + 8000;
  while (Date.now() < limite && await c.js(`window.__pit === 0`)) { if ((await estado()) !== 'espera') vistoCambio = true; await esperar(8); }
  ok(await c.js(`window.__pit === 1`), 'tras la espera suena un pitido');
  await esperar(40);
  ok(await estado() === 'espera' && (await texto('.tt-arena')).includes('Escucha'), 'mientras suena, la zona no cambia de color ni de texto');
  await esperar(180);
  await c.js(`${ARENA}.dispatchEvent(${ptr()})`); await esperar(100);
  const ua = num(await dato(1));
  ok(ua > 60 && ua < 330, 'el primer intento mide unos 150–200 ms (' + ua + ')');
  for (let i = 0; i < 4; i++) {
    await esperar(350);
    await c.js(`window.__pit = 0; ${ARENA}.dispatchEvent(${ptr()})`);
    for (let k = 0; k < 1500 && await c.js(`window.__pit === 0`); k++) await esperar(8);
    await esperar(200);
    await c.js(`${ARENA}.dispatchEvent(${ptr()})`);
  }
  ok(await hayResultado(3000), 'tras cinco intentos sale el resultado');
  r = await texto('.tt-res');
  ok(r.includes('Tu tiempo de reacción al sonido') && r.includes('Mejor intento'), 'el resultado habla del sonido y trae el desglose');

  console.log('TEST DE PUNTERÍA');
  await abrir('test-de-punteria');
  const OBJ = `document.querySelector('.pu-obj')`, AREA = `document.querySelector('.pu-area')`;
  ok(await c.js(`!!${OBJ}`), 'al principio hay un círculo para empezar');
  await c.js(`${OBJ}.dispatchEvent(${ptr()})`); await esperar(50);
  ok(await dato(0) === '0/30', 'pulsar el primero solo empieza (0/30)');
  await c.js(`${AREA}.dispatchEvent(${ptr()})`);
  await c.js(`${OBJ}.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 2 }))`);
  ok(await dato(2) === '1' && await dato(0) === '0/30', 'un clic fuera suma un fallo y el botón derecho no cuenta');
  await c.js(`(async () => { for (let i = 0; i < 30; i++) { const o = ${OBJ}; await new Promise(r => setTimeout(r, 30)); o.dispatchEvent(${ptr()}); } })()`);
  ok(await hayResultado(2000), 'al pulsar los 30 sale el resultado');
  r = await texto('.tt-res');
  ok(r.includes('Tu puntería') && r.includes('Fallos') && r.includes('97 %'), '30 aciertos y 1 fallo = 97 % de precisión');
  ok(r.includes('Mejor objetivo') && r.includes('Mediana') && r.includes('Tiempo total'), 'salen los detalles');
  ok(!(await c.js(`!!${OBJ}`)), 'al acabar se quitan los círculos');
  ok((await c.js(`document.querySelectorAll('.tt-barra').length`)) === 30, 'el gráfico tiene 30 barras');
  await clic('Repetir el test'); await esperar(200);
  ok(await c.js(`!!${OBJ}`) && await dato(0) === '0/30', 'repetir deja otro círculo de inicio');

  console.log('ENTRENADOR DE PUNTERÍA');
  await abrir('entrenador-de-punteria');
  // el reloj de la página va 6 veces más rápido para no esperar 30 s reales por cada modo
  const acelerar = `(() => { const real = performance.now.bind(performance), t0 = real(); performance.now = () => t0 + (real() - t0) * 6; return true; })()`;
  await c.js(acelerar);
  ok(await c.js(`document.querySelectorAll('.tt-chip').length`) === 7, 'hay chips de duración, tamaño y modo (2 + 3 + 2)');
  ok(await clic('Pequeño') && await clic('Grande'), 'se puede cambiar el tamaño');
  ok(await clic('Empezar'), 'hay botón para empezar');
  await esperar(100);
  ok(await c.js(`document.querySelectorAll('.en-obj').length === 1`), 'en el modo «Un objetivo» hay un círculo a la vez');
  ok(await c.js(`[...document.querySelectorAll('.tt-chip')].every(b => b.disabled)`), 'durante la sesión no se pueden cambiar los ajustes');
  await c.js(`document.querySelector('.en-area').dispatchEvent(${ptr()})`);
  ok(await dato(2) === '1', 'clic fuera del objetivo = fallo');
  await c.js(`(async () => { const fin = performance.now() + 30500; while (performance.now() < fin && !document.querySelector('.tt-res')) { document.querySelector('.en-obj')?.dispatchEvent(${ptr()}); await new Promise(r => setTimeout(r, 12)); } })()`);
  ok(await hayResultado(3000), 'a los 30 s (del reloj acelerado) sale el resultado');
  r = await texto('.tt-res');
  ok(r.includes('Tu entrenamiento') && r.includes('Precisión') && r.includes('Aciertos por segundo') && r.includes('Ajustes'), 'el resultado trae precisión, aciertos por segundo y ajustes');
  ok(r.includes('30 s · tamaño grande · un objetivo'), 'recuerda los ajustes usados');
  ok((await c.js(`document.querySelectorAll('.tt-barra').length`)) === 6, 'el gráfico reparte la sesión en seis tramos');
  ok(await c.js(`document.querySelectorAll('.en-obj').length === 0`), 'al acabar no quedan círculos');
  await clic('Repetir el test'); await esperar(200);
  ok(await clic('Que se encogen'), 'se cambia al modo «Que se encogen»');
  await clic('Empezar'); await esperar(150);
  const n0 = await c.js(`document.querySelectorAll('.en-obj').length`);
  await esperar(250);
  ok(n0 >= 1 && await c.js(`document.querySelectorAll('.en-obj').length`) <= 3, 'en el modo que se encogen hay hasta tres círculos');
  await esperar(500);
  ok(await c.js(`[...document.querySelectorAll('.en-obj')].some(o => /scale\\(0\\.[0-9]+\\)/.test(o.style.transform))`), 'los círculos se encogen');
  await esperar(700);
  ok(num(await dato(2)) >= 1, 'los círculos que se esfuman se anotan como fallos (' + await dato(2) + ')');
  await c.js(`(async () => { const fin = performance.now() + 30500; while (performance.now() < fin && !document.querySelector('.tt-res')) { document.querySelector('.en-obj')?.dispatchEvent(${ptr()}); await new Promise(r => setTimeout(r, 30)); } })()`);
  ok(await hayResultado(3000), 'sale el resultado del modo que se encogen');
  r = await texto('.tt-res');
  ok(r.includes('Objetivos que se esfumaron') && r.includes('objetivos que se encogen'), 'el resultado cuenta los objetivos esfumados');

  console.log('COORDINACIÓN MANO-OJO');
  await abrir('coordinacion-mano-ojo');
  ok(await clic('10 s'), 'se elige 10 s');
  const sigue = (seguir) => `(async () => {
    const area = document.querySelector('.mo-area'), obj = document.querySelector('.mo-obj'), pausa = (ms) => new Promise(r => setTimeout(r, ms));
    const punto = () => { const b = area.getBoundingClientRect(); return [b.left + parseFloat(obj.getAttribute('data-x')), b.top + parseFloat(obj.getAttribute('data-y'))]; };
    const ev = (tipo, x, y) => area.dispatchEvent(new PointerEvent(tipo, { bubbles: true, pointerType: 'mouse', button: 0, clientX: x, clientY: y }));
    let [x, y] = punto();
    ev('pointermove', x, y); ev('pointerdown', x, y);
    const fin = performance.now() + 10600;
    while (performance.now() < fin && !document.querySelector('.tt-res')) {
      ${seguir ? `[x, y] = punto(); ev('pointermove', x, y);` : `const b = area.getBoundingClientRect(); ev('pointermove', b.left + 4, b.top + 4);`}
      await pausa(16);
    }
    return true; })()`;
  await c.js(sigue(true));
  ok(await hayResultado(3000), 'a los 10 s sale el resultado');
  r = await texto('.tt-res');
  const pct = num(r.match(/(\d+)\s*%\s*del tiempo dentro/)?.[1] || '0');
  ok(pct >= 85, 'siguiendo el círculo con fidelidad se queda dentro casi todo el tiempo (' + pct + ' %)');
  ok(r.includes('Mejor racha dentro') && r.includes('Distancia media al centro') && r.includes('Tamaño del círculo'), 'salen racha, distancia y tamaño');
  ok((await c.js(`document.querySelectorAll('.tt-barra').length`)) === 10, 'el gráfico tiene una barra por segundo');
  await clic('Repetir el test'); await esperar(300);
  await c.js(sigue(false));
  ok(await hayResultado(3000), 'sale el resultado quedándose quieto en una esquina');
  r = await texto('.tt-res');
  const pct2 = num(r.match(/(\d+)\s*%\s*del tiempo dentro/)?.[1] || '100');
  ok(pct2 < 40, 'quedarse en una esquina da un porcentaje bajo (' + pct2 + ' %)');
  await clic('Repetir el test'); await esperar(300);
  ok(await c.js(`document.querySelector('.mo-obj').getAttribute('data-dentro') === '0'`), 'tras repetir el círculo vuelve a esperar en el centro');

  console.log('APM');
  await abrir('apm-acciones-por-minuto');
  ok(await clic('10 s'), 'se elige 10 s');
  const tecla = (k, extra = '') => `document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '${k.length === 1 ? k : k}', code: '${k.length === 1 ? 'Key' + k.toUpperCase() : k}', bubbles: true, cancelable: true, ${extra} }))`;
  await c.js(`${tecla('Control')}; ${tecla('Shift')}; ${tecla('Tab')}`);
  await c.js(`document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', code: 'KeyC', ctrlKey: true, bubbles: true, cancelable: true }))`);
  ok(await dato(1) === '0', 'Ctrl, Mayús, Tab y los atajos con Ctrl no cuentan');
  const prev = await c.js(`(() => { const e = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }); document.body.dispatchEvent(e); return e.defaultPrevented; })()`);
  ok(prev === true && await dato(1) === '1', 'la barra espaciadora cuenta y no desplaza la página');
  await c.js(`${tecla('a', 'repeat: true')}`);
  ok(await dato(1) === '1', 'la repetición automática no cuenta');
  await c.js(`(async () => { const p = (ms) => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < 19; i++) { document.body.dispatchEvent(new KeyboardEvent('keydown', { key: i % 2 ? 'a' : 'b', code: i % 2 ? 'KeyA' : 'KeyB', bubbles: true, cancelable: true })); await p(60); }
    for (let i = 0; i < 10; i++) { ${ARENA}.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: i % 2 ? 2 : 0 })); await p(60); } })()`);
  ok(await dato(1) === '30', 'cuenta 20 teclas y 10 clics (con ambos botones) = 30 (' + await dato(1) + ')');
  ok(await hayResultado(10000), 'a los 10 s sale el resultado');
  r = await texto('.tt-res');
  ok(r.includes('180') && r.includes('APM') && r.includes('Ágil'), '30 acciones en 10 s = 180 APM, rango Ágil');
  ok(r.includes('Clics') && r.includes('Pulsaciones de teclado') && r.includes('Teclas distintas') && r.includes('Mejor tramo de 5 s'), 'salen el desglose y el mejor tramo de 5 s');
  const desglose = await c.js(`[...document.querySelectorAll('.tt-tabla div')].map(d => d.innerText.replace(/\\s+/g, ' ')).join('|')`);
  ok(/Clics 10/.test(desglose) && /Pulsaciones de teclado 20/.test(desglose) && /Teclas distintas 3/.test(desglose), 'desglose: 10 clics, 20 teclas, 3 teclas distintas (' + desglose.slice(0, 160) + ')');

  console.log('MÓVIL');
  await c.vista(390, 800, 'dark', true);
  for (const s of ['test-de-tiempo-de-reaccion', 'reaccion-auditiva', 'test-de-punteria', 'entrenador-de-punteria', 'coordinacion-mano-ojo', 'apm-acciones-por-minuto']) await abrir(s, 400);
} finally {
  await cerrar();
}
