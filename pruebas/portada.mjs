// La portada con el contenido real, en Chrome: los bloques «Juegos por categoría» e «Información y transparencia» se ven bien en móvil,
// tablet y escritorio (sin desbordes, con contraste suficiente, sin errores), todos sus enlaces llevan a una página que existe y
// el enlace de cada categoría abre el listado de juegos ya filtrado.
// Se lanza con «python3 sitio.py probar --navegador» (PUERTO la pone el lanzador). Capturas opcionales: CAPTURAS=carpeta.
import { abrirChrome } from './cdp.mjs';
import { CONTRASTE } from './contraste.mjs';
import { capturar } from './juegos/ayudas.mjs';
import fs from 'node:fs';

// Cuántos juegos publicados hay y cuántos son de «Palabras»: se leen de las fichas, así la prueba no depende de un número fijo.
const RAIZ_JUEGOS = new URL('../juegos/', import.meta.url);
const FICHAS = fs.readdirSync(RAIZ_JUEGOS, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('_') && fs.existsSync(new URL(d.name + '/ficha.json', RAIZ_JUEGOS)))
  .map(d => JSON.parse(fs.readFileSync(new URL(d.name + '/ficha.json', RAIZ_JUEGOS), 'utf8')))
  .filter(f => (f.estado || 'publicado') === 'publicado');
const TOTAL = FICHAS.length;
const PALABRAS = FICHAS.filter(f => f.categoria === 'palabras').length;

const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { if (!cond) { console.log('  ✗ ' + t); fallos.push(t); } return cond; };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));

