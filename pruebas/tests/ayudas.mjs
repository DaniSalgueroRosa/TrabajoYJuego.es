// Ayudas comunes de las pruebas de la sección Tests (Chrome real).
import { abrirChrome } from '../cdp.mjs';
export const base = 'http://127.0.0.1:' + process.env.PUERTO;
export const esperar = (ms) => new Promise(r => setTimeout(r, ms));
export async function iniciar(args = []) {
  const c = await abrirChrome(undefined, args);
  const fallos = [];
  const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
  const texto = (sel) => c.js(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
  const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
  const sinDesborde = () => c.js(`document.documentElement.scrollWidth <= window.innerWidth + 1`);
  /** Abre un test y comprueba lo básico: título, desborde, texto SEO y consola limpia. */
  const abrir = async (slug, espera = 600) => {
    await c.ir(base + '/tests/' + slug + '/', espera);
    ok((await c.js(`document.querySelectorAll('h1').length`)) === 1, slug + ': un solo h1');
    ok(await sinDesborde(), slug + ': sin desborde horizontal');
    ok((await c.js(`document.getElementById('tt-app')?.children.length || 0`)) > 0, slug + ': el test se ha montado');
  };
  const cerrar = async () => { ok(c.consola().length === 0, 'sin errores de consola' + (c.consola().length ? ': ' + JSON.stringify(c.consola()).slice(0, 300) : '')); await c.cerrar(); if (fallos.length) { console.log('\nFALLOS:', fallos.length); process.exitCode = 1; } else console.log('\nTodo bien'); };
  /** Lanza n eventos con el intervalo dado (ms) dentro de la página; `crear(i)` es el código JS que devuelve el evento y `sobre` el elemento. */
  const rafaga = (sobre, crear, n, cada) => c.js(`(async () => { const el = ${sobre}; for (let i = 0; i < ${n}; i++) { el.dispatchEvent(${crear}); await new Promise(r => setTimeout(r, ${cada})); } return true; })()`);
  return { c, ok, texto, clic, sinDesborde, abrir, cerrar, rafaga, esperar, fallos };
}
export const ptr = (extra = '') => `new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'mouse', button: 0, ${extra} })`;
