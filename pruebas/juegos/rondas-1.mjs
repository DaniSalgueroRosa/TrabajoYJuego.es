// Cultura general, Mente matemática, ¿Qué palabra soy? y El intruso.
// Se lanza con «python3 sitio.py probar --navegador» (PUERTO la pone el lanzador). Capturas opcionales: CAPTURAS=carpeta.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const tecla = async (key) => { await c.enviar('Input.dispatchKeyEvent', { type: 'keyDown', key, text: key.length === 1 ? key : undefined }); await c.enviar('Input.dispatchKeyEvent', { type: 'keyUp', key }); };
const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
try {
  await c.vista(900, 900);
  // ---------- Cultura general: elegimos siempre la respuesta correcta leyendo el JSON
  await c.ir(base + '/juegos/cultura-general/', 900);
  const banco = JSON.parse(await c.js(`fetch(TYJ.url('juegos/cultura-general/preguntas.json')).then(r => r.text())`)).preguntas;
  ok(await clic('Empezar'), 'cultura: Empezar');
  let aciertos = 0;
  for (let i = 0; i < 10; i++) {
    await esperar(80);
    const q = banco.find(x => x.p === null) ;
    const preg = await c.js(`document.querySelector('.rondas-enunciado').textContent`);
    const it = banco.find(x => x.p === preg);
    if (!it) { ok(false, 'pregunta fuera del banco: ' + preg); break; }
    const textos = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.opcion')].map(b => b.textContent.replace(/^\\d /, '')))`));
    const idx = textos.indexOf(it.o[0]);
    if (i === 3) { await tecla(String(idx + 1)); } // teclado numérico
    else if (i === 5) { const mal = (idx + 1) % 4; await tecla(String(mal + 1)); } // fallo a propósito
    else await c.js(`document.querySelectorAll('.opcion')[${idx}].click()`);
    await esperar(80);
    const aviso = await c.js(`document.querySelector('.rondas-aviso')?.innerText || ''`);
    if (i === 5) ok(aviso.includes('Fallo'), 'cultura: fallo detectado');
    else { ok(aviso.includes('Correcto'), `cultura r${i + 1}: acierto`); aciertos++; }
    await clic(i === 9 ? 'Ver resultado' : 'Siguiente');
  }
  await esperar(150);
  const fin = await c.js(`document.querySelector('.final')?.innerText || ''`);
  console.log('   final:', fin.replace(/\n+/g, ' | ').slice(0, 200));
  ok(fin.includes('Repasa lo que has fallado (1)'), 'cultura: repaso con 1 fallo');
  ok(fin.includes('9 aciertos de 10'), 'cultura: 9 aciertos de 10');
  ok((await c.js(`document.querySelector('.sesion')?.innerText || ''`)).includes('Partidas: 1'), 'cultura: sesión cuenta 1 partida');
  await capturar(c, 'cg-final', false);
  await clic('Jugar otra vez'); await esperar(120);
  ok(await c.js(`!!document.querySelector('.rondas-enunciado')`), 'cultura: jugar otra vez');
  // timeout de ronda
  await c.js(`(() => { const o = performance.now; performance.now = () => o.call(performance) + 25000; })()`);
  await esperar(400);
  ok((await c.js(`document.querySelector('.rondas-aviso')?.innerText || ''`)).includes('Se acabó el tiempo'), 'cultura: se acaba el tiempo');
  // ---------- Mente matemática: resolvemos leyendo la operación
  await c.ir(base + '/juegos/mente-matematica/', 900);
  ok(await clic('Empezar'), 'mates: Empezar');
  for (let i = 0; i < 10; i++) {
    await esperar(80);
    const txt = await c.js(`document.querySelector('.rondas-enunciado').textContent`);
    const expr = txt.replace(' = ?', '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/(\d+) % de (\d+)/, '($1*$2/100)');
    const val = eval(expr);
    await c.js(`(() => { const e = document.getElementById('rondas-respuesta'); e.value = ${JSON.stringify(String(val).replace('.', ','))}; e.form.requestSubmit(); })()`);
    await esperar(80);
    const aviso = await c.js(`document.querySelector('.rondas-aviso')?.innerText || ''`);
    ok(aviso.includes('Correcto'), `mates r${i + 1}: «${txt}» = ${val}`);
    await clic(i === 9 ? 'Ver resultado' : 'Siguiente');
  }
  ok((await c.js(`document.querySelector('.final')?.innerText || ''`)).includes('10 aciertos de 10'), 'mates: 10 de 10');
  const alm = await c.js(`(async () => JSON.stringify({ls: localStorage.length, ss: sessionStorage.length, ck: document.cookie, idb: (await indexedDB.databases()).length}))()`);
  ok(alm === '{"ls":0,"ss":0,"ck":"","idb":0}', 'no guarda nada');
  // ---------- ¿Qué palabra soy? e intruso
  await c.ir(base + '/juegos/que-palabra-soy/', 900);
  const pal = JSON.parse(await c.js(`fetch(TYJ.url('juegos/que-palabra-soy/palabras.json')).then(r => r.text())`)).palabras;
  await clic('Empezar'); await esperar(100);
  const d = await c.js(`document.querySelector('.rondas-enunciado').textContent`);
  const it = pal.find(x => x.d === d);
  ok(!!it, 'qps: descripción en el banco');
  await clic('Pista (−40 puntos)'); await esperar(60);
  ok((await c.js(`document.body.innerText`)).includes('Esta ronda vale 60 puntos'), 'qps: pista');
  await c.js(`(() => { const e = document.getElementById('rondas-respuesta'); e.value = ${JSON.stringify(it.r[it.r.length > 1 ? 1 : 0].toUpperCase())}; e.form.requestSubmit(); })()`);
  await esperar(80);
  const av = await c.js(`document.querySelector('.rondas-aviso')?.innerText || ''`);
  ok(av.includes('Correcto') && /\+(6\d|7\d|8\d|9\d)\b/.test(av), 'qps: acierto con pista (+' + (av.match(/\+(\d+)/) || [])[1] + ')');
  await c.ir(base + '/juegos/el-intruso/', 900);
  const conj = JSON.parse(await c.js(`fetch(TYJ.url('juegos/el-intruso/conjuntos.json')).then(r => r.text())`)).conjuntos;
  await clic('Empezar'); await esperar(100);
  const ops = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.opcion')].map(b => b.textContent.replace(/^\\d /, '')))`));
  const cj = conj.find(x => ops.includes(x.i) && x.g.every(g => ops.includes(g)));
  ok(!!cj, 'intruso: conjunto del banco (' + ops.join(', ') + ')');
  await c.js(`document.querySelectorAll('.opcion')[${ops.indexOf(cj.i)}].click()`); await esperar(80);
  ok((await c.js(`document.querySelector('.rondas-aviso')?.innerText || ''`)).includes('Correcto'), 'intruso: acierto');
  const cons = c.consola().filter(x => !/favicon/.test(x));
  ok(cons.length === 0, 'sin errores en consola ' + JSON.stringify(cons));
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'TODO BIEN');
process.exit(fallos.length ? 1 : 0);
