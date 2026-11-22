/* ===== juegos/_casino/casino.js ===== */
/* BIBLIOTECA DEL CASINO (TYJ.casino): piezas que comparten los juegos de azar (ruleta, blackjack, tragaperras, vídeo póker, raspa y gana).
   Cada juego la pide con «"usa": ["casino"]» en su ficha.json y el motor carga este archivo y casino.css solo en esas páginas.
   TODO es simulación: fichas virtuales que viven en una variable de la página y desaparecen al recargar. No se guarda nada
   (ni localStorage, ni sessionStorage, ni IndexedDB, ni cookies) y no hay dinero, premios ni enlaces a sitios de apuestas. */
(function () {
  'use strict';
  var TYJ = window.TYJ;
  if (!TYJ || !TYJ.h) return;
  var h = TYJ.h, U = TYJ.util;
  var C = TYJ.casino = TYJ.casino || {};
  var NS = 'http://www.w3.org/2000/svg';

  C.SALDO_INICIAL = 1000;
  C.FICHAS = [1, 5, 25, 100];
  C.reglas = {};                                          // cada juego deja aquí sus reglas puras (pagos, evaluar manos…) para poder comprobarlas por separado
  C.fmt = function (n) { return U.miles(Math.floor(n)) + (n % 1 ? ',5' : ''); };       // solo hay medias fichas (el 3 a 2 del blackjack)

  /* ---- Movimiento: si la persona pide menos animación, todo pasa al instante */
  C.calma = function () { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); };
  C.pausa = function (ms) { return new Promise(function (ok) { setTimeout(ok, C.calma() ? Math.min(ms, 30) : ms); }); };

  /* ---- Azar: crypto.getRandomValues, sin sesgo (se descartan los valores que no caben en un reparto exacto). Se llama en cada tirada, sin guardarlo antes. */
  C.azar = function (n) {
    var cr = window.crypto;
    if (!cr || !cr.getRandomValues) return Math.floor(Math.random() * n);
    var tope = Math.floor(4294967296 / n) * n, a = new Uint32Array(1);
    do { cr.getRandomValues(a); } while (a[0] >= tope);
    return a[0] % n;
  };
  C.barajar = function (lista) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = C.azar(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  /* Elige una opción según pesos: C.ponderado([[valor, peso], …]) */
  C.ponderado = function (tabla) {
    var total = 0, i;
    for (i = 0; i < tabla.length; i++) total += tabla[i][1];
    var r = C.azar(total);
    for (i = 0; i < tabla.length; i++) { if (r < tabla[i][1]) return tabla[i][0]; r -= tabla[i][1]; }
    return tabla[tabla.length - 1][0];
  };

  /* ---- SVG */
  C.sv = function (tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] != null) el.setAttribute(k, String(attrs[k])); });
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) el.appendChild(arguments[i]);
    return el;
  };
  var sv = C.sv;

  /* Arte de píxeles: filas de texto («#» o una letra = píxel, «.» = vacío). Cada letra es una capa con su clase cs-px-<letra> (los colores están en casino.css). */
  C.arte = function (filas, clase) {
    var ancho = filas[0].length, alto = filas.length, capas = {}, orden = [];
    filas.forEach(function (fila, y) {
      var x = 0;
      while (x < ancho) {
        var c = fila.charAt(x);
        if (c === '.' || c === ' ') { x++; continue; }
        var n = 1;
        while (x + n < ancho && fila.charAt(x + n) === c) n++;
        if (!capas[c]) { capas[c] = ''; orden.push(c); }
        capas[c] += 'M' + x + ' ' + y + 'h' + n + 'v1h-' + n + 'z';
        x += n;
      }
    });
    var s = sv('svg', { viewBox: '0 0 ' + ancho + ' ' + alto, class: 'cs-arte' + (clase ? ' ' + clase : ''), 'aria-hidden': 'true', focusable: 'false' });
    orden.forEach(function (c) { s.appendChild(sv('path', { d: capas[c], class: 'cs-px-' + (c === '#' ? 'k' : c) })); });
    return s;
  };

  /* ---- Fichas (disco de píxeles de 16 × 16 con el valor en el centro) */
  var discoCache = null;
  function disco() {
    if (discoCache) return discoCache;
    var base = '', raya = '', n = 16, c = n / 2, x, y;
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) {
      var dx = x + 0.5 - c, dy = y + 0.5 - c, d2 = dx * dx + dy * dy;
      if (d2 > 64) continue;
      var celda = 'M' + x + ' ' + y + 'h1v1h-1z';
      if (d2 > 38) {
        var sector = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 8) % 8;
        if (sector % 2 === 0) raya += celda; else base += celda;
      } else if (d2 > 23) raya += celda;
      else base += celda;
    }
    discoCache = { base: base, raya: raya };
    return discoCache;
  }
  C.ficha = function (valor, clase) {
    var d = disco(), txt = String(valor);
    return sv('svg', { viewBox: '0 0 16 16', class: 'cs-ficha cs-f' + valor + (clase ? ' ' + clase : ''), 'aria-hidden': 'true', focusable: 'false' },
      sv('path', { class: 'cs-ch-a', d: d.base }), sv('path', { class: 'cs-ch-b', d: d.raya }),
      (function () { var t = sv('text', { x: 8, y: 9.9, class: 'cs-ch-t' + (txt.length > 2 ? ' cs-ch-t--3' : '') }); t.textContent = txt; return t; })());
  };
  /* Selector de ficha: C.selector([1, 5, 25, 100], 5, function (valor) {}) → { nodo, valor(), poner(v) } */
  C.selector = function (valores, inicial, alCambiar) {
    var activo = inicial, botones = [];
    var nodo = h('div', { class: 'cs-fichas', role: 'group', 'aria-label': 'Valor de la ficha' });
    function poner(v) {
      activo = v;
      botones.forEach(function (x) { x[1].setAttribute('aria-pressed', x[0] === v ? 'true' : 'false'); });
      if (alCambiar) alCambiar(v);
    }
    valores.forEach(function (v) {
      var b = h('button', { type: 'button', class: 'cs-ficha-btn', 'aria-pressed': v === activo ? 'true' : 'false', 'aria-label': 'Ficha de ' + v, onclick: function () { poner(v); } }, C.ficha(v));
      botones.push([v, b]);
      nodo.appendChild(b);
    });
    return { nodo: nodo, valor: function () { return activo; }, poner: poner };
  };
  /* Fichas que se suman a la apuesta al pulsarlas: C.botonesFicha([5, 25, 100], function (valor) {}) → { nodo, permitir(function (valor) → ¿se puede?) } */
  C.botonesFicha = function (valores, alClic) {
    var nodo = h('div', { class: 'cs-fichas', role: 'group', 'aria-label': 'Fichas para apostar' }), botones = [];
    valores.forEach(function (v) {
      var b = h('button', { type: 'button', class: 'cs-ficha-btn', 'aria-label': 'Añadir una ficha de ' + v, onclick: function () { alClic(v); } }, C.ficha(v));
      botones.push([v, b]);
      nodo.appendChild(b);
    });
    return { nodo: nodo, permitir: function (puede) { botones.forEach(function (x) { x[1].disabled = !puede(x[0]); }); } };
  };
  /* Marca de apuesta sobre el tapete: un disco del color de la mayor ficha que cabe en el total y la cifra */
  C.marca = function (total) {
    var den = 1;
    C.FICHAS.forEach(function (f) { if (f <= total) den = f; });
    return h('span', { class: 'cs-marca cs-m' + den, texto: C.fmt(total), 'aria-hidden': 'true' });
  };

  /* ---- Banca de fichas virtuales (solo en memoria) */
  C.Banca = function (inicial, alCambiar) {
    var b = { saldo: inicial, inicial: inicial, mejor: inicial, recargas: 0 };
    function avisar() { if (b.saldo > b.mejor) b.mejor = b.saldo; if (alCambiar) alCambiar(b); }
    b.puede = function (n) { return n > 0 && n <= b.saldo; };
    b.retirar = function (n) { if (!b.puede(n)) return false; b.saldo -= n; avisar(); return true; };
    b.ingresar = function (n) { b.saldo += n; avisar(); };
    b.recargar = function () { b.saldo += inicial; b.recargas++; avisar(); };
    return b;
  };

  /* ---- Avisos */
  C.AVISO_JUEGO = 'El juego puede provocar ludopatía y no es recomendable jugar con dinero real.';
  C.AYUDA_JUEGO = 'Si tú o alguien cercano tenéis problemas con el juego, FEJAR (Federación Española de Jugadores de Azar Rehabilitados) atiende gratis en el 900\u00A0200\u00A0225.';
  /* aviso fijo dentro del juego; opciones.gratis es para el juego que no usa fichas (abrir sobres) */
  C.aviso = function (opciones) {
    var gratis = !!(opciones && opciones.gratis);
    return h('p', { class: 'cs-aviso' }, h('span', { class: 'cs-18', 'aria-hidden': 'true', texto: '18+' }),
      h('span', { texto: (gratis ? 'Juego gratuito, sin fichas: aquí no se juega ni se gana dinero real ni premios. Solo para mayores de 18 años. ' : 'Simulación con fichas virtuales: aquí no se juega ni se gana dinero real ni premios. Solo para mayores de 18 años. ') + C.AVISO_JUEGO }));
  };
  /* Puerta de entrada: se pide en cada carga de la página (no se guarda nada) y el juego no se monta hasta que se marca la casilla de mayor de 18 años. */
  C.puerta = function (raiz, entrar, opciones) {
    var gratis = !!(opciones && opciones.gratis);
    var caja = h('input', { type: 'checkbox', class: 'cs-mayor-caja' });
    var boton = h('button', { type: 'button', class: 'boton-retro cs-puerta-boton', texto: 'Entrar al juego' });
    boton.disabled = true;
    caja.addEventListener('change', function () { boton.disabled = !caja.checked; });
    boton.addEventListener('click', function () {
      if (!caja.checked) return;
      entrar();
      var candidatos = raiz.querySelectorAll('button:not([disabled]), input:not([disabled])'), primero = null;
      for (var i = 0; i < candidatos.length && !primero; i++) if (candidatos[i].getClientRects().length) primero = candidatos[i];
      if (primero) primero.focus({ preventScroll: true });
    });
    var titulo = h('p', { class: 'cs-puerta-t', id: 'cs-puerta-t', texto: 'Solo para mayores de 18 años' });
    TYJ.vaciar(raiz);
    raiz.appendChild(h('div', { class: 'cs-puerta', role: 'group', 'aria-labelledby': 'cs-puerta-t' },
      h('div', { class: 'cs-puerta-cab' }, h('span', { class: 'cs-18 cs-18--grande', 'aria-hidden': 'true', texto: '18+' }), titulo),
      h('p', { texto: 'Los juegos de azar pueden provocar ludopatía, una adicción al juego con consecuencias graves para la salud, el dinero y la familia. ' + (gratis ? 'Aquí todo es gratis y simulado: no se paga ni se gana dinero real ni premios.' : 'Aquí todo es simulado, con fichas virtuales: no se gana ni se pierde dinero real.') }),
      h('p', { texto: 'No es recomendable jugar con dinero real: a la larga se pierde más de lo que se gana, y lo que ves en este juego no cambia eso.' }),
      h('p', { class: 'texto-suave', texto: C.AYUDA_JUEGO }),
      h('label', { class: 'cs-mayor' }, caja, h('span', { texto: 'Soy mayor de 18 años y entiendo que esto es solo una simulación.' })),
      boton));
  };
  C.sinFichas = function (alRecargar) {
    return h('div', { class: 'cs-sin', role: 'status' },
      h('p', { class: 'cs-sin-t', texto: 'Te has quedado sin fichas' }),
      h('p', { class: 'texto-suave', texto: 'Son fichas de mentira, así que no pasa nada. Puedes empezar de nuevo con ' + C.fmt(C.SALDO_INICIAL) + '.' }),
      h('button', { type: 'button', class: 'boton-retro', onclick: alRecargar, texto: 'Recargar ' + C.fmt(C.SALDO_INICIAL) + ' fichas' }));
  };
  /* Cifra que sube y se apaga (+70, −25…) dentro de un contenedor con position: relative */
  C.flota = function (contenedor, texto, tipo) {
    var n = h('span', { class: 'cs-flota cs-flota--' + (tipo || 'ok'), texto: texto, 'aria-hidden': 'true' });
    contenedor.appendChild(n);
    setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 1800);
  };

  /* ---- Cartas de la baraja francesa (picas, corazones, diamantes y tréboles). Palos: p, c, d, t. Rangos: A 2 … 10 J Q K. */
  C.RANGOS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  C.PALOS = ['p', 'c', 'd', 't'];
  var NOMBRE_PALO = { p: 'picas', c: 'corazones', d: 'diamantes', t: 'tréboles' };
  var NOMBRE_RANGO = { A: 'as', J: 'jota', Q: 'reina', K: 'rey' };
  C.nombreCarta = function (c) { return (NOMBRE_RANGO[c.r] || c.r) + ' de ' + NOMBRE_PALO[c.p]; };
  var PALO_ARTE = {
    c: ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...'],
    d: ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'],
    p: ['...#...', '..###..', '.#####.', '#######', '#######', '.##.##.', '...#...', '..###..'],
    t: ['..###..', '..###..', '#.###.#', '#######', '#######', '#.###.#', '...#...', '..###..']
  };
  C.palo = function (p, clase) { return C.arte(PALO_ARTE[p], 'cs-palo' + (clase ? ' ' + clase : '')); };
  /* C.carta({ r, p }, { oculta, entra }) */
  C.carta = function (c, o) {
    o = o || {};
    var extra = o.entra && !C.calma() ? ' cs-entra' : '';
    if (!c || o.oculta) return h('div', { class: 'cs-carta cs-carta--dorso' + extra, role: 'img', 'aria-label': 'Carta boca abajo' }, h('span', { class: 'cs-dorso-dibujo' }));
    var figura = c.r === 'J' || c.r === 'Q' || c.r === 'K';
    function esquina(inv) { return h('span', { class: 'cs-esq' + (inv ? ' cs-esq--inv' : '') }, h('b', { class: 'cs-rango', texto: c.r }), C.palo(c.p)); }
    return h('div', { class: 'cs-carta' + ((c.p === 'c' || c.p === 'd') ? ' cs-roja' : '') + extra, role: 'img', 'aria-label': C.nombreCarta(c), 'data-carta': c.r + c.p },
      esquina(false), h('span', { class: 'cs-centro' }, figura ? h('b', { class: 'cs-fig', texto: c.r }) : null, C.palo(c.p, figura ? 'cs-palo--chico' : '')), esquina(true));
  };
  /* Mazo de una o varias barajas. C.alTope (lista de textos como «As», «10c», «Kd») se reparte antes que el mazo: es un gancho para las pruebas. */
  function cartaDeTexto(t) { return { r: t.slice(0, -1), p: t.slice(-1) }; }
  C.Mazo = function (barajas) {
    var m = {}, cartas = [];
    m.barajar = function () {
      var todas = [];
      for (var b = 0; b < barajas; b++) C.PALOS.forEach(function (p) { C.RANGOS.forEach(function (r) { todas.push({ r: r, p: p }); }); });
      cartas = C.barajar(todas);
    };
    m.sacar = function () {
      if (C.alTope && C.alTope.length) return cartaDeTexto(C.alTope.shift());
      if (!cartas.length) m.barajar();
      return cartas.pop();
    };
    m.quedan = function () { return cartas.length; };
    m.total = barajas * 52;
    m.barajar();
    return m;
  };
})();
