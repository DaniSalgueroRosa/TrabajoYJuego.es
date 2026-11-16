// Tests de «Anime» (62 a 66): respuestas fijas que dan un personaje conocido, gráficas, aviso de fans y móvil.
import { iniciar, esperar } from './ayudas.mjs';
const { c, ok, texto, clic, abrir, cerrar, sinDesborde } = await iniciar();
const hayResultado = async (t = 3000) => { for (let i = 0; i < t / 100; i++) { if (await c.js(`!!document.querySelector('.tt-res')`)) return true; await esperar(100); } return false; };
const total = () => c.js(`(() => { const t = document.querySelector('.tc-num')?.textContent || ''; return +(t.match(/de (\\d+)/) || [])[1] || 0; })()`);
async function responder(eleccion) {
  const n = await total();
  for (let i = 0; i < n; i++) {
    const pulsado = await c.js(`(() => { const b = document.querySelector('.tc-opcion[data-o="${eleccion(i)}"]'); if (!b) return false; b.click(); return true; })()`);
    if (!pulsado) return false;
  }
  return n;
}
const n = (sel) => c.js(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
const titular = () => texto('.tt-res-titular');
const repetir = async () => { await clic('Repetir el test'); await esperar(200); };
// Para cada test: respuesta pura a cada uno de los cinco rasgos → personajes que pueden salir (los que tienen ese rasgo como principal; si hay varios, empatan y el test elige uno).
const PRUEBAS = {
  'test-de-naruto': [['Sasuke Uchiha', 'Rock Lee'], ['Sakura Haruno', 'Gaara'], ['Kakashi Hatake', 'Shikamaru Nara'], ['Hinata Hyuga'], ['Naruto Uzumaki']],
  'test-de-dragon-ball': [['Goku', 'Trunks'], ['Piccolo', 'Krilin'], ['Bulma', 'Maestro Roshi'], ['Gohan'], ['Vegeta']],
  'test-de-jujutsu-kaisen': [["Maki Zen'in"], ['Toge Inumaki', 'Kento Nanami'], ['Megumi Fushiguro'], ['Yuji Itadori', 'Panda'], ['Nobara Kugisaki', 'Satoru Gojo']],
  'test-de-haikyu': [['Shoyo Hinata', 'Yu Nishinoya', 'Ryunosuke Tanaka'], ['Koshi Sugawara'], ['Kei Tsukishima'], ['Tobio Kageyama', 'Tooru Oikawa'], ['Daichi Sawamura']],
  'test-de-jojos-bizarre-adventure': [['Jolyne Cujoh'], ['Joseph Joestar', 'Noriaki Kakyoin'], ['Jotaro Kujo'], ['Giorno Giovanna', 'Jean Pierre Polnareff'], ['Jonathan Joestar', 'Josuke Higashikata']]
};
try {
  await c.vista(1100, 900, 'light', false);
  for (const [slug, esperados] of Object.entries(PRUEBAS)) {
    console.log(slug.toUpperCase());
    await abrir(slug);
    ok(await total() === 10, 'son 10 preguntas');
    ok((await n('.tc-opcion')) === 5, 'cada pregunta tiene cinco respuestas');
    ok(await c.js(`getComputedStyle([...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Anterior')).visibility === 'hidden'`), '«Anterior» no se ve en la primera pregunta');
    for (let k = 0; k < 5; k++) {
      await responder(() => k); ok(await hayResultado(), 'aparece el resultado (rasgo ' + k + ')');
      ok(esperados[k].includes(await titular()), 'todo «' + k + '» da uno de ' + esperados[k].join(' / ') + ' (sale ' + await titular() + ')');
      ok(esperados[k].length === 1 || (await texto('.tt-res')).includes('encajan igual'), 'si hay empate exacto, lo explica');
      if (k === 0) {
        ok((await n('.tg-radar')) === 1, 'hay radar de cinco rasgos');
        ok((await n('.tg-barra')) === 5, 'hay cinco barras de afinidad');
        ok((await texto('.tt-res')).includes('Test de fans no oficial'), 'avisa de que es un test de fans no oficial');
        ok((await texto('.tt-res')).includes('segundo personaje'), 'indica el segundo personaje');
        ok(await sinDesborde(), 'el resultado no desborda');
      }
      await repetir();
    }
    // Respuestas repartidas (0,1,2,3,4,0,1,2,3,4): resultado válido y distinto de nada.
    await responder((i) => i % 5); await hayResultado();
    ok((await titular()).length > 3, 'un reparto equilibrado también da un personaje (' + await titular() + ')');
    ok((await texto('.tt-res')).includes('encajan igual'), 'si todo está empatado, lo explica');
    // Un reparto desigual (4,3,2,1,0) no empata: gana el personaje que más encaja y no hay aviso de empate.
    await repetir(); await responder((i) => [0, 0, 0, 0, 1, 1, 1, 2, 2, 3][i]); await hayResultado();
    ok(!(await texto('.tt-res')).includes('encajan igual'), 'un reparto 4-3-2-1-0 no cuenta como empate');
  }
  console.log('MÓVIL');
  await c.vista(390, 800, 'light', true);
  for (const slug of Object.keys(PRUEBAS)) {
    await abrir(slug);
    await responder((i) => i % 5); await hayResultado();
    ok(await sinDesborde(), slug + ': el resultado no desborda en móvil');
  }
} finally { await cerrar(); }
