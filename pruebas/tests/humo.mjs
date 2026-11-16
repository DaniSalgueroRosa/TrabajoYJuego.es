// Prueba de humo de TODOS los tests: cada página carga sin errores en la consola, el test se monta, no se desborda en móvil,
// no usa almacenamiento del navegador y el texto tiene contraste suficiente. Con SOLO=slug1,slug2 se limita a esos.
import fs from 'node:fs';
import path from 'node:path';
import { abrirChrome } from '../cdp.mjs';
import { CONTRASTE } from '../contraste.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const solo = (process.env.SOLO || '').split(',').filter(Boolean);
const slugs = fs.readdirSync(path.join(RAIZ, 'tests'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && fs.existsSync(path.join(RAIZ, 'tests', d.name, 'ficha.json')) && (!solo.length || solo.includes(d.name)))
  .filter((d) => (JSON.parse(fs.readFileSync(path.join(RAIZ, 'tests', d.name, 'ficha.json'), 'utf8')).estado || 'publicado') === 'publicado') // los «próximamente» no tienen página
  .map((d) => d.name);
const c = await abrirChrome(9336);
const fallos = [];
let n = 0;
try {
  for (const movil of [false, true]) {
    await c.vista(movil ? 390 : 1100, movil ? 800 : 900, 'light', movil);
    for (const s of slugs) {
      n++;
      await c.ir(`${base}/tests/${s}/`, 350);
      const info = await c.js(`({ sobra: document.documentElement.scrollWidth - window.innerWidth, h1: document.querySelectorAll('h1').length,
        montado: (document.getElementById('tt-app')?.children.length || 0) > 0 && !/Cargando el test/.test(document.getElementById('tt-app')?.innerText || ''),
        storage: localStorage.length + sessionStorage.length + document.cookie.length, titulo: document.title.length })`);
      const cont = await c.js(CONTRASTE);
      const errores = c.consola();
      const problemas = [];
      if (!info.montado) problemas.push('no arranca (sigue «Cargando…» o no hay interfaz)');
      if (info.sobra > 1) problemas.push('desborda ' + info.sobra + ' px');
      if (info.h1 !== 1) problemas.push('debe haber un único h1');
      if (info.storage) problemas.push('usa almacenamiento del navegador');
      if (info.titulo > 60) problemas.push('título de ' + info.titulo + ' caracteres');
      if (cont.fallos.length) problemas.push('contraste: ' + cont.fallos.slice(0, 2).join(' | '));
      if (errores.length) problemas.push('consola: ' + errores.slice(0, 2).join(' | '));
      const bien = !problemas.length;
      console.log((bien ? '  ✓ ' : '  ✗ ') + (movil ? 'móvil ' : 'escritorio ') + s + (bien ? '' : ' → ' + problemas.join('; ')));
      if (!bien) fallos.push(s);
    }
  }
  console.log(`\n${n} cargas comprobadas (${slugs.length} tests × 2 tamaños)`);
} catch (e) { console.log('  ✗ Excepción: ' + (e && e.stack || e)); fallos.push('excepción'); }
finally { await c.cerrar(); }
console.log(fallos.length ? `\n${fallos.length} fallos` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
