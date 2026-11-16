/* AHORCADO: adivina la palabra letra a letra antes de que se complete el dibujo (6 fallos). Palabras de 5, 6 o 7 letras de la lista
   de Palabra Infinita (juegos/datos/palabras.json). Teclado del ordenador o teclas de la pantalla. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('ah');
  if (!raiz) return;
  var NS = 'http://www.w3.org/2000/svg', MAX = 6, ABC = 'abcdefghijklmnñopqrstuvwxyz'.split('');
  var sesion = TYJ.Sesion(null, { victorias: true, racha: true, etiquetaMejor: 'Mejor puntuación: ' });
  var banco = null, longitud = 0, g = null, ui = null, usadas = {}, alTecla = null;

  function palabraNueva() {
    var lista = [];
    [5, 6, 7].forEach(function (n) { if (!longitud || longitud === n) lista = lista.concat(banco[String(n)].soluciones); });
    var libres = lista.filter(function (p) { return !usadas[p]; });
    if (!libres.length) { usadas = {}; libres = lista; }
    var p = U.elegir(libres); usadas[p] = true;
    return p;
  }
  function nueva() {
    if (alTecla) document.removeEventListener('keydown', alTecla);
    var palabra = palabraNueva(), orig = Array.from(palabra);
    g = { palabra: palabra, orig: orig, norm: orig.map(function (c) { return U.norm(c); }), probadas: {}, fallos: 0, fin: false, pistas: 0 };
    montar(); pintar();
    alTecla = function (ev) {
      if (ev.ctrlKey || ev.metaKey || ev.altKey || g.fin) return;
      var t = ev.target;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (ev.key.length === 1) { var l = U.norm(ev.key); if (ABC.indexOf(l) >= 0) { ev.preventDefault(); probar(l); } }
    };
    document.addEventListener('keydown', alTecla);
    TYJ.anunciar('Nueva palabra de ' + orig.length + ' letras.');
  }

  function dibujo() {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 120 140'); s.setAttribute('class', 'ah-dibujo'); s.setAttribute('role', 'img'); s.setAttribute('focusable', 'false');
    function trazo(d, clase) {
      var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('class', clase);
      p.setAttribute('fill', 'none'); p.setAttribute('stroke-width', '4'); p.setAttribute('stroke-linecap', 'square'); s.appendChild(p); return p;
    }
    trazo('M10 130H70M30 130V10H85M30 32L52 10M85 10V30', 'ah-horca');
    var partes = [], cabeza = document.createElementNS(NS, 'circle');
    cabeza.setAttribute('cx', '85'); cabeza.setAttribute('cy', '40'); cabeza.setAttribute('r', '10'); cabeza.setAttribute('fill', 'none'); cabeza.setAttribute('stroke-width', '4'); cabeza.setAttribute('class', 'ah-parte');
    s.appendChild(cabeza); partes.push(cabeza);
    ['M85 50V90', 'M85 60L70 78', 'M85 60L100 78', 'M85 90L72 118', 'M85 90L98 118'].forEach(function (d) { partes.push(trazo(d, 'ah-parte')); });
    return { nodo: s, partes: partes };
  }

  function montar() {
    TYJ.vaciar(raiz);
    ui = { teclas: {} };
    ui.longitudes = h('div', { class: 'fila', role: 'group', 'aria-label': 'Longitud de la palabra' });
    [[0, 'Cualquiera'], [5, '5 letras'], [6, '6 letras'], [7, '7 letras']].forEach(function (o) {
      ui.longitudes.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(longitud === o[0]), onclick: function () { longitud = o[0]; nueva(); } }, o[1]));
    });
    ui.hud = TYJ.hud([['fallos', 'Fallos', '0 / ' + MAX]]);
    ui.dib = dibujo();
    ui.palabra = h('p', { class: 'ah-palabra', role: 'img' });
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    ui.teclado = h('div', { class: 'ah-teclado', role: 'group', 'aria-label': 'Letras' });
    ABC.forEach(function (l) {
      var b = h('button', { class: 'ah-tecla', type: 'button', 'aria-label': 'Letra ' + l.toUpperCase(), onclick: function () { probar(l); } }, l.toUpperCase());
      ui.teclas[l] = b; ui.teclado.appendChild(b);
    });
    ui.pista = h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', onclick: pista }, 'Pista (cuesta un fallo)');
    ui.final = h('div'); ui.est = h('div');
    [ui.longitudes, ui.hud.nodo, h('div', { class: 'ah-zona' }, ui.dib.nodo, ui.palabra), ui.msg, ui.teclado,
      h('div', { class: 'fila fila--centro' }, ui.pista, h('button', { class: 'boton-retro boton-retro--chico', type: 'button', onclick: nueva }, 'Otra palabra')),
      ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
  }

  function pintar() {
    TYJ.vaciar(ui.palabra);
    var texto = [];
    g.orig.forEach(function (c, i) {
      var vista = g.probadas[g.norm[i]] === 'ok' || g.fin;
      ui.palabra.appendChild(h('span', { class: 'ah-letra' + (g.fin && g.probadas[g.norm[i]] !== 'ok' ? ' ah-letra--falta' : '') }, vista ? c.toUpperCase() : ''));
      texto.push(g.probadas[g.norm[i]] === 'ok' ? c.toUpperCase() : 'hueco');
    });
    ui.palabra.setAttribute('aria-label', 'Palabra de ' + g.orig.length + ' letras: ' + texto.join(', '));
    ui.dib.partes.forEach(function (p, i) { p.setAttribute('class', 'ah-parte' + (i < g.fallos ? ' ah-parte--on' : '')); });
    ui.dib.nodo.setAttribute('aria-label', 'Dibujo del ahorcado con ' + g.fallos + ' de ' + MAX + ' partes');
    ui.hud.poner('fallos', g.fallos + ' / ' + MAX, g.fallos >= MAX - 1);
    ABC.forEach(function (l) {
      var e = g.probadas[l];
      ui.teclas[l].disabled = !!e || g.fin;
      ui.teclas[l].className = 'ah-tecla' + (e === 'ok' ? ' ok' : e === 'mal' ? ' mal' : '');
    });
    ui.pista.disabled = g.fin || g.fallos >= MAX - 1;
  }

  function probar(l) {
    if (g.fin || g.probadas[l]) return;
    var esta = g.norm.indexOf(l) >= 0;
    g.probadas[l] = esta ? 'ok' : 'mal';
    if (!esta) g.fallos++;
    ui.msg.textContent = esta ? '' : 'La ' + l.toUpperCase() + ' no está.';
    ui.msg.className = 'mensaje mensaje--mal';
    pintar();
    TYJ.anunciar(esta ? 'La ' + l.toUpperCase() + ' está en la palabra.' : 'La ' + l.toUpperCase() + ' no está. Fallos: ' + g.fallos + ' de ' + MAX + '.');
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
    var palabra = g.palabra.toUpperCase(), puntos = gana ? 100 + (MAX - g.fallos) * 100 + g.orig.length * 20 : Object.keys(g.probadas).filter(function (l) { return g.probadas[l] === 'ok'; }).length * 10;
    sesion.registrar(puntos, gana);
    document.removeEventListener('keydown', alTecla);
    TYJ.final(ui.final.appendChild(h('div')), { titulo: gana ? '¡Palabra salvada!' : 'Te has quedado sin intentos', puntos: puntos, unidad: 'puntos',
      nivel: 'La palabra era ' + palabra, detalles: ['Fallos: ' + g.fallos + ' de ' + MAX, g.pistas ? 'Pistas usadas: ' + g.pistas : 'Sin pistas'],
      compartir: 'Ahorcado: ' + (gana ? 'palabra de ' + g.orig.length + ' letras salvada con ' + g.fallos + ' fallos.' : 'esta vez no he podido salvar la palabra de ' + g.orig.length + ' letras.'),
      textoRepetir: 'Otra palabra', alRepetir: nueva });
  }

  function arrancar() {
    TYJ.datos('datos/palabras.json').then(function (json) { banco = json.longitudes; nueva(); }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();
