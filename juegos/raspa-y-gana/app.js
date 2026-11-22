/* RASPA Y GANA: ticket de 3 × 3 casillas bajo una lámina de canvas que se rasca con el puntero (destination-out). Tres símbolos iguales dan el premio de ese símbolo.
   El resultado se sortea al comprar (C.azar, 1.000 casos con premios que devuelven el 90 %) y las casillas se colocan para que solo haya un trío si toca; rascar solo lo enseña. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, C = TYJ.casino, h = TYJ.h;
  var raiz = document.getElementById('rg');
  if (!raiz || !C) return;
  var sv = C.sv;

  /* ---- Reglas (puras) */
  var SIMBOLOS = ['luna', 'trebol', 'corazon', 'sol', 'estrella', 'gema', 'corona'];          // de menor a mayor premio
  var MULT = { luna: 1, trebol: 2, corazon: 5, sol: 10, estrella: 20, gema: 50, corona: 100 };
  var PESO = { luna: 170, trebol: 70, corazon: 30, sol: 12, estrella: 6, gema: 2, corona: 1 };   // tickets premiados de cada 1.000
  var DE = 1000;
  var NOMBRE = { luna: 'luna', trebol: 'trébol', corazon: 'corazón', sol: 'sol', estrella: 'estrella', gema: 'gema', corona: 'corona' };
  var PLURAL = { luna: 'lunas', trebol: 'tréboles', corazon: 'corazones', sol: 'soles', estrella: 'estrellas', gema: 'gemas', corona: 'coronas' };
  function barajar(lista, azar) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = azar(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  /* Un ticket: se sortea el premio (0–999) y se colocan nueve símbolos. Los que no ganan salen como mucho dos veces; el ganador, tres. */
  function ticket(azar) {
    var x = azar(DE), acum = 0, ganador = null;
    SIMBOLOS.forEach(function (s) { acum += PESO[s]; if (ganador === null && x < acum) ganador = s; });
    var bolsa = [];
    SIMBOLOS.forEach(function (s) { if (s !== ganador) bolsa.push(s, s); });
    var celdas = barajar(bolsa, azar).slice(0, ganador ? 6 : 9);
    if (ganador) celdas.push(ganador, ganador, ganador);
    return { celdas: barajar(celdas, azar), ganador: ganador };
  }
  function evaluar(celdas) {
    var cuenta = {}, gana = null;
    celdas.forEach(function (s) { cuenta[s] = (cuenta[s] || 0) + 1; });
    Object.keys(cuenta).forEach(function (s) { if (cuenta[s] >= 3) gana = s; });
    return { simbolo: gana, mult: gana ? MULT[gana] : 0 };
  }
  function retorno() { var t = 0; SIMBOLOS.forEach(function (s) { t += PESO[s] * MULT[s]; }); return t / DE; }
  C.reglas.raspa = { SIMBOLOS: SIMBOLOS, MULT: MULT, PESO: PESO, DE: DE, ticket: ticket, evaluar: evaluar, retorno: retorno };

  /* ---- Símbolos (dibujos planos de 48 × 48 con borde oscuro) */
  function estrella(cx, cy, r1, r2) {
    var p = [];
    for (var i = 0; i < 10; i++) { var r = i % 2 ? r2 : r1, a = Math.PI * i / 5 - Math.PI / 2; p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); }
    return p.join(' ');
  }
  function rayos() {
    var r = [];
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, p = function (rad, d) { return (24 + rad * Math.cos(a + d)).toFixed(1) + ',' + (24 + rad * Math.sin(a + d)).toFixed(1); };
      r.push(sv('polygon', { class: 'rg-oro', points: p(21, 0) + ' ' + p(13, 0.3) + ' ' + p(13, -0.3) }));
    }
    return r;
  }
  var DIBUJOS = {
    luna: function () { return [sv('path', { class: 'rg-luna', d: 'M31 5C17 6 8 16 8 27C8 38 17 44 28 43C35 42 40 38 42 32C32 36 22 29 22 20C22 13 26 8 31 5Z' })]; },
    trebol: function () { return [
      sv('path', { class: 'rg-trazo', d: 'M24 30C24 38 22 42 17 45' }),
      sv('circle', { class: 'rg-verde', cx: 24, cy: 13, r: 8 }), sv('circle', { class: 'rg-verde', cx: 12, cy: 25, r: 8 }),
      sv('circle', { class: 'rg-verde', cx: 36, cy: 25, r: 8 }), sv('circle', { class: 'rg-verde', cx: 24, cy: 36, r: 8 }),
      sv('path', { class: 'rg-faceta', d: 'M24 24L24 14M24 24L13 25M24 24L35 25M24 24L24 35' })]; },
    corazon: function () { return [sv('path', { class: 'rg-rojo', d: 'M24 43C6 31 4 17 13 11C19 7 24 11 24 16C24 11 29 7 35 11C44 17 42 31 24 43Z' }), sv('rect', { class: 'rg-brillo', x: 11, y: 16, width: 4, height: 4 })]; },
    sol: function () { return rayos().concat([sv('circle', { class: 'rg-naranja', cx: 24, cy: 24, r: 11 })]); },
    estrella: function () { return [sv('polygon', { class: 'rg-oro', points: estrella(24, 26, 21, 9) }), sv('rect', { class: 'rg-brillo', x: 21, y: 19, width: 5, height: 5 })]; },
    gema: function () { return [sv('polygon', { class: 'rg-cian', points: '24,5 41,17 24,43 7,17' }), sv('path', { class: 'rg-faceta', d: 'M7 17H41M17 17L24 5L31 17L24 43Z' })]; },
    corona: function () { return [
      sv('path', { class: 'rg-oro', d: 'M6 38L9 14L18 24L24 9L30 24L39 14L42 38Z' }), sv('rect', { class: 'rg-oro2', x: 6, y: 36, width: 36, height: 7 }),
      sv('circle', { class: 'rg-rojo', cx: 24, cy: 29, r: 3.2 }), sv('circle', { class: 'rg-rojo', cx: 13, cy: 31, r: 2.4 }), sv('circle', { class: 'rg-rojo', cx: 35, cy: 31, r: 2.4 })]; }
  };
  function simbolo(nombre) {
    var s = sv('svg', { viewBox: '0 0 48 48', class: 'rg-sim rg-s-' + nombre, 'aria-hidden': 'true', focusable: 'false' });
    DIBUJOS[nombre]().forEach(function (e) { s.appendChild(e); });
    return s;
  }

  /* ---- Estado */
  var banca = C.Banca(C.SALDO_INICIAL, function () { refrescar(); });
  var ui = {}, celdas = null, fase = 'inicio', precio = 0, ultimo = 0, activo = false, anterior = null, ultimaMedida = 0, ctx = null, cubierto = 0;
  var T = 360, UMBRAL = 0.6, FUENTE = '';

  function mensaje(t, tipo) {
    ui.msg.textContent = t;
    ui.msg.className = 'mensaje rg-msg' + (tipo ? ' mensaje--' + tipo : '');
    TYJ.anunciar(t);
  }
  function listaDeSimbolos(arr) { return arr.map(function (s) { return NOMBRE[s]; }).join(', '); }

  /* ---- Lámina */
  function pintarCapa() {
    var g = ctx, i;
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, T, T);
    var grad = g.createLinearGradient(0, 0, T, T);
    grad.addColorStop(0, '#C5CFCA'); grad.addColorStop(0.5, '#8E9A95'); grad.addColorStop(1, '#B3BEB9');
    g.fillStyle = grad; g.fillRect(0, 0, T, T);
    g.strokeStyle = 'rgba(20, 32, 28, 0.13)'; g.lineWidth = 2;
    for (i = -T; i < T; i += 14) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + T, T); g.stroke(); }
    g.strokeStyle = 'rgba(20, 32, 28, 0.5)'; g.lineWidth = 3;
    for (i = 1; i < 3; i++) { g.beginPath(); g.moveTo(i * T / 3, 0); g.lineTo(i * T / 3, T); g.moveTo(0, i * T / 3); g.lineTo(T, i * T / 3); g.stroke(); }
    g.fillStyle = 'rgba(20, 32, 28, 0.6)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '34px ' + FUENTE;
    for (i = 0; i < 9; i++) g.fillText('?', (i % 3 + 0.5) * T / 3, (Math.floor(i / 3) + 0.5) * T / 3);
    cubierto = 0;
    ui.hud.poner('raspado', '0 %');
  }
  function raspar(a, b) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = T * 0.115;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  function medir() {
    if (fase !== 'rascando') return;
    var d = ctx.getImageData(0, 0, T, T).data, vacio = 0, total = 0;
    for (var y = 3; y < T; y += 6) for (var x = 3; x < T; x += 6) { total++; if (d[(y * T + x) * 4 + 3] < 128) vacio++; }
    cubierto = vacio / total;
    ui.hud.poner('raspado', Math.round(cubierto * 100) + ' %');
    if (cubierto >= UMBRAL) revelar();
  }
  function punto(ev) { var r = ui.capa.getBoundingClientRect(); return [(ev.clientX - r.left) * T / r.width, (ev.clientY - r.top) * T / r.height]; }
  function bajar(ev) {
    if (fase !== 'rascando') return;
    ev.preventDefault();
    try { ui.capa.setPointerCapture(ev.pointerId); } catch (e) { /* sin captura también funciona */ }
    activo = true; anterior = punto(ev); raspar(anterior, anterior);
  }
  function mover(ev) {
    if (!activo || fase !== 'rascando') return;
    var p = punto(ev);
    raspar(anterior, p); anterior = p;
    var ahora = Date.now();
    if (ahora - ultimaMedida > 120) { ultimaMedida = ahora; medir(); }
  }
  function soltar() { if (!activo) return; activo = false; medir(); }
  function rascarCasilla(i) {
    if (fase !== 'rascando') return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000'; ctx.fillRect((i % 3) * T / 3, Math.floor(i / 3) * T / 3, T / 3, T / 3);
    medir();
    var sig = ui.botonesCasilla[i];
    if (fase === 'rascando') sig.classList.add('rg-hecha');
  }

  /* ---- Acciones */
  function comprar() {
    if (fase === 'rascando') return;
    var p = ui.fichas.valor();
    if (!banca.retirar(p)) { mensaje('No te llegan las fichas para un ticket de ' + C.fmt(p) + '. Elige una ficha más pequeña.', 'mal'); return; }
    precio = p; ultimo = 0;
    var t = ticket(C.azar);
    celdas = t.celdas;
    TYJ.vaciar(ui.cuadricula);
    celdas.forEach(function (s) { ui.cuadricula.appendChild(h('div', { class: 'rg-celda' }, simbolo(s))); });
    ui.cuadricula.setAttribute('aria-hidden', 'true');
    ui.cuadricula.removeAttribute('role'); ui.cuadricula.removeAttribute('aria-label');
    ui.lamina.classList.remove('rg-abierta', 'rg-gana');
    ui.botonesCasilla.forEach(function (b) { b.classList.remove('rg-hecha'); });
    ui.filas.forEach(function (f) { f.nodo.classList.remove('rg-fila--gana'); });
    pintarCapa();
    fase = 'rascando';
    mensaje('Rasca la lámina con el ratón o el dedo. Si ves tres símbolos iguales, ganas.');
    refrescar();
    ui.botonesCasilla[0].focus({ preventScroll: true });
  }
  function revelar() {
    if (fase !== 'rascando') return;
    fase = 'fin'; activo = false;
    ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, T, T);
    ui.lamina.classList.add('rg-abierta');
    ui.hud.poner('raspado', '100 %');
    var r = evaluar(celdas), premio = precio * r.mult, neto = premio - precio;
    banca.ingresar(premio);
    ultimo = neto;
    ui.cuadricula.removeAttribute('aria-hidden');
    ui.cuadricula.setAttribute('role', 'img');
    ui.cuadricula.setAttribute('aria-label', 'Casillas del ticket: ' + listaDeSimbolos(celdas));
    if (r.simbolo) {
      ui.lamina.classList.add('rg-gana');
      [].forEach.call(ui.cuadricula.children, function (n, i) { n.classList.toggle('rg-premiada', celdas[i] === r.simbolo); });
    }
    if (!r.mult) mensaje('Sin premio. Pierdes ' + C.fmt(precio) + ' fichas.', 'mal');
    else if (r.mult === 1) mensaje('Tres ' + PLURAL[r.simbolo] + ': recuperas tu ticket de ' + C.fmt(precio) + ' fichas.');
    else { mensaje('Tres ' + PLURAL[r.simbolo] + ': ×' + r.mult + '. Ganas ' + C.fmt(neto) + ' fichas.', 'ok'); C.flota(ui.lamina, '+' + C.fmt(neto), 'ok'); }
    ui.filas.forEach(function (f) { f.nodo.classList.toggle('rg-fila--gana', f.id === r.simbolo); });
    refrescar();
    if (banca.saldo >= 1) ui.comprar.focus({ preventScroll: true });
  }

  /* ---- Pantalla */
  function refrescar() {
    if (!ui.hud) return;
    var jugando = fase === 'rascando';
    ui.hud.poner('saldo', C.fmt(banca.saldo), banca.saldo < 1);
    ui.hud.poner('precio', C.fmt(jugando ? precio : ui.fichas.valor()));
    ui.hud.poner('ultimo', (ultimo > 0 ? '+' : (ultimo < 0 ? '−' : '')) + C.fmt(Math.abs(ultimo)));
    var sin = banca.saldo < 1 && !jugando;
    ui.comprar.hidden = jugando;
    ui.comprar.textContent = fase === 'inicio' ? 'Comprar ticket' : 'Comprar otro ticket';
    ui.comprar.disabled = sin;
    ui.todo.hidden = !jugando;
    ui.fichas.nodo.querySelectorAll('button').forEach(function (b) { b.disabled = jugando; });
    ui.botonesCasilla.forEach(function (b) { b.disabled = !jugando; });
    ui.capa.classList.toggle('rg-activa', jugando);
    ui.sin.hidden = !sin;
    ui.mandos.hidden = sin;
  }
  function tabla() {
    ui.filas = [];
    var lista = h('ul', { class: 'rg-pagos' });
    SIMBOLOS.slice().reverse().forEach(function (s) {
      var nodo = h('li', { class: 'rg-fila' },
        h('span', { class: 'rg-p-sim', 'aria-hidden': 'true' }, simbolo(s), simbolo(s), simbolo(s)),
        h('span', { class: 'rg-p-nombre', texto: 'Tres ' + PLURAL[s] }),
        h('span', { class: 'rg-p-mult', texto: '×' + MULT[s] }),
        h('span', { class: 'rg-p-odds', texto: '1 de cada ' + C.fmt(Math.round(DE / PESO[s])) }));
      ui.filas.push({ id: s, nodo: nodo });
      lista.appendChild(nodo);
    });
    return h('div', { class: 'rg-tabla' }, h('h3', { class: 'rg-tabla-t', texto: 'Premios' }), lista,
      h('p', { class: 'texto-suave rg-nota', texto: 'Las probabilidades son por ticket, de media. Devuelve el 90 % de lo que se gasta.' }));
  }
  function montar() {
    TYJ.vaciar(raiz);
    FUENTE = getComputedStyle(raiz).getPropertyValue('--f-pixel').trim() || 'monospace';
    ui.hud = TYJ.hud([['saldo', 'Fichas', C.fmt(C.SALDO_INICIAL)], ['precio', 'Ticket', '5'], ['ultimo', 'Último ticket', '0'], ['raspado', 'Rascado', '0 %']]);
    ui.msg = h('p', { class: 'mensaje rg-msg', texto: 'Elige el precio con una ficha y compra un ticket.' });
    ui.fichas = C.selector(C.FICHAS, 5, function () { refrescar(); });
    ui.comprar = h('button', { type: 'button', class: 'boton-retro rg-boton', onclick: comprar, texto: 'Comprar ticket' });
    ui.todo = h('button', { type: 'button', class: 'boton-retro boton-retro--sec rg-boton', onclick: revelar, texto: 'Rascar todo' });
    ui.todo.hidden = true;
    ui.mandos = h('div', { class: 'rg-mandos' }, ui.fichas.nodo, ui.comprar, ui.todo);
    ui.sin = C.sinFichas(function () { banca.recargar(); mensaje('Tienes ' + C.fmt(banca.saldo) + ' fichas nuevas.'); refrescar(); });
    ui.sin.hidden = true;
    ui.cuadricula = h('div', { class: 'rg-cuadricula', 'aria-hidden': 'true' });
    for (var i = 0; i < 9; i++) ui.cuadricula.appendChild(h('div', { class: 'rg-celda' }));
    ui.capa = h('canvas', { class: 'rg-capa', width: T, height: T, 'aria-hidden': 'true' });
    ctx = ui.capa.getContext('2d', { willReadFrequently: true });
    ui.capa.addEventListener('pointerdown', bajar);
    ui.capa.addEventListener('pointermove', mover);
    ui.capa.addEventListener('pointerup', soltar);
    ui.capa.addEventListener('pointercancel', soltar);
    ui.botonesCasilla = [];
    var botones = h('div', { class: 'rg-botones' });
    for (var k = 0; k < 9; k++) {
      (function (n) {
        var b = h('button', { type: 'button', class: 'rg-casilla', 'aria-label': 'Rascar la casilla ' + (n + 1) + ' de 9', onclick: function () { rascarCasilla(n); } });
        b.disabled = true;
        ui.botonesCasilla.push(b); botones.appendChild(b);
      })(k);
    }
    ui.lamina = h('div', { class: 'rg-lamina' }, ui.cuadricula, ui.capa, botones);
    var ticketNodo = h('div', { class: 'rg-ticket' },
      h('p', { class: 'rg-rotulo', texto: 'Raspa y gana' }),
      h('p', { class: 'rg-lema', texto: 'Tres símbolos iguales, premio' }),
      ui.lamina, h('div', { class: 'rg-pie' }, ui.msg, ui.mandos, ui.sin));
    raiz.appendChild(C.aviso());
    raiz.appendChild(ui.hud.nodo);
    raiz.appendChild(h('div', { class: 'rg-escena' }, ticketNodo, tabla()));
    pintarCapa();
    refrescar();
  }
  C.puerta(raiz, montar);
})();
