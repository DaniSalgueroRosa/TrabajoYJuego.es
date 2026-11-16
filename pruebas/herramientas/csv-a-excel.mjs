// Conversor de CSV a Excel: se pega un CSV, se abre un archivo en Windows-1252 y se comprueba el .xlsx descargado abriéndolo con openpyxl (fuera del navegador).
import { abrirChrome } from '../cdp.mjs';
import { preparar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const A = preparar(c);
const { fallos, ok, esperar, clic, texto, subir, escribir, elegir, marcar, k, ext } = A;
const estadoTexto = () => c.js(`[...document.querySelectorAll('.herr-estado:not([hidden])')].map(e => e.innerText).join(' | ')`);
const ir = async (s) => { await c.ir(base + '/herramientas/' + s + '/', 600); };
const sinErrores = (t) => ok(c.consola().length === 0, `${t}: sin errores en la consola` + (c.consola().length ? ' → ' + c.consola().join(' | ') : ''));
const capturar = () => c.js(`(() => { window.__d = null; TH.descargar = (datos, nombre) => { window.__d = { nombre, blob: datos }; }; })()`);
const descargado = async () => {
  if (!(await A.hastaQue(() => c.js(`!!window.__d`), 8000))) return null;
  const r = await c.js(`(async () => { const u = new Uint8Array(await window.__d.blob.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return { nombre: window.__d.nombre, b64: btoa(s) }; })()`);
  return { nombre: r.nombre, buf: Buffer.from(r.b64, 'base64') };
};
const leerXlsx = (buf) => JSON.parse(ext.python(`import sys, json, openpyxl
wb = openpyxl.load_workbook(sys.argv[1]); ws = wb.active
def v(c):
    x = c.value
    return x.isoformat() if hasattr(x, 'isoformat') else x
print(json.dumps({'hojas': wb.sheetnames, 'filas': [[v(c) for c in f] for f in ws.iter_rows()], 'negrita': ws['A1'].font.b, 'fija': ws.freeze_panes, 'filtro': ws.auto_filter.ref, 'tipos': [[c.data_type for c in f] for f in ws.iter_rows()]}))`, ext.guardar(buf, '.xlsx')));

try {
  await c.vista(1100, 900, 'light', false);
  console.log('CONVERSOR DE CSV A EXCEL');
  await ir('conversor-csv-a-excel');
  ok((await c.js(`document.querySelectorAll('#herr-carga').length`)) === 0, 'desaparece el mensaje «Cargando la herramienta…»');
  await capturar();
  await clic('Descargar Excel (.xlsx)');
  ok((await estadoTexto()).includes('Pega primero un CSV'), 'sin datos, explica qué hacer: «' + (await estadoTexto()) + '»');

  await clic('Probar con un ejemplo'); await esperar(200);
  ok((await k('filas')) === '4' && (await k('columnas')) === '5', `ejemplo: 4 filas y 5 columnas (${await k('filas')}/${await k('columnas')})`);
  ok((await k('numeros')) === '6' && (await k('fechas')) === '3' && (await k('textos')) === '6' && (await k('vacias')) === '0', `6 números, 3 fechas y 6 textos (${await k('numeros')}/${await k('fechas')}/${await k('textos')})`);
  const avisos = await texto('.herr-salida');
  ok(avisos.includes('detectado: punto y coma') && avisos.includes('decimales se leen con coma'), 'detecta el punto y coma y los decimales con coma');
  ok((await texto('.csvx-tabla')).includes('Camiseta básica') && (await texto('td.csvx-num')).includes('12'), 'muestra la vista previa de las filas');
  ok((await texto('td.csvx-fecha')).trim() === '15/03/2026', 'la vista previa enseña las fechas como fecha: «' + (await texto('td.csvx-fecha')).trim() + '»');
  ok((await texto('#t-salida')) === '' || (await c.js(`document.querySelector('#t-salida').value`)).split('\n')[3].startsWith('Gorra; edición limitada\t25\t12,00'), 'el cuadro de texto separa por tabuladores y conserva el campo entre comillas');

  await clic('Descargar Excel (.xlsx)');
  const d = await descargado();
  ok(d && d.nombre === 'datos.xlsx' && d.buf.slice(0, 2).toString() === 'PK', 'descarga datos.xlsx (un ZIP): ' + (d && d.nombre));
  const x = leerXlsx(d.buf);
  ok(x.hojas[0] === 'Datos' && x.filas.length === 4, 'la hoja se llama Datos y tiene 4 filas');
  ok(x.negrita && x.fija === 'A2' && x.filtro === 'A1:E4', `títulos en negrita, fila fija y filtro (${x.negrita}/${x.fija}/${x.filtro})`);
  ok(x.filas[1][0] === 'Camiseta básica' && x.filas[1][1] === 12 && x.filas[1][2] === 19.9, 'números reales: 12 y 19,90 → ' + JSON.stringify(x.filas[1].slice(0, 3)));
  ok(x.filas[1][4] === '007' && x.filas[2][4] === '010' && x.filas[3][4] === '0042', 'los códigos con ceros siguen siendo texto');
  ok(x.filas[1][3].startsWith('2026-03-15') && x.filas[3][3].startsWith('2026-03-17'), 'las fechas de los dos formatos son fechas de Excel: ' + x.filas[1][3] + ' / ' + x.filas[3][3]);
  ok(x.filas[3][0] === 'Gorra; edición limitada', 'el campo con punto y coma entre comillas se queda en una celda');
  ok((await texto('.herr-estado--ok')).includes('Listo: datos.xlsx'), 'confirma la descarga: «' + (await texto('.herr-estado--ok')).slice(0, 50) + '»');
  sinErrores('pegar y descargar');

  // ---- opciones: sin títulos, sin convertir números, sin fechas, nombre de hoja
  await marcar('#c-cabecera', false); await elegir('#c-numeros', 'texto'); await marcar('#c-fechas', false); await escribir('#c-hoja', 'Ventas: 2026/1');
  ok((await k('numeros')) === '0' && (await k('fechas')) === '0', 'sin convertir: 0 números y 0 fechas');
  await capturar(); await clic('Descargar Excel (.xlsx)');
  const d2 = await descargado(), x2 = leerXlsx(d2.buf);
  ok(x2.hojas[0] === 'Ventas  2026 1' || !/[:\/]/.test(x2.hojas[0]), 'el nombre de la hoja se limpia de caracteres no válidos: «' + x2.hojas[0] + '»');
  ok(x2.filas[1][1] === '12' && x2.tipos[1][1] === 's' && x2.filas[1][3] === '15/03/2026', 'todo queda como texto');
  ok(!x2.negrita && !x2.fija && !x2.filtro, 'sin títulos no hay negrita, fila fija ni filtro');

  // ---- separador elegido a mano y coma decimal
  await ir('conversor-csv-a-excel'); await capturar();
  await escribir('#t-entrada', 'a|b\n1,5|2.250,75\nx|3');
  await elegir('#c-sep', '|');
  ok((await texto('.herr-salida')).includes('elegido: barra vertical'), 'respeta el separador elegido');
  ok((await k('numeros')) === '3', 'con coma decimal detectada, 1,5, 2.250,75 y 3 son números (' + (await k('numeros')) + ')');
  await clic('Descargar Excel (.xlsx)');
  const x3 = leerXlsx((await descargado()).buf);
  ok(x3.filas[1][0] === 1.5 && x3.filas[1][1] === 2250.75 && x3.filas[2][1] === 3, 'valores: ' + JSON.stringify(x3.filas.slice(1)));

  // ---- fórmulas y filas irregulares
  await ir('conversor-csv-a-excel'); await capturar();
  await escribir('#t-entrada', 'a,b,c\n=1+1,+34600111222,@x\n1,2');
  const av = await texto('.herr-salida');
  ok(/3 celdas empiezan por =, \+ o @/.test(av) && av.includes('Una fila tiene un número de columnas distinto'), 'avisa de las celdas con fórmula y de la fila corta');
  await clic('Descargar Excel (.xlsx)');
  const x4 = leerXlsx((await descargado()).buf);
  ok(x4.filas[1][0] === '=1+1' && x4.tipos[1][0] === 's' && x4.filas[1][1] === '+34600111222' && x4.filas[2][2] === null, 'las fórmulas se guardan como texto y la celda que falta queda vacía: ' + JSON.stringify(x4.filas[1]));

  // ---- error de comillas
  await ir('conversor-csv-a-excel'); await capturar();
  await escribir('#t-entrada', 'a,b\n"sin cerrar,2');
  ok((await texto('.herr-salida')).includes('no se cierran'), 'avisa de las comillas sin cerrar');
  await clic('Descargar Excel (.xlsx)');
  ok((await texto('.herr-estado--error')).includes('no se cierran') && !(await c.js(`!!window.__d`)), 'el botón da el mismo error y no descarga nada');

  // ---- archivo en Windows-1252
  const cp = ext.python(`import base64; print(base64.b64encode('titulo;ciudad\\nMª José;Logroño\\nPeña;Sevilla\\n'.encode('cp1252')).decode())`).trim();
  await ir('conversor-csv-a-excel'); await capturar();
  await subir('#csvx-archivo', [{ t: 'b64', nombre: 'ventas-2026.csv', mime: 'text/csv', b64: cp }]); await esperar(400);
  ok((await c.js(`document.querySelector('#t-entrada').value`)).includes('Mª José;Logroño'), 'un CSV en Windows-1252 se lee con tildes y ñ: «' + (await c.js(`document.querySelector('#t-entrada').value`)).replace(/\n/g, ' ⏎ ') + '»');
  await clic('Descargar Excel (.xlsx)');
  const d5 = await descargado(), x5 = leerXlsx(d5.buf);
  ok(d5.nombre === 'ventas-2026.xlsx' && x5.filas[1][0] === 'Mª José' && x5.filas[2][1] === 'Sevilla', 'el archivo toma el nombre del CSV y conserva los acentos: ' + d5.nombre);

  // ---- el mismo archivo UTF-8 con BOM
  const u8 = ext.python(`import base64; print(base64.b64encode('\\ufefft;u\\nÁlvaro;ñu\\n'.encode('utf-8')).decode())`).trim();
  await ir('conversor-csv-a-excel'); await capturar();
  await subir('#csvx-archivo', [{ t: 'b64', nombre: 'u.csv', mime: 'text/csv', b64: u8 }]); await esperar(400);
  ok((await c.js(`document.querySelector('#t-entrada').value`)).startsWith('t;u'), 'un CSV en UTF-8 con BOM se lee sin el BOM');
  await clic('Descargar Excel (.xlsx)');
  const x6 = leerXlsx((await descargado()).buf);
  ok(x6.filas[0][0] === 't' && x6.filas[1][0] === 'Álvaro', 'el BOM no se cuela en la primera celda: ' + JSON.stringify(x6.filas[0]));
  sinErrores('archivos');
} catch (e) { console.log('  ✗ EXCEPCIÓN: ' + e.message + '\n' + (e.stack || '').split('\n').slice(1, 4).join('\n')); fallos.push(e.message); }
finally { ext.limpiar(); await c.cerrar(); }
console.log(fallos.length ? `\n${fallos.length} fallos` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
