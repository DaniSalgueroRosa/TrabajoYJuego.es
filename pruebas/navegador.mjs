// Pruebas en Chrome real contra un sitio ya servido (lo lanza «python3 sitio.py probar --navegador», con una copia con ejemplos).
// Variables: PUERTO (obligatoria). Código de salida: 0 todo bien, 1 hay fallos, 2 no hay Chrome.
import { abrirChrome, encontrarChrome } from './cdp.mjs';
import { CONTRASTE } from './contraste.mjs';

if (!encontrarChrome()) { console.log('No encuentro Chrome ni Chromium.'); process.exit(2); }
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const fallos = [];
const ok = (cond, texto) => { console.log((cond ? '  ✓ ' : '  ✗ ') + texto); if (!cond) fallos.push(texto); };

const PAGINAS = ['/', '/herramientas/', '/recursos/', '/juegos/', '/tests/',
  '/herramientas/contador-de-palabras/', '/recursos/elegir-una-contrasena/', '/juegos/serpiente/',
  '/tests/que-planificador-eres/', '/tests/cuanto-sabes-de-colores/', '/tests/sin-tema/'];



const c = await abrirChrome(9444);
try {
  // ---------- 1. Cada página, en escritorio y en móvil
  for (const [ancho, alto, movil, nombre] of [[1366, 800, false, 'escritorio'], [390, 800, true, 'móvil']]) {
    console.log(`\n${nombre} (${ancho}px)`);
    await c.vista(ancho, alto, 'light', movil);
    for (const ruta of PAGINAS) {
      await c.ir(base + ruta, 900);
      const errores = c.consola();
      ok(errores.length === 0, `${ruta}: sin errores en la consola` + (errores.length ? ' → ' + errores.join(' | ') : ''));
      const desborde = await c.js('document.documentElement.scrollWidth - document.documentElement.clientWidth');
      ok(desborde <= 0, `${ruta}: sin desplazamiento horizontal` + (desborde > 0 ? ` (sobran ${desborde}px)` : ''));
      const con = await c.js(CONTRASTE);
      ok(con.fallos.length === 0, `${ruta}: contraste del texto (${con.comprobados} bloques` + (con.indeterminados ? `, ${con.indeterminados} sobre imagen sin evaluar` : '') + ')'
        + (con.fallos.length ? '\n      ' + con.fallos.join('\n      ') : ''));
      const sinNombre = await c.js(`[...document.querySelectorAll('a[href], button')].filter(e => !(e.innerText || e.getAttribute('aria-label') || e.querySelector('img[alt]:not([alt=""])')?.alt || '').trim()).length`);
      ok(sinNombre === 0, `${ruta}: todos los enlaces y botones tienen nombre accesible`);
    }
  }

  // ---------- 2. La página 404
  console.log('\n404');
  const r404 = await fetch(base + '/esta-pagina-no-existe/');
  ok(r404.status === 404, 'una dirección inexistente devuelve el código 404');
  ok((await r404.text()).includes('<h1'), 'y muestra la página 404 del sitio');

  // ---------- 3. Teclado: cada elemento enfocable muestra el foco
  console.log('\nTeclado');
  await c.vista(1366, 800, 'light', false);
  for (const ruta of ['/', '/juegos/', '/herramientas/contador-de-palabras/']) {
    await c.ir(base + ruta, 600);
    const sinFoco = [];
    let pasos = 0, anterior = '';
    for (let i = 0; i < 60; i++) {
      for (const tipo of ['keyDown', 'keyUp']) await c.enviar('Input.dispatchKeyEvent', { type: tipo, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      await new Promise(r => setTimeout(r, 60));
      const info = await c.js(`(() => { const e = document.activeElement; if (!e || e === document.body) return null; const s = getComputedStyle(e);
        return { id: e.tagName.toLowerCase() + '.' + (e.className || '').toString().split(' ')[0] + (e.getAttribute('href') ? '[' + e.getAttribute('href') + ']' : ''),
                 contorno: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 || (() => { const p = getComputedStyle(e, '::after'); return p.outlineStyle !== 'none' && parseFloat(p.outlineWidth) >= 2; })(), sombra: s.boxShadow !== 'none' }; })()`);
      if (!info) break;
      if (info.id === anterior) break; anterior = info.id; pasos++;
      if (!info.contorno && !info.sombra) sinFoco.push(info.id);
    }
    ok(pasos > 3, `${ruta}: se puede recorrer con Tab (${pasos} elementos)`);
    ok(sinFoco.length === 0, `${ruta}: todos muestran el foco` + (sinFoco.length ? ' → falta en: ' + sinFoco.join(', ') : ''));
  }

  // ---------- 4. La portada: las mitades se reparten la pantalla con ratón y con teclado
  console.log('\nPortada: efectos');
  await c.vista(1366, 800, 'light', false);
  await c.ir(base + '/', 1200);
  const anchos = () => c.js(`[...document.querySelectorAll('.hero-mitad')].map(e => e.getBoundingClientRect().width)`);
  const [a0, b0] = await anchos();
  ok(Math.abs(a0 - b0) < 4, `en reposo las dos mitades miden lo mismo (${a0.toFixed(0)} y ${b0.toFixed(0)} px)`);
  const mover = (x, y) => c.enviar('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await mover(1100, 300); await new Promise(r => setTimeout(r, 900));
  const [a1, b1] = await anchos();
  ok(b1 > a1 * 1.15, `con el ratón sobre «Juego», su mitad crece (${a1.toFixed(0)} y ${b1.toFixed(0)} px)`);
  await mover(250, 300); await new Promise(r => setTimeout(r, 900));
  const [a2, b2] = await anchos();
  ok(a2 > b2 * 1.15, `con el ratón sobre «Trabajo», crece la suya (${a2.toFixed(0)} y ${b2.toFixed(0)} px)`);
  await mover(1366 - 4, 790); await mover(700, 5); await new Promise(r => setTimeout(r, 200));
  // teclado: enfocar el primer enlace de «Juego» y ver que su mitad crece
  await c.js(`document.querySelector('.hero-mitad[data-mundo="juego"] .hero-enlace').focus()`);
  await mover(5, 795); await new Promise(r => setTimeout(r, 900));
  const [a3, b3] = await anchos();
  ok(b3 > a3 * 1.15, `con el foco del teclado dentro de «Juego», su mitad crece (${a3.toFixed(0)} y ${b3.toFixed(0)} px)`);
  await c.js('document.activeElement.blur()');
  // el marcador ▶ de los enlaces de «Juego» aparece al pasar el ratón
  const caja = await c.js(`(() => { const r = document.querySelector('.hero-mitad[data-mundo="juego"] .hero-enlace').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  const antes = await c.js(`getComputedStyle(document.querySelector('.hero-mitad[data-mundo="juego"] .hero-enlace-titulo'), '::after').visibility`);
  await mover(caja.x, caja.y); await new Promise(r => setTimeout(r, 400));
  const despues = await c.js(`getComputedStyle(document.querySelector('.hero-mitad[data-mundo="juego"] .hero-enlace-titulo'), '::after').visibility`);
  ok(antes === 'hidden' && despues === 'visible', `el marcador ▶ aparece al pasar el ratón por un enlace de «Juego» (${antes} → ${despues})`);

  // ---------- 5. Móvil: las mitades van una encima de otra y no se redimensionan
  await c.vista(390, 800, 'light', true);
  await c.ir(base + '/', 900);
  const apiladas = await c.js(`(() => { const [a, b] = [...document.querySelectorAll('.hero-mitad')].map(e => e.getBoundingClientRect()); return b.top >= a.bottom - 1 && Math.abs(a.width - b.width) < 2; })()`);
  ok(apiladas, 'en móvil las dos mitades se apilan a todo el ancho');

  // ---------- 6. Movimiento reducido
  console.log('\nMovimiento');
  const infinitas = `document.getAnimations().filter(a => a.playState === 'running' && a.effect.getComputedTiming().iterations === Infinity).length`;
  await c.vista(1366, 800, 'light', false);
  await c.ir(base + '/', 1200);
  const normal = await c.js(infinitas);
  ok(normal > 0, `con movimiento normal hay animaciones continuas (${normal}: rejilla y cursor)`);
  await c.enviar('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const ruta of ['/', '/juegos/', '/herramientas/', '/juegos/serpiente/']) {
    await c.ir(base + ruta, 900);
    const n = await c.js(infinitas);
    ok(n === 0, `${ruta}: con «reducir movimiento» no queda ninguna animación continua (${n})`);
  }
  await c.enviar('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });

  // ---------- 7. El código propio de cada elemento funciona (app.js enlazado)
  console.log('\nElementos arrastrados');
  await c.vista(1366, 800, 'light', false);
  await c.ir(base + '/juegos/serpiente/', 800);
  await c.js(`document.getElementById('empezar').click()`);
  ok(await c.js(`document.body.getAttribute('data-jugando')`) === 'si', 'Serpiente: su app.js se ejecuta (botón «Empezar»)');
  await c.ir(base + '/herramientas/contador-de-palabras/', 800);
  await c.js(`document.getElementById('texto').value = 'uno dos tres cuatro'; document.getElementById('contar').click()`);
  ok((await c.js(`document.getElementById('resultado').textContent`)).includes('4'), 'Contador de palabras: cuenta 4 palabras');
} finally {
  await c.cerrar();
}

console.log(fallos.length ? `\n${fallos.length} comprobaciones fallan.` : '\nTodas las comprobaciones del navegador han pasado.');
process.exit(fallos.length ? 1 : 0);
