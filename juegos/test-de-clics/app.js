/* TEST DE CLICS: cuántas veces puedes pulsar el botón en 5, 10 o 30 segundos. El reloj arranca con el primer clic.
   Vale ratón, dedo o teclado (Espacio / Intro). Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('tc');
  if (!raiz) return;
  var DURACIONES = [5, 10, 30], NIVELES = [[0, 'Tortuga'], [3, 'Dedo tranquilo'], [5, 'Ágil'], [7, 'Veloz'], [9, 'Metralleta'], [11, 'Imparable']];
  var sesion = TYJ.Sesion(null, { mejor: false });
  var duracion = 10, e = null, ui = null, temporizador = null, manejado = false, ultimaTecla = -1000;

  function decimal(n, d) { return n.toFixed(d).replace('.', ','); }

  function nueva() {
    if (temporizador) temporizador.parar();
    e = { clics: 0, fase: 'reposo' };
    TYJ.vaciar(raiz);
    ui = {};
    ui.duraciones = h('div', { class: 'fila', role: 'group', 'aria-label': 'Duración de la prueba' });
    DURACIONES.forEach(function (d) {
      ui.duraciones.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(d === duracion), onclick: function () { duracion = d; nueva(); } }, d + ' segundos'));
    });
    ui.hud = TYJ.hud([['clics', 'Clics', 0], ['tiempo', 'Tiempo', decimal(duracion, 1)], ['cps', 'Clics por segundo', '–']]);
    ui.boton = h('button', { class: 'tc-boton', type: 'button' }, h('span', { class: 'tc-grande', texto: 'Pulsa para empezar' }), h('span', { class: 'tc-pequeno', texto: 'El reloj arranca con tu primer clic' }));
    ui.boton.addEventListener('pointerdown', function (ev) { if (ev.button > 0) return; manejado = true; clic(); });
    ['pointerup', 'pointercancel'].forEach(function (nombre) { ui.boton.addEventListener(nombre, function () { setTimeout(function () { manejado = false; }, 80); }); });   // si no llega el clic de ese toque, no se queda esperando
    ui.boton.addEventListener('keydown', function (ev) { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); if (!ev.repeat) { ultimaTecla = performance.now(); clic(); } } });
    ui.boton.addEventListener('click', function () { if (manejado) { manejado = false; return; } if (performance.now() - ultimaTecla < 400) return; clic(); });   // el clic de un lector de pantalla también cuenta
    ui.final = h('div'); ui.est = h('div');
    [ui.duraciones, ui.hud.nodo, ui.boton, ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
  }

  function pintar() {
    TYJ.vaciar(ui.boton);
    ui.boton.appendChild(h('span', { class: 'tc-grande', texto: String(e.clics) }));
    ui.boton.appendChild(h('span', { class: 'tc-pequeno', texto: e.clics === 1 ? 'clic' : 'clics' }));
    ui.hud.poner('clics', e.clics);
  }

  function clic() {
    if (e.fase === 'fin') return;
    if (e.fase === 'reposo') {
      e.fase = 'juego';
      temporizador = new TYJ.Temporizador({ segundos: duracion,
        alTick: function (r) { ui.hud.poner('tiempo', decimal(r, 1), r <= 3); var gastado = duracion - r; if (gastado > 0.4) ui.hud.poner('cps', decimal(e.clics / gastado, 1)); },
        alFin: terminar });
      temporizador.iniciar();
    }
    e.clics++;
    pintar();
  }

  function terminar() {
    e.fase = 'fin'; ui.boton.disabled = true;
    var cps = e.clics / duracion, nivel = U.nivel(cps, NIVELES);
    ui.hud.poner('tiempo', '0,0'); ui.hud.poner('cps', decimal(cps, 1));
    sesion.registrar(e.clics);
    TYJ.final(ui.final.appendChild(h('div')), { titulo: decimal(cps, 1) + ' clics por segundo', puntos: e.clics, unidad: 'clics en ' + duracion + ' segundos', nivel: nivel,
      compartir: 'Test de clics (' + duracion + ' s): ' + e.clics + ' clics, ' + decimal(cps, 1) + ' por segundo · ' + nivel + '.', textoRepetir: 'Repetir la prueba', alRepetir: nueva });
  }

  nueva();
})();
