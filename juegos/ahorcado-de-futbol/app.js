/* AHORCADO DE FÚTBOL: adivina la palabra letra a letra antes de encajar seis goles. Cada palabra trae su categoría como pista (jugador, club, estadio, selección o
   término de fútbol) y se puede elegir categoría. Teclado del ordenador o teclas de la pantalla. Datos en ahorcado-de-futbol/palabras.json. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('ahf');
  if (!raiz) return;
  var NS = 'http://www.w3.org/2000/svg', MAX = 6, ABC = 'abcdefghijklmnñopqrstuvwxyz'.split('');
  var BALONES = [[40, 66], [64, 78], [88, 70], [112, 80], [134, 68], [76, 56]];
  var sesion = TYJ.Sesion(null, { victorias: true, racha: true, etiquetaMejor: 'Mejor puntuación: ' });
  var banco = [], categorias = [], categoria = '', g = null, ui = null, usadas = {}, alTecla = null;

  function palabraNueva() {
    var lista = banco.filter(function (x) { return !categoria || x.t === categoria; });
    var libres = lista.filter(function (x) { return !usadas[x.p]; });
    if (!libres.length) { usadas = {}; libres = lista; }
    var x = U.elegir(libres); usadas[x.p] = true;
    return x;
  }
  function nueva() {
    if (alTecla) document.removeEventListener('keydown', alTecla);
    var x = palabraNueva(), orig = Array.from(x.p);
    g = { palabra: x.p, cat: x.t, orig: orig, norm: orig.map(function (c) { return U.norm(c); }), probadas: {}, fallos: 0, fin: false, pistas: 0 };
    montar(); pintar();
    alTecla = function (ev) {
      if (ev.ctrlKey || ev.metaKey || ev.altKey || g.fin) return;
      var t = ev.target;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (ev.key.length === 1) { var l = U.norm(ev.key); if (ABC.indexOf(l) >= 0) { ev.preventDefault(); probar(l); } }
    };
    document.addEventListener('keydown', alTecla);
    TYJ.anunciar('Nueva palabra de ' + orig.length + ' letras. Categoría: ' + x.t + '.');
  }

  /* La portería: cada fallo es un gol encajado y aparece un balón dentro de la red */
  function porteria() {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 176 104'); s.setAttribute('class', 'ahf-dibujo'); s.setAttribute('role', 'img'); s.setAttribute('focusable', 'false');
    function el(tipo, attrs) { var e = document.createElementNS(NS, tipo); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); s.appendChild(e); return e; }
    var red = '';
    for (var x = 28; x <= 148; x += 10) red += 'M' + x + ' 24V92';
    for (var y = 34; y <= 90; y += 10) red += 'M24 ' + y + 'H152';
    el('path', { d: red, class: 'ahf-red', fill: 'none', 'stroke-width': '1' });
    el('path', { d: 'M20 94V20H156V94', class: 'ahf-palos', fill: 'none', 'stroke-width': '5', 'stroke-linecap': 'square' });
    el('path', { d: 'M4 96H172', class: 'ahf-cesped', fill: 'none', 'stroke-width': '3' });
    var balones = BALONES.map(function (b) {
      var c = el('g', { class: 'ahf-balon' });
      var a = document.createElementNS(NS, 'circle'); a.setAttribute('cx', b[0]); a.setAttribute('cy', b[1]); a.setAttribute('r', '8'); c.appendChild(a);
      var p = document.createElementNS(NS, 'path'); p.setAttribute('d', 'M' + (b[0] - 3) + ' ' + (b[1] - 1) + 'l3 -4l4 3l-2 5h-4z'); c.appendChild(p);
      return c;
    });
    return { nodo: s, partes: balones };
  }

  function montar() {
    TYJ.vaciar(raiz);
    ui = { teclas: {} };
    ui.cats = h('div', { class: 'fila', role: 'group', 'aria-label': 'Categoría' });
    [''].concat(categorias).forEach(function (c) {
      ui.cats.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(categoria === c), onclick: function () { categoria = c; nueva(); } }, c || 'Todas'));
    });
    ui.hud = TYJ.hud([['fallos', 'Goles encajados', '0 / ' + MAX]]);
    ui.dib = porteria();
    ui.cat = h('p', { class: 'ahf-categoria' });
    ui.palabra = h('p', { class: 'ahf-palabra', role: 'img' });
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    ui.teclado = h('div', { class: 'ahf-teclado', role: 'group', 'aria-label': 'Letras' });
    ABC.forEach(function (l) { var b = h('button', { class: 'ahf-tecla', type: 'button', 'aria-label': 'Letra ' + l.toUpperCase(), onclick: function () { probar(l); } }, l.toUpperCase()); ui.teclas[l] = b; ui.teclado.appendChild(b); });
    ui.pista = h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', onclick: pista }, 'Pista (cuesta un gol)');
    ui.final = h('div'); ui.est = h('div');
    [ui.cats, ui.hud.nodo, h('div', { class: 'ahf-zona' }, ui.dib.nodo, ui.cat, ui.palabra), ui.msg, ui.teclado,
      h('div', { class: 'fila fila--centro' }, ui.pista, h('button', { class: 'boton-retro boton-retro--chico', type: 'button', onclick: nueva }, 'Otra palabra')),
      ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
  }

  function pintar() {
    TYJ.vaciar(ui.palabra);
    var texto = [];
    g.orig.forEach(function (c, i) {
      var vista = g.probadas[g.norm[i]] === 'ok' || g.fin;
      ui.palabra.appendChild(h('span', { class: 'ahf-letra' + (g.fin && g.probadas[g.norm[i]] !== 'ok' ? ' ahf-letra--falta' : '') }, vista ? c.toUpperCase() : ''));
      texto.push(g.probadas[g.norm[i]] === 'ok' ? c.toUpperCase() : 'hueco');
    });
    ui.palabra.setAttribute('aria-label', 'Palabra de ' + g.orig.length + ' letras: ' + texto.join(', '));
    ui.cat.textContent = 'Categoría: ' + g.cat;
    ui.dib.partes.forEach(function (p, i) { p.setAttribute('class', 'ahf-balon' + (i < g.fallos ? ' ahf-balon--on' : '')); });
    ui.dib.nodo.setAttribute('aria-label', 'Portería con ' + g.fallos + ' de ' + MAX + ' goles encajados');
    ui.hud.poner('fallos', g.fallos + ' / ' + MAX, g.fallos >= MAX - 1);
    ABC.forEach(function (l) {
      var e = g.probadas[l];
      ui.teclas[l].disabled = !!e || g.fin;
      ui.teclas[l].className = 'ahf-tecla' + (e === 'ok' ? ' ok' : e === 'mal' ? ' mal' : '');
    });
    ui.pista.disabled = g.fin || g.fallos >= MAX - 1;
  }

  function probar(l) {
    if (g.fin || g.probadas[l]) return;
    var esta = g.norm.indexOf(l) >= 0;
    g.probadas[l] = esta ? 'ok' : 'mal';
    if (!esta) g.fallos++;
    ui.msg.textContent = esta ? '' : 'La ' + l.toUpperCase() + ' no está: gol en contra.';
    ui.msg.className = 'mensaje mensaje--mal';
    pintar();
    TYJ.anunciar(esta ? 'La ' + l.toUpperCase() + ' está en la palabra.' : 'La ' + l.toUpperCase() + ' no está. Goles encajados: ' + g.fallos + ' de ' + MAX + '.');
    comprobarFin();
  }
  function pista() {
    if (g.fin || g.fallos >= MAX - 1) return;
    var faltan = g.norm.filter(function (l, i) { return g.norm.indexOf(l) === i && g.probadas[l] !== 'ok'; });
    if (!faltan.length) return;
    var l = U.elegir(faltan);
    g.pistas++; g.fallos++; g.probadas[l] = 'ok';
    ui.msg.textContent = 'Pista: la palabra tiene la letra ' + l.toUpperCase() + '.'; ui.msg.className = 'mensaje';
    pintar(); comprobarFin();
  }
  function comprobarFin() {
    var gana = g.norm.every(function (l) { return g.probadas[l] === 'ok'; });
    if (!gana && g.fallos < MAX) return;
    g.fin = true; pintar();
    var palabra = g.palabra.toUpperCase();
    var puntos = gana ? 100 + (MAX - g.fallos) * 50 + g.orig.length * 10 : Object.keys(g.probadas).filter(function (l) { return g.probadas[l] === 'ok'; }).length * 10;
    sesion.registrar(puntos, gana);
    document.removeEventListener('keydown', alTecla);
    TYJ.final(ui.final.appendChild(h('div')), { titulo: gana ? '¡Portería a cero!' : 'Te han metido seis goles', puntos: puntos, unidad: 'puntos',
      nivel: 'La palabra era ' + palabra + ' (' + g.cat.toLowerCase() + ')', detalles: ['Goles encajados: ' + g.fallos + ' de ' + MAX, g.pistas ? 'Pistas usadas: ' + g.pistas : 'Sin pistas'],
      compartir: 'Ahorcado de fútbol: ' + (gana ? 'palabra de ' + g.orig.length + ' letras salvada con ' + g.fallos + ' goles encajados.' : 'esta vez me han metido seis goles con una palabra de ' + g.orig.length + ' letras.'),
      textoRepetir: 'Otra palabra', alRepetir: nueva });
  }

  function arrancar() {
    TYJ.datos('ahorcado-de-futbol/palabras.json').then(function (json) {
      banco = json.palabras;
      categorias = banco.map(function (x) { return x.t; }).filter(function (t, i, l) { return l.indexOf(t) === i; });
      nueva();
    }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();
