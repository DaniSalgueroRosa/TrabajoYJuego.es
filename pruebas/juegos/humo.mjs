// Prueba de humo de todos los juegos y del catálogo, en Chrome real, en móvil, tablet y escritorio:
// cada juego carga sin errores, pinta controles, no desborda en horizontal, enlaza de vuelta al catálogo y NO guarda nada
// (ni localStorage, ni sessionStorage, ni cookies, ni IndexedDB, ni cachés). Se lanza con «python3 sitio.py probar --navegador».
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
import { CONTRASTE } from '../contraste.mjs';

const base = 'http://127.0.0.1:' + process.env.PUERTO;
const SLUGS = ['palabra-infinita', 'una-entre-un-millon', 'conexiones', 'que-palabra-soy', 'el-intruso', 'mente-matematica', 'quien-soy',
  'memoria-visual', 'acertijos', 'mayor-menor', 'cultura-general', 'donde-esta', 'palabras-encadenadas', 'velocidad-mental',
  'detecta-el-patron', 'el-impostor', 'ordena-la-historia', 'reflejos', '2048', 'el-superviviente',
  // los 30 juegos de la segunda tanda (orden 21 a 50)
  'sudoku', 'buscaminas', 'banderas', 'serpiente', 'ahorcado', 'tres-en-raya', 'cuatro-en-raya', 'capitales', 'test-de-clics', 'parejas',
  'bloques-que-caen', 'ladrillos', 'repite-la-secuencia', 'recuerda-el-numero', 'anagramas', 'sopa-de-letras', 'torre-de-hanoi', 'apaga-las-luces', 'puzle-deslizante', 'codigo-secreto',
  'las-cifras', 'test-de-mecanografia', 'tablas-de-multiplicar', 'provincias-de-espana', 'verdadero-o-falso', 'quiz-de-ciencia', 'quiz-de-historia', 'refranes', 'faltas-de-ortografia', 'sinonimos-y-antonimos',
  // los nueve sueltos (orden 51 a 59) y la tanda de fútbol y variados (orden 60 a 69)
  'piedra-papel-o-tijera', 'adivina-el-numero', 'juego-del-nim', 'tabla-de-schulte', 'inundacion', 'laberinto', 'el-24', 'ordena-los-frascos', 'encuentra-el-color',
  'quiz-de-futbol', 'que-futbolista-soy', 'tanda-de-penaltis', 'estadios-de-futbol', 'reglas-del-futbol',
  'hundir-la-flota', 'nonogramas', 'reversi', 'pilla-al-topo', 'raquetas',
  // la tanda de fútbol 70–81
  'adivina-el-once', 'futbolista-oculto', 'camino-de-clubes', 'apodos-de-clubes', 'balon-de-oro', 'goleadores-historicos', 'entrenador-campeon',
  'intruso-del-club', 'de-que-pais-es-el-club', 'ahorcado-de-futbol', 'tiro-libre', 'regates'];
const VISTAS = [['móvil', 375, 800, true], ['tablet', 768, 1024, true], ['escritorio', 1280, 900, false]];
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { if (!cond) { console.log('  ✗ ' + t); fallos.push(t); } return cond; };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const errores = () => c.consola().filter(x => !/favicon/.test(x));

