// Tests de «Ratón y teclado»: se juegan en Chrome con eventos simulados y se comprueban las cifras.
import { iniciar, ptr, esperar } from './ayudas.mjs';
const { c, ok, texto, clic, abrir, cerrar, rafaga } = await iniciar();
const ARENA = `document.querySelector('.tt-arena')`;
const dato = (i) => c.js(`document.querySelectorAll('.tt-dato-v')[${i}]?.textContent || ''`);
const hayResultado = async (t = 4000) => { for (let i = 0; i < t / 100; i++) { if (await c.js(`!!document.querySelector('.tt-res')`)) return true; await esperar(100); } return false; };
try {
  await c.vista(1100, 900, 'light', false);

  console.log('PRUEBA DEL MOUSE');
  await abrir('prueba-del-mouse');
  const ZONA = `document.querySelector('.rt-zona')`;
  const md = (b) => `new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: ${b} })`;
  await c.js(`${ZONA}.dispatchEvent(${md(0)}); ${ZONA}.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))`);
  ok(await dato(0) === '1', 'el botón izquierdo suma 1');
  await c.js(`${ZONA}.dispatchEvent(${md(0)})`);
  ok((await dato(9)) === '1' || (await dato(8)) === '1', 'dos pulsaciones seguidas del mismo botón se marcan como sospechosas');
  await c.js(`${ZONA}.dispatchEvent(${md(0)})`);
  ok(await c.js(`document.querySelector('.rt-mouse path.rt-on, .rt-mouse rect.rt-on') !== null`), 'la parte pulsada se enciende en el dibujo');
  await c.js(`window.dispatchEvent(new MouseEvent('mouseup', { button: 0 }))`);
  for (const b of [1, 2, 3, 4]) { await esperar(60); await c.js(`${ZONA}.dispatchEvent(${md(b)}); window.dispatchEvent(new MouseEvent('mouseup', { button: ${b} }))`); }
  ok(await dato(1) === '1' && await dato(2) === '1' && await dato(3) === '1' && await dato(4) === '1', 'central, derecho y los dos laterales suman');
  const rueda = (dy) => `(() => { const e = new WheelEvent('wheel', { deltaY: ${dy}, bubbles: true, cancelable: true }); ${ZONA}.dispatchEvent(e); return e.defaultPrevented; })()`;
  ok(await c.js(rueda(-100)), 'la rueda no desplaza la página dentro de la zona');
  await esperar(60); await c.js(rueda(100));
  ok(await dato(5) === '1' && await dato(6) === '1', 'rueda arriba y abajo suman');
  ok((await dato(7)).startsWith('7/7'), 'indica que se han probado los siete elementos');
  ok((await texto('.tt-aviso')).includes('Todo funciona'), 'avisa de que todo funciona');
  await clic('Poner contadores a cero');
  ok(await dato(0) === '0' && (await dato(7)).startsWith('0/7'), 'los contadores se ponen a cero');

  console.log('POLLING RATE');
  await abrir('polling-rate-del-mouse');
  ok(await clic('3 s'), 'se elige 3 s');
  const cruda = await c.js(`'onpointerrawupdate' in window`);
  const evento = cruda ? 'pointerrawupdate' : 'pointermove';
  const simular = (paso, bloques) => c.js(`(async () => { const z = document.querySelector('.pr-zona'); let t = performance.now();
    for (let b = 0; b < ${bloques}; b++) { const e = new PointerEvent('${evento}', { bubbles: true, pointerType: 'mouse' });
      const lista = []; for (let i = 0; i < 20; i++) lista.push({ timeStamp: t + i * ${paso} }); e.getCoalescedEvents = () => lista; z.dispatchEvent(e); t += 20 * ${paso}; await new Promise(r => setTimeout(r, 60)); }
    return true; })()`);
  await simular(1, 40);                                // 800 muestras separadas 1 ms = 1000 Hz
  ok(await hayResultado(4500), 'sale el resultado a los 3 s');
  let r = await texto('.tt-res');
  ok(/1000\s*Hz/.test(r), 'muestras cada 1 ms = 1000 Hz (' + r.split('\n').slice(0, 4).join(' | ') + ')');
  ok(cruda ? r.includes('Muy probablemente 1000 Hz') : r.includes('No se puede medir'), cruda ? 'lo identifica como 1000 Hz' : 'sin eventos agrupados avisa de que no se puede medir');
  await clic('Repetir el test'); await esperar(100);
  await simular(2, 40);                                // 500 Hz
  await hayResultado(4500); r = await texto('.tt-res');
  ok(/500\s*Hz/.test(r), 'muestras cada 2 ms = 500 Hz');
  await clic('Repetir el test'); await esperar(100);
  await simular(8, 25);                                // 125 Hz
  await hayResultado(4500); r = await texto('.tt-res');
  ok(/125\s*Hz/.test(r), 'muestras cada 8 ms = 125 Hz');

  console.log('SCROLL');
  await abrir('test-de-scroll-del-mouse');
  ok(await clic('5 s'), 'se elige 5 s');
  const WH = (dy) => `new WheelEvent('wheel', { deltaY: ${dy}, bubbles: true, cancelable: true })`;
  const prev = await c.js(`(() => { const e = ${WH(100)}; ${ARENA}.dispatchEvent(e); return e.defaultPrevented; })()`);
  ok(prev, 'la página no se desplaza con la rueda dentro de la zona');
  await rafaga(ARENA, WH(100), 19, 100);
  await rafaga(ARENA, WH(-100), 10, 50);
  ok(await dato(1) === '30', 'cuenta 30 pasos');
  ok(await hayResultado(5000), 'sale el resultado');
  r = await texto('.tt-res');
  ok(r.includes('6,0') && r.includes('Ritmo normal'), '30 pasos en 5 s = 6,0 pasos/s');
  ok(/Hacia abajo\s*20/.test(r) && /Hacia arriba\s*10/.test(r) && /Cambios de sentido\s*1/.test(r), 'separa sentidos y cuenta 1 cambio');
  ok(r.includes('Con pasos marcados'), 'reconoce una rueda con pasos de 100 px');
  await clic('Repetir el test'); await clic('Solo hacia abajo'); await esperar(100);
  await rafaga(ARENA, WH(100), 5, 40); await rafaga(ARENA, WH(-100), 3, 40);
  ok(await dato(1) === '5', 'en el modo «solo hacia abajo» los pasos contrarios no suman');
  await hayResultado(6500); r = await texto('.tt-res');
  ok(/en sentido contrario \(no suman\)\s*3/.test(r), 'anota los 3 pasos en sentido contrario');
  await clic('Repetir el test'); await clic('Cualquier sentido'); await esperar(100);
  await rafaga(ARENA, `new WheelEvent('wheel', { deltaY: 4, bubbles: true, cancelable: true })`, 6, 40);
  await hayResultado(6500); r = await texto('.tt-res');
  ok(r.includes('Suave'), 'con deltas pequeños reconoce una rueda suave');

  console.log('GIROS DE RATÓN');
  await abrir('giros-de-raton');
  ok(await clic('5 s'), 'se elige 5 s');
  const circulo = (vueltas, pasosPorVuelta, sentido) => c.js(`(async () => { const z = document.querySelector('.gr-pad'); const n = ${vueltas} * ${pasosPorVuelta};
    for (let i = 0; i <= n; i++) { const r = z.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width * 0.32; const a = ${sentido} * i / ${pasosPorVuelta} * 2 * Math.PI;
      z.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: cx + R * Math.cos(a), clientY: cy + R * Math.sin(a) })); await new Promise(r => setTimeout(r, 12)); }
    return true; })()`);
  await circulo(3, 36, 1);
  ok(parseFloat((await dato(1)).replace(',', '.')) >= 2.8, 'tres vueltas se ven en el contador (' + await dato(1) + ')');
  ok(await hayResultado(5000), 'sale el resultado');
  r = await texto('.tt-res');
  const vueltas = parseFloat((r.match(/(\d+,\d\d)\s*vueltas/i) || [])[1]?.replace(',', '.') || 0);
  ok(vueltas > 2.8 && vueltas < 3.2, 'tres vueltas = ' + vueltas);
  ok(/horario\s*3/.test(r) && /antihorario\s*0/.test(r), 'las tres vueltas son en sentido horario');
  ok(/Regularidad del círculo\s*9\d\s*%|100\s*%/.test(r), 'un círculo perfecto tiene regularidad muy alta');
  await clic('Repetir el test'); await esperar(700);
  await circulo(2, 36, -1);
  await hayResultado(6500); r = await texto('.tt-res');
  ok(/antihorario\s*2/.test(r), 'dos vueltas hacia el otro lado cuentan como antihorarias');
  await clic('Repetir el test'); await esperar(100);
  await c.js(`(async () => { const z = document.querySelector('.gr-pad'); const r = z.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width * 0.32;
    for (let k = 0; k < 20; k++) { for (const a of [0, 0.5, 0, -0.5]) { z.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: cx + R * Math.cos(a), clientY: cy + R * Math.sin(a) })); await new Promise(r => setTimeout(r, 12)); } } })()`);
  await hayResultado(5000); r = await texto('.tt-res');
  ok(/\b0,0\d?\s*vueltas|\b0,00\s*vueltas/.test(r) || /0,\d\d\s*vueltas/.test(r) && parseFloat(r.match(/(\d+,\d\d)\s*vueltas/)[1].replace(',', '.')) < 0.3, 'mover el cursor de lado a lado no suma vueltas');

  console.log('DRAG CLICK');
  await abrir('arrastrar-y-hacer-clic');
  ok(await clic('2 s'), 'se elige 2 s');
  await rafaga(ARENA, ptr(), 30, 20);                  // 30 clics cada ~20 ms: una ráfaga larga
  ok(await hayResultado(3500), 'sale el resultado');
  r = await texto('.tt-res');
  ok(r.includes('15,00') && r.includes('Drag click'), '30 clics en 2 s = 15,00 CPS, rango Drag click');
  ok(/Ráfagas \(3 o más clics seguidos\)\s*[1-9]/.test(r), 'detecta ráfagas');
  ok(/Ráfaga más larga\s*(\d+) clics/.test(r) && +r.match(/Ráfaga más larga\s*(\d+)/)[1] >= 20, 'la ráfaga más larga es casi toda la serie');
  await clic('Repetir el test'); await esperar(100);
  await rafaga(ARENA, ptr(), 6, 250);                  // clics separados: sin ráfagas
  await hayResultado(3500); r = await texto('.tt-res');
  ok(/Ráfagas \(3 o más clics seguidos\)\s*0/.test(r), 'clics separados no forman ráfagas');

  console.log('TEST DE TIPEO');
  await abrir('test-de-tipeo-ppm');
  ok(await clic('15 s'), 'se elige 15 s');
  const escribir = (n, errorEn = -1) => c.js(`(async () => { const ta = document.querySelector('.tp-entrada'); const obj = [...document.querySelectorAll('.tp-texto span')].map(s => s.textContent).join('');
    ta.focus(); for (let i = 0; i < ${n}; i++) { const ch = i === ${errorEn} ? '#' : obj[i]; ta.value += ch; ta.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ch })); await new Promise(r => setTimeout(r, 15)); } return obj.length; })()`);
  const largo = await escribir(60);
  ok(largo >= 900, 'el texto es largo (' + largo + ' caracteres)');
  ok(await c.js(`document.querySelectorAll('.tp-ok').length`) === 60, 'los 60 caracteres bien escritos se marcan');
  ok(await hayResultado(16000), 'a los 15 s sale el resultado');
  r = await texto('.tt-res');
  ok(/PPM netas[^\n]*\s*48/.test(r) || /48\s*PPM/.test(r), '60 caracteres correctos en 15 s = 48 PPM (' + r.split('\n').slice(0, 3).join(' | ') + ')');
  ok(/Precisión\s*100\s*%/.test(r) && /Errores al teclear\s*0/.test(r), 'sin fallos: precisión 100 %');
  await clic('Otro texto'); await esperar(150);
  await escribir(40, 10);
  ok(await c.js(`document.querySelectorAll('.tp-mal').length`) === 1, 'el carácter erróneo se marca');
  await hayResultado(16000); r = await texto('.tt-res');
  ok(/Errores al teclear\s*1/.test(r) && /Caracteres correctos\s*39/.test(r) && !/Precisión\s*100/.test(r), 'un error: 39 correctos y precisión por debajo de 100');
  await clic('Otro texto'); await clic('Sin tildes'); await esperar(150);
  ok(!(await c.js(`[...document.querySelectorAll('.tp-texto span')].map(s => s.textContent).join('')`)).match(/[áéíóúü]/), 'en «Sin tildes» el texto no lleva tildes');
  const pegado = await c.js(`(() => { const e = new Event('paste', { bubbles: true, cancelable: true }); document.querySelector('.tp-entrada').dispatchEvent(e); return e.defaultPrevented; })()`);
  ok(pegado, 'pegar texto está bloqueado');

  console.log('MÓVIL');
  await c.vista(390, 844, 'light', true);
  for (const s of ['prueba-del-mouse', 'polling-rate-del-mouse', 'test-de-scroll-del-mouse', 'giros-de-raton', 'arrastrar-y-hacer-clic', 'test-de-tipeo-ppm']) await abrir(s, 400);
} catch (e) { console.log('ERROR', e.stack || e); process.exitCode = 1; }
await cerrar();
