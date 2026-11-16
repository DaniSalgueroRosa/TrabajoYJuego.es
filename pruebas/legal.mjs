// Páginas legales en Chrome real: abren sin errores, se leen bien en móvil, tablet y escritorio (sin desbordes y con contraste suficiente),
// se llega a ellas desde el pie de cualquier página y el enlace «Configurar cookies» lleva a su apartado.
// Se lanza con «python3 sitio.py probar --navegador» (PUERTO la pone el lanzador). Capturas opcionales: CAPTURAS=carpeta.
import { abrirChrome } from './cdp.mjs';
import { CONTRASTE } from './contraste.mjs';
import { capturar } from './juegos/ayudas.mjs';

const base = 'http://127.0.0.1:' + process.env.PUERTO;
const PAGINAS = { 'aviso-legal': 'Aviso legal', 'politica-de-privacidad': 'Política de privacidad', 'politica-de-cookies': 'Política de cookies',
  'condiciones-de-uso': 'Condiciones de uso', 'publicidad-y-transparencia': 'Publicidad y transparencia', 'contacto': 'Contacto' };
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { if (!cond) { console.log('  ✗ ' + t); fallos.push(t); } return cond; };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));

try {
  for (const [nombre, ancho, alto, movil] of [['móvil', 375, 800, true], ['tablet', 768, 1024, true], ['escritorio', 1280, 900, false]]) {
    await c.vista(ancho, alto, 'light', movil);
    let buenas = 0;
    for (const ruta of ['legal/', ...Object.keys(PAGINAS).map(s => `legal/${s}/`)]) {
      await c.ir(`${base}/${ruta}`, 500);
      const i = JSON.parse(await c.js(`JSON.stringify({ h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim()),
        desborde: document.documentElement.scrollWidth > innerWidth + 1,
        sinNombre: [...document.querySelectorAll('a[href], button')].filter(e => !(e.innerText || e.getAttribute('aria-label') || e.querySelector('img[alt]:not([alt=""])')?.alt || '').trim()).length,
        ls: localStorage.length + sessionStorage.length, ck: document.cookie,
        noindex: !!document.querySelector('meta[name=robots][content*=noindex]') })`));
      const con = await c.js(CONTRASTE);
      const e = c.consola().filter(x => !/favicon/.test(x));
      const bien = ok(i.h1.length === 1, `${nombre} · ${ruta}: debe haber un solo <h1> (hay ${i.h1.length})`)
        & ok(!i.desborde, `${nombre} · ${ruta}: desborda en horizontal`)
        & ok(i.sinNombre === 0, `${nombre} · ${ruta}: enlaces o botones sin nombre accesible`)
        & ok(con.fallos.length === 0, `${nombre} · ${ruta}: contraste insuficiente → ${con.fallos.join(' | ')}`)
        & ok(i.ls === 0 && i.ck === '', `${nombre} · ${ruta}: guarda datos en el dispositivo`)
        & ok(e.length === 0, `${nombre} · ${ruta}: errores de consola ${JSON.stringify(e)}`);
      if (bien) buenas++;
      if (nombre === 'móvil') await capturar(c, 'legal-movil-' + ruta.replace(/\W+/g, '-'));
    }
    console.log(`  ${nombre}: ${buenas}/7 páginas bien`);
  }

  // ---- Desde el pie de una página cualquiera se llega a cada página legal (clic real) y a la configuración de cookies
  await c.vista(1280, 900, 'light', false);
  for (const [slug, titulo] of Object.entries(PAGINAS)) {
    await c.ir(`${base}/juegos/2048/`, 400);
    const hecho = await c.js(`(() => { const a = [...document.querySelectorAll('footer a')].find(a => new URL(a.href).pathname === '/legal/${slug}/'); if (!a) return false; a.click(); return true; })()`);
    if (!ok(hecho, `el pie no enlaza a /legal/${slug}/`)) continue;
    await esperar(500);
    ok((await c.js('location.pathname')) === `/legal/${slug}/`, `el pie lleva a /legal/${slug}/`);
    ok((await c.js(`document.querySelector('h1').textContent.trim()`)) === titulo, `/legal/${slug}/ tiene como título «${titulo}»`);
  }
  await c.ir(`${base}/juegos/2048/`, 400);
  ok(await c.js(`(() => { const a = [...document.querySelectorAll('footer a')].find(a => /Configurar cookies/.test(a.textContent)); if (!a) return false; a.click(); return true; })()`), 'el pie tiene «Configurar cookies»');
  await esperar(500);
  ok((await c.js('location.pathname + location.hash')) === '/legal/politica-de-cookies/#configurar', '«Configurar cookies» lleva a su apartado');
  let visible = false;   // el desplazamiento al ancla puede ser suave: se espera hasta 4 s a que llegue
  for (let n = 0; n < 40 && !visible; n++) {
    visible = await c.js(`(() => { const r = document.getElementById('configurar').getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; })()`);
    if (!visible) await esperar(100);
  }
  if (!visible) console.log(await c.js(`JSON.stringify({u: location.href, top: document.getElementById('configurar')?.getBoundingClientRect().top, y: scrollY, h: innerHeight})`));
  ok(visible, 'el apartado de configuración queda a la vista');
  // sin publicidad activa no hay nada que configurar y la página lo dice (no hay botón muerto)
  ok(await c.js(`!document.querySelector('[data-consentimiento]')`), 'sin publicidad activa no hay botón de consentimiento');
  ok(/no hay nada que aceptar/.test(await c.js(`document.getElementById('configurar').parentElement.textContent`)), 'la página explica que no hay nada que configurar');
  // sin datos del titular se ve la marca, y es visible (no texto invisible)
  await c.ir(`${base}/legal/aviso-legal/`, 400);
  const marcas = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('mark.pendiente')].map(m => ({ t: m.textContent, w: m.getBoundingClientRect().width })))`));
  ok(marcas.length === 0 || marcas.every(m => m.w > 20 && /COMPLETAR POR EL TITULAR/.test(m.t)), 'las marcas pendientes, si hay, son visibles');
  console.log(`  ${marcas.length ? 'Marcas «[COMPLETAR POR EL TITULAR]» visibles en el aviso legal: ' + marcas.length + ' (esperado mientras falten datos)' : 'Aviso legal con todos los datos del titular'}`);
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'LEGAL: las seis páginas, bien en móvil, tablet y escritorio');
process.exit(fallos.length ? 1 : 0);
