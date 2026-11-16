// Una entre un millón: puntuación por rareza, tolerancia a erratas, tiempo y resultado final.
// Se lanza con «python3 sitio.py probar --navegador» (PUERTO la pone el lanzador). Capturas opcionales: CAPTURAS=carpeta.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const texto = (sel) => c.js(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
try {
  await c.vista(900, 900);
  await c.ir(base + '/juegos/una-entre-un-millon/', 1000);
  ok(await c.js(`!!document.getElementById('uem-empezar')`), 'pantalla de inicio con botón Empezar');
  await c.js(`document.getElementById('uem-empezar').click()`);
  await esperar(200);
  const datos = JSON.parse(await c.js(`fetch(TYJ.url('juegos/una-entre-un-millon/preguntas.json')).then(r => r.text())`));
  let total = 0;
  const techo = (q) => Math.max(...q.respuestas.map(r => r.n));
  const pts = (n, q) => n <= 1 ? 0 : Math.min(100, Math.round(100 * Math.log(n) / Math.log(techo(q))));
  ok(await c.js(`!!document.querySelector('.pista[role=progressbar]')`), 'la pista de la carrera está en pantalla');
  for (let i = 0; i < 7; i++) {
    const preg = await c.js(`document.querySelector('.uem-pregunta').textContent`);
    const q = datos.preguntas.find(x => x.pregunta === preg);
    ok(!!q, `pregunta ${i + 1}: «${preg}» está en el banco`);
    if (i === 0) {
      // respuesta rara con errata de una letra (debe tolerarse)
      const rara = q.respuestas.reduce((a, b) => b.n > a.n ? b : a);
      const texto = rara.t[0].length >= 6 ? rara.t[0].slice(0, -1) + 'x' : rara.t[0];
      await c.js(`(() => { const e = document.getElementById('uem-respuesta'); e.value = ${JSON.stringify(texto)}; e.form.requestSubmit(); })()`);
      await esperar(150);
      const t = await c.js(`document.querySelector('.uem-resultado').innerText`);
      const esperados = pts(rara.n, q);
      ok(t.includes('+' + esperados), `respuesta rara «${texto}» (errata) suma ${esperados} puntos`);
      total += esperados;
    } else if (i === 1) {
      await c.js(`(() => { const e = document.getElementById('uem-respuesta'); e.value = 'zzzz nada'; e.form.requestSubmit(); })()`);
      await esperar(150);
      ok((await c.js(`document.querySelector('.uem-resultado').innerText`)).includes('no está en mi lista'), 'respuesta inventada: 0 puntos');
    } else if (i === 2) {
      await c.js(`[...document.querySelectorAll('button')].find(b => b.textContent === 'Paso').click()`);
      await esperar(150);
      ok((await c.js(`document.querySelector('.uem-resultado').innerText`)).includes('Has pasado'), 'Paso: 0 puntos');
    } else {
      const comun = q.respuestas.reduce((a, b) => b.n < a.n ? b : a);
      await c.js(`(() => { const e = document.getElementById('uem-respuesta'); e.value = ${JSON.stringify(comun.t[0].toUpperCase())}; e.form.requestSubmit(); })()`);
      await esperar(150);
      total += pts(comun.n, q);
      ok(await c.js(`document.querySelector('.pista').getAttribute('aria-valuenow')`) === String(total), `el coche avanza a ${total} puntos`);
    }
    await c.js(`[...document.querySelectorAll('button')].find(b => b.textContent === 'Siguiente' || b.textContent === 'Ver resultado').click()`);
    await esperar(150);
  }
  const fin = await c.js(`document.querySelector('.final').innerText`);
  console.log('   final:', fin.replace(/\n+/g, ' | ').slice(0, 300));
  ok(fin.includes(String(total).replace(/\B(?=(\d{3})+(?!\d))/g, '.')), `puntuación final = ${total}`);
  ok(await c.js(`document.querySelector('.pista')?.getAttribute('aria-valuetext')`) === `${total} de 700 puntos (${Math.round(total / 7)} %)`, 'la pista final marca los puntos y el porcentaje sobre 700');
  ok(fin.includes('Compartir resultado') && fin.includes('Jugar otra vez'), 'final con compartir y repetir');
  ok(await c.js(`document.querySelectorAll('.uem-niveles li[aria-current]').length`) === 1, 'un nivel marcado');
  await capturar(c, 'uem-final', false);
  // meta perfecta: la respuesta más rara de cada pregunta vale 100 y siete preguntas son 700
  await c.js(`[...document.querySelectorAll('button')].find(b => b.textContent === 'Jugar otra vez').click()`);
  await esperar(200);
  for (let i = 0; i < 7; i++) {
    const preg = await c.js(`document.querySelector('.uem-pregunta').textContent`);
    const q = datos.preguntas.find(x => x.pregunta === preg);
    const rara = q.respuestas.reduce((a, b) => b.n > a.n ? b : a);
    await c.js(`(() => { const e = document.getElementById('uem-respuesta'); e.value = ${JSON.stringify(rara.t[0])}; e.form.requestSubmit(); })()`);
    await esperar(120);
    ok((await texto('.uem-resultado')).includes('+100 puntos de 100'), `pregunta ${i + 1}: la más rara vale 100`);
    await c.js(`[...document.querySelectorAll('button')].find(b => b.textContent === 'Siguiente' || b.textContent === 'Ver resultado').click()`);
    await esperar(120);
  }
  const fin2 = await c.js(`document.querySelector('.final').innerText`);
  ok(fin2.includes('¡Meta perfecta!') && fin2.includes('700'), 'siete respuestas rarísimas = 700 puntos = meta');
  ok(await c.js(`document.querySelector('.pista').classList.contains('pista--meta')`), 'el coche llega a la bandera');
  await capturar(c, 'uem-meta', false);
  // timeout: forzamos 25 s? usamos reloj rápido
  await c.js(`[...document.querySelectorAll('button')].find(b => b.textContent === 'Jugar otra vez').click()`);
  await esperar(200);
  await c.js(`(() => { const o = performance.now; performance.now = () => o.call(performance) + 30000; })()`);
  await esperar(500);
  ok((await c.js(`document.querySelector('.uem-resultado')?.innerText || ''`)).includes('Se acabó el tiempo'), 'se acaba el tiempo a los 25 s');
  const alm = await c.js(`(async () => JSON.stringify({ls: localStorage.length, ss: sessionStorage.length, ck: document.cookie, idb: (await indexedDB.databases()).length}))()`);
  ok(alm === '{"ls":0,"ss":0,"ck":"","idb":0}', 'no guarda nada');
  const cons = c.consola().filter(x => !/favicon/.test(x));
  ok(cons.length === 0, 'sin errores en consola ' + JSON.stringify(cons));
  await c.vista(375, 800, 'light', true);
  await c.ir(base + '/juegos/una-entre-un-millon/', 800);
  await c.js(`document.getElementById('uem-empezar').click()`);
  await esperar(300);
  await c.js(`document.querySelector('#uem').scrollIntoView()`);
  await capturar(c, 'uem-movil', false);
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'TODO BIEN');
process.exit(fallos.length ? 1 : 0);
