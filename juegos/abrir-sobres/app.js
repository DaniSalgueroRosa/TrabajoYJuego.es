/* ABRIR SOBRES: 24 cartas del Sistema Solar (cuerpos.json) en sobres de cinco. La rareza sale de cuántas cartas hay de cada tipo y el sorteo usa C.azar;
   las cartas se deciden al abrir el sobre y la animación solo las enseña. El álbum vive en memoria: no se guarda nada y no hay fichas ni compras. */
(function () {
  'use strict';
  var TYJ = window.TYJ, C = TYJ.casino, h = TYJ.h;
  var raiz = document.getElementById('sb');
  if (!raiz || !C) return;
  var sv = C.sv;

  /* ---- Reglas (puras) */
  var RAREZAS = ['comun', 'poco', 'rara', 'leg'];
  var NOMBRE = { comun: 'Común', poco: 'Poco común', rara: 'Rara', leg: 'Legendaria' };
  var PESO = { comun: 55, poco: 28, rara: 13, leg: 4 };                                       // % de cada posición del sobre (suman 100)
  var DE_TIPO = { satelite: 'comun', planeta: 'poco', enano: 'rara', estrella: 'leg', cometa: 'leg' };
  var TIPO = { satelite: 'Satélite', planeta: 'Planeta', enano: 'Planeta enano', estrella: 'Estrella', cometa: 'Cometa' };
  var POR_SOBRE = 5;
  var cartas = [];

  /* Cinco posiciones: la rareza de cada una se sortea con los pesos de las rarezas que aún tienen cartas libres y luego se elige una carta de esa rareza.
     Nunca se repite una carta dentro del sobre. El resultado sale ordenado de menos a más rara. */
  function sobre(azar, lista) {
    var elegidas = [];
    for (var k = 0; k < POR_SOBRE; k++) {
      var grupos = [], total = 0;
      RAREZAS.forEach(function (r) {
        var libres = lista.filter(function (c) { return c.r === r && elegidas.indexOf(c) < 0; });
        if (libres.length) { grupos.push({ libres: libres, peso: PESO[r] }); total += PESO[r]; }
      });
      var x = azar(total), g = 0;
      while (x >= grupos[g].peso) { x -= grupos[g].peso; g++; }
      elegidas.push(grupos[g].libres[azar(grupos[g].libres.length)]);
    }
    return elegidas.sort(function (a, b) { return RAREZAS.indexOf(a.r) - RAREZAS.indexOf(b.r) || a.n - b.n; });
  }
  C.reglas.sobres = {
    RAREZAS: RAREZAS, PESO: PESO, DE_TIPO: DE_TIPO, POR_SOBRE: POR_SOBRE,
    cartas: function () { return cartas; },
    sobre: function (azar) { return sobre(azar || C.azar, cartas); }
  };

  /* ---- Dibujo de cada cuerpo (lienzo de 100 × 100 descrito en cuerpos.json) */
  var uid = 0;
  function forma(f) {
    switch (f[0]) {
      case 'c': return sv('circle', { cx: f[1], cy: f[2], r: f[3], fill: f[4] });
      case 'e': return sv('ellipse', { cx: f[1], cy: f[2], rx: f[3], ry: f[4], fill: f[5] });
      case 'r': return sv('rect', { x: 0, y: f[1], width: 100, height: f[2], fill: f[3] });
      case 'l': return sv('line', { x1: f[1], y1: f[2], x2: f[3], y2: f[4], stroke: f[5], 'stroke-width': f[6], 'stroke-linecap': 'round' });
      case 'p': return sv('polygon', { points: f[1], fill: f[2] });
    }
    return null;
  }
  function anillo(a, delante) {
    var g = sv('g', { transform: 'translate(50 50) rotate(' + (a.rot || 0) + ')' });
    if (delante) g.appendChild(sv('path', { d: 'M' + (-a.rx) + ' 0A' + a.rx + ' ' + a.ry + ' 0 0 0 ' + a.rx + ' 0', fill: 'none', stroke: a.color, 'stroke-width': a.w }));
    else g.appendChild(sv('ellipse', { cx: 0, cy: 0, rx: a.rx, ry: a.ry, fill: 'none', stroke: a.color, 'stroke-width': a.w }));
    return g;
  }
  function dibujo(c) {
    var a = c.a, id = 'sb-c' + (++uid), cx = a.ox == null ? 50 : a.ox, cy = a.oy == null ? 50 : a.oy, rx = a.rx || 38, ry = a.ry || rx;
    var giro = a.rot ? 'rotate(' + a.rot + ' ' + cx + ' ' + cy + ')' : null;
    var s = sv('svg', { viewBox: '0 0 100 100', class: 'sb-dibujo', 'aria-hidden': 'true', focusable: 'false' });
    (a.fuera || []).forEach(function (f) { s.appendChild(forma(f)); });
    if (a.anillo) s.appendChild(anillo(a.anillo, false));
    s.appendChild(sv('clipPath', { id: id }, sv('ellipse', { cx: cx, cy: cy, rx: rx, ry: ry, transform: giro })));
    var g = sv('g', { 'clip-path': 'url(#' + id + ')' }, sv('rect', { x: 0, y: 0, width: 100, height: 100, fill: a.color }));
    (a.capas || []).forEach(function (f) { var e = forma(f); if (e) g.appendChild(e); });
    if (a.sombra !== false) {                                                         // media luna oscura abajo a la derecha
      var R = Math.max(rx, ry) * 1.02, x = cx - 8, y = cy - 8;
      g.appendChild(sv('path', { d: 'M0 0H100V100H0Z M' + (x + R) + ' ' + y + 'A' + R + ' ' + R + ' 0 1 0 ' + (x - R) + ' ' + y + 'A' + R + ' ' + R + ' 0 1 0 ' + (x + R) + ' ' + y + 'Z', 'fill-rule': 'evenodd', fill: 'rgba(0,0,0,0.3)' }));
    }
    s.appendChild(g);
    s.appendChild(sv('ellipse', { cx: cx, cy: cy, rx: rx, ry: ry, transform: giro, fill: 'none', stroke: '#14201C', 'stroke-width': 2.4 }));
    if (a.anillo) s.appendChild(anillo(a.anillo, true));
    return s;
  }

  /* ---- Estado */
  var album = {}, sobres = 0, repetidas = 0, fase = 'reposo', mano = [], volteando = false;
  var ui = {}, huecos = {};

  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }
  function tengo() { return Object.keys(album).length; }
  function pendientes() { return mano.filter(function (m) { return !m.volteada; }).length; }
  function mensaje(t, tipo, mudo) {
    ui.msg.textContent = t;
    ui.msg.className = 'mensaje sb-msg' + (tipo ? ' mensaje--' + tipo : '');
    if (!mudo) TYJ.anunciar(t);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function describir(c) { return c.nombre + ', ' + TIPO[c.tipo].toLowerCase() + ', rareza ' + NOMBRE[c.r].toLowerCase(); }

  /* ---- Piezas de pantalla */
  function frente(c) {
    return h('span', { class: 'sb-cara sb-frente' }, h('span', { class: 'sb-int' },                  // el relleno va dentro: un contenedor no puede usar sus propios cqw
      h('span', { class: 'sb-banda', texto: NOMBRE[c.r] }),
      h('span', { class: 'sb-lienzo' }, dibujo(c)),
      h('span', { class: 'sb-nombre', texto: c.nombre }),
      h('span', { class: 'sb-datos' }, h('span', { texto: TIPO[c.tipo] }), h('span', { texto: c.diam }))));
  }
  function sello() {
    return sv('svg', { viewBox: '0 0 40 40', class: 'sb-sello', 'aria-hidden': 'true', focusable: 'false' },
      sv('ellipse', { cx: 20, cy: 20, rx: 17, ry: 6, transform: 'rotate(-22 20 20)', fill: 'none', stroke: '#EAF2EE', 'stroke-width': 2 }),
      sv('circle', { cx: 20, cy: 20, r: 8, fill: '#E6F14A' }));
  }
  function zig(arriba, abajo) {
    var p = [];
    for (var i = 0; i <= 18; i++) p.push((6 + i * 6) + ',' + (i % 2 ? abajo : arriba));
    return p;
  }
  function sobreArte() {
    var s = sv('svg', { viewBox: '0 0 120 168', class: 'sb-sobre-svg', 'aria-hidden': 'true', focusable: 'false' });
    var cuerpo = zig(6, 12).concat(zig(162, 156).reverse()).join(' ');
    var tapa = zig(6, 12).concat(['114,38', '6,38']).join(' ');
    s.appendChild(sv('g', { class: 'sb-sobre-cuerpo' },
      sv('polygon', { points: cuerpo, fill: '#C21E4A', stroke: '#14201C', 'stroke-width': 3, 'stroke-linejoin': 'round' }),
      sv('rect', { x: 12, y: 44, width: 96, height: 106, fill: '#14201C' }),
      sv('circle', { cx: 60, cy: 94, r: 20, fill: '#E6F14A' }),
      sv('ellipse', { cx: 60, cy: 94, rx: 46, ry: 13, transform: 'rotate(-20 60 94)', fill: 'none', stroke: '#EAF2EE', 'stroke-width': 3 }),
      sv('circle', { cx: 26, cy: 62, r: 4, fill: '#6FD3B8' }), sv('circle', { cx: 96, cy: 128, r: 5, fill: '#FF5A7D' }), sv('circle', { cx: 100, cy: 60, r: 2.5, fill: '#EAF2EE' }),
      sv('text', { class: 'sb-sobre-t', x: 60, y: 142 }, document.createTextNode('5 CARTAS'))));
    s.appendChild(sv('g', { class: 'sb-sobre-tapa' },
      sv('polygon', { points: tapa, fill: '#FF5A7D', stroke: '#14201C', 'stroke-width': 3, 'stroke-linejoin': 'round' }),
      sv('text', { class: 'sb-sobre-t sb-sobre-t--tapa', x: 60, y: 28 }, document.createTextNode('SISTEMA SOLAR'))));
    return s;
  }
  function carta(c, i) {
    var b = h('button', { type: 'button', class: 'sb-carta sb-r-' + c.r + ' cs-entra', 'aria-label': 'Carta ' + (i + 1) + ' de ' + POR_SOBRE + ', boca abajo. Pulsa para darle la vuelta.', onclick: function () { voltear(i); } },
      h('span', { class: 'sb-giro' }, h('span', { class: 'sb-cara sb-dorso' }, sello()), frente(c)));
    b.style.setProperty('animation-delay', (i * 90) + 'ms');
    return b;
  }

  /* ---- Álbum y ficha */
  function mostrar(c) {
    var veces = album[c.id] || 0;
    TYJ.vaciar(ui.ficha).appendChild(h('div', { class: 'sb-ficha-in sb-r-' + c.r },
      h('div', { class: 'sb-ficha-arte', 'aria-hidden': 'true' }, dibujo(c)),
      h('div', {},
        h('h3', { class: 'sb-ficha-t', texto: c.nombre }),
        h('p', { class: 'sb-ficha-s', texto: 'N.º ' + c.n + ' de ' + cartas.length + ' · ' + TIPO[c.tipo] + ' · ' + NOMBRE[c.r] + ' · ' + c.diam + ' de diámetro' }),
        h('p', { class: 'sb-ficha-d', texto: c.dato }),
        h('p', { class: 'sb-ficha-s', texto: veces ? 'Tienes ' + plural(veces, 'carta', 'cartas') + ' en el álbum.' : 'Todavía no la tienes.' }))));
  }
  function pintarAlbum() {
    cartas.forEach(function (c) {
      var li = huecos[c.id], veces = album[c.id] || 0;
      TYJ.vaciar(li);
      if (veces) {
        li.appendChild(h('button', { type: 'button', class: 'sb-hueco sb-r-' + c.r, 'aria-label': 'Carta ' + c.n + ': ' + describir(c) + ', ' + plural(veces, 'unidad', 'unidades') + '. Ver ficha.', onclick: function () { mostrar(c); } },
          frente(c), veces > 1 ? h('span', { class: 'sb-veces', texto: '×' + veces, 'aria-hidden': 'true' }) : null));
      } else {
        li.appendChild(h('div', { class: 'sb-hueco sb-vacio sb-r-' + c.r, role: 'img', 'aria-label': 'Carta ' + c.n + ': ' + c.nombre + ', todavía sin conseguir' },
          h('span', { class: 'sb-interro', 'aria-hidden': 'true', texto: '?' }),
          h('span', { class: 'sb-hueco-n', 'aria-hidden': 'true', texto: 'N.º ' + pad(c.n) }),
          h('span', { class: 'sb-hueco-nombre', 'aria-hidden': 'true', texto: c.nombre })));
      }
    });
  }
  function refrescar() {
    ui.hud.poner('sobres', sobres);
    ui.hud.poner('album', tengo() + '/' + cartas.length);
    ui.hud.poner('rep', repetidas);
    var completo = fase === 'completo';
    ui.album.parentNode.classList.toggle('sb-completo', completo);
    if (fase === 'abriendo' || volteando) { ui.abrir.disabled = true; return; }
    ui.abrir.disabled = false;
    ui.sobre.disabled = fase === 'reparto' || completo;
    if (completo) ui.abrir.textContent = 'Empezar un álbum nuevo';
    else if (fase === 'reparto' && pendientes()) ui.abrir.textContent = 'Dar la vuelta a todas';
    else ui.abrir.textContent = sobres ? 'Abrir otro sobre' : 'Abrir sobre';
  }

  /* ---- Acciones */
  function principal() {
    if (fase === 'abriendo' || volteando) return;
    if (fase === 'completo') return reiniciar();
    if (fase === 'reparto' && pendientes()) return todas();
    abrir();
  }
  function abrir() {
    fase = 'abriendo';
    var elegidas = sobre(C.azar, cartas);                                              // se decide ahora; lo que sigue solo lo enseña
    sobres++;
    mano = [];
    TYJ.vaciar(ui.mano);
    ui.zona.hidden = false;
    ui.sobre.classList.remove('sb-sacude', 'sb-abierto');
    void ui.sobre.offsetHeight;
    mensaje('Abriendo el sobre…');
    ui.sobre.classList.add('sb-sacude');
    refrescar();
    C.pausa(800).then(function () { ui.sobre.classList.add('sb-abierto'); return C.pausa(480); }).then(function () {
      ui.zona.hidden = true;
      repartir(elegidas);
    });
  }
  function repartir(elegidas) {
    elegidas.forEach(function (c, i) {
      var nodo = carta(c, i);
      mano.push({ carta: c, nodo: nodo, volteada: false, nueva: false });
      ui.mano.appendChild(nodo);
    });
    fase = 'reparto';
    mensaje('Pulsa cada carta para darle la vuelta, o usa «Dar la vuelta a todas».');
    refrescar();
    mano[0].nodo.focus();
  }
  function voltear(i, enMasa) {
    var m = mano[i];
    if (!m || fase !== 'reparto' && fase !== 'completo' && fase !== 'fin') return;
    if (m.volteada) { mostrar(m.carta); return; }
    var c = m.carta, antes = album[c.id] || 0;
    m.volteada = true;
    m.nueva = antes === 0;
    album[c.id] = antes + 1;
    if (!m.nueva) repetidas++;
    m.nodo.classList.add('sb-volteada');
    if (m.nueva) m.nodo.appendChild(h('span', { class: 'sb-nueva', 'aria-hidden': 'true', texto: 'Nueva' }));
    m.nodo.setAttribute('aria-label', 'Carta ' + (i + 1) + ': ' + describir(c) + (m.nueva ? ', nueva' : ', repetida') + '. Ver ficha.');
    mostrar(c);
    pintarAlbum();
    var ultima = !pendientes();
    if (!ultima) mensaje(c.nombre + ': ' + (m.nueva ? 'carta nueva' : 'ya la tenías') + ' (' + NOMBRE[c.r].toLowerCase() + ').', m.nueva ? 'ok' : null, enMasa);
    else terminar();
    refrescar();
  }
  function todas() {
    volteando = true;
    refrescar();
    var pend = [];
    mano.forEach(function (m, i) { if (!m.volteada) pend.push(i); });
    (function paso(k) {
      if (k >= pend.length) { volteando = false; refrescar(); return; }
      voltear(pend[k], true);
      C.pausa(280).then(function () { paso(k + 1); });
    })(0);
  }
  function terminar() {
    var nuevas = mano.filter(function (m) { return m.nueva; }).length, rep = POR_SOBRE - nuevas, faltan = cartas.length - tengo();
    if (!faltan) {
      fase = 'completo';
      mensaje('¡Álbum completo! Has reunido las ' + cartas.length + ' cartas en ' + plural(sobres, 'sobre', 'sobres') + '.', 'ok');
    } else {
      fase = 'fin';
      mensaje('Sobre ' + sobres + ': ' + plural(nuevas, 'carta nueva', 'cartas nuevas') + ' y ' + plural(rep, 'repetida', 'repetidas') + '. ' + (faltan === 1 ? 'Te falta 1 carta.' : 'Te faltan ' + faltan + ' cartas.'), nuevas ? 'ok' : null);
    }
  }
  function reiniciar() {
    album = {}; sobres = 0; repetidas = 0; mano = []; fase = 'reposo';
    TYJ.vaciar(ui.mano);
    ui.zona.hidden = false;
    ui.sobre.classList.remove('sb-sacude', 'sb-abierto');
    TYJ.vaciar(ui.ficha).appendChild(h('p', { class: 'texto-suave', texto: 'Pulsa una carta del álbum para ver su ficha.' }));
    pintarAlbum();
    mensaje('Álbum nuevo y vacío. Abre un sobre para empezar.');
    refrescar();
  }

  /* ---- Pantalla */
  function montar() {
    TYJ.vaciar(raiz);
    ui.hud = TYJ.hud([['sobres', 'Sobres abiertos', '0'], ['album', 'Álbum', '0/' + cartas.length], ['rep', 'Repetidas', '0']]);
    ui.msg = h('p', { class: 'mensaje sb-msg', texto: 'Abre tu primer sobre: trae cinco cartas del Sistema Solar.' });
    ui.sobre = h('button', { type: 'button', class: 'sb-sobre', 'aria-label': 'Abrir un sobre de cinco cartas', onclick: principal }, sobreArte());
    ui.zona = h('div', { class: 'sb-zona' }, ui.sobre);
    ui.mano = h('div', { class: 'sb-mano', role: 'group', 'aria-label': 'Cartas del sobre' });
    ui.abrir = h('button', { type: 'button', class: 'boton-retro sb-abrir', onclick: principal, texto: 'Abrir sobre' });
    ui.ficha = h('section', { class: 'sb-ficha', 'aria-label': 'Ficha de la carta' }, h('p', { class: 'texto-suave', texto: 'Pulsa una carta del álbum para ver su ficha.' }));
    ui.album = h('ul', { class: 'sb-album' });
    cartas.forEach(function (c) { var li = h('li', { class: 'sb-casilla' }); huecos[c.id] = li; ui.album.appendChild(li); });
    var leyenda = h('ul', { class: 'sb-leyenda' }, RAREZAS.map(function (r) {
      var n = cartas.filter(function (c) { return c.r === r; }).length;
      return h('li', { class: 'sb-r-' + r }, h('span', { class: 'sb-muestra', 'aria-hidden': 'true' }), h('span', { texto: NOMBRE[r] + ': ' + n + ' cartas, ' + PESO[r] + ' %' }));
    }));
    raiz.appendChild(ui.hud.nodo);
    raiz.appendChild(C.aviso({ gratis: true }));
    raiz.appendChild(h('div', { class: 'sb-escena' },
      h('div', { class: 'cs-mesa sb-mesa' }, ui.zona, ui.mano, ui.msg, h('div', { class: 'sb-mandos' }, ui.abrir)),
      h('section', { class: 'sb-caja', 'aria-label': 'Tu álbum' },
        h('h2', { class: 'sb-titulo', texto: 'Tu álbum' }),
        h('p', { class: 'texto-suave sb-nota', texto: 'El porcentaje es la probabilidad de que cada posición de un sobre sea de esa rareza.' }),
        leyenda, ui.album, ui.ficha)));
    pintarAlbum();
    refrescar();
  }

  function arrancar() {
    TYJ.datos('abrir-sobres/cuerpos.json').then(function (json) {
      cartas = json.cuerpos.map(function (c, i) { return { n: i + 1, id: c.id, nombre: c.n, tipo: c.t, diam: c.d, dato: c.dato, a: c.a, r: DE_TIPO[c.t] }; });
      C.puerta(raiz, montar, { gratis: true });
    }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();
