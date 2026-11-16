/* LADRILLOS: una pala, una bola y un muro de ladrillos. Mueve la pala con el ratón, el dedo o las flechas; lanza con la barra espaciadora o con un toque.
   Tres vidas; cada muro limpio abre otro más difícil y con la bola más rápida. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('ld');
  if (!raiz) return;
  var W = 480, H = 360, COLS = 8, BW = 54, BH = 18, GAP = 4, X0 = (W - (COLS * BW + (COLS - 1) * GAP)) / 2, Y0 = 36;
  var PALA_Y = 334, PALA_H = 10, PALA_W = 76, RB = 6;
  var COLORES = ['#FF5A7D', '#FFB86B', '#E6F14A', '#8FD694', '#6EC1FF', '#B9A0F5'];
  var NIVELES = [[0, 'Pelotillero'], [300, 'Rebotador'], [800, 'Demoledor'], [1500, 'Maestro de la pala'], [2500, 'Leyenda del muro']];
  var sesion = TYJ.Sesion(null, { etiquetaMejor: 'Mejor puntuación: ' });
  var g = null, ui = null;

  /* ---- muros: cada nivel usa un dibujo; 0 = hueco, 1 = un golpe, 2 = dos golpes */
  function muro(nivel) {
    var tipo = (nivel - 1) % 4, vuelta = Math.floor((nivel - 1) / 4), filas = [], f, c;
    var n = Math.min(5 + vuelta, 6);
    for (f = 0; f < n; f++) {
      var fila = [];
      for (c = 0; c < COLS; c++) {
        var v = 1;
        if (tipo === 1 && (f + c) % 2) v = 0;                                  // tablero de ajedrez
        if (tipo === 2 && (c < f - 1 || c > COLS - f + 0)) v = 0;              // dos ramas que se estrechan
        if (tipo === 3 && f % 2 === 1 && c % 3 === 1) v = 0;                   // franjas con ventanas
        if (v && f === 0 && (tipo >= 1 || vuelta)) v = 2;                      // la fila de arriba resiste dos golpes
        if (v && vuelta && f === 1 && c % 2 === 0) v = 2;
        fila.push(v);
      }
      filas.push(fila);
    }
    return filas;
  }
  function ladrillos(nivel) {
    var r = [];
    muro(nivel).forEach(function (fila, f) {
      fila.forEach(function (v, c) { if (v) r.push({ x: X0 + c * (BW + GAP), y: Y0 + f * (BH + GAP), w: BW, h: BH, golpes: v, color: COLORES[f % COLORES.length] }); });
    });
    return r;
  }

  /* ---- partida */
  function nueva() {
    cancelAnimationFrame(g && g.raf);
    g = { estado: 'espera', nivel: 1, vidas: 3, puntos: 0, rotos: 0, pala: { x: W / 2 }, bola: null, bricks: ladrillos(1), izq: false, der: false, ultimo: 0, raf: 0, velocidad: 0 };
    pegarBola();
    montar(); dibujar(); datos();
    TYJ.anunciar('Nueva partida. Lanza la bola con la barra espaciadora o con un toque.');
  }
  function pegarBola() {
    g.bola = { x: g.pala.x, y: PALA_Y - RB - 1, vx: 0, vy: 0, pegada: true };
    g.velocidad = 250 + 24 * (g.nivel - 1);
  }
  function lanzar() {
    if (g.estado === 'espera') { g.estado = 'juego'; g.ultimo = performance.now(); ui.pausa.textContent = 'Pausa'; ui.msg.textContent = ''; g.raf = requestAnimationFrame(cuadro); }
    if (g.estado !== 'juego' || !g.bola.pegada) return;
    var ang = (Math.random() * 50 - 25) * Math.PI / 180;
    g.bola.pegada = false; g.bola.vx = g.velocidad * Math.sin(ang); g.bola.vy = -g.velocidad * Math.cos(ang);
    ui.msg.textContent = '';
    datos();
  }
  function pausar() {
    if (g.estado === 'juego') { g.estado = 'pausa'; cancelAnimationFrame(g.raf); ui.pausa.textContent = 'Seguir'; ui.msg.textContent = 'En pausa.'; datos(); }
    else if (g.estado === 'pausa') { g.estado = 'juego'; g.ultimo = performance.now(); ui.pausa.textContent = 'Pausa'; ui.msg.textContent = ''; g.raf = requestAnimationFrame(cuadro); datos(); }
    else if (g.estado === 'espera') lanzar();
  }
  function cuadro(t) {
    if (g.estado !== 'juego') return;
    var dt = Math.min(0.033, (t - g.ultimo) / 1000); g.ultimo = t;
    avanzar(dt); dibujar(); datos();
    if (g.estado === 'juego') g.raf = requestAnimationFrame(cuadro);
  }
  function avanzar(dt) {
    var v = (g.der ? 1 : 0) - (g.izq ? 1 : 0);
    if (v) g.pala.x = U.limitar(g.pala.x + v * 440 * dt, PALA_W / 2, W - PALA_W / 2);
    var b = g.bola;
    if (b.pegada) { b.x = g.pala.x; return; }
    var pasos = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 3));
    for (var i = 0; i < pasos; i++) {
      b.x += b.vx * dt / pasos; b.y += b.vy * dt / pasos;
      if (b.x < RB) { b.x = RB; b.vx = Math.abs(b.vx); } else if (b.x > W - RB) { b.x = W - RB; b.vx = -Math.abs(b.vx); }
      if (b.y < RB) { b.y = RB; b.vy = Math.abs(b.vy); }
      if (b.vy > 0 && b.y + RB >= PALA_Y && b.y + RB <= PALA_Y + PALA_H + 6 && Math.abs(b.x - g.pala.x) <= PALA_W / 2 + RB) {
        var rel = U.limitar((b.x - g.pala.x) / (PALA_W / 2), -1, 1), ang = rel * 62 * Math.PI / 180, vel = Math.hypot(b.vx, b.vy);
        b.vx = vel * Math.sin(ang); b.vy = -vel * Math.cos(ang); b.y = PALA_Y - RB;
      }
      if (golpearLadrillo()) break;
      if (b.y - RB > H) return perderVida();
    }
  }
  function golpearLadrillo() {
    var b = g.bola;
    for (var i = 0; i < g.bricks.length; i++) {
      var k = g.bricks[i], cx = U.limitar(b.x, k.x, k.x + k.w), cy = U.limitar(b.y, k.y, k.y + k.h), dx = b.x - cx, dy = b.y - cy;
      if (dx * dx + dy * dy > RB * RB) continue;
      if (dx === 0 && dy === 0) b.vy = -b.vy;
      else if (Math.abs(dx) > Math.abs(dy)) { b.vx = (dx > 0 ? 1 : -1) * Math.abs(b.vx); b.x += dx > 0 ? 1 : -1; }
      else { b.vy = (dy > 0 ? 1 : -1) * Math.abs(b.vy); b.y += dy > 0 ? 1 : -1; }
      k.golpes--; g.puntos += 10;
      if (k.golpes <= 0) { g.bricks.splice(i, 1); g.rotos++; }
      var tope = g.velocidad * 1.45, vel = Math.hypot(b.vx, b.vy);
      if (vel < tope) { var f = 1.012; b.vx *= f; b.vy *= f; }
      ui.hud.poner('puntos', g.puntos);
      if (!g.bricks.length) subirNivel();
      return true;
    }
    return false;
  }
  function subirNivel() {
    g.puntos += 100 * g.nivel; g.nivel++;
    g.bricks = ladrillos(g.nivel); pegarBola();
    ui.hud.poner('puntos', g.puntos); ui.hud.poner('nivel', g.nivel);
    ui.msg.textContent = 'Muro ' + (g.nivel - 1) + ' limpio. Lanza cuando quieras.';
    TYJ.anunciar('Muro limpio. Empieza el nivel ' + g.nivel + '.');
  }
  function perderVida() {
    g.vidas--; ui.hud.poner('vidas', g.vidas);
    if (g.vidas <= 0) return terminar();
    pegarBola();
    ui.msg.textContent = 'Te quedan ' + g.vidas + (g.vidas === 1 ? ' vida' : ' vidas') + '. Lanza cuando quieras.';
    TYJ.anunciar('Bola perdida. Te quedan ' + g.vidas + (g.vidas === 1 ? ' vida.' : ' vidas.'));
  }
  function terminar() {
    cancelAnimationFrame(g.raf); g.estado = 'fin';
    dibujar(); datos();
    sesion.registrar(g.puntos);
    ui.msg.textContent = '';
    var nivel = U.nivel(g.puntos, NIVELES);
    TYJ.final(ui.final.appendChild(h('div')), { titulo: 'Se acabaron las bolas', puntos: g.puntos, unidad: 'puntos', nivel: nivel,
      detalles: ['Ladrillos rotos: ' + g.rotos, 'Muro alcanzado: ' + g.nivel],
      compartir: 'Ladrillos: ' + g.puntos + ' puntos, ' + g.rotos + ' ladrillos rotos, muro ' + g.nivel + ' · ' + nivel + '.', textoRepetir: 'Jugar otra vez', alRepetir: nueva });
  }

  /* ---- pantalla */
  function montar() {
    TYJ.vaciar(raiz);
    ui = {};
    ui.hud = TYJ.hud([['puntos', 'Puntos', 0], ['vidas', 'Vidas', g.vidas], ['nivel', 'Muro', g.nivel]]);
    ui.lienzo = h('canvas', { class: 'ld-lienzo', width: String(W), height: String(H), role: 'img', 'aria-label': 'Tablero de ladrillos' });
    ui.zona = h('div', { class: 'ld-zona', tabindex: '0', role: 'group', 'aria-label': 'Zona de juego. Flechas izquierda y derecha mueven la pala; la barra espaciadora lanza la bola.' }, ui.lienzo);
    function mueve(ev) { var r = ui.lienzo.getBoundingClientRect(); g.pala.x = U.limitar((ev.clientX - r.left) / r.width * W, PALA_W / 2, W - PALA_W / 2); if (g.bola.pegada) g.bola.x = g.pala.x; if (g.estado !== 'juego') { dibujar(); datos(); } }
    ui.zona.addEventListener('pointermove', mueve);
    ui.zona.addEventListener('pointerdown', function (ev) { mueve(ev); ui.zona.focus({ preventScroll: true }); if (g.estado === 'pausa') return; lanzar(); });
    ui.zona.addEventListener('keydown', teclas);
    ui.zona.addEventListener('keyup', function (ev) { if (ev.key === 'ArrowLeft' || ev.key === 'a' || ev.key === 'A') g.izq = false; if (ev.key === 'ArrowRight' || ev.key === 'd' || ev.key === 'D') g.der = false; });
    ui.zona.addEventListener('blur', function () { g.izq = false; g.der = false; });
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' }, 'Mueve la pala con el ratón, el dedo o las flechas. Lanza la bola con la barra espaciadora o con un toque.');
    function lado(txt, nombre, tecla) {
      var b = h('button', { class: 'boton-retro boton-retro--chico ld-btn', type: 'button', 'aria-label': nombre }, txt);
      b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); g[tecla] = true; if (g.estado === 'espera') lanzar(); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (e) { b.addEventListener(e, function () { g[tecla] = false; }); });
      return b;
    }
    ui.pad = h('div', { class: 'ld-pad' }, lado('◀', 'Mover la pala a la izquierda', 'izq'),
      h('button', { class: 'boton-retro boton-retro--chico ld-btn', type: 'button', 'aria-label': 'Lanzar la bola', onclick: lanzar }, 'Lanzar'), lado('▶', 'Mover la pala a la derecha', 'der'));
    ui.pausa = h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: function () { pausar(); } }, 'Empezar');
    ui.final = h('div'); ui.est = h('div');
    [ui.hud.nodo, ui.zona, ui.msg, ui.pad,
      h('div', { class: 'fila fila--centro' }, ui.pausa, h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: nueva }, 'Nueva partida')),
      ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
  }
  function teclas(ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var k = ev.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { ev.preventDefault(); g.izq = true; if (g.estado === 'espera') lanzar(); else if (g.estado === 'pausa') return; }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { ev.preventDefault(); g.der = true; if (g.estado === 'espera') lanzar(); }
    else if (k === ' ' || k === 'ArrowUp') { ev.preventDefault(); if (!ev.repeat) lanzar(); }
    else if (k === 'p' || k === 'P') { ev.preventDefault(); if (!ev.repeat && g.estado !== 'espera') pausar(); }
  }

  /* ---- dibujo */
  function dibujar() {
    var ctx = ui.lienzo.getContext('2d');
    ctx.fillStyle = '#14201C'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1B2A25';
    for (var y = 0; y < H; y += 24) for (var x = ((y / 24) % 2) * 24; x < W; x += 48) ctx.fillRect(x, y, 24, 24);
    g.bricks.forEach(function (k) {
      ctx.fillStyle = k.color; ctx.fillRect(k.x, k.y, k.w, k.h);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(k.x, k.y, k.w, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(k.x, k.y + k.h - 3, k.w, 3);
      if (k.golpes > 1) { ctx.strokeStyle = '#14201C'; ctx.lineWidth = 3; ctx.strokeRect(k.x + 5, k.y + 5, k.w - 10, k.h - 10); }
    });
    ctx.fillStyle = '#E6F14A'; ctx.fillRect(g.pala.x - PALA_W / 2, PALA_Y, PALA_W, PALA_H);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(g.pala.x - PALA_W / 2, PALA_Y + PALA_H - 3, PALA_W, 3);
    ctx.beginPath(); ctx.arc(g.bola.x, g.bola.y, RB, 0, Math.PI * 2); ctx.fillStyle = '#EAF2EE'; ctx.fill();
    ctx.strokeStyle = '#3A5249'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, W - 4, H - 4);
  }
  function datos() {                                    // estado legible desde fuera (lectores de pantalla y pruebas automáticas)
    var l = ui.lienzo, b = g.bola;
    l.setAttribute('data-estado', g.estado);
    l.setAttribute('data-bola', Math.round(b.x) + ',' + Math.round(b.y) + (b.pegada ? ',pegada' : ''));
    l.setAttribute('data-pala', String(Math.round(g.pala.x)));
    l.setAttribute('data-ladrillos', String(g.bricks.length));
    l.setAttribute('data-vidas', String(g.vidas));
    l.setAttribute('data-puntos', String(g.puntos));
    l.setAttribute('data-nivel', String(g.nivel));
    l.setAttribute('aria-label', 'Ladrillos. ' + g.puntos + ' puntos, ' + g.vidas + ' vidas, muro ' + g.nivel + ', quedan ' + g.bricks.length + ' ladrillos' + (g.estado === 'fin' ? '. Partida terminada' : ''));
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden && g && g.estado === 'juego') pausar(); });

  nueva();
})();
