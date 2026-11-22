// Una entre un millón (carretera de noche): puntos por rareza, tolerancia a erratas, SEGUNDA OPORTUNIDAD con 10 puntos seguros, tiempo, lienzo y final.
// Se lanza con «python3 sitio.py probar --navegador» (PUERTO la pone el lanzador). Capturas opcionales: CAPTURAS=carpeta.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const texto = (sel) => c.js(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const responder = (t, id = 'uem-respuesta') => c.js(`(() => { const e = document.getElementById(${JSON.stringify(id)}); e.value = ${JSON.stringify(t)}; e.form.requestSubmit(); })()`);
const pulsar = (t) => c.js(`[...document.querySelectorAll('button')].find(b => b.textContent.startsWith(${JSON.stringify(t)})).click()`);
const siguiente = async () => { await c.js(`[...document.querySelectorAll('button')].find(b => b.textContent === 'Siguiente' || b.textContent === 'Ver resultado').click()`); await esperar(150); };
const techo = (q) => Math.max(...q.respuestas.map(r => r.n));
const pts = (n, q) => n <= 1 ? 0 : Math.min(100, Math.round(100 * Math.log(n) / Math.log(techo(q))));
try {
  await c.vista(900, 900);
  await c.ir(base + '/juegos/una-entre-un-millon/', 1000);
  ok(await c.js(`!!document.getElementById('uem-empezar')`), 'pantalla de inicio con botón Empezar');
  ok(await c.js(`!!document.querySelector('.uem-escena canvas.uem-lienzo')`), 'la carretera está dibujada en un lienzo');
  // el lienzo tiene que traer dibujo de verdad (cielo, carretera, coche), no un rectángulo vacío
  const colores = await c.js(`(() => { const l = document.querySelector('.uem-lienzo'), d = l.getContext('2d').getImageData(0, 0, l.width, l.height).data, s = new Set(); for (let i = 0; i < d.length; i += 4) s.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); return s.size; })()`);
  ok(colores >= 12, `el lienzo usa varios colores (${colores})`);
  await capturar(c, 'uem-inicio', false);
  await pulsar('Empezar');
  await esperar(200);
  const datos = JSON.parse(await c.js(`fetch(TYJ.url('juegos/una-entre-un-millon/preguntas.json')).then(r => r.text())`));
  let total = 0, previo = 0;
  const preguntaActual = async () => { const p = await c.js(`document.querySelector('.uem-pregunta').textContent`); return datos.preguntas.find(x => x.pregunta === p); };
  ok(await c.js(`document.querySelector('.uem-escena[role=progressbar]').getAttribute('aria-valuemax')`) === '700', 'el recorrido marca 700 puntos de meta');
  for (let i = 0; i < 7; i++) {
    const q = await preguntaActual();
    ok(!!q, `pregunta ${i + 1}: «${q && q.pregunta}» está en el banco`);
    const rara = q.respuestas.reduce((a, b) => b.n > a.n ? b : a), comun = q.respuestas.reduce((a, b) => b.n < a.n ? b : a);
    if (i === 0) {                         // rara con una errata de una letra: se tolera
      const t = rara.t[0].length >= 6 ? rara.t[0].slice(0, -1) + 'x' : rara.t[0];
      await responder(t); await esperar(150);
      ok((await texto('.uem-resultado')).includes('+' + pts(rara.n, q)), `respuesta rara «${t}» (errata) suma ${pts(rara.n, q)}`);
      ok(await c.js(`document.querySelectorAll('.uem-odometro .uem-digito').length > 0`), 'se muestra el cuentakilómetros de la rareza');
      ok(await c.js(`document.querySelectorAll('.uem-eje .uem-nota').length`) === q.respuestas.length && await c.js(`document.querySelectorAll('.uem-tuya').length`) === 1, 'la escala de rareza marca todas las respuestas y la tuya');
      total += pts(rara.n, q);
    } else if (i === 1) {                  // no está en la lista -> se ofrece otra; 10 puntos seguros
      await responder('zzzz nada'); await esperar(150);
      ok(await c.js(`!!document.getElementById('uem-otra')`) && (await texto('.uem-resultado--otra')).includes('no está en mi lista'), 'respuesta fuera de lista: ofrece una segunda oportunidad');
      ok(await c.js(`document.getElementById('uem-respuesta').disabled`), 'la primera respuesta queda cerrada');
      await capturar(c, 'uem-otra', false);
      await responder('qqqq otra', 'uem-otra'); await esperar(150);
      const t = await texto('.uem-resultado');
      ok(t.includes('+10 puntos') && t.includes('tampoco está en mi lista'), 'segunda respuesta inventada: +10 puntos seguros');
      total += 10;
    } else if (i === 2) {                  // dejarlo en 0
      await responder('zzzz nada'); await esperar(150);
      await pulsar('Dejarlo en 0'); await esperar(150);
      ok((await texto('.uem-resultado')).includes('0 puntos') && !(await texto('.uem-resultado')).includes('+10'), 'Dejarlo en 0: no suma nada');
    } else if (i === 3) {                  // repetir la misma respuesta no vale; la nueva, común, se queda en el mínimo de 10
      await responder('zzzz nada'); await esperar(150);
      await responder('zzzz nada', 'uem-otra'); await esperar(100);
      ok(await c.js(`!!document.getElementById('uem-otra') && !document.getElementById('uem-otra').disabled`) && (await texto('.uem-resultado--otra')).includes('distinta'), 'repetir la misma respuesta no cuenta: pide una distinta');
      await responder(comun.t[0], 'uem-otra'); await esperar(150);
      const real = pts(comun.n, q), t = await texto('.uem-resultado');
      ok(t.includes('+' + Math.max(10, real) + ' puntos'), `segunda respuesta común «${comun.t[0]}» (vale ${real}): mínimo de 10 → +${Math.max(10, real)}`);
      total += Math.max(10, real);
    } else if (i === 4) {                  // segunda respuesta rara: sus puntos reales (no solo 10)
      await responder('zzzz nada'); await esperar(150);
      await responder(rara.t[0], 'uem-otra'); await esperar(150);
      ok((await texto('.uem-resultado')).includes('+' + pts(rara.n, q) + ' puntos'), `segunda respuesta rara «${rara.t[0]}»: sus ${pts(rara.n, q)} puntos`);
      total += pts(rara.n, q);
    } else if (i === 5) {                  // Paso: sin segunda oportunidad
      await pulsar('Paso'); await esperar(150);
      ok((await texto('.uem-resultado')).includes('Has pasado') && !(await c.js(`!!document.getElementById('uem-otra')`)), 'Paso: 0 puntos y sin segunda oportunidad');
    } else {                               // segunda oportunidad que se queda sin tiempo
      await responder('zzzz nada'); await esperar(150);
      await c.js(`(() => { const o = performance.now; performance.now = () => o.call(performance) + 20000; })()`);
      await esperar(400);
      ok((await texto('.uem-resultado')).includes('0 puntos') && !(await c.js(`!!document.getElementById('uem-otra')`)), 'la segunda oportunidad se acaba a los 15 s: 0 puntos');
    }
    ok(await c.js(`document.querySelector('.uem-escena').getAttribute('aria-valuenow')`) === String(total), `tras la pregunta ${i + 1} el coche va por ${total} puntos`);
    ok((await texto('.uem-delta')).trim() === '+' + (total - previo), `el marcador enseña lo que avanzas con esta respuesta: +${total - previo}`);
    previo = total;
    await siguiente();
  }
  const fin = await c.js(`document.querySelector('.final').innerText`);
  console.log('   final:', fin.replace(/\n+/g, ' | ').slice(0, 300));
  ok(fin.includes(String(total).replace(/\B(?=(\d{3})+(?!\d))/g, '.')), `puntuación final = ${total}`);
  ok(await c.js(`document.querySelector('.uem-escena').getAttribute('aria-valuetext')`) === `${total} de 700 puntos (${Math.round(total / 7)} %)`, 'el recorrido final marca los puntos y el porcentaje sobre 700');
  ok(fin.includes('Compartir resultado') && fin.includes('Jugar otra vez'), 'final con compartir y repetir');
  ok(await c.js(`document.querySelectorAll('.uem-niveles li[aria-current]').length`) === 1, 'un nivel marcado');
  ok((await texto('.uem-tabla')).includes('2.ª oportunidad'), 'la tabla final indica qué respuestas fueron de segunda oportunidad');
  await capturar(c, 'uem-final', false);
  // meta perfecta: la respuesta más rara de cada pregunta vale 100 y siete preguntas son 700
  await pulsar('Jugar otra vez'); await esperar(200);
  for (let i = 0; i < 7; i++) {
    const q = await preguntaActual();
    const rara = q.respuestas.reduce((a, b) => b.n > a.n ? b : a);
    await responder(rara.t[0]); await esperar(120);
    ok((await texto('.uem-resultado')).includes('+100 puntos de 100'), `pregunta ${i + 1}: la más rara vale 100`);
    if (i === 6) { await esperar(2500); await capturar(c, 'uem-meta', false); }
    await siguiente();
  }
  const fin2 = await c.js(`document.querySelector('.final').innerText`);
  ok(fin2.includes('¡Meta perfecta!') && fin2.includes('700'), 'siete respuestas rarísimas = 700 puntos = meta');
  ok(await c.js(`document.querySelector('.uem-escena').classList.contains('uem-escena--meta')`), 'el coche llega al arco de meta');
  // tiempo: a los 25 s se acaba la pregunta (sin segunda oportunidad)
  await pulsar('Jugar otra vez'); await esperar(200);
  await c.js(`(() => { const o = performance.now; performance.now = () => o.call(performance) + 30000; })()`);
  await esperar(500);
  const tt = await texto('.uem-resultado');
  ok(tt.includes('Se acabó el tiempo') && !(await c.js(`!!document.getElementById('uem-otra')`)), 'se acaba el tiempo a los 25 s');
  const alm = await c.js(`(async () => JSON.stringify({ls: localStorage.length, ss: sessionStorage.length, ck: document.cookie, idb: (await indexedDB.databases()).length}))()`);
  ok(alm === '{"ls":0,"ss":0,"ck":"","idb":0}', 'no guarda nada');
  const cons = c.consola().filter(x => !/favicon/.test(x));
  ok(cons.length === 0, 'sin errores en consola ' + JSON.stringify(cons));
  // móvil: sin desbordes laterales
  await c.vista(375, 800, 'light', true);
  await c.ir(base + '/juegos/una-entre-un-millon/', 800);
  await pulsar('Empezar'); await esperar(300);
  ok(await c.js(`document.documentElement.scrollWidth <= window.innerWidth + 1`), 'en móvil no hay desbordamiento horizontal');
  await responder('zzzz nada'); await esperar(200);
  ok(await c.js(`document.documentElement.scrollWidth <= window.innerWidth + 1`), 'en móvil, la segunda oportunidad tampoco desborda');
  await c.js(`document.querySelector('#uem').scrollIntoView()`);
  await capturar(c, 'uem-movil', false);
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'TODO BIEN');
process.exit(fallos.length ? 1 : 0);
