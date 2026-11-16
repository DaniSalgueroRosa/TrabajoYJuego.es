// Los diez juegos de la tanda 60–69: Quiz de fútbol, Reglas del fútbol, ¿Qué futbolista soy?, Estadios de fútbol, Tanda de penaltis,
// Hundir la flota, Nonogramas, Reversi, Pilla al topo y Raquetas. Partidas completas y comprobaciones de reglas.
// Se lanza con «python3 sitio.py probar --navegador» (PUERTO la pone el lanzador). Capturas opcionales: CAPTURAS=carpeta.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const texto = (sel) => c.js(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
const tecla = async (key, mantener = 0) => { await c.enviar('Input.dispatchKeyEvent', { type: 'keyDown', key, text: key.length === 1 ? key : undefined }); if (mantener) await esperar(mantener); await c.enviar('Input.dispatchKeyEvent', { type: 'keyUp', key }); };
const sinDesborde = () => c.js(`document.documentElement.scrollWidth <= window.innerWidth + 1`);
const rapido = () => c.js(`(() => { const o = window.setTimeout; window.setTimeout = (f, ms, ...a) => o(f, Math.min(ms || 0, 4), ...a); })()`);   // acorta las esperas del juego (turno del ordenador)
const sinErrores = (n) => ok(c.consola().filter(x => !/favicon/.test(x)).length === 0, n + ': sin errores de consola ' + JSON.stringify(c.consola().filter(x => !/favicon/.test(x))));

/* Juega un quiz de rondas con opciones leyendo la respuesta del banco; fallar = índice de ronda (0-based) donde se elige una respuesta mala a propósito */
async function quiz(slug, archivo, clave, buscar, fallar = -1) {
  await c.ir(`${base}/juegos/${slug}/`, 900);
  ok(await sinDesborde(), `${slug}: móvil sin desborde`);
  const banco = JSON.parse(await c.js(`fetch(TYJ.url('juegos/${slug}/${archivo}')).then(r => r.text())`))[clave];
  ok(banco.length >= 30, `${slug}: banco de ${banco.length} entradas`);
  ok(await clic('Empezar'), `${slug}: Empezar`);
  await esperar(120);
  const total = await c.js(`document.querySelectorAll('.etapas .etapa').length`);
  ok(total >= 8, `${slug}: ruta de rondas con ${total} etapas`);
  let aciertos = 0, buenas = 0;
  for (let i = 0; i < total; i++) {
    await esperar(60);
    const preg = await c.js(`document.querySelector('.rondas-enunciado').textContent`);
    const opciones = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.opcion')].map(b => b.textContent.replace(/^\\d /, '')))`));
    const idx = buscar(banco, preg, opciones);
    if (idx < 0) { ok(false, `${slug}: pregunta no encontrada en el banco: ${preg}`); break; }
    const elegir = i === fallar ? (idx + 1) % opciones.length : idx;
    await c.js(`document.querySelectorAll('.opcion')[${elegir}].click()`);
    await esperar(60);
    const aviso = await texto('.rondas-aviso');
    if (i === fallar) ok(/Fallo/.test(aviso), `${slug}: el fallo se detecta`); else { if (/Correcto/.test(aviso)) buenas++; aciertos++; }
    ok((await c.js(`document.querySelectorAll('.etapas .etapa--ok').length + document.querySelectorAll('.etapas .etapa--mal').length`)) === i + 1, `${slug}: la ruta marca la ronda ${i + 1}`);
    await clic(i === total - 1 ? 'Ver resultado' : 'Siguiente');
  }
  await esperar(150);
  const fin = await texto('.final');
  const esperados = total - (fallar >= 0 ? 1 : 0);
  ok(buenas === aciertos, `${slug}: todas las respuestas correctas se aceptan`);
  ok(new RegExp(`${esperados} aciertos de ${total}`).test(fin), `${slug}: ${esperados} aciertos de ${total} → ${fin.replace(/\s+/g, ' ').slice(0, 90)}`);
  ok((await texto('.sesion')).includes('Partidas: 1'), `${slug}: la sesión cuenta una partida`);
  await capturar(c, `${slug}-final`, false);
  sinErrores(slug);
}

