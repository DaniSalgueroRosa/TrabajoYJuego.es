// Tests de «Relaciones» (52 a 61): respuestas fijas que dan un resultado conocido, la calculadora de amor con nombres y el móvil.
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
const titular = () => texto('.tt-res-titular');
const rango = () => texto('.tt-res-rango');
const grande = async () => parseInt(await texto('.tt-res-grande'), 10);
const repetir = async () => { await clic('Repetir el test'); await esperar(200); };
const n = (sel) => c.js(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
try {
  await c.vista(1100, 900, 'light', false);

  console.log('¿LE GUSTO?');
  await abrir('test-le-gusto');
  ok(await total() === 14, 'son 14 preguntas');
  ok(await c.js(`getComputedStyle([...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Anterior')).visibility === 'hidden'`), '«Anterior» no se ve en la primera pregunta');
  ok((await n('.tc-opcion')) === 5, 'cada pregunta tiene cinco respuestas');
  await responder((i) => (i === 11 || i === 12) ? 0 : 4); await hayResultado();
  ok(await grande() === 100 && (await rango()).includes('Muchas señales'), 'todo a favor da 100 (' + await grande() + ')');
  ok((await n('.tg-medidor')) === 1 && (await n('.tg-barra')) === 4, 'hay medidor y cuatro barras');
  ok((await texto('.tt-res')).includes('Esto no adivina'), 'avisa de que no adivina lo que siente nadie');
  await repetir(); await responder((i) => (i === 11 || i === 12) ? 4 : 0); await hayResultado();
  ok(await grande() === 0 && (await rango()).includes('Pocas señales'), 'todo en contra da 0');
  await repetir(); await responder(() => 2); await hayResultado();
  ok(await grande() > 20 && await grande() < 80, 'respuestas a medias dan una puntuación intermedia (' + await grande() + ')');

  console.log('¿LE GUSTO A ÉL TAMBIÉN?');
  await abrir('test-le-gusto-a-el-tambien');
  ok(await total() === 16, 'son 16 preguntas');
  await responder(() => 4); await hayResultado();
  ok(await titular() === 'Parece mutuo', 'todo alto parece mutuo');
  ok((await n('.tg-plano')) === 1 && (await n('.tg-balanza .tg-barra')) === 1, 'hay plano y balanza');
  await repetir(); await responder((i) => i < 8 ? 4 : 0); await hayResultado();
  ok(await titular() === 'Tú das más pasos que él', 'yo alto y él bajo: das más pasos');
  await repetir(); await responder((i) => i < 8 ? 0 : 4); await hayResultado();
  ok(await titular() === 'Él parece más implicado que tú', 'yo bajo y él alto: él más implicado');
  await repetir(); await responder(() => 0); await hayResultado();
  ok(await titular() === 'Poco movimiento por ambas partes', 'todo bajo: poco movimiento');

  console.log('¿ESTOY ENAMORADO/A?');
  await abrir('test-estoy-enamorado');
  ok(await total() === 14, 'son 14 preguntas');
  await responder(() => 4); await hayResultado();
  ok(await grande() === 100 && (await rango()).includes('Estás enamorado'), 'todo alto da 100');
  ok((await n('.tg-radar')) === 1, 'hay radar de cinco áreas');
  ok((await texto('.tt-res')).includes('nervios y tu idealización son altos'), 'avisa si los nervios son altos');
  await repetir(); await responder(() => 0); await hayResultado();
  ok(await grande() === 0 && (await rango()).includes('amistad'), 'todo bajo da amistad o cariño');

  console.log('CALCULADORA DE AMOR');
  await abrir('calculadora-de-amor');
  await clic('Calcular el amor'); await esperar(100);
  ok((await texto('#ca-error')).includes('los dos nombres') && !(await hayResultado(300)), 'sin nombres da error');
  const nombres = async (a, b) => { await c.js(`document.getElementById('ca-uno').value = ${JSON.stringify(a)}; document.getElementById('ca-dos').value = ${JSON.stringify(b)}`); await clic('Calcular el amor'); await hayResultado(); };
  await nombres('Romeo', 'Julieta');
  ok(await grande() === 98, 'Romeo y Julieta dan 98 % (' + await grande() + ')');
  ok((await texto('.tt-res')).includes('1 2 0 2 0 → 3 2 2 2 → 5 4 4 → 9 8'), 'se enseñan los pasos del cálculo');
  ok((await n('.tg-medidor')) === 1 && (await n('.tg-barra')) === 5, 'hay medidor y cinco barras de letras');
  await clic('Probar con otros nombres'); await esperar(200);
  await nombres('Julieta', 'ROMEO');
  ok(await grande() === 98, 'el orden y las mayúsculas no cambian el resultado');
  await clic('Probar con otros nombres'); await esperar(200);
  await nombres('Álvaro', 'Ñusta');
  ok(await grande() >= 0 && await hayResultado(), 'los acentos y la ñ no rompen nada');
  ok(await sinDesborde(), 'el resultado no desborda');

  console.log('SEXUALIDAD Y ORIENTACIÓN');
  await abrir('test-de-orientacion-sexual');
  ok(await total() === 13 && (await n('.tc-opcion')) === 4, '13 preguntas, la primera con cuatro opciones de definición');
  const mapa = (yo, v) => (i) => i === 0 ? yo : (v.includes(i) ? 4 : 0);
  await responder(mapa(0, [1, 2, 3])); await hayResultado();
  ok(await titular() === 'Atracción sobre todo hacia hombres' && (await texto('.tt-res')).includes('gay'), 'hombre y atracción hacia hombres: gay');
  ok((await n('.tg-plano')) === 1 && (await n('.tg-barra')) === 6, 'hay plano y seis barras');
  ok((await texto('.tt-res')).includes('Ningún test puede decirte tu orientación'), 'avisa de que ningún test dice tu orientación');
  await repetir(); await responder(mapa(1, [4, 5, 6])); await hayResultado();
  ok(await titular() === 'Atracción sobre todo hacia mujeres' && (await texto('.tt-res')).includes('lesbiana'), 'mujer y atracción hacia mujeres: lesbiana');
  await repetir(); await responder(mapa(0, [1, 2, 3, 4, 5, 6])); await hayResultado();
  ok(await titular() === 'Atracción hacia hombres y hacia mujeres', 'hacia ambos: bisexual o pansexual');
  await repetir(); await responder(mapa(3, [10])); await hayResultado();
  ok(await titular() === 'Poca atracción hacia los demás', 'poca atracción');
  await repetir(); await responder(mapa(3, [])); await hayResultado();
  ok((await titular()).includes('abierto'), 'sin dirección clara: perfil abierto');
  await repetir(); await responder(mapa(3, [7, 8, 9])); await hayResultado();
  ok((await titular()).includes('no binarias'), 'atracción hacia personas no binarias');

  console.log('OMEGAVERSE');
  await abrir('test-omegaverse');
  ok(await total() === 12 && (await n('.tc-opcion')) === 3, '12 preguntas con tres respuestas');
  await responder(() => 0); await hayResultado(); ok(await titular() === 'Alfa', 'siempre la primera da alfa');
  ok((await n('.tg-triangulo')) === 1, 'hay triángulo');
  await repetir(); await responder(() => 1); await hayResultado(); ok(await titular() === 'Beta', 'siempre la segunda da beta');
  await repetir(); await responder(() => 2); await hayResultado(); ok(await titular() === 'Omega', 'siempre la tercera da omega');
  await repetir(); await responder((i) => i < 6 ? 0 : 2); await hayResultado(); ok((await rango()).includes('Con un toque de'), 'un empate da «con un toque de…»');

  const afinidad = async (slug, nombre, extra, neg = []) => {
    console.log(nombre);
    await abrir(slug);
    ok(await total() === 12, 'son 12 preguntas');
    await responder((i) => neg.includes(i) ? 0 : 4); await hayResultado();
    ok(await grande() === 100 && (await rango()).includes('Mucha'), 'todo a favor da 100');
    ok(await extra(), 'tiene su gráfica');
    ok((await texto('.tt-res')).includes('Ningún test puede decirte') || (await texto('.tt-res')).includes('no se decide con un test'), 'avisa de que un test no define quién eres');
    await repetir(); await responder((i) => neg.includes(i) ? 4 : 0); await hayResultado();
    ok(await grande() === 0 && (await rango()).includes(slug === 'test-trans' ? 'Comodidad' : 'Poca'), 'todo en contra da 0');
    ok(await sinDesborde(), 'el resultado no desborda');
  };
  await afinidad('test-lesbico', 'LÉSBICO', async () => (await n('.tg-medidor')) === 1 && (await n('.tg-radar')) === 1);
  await afinidad('test-homosexual', 'HOMOSEXUAL', async () => (await n('.tg-espectro')) === 1 && (await n('.tg-barra')) === 3);
  await afinidad('test-bisexual', 'BISEXUAL', async () => (await n('.tg-espectro')) === 1 && (await n('.tg-radar')) === 1);
  await afinidad('test-trans', 'TRANS', async () => (await n('.tg-espectro')) === 1 && (await n('.tg-barra')) === 4, [2, 8, 9]);

  console.log('MÓVIL');
  await c.vista(390, 800, 'light', true);
  for (const s of ['test-le-gusto', 'test-le-gusto-a-el-tambien', 'test-de-orientacion-sexual', 'test-trans', 'calculadora-de-amor']) {
    await abrir(s);
    if (s === 'calculadora-de-amor') { await c.js(`document.getElementById('ca-uno').value = 'Ana'; document.getElementById('ca-dos').value = 'Luis'`); await clic('Calcular el amor'); await hayResultado(); }
    else { await responder(() => 1); await hayResultado(); }
    ok(await sinDesborde(), s + ': el resultado no desborda en móvil');
  }
} finally { await cerrar(); }
