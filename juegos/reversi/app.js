/* REVERSI: tablero de 8×8, tú juegas con las fichas negras y empiezas. Colocas una ficha de modo que encierres en línea recta fichas blancas contra otra negra: se voltean todas.
   Si no tienes jugadas, pasas el turno. Gana quien tenga más fichas cuando ya no queda ninguna jugada para nadie.
   Niveles: Fácil (jugadas al azar), Normal (prefiere esquinas y voltear muchas) y Difícil (mira cuatro jugadas hacia delante). Puntuación: tus fichas, +20 si ganas (+10 si empatas), por 1, 2 o 3 según el nivel. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('rv');
  if (!raiz) return;

  var N = 8, NEGRA = 1, BLANCA = 2, LETRAS = 'ABCDEFGH';
  var NIVELES = { 1: 'Fácil', 2: 'Normal', 3: 'Difícil' };
  var DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  var Q = [[100, -20, 10, 5], [-20, -50, -2, -2], [10, -2, -1, -1], [5, -2, -1, -1]], PESO = [];
  for (var py = 0; py < N; py++) for (var px = 0; px < N; px++) PESO.push(Q[Math.min(py, N - 1 - py)][Math.min(px, N - 1 - px)]);
  var sesion = TYJ.Sesion(null, { victorias: true, mejor: true, etiquetaMejor: 'Mejor puntuación: ', racha: false });
  var nivel = 2, ayuda = true, g = null, ui = null;

  function nombre(i) { return LETRAS.charAt(i % N) + (Math.floor(i / N) + 1); }
  function inicial() {
    var t = []; for (var i = 0; i < N * N; i++) t.push(0);
    t[27] = BLANCA; t[28] = NEGRA; t[35] = NEGRA; t[36] = BLANCA;
    return t;
  }
  /* Fichas que se voltean si `color` pone en la casilla i (vacío si no se puede) */
  function voltea(tab, i, color) {
    if (tab[i] !== 0) return [];
    var x = i % N, y = Math.floor(i / N), rival = 3 - color, total = [];
    DIRS.forEach(function (d) {
      var cx = x + d[1], cy = y + d[0], linea = [];
      while (cx >= 0 && cx < N && cy >= 0 && cy < N && tab[cy * N + cx] === rival) { linea.push(cy * N + cx); cx += d[1]; cy += d[0]; }
      if (linea.length && cx >= 0 && cx < N && cy >= 0 && cy < N && tab[cy * N + cx] === color) total = total.concat(linea);
    });
    return total;
  }
  function legales(tab, color) {
    var r = [];
    for (var i = 0; i < N * N; i++) { var v = voltea(tab, i, color); if (v.length) r.push({ i: i, v: v }); }
    return r;
  }
  function jugar(tab, m, color) { var t = tab.slice(); t[m.i] = color; m.v.forEach(function (c) { t[c] = color; }); return t; }
  function cuenta(tab, color) { var n = 0; for (var i = 0; i < tab.length; i++) if (tab[i] === color) n++; return n; }

  /* ---- Ordenador */
  function evaluar(tab, yo) {
    var s = 0;
    for (var i = 0; i < N * N; i++) { if (tab[i] === yo) s += PESO[i]; else if (tab[i]) s -= PESO[i]; }
    return s + 4 * (legales(tab, yo).length - legales(tab, 3 - yo).length);
  }
  function buscar(tab, color, yo, prof, alfa, beta) {
    var ms = legales(tab, color);
    if (!ms.length) {
      if (!legales(tab, 3 - color).length) return (cuenta(tab, yo) - cuenta(tab, 3 - yo)) * 1000;
      return buscar(tab, 3 - color, yo, prof, alfa, beta);
    }
    if (prof === 0) return evaluar(tab, yo);
    var maximiza = color === yo, mejor = maximiza ? -Infinity : Infinity;
    for (var k = 0; k < ms.length; k++) {
      var v = buscar(jugar(tab, ms[k], color), 3 - color, yo, prof - 1, alfa, beta);
      if (maximiza) { if (v > mejor) mejor = v; if (mejor > alfa) alfa = mejor; } else { if (v < mejor) mejor = v; if (mejor < beta) beta = mejor; }
      if (beta <= alfa) break;
    }
    return mejor;
  }
  function elegirIA(tab) {
    var ms = legales(tab, BLANCA), mejor = null, vm = -Infinity;
    if (nivel === 1) return ms[U.entre(0, ms.length - 1)];
    ms.forEach(function (m) {
      var v = nivel === 2 ? PESO[m.i] * 2 + m.v.length : buscar(jugar(tab, m, BLANCA), NEGRA, BLANCA, 3, -Infinity, Infinity);
      if (v > vm || (v === vm && Math.random() < 0.5)) { vm = v; mejor = m; }
    });
    return mejor;
  }

  /* ---- Partida */
  function nueva() {
    g = { tab: inicial(), turno: NEGRA, fin: false, ultima: -1 };
    montar(); pintar();
    ui.msg.textContent = 'Tu turno: coloca una ficha negra donde encierres fichas blancas.';
  }
  function pintar() {
    var ley = g.turno === NEGRA && !g.fin ? legales(g.tab, NEGRA).map(function (m) { return m.i; }) : [];
    for (var i = 0; i < N * N; i++) {
      var b = ui.celdas[i], v = g.tab[i], legal = ley.indexOf(i) >= 0;
      b.className = 'rv-celda' + (legal && ayuda ? ' rv-celda--legal' : '') + (i === g.ultima ? ' rv-celda--ultima' : '');
      var ficha = b.firstChild; ficha.className = 'rv-ficha' + (v === NEGRA ? ' rv-ficha--negra' : v === BLANCA ? ' rv-ficha--blanca' : '');
      b.setAttribute('aria-label', nombre(i) + ': ' + (v === NEGRA ? 'ficha negra (tuya)' : v === BLANCA ? 'ficha blanca (del ordenador)' : legal ? 'vacía, jugada válida' : 'vacía'));
    }
    ui.hud.poner('negras', cuenta(g.tab, NEGRA));
    ui.hud.poner('blancas', cuenta(g.tab, BLANCA));
    ui.hud.poner('turno', g.fin ? 'Fin' : g.turno === NEGRA ? 'Tú' : 'Ordenador');
  }
  function decir(t) { ui.msg.textContent = t; TYJ.anunciar(t); }

  function alPulsar(i) {
    if (g.fin || g.turno !== NEGRA) return;
    var v = voltea(g.tab, i, NEGRA);
    if (!v.length) { decir('Esa casilla no vale: tienes que encerrar al menos una ficha blanca en línea recta.'); return; }
    g.tab = jugar(g.tab, { i: i, v: v }, NEGRA); g.ultima = i;
    siguiente(NEGRA, 'Pones en ' + nombre(i) + ' y volteas ' + v.length + (v.length === 1 ? ' ficha.' : ' fichas.'));
  }
  function turnoIA(mia) {
    if (g !== mia || g.fin) return;
    var m = elegirIA(g.tab);
    g.tab = jugar(g.tab, m, BLANCA); g.ultima = m.i;
    siguiente(BLANCA, 'El ordenador pone en ' + nombre(m.i) + ' y voltea ' + m.v.length + (m.v.length === 1 ? ' ficha.' : ' fichas.'));
  }
  function siguiente(quien, texto) {
    var otro = 3 - quien, mia = g;
    pintar();
    if (legales(g.tab, otro).length) {
      g.turno = otro; pintar();
      if (otro === BLANCA) { decir(texto); setTimeout(function () { turnoIA(mia); }, 650); }
      else decir(texto + ' Tu turno.');
      return;
    }
    if (legales(g.tab, quien).length) {
      g.turno = quien; pintar();
      if (quien === BLANCA) { decir(texto + ' No tienes jugadas válidas: pasas el turno.'); setTimeout(function () { turnoIA(mia); }, 900); }
      else decir(texto + ' El ordenador no tiene jugadas y pasa; sigues tú.');
      return;
    }
    acabar(texto);
  }
  function acabar(texto) {
    g.fin = true; pintar();
    var a = cuenta(g.tab, NEGRA), b = cuenta(g.tab, BLANCA), gana = a > b, empate = a === b;
    var puntos = (a + (gana ? 20 : empate ? 10 : 0)) * nivel;
    sesion.registrar(puntos, gana);
    ui.msg.textContent = '';
    TYJ.final(ui.final.appendChild(h('div')), { titulo: gana ? '¡Has ganado!' : empate ? 'Empate' : 'Ha ganado el ordenador', puntos: puntos, unidad: 'puntos', nivel: 'Nivel ' + NIVELES[nivel],
      detalles: ['Fichas: tú ' + a + ', ordenador ' + b, texto],
      compartir: 'Reversi (' + NIVELES[nivel].toLowerCase() + '): ' + (gana ? 'gané ' : empate ? 'empaté ' : 'perdí ') + a + ' a ' + b + ' (' + puntos + ' puntos).', textoRepetir: 'Otra partida', alRepetir: nueva });
  }

  /* ---- Pantalla */
  function flechas(ev, i) {
    var x = i % N, y = Math.floor(i / N), j = null;
    if (ev.key === 'ArrowLeft' && x > 0) j = i - 1; else if (ev.key === 'ArrowRight' && x < N - 1) j = i + 1;
    else if (ev.key === 'ArrowUp' && y > 0) j = i - N; else if (ev.key === 'ArrowDown' && y < N - 1) j = i + N;
    if (j === null) return;
    ev.preventDefault();
    ui.celdas.forEach(function (b) { b.setAttribute('tabindex', '-1'); });
    ui.celdas[j].setAttribute('tabindex', '0'); ui.celdas[j].focus();
  }
  function montar() {
    TYJ.vaciar(raiz); ui = { celdas: [] };
    var niveles = h('div', { class: 'fila', role: 'group', 'aria-label': 'Nivel del ordenador' });
    [1, 2, 3].forEach(function (n) {
      niveles.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(n === nivel), onclick: function (ev) {
        if (n === nivel) return; nivel = n; nueva();
      } }, NIVELES[n]));
    });
    var verAyuda = h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(ayuda), onclick: function (ev) {
      ayuda = !ayuda; ev.currentTarget.setAttribute('aria-pressed', String(ayuda)); pintar();
    } }, 'Mostrar jugadas posibles');
    ui.hud = TYJ.hud([['negras', 'Tus fichas', '2'], ['blancas', 'Ordenador', '2'], ['turno', 'Turno', 'Tú']]);
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    var tablero = h('div', { class: 'rv-tablero', role: 'group', 'aria-label': 'Tablero de Reversi de 8 por 8' });
    for (var i = 0; i < N * N; i++) {
      (function (k) {
        var b = h('button', { class: 'rv-celda', type: 'button', 'data-i': String(k), tabindex: k === 0 ? '0' : '-1', onclick: function () { alPulsar(k); }, onkeydown: function (ev) { flechas(ev, k); } }, h('span', { class: 'rv-ficha' }));
        ui.celdas.push(b); tablero.appendChild(b);
      })(i);
    }
    ui.final = h('div'); ui.est = h('div');
    [h('div', { class: 'fila' }, niveles, verAyuda, h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', onclick: nueva }, 'Reiniciar')),
      ui.hud.nodo, ui.msg, tablero, ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
  }

  nueva();
})();
