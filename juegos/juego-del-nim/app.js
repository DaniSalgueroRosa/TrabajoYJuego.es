/* JUEGO DE LOS PALILLOS (Nim de una fila): se quitan 1, 2 o 3 y pierde quien coge el último.
   La máquina difícil deja siempre (n-1) mod 4 = 0; si no puede, juega al azar. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('nim');
  if (!raiz) return;
  var sesion = TYJ.Sesion(null, { victorias: true, racha: true, mejor: false });
  var total = 21, dificil = true, empiezoYo = true, t = null, ui = null, espera = null;

  function jugadaMaquina(n, duro) {
    var tope = Math.min(3, n), q = (n - 1) % 4;
    if (duro && q >= 1 && q <= 3) return q;
    return U.entre(1, tope);
  }

  function nueva() {
    clearTimeout(espera);
    t = { n: total, turnoYo: empiezoYo, fin: false, ultimo: null };
    montar(); pintar();
    if (!t.turnoYo) maquina();
  }

  function grupo(etiqueta, opciones, actual, alElegir) {
    var g = h('div', { class: 'fila', role: 'group', 'aria-label': etiqueta });
    opciones.forEach(function (o) {
      g.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(o[0] === actual), onclick: function () { alElegir(o[0]); nueva(); } }, o[1]));
    });
    return g;
  }

  function montar() {
    TYJ.vaciar(raiz);
    ui = { quitar: [], palillos: [] };
    ui.opc = [
      grupo('Palillos al empezar', [[15, '15 palillos'], [18, '18 palillos'], [21, '21 palillos']], total, function (v) { total = v; }),
      grupo('Nivel de la máquina', [[false, 'Máquina fácil'], [true, 'Máquina difícil']], dificil, function (v) { dificil = v; }),
      grupo('Quién empieza', [[true, 'Empiezas tú'], [false, 'Empieza la máquina']], empiezoYo, function (v) { empiezoYo = v; })];
    ui.mesa = h('div', { class: 'nim-palillos', role: 'img' });
    for (var i = 0; i < total; i++) { var p = h('span', { class: 'nim-palillo' }); ui.palillos.push(p); ui.mesa.appendChild(p); }
    ui.acciones = h('div', { class: 'nim-acciones', role: 'group', 'aria-label': 'Cuántos palillos quitas' });
    [1, 2, 3].forEach(function (k) {
      var b = h('button', { class: 'boton-retro', type: 'button', 'data-quitar': String(k), onclick: function () { quitar(k); } }, 'Quitar ' + k);
      ui.quitar.push(b); ui.acciones.appendChild(b);
    });
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    ui.final = h('div'); ui.est = h('div');
    ui.opc.concat([ui.mesa, ui.acciones, ui.msg, ui.final, ui.est]).forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
  }

  function pintar() {
    ui.palillos.forEach(function (p, i) { p.className = 'nim-palillo' + (i >= t.n ? ' nim-quitado' : ''); });
    ui.mesa.setAttribute('aria-label', 'Quedan ' + t.n + ' palillos de ' + total);
    ui.quitar.forEach(function (b, i) { b.disabled = t.fin || !t.turnoYo || (i + 1) > t.n; });
    if (!t.fin) ui.msg.textContent = (t.ultimo ? t.ultimo + ' ' : '') + (t.turnoYo ? 'Quedan ' + t.n + '. Tu turno.' : 'Piensa la máquina…');
  }

  function quitar(k) {
    if (t.fin || !t.turnoYo || k > t.n) return;
    t.n -= k; t.ultimo = 'Quitas ' + k + '.';
    if (t.n === 0) { t.fin = true; pintar(); return acabar(false); }          // ha cogido el último: pierde
    t.turnoYo = false; pintar(); maquina();
  }

  function maquina() {
    espera = setTimeout(function () {
      if (t.fin) return;
      var k = jugadaMaquina(t.n, dificil);
      t.n -= k; t.ultimo = 'La máquina quita ' + k + '.';
      if (t.n === 0) { t.fin = true; pintar(); return acabar(true); }
      t.turnoYo = true; pintar();
      TYJ.anunciar(t.ultimo + ' Quedan ' + t.n + ' palillos.');
    }, 650);
  }

  function acabar(gano) {
    ui.msg.textContent = '';
    sesion.registrar(0, gano);
    TYJ.final(ui.final.appendChild(h('div')), { titulo: gano ? '¡Has ganado!' : 'Te has llevado el último palillo', nivel: total + ' palillos · ' + (dificil ? 'máquina difícil' : 'máquina fácil'),
      detalles: [gano ? 'La máquina ha tenido que coger el último.' : 'Recuerda: deja siempre 17, 13, 9, 5 o 1 palillos al rival.'],
      compartir: 'Juego de los palillos (' + total + ', ' + (dificil ? 'difícil' : 'fácil') + '): ' + (gano ? 'he ganado' : 'he perdido') + '.',
      textoRepetir: 'Otra partida', alRepetir: nueva });
  }

  nueva();
})();
