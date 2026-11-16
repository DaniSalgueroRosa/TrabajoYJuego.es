/* SERPIENTE: cuadrícula de 20×20 en un canvas. Flechas / WASD, deslizar el dedo sobre el tablero o botones de dirección.
   Dos modos: con muros (chocar acaba la partida) y sin muros (la serpiente reaparece por el lado contrario). Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('sp');
  if (!raiz) return;
  var N = 20, TAM = 400, NIVELES = [[0, 'Gusano'], [60, 'Culebrilla'], [150, 'Serpiente'], [300, 'Pitón'], [500, 'Anaconda'], [800, 'Basilisco']];
  var sesion = TYJ.Sesion(null, { etiquetaMejor: 'Mejor puntuación: ' });
  var muros = true, g = null, ui = null, reloj = null, ctx = null;

  /* ---- lógica */
  function celdaLibre() {
    var ocupadas = {};
    g.serp.forEach(function (c) { ocupadas[c.x + ',' + c.y] = true; });
    var libres = [];
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (!ocupadas[x + ',' + y]) libres.push({ x: x, y: y });
    return libres.length ? U.elegir(libres) : null;
  }
  function nueva() {
    clearInterval(reloj);
    g = { serp: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }], dir: { x: 1, y: 0 }, cola: [], comida: null, puntos: 0, estado: 'espera', ms: 140, comidas: 0 };
    g.comida = celdaLibre();
    montar(); dibujar(); datos();
    TYJ.anunciar('Nueva partida. Pulsa una flecha o el botón Empezar.');
  }
  function empezar() {
    if (g.estado !== 'espera' && g.estado !== 'pausa') return;
    g.estado = 'juego'; ui.pausa.textContent = 'Pausa'; ui.msg.textContent = '';
    clearInterval(reloj); reloj = setInterval(paso, g.ms);
    datos();
  }
  function pausar() {
    if (g.estado === 'juego') { g.estado = 'pausa'; clearInterval(reloj); ui.pausa.textContent = 'Seguir'; ui.msg.textContent = 'En pausa.'; datos(); }
    else if (g.estado === 'pausa' || g.estado === 'espera') empezar();
  }
  function girar(dx, dy) {
    if (!g || g.estado === 'fin') return;
    var ultimo = g.cola.length ? g.cola[g.cola.length - 1] : g.dir;
    if ((dx === -ultimo.x && dy === -ultimo.y) || (dx === ultimo.x && dy === ultimo.y)) { if (g.estado !== 'juego') empezar(); return; }
    if (g.cola.length < 2) g.cola.push({ x: dx, y: dy });
    if (g.estado !== 'juego') empezar();
  }
  function paso() {
    if (g.cola.length) g.dir = g.cola.shift();
    var c = g.serp[0], x = c.x + g.dir.x, y = c.y + g.dir.y;
    if (x < 0 || x >= N || y < 0 || y >= N) {
      if (muros) return terminar('Has chocado con el muro');
      x = (x + N) % N; y = (y + N) % N;
    }
    var come = g.comida && x === g.comida.x && y === g.comida.y;
    var cuerpo = come ? g.serp : g.serp.slice(0, -1);
    if (cuerpo.some(function (s) { return s.x === x && s.y === y; })) return terminar('Te has mordido la cola');
    g.serp.unshift({ x: x, y: y });
    if (come) {
      g.puntos += 10; g.comidas++; g.comida = celdaLibre();
      ui.hud.poner('puntos', g.puntos); ui.hud.poner('longitud', g.serp.length);
      g.ms = Math.max(70, 140 - g.comidas * 4);
      clearInterval(reloj); reloj = setInterval(paso, g.ms);
      TYJ.anunciar('Comida. ' + g.puntos + ' puntos.');
      if (!g.comida) return terminar('¡Has llenado todo el tablero!');
    } else g.serp.pop();
    dibujar(); datos();
  }
  function terminar(motivo) {
    clearInterval(reloj); g.estado = 'fin';
    dibujar(); datos();
    sesion.registrar(g.puntos);
    ui.msg.textContent = '';
    var nivel = U.nivel(g.puntos, NIVELES), modo = muros ? 'con muros' : 'sin muros';
    TYJ.final(ui.final.appendChild(h('div')), { titulo: motivo, puntos: g.puntos, unidad: 'puntos', nivel: nivel,
      detalles: ['Longitud final: ' + g.serp.length, 'Modo: ' + modo],
      compartir: 'Serpiente (' + modo + '): ' + g.puntos + ' puntos, longitud ' + g.serp.length + ' · ' + nivel + '.', textoRepetir: 'Jugar otra vez', alRepetir: nueva });
  }

  /* ---- pantalla */
  function montar() {
    TYJ.vaciar(raiz);
    ui = {};
    ui.modos = h('div', { class: 'fila', role: 'group', 'aria-label': 'Modo de juego' },
      h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(muros), onclick: function () { muros = true; nueva(); } }, 'Con muros'),
      h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(!muros), onclick: function () { muros = false; nueva(); } }, 'Sin muros'));
    ui.hud = TYJ.hud([['puntos', 'Puntos', 0], ['longitud', 'Longitud', g.serp.length]]);
    ui.lienzo = h('canvas', { class: 'sp-lienzo', width: String(TAM), height: String(TAM), role: 'img', 'aria-label': 'Tablero de la serpiente' });
    ui.zona = h('div', { class: 'sp-zona', tabindex: '0', role: 'group', 'aria-label': 'Zona de juego de la serpiente. Usa las flechas del teclado.' }, ui.lienzo);
    ctx = ui.lienzo.getContext('2d');
    ui.zona.addEventListener('keydown', teclas);
    var ini = null;
    ui.zona.addEventListener('pointerdown', function (ev) { ini = { x: ev.clientX, y: ev.clientY, id: ev.pointerId }; ui.zona.focus({ preventScroll: true }); });
    ui.zona.addEventListener('pointerup', function (ev) {
      if (!ini || ev.pointerId !== ini.id) return;
      var dx = ev.clientX - ini.x, dy = ev.clientY - ini.y; ini = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) girar(dx > 0 ? 1 : -1, 0); else girar(0, dy > 0 ? 1 : -1);
    });
    ui.zona.addEventListener('pointercancel', function () { ini = null; });
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    function flecha(txt, dx, dy, nombre, clase) { return h('button', { class: 'boton-retro boton-retro--chico sp-dir sp-dir--' + clase, type: 'button', 'aria-label': 'Girar ' + nombre, onclick: function () { girar(dx, dy); ui.zona.focus({ preventScroll: true }); } }, txt); }
    ui.pad = h('div', { class: 'sp-pad' }, flecha('↑', 0, -1, 'hacia arriba', 'arr'), flecha('←', -1, 0, 'a la izquierda', 'izq'), flecha('↓', 0, 1, 'hacia abajo', 'abj'), flecha('→', 1, 0, 'a la derecha', 'der'));
    ui.pausa = h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: function () { pausar(); ui.zona.focus({ preventScroll: true }); } }, 'Empezar');
    ui.final = h('div'); ui.est = h('div');
    [ui.modos, ui.hud.nodo, ui.zona, ui.msg, ui.pad,
      h('div', { class: 'fila fila--centro' }, ui.pausa, h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: nueva }, 'Nueva partida')),
      ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
  }
  function teclas(ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1], A: [-1, 0], D: [1, 0], W: [0, -1], S: [0, 1] }[ev.key];
    if (m) { ev.preventDefault(); girar(m[0], m[1]); }
    else if (ev.key === ' ' || ev.key === 'p' || ev.key === 'P') { ev.preventDefault(); if (!ev.repeat) pausar(); }
  }
  function dibujar() {
    var p = TAM / N;
    ctx.fillStyle = '#14201C'; ctx.fillRect(0, 0, TAM, TAM);
    ctx.fillStyle = '#1E2E29';
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if ((x + y) % 2 === 0) ctx.fillRect(x * p, y * p, p, p);
    if (g.comida) { ctx.fillStyle = '#FF5A7D'; ctx.fillRect(g.comida.x * p + 4, g.comida.y * p + 4, p - 8, p - 8); }
    g.serp.forEach(function (c, i) { ctx.fillStyle = i === 0 ? '#E6F14A' : '#8FD694'; ctx.fillRect(c.x * p + 1, c.y * p + 1, p - 2, p - 2); });
    if (!muros) { ctx.strokeStyle = '#3A5249'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeRect(1, 1, TAM - 2, TAM - 2); ctx.setLineDash([]); }
    else { ctx.strokeStyle = '#EAF2EE'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, TAM - 4, TAM - 4); }
  }
  function datos() {                                    // estado legible desde fuera (lectores de pantalla y pruebas automáticas)
    var c = g.serp[0], l = ui.lienzo;
    l.setAttribute('data-estado', g.estado);
    l.setAttribute('data-cabeza', c.x + ',' + c.y);
    l.setAttribute('data-comida', g.comida ? g.comida.x + ',' + g.comida.y : '');
    l.setAttribute('data-direccion', g.dir.x + ',' + g.dir.y);
    l.setAttribute('data-longitud', String(g.serp.length));
    l.setAttribute('aria-label', 'Tablero de la serpiente. Longitud ' + g.serp.length + ', ' + g.puntos + ' puntos' + (g.estado === 'fin' ? '. Partida terminada' : ''));
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden && g && g.estado === 'juego') pausar(); });

  nueva();
})();
