// Las 10 herramientas de PDF y documentos: se prueban con archivos reales y se verifican desde fuera (pdftotext, pdfinfo, qpdf, python-docx).
import { abrirChrome } from '../cdp.mjs';
import { preparar, capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const A = preparar(c);
const { fallos, ok, esperar, escribir, elegir, clic, texto, subir, entregas, esperarEntregas, reiniciarEntregas, estadoTexto, ext } = A;
const url = (s) => base + '/herramientas/' + s + '/';
const ir = async (s) => { await c.ir(url(s), 600); await reiniciarEntregas(); };
const procesar = async (boton) => { await reiniciarEntregas(); await clic(boton); return esperarEntregas(25000); };
const sinErrores = (t) => ok(c.consola().length === 0, `${t}: sin errores en la consola` + (c.consola().length ? ' → ' + c.consola().join(' | ') : ''));

try {
  await c.vista(1100, 900, 'light', false);

  // ============================================================ UNIR
  console.log('UNIR PDF');
  await ir('unir-pdf');
  ok(await c.js(`document.querySelector('#f-ejecutar').disabled`), 'sin archivos, el botón está desactivado');
  await subir('#f-archivos', [{ t: 'pdf', nombre: 'alfa.pdf', paginas: 2, prefijo: 'Alfa' }]);
  ok(await c.js(`document.querySelector('#f-ejecutar').disabled`), 'con un solo PDF sigue desactivado (hacen falta dos)');
  await subir('#f-archivos', [{ t: 'pdf', nombre: 'beta.pdf', paginas: 3, prefijo: 'Beta' }]);
  ok(!(await c.js(`document.querySelector('#f-ejecutar').disabled`)), 'con dos PDF se activa');
  ok((await texto('.herr-archivos')).includes('alfa.pdf') && (await texto('.herr-archivos')).includes('beta.pdf'), 'la lista muestra los dos archivos');
  await clic('↓'); // baja alfa: queda beta, alfa
  ok(await procesar('Unir los PDF'), 'se genera el PDF unido');
  let [u] = await entregas();
  ok(u.nombre === 'pdf-unido.pdf' && ext.qpdfValido(u.buf), 'el archivo es un PDF válido (qpdf --check)');
  ok(ext.paginas(u.buf) === 5, 'tiene 5 páginas (2 + 3)');
  const t1 = ext.pdftotext(u.buf);
  ok(t1.indexOf('Beta pagina 1') < t1.indexOf('Alfa pagina 1') && t1.indexOf('Beta pagina 1') >= 0, 'respeta el nuevo orden: primero Beta y luego Alfa');
  sinErrores('unir');

  // ---- PDF protegido
  const protegido = ext.python(`import subprocess,sys,base64,tempfile,os
from pypdf import PdfWriter
w=PdfWriter(); w.add_blank_page(200,200); w.encrypt('clave')
f=tempfile.mktemp(suffix='.pdf'); w.write(f); print(base64.b64encode(open(f,'rb').read()).decode())`).trim();
  await ir('unir-pdf');
  await subir('#f-archivos', [{ t: 'b64', nombre: 'secreto.pdf', mime: 'application/pdf', b64: protegido }, { t: 'pdf', nombre: 'otro.pdf', paginas: 1 }]);
  await clic('Unir los PDF'); await esperar(900);
  ok((await estadoTexto()).includes('contraseña'), 'un PDF con contraseña da un aviso claro: «' + (await estadoTexto()).slice(0, 70) + '»');
  await subir('#f-archivos', [{ t: 'b64', nombre: 'no-es-pdf.pdf', mime: 'application/pdf', b64: Buffer.from('esto no es un pdf').toString('base64') }]);
  await c.js(`[...document.querySelectorAll('.herr-archivos button')].filter(b => /Quitar secreto/.test(b.getAttribute('aria-label')))[0].click()`);
  await clic('Unir los PDF'); await esperar(900);
  ok((await estadoTexto()).includes('no se puede abrir como PDF'), 'un archivo que no es PDF también se explica: «' + (await estadoTexto()).slice(0, 70) + '»');

  // ============================================================ DIVIDIR
  console.log('DIVIDIR PDF');
  await ir('dividir-pdf');
  await subir('#f-archivos', [{ t: 'pdf', nombre: 'cinco.pdf', paginas: 5, prefijo: 'P' }]);
  ok((await texto('#f-info')).includes('5 páginas'), 'al elegir el archivo dice cuántas páginas tiene: «' + (await texto('#f-info')) + '»');
  ok(!(await c.js(`document.querySelector('#c-rangos').closest('.campo').hidden === false`)), 'el campo de rangos está oculto en el modo por defecto');
  ok(await procesar('Dividir el PDF'), 'divide una página por archivo');
  let es = await entregas();
  ok(es.length === 5 && es.every((e, i) => e.nombre === `cinco-pagina-${i + 1}.pdf` && ext.paginas(e.buf) === 1), 'salen 5 PDF de una página con nombres cinco-pagina-N.pdf');
  ok(ext.pdftotext(es[2].buf).includes('P pagina 3'), 'el tercero contiene la página 3');
  ok(await c.js(`[...document.querySelectorAll('button')].some(b => b.textContent.includes('ZIP'))`), 'aparece el botón de descargar todo en ZIP');
  await elegir('#c-modo', 'rangos');
  ok(await c.js(`document.querySelector('#c-rangos').closest('.campo').hidden === false`), 'en el modo por rangos aparece el campo de rangos');
  await escribir('#c-rangos', '1-2, 4');
  ok(await procesar('Dividir el PDF'), 'divide por rangos');
  es = await entregas();
  ok(es.length === 2 && ext.paginas(es[0].buf) === 2 && ext.paginas(es[1].buf) === 1 && es[0].nombre === 'cinco-paginas-1-2.pdf' && es[1].nombre === 'cinco-pagina-4.pdf', 'rangos «1-2, 4» → un PDF de 2 páginas y otro de 1');
  await escribir('#c-rangos', '1-9');
  await clic('Dividir el PDF'); await esperar(600);
  ok((await estadoTexto()).includes('solo tiene 5 páginas'), 'pedir más páginas de las que hay se explica: «' + (await estadoTexto()).slice(0, 80) + '»');
  await elegir('#c-modo', 'cada'); await escribir('#c-n', '2');
  ok(await procesar('Dividir el PDF'), 'divide cada 2 páginas');
  es = await entregas();
  ok(es.length === 3 && [2, 2, 1].every((n, i) => ext.paginas(es[i].buf) === n), 'cada 2 → archivos de 2, 2 y 1 páginas');
  sinErrores('dividir');

  // ============================================================ EXTRAER y ELIMINAR
  console.log('EXTRAER / ELIMINAR PÁGINAS');
  await ir('extraer-paginas-de-pdf');
  await subir('#f-archivos', [{ t: 'pdf', nombre: 'seis.pdf', paginas: 6, prefijo: 'S' }]);
  await escribir('#c-paginas', '5, 2-3');
  ok(await procesar('Extraer las páginas'), 'extrae páginas');
  [u] = await entregas();
  const tx = ext.pdftotext(u.buf);
  ok(ext.paginas(u.buf) === 3 && tx.indexOf('S pagina 5') < tx.indexOf('S pagina 2') && tx.indexOf('S pagina 2') < tx.indexOf('S pagina 3'), '«5, 2-3» → 3 páginas en ese orden');
  await escribir('#c-paginas', '8-');
  await clic('Extraer las páginas'); await esperar(500);
  ok((await estadoTexto()).includes('solo tiene 6'), 'una página inexistente avisa');
  await escribir('#c-paginas', '5-');
  ok(await procesar('Extraer las páginas'), '«5-» significa hasta el final');
  [u] = await entregas(); ok(ext.paginas(u.buf) === 2, '«5-» da las páginas 5 y 6');
  await escribir('#c-paginas', 'a-b');
  await clic('Extraer las páginas'); await esperar(500);
  ok((await estadoTexto()).includes('no es una página ni un rango'), 'texto inválido se explica');

  await ir('eliminar-paginas-de-pdf');
  await subir('#f-archivos', [{ t: 'pdf', nombre: 'seis.pdf', paginas: 6, prefijo: 'E' }]);
  await escribir('#c-paginas', '2-4');
  ok(await procesar('Eliminar las páginas'), 'elimina páginas');
  [u] = await entregas();
  const te = ext.pdftotext(u.buf);
  ok(ext.paginas(u.buf) === 3 && te.includes('E pagina 1') && te.includes('E pagina 5') && te.includes('E pagina 6') && !te.includes('E pagina 3'), 'quedan las páginas 1, 5 y 6');
  await escribir('#c-paginas', '1-6');
  await clic('Eliminar las páginas'); await esperar(500);
  ok((await estadoTexto()).includes('no quedaría ninguna'), 'no deja eliminar todo el documento');
  sinErrores('extraer/eliminar');

  // ============================================================ GIRAR
  console.log('GIRAR PDF');
  await ir('girar-pdf');
  await subir('#f-archivos', [{ t: 'pdf', nombre: 'tres.pdf', paginas: 3 }]);
  await escribir('#c-paginas', '2');
  ok(await procesar('Girar el PDF'), 'gira una página');
  [u] = await entregas();
  const rot = ext.python(`import sys; from pypdf import PdfReader
r=PdfReader(sys.argv[1]); print([p.get('/Rotate',0) for p in r.pages])`, ext.guardar(u.buf, '.pdf')).trim();
  ok(rot === '[0, 90, 0]', 'solo la página 2 queda girada 90° → ' + rot);
  await escribir('#c-paginas', ''); await elegir('#c-angulo', '270');
  ok(await procesar('Girar el PDF'), 'gira todo a la izquierda');
  [u] = await entregas();
  const rot2 = ext.python(`import sys; from pypdf import PdfReader
r=PdfReader(sys.argv[1]); print([p.get('/Rotate',0) for p in r.pages])`, ext.guardar(u.buf, '.pdf')).trim();
  ok(rot2 === '[270, 270, 270]', 'todas a 270° → ' + rot2);
  sinErrores('girar');

  // ============================================================ COMPRIMIR
  console.log('COMPRIMIR PDF');
  await ir('comprimir-pdf');
  await subir('#f-archivos', [{ t: 'pdfImagen', nombre: 'pesado.pdf', w: 1400, h: 1400, paginas: 2 }]);
  const original = await c.js(`document.querySelector('.herr-archivos .herr-chico').textContent`);
  await clic('Comprimir el PDF'); await esperar(2500);
  const e1 = await estadoTexto();
  ok(/De .* a .*menos|apenas se reduce/.test(e1), 'la compresión ligera informa del resultado: «' + e1.slice(0, 90) + '»');
  await elegir('#c-modo', 'fuerte'); await elegir('#c-calidad', '0.5'); await elegir('#c-res', '1');
  ok(await procesar('Comprimir el PDF'), 'la compresión fuerte genera un archivo');
  [u] = await entregas();
  const tam = await c.js(`(() => { const t = document.querySelector('.herr-estado--ok')?.innerText || ''; return t; })()`);
  ok(ext.paginas(u.buf) === 2 && ext.qpdfValido(u.buf), 'el PDF comprimido es válido y mantiene las 2 páginas');
  ok(/De .* a .*% menos/.test(tam) && u.buf.length < 400000, `reduce el tamaño de ${original} a ${(u.buf.length / 1024).toFixed(0)} KB (${tam.slice(0, 50)})`);
  sinErrores('comprimir');

  // ============================================================ PDF A IMAGEN
  console.log('PDF A JPG/PNG');
  await ir('pdf-a-jpg-png');
  await subir('#f-archivos', [{ t: 'pdf', nombre: 'doc.pdf', paginas: 3, prefijo: 'Img' }]);
  ok(await procesar('Convertir en imágenes'), 'convierte a JPG');
  es = await entregas();
  ok(es.length === 3 && es[0].nombre === 'doc-pagina-1.jpg' && es[0].buf[0] === 0xFF && es[0].buf[1] === 0xD8, '3 imágenes JPG (cabecera FFD8) con nombre doc-pagina-N.jpg');
  const dim = ext.python(`import sys; from PIL import Image
i=Image.open(sys.argv[1]); print(i.size[0], i.size[1], i.mode)`, ext.guardar(es[0].buf, '.jpg')).trim();
  ok(dim === '600 800 RGB', 'a calidad «Buena» una página de 300×400 pt mide 600×800 px → ' + dim);
  await elegir('#c-formato', 'png'); await elegir('#c-escala', '1'); await escribir('#c-paginas', '2');
  ok(await procesar('Convertir en imágenes'), 'convierte solo la página 2 a PNG');
  es = await entregas();
  ok(es.length === 1 && es[0].nombre === 'doc-pagina-2.png' && es[0].buf.slice(1, 4).toString() === 'PNG', 'una sola imagen PNG: doc-pagina-2.png');
  const dim2 = ext.python(`import sys; from PIL import Image
i=Image.open(sys.argv[1]); print(i.size[0], i.size[1])`, ext.guardar(es[0].buf, '.png')).trim();
  ok(dim2 === '300 400', 'a 72 ppp mide 300×400 px → ' + dim2);
  // contenido real: la página debe tener tinta (no salir en blanco)
  const tinta = ext.python(`import sys; from PIL import Image
i=Image.open(sys.argv[1]).convert('L'); print(sum(1 for p in i.getdata() if p < 128) > 50)`, ext.guardar(es[0].buf, '.png')).trim();
  ok(tinta === 'True', 'la imagen contiene el texto dibujado (no sale en blanco)');
  sinErrores('pdf a imagen');

  // ============================================================ IMÁGENES A PDF
  console.log('JPG/PNG A PDF');
  await ir('jpg-png-a-pdf');
  await subir('#f-archivos', [{ t: 'imagen', nombre: 'ancha.png', mime: 'image/png', w: 400, h: 200 }, { t: 'imagen', nombre: 'alta.jpg', mime: 'image/jpeg', w: 200, h: 400 }, { t: 'imagen', nombre: 'web.webp', mime: 'image/webp', w: 300, h: 300 }]);
  ok(await procesar('Crear el PDF'), 'crea el PDF de A4');
  [u] = await entregas();
  const inf = ext.pdfinfo(u.buf);
  ok(ext.paginas(u.buf) === 3 && ext.qpdfValido(u.buf), '3 imágenes → 3 páginas');
  const pags = ext.python(`import sys; from pypdf import PdfReader
r=PdfReader(sys.argv[1]); print([ (round(float(p.mediabox.width)), round(float(p.mediabox.height)), len(p.images)) for p in r.pages])`, ext.guardar(u.buf, '.pdf')).trim();
  ok(pags === '[(842, 595, 1), (595, 842, 1), (595, 842, 1)]', 'la apaisada va en A4 horizontal y las demás en vertical, una imagen por página → ' + pags);
  await elegir('#c-pagina', 'imagen'); await elegir('#c-margen', '0');
  ok(await procesar('Crear el PDF'), 'crea el PDF a tamaño de imagen');
  [u] = await entregas();
  const pags2 = ext.python(`import sys; from pypdf import PdfReader
r=PdfReader(sys.argv[1]); print([ (round(float(p.mediabox.width)), round(float(p.mediabox.height)) ) for p in r.pages])`, ext.guardar(u.buf, '.pdf')).trim();
  ok(pags2 === '[(400, 200), (200, 400), (300, 300)]', 'cada página mide como su imagen → ' + pags2);
  await subir('#f-archivos', [{ t: 'b64', nombre: 'texto.txt', mime: 'text/plain', b64: Buffer.from('hola').toString('base64') }]);
  ok((await estadoTexto()).includes('no es de un tipo admitido'), 'un archivo que no es imagen se rechaza con explicación');
  sinErrores('imágenes a pdf');

  // ============================================================ PDF A WORD
  console.log('PDF A WORD');
  await ir('pdf-a-word');
  const pagina1 = [{ t: 'Informe de ventas', size: 26, y: 780, neg: true }, { t: 'Este es el primer parrafo del informe con varias palabras', size: 11, y: 740 }, { t: 'que continua en la segunda linea del mismo parrafo.', size: 11, y: 726 },
    { t: 'Segundo parrafo separado por un hueco mayor.', size: 11, y: 690 }, { t: '- Primera vineta importante', size: 11, y: 660 }, { t: '- Segunda vineta importante', size: 11, y: 646 }];
  const pagina2 = [{ t: 'Segunda pagina del documento', size: 11, y: 780 }];
  await subir('#f-archivos', [{ t: 'pdfDiseno', nombre: 'informe.pdf', paginas: [pagina1, pagina2] }]);
  ok(await procesar('Convertir a Word'), 'convierte el PDF a Word');
  [u] = await entregas();
  ok(u.nombre === 'informe.docx', 'el archivo se llama informe.docx');
  const fdocx = ext.guardar(u.buf, '.docx');
  const rd = JSON.parse(ext.python(`import sys, json; from docx import Document
d=Document(sys.argv[1]); print(json.dumps([[p.style.name, p.text] for p in d.paragraphs], ensure_ascii=False))`, fdocx));
  ok(rd[0][0] === 'Heading 1' && rd[0][1] === 'Informe de ventas', 'python-docx abre el archivo y el título es un «Heading 1»: ' + JSON.stringify(rd[0]));
  ok(rd.some(p => p[1] === 'Este es el primer parrafo del informe con varias palabras que continua en la segunda linea del mismo parrafo.'), 'las dos líneas del mismo párrafo se unen en uno');
  ok(rd.some(p => p[1] === 'Segundo parrafo separado por un hueco mayor.'), 'el hueco mayor separa párrafos');
  ok(rd.filter(p => p[1].startsWith('•')).length === 2, 'las dos viñetas se conservan como elementos de lista');
  ok(rd.some(p => p[1] === 'Segunda pagina del documento'), 'incluye el texto de la segunda página');
  const brk = ext.python(`import sys, zipfile; print('pageBreakBefore' in zipfile.ZipFile(sys.argv[1]).read('word/document.xml').decode())`, fdocx).trim();
  ok(brk === 'True', 'hay un salto de página antes de la segunda página');
  // LibreOffice lo abre y lo convierte (señal de que es un .docx válido para otros programas)
  const lo = ext.python(`import subprocess, sys, os, tempfile
o=tempfile.mkdtemp(); r=subprocess.run(['soffice','--headless','--convert-to','pdf','--outdir',o,sys.argv[1]],capture_output=True,timeout=120)
f=[x for x in os.listdir(o) if x.endswith('.pdf')]; print(len(f)==1 and os.path.getsize(os.path.join(o,f[0]))>1000)`, fdocx).trim();
  ok(lo === 'True', 'LibreOffice abre el .docx generado y lo convierte a PDF');
  await ir('pdf-a-word');
  await subir('#f-archivos', [{ t: 'pdfSolo-imagen', nombre: 'escaneo.pdf' }]);
  await clic('Convertir a Word'); await esperar(1500);
  ok((await estadoTexto()).includes('OCR'), 'un PDF escaneado explica que no hay OCR: «' + (await estadoTexto()).slice(0, 60) + '»');
  sinErrores('pdf a word');

  // ============================================================ WORD A PDF
  console.log('WORD A PDF');
  const docxB64 = ext.python(`import base64, tempfile, io
from docx import Document
d=Document(); d.add_heading('Título del trabajo', 1)
d.add_paragraph('Ñandú, café, canción y precio: 25 € — «comillas» y “otras”.')
d.add_paragraph('Elemento de lista uno', style='List Bullet')
t=d.add_table(rows=2, cols=2); t.cell(0,0).text='A1'; t.cell(0,1).text='B1'; t.cell(1,0).text='A2'; t.cell(1,1).text='B2'
for i in range(90): d.add_paragraph('Línea de relleno número %d para comprobar que el texto salta de página.' % i)
b=io.BytesIO(); d.save(b); print(base64.b64encode(b.getvalue()).decode())`).trim();
  await ir('word-a-pdf');
  await subir('#f-archivos', [{ t: 'b64', nombre: 'trabajo.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', b64: docxB64 }]);
  ok(await procesar('Convertir a PDF'), 'convierte el .docx a PDF');
  [u] = await entregas();
  const tp = ext.pdftotext(u.buf);
  ok(u.nombre === 'trabajo.pdf' && ext.qpdfValido(u.buf), 'el PDF es válido y se llama trabajo.pdf');
  ok(tp.includes('Título del trabajo') && tp.includes('Ñandú, café, canción y precio: 25 €'), 'conserva acentos, ñ y el euro');
  ok(tp.includes('A1') && tp.includes('B2') && tp.includes('Elemento de lista uno'), 'incluye la tabla y la lista');
  ok(ext.paginas(u.buf) >= 2 && tp.includes('número 89'), 'el texto largo pasa a una segunda página y llega hasta el final (' + ext.paginas(u.buf) + ' páginas)');
  await ir('word-a-pdf');
  await subir('#f-archivos', [{ t: 'b64', nombre: 'viejo.docx', mime: 'application/msword', b64: Buffer.from('no es un zip').toString('base64') }]);
  await clic('Convertir a PDF'); await esperar(1000);
  ok((await estadoTexto()).includes('.doc antiguo'), 'un archivo que no se puede abrir sugiere guardarlo como .docx');
  sinErrores('word a pdf');
  await capturar(c, 'pdf-unir', true);
} catch (e) { console.log('  ✗ EXCEPCIÓN: ' + e.message + '\n' + (e.stack || '').split('\n').slice(1, 4).join('\n')); fallos.push(e.message); }
finally { ext.limpiar(); await c.cerrar(); }
console.log(fallos.length ? `\n${fallos.length} fallos` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
