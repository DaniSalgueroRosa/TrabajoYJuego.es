// Cuenta atrás, cronómetro y temporizador: se sustituye el reloj de la página (TH.ahora) para comprobar tiempos exactos sin esperar.
// Los valores esperados se calculan aparte (Python para las fechas, aritmética en la propia prueba para los formatos).
import { abrirChrome } from '../cdp.mjs';
import { preparar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const A = preparar(c);
const { fallos, ok, esperar, escribir, elegir, marcar, clic, texto, valor, k, kt, hastaQue, ext } = A;
const ir = async (s) => { await c.ir(`${base}/herramientas/${s}/`, 500); await hastaQue(() => c.js(`!document.querySelector('#herr-carga') && !!document.querySelector('#herr button')`)); };
const sinErrores = (t) => ok(c.consola().length === 0, `${t}: sin errores en la consola` + (c.consola().length ? ' → ' + c.consola().join(' | ') : ''));
// reloj simulado: la página sigue llamando a TH.ahora() en cada actualización
const reloj = (t) => c.js(`window.__t = ${t}; TH.pitidos = 0; TH.pitar = function (n) { TH.pitidos += 1; }; TH.ahora = () => window.__t; 0`);
const mover = async (ms) => { await c.js(`window.__t += ${ms}; 0`); await esperar(380); };
const local = (a, m, d, hh = 0, mm = 0, ss = 0) => new Date(a, m - 1, d, hh, mm, ss).getTime();
const py = (codigo, ...args) => JSON.parse(ext.python(codigo, ...args));
const p2 = (n) => String(n).padStart(2, '0');

try {
  await c.vista(1100, 900, 'light', false);

  // ============================================================ CUENTA ATRÁS
  console.log('CUENTA ATRÁS');
  await ir('cuenta-atras-online');
  ok(await kt('estado') === 'Elige una fecha para empezar la cuenta atrás.' && await k('estado') === 'vacio', 'sin fecha: invita a elegirla');
  ok((await Promise.all(['dias', 'horas', 'minutos', 'segundos'].map((x) => k(x)))).every((x) => x === '0'), 'sin fecha: todo a cero');
  await reloj(local(2026, 11, 14, 10, 0, 0));
  await escribir('#c-nombre', 'Navidad familiar');
  await elegir('#c-fecha', '2026-12-25'); await elegir('#c-hora', '08:30');
  await esperar(350);
  const dif = py(`import json
from datetime import datetime
d = datetime(2026, 12, 25, 8, 30) - datetime(2026, 11, 14, 10, 0)
t = int(d.total_seconds()); print(json.dumps([t // 86400, t % 86400 // 3600, t % 3600 // 60, t % 60, t]))`);
  ok(await k('dias') === String(dif[0]) && await k('horas') === String(dif[1]) && await k('minutos') === String(dif[2]) && await k('segundos') === String(dif[3]), `del 14/11/2026 10:00 al 25/12/2026 08:30 → ${dif.slice(0, 4).join(' d, ')}: ${await k('dias')} d ${await k('horas')} h ${await k('minutos')} min ${await k('segundos')} s`);
  ok(await k('estado') === 'futuro' && (await kt('estado')).includes('viernes, 25 de diciembre de 2026, a las 08:30'), 'texto del estado: «' + await kt('estado') + '»');
  ok(await kt('titulo') === 'Navidad familiar', 'muestra el nombre del evento');
  ok(await c.js(`document.querySelector('.ca-reloj').getAttribute('aria-label')`) === 'Tiempo que falta' && await c.js(`document.querySelector('.ca-reloj').getAttribute('role')`) === 'timer', 'role="timer" con nombre accesible');
  await mover(1000);
  const d2 = dif[4] - 1;
  ok(await k('minutos') === String(Math.floor(d2 % 3600 / 60)) && await k('segundos') === String(d2 % 60), `un segundo después: ${await k('minutos')} min ${await k('segundos')} s (esperado ${Math.floor(d2 % 3600 / 60)} min ${d2 % 60} s)`);
  // las unidades en singular y los días con separador de miles
  await reloj(local(2026, 11, 14, 10, 0, 0));
  await elegir('#c-fecha', '2026-11-15'); await elegir('#c-hora', '11:01'); await esperar(350);
  ok(await k('dias') === '1', 'un día y 1 h 1 min: ' + await k('dias') + ' d ' + await k('horas') + ' h ' + await k('minutos') + ' min');
  const et = [];
  for (const i of [1, 2, 3, 4]) et.push(await texto(`.ca-celda:nth-child(${i}) .ca-et`));
  ok(et.join(',') === 'día,hora,minuto,segundos', 'etiquetas: ' + et.join(', '));
  await elegir('#c-fecha', '2126-01-01'); await elegir('#c-hora', '00:00'); await esperar(350);
  const diasLejos = py(`import json
from datetime import datetime
d = datetime(2126, 1, 1) - datetime(2026, 11, 14, 10, 0); print(json.dumps(d.days))`);
  ok(await k('dias') === String(diasLejos) && await kt('dias') === String(diasLejos).replace(/\B(?=(\d{3})+(?!\d))/g, '.'), `fecha a 100 años: ${await kt('dias')} días`);
  // fecha pasada
  await elegir('#c-fecha', '2026-11-10'); await elegir('#c-hora', '09:00'); await esperar(350);
  ok(await k('estado') === 'pasado' && await k('dias') === '4' && await k('horas') === '1' && await k('minutos') === '0' && await k('segundos') === '0', `fecha pasada: ${await k('dias')} d ${await k('horas')} h → estado ${await k('estado')}`);
  ok((await kt('estado')).startsWith('Ya ha llegado') && await c.js(`document.querySelector('.ca-reloj').getAttribute('aria-label')`) === 'Tiempo transcurrido', 'fecha pasada: texto y etiqueta cambian');
  // cruce por cero con y sin aviso sonoro
  for (const [con, esperado] of [[false, 0], [true, 1]]) {
    await reloj(local(2026, 11, 14, 10, 0, 0));
    await c.js(`document.querySelector('#c-sonido').checked = ${con}; 0`);
    await elegir('#c-fecha', '2026-11-14'); await elegir('#c-hora', '10:01'); await mover(58000);
    ok(await k('segundos') === '2' && await k('estado') === 'futuro', `a 2 s del final: ${await k('segundos')} s`);
    await mover(3000);
    ok(await k('estado') === 'pasado' && await k('segundos') === '1' && await c.js('TH.pitidos') === esperado, `al cruzar el cero (${con ? 'con' : 'sin'} sonido): estado ${await k('estado')}, avisos ${await c.js('TH.pitidos')}`);
    await mover(5000);
    ok(await c.js('TH.pitidos') === esperado, 'el aviso suena una sola vez');
  }
  // editar a una fecha pasada no hace sonar nada
  await reloj(local(2026, 11, 14, 10, 0, 0)); await c.js(`document.querySelector('#c-sonido').checked = true; 0`);
  await elegir('#c-fecha', '2026-11-13'); await esperar(350);
  ok(await c.js('TH.pitidos') === 0, 'escribir una fecha ya pasada no dispara el aviso');
  // atajos
  const atajo = async (boton, ahora, fecha, nombre) => {
    await reloj(ahora); await clic(boton); await esperar(300);
    ok(await valor('#c-fecha') === fecha && await valor('#c-hora') === '00:00' && await valor('#c-nombre') === nombre, `atajo «${boton}» → ${await valor('#c-fecha')}`);
  };
  await atajo('Navidad', local(2026, 11, 14, 10), '2026-12-25', 'Navidad');
  await atajo('Año Nuevo', local(2026, 11, 14, 10), '2027-01-01', 'Año Nuevo');
  await atajo('Reyes Magos', local(2026, 11, 14, 10), '2027-01-06', 'Reyes Magos');
  await atajo('Navidad', local(2026, 12, 25, 0, 0, 0), '2027-12-25', 'Navidad');
  await atajo('Reyes Magos', local(2027, 1, 6, 0, 0, 1), '2028-01-06', 'Reyes Magos');
  await atajo('Año Nuevo', local(2026, 12, 31, 23, 59, 59), '2027-01-01', 'Año Nuevo');
  await clic('Empezar de nuevo'); await esperar(300);
  ok(await valor('#c-fecha') === '' && await k('estado') === 'vacio' && await valor('#c-nombre') === '', '«Empezar de nuevo» lo deja todo en blanco');
  sinErrores('cuenta atrás');

  // ============================================================ CRONÓMETRO
  console.log('CRONÓMETRO');
  await ir('cronometro-online');
  const fmt = (ms) => { const cs = Math.floor(ms / 10) % 100, s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000) % 60, hh = Math.floor(ms / 3600000); return (hh ? hh + ':' : '') + p2(m) + ':' + p2(s) + ',' + p2(cs); };
  const estadoBotones = () => c.js(`[...document.querySelectorAll('#herr button')].filter(b => ['Iniciar','Pausar','Reanudar','Vuelta','Reiniciar'].includes(b.textContent.trim())).map(b => b.textContent.trim() + (b.disabled ? '(no)' : '')).join(',')`);
  ok(await kt('tiempo') === '00:00,00' && await estadoBotones() === 'Iniciar,Vuelta(no),Reiniciar(no)', 'al abrir: 00:00,00 y botones ' + await estadoBotones());
  await reloj(1_000_000);
  await clic('Iniciar'); await mover(12345);
  ok(await k('tiempo') === '12345' && await kt('tiempo') === '00:12,34', `a los 12,345 s: «${await kt('tiempo')}» (data-v ${await k('tiempo')})`);
  ok(await estadoBotones() === 'Pausar,Vuelta,Reiniciar', 'corriendo: ' + await estadoBotones());
  await mover(17655);
  await clic('Vuelta');
  const v1 = await k('vuelta-1'), t1 = await k('total-1');
  ok(v1 === '30000' && t1 === '30000', `primera vuelta marcada a los 30 s: vuelta ${v1}, total ${t1}`);
  // se vuelve a probar con vueltas de verdad
  await clic('Reiniciar'); await esperar(100);
  ok(await kt('tiempo') === '00:00,00' && await c.js(`!document.querySelector('[data-k=vuelta-1]')`), 'Reiniciar borra tiempo y vueltas');
  await reloj(5_000_000);
  await clic('Iniciar'); await mover(12345); await clic('Vuelta'); await mover(17655); await clic('Vuelta');
  ok(await k('vuelta-1') === '12345' && await k('total-1') === '12345' && await k('vuelta-2') === '17655' && await k('total-2') === '30000', `vueltas: ${await k('vuelta-1')}/${await k('total-1')} y ${await k('vuelta-2')}/${await k('total-2')}`);
  ok(await kt('vuelta-1') === '00:12,34' && await kt('vuelta-2') === '00:17,65' && await kt('total-2') === '00:30,00', 'formato de las vueltas: ' + [await kt('vuelta-1'), await kt('vuelta-2'), await kt('total-2')].join(' · '));
  const filas = await c.js(`[...document.querySelectorAll('.cr-vueltas tbody tr')].map(r => r.cells[0].textContent + '|' + r.cells[3].textContent).join(';')`);
  ok(filas === '2|Más lenta;1|Más rápida', 'orden (la más reciente arriba) y comparación con palabras: ' + filas);
  // pausa: el tiempo no avanza y se conserva
  await clic('Pausar'); await mover(5000);
  ok(await k('tiempo') === '30000' && await estadoBotones() === 'Reanudar,Vuelta(no),Reiniciar', `en pausa se mantiene 00:30,00: ${await kt('tiempo')}`);
  await clic('Reanudar'); await mover(3_693_450);
  ok(await k('tiempo') === '3723450' && await kt('tiempo') === '1:02:03,45', `tras reanudar y 1 h 2 min 3,45 s: «${await kt('tiempo')}»`);
  await clic('Vuelta');
  ok(await k('vuelta-3') === '3693450' && await kt('vuelta-3') === '1:01:33,45', `vuelta 3: ${await kt('vuelta-3')}`);
  const filas3 = await c.js(`[...document.querySelectorAll('.cr-vueltas tbody tr')].map(r => r.cells[0].textContent + '|' + r.cells[3].textContent).join(';')`);
  ok(filas3 === '3|Más lenta;2|;1|Más rápida', 'con tres vueltas: ' + filas3);
  await c.js(`window.__copiado = null; 0`);
  await clic('Copiar las vueltas'); await esperar(150);
  const esperadoCopia = ['Vuelta\tTiempo de vuelta\tTiempo total', '1\t' + fmt(12345) + '\t' + fmt(12345), '2\t' + fmt(17655) + '\t' + fmt(30000), '3\t' + fmt(3693450) + '\t' + fmt(3723450)].join('\n');
  ok(await c.js('TH.ultimoCopiado') === esperadoCopia, 'lo copiado son columnas separadas por tabuladores');
  // truncado de centésimas y cambios de formato
  const casos = [[999, '00:00,99'], [1000, '00:01,00'], [59999, '00:59,99'], [60000, '01:00,00'], [3599999, '59:59,99'], [3600000, '1:00:00,00'], [36000000, '10:00:00,00']];
  for (const [ms, esp] of casos) {
    await clic('Reiniciar'); await reloj(9_000_000); await clic('Iniciar'); await mover(ms);
    if (await kt('tiempo') !== esp) ok(false, `${ms} ms → «${await kt('tiempo')}», esperado «${esp}»`);
    else ok(true, `${ms} ms → ${esp}`);
  }
  // sin vueltas iguales no hay comparación; una sola vuelta tampoco
  await clic('Reiniciar'); await reloj(1); await clic('Iniciar'); await mover(2000); await clic('Vuelta'); await mover(2000); await clic('Vuelta');
  ok((await c.js(`[...document.querySelectorAll('.cr-vueltas tbody tr')].map(r => r.cells[3].textContent).join('')`)) === '', 'dos vueltas iguales: sin comparación');
  await clic('Reiniciar');
  ok(await c.js(`document.querySelector('.cr-vueltas').hidden`) && await c.js(`![...document.querySelectorAll('#herr button')].some(b => b.textContent.trim() === 'Copiar las vueltas' && !b.hidden)`), 'sin vueltas se ocultan la tabla y «Copiar las vueltas»');
  ok(await c.js(`document.querySelector('[data-k=tiempo]').getAttribute('role')`) === 'timer', 'el tiempo es role="timer" (no se anuncia cada centésima)');
  sinErrores('cronómetro');

  // ============================================================ TEMPORIZADOR
  console.log('TEMPORIZADOR');
  await ir('temporizador-online');
  const tit0 = await c.js('document.title');
  const botones = () => c.js(`[...document.querySelectorAll('#herr .tm-reloj button')].map(b => b.textContent.trim() + (b.disabled ? '(no)' : '')).join(',')`);
  ok(await k('tiempo') === '300' && await kt('tiempo') === '05:00' && await k('estado') === 'listo' && await botones() === 'Iniciar,Reiniciar(no)', 'al abrir: 05:00, listo');
  await escribir('#c-horas', '1'); await escribir('#c-minutos', '30'); await escribir('#c-segundos', '0');
  ok(await kt('tiempo') === '1:30:00' && await k('tiempo') === '5400', 'con horas: ' + await kt('tiempo'));
  await escribir('#c-horas', '0'); await escribir('#c-minutos', '90');
  ok(await k('tiempo') === '5400' && await kt('tiempo') === '1:30:00', '90 minutos = 1:30:00');
  for (const [boton, h, m, s, t] of [['1 minuto', 0, 1, 0, '01:00'], ['10 minutos', 0, 10, 0, '10:00'], ['30 minutos', 0, 30, 0, '30:00'], ['1 hora', 1, 0, 0, '1:00:00'], ['15 minutos', 0, 15, 0, '15:00'], ['5 minutos', 0, 5, 0, '05:00']]) {
    await clic(boton);
    ok(await valor('#c-horas') === String(h) && await valor('#c-minutos') === String(m) && await valor('#c-segundos') === String(s) && await kt('tiempo') === t, `atajo «${boton}» → ${t}`);
  }
  // errores
  await escribir('#c-minutos', '0'); await escribir('#c-segundos', '0');
  ok((await kt('error')).includes('mayor que cero') && await botones() === 'Iniciar(no),Reiniciar(no)', 'tiempo cero: aviso y «Iniciar» desactivado');
  await escribir('#c-horas', '100');
  ok((await kt('error')).includes('99 horas'), 'más del máximo: ' + await kt('error'));
  await escribir('#c-horas', 'abc');
  ok((await kt('error')).includes('números enteros'), 'texto no numérico: ' + await kt('error'));
  await escribir('#c-horas', '0'); await escribir('#c-minutos', '1,5');
  ok((await kt('error')).includes('números enteros'), 'decimales: ' + await kt('error'));
  await escribir('#c-minutos', '1'); await escribir('#c-segundos', '30');
  ok(await c.js(`document.querySelector('[data-k=error]').hidden`) && await kt('tiempo') === '01:30', 'al corregir, el aviso desaparece');
  // cuenta con reloj simulado
  await reloj(7_000_000);
  await clic('Iniciar'); await mover(30000);
  ok(await k('tiempo') === '60' && await kt('tiempo') === '01:00' && await k('estado') === 'corriendo' && await botones() === 'Pausar,Reiniciar', `a los 30 s quedan ${await kt('tiempo')}, ${await k('estado')}`);
  ok(await c.js(`document.querySelector('#c-minutos').disabled && document.querySelector('#c-segundos').disabled`), 'los campos se bloquean mientras corre');
  ok((await c.js('document.title')) === '01:00 · ' + tit0, 'el título muestra la cuenta: «' + await c.js('document.title') + '»');
  await clic('Pausar'); await mover(60000);
  ok(await k('tiempo') === '60' && await k('estado') === 'pausa' && await botones() === 'Reanudar,Reiniciar', 'en pausa conserva 01:00');
  await clic('Reanudar'); await mover(58800);
  ok(await k('tiempo') === '2' && await kt('tiempo') === '00:02', `con 1,2 s restantes se ve ${await kt('tiempo')} (se redondea hacia arriba)`);
  await mover(1100);
  ok(await k('estado') === 'corriendo' && await k('tiempo') === '1', `con 0,1 s restantes todavía corre y marca ${await kt('tiempo')}`);
  await mover(900);
  ok(await k('estado') === 'terminado' && await kt('tiempo') === '00:00' && await c.js('TH.pitidos') === 1, `al llegar a cero: ${await k('estado')}, pitidos ${await c.js('TH.pitidos')}`);
  ok((await c.js('document.title')).startsWith('¡Tiempo!') && await kt('estado') === '¡Tiempo!' && await c.js(`document.querySelector('.tm-reloj progress').value`) === 100, 'aviso visual: título, texto y barra al 100 %');
  await mover(4000);
  ok(await c.js('TH.pitidos') === 1, 'el aviso suena una sola vez');
  // volver a empezar con el mismo tiempo
  await clic('Iniciar'); await mover(1000);
  ok(await k('estado') === 'corriendo' && await k('tiempo') === '89', `«Iniciar» tras terminar repite los 01:30 (queda ${await kt('tiempo')})`);
  await clic('Reiniciar');
  ok(await k('estado') === 'listo' && await kt('tiempo') === '01:30' && await c.js(`!document.querySelector('#c-minutos').disabled`) && (await c.js('document.title')) === tit0, 'Reiniciar vuelve a «listo» con el tiempo configurado');
  // barra de progreso
  await reloj(1_000); await escribir('#c-minutos', '2'); await escribir('#c-segundos', '0'); await clic('Iniciar'); await mover(30000);
  ok(Math.abs(await c.js(`document.querySelector('.tm-reloj progress').value`) - 25) < 1, 'a los 30 s de 120, la barra marca ~25 %');
  await clic('Reiniciar');
  // sin sonido
  await reloj(1_000); await c.js(`document.querySelector('#c-sonido').checked = false; 0`);
  await escribir('#c-minutos', '0'); await escribir('#c-segundos', '3'); await clic('Iniciar'); await mover(3500);
  ok(await k('estado') === 'terminado' && await c.js('TH.pitidos') === 0, 'con el sonido desactivado no suena');
  sinErrores('temporizador');
} catch (e) {
  console.log('  ✗ Excepción: ' + (e && e.stack || e)); fallos.push('excepción');
} finally {
  ext.limpiar();
  await c.cerrar();
}
console.log(fallos.length ? `\n${fallos.length} fallos:\n- ` + fallos.join('\n- ') : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);
