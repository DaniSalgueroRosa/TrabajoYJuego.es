// Tests de «Idiomas» (80 a 88): quiz con corrección (acierto, fallo, umbral del 60 %, teclas, contraste de los estados) y «¿De dónde vienes?».
import { iniciar, esperar } from './ayudas.mjs';
import { CONTRASTE } from '../contraste.mjs';
const { c, ok, texto, clic, abrir, cerrar, sinDesborde } = await iniciar();
const hayResultado = async (t = 3000) => { for (let i = 0; i < t / 100; i++) { if (await c.js(`!!document.querySelector('.tt-res')`)) return true; await esperar(100); } return false; };
const total = () => c.js(`(() => { const t = document.querySelector('.tc-num')?.textContent || ''; return +(t.match(/de (\\d+)/) || [])[1] || 0; })()`);
const n = (sel) => c.js(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
const responder = (k) => c.js(`(() => { const b = document.querySelector('.tc-opcion[data-o="${k}"]'); if (!b) return false; b.click(); return true; })()`);
const siguiente = () => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => /^(Siguiente|Ver el resultado)$/.test(b.textContent.trim()) && !b.hidden && getComputedStyle(b).display !== 'none'); if (!b) return false; b.click(); return true; })()`);
const titular = () => texto('.tt-res-titular');
const repetir = async () => { await clic('Repetir el test'); await esperar(200); };
async function jugar(N, correcta) {   // correcta(i) → true si se acierta en la pregunta i (la correcta es siempre la opción de datos 0)
  for (let i = 0; i < N; i++) { await responder(correcta(i) ? 0 : 1); if (!(await siguiente())) return false; }
  return hayResultado();
}
const QUIZ = {
 "test-de-nivel-de-vocabulario-de-espanol": {
  "n": 30,
  "L": 5,
  "resultados": [
   "Vocabulario en construcción",
   "Vocabulario cotidiano",
   "Vocabulario intermedio",
   "Vocabulario avanzado",
   "Vocabulario culto",
   "Vocabulario excepcional"
  ],
  "porNivel": 6
 },
 "test-de-jerga-espanola": {
  "n": 24,
  "L": 4,
  "resultados": [
   "Turista de la jerga",
   "Jerga básica",
   "Jerga habitual",
   "Jerga avanzada",
   "Casi nativo o nativa"
  ],
  "porNivel": 6
 },
 "test-internacional-de-espanol": {
  "n": 24,
  "L": 4,
  "resultados": [
   "Español de andar por casa",
   "Oído abierto",
   "Viajero o viajera del español",
   "Dialectólogo o dialectóloga aficionada",
   "Embajador o embajadora del español"
  ],
  "porNivel": 6
 },
 "test-de-errores-ortograficos-comunes": {
  "n": 24,
  "L": 4,
  "resultados": [
   "Ortografía por pulir",
   "Ortografía correcta",
   "Buena ortografía",
   "Ortografía muy sólida",
   "Ortografía de corrector"
  ],
  "porNivel": 6
 },
 "test-de-nivel-de-vocabulario-de-ingles": {
  "n": 30,
  "L": 5,
  "resultados": [
   "Por debajo de A1",
   "Nivel A1 (principiante)",
   "Nivel A2 (elemental)",
   "Nivel B1 (intermedio)",
   "Nivel B2 (intermedio alto)",
   "Nivel C1 o superior (avanzado)"
  ],
  "porNivel": 6
 },
 "test-de-nivel-de-vocabulario-de-frances": {
  "n": 30,
  "L": 5,
  "resultados": [
   "Por debajo de A1",
   "Nivel A1 (principiante)",
   "Nivel A2 (elemental)",
   "Nivel B1 (intermedio)",
   "Nivel B2 (intermedio alto)",
   "Nivel C1 o superior (avanzado)"
  ],
  "porNivel": 6
 },
 "test-de-nivel-de-vocabulario-de-ruso": {
  "n": 30,
  "L": 5,
  "resultados": [
   "Por debajo de A1",
   "Nivel A1 (principiante)",
   "Nivel A2 (elemental)",
   "Nivel B1 (intermedio)",
   "Nivel B2 (intermedio alto)",
   "Nivel C1 o superior (avanzado)"
  ],
  "porNivel": 6
 },
 "test-de-nivel-de-vocabulario-de-japones": {
  "n": 30,
  "L": 5,
  "resultados": [
   "Por debajo de N5",
   "Nivel N5 (principiante)",
   "Nivel N4 (elemental)",
   "Nivel N3 (intermedio)",
   "Nivel N2 (intermedio alto)",
   "Nivel N1 (avanzado)"
  ],
  "porNivel": 6
 }
};
const DONDE = {
 "España": [
  0,
  0,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
 ],
 "México": [
  1,
  0,
  0,
  1,
  0,
  1,
  0,
  0,
  0,
  1,
  1,
  0,
  1,
  1,
  1,
  1
 ],
 "Centroamérica": [
  1,
  1,
  0,
  1,
  0,
  5,
  5,
  0,
  0,
  1,
  1,
  1,
  0,
  5,
  5,
  1
 ],
 "Caribe hispano": [
  1,
  0,
  0,
  1,
  1,
  2,
  5,
  0,
  0,
  2,
  1,
  1,
  4,
  0,
  2,
  0
 ],
 "Colombia y Venezuela": [
  1,
  2,
  0,
  1,
  0,
  5,
  4,
  0,
  0,
  2,
  1,
  1,
  4,
  4,
  2,
  3
 ],
 "Andes (Perú, Ecuador y Bolivia)": [
  1,
  0,
  0,
  2,
  0,
  4,
  3,
  1,
  1,
  2,
  1,
  1,
  5,
  5,
  2,
  2
 ],
 "Chile": [
  1,
  3,
  0,
  1,
  1,
  4,
  2,
  1,
  1,
  2,
  1,
  2,
  3,
  3,
  3,
  2
 ],
 "Río de la Plata": [
  1,
  1,
  0,
  0,
  1,
  3,
  1,
  1,
  1,
  2,
  1,
  2,
  2,
  2,
  4,
  2
 ]
};
try {
  await c.vista(1100, 900, 'light', false);
  for (const [slug, d] of Object.entries(QUIZ)) {
    console.log(slug.toUpperCase());
    await abrir(slug);
    ok(await total() === d.n, 'son ' + d.n + ' preguntas');
    ok((await n('.tc-opcion')) === 4, 'cada pregunta tiene cuatro respuestas');
    ok(await c.js(`[...document.querySelectorAll('button')].every(b => !/^(Siguiente|Ver el resultado)$/.test(b.textContent.trim()) || b.hidden || getComputedStyle(b).display === 'none')`), '«Siguiente» no aparece antes de responder');
    // Responder bien la primera: se marca, se explica y se puede pasar
    await responder(0); await esperar(100);
    ok((await n('.tq-ok')) === 1 && (await n('.tq-mal')) === 0, 'acertar marca la correcta en verde y nada en rojo');
    ok(await c.js(`!document.querySelector('.tq-expl').hidden && document.querySelector('.tq-expl').textContent.length > 20 && document.querySelector('.tq-expl').textContent.startsWith('Correcto')`), 'sale la explicación y empieza por «Correcto»');
    await responder(1); await esperar(50);
    ok((await n('.tq-ok')) === 1 && (await n('.tq-mal')) === 0, 'una vez respondida, otra pulsación no cambia nada');
    const cont = await c.js(CONTRASTE);
    ok(!cont.fallos.length, 'el texto corregido tiene contraste suficiente' + (cont.fallos.length ? ' → ' + cont.fallos.slice(0, 2).join(' | ') : ''));
    ok(await siguiente(), 'se puede pasar a la siguiente');
    // Fallar: se marca la elegida y la correcta
    await responder(1); await esperar(100);
    ok((await n('.tq-ok')) === 1 && (await n('.tq-mal')) === 1, 'fallar marca la elegida en rojo y la correcta en verde');
    ok(await c.js(`document.querySelector('.tq-expl').textContent.startsWith('Casi. La correcta es')`), 'la explicación dice cuál era la correcta');
    const cont2 = await c.js(CONTRASTE);
    ok(!cont2.fallos.length, 'el texto del fallo tiene contraste suficiente' + (cont2.fallos.length ? ' → ' + cont2.fallos.slice(0, 2).join(' | ') : ''));
    await siguiente();
    // Todo bien
    await abrir(slug, 400);
    ok(await jugar(d.n, () => true), 'se llega al resultado respondiendo todo bien');
    ok((await titular()) === d.resultados[d.L], 'todo bien da «' + d.resultados[d.L] + '» (sale ' + await titular() + ')');
    ok((await texto('.tt-res-grande')).startsWith(d.n + ' de ' + d.n), 'valor: ' + d.n + ' de ' + d.n);
    ok((await n('.tg-barra')) === d.L, 'una barra por franja (' + d.L + ')');
    ok((await texto('.tt-res')).includes('No has fallado ninguna'), 'sin fallos no hay nada que repasar');
    ok(await sinDesborde(), 'el resultado no desborda');
    // Todo mal
    await repetir(); ok(await jugar(d.n, () => false), 'se llega al resultado respondiendo todo mal');
    ok((await titular()) === d.resultados[0], 'todo mal da «' + d.resultados[0] + '» (sale ' + await titular() + ')');
    ok((await n('.tq-repaso-lista li')) === d.n && (await texto('.tq-repaso summary')) === 'Qué repasar (' + d.n + ')', 'el repaso lista las ' + d.n + ' falladas');
    const cont3 = await c.js(CONTRASTE);
    ok(!cont3.fallos.length, 'el resultado con repaso tiene contraste suficiente' + (cont3.fallos.length ? ' → ' + cont3.fallos.slice(0, 2).join(' | ') : ''));
    // Umbral del 60 %: 4 de 6 supera la franja, 3 de 6 no (y las siguientes no cuentan aunque estén bien)
    await repetir(); await jugar(d.n, (i) => (i % 6) < 4);
    ok((await titular()) === d.resultados[d.L], '4 de 6 en cada franja las supera todas');
    await repetir(); await jugar(d.n, (i) => Math.floor(i / 6) === 2 ? (i % 6) < 3 : (Math.floor(i / 6) < 2 ? (i % 6) < 4 : true));
    ok((await titular()) === d.resultados[2], '3 de 6 en la tercera franja se queda en «' + d.resultados[2] + '» (sale ' + await titular() + ')');
    // Teclado: la tecla 1 responde
    await repetir(); await c.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }))`); await esperar(100);
    ok((await n('.tq-ok')) >= 1, 'la tecla 1 responde la primera opción');
  }

  console.log('¿DE DÓNDE VIENES?');
  await abrir('test-de-donde-vienes');
  ok(await total() === 16, 'son 16 preguntas');
  for (const [region, idx] of Object.entries(DONDE)) {
    for (let i = 0; i < 16; i++) await c.js(`(() => { const b = document.querySelector('.tc-opcion[data-o="${idx[i]}"]'); if (b) b.click(); })()`);
    ok(await hayResultado(), 'aparece el resultado (' + region + ')');
    ok((await titular()) === region, 'las respuestas típicas de «' + region + '» dan esa región (sale ' + await titular() + ')');
    if (region === 'España') {
      ok((await n('.tg-barra')) === 8, 'hay ocho barras, una por región');
      ok((await texto('.tt-res')).includes('Un resultado alto no dice dónde has nacido'), 'avisa de que no dice dónde has nacido');
      ok((await texto('.tt-res')).includes('Tu segunda región más cercana'), 'indica la segunda región');
      ok(await sinDesborde(), 'el resultado no desborda');
    }
    await repetir();
  }
  console.log('MÓVIL');
  await c.vista(390, 800, 'light', true);
  for (const slug of Object.keys(QUIZ)) {
    await abrir(slug);
    await responder(1); await esperar(100);
    ok(await sinDesborde(), slug + ': la corrección no desborda en móvil');
    await siguiente();
    await jugar(QUIZ[slug].n - 1, () => false);
    ok(await sinDesborde(), slug + ': el resultado con repaso no desborda en móvil');
  }
  await abrir('test-de-donde-vienes');
  for (let i = 0; i < 16; i++) await responder(0);
  await hayResultado(); ok(await sinDesborde(), '¿De dónde vienes?: el resultado no desborda en móvil');
} finally { await cerrar(); }