try {
  // ---- 1. Tres tamaños: sin errores, sin desbordes, contraste, nombres accesibles, nada guardado
  for (const [nombre, ancho, alto, movil] of [['móvil', 375, 800, true], ['tablet', 768, 1024, true], ['escritorio', 1280, 900, false]]) {
    await c.vista(ancho, alto, 'light', movil);
    await c.ir(base + '/', 900);
    const i = JSON.parse(await c.js(`JSON.stringify({
      desborde: document.documentElement.scrollWidth > innerWidth + 1,
      h1: document.querySelectorAll('h1').length,
      grupos: document.querySelectorAll('[aria-labelledby="explorar-juegos"] .explorar-grupo').length,
      juegos: document.querySelectorAll('[aria-labelledby="explorar-juegos"] .explorar-items a').length,
      puntos: document.querySelectorAll('.informacion-punto').length,
      legales: document.querySelectorAll('.informacion-legales a').length,
      sinNombre: [...document.querySelectorAll('.explorar a, .informacion a')].filter(a => !a.textContent.trim()).length,
      desbordaBloque: [...document.querySelectorAll('.explorar-grupo, .informacion-punto, .informacion-legales a')].filter(e => e.scrollWidth > e.clientWidth + 1).length,
      ls: localStorage.length + sessionStorage.length, ck: document.cookie })`));
    const con = await c.js(CONTRASTE);
    const e = c.consola().filter(x => !/favicon/.test(x));
    ok(!i.desborde, `${nombre}: la portada desborda en horizontal`);
    ok(i.h1 === 1, `${nombre}: debe haber un solo <h1> (hay ${i.h1})`);
    ok(i.grupos === 9, `${nombre}: el índice tiene 9 categorías (hay ${i.grupos})`);
    ok(i.juegos === TOTAL, `${nombre}: el índice enlaza ${TOTAL} juegos (hay ${i.juegos})`);
    ok(i.puntos === 3, `${nombre}: la información tiene 3 puntos (hay ${i.puntos})`);
    ok(i.legales === 6, `${nombre}: la información enlaza 6 páginas legales (hay ${i.legales})`);
    ok(i.sinNombre === 0, `${nombre}: hay enlaces sin texto`);
    ok(i.desbordaBloque === 0, `${nombre}: algún bloque corta su contenido (${i.desbordaBloque})`);
    ok(con.fallos.length === 0, `${nombre}: contraste insuficiente → ${con.fallos.join(' | ')}`);
    ok(i.ls === 0 && i.ck === '', `${nombre}: guarda datos en el dispositivo`);
    ok(e.length === 0, `${nombre}: errores de consola ${JSON.stringify(e)}`);
    console.log(`  ${nombre}: ${con.comprobados} textos medidos, ${i.grupos} categorías, ${i.juegos} juegos, ${i.legales} páginas legales`);
    await capturar(c, 'portada-' + nombre);
  }

  // ---- 2. Todos los enlaces de los dos bloques llevan a una página que existe y tiene su título
  await c.vista(1280, 900, 'light', false);
  await c.ir(base + '/', 500);
  const enlaces = JSON.parse(await c.js(`JSON.stringify([...new Set([...document.querySelectorAll('.explorar a, .informacion a')].map(a => a.getAttribute('href')))])`));
  ok(enlaces.length >= 8 + TOTAL + 6, `hay al menos ${8 + TOTAL + 6} enlaces distintos en los dos bloques (hay ${enlaces.length})`);
  let rotos = [];
  for (const h of enlaces) {
    const ruta = h.split('#')[0].split('?')[0];
    const r = await fetch(base + '/' + ruta);
    await r.arrayBuffer();                                   // se lee el cuerpo entero: con decenas de enlaces sin leerlo, fetch de Node se atasca
    if (r.status !== 200) rotos.push(`${h} → ${r.status}`);
  }
  ok(rotos.length === 0, `enlaces rotos en la portada: ${rotos.join(', ')}`);

  // ---- 3. El enlace de una categoría abre el listado ya filtrado
  await c.ir(base + '/', 500);
  const clic = (sel) => c.js(`(() => { const a = [...document.querySelectorAll('${sel}')].find(a => /^Palabras\\b/.test(a.textContent.trim())); if (!a) return false; a.click(); return true; })()`);
  ok(await clic('.explorar-grupo-titulo a'), 'está el enlace de la categoría «Palabras»');
  await esperar(900);
  ok((await c.js('location.pathname + location.search')) === '/juegos/?categoria=palabras', 'el enlace de «Palabras» abre /juegos/?categoria=palabras');
  const f = JSON.parse(await c.js(`JSON.stringify({
    visibles: [...document.querySelectorAll('ul.rejilla > li')].filter(li => !li.hidden).length,
    total: document.querySelectorAll('ul.rejilla > li').length,
    pulsado: [...document.querySelectorAll('[data-filtro-categoria][aria-pressed=true]')].map(b => b.getAttribute('data-filtro-categoria')),
    estado: (document.querySelector('[data-filtro-estado]') || {}).textContent,
    formVisible: !document.querySelector('[data-filtros]').hidden })`));
  ok(f.formVisible, 'el listado muestra sus filtros');
  ok(f.total === TOTAL && f.visibles === PALABRAS, `con ?categoria=palabras se ven ${PALABRAS} de ${TOTAL} juegos (se ven ${f.visibles} de ${f.total})`);
  ok(f.pulsado.length === 1 && f.pulsado[0] === 'palabras', `el botón «Palabras» queda pulsado (${JSON.stringify(f.pulsado)})`);
  ok(new RegExp(`${PALABRAS} de ${TOTAL} juegos`).test(f.estado || ''), `el contador dice «${PALABRAS} de ${TOTAL} juegos» (${f.estado})`);
  ok(await c.js(`(() => { const b = document.querySelector('[data-filtro-borrar]'); return !!b && !b.hidden; })()`), 'aparece «Quitar filtros»');
  await c.js(`document.querySelector('[data-filtro-borrar]').click()`);
  await esperar(200);
  ok((await c.js(`[...document.querySelectorAll('ul.rejilla > li')].filter(li => !li.hidden).length`)) === TOTAL, `quitar los filtros vuelve a mostrar los ${TOTAL} juegos`);

  // ---- 4. Una categoría que no existe en la dirección se ignora: se ve todo
  for (const cat of ['nada', '', '%3Cscript%3E']) {
    await c.ir(base + '/juegos/?categoria=' + cat, 600);
    ok((await c.js(`[...document.querySelectorAll('ul.rejilla > li')].filter(li => !li.hidden).length`)) === TOTAL, `?categoria=${cat || '(vacía)'} se ignora y se ven los ${TOTAL} juegos`);
    ok((await c.js(`document.querySelector('[data-filtro-categoria=""]').getAttribute('aria-pressed')`)) === 'true', `?categoria=${cat || '(vacía)'}: queda marcado «Todas»`);
  }
  // cada categoría del índice abre un listado con tantos juegos como dice el índice
  await c.ir(base + '/', 500);
  const cuentas = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('[aria-labelledby="explorar-juegos"] .explorar-grupo')].map(g => ({ href: g.querySelector('.explorar-grupo-titulo a').getAttribute('href'), n: g.querySelectorAll('.explorar-items a').length })))`));
  for (const g of cuentas) {
    await c.ir(base + '/' + g.href, 500);
    const n = await c.js(`[...document.querySelectorAll('ul.rejilla > li')].filter(li => !li.hidden).length`);
    ok(n === g.n, `${g.href}: el listado muestra ${n} juegos y el índice anunciaba ${g.n}`);
  }

  // ---- 5. Clic real: de un juego del índice a su página y de la información a una página legal
  await c.ir(base + '/', 500);
  ok(await c.js(`(() => { const a = document.querySelector('.explorar-items a[href="juegos/palabra-infinita/"]'); if (!a) return false; a.click(); return true; })()`), 'el índice enlaza «Palabra Infinita»');
  await esperar(700);
  ok((await c.js('location.pathname')) === '/juegos/palabra-infinita/', 'el clic en un juego del índice abre su página');
  ok(/Palabra Infinita/i.test(await c.js(`document.querySelector('h1').textContent`)), 'y la página del juego tiene su título');
  await c.ir(base + '/', 500);
  ok(await c.js(`(() => { const a = document.querySelector('.informacion-legales a[href="legal/politica-de-privacidad/"]'); if (!a) return false; a.click(); return true; })()`), 'la información enlaza la política de privacidad');
  await esperar(700);
  ok((await c.js('location.pathname')) === '/legal/politica-de-privacidad/', 'el clic en la información abre la política de privacidad');

  // ---- 6. Teclado: los enlaces de los dos bloques muestran el foco
  await c.vista(1280, 900, 'light', false);
  await c.ir(base + '/', 500);
  // una pulsación real de Tab marca la modalidad «teclado»; a partir de ahí, enfocar por script activa :focus-visible como con Tab
  for (const tipo of ['keyDown', 'keyUp']) await c.enviar('Input.dispatchKeyEvent', { type: tipo, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  const sinFoco = JSON.parse(await c.js(`(() => { const malos = [];
    for (const a of [...document.querySelectorAll('.explorar-grupo-titulo a, .explorar-items a, .explorar-todos a, .informacion-legales a')]) {
      a.focus(); const s = getComputedStyle(a);
      if (!(s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2)) malos.push(a.getAttribute('href'));
    } return JSON.stringify(malos); })()`));
  ok(sinFoco.length === 0, `todos los enlaces de los dos bloques muestran el foco (faltan: ${sinFoco.join(', ')})`);
  // el contorno del foco se ve sobre el fondo del bloque (en el bloque oscuro es limón; en el claro, pizarra)
  const focoColor = await c.js(`(() => { const a = document.querySelector('[aria-labelledby="explorar-juegos"] .explorar-items a'); a.focus(); return getComputedStyle(a).outlineColor; })()`);
  ok(/230, 241, 74/.test(focoColor), `en el índice oscuro el foco es limón (${focoColor})`);
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'PORTADA: índice por categoría e información, bien en móvil, tablet y escritorio');
process.exit(fallos.length ? 1 : 0);
