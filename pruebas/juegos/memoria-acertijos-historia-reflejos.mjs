// Memoria visual, Acertijos, Ordena la historia y Reflejos.
// Se lanza con «python3 sitio.py probar --navegador» (PUERTO la pone el lanzador). Capturas opcionales: CAPTURAS=carpeta.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = []; const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const click = (txt) => c.js(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(txt)}&&!b.disabled); if(!b) return false; b.click(); return true})()`);
const esp = (ms) => new Promise(r => setTimeout(r, ms));
try {
  await c.vista(1100, 900, 'light', false);
  // ===== MEMORIA VISUAL
  console.log('MEMORIA VISUAL');
  await c.ir(base + '/juegos/memoria-visual/', 800);
  ok(await click('Empezar'), 'empezar');
  await esp(1000);
  let st = JSON.parse(await c.js(`JSON.stringify({luz:[...document.querySelectorAll('.mv-celda')].map((b,i)=>b.classList.contains('mv-celda--luz')?i:-1).filter(i=>i>=0), n:document.querySelectorAll('.mv-celda').length})`));
  ok(st.n === 9 && st.luz.length === 3, 'nivel 1: 3x3 con 3 casillas iluminadas ' + JSON.stringify(st));
  await esp(2300);
  ok(await c.js(`document.querySelectorAll('.mv-celda--luz').length`) === 0, 'las luces se apagan');
  // acertar las 3 (las leemos antes de que se apaguen en el siguiente nivel) → repetimos leyendo del DOM en el momento de luz
  async function jugarNivel(acertar) {
    // espera a que haya luz
    for (let i = 0; i < 40; i++) { if (await c.js(`document.querySelectorAll('.mv-celda--luz').length`) > 0) break; await esp(100); }
    const luz = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.mv-celda')].map((b,i)=>b.classList.contains('mv-celda--luz')?i:-1).filter(i=>i>=0))`));
    for (let i = 0; i < 60; i++) { if (await c.js(`document.querySelectorAll('.mv-celda--luz').length`) === 0) break; await esp(100); }
    const n = await c.js(`document.querySelectorAll('.mv-celda').length`);
    if (acertar) { for (const i of luz) await c.js(`document.querySelectorAll('.mv-celda')[${i}].click()`); }
    else { const fuera = [...Array(n).keys()].find(i => !luz.includes(i)); await c.js(`document.querySelectorAll('.mv-celda')[${fuera}].click()`); }
    return luz.length;
  }
  // el primer nivel ya está jugable (las luces se apagaron): marcamos con lo leído en st.luz
  for (const i of st.luz) await c.js(`document.querySelectorAll('.mv-celda')[${i}].click()`);
  await esp(1500);
  ok(/Nivel[^0-9]*2/.test(await c.js(`document.querySelector('#mv .hud').textContent`)), 'sube al nivel 2');
  ok(/30/.test(await c.js(`document.querySelector('#mv .hud').textContent`)), 'puntos = 30 tras nivel 1');
  // acertar niveles 2..5 y ver crecer la cuadrícula
  const tam = {};
  for (let k = 0; k < 4; k++) { const l = await jugarNivel(true); tam[l] = await c.js(`document.querySelectorAll('.mv-celda').length`); await esp(1300); }
  ok(tam[6] === 16, 'con 6 casillas la cuadrícula es 4x4 ' + JSON.stringify(tam));
  // fallar 3 veces
  for (let k = 0; k < 3; k++) { await jugarNivel(false); await esp(k < 2 ? 2100 : 1600); }
  ok(/Fin de la partida/.test(await c.js(`document.querySelector('#mv .final')?.textContent||''`)), 'fin de partida tras 3 vidas perdidas');
  ok(/Partidas:\s*1/.test(await c.js(`document.querySelector('#mv .sesion').textContent`)), 'sesión registra la partida');
  ok(await click('Jugar otra vez'), 'repetir'); await esp(300);
  ok(await c.js(`document.querySelectorAll('.mv-celda').length`) === 9, 'nueva partida desde el nivel 1');
  await c.vista(375, 800, 'light', true); await c.ir(base + '/juegos/memoria-visual/', 600); await click('Empezar'); await esp(600);
  ok(!(await c.js(`document.documentElement.scrollWidth > innerWidth + 1`)), 'móvil sin desborde'); await capturar(c, 'mv-movil');
  await c.vista(1100, 900, 'light', false);

  // ===== ACERTIJOS
  console.log('ACERTIJOS');
  await c.ir(base + '/juegos/acertijos/', 800);
  ok(await click('Acertijo del día'), 'acertijo del día');
  const p1 = await c.js(`document.querySelector('.ac-enunciado').textContent`);
  const r1 = JSON.parse(await c.js(`(async()=>{ const j = await (await fetch('/juegos/acertijos/acertijos.json')).json(); return JSON.stringify(j.acertijos.find(a=>a.p===document.querySelector('.ac-enunciado').textContent)); })()`));
  ok(!!r1, 'enunciado encontrado en el JSON: ' + p1.slice(0, 50));
  // el mismo del día al recargar
  await c.ir(base + '/juegos/acertijos/', 500); await click('Acertijo del día');
  ok((await c.js(`document.querySelector('.ac-enunciado').textContent`)) === p1, 'el acertijo del día es el mismo al recargar');
  // fallo, pista, acierto con artículo y mayúsculas
  const escribir = async (t) => { await c.js(`(()=>{const i=document.querySelector('.ac-form input'); i.value=${JSON.stringify(t)}; i.form.requestSubmit()})()`); };
  await escribir('zzzzzz'); ok(/Te quedan 2/.test(await c.js(`document.querySelector('#ac .mensaje').textContent`)), 'un fallo deja 2 intentos');
  await click('Pista (−25)'); ok(/Pista:/.test(await c.js(`document.querySelector('.ac-pista').textContent`)), 'pista visible');
  ok(/55/.test(await c.js(`document.querySelector('#ac .hud').textContent`)), 'valor = 55 con 1 fallo y pista');
  await escribir('  ' + r1.r[0].toUpperCase() + '  ');
  ok(/Correcto/.test(await c.js(`document.querySelector('#ac .final')?.textContent||''`)), 'acierto con mayúsculas');
  ok(/55/.test(await c.js(`document.querySelector('#ac .final-puntos')?.textContent||''`)), 'puntos finales = 55');
  ok(/Respuesta/.test(await c.js(`document.querySelector('.ac-solucion')?.textContent||''`)), 'se muestra la explicación');
  // sin fin: 3 fallos revelan
  await click('Probar en modo sin fin'); await esp(200);
  for (let i = 0; i < 3; i++) await escribir('qqqqq' + i);
  ok(/Sin intentos/.test(await c.js(`document.querySelector('#ac .final')?.textContent||''`)), '3 fallos → sin intentos y solución');
  // todas las respuestas del JSON se aceptan (con y sin artículo)
  const todo = JSON.parse(await c.js(`(async()=>{const j=await (await fetch('/juegos/acertijos/acertijos.json')).json(); return JSON.stringify(j.acertijos.map(a=>({p:a.p.length>5, n:a.r.length, r:a.r[0]})))})()`));
  ok(todo.length >= 30 && todo.every(a => a.p && a.n >= 1), todo.length + ' acertijos, todos con respuesta');
  // móvil
  await c.vista(375, 800, 'light', true); await c.ir(base + '/juegos/acertijos/', 600); await click('Sin fin'); await esp(200);
  ok(!(await c.js(`document.documentElement.scrollWidth > innerWidth + 1`)), 'móvil sin desborde'); await capturar(c, 'ac-movil');
  await c.vista(1100, 900, 'light', false);

  // ===== ORDENA LA HISTORIA
  console.log('ORDENA LA HISTORIA');
  await c.ir(base + '/juegos/ordena-la-historia/', 800);
  const info = JSON.parse(await c.js(`JSON.stringify({n:document.querySelectorAll('.oh-ficha').length, tema:document.querySelector('.oh-tema strong').textContent})`));
  ok(info.n === 5, '5 fichas, tema ' + info.tema);
  // ordenarlas bien: leemos años del JSON
  async function ordenar() {
    const datos = JSON.parse(await c.js(`(async()=>JSON.stringify(await (await fetch('/juegos/ordena-la-historia/cronologias.json')).json()))()`));
    const tema = await c.js(`document.querySelector('.oh-tema strong').textContent`);
    const conj = datos.conjuntos.find(x => x.t === tema);
    const anio = (n) => conj.e.find(x => x.n === n).a;
    // burbuja con botones
    for (let pasada = 0; pasada < 6; pasada++) for (let i = 0; i < 4; i++) {
      const [a, b] = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.oh-texto')].slice(${i},${i + 2}).map(x=>x.firstChild.textContent))`));
      if (anio(a) > anio(b)) await c.js(`document.querySelectorAll('.oh-ficha')[${i}].querySelector('button[aria-label^="Bajar"]').click()`);
    }
  }
  await ordenar(); await click('Comprobar');
  ok(/Perfecto/.test(await c.js(`document.querySelector('#oh .mensaje')?.textContent||''`)) && /70/.test(await c.js(`document.querySelector('#oh .hud').textContent`)), 'orden perfecto = 70 puntos');
  ok(await c.js(`document.querySelectorAll('.oh-ficha--ok').length`) === 5, '5 fichas verdes y con año visible: ' + await c.js(`document.querySelector('.oh-anio')?.textContent`));
  // ronda 2 a propósito mal (sin tocar): puede acertar por azar alguna, solo comprobamos que puntúa ≤ 70 y avanza
  await click('Siguiente ronda'); await click('Comprobar');
  const pts2 = parseInt((await c.js(`document.querySelector('#oh .hud').textContent`)).match(/Puntos(\d+)/)[1]);
  ok(pts2 >= 70 && pts2 < 140, 'ronda 2 sin ordenar suma menos de 70: total ' + pts2);
  for (let r = 3; r <= 6; r++) { await click('Siguiente ronda'); await ordenar(); await click('Comprobar'); }
  await click('Ver resultado');
  const fin = await c.js(`document.querySelector('#oh .final')?.textContent||''`);
  ok(/Fin de la partida/.test(fin) && /de 420/.test(fin), 'final: ' + fin.slice(0, 90));
  // móvil
  await c.vista(375, 800, 'light', true); await c.ir(base + '/juegos/ordena-la-historia/', 600);
  ok(!(await c.js(`document.documentElement.scrollWidth > innerWidth + 1`)), 'móvil sin desborde'); await capturar(c, 'oh-movil');
  await c.vista(1100, 900, 'light', false);

  // ===== REFLEJOS
  console.log('REFLEJOS');
  await c.ir(base + '/juegos/reflejos/', 800);
  const zona = `document.querySelector('.rf-zona')`;
  await c.js(`${zona}.click()`); // empezar
  ok(/Espera/.test(await c.js(`${zona}.textContent`)), 'estado «Espera…»');
  await c.js(`${zona}.click()`); // salida en falso
  ok(/pronto/i.test(await c.js(`${zona}.textContent`)), 'salida en falso detectada');
  await c.js(`${zona}.click()`); // reintentar
  for (let i = 1; i <= 5; i++) {
    for (let k = 0; k < 80; k++) { if (/Ya/.test(await c.js(`${zona}.textContent`))) break; await esp(100); }
    ok(/Ya/.test(await c.js(`${zona}.textContent`)), 'intento ' + i + ': aparece «¡Ya!»');
    await esp(150);
    await c.js(`${zona}.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true}))`);
    if (i < 5) { await c.js(`${zona}.click()`); }
  }
  const fr = await c.js(`document.querySelector('#rf .final')?.textContent||''`);
  ok(/Tiempo medio/.test(fr) && /Salidas en falso: 1/.test(fr), 'final con media y 1 salida en falso: ' + fr.slice(0, 120));
  const tiempos = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.rf-tiempos li')].map(l=>parseInt(l.textContent.replace(/\\D*(\\d+).*/,'$1'))))`));
  ok(tiempos.length === 5 && tiempos.every(t => t >= 120 && t < 400), 'tiempos medidos plausibles (la espera fue de ~150 ms): ' + tiempos);
  ok(/Partidas:\s*1/.test(await c.js(`document.querySelector('#rf .sesion').textContent`)), 'sesión registra');
  await c.vista(375, 800, 'light', true); await c.ir(base + '/juegos/reflejos/', 600);
  ok(!(await c.js(`document.documentElement.scrollWidth > innerWidth + 1`)), 'móvil sin desborde'); await capturar(c, 'rf-movil');
  const cons = c.consola().filter(x => !/favicon/.test(x)); ok(cons.length === 0, 'sin errores de consola ' + JSON.stringify(cons));
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'TODO BIEN');
process.exit(fallos.length ? 1 : 0);