try {
  // ---------------------------------------------------------------- cada juego
  for (const [nombre, ancho, alto, movil] of VISTAS) {
    await c.vista(ancho, alto, 'light', movil);
    let buenos = 0;
    for (const s of SLUGS) {
      await c.ir(`${base}/juegos/${s}/`, 700);
      const i = JSON.parse(await c.js(`(async () => JSON.stringify({
        h1: document.querySelectorAll('h1').length,
        cargando: !!document.querySelector('.pantalla .juego-aviso'),
        controles: document.querySelectorAll('.pantalla button, .pantalla canvas, .pantalla input').length,
        desborde: document.documentElement.scrollWidth > innerWidth + 1,
        apartados: document.querySelectorAll('.juego-texto h2').length,
        faq: document.querySelectorAll('.juego-texto details').length,
        volver: [...document.querySelectorAll('a')].filter(a => /Volver a todos los juegos/.test(a.textContent) && /\\/juegos\\/$/.test(new URL(a.href).pathname)).length,
        migas: !!document.querySelector('nav[aria-label*="igas"], .migas'),
        canonical: !!document.querySelector('link[rel=canonical]'),
        json_ld: !!document.querySelector('script[type="application/ld+json"]'),
        ls: localStorage.length, ss: sessionStorage.length, ck: document.cookie,
        idb: (await indexedDB.databases()).length, cachés: (await caches.keys()).length,
      }))()`));
      const con = await c.js(CONTRASTE);   // contraste del texto de la pantalla inicial (y del texto de la página)
      const e = errores();
      const bien = ok(i.h1 === 1, `${nombre} · ${s}: debe haber un solo <h1> y hay ${i.h1}`)
        & ok(!i.cargando && i.controles > 0, `${nombre} · ${s}: no arranca (${i.controles} controles${i.cargando ? ', sigue cargando' : ''})`)
        & ok(!i.desborde, `${nombre} · ${s}: desborda en horizontal`)
        & ok(i.apartados >= 4 && i.faq >= 1, `${nombre} · ${s}: texto de la página incompleto (${i.apartados} apartados, ${i.faq} preguntas)`)
        & ok(i.volver >= 1, `${nombre} · ${s}: falta el botón «Volver a todos los juegos» hacia /juegos/`)
        & ok(i.migas && i.canonical && i.json_ld, `${nombre} · ${s}: faltan migas, canonical o datos estructurados`)
        & ok(i.ls === 0 && i.ss === 0 && i.ck === '' && i.idb === 0 && i.cachés === 0, `${nombre} · ${s}: GUARDA DATOS en el dispositivo ${JSON.stringify(i)}`)
        & ok(con.fallos.length === 0, `${nombre} · ${s}: contraste insuficiente → ${con.fallos.join(' | ')}`)
        & ok(e.length === 0, `${nombre} · ${s}: errores de consola ${JSON.stringify(e)}`);
      if (bien) buenos++;
      if (nombre === 'móvil') await capturar(c, `humo-movil-${s}`, false);
    }
    console.log(`  ${nombre}: ${buenos}/${SLUGS.length} juegos sin ningún fallo`);
  }

  // ---------------------------------------------------------------- catálogo
  console.log('CATÁLOGO');
  await c.vista(1100, 900, 'light', false);
  await c.ir(`${base}/juegos/`, 800);
  const cat = JSON.parse(await c.js(`JSON.stringify({
    tarjetas: document.querySelectorAll('.tarjeta, [data-tarjeta]').length,
    buscador: !!document.querySelector('input[type=search], input[type=text]'),
    filtros: document.querySelectorAll('[data-filtro-categoria]').length,
    h1: document.querySelectorAll('h1').length })`));
  ok(cat.tarjetas >= SLUGS.length, `el catálogo muestra ${cat.tarjetas} tarjetas (esperadas ≥ ${SLUGS.length})`);
  ok(cat.buscador, 'el catálogo tiene buscador');
  ok(cat.filtros === 10, `el catálogo tiene «Todos» + 9 categorías como filtros (hay ${cat.filtros})`);
  // buscar «2048» deja solo ese juego visible
  const visibles = `[...document.querySelectorAll('.tarjeta, [data-tarjeta]')].filter(t => !t.hidden && t.offsetParent !== null && getComputedStyle(t).display !== 'none').length`;
  await c.js(`(() => { const i = document.querySelector('input[type=search], input[type=text]'); i.value = '2048'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await esperar(300);
  const tras = await c.js(visibles);
  ok(tras >= 1 && tras < 5, `buscar «2048» deja ${tras} tarjetas visibles`);
  await c.js(`(() => { const i = document.querySelector('input[type=search], input[type=text]'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await esperar(300);
  ok(await c.js(visibles) >= SLUGS.length, `al borrar la búsqueda vuelven los ${SLUGS.length} juegos`);
  // el filtro de categoría reduce la lista y «Todos» la restaura
  await c.js(`document.querySelector('[data-filtro-categoria="memoria"]').click()`);
  await esperar(300);
  const memoria = await c.js(visibles);
  ok(memoria >= 1 && memoria < SLUGS.length, `la categoría «Memoria» deja ${memoria} juegos`);
  ok(await c.js(`document.querySelector('[data-filtro-categoria="memoria"]').getAttribute('aria-pressed')`) === 'true', 'el chip activo se marca con aria-pressed');
  await c.js(`document.querySelector('[data-filtro-categoria=""]').click()`);
  await esperar(300);
  ok(await c.js(visibles) >= SLUGS.length, `el filtro «Todos» devuelve los ${SLUGS.length} juegos`);
  // cada tarjeta enlaza a un juego que existe
  const enlaces = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.tarjeta a, [data-tarjeta] a')].map(a => new URL(a.href).pathname))`));
  for (const s of SLUGS) ok(enlaces.includes(`/juegos/${s}/`), `el catálogo enlaza a /juegos/${s}/`);
  ok(errores().length === 0, 'catálogo sin errores de consola ' + JSON.stringify(errores()));
  await capturar(c, 'humo-catalogo');
  await c.vista(375, 800, 'light', true);
  await c.ir(`${base}/juegos/`, 800);
  ok(!(await c.js(`document.documentElement.scrollWidth > innerWidth + 1`)), 'el catálogo no desborda en móvil');
  await capturar(c, 'humo-catalogo-movil');
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : `HUMO: los ${SLUGS.length} juegos y el catálogo, bien en móvil, tablet y escritorio`);
process.exit(fallos.length ? 1 : 0);
