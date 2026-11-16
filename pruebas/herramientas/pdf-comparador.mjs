// Comparador de documentos PDF: se prueba con PDF reales creados en el navegador (dos versiones de un contrato, iguales, un escaneo y mayúsculas).
import { abrirChrome } from '../cdp.mjs';
import { preparar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const A = preparar(c);
const { fallos, ok, esperar, clic, texto, subir, estadoTexto, ext } = A;
const ir = async (s) => { await c.ir(base + '/herramientas/' + s + '/', 600); };
const sinErrores = (t) => ok(c.consola().length === 0, `${t}: sin errores en la consola` + (c.consola().length ? ' → ' + c.consola().join(' | ') : ''));
const esperarResultado = async (ms = 25000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await c.js(`!!document.querySelector('[data-k="similitud"]')`)) return true; if ((await estadoTexto()).match(/no tiene texto|contraseña|no se puede/)) return false; await esperar(100); } return false; };
const k = (clave) => c.js(`document.querySelector('[data-k="${clave}"]') ? +document.querySelector('[data-k="${clave}"]').dataset.v : null`);

const v1 = [[{ t: 'Contrato de servicios', size: 20, y: 780, neg: true }, { t: 'El precio es de 100 euros al mes', y: 740 }, { t: 'La duracion es de 12 meses', y: 720 }], [{ t: 'Clausula final de rescision', y: 780 }]];
const v2 = [[{ t: 'Contrato de servicios', size: 20, y: 780, neg: true }, { t: 'El precio es de 120 euros al mes', y: 740 }, { t: 'La duracion es de 12 meses', y: 720 }], [{ t: 'Clausula final de rescision', y: 780 }, { t: 'Nueva clausula de confidencialidad', y: 760 }]];

