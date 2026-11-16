/* TRES EN RAYA: contra la máquina (fácil o difícil) o dos jugadores en el mismo dispositivo. La máquina difícil usa minimax: nunca pierde.
   Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('tr');
  if (!raiz) return;
  var LINEAS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  var MODOS = { facil: 'Contra la máquina (fácil)', dificil: 'Contra la máquina (difícil)', dos: 'Dos jugadores' };
  var sesion = TYJ.Sesion(null, { victorias: true, racha: true, mejor: false });
  var modo = 'facil', empiezoYo = true, t = null, ui = null, espera = null;

  /* ---- lógica pura */
  function ganador(c) {
    for (var i = 0; i < LINEAS.length; i++) {
      var l = LINEAS[i];
      if (c[l[0]] && c[l[0]] === c[l[1]] && c[l[0]] === c[l[2]]) return { quien: c[l[0]], linea: l };
    }
    return null;
  }
  function libres(c) { var r = []; c.forEach(function (v, i) { if (!v) r.push(i); }); return r; }
  function minimax(c, turno, yo, profundidad) {            // valor para «yo» (positivo = bien); gana antes = más puntos
    var w = ganador(c);
    if (w) return w.quien === yo ? 10 - profundidad : profundidad - 10;
    var l = libres(c);
    if (!l.length) return 0;
    var mejor = turno === yo ? -99 : 99;
    l.forEach(function (i) {
      c[i] = turno;
      var v = minimax(c, turno === 'X' ? 'O' : 'X', yo, profundidad + 1);
      c[i] = '';
      mejor = turno === yo ? Math.max(mejor, v) : Math.min(mejor, v);
    });
    return mejor;
  }
  function jugadaMaquina(c, yo, nivel) {
    var otro = yo === 'X' ? 'O' : 'X', l = libres(c), i, k;
    if (nivel === 'facil') {                               // gana si puede (casi siempre), bloquea a veces y si no, juega al azar
      var ganadoras = l.filter(function (j) { c[j] = yo; var w = ganador(c); c[j] = ''; return !!w; });
      if (ganadoras.length && Math.random() < 0.7) return ganadoras[0];
      var bloqueos = l.filter(function (j) { c[j] = otro; var w = ganador(c); c[j] = ''; return !!w; });
      if (bloqueos.length && Math.random() < 0.5) return bloqueos[0];
      return U.elegir(l);
    }
    var mejor = -99, mejores = [];
    for (k = 0; k < l.length; k++) {
      i = l[k]; c[i] = yo;
      var v = minimax(c, otro, yo, 1);
      c[i] = '';
      if (v > mejor) { mejor = v; mejores = [i]; } else if (v === mejor) mejores.push(i);
    }
    return U.elegir(mejores);
  }

  /* ---- partida */
  function nueva() {
    clearTimeout(espera);
    t = { c: ['', '', '', '', '', '', '', '', ''], turno: 'X', fin: false, linea: null, humano: modo === 'dos' ? null : (empiezoYo ? 'X' : 'O') };
    montar(); pintar();
    if (modo !== 'dos' && t.humano === 'O') jugarMaquina();
  }

  function montar() {
    TYJ.vaciar(raiz);
    ui = { celdas: [] };
    ui.modos = h('div', { class: 'fila', role: 'group', 'aria-label': 'Modo de juego' });
    Object.keys(MODOS).forEach(function (k) {
      ui.modos.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(k === modo), onclick: function () { modo = k; nueva(); } }, MODOS[k]));
    });
    ui.quien = h('div', { class: 'fila', role: 'group', 'aria-label': 'Quién empieza' },
      h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(empiezoYo), onclick: function () { empiezoYo = true; nueva(); } }, 'Empiezas tú (X)'),
      h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(!empiezoYo), onclick: function () { empiezoYo = false; nueva(); } }, 'Empieza la máquina (X)'));
    ui.tablero = h('div', { class: 'tr-tablero', role: 'group', 'aria-label': 'Tablero de tres en raya' });
    for (var i = 0; i < 9; i++) (function (i) {
      var b = h('button', { class: 'tr-celda', type: 'button', onclick: function () { jugar(i); } });
      ui.celdas.push(b); ui.tablero.appendChild(b);
    })(i);
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    ui.final = h('div'); ui.est = h('div');
    [ui.modos, modo === 'dos' ? null : ui.quien, ui.tablero, ui.msg, h('div', { class: 'fila fila--centro' }, h('button', { class: 'boton-retro boton-retro--chico', type: 'button', onclick: nueva }, 'Nueva partida')), ui.final, modo === 'dos' ? null : ui.est]
      .forEach(function (n) { if (n) raiz.appendChild(n); });
    if (modo !== 'dos') sesion.montar(ui.est);
  }

  function pintar() {
    t.c.forEach(function (v, i) {
      var b = ui.celdas[i], gana = t.linea && t.linea.indexOf(i) >= 0;
      b.textContent = v;
      b.className = 'tr-celda' + (v ? ' tr-' + v : '') + (gana ? ' tr-gana' : '');
      b.setAttribute('aria-label', 'Fila ' + (Math.floor(i / 3) + 1) + ', columna ' + (i % 3 + 1) + ': ' + (v || 'vacía'));
      b.disabled = !!v || t.fin || (modo !== 'dos' && t.turno !== t.humano);
    });
    if (!t.fin) ui.msg.textContent = modo === 'dos' ? 'Turno de ' + t.turno + '.' : (t.turno === t.humano ? 'Tu turno (' + t.humano + ').' : 'Piensa la máquina…');
  }

  function jugar(i) {
    if (t.fin || t.c[i] || (modo !== 'dos' && t.turno !== t.humano)) return;
    poner(i);
    if (!t.fin && modo !== 'dos') jugarMaquina();
  }
  function jugarMaquina() {
    pintar();
    espera = setTimeout(function () {
      if (t.fin) return;
      poner(jugadaMaquina(t.c, t.turno, modo));
    }, 380);
  }
  function poner(i) {
    t.c[i] = t.turno;
    var w = ganador(t.c);
    if (w) { t.fin = true; t.linea = w.linea; pintar(); return acabar(w.quien); }
    if (!libres(t.c).length) { t.fin = true; pintar(); return acabar(null); }
    t.turno = t.turno === 'X' ? 'O' : 'X';
    pintar();
    var cual = t.turno;
    TYJ.anunciar('Casilla ' + (i + 1) + ' ocupada. Turno de ' + cual + '.');
  }

  function acabar(quien) {
    var titulo, resultado = null;
    if (!quien) titulo = 'Empate';
    else if (modo === 'dos') titulo = 'Gana ' + quien;
    else { resultado = quien === t.humano; titulo = resultado ? '¡Has ganado!' : 'Ha ganado la máquina'; }
    ui.msg.textContent = '';
    if (modo !== 'dos') sesion.registrar(0, resultado);
    TYJ.final(ui.final.appendChild(h('div')), { titulo: titulo, nivel: MODOS[modo],
      compartir: modo === 'dos' ? null : 'Tres en raya (' + MODOS[modo].toLowerCase() + '): ' + (!quien ? 'empate' : resultado ? 'he ganado' : 'ha ganado la máquina') + '.',
      textoRepetir: 'Otra partida', alRepetir: nueva });
  }

  nueva();
})();
