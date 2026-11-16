// Quiz de ciencia, Quiz de historia, Verdadero o falso, Refranes, Faltas de ortografía, Sinónimos y antónimos, Provincias de España.
// Se lanza con «python3 sitio.py probar --navegador» (PUERTO la pone el lanzador). Capturas opcionales: CAPTURAS=carpeta.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
const datos = async (ruta) => JSON.parse(await c.js(`fetch('/juegos/${ruta}').then(r => r.text())`));
const enunciado = () => c.js(`document.querySelector('.rondas-enunciado')?.textContent || ''`);
const opciones = async () => JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.opcion')].map(b => b.textContent.replace(/^\\d /, '')))`));

/* Juega una partida entera eligiendo siempre la respuesta correcta que calcula «correcta(enunciado, opciones)».
   Si «fallarEn» es un número de ronda, en esa ronda elige a propósito una respuesta incorrecta. */
async function partida(nombre, ruta, rondas, correcta, fallarEn = -1) {
  await c.ir(base + '/juegos/' + ruta + '/', 900);
  ok(await clic('Empezar'), nombre + ': Empezar');
  let bien = 0, vistos = new Set(), raros = 0;
  for (let i = 0; i < rondas; i++) {
    await esperar(60);
    const enun = await enunciado(), ops = await opciones();
    vistos.add(enun + '|' + ops.join('/'));
    const buena = await correcta(enun, ops);
    const idx = ops.indexOf(buena);
    if (idx < 0) { raros++; ok(false, `${nombre} r${i + 1}: respuesta correcta no encontrada («${enun}» → «${buena}» en ${ops.join(' | ')})`); break; }
    const elegida = i === fallarEn ? (idx + 1) % ops.length : idx;
    await c.js(`document.querySelectorAll('.opcion')[${elegida}].click()`);
    await esperar(60);
    const aviso = await c.js(`document.querySelector('.rondas-aviso')?.innerText || ''`);
    if (i === fallarEn) ok(aviso.includes('Fallo'), `${nombre} r${i + 1}: fallo a propósito detectado`);
    else if (aviso.includes('Correcto')) bien++;
    else ok(false, `${nombre} r${i + 1}: «${enun}» → «${buena}» no se dio por bueno (${aviso.replace(/\n/g, ' ')})`);
    await clic(i === rondas - 1 ? 'Ver resultado' : 'Siguiente');
  }
  const esperados = rondas - (fallarEn >= 0 ? 1 : 0);
  ok(bien === esperados, `${nombre}: ${bien}/${esperados} aciertos esperados`);
  const fin = await c.js(`document.querySelector('.final')?.innerText || ''`);
  ok(fin.includes(`${esperados} aciertos de ${rondas}`), `${nombre}: pantalla final «${esperados} aciertos de ${rondas}»`);
  if (fallarEn >= 0) ok(fin.includes('Repasa lo que has fallado (1)'), `${nombre}: repaso con 1 fallo`);
  ok(vistos.size === rondas, `${nombre}: ${vistos.size} preguntas distintas en la partida`);
  return fin;
}