try {
  await c.vista(1100, 900, 'light', false);
  console.log('COMPARADOR DE PDF');
  await ir('comparador-de-pdf');
  ok(await c.js(`document.querySelector('#f-ejecutar').disabled`), 'sin archivos, el botón está desactivado');
  await subir('#f-archivos', [{ t: 'pdfDiseno', nombre: 'contrato-v1.pdf', paginas: v1 }]);
  ok(await c.js(`document.querySelector('#f-ejecutar').disabled`), 'con un solo PDF sigue desactivado');
  ok((await texto('#f-info')).includes('Falta un segundo PDF'), 'avisa de que falta el segundo: «' + (await texto('#f-info')) + '»');
  await subir('#f-archivos', [{ t: 'pdfDiseno', nombre: 'contrato-v2.pdf', paginas: v2 }]);
  ok(!(await c.js(`document.querySelector('#f-ejecutar').disabled`)), 'con dos PDF se activa');
  ok((await texto('#f-info')).includes('Original: contrato-v1.pdf'), 'indica cuál es el original y cuál el modificado');
  await clic('Comparar los PDF');
  ok(await esperarResultado(), 'termina la comparación');
  ok((await k('iguales')) === 3 && (await k('eliminadas')) === 1 && (await k('anadidas')) === 2, `3 iguales, 1 eliminada y 2 añadidas (${await k('iguales')}/${await k('eliminadas')}/${await k('anadidas')})`);
  ok(Math.abs((await k('similitud')) - 600 / 9) < 0.01, 'el parecido es 66,7 % (' + (await k('similitud')) + ')');
  ok((await k('paginas-a')) === 2 && (await k('paginas-b')) === 2, 'cuenta las páginas de cada PDF');
  ok((await texto('.dif del')).trim() === '100' && (await texto('.dif ins')).trim() === '120', 'marca solo las palabras distintas: tachado 100 y subrayado 120');
  const vista = await texto('.dif');
  ok(vista.includes('Nueva clausula de confidencialidad') && vista.includes('p. 2'), 'la línea añadida indica la página 2');
  const tabla = await texto('.herr-tabla');
  ok(tabla.includes('contrato-v1.pdf') && tabla.includes('Páginas') && tabla.includes('Igual'), 'muestra la tabla con los datos de los dos archivos');
  ok(await c.js(`[...document.querySelectorAll('button')].some(b => b.textContent === 'Descargar el informe')`) && await c.js(`[...document.querySelectorAll('button')].some(b => b.textContent === 'Copiar las diferencias')`), 'ofrece copiar y descargar el informe');
  sinErrores('comparar versiones');

  // ---- orden invertido: lo eliminado y lo añadido se intercambian
  await c.js(`[...document.querySelectorAll('.herr-archivos button')].filter(b => /Bajar contrato-v1/.test(b.getAttribute('aria-label')))[0].click()`);
  await clic('Comparar los PDF'); await esperar(1500);
  ok((await k('anadidas')) === 1 && (await k('eliminadas')) === 2, 'al cambiar el orden se invierten las añadidas y las eliminadas (' + (await k('anadidas')) + '/' + (await k('eliminadas')) + ')');

  // ---- idénticos
  await ir('comparador-de-pdf');
  await subir('#f-archivos', [{ t: 'pdfDiseno', nombre: 'a.pdf', paginas: v1 }, { t: 'pdfDiseno', nombre: 'b.pdf', paginas: v1 }]);
  await clic('Comparar los PDF');
  ok(await esperarResultado(), 'compara dos PDF iguales');
  ok((await texto('[data-k="identicos"]')).includes('idéntico') && (await k('similitud')) === 100 && (await k('eliminadas')) === 0, 'dice que el texto es idéntico (100 %)');
  ok(!(await c.js(`!!document.querySelector('.dif')`)), 'no dibuja una lista de diferencias vacía');

  // ---- mayúsculas
  const mA = [[{ t: 'HOLA MUNDO', y: 780 }, { t: 'segunda linea', y: 760 }]], mB = [[{ t: 'hola mundo', y: 780 }, { t: 'segunda linea', y: 760 }]];
  await ir('comparador-de-pdf');
  await subir('#f-archivos', [{ t: 'pdfDiseno', nombre: 'a.pdf', paginas: mA }, { t: 'pdfDiseno', nombre: 'b.pdf', paginas: mB }]);
  await clic('Comparar los PDF'); await esperarResultado();
  ok((await k('eliminadas')) === 1 && (await k('anadidas')) === 1, 'por defecto distingue mayúsculas de minúsculas');
  await c.js(`document.querySelector('#c-mayus').click()`);
  await clic('Comparar los PDF'); await esperar(1500);
  ok((await k('eliminadas')) === 0 && (await k('iguales')) === 2, 'con «No distinguir mayúsculas» las dos líneas coinciden');

  // ---- escaneo sin texto
  await ir('comparador-de-pdf');
  await subir('#f-archivos', [{ t: 'pdfSolo-imagen', nombre: 'escaneo.pdf' }, { t: 'pdfDiseno', nombre: 'texto.pdf', paginas: v1 }]);
  await clic('Comparar los PDF'); await esperar(2500);
  ok((await estadoTexto()).includes('no tiene texto que se pueda seleccionar'), 'un PDF escaneado se explica: «' + (await estadoTexto()).slice(0, 80) + '»');

  // ---- PDF con contraseña y archivo que no es PDF
  const protegido = ext.python(`import base64,tempfile
from pypdf import PdfWriter
w=PdfWriter(); w.add_blank_page(200,200); w.encrypt('clave')
f=tempfile.mktemp(suffix='.pdf'); w.write(f); print(base64.b64encode(open(f,'rb').read()).decode())`).trim();
  await ir('comparador-de-pdf');
  await subir('#f-archivos', [{ t: 'b64', nombre: 'secreto.pdf', mime: 'application/pdf', b64: protegido }, { t: 'pdfDiseno', nombre: 'texto.pdf', paginas: v1 }]);
  await clic('Comparar los PDF'); await esperar(2000);
  ok((await estadoTexto()).includes('contraseña'), 'un PDF con contraseña da un aviso claro: «' + (await estadoTexto()).slice(0, 70) + '»');
  sinErrores('casos de error');
} catch (e) { console.log('  ✗ EXCEPCIÓN: ' + e.message + '\n' + (e.stack || '').split('\n').slice(1, 4).join('\n')); fallos.push(e.message); }
finally { ext.limpiar(); await c.cerrar(); }
console.log(fallos.length ? `\n${fallos.length} fallos` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
