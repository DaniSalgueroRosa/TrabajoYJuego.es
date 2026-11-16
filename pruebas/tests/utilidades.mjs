// Tests de «Utilidades»: velocidad de internet (real y simulada) e IA vs cuadros reales (solo si el test está publicado, con su propio banco).
import fs from 'node:fs';
import path from 'node:path';
import { iniciar, esperar, base } from './ayudas.mjs';
const { c, ok, texto, clic, abrir, cerrar, sinDesborde } = await iniciar();
const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const dato = (i) => c.js(`document.querySelectorAll('.tt-dato-v')[${i}]?.textContent || ''`);
const hayResultado = async (t = 4000) => { for (let i = 0; i < t / 100; i++) { if (await c.js(`!!document.querySelector('.tt-res')`)) return true; await esperar(100); } return false; };
const num = (s) => parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.'));
const detalle = (r, etiqueta) => (r.match(new RegExp(etiqueta + '\\s*\\n?\\s*([^\\n]+)')) || [])[1] || '';
// Un fetch de mentira: cada flujo entrega «por tick» bytes cada 25 ms, es decir, por*40*4 bits por segundo en total con 4 hilos.
const falso = (porTick) => `window.fetch = (u, o) => {
  if (o && o.method === 'HEAD') return new Promise((r) => setTimeout(() => r(new Response(null, { status: 200 })), 25));
  let enviados = 0;
  const flujo = new ReadableStream({ start(ctl) { const iv = setInterval(() => {
    if (o && o.signal && o.signal.aborted) { clearInterval(iv); try { ctl.close(); } catch (e) {} return; }
    ctl.enqueue(new Uint8Array(${porTick})); enviados += ${porTick};
    if (enviados >= 1048576) { clearInterval(iv); ctl.close(); } }, 25); } });
  return Promise.resolve(new Response(flujo, { status: 200 })); }; true`;
