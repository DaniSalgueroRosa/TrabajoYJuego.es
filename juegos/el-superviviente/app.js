/* EL SUPERVIVIENTE: esquiva bloques que caen cada vez más rápido y recoge estrellas. 3 vidas. Teclado, ratón/dedo y botones.
   Dibujo en <canvas> con píxeles grandes; pausa automática si la pestaña pasa a segundo plano. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('sv');
  if (!raiz) return;
  var W = 320, H = 480, VIDAS = 3, NIVELES = [[0, 'Polvo cósmico'], [200, 'Novato'], [500, 'Esquivador'], [900, 'Piloto'], [1400, 'As'], [2000, 'Superviviente']];
  var sesion = TYJ.Sesion(null, {}), ui, ctx, c, s, raf = 0, ultimo = 0, teclas = { izq: false, der: false }, objetivo = null, ultimoHud = 0;

  function color(nombre, defecto) { var v = getComputedStyle(raiz).getPropertyValue(nombre).trim(); return v || defecto; }

  function montar() {
    TYJ.vaciar(raiz);
    ui = {};
    c = {
      fondo: color('--tinta', '#14201C'), tiza: color('--tiza', '#EAF2EE'), limon: color('--limon', '#E6F14A'), rosa: color('--sandia', '#FF5A7D'), linea: color('--noche-linea', '#3A5249')
    };
    ui.hud = TYJ.hud([['vidas', 'Vidas', VIDAS], ['puntos', 'Puntos', 0], ['tiempo', 'Tiempo', '0:00']]);
    ui.canvas = h('canvas', { class: 'sv-canvas', width: W, height: H, tabindex: '0', role: 'img', 'aria-label': 'Zona de juego. Mueve la nave a izquierda y derecha para esquivar los bloques rosas y recoger las estrellas amarillas.' });
    ctx = ui.canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    ui.velo = h('div', { class: 'sv-velo' });
    ui.zona = h('div', { class: 'sv-zona' }, ui.canvas, ui.velo);
    function boton(txt, clave, nombre) {
      var b = h('button', { class: 'boton-retro sv-mando', type: 'button', 'aria-label': 'Mover ' + nombre + ' (mantén pulsado)' }, txt);
      function pon(v) { return function (ev) { ev.preventDefault(); teclas[clave] = v; }; }
      b.addEventListener('pointerdown', pon(true)); b.addEventListener('pointerup', pon(false)); b.addEventListener('pointerleave', pon(false)); b.addEventListener('pointercancel', pon(false));
      b.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
      return b;
    }
    ui.mandos = h('div', { class: 'sv-mandos' }, boton('◀', 'izq', 'a la izquierda'), h('button', { class: 'boton-retro boton-retro--sec sv-pausa', type: 'button', onclick: function () { if (s && s.estado === 'jugando') pausar(); } }, 'Pausa'), boton('▶', 'der', 'a la derecha'));
    ui.final = h('div'); ui.est = h('div');
    [ui.hud.nodo, ui.zona, ui.mandos, ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
    ui.canvas.addEventListener('pointerdown', function (ev) { if (s && s.estado === 'jugando') { ui.canvas.setPointerCapture(ev.pointerId); mover(ev); } });
    ui.canvas.addEventListener('pointermove', function (ev) { if (s && s.estado === 'jugando' && ev.buttons) mover(ev); });
    ui.canvas.addEventListener('pointerup', function () { objetivo = null; });
    ui.canvas.addEventListener('pointercancel', function () { objetivo = null; });
  }
  function mover(ev) { var r = ui.canvas.getBoundingClientRect(); objetivo = (ev.clientX - r.left) / r.width * W; }

  function velo(titulo, texto, boton, accion) {
    TYJ.vaciar(ui.velo); ui.velo.hidden = false;
    ui.velo.appendChild(h('p', { class: 'sv-velo-titulo', texto: titulo }));
    if (texto) ui.velo.appendChild(h('p', { class: 'sv-velo-texto', texto: texto }));
    var b = h('button', { class: 'boton-retro', type: 'button', onclick: accion }, boton);
    ui.velo.appendChild(b); b.focus({ preventScroll: true });
  }

  function inicio() {
    montar();
    s = { estado: 'espera', x: W / 2 };
    dibujar();
    velo('El superviviente', 'Esquiva los bloques rosas y recoge las estrellas. Flechas, A/D, arrastrar o los botones.', 'Empezar', empezar);
  }

  function empezar() {
    s = { estado: 'jugando', t: 0, x: W / 2, vidas: VIDAS, estrellas: 0, bloques: [], astros: [], inv: 0, spawn: 0.9, spawnA: 4, fondo: [], puntos: 0 };
    for (var i = 0; i < 36; i++) s.fondo.push({ x: U.azar(W), y: U.azar(H), v: 12 + U.azar(30), t: 1 + U.azar(2) });
    TYJ.vaciar(ui.final); ui.velo.hidden = true; ui.mandos.hidden = false;
    teclas.izq = teclas.der = false; objetivo = null;
    ui.hud.poner('vidas', VIDAS); ui.hud.poner('puntos', 0); ui.hud.poner('tiempo', '0:00');
    document.addEventListener('keydown', alTecla); document.addEventListener('keyup', alSoltar);
    ultimo = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(bucle);
    ui.canvas.focus({ preventScroll: true });
  }

  function alTecla(ev) {
    var k = ev.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { teclas.izq = true; ev.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { teclas.der = true; ev.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'ArrowDown' || k === ' ') { if (s && s.estado === 'jugando') ev.preventDefault(); }
    else if ((k === 'p' || k === 'P' || k === 'Escape') && s && s.estado === 'jugando') pausar();
  }
  function alSoltar(ev) {
    var k = ev.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') teclas.izq = false;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') teclas.der = false;
  }

  function pausar() {
    if (!s || s.estado !== 'jugando') return;
    s.estado = 'pausa'; cancelAnimationFrame(raf); teclas.izq = teclas.der = false; objetivo = null;
    document.removeEventListener('keydown', alTecla); document.removeEventListener('keyup', alSoltar);
    dibujar();
    velo('Pausa', 'Pulsa para seguir.', 'Continuar', function () {
      s.estado = 'jugando'; ui.velo.hidden = true; ultimo = performance.now();
      document.addEventListener('keydown', alTecla); document.addEventListener('keyup', alSoltar);
      raf = requestAnimationFrame(bucle); ui.canvas.focus({ preventScroll: true });
    });
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) pausar(); });
  window.addEventListener('blur', function () { pausar(); });

  function bucle(ahora) {
    if (!s || s.estado !== 'jugando') return;
    var dt = Math.min(0.05, (ahora - ultimo) / 1000); ultimo = ahora;
    actualizar(dt); dibujar();
    if (s.estado === 'jugando') raf = requestAnimationFrame(bucle);
  }

  var Y = H - 44;                                                           // altura de la nave
  function actualizar(dt) {
    s.t += dt;
    var v = Math.min(120 + s.t * 6, 380);                                   // velocidad de caída: sube con el tiempo
    var dir = (teclas.der ? 1 : 0) - (teclas.izq ? 1 : 0);
    if (dir) s.x += dir * 250 * dt;
    else if (objetivo != null) { var d = objetivo - s.x; s.x += Math.max(-640 * dt, Math.min(640 * dt, d)); }
    s.x = U.limitar(s.x, 12, W - 12);
    s.inv = Math.max(0, s.inv - dt);
    s.fondo.forEach(function (e) { e.y += e.v * dt; if (e.y > H) { e.y = 0; e.x = U.azar(W); } });
    s.spawn -= dt;
    if (s.spawn <= 0 && s.t > 0.8) {
      var t = U.entre(14, 36);
      s.bloques.push({ x: U.azar(W - t), y: -t, t: t, v: v * (0.8 + Math.random() * 0.5) });
      s.spawn = Math.max(0.2, 0.85 - s.t * 0.01) * (0.7 + Math.random() * 0.6);
    }
    s.spawnA -= dt;
    if (s.spawnA <= 0) { s.astros.push({ x: 10 + U.azar(W - 20), y: -12, v: 110 + s.t * 2 }); s.spawnA = 3 + Math.random() * 3; }
    s.bloques.forEach(function (b) { b.y += b.v * dt; });
    s.astros.forEach(function (a) { a.y += a.v * dt; });
    for (var i = s.bloques.length - 1; i >= 0; i--) {
      var b = s.bloques[i];
      if (b.y > H) { s.bloques.splice(i, 1); continue; }
      if (s.inv <= 0 && b.x + 3 < s.x + 9 && b.x + b.t - 3 > s.x - 9 && b.y + 3 < Y + 9 && b.y + b.t - 3 > Y - 9) {
        s.bloques.splice(i, 1); s.vidas--; s.inv = 1.5; ui.hud.poner('vidas', s.vidas, s.vidas === 1);
        TYJ.anunciar('Golpe. Te quedan ' + s.vidas + ' vidas.');
        if (s.vidas <= 0) return terminar();
      }
    }
    for (i = s.astros.length - 1; i >= 0; i--) {
      var a = s.astros[i];
      if (a.y > H + 12) { s.astros.splice(i, 1); continue; }
      if (Math.abs(a.x - s.x) < 14 && Math.abs(a.y - Y) < 16) { s.astros.splice(i, 1); s.estrellas++; }
    }
    s.puntos = Math.floor(s.t * 10) + s.estrellas * 50;
    if (performance.now() - ultimoHud > 100) { ultimoHud = performance.now(); ui.hud.poner('puntos', s.puntos); ui.hud.poner('tiempo', U.tiempo(Math.floor(s.t))); }
  }

  function dibujar() {
    ctx.fillStyle = c.fondo; ctx.fillRect(0, 0, W, H);
    if (s && s.fondo) { ctx.fillStyle = c.linea; s.fondo.forEach(function (e) { ctx.fillRect(e.x | 0, e.y | 0, e.t, e.t); }); }
    if (!s || !s.bloques) { nave(W / 2, Y); return; }
    s.bloques.forEach(function (b) {
      ctx.fillStyle = c.rosa; ctx.fillRect(b.x | 0, b.y | 0, b.t, b.t);
      ctx.fillStyle = c.fondo; ctx.fillRect((b.x | 0) + 3, (b.y | 0) + 3, 3, 3);              // muesca de píxel
      ctx.fillRect((b.x | 0) + b.t - 6, (b.y | 0) + b.t - 6, 3, 3);
    });
    s.astros.forEach(function (a) { ctx.fillStyle = c.limon; var x = a.x | 0, y = a.y | 0; ctx.fillRect(x - 3, y - 9, 6, 18); ctx.fillRect(x - 9, y - 3, 18, 6); ctx.fillRect(x - 6, y - 6, 12, 12); });
    if (s.inv <= 0 || Math.floor(s.inv * 10) % 2 === 0) nave(s.x | 0, Y);
  }
  function nave(x, y) {                                                       // nave de píxeles: 3 px por «píxel» del dibujo
    ctx.fillStyle = c.tiza;
    ctx.fillRect(x - 3, y - 12, 6, 6); ctx.fillRect(x - 6, y - 6, 12, 6); ctx.fillRect(x - 9, y, 18, 6); ctx.fillRect(x - 9, y + 6, 6, 6); ctx.fillRect(x + 3, y + 6, 6, 6);
    ctx.fillStyle = c.limon; ctx.fillRect(x - 3, y - 6, 6, 3);
  }

  function terminar() {
    s.estado = 'fin'; cancelAnimationFrame(raf);
    document.removeEventListener('keydown', alTecla); document.removeEventListener('keyup', alSoltar);
    teclas.izq = teclas.der = false; objetivo = null;
    dibujar();
    ui.hud.poner('puntos', s.puntos); ui.hud.poner('tiempo', U.tiempo(Math.floor(s.t)));
    sesion.registrar(s.puntos);
    ui.mandos.hidden = true;
    velo('Fin de la partida', '', 'Jugar otra vez', empezar);
    var cont = h('div'); ui.final.appendChild(cont);
    TYJ.final(cont, { titulo: 'Te han alcanzado', puntos: s.puntos, unidad: 'puntos', nivel: U.nivel(s.puntos, NIVELES),
      detalles: ['Has sobrevivido ' + Math.floor(s.t) + ' segundos', 'Estrellas recogidas: ' + s.estrellas],
      compartir: 'El superviviente: ' + s.puntos + ' puntos (' + Math.floor(s.t) + ' s, ' + s.estrellas + ' estrellas).', textoRepetir: 'Jugar otra vez', alRepetir: empezar });
    ui.velo.hidden = true;
  }

  inicio();
})();
