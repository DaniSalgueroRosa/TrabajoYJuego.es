/* TRAGAPERRAS: tres rodillos de 20 posiciones con una línea de pago (la del centro) y una tabla de premios con retorno del 94,1 %.
   El resultado se sortea con C.azar al girar; los rodillos son cintas de símbolos SVG que se desplazan con una transición CSS. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, C = TYJ.casino, h = TYJ.h;
  var raiz = document.getElementById('sl');
  if (!raiz || !C) return;
  var sv = C.sv;

  /* ---- Reglas (puras) */
  var BASE = ['siete', 'limon', 'cereza', 'sandia', 'campana', 'limon', 'sandia', 'estrella', 'limon', 'cereza', 'campana', 'sandia', 'limon', 'siete', 'sandia', 'limon', 'campana', 'cereza', 'estrella', 'sandia'];
  var L = BASE.length;
  function girada(n) { return BASE.slice(n).concat(BASE.slice(0, n)); }
  var TIRAS = [BASE, girada(7), girada(13)];                        // mismas posiciones en cada rodillo, en otro orden
  var TRES = { siete: 100, estrella: 50, campana: 20, sandia: 10, limon: 6, cereza: 10 };
  function multiplicador(a, b, c) {
    if (a === b && b === c) return TRES[a];
    var k = (a === 'cereza') + (b === 'cereza') + (c === 'cereza');
    return k === 2 ? 2 : (k === 1 ? 1 : 0);
  }
  function retorno() {                                              // suma de premios de las L³ combinaciones / L³
    var t = 0;
    for (var i = 0; i < L; i++) for (var j = 0; j < L; j++) for (var k = 0; k < L; k++) t += multiplicador(TIRAS[0][i], TIRAS[1][j], TIRAS[2][k]);
    return t / (L * L * L);
  }
  C.reglas.tragaperras = { TIRAS: TIRAS, TRES: TRES, multiplicador: multiplicador, retorno: retorno };

  /* ---- Símbolos (dibujos planos de 48 × 48 con borde oscuro) */
  var NOMBRES = { siete: 'siete', estrella: 'estrella', campana: 'campana', sandia: 'sandía', limon: 'limón', cereza: 'cereza' };
  var PLURALES = { siete: 'sietes', estrella: 'estrellas', campana: 'campanas', sandia: 'sandías', limon: 'limones', cereza: 'cerezas' };
  function estrella(cx, cy, r1, r2) {
    var p = [];
    for (var i = 0; i < 10; i++) { var r = i % 2 ? r2 : r1, a = Math.PI * i / 5 - Math.PI / 2; p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); }
    return p.join(' ');
  }
  function brillo(x, y, w, hh) { return sv('rect', { class: 'sl-brillo', x: x, y: y, width: w, height: hh }); }
  var DIBUJOS = {
    cereza: function () { return [
      sv('path', { class: 'sl-trazo sl-verde', d: 'M25 9C24 17 18 23 15 30' }), sv('path', { class: 'sl-trazo sl-verde', d: 'M25 9C27 17 33 23 36 31' }),
      sv('path', { class: 'sl-verde', d: 'M25 9C30 3 38 4 42 8C37 13 30 13 25 9Z' }),
      sv('circle', { class: 'sl-rojo', cx: 14, cy: 36, r: 9.5 }), sv('circle', { class: 'sl-rojo2', cx: 35, cy: 37, r: 9.5 }),
      brillo(9, 31, 4, 4), brillo(30, 32, 4, 4)]; },
    limon: function () { return [
      sv('ellipse', { class: 'sl-amar', cx: 24, cy: 26, rx: 19, ry: 13, transform: 'rotate(-22 24 26)' }),
      sv('path', { class: 'sl-verde', d: 'M33 11C37 7 42 8 43 12C39 14 35 14 33 11Z' }), brillo(13, 21, 7, 3), brillo(13, 25, 3, 3)]; },
    sandia: function () { return [
      sv('path', { class: 'sl-verde', d: 'M4 15H44A20 20 0 0 1 4 15Z' }), sv('path', { class: 'sl-rojo', d: 'M9 15H39A15 15 0 0 1 9 15Z' }),
      sv('rect', { class: 'sl-semilla', x: 15, y: 21, width: 3, height: 5 }), sv('rect', { class: 'sl-semilla', x: 23, y: 25, width: 3, height: 5 }), sv('rect', { class: 'sl-semilla', x: 31, y: 21, width: 3, height: 5 }),
      brillo(12, 17, 4, 3)]; },
    campana: function () { return [
      sv('path', { class: 'sl-oro', d: 'M24 7C15 7 12 14 12 22V30L7 37H41L36 30V22C36 14 33 7 24 7Z' }),
      sv('circle', { class: 'sl-oro', cx: 24, cy: 41, r: 4.5 }), sv('rect', { class: 'sl-oro', x: 21, y: 3, width: 6, height: 5 }), brillo(17, 15, 4, 11)]; },
    estrella: function () { return [sv('polygon', { class: 'sl-oro', points: estrella(24, 26, 21, 9) }), brillo(21, 19, 5, 5)]; },
    siete: function () { return [sv('path', { class: 'sl-rojo', d: 'M7 8H41V18L27 43H15L29 19H7Z' }), brillo(11, 11, 22, 3)]; }
  };
  function simbolo(nombre, clase) {
    var s = sv('svg', { viewBox: '0 0 48 48', class: 'sl-sim sl-s-' + nombre + (clase ? ' ' + clase : ''), 'aria-hidden': 'true', focusable: 'false' });
    DIBUJOS[nombre]().forEach(function (e) { s.appendChild(e); });
    return s;
  }

  /* ---- Estado */
  var banca = C.Banca(C.SALDO_INICIAL, function () { refrescar(); });
  var ui = {}, rodillos = [], paradas = [0, 0, 0], girando = false, ultimo = 0, giros = 0;
  var DURACION = [1.7, 2.2, 2.7];

  function mensaje(t, tipo) {
    ui.msg.textContent = t;
    ui.msg.className = 'mensaje sl-msg' + (tipo ? ' mensaje--' + tipo : '');
    TYJ.anunciar(t);
  }
  function simboloEn(i, p) { return TIRAS[i][((p % L) + L) % L]; }
  function colocar(i, f, animar, dur) {
    var cinta = rodillos[i].cinta;
    cinta.classList.remove('sl-anima');
    if (animar) {
      void cinta.offsetHeight;
      cinta.style.setProperty('--dur', dur + 's');
      cinta.classList.add('sl-anima');
      cinta.style.setProperty('--pos', String(3 * L + f - 1));
    } else cinta.style.setProperty('--pos', String(L + f - 1));
    paradas[i] = f;
  }
  function descansar(i) { var cinta = rodillos[i].cinta; cinta.classList.remove('sl-anima'); cinta.style.setProperty('--pos', String(L + paradas[i] - 1)); }

  function girar() {
    if (girando) return;
    var apuesta = ui.fichas.valor();
    if (!banca.retirar(apuesta)) { mensaje('No te llegan las fichas para apostar ' + apuesta + '. Elige una ficha más pequeña.', 'mal'); return; }
    girando = true;
    var f = [C.azar(L), C.azar(L), C.azar(L)];
    var res = [simboloEn(0, f[0]), simboloEn(1, f[1]), simboloEn(2, f[2])];
    ui.maquina.classList.remove('sl-gana'); ui.centro.classList.remove('sl-linea--gana');
    rodillos.forEach(function (r) { r.ventana.classList.remove('sl-rodillo--gana'); });
    mensaje('Girando…');
    ui.palanca.classList.add('sl-palanca--baja');
    var calma = C.calma();
    [0, 1, 2].forEach(function (i) {
      if (calma) { paradas[i] = f[i]; descansar(i); } else colocar(i, f[i], true, DURACION[i]);
    });
    refrescar();
    C.pausa(calma ? 30 : DURACION[2] * 1000 + 150).then(function () {
      [0, 1, 2].forEach(descansar);
      ui.palanca.classList.remove('sl-palanca--baja');
      resolver(apuesta, res);
    });
    setTimeout(function () { ui.palanca.classList.remove('sl-palanca--baja'); }, calma ? 0 : 450);
  }
  function resolver(apuesta, res) {
    var m = multiplicador(res[0], res[1], res[2]), premio = apuesta * m;
    giros++;
    girando = false;
    banca.ingresar(premio);
    ultimo = premio - apuesta;
    var neto = premio - apuesta;
    var nombre = res.map(function (s) { return NOMBRES[s]; }).join(', ');
    if (m > 0) {
      ui.maquina.classList.add('sl-gana'); ui.centro.classList.add('sl-linea--gana');
      rodillos.forEach(function (r) { r.ventana.classList.add('sl-rodillo--gana'); });
    }
    if (m === 0) mensaje('Sin premio (' + nombre + '). Pierdes ' + C.fmt(apuesta) + ' fichas.', 'mal');
    else if (m === 1) mensaje('Una cereza: recuperas tu apuesta de ' + C.fmt(apuesta) + ' fichas.');
    else { mensaje((res[0] === res[1] && res[1] === res[2] ? 'Tres ' + PLURALES[res[0]] : 'Dos cerezas') + ': ×' + m + '. Ganas ' + C.fmt(neto) + ' fichas.', 'ok'); C.flota(ui.maquina, '+' + C.fmt(neto), 'ok'); }
    refrescar();
  }

  /* ---- Pantalla */
  function refrescar() {
    if (!ui.hud) return;
    ui.hud.poner('saldo', C.fmt(banca.saldo), banca.saldo < 1);
    ui.hud.poner('apuesta', C.fmt(ui.fichas.valor()));
    ui.hud.poner('ultimo', (ultimo > 0 ? '+' : (ultimo < 0 ? '−' : '')) + C.fmt(Math.abs(ultimo)));
    var sin = banca.saldo < 1 && !girando;
    ui.girar.disabled = girando || sin;
    ui.palanca.disabled = girando || sin;
    ui.sin.hidden = !sin;
    ui.mandos.hidden = sin;
  }
  function rodillo(i) {
    var cinta = h('div', { class: 'sl-cinta' });
    for (var c = 0; c < 5; c++) for (var k = 0; k < L; k++) cinta.appendChild(h('div', { class: 'sl-celda' }, simbolo(TIRAS[i][k])));
    var ventana = h('div', { class: 'sl-rodillo' }, cinta);
    return { cinta: cinta, ventana: ventana };
  }
  function tabla() {
    function fila(simbolos, texto, mult) {
      return h('li', { class: 'sl-pago' }, h('span', { class: 'sl-pago-s', 'aria-hidden': 'true' }, simbolos.map(function (n) { return simbolo(n); })), h('span', { class: 'sl-pago-t', texto: texto }), h('b', { class: 'sl-pago-m', texto: '×' + mult }));
    }
    return h('div', { class: 'sl-pagos' }, h('h3', { class: 'sl-pagos-t', texto: 'Premios' }),
      h('ul', { class: 'sl-lista' },
        fila(['siete', 'siete', 'siete'], 'Tres sietes', 100), fila(['estrella', 'estrella', 'estrella'], 'Tres estrellas', 50), fila(['campana', 'campana', 'campana'], 'Tres campanas', 20),
        fila(['sandia', 'sandia', 'sandia'], 'Tres sandías', 10), fila(['cereza', 'cereza', 'cereza'], 'Tres cerezas', 10), fila(['limon', 'limon', 'limon'], 'Tres limones', 6),
        fila(['cereza', 'cereza'], 'Dos cerezas', 2), fila(['cereza'], 'Una cereza', 1)));
  }
  function montar() {
    TYJ.vaciar(raiz);
    ui.hud = TYJ.hud([['saldo', 'Fichas', C.fmt(C.SALDO_INICIAL)], ['apuesta', 'Apuesta', '5'], ['ultimo', 'Último giro', '0']]);
    ui.msg = h('p', { class: 'mensaje sl-msg', texto: 'Elige una ficha y tira de la palanca.' });
    rodillos = [rodillo(0), rodillo(1), rodillo(2)];
    [0, 1, 2].forEach(function (i) { paradas[i] = C.azar(L); descansar(i); });
    ui.centro = h('div', { class: 'sl-linea', 'aria-hidden': 'true' });
    ui.palanca = h('button', { type: 'button', class: 'sl-palanca', 'aria-label': 'Tirar de la palanca para girar', onclick: girar }, h('span', { class: 'sl-palanca-varilla' }, h('span', { class: 'sl-palanca-bola' })));
    var luces = h('div', { class: 'sl-luces', 'aria-hidden': 'true' });
    for (var i = 0; i < 16; i++) luces.appendChild(h('span', { class: 'sl-luz' }));
    ui.fichas = C.selector(C.FICHAS, 5, function () { refrescar(); });
    ui.girar = h('button', { type: 'button', class: 'boton-retro sl-girar', onclick: girar, texto: 'Girar' });
    ui.mandos = h('div', { class: 'sl-mandos' }, ui.fichas.nodo, ui.girar);
    ui.sin = C.sinFichas(function () { banca.recargar(); mensaje('Tienes ' + C.fmt(banca.saldo) + ' fichas nuevas.'); refrescar(); });
    ui.sin.hidden = true;
    ui.maquina = h('div', { class: 'sl-maquina' },
      luces, h('p', { class: 'sl-rotulo', texto: 'Tragaperras' }),
      h('div', { class: 'sl-marco' }, h('div', { class: 'sl-ventana', role: 'img', 'aria-label': 'Tres rodillos' }, rodillos.map(function (r) { return r.ventana; }), ui.centro), ui.palanca),
      ui.msg, ui.mandos, ui.sin);
    raiz.appendChild(C.aviso());
    raiz.appendChild(ui.hud.nodo);
    raiz.appendChild(h('div', { class: 'sl-escena' }, ui.maquina, tabla()));
    refrescar();
  }
  C.puerta(raiz, montar);
})();
