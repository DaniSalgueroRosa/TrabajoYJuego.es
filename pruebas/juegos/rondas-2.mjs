// ¿Quién soy?, Mayor o menor, Velocidad mental, Detecta el patrón y El impostor.
// Se lanza con «python3 sitio.py probar --navegador» (PUERTO la pone el lanzador). Capturas opcionales: CAPTURAS=carpeta.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
const fin = () => c.js(`document.querySelector('.final')?.innerText || ''`);
try {
  await c.vista(900, 900);
  // ---- ¿Quién soy?
  await c.ir(base + '/juegos/quien-soy/', 900);
  const el = JSON.parse(await c.js(`fetch(TYJ.url('juegos/quien-soy/personajes.json')).then(r => r.text())`)).elementos;
  await clic('Empezar'); await esperar(150);
  let pistas = await c.js(`[...document.querySelectorAll('.qs-pistas li')].map(l => l.textContent.replace(/^\\d+\\. /, ''))`);
  const q = el.find(x => x.p[0] === pistas[0]);
  ok(!!q && pistas.length === 1, '¿quién soy?: una pista inicial del banco (' + (q && q.n) + ')');
  await clic('Otra pista (−20 puntos)'); await clic('Otra pista (−20 puntos)'); await esperar(60);
  ok((await c.js(`document.querySelectorAll('.qs-pistas li').length`)) === 3, '¿quién soy?: 3 pistas tras pedir dos');
  ok((await c.js(`document.querySelector('.rondas-enunciado').textContent`)).includes('vale 60'), '¿quién soy?: la ronda vale 60');
  await c.js(`(() => { const e = document.getElementById('rondas-respuesta'); e.value = ${JSON.stringify(q.r[0])}; e.form.requestSubmit(); })()`); await esperar(80);
  const av = await c.js(`document.querySelector('.rondas-aviso').innerText`);
  ok(/\+(\d+)/.test(av) && +av.match(/\+(\d+)/)[1] >= 60 && +av.match(/\+(\d+)/)[1] <= 90, '¿quién soy?: acierto con 3 pistas → ' + av.split('\n')[0]);
  // ---- Mayor o menor: fallamos a propósito hasta acabar las vidas
  await c.ir(base + '/juegos/mayor-menor/', 900);
  await clic('Empezar'); await esperar(100);
  let rondas = 0, textos = [];
  while (rondas < 60 && !(await fin())) {
    const t = await c.js(`document.querySelector('.rondas-enunciado')?.textContent || ''`);
    if (!t) break;
    if (rondas < 3) textos.push(t);
    await c.js(`document.querySelectorAll('.opcion')[0].click()`); await esperar(40);
    await clic('Siguiente') || await clic('Ver resultado'); await esperar(40);
    rondas++;
  }
  console.log('   ejemplos:', textos.join(' || '));
  ok(rondas >= 2 && rondas < 60 && (await fin()).includes('Rondas jugadas'), 'mayor-menor: acaba al agotar las 2 vidas (' + rondas + ' rondas)');
  // coherencia: respondemos bien usando el JSON
  await c.ir(base + '/juegos/mayor-menor/', 700);
  const cats = JSON.parse(await c.js(`fetch(TYJ.url('juegos/mayor-menor/datos.json')).then(r => r.text())`)).categorias;
  await clic('Empezar'); await esperar(100);
  let buenas = 0;
  for (let i = 0; i < 12; i++) {
    const t = await c.js(`document.querySelector('.rondas-enunciado').textContent`);
    const ops = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.opcion')].map(b => b.textContent.replace(/^\\d /, '')))`));
    // formato: «A: valor. ¿…B…?»
    let cat = cats.find(x => ({ poblacion: 'Más habitantes', altitud: 'Mayor altitud', longitud: 'Más largo', anios: 'Después' }[x.id]) === ops[0]);
    const m = t.match(/^(?:El río )?(.+?): /);
    const A = cat.items.find(it => t.startsWith(it[0] + ':') || t.startsWith('El río ' + it[0] + ':'));
    const B = cat.items.filter(it => it[0] !== A[0] && (t.includes(' ' + it[0] + ' ') || t.includes('¿' + it[0] + ' ') || t.includes('río ' + it[0] + ' ') || t.includes('de ' + it[0] + ' ') || t.includes('tiene ' + it[0] + ' ')) )
                       .sort((x, y) => t.lastIndexOf(y[0]) - t.lastIndexOf(x[0]))[0];
    const idx = B[1] > A[1] ? 0 : 1;
    await c.js(`document.querySelectorAll('.opcion')[${idx}].click()`); await esperar(40);
    const a = await c.js(`document.querySelector('.rondas-aviso').innerText`);
    if (a.includes('Correcto')) buenas++; else console.log('   fallo en:', t, '→', a.split('\n')[0]);
    await clic('Siguiente'); await esperar(40);
  }
  ok(buenas === 12, 'mayor-menor: 12/12 con la respuesta calculada del JSON (' + buenas + ')');
  // ---- Velocidad mental
  await c.ir(base + '/juegos/velocidad-mental/', 800);
  await clic('Empezar'); await esperar(100);
  for (let i = 0; i < 30 && !(await fin()); i++) { await c.js(`document.querySelectorAll('.opcion')[0]?.click()`); await esperar(150); }
  await esperar(1500);
  const f = await fin();
  ok(f.includes('Operaciones respondidas'), 'velocidad mental: termina por vidas (' + f.replace(/\n+/g, ' | ').slice(0, 120) + ')');
  await c.ir(base + '/juegos/velocidad-mental/', 800);
  await clic('Empezar'); await esperar(100);
  await c.js(`(() => { const o = performance.now; performance.now = () => o.call(performance) + 61000; })()`);
  await esperar(500);
  ok((await fin()).includes('puntos'), 'velocidad mental: termina al pasar el minuto');
  // ---- Detecta el patrón: coherencia de cada ronda (la opción correcta aparece una vez y coincide con la explicación)
  await c.ir(base + '/juegos/detecta-el-patron/', 800);
  await clic('Empezar'); await esperar(100);
  let consistentes = 0;
  for (let i = 0; i < 10; i++) {
    const ops = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.opcion')].map(b => b.textContent.replace(/^\\d /, '')))`));
    await c.js(`document.querySelectorAll('.opcion')[0].click()`); await esperar(40);
    const info = await c.js(`document.querySelector('.rondas-aviso').innerText`);
    const sig = (info.match(/Seguía: (.+?)\./) || [])[1];
    const verdes = await c.js(`document.querySelectorAll('.opcion.ok').length`);
    const textoVerde = await c.js(`document.querySelector('.opcion.ok')?.textContent.replace(/^\\d /, '')`);
    if (new Set(ops).size === 4 && verdes === 1 && textoVerde === sig) consistentes++; else console.log('   incoherente:', ops, sig, textoVerde);
    await clic('Siguiente') || await clic('Ver resultado'); await esperar(40);
  }
  ok(consistentes === 10, 'detecta el patrón: 10/10 rondas coherentes (4 opciones distintas y la correcta = «Seguía») (' + consistentes + ')');
  // ---- El impostor: coherencia
  await c.ir(base + '/juegos/el-impostor/', 800);
  const conj = JSON.parse(await c.js(`fetch(TYJ.url('juegos/el-impostor/afirmaciones.json')).then(r => r.text())`)).conjuntos;
  await clic('Empezar'); await esperar(100);
  const ops = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.opcion')].map(b => b.textContent.replace(/^\\d /, '')))`));
  const cj = conj.find(x => ops.includes(x.f));
  await c.js(`document.querySelectorAll('.opcion')[${ops.indexOf(cj.f)}].click()`); await esperar(60);
  ok((await c.js(`document.querySelector('.rondas-aviso').innerText`)).includes('Correcto'), 'impostor: acierto con la falsa del banco');
  const cons = c.consola().filter(x => !/favicon/.test(x));
  ok(cons.length === 0, 'sin errores en consola ' + JSON.stringify(cons));
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'TODO BIEN');
process.exit(fallos.length ? 1 : 0);
