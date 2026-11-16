// Sorteo de amigo invisible: con ocho personas y exclusiones, todos los repartos cumplen las reglas y el botón sortea de nuevo.
import { abrirChrome } from '../cdp.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
try {
  await c.vista(1000, 900, 'light', false);
  await c.ir(base + '/herramientas/sorteo-de-amigo-invisible/', 800);
  const nombres = ['Ana', 'Luis', 'Marta', 'Pablo', 'Elena', 'Jorge', 'Lucía', 'Iván'];
  await c.js(`(() => { const t = document.getElementById('t-entrada'); t.value = ${JSON.stringify(nombres.join('\n'))}; t.dispatchEvent(new Event('input', { bubbles: true })); const e = document.getElementById('c-excluir'); e.value = 'Ana-Luis, Marta-Pablo, Elena-Jorge'; e.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  const prohibidas = [['Ana', 'Luis'], ['Marta', 'Pablo'], ['Elena', 'Jorge']];
  const distintos = new Set(); let todosBien = true;
  for (let i = 0; i < 25; i++) {
    await c.js(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Sortear de nuevo').click()`);
    await esperar(30);
    const s = await c.js(`document.getElementById('t-salida').value`);
    const pares = s.split('\n').map(l => l.split(' → '));
    distintos.add(s);
    const da = pares.map(p => p[0]).sort().join(), recibe = pares.map(p => p[1]).sort().join();
    const bien = pares.length === 8 && da === [...nombres].sort().join() && recibe === da && pares.every(([a, b]) => a !== b && !prohibidas.some(([x, y]) => (x === a && y === b) || (x === b && y === a)));
    if (!bien) { todosBien = false; console.log('   reparto inválido:', s.replace(/\n/g, ' | ')); }
  }
  ok(todosBien, '25 sorteos: cada uno regala y recibe una vez, nadie a sí mismo y sin parejas excluidas');
  ok(distintos.size > 5, `el botón sortea de nuevo (${distintos.size} repartos distintos en 25)`);
  const fijo = await c.js(`document.getElementById('t-salida').value`);
  await c.js(`(() => { const e = document.getElementById('c-excluir'); e.value = 'Ana-Luis, Marta-Pablo, Elena-Jorge'; e.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await esperar(50);
  ok((await c.js(`document.getElementById('t-salida').value`)) === fijo, 'el reparto se mantiene mientras no cambian los datos');
  ok(c.consola().length === 0, 'sin errores de consola');
} finally { await c.cerrar(); }
if (fallos.length) { console.log('\nFALLOS:', fallos); process.exit(1); }
console.log('\nTODO BIEN');
