/* A OJO DE BUEN CUBERO: siete preguntas con respuesta numérica. Colocas la aguja en una cinta métrica, una sola vez por pregunta; el juego
   revela dónde estaba la respuesta y dibuja la distancia que te separaba. 100 puntos si el error es menor del 1 % del recorrido; luego baja
   con el cuadrado. Un cubero (barril con monóculo) reacciona a cada apuesta. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('ao');
  if (!raiz) return;
  var NS = 'http://www.w3.org/2000/svg';
  var TOTAL = 7;
  var RANGOS = [[0, 'Despistado'], [150, 'Aproximado'], [300, 'Buen ojo'], [450, 'Ojo de halcón'], [600, 'Cubero de oro']];
  var calma = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var sesion = TYJ.Sesion(null, { racha: false });
  var CLAVE = 'a-ojo-de-buen-cubero';
  var preguntas = null, modo = 'dia', t = null, ui = null, timers = [];

  /* Número y unidad por separado (la unidad puede ser larga, como «millones de personas») */
  function partes(q, v) {
    if (q.u === null) return [String(Math.round(v)), ''];
    var e = Math.floor(v + 1e-9), dec = Math.round((v - e) * 10);
    return [U.miles(e) + (dec ? ',' + dec : ''), q.u];
  }
  function fmt(q, v) { var p = partes(q, v); return p[0] + p[1]; }
  function puntosPor(error) { return error <= 0.01 ? 100 : Math.round(100 * Math.pow(Math.max(0, 1 - 2.5 * error), 2)); }
  function programar(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function limpiar() { timers.forEach(clearTimeout); timers = []; }

  /* ---- El cubero: un barril con monóculo (dibujo SVG de 64 × 76) */
  function sv(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] != null) el.setAttribute(k, String(attrs[k])); });
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) el.appendChild(arguments[i]);
    return el;
  }
  function dibujarCubero() {
    return sv('svg', { viewBox: '0 0 64 76', class: 'ao-cubero-svg', focusable: 'false', 'aria-hidden': 'true' },
      sv('path', { class: 'ao-c-cuerpo', d: 'M12 6C2 26 2 50 12 70H52C62 50 62 26 52 6Z' }),
      sv('path', { class: 'ao-c-duela', d: 'M24 8C20 28 20 48 24 68M40 8C44 28 44 48 40 68' }),
      sv('rect', { class: 'ao-c-aro', x: 7, y: 14, width: 50, height: 6 }),
      sv('rect', { class: 'ao-c-aro', x: 7, y: 56, width: 50, height: 6 }),
      sv('rect', { class: 'ao-c-ojo', x: 21, y: 30, width: 6, height: 10 }),
      sv('circle', { class: 'ao-c-monocu', cx: 44, cy: 35, r: 9 }),
      sv('rect', { class: 'ao-c-ojo ao-c-pupila', x: 42, y: 31, width: 5, height: 8 }),
      sv('path', { class: 'ao-c-cadena', d: 'M52 41L57 56' }),
      sv('path', { class: 'ao-boca ao-boca--mira', d: 'M26 51H38' }),
      sv('path', { class: 'ao-boca ao-boca--clavado', d: 'M23 47Q32 62 41 47Z' }),
      sv('path', { class: 'ao-boca ao-boca--cerca', d: 'M25 50Q32 57 39 50' }),
      sv('path', { class: 'ao-boca ao-boca--lejos', d: 'M25 56Q32 47 39 56' }),
      sv('path', { class: 'ao-c-gota', d: 'M15 28L19 36A4 4 0 1 1 11 36Z' }),
      sv('g', { class: 'ao-c-chispas' }, sv('path', { d: 'M6 8H16M11 3V13' }), sv('path', { d: 'M52 14H60M56 10V18' })));
  }
  function reaccion(clase) {
    ui.cubero.className = 'ao-cubero ao-cubero--' + clase;
    if (clase !== 'mira' && !calma) { ui.cubero.classList.remove('ao-cubero--bote'); void ui.cubero.offsetWidth; ui.cubero.classList.add('ao-cubero--bote'); }
  }

  function inicio() {
    limpiar();
    TYJ.vaciar(raiz);
    ui = {};
    ui.est = h('div');
    ui.modos = h('div', { class: 'fila', role: 'group', 'aria-label': 'Modo de juego' });
    [['dia', 'Reto de hoy'], ['libre', 'Partida libre']].forEach(function (m) {
      ui.modos.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(m[0] === modo),
        onclick: function () { if (modo !== m[0]) { modo = m[0]; inicio(); } } }, m[1]));
    });
    ui.nota = h('p', { class: 'texto-suave', texto: modo === 'dia'
      ? 'Reto n.º ' + U.retoDelDia(CLAVE).numero + ': las mismas ' + "siete" + ' preguntas para todo el mundo hoy; cambia a medianoche (hora de Madrid).'
      : 'Partida libre: preguntas al azar.' });

    raiz.appendChild(h('div', { class: 'ao-portada' },
      h('div', { class: 'ao-cubero ao-cubero--mira ao-portada-cubero', 'aria-hidden': 'true' }, dibujarCubero()),
      h('div', { class: 'ao-portada-texto' },
        h('h3', { texto: 'A ojo de buen cubero' }),
        h('p', { class: 'texto', texto: 'Siete preguntas con un número como respuesta. Mueve la aguja por la cinta métrica hasta donde creas que está y pulsa «Colocar». Solo tienes una oportunidad por pregunta.' }),
        ui.modos, ui.nota,
        h('div', { class: 'fila' }, h('button', { class: 'boton-retro', type: 'button', onclick: empezar }, 'Empezar')))));
    raiz.appendChild(ui.est);
    sesion.montar(ui.est);
  }

  function empezar() {
    var r = U.retoDelDia(CLAVE), dia = modo === 'dia';
    t = { lista: dia ? U.barajarCon(U.semilla(r.semilla), preguntas).slice(0, TOTAL) : U.muestra(preguntas, TOTAL), numero: dia ? r.numero : 0, i: 0, puntos: 0, resultados: [], fase: 'apostando', valor: 0 };
    montar();
    mostrar();
  }

  function montar() {
    limpiar();
    TYJ.vaciar(raiz);
    ui = {};
    ui.hud = TYJ.hud([['pregunta', 'Pregunta', '1/' + TOTAL], ['puntos', 'Puntos', '0']]);
    ui.etapas = TYJ.etapas(TOTAL);

    ui.cubero = h('div', { class: 'ao-cubero ao-cubero--mira', 'aria-hidden': 'true' }, dibujarCubero());
    ui.preg = h('p', { class: 'ao-pregunta' });
    ui.cabecera = h('div', { class: 'ao-cabecera' }, ui.cubero, ui.preg);

    /* La cinta métrica: el <input type="range"> está encima de un dibujo con marcas y números */
    ui.apuesta = h('p', { class: 'ao-apuesta', 'aria-hidden': 'true' });
    ui.escala = h('div', { class: 'ao-escala', 'aria-hidden': 'true' });
    ui.cinta = h('div', { class: 'ao-cinta', 'aria-hidden': 'true' }, ui.escala);
    ui.rango = h('input', { class: 'ao-rango', type: 'range', 'aria-label': 'Tu apuesta' });
    ui.puente = h('span', { class: 'ao-puente', hidden: 'hidden', 'aria-hidden': 'true' });
    ui.real = h('span', { class: 'ao-real', hidden: 'hidden', 'aria-hidden': 'true' }, h('span', { class: 'ao-real-etiqueta', texto: 'Respuesta' }));
    ui.barra = h('div', { class: 'ao-barra' }, ui.apuesta, ui.cinta, ui.rango, ui.puente, ui.real);
    ui.rango.addEventListener('input', function () { poner(Number(ui.rango.value)); });

    ui.menos = h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-label': 'Bajar la aguja un paso', onclick: function () { mover(-1); } }, '−');
    ui.mas = h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-label': 'Subir la aguja un paso', onclick: function () { mover(1); } }, '+');
    ui.colocar = h('button', { class: 'boton-retro', type: 'button', onclick: colocar }, 'Colocar');
    ui.fila = h('div', { class: 'fila ao-fila' }, ui.menos, ui.mas, ui.colocar);
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    ui.veredicto = h('p', { class: 'ao-veredicto', hidden: 'hidden', 'aria-hidden': 'true' });
    ui.dato = h('p', { class: 'ao-dato' });
    ui.siguiente = h('button', { class: 'boton-retro', type: 'button', onclick: siguiente }, 'Siguiente');
    ui.revision = h('div', { class: 'ao-revision' }, ui.veredicto, ui.dato, ui.siguiente);
    ui.final = h('div'); ui.est = h('div');
    [ui.hud.nodo, ui.etapas.nodo, ui.cabecera, ui.barra, ui.fila, ui.msg, ui.revision, ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
  }

  function fraccion(q, v) { return (v - q.min) / (q.max - q.min); }

  function poner(v) {
    var q = t.lista[t.i], p = partes(q, v);
    t.valor = v;
    ui.rango.value = String(v);
    TYJ.vaciar(ui.apuesta);
    [document.createTextNode('Tu apuesta: '), h('span', { class: 'ao-valor', texto: p[0] }), h('span', { class: 'ao-unidad', texto: p[1] })].forEach(function (n) { ui.apuesta.appendChild(n); });
    ui.barra.style.setProperty('--v', fraccion(q, v).toFixed(5));
    ui.rango.setAttribute('aria-valuetext', fmt(q, v));
  }
  function mover(d) {
    if (t.fase !== 'apostando') return;
    var q = t.lista[t.i];
    poner(Math.max(q.min, Math.min(q.max, t.valor + d * q.paso)));
  }

  /* Los cinco números impresos en la cinta (0, 25, 50, 75 y 100 % del recorrido) */
  function pintarEscala(q) {
    TYJ.vaciar(ui.escala);
    for (var k = 0; k <= 4; k++) {
      var v = q.min + (q.max - q.min) * k / 4, txt = q.u === null ? String(Math.round(v)) : U.miles(Math.round(v));
      var n = h('span', { class: 'ao-n' + (k === 0 ? ' ao-n--ini' : k === 4 ? ' ao-n--fin' : ''), texto: txt });
      n.style.setProperty('--x', String(k / 4));
      ui.escala.appendChild(n);
    }
  }

  function mostrar() {
    limpiar();
    var q = t.lista[t.i], pasos = Math.round((q.max - q.min) / q.paso);
    t.fase = 'apostando';
    reaccion('mira');
    ui.hud.poner('pregunta', (t.i + 1) + '/' + TOTAL);
    ui.preg.textContent = q.p;
    ui.rango.min = String(q.min); ui.rango.max = String(q.max); ui.rango.step = String(q.paso);
    ui.rango.disabled = ui.menos.disabled = ui.mas.disabled = ui.colocar.disabled = false;
    ui.barra.classList.remove('ao-barra--revelada');
    ui.real.hidden = true; ui.puente.hidden = true;
    Array.prototype.slice.call(ui.barra.querySelectorAll('.ao-chispa')).forEach(function (n) { n.parentNode.removeChild(n); });
    pintarEscala(q);
    ui.msg.textContent = '';
    ui.revision.hidden = true; ui.veredicto.hidden = true;
    poner(q.min + Math.round(pasos * (0.25 + Math.random() * 0.5)) * q.paso);      // sale en un punto al azar entre el 25 % y el 75 % de la cinta
    ui.rango.focus({ preventScroll: true });
  }

  function chispas(f) {
    if (calma) return;
    for (var i = 0; i < 9; i++) {
      var a = Math.PI * (1.1 + 0.8 * i / 8), d = 40 + (i % 3) * 22, c = h('span', { class: 'ao-chispa ao-chispa--' + (i % 3) });
      c.style.setProperty('--f', String(f));
      c.style.setProperty('--dx', (Math.cos(a) * d).toFixed(0) + 'px');
      c.style.setProperty('--dy', (Math.sin(a) * d - 10).toFixed(0) + 'px');
      ui.barra.appendChild(c);
    }
    programar(function () { Array.prototype.slice.call(ui.barra.querySelectorAll('.ao-chispa')).forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); }); }, 1400);
  }

  function colocar() {
    if (t.fase !== 'apostando') return;
    var q = t.lista[t.i], error = Math.abs(t.valor - q.r) / (q.max - q.min), pts = puntosPor(error);
    var fa = fraccion(q, t.valor), fr = fraccion(q, q.r);
    var grado = pts >= 95 ? 'clavado' : pts >= 75 ? 'cerca' : pts >= 50 ? 'cerca' : 'lejos';
    var palabra = pts >= 95 ? '¡Clavado!' : pts >= 75 ? 'Muy cerca' : pts >= 50 ? 'Cerca' : 'Lejos';
    t.fase = 'revisando';
    t.puntos += pts;
    t.resultados.push({ apuesta: t.valor, r: q.r, pts: pts, q: q });
    ui.etapas.marcar(t.i, pts >= 50);
    ui.hud.poner('puntos', t.puntos);
    ui.rango.disabled = ui.menos.disabled = ui.mas.disabled = ui.colocar.disabled = true;
    ui.real.style.setProperty('--f', String(fr));
    ui.real.className = 'ao-real' + (fr < 0.14 ? ' ao-real--izq' : fr > 0.86 ? ' ao-real--der' : '');
    ui.real.hidden = false;
    ui.puente.style.setProperty('--min', String(Math.min(fa, fr)));
    ui.puente.style.setProperty('--dif', String(Math.abs(fa - fr)));
    ui.puente.style.setProperty('--origen', fa <= fr ? 'left center' : 'right center');
    ui.puente.className = 'ao-puente ao-puente--' + (pts >= 95 ? 'a' : pts >= 75 ? 'b' : pts >= 50 ? 'c' : 'd');
    ui.puente.hidden = false;
    ui.barra.classList.add('ao-barra--revelada');
    reaccion(grado === 'clavado' ? 'clavado' : grado);
    if (pts >= 95) chispas(fr);
    var porcentaje = (Math.round(error * 1000) / 10).toString().replace('.', ',');
    ui.msg.textContent = 'Era ' + fmt(q, q.r) + ' y tu apuesta fue ' + fmt(q, t.valor) + ': ' + (error <= 0.01 ? 'casi exacto' : 'te desvías un ' + porcentaje + ' % de la barra') + '. +' + pts + ' puntos.';
    ui.veredicto.className = 'ao-veredicto ao-veredicto--' + (pts >= 95 ? 'a' : pts >= 75 ? 'b' : pts >= 50 ? 'c' : 'd');
    ui.veredicto.textContent = palabra + ' +' + pts;
    ui.veredicto.hidden = false;
    ui.dato.textContent = q.d;
    ui.siguiente.textContent = t.i + 1 === TOTAL ? 'Ver resultado' : 'Siguiente';
    ui.revision.hidden = false;
    ui.siguiente.focus({ preventScroll: true });
  }

  function siguiente() {
    if (t.fase !== 'revisando') return;
    if (t.i + 1 === TOTAL) return terminar();
    t.i++;
    mostrar();
  }

  function terminar() {
    t.fase = 'fin';
    ui.revision.hidden = true;
    sesion.registrar(t.puntos, null);
    var detalles = t.resultados.map(function (r, i) {
      return 'Pregunta ' + (i + 1) + ': apostaste ' + fmt(r.q, r.apuesta) + ', era ' + fmt(r.q, r.r) + ' (+' + r.pts + ')';
    });
    var cercanas = t.resultados.filter(function (r) { return r.pts >= 95; }).length;
    TYJ.final(ui.final.appendChild(h('div')), { titulo: cercanas ? '¡Qué buen ojo!' : 'Partida terminada', nivel: U.nivel(t.puntos, RANGOS), puntos: t.puntos, unidad: 'de 700 puntos',
      detalles: detalles, compartir: 'A ojo de buen cubero' + (t.numero ? ' · reto n.º ' + t.numero : '') + ': ' + t.puntos + ' de 700 puntos' + (cercanas ? ', con ' + cercanas + (cercanas === 1 ? ' casi exacta.' : ' casi exactas.') : '.'),
      textoRepetir: t.numero ? 'Probar una partida libre' : 'Otra partida', alRepetir: t.numero ? function () { modo = 'libre'; empezar(); } : empezar });
  }

  function arrancar() {
    TYJ.datos('a-ojo-de-buen-cubero/preguntas.json').then(function (json) { preguntas = json.preguntas; inicio(); }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();
