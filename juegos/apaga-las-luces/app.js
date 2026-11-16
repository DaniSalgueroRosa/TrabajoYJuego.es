/* APAGA LAS LUCES: rejilla de luces encendidas y apagadas. Al pulsar una casilla cambia ella y sus vecinas de arriba, abajo, izquierda y derecha.
   Hay que dejarlas todas apagadas. Cada tablero nace de pulsar casillas al azar sobre uno apagado, así que siempre tiene solución.
   La pista resuelve el sistema de ecuaciones del tablero (álgebra en base 2) y propone una casilla de la solución más corta. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('al');
  if (!raiz) return;
  var NIVELES = {
    facil: { nombre: 'Fácil (4×4)', n: 4, mezcla: 5, base: 600 },
    medio: { nombre: 'Medio (5×5)', n: 5, mezcla: 8, base: 900 },
    dificil: { nombre: 'Difícil (6×6)', n: 6, mezcla: 14, base: 1400 }
  };
  var NIVELES_FINAL = [[0, 'Aprendiz'], [400, 'Electricista'], [700, 'Instalador'], [1000, 'Maestro de las luces'], [1300, 'Genio de la corriente']];
  var sesion = TYJ.Sesion(null, { etiquetaMejor: 'Mejor puntuación: ' });
  var nivel = 'medio', g = null, ui = null, reloj = null, avisoPista = null;

  /* ---- lógica */
  function vecinas(n, i) {
    var r = Math.floor(i / n), c = i % n, v = [i];
    if (r > 0) v.push(i - n); if (r < n - 1) v.push(i + n); if (c > 0) v.push(i - 1); if (c < n - 1) v.push(i + 1);
    return v;
  }
  function pulsar(luces, n, i) { vecinas(n, i).forEach(function (j) { luces[j] ^= 1; }); }
  function solucionMinima(n, luces) {                      // devuelve la lista de casillas a pulsar (la menor posible) o null
    var N = n * n, M = [], i, j, k;
    for (i = 0; i < N; i++) { var fila = new Array(N + 1).fill(0); vecinas(n, i).forEach(function (v) { fila[v] = 1; }); fila[N] = luces[i]; M.push(fila); }
    var pivote = [], r = 0;
    for (var col = 0; col < N && r < N; col++) {
      var p = -1; for (i = r; i < N; i++) if (M[i][col]) { p = i; break; }
      if (p < 0) continue;
      var t = M[r]; M[r] = M[p]; M[p] = t;
      for (i = 0; i < N; i++) if (i !== r && M[i][col]) for (k = col; k <= N; k++) M[i][k] ^= M[r][k];
      pivote.push(col); r++;
    }
    for (i = r; i < N; i++) if (M[i][N]) return null;       // sin solución
    var libres = []; for (j = 0; j < N; j++) if (pivote.indexOf(j) < 0) libres.push(j);
    var part = new Array(N).fill(0); pivote.forEach(function (c, fi) { part[c] = M[fi][N]; });
    var base = libres.map(function (f) { var v = new Array(N).fill(0); v[f] = 1; pivote.forEach(function (c, fi) { v[c] = M[fi][f]; }); return v; });
    var mejor = null, pesoMejor = 1e9;
    for (var m = 0; m < (1 << libres.length); m++) {
      var x = part.slice();
      for (var b = 0; b < base.length; b++) if (m & (1 << b)) for (j = 0; j < N; j++) x[j] ^= base[b][j];
      var peso = x.reduce(function (s, v) { return s + v; }, 0);
      if (peso < pesoMejor) { pesoMejor = peso; mejor = x; }
    }
    var res = []; mejor.forEach(function (v, idx) { if (v) res.push(idx); });
    return res;
  }

  /* ---- partida */
  function nueva() {
    clearInterval(reloj); clearTimeout(avisoPista);
    var cfg = NIVELES[nivel], n = cfg.n, luces = new Array(n * n).fill(0), hechas;
    do {
      luces.fill(0);
      hechas = U.muestra(Array.from({ length: n * n }, function (_, i) { return i; }), cfg.mezcla);
      hechas.forEach(function (i) { pulsar(luces, n, i); });
    } while (luces.every(function (v) { return !v; }));
    g = { cfg: cfg, n: n, luces: luces, objetivo: cfg.mezcla, movs: 0, t0: 0, segundos: 0, fin: false, pistas: 0, pista: -1, foco: 0 };
    montar(); pintar();
    TYJ.anunciar('Nueva partida de ' + n + ' por ' + n + '. Apaga todas las luces.');
  }
  function arrancarReloj() {
    if (g.t0) return;
    g.t0 = performance.now();
    reloj = setInterval(function () { g.segundos = Math.floor((performance.now() - g.t0) / 1000); ui.hud.poner('tiempo', U.tiempo(g.segundos)); }, 500);
  }
  function tocar(i) {
    if (g.fin) return;
    arrancarReloj(); g.foco = i; g.pista = -1;
    pulsar(g.luces, g.n, i); g.movs++;
    var encendidas = g.luces.reduce(function (s, v) { return s + v; }, 0);
    ui.msg.textContent = encendidas ? 'Quedan ' + encendidas + (encendidas === 1 ? ' luz encendida.' : ' luces encendidas.') : ''; ui.msg.className = 'mensaje';
    pintar();
    if (!encendidas) ganar();
  }
  function pista() {
    if (g.fin) return;
    arrancarReloj();
    var s = solucionMinima(g.n, g.luces);
    if (!s || !s.length) return;
    g.pistas++; g.pista = s[0];
    ui.msg.textContent = 'Pista: pulsa la casilla de la fila ' + (Math.floor(g.pista / g.n) + 1) + ', columna ' + (g.pista % g.n + 1) + '. Se puede resolver en ' + s.length + (s.length === 1 ? ' pulsación.' : ' pulsaciones.'); ui.msg.className = 'mensaje';
    pintar();
    clearTimeout(avisoPista); avisoPista = setTimeout(function () { g.pista = -1; if (!g.fin) pintar(); }, 4000);
  }
  function ganar() {
    g.fin = true; clearInterval(reloj);
    g.segundos = Math.floor((performance.now() - g.t0) / 1000);
    var puntos = Math.max(100, g.cfg.base - Math.max(0, g.movs - g.objetivo) * 20 - g.segundos - g.pistas * 40);
    sesion.registrar(puntos, true);
    var nv = U.nivel(puntos, NIVELES_FINAL);
    TYJ.final(ui.final.appendChild(h('div')), { titulo: '¡Todo apagado!', puntos: puntos, unidad: 'puntos', nivel: nv,
      detalles: ['Pulsaciones: ' + g.movs + ' (había solución en ' + g.objetivo + ' o menos)', 'Tiempo: ' + U.tiempo(g.segundos), 'Pistas usadas: ' + g.pistas],
      compartir: 'Apaga las luces (' + g.n + '×' + g.n + '): ' + g.movs + ' pulsaciones en ' + U.tiempo(g.segundos) + '.', textoRepetir: 'Otro tablero', alRepetir: nueva });
    ui.msg.textContent = '';
  }

  /* ---- pantalla */
  function montar() {
    TYJ.vaciar(raiz);
    ui = { celdas: [] };
    ui.niveles = h('div', { class: 'fila', role: 'group', 'aria-label': 'Tamaño del tablero' });
    Object.keys(NIVELES).forEach(function (k) {
      ui.niveles.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(k === nivel), onclick: function () { nivel = k; nueva(); } }, NIVELES[k].nombre));
    });
    ui.hud = TYJ.hud([['movs', 'Pulsaciones', 0], ['on', 'Encendidas', 0], ['tiempo', 'Tiempo', '0:00']]);
    ui.rejilla = h('div', { class: 'al-rejilla', role: 'group', 'aria-label': 'Tablero de luces, ' + g.n + ' por ' + g.n, style: '--n:' + g.n });
    for (var i = 0; i < g.n * g.n; i++) (function (i) {
      var b = h('button', { class: 'al-celda', type: 'button', tabindex: i === 0 ? '0' : '-1', onclick: function () { tocar(i); } });
      ui.celdas.push(b); ui.rejilla.appendChild(b);
    })(i);
    ui.rejilla.addEventListener('keydown', function (ev) {
      var d = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[ev.key];
      if (!d || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      ev.preventDefault();
      var actual = ui.celdas.indexOf(ev.target); if (actual < 0) actual = g.foco;
      var r = U.limitar(Math.floor(actual / g.n) + d[0], 0, g.n - 1), c = U.limitar(actual % g.n + d[1], 0, g.n - 1), sig = r * g.n + c;
      g.foco = sig; ui.celdas.forEach(function (b, k) { b.tabIndex = k === sig ? 0 : -1; });
      ui.celdas[sig].focus();
    });
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' }, 'Pulsa una luz: cambia ella y sus cuatro vecinas. Deja todas apagadas.');
    ui.final = h('div'); ui.est = h('div');
    [ui.niveles, ui.hud.nodo, ui.rejilla, ui.msg,
      h('div', { class: 'fila fila--centro' }, h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: pista }, 'Pista (−40 puntos)'), h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: nueva }, 'Otro tablero')),
      ui.final, ui.est].forEach(function (x) { raiz.appendChild(x); });
    sesion.montar(ui.est);
  }
  function pintar() {
    ui.celdas.forEach(function (b, i) {
      var on = g.luces[i] === 1;
      b.className = 'al-celda' + (on ? ' al-on' : '') + (g.pista === i ? ' al-pista' : '');
      b.textContent = on ? '●' : '○';
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', 'Fila ' + (Math.floor(i / g.n) + 1) + ', columna ' + (i % g.n + 1) + ': ' + (on ? 'encendida' : 'apagada'));
    });
    var enc = g.luces.reduce(function (s, v) { return s + v; }, 0);
    ui.hud.poner('movs', g.movs); ui.hud.poner('on', enc);
    ui.rejilla.setAttribute('data-luces', g.luces.join(''));
    ui.rejilla.setAttribute('data-objetivo', String(g.objetivo));
  }

  nueva();
})();
