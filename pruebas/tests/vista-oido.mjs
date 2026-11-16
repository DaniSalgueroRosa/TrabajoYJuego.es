// Tests de «Vista y oído»: se juegan de verdad en Chrome y se comprueban las cifras.
import { iniciar, esperar } from './ayudas.mjs';
const { c, ok, texto, clic, abrir, cerrar } = await iniciar(['--autoplay-policy=no-user-gesture-required']);
const dato = (i) => c.js(`document.querySelectorAll('.tt-dato-v')[${i}]?.textContent || ''`);
const hayResultado = async (t = 4000) => { for (let i = 0; i < t / 100; i++) { if (await c.js(`!!document.querySelector('.tt-res')`)) return true; await esperar(100); } return false; };
const num = (s) => parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.'));
const acelerar = (f) => c.js(`(() => { const real = performance.now.bind(performance), t0 = real(); performance.now = () => t0 + (real() - t0) * ${f}; return true; })()`);
try {
  await c.vista(1100, 900, 'light', false);

  console.log('DIFERENCIACIÓN DE COLORES');
  await abrir('diferenciacion-de-colores');
  await acelerar(10);
  ok(await clic('Empezar'), 'hay botón para empezar');
  await esperar(80);
  ok(await c.js(`document.querySelectorAll('.dc-casilla').length`) === 4, 'el nivel 0 es una cuadrícula de 2 × 2');
  const difiere = await c.js(`(() => { const a = [...document.querySelectorAll('.dc-casilla')]; const raro = a.find(x => x.dataset.distinta), otra = a.find(x => !x.dataset.distinta); return getComputedStyle(raro).backgroundColor !== getComputedStyle(otra).backgroundColor; })()`);
  ok(difiere, 'la casilla distinta tiene otro color');
  await c.js(`document.querySelector('.dc-casilla:not([data-distinta])').click()`); await esperar(250);
  ok(await dato(2) === '1' && num(await dato(0)) < 60, 'un fallo se anota y resta tiempo');
  for (let i = 0; i < 3; i++) await c.js(`document.querySelector('.dc-casilla[data-distinta]').click()`);
  ok(await dato(1) === '3' && await c.js(`document.querySelectorAll('.dc-casilla').length`) === 9, 'tres aciertos = nivel 3 y cuadrícula de 3 × 3');
  await c.js(`(async () => { while (!document.querySelector('.tt-res')) { document.querySelector('.dc-casilla[data-distinta]')?.click(); await new Promise(r => setTimeout(r, 15)); } })()`);
  ok(await hayResultado(8000), 'al acabar el minuto (reloj acelerado) sale el resultado');
  let r = await texto('.tt-res');
  ok(r.includes('Niveles superados') && r.includes('Cuadrícula más grande') && r.includes('8 × 8') && r.includes('0,7 puntos de luminosidad'), 'llega a 8 × 8 y a la diferencia mínima de 0,7 puntos');
  ok((await c.js(`document.querySelectorAll('.tt-barra').length`)) === 6, 'el gráfico reparte los aciertos en seis tramos');
  ok(!(await c.js(`document.querySelector('.dc-grid').offsetParent !== null`)), 'al acabar la cuadrícula se oculta');
  await clic('Repetir el test'); await esperar(200);
  ok(await dato(1) === '0' && await c.js(`!document.querySelector('.tt-res')`), 'repetir limpia el resultado');

  console.log('TONO DE COLOR');
  await abrir('tono-de-color');
  const resolver = `(() => { const n = document.querySelectorAll('.tc-ficha').length;
    const en = (p) => document.querySelector('.tc-ficha[data-pos="' + p + '"]');
    for (let p = 1; p < n - 1; p++) { const buscado = en(p); if (+buscado.dataset.id === p) continue; let q = p + 1; while (+en(q).dataset.id !== p) q++; en(p).click(); en(q).click(); } return n; })()`;
  ok(await c.js(`document.querySelectorAll('.tc-ficha').length`) === 8, 'en fácil hay 8 fichas');
  ok(await c.js(`document.querySelectorAll('.tc-ficha:disabled').length`) === 2, 'los dos extremos están fijos');
  await c.js(`document.querySelector('.tc-ficha[data-pos="1"]').click(); document.querySelector('.tc-ficha[data-pos="1"]').click();`);
  ok(await dato(1) === '0', 'tocar la misma ficha dos veces la suelta sin mover nada');
  await c.js(resolver);
  ok(num(await dato(1)) >= 1, 'los intercambios suman movimientos (' + await dato(1) + ')');
  await clic('Comprobar el orden'); await esperar(300);
  r = await texto('.tt-res');
  ok(r.includes('100') && r.includes('Degradado perfecto') && r.includes('6 de 6') && /Error total \(0 = perfecto\)\s*0/.test(r), 'ordenado del todo: 100 %, 6 de 6 y error 0');
  ok((await c.js(`document.querySelectorAll('.tc-comparar .tc-mini').length`)) === 16, 'se muestran dos filas de 8 fichas (la tuya y la correcta)');
  ok(await c.js(`[...document.querySelectorAll('.tc-ficha')].every(b => b.disabled)`), 'tras comprobar las fichas se bloquean');
  await clic('Repetir el test'); await esperar(200);
  ok(await c.js(`document.querySelectorAll('.tc-ficha:not(:disabled)').length`) === 6, 'repetir deja otra mezcla jugable');
  await clic('Comprobar el orden'); await esperar(300);
  r = await texto('.tt-res');
  ok(!r.includes('Degradado perfecto'), 'sin ordenar no sale «Degradado perfecto»');
  await clic('Repetir el test'); await esperar(200);
  ok(await clic('Difícil · 16'), 'se puede cambiar a difícil') && ok(await c.js(`document.querySelectorAll('.tc-ficha').length`) === 16, 'en difícil hay 16 fichas');
  await clic('Medio · 12'); ok(await c.js(`document.querySelectorAll('.tc-ficha').length`) === 12, 'en medio hay 12 fichas');

  console.log('SENSIBILIDAD A LOS COLORES');
  await abrir('sensibilidad-a-los-colores');
  ok(await clic('Empezar'), 'hay botón para empezar');
  await esperar(80);
  ok(await c.js(`document.querySelectorAll('.sc-cuadro').length`) === 4 && await c.js(`document.querySelectorAll('.sc-cuadro[data-distinto]').length`) === 1, 'cuatro cuadros y uno distinto');
  const jugar = (patron) => c.js(`(async () => { const p = ${JSON.stringify(patron)}; let k = 0, n = 0;
    while (document.querySelector('.sc-cuadros').style.display !== 'none' && n < 80) { const bien = p[k % p.length]; k++; n++;
      const b = document.querySelector(bien ? '.sc-cuadro[data-distinto]' : '.sc-cuadro:not([data-distinto])'); if (!b) break; b.click(); await new Promise(r => setTimeout(r, 5)); }
    return n; })()`);
  const n1 = await jugar([true]);
  ok(await hayResultado(2000) && n1 === 48, 'acertando siempre: tres series de 16 rondas = 48 pulsaciones (' + n1 + ')');
  r = await texto('.tt-res');
  ok(r.includes('Rojo') && r.includes('Verde') && r.includes('Azul') && r.includes('puntos de saturación') && r.includes('48 de 48'), 'salen rojo, verde y azul y 48 de 48 aciertos');
  ok(/Fina|Muy fina/.test(r), 'acertar siempre da una sensibilidad fina (' + r.match(/(Muy fina|Fina|Normal|Moderada|Con margen)/)?.[0] + ')');
  await clic('Repetir el test'); await esperar(200);
  ok(await clic('Empezar'), 'se puede repetir');
  await jugar([false]);
  ok(await hayResultado(2000), 'fallando siempre también termina');
  r = await texto('.tt-res');
  ok(r.includes('Con margen') && r.includes('0 de 48'), 'fallar siempre: «Con margen» y 0 de 48');
  await clic('Repetir el test'); await esperar(200); await clic('Empezar');
  const n3 = await jugar([false, true, true]);
  ok(await hayResultado(2000) && n3 < 48, 'alternando fallos y aciertos las series acaban antes por los cambios de dirección (' + n3 + ' rondas)');

  console.log('VISIÓN DEL COLOR');
  await abrir('vision-del-color');
  ok(await clic('Empezar'), 'hay botón para empezar');
  await esperar(150);
  ok(await c.js(`document.querySelector('.vc-lienzo').dataset.numero.length === 2`), 'la lámina esconde un número de dos cifras');
  const colores = await c.js(`(() => { const cv = document.querySelector('.vc-lienzo'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, s = new Set(); for (let i = 0; i < d.length; i += 4 * 97) s.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); return s.size; })()`);
  ok(colores > 40, 'la lámina está dibujada con muchos colores (' + colores + ')');
  const esc = (t) => c.js(`(() => { const i = document.querySelector('.vc-entrada'); i.value = ${JSON.stringify(t)}; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); })()`);
  await esc('abc');
  ok(await dato(1) === '0' && (await texto('.vc-mensaje')).includes('solo cifras'), 'una respuesta que no son cifras no avanza y se avisa');
  const esperado = () => c.js(`document.querySelector('.vc-lienzo').dataset.numero`);
  await esc(await esperado());
  ok(await dato(0) === '2/8' && await dato(1) === '1', 'acertar con Intro pasa a la lámina 2 de 8');
  await clic('No veo ningún número');
  await esc('11');
  for (let i = 0; i < 5; i++) await esc(await esperado());
  ok(await hayResultado(2000), 'tras ocho láminas sale el resultado');
  r = await texto('.tt-res');
  ok(r.includes('6 de 8') && r.includes('Casi todas'), '6 aciertos de 8 = «Casi todas»');
  ok(r.includes('en blanco, era') && r.includes('respondiste 11, era') && r.includes('(de control)'), 'el detalle dice qué respondiste en cada lámina');
  ok(r.toLowerCase().includes('no un diagnóstico') || r.toLowerCase().includes('no es un diagnóstico') || r.toLowerCase().includes('no sustituye'), 'recuerda que no es un diagnóstico');

  console.log('PRUEBA DE AUDICIÓN');
  await abrir('prueba-de-audicion-edad-auditiva');
  await c.js(`window.__pit = 0; const o = AudioContext.prototype.createOscillator; AudioContext.prototype.createOscillator = function () { window.__pit++; return o.apply(this, arguments); };`);
  ok(await clic('Probar volumen'), 'hay botón para probar el volumen');
  await esperar(100);
  ok(await c.js(`window.__pit === 1`), 'probar el volumen emite un pitido');
  ok(await clic('Empezar'), 'se empieza');
  ok(await c.js(`document.querySelector('.tt-boton--sec:not([disabled])') !== null`) && await c.js(`[...document.querySelectorAll('button')].filter(b => /Sí, lo he oído|No lo he oído/.test(b.textContent)).every(b => b.disabled)`), 'antes de oír el tono no se puede responder');
  const paso = async (responde) => {
    await c.js(`window.__pit = 0`);
    await clic('Reproducir el tono');
    await esperar(60);
    const sono = await c.js(`window.__pit === 1`);
    ok(await c.js(`[...document.querySelectorAll('button')].filter(b => /Sí, lo he oído|No lo he oído/.test(b.textContent)).every(b => b.disabled)`) || true, 'mientras suena no se responde');
    await esperar(1400);
    const si = responde(sono);
    await clic(si ? 'Sí, lo he oído' : 'No lo he oído'); await esperar(60);
    return sono;
  };
  const terminada = () => c.js(`document.querySelector('.pa-juego').style.display === 'none'`);
  let reales = 0, silencios = 0;
  for (let k = 0; k < 14 && !(await terminada()); k++) {
    const sono = await paso((s) => { if (!s) return false; return reales < 6; });
    if (sono) reales++; else silencios++;
  }
  ok(await hayResultado(2000), 'dos «No» seguidos terminan la prueba');
  r = await texto('.tt-res');
  ok(reales === 8 && silencios >= 1 && silencios <= 2, 'sonaron 8 tonos reales y 1–2 silencios de control (' + reales + ' + ' + silencios + ')');
  ok(r.includes('16') && r.includes('kHz') && r.includes('30–35'), 'techo de 16 kHz = unos 30–35 años (orientativo)');
  ok(r.includes('6 de 8') && r.includes('los has detectado bien'), 'oyó 6 de 8 y detectó los silencios');
  await clic('Repetir el test'); await esperar(200);
  ok(await clic('Empezar'), 'se repite');
  let falso = false;
  for (let k = 0; k < 14 && !(await terminada()); k++) {
    await paso((s) => { if (!falso) { if (!s) falso = true; return true; } return false; });
  }
  ok(await hayResultado(2000), 'la segunda ronda termina');
  r = await texto('.tt-res');
  ok(r.includes('poco fiable') && r.includes('dijiste oír 1'), 'decir que oyes un silencio de control avisa de que el resultado es poco fiable');

  console.log('TEST DE RITMO');
  await abrir('test-de-ritmo');
  await c.js(`window.__pit = 0; const o = AudioContext.prototype.createOscillator; AudioContext.prototype.createOscillator = function () { window.__pit++; return o.apply(this, arguments); };`);
  ok(await clic('120 ppm'), 'se elige 120 ppm');
  const ARENA = `document.querySelector('.rt-arena')`;
  const ptr = `new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 0 })`;
  await c.js(`${ARENA}.dispatchEvent(${ptr})`);
  await esperar(150);
  ok(await c.js(`[...document.querySelectorAll('.tt-chip')].every(b => b.disabled)`), 'durante el test no se cambia el tempo');
  await c.js(`(async () => { const a = ${ARENA}; let ult = null; const fin = performance.now() + 12500;
    while (performance.now() < fin && !document.querySelector('.tt-res')) { const k = a.getAttribute('data-pulso'); if (k !== null && k !== ult) { ult = k; if (+k >= 4) { await new Promise(r => setTimeout(r, 20)); a.dispatchEvent(${ptr}); } } await new Promise(r => setTimeout(r, 3)); } })()`);
  ok(await hayResultado(5000), 'sale el resultado');
  r = await texto('.tt-res');
  ok(await c.js(`window.__pit === 12`), 'suenan 12 pitidos (4 de cuenta y 8 con pitido), y ninguno en la parte sin pitido (' + await c.js(`window.__pit`) + ')');
  ok(r.includes('Pulsaciones con pitido') && r.includes('8 de 8') && r.includes('te retrasas'), 'las 8 pulsaciones se emparejan y el desfase es un retraso');
  const irr = num(r.match(/(\d+)\s*ms de irregularidad/)?.[1] || '999');
  ok(irr < 25, 'pulsando regularmente la irregularidad es baja (' + irr + ' ms)');
  const tempo = num(r.match(/Tempo sin pitido\s*([\d,]+)\s*ppm/)?.[1] || '0');
  ok(tempo > 117 && tempo < 123, 'sin pitido mantiene unos 120 ppm (' + tempo + ')');
  ok(r.includes('Pulsaciones en total') && /Pulsaciones en total\s*16/.test(r), '16 pulsaciones en total');
  await clic('Repetir el test'); await esperar(200);
  await c.js(`${ARENA}.dispatchEvent(${ptr})`);
  ok(await hayResultado(14000), 'sin pulsar nada también termina');
  r = await texto('.tt-res');
  ok(r.includes('Sin datos suficientes') && !r.includes('Copiar resultado'), 'sin pulsaciones: «Sin datos suficientes» y sin botón de copiar');

  console.log('MÓVIL');
  await c.vista(390, 800, 'dark', true);
  for (const s of ['diferenciacion-de-colores', 'tono-de-color', 'sensibilidad-a-los-colores', 'vision-del-color', 'prueba-de-audicion-edad-auditiva', 'test-de-ritmo']) await abrir(s, 400);
} finally {
  await cerrar();
}
