// Las cifras, Test de mecanografía y Tablas de multiplicar: partidas completas con el navegador.
// Se lanza con «python3 sitio.py probar --navegador» (PUERTO la pone el lanzador). Capturas opcionales: CAPTURAS=carpeta.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
const attr = (sel, a) => c.js(`document.querySelector(${JSON.stringify(sel)})?.getAttribute(${JSON.stringify(a)}) ?? ''`);
const texto = (sel) => c.js(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const tecla = async (key) => { await c.enviar('Input.dispatchKeyEvent', { type: 'keyDown', key, text: key.length === 1 ? key : undefined }); await c.enviar('Input.dispatchKeyEvent', { type: 'keyUp', key }); };
const saltarTiempo = (ms) => c.js(`(() => { const o = performance.now.bind(performance); performance.now = () => o() + ${ms}; })()`);

/* Solucionador de Las cifras (búsqueda en profundidad): devuelve la lista de pasos [a, op, b, r] */
function resolver(nums, objetivo) {
  const vistos = new Set();
  const calc = (a, op, b) => op === '+' ? a + b : op === '−' ? (a > b ? a - b : 0) : op === '×' ? a * b : (b > 0 && a % b === 0 ? a / b : 0);
  function dfs(lista, pasos) {
    if (lista.includes(objetivo)) return pasos;
    const clave = [...lista].sort((x, y) => x - y).join(',');
    if (vistos.has(clave)) return null;
    vistos.add(clave);
    for (let i = 0; i < lista.length; i++) for (let j = 0; j < lista.length; j++) {
      if (i === j) continue;
      for (const op of ['×', '+', '−', '÷']) {
        if ((op === '+' || op === '×') && i > j) continue;
        const r = calc(lista[i], op, lista[j]); if (r <= 0) continue;
        const nueva = lista.filter((_, k) => k !== i && k !== j).concat(r);
        const res = dfs(nueva, pasos.concat([[lista[i], op, lista[j], r]]));
        if (res) return res;
      }
    }
    return null;
  }
  return dfs(nums, []);
}
const fichas = async () => (await attr('#lc', 'data-fichas')).split(',').filter(Boolean).map(Number);
const clicFicha = (i) => c.js(`document.querySelectorAll('.lc-ficha')[${i}].click()`);
const clicOp = (op) => c.js(`document.querySelector('.lc-op[data-op="${op}"]').click()`);

try {
  await c.vista(900, 1000);

  // ================= LAS CIFRAS =================
  await c.ir(base + '/juegos/las-cifras/', 900);
  ok(await clic('Empezar'), 'cifras: Empezar');
  await esperar(100);
  // ronda 1: se resuelve exactamente con el solucionador
  let nums = await fichas(), obj = Number(await attr('#lc', 'data-objetivo'));
  ok(nums.length === 6 && obj >= 101 && obj <= 999, `cifras r1: ${nums.join(', ')} → objetivo ${obj}`);
  ok(nums.every(n => (n >= 1 && n <= 10) || [25, 50, 75, 100].includes(n)), 'cifras r1: números permitidos');
  const sol = resolver(nums, obj);
  ok(!!sol && sol.length >= 1, 'cifras r1: el solucionador encuentra solución (' + (sol ? sol.map(p => p.join(' ')).join(' ; ') : 'ninguna') + ')');
  await capturar(c, 'cifras-inicio', false);
  for (const [a, op, b, r] of sol) {
    const f = await fichas(); const ia = f.indexOf(a); const ib = f.findIndex((v, k) => v === b && k !== ia);
    await clicFicha(ia); await clicOp(op); await clicFicha(ib);
    await esperar(40);
  }
  ok((await attr('#lc', 'data-fase')) === 'resultado', 'cifras r1: la ronda termina al llegar al objetivo');
  const m1 = await texto('.mensaje');
  ok(m1.includes('¡Exacto!') && /1\d\d puntos|[1-9]\d\d puntos/.test(m1), 'cifras r1: «' + m1 + '»');
  const pts1 = Number(await attr('#lc', 'data-puntos'));
  ok(pts1 >= 100 && pts1 <= 190, 'cifras r1: puntos ' + pts1);
  ok(!(await c.js(`document.querySelector('.boton-retro[hidden]') === null && [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Ver una solución' && !b.hidden)`)), 'cifras r1: no se ofrece solución cuando ya es exacta');
  ok(await clic('Siguiente ronda'), 'cifras: Siguiente ronda');
  await esperar(100);

  // ronda 2: reglas, deshacer, teclado y plantarse
  nums = await fichas(); obj = Number(await attr('#lc', 'data-objetivo'));
  ok(nums.length === 6 && (await attr('#lc', 'data-ronda')) === '2', 'cifras r2: ' + nums.join(', ') + ' → ' + obj);
  // resta con resultado negativo: se rechaza
  const iMen = nums.indexOf(Math.min(...nums)), iMay = nums.indexOf(Math.max(...nums));
  await clicFicha(iMen); await clicOp('−'); await clicFicha(iMay); await esperar(40);
  ok((await texto('.mensaje')).includes('No se puede restar'), 'cifras r2: rechaza una resta negativa');
  ok((await fichas()).length === 6, 'cifras r2: tras el rechazo siguen los 6 números');
  // división inexacta: se rechaza
  let par = null;
  for (let i = 0; i < nums.length && !par; i++) for (let j = 0; j < nums.length && !par; j++) if (i !== j && nums[i] % nums[j] !== 0) par = [i, j];
  if (par) {
    await clicFicha(par[0]); await clicOp('÷'); await clicFicha(par[1]); await esperar(40);
    ok((await texto('.mensaje')).includes('No se puede dividir'), `cifras r2: rechaza ${nums[par[0]]} ÷ ${nums[par[1]]}`);
  }
  // una suma válida y deshacer (tras el rechazo la primera ficha sigue marcada: se vuelve a pulsar para soltarla)
  await c.js(`document.querySelector('.lc-ficha--sel')?.click()`);
  await clicFicha(0); await clicOp('+'); await clicFicha(1); await esperar(40);
  let f = await fichas();
  ok(f.length === 5 && f[4] === nums[0] + nums[1], 'cifras r2: suma válida (' + f.join(', ') + ')');
  ok((await c.js(`document.querySelectorAll('.lc-pasos li').length`)) === 1, 'cifras r2: se anota la operación');
  ok(await clic('Deshacer'), 'cifras r2: Deshacer');
  await esperar(40);
  ok(JSON.stringify(await fichas()) === JSON.stringify(nums), 'cifras r2: deshacer devuelve los 6 números');
  // teclado: seleccionar una ficha, pulsar * y comprobar que la operación queda marcada
  await c.js(`document.querySelectorAll('.lc-ficha')[2].click(); document.querySelectorAll('.lc-ficha')[2].focus()`);
  await tecla('*'); await esperar(40);
  ok((await attr('.lc-op[data-op="×"]', 'aria-pressed')) === 'true', 'cifras r2: la tecla * elige la multiplicación');
  await tecla('Escape'); await esperar(40);
  ok((await attr('.lc-op[data-op="×"]', 'aria-pressed')) === 'false', 'cifras r2: Esc cancela la selección');
  // empezar de nuevo y plantarse
  await clic('Empezar de nuevo');
  ok(await clic('Plantarme con mi mejor número'), 'cifras r2: Plantarme');
  await esperar(80);
  ok((await attr('#lc', 'data-fase')) === 'resultado', 'cifras r2: ronda terminada');
  const m2 = await texto('.mensaje'); console.log('   ' + m2);
  ok(/Tu mejor número es \d+, a \d+ del objetivo/.test(m2) || m2.includes('¡Exacto!'), 'cifras r2: mensaje de resultado');
  if (!m2.includes('¡Exacto!')) {
    ok(await clic('Ver una solución'), 'cifras r2: Ver una solución');
    const pasos = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.lc-solucion li')].map(li => li.textContent))`));
    let valida = pasos.length >= 3, ultimo = 0;
    for (const p of pasos) {
      const m = p.match(/^(\d+) ([+−×÷]) (\d+) = (\d+)$/); if (!m) { valida = false; break; }
      const [a, b, r] = [Number(m[1]), Number(m[3]), Number(m[4])];
      const esperado = m[2] === '+' ? a + b : m[2] === '−' ? a - b : m[2] === '×' ? a * b : a / b;
      if (esperado !== r) valida = false; ultimo = r;
    }
    ok(valida && ultimo === obj, `cifras r2: la solución mostrada es correcta (${pasos.join(' ; ')})`);
  }
  ok(await clic('Siguiente ronda'), 'cifras: Siguiente ronda (3)'); await esperar(100);

  // ronda 3: se acaba el tiempo
  ok((await attr('#lc', 'data-ronda')) === '3', 'cifras r3: tercera ronda');
  await saltarTiempo(91000); await esperar(400);
  ok((await attr('#lc', 'data-fase')) === 'resultado', 'cifras r3: el tiempo termina la ronda');
  ok((await texto('.mensaje')).includes('Se acabó el tiempo'), 'cifras r3: «' + (await texto('.mensaje')) + '»');
  ok(await clic('Ver resultado'), 'cifras: Ver resultado'); await esperar(100);
  const finC = await texto('.final');
  console.log('   final:', finC.replace(/\n+/g, ' | ').slice(0, 260));
  ok(/rondas? exactas?/.test(finC) && finC.includes('Ronda 1:') && finC.includes('Ronda 3:'), 'cifras: pantalla final con las tres rondas');
  ok((await texto('.sesion')).includes('Partidas: 1'), 'cifras: la sesión cuenta 1 partida');
  await capturar(c, 'cifras-final', false);
  ok(await clic('Otra partida'), 'cifras: Otra partida');

  // ================= TEST DE MECANOGRAFÍA =================
  await c.ir(base + '/juegos/test-de-mecanografia/', 900);
  await esperar(150);
  const escribirHasta = (n, desdeCero = false) => c.js(`(() => { const i = document.querySelector('.mc-entrada'), t = document.getElementById('mc').getAttribute('data-texto');
    for (let k = ${desdeCero ? 0 : 'i.value.length'}; k < ${n}; k++) { i.value = t.slice(0, k + 1); i.dispatchEvent(new Event('input', { bubbles: true })); } })()`);
  ok(await clic('30 s'), 'mecano: elegir 30 s');
  ok(await clic('Empezar'), 'mecano: Empezar');
  await esperar(80);
  ok((await attr('#mc', 'data-fase')) === 'listo', 'mecano: a la espera de la primera tecla');
  const texto1 = await attr('#mc', 'data-texto');
  ok(texto1.length >= 90, 'mecano: texto de ' + texto1.length + ' caracteres');
  // pegar no se admite
  const pegado = await c.js(`(() => { const i = document.querySelector('.mc-entrada'); const e = new ClipboardEvent('paste', { cancelable: true, bubbles: true }); i.dispatchEvent(e); return e.defaultPrevented; })()`);
  ok(pegado === true, 'mecano: pegar está bloqueado');
  // 5 letras bien, una equivocada, borrar, corregir y seguir hasta terminar el texto
  await escribirHasta(5);
  ok((await attr('#mc', 'data-fase')) === 'juego', 'mecano: el reloj arranca con la primera tecla');
  await c.js(`(() => { const i = document.querySelector('.mc-entrada'), t = document.getElementById('mc').getAttribute('data-texto');
    const mala = t.charAt(5) === 'x' ? 'z' : 'x';
    i.value = t.slice(0, 5) + mala; i.dispatchEvent(new Event('input', { bubbles: true }));
    i.value = t.slice(0, 5); i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  ok((await attr('#mc', 'data-pulsaciones')) === '6' && (await attr('#mc', 'data-aciertos')) === '5', 'mecano: el fallo cuenta como pulsación incorrecta aunque se borre');
  ok((await c.js(`document.querySelectorAll('.mc-mal').length`)) === 0, 'mecano: tras borrar no queda nada en rojo');
  await escribirHasta(texto1.length);
  await esperar(60);
  const texto2 = await attr('#mc', 'data-texto');
  ok(texto2 !== texto1 && (await c.js(`document.querySelector('.mc-entrada').value`)) === '', 'mecano: entra un texto nuevo al terminar el primero');
  ok((await attr('#mc', 'data-pulsaciones')) === String(texto1.length + 1) && (await attr('#mc', 'data-aciertos')) === String(texto1.length), `mecano: ${texto1.length + 1} pulsaciones y ${texto1.length} aciertos`);
  // segundo texto: 40 caracteres bien y se acaba el tiempo
  await escribirHasta(40);
  ok((await c.js(`document.querySelectorAll('.mc-ok').length`)) === 40, 'mecano: 40 caracteres marcados como correctos');
  await capturar(c, 'mecano-juego', false);
  await saltarTiempo(31000); await esperar(400);
  ok((await attr('#mc', 'data-fase')) === 'fin', 'mecano: el tiempo termina la prueba');
  const netas = texto1.length + 40, ppm = Math.round(netas / 5 / 0.5), prec = Math.round(100 * (texto1.length + 40) / (texto1.length + 41));
  const finM = await texto('.final');
  console.log('   final:', finM.replace(/\n+/g, ' | ').slice(0, 260));
  ok(finM.includes(String(ppm)) && finM.includes('palabras por minuto'), `mecano: velocidad esperada ${ppm} ppm`);
  ok(finM.includes('Precisión: ' + prec + ' %'), `mecano: precisión esperada ${prec} %`);
  ok(finM.includes('1 pulsación incorrecta'), 'mecano: una pulsación incorrecta');
  ok((await texto('.sesion')).includes('Partidas: 1'), 'mecano: la sesión cuenta 1 partida');
  await capturar(c, 'mecano-final', false);
  // ignorar tildes: escribir sin tildes un texto con tildes da 100 %
  ok(await clic('Probar otra vez'), 'mecano: Probar otra vez'); await esperar(100);
  ok(await clic('Ignorar tildes'), 'mecano: Ignorar tildes');
  ok(await clic('Empezar'), 'mecano: Empezar (sin tildes)'); await esperar(60);
  await c.js(`(() => { const i = document.querySelector('.mc-entrada'), t = document.getElementById('mc').getAttribute('data-texto');
    const sin = (s) => s.normalize('NFD').replace(/[\\u0300\\u0301\\u0308]/g, '').normalize('NFC');
    const base = sin(t).slice(0, 60);
    for (let k = 0; k < 60; k++) { i.value = base.slice(0, k + 1); i.dispatchEvent(new Event('input', { bubbles: true })); } })()`);
  ok((await attr('#mc', 'data-precision')) === '100', 'mecano: sin exigir tildes, escribir sin tildes da 100 % (' + (await attr('#mc', 'data-precision')) + ')');
  await c.js(`document.querySelector('.mc-entrada').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await esperar(60);
  ok((await attr('#mc', 'data-fase')) === 'espera', 'mecano: Esc reinicia la prueba');
  // con tildes exigidas, quitar una tilde cuenta como error
  ok(await clic('Exigir tildes'), 'mecano: Exigir tildes');
  ok(await clic('Empezar'), 'mecano: Empezar (con tildes)'); await esperar(60);
  const conTilde = await c.js(`(() => { const t = document.getElementById('mc').getAttribute('data-texto'); return /[áéíóúüÁÉÍÓÚ]/.test(t.slice(0, 120)) ? t : ''; })()`);
  if (conTilde) {
    await c.js(`(() => { const i = document.querySelector('.mc-entrada'), t = document.getElementById('mc').getAttribute('data-texto');
      const sin = (s) => s.normalize('NFD').replace(/[\\u0300\\u0301\\u0308]/g, '').normalize('NFC');
      const base = sin(t); for (let k = 0; k < base.length - 1; k++) { i.value = base.slice(0, k + 1); i.dispatchEvent(new Event('input', { bubbles: true })); } })()`);
    ok(Number(await attr('#mc', 'data-precision')) < 100, 'mecano: exigiendo tildes, faltar una tilde es un error (' + (await attr('#mc', 'data-precision')) + ' %)');
  } else console.log('   (el texto sorteado no tiene tildes en los primeros 120 caracteres; se omite la comprobación)');

  // ================= TABLAS DE MULTIPLICAR =================
  await c.ir(base + '/juegos/tablas-de-multiplicar/', 900);
  ok(await clic('Ninguna'), 'tablas: Ninguna');
  ok(await clic('Reto de 60 segundos'), 'tablas: sin tablas elegidas no arranca');
  ok((await texto('.mensaje')).includes('Elige al menos una tabla'), 'tablas: avisa de que hay que elegir una tabla');
  await c.js(`document.querySelector('.tm-tabla[data-tabla="7"]').click()`);
  ok((await attr('.tm-tabla[data-tabla="7"]', 'aria-pressed')) === 'true', 'tablas: tabla del 7 activada');
  ok(await clic('Reto de 60 segundos'), 'tablas: Reto de 60 segundos'); await esperar(100);
  const claves = [];
  let correctas = 0;
  const responder = async (valor) => { await c.js(`(() => { const i = document.querySelector('.tm-entrada'); i.value = ${JSON.stringify(String(valor))}; i.dispatchEvent(new Event('input', { bubbles: true })); })()`); };
  for (let i = 0; i < 10; i++) {
    const a = Number(await attr('#tm', 'data-a')), b = Number(await attr('#tm', 'data-b'));
    ok(a === 7 || b === 7, `tablas r${i + 1}: ${a} × ${b} (solo tabla del 7)`);
    claves.push(a === 7 ? b : a);
    if (i === 4) {                                    // fallo a propósito (mismo número de cifras: se comprueba solo)
      await responder(a * b + 1); await esperar(80);
      ok((await texto('.mensaje')).includes(`Era ${a} × ${b} = ${a * b}`), 'tablas: tras un fallo muestra la solución');
      ok((await attr('#tm', 'data-fallos')) === '1' && (await attr('#tm', 'data-racha')) === '0', 'tablas: un fallo y racha a cero');
      await esperar(1400);
    } else {
      await responder(a * b); await esperar(60); correctas++;
      await esperar(300);
    }
  }
  ok(new Set(claves).size === 10, 'tablas: las 10 preguntas son distintas (' + claves.join(',') + ')');
  ok((await attr('#tm', 'data-aciertos')) === String(correctas), 'tablas: ' + correctas + ' aciertos');
  await capturar(c, 'tablas-juego', false);
  await saltarTiempo(61000); await esperar(400);
  ok((await attr('#tm', 'data-fase')) === 'fin', 'tablas: el minuto termina el reto');
  const finT = await texto('.final');
  console.log('   final:', finT.replace(/\n+/g, ' | ').slice(0, 280));
  ok(finT.includes('Se acabó el minuto') && finT.includes('9 aciertos y 1 fallo') && finT.includes('Para repasar: 7 ×') || finT.includes('Para repasar: ') && finT.includes('× 7 ='), 'tablas: final con aciertos, fallo y repaso');
  ok((await texto('.sesion')).includes('Partidas: 1'), 'tablas: la sesión cuenta el reto');
  // práctica de 20 con la selección recordada
  ok(await clic('Volver a empezar'), 'tablas: Volver a empezar'); await esperar(100);
  ok((await attr('.tm-tabla[data-tabla="7"]', 'aria-pressed')) === 'true' && (await attr('.tm-tabla[data-tabla="3"]', 'aria-pressed')) === 'false', 'tablas: se recuerda la selección en memoria');
  ok(await clic('Práctica de 20'), 'tablas: Práctica de 20'); await esperar(100);
  ok((await texto('.hud')).includes('1 / 20'), 'tablas: marcador «1 / 20»');
  for (let i = 0; i < 20; i++) {
    const a = Number(await attr('#tm', 'data-a')), b = Number(await attr('#tm', 'data-b'));
    const mal = i === 3 || i === 9 || i === 15;
    // las respuestas que tienen una sola cifra y fallan se confirman con Intro (no llegan a la longitud del resultado)
    await responder(mal ? a * b + 1 : a * b);
    if (mal) { await c.js(`document.querySelector('.tm-entrada').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`); }
    await esperar(mal ? 1450 : 330);
  }
  await esperar(200);
  ok((await attr('#tm', 'data-fase')) === 'fin', 'tablas: la práctica termina tras 20 preguntas');
  const finP = await texto('.final');
  console.log('   final:', finP.replace(/\n+/g, ' | ').slice(0, 300));
  ok(finP.includes('Práctica terminada') && finP.includes('17') && finP.includes('aciertos de 20') && finP.includes('17 aciertos y 3 fallos'), 'tablas: 17 aciertos de 20');
  ok(finP.includes('Para repasar:'), 'tablas: lista de fallos para repasar');
  ok(await clic('Volver a empezar'), 'tablas: volver a empezar tras la práctica');

  const alm = await c.js(`(async () => JSON.stringify({ls: localStorage.length, ss: sessionStorage.length, ck: document.cookie, idb: (await indexedDB.databases()).length}))()`);
  ok(alm === '{"ls":0,"ss":0,"ck":"","idb":0}', 'no guarda nada');
  const cons = c.consola().filter(x => !/favicon/.test(x));
  ok(cons.length === 0, 'sin errores en consola ' + JSON.stringify(cons));
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'TODO BIEN');
process.exit(fallos.length ? 1 : 0);
