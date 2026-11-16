// Generador de calendarios y planificador semanal: rejilla, semanas ISO y festivos comparados con Python (calendar, dateutil),
// PDF comprobado con poppler (pdfinfo/pdftotext/qpdf) e imagen con Pillow.
import { execFileSync } from 'node:child_process';
import { abrirChrome } from '../cdp.mjs';
import { preparar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const A = preparar(c);
const { fallos, ok, esperar, escribir, elegir, marcar, clic, texto, valor, k, kt, hastaQue, entregas, esperarEntregas, reiniciarEntregas, estadoTexto, ext } = A;
const ir = async (s) => { await c.ir(`${base}/herramientas/${s}/`, 500); await reiniciarEntregas(); await hastaQue(() => c.js(`!document.querySelector('#herr-carga') && !!document.querySelector('#herr input, #herr select')`)); await esperar(150); };
const sinErrores = (t) => ok(c.consola().length === 0, `${t}: sin errores en la consola` + (c.consola().length ? ' → ' + c.consola().join(' | ') : ''));
const py = (codigo, ...args) => JSON.parse(ext.python(codigo, ...args));
const crear = async (boton) => { await reiniciarEntregas(); await clic(boton); return (await esperarEntregas(20000)) ? (await entregas())[0] : null; };
const crudo = (buf) => execFileSync('pdftotext', ['-raw', ext.guardar(buf, '.pdf'), '-'], { encoding: 'utf8' });
const fichaPdf = (buf) => { const i = ext.pdfinfo(buf); return { paginas: +/Pages:\s+(\d+)/.exec(i)[1], tam: /Page size:\s+([\d.]+) x ([\d.]+)/.exec(i).slice(1).map(Number) }; };
const pixeles = (buf, puntos) => py(`import sys, json
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); pts = json.loads(sys.argv[2])
print(json.dumps({'tam': list(im.size), 'px': [list(im.getpixel((x, y))) for x, y in pts]}))`, ext.guardar(buf, '.png'), JSON.stringify(puntos));

const PY_CAL = `import sys, json, calendar
from datetime import date, timedelta
from dateutil.easter import easter
a, primero = int(sys.argv[1]), int(sys.argv[2])
cal = calendar.Calendar(firstweekday=primero)
meses = {}
for m in range(1, 13):
    filas = cal.monthdayscalendar(a, m)
    ini = date(a, m, 1); lun = ini - timedelta(days=ini.weekday())
    meses[m] = {'filas': filas, 'iso': [str((lun + timedelta(days=7 * r)).isocalendar()[1]) for r in range(len(filas))]}
fest = sorted({(d.month, d.day) for d in [date(a, 1, 1), date(a, 1, 6), date(a, 5, 1), date(a, 8, 15), date(a, 10, 12), date(a, 11, 1), date(a, 12, 6), date(a, 12, 8), date(a, 12, 25), easter(a) - timedelta(days=2)]})
print(json.dumps({'meses': meses, 'fest': fest, 'sem': date(a, 12, 28).isocalendar()[1]}))`;
const rejilla = () => c.js(`[...document.querySelectorAll('.cal-previa table.cal-mes')].map(t => ({ mes: +t.dataset.mes, caption: t.caption.textContent, filas: [...t.tBodies[0].rows].map(r => ({ sem: r.querySelector('th.cal-sem') ? r.querySelector('th.cal-sem').textContent : null, dias: [...r.querySelectorAll('td')].map(td => td.dataset.dia ? +td.dataset.dia : 0), fin: [...r.querySelectorAll('td')].map(td => td.classList.contains('cal-fin')), fest: [...r.querySelectorAll('td')].map(td => td.classList.contains('cal-fest')) })) }))`);

try {
  await c.vista(1100, 900, 'light', false);

  // ============================================================ CALENDARIOS
  console.log('GENERADOR DE CALENDARIOS');
  await ir('generador-de-calendarios');
  await escribir('#c-anio', '2027'); await marcar('#c-numeros', true); await marcar('#c-festivos', true);
  let g = await rejilla(), e = py(PY_CAL, 2027, 0);
  ok(g.length === 12 && g.map(x => x.caption).join(',') === 'Enero,Febrero,Marzo,Abril,Mayo,Junio,Julio,Agosto,Septiembre,Octubre,Noviembre,Diciembre', '12 meses con su nombre');
  let malos = g.filter(m => JSON.stringify(m.filas.map(f => f.dias)) !== JSON.stringify(e.meses[m.mes].filas.map(f => f.map(d => d))));
  ok(!malos.length, 'rejilla de 2027 (lunes primero) igual a la de Python calendar' + (malos.length ? ' · falla el mes ' + malos[0].mes : ''));
  malos = g.filter(m => m.filas.map(f => f.sem).join() !== e.meses[m.mes].iso.join());
  ok(!malos.length, 'números de semana ISO de cada fila igual a isocalendar()' + (malos.length ? ' · falla el mes ' + malos[0].mes + ': ' + malos[0].filas.map(f => f.sem) + ' ≠ ' + e.meses[malos[0].mes].iso : ''));
  const fests = g.flatMap(m => m.filas.flatMap(f => f.dias.map((d, i) => f.fest[i] ? [m.mes, d] : null).filter(Boolean)));
  ok(JSON.stringify(fests.sort((x, y) => x[0] - y[0] || x[1] - y[1])) === JSON.stringify(e.fest), `festivos marcados: ${fests.length} (Viernes Santo 2027 = 26 de marzo) igual a Python`);
  malos = g.filter(m => m.filas.some(f => f.fin.some((b, i) => b !== (f.dias[i] > 0 && i >= 5))));
  ok(!malos.length, 'los fines de semana (columnas 6 y 7) llevan su marca');
  ok(await k('dias') === '365' && await k('bisiesto') === 'No' && await k('primero') === 'viernes' && await k('semanas') === String(e.sem) && await k('festivos') === '10', `resumen 2027: ${await k('dias')} días, 1 de enero ${await k('primero')}, ${await k('semanas')} semanas ISO, ${await k('festivos')} festivos`);
  // domingo primero y año bisiesto
  await escribir('#c-anio', '2028'); await elegir('#c-semana', 'domingo');
  g = await rejilla(); e = py(PY_CAL, 2028, 6);
  malos = g.filter(m => JSON.stringify(m.filas.map(f => f.dias)) !== JSON.stringify(e.meses[m.mes].filas));
  ok(!malos.length && g.length === 12, 'rejilla de 2028 con domingo primero igual a Python' + (malos.length ? ' · falla el mes ' + malos[0].mes : ''));
  ok(g.every(m => m.filas.every(f => f.sem === null)) && await c.js(`document.querySelector('#c-numeros').closest('.campo').hidden`), 'con domingo primero no hay números de semana y la opción se oculta');
  malos = g.filter(m => m.filas.some(f => f.fin.some((b, i) => b !== (f.dias[i] > 0 && (i === 0 || i === 6)))));
  ok(!malos.length, 'fines de semana con domingo primero: primera y última columna');
  ok(await k('dias') === '366' && await k('bisiesto') === 'Sí' && await k('primero') === 'sábado', `2028: ${await k('dias')} días, bisiesto ${await k('bisiesto')}, 1 de enero ${await k('primero')}`);
  ok(g[1].filas.flatMap(f => f.dias).includes(29), 'febrero de 2028 llega al 29');
  // un mes
  await elegir('#c-semana', 'lunes'); await elegir('#c-tipo', 'mes'); await elegir('#c-mes', '11'); await escribir('#c-anio', '2026');
  g = await rejilla(); e = py(PY_CAL, 2026, 0);
  ok(g.length === 1 && g[0].caption === 'Noviembre de 2026' && JSON.stringify(g[0].filas.map(f => f.dias)) === JSON.stringify(e.meses[11].filas), 'un solo mes: noviembre de 2026 como en Python');
  ok(g[0].filas[0].fest[6] === true && (await texto('.cal-previa td[data-dia="1"]')).includes('Todos los Santos'), 'en la vista mensual el festivo lleva su nombre');
  ok(await k('dias') === '30' && await k('primero') === 'domingo' && await k('filas') === '6' && await k('festivos') === '1', `resumen de noviembre de 2026: ${await k('dias')} días, el 1 cae en ${await k('primero')}, ${await k('filas')} filas`);
  await elegir('#c-mes', '2'); await escribir('#c-anio', '2027');
  ok(await k('filas') === '4' && py(PY_CAL, 2027, 0).meses[2].filas.length === 4, 'febrero de 2027 (empieza en lunes y tiene 28 días) ocupa exactamente 4 semanas');
  // validación
  for (const [v, parte] of [['1800', 'entre 1900 y 2200'], ['2500', 'entre 1900 y 2200'], ['2027,5', 'número entero'], ['abc', 'no es un número']]) {
    await escribir('#c-anio', v);
    ok((await kt('error')).includes(parte) && await c.js(`!document.querySelector('.cal-previa table')`) && await c.js(`[...document.querySelectorAll('#herr button')].filter(b => b.textContent.startsWith('Crear')).every(b => b.disabled)`), `año «${v}»: ${await kt('error')} y los botones de creación quedan desactivados`);
  }
  // PDF del año con números de semana y festivos
  await elegir('#c-tipo', 'anio'); await escribir('#c-anio', '2027'); await marcar('#c-numeros', true); await marcar('#c-festivos', true); await escribir('#c-titulo', 'Calendario familiar');
  let f = await crear('Crear el PDF');
  ok(f && f.nombre === 'calendario-2027.pdf' && f.mime === 'application/pdf', 'entrega: ' + (f && f.nombre));
  let fi = fichaPdf(f.buf);
  ok(fi.paginas === 1 && Math.abs(fi.tam[0] - 841.89) < 0.5 && Math.abs(fi.tam[1] - 595.28) < 0.5 && ext.qpdfValido(f.buf), `PDF válido de 1 página A4 apaisada (${fi.tam.join(' × ')})`);
  let t = crudo(f.buf);
  ok(['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].every(m => t.includes(m)) && t.includes('Calendario familiar') && t.includes('Festivo nacional'), 'el PDF lleva los doce meses, el título y la leyenda');
  e = py(PY_CAL, 2027, 0);
  const numeros = t.split(/\s+/).filter(x => /^\d{1,2}$/.test(x)).length, filasTotal = Object.values(e.meses).reduce((s, m) => s + m.filas.length, 0);
  ok(numeros === 365 + filasTotal, `el PDF contiene los 365 días más ${filasTotal} números de semana (${numeros} cifras)`);
  // sin números de semana: solo los días
  await marcar('#c-numeros', false);
  f = await crear('Crear el PDF'); t = crudo(f.buf);
  ok(t.split(/\s+/).filter(x => /^\d{1,2}$/.test(x)).length === 365, 'sin números de semana, exactamente 365 cifras de días');
  // el título con caracteres que el PDF no puede escribir
  await escribir('#c-titulo', '🎄 Familia');
  f = await crear('Crear el PDF'); t = crudo(f.buf);
  ok(t.includes('? Familia') && (await estadoTexto()).length >= 0 && (await c.js(`document.querySelector('.herr-entrega')?.innerText || ''`)).includes('sustituido'), 'un emoji del título se sustituye por «?» y la herramienta lo avisa');
  await escribir('#c-titulo', '');
  // PNG del año
  f = await crear('Crear la imagen PNG');
  ok(f && f.nombre === 'calendario-2027.png' && f.mime === 'image/png', 'imagen PNG entregada');
  let im = pixeles(f.buf, [[30, 30], [20, 300], [200, 140]]);
  ok(im.tam[0] === 2105 && im.tam[1] === 1489, `PNG de ${im.tam.join(' × ')} (A4 apaisado a 180 ppp)`);
  ok(im.px[0].every(v => v > 250), 'el fondo es blanco');
  // PDF y PNG de un mes: celdas en blanco, fin de semana y festivo con su color
  await elegir('#c-tipo', 'mes'); await elegir('#c-mes', '11'); await escribir('#c-anio', '2026'); await marcar('#c-numeros', false);
  f = await crear('Crear el PDF'); t = crudo(f.buf);
  ok(f.nombre === 'calendario-2026-11.pdf' && t.includes('Noviembre de 2026') && t.includes('Todos los Santos') && ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].every(d => t.includes(d)), 'PDF del mes: título, días de la semana y nombre del festivo');
  ok(t.split(/\s+/).filter(x => /^\d{1,2}$/.test(x)).length === 30, 'el PDF del mes tiene exactamente 30 cifras');
  f = await crear('Crear la imagen PNG');
  // coordenadas de celdas: margen 34, 7 columnas de (841.89-68)/7, 6 filas de (515.28-22-46)/6 bajo la cabecera de 22; escala 2.5
  const cw = (841.89 - 68) / 7, rh = (515.28 - 22 - 46) / 6, pt = (col, fila) => [Math.round((34 + cw * (col + 0.5)) * 2.5), Math.round((595.28 - 515.28 + 22 + rh * (fila + 0.5)) * 2.5) + 35];
  im = pixeles(f.buf, [pt(0, 0), pt(6, 0), pt(5, 1), pt(1, 1), pt(1, 4)]);
  ok(g[0].filas.length === 6, 'noviembre de 2026 ocupa 6 filas');
  const [vacia, festivo, sabado, martes, fuera] = im.px;
  ok(vacia.every(v => v > 250), 'una celda sin día queda en blanco (sin relleno): ' + vacia);
  ok(festivo[0] > 240 && festivo[1] > 220 && festivo[2] < 190, 'el 1 de noviembre (festivo y domingo) lleva el color de festivo: ' + festivo);
  ok(sabado[0] > 220 && sabado[0] < 242 && sabado[1] > 232 && Math.abs(sabado[1] - sabado[2]) < 12, 'el sábado 7 lleva el gris de fin de semana: ' + sabado);
  ok(martes.every(v => v > 250), 'un martes laborable queda en blanco: ' + martes);
  ok(fuera.every(v => v > 250), 'la celda del 24 de noviembre queda en blanco: ' + fuera);
  sinErrores('generador de calendarios');

  // ============================================================ PLANIFICADOR SEMANAL
  console.log('PLANIFICADOR SEMANAL');
  await ir('planificador-semanal');
  const sem = (fecha) => py(`import sys, json
from datetime import date, timedelta
d = date.fromisoformat(sys.argv[1]); l = d - timedelta(days=d.weekday())
print(json.dumps({'iso': d.isocalendar()[1], 'lunes': l.isoformat(), 'dom': (l + timedelta(days=6)).isoformat()}))`, fecha);
  await elegir('#c-fecha', '2026-11-11');
  let s = sem('2026-11-11');
  ok(await k('semana') === String(s.iso) && await kt('rango') === 'del 9 al 15 de noviembre de 2026', `semana ${await k('semana')}: «${await kt('rango')}»`);
  const dias = await c.js(`[...document.querySelectorAll('.pl-dia')].map(d => d.dataset.dia + ':' + d.querySelector('h3').textContent)`);
  ok(dias.join('|') === '1:Lunes9 nov|2:Martes10 nov|3:Miércoles11 nov|4:Jueves12 nov|5:Viernes13 nov|6:Sábado14 nov|7:Domingo15 nov', 'siete días con su fecha: ' + dias.join(' | '));
  await escribir('#c-d0', 'Entregar el informe\n\n   Reunión de equipo a las 10:00  \n'); await escribir('#c-d2', 'Revisar el presupuesto'); await escribir('#c-notas', 'Renovar el seguro antes del viernes.');
  ok((await c.js(`[...document.querySelectorAll('.pl-dia[data-dia="1"] li')].map(l => l.textContent)`)).join('|') === 'Entregar el informe|Reunión de equipo a las 10:00', 'una tarea por línea, sin líneas vacías ni espacios sobrantes');
  ok(await k('tareas') === '3' && (await texto('.pl-notas')).includes('Renovar el seguro'), '3 tareas y las notas en la vista previa');
  ok((await texto('.pl-dia[data-dia="2"]')).includes('Día libre de tareas'), 'un día sin tareas lo indica con palabras');
  let p = await crear('Crear el PDF');
  ok(p && p.nombre === `planificador-semana-2026-${s.iso}.pdf`, 'entrega: ' + (p && p.nombre));
  fi = fichaPdf(p.buf);
  ok(fi.paginas === 1 && Math.abs(fi.tam[0] - 841.89) < 0.5 && ext.qpdfValido(p.buf), 'PDF válido de una página A4 apaisada');
  t = crudo(p.buf); const tn = t.replace(/\s+/g, ' ');
  ok(t.includes(`Semana ${s.iso} · del 9 al 15 de noviembre de 2026`) && ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].every(d => t.includes(d)) && t.includes('9 de noviembre') && t.includes('15 de noviembre'), 'el PDF lleva el rango, los siete días y sus fechas');
  ok(tn.includes('Entregar el informe') && tn.includes('Reunión de equipo a las 10:00') && tn.includes('Revisar el presupuesto') && tn.includes('Notas') && tn.includes('Renovar el seguro antes del viernes.'), 'el PDF lleva las tareas y las notas');
  ok(tn.indexOf('Entregar el informe') < tn.indexOf('Reunión de equipo') && tn.indexOf('Reunión de equipo') < tn.indexOf('Revisar el presupuesto'), 'las tareas salen en el orden de los días');
  // cinco días
  await marcar('#c-finde', false);
  ok((await c.js(`document.querySelectorAll('.pl-dia').length`)) === 5 && await c.js(`document.querySelector('#c-d5').closest('.campo').hidden`), 'sin fin de semana: 5 columnas y los cuadros de sábado y domingo se ocultan');
  p = await crear('Crear el PDF'); t = crudo(p.buf);
  ok(!t.includes('Sábado') && t.includes('Viernes'), 'el PDF de cinco días no lleva sábado ni domingo');
  await marcar('#c-finde', true);
  // semana a caballo de dos meses y de dos años
  await elegir('#c-fecha', '2026-12-30'); s = sem('2026-12-30');
  ok(await kt('rango') === 'del 28 de diciembre de 2026 al 3 de enero de 2027' && await k('semana') === String(s.iso) && s.iso === 53, `de un año a otro: «${await kt('rango')}», semana ${await k('semana')}`);
  await elegir('#c-fecha', '2026-10-28'); s = sem('2026-10-28');
  ok(await kt('rango') === 'del 26 de octubre al 1 de noviembre de 2026' && await k('semana') === String(s.iso), `de un mes a otro: «${await kt('rango')}»`);
  await elegir('#c-fecha', '2026-11-15'); s = sem('2026-11-15');
  ok(await kt('rango') === 'del 9 al 15 de noviembre de 2026', 'un domingo pertenece a la semana que termina en él');
  // recortes y avisos
  await elegir('#c-fecha', '2026-11-11');
  const largas = Array.from({ length: 30 }, (_, i) => `Tarea número ${i + 1} con un texto bastante largo`).join('\n');
  await escribir('#c-d0', largas);
  p = await crear('Crear el PDF'); t = crudo(p.buf);
  ok(/… y \d+ tareas? más/.test(t) && (await c.js(`document.querySelector('.herr-entrega')?.innerText || ''`)).includes('recortado'), 'si las tareas no caben, el PDF lo indica y la herramienta avisa');
  ok(t.includes('Tarea número 1 ') && !t.includes('Tarea número 30'), 'se conservan las primeras tareas y se recortan las últimas');
  await escribir('#c-d0', '😀 Reunión\n' + 'x'.repeat(10));
  p = await crear('Crear el PDF'); t = crudo(p.buf);
  ok(t.includes('? Reunión') && (await c.js(`document.querySelector('.herr-entrega')?.innerText || ''`)).includes('sustituido'), 'un emoji en una tarea se sustituye por «?» y se avisa');
  await escribir('#c-d0', Array.from({ length: 31 }, (_, i) => 't' + i).join('\n'));
  ok((await kt('error')).includes('máximo es 30') && await c.js(`!document.querySelector('.pl-semana')`), 'más de 30 tareas en un día: error y sin vista previa: ' + await kt('error'));
  await escribir('#c-d0', 'y'.repeat(141));
  ok((await kt('error')).includes('demasiado larga'), 'tarea de 141 letras: ' + await kt('error'));
  await escribir('#c-d0', 'Entregar el informe');
  // PNG
  p = await crear('Crear la imagen PNG');
  im = pixeles(p.buf, [[20, 20]]);
  ok(p.nombre.endsWith('.png') && im.tam[0] === 2105 && im.tam[1] === 1489 && im.px[0].every(v => v > 250), `PNG del planificador de ${im.tam.join(' × ')}`);
  // fecha vacía
  await elegir('#c-fecha', '');
  ok(await c.js(`document.querySelector('.herr-vacio')?.textContent`) === 'Elige una fecha para ver su semana.', 'sin fecha, invita a elegirla');
  sinErrores('planificador semanal');
} catch (e) {
  console.log('  ✗ Excepción: ' + (e && e.stack || e)); fallos.push('excepción');
} finally {
  ext.limpiar();
  await c.cerrar();
}
console.log(fallos.length ? `\n${fallos.length} fallos:\n- ` + fallos.join('\n- ') : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