try {
  await c.vista(390, 844, 'light', true);

  console.log('QUIZ DE FÚTBOL');
  await quiz('quiz-de-futbol', 'preguntas.json', 'preguntas', (b, p, o) => { const q = b.find(x => x.p === p); return q ? o.indexOf(q.o[0]) : -1; });

  console.log('REGLAS DEL FÚTBOL');
  await quiz('reglas-del-futbol', 'preguntas.json', 'preguntas', (b, p, o) => { const q = b.find(x => x.p === p); return q ? o.indexOf(q.o[0]) : -1; }, 2);

  console.log('ESTADIOS DE FÚTBOL');
  await quiz('estadios-de-futbol', 'estadios.json', 'estadios', (b, p, o) => {
    const m = /estadio (.+)\?$/.exec(p); if (!m) return -1;
    const e = b.find(x => x.n === m[1]); if (!e) return -1;
    return o.indexOf(/^¿Qué equipo/.test(p) ? e.e : e.c);
  });

  console.log('¿QUÉ FUTBOLISTA SOY?');
  await c.ir(base + '/juegos/que-futbolista-soy/', 900);
  const jug = JSON.parse(await c.js(`fetch(TYJ.url('juegos/que-futbolista-soy/futbolistas.json')).then(r => r.text())`)).futbolistas;
  ok(jug.length >= 30 && jug.every(j => j.p.length === 5 && j.r.length >= 2), `banco de ${jug.length} futbolistas con cinco pistas y alias`);
  await clic('Empezar'); await esperar(150);
  ok((await c.js(`document.querySelectorAll('.qj-pistas li').length`)) === 1, 'empieza con una sola pista');
  ok((await texto('.rondas-enunciado')).includes('100 puntos'), 'la ronda 1 vale 100 puntos');
  let totalQ = await c.js(`document.querySelectorAll('.etapas .etapa').length`), buenas = 0, extras = 0;
  for (let i = 0; i < totalQ; i++) {
    await esperar(80);
    const primera = await c.js(`document.querySelector('.qj-pistas li').textContent`);
    const q = jug.find(x => x.p[0] === primera);
    if (!q) { ok(false, 'pista fuera del banco: ' + primera); break; }
    const pistas = i % 3;                                          // 0, 1 o 2 pistas extra
    for (let k = 0; k < pistas; k++) { await clic('Otra pista (−20 puntos)'); await esperar(40); }
    ok((await c.js(`document.querySelectorAll('.qj-pistas li').length`)) === 1 + pistas, `ronda ${i + 1}: ${1 + pistas} pistas visibles`);
    ok((await texto('.rondas-enunciado')).includes(`${100 - 20 * pistas} puntos`), `ronda ${i + 1}: vale ${100 - 20 * pistas}`);
    const resp = i === 1 ? q.r[0].toUpperCase() : q.r[q.r.length - 1];     // mayúsculas y alias
    await c.js(`(() => { const e = document.getElementById('rondas-respuesta'); e.value = ${JSON.stringify(resp)}; e.form.requestSubmit(); })()`);
    await esperar(80);
    const av = await texto('.rondas-aviso');
    if (/Correcto/.test(av)) buenas++; else ok(false, `ronda ${i + 1}: «${resp}» no se acepta para ${q.n}: ${av}`);
    extras += pistas;
    await clic(i === totalQ - 1 ? 'Ver resultado' : 'Siguiente');
  }
  await esperar(150);
  ok(buenas === totalQ, `todas las respuestas se aceptan (${buenas}/${totalQ})`);
  const fj = await texto('.final');
  ok(new RegExp(`${totalQ} aciertos de ${totalQ}`).test(fj), 'final: ' + fj.replace(/\s+/g, ' ').slice(0, 100));
  sinErrores('futbolista');

  console.log('TANDA DE PENALTIS');
  await c.ir(base + '/juegos/tanda-de-penaltis/', 900);
  ok(await sinDesborde(), 'móvil sin desborde');
  ok((await c.js(`document.querySelectorAll('.tp-zona').length`)) === 6, 'la portería tiene 6 zonas');
  ok((await c.js(`document.querySelectorAll('.tp-bola').length`)) === 10, 'dos filas de cinco tiros');
  ok(!(await c.js(`document.querySelector('.tp-fuerza').hidden`)), 'barra de fuerza visible al tirar');
  await c.js(`document.querySelector('.tp-zona').focus()`);
  await capturar(c, 'penaltis-inicio', false);
  await rapido();
  let vueltas = 0;
  while (!(await texto('.final')) && vueltas < 400) {
    await c.js(`(() => { const z = [...document.querySelectorAll('.tp-zona')].filter(z => !z.disabled); if (z.length) z[Math.floor(Math.random() * z.length)].click(); })()`);
    await esperar(120); vueltas++;
  }
  const ft = await texto('.final');
  ok(/Tanda|ganado|perdido|Has|Gana|Pierdes|ganas/i.test(ft) && /gol/i.test(ft), 'la tanda termina con resultado: ' + ft.replace(/\s+/g, ' ').slice(0, 120));
  const golJ = await c.js(`document.querySelectorAll('.tp-fila:nth-child(1) .tp-bola--gol').length`), golR = await c.js(`document.querySelectorAll('.tp-fila:nth-child(2) .tp-bola--gol').length`);
  ok(golJ !== golR, `no hay empate al final (${golJ} a ${golR})`);
  ok((await c.js(`[...document.querySelectorAll('.tp-zona')].every(z => z.disabled)`)), 'la portería se bloquea al acabar');
  await clic('Otra tanda'); await esperar(150);
  ok((await c.js(`document.querySelectorAll('.tp-bola--gol, .tp-bola--fallo').length`)) === 0, 'otra tanda reinicia el marcador');
  sinErrores('penaltis');

  console.log('HUNDIR LA FLOTA');
  await c.ir(base + '/juegos/hundir-la-flota/', 900);
  ok(await sinDesborde(), 'móvil sin desborde');
  ok((await c.js(`document.querySelectorAll('.hf-celda--barco').length`)) === 17, 'la flota propia ocupa 17 casillas (5+4+3+3+2)');
  const fila1 = await c.js(`[...document.querySelectorAll('.hf-celda--barco')].map(b => b.dataset.i).join(',')`);
  let distinta = false;
  for (let i = 0; i < 5 && !distinta; i++) { await clic('Barajar la flota'); await esperar(40); distinta = fila1 !== await c.js(`[...document.querySelectorAll('.hf-celda--barco')].map(b => b.dataset.i).join(',')`); }
  ok(distinta, 'barajar cambia la colocación');
  ok((await c.js(`document.querySelectorAll('.hf-celda--barco').length`)) === 17, 'tras barajar sigue habiendo 17 casillas');
  await clic('¡A la batalla!'); await esperar(100);
  ok((await c.js(`document.querySelectorAll('.hf-rejilla--enemiga .hf-celda').length`)) === 100, 'tablero enemigo de 100 casillas');
  ok((await c.js(`document.querySelectorAll('.hf-rejilla--enemiga .hf-celda--barco').length`)) === 0, 'los barcos enemigos no se ven');
  ok((await c.js(`document.activeElement?.dataset?.i`)) === '0', 'el foco empieza en A1');
  await tecla('ArrowRight'); await tecla('ArrowDown');
  ok((await c.js(`document.activeElement?.dataset?.i`)) === '11', 'las flechas mueven el foco (B2)');
  await rapido();
  let disparos = 0;
  for (let i = 0; i < 100 && !(await texto('.final')); i++) {
    const hecho = await c.js(`(() => { const b = document.querySelectorAll('.hf-rejilla--enemiga .hf-celda')[${i}]; if (!b || b.textContent) return false; b.click(); return true; })()`);
    if (hecho) { disparos++; await esperar(40); if (i === 0) { await c.js(`document.querySelectorAll('.hf-rejilla--enemiga .hf-celda')[0].click()`); } }
    // esperar a que el ordenador juegue antes de seguir (los clics durante su turno no cuentan)
    for (let k = 0; k < 40 && !(await texto('.final')) && !(await c.js(`/Tu turno/.test(document.querySelector('.hf-msg').textContent)`)); k++) await esperar(15);
  }
  const ff = await texto('.final');
  ok(/hundido|hundida/.test(ff), 'la batalla termina: ' + ff.split('\n')[0]);
  const marcados = await c.js(`document.querySelectorAll('.hf-rejilla--enemiga .hf-celda--agua, .hf-rejilla--enemiga .hf-celda--tocado, .hf-rejilla--enemiga .hf-celda--hundido').length`);
  const hud = (await texto('.hud')).replace(/\s+/g, ' ');
  ok(new RegExp('Disparos ' + marcados + '\\b').test(hud), `los disparos del marcador (${marcados}) coinciden con las casillas disparadas · ${hud}`);
  ok(await c.js(`document.querySelectorAll('.hf-rejilla--enemiga .hf-celda--hundido').length === 17 || document.querySelectorAll('.hf-rejilla--propia .hf-celda--hundido').length === 17`), 'termina con una flota entera hundida');
  ok((await c.js(`[...document.querySelectorAll('.hf-rejilla--enemiga .hf-celda')].every(b => b.disabled)`)), 'el tablero se bloquea al acabar');
  await capturar(c, 'flota-final', false);
  await clic('Otra batalla'); await esperar(100);
  ok((await c.js(`document.querySelectorAll('.hf-celda--barco').length`)) === 17, 'otra batalla vuelve a la colocación');
  sinErrores('flota');

  console.log('NONOGRAMAS');
  await c.ir(base + '/juegos/nonogramas/', 900);
  ok(await sinDesborde(), 'móvil sin desborde');
  const resolver = async () => c.js(`(async () => {
    const src = await (await fetch(TYJ.url('juegos/nonogramas/app.js'))).text();
    const a = src.indexOf('  /* ---- Pistas de una línea'), b = src.indexOf('  /* ---- Partida');
    const f = new Function('U', src.slice(a, b) + '; return { resolver: resolver };')(TYJ.util);
    const lee = (sel) => [...document.querySelectorAll(sel)].map(e => e.getAttribute('aria-label').split(': ')[1].split(', ').map(Number));
    const filas = lee('.ng-pista--fila'), cols = lee('.ng-pista--col'), n = filas.length;
    const sol = f.resolver(filas, cols, n);
    return sol ? sol.map((v, i) => v === 1 ? i : -1).filter(i => i >= 0) : null;
  })()`);
  ok((await c.js(`document.querySelectorAll('.ng-celda').length`)) === 25, 'empieza en 5×5');
  // comprobar: pintamos mal una casilla y pedimos «Comprobar»
  const sol5 = await resolver();
  ok(Array.isArray(sol5) && sol5.length >= 10, `el puzle 5×5 se resuelve por lógica (${sol5 && sol5.length} casillas)`);
  const vacia = await c.js(`[...document.querySelectorAll('.ng-celda')].findIndex((b, i) => !${JSON.stringify(sol5)}.includes(i))`);
  await c.js(`document.querySelectorAll('.ng-celda')[${vacia}].click()`);
  await clic('Comprobar (−50)'); await esperar(60);
  ok(/1 casilla pintada que no debería/.test(await texto('.mensaje')) && (await c.js(`document.querySelectorAll('.ng-celda--error').length`)) === 1, 'Comprobar señala la casilla pintada de más');
  ok((await texto('.hud')).replace(/\s+/g, ' ').includes('Ayudas 1'), 'comprobar cuenta una ayuda');
  await c.js(`document.querySelectorAll('.ng-celda')[${vacia}].click()`);                      // la despinta
  await clic('Marcar vacía (✕)'); await c.js(`document.querySelectorAll('.ng-celda')[${vacia}].click()`);
  ok((await c.js(`document.querySelectorAll('.ng-celda')[${vacia}].textContent`)) === '✕', 'el modo cruz marca ✕');
  await clic('Pintar');
  for (const i of sol5.slice(0, -1)) await c.js(`document.querySelectorAll('.ng-celda')[${i}].click()`);
  ok(!(await texto('.final')), 'sin terminar mientras falta una casilla');
  ok((await c.js(`document.querySelectorAll('.ng-pista--hecha').length`)) >= 5, 'las pistas cumplidas se apagan');
  await c.js(`document.querySelectorAll('.ng-celda')[${sol5[sol5.length - 1]}].click()`); await esperar(80);
  const f5 = await texto('.final');
  ok(/Puzle resuelto/.test(f5), '5×5 resuelto: ' + f5.replace(/\s+/g, ' ').slice(0, 100));
  const pts = +(/(\d+)\s*puntos/.exec(f5.replace(/\s+/g, ' ')) || [])[1], seg = +(/Tiempo: (\d+) s/.exec(f5) || [])[1];
  ok(pts === Math.max(10, 250 - 2 * seg - 50), `puntuación = 250 − 2·${seg} − 50 = ${pts}`);
  ok((await c.js(`[...document.querySelectorAll('.ng-celda')].every(b => b.disabled)`)), 'el tablero se bloquea al acabar');
  for (const [txt, n] of [['Media · 8×8', 64], ['Difícil · 10×10', 100]]) {
    await clic(txt); await esperar(100);
    ok((await c.js(`document.querySelectorAll('.ng-celda').length`)) === n, `${txt}: ${n} casillas`);
    ok(await sinDesborde(), `${txt}: sin desborde en móvil (hay scroll interno)`);
    const s = await resolver();
    for (const i of s) await c.js(`document.querySelectorAll('.ng-celda')[${i}].click()`);
    await esperar(80);
    ok(/Puzle resuelto/.test(await texto('.final')), `${txt} resuelto con la solución lógica`);
    if (n === 100) await capturar(c, 'nonograma-10', false);
  }
  sinErrores('nonogramas');

  console.log('REVERSI');
  await c.ir(base + '/juegos/reversi/', 900);
  ok(await sinDesborde(), 'móvil sin desborde');
  const cuenta = () => c.js(`({ n: document.querySelectorAll('.rv-ficha--negra').length, b: document.querySelectorAll('.rv-ficha--blanca').length, l: document.querySelectorAll('.rv-celda--legal').length })`);
  let e0 = await cuenta();
  ok(e0.n === 2 && e0.b === 2 && e0.l === 4, `posición inicial: 2 negras, 2 blancas y 4 jugadas (${JSON.stringify(e0)})`);
  await c.js(`document.querySelectorAll('.rv-celda')[0].click()`);
  ok(/no vale/.test(await texto('.mensaje')), 'una casilla ilegal se rechaza con aviso');
  e0 = await cuenta(); ok(e0.n === 2 && e0.b === 2, 'la jugada ilegal no cambia el tablero');
  await clic('Mostrar jugadas posibles'); ok((await cuenta()).l === 0, 'se pueden ocultar las jugadas posibles');
  await clic('Mostrar jugadas posibles'); ok((await cuenta()).l === 4, 'y volver a mostrarlas');
  await c.js(`document.querySelector('.rv-celda--legal').click()`);
  const e1 = await cuenta();
  ok(e1.n === 4 && e1.b === 1, `la primera jugada voltea una ficha: 4 negras y 1 blanca (${e1.n}/${e1.b})`);
  await esperar(1100);
  const e2 = await cuenta();
  ok(e2.n + e2.b === 6, `el ordenador responde (${e2.n + e2.b} fichas en el tablero)`);
  ok((await texto('.mensaje')).includes('El ordenador pone en'), 'el mensaje cuenta su jugada');
  await rapido();
  let vr = 0;
  while (!(await texto('.final')) && vr < 400) {
    await c.js(`(() => { const l = [...document.querySelectorAll('.rv-celda--legal')]; if (l.length && /Tú/.test(document.querySelector('.hud').textContent)) l[Math.floor(Math.random() * l.length)].click(); })()`);
    await esperar(25); vr++;
  }
  const fr = (await texto('.final')).replace(/\s+/g, ' ');
  const ef = await cuenta();
  const mm = /Fichas: tú (\d+), ordenador (\d+)/.exec(fr);
  ok(/ganado|Empate|Ha ganado el ordenador/.test(fr) && mm && +mm[1] === ef.n && +mm[2] === ef.b, `final coherente con el tablero (${ef.n}-${ef.b}): ${fr.slice(0, 120)}`);
  ok(ef.n + ef.b <= 64, 'no hay más de 64 fichas');
  await capturar(c, 'reversi-final', false);
  await clic('Difícil'); await esperar(100);
  e0 = await cuenta(); ok(e0.n === 2 && e0.b === 2, 'cambiar de nivel reinicia la partida');
  await c.js(`document.querySelector('.rv-celda--legal').click()`);
  const t0 = Date.now(); await c.js(`new Promise(r => { const iv = setInterval(() => { if (document.querySelectorAll('.rv-ficha--negra, .rv-ficha--blanca').length >= 6) { clearInterval(iv); r(); } }, 20); })`);
  ok(Date.now() - t0 < 3000, `el nivel difícil responde rápido (${Date.now() - t0} ms)`);
  sinErrores('reversi');

  console.log('PILLA AL TOPO');
  await c.ir(base + '/juegos/pilla-al-topo/', 900);
  ok(await sinDesborde(), 'móvil sin desborde');
  ok((await c.js(`document.querySelectorAll('.pt-hueco').length`)) === 9, 'nueve agujeros');
  await c.js(`document.querySelectorAll('.pt-hueco')[0].click()`);
  ok((await texto('.hud')).replace(/\s+/g, ' ').includes('Puntos 0'), 'antes de empezar no se puntúa');
  await clic('Empezar'); await esperar(100);
  ok(!(await c.js(`!!document.querySelector('.final')`)), 'la ronda está en marcha');
  const esperarTipo = (tipo, ms = 6000) => c.js(`new Promise(r => { const t0 = performance.now(); const iv = setInterval(() => { const e = document.querySelector('.pt-hueco[data-tipo="${tipo}"]'); if (e || performance.now() - t0 > ${ms}) { clearInterval(iv); r(e ? [...document.querySelectorAll('.pt-hueco')].indexOf(e) : -1); } }, 10); })`);
  const puntos = async () => +((await texto('.hud')).replace(/\s+/g, ' ').match(/Puntos (\d+)/) || [])[1];
  let hits = 0;
  for (let k = 0; k < 3; k++) { const i = await esperarTipo('topo'); ok(i >= 0, `aparece un topo (${k + 1})`); if (i < 0) break; await c.js(`document.querySelectorAll('.pt-hueco')[${i}].click()`); hits++; }
  ok(await puntos() === 30, `3 topos pillados = 30 puntos (${await puntos()})`);
  const iv = await c.js(`[...document.querySelectorAll('.pt-hueco')].findIndex(b => !b.dataset.tipo)`);
  if (iv >= 0) { await c.js(`document.querySelectorAll('.pt-hueco')[${iv}].click()`); ok(await puntos() === 27, `pulsar un agujero vacío resta 3 (${await puntos()})`); }
  const t = await esperarTipo('topo'), antesT = await puntos();
  if (t >= 0) { await tecla(String(t + 1)); hits++; ok((await puntos()) === antesT + 10, `la tecla ${t + 1} pilla el topo del agujero ${t + 1} (${antesT} → ${await puntos()})`); }
  const ib = await esperarTipo('bomba', 15000);
  if (ib >= 0) { const antes = await puntos(); await c.js(`document.querySelectorAll('.pt-hueco')[${ib}].click()`); ok(await puntos() === Math.max(0, antes - 15), `una bomba resta 15 (${antes} → ${await puntos()})`); }
  else ok(false, 'aparece alguna bomba en 15 s');
  await capturar(c, 'topo-juego', false);
  await c.js(`(() => { const o = performance.now.bind(performance); performance.now = () => o() + 40000; })()`);
  await esperar(500);
  const fp = await texto('.final');
  ok(/Se acabó el tiempo/.test(fp) && /Topos pillados: \d+/.test(fp), 'la ronda acaba al llegar el tiempo: ' + fp.replace(/\s+/g, ' ').slice(0, 110));
  ok((await c.js(`[...document.querySelectorAll('.pt-hueco')].every(b => b.disabled && !b.dataset.tipo)`)), 'los agujeros se vacían y bloquean al acabar');
  await clic('Otra ronda'); await esperar(100);
  ok(await clic('Empezar'), 'otra ronda permite empezar');
  sinErrores('topo');

  console.log('RAQUETAS');
  await c.ir(base + '/juegos/raquetas/', 900);
  ok(await sinDesborde(), 'móvil sin desborde');
  const lie = (a) => c.js(`document.querySelector('canvas').getAttribute('data-${a}')`);
  ok((await lie('estado')) === 'espera', 'empieza en espera');
  await c.js(`document.querySelector('.rq-zona').focus()`);
  await tecla(' '); await esperar(150);
  ok((await lie('estado')) === 'juego', 'la barra espaciadora empieza el juego');
  const b0 = await lie('bola'); await esperar(250);
  ok((await lie('bola')) !== b0, 'la bola se mueve');
  const p0 = +(await lie('pala')); await tecla('ArrowUp', 300);
  const p1 = +(await lie('pala'));
  ok(p1 < p0 || p0 === 0, `la flecha arriba sube la pala (${p0} → ${p1})`);
  await tecla('s', 300);
  ok(+(await lie('pala')) > p1 || p1 === 240, 'la tecla S baja la pala');
  await tecla(' '); await esperar(100);
  ok((await lie('estado')) === 'pausa', 'la barra espaciadora pausa');
  const bp = await lie('bola'); await esperar(300);
  ok((await lie('bola')) === bp, 'en pausa la bola no se mueve');
  await tecla(' '); await esperar(100);
  ok((await lie('estado')) === 'juego', 'y vuelve a reanudar');
  // seguimiento de la bola con puntero: devuelve al menos un golpe
  await c.js(`(() => { const z = document.querySelector('.rq-zona'), l = document.querySelector('canvas'); window.__seg = setInterval(() => { const r = l.getBoundingClientRect(), [bx, by] = l.getAttribute('data-bola').split(',').map(Number); z.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + 20, clientY: r.top + (by + 5) * r.height / 300, bubbles: true })); }, 4); })()`);
  await esperar(4000);
  await c.js(`clearInterval(window.__seg)`);
  await capturar(c, 'raquetas-juego', false);
  let vq = 0;
  while (!(await texto('.final')) && vq < 120) { await esperar(500); vq++; }
  const fq = (await texto('.final')).replace(/\s+/g, ' ');
  ok(/Ha ganado el ordenador 7 a \d|Has ganado 7 a \d/.test(fq), 'la partida acaba a 7: ' + fq.slice(0, 110));
  const gol = /Golpes a la bola: (\d+)/.exec(fq);
  ok(gol && +gol[1] >= 1, `se registran golpes (${gol && gol[1]})`);
  const mk = /Marcador final: (\d+) – (\d+)/.exec(fq);
  const gana = mk && +mk[1] > +mk[2], pq = +(/(\d+)\s*puntos/.exec(fq) || [])[1];
  ok(mk && pq === (+mk[1] * 100 + (gana ? 300 : 0)) * 2, `puntuación coherente (${pq})`);
  await clic('Otra partida'); await esperar(150);
  ok((await lie('marcador')) === '0,0' && (await lie('estado')) === 'espera', 'otra partida reinicia');
  await clic('Difícil'); await esperar(100);
  ok((await c.js(`document.querySelector('[aria-pressed="true"]').textContent`)) === 'Difícil', 'se puede cambiar de nivel');
  sinErrores('raquetas');
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length + '\n - ' + fallos.join('\n - ') : 'TODO BIEN');
if (fallos.length) process.exit(1);
