/* TABLAS DE MULTIPLICAR: se eligen las tablas (1 a 10) y una modalidad: reto de 60 segundos o práctica de 20 preguntas.
   La respuesta se comprueba sola al escribir tantas cifras como tiene el resultado, o al pulsar Intro. Al final se repasan los fallos.
   Todo en memoria; el estado se publica en data-* para las pruebas automáticas. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('tm');
  if (!raiz) return;

  var SEGUNDOS = 60, PREGUNTAS = 20;
  var NIVELES_RETO = [[0, 'Aprendiz'], [10, 'Calculador'], [20, 'Rápido'], [30, 'Relámpago'], [40, 'Calculadora humana']];
  var NIVELES_PRACTICA = [[0, 'Por repasar'], [10, 'Bien encaminado'], [15, 'Casi dominada'], [18, 'Dominada'], [20, 'Perfecta']];
  var sesion = TYJ.Sesion(null, { etiquetaMejor: 'Mejor reto (puntos): ' });
  var preferencias = { tablas: [2, 3, 4, 5, 6, 7, 8, 9, 10] };     // solo en memoria mientras la página esté abierta
  var g = null, ui = null, temporizador = null, pausa = null;

  /* ---- Preguntas: se recorren todas las parejas de las tablas elegidas, mezcladas, sin repetir hasta agotarlas */
  function nuevaBolsa() {
    var lista = [];
    g.tablas.forEach(function (t) { for (var b = 1; b <= 10; b++) lista.push([t, b]); });
    return U.barajar(lista);
  }
  function siguientePareja() {
    if (!g.bolsa.length) g.bolsa = nuevaBolsa();
    var p = g.bolsa.pop();
    return U.azar(2) ? [p[0], p[1]] : [p[1], p[0]];
  }

  /* ---- Partida */
  function nueva() {
    clearTimeout(pausa);
    if (temporizador) temporizador.parar();
    g = { fase: 'espera', modo: '', tablas: preferencias.tablas.slice(), bolsa: [], n: 0, aciertos: 0, fallos: 0, racha: 0, mejorRacha: 0, puntos: 0, a: 0, b: 0, bloqueada: false, errores: [] };
    pantallaInicio(); datos();
  }
  function empezar(modo) {
    if (!g.tablas.length) { ui.msg.textContent = 'Elige al menos una tabla para empezar.'; ui.msg.className = 'mensaje mensaje--mal'; return; }
    g.modo = modo; g.fase = 'juego'; g.bolsa = nuevaBolsa();
    montarJuego(); preguntar();
    if (modo === 'reto') {
      temporizador = new TYJ.Temporizador({
        segundos: SEGUNDOS,
        alTick: function (r) { ui.hud.poner('tiempo', Math.ceil(r), r <= 10); ui.barra.poner(r / SEGUNDOS); },
        alFin: function () { terminar(); }
      });
      temporizador.iniciar();
    }
    TYJ.anunciar(modo === 'reto' ? 'Reto de 60 segundos. Responde a todas las multiplicaciones que puedas.' : 'Práctica de 20 preguntas.');
  }
  function preguntar() {
    var p = siguientePareja();
    g.a = p[0]; g.b = p[1]; g.bloqueada = false;
    ui.pregunta.textContent = g.a + ' × ' + g.b + ' = ?';
    ui.pregunta.setAttribute('aria-label', g.a + ' por ' + g.b);
    ui.entrada.value = ''; ui.entrada.focus();
    ui.msg.textContent = ''; ui.msg.className = 'mensaje';
    if (g.modo === 'practica') ui.hud.poner('n', (g.n + 1) + ' / ' + PREGUNTAS);
    datos();
  }
  function comprobar() {
    if (g.fase !== 'juego' || g.bloqueada) return;
    var texto = ui.entrada.value.replace(/\D/g, '');
    if (!texto) return;
    g.bloqueada = true;
    var correcto = g.a * g.b, acierto = parseInt(texto, 10) === correcto;
    g.n++;
    if (acierto) {
      g.aciertos++; g.racha++; g.mejorRacha = Math.max(g.mejorRacha, g.racha);
      g.puntos += 10 + Math.min(g.racha - 1, 10);
      ui.msg.textContent = '¡Correcto!'; ui.msg.className = 'mensaje mensaje--ok';
    } else {
      g.fallos++; g.racha = 0;
      var tex = g.a + ' × ' + g.b + ' = ' + correcto;
      if (g.errores.indexOf(tex) < 0) g.errores.push(tex);
      ui.msg.textContent = 'Era ' + tex + '.'; ui.msg.className = 'mensaje mensaje--mal';
      TYJ.anunciar('Incorrecto. ' + g.a + ' por ' + g.b + ' son ' + correcto + '.');
    }
    ui.hud.poner('aciertos', g.aciertos); ui.hud.poner('racha', g.racha);
    datos();
    pausa = setTimeout(function () {
      if (g.fase !== 'juego') return;
      if (g.modo === 'practica' && g.n >= PREGUNTAS) terminar(); else preguntar();
    }, acierto ? 250 : 1300);
  }
  function terminar() {
    if (g.fase === 'fin') return;
    clearTimeout(pausa);
    if (temporizador) temporizador.parar();
    g.fase = 'fin'; datos();
    var reto = g.modo === 'reto', total = g.aciertos + g.fallos, prec = total ? Math.round(100 * g.aciertos / total) : 0;
    var nivel = U.nivel(reto ? g.aciertos : g.aciertos, reto ? NIVELES_RETO : NIVELES_PRACTICA);
    if (reto) sesion.registrar(g.puntos);
    TYJ.vaciar(raiz);
    var caja = h('div'), est = h('div');
    raiz.appendChild(caja); raiz.appendChild(est);
    var detalles = [g.aciertos + ' aciertos y ' + g.fallos + (g.fallos === 1 ? ' fallo' : ' fallos') + ' (' + prec + ' % de precisión)', 'Mejor racha: ' + g.mejorRacha,
      'Tablas: ' + g.tablas.join(', ')];
    detalles.push(g.errores.length ? 'Para repasar: ' + g.errores.slice(0, 8).join(' · ') : 'No has fallado ninguna: ¡enhorabuena!');
    TYJ.final(caja, { titulo: reto ? 'Se acabó el minuto' : 'Práctica terminada', puntos: reto ? g.puntos : g.aciertos, unidad: reto ? 'puntos' : 'aciertos de ' + PREGUNTAS, nivel: nivel, detalles: detalles,
      compartir: reto ? 'Tablas de multiplicar (reto de 60 s): ' + g.aciertos + ' aciertos, ' + g.puntos + ' puntos · ' + nivel + '.' : 'Tablas de multiplicar: ' + g.aciertos + ' de ' + PREGUNTAS + ' · ' + nivel + '.',
      textoRepetir: 'Volver a empezar', alRepetir: nueva });
    sesion.montar(est);
  }

  /* ---- Pantallas */
  function pantallaInicio() {
    TYJ.vaciar(raiz);
    ui = {};
    var grupo = h('div', { class: 'tm-tablas', role: 'group', 'aria-label': 'Tablas que quieres practicar' });
    function pintarTablas() {
      grupo.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(g.tablas.indexOf(Number(b.getAttribute('data-tabla'))) >= 0)); });
    }
    for (var t = 1; t <= 10; t++) {
      (function (t) {
        grupo.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico tm-tabla', type: 'button', 'data-tabla': String(t), 'aria-pressed': String(g.tablas.indexOf(t) >= 0), onclick: function () {
          var i = g.tablas.indexOf(t);
          if (i >= 0) g.tablas.splice(i, 1); else g.tablas.push(t);
          g.tablas.sort(function (x, y) { return x - y; });
          preferencias.tablas = g.tablas.slice(); pintarTablas();
        } }, String(t)));
      })(t);
    }
    ui.msg = h('p', { class: 'mensaje', role: 'status' });
    var est = h('div');
    [h('h2', { texto: 'Tablas de multiplicar' }),
      h('p', { class: 'texto', texto: 'Elige las tablas que quieres practicar y una modalidad. En el reto tienes 60 segundos para contestar a todas las que puedas; en la práctica, veinte preguntas sin prisa.' }),
      grupo,
      h('div', { class: 'fila fila--centro' },
        h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', onclick: function () { g.tablas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; preferencias.tablas = g.tablas.slice(); pintarTablas(); } }, 'Todas'),
        h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', onclick: function () { g.tablas = []; preferencias.tablas = []; pintarTablas(); } }, 'Ninguna')),
      ui.msg,
      h('div', { class: 'fila fila--centro' },
        h('button', { class: 'boton-retro', type: 'button', onclick: function () { empezar('reto'); } }, 'Reto de 60 segundos'),
        h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: function () { empezar('practica'); } }, 'Práctica de 20')),
      est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(est);
  }
  function montarJuego() {
    TYJ.vaciar(raiz);
    ui = {};
    var reto = g.modo === 'reto';
    ui.hud = TYJ.hud(reto ? [['tiempo', 'Tiempo', SEGUNDOS], ['aciertos', 'Aciertos', 0], ['racha', 'Racha', 0]] : [['n', 'Pregunta', '1 / ' + PREGUNTAS], ['aciertos', 'Aciertos', 0], ['racha', 'Racha', 0]]);
    ui.barra = reto ? TYJ.barraDeTiempo() : null;
    ui.pregunta = h('p', { class: 'tm-pregunta', role: 'status' }, '');
    ui.entrada = h('input', { class: 'tm-entrada', type: 'text', inputmode: 'numeric', pattern: '[0-9]*', autocomplete: 'off', maxlength: '3', 'aria-label': 'Resultado de la multiplicación' });
    ui.entrada.addEventListener('input', function () {
      ui.entrada.value = ui.entrada.value.replace(/\D/g, '');
      if (!g.bloqueada && ui.entrada.value.length >= String(g.a * g.b).length) comprobar();
    });
    ui.entrada.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); comprobar(); } });
    ui.msg = h('p', { class: 'mensaje', role: 'status' });
    [ui.hud.nodo, ui.barra ? ui.barra.nodo : null, h('div', { class: 'tm-caja' }, ui.pregunta, ui.entrada), ui.msg,
      h('div', { class: 'fila fila--centro' },
        h('button', { class: 'boton-retro', type: 'button', onclick: comprobar }, 'Comprobar'),
        h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: function () { if (g.modo === 'reto' || g.n > 0) terminar(); else nueva(); } }, g.modo === 'reto' ? 'Terminar el reto' : 'Terminar la práctica'))
    ].forEach(function (n) { if (n) raiz.appendChild(n); });
  }
  function datos() {                                  // estado legible desde fuera (pruebas automáticas)
    raiz.setAttribute('data-fase', g.fase);
    raiz.setAttribute('data-modo', g.modo);
    raiz.setAttribute('data-a', String(g.a));
    raiz.setAttribute('data-b', String(g.b));
    raiz.setAttribute('data-aciertos', String(g.aciertos));
    raiz.setAttribute('data-fallos', String(g.fallos));
    raiz.setAttribute('data-racha', String(g.racha));
  }

  nueva();
})();
