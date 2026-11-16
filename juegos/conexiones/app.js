/* CONEXIONES: 16 palabras, 4 grupos de 4, 4 errores permitidos. Explicación de cada grupo al final. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('cx');
  if (!raiz) return;
  var VIDAS = 4, COLORES = ['amarillo', 'verde', 'azul', 'rojo'], CUADROS = ['🟨', '🟩', '🟦', '🟥'];
  var puzzles = [], mazo = [], sesion = TYJ.Sesion(null, { victorias: true, racha: true, mejor: false });
  var p, g, ui;

  function robar() { if (!mazo.length) mazo = U.barajar(puzzles); return mazo.pop(); }

  function nueva() {
    p = robar();
    var palabras = [];
    p.grupos.forEach(function (gr, i) { gr.p.forEach(function (w) { palabras.push({ w: w, grupo: i }); }); });
    g = { fichas: U.barajar(palabras), sel: [], vidas: VIDAS, hallados: [], intentos: [], probadas: {}, terminada: false };
    dibujar();
  }

  function dibujar() {
    TYJ.vaciar(raiz);
    ui = {};
    ui.vidas = TYJ.hud([['vidas', 'Errores que te quedan', g.vidas]]);
    ui.encontrados = h('div', { class: 'cx-encontrados', role: 'list', 'aria-label': 'Grupos descubiertos' });
    ui.tablero = h('div', { class: 'cx-tablero', role: 'group', 'aria-label': 'Palabras' });
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    ui.comprobar = h('button', { class: 'boton-retro', type: 'button', onclick: comprobar, disabled: true }, 'Comprobar');
    ui.mezclar = h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: function () { g.fichas = U.barajar(g.fichas); pintarTablero(); } }, 'Mezclar');
    ui.limpiar = h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: function () { g.sel = []; pintarTablero(); }, disabled: true }, 'Deseleccionar');
    ui.final = h('div');
    ui.estado = h('div');
    raiz.appendChild(ui.vidas.nodo);
    raiz.appendChild(ui.encontrados);
    raiz.appendChild(ui.tablero);
    raiz.appendChild(ui.msg);
    ui.acciones = h('div', { class: 'fila fila--centro' }, ui.comprobar, ui.mezclar, ui.limpiar);
    raiz.appendChild(ui.acciones);
    raiz.appendChild(ui.final);
    raiz.appendChild(ui.estado);
    sesion.montar(ui.estado);
    g.hallados.forEach(pintarGrupo);
    pintarTablero();
  }

  function pintarGrupo(i) {
    var gr = p.grupos[i];
    ui.encontrados.appendChild(h('div', { class: 'cx-grupo cx-grupo--' + COLORES[i], role: 'listitem' },
      h('strong', { texto: gr.n }), h('span', { texto: gr.p.join(', ') })));
  }

  function pintarTablero() {
    TYJ.vaciar(ui.tablero);
    var restantes = g.fichas.filter(function (f) { return g.hallados.indexOf(f.grupo) < 0; });
    restantes.forEach(function (f) {
      var sel = g.sel.indexOf(f.w) >= 0;
      ui.tablero.appendChild(h('button', { class: 'cx-ficha' + (sel ? ' cx-ficha--sel' : ''), type: 'button', 'aria-pressed': String(sel), disabled: g.terminada,
        onclick: function () { alternar(f.w); } }, f.w));
    });
    ui.comprobar.disabled = g.sel.length !== 4 || g.terminada;
    ui.limpiar.disabled = !g.sel.length || g.terminada;
    ui.mezclar.disabled = g.terminada;
  }

  function alternar(w) {
    var i = g.sel.indexOf(w);
    if (i >= 0) g.sel.splice(i, 1); else if (g.sel.length < 4) g.sel.push(w);
    ui.msg.textContent = '';
    pintarTablero();
  }

  function comprobar() {
    if (g.sel.length !== 4 || g.terminada) return;
    var clave = g.sel.slice().sort().join('|');
    if (g.probadas[clave]) { ui.msg.textContent = 'Esa combinación ya la has probado.'; ui.msg.className = 'mensaje mensaje--mal'; return; }
    g.probadas[clave] = true;
    var cuenta = {};
    g.sel.forEach(function (w) { var f = g.fichas.filter(function (x) { return x.w === w; })[0]; cuenta[f.grupo] = (cuenta[f.grupo] || 0) + 1; });
    var mejor = Object.keys(cuenta).reduce(function (a, k) { return cuenta[k] > (cuenta[a] || 0) ? k : a; }, Object.keys(cuenta)[0]);
    g.intentos.push(g.sel.map(function (w) { return g.fichas.filter(function (x) { return x.w === w; })[0].grupo; }));
    if (cuenta[mejor] === 4) {
      var gi = +mejor;
      g.hallados.push(gi); g.sel = [];
      pintarGrupo(gi);
      ui.msg.textContent = '¡Bien! ' + p.grupos[gi].n + '.'; ui.msg.className = 'mensaje mensaje--ok';
      TYJ.anunciar('Grupo encontrado: ' + p.grupos[gi].n);
      if (g.hallados.length === 4) return terminar(true);
    } else {
      g.vidas--; ui.vidas.poner('vidas', g.vidas, g.vidas <= 1);
      var casi = cuenta[mejor] === 3;
      ui.msg.textContent = casi ? '¡Casi! Estás a una palabra de acertar. Te quedan ' + g.vidas + ' errores.' : 'Esas cuatro no forman un grupo. Te quedan ' + g.vidas + ' errores.';
      ui.msg.className = 'mensaje mensaje--mal';
      TYJ.anunciar(ui.msg.textContent);
      if (g.vidas <= 0) return terminar(false);
    }
    pintarTablero();
  }

  function terminar(gana) {
    g.terminada = true;
    if (!gana) { [0, 1, 2, 3].forEach(function (i) { if (g.hallados.indexOf(i) < 0) { g.hallados.push(i); pintarGrupo(i); } }); }
    pintarTablero();
    ui.msg.textContent = '';
    sesion.registrar(g.hallados.length, gana);
    var cuadros = g.intentos.map(function (it) { return it.map(function (i) { return CUADROS[i]; }).join(''); }).join('\n');
    var cont = h('div');
    ui.final.appendChild(cont);
    TYJ.final(cont, { titulo: gana ? (g.vidas === VIDAS ? '¡Perfecto, sin errores!' : '¡Los has encontrado todos!') : 'Se acabaron los errores',
      puntos: VIDAS - g.vidas, unidad: 'errores cometidos', detalles: ['Intentos: ' + g.intentos.length],
      compartir: 'Conexiones · ' + (gana ? 'resuelto' : 'sin resolver') + ' · ' + (VIDAS - g.vidas) + ' errores\n' + cuadros, textoRepetir: 'Otro puzzle', alRepetir: nueva });
    var det = h('div', { class: 'cx-explicaciones' }, h('h3', { texto: 'Explicaciones' }),
      h('ul', {}, p.grupos.map(function (gr, i) { return h('li', {}, h('strong', { texto: gr.n + ': ' }), gr.p.join(', ') + '. ', gr.e); })));
    cont.firstChild.appendChild(det);
    ui.acciones.hidden = true;
    ui.final.scrollIntoView({ block: 'nearest' });
  }

  function arrancar() {
    TYJ.datos('conexiones/puzzles.json').then(function (json) { puzzles = json.puzzles; nueva(); })
      .catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();
