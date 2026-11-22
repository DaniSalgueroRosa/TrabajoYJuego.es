/* VÍDEO PÓKER (jotas o mejor): cinco cartas de una baraja de 52, retener y cambiar una sola vez, y tabla de premios fija.
   La baraja se mezcla con C.azar al repartir; el evaluador es una función pura (C.reglas.videoPoker) que las pruebas recorren con las 2.598.960 manos. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, C = TYJ.casino, h = TYJ.h;
  var raiz = document.getElementById('vp');
  if (!raiz || !C) return;

  /* ---- Reglas (puras) */
  var TABLA = [
    { id: 'real', nombre: 'Escalera real', mult: 250 },
    { id: 'color-escalera', nombre: 'Escalera de color', mult: 50 },
    { id: 'poker', nombre: 'Póker', mult: 25 },
    { id: 'full', nombre: 'Full', mult: 9 },
    { id: 'color', nombre: 'Color', mult: 6 },
    { id: 'escalera', nombre: 'Escalera', mult: 4 },
    { id: 'trio', nombre: 'Trío', mult: 3 },
    { id: 'doble', nombre: 'Doble pareja', mult: 2 },
    { id: 'pareja', nombre: 'Pareja de jotas o mejor', mult: 1 }
  ];
  var BAJA = { id: 'baja', nombre: 'Pareja baja', mult: 0 };
  var NADA = { id: 'nada', nombre: 'Carta alta', mult: 0 };
  var POR_ID = {};
  TABLA.forEach(function (t) { POR_ID[t.id] = t; });
  var VAL = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13, A: 14 };
  var CNT = new Uint8Array(15);
  function evaluar(m) {
    CNT.fill(0);
    var p0 = m[0].p, color = true, min = 99, max = 0, i, v;
    for (i = 0; i < 5; i++) {
      v = VAL[m[i].r]; CNT[v]++;
      if (m[i].p !== p0) color = false;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    var cuatro = false, trio = false, pares = 0, alta = false;
    for (v = 2; v <= 14; v++) {
      var k = CNT[v];
      if (k === 4) cuatro = true; else if (k === 3) trio = true; else if (k === 2) { pares++; if (v >= 11) alta = true; }
    }
    var escalera = !cuatro && !trio && !pares && (max - min === 4 || (max === 14 && CNT[2] && CNT[3] && CNT[4] && CNT[5]));
    if (escalera && color) return POR_ID[min === 10 ? 'real' : 'color-escalera'];
    if (cuatro) return POR_ID.poker;
    if (trio && pares) return POR_ID.full;
    if (color) return POR_ID.color;
    if (escalera) return POR_ID.escalera;
    if (trio) return POR_ID.trio;
    if (pares === 2) return POR_ID.doble;
    if (pares === 1) return alta ? POR_ID.pareja : BAJA;
    return NADA;
  }
  C.reglas.videoPoker = { TABLA: TABLA, evaluar: evaluar, BAJA: BAJA, NADA: NADA };

  /* ---- Estado */
  var banca = C.Banca(C.SALDO_INICIAL, function () { refrescar(); });
  var mazo = C.Mazo(1);
  var ui = {}, mano = [], retenidas = [false, false, false, false, false];
  var fase = 'apuesta', apuesta = 0, ultimo = 0, ocupado = false, resultado = null, pos = [];

  function mensaje(t, tipo) {
    ui.msg.textContent = t;
    ui.msg.className = 'mensaje vp-msg' + (tipo ? ' mensaje--' + tipo : '');
    TYJ.anunciar(t);
  }
  function multiplo(r) { return r.mult ? ' (paga ×' + r.mult + ')' : ' (no paga)'; }

  /* ---- Cartas */
  function pintarPosicion(i, o) {
    var carta = mano[i] ? C.carta(mano[i], { entra: o && o.entra }) : C.carta(null, { oculta: true });
    var boton = h('button', { type: 'button', class: 'vp-retener', 'aria-pressed': retenidas[i] ? 'true' : 'false', 'aria-label': 'Retener la carta ' + (i + 1), onclick: function () { alternar(i); } },
      h('span', { class: 'vp-ret-t', texto: retenidas[i] ? 'Retenida' : 'Retener' }));
    boton.disabled = fase !== 'seleccion' || ocupado;
    if (o && o.entra && !C.calma()) carta.style.setProperty('animation-delay', (o.retraso || 0) + 'ms');
    var nodo = h('div', { class: 'vp-pos' + (retenidas[i] ? ' vp-ret' : ''), onclick: function (ev) { if (ev.target === boton || boton.contains(ev.target)) return; alternar(i); } },
      h('div', { class: 'vp-carta' }, carta), boton);
    if (pos[i]) ui.mano.replaceChild(nodo, pos[i]); else ui.mano.appendChild(nodo);
    pos[i] = nodo;
  }
  function pintarMano(animar, cambiadas) {
    for (var i = 0; i < 5; i++) {
      var entra = animar && (!cambiadas || cambiadas.indexOf(i) >= 0);
      pintarPosicion(i, entra ? { entra: true, retraso: (cambiadas ? cambiadas.indexOf(i) : i) * 90 } : null);
    }
  }
  function alternar(i) {
    if (fase !== 'seleccion' || ocupado) return;
    retenidas[i] = !retenidas[i];
    var nodo = pos[i], b = nodo.querySelector('.vp-retener');                     // se cambia en el sitio para no perder el foco del teclado
    nodo.classList.toggle('vp-ret', retenidas[i]);
    b.setAttribute('aria-pressed', retenidas[i] ? 'true' : 'false');
    b.firstChild.textContent = retenidas[i] ? 'Retenida' : 'Retener';
    ui.cambiar.textContent = retenidas.every(Boolean) ? 'Pasar sin cambiar' : 'Cambiar cartas';
  }
  function marcarTabla(r, clase) {
    ui.filas.forEach(function (f) { f.nodo.classList.remove('vp-fila--tengo', 'vp-fila--gana'); });
    if (!r || !r.mult) return;
    ui.filas.forEach(function (f) { if (f.id === r.id) f.nodo.classList.add(clase); });
  }

  /* ---- Acciones */
  function repartir() {
    if (ocupado || fase === 'seleccion') return;
    var a = ui.fichas.valor();
    if (!banca.retirar(a)) { mensaje('No te llegan las fichas para apostar ' + C.fmt(a) + '. Elige una ficha más pequeña.', 'mal'); return; }
    apuesta = a; ultimo = 0;
    mazo.barajar();
    mano = [mazo.sacar(), mazo.sacar(), mazo.sacar(), mazo.sacar(), mazo.sacar()];
    retenidas = [false, false, false, false, false];
    fase = 'seleccion'; resultado = null;
    ui.maquina.classList.remove('vp-gana');
    ui.cambiar.textContent = 'Cambiar cartas';
    pintarMano(true);
    var r = evaluar(mano);
    marcarTabla(r, 'vp-fila--tengo');
    pos[0].querySelector('.vp-retener').focus();
    mensaje('Tienes ' + r.nombre.toLowerCase() + multiplo(r) + '. Retén las cartas que quieras y pulsa «Cambiar cartas».');
    refrescar();
  }
  function cambiar() {
    if (fase !== 'seleccion' || ocupado) return;
    ocupado = true;
    var cambiadas = [];
    for (var i = 0; i < 5; i++) if (!retenidas[i]) { mano[i] = mazo.sacar(); cambiadas.push(i); }
    fase = 'fin';
    pintarMano(true, cambiadas);
    refrescar();
    C.pausa(C.calma() ? 0 : 150 + cambiadas.length * 90 + 380).then(resolver);
  }
  function resolver() {
    var r = evaluar(mano), premio = apuesta * r.mult, neto = premio - apuesta;
    ocupado = false; resultado = r;
    banca.ingresar(premio);
    ultimo = neto;
    marcarTabla(r, 'vp-fila--gana');
    if (r.mult) ui.maquina.classList.add('vp-gana');
    if (!r.mult) mensaje(r.nombre + ': sin premio. Pierdes ' + C.fmt(apuesta) + ' fichas.', 'mal');
    else if (r.mult === 1) mensaje(r.nombre + ': recuperas tu apuesta de ' + C.fmt(apuesta) + ' fichas.');
    else { mensaje(r.nombre + ': ×' + r.mult + '. Ganas ' + C.fmt(neto) + ' fichas.', 'ok'); C.flota(ui.maquina, '+' + C.fmt(neto), 'ok'); }
    pintarMano(false);
    refrescar();
    if (banca.saldo >= 1) ui.repartir.focus();
  }

  /* ---- Pantalla */
  function refrescar() {
    if (!ui.hud) return;
    var a = ui.fichas.valor();
    ui.hud.poner('saldo', C.fmt(banca.saldo), banca.saldo < 1);
    ui.hud.poner('apuesta', C.fmt(fase === 'seleccion' || ocupado ? apuesta : a));
    ui.hud.poner('ultimo', (ultimo > 0 ? '+' : (ultimo < 0 ? '−' : '')) + C.fmt(Math.abs(ultimo)));
    ui.filas.forEach(function (f) { f.ganas.textContent = C.fmt((fase === 'seleccion' || ocupado ? apuesta : a) * f.mult); });
    var sin = banca.saldo < 1 && fase !== 'seleccion' && !ocupado;
    ui.repartir.hidden = fase === 'seleccion' || ocupado;
    ui.cambiar.hidden = !(fase === 'seleccion' || ocupado);
    ui.cambiar.disabled = ocupado;
    ui.repartir.disabled = sin;
    ui.fichas.nodo.querySelectorAll('button').forEach(function (b) { b.disabled = fase === 'seleccion' || ocupado; });
    ui.sin.hidden = !sin;
    ui.mandos.hidden = sin;
    ui.mano.classList.toggle('vp-bloqueada', fase !== 'seleccion');
    for (var i = 0; i < 5; i++) if (pos[i]) pos[i].querySelector('.vp-retener').disabled = fase !== 'seleccion' || ocupado;
  }
  function tabla() {
    ui.filas = [];
    var lista = h('ul', { class: 'vp-pagos' });
    TABLA.forEach(function (t) {
      var ganas = h('span', { class: 'vp-p-ganas', texto: '0' });
      var nodo = h('li', { class: 'vp-fila' }, h('span', { class: 'vp-p-nombre', texto: t.nombre }), h('span', { class: 'vp-p-mult', texto: '×' + t.mult }), ganas);
      ui.filas.push({ id: t.id, mult: t.mult, nodo: nodo, ganas: ganas });
      lista.appendChild(nodo);
    });
    return h('div', { class: 'vp-tabla' },
      h('p', { class: 'vp-cab' }, h('span', { texto: 'Mano' }), h('span', { texto: 'Paga' }), h('span', { texto: 'Con tu apuesta' })), lista);
  }
  function montar() {
    TYJ.vaciar(raiz);
    ui.hud = TYJ.hud([['saldo', 'Fichas', C.fmt(C.SALDO_INICIAL)], ['apuesta', 'Apuesta', '5'], ['ultimo', 'Última mano', '0']]);
    ui.msg = h('p', { class: 'mensaje vp-msg', texto: 'Elige una ficha y pulsa «Repartir». Pagan las manos de pareja de jotas o mejor.' });
    ui.mano = h('div', { class: 'vp-mano vp-bloqueada', role: 'group', 'aria-label': 'Tus cinco cartas' });
    ui.fichas = C.selector(C.FICHAS, 5, function () { refrescar(); });
    ui.repartir = h('button', { type: 'button', class: 'boton-retro vp-boton', onclick: repartir, texto: 'Repartir' });
    ui.cambiar = h('button', { type: 'button', class: 'boton-retro vp-boton', onclick: cambiar, texto: 'Cambiar cartas' });
    ui.cambiar.hidden = true;
    ui.mandos = h('div', { class: 'vp-mandos' }, ui.fichas.nodo, ui.repartir, ui.cambiar);
    ui.sin = C.sinFichas(function () { banca.recargar(); mensaje('Tienes ' + C.fmt(banca.saldo) + ' fichas nuevas.'); refrescar(); });
    ui.sin.hidden = true;
    ui.maquina = h('div', { class: 'vp-maquina' },
      h('p', { class: 'vp-rotulo', texto: 'Vídeo póker' }),
      h('div', { class: 'vp-pantalla' }, tabla(), ui.mano),
      ui.msg, ui.mandos, ui.sin,
      h('p', { class: 'texto-suave vp-ayuda', texto: 'Teclas: del 1 al 5 retienen la carta; con el foco en un botón, Intro lo pulsa.' }));
    raiz.appendChild(C.aviso());
    raiz.appendChild(ui.hud.nodo);
    raiz.appendChild(ui.maquina);
    pintarMano(false);
    refrescar();
    raiz.addEventListener('keydown', function (ev) {
      if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
      var n = '12345'.indexOf(ev.key);
      if (ev.key.length === 1 && n >= 0 && fase === 'seleccion' && !ocupado) { ev.preventDefault(); alternar(n); }
    });
  }
  C.puerta(raiz, montar);
})();
