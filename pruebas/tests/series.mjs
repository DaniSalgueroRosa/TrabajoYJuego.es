// Tests de «Series, libros y cine» (67 a 70): respuestas puras a cada rasgo (sale uno de los resultados que lo tienen como principal), reparto desigual, gráficas, aviso de fans y móvil.
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
const PRUEBAS = {
 "test-de-percy-jackson": {
  "preguntas": 12,
  "opciones": 6,
  "pref": "Cabaña de ",
  "esperados": [
   [
    "Zeus",
    "Hera"
   ],
   [
    "Atenea",
    "Hades"
   ],
   [
    "Apolo",
    "Hefesto"
   ],
   [
    "Deméter"
   ],
   [
    "Poseidón",
    "Ares"
   ],
   [
    "Afrodita",
    "Hermes",
    "Dioniso"
   ]
  ]
 },
 "test-de-juego-de-tronos": {
  "preguntas": 10,
  "opciones": 5,
  "pref": "Casa ",
  "esperados": [
   [
    "Stark"
   ],
   [
    "Lannister"
   ],
   [
    "Martell",
    "Tyrell"
   ],
   [
    "Targaryen",
    "Baratheon"
   ],
   [
    "Tully",
    "Greyjoy"
   ]
  ]
 },
 "test-del-universo-dc": {
  "preguntas": 10,
  "opciones": 5,
  "pref": "",
  "esperados": [
   [
    "Wonder Woman"
   ],
   [
    "Batman"
   ],
   [
    "Aquaman",
    "Linterna Verde"
   ],
   [
    "Superman",
    "Flash"
   ],
   [
    "Harley Quinn",
    "Catwoman"
   ]
  ]
 },
 "test-de-south-park": {
  "preguntas": 10,
  "opciones": 5,
  "pref": "",
  "esperados": [
   [
    "Stan Marsh",
    "Kyle Broflovski",
    "Wendy Testaburger"
   ],
   [
    "Kenny McCormick"
   ],
   [
    "Eric Cartman"
   ],
   [
    "Butters Stotch"
   ],
   [
    "Randy Marsh",
    "Tweek Tweak"
   ]
  ]
 }
};
try {
  await c.vista(1100, 900, 'light', false);
  for (const [slug, d] of Object.entries(PRUEBAS)) {
    console.log(slug.toUpperCase());
    await abrir(slug);
    ok(await total() === d.preguntas, 'son ' + d.preguntas + ' preguntas');
    ok((await n('.tc-opcion')) === d.opciones, 'cada pregunta tiene ' + d.opciones + ' respuestas');
    for (let k = 0; k < d.opciones; k++) {
      await responder(() => k); ok(await hayResultado(), 'aparece el resultado (rasgo ' + k + ')');
      const t = await titular();
      ok(d.esperados[k].map((x) => d.pref + x).includes(t), 'todo «' + k + '» da uno de ' + d.esperados[k].join(' / ') + ' (sale ' + t + ')');
      if (k === 0) {
        ok((await n('.tg-radar')) === 1, 'hay radar de ' + d.opciones + ' rasgos');
        ok((await n('.tg-barra')) === 5, 'hay cinco barras de afinidad');
        ok((await texto('.tt-res')).includes('Test de fans no oficial'), 'avisa de que es un test de fans no oficial');
        ok((await texto('.tt-res')).includes('Tu segund'), 'indica el segundo resultado');
        ok(await sinDesborde(), 'el resultado no desborda');
      }
      await repetir();
    }
    await responder((i) => i % d.opciones); await hayResultado();
    ok((await titular()).length > 3, 'un reparto equilibrado también da un resultado (' + await titular() + ')');
    await repetir(); await responder((i) => [0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 0, 0][i]); await hayResultado();
    ok(!(await texto('.tt-res')).includes('encajan igual'), 'un reparto desigual no cuenta como empate');
  }
  console.log('MÓVIL');
  await c.vista(390, 800, 'light', true);
  for (const [slug, d] of Object.entries(PRUEBAS)) {
    await abrir(slug);
    await responder((i) => i % d.opciones); await hayResultado();
    ok(await sinDesborde(), slug + ': el resultado no desborda en móvil');
  }
} finally { await cerrar(); }
