/* RULETA EUROPEA: 37 números, mesa de apuestas (plenos, docenas, columnas y sencillas) y fichas virtuales. La rueda y la bola son SVG;
   el número se decide con C.azar (crypto.getRandomValues) al pulsar «Girar» y la animación solo lo escenifica. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, C = TYJ.casino, h = TYJ.h;
  var raiz = document.getElementById('rt');
  if (!raiz || !C) return;
  var sv = C.sv;

  /* ---- Reglas (puras: las usan las pruebas) */
  var ORDEN = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  var ROJOS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  var PASO = 360 / 37;
  function color(n) { return n === 0 ? 'verde' : (ROJOS.indexOf(n) >= 0 ? 'rojo' : 'negro'); }
  function esPleno(k) { return /^n\d+$/.test(k); }                  // «n17» es el pleno al 17; «negro» no lo es
  function gana(k, n) {
    if (esPleno(k)) return n === parseInt(k.slice(1), 10);
    if (n === 0) return false;
    switch (k) {
      case 'doc1': return n <= 12;
      case 'doc2': return n > 12 && n <= 24;
      case 'doc3': return n > 24;
      case 'col1': return n % 3 === 1;
      case 'col2': return n % 3 === 2;
      case 'col3': return n % 3 === 0;
      case 'bajo': return n <= 18;
      case 'alto': return n >= 19;
      case 'par': return n % 2 === 0;
      case 'impar': return n % 2 === 1;
      case 'rojo': return color(n) === 'rojo';
      case 'negro': return color(n) === 'negro';
    }
    return false;
  }
  function multiplo(k) { return esPleno(k) ? 35 : (k.indexOf('doc') === 0 || k.indexOf('col') === 0 ? 2 : 1); }
  function pago(apuestas, n) {                                     // lo que vuelve a la banca: la ficha apostada más lo que gana
    var total = 0;
    Object.keys(apuestas).forEach(function (k) { if (gana(k, n)) total += apuestas[k] * (multiplo(k) + 1); });
    return total;
  }
  C.reglas.ruleta = { ORDEN: ORDEN, color: color, gana: gana, multiplo: multiplo, pago: pago };

  /* ---- Estado */
  var apuestas = {}, pila = [], ultima = null, estado = 'apostando', giros = 0, historial = [];
  var rotR = 0, rotB = 0, ui = {}, celdas = {};
  var banca = C.Banca(C.SALDO_INICIAL, refrescar);
  var NOMBRE_COLOR = { rojo: 'rojo', negro: 'negro', verde: 'verde' };

  function total() {
    if (estado === 'resuelta') return 0;
    var t = 0;
    Object.keys(apuestas).forEach(function (k) { t += apuestas[k]; });
    return t;
  }
  function nombre(k) {
    if (esPleno(k)) { var n = parseInt(k.slice(1), 10); return 'Número ' + n + ' ' + NOMBRE_COLOR[color(n)]; }
    return { doc1: 'Primera docena, del 1 al 12', doc2: 'Segunda docena, del 13 al 24', doc3: 'Tercera docena, del 25 al 36',
      col1: 'Columna 1', col2: 'Columna 2', col3: 'Columna 3', bajo: 'Del 1 al 18', alto: 'Del 19 al 36', par: 'Par', impar: 'Impar', rojo: 'Rojo', negro: 'Negro' }[k];
  }
  function mensaje(t, tipo) {
    ui.msg.textContent = t;
    ui.msg.className = 'mensaje rt-msg' + (tipo ? ' mensaje--' + tipo : '');
    TYJ.anunciar(t);
  }

  /* ---- Rueda */
  function pt(r, a) { var t = a * Math.PI / 180; return (r * Math.sin(t)).toFixed(2) + ' ' + (-r * Math.cos(t)).toFixed(2); }
  function cuna(a0, a1, r1, r2) { return 'M' + pt(r2, a0) + 'A' + r2 + ' ' + r2 + ' 0 0 1 ' + pt(r2, a1) + 'L' + pt(r1, a1) + 'A' + r1 + ' ' + r1 + ' 0 0 0 ' + pt(r1, a0) + 'Z'; }
  var R_PISTA = 168, R_BOLSILLO = 112;
  function dibujarRueda() {
    var bolsillos = sv('g', { class: 'rt-bolsillos' }), numeros = sv('g', { class: 'rt-numeros' }), tuercas = sv('g'), radios = sv('g', { class: 'rt-radios' });
    ORDEN.forEach(function (n, i) {
      var a = i * PASO;
      var cu = sv('path', { class: 'rt-b rt-b-' + color(n), d: cuna(a - PASO / 2, a + PASO / 2, 96, 148), 'data-n': n });
      bolsillos.appendChild(cu);
      var t = sv('text', { class: 'rt-num', transform: 'rotate(' + a.toFixed(3) + ') translate(0 -132)' });
      t.textContent = n;
      numeros.appendChild(t);
    });
    for (var k = 0; k < 8; k++) radios.appendChild(sv('rect', { x: -3, y: -92, width: 6, height: 46, transform: 'rotate(' + (k * 45) + ')' }));
    for (var j = 0; j < 24; j++) tuercas.appendChild(sv('rect', { class: 'rt-tuerca', x: -3, y: -194, width: 6, height: 6, transform: 'rotate(' + (j * 15) + ')' }));
    ui.centroN = sv('text', { class: 'rt-centro-n', x: 0, y: 2 });
    ui.centroN.textContent = '';
    ui.centro = sv('circle', { class: 'rt-centro', r: 38 });
    ui.rg = sv('g', { class: 'rt-rueda-g' },
      sv('circle', { class: 'rt-cubo', r: 96 }), radios, bolsillos, sv('circle', { class: 'rt-borde', r: 148 }), numeros);
    ui.bolaPunto = sv('g', { class: 'rt-bola' }, sv('circle', { class: 'rt-bola-c', cx: 0, cy: -R_PISTA, r: 7 }), sv('rect', { class: 'rt-bola-b', x: -4, y: -R_PISTA - 4, width: 3, height: 3 }));
    ui.bg = sv('g', { class: 'rt-bola-g' }, ui.bolaPunto);
    ui.svg = sv('svg', { viewBox: '-200 -200 400 400', class: 'rt-svg', role: 'img', 'aria-label': 'Ruleta europea con 37 casillas' },
      sv('circle', { class: 'rt-aro', r: 198 }), sv('circle', { class: 'rt-pista', r: 184 }), tuercas, ui.rg, ui.bg,
      ui.centro, ui.centroN);
    ui.bolsillos = bolsillos;
    return ui.svg;
  }

  /* ---- Mesa */
  function celda(clave, etiqueta, clase, area, aria) {
    var slot = h('span', { class: 'rt-slot' });
    var b = h('button', { type: 'button', class: 'rt-celda ' + clase, 'data-apuesta': clave, 'aria-label': aria || nombre(clave), style: 'grid-area:' + area, onclick: function () { colocar(clave); } }, etiqueta, slot);
    celdas[clave] = { btn: b, slot: slot };
    return b;
  }
  function dibujarMesa() {
    var m = h('div', { class: 'rt-tapete', role: 'group', 'aria-label': 'Mesa de apuestas' });
    m.appendChild(celda('n0', h('span', { class: 'rt-et', texto: '0' }), 'rt-verde', '1 / 2 / span 1 / span 3'));
    for (var f = 1; f <= 12; f++) for (var c = 0; c < 3; c++) {
      var n = f * 3 - 2 + c;
      m.appendChild(celda('n' + n, h('span', { class: 'rt-et', texto: n }), 'rt-' + color(n), (f + 1) + ' / ' + (c + 2) + ' / span 1 / span 1'));
    }
    [['doc1', '1-12', 2], ['doc2', '13-24', 6], ['doc3', '25-36', 10]].forEach(function (d) {
      m.appendChild(celda(d[0], h('span', { class: 'rt-et rt-et--v', texto: d[1] }), 'rt-lado', d[2] + ' / 1 / span 4 / span 1'));
    });
    [['bajo', '1-18', 2], ['par', 'Par', 4], ['rojo', 'Rojo', 6], ['negro', 'Negro', 8], ['impar', 'Impar', 10], ['alto', '19-36', 12]].forEach(function (d) {
      var cont = h('span', { class: 'rt-et rt-et--v' }, d[0] === 'rojo' || d[0] === 'negro' ? h('i', { class: 'rt-rombo rt-rombo--' + d[0] }) : null, h('span', { texto: d[1] }));
      m.appendChild(celda(d[0], cont, 'rt-lado', d[2] + ' / 5 / span 2 / span 1'));
    });
    ['col1', 'col2', 'col3'].forEach(function (k, i) {
      m.appendChild(celda(k, h('span', { class: 'rt-et rt-et--s', texto: '2:1' }), 'rt-lado', '14 / ' + (i + 2) + ' / span 1 / span 1', nombre(k) + ', paga 2 a 1'));
    });
    return m;
  }
  function pintarCelda(k) {
    var c = celdas[k], v = apuestas[k] || 0;
    c.slot.textContent = '';
    if (v) c.slot.appendChild(C.marca(v));
    c.btn.classList.toggle('rt-con-ficha', v > 0);
    c.btn.setAttribute('aria-label', nombre(k) + (k.indexOf('col') === 0 ? ', paga 2 a 1' : '') + (v ? '. Apuesta: ' + v : ''));
  }

  /* ---- Apuestas */
  function limpiarMesa() {
    Object.keys(celdas).forEach(function (k) { celdas[k].btn.classList.remove('rt-gano', 'rt-viejo'); });
    Object.keys(apuestas).forEach(function (k) { delete apuestas[k]; pintarCelda(k); });
    pila = [];
    ui.bolsillos.querySelectorAll('.rt-b-gana').forEach(function (e) { e.classList.remove('rt-b-gana'); });
    estado = 'apostando';
  }
  function colocar(k) {
    if (estado === 'girando') return;
    if (estado === 'resuelta') limpiarMesa();
    var v = ui.fichas.valor();
    if (!banca.retirar(v)) { mensaje('No te quedan fichas para una de ' + v + '. Elige una ficha más pequeña.', 'mal'); return; }
    apuestas[k] = (apuestas[k] || 0) + v;
    pila.push([k, v]);
    pintarCelda(k);
    mensaje(nombre(k) + ': ' + C.fmt(apuestas[k]) + ' fichas. Apuesta total: ' + C.fmt(total()) + '.');
    refrescar();
  }
  function deshacer() {
    if (estado !== 'apostando' || !pila.length) return;
    var u = pila.pop();
    apuestas[u[0]] -= u[1];
    if (!apuestas[u[0]]) delete apuestas[u[0]];
    banca.ingresar(u[1]);
    pintarCelda(u[0]);
    mensaje('Ficha retirada. Apuesta total: ' + C.fmt(total()) + '.');
  }
  function borrar() {
    if (estado !== 'apostando' || !pila.length) return;
    while (pila.length) { var u = pila.pop(); banca.ingresar(u[1]); }
    var ks = Object.keys(apuestas);
    ks.forEach(function (k) { delete apuestas[k]; pintarCelda(k); });
    mensaje('Mesa vacía.');
  }
  function repetir() {
    if (estado === 'girando' || !ultima) return;
    if (estado === 'resuelta') limpiarMesa();
    if (total() > 0) return;
    var t = 0;
    Object.keys(ultima).forEach(function (k) { t += ultima[k]; });
    if (t > banca.saldo) { mensaje('No te llegan las fichas para repetir (' + C.fmt(t) + ').', 'mal'); return; }
    Object.keys(ultima).forEach(function (k) { banca.retirar(ultima[k]); apuestas[k] = ultima[k]; pila.push([k, ultima[k]]); pintarCelda(k); });
    mensaje('Apuesta repetida: ' + C.fmt(t) + ' fichas.');
    refrescar();
  }

  /* ---- Giro */
  function verRueda() {
    var r = ui.svg.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) ui.svg.scrollIntoView({ block: 'center', behavior: C.calma() ? 'auto' : 'smooth' });
  }
  function escenificar(n) {
    var i = ORDEN.indexOf(n);
    var W = rotR + 360 * 3 + C.azar(360);
    var meta = (W + i * PASO) % 360;
    var d = (((rotB - meta) % 360) + 360) % 360;
    var B = rotB - 360 * 5 - d;
    ui.svg.classList.remove('rt-gira');
    ui.bolaPunto.style.setProperty('transform', 'none');
    void ui.svg.getBoundingClientRect();
    if (!C.calma()) ui.svg.classList.add('rt-gira');
    ui.rg.style.setProperty('transform', 'rotate(' + W + 'deg)');
    ui.bg.style.setProperty('transform', 'rotate(' + B + 'deg)');
    ui.bolaPunto.style.setProperty('transform', 'translateY(' + (R_PISTA - R_BOLSILLO) + 'px)');
    rotR = W; rotB = B;
    return C.pausa(5600);
  }
  function girar() {
    if (estado !== 'apostando' || total() === 0) return;
    estado = 'girando';
    ultima = {};
    Object.keys(apuestas).forEach(function (k) { ultima[k] = apuestas[k]; });
    var n = C.azar(37);
    ui.centroN.textContent = '';
    ui.centro.setAttribute('class', 'rt-centro');
    ui.bolsillos.querySelectorAll('.rt-b-gana').forEach(function (e) { e.classList.remove('rt-b-gana'); });
    mensaje('La bola gira…');
    refrescar();
    verRueda();
    escenificar(n).then(function () { resolver(n); });
  }
  function resolver(n) {
    var apostado = 0;
    Object.keys(apuestas).forEach(function (k) { apostado += apuestas[k]; });
    var devuelve = C.reglas.ruleta.pago(apuestas, n), neto = devuelve - apostado;
    giros++;
    historial.unshift(n);
    if (historial.length > 12) historial.pop();
    banca.ingresar(devuelve);
    estado = 'resuelta';
    ui.centroN.textContent = n;
    ui.centro.setAttribute('class', 'rt-centro rt-centro--' + color(n));
    var cu = ui.bolsillos.querySelector('[data-n="' + n + '"]');
    if (cu) cu.classList.add('rt-b-gana');
    Object.keys(apuestas).forEach(function (k) { celdas[k].btn.classList.add(gana(k, n) ? 'rt-gano' : 'rt-viejo'); });
    var t = 'Sale el ' + n + ', ' + NOMBRE_COLOR[color(n)] + '. ';
    if (neto > 0) { t += 'Ganas ' + C.fmt(neto) + ' fichas.'; C.flota(ui.panel, '+' + C.fmt(neto), 'ok'); }
    else if (neto === 0) t += 'Recuperas lo apostado.';
    else { t += 'Pierdes ' + C.fmt(-neto) + ' fichas.'; C.flota(ui.panel, '−' + C.fmt(-neto), 'mal'); }
    mensaje(t, neto > 0 ? 'ok' : (neto < 0 ? 'mal' : ''));
    pintarHistorial();
    refrescar();
  }
  function pintarHistorial() {
    TYJ.vaciar(ui.hist);
    historial.forEach(function (n) { ui.hist.appendChild(h('li', { class: 'rt-h rt-h-' + color(n), texto: n, 'aria-label': n + ' ' + NOMBRE_COLOR[color(n)] })); });
    ui.histCont.hidden = !historial.length;
  }

  /* ---- Pantalla */
  function refrescar() {
    if (!ui.hud) return;
    ui.hud.poner('saldo', C.fmt(banca.saldo), banca.saldo === 0 && total() === 0);
    ui.hud.poner('apuesta', C.fmt(total()));
    ui.hud.poner('mejor', C.fmt(banca.mejor));
    var apostando = estado !== 'girando';
    ui.girar.disabled = estado !== 'apostando' || total() === 0;
    ui.deshacer.disabled = estado !== 'apostando' || !pila.length;
    ui.borrar.disabled = estado !== 'apostando' || !pila.length;
    ui.repetir.disabled = !apostando || !ultima || total() > 0 && estado !== 'resuelta';
    Object.keys(celdas).forEach(function (k) { celdas[k].btn.disabled = !apostando || (banca.saldo === 0 && estado !== 'resuelta'); });
    var sin = banca.saldo === 0 && total() === 0 && estado !== 'girando';
    ui.sin.hidden = !sin;
    ui.mandos.hidden = sin;
  }
  function montar() {
    TYJ.vaciar(raiz);
    ui.hud = TYJ.hud([['saldo', 'Fichas', C.fmt(C.SALDO_INICIAL)], ['apuesta', 'Apuesta', '0'], ['mejor', 'Mejor saldo', C.fmt(C.SALDO_INICIAL)]]);
    ui.msg = h('p', { class: 'mensaje rt-msg', texto: 'Elige una ficha y toca la mesa para apostar.' });
    ui.fichas = C.selector(C.FICHAS, 5);
    ui.girar = h('button', { type: 'button', class: 'boton-retro rt-girar', onclick: girar, texto: 'Girar' });
    ui.deshacer = h('button', { type: 'button', class: 'boton-retro boton-retro--sec boton-retro--chico', onclick: deshacer, texto: 'Deshacer' });
    ui.borrar = h('button', { type: 'button', class: 'boton-retro boton-retro--sec boton-retro--chico', onclick: borrar, texto: 'Borrar' });
    ui.repetir = h('button', { type: 'button', class: 'boton-retro boton-retro--sec boton-retro--chico', onclick: repetir, texto: 'Repetir' });
    ui.sin = C.sinFichas(function () { banca.recargar(); limpiarMesa(); mensaje('Tienes ' + C.fmt(banca.saldo) + ' fichas nuevas.'); refrescar(); });
    ui.sin.hidden = true;
    ui.hist = h('ul', { class: 'rt-hist' });
    ui.histCont = h('div', { class: 'rt-hist-cont' }, h('span', { class: 'texto-suave', texto: 'Últimos números' }), ui.hist);
    ui.histCont.hidden = true;
    ui.mandos = h('div', { class: 'rt-mandos' }, ui.fichas.nodo, h('div', { class: 'fila' }, ui.girar, ui.deshacer, ui.borrar, ui.repetir));
    ui.panel = h('div', { class: 'rt-panel' }, dibujarRueda(), ui.msg, ui.histCont, ui.sin, ui.mandos);
    var mesa = h('div', { class: 'cs-mesa rt-mesa' }, dibujarMesa(),
      h('p', { class: 'texto-suave rt-pagos', texto: 'Pleno: 35 a 1 · Docenas y columnas: 2 a 1 · Sencillas: 1 a 1' }));
    raiz.appendChild(C.aviso());
    raiz.appendChild(ui.hud.nodo);
    raiz.appendChild(h('div', { class: 'rt-escena' }, ui.panel, mesa));
    refrescar();
  }
  C.puerta(raiz, montar);
})();
