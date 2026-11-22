/* TIRO LIBRE: cinco faltas contra una barrera y un portero, dibujadas en un lienzo de 320 × 180 píxeles. Cada tiro tiene tres tiempos: fija la DIRECCIÓN (el punto
   se mueve de lado a lado), la ALTURA (sube y baja) y la POTENCIA (la barra sube y baja). Con Espacio, Intro, un clic sobre el campo o el botón «Fijar».
   Gol: 100 puntos (+50 si entra por la escuadra). Todo en memoria, nada se guarda.
   Reglas: por debajo de la línea de gol el balón da en la barrera; sobre el larguero, se va fuera; con poca potencia el portero la atrapa; con demasiada, se va alta.
   El portero salta a un sitio al azar: cuanto más cerca de un poste y más fuerte, menos posibilidades tiene. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('tl');
  if (!raiz) return;
  var W = 320, H = 180, TIROS = 5;
  var GOL = { x0: 100, x1: 220, yBarra: 44, ySuelo: 80 };
  var AIM = { x0: 84, x1: 236, y0: 34, y1: 96 };
  var PERIODO = { x: 1.8, y: 1.5, p: 1.2 };
  var NIVELES = [[0, 'Suplente'], [100, 'Rematador'], [220, 'Especialista'], [350, 'Lanzador de faltas'], [450, 'Genio del balón parado']];
  var C = { tinta: '#14201C', hondo: '#0B1512', linea: '#3A5249', pizarra: '#2F6B5C', pizarra2: '#28604F', tiza: '#EAF2EE', suave: '#AFC4BB', sandia: '#FF5A7D', limon: '#E6F14A', piel: '#E7B98F', naranja: '#FFB86B', red: '#0E1B16' };
  var sesion = TYJ.Sesion(null, { etiquetaMejor: 'Mejor puntuación: ' });
  var reducido = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var lento = reducido, partida = null, ui = null, ctx = null, tiro = null, bucle = false, ultimoTs = 0, estrellas = [], alTecla = null;
  (function () { var s = 7, i; for (i = 0; i < 70; i++) { s = (s * 9301 + 49297) % 233280; var x = s % W; s = (s * 9301 + 49297) % 233280; estrellas.push([x, s % 26, (s >> 3) % 3]); } })();

  function ahora() { return window.performance.now() / 1000; }
  function tri(u) { var f = u - Math.floor(u); return 1 - Math.abs(2 * f - 1); }      // 0 → 1 → 0
  function periodo(k) { return PERIODO[k] * (lento ? 1.8 : 1); }
  function valor(k) { return tri((ahora() - tiro.t0) / periodo(k)); }

  /* ---------- Dibujo */
  function R(c, x, y, w, hh) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(hh))); }
  function campo() {
    var k, x, y;
    R(C.hondo, 0, 0, W, 30);
    estrellas.forEach(function (e) { R(e[2] === 0 ? C.sandia : (e[2] === 1 ? C.limon : C.suave), e[0], e[1] + 2, 1, 1); });
    for (k = 0; k < 10; k++) R(k % 2 ? C.pizarra2 : C.pizarra, 0, 30 + k * 15, W, 15);
    // líneas del campo (en perspectiva): línea de gol, área grande y área pequeña
    R(C.tiza, 24, GOL.ySuelo, 272, 1);
    R(C.tiza, 48, GOL.ySuelo, 1, 40); R(C.tiza, 272, GOL.ySuelo, 1, 40); R(C.tiza, 48, 119, 225, 1);
    R(C.tiza, 88, GOL.ySuelo, 1, 17); R(C.tiza, 232, GOL.ySuelo, 1, 17); R(C.tiza, 88, 96, 145, 1);
    R(C.tiza, 158, 108, 4, 2);                               // punto de penalti
    // portería: fondo, red y palos
    R(C.red, GOL.x0, GOL.yBarra, GOL.x1 - GOL.x0, GOL.ySuelo - GOL.yBarra);
    for (x = GOL.x0 + 6; x < GOL.x1; x += 8) R(C.linea, x, GOL.yBarra, 1, GOL.ySuelo - GOL.yBarra);
    for (y = GOL.yBarra + 6; y < GOL.ySuelo; y += 6) R(C.linea, GOL.x0, y, GOL.x1 - GOL.x0, 1);
    R(C.tiza, GOL.x0 - 2, GOL.yBarra - 1, 3, GOL.ySuelo - GOL.yBarra + 1); R(C.tiza, GOL.x1 - 1, GOL.yBarra - 1, 3, GOL.ySuelo - GOL.yBarra + 1); R(C.tiza, GOL.x0 - 2, GOL.yBarra - 2, GOL.x1 - GOL.x0 + 5, 3);
  }
  function jugador(x, yPies, camisa) {                         // futbolista genérico en píxeles (sin escudos ni rostros reales)
    R(C.tinta, x - 4, yPies - 6, 3, 6); R(C.tinta, x + 1, yPies - 6, 3, 6);
    R(C.tinta, x - 4, yPies - 11, 9, 5);
    R(camisa, x - 4, yPies - 19, 9, 8); R(C.tiza, x - 4, yPies - 16, 9, 1);
    R(C.piel, x - 2, yPies - 24, 5, 5); R(C.tinta, x - 2, yPies - 25, 5, 2);
  }
  function barrera() { for (var i = 0; i < tiro.barrera.n; i++) jugador(tiro.barrera.x + (i - (tiro.barrera.n - 1) / 2) * 10, tiro.barrera.y, i % 2 ? C.sandia : C.limon); }
  function portero(x, y, salto) {
    if (salto) {                                                // en el aire: cuerpo horizontal con los brazos extendidos
      R(C.naranja, x - 9, y - 3, 18, 6); R(C.tinta, x - 4, y + 3, 8, 3); R(C.limon, x - 12, y - 4, 4, 4); R(C.limon, x + 8, y - 4, 4, 4); R(C.piel, x - 2, y - 7, 4, 4);
    } else {
      R(C.tinta, x - 4, y + 4, 3, 7); R(C.tinta, x + 1, y + 4, 3, 7); R(C.naranja, x - 5, y - 6, 11, 11); R(C.limon, x - 8, y - 5, 3, 4); R(C.limon, x + 6, y - 5, 3, 4); R(C.piel, x - 2, y - 11, 5, 5);
    }
  }
  function balon(x, y, s) {
    var r = Math.max(2, Math.round(4 * s));
    R(C.hondo, x - r - 1, y - r - 1, 2 * r + 2, 2 * r + 2); R(C.tiza, x - r, y - r, 2 * r, 2 * r); R(C.tinta, x - 1, y - 1, Math.max(1, r - 1), Math.max(1, r - 1));
  }
  function mira(x, y) {
    R(C.sandia, x - 7, y, 5, 1); R(C.sandia, x + 3, y, 5, 1); R(C.sandia, x, y - 7, 1, 5); R(C.sandia, x, y + 3, 1, 5);
    R(C.tiza, x - 1, y - 1, 3, 3);
  }
  function medidor(p, activo) {
    var x = 10, y = 92, w = 9, hh = 70;
    R(C.hondo, x - 2, y - 2, w + 4, hh + 4);
    R(C.linea, x, y, w, hh);
    R(C.limon, x, y + hh * (1 - 0.92), w, hh * (0.92 - 0.3));
    R(C.sandia, x, y, w, hh * 0.08); R(C.suave, x, y + hh * 0.7, w, hh * 0.3);
    R(C.hondo, x, y + hh * (1 - p), w, 2); R(C.tiza, x - 3, y + hh * (1 - p) - 1, w + 6, 2);
    if (activo) R(C.tiza, x - 3, y - 6, w + 6, 1);
  }
  function dibujar() {
    var t = tiro;
    campo(); barrera();
    portero(t.k.x, t.k.y, t.k.salta);
    if (t.fase === 'x') mira(AIM.x0 + (AIM.x1 - AIM.x0) * valor('x'), 62);
    if (t.fase === 'y') mira(t.mx, AIM.y0 + (AIM.y1 - AIM.y0) * valor('y'));
    if (t.fase === 'p') mira(t.mx, t.my);
    if (t.fase === 'x' || t.fase === 'y' || t.fase === 'p') medidor(t.fase === 'p' ? valor('p') : 0, t.fase === 'p');
    balon(t.bola.x, t.bola.y, t.bola.s);
  }

  /* ---------- Un tiro */
  function nuevoTiro(n) {
    var bx = U.entre(112, 208), muro = U.elegir([3, 4, 5]);
    tiro = { n: n, fase: 'x', t0: ahora(), mx: 160, my: 62, potencia: null, bola: { x: bx, y: 160, s: 1 },
      barrera: { n: muro, x: bx + (160 - bx) * 0.32, y: U.entre(110, 122), extra: (muro - 3) * 3 }, k: { x: 160, y: 68, salta: false }, resultado: null };
    ui.boton.textContent = 'Fijar dirección'; ui.boton.disabled = false; ui.sig.hidden = true; ui.aviso.textContent = '';
    ui.msg.textContent = 'Fija la dirección: pulsa cuando el punto esté donde quieras tirar. Barrera de ' + muro + ' jugadores.';
    ui.hud.poner('tiro', n + ' / ' + TIROS);
  }
  function fijar() {
    if (!tiro || partida.cerrada) return;
    if (tiro.fase === 'x') {
      tiro.mx = AIM.x0 + (AIM.x1 - AIM.x0) * valor('x'); tiro.fase = 'y'; tiro.t0 = ahora();
      ui.boton.textContent = 'Fijar altura'; ui.msg.textContent = 'Ahora la altura: por debajo de la línea de gol el balón da en la barrera.';
    } else if (tiro.fase === 'y') {
      tiro.my = AIM.y0 + (AIM.y1 - AIM.y0) * valor('y'); tiro.fase = 'p'; tiro.t0 = ahora();
      ui.boton.textContent = 'Fijar potencia'; ui.msg.textContent = 'Por último la potencia: la franja amarilla es la buena; si te pasas, la mandas alta.';
    } else if (tiro.fase === 'p') {
      tiro.potencia = valor('p'); tiro.fase = 'vuelo'; ui.boton.disabled = true; ui.boton.textContent = '¡Chuta!';
      resolver();
    }
    TYJ.anunciar(ui.msg.textContent);
  }

  /* Decide el resultado del tiro con las reglas del encabezado y prepara la animación */
  function resolver() {
    var t = tiro, x = t.mx, y = t.my, p = t.potencia, r = { tipo: '', texto: '', pts: 0 }, fin = { x: x, y: y }, k = { x: 160, y: 66 };
    var bajo = GOL.ySuelo - t.barrera.extra, alcance = 30 - (p - 0.3) * 25;
    if (y > bajo) { r.tipo = 'barrera'; r.texto = '¡A la barrera!'; fin = { x: t.barrera.x + (x - t.barrera.x) * 0.1, y: t.barrera.y - 14 }; }
    else if (p < 0.3) { r.tipo = 'atrapa'; r.texto = 'Sin fuerza: el portero la atrapa sin problemas.'; k = { x: x, y: Math.max(52, Math.min(74, y)) }; }
    else if (p > 0.92) { r.tipo = 'alta'; r.texto = 'Demasiada potencia: se va por encima del larguero.'; fin = { x: x, y: 18 }; }
    else if (x < GOL.x0 - 5 || x > GOL.x1 + 5) { r.tipo = 'fuera'; r.texto = 'Fuera: el balón se va junto al poste.'; }
    else if (Math.abs(x - GOL.x0) <= 5 || Math.abs(x - GOL.x1) <= 5) { r.tipo = 'palo'; r.texto = '¡Al palo!'; }
    else if (y < GOL.yBarra - 3) { r.tipo = 'alta'; r.texto = 'Por encima del larguero.'; }
    else if (Math.abs(y - GOL.yBarra) <= 3) { r.tipo = 'larguero'; r.texto = '¡Al larguero!'; fin = { x: x, y: GOL.yBarra }; }
    else {
      k = { x: GOL.x0 + 12 + Math.random() * (GOL.x1 - GOL.x0 - 24), y: 52 + Math.random() * 26 };
      if (Math.abs(x - k.x) < alcance && Math.abs(y - k.y) < alcance * 0.8) { r.tipo = 'parada'; r.texto = '¡Paradón del portero!'; k = { x: x, y: y }; }
      else {
        var esc = y < GOL.yBarra + 14 && (x < GOL.x0 + 22 || x > GOL.x1 - 22);
        r.tipo = 'gol'; r.pts = 100 + (esc ? 50 : 0); r.texto = esc ? '¡GOLAZO por la escuadra!' : '¡GOL!';
      }
    }
    t.resultado = r; t.k.destino = k; t.k.salta = r.tipo === 'gol' || r.tipo === 'parada' || r.tipo === 'atrapa' || r.tipo === 'palo' || r.tipo === 'larguero';
    t.vuelo = { t: 0, dur: 0.95, desde: { x: t.bola.x, y: t.bola.y }, hasta: fin, curva: (x < t.bola.x ? -1 : 1) * 16, kDesde: { x: 160, y: 68 } };
  }
  function animar(dt) {
    var t = tiro, v = t.vuelo;
    v.t = Math.min(1, v.t + dt / v.dur);
    var u = v.t, a = v.desde, b = v.hasta, cx = (a.x + b.x) / 2 + v.curva, cy = Math.min(a.y, b.y) - 24;
    t.bola.x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * cx + u * u * b.x;
    t.bola.y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * cy + u * u * b.y;
    t.bola.s = 1 - 0.55 * u;
    var d = t.k.destino, e = Math.min(1, u * 1.6);
    t.k.x = v.kDesde.x + (d.x - v.kDesde.x) * e; t.k.y = v.kDesde.y + (d.y - v.kDesde.y) * e;
    if (v.t >= 1) terminar();
  }
  function terminar() {
    var t = tiro, r = t.resultado;
    t.fase = 'fin';
    partida.total += r.pts; partida.tiros.push(r);
    if (r.tipo === 'gol') partida.goles++;
    ui.hud.poner('goles', String(partida.goles)); ui.hud.poner('pts', U.miles(partida.total));
    ui.aviso.textContent = r.texto; ui.aviso.className = 'tl-aviso tl-aviso--' + (r.tipo === 'gol' ? 'gol' : 'fallo');
    ui.msg.textContent = r.texto + ' +' + r.pts + ' puntos.';
    TYJ.anunciar(ui.msg.textContent);
    ui.sig.textContent = t.n === TIROS ? 'Ver resultado' : 'Siguiente tiro'; ui.sig.hidden = false; ui.sig.focus();
  }
  function bucleDibujo(ts) {
    if (!bucle) return;
    var dt = ultimoTs ? Math.min(0.05, (ts - ultimoTs) / 1000) : 0.016; ultimoTs = ts;
    if (ui && ui.lienzo.isConnected && tiro) { if (tiro.fase === 'vuelo') animar(dt); dibujar(); }
    window.requestAnimationFrame(bucleDibujo);
  }
  function arrancarBucle() { if (!bucle) { bucle = true; ultimoTs = 0; window.requestAnimationFrame(bucleDibujo); } }

  /* ---------- Pantallas */
  function inicio() {
    TYJ.vaciar(raiz);
    raiz.appendChild(h('h2', { texto: 'Tiro libre' }));
    raiz.appendChild(h('p', { class: 'texto', texto: 'Cinco faltas ante una barrera y un portero. En cada una fijas tres cosas: la dirección, la altura y la potencia. Un gol vale 100 puntos y 50 más si entra por la escuadra.' }));
    raiz.appendChild(h('div', { class: 'fila' }, h('button', { class: 'boton-retro', type: 'button', id: 'tl-empezar', onclick: empezar }, 'Empezar')));
    var s = h('div'); raiz.appendChild(s); sesion.montar(s);
  }
  function empezar() {
    partida = { total: 0, goles: 0, tiros: [], cerrada: false };
    TYJ.vaciar(raiz);
    ui = {};
    ui.hud = TYJ.hud([['tiro', 'Tiro', '1 / ' + TIROS], ['goles', 'Goles', '0'], ['pts', 'Puntos', '0']]);
    ui.lienzo = h('canvas', { class: 'tl-lienzo', width: String(W), height: String(H), role: 'img', 'aria-label': 'Campo de fútbol con una barrera, un portero y el balón. Se juega con los botones de debajo o con la barra espaciadora.' });
    ctx = ui.lienzo.getContext('2d');
    ui.aviso = h('p', { class: 'tl-aviso', 'aria-hidden': 'true' });
    ui.boton = h('button', { class: 'boton-retro tl-fijar', type: 'button', id: 'tl-fijar', onclick: fijar }, 'Fijar dirección');
    ui.sig = h('button', { class: 'boton-retro', type: 'button', id: 'tl-siguiente', hidden: true, onclick: siguiente }, 'Siguiente tiro');
    ui.lento = h('input', { type: 'checkbox', id: 'tl-lento' });
    ui.lento.checked = lento;
    ui.lento.addEventListener('change', function () { lento = ui.lento.checked; if (tiro) tiro.t0 = ahora(); });
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    raiz.appendChild(ui.hud.nodo);
    raiz.appendChild(h('div', { class: 'tl-escena' }, ui.lienzo, ui.aviso));
    raiz.appendChild(h('div', { class: 'fila fila--centro' }, ui.boton, ui.sig));
    raiz.appendChild(ui.msg);
    raiz.appendChild(h('div', { class: 'campo-check' }, ui.lento, h('label', { for: 'tl-lento', texto: 'Medidores lentos (más fácil)' })));
    raiz.appendChild(h('p', { class: 'texto-suave', texto: 'También puedes fijar con la barra espaciadora, Intro o un clic sobre el campo.' }));
    ui.lienzo.addEventListener('click', function () { if (tiro && tiro.fase === 'fin') siguiente(); else fijar(); });
    if (alTecla) document.removeEventListener('keydown', alTecla);
    alTecla = function (ev) {
      if (!ui || !ui.lienzo.isConnected || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var t = ev.target;
      if (t && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName)) return;
      if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); if (tiro && tiro.fase === 'fin') siguiente(); else fijar(); }
    };
    document.addEventListener('keydown', alTecla);
    nuevoTiro(1); arrancarBucle();
    ui.boton.focus();
  }
  function siguiente() {
    if (!tiro || tiro.fase !== 'fin') return;
    if (tiro.n >= TIROS) { final(); return; }
    nuevoTiro(tiro.n + 1); ui.boton.focus();
  }
  function final() {
    partida.cerrada = true; bucle = false;
    if (alTecla) { document.removeEventListener('keydown', alTecla); alTecla = null; }
    var total = partida.total, nivel = U.nivel(total, NIVELES);
    sesion.registrar(total);
    var lista = h('ol', { class: 'tl-lista', 'aria-label': 'Resultado de cada tiro' }, partida.tiros.map(function (r) { return h('li', { texto: r.texto + ' (' + r.pts + ')' }); }));
    var cont = h('div'); TYJ.vaciar(raiz).appendChild(cont);
    TYJ.final(cont, { titulo: partida.goles === TIROS ? '¡Cinco de cinco!' : 'Nivel: ' + nivel, puntos: total, nivel: partida.goles === TIROS ? 'Nivel: ' + nivel : null, detalles: ['Goles: ' + partida.goles + ' de ' + TIROS],
      textoRepetir: 'Jugar otra vez', alRepetir: empezar, compartir: 'Tiro libre · ' + U.miles(total) + ' puntos · ' + partida.goles + '/' + TIROS + ' goles · ' + nivel });
    cont.lastChild.appendChild(lista);
    var s = h('div'); raiz.appendChild(s); sesion.montar(s);
  }

  inicio();
})();