try {
  await c.vista(1100, 900, 'light', false);

  console.log('TEST DE VELOCIDAD DE INTERNET');
  await abrir('test-de-velocidad-de-internet');
  ok(await c.js(`document.querySelectorAll('.tt-chip').length === 3`), 'hay tres duraciones');
  ok((await texto('.vi-mensaje')).includes('Empezar la prueba'), 'el mensaje explica qué hacer');
  await clic('5 segundos'); await clic('Empezar la prueba');
  await esperar(300);
  ok(await c.js(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Empezar la prueba').disabled`), 'mientras mide, el botón de empezar se bloquea');
  ok(await c.js(`[...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Cancelar' && !b.hidden)`), 'aparece «Cancelar»');
  ok(await hayResultado(20000), 'sale el resultado en la prueba real (localhost)');
  let r = await texto('.tt-res');
  ok(num(await texto('.tt-res-grande')) > 50, 'en localhost la velocidad es alta (' + (await texto('.tt-res-grande')).replace(/\s+/g, ' ') + ')');
  const usados = num(detalle(r, 'Datos usados en la prueba'));
  ok(usados > 1 && usados <= 135, 'los datos usados no pasan del tope de unos 120 MB (' + usados + ' MB)');
  ok(r.includes('Latencia (mediana)') && r.includes('Variación de la latencia') && r.includes('Tiempo para bajar 1 GB'), 'el detalle incluye latencia, variación y tiempo para 1 GB');
  ok((await c.js(`document.querySelectorAll('.tg-linea').length`)) === 1 && (await c.js(`document.querySelectorAll('.tg-barra').length`)) === 4, 'hay gráfica de línea y comparación con usos habituales');
  ok(await c.js(`[...performance.getEntriesByType('resource')].every(e => e.name.startsWith(location.origin))`), 'todas las peticiones van al propio sitio');
  ok(/solo|no mide la subida/i.test(r) || r.includes('No mide la subida'), 'avisa de que no mide la subida');
  ok(await c.js(`document.documentElement.scrollWidth <= innerWidth + 1`), 'el resultado no desborda');

  await abrir('test-de-velocidad-de-internet');
  await c.js(falso(7812));
  await clic('5 segundos'); await clic('Empezar la prueba');
  ok(await hayResultado(20000), 'sale el resultado con la red simulada');
  r = await texto('.tt-res');
  const v = num(await texto('.tt-res-grande'));
  ok(v >= 8 && v <= 12, 'una red simulada de 10 Mbps se mide como ' + v + ' Mbps');
  const lat = num(detalle(r, 'Latencia \\(mediana\\)'));
  ok(lat >= 20 && lat <= 50, 'la latencia simulada de 25 ms sale como ' + lat + ' ms');
  ok(/1[2-4] min/.test(detalle(r, 'Tiempo para bajar 1 GB')), 'bajar 1 GB a 10 Mbps son unos 13 min (' + detalle(r, 'Tiempo para bajar 1 GB') + ')');
  ok(/Correcta|Justa/.test(r), 'a 10 Mbps el rango es «Correcta» o «Justa»');
  await clic('Repetir el test'); await esperar(150);
  ok(await hayResultado(20000), 'tras «Repetir el test» mide otra vez');

  await abrir('test-de-velocidad-de-internet');
  await c.js(`window.fetch = () => Promise.reject(new TypeError('sin red')); true`);
  await clic('Empezar la prueba'); await esperar(400);
  ok((await texto('.vi-mensaje')).includes('No se ha podido descargar'), 'sin red, el mensaje explica el problema');
  ok(await c.js(`![...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Empezar la prueba').disabled`) && !(await c.js(`!!document.querySelector('.tt-res')`)), 'sin red se puede volver a intentar y no hay resultado falso');

  await abrir('test-de-velocidad-de-internet');
  await c.js(falso(7812));
  await clic('Empezar la prueba'); await esperar(1500);
  await clic('Cancelar'); await esperar(500);
  ok((await texto('.vi-mensaje')).includes('cancelada') && !(await c.js(`!!document.querySelector('.tt-res')`)), 'cancelar no deja resultado');
  ok(await c.js(`![...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Empezar la prueba').disabled`), 'tras cancelar se puede empezar de nuevo');

  console.log('IA VS CUADROS REALES');
  const dist = path.join(RAIZ, 'dist', 'tests', 'ia-vs-cuadros-reales');
  if (!fs.existsSync(path.join(dist, 'index.html'))) console.log('  (omitido: el test está en «próximamente» y no tiene página)');
  else {
    const banco = JSON.parse(fs.readFileSync(path.join(dist, 'banco.json'), 'utf8')).imagenes;
    await abrir('ia-vs-cuadros-reales', 900);
    ok((await texto('.ia-mensaje')).includes('Imagen 1 de'), 'la primera imagen se muestra');
    ok(await c.js(`document.querySelector('.ia-imagen').complete && document.querySelector('.ia-imagen').naturalWidth > 0`), 'la imagen se carga');
    const total = Math.min(10, banco.length);
    let bien = 0;
    for (let i = 0; i < total; i++) {
      const src = await c.js(`document.querySelector('.ia-imagen').getAttribute('src')`);
      const tipo = banco.find((b) => src.endsWith(b.archivo))?.tipo;
      ok(!!tipo, 'imagen ' + (i + 1) + ': está en el banco (' + src + ')');
      const dice = i < 7 ? tipo : (tipo === 'real' ? 'ia' : 'real');
      if (dice === tipo) bien++;
      await clic(dice === 'real' ? 'Cuadro real' : 'Hecho con IA'); await esperar(60);
      ok(/Correcto|Esta vez no/.test(await texto('.ia-mensaje')) && (await texto('.ia-ficha')).length > 3, 'imagen ' + (i + 1) + ': tras responder salen el veredicto y la ficha');
      await clic(i === total - 1 ? 'Ver resultado' : 'Siguiente'); await esperar(60);
    }
    ok(await hayResultado(3000), 'sale el resultado');
    r = await texto('.tt-res');
    ok(r.includes(bien + ' de ' + total), 'cuenta ' + bien + ' de ' + total + ' aciertos');
    ok((await c.js(`document.querySelectorAll('.tg-barra').length`)) === 2 && (await c.js(`document.querySelectorAll('.tg-medidor').length`)) === 1, 'hay dos barras (reales e IA) y un medidor');
    await clic('Repetir el test'); await esperar(300);
    ok((await texto('.ia-mensaje')).includes('Imagen 1 de'), 'repetir empieza otra partida');
    await c.vista(390, 800, 'light', true);
    await abrir('ia-vs-cuadros-reales', 900);
    ok(await sinDesborde(), 'en móvil la imagen no desborda');
  }

  console.log('MÓVIL');
  await c.vista(390, 800, 'light', true);
  await abrir('test-de-velocidad-de-internet');
  ok(await sinDesborde(), 'sin desborde en móvil');
} finally { await cerrar(); }
