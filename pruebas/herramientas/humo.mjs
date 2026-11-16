// Prueba de humo de TODAS las herramientas: cada página carga sin errores en la consola, la herramienta arranca (desaparece «Cargando…» y hay interfaz),
// no se desborda en móvil y no usa almacenamiento del navegador. Con SOLO=slug1,slug2 se limita a esas.
import fs from 'node:fs';
import path from 'node:path';
import { abrirChrome } from '../cdp.mjs';
import { preparar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const solo = (process.env.SOLO || '').split(',').filter(Boolean);
const slugs = fs.readdirSync(path.join(RAIZ, 'herramientas'), { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('_') && fs.existsSync(path.join(RAIZ, 'herramientas', d.name, 'ficha.json')) && (!solo.length || solo.includes(d.name))).map((d) => d.name).sort();
const c = await abrirChrome(9335, ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']);
const { fallos, ok, hastaQue } = preparar(c);
let n = 0;
try {
  for (const movil of [false, true]) {
    await c.vista(movil ? 390 : 1100, movil ? 800 : 900, 'light', movil);
    for (const s of slugs) {
      n++;
      await c.ir(`${base}/herramientas/${s}/`, 150);
      const cargado = await hastaQue(() => c.js(`!document.querySelector('#herr-carga') && !!document.querySelector('#herr') && document.querySelector('#herr').children.length > 0`), 8000);
      const info = await c.js(`({ sobra: document.documentElement.scrollWidth - window.innerWidth, h1: !!document.querySelector('h1'), storage: localStorage.length + sessionStorage.length + document.cookie.length, titulo: document.title.length, error: !!document.querySelector('#herr > .herr-estado--error:not([hidden])') })`);
      const errores = c.consola();
      const problemas = [];
      if (!cargado) problemas.push('no arranca (sigue «Cargando…» o no hay interfaz)');
      if (info.error) problemas.push('muestra un error de inicio');
      if (info.sobra > 1) problemas.push('desborda ' + info.sobra + ' px' + (movil ? ' en móvil' : ''));
      if (!info.h1 || !info.titulo) problemas.push('falta h1 o título');
      if (info.storage) problemas.push('usa almacenamiento del navegador');
      if (errores.length) problemas.push('consola: ' + errores.slice(0, 2).join(' | '));
      ok(!problemas.length, `${movil ? 'móvil ' : 'escritorio '}${s}` + (problemas.length ? ' → ' + problemas.join('; ') : ''));
    }
  }
  console.log(`\n${n} cargas comprobadas (${slugs.length} herramientas × 2 tamaños)`);
} catch (e) { console.log('  ✗ Excepción: ' + (e && e.stack || e)); fallos.push('excepción'); }
finally { await c.cerrar(); }
console.log(fallos.length ? `\n${fallos.length} fallos` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
