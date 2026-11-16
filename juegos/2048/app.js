/* 2048: tablero 4×4. Flechas / WASD, deslizar con el dedo y botones de dirección. Código propio. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('d48');
  if (!raiz) return;
  var N = 4, NIVELES = [[0, 'Calentando'], [128, 'Aprendiz'], [512, 'Constante'], [1024, 'Estratega'], [2048, 'Maestro del 2048'], [4096, 'Leyenda']];
  var sesion = TYJ.Sesion(null, {}), g, ui;

  /* ---- lógica pura (sin DOM) */
  function indices(dir, i) {                       // celdas de la línea i, ordenadas desde el lado hacia el que se desliza
    var r = [], k;
    for (k = 0; k < N; k++) {
      if (dir === 'izq') r.push(i * N + k);
      else if (dir === 'der') r.push(i * N + (N - 1 - k));
      else if (dir === 'arr') r.push(k * N + i);
      else r.push((N - 1 - k) * N + i);
    }
    return r;
  }
  function mover(celdas, dir) {
    var nuevas = celdas.slice(), puntos = 0, fusiones = [], movido = false, i, k;
    for (i = 0; i < N; i++) {
      var idx = indices(dir, i), vals = idx.map(function (j) { return celdas[j]; }).filter(function (v) { return v; }), sal = [], marcas = [];
      for (k = 0; k < vals.length; k++) {
        if (k + 1 < vals.length && vals[k] === vals[k + 1]) { sal.push(vals[k] * 2); puntos += vals[k] * 2; marcas.push(sal.length - 1); k++; }
        else sal.push(vals[k]);
      }
      while (sal.length < N) sal.push(0);
      idx.forEach(function (j, p) { nuevas[j] = sal[p]; if (sal[p] !== celdas[j]) movido = true; if (marcas.indexOf(p) >= 0) fusiones.push(j); });
    }
    return { celdas: nuevas, puntos: puntos, fusiones: fusiones, movido: movido };
  }
  function hayMovimientos(celdas) {
    return ['izq', 'der', 'arr', 'abj'].some(function (d) { return mover(celdas, d).movido; });
  }
  function nuevaFicha(celdas) {
    var libres = [];
    celdas.forEach(function (v, i) { if (!v) libres.push(i); });
    if (!libres.length) return -1;
    var i = U.elegir(libres); celdas[i] = Math.random() < 0.9 ? 2 : 4; return i;
  }

  /* ---- juego */
  function empezar() {
    if (g && g.puntos > 0 && !g.registrada) sesion.registrar(g.puntos);
    g = { celdas: Array.apply(null, { length: N * N }).map(function () { return 0; }), puntos: 0, fin: false, ganado: false, seguir: false, registrada: false };
    nuevaFicha(g.celdas); nuevaFicha(g.celdas);
    montar(); pintar([], -1);
  }

  function montar() {
    TYJ.vaciar(raiz);
    ui = {};
    ui.hud = TYJ.hud([['puntos', 'Puntos', 0], ['mejor', 'Mejor de la sesión', sesion.datos.partidas ? U.miles(sesion.datos.mejor) : '–']]);
    ui.tablero = h('div', { class: 'd48-tablero', tabindex: '0', role: 'group', 'aria-label': 'Tablero de 2048. Usa las flechas del teclado.' });
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    ui.aviso = h('div', { class: 'd48-aviso fila fila--centro', hidden: true });
    function flecha(txt, dir, nombre) { return h('button', { class: 'boton-retro boton-retro--chico d48-dir d48-dir--' + dir, type: 'button', 'aria-label': 'Mover ' + nombre, onclick: function () { jugar(dir); ui.tablero.focus({ preventScroll: true }); } }, txt); }
    ui.pad = h('div', { class: 'd48-pad' }, flecha('↑', 'arr', 'arriba'), flecha('←', 'izq', 'a la izquierda'), flecha('↓', 'abj', 'abajo'), flecha('→', 'der', 'a la derecha'));
    ui.nueva = h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: empezar }, 'Nueva partida');
    ui.final = h('div'); ui.est = h('div');
    [ui.hud.nodo, ui.tablero, ui.msg, ui.aviso, ui.pad, h('div', { class: 'fila fila--centro' }, ui.nueva), ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
    ui.tablero.addEventListener('keydown', teclas);
    var ini = null;
    ui.tablero.addEventListener('pointerdown', function (ev) { ini = { x: ev.clientX, y: ev.clientY, id: ev.pointerId }; ui.tablero.focus({ preventScroll: true }); });
    ui.tablero.addEventListener('pointerup', function (ev) {
      if (!ini || ev.pointerId !== ini.id) return;
      var dx = ev.clientX - ini.x, dy = ev.clientY - ini.y; ini = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      jugar(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'der' : 'izq') : (dy > 0 ? 'abj' : 'arr'));
    });
    ui.tablero.addEventListener('pointercancel', function () { ini = null; });
    ui.tablero.focus({ preventScroll: true });
  }

  function teclas(ev) {
    var m = { ArrowLeft: 'izq', ArrowRight: 'der', ArrowUp: 'arr', ArrowDown: 'abj', a: 'izq', A: 'izq', d: 'der', D: 'der', w: 'arr', W: 'arr', s: 'abj', S: 'abj' }[ev.key];
    if (!m || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    ev.preventDefault();
    jugar(m);
  }

  function jugar(dir) {
    if (g.fin || (g.ganado && !g.seguir)) return;
    var r = mover(g.celdas, dir);
    if (!r.movido) return;
    g.celdas = r.celdas; g.puntos += r.puntos;
    var nueva = nuevaFicha(g.celdas);
    pintar(r.fusiones, nueva);
    if (!g.ganado && g.celdas.indexOf(2048) >= 0) { g.ganado = true; ganar(); }
    else if (!hayMovimientos(g.celdas)) terminar();
  }

  function pintar(fusiones, nueva) {
    TYJ.vaciar(ui.tablero);
    g.celdas.forEach(function (v, i) {
      var d = String(v).length, clase = 'd48-celda' + (v ? ' d48-v' + Math.min(v, 4096) : '') + (fusiones.indexOf(i) >= 0 ? ' d48-fusion' : '') + (i === nueva ? ' d48-nueva' : '');
      ui.tablero.appendChild(h('div', { class: clase, 'data-d': v ? d : 0, 'aria-label': v ? String(v) : 'vacía', texto: v ? String(v) : '' }));
    });
    ui.hud.poner('puntos', U.miles(g.puntos));
    var maxima = Math.max.apply(null, g.celdas);
    ui.tablero.setAttribute('aria-label', 'Tablero de 2048. Ficha más alta: ' + maxima + '. Puntos: ' + g.puntos + '. Usa las flechas del teclado.');
  }

  function ganar() {
    ui.msg.textContent = '¡Has llegado a 2048!'; ui.msg.className = 'mensaje mensaje--ok';
    TYJ.vaciar(ui.aviso); ui.aviso.hidden = false;
    ui.aviso.appendChild(h('button', { class: 'boton-retro', type: 'button', onclick: function () { g.seguir = true; ui.aviso.hidden = true; ui.msg.textContent = ''; ui.tablero.focus(); if (!hayMovimientos(g.celdas)) terminar(); } }, 'Seguir jugando'));
    TYJ.anunciar('Has llegado a 2048. Puedes seguir jugando.');
  }

  function terminar() {
    g.fin = true; g.registrada = true;
    var maxima = Math.max.apply(null, g.celdas);
    sesion.registrar(g.puntos);
    ui.hud.poner('mejor', U.miles(sesion.datos.mejor));
    ui.msg.textContent = ''; ui.aviso.hidden = true;
    var cont = h('div'); ui.final.appendChild(cont);
    TYJ.final(cont, { titulo: 'No quedan movimientos', puntos: g.puntos, unidad: 'puntos', nivel: U.nivel(maxima, NIVELES),
      detalles: ['Ficha más alta: ' + maxima], compartir: '2048: he llegado a la ficha ' + maxima + ' con ' + U.miles(g.puntos) + ' puntos.', textoRepetir: 'Nueva partida', alRepetir: empezar });
  }

  empezar();
})();
