/* TORRE DE HANOI: tres torres y de 3 a 7 discos. Hay que llevar toda la pila de la torre 1 a la torre 3 moviendo un disco cada vez y sin poner nunca un disco grande
   sobre uno pequeño. Se juega tocando la torre de origen y la de destino, o con las teclas 1, 2 y 3. Incluye pista (siguiente mejor movimiento) y deshacer. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('hn');
  if (!raiz) return;
  var COLORES = ['#FF5A7D', '#FFB86B', '#E6F14A', '#8FD694', '#6EC1FF', '#B9A0F5', '#F28CC0'];
  var NIVELES_FINAL = [[0, 'Aprendiz'], [400, 'Estratega'], [800, 'Monje'], [1200, 'Maestro de Hanói'], [1600, 'Gran maestro']];
  var sesion = TYJ.Sesion(null, { etiquetaMejor: 'Mejor puntuación: ' });
  var n = 4, g = null, ui = null, reloj = null, avisoPista = null, alTecla = null;

  /* ---- lógica */
  function siguienteMovimiento(torres, nd) {              // mejor movimiento para llevar todo a la torre 3 desde cualquier posición legal
    var pos = {};
    torres.forEach(function (t, i) { t.forEach(function (d) { pos[d] = i; }); });
    function resolver(k, destino) {                        // el disco k (y los menores) deben acabar en «destino»
      if (k === 0) return null;
      if (pos[k] === destino) return resolver(k - 1, destino);
      var origen = pos[k], aux = 3 - origen - destino, menoresEnAux = true;
      for (var d = 1; d < k; d++) if (pos[d] !== aux) { menoresEnAux = false; break; }
      if (menoresEnAux) return { disco: k, de: origen, a: destino };
      return resolver(k - 1, aux);
    }
    return resolver(nd, 2);
  }

  /* ---- partida */
  function nueva() {
    clearInterval(reloj); clearTimeout(avisoPista);
    var pila = []; for (var d = n; d >= 1; d--) pila.push(d);
    g = { n: n, torres: [pila, [], []], sel: -1, movs: 0, min: Math.pow(2, n) - 1, hist: [], t0: 0, segundos: 0, fin: false, pistas: 0, pista: null };
    montar(); pintar();
    TYJ.anunciar('Nueva partida con ' + n + ' discos. Lleva todos los discos a la torre 3.');
  }
  function arrancarReloj() {
    if (g.t0) return;
    g.t0 = performance.now();
    reloj = setInterval(function () { g.segundos = Math.floor((performance.now() - g.t0) / 1000); ui.hud.poner('tiempo', U.tiempo(g.segundos)); }, 500);
  }
  function elegir(i) {
    if (g.fin) return;
    arrancarReloj(); g.pista = null;
    var t = g.torres;
    if (g.sel < 0) {
      if (!t[i].length) return aviso('La torre ' + (i + 1) + ' está vacía: elige una torre que tenga discos.', true);
      g.sel = i; aviso('Disco ' + t[i][t[i].length - 1] + ' de la torre ' + (i + 1) + ' elegido. Elige la torre de destino.');
    } else if (g.sel === i) { g.sel = -1; aviso('Selección cancelada.'); }
    else mover(g.sel, i);
    pintar();
  }
  function mover(a, b) {
    var t = g.torres, d = t[a][t[a].length - 1], encima = t[b][t[b].length - 1];
    g.sel = -1;
    if (encima && encima < d) return aviso('No se puede poner el disco ' + d + ' sobre el disco ' + encima + ', que es más pequeño.', true);
    t[a].pop(); t[b].push(d); g.movs++; g.hist.push([a, b]);
    aviso('Disco ' + d + ' a la torre ' + (b + 1) + '.');
    TYJ.anunciar('Disco ' + d + ' a la torre ' + (b + 1) + '. Llevas ' + g.movs + ' movimientos.');
    if (t[2].length === g.n) ganar();
  }
  function deshacer() {
    if (g.fin || !g.hist.length) return;
    var m = g.hist.pop(), t = g.torres;
    t[m[0]].push(t[m[1]].pop()); g.movs--; g.sel = -1; g.pista = null;
    aviso('Movimiento deshecho.'); pintar();
  }
  function pista() {
    if (g.fin) return;
    arrancarReloj();
    var m = siguienteMovimiento(g.torres, g.n);
    if (!m) return;
    g.pistas++; g.sel = -1; g.pista = m;
    aviso('Pista: mueve el disco ' + m.disco + ' de la torre ' + (m.de + 1) + ' a la torre ' + (m.a + 1) + '.');
    pintar();
    clearTimeout(avisoPista); avisoPista = setTimeout(function () { g.pista = null; if (!g.fin) pintar(); }, 4000);
  }
  function ganar() {
    g.fin = true; clearInterval(reloj);
    g.segundos = Math.floor((performance.now() - g.t0) / 1000);
    var puntos = Math.max(100, g.n * 250 - (g.movs - g.min) * 15 - Math.floor(g.segundos / 2) - g.pistas * 30);
    sesion.registrar(puntos, true);
    var nivel = U.nivel(puntos, NIVELES_FINAL), perfecto = g.movs === g.min;
    TYJ.final(ui.final.appendChild(h('div')), { titulo: perfecto ? '¡Torre perfecta!' : '¡Torre completada!', puntos: puntos, unidad: 'puntos', nivel: nivel,
      detalles: ['Discos: ' + g.n, 'Movimientos: ' + g.movs + ' (el mínimo posible es ' + g.min + ')', 'Tiempo: ' + U.tiempo(g.segundos), 'Pistas usadas: ' + g.pistas],
      compartir: 'Torre de Hanói (' + g.n + ' discos): ' + g.movs + ' movimientos de ' + g.min + ' posibles en ' + U.tiempo(g.segundos) + '.', textoRepetir: 'Otra partida', alRepetir: nueva });
    aviso(perfecto ? 'Has resuelto la torre con el mínimo de movimientos.' : 'Has resuelto la torre.');
    pintar();
  }
  function aviso(txt, mal) { ui.msg.textContent = txt; ui.msg.className = 'mensaje' + (mal ? ' mensaje--mal' : ''); }

  /* ---- pantalla */
  function montar() {
    TYJ.vaciar(raiz);
    ui = { torres: [] };
    ui.niveles = h('div', { class: 'fila', role: 'group', 'aria-label': 'Número de discos' });
    [3, 4, 5, 6, 7].forEach(function (k) {
      ui.niveles.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(k === n), onclick: function () { n = k; nueva(); } }, k + ' discos'));
    });
    ui.hud = TYJ.hud([['movs', 'Movimientos', 0], ['min', 'Mínimo', g.min], ['tiempo', 'Tiempo', '0:00']]);
    ui.tablero = h('div', { class: 'hn-tablero', role: 'group', 'aria-label': 'Tres torres', style: '--discos:' + g.n });
    for (var i = 0; i < 3; i++) (function (i) {
      var b = h('button', { class: 'hn-torre', type: 'button', 'aria-keyshortcuts': String(i + 1), onclick: function () { elegir(i); } });
      ui.torres.push(b); ui.tablero.appendChild(b);
    })(i);
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' }, 'Toca una torre para coger su disco de arriba y otra para dejarlo. También puedes usar las teclas 1, 2 y 3.');
    ui.final = h('div'); ui.est = h('div');
    ui.deshacer = h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: deshacer }, 'Deshacer');
    [ui.niveles, ui.hud.nodo, ui.tablero, ui.msg,
      h('div', { class: 'fila fila--centro' }, ui.deshacer, h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: pista }, 'Pista (−30 puntos)'), h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: nueva }, 'Reiniciar')),
      ui.final, ui.est].forEach(function (x) { raiz.appendChild(x); });
    sesion.montar(ui.est);
    if (alTecla) document.removeEventListener('keydown', alTecla);
    alTecla = function (ev) {
      if (ev.ctrlKey || ev.metaKey || ev.altKey || !g) return;
      if (ev.key === '1' || ev.key === '2' || ev.key === '3') { ev.preventDefault(); elegir(+ev.key - 1); }
      else if (ev.key === 'Escape' && g.sel >= 0) { g.sel = -1; aviso('Selección cancelada.'); pintar(); }
    };
    document.addEventListener('keydown', alTecla);
  }
  function pintar() {
    g.torres.forEach(function (t, i) {
      var b = ui.torres[i];
      TYJ.vaciar(b);
      b.className = 'hn-torre' + (g.sel === i ? ' hn-sel' : '') + (g.pista && (g.pista.de === i || g.pista.a === i) ? (g.pista.de === i ? ' hn-pista-de' : ' hn-pista-a') : '') + (g.fin && i === 2 ? ' hn-meta' : '');
      b.setAttribute('aria-pressed', String(g.sel === i));
      b.setAttribute('aria-label', 'Torre ' + (i + 1) + (t.length ? ': discos ' + t.slice().reverse().join(', ') + ' de arriba abajo' : ': vacía') + (g.sel === i ? ', seleccionada' : ''));
      var pila = h('span', { class: 'hn-pila', 'aria-hidden': 'true' });
      t.forEach(function (d, k) {
        var tope = k === t.length - 1;
        pila.appendChild(h('span', { class: 'hn-disco' + (tope && g.sel === i ? ' hn-alto' : ''), style: 'width:' + (24 + (d - 1) * (70 / Math.max(1, g.n - 1))) + '%;background:' + COLORES[(d - 1) % COLORES.length] }, String(d)));
      });
      b.appendChild(pila); b.appendChild(h('span', { class: 'hn-nombre', 'aria-hidden': 'true' }, 'Torre ' + (i + 1)));
    });
    ui.hud.poner('movs', g.movs);
    ui.deshacer.disabled = g.fin || !g.hist.length;
    ui.tablero.setAttribute('data-torres', g.torres.map(function (t) { return t.join(''); }).join('|'));
    ui.tablero.setAttribute('data-movs', String(g.movs));
  }

  nueva();
})();