try {
  await c.vista(900, 900);
  await c.ir(base + '/', 300);

  // ---------- Quiz de ciencia e historia (mismo formato que cultura general)
  for (const [nombre, ruta, marca] of [['ciencia', 'quiz-de-ciencia', 'qc'], ['historia', 'quiz-de-historia', 'qh']]) {
    const banco = (await datos(ruta + '/preguntas.json')).preguntas;
    ok(banco.length >= 60, `${nombre}: banco de ${banco.length} preguntas`);
    await partida(nombre, ruta, 10, async (enun) => (banco.find(x => x.p === enun) || { o: [''] }).o[0], 4);
    if (marca === 'qc') await capturar(c, 'quiz-ciencia-final', false);
  }

  // ---------- Verdadero o falso: 15 afirmaciones, reparto equilibrado y teclado
  {
    const banco = (await datos('verdadero-o-falso/afirmaciones.json')).afirmaciones;
    ok(banco.length >= 60, `v/f: banco de ${banco.length} afirmaciones`);
    let verdaderas = 0;
    await partida('v/f', 'verdadero-o-falso', 15, async (enun, ops) => {
      const a = banco.find(x => x.p === enun); if (!a) return '';
      if (a.v) verdaderas++;
      return a.v ? 'Verdadero' : 'Falso';
    });
    ok(verdaderas === 7 || verdaderas === 8, `v/f: reparto equilibrado (${verdaderas} verdaderas de 15)`);
    // teclado: 1 = Verdadero, 2 = Falso
    await c.ir(base + '/juegos/verdadero-o-falso/', 900);
    await clic('Empezar'); await esperar(80);
    const enun = await enunciado(), a = banco.find(x => x.p === enun);
    const tecla = async (key) => { await c.enviar('Input.dispatchKeyEvent', { type: 'keyDown', key, text: key }); await c.enviar('Input.dispatchKeyEvent', { type: 'keyUp', key }); };
    await tecla(a.v ? '1' : '2'); await esperar(80);
    ok((await c.js(`document.querySelector('.rondas-aviso')?.innerText || ''`)).includes('Correcto'), 'v/f: la tecla ' + (a.v ? '1' : '2') + ' responde');
  }

  // ---------- Refranes: el enunciado lleva el comienzo del refrán
  {
    const banco = (await datos('refranes/refranes.json')).refranes;
    ok(banco.length >= 60, `refranes: banco de ${banco.length}`);
    const fin = await partida('refranes', 'refranes', 10, async (enun) => {
      const m = enun.match(/«(.*) …»$/); const r = m && banco.find(x => x.p === m[1]);
      return r ? r.o[0] : '';
    }, 2);
    ok(/Refrán completo: «/.test(await c.js(`document.body.innerText`)) || fin.length > 0, 'refranes: pantalla final');
    // se muestra el refrán completo y su significado al responder
    await c.ir(base + '/juegos/refranes/', 900);
    await clic('Empezar'); await esperar(80);
    const enun = await enunciado(), m = enun.match(/«(.*) …»$/), r = banco.find(x => x.p === m[1]);
    const ops = await opciones();
    await c.js(`document.querySelectorAll('.opcion')[${ops.indexOf(r.o[0])}].click()`); await esperar(80);
    const t = await c.js(`document.querySelector('.rondas-aviso')?.innerText || ''`);
    ok(t.includes('Refrán completo: «' + r.p + ' ' + r.o[0] + '.»') && t.includes(r.e), 'refranes: muestra el refrán completo y su significado');
    await capturar(c, 'refranes-respuesta', false);
  }

  // ---------- Faltas de ortografía: huecos y «palabra bien escrita»
  {
    const banco = (await datos('faltas-de-ortografia/preguntas.json')).preguntas;
    ok(banco.length >= 40, `ortografía: banco de ${banco.length}`);
    let huecos = 0, palabras = 0;
    await partida('ortografía', 'faltas-de-ortografia', 10, async (enun, ops) => {
      const m = enun.match(/^Completa la frase: «(.*)»$/);
      if (m) { huecos++; const q = banco.find(x => x.p === m[1]); return q ? q.o[0] : ''; }
      palabras++;
      const q = banco.find(x => x.p === 'Palabra bien escrita:' && x.o.length === ops.length && x.o.every(o => ops.includes(o)));
      return q ? q.o[0] : '';
    }, 7);
    console.log(`   huecos: ${huecos}, palabras: ${palabras}`);
  }

  // ---------- Sinónimos y antónimos
  {
    const banco = (await datos('sinonimos-y-antonimos/palabras.json')).preguntas;
    ok(banco.length >= 50, `sinónimos: banco de ${banco.length}`);
    let sin = 0, ant = 0;
    await partida('sinónimos', 'sinonimos-y-antonimos', 10, async (enun) => {
      const m = enun.match(/^¿Qué palabra es (sinónima|antónima) de «(.*)»\?$/); if (!m) return '';
      const k = m[1] === 'sinónima' ? 'sinonimo' : 'antonimo'; k === 'sinonimo' ? sin++ : ant++;
      const q = banco.find(x => x.k === k && x.p === m[2]); return q ? q.o[0] : '';
    });
    ok(sin + ant === 10, `sinónimos: ${sin} sinónimos y ${ant} antónimos`);
  }

  // ---------- Provincias de España: tres tipos de pregunta (4 + 3 + 3)
  {
    const prov = (await datos('provincias-de-espana/provincias.json')).provincias;
    ok(prov.length === 50, `provincias: ${prov.length} provincias en los datos`);
    const tipos = { c: 0, k: 0, i: 0 };
    await partida('provincias', 'provincias-de-espana', 10, async (enun, ops) => {
      let m;
      if ((m = enun.match(/^¿En qué comunidad autónoma está la provincia de (.*)\?$/))) { tipos.c++; return (prov.find(p => p.n === m[1]) || {}).ca; }
      if ((m = enun.match(/^¿Cuál es la capital de la provincia de (.*)\?$/))) { tipos.k++; return (prov.find(p => p.n === m[1]) || {}).cap; }
      if ((m = enun.match(/^¿Cuál de estas provincias está en la comunidad «(.*)»\?$/))) { tipos.i++; return ops.find(o => (prov.find(p => p.n === o) || {}).ca === m[1]); }
      return '';
    }, 5);
    ok(tipos.c === 4 && tipos.k === 3 && tipos.i === 3, `provincias: tipos de pregunta ${JSON.stringify(tipos)}`);
    // las opciones de cada pregunta son 4 y distintas
    await c.ir(base + '/juegos/provincias-de-espana/', 900);
    await clic('Empezar'); await esperar(80);
    const ops = await opciones();
    ok(ops.length === 4 && new Set(ops).size === 4, 'provincias: cuatro opciones distintas (' + ops.join(', ') + ')');
    await capturar(c, 'provincias-pregunta', false);
  }

  const alm = await c.js(`(async () => JSON.stringify({ls: localStorage.length, ss: sessionStorage.length, ck: document.cookie, idb: (await indexedDB.databases()).length}))()`);
  ok(alm === '{"ls":0,"ss":0,"ck":"","idb":0}', 'no guarda nada');
  const cons = c.consola().filter(x => !/favicon/.test(x));
  ok(cons.length === 0, 'sin errores en consola ' + JSON.stringify(cons));
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'TODO BIEN');
process.exit(fallos.length ? 1 : 0);
