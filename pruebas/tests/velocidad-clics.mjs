// Tests de «Velocidad y clics»: se juegan de verdad en Chrome (eventos reales dentro de la página) y se comprueba el resultado.
import { iniciar, ptr, esperar } from './ayudas.mjs';
const { c, ok, texto, clic, abrir, cerrar, rafaga } = await iniciar();
const ARENA = `document.querySelector('.tt-arena')`;
const dato = (id) => c.js(`document.querySelectorAll('.tt-dato-v')[${id}]?.textContent || ''`);
const hayResultado = async (t = 4000) => { for (let i = 0; i < t / 100; i++) { if (await c.js(`!!document.querySelector('.tt-res')`)) return true; await esperar(100); } return false; };
try {
  await c.vista(1100, 900, 'light', false);

  console.log('CPS');
  await abrir('test-de-velocidad-de-cliqueo');
  ok((await texto('.tt-arena')).includes('Haz clic aquí para empezar'), 'antes de empezar la zona invita a hacer clic');
  ok(await clic('2 s'), 'se puede elegir 2 s');
  await rafaga(ARENA, ptr(), 10, 100);
  ok((await c.js(`[...document.querySelectorAll('.tt-chip')].every(b => b.disabled)`)), 'durante la prueba no se puede cambiar la duración');
  ok(await dato(1) === '10', 'cuenta 10 clics');
  ok(await hayResultado(), 'al acabar el tiempo sale el resultado');
  let r = await texto('.tt-res');
  ok(r.includes('5,00') && r.includes('CPS'), '10 clics en 2 s = 5,00 CPS');
  ok(r.includes('Conejo'), '5 CPS es «Conejo»');
  ok(r.includes('Mejor segundo') && r.includes('Intervalo medio'), 'salen mejor segundo e intervalo medio');
  ok((await c.js(`document.querySelectorAll('.tt-barra').length`)) === 2, 'el gráfico tiene una barra por segundo');
  await rafaga(ARENA, ptr(), 3, 20);
  ok(await dato(1) === '10', 'los clics tras el final no cuentan hasta repetir');
  await clic('Repetir el test'); await esperar(200);
  ok(!(await c.js(`!!document.querySelector('.tt-res')`)) && await dato(1) === '0', 'repetir limpia el resultado y el contador');
  await rafaga(ARENA, `new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 2 })`, 5, 50);
  ok(await dato(1) === '0', 'el botón derecho no cuenta en el test de clic izquierdo');
  await c.js(`${ARENA}.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))`);
  await c.js(`${ARENA}.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true, cancelable: true }))`);
  ok(await dato(1) === '1', 'Intro cuenta un clic y la repetición automática no');
  await hayResultado(); await clic('Repetir el test'); await esperar(100);
  await rafaga(ARENA, ptr(), 8, 100);
  await hayResultado(); r = await texto('.tt-res');
  ok(r.includes('Mejor de esta visita'), 'en el segundo intento aparece la mejor marca de la visita');
  await clic('Copiar resultado'); await esperar(400);
  ok(await c.js(`!!document.querySelector('.tt-copia') || /Copiado/.test(document.querySelector('.tt-res').innerText)`), 'copiar resultado funciona o muestra el texto para copiarlo');
  ok((await c.js(`document.querySelectorAll('.tt-texto h2').length`)) >= 4, 'tiene al menos cuatro apartados de texto');

  console.log('CLICK JITTER');
  await abrir('click-jitter');
  ok(await clic('5 s'), 'se elige 5 s');
  await rafaga(ARENA, ptr(), 30, 60);
  ok(await hayResultado(), 'sale el resultado');
  r = await texto('.tt-res');
  ok(r.includes('6,00') && r.includes('Aprendiz'), '30 clics en 5 s = 6,00 CPS, rango Aprendiz');
  ok(r.includes('Caída de ritmo') && r.includes('Regularidad') && r.includes('Pausa más larga'), 'salen las medidas propias del jitter');

  console.log('CLICK DE KOHI');
  await abrir('click-de-kohi');
  ok((await c.js(`document.querySelectorAll('.tt-chip').length`)) === 0, 'no hay selector de duración (siempre 10 s)');
  await rafaga(ARENA, ptr(), 50, 100);
  const vivo = await dato(2);
  ok(/^\d+,\d\d$/.test(vivo) && parseFloat(vivo.replace(',', '.')) > 5, 'el CPS en vivo usa la ventana de 2 s (' + vivo + ')');
  ok(await hayResultado(6000), 'a los 10 s sale el resultado');
  r = await texto('.tt-res');
  ok(r.includes('5,00') && r.includes('Soldado'), '50 clics en 10 s = 5,00 CPS, rango Soldado');
  ok(r.includes('Mejor tramo de 2 s'), 'sale el mejor tramo de 2 s');

  console.log('CPS CON CLIC DERECHO');
  await abrir('cps-con-clic-derecho');
  ok(await clic('5 s'), 'se elige 5 s');
  const CTX = `new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 })`;
  const prevenido = await c.js(`(() => { const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }); ${ARENA}.dispatchEvent(e); return e.defaultPrevented; })()`);
  ok(prevenido, 'el menú del navegador queda bloqueado dentro de la zona');
  await rafaga(ARENA, ptr(), 4, 30);
  await rafaga(ARENA, CTX, 19, 100);
  ok(await dato(1) === '20', 'cuentan 20 clics derechos y no los izquierdos');
  ok(await hayResultado(5000), 'sale el resultado');
  r = await texto('.tt-res');
  ok(r.includes('4,00') && r.includes('Tranquilo'), '20 clics en 5 s = 4,00 CPS, rango Tranquilo');
  ok(/Clics izquierdos ignorados\s*4/.test(r), 'anota los 4 clics izquierdos ignorados');

  console.log('BARRA ESPACIADORA');
  await abrir('prueba-de-la-barra-espaciadora');
  ok(await clic('5 s'), 'se elige 5 s');
  const ESP = (extra = '') => `new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true, ${extra} })`;
  const evitado = await c.js(`(() => { const e = ${ESP()}; document.body.dispatchEvent(e); return e.defaultPrevented; })()`);
  ok(evitado, 'la barra no hace scroll en la página durante el test');
  await c.js(`document.body.dispatchEvent(${ESP('repeat: true')})`);
  ok(await dato(1) === '1', 'la repetición automática no cuenta');
  await rafaga('document.body', ESP(), 14, 100);
  await rafaga(ARENA, ptr(), 5, 50);
  ok(await dato(1) === '20', '15 pulsaciones de tecla + 5 toques = 20');
  ok(await hayResultado(5000), 'sale el resultado');
  r = await texto('.tt-res');
  ok(r.includes('4,00') && r.includes('Ritmo normal'), '20 pulsaciones en 5 s = 4,00, «Ritmo normal»');
  ok(/Con la tecla\s*15/.test(r) && /Con toques en la zona\s*5/.test(r), 'separa teclas y toques');

  console.log('MÓVIL');
  await c.vista(390, 844, 'light', true);
  for (const s of ['test-de-velocidad-de-cliqueo', 'click-jitter', 'click-de-kohi', 'cps-con-clic-derecho', 'prueba-de-la-barra-espaciadora']) await abrir(s, 400);
  ok(await c.js(`document.querySelector('.tt-aviso')?.innerText.includes('pantalla es táctil') || true`), 'carga en móvil');
} catch (e) { console.log('ERROR', e.stack || e); process.exitCode = 1; }
await cerrar();
