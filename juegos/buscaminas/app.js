/* BUSCAMINAS: tres tamaños, primera casilla siempre segura, banderas (clic derecho, pulsación larga, tecla F o botón),
   doble acción sobre un número y teclado completo. La partida vive solo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('bm');
  if (!raiz) return;
  var NIVELES = {
    facil: { nombre: 'Fácil', f: 9, c: 9, minas: 10, base: 1500 },
    medio: { nombre: 'Medio', f: 12, c: 12, minas: 24, base: 3000 },
    dificil: { nombre: 'Difícil', f: 13, c: 13, minas: 36, base: 4500 }
  };
  var NS = 'http://www.w3.org/2000/svg';
  var sesion = TYJ.Sesion(null, { victorias: true, racha: true, etiquetaMejor: 'Mejor puntuación: ' });
  var dificultad = 'facil', g = null, ui = null, reloj = null, modoBandera = false, foco = 0;

  function icono(tipo) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 10 10'); s.setAttribute('class', 'bm-icono'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    function el(nombre, atr) { var e = document.createElementNS(NS, nombre); Object.keys(atr).forEach(function (k) { e.setAttribute(k, atr[k]); }); s.appendChild(e); }
    if (tipo === 'bandera') {
      el('rect', { x: '4.3', y: '1', width: '1.2', height: '7.6', fill: '#EAF2EE' });
      el('polygon', { points: '5.5,1 9.2,2.9 5.5,4.8', fill: '#FF5A7D' });
      el('rect', { x: '2.4', y: '8.2', width: '5.2', height: '1.2', fill: '#EAF2EE' });
    } else {
      el('path', { d: 'M5 0.6V9.4M0.6 5H9.4M1.9 1.9L8.1 8.1M8.1 1.9L1.9 8.1', stroke: '#14201C', 'stroke-width': '1', fill: 'none' });
      el('circle', { cx: '5', cy: '5', r: '2.9', fill: '#14201C' });
      el('circle', { cx: '4', cy: '4', r: '0.8', fill: '#EAF2EE' });
    }
    return s;
  }

  /* ---- lógica pura (sin DOM) */
  function vecinas(k) {
    var f = Math.floor(k / g.c), c = k % g.c, r = [];
    for (var df = -1; df <= 1; df++) for (var dc = -1; dc <= 1; dc++) {
      if (!df && !dc) continue;
      var nf = f + df, nc = c + dc;
      if (nf >= 0 && nf < g.f && nc >= 0 && nc < g.c) r.push(nf * g.c + nc);
    }
    return r;
  }
  function colocarMinas(primera) {
    var prohibidas = [primera].concat(vecinas(primera)), libres = [], k;
    for (k = 0; k < g.f * g.c; k++) if (prohibidas.indexOf(k) < 0) libres.push(k);
    if (libres.length < g.minas) { libres = []; for (k = 0; k < g.f * g.c; k++) if (k !== primera) libres.push(k); }
    g.mina = g.estado.map(function () { return false; });
    U.muestra(libres, g.minas).forEach(function (m) { g.mina[m] = true; });
    g.num = g.mina.map(function (_, i) { return vecinas(i).filter(function (v) { return g.mina[v]; }).length; });
    g.puestas = true;
  }
  function descubrir(inicio) {                         // devuelve true si pisa una mina
    var pila = [inicio];
    while (pila.length) {
      var k = pila.pop();
      if (g.estado[k] !== 0) continue;
      g.estado[k] = 1;
      if (g.mina[k]) { g.explota = k; return true; }
      g.descubiertas++;
      if (g.num[k] === 0) vecinas(k).forEach(function (v) { if (g.estado[v] === 0) pila.push(v); });
    }
    return false;
  }

  /* ---- partida */
  function nueva() {
    clearInterval(reloj);
    var n = NIVELES[dificultad], total = n.f * n.c;
    g = { f: n.f, c: n.c, minas: n.minas, estado: new Array(total).fill(0), mina: null, num: null, puestas: false, fin: false, ganada: false,
      descubiertas: 0, banderas: 0, t0: 0, segundos: 0, explota: -1 };
    foco = Math.floor(n.f / 2) * n.c + Math.floor(n.c / 2);
    montar();
    TYJ.anunciar('Nuevo campo de ' + n.f + ' por ' + n.c + ' con ' + n.minas + ' minas.');
  }

  function montar() {
    TYJ.vaciar(raiz);
    ui = { celdas: [] };
    ui.niveles = h('div', { class: 'fila', role: 'group', 'aria-label': 'Dificultad' });
    Object.keys(NIVELES).forEach(function (k) {
      ui.niveles.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(k === dificultad),
        onclick: function () { dificultad = k; nueva(); } }, NIVELES[k].nombre));
    });
    ui.hud = TYJ.hud([['minas', 'Minas sin marcar', g.minas], ['tiempo', 'Tiempo', '0:00']]);
    ui.tablero = h('div', { class: 'bm-tablero', role: 'group', style: '--c:' + g.c, 'aria-label': 'Campo de minas de ' + g.f + ' por ' + g.c + '. Flechas para moverte, Intro para descubrir y F para poner una bandera.' });
    for (var k = 0; k < g.f * g.c; k++) (function (k) {
      var b = h('button', { class: 'bm-celda', type: 'button', tabindex: '-1' });
      b.addEventListener('click', function () { if (b._largo) { b._largo = false; return; } accion(k); });
      b.addEventListener('contextmenu', function (ev) { ev.preventDefault(); bandera(k); });
      b.addEventListener('pointerdown', function (ev) {
        if (ev.pointerType === 'mouse') return;
        clearTimeout(b._t); b._largo = false;
        b._t = setTimeout(function () { b._largo = true; bandera(k); }, 450);
      });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (e) { b.addEventListener(e, function () { clearTimeout(b._t); }); });
      b.addEventListener('focus', function () { foco = k; });
      ui.celdas.push(b); ui.tablero.appendChild(b);
    })(k);
    ui.tablero.addEventListener('keydown', teclas);
    ui.modo = h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(modoBandera),
      onclick: function () { modoBandera = !modoBandera; ui.modo.setAttribute('aria-pressed', String(modoBandera)); } }, 'Modo bandera');
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    ui.final = h('div'); ui.est = h('div');
    [ui.niveles, ui.hud.nodo, ui.tablero, ui.msg,
      h('div', { class: 'fila fila--centro' }, ui.modo, h('button', { class: 'boton-retro boton-retro--chico', type: 'button', onclick: nueva }, 'Nueva partida')),
      ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
    for (var i = 0; i < ui.celdas.length; i++) pintarCelda(i);
  }

  function pintarCelda(k) {
    var b = ui.celdas[k], e = g.estado[k], clases = ['bm-celda'], etiqueta = 'Fila ' + (Math.floor(k / g.c) + 1) + ', columna ' + (k % g.c + 1) + ', ';
    TYJ.vaciar(b);
    if (e === 1) {
      clases.push('bm-abierta');
      if (g.mina && g.mina[k]) { clases.push('bm-mina'); if (k === g.explota) clases.push('bm-explota'); b.appendChild(icono('mina')); etiqueta += 'mina'; }
      else if (g.num[k]) { clases.push('bm-n' + g.num[k]); b.appendChild(document.createTextNode(String(g.num[k]))); etiqueta += g.num[k] + (g.num[k] === 1 ? ' mina alrededor' : ' minas alrededor'); }
      else etiqueta += 'vacía';
    } else if (e === 2) {
      b.appendChild(icono('bandera')); etiqueta += 'con bandera';
      if (g.fin && !g.ganada && g.mina && !g.mina[k]) { clases.push('bm-falsa'); etiqueta += ', sin mina'; }
    } else {
      etiqueta += 'sin descubrir';
      if (g.fin && !g.ganada && g.mina && g.mina[k]) { clases.push('bm-abierta', 'bm-mina'); b.appendChild(icono('mina')); etiqueta = etiqueta.replace('sin descubrir', 'mina'); }
    }
    b.className = clases.join(' ');
    b.setAttribute('aria-label', etiqueta);
    b.setAttribute('tabindex', k === foco ? '0' : '-1');
  }
  function pintarTodo() { for (var i = 0; i < ui.celdas.length; i++) pintarCelda(i); }

  function arrancarReloj() {
    g.t0 = performance.now();
    reloj = setInterval(function () {
      if (g.fin) return;
      g.segundos = Math.floor((performance.now() - g.t0) / 1000);
      ui.hud.poner('tiempo', Math.floor(g.segundos / 60) + ':' + ('0' + (g.segundos % 60)).slice(-2));
    }, 500);
  }

  function accion(k) {
    if (g.fin) return;
    foco = k;
    if (modoBandera) return bandera(k);
    if (g.estado[k] === 2) return;
    if (g.estado[k] === 1) return acorde(k);
    if (!g.puestas) { colocarMinas(k); arrancarReloj(); }
    var pisa = descubrir(k);
    if (pisa) return perder();
    pintarTodo();
    if (g.descubiertas === g.f * g.c - g.minas) ganar();
  }
  function acorde(k) {                                   // sobre un número con tantas banderas como minas, descubre el resto de vecinas
    if (!g.num[k]) return;
    var v = vecinas(k), marcadas = v.filter(function (x) { return g.estado[x] === 2; }).length;
    if (marcadas !== g.num[k]) return;
    var pisa = false;
    v.forEach(function (x) { if (g.estado[x] === 0 && descubrir(x)) pisa = true; });
    if (pisa) return perder();
    pintarTodo();
    if (g.descubiertas === g.f * g.c - g.minas) ganar();
  }
  function bandera(k) {
    if (g.fin || g.estado[k] === 1) return;
    foco = k;
    if (g.estado[k] === 2) { g.estado[k] = 0; g.banderas--; }
    else { g.estado[k] = 2; g.banderas++; }
    ui.hud.poner('minas', g.minas - g.banderas, g.minas - g.banderas < 0);
    pintarCelda(k);
  }

  function teclas(ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var actual = ui.celdas.indexOf(ev.target);
    if (actual < 0) actual = foco;
    var f = Math.floor(actual / g.c), c = actual % g.c, d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[ev.key];
    if (d) {
      ev.preventDefault();
      var nuevo = U.limitar(f + d[0], 0, g.f - 1) * g.c + U.limitar(c + d[1], 0, g.c - 1);
      ui.celdas[actual].setAttribute('tabindex', '-1'); foco = nuevo;
      ui.celdas[nuevo].setAttribute('tabindex', '0'); ui.celdas[nuevo].focus();
    } else if (ev.key === 'f' || ev.key === 'F') { ev.preventDefault(); bandera(actual); }
  }

  function cerrar() { g.fin = true; clearInterval(reloj); if (g.puestas) g.segundos = Math.floor((performance.now() - g.t0) / 1000); }

  function ganar() {
    cerrar(); g.ganada = true;
    g.mina.forEach(function (m, k) { if (m && g.estado[k] !== 2) { g.estado[k] = 2; g.banderas++; } });
    ui.hud.poner('minas', 0); pintarTodo();
    var n = NIVELES[dificultad], puntos = Math.max(100, n.base - g.segundos * 5);
    sesion.registrar(puntos, true);
    TYJ.final(ui.final.appendChild(h('div')), { titulo: '¡Campo despejado!', puntos: puntos, unidad: 'puntos', nivel: 'Nivel ' + n.nombre,
      detalles: ['Tiempo: ' + g.segundos + ' segundos', 'Minas: ' + g.minas],
      compartir: 'Buscaminas (' + n.nombre + ') despejado en ' + g.segundos + ' segundos.', textoRepetir: 'Otro campo', alRepetir: nueva });
  }
  function perder() {
    cerrar(); pintarTodo();
    var n = NIVELES[dificultad], puntos = g.descubiertas * 5;
    sesion.registrar(puntos, false);
    TYJ.final(ui.final.appendChild(h('div')), { titulo: '¡Has pisado una mina!', puntos: puntos, unidad: 'puntos', nivel: 'Nivel ' + n.nombre,
      detalles: ['Casillas seguras descubiertas: ' + g.descubiertas + ' de ' + (g.f * g.c - g.minas)],
      compartir: 'Buscaminas (' + n.nombre + '): he descubierto ' + g.descubiertas + ' de ' + (g.f * g.c - g.minas) + ' casillas seguras.', textoRepetir: 'Otro campo', alRepetir: nueva });
  }

  nueva();
})();
