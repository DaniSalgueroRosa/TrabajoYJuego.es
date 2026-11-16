/* SUDOKU: cuadrícula de 9×9 con tres dificultades. Se genera una solución completa al azar y se van quitando números
   mientras la solución siga siendo única. Teclado, ratón y pantalla táctil. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('sdk');
  if (!raiz) return;
  var NIVELES = { facil: { nombre: 'Fácil', pistas: 40, base: 2000 }, medio: { nombre: 'Medio', pistas: 34, base: 3000 }, dificil: { nombre: 'Difícil', pistas: 28, base: 4000 } };
  var sesion = TYJ.Sesion(null, { victorias: true, racha: true, etiquetaMejor: 'Mejor puntuación: ' });
  var dificultad = 'facil', p = null, ui = null, reloj = null;

  /* ---- lógica pura (sin DOM) */
  var FILA = [], COL = [], CAJA = [], i0;
  for (i0 = 0; i0 < 81; i0++) { FILA[i0] = Math.floor(i0 / 9); COL[i0] = i0 % 9; CAJA[i0] = Math.floor(FILA[i0] / 3) * 3 + Math.floor(COL[i0] / 3); }
  function bits(x) { var n = 0; while (x) { x &= x - 1; n++; } return n; }
  function mascaras(g) {
    var f = [], c = [], b = [], k;
    for (k = 0; k < 9; k++) { f[k] = 0; c[k] = 0; b[k] = 0; }
    for (k = 0; k < 81; k++) if (g[k]) { var bit = 1 << g[k]; f[FILA[k]] |= bit; c[COL[k]] |= bit; b[CAJA[k]] |= bit; }
    return { f: f, c: c, b: b };
  }
  /* Cuenta las soluciones de una cuadrícula (se detiene en «limite»). Elige siempre la casilla con menos candidatos. */
  function contar(cel, limite) {
    var g = cel.slice(), m = mascaras(g), n = 0;
    function buscar() {
      if (n >= limite) return;
      var mejor = -1, libres = 0, mn = 10, k;
      for (k = 0; k < 81; k++) if (!g[k]) {
        var l = ~(m.f[FILA[k]] | m.c[COL[k]] | m.b[CAJA[k]]) & 0x3FE, q = bits(l);
        if (q < mn) { mn = q; mejor = k; libres = l; if (q <= 1) break; }
      }
      if (mejor < 0) { n++; return; }
      for (var v = 1; v <= 9 && n < limite; v++) {
        var bit = 1 << v;
        if (!(libres & bit)) continue;
        g[mejor] = v; m.f[FILA[mejor]] |= bit; m.c[COL[mejor]] |= bit; m.b[CAJA[mejor]] |= bit;
        buscar();
        g[mejor] = 0; m.f[FILA[mejor]] &= ~bit; m.c[COL[mejor]] &= ~bit; m.b[CAJA[mejor]] &= ~bit;
      }
    }
    buscar();
    return n;
  }
  function solucionAlAzar() {
    var g = [], k;
    for (k = 0; k < 81; k++) g[k] = 0;
    var m = mascaras(g);
    function rec() {
      var mejor = -1, libres = 0, mn = 10, k2;
      for (k2 = 0; k2 < 81; k2++) if (!g[k2]) {
        var l = ~(m.f[FILA[k2]] | m.c[COL[k2]] | m.b[CAJA[k2]]) & 0x3FE, q = bits(l);
        if (q < mn) { mn = q; mejor = k2; libres = l; if (q <= 1) break; }
      }
      if (mejor < 0) return true;
      var valores = U.barajar([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (var i = 0; i < 9; i++) {
        var v = valores[i], bit = 1 << v;
        if (!(libres & bit)) continue;
        g[mejor] = v; m.f[FILA[mejor]] |= bit; m.c[COL[mejor]] |= bit; m.b[CAJA[mejor]] |= bit;
        if (rec()) return true;
        g[mejor] = 0; m.f[FILA[mejor]] &= ~bit; m.c[COL[mejor]] &= ~bit; m.b[CAJA[mejor]] &= ~bit;
      }
      return false;
    }
    rec();
    return g;
  }
  function crearPuzzle(pistas) {
    var sol = solucionAlAzar(), ini = sol.slice(), orden = U.barajar(sol.map(function (_, k) { return k; })), quitadas = 0;
    var limite = performance.now() + 500;                       // si tarda demasiado se queda con alguna pista más: la solución sigue siendo única
    for (var i = 0; i < 81 && 81 - quitadas > pistas && performance.now() < limite; i++) {
      var k = orden[i], v = ini[k];
      ini[k] = 0;
      if (contar(ini, 2) === 1) quitadas++; else ini[k] = v;
    }
    return { sol: sol, ini: ini };
  }
  function repetida(cel, k) {                                   // ¿hay otro igual en su fila, columna o caja?
    var v = cel[k];
    if (!v) return false;
    for (var j = 0; j < 81; j++) if (j !== k && cel[j] === v && (FILA[j] === FILA[k] || COL[j] === COL[k] || CAJA[j] === CAJA[k])) return true;
    return false;
  }

  /* ---- partida */
  function formato(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  function nueva() {
    clearInterval(reloj);
    var pz = crearPuzzle(NIVELES[dificultad].pistas);
    p = { sol: pz.sol, ini: pz.ini, cel: pz.ini.slice(), notas: pz.ini.map(function () { return 0; }), fija: pz.ini.map(function (v) { return v > 0; }),
      sel: pz.ini.indexOf(0), lapiz: false, t0: performance.now(), segundos: 0, pistas: 0, fin: false, malas: [] };
    montar();
    pintar();
    reloj = setInterval(function () {
      if (p.fin) return;
      p.segundos = Math.floor((performance.now() - p.t0) / 1000);
      ui.hud.poner('tiempo', formato(p.segundos));
    }, 500);
    TYJ.anunciar('Nuevo sudoku, nivel ' + NIVELES[dificultad].nombre + '. Tiene ' + p.ini.filter(function (v) { return v; }).length + ' números dados.');
  }

  function montar() {
    TYJ.vaciar(raiz);
    ui = { celdas: [] };
    ui.niveles = h('div', { class: 'fila', role: 'group', 'aria-label': 'Dificultad' });
    Object.keys(NIVELES).forEach(function (k) {
      ui.niveles.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(k === dificultad),
        onclick: function () { dificultad = k; nueva(); } }, NIVELES[k].nombre));
    });
    ui.hud = TYJ.hud([['tiempo', 'Tiempo', '0:00'], ['pistas', 'Pistas usadas', 0]]);
    ui.tablero = h('div', { class: 'sdk-tablero', role: 'group', 'aria-label': 'Tablero de sudoku de 9 por 9. Muévete con las flechas y escribe un número del 1 al 9.' });
    for (var k = 0; k < 81; k++) {
      (function (k) {
        var b = h('button', { class: 'sdk-celda' + (COL[k] % 3 === 2 && COL[k] < 8 ? ' sdk-c3' : '') + (FILA[k] % 3 === 2 && FILA[k] < 8 ? ' sdk-f3' : ''), type: 'button', tabindex: '-1', onclick: function () { elegir(k); } });
        ui.celdas.push(b); ui.tablero.appendChild(b);
      })(k);
    }
    ui.tablero.addEventListener('keydown', teclas);
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    ui.pad = h('div', { class: 'sdk-pad', role: 'group', 'aria-label': 'Números' });
    for (var n = 1; n <= 9; n++) (function (n) {
      ui.pad.appendChild(h('button', { class: 'boton-retro boton-retro--sec sdk-num', type: 'button', 'aria-label': 'Poner el ' + n, onclick: function () { poner(n); } }, String(n)));
    })(n);
    ui.pad.appendChild(h('button', { class: 'boton-retro boton-retro--sec sdk-num', type: 'button', 'aria-label': 'Borrar la casilla', onclick: function () { poner(0); } }, '⌫'));
    ui.lapiz = h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': 'false', onclick: function () { p.lapiz = !p.lapiz; ui.lapiz.setAttribute('aria-pressed', String(p.lapiz)); } }, 'Lápiz (notas)');
    ui.herramientas = h('div', { class: 'fila fila--centro' }, ui.lapiz,
      h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', onclick: pista }, 'Pista'),
      h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', onclick: comprobar }, 'Comprobar'),
      h('button', { class: 'boton-retro boton-retro--chico', type: 'button', onclick: nueva }, 'Nueva partida'));
    ui.final = h('div'); ui.est = h('div');
    [ui.niveles, ui.hud.nodo, ui.tablero, ui.msg, ui.pad, ui.herramientas, ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
  }

  function pintar() {
    var sel = p.sel, vsel = sel >= 0 ? p.cel[sel] : 0;
    ui.celdas.forEach(function (b, k) {
      var v = p.cel[k], clases = ['sdk-celda'];
      if (COL[k] % 3 === 2 && COL[k] < 8) clases.push('sdk-c3');
      if (FILA[k] % 3 === 2 && FILA[k] < 8) clases.push('sdk-f3');
      if (p.fija[k]) clases.push('sdk-fija');
      if (sel >= 0 && (FILA[k] === FILA[sel] || COL[k] === COL[sel] || CAJA[k] === CAJA[sel])) clases.push('sdk-rel');
      if (k === sel) clases.push('sdk-sel');
      else if (vsel && v === vsel) clases.push('sdk-igual');
      var mala = !p.fija[k] && v && (repetida(p.cel, k) || p.malas.indexOf(k) >= 0);
      if (mala) clases.push('sdk-conf');
      b.className = clases.join(' ');
      TYJ.vaciar(b);
      var etiqueta = 'Fila ' + (FILA[k] + 1) + ', columna ' + (COL[k] + 1) + ', ';
      if (v) { b.appendChild(document.createTextNode(String(v))); etiqueta += 'número ' + v + (p.fija[k] ? ', fijo' : '') + (mala ? ', incorrecto' : ''); }
      else if (p.notas[k]) {
        var lista = [];
        var rejilla = h('span', { class: 'sdk-notas', 'aria-hidden': 'true' });
        for (var n = 1; n <= 9; n++) { var on = (p.notas[k] >> n) & 1; if (on) lista.push(n); rejilla.appendChild(h('span', { texto: on ? String(n) : '' })); }
        b.appendChild(rejilla); etiqueta += 'notas ' + lista.join(', ');
      } else etiqueta += 'vacía';
      b.setAttribute('aria-label', etiqueta);
      b.setAttribute('tabindex', k === (sel >= 0 ? sel : 0) ? '0' : '-1');
    });
    ui.hud.poner('pistas', p.pistas);
  }

  function elegir(k) { p.sel = k; pintar(); ui.celdas[k].focus({ preventScroll: true }); }

  function teclas(ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey || p.fin) return;
    var k = p.sel < 0 ? 0 : p.sel, f = FILA[k], c = COL[k];
    var movs = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (movs[ev.key]) {
      ev.preventDefault();
      f = U.limitar(f + movs[ev.key][0], 0, 8); c = U.limitar(c + movs[ev.key][1], 0, 8);
      return elegir(f * 9 + c);
    }
    if (/^[1-9]$/.test(ev.key)) { ev.preventDefault(); return poner(parseInt(ev.key, 10)); }
    if (ev.key === '0' || ev.key === 'Backspace' || ev.key === 'Delete') { ev.preventDefault(); return poner(0); }
    if (ev.key === 'n' || ev.key === 'N') { ev.preventDefault(); ui.lapiz.click(); }
  }

  function poner(v) {
    if (p.fin || p.sel < 0) return;
    var k = p.sel;
    if (p.fija[k]) { ui.msg.textContent = 'Esa casilla es una de las del enunciado y no se puede cambiar.'; ui.msg.className = 'mensaje'; return; }
    ui.msg.textContent = ''; p.malas = [];
    if (p.lapiz && v) {
      if (p.cel[k]) return;
      p.notas[k] ^= (1 << v);
    } else if (v === 0 || p.cel[k] === v) { p.cel[k] = 0; }
    else {
      p.cel[k] = v; p.notas[k] = 0;
      for (var j = 0; j < 81; j++) if (j !== k && (FILA[j] === FILA[k] || COL[j] === COL[k] || CAJA[j] === CAJA[k])) p.notas[j] &= ~(1 << v);
    }
    pintar();
    if (p.cel.every(function (x, j) { return x && !repetida(p.cel, j); })) ganar();
  }

  function pista() {
    if (p.fin) return;
    var k = p.sel;
    if (k < 0 || p.fija[k]) {
      var candidatas = [];
      p.cel.forEach(function (v, j) { if (!p.fija[j] && v !== p.sol[j]) candidatas.push(j); });
      if (!candidatas.length) return;
      k = U.elegir(candidatas);
    }
    if (p.cel[k] === p.sol[k]) return;
    p.cel[k] = p.sol[k]; p.notas[k] = 0; p.fija[k] = true; p.pistas++; p.sel = k; p.malas = [];
    ui.msg.textContent = 'Pista: la fila ' + (FILA[k] + 1) + ', columna ' + (COL[k] + 1) + ' es un ' + p.sol[k] + '.'; ui.msg.className = 'mensaje';
    pintar();
    if (p.cel.every(function (x, j) { return x && !repetida(p.cel, j); })) ganar();
  }

  function comprobar() {
    if (p.fin) return;
    p.malas = [];
    p.cel.forEach(function (v, k) { if (v && v !== p.sol[k]) p.malas.push(k); });
    var vacias = p.cel.filter(function (v) { return !v; }).length;
    if (p.malas.length) { ui.msg.textContent = 'Hay ' + p.malas.length + (p.malas.length === 1 ? ' casilla incorrecta, marcada' : ' casillas incorrectas, marcadas') + ' en rojo.'; ui.msg.className = 'mensaje mensaje--mal'; }
    else { ui.msg.textContent = vacias ? 'Todo lo que has escrito es correcto. Quedan ' + vacias + ' casillas.' : ''; ui.msg.className = 'mensaje mensaje--ok'; }
    pintar();
  }

  function ganar() {
    p.fin = true; clearInterval(reloj);
    p.segundos = Math.floor((performance.now() - p.t0) / 1000);
    ui.hud.poner('tiempo', formato(p.segundos));
    var n = NIVELES[dificultad], puntos = Math.max(100, n.base - p.segundos * 3 - p.pistas * 150);
    sesion.registrar(puntos, true);
    var cont = h('div'); ui.final.appendChild(cont);
    TYJ.final(cont, { titulo: '¡Sudoku resuelto!', puntos: puntos, unidad: 'puntos', nivel: 'Nivel ' + n.nombre,
      detalles: ['Tiempo: ' + formato(p.segundos), 'Pistas usadas: ' + p.pistas],
      compartir: 'Sudoku (' + n.nombre + ') resuelto en ' + formato(p.segundos) + (p.pistas ? ' con ' + p.pistas + (p.pistas === 1 ? ' pista' : ' pistas') : ' sin pistas') + '.',
      textoRepetir: 'Otro sudoku', alRepetir: nueva });
  }

  nueva();
})();
