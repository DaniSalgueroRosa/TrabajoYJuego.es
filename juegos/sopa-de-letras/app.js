/* SOPA DE LETRAS: rejilla con palabras escondidas de un tema. Se marca la primera y la última letra de la palabra: arrastrando, tocando una y otra,
   o con el teclado (flechas para moverte y Intro para marcar). Tres tamaños; en Difícil las palabras pueden ir en cualquier dirección. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('sl');
  if (!raiz) return;
  var NIVELES = {
    facil: { nombre: 'Fácil', n: 9, palabras: 7, dirs: [[0, 1], [1, 0]], objetivo: 150 },
    medio: { nombre: 'Medio', n: 11, palabras: 9, dirs: [[0, 1], [1, 0], [1, 1]], objetivo: 240 },
    dificil: { nombre: 'Difícil', n: 12, palabras: 11, dirs: [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]], objetivo: 330 }
  };
  var COLORES = ['#FFB86B', '#8FD694', '#6EC1FF', '#FF8AAA', '#E6F14A', '#B9A0F5', '#5ED6D0', '#F4A261', '#C6E86B', '#F28CC0', '#9DB8FF', '#FFD25A'];
  var RELLENO = 'AAAAEEEEIIIOOOUUBCDDLLMNNPRRSSTTVFGHJQXYZ';
  var NIVELES_FINAL = [[0, 'Curioso'], [500, 'Buscador'], [800, 'Rastreador'], [1100, 'Lince'], [1400, 'Ojo de halcón']];
  var sesion = TYJ.Sesion(null, { etiquetaMejor: 'Mejor puntuación: ' });
  var temas = [], nivel = 'medio', g = null, ui = null, reloj = null, ini = null, manejado = false, avisoPista = null;

  /* ---- generación */
  function generar(cfg, tema) {
    var palabras = U.muestra(tema.palabras.filter(function (p) { return Array.from(p).length <= cfg.n; }), cfg.palabras);
    palabras.sort(function (a, b) { return b.length - a.length; });
    for (var intento = 0; intento < 80; intento++) {
      var n = cfg.n, cel = new Array(n * n).fill(''), puestas = [], bien = true;
      for (var w = 0; w < palabras.length && bien; w++) {
        var letras = Array.from(palabras[w]), puesta = null;
        for (var k = 0; k < 200 && !puesta; k++) {
          var d = U.elegir(cfg.dirs), r = U.azar(n), c = U.azar(n), rf = r + d[0] * (letras.length - 1), cf = c + d[1] * (letras.length - 1);
          if (rf < 0 || rf >= n || cf < 0 || cf >= n) continue;
          var cabe = true;
          for (var i = 0; i < letras.length; i++) { var v = cel[(r + d[0] * i) * n + c + d[1] * i]; if (v && v !== letras[i]) { cabe = false; break; } }
          if (cabe) puesta = { p: palabras[w], r: r, c: c, dr: d[0], dc: d[1], hallada: false, color: '' };
        }
        if (!puesta) { bien = false; break; }
        Array.from(puesta.p).forEach(function (l, i) { cel[(puesta.r + puesta.dr * i) * n + puesta.c + puesta.dc * i] = l; });
        puestas.push(puesta);
      }
      if (bien) {
        for (var q = 0; q < cel.length; q++) if (!cel[q]) cel[q] = RELLENO.charAt(U.azar(RELLENO.length));
        puestas.sort(function (a, b) { return a.p < b.p ? -1 : 1; });
        return { cel: cel, puestas: puestas };
      }
    }
    return null;
  }
  function linea(a, b) {                                   // índices de las casillas en línea recta entre a y b (ambas incluidas), o null
    var n = g.n, r1 = Math.floor(a / n), c1 = a % n, r2 = Math.floor(b / n), c2 = b % n, dr = r2 - r1, dc = c2 - c1;
    if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
    var pasos = Math.max(Math.abs(dr), Math.abs(dc)), sr = Math.sign(dr), sc = Math.sign(dc), res = [];
    for (var i = 0; i <= pasos; i++) res.push((r1 + sr * i) * n + c1 + sc * i);
    return res;
  }

  /* ---- partida */
  function nueva() {
    clearInterval(reloj); clearTimeout(avisoPista);
    var cfg = NIVELES[nivel], tema = U.elegir(temas), gen = null;
    while (!gen) gen = generar(cfg, tema);
    g = { cfg: cfg, n: cfg.n, tema: tema, cel: gen.cel, puestas: gen.puestas, inicio: null, foco: 0, t0: 0, segundos: 0, fin: false, pistas: 0, halladas: 0 };
    montar(); pintar(); datos();
    TYJ.anunciar('Nueva sopa de letras de ' + tema.titulo + ': ' + g.puestas.length + ' palabras en una rejilla de ' + g.n + ' por ' + g.n + '.');
  }
  function arrancarReloj() {
    if (g.t0) return;
    g.t0 = performance.now();
    reloj = setInterval(function () { g.segundos = Math.floor((performance.now() - g.t0) / 1000); ui.hud.poner('tiempo', U.tiempo(g.segundos)); }, 500);
  }
  function tocar(i) {
    if (g.fin) return;
    arrancarReloj();
    g.foco = i;
    if (g.inicio == null) { g.inicio = i; ui.msg.textContent = 'Primera letra marcada. Toca ahora la última letra de la palabra.'; ui.msg.className = 'mensaje'; }
    else if (g.inicio === i) { g.inicio = null; ui.msg.textContent = 'Marca cancelada.'; ui.msg.className = 'mensaje'; }
    else { var a = g.inicio; g.inicio = null; comprobar(a, i); }
    pintar();
  }
  function comprobar(a, b) {
    if (g.fin) return;
    arrancarReloj();
    var l = linea(a, b);
    if (!l) { ui.msg.textContent = 'Las letras tienen que estar en línea recta: horizontal, vertical o diagonal.'; ui.msg.className = 'mensaje mensaje--mal'; pintar(); return; }
    var txt = l.map(function (i) { return g.cel[i]; }).join(''), rev = Array.from(txt).reverse().join('');
    var hit = g.puestas.filter(function (p) { return !p.hallada && (p.p === txt || p.p === rev); })[0];
    if (!hit) { ui.msg.textContent = 'Esa línea no es ninguna de las palabras que quedan.'; ui.msg.className = 'mensaje mensaje--mal'; pintar(); return; }
    hit.hallada = true; hit.color = COLORES[g.puestas.indexOf(hit) % COLORES.length]; g.halladas++;
    ui.msg.textContent = '¡' + hit.p + '! Te faltan ' + (g.puestas.length - g.halladas) + '.'; ui.msg.className = 'mensaje mensaje--ok';
    TYJ.anunciar('Encontrada: ' + hit.p + '. Te faltan ' + (g.puestas.length - g.halladas) + '.');
    ui.hud.poner('halladas', g.halladas + ' / ' + g.puestas.length);
    pintar(); datos();
    if (g.halladas === g.puestas.length) ganar();
  }
  function pista() {
    if (g.fin) return;
    var falta = g.puestas.filter(function (p) { return !p.hallada; });
    if (!falta.length) return;
    arrancarReloj();
    var p = U.elegir(falta); g.pistas++; g.pista = p.r * g.n + p.c;
    ui.msg.textContent = 'La palabra ' + p.p + ' empieza en la casilla marcada (fila ' + (p.r + 1) + ', columna ' + (p.c + 1) + ').'; ui.msg.className = 'mensaje';
    pintar();
    clearTimeout(avisoPista); avisoPista = setTimeout(function () { g.pista = -1; if (!g.fin) pintar(); }, 3000);
  }
  function ganar() {
    g.fin = true; clearInterval(reloj);
    g.segundos = Math.floor((performance.now() - g.t0) / 1000);
    var puntos = Math.max(0, g.puestas.length * 100 + Math.max(0, g.cfg.objetivo - g.segundos) * 2 - g.pistas * 50);
    sesion.registrar(puntos, true);
    var nv = U.nivel(puntos, NIVELES_FINAL);
    TYJ.final(ui.final.appendChild(h('div')), { titulo: '¡Sopa completa!', puntos: puntos, unidad: 'puntos', nivel: nv,
      detalles: ['Tema: ' + g.tema.titulo, 'Tiempo: ' + U.tiempo(g.segundos), 'Pistas usadas: ' + g.pistas],
      compartir: 'Sopa de letras (' + g.cfg.nombre.toLowerCase() + ', ' + g.tema.titulo + '): ' + U.tiempo(g.segundos) + ', ' + puntos + ' puntos.', textoRepetir: 'Otra sopa', alRepetir: nueva });
    pintar();
  }

  /* ---- pantalla */
  function montar() {
    TYJ.vaciar(raiz);
    ui = { celdas: [] };
    ui.niveles = h('div', { class: 'fila', role: 'group', 'aria-label': 'Tamaño de la rejilla' });
    Object.keys(NIVELES).forEach(function (k) {
      ui.niveles.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(k === nivel), onclick: function () { nivel = k; nueva(); } }, NIVELES[k].nombre + ' (' + NIVELES[k].n + '×' + NIVELES[k].n + ')'));
    });
    ui.hud = TYJ.hud([['halladas', 'Encontradas', '0 / ' + g.puestas.length], ['tiempo', 'Tiempo', '0:00']]);
    ui.tema = h('p', { class: 'sl-tema' }, 'Tema: ', h('strong', {}, g.tema.titulo));
    ui.rejilla = h('div', { class: 'sl-rejilla', role: 'group', 'aria-label': 'Rejilla de letras, ' + g.n + ' filas por ' + g.n + ' columnas', style: '--n:' + g.n });
    for (var i = 0; i < g.cel.length; i++) (function (i) {
      var b = h('button', { class: 'sl-celda', type: 'button', 'data-i': String(i), tabindex: i === 0 ? '0' : '-1', onclick: function (ev) { if (ev.detail === 0 && !manejado) tocar(i); } }, g.cel[i]);
      ui.celdas.push(b); ui.rejilla.appendChild(b);
    })(i);
    ui.rejilla.addEventListener('pointerdown', function (ev) { var c = ev.target.closest && ev.target.closest('.sl-celda'); if (c) ini = +c.getAttribute('data-i'); });
    ui.rejilla.addEventListener('pointerup', function (ev) {
      if (ini == null) return;
      var a = ini; ini = null;
      var el = document.elementFromPoint(ev.clientX, ev.clientY), c = el && el.closest ? el.closest('.sl-celda') : null;
      manejado = true; setTimeout(function () { manejado = false; }, 80);
      if (!c) return;
      var b = +c.getAttribute('data-i');
      if (a === b) tocar(a); else { g.inicio = null; g.foco = b; comprobar(a, b); }
    });
    ui.rejilla.addEventListener('pointercancel', function () { ini = null; });
    ui.rejilla.addEventListener('keydown', function (ev) {
      var d = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[ev.key];
      if (!d || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      ev.preventDefault();
      var actual = ui.celdas.indexOf(ev.target); if (actual < 0) actual = g.foco;
      var r = U.limitar(Math.floor(actual / g.n) + d[0], 0, g.n - 1), c = U.limitar(actual % g.n + d[1], 0, g.n - 1), sig = r * g.n + c;
      g.foco = sig; ui.celdas.forEach(function (b, k) { b.tabIndex = k === sig ? 0 : -1; });
      ui.celdas[sig].focus();
    });
    ui.lista = h('ul', { class: 'sl-lista', 'aria-label': 'Palabras por encontrar' });
    g.puestas.forEach(function (p) { ui.lista.appendChild(h('li', { class: 'sl-palabra', 'data-palabra': p.p }, p.p)); });
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' }, 'Marca la primera y la última letra de cada palabra: arrastra, toca una y otra o usa Intro.');
    ui.final = h('div'); ui.est = h('div');
    [ui.niveles, ui.hud.nodo, ui.tema, ui.rejilla, ui.msg, ui.lista,
      h('div', { class: 'fila fila--centro' }, h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: pista }, 'Pista (−50 puntos)'), h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: nueva }, 'Nueva sopa')),
      ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
  }
  function pintar() {
    var marcadas = {};
    g.puestas.forEach(function (p) {
      if (!p.hallada) return;
      Array.from(p.p).forEach(function (_, i) { marcadas[(p.r + p.dr * i) * g.n + p.c + p.dc * i] = p.color; });
    });
    ui.celdas.forEach(function (b, i) {
      b.className = 'sl-celda' + (marcadas[i] ? ' sl-hallada' : '') + (g.inicio === i ? ' sl-inicio' : '') + (g.pista === i ? ' sl-pista' : '');
      b.style.background = marcadas[i] || '';
      b.setAttribute('aria-label', 'Fila ' + (Math.floor(i / g.n) + 1) + ', columna ' + (i % g.n + 1) + ': ' + g.cel[i] + (marcadas[i] ? ', parte de una palabra encontrada' : '') + (g.inicio === i ? ', marcada como inicio' : ''));
      b.setAttribute('aria-pressed', String(g.inicio === i));
    });
    ui.lista.querySelectorAll('.sl-palabra').forEach(function (li, i) {
      var p = g.puestas[i];
      li.className = 'sl-palabra' + (p.hallada ? ' sl-palabra--ok' : '');
      li.textContent = (p.hallada ? '✓ ' : '') + p.p;
      if (p.hallada) li.style.borderColor = p.color; else li.style.borderColor = '';
    });
  }
  function datos() {                                    // estado legible desde fuera (pruebas automáticas)
    ui.rejilla.setAttribute('data-solucion', g.puestas.map(function (p) { return p.p + ':' + p.r + ',' + p.c + ',' + p.dr + ',' + p.dc; }).join(';'));
    ui.rejilla.setAttribute('data-halladas', String(g.halladas));
  }

  function arrancar() {
    TYJ.datos('sopa-de-letras/temas.json').then(function (json) { temas = json.temas; nueva(); }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();
