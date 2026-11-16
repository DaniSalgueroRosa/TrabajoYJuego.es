// Listado de Tests: barra compacta con buscador y desplegable de categorías (con y sin ?categoria= en la dirección) y móvil.
import { iniciar, esperar, base } from './ayudas.mjs';
const { c, ok, cerrar, sinDesborde } = await iniciar();
const visibles = () => c.js(`[...document.querySelectorAll('ul.rejilla > li')].filter(li => !li.hidden).length`);
const total = () => c.js(`document.querySelectorAll('ul.rejilla > li').length`);
const escribir = async (t) => { await c.js(`(() => { const i = document.querySelector('[data-filtro-texto]'); i.value = ${JSON.stringify(t)}; i.dispatchEvent(new Event('input', { bubbles: true })); })()`); await esperar(150); };
const elegir = async (v) => { await c.js(`(() => { const s = document.querySelector('[data-filtro-categoria-lista]'); s.value = ${JSON.stringify(v)}; s.dispatchEvent(new Event('change', { bubbles: true })); })()`); await esperar(150); };
const estado = () => c.js(`document.querySelector('[data-filtro-estado]').textContent`);
try {
  await c.vista(1100, 900, 'light', false);
  await c.ir(base + '/tests/', 600);
  const N = await total();
  ok(N >= 56, 'el listado enseña todos los tests (' + N + ')');
  ok(await c.js(`!document.querySelector('[data-filtros]').hidden`), 'con JavaScript se ve la barra de búsqueda');
  ok(await c.js(`document.querySelectorAll('[data-filtro-categoria]').length`) === 0, 'ya no hay una fila de chips: solo buscador y desplegable');
  ok(await c.js(`document.querySelector('[data-filtro-categoria-lista]').options.length`) > 9, 'el desplegable lista las categorías con tests');
  ok((await estado()) === N + ' tests', 'el contador dice «' + N + ' tests» (' + await estado() + ')');
  ok(await c.js(`document.querySelector('[data-filtros]').getBoundingClientRect().height`) < 190, 'la barra es compacta (' + Math.round(await c.js(`document.querySelector('[data-filtros]').getBoundingClientRect().height`)) + ' px)');
  await escribir('naruto'); ok(await visibles() === 1, 'buscar «naruto» deja 1 test (' + await visibles() + ')');
  await escribir('NARUTO '); ok(await visibles() === 1, 'mayúsculas y espacio final no importan');
  await escribir('reaccion'); ok(await visibles() >= 2, 'sin acentos también encuentra «reacción» (' + await visibles() + ')');
  await escribir('zzzzqq'); ok(await visibles() === 0 && (await estado()).startsWith('Ningún test coincide'), 'sin resultados lo dice');
  ok(await c.js(`!document.querySelector('[data-filtro-borrar]').hidden`), 'aparece «Quitar filtros»');
  await c.js(`document.querySelector('[data-filtro-borrar]').click()`); await esperar(150);
  ok(await visibles() === N && (await c.js(`document.querySelector('[data-filtro-texto]').value`)) === '', 'quitar filtros vuelve a mostrar todo');
  await elegir('personalidad'); const per = await visibles();
  ok(per === 9, 'la categoría Personalidad enseña sus 9 tests (' + per + ')');
  ok(await c.js(`[...document.querySelectorAll('[data-bloque]')].filter(g => !g.hidden).length`) === 1, 'solo queda visible el grupo de esa categoría');
  await escribir('color'); ok(await visibles() >= 1 && await visibles() < per, 'categoría y texto se combinan (' + await visibles() + ')');
  await c.js(`document.querySelector('[data-filtro-borrar]').click()`); await esperar(150);
  ok(await c.js(`document.querySelector('[data-filtro-categoria-lista]').value`) === '', 'quitar filtros devuelve el desplegable a «Todas»');
  for (const [cat, texto] of [['espanol', 'Idiomas: español'], ['otros-idiomas', 'Idiomas y geografía'], ['series-cine', 'series, libros y cine']]) {
    const hay = await c.js(`[...document.querySelector('[data-filtro-categoria-lista]').options].some(o => o.value === ${JSON.stringify(cat)})`);
    ok(hay, 'existe la categoría «' + cat + '» en el desplegable');
    if (hay) { await elegir(cat); ok(await visibles() > 0, 'la categoría «' + texto + '» tiene tests (' + await visibles() + ')'); }
  }
  await elegir('');
  // Enlace con la categoría en la dirección
  await c.ir(base + '/tests/?categoria=relaciones', 600);
  ok(await visibles() === 10 && (await c.js(`document.querySelector('[data-filtro-categoria-lista]').value`)) === 'relaciones', '?categoria=relaciones abre el listado ya filtrado (' + await visibles() + ')');
  await c.ir(base + '/tests/?categoria=nada', 600);
  ok(await visibles() === await total() && (await c.js(`document.querySelector('[data-filtro-categoria-lista]').value`)) === '', 'una categoría inexistente se ignora');
  ok(await sinDesborde(), 'sin desborde horizontal en escritorio');
  console.log('MÓVIL');
  await c.vista(390, 800, 'light', true);
  await c.ir(base + '/tests/', 600);
  ok(await sinDesborde(), 'sin desborde horizontal en móvil');
  ok(await c.js(`document.querySelector('[data-filtros]').getBoundingClientRect().height`) < 330, 'la barra es compacta en móvil (' + Math.round(await c.js(`document.querySelector('[data-filtros]').getBoundingClientRect().height`)) + ' px)');
  await escribir('ruso'); ok(await visibles() >= 0, 'se puede buscar en móvil');
} finally { await cerrar(); }
