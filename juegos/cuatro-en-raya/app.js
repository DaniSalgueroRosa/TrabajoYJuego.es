/* CUATRO EN RAYA: tablero de 7 columnas y 6 filas. Contra la máquina (fácil, medio o difícil: minimax con poda alfa-beta) o dos jugadores.
   Teclas 1 a 7, botones de columna o clic en el tablero. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('c4');
  if (!raiz) return;
  var F = 6, C = 7;
  var MODOS = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil', dos: 'Dos jugadores' };
  var PROF = { facil: 2, medio: 4, dificil: 5 };
  var NOMBRE = { 1: 'amarilla', 2: 'rosa' };
  var sesion = TYJ.Sesion(null, { victorias: true, racha: true, mejor: false });
  var modo = 'medio', empiezoYo = true, t = null, ui = null, espera = null, alTecla = null;

  /* ---- lógica pura: tablero como lista de 42 casillas (fila 0 = arriba); 0 vacía, 1 y 2 jugadores */
  var VENTANAS = [], f0, c0, k0;
  for (f0 = 0; f0 < F; f0++) for (c0 = 0; c0 < C; c0++) {
    [[0, 1], [1, 0], [1, 1], [1, -1]].forEach(function (d) {
      var cel = [];
      for (k0 = 0; k0 < 4; k0++) { var f = f0 + d[0] * k0, c = c0 + d[1] * k0; if (f < 0 || f >= F || c < 0 || c >= C) return; cel.push(f * C + c); }
      VENTANAS.push(cel);
    });
  }
  function cuatro(b) {
    for (var i = 0; i < VENTANAS.length; i++) {
      var w = VENTANAS[i], v = b[w[0]];
      if (v && v === b[w[1]] && v === b[w[2]] && v === b[w[3]]) return { quien: v, celdas: w };
    }
    return null;
  }
  function filaLibre(b, col) { for (var f = F - 1; f >= 0; f--) if (!b[f * C + col]) return f; return -1; }
  function columnas(b) { var r = []; [3, 2, 4, 1, 5, 0, 6].forEach(function (c) { if (filaLibre(b, c) >= 0) r.push(c); }); return r; }
  function valorar(b, yo) {
    var otro = yo === 1 ? 2 : 1, s = 0, i;
    for (i = 0; i < F; i++) if (b[i * C + 3] === yo) s += 3;
    VENTANAS.forEach(function (w) {
      var m = 0, o = 0;
      w.forEach(function (x) { if (b[x] === yo) m++; else if (b[x] === otro) o++; });
      if (m && o) return;
      if (m === 3) s += 5; else if (m === 2) s += 2;
      if (o === 3) s -= 6; else if (o === 2) s -= 2;
    });
    return s;
  }
  function buscar(b, prof, alfa, beta, turno, yo) {       // devuelve la puntuación para «yo»
    var w = cuatro(b), otro = turno === 1 ? 2 : 1;
    if (w) return (w.quien === yo ? 100000 : -100000) - (w.quien === yo ? -prof : prof);
    var cols = columnas(b);
    if (!cols.length) return 0;
    if (!prof) return valorar(b, yo);
    var i, c, f, v;
    if (turno === yo) {
      v = -Infinity;
      for (i = 0; i < cols.length; i++) {
        c = cols[i]; f = filaLibre(b, c); b[f * C + c] = turno;
        v = Math.max(v, buscar(b, prof - 1, alfa, beta, otro, yo));
        b[f * C + c] = 0; alfa = Math.max(alfa, v); if (alfa >= beta) break;
      }
    } else {
      v = Infinity;
      for (i = 0; i < cols.length; i++) {
        c = cols[i]; f = filaLibre(b, c); b[f * C + c] = turno;
        v = Math.min(v, buscar(b, prof - 1, alfa, beta, otro, yo));
        b[f * C + c] = 0; beta = Math.min(beta, v); if (alfa >= beta) break;
      }
    }
    return v;
  }
  function columnaMaquina(b, yo, nivel) {
    var cols = columnas(b), otro = yo === 1 ? 2 : 1;
    if (nivel === 'facil' && Math.random() < 0.35) return U.elegir(cols);
    var mejor = -Infinity, mejores = [];
    cols.forEach(function (c) {
      var f = filaLibre(b, c); b[f * C + c] = yo;
      var v = buscar(b, PROF[nivel] - 1, -Infinity, Infinity, otro, yo);
      b[f * C + c] = 0;
      if (v > mejor) { mejor = v; mejores = [c]; } else if (v === mejor) mejores.push(c);
    });
    return U.elegir(mejores);
  }

  /* ---- partida */
  function nueva() {
    clearTimeout(espera);
    t = { b: new Array(F * C).fill(0), turno: 1, fin: false, gana: [], ultima: -1, humano: modo === 'dos' ? 0 : (empiezoYo ? 1 : 2) };
    montar(); pintar();
    if (modo !== 'dos' && t.humano === 2) jugarMaquina();
  }

  function montar() {
    TYJ.vaciar(raiz);
    ui = { celdas: [], botones: [] };
    ui.modos = h('div', { class: 'fila', role: 'group', 'aria-label': 'Modo de juego' });
    Object.keys(MODOS).forEach(function (k) {
      ui.modos.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(k === modo), onclick: function () { modo = k; nueva(); } }, MODOS[k]));
    });
    ui.quien = h('div', { class: 'fila', role: 'group', 'aria-label': 'Quién empieza' },
      h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(empiezoYo), onclick: function () { empiezoYo = true; nueva(); } }, 'Empiezas tú'),
      h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(!empiezoYo), onclick: function () { empiezoYo = false; nueva(); } }, 'Empieza la máquina'));
    ui.columnas = h('div', { class: 'c4-columnas' });
    for (var c = 0; c < C; c++) (function (c) {
      var b = h('button', { class: 'c4-soltar', type: 'button', 'aria-label': 'Soltar ficha en la columna ' + (c + 1), 'aria-keyshortcuts': String(c + 1), onclick: function () { jugar(c); } }, '▼');
      ui.botones.push(b); ui.columnas.appendChild(b);
    })(c);
    ui.tablero = h('div', { class: 'c4-tablero', role: 'group', 'aria-label': 'Tablero de cuatro en raya, 7 columnas por 6 filas' });
    for (var i = 0; i < F * C; i++) (function (i) {
      var celda = h('div', { class: 'c4-celda', onclick: function () { jugar(i % C); } });
      ui.celdas.push(celda); ui.tablero.appendChild(celda);
    })(i);
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    ui.final = h('div'); ui.est = h('div');
    [ui.modos, modo === 'dos' ? null : ui.quien, ui.columnas, ui.tablero, ui.msg,
      h('div', { class: 'fila fila--centro' }, h('button', { class: 'boton-retro boton-retro--chico', type: 'button', onclick: nueva }, 'Nueva partida')),
      ui.final, modo === 'dos' ? null : ui.est].forEach(function (n) { if (n) raiz.appendChild(n); });
    if (modo !== 'dos') sesion.montar(ui.est);
    if (alTecla) document.removeEventListener('keydown', alTecla);
    alTecla = function (ev) {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var n = parseInt(ev.key, 10);
      if (n >= 1 && n <= C) { ev.preventDefault(); jugar(n - 1); }
    };
    document.addEventListener('keydown', alTecla);
  }

  function pintar() {
    t.b.forEach(function (v, i) {
      var celda = ui.celdas[i], gana = t.gana.indexOf(i) >= 0;
      celda.className = 'c4-celda' + (v ? ' c4-j' + v : '') + (gana ? ' c4-gana' : '');
      celda.setAttribute('data-ficha', String(v));
      celda.setAttribute('role', 'img');
      celda.setAttribute('aria-label', 'Fila ' + (Math.floor(i / C) + 1) + ', columna ' + (i % C + 1) + ': ' + (v ? 'ficha ' + NOMBRE[v] : 'vacía'));
      TYJ.vaciar(celda);
      if (v) celda.appendChild(h('span', { class: 'c4-ficha' + (i === t.ultima ? ' c4-nueva' : ''), style: '--caida:' + (Math.floor(i / C) + 1) }));
    });
    var bloqueado = t.fin || (modo !== 'dos' && t.turno !== t.humano);
    ui.botones.forEach(function (b, c) { b.disabled = bloqueado || filaLibre(t.b, c) < 0; });
    if (!t.fin) ui.msg.textContent = modo === 'dos' ? 'Turno de la ficha ' + NOMBRE[t.turno] + '.' : (t.turno === t.humano ? 'Tu turno: ficha ' + NOMBRE[t.humano] + '.' : 'Piensa la máquina…');
  }

  function jugar(col) {
    if (t.fin || (modo !== 'dos' && t.turno !== t.humano) || filaLibre(t.b, col) < 0) return;
    poner(col);
    if (!t.fin && modo !== 'dos') jugarMaquina();
  }
  function jugarMaquina() {
    pintar();
    espera = setTimeout(function () { if (!t.fin) poner(columnaMaquina(t.b, t.turno, modo)); }, 420);
  }
  function poner(col) {
    var f = filaLibre(t.b, col);
    t.b[f * C + col] = t.turno; t.ultima = f * C + col;
    var w = cuatro(t.b);
    if (w) { t.fin = true; t.gana = w.celdas; pintar(); return acabar(w.quien); }
    if (!columnas(t.b).length) { t.fin = true; pintar(); return acabar(0); }
    t.turno = t.turno === 1 ? 2 : 1;
    pintar();
    TYJ.anunciar('Ficha en la columna ' + (col + 1) + '. Turno de la ficha ' + NOMBRE[t.turno] + '.');
  }

  function acabar(quien) {
    var titulo, resultado = null;
    if (!quien) titulo = 'Empate: el tablero está lleno';
    else if (modo === 'dos') titulo = 'Gana la ficha ' + NOMBRE[quien];
    else { resultado = quien === t.humano; titulo = resultado ? '¡Has ganado!' : 'Ha ganado la máquina'; }
    ui.msg.textContent = '';
    if (modo !== 'dos') sesion.registrar(0, resultado);
    document.removeEventListener('keydown', alTecla); alTecla = null;
    TYJ.final(ui.final.appendChild(h('div')), { titulo: titulo, nivel: modo === 'dos' ? 'Dos jugadores' : 'Máquina: nivel ' + MODOS[modo].toLowerCase(),
      compartir: modo === 'dos' ? null : 'Cuatro en raya (' + MODOS[modo].toLowerCase() + '): ' + (!quien ? 'empate' : resultado ? 'he ganado' : 'ha ganado la máquina') + '.',
      textoRepetir: 'Otra partida', alRepetir: nueva });
  }

  nueva();
})();
