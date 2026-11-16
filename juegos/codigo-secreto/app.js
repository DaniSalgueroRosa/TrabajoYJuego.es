/* CÓDIGO SECRETO: la máquina esconde una combinación de colores y tú tienes un número limitado de intentos para descubrirla.
   Tras cada intento se te dice cuántas fichas están en su sitio (●) y cuántas tienen un color que sí está pero en otra posición (○). Cada color lleva también un símbolo y un número de tecla.
   Tres niveles: 4 posiciones y 6 colores sin repetir, 4 y 6 con repetición, y 5 posiciones con 8 colores. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('cs');
  if (!raiz) return;
  var COLORES = [
    { n: 'Verde', s: '▲', c: '#8FD694' }, { n: 'Rosa', s: '●', c: '#FF5A7D' }, { n: 'Amarillo', s: '■', c: '#E6F14A' }, { n: 'Azul', s: '◆', c: '#6EC1FF' },
    { n: 'Naranja', s: '★', c: '#FFB86B' }, { n: 'Violeta', s: '✚', c: '#B9A0F5' }, { n: 'Turquesa', s: '⬢', c: '#5ED6D0' }, { n: 'Blanco', s: '♥', c: '#EAF2EE' }
  ];
  var NIVELES = {
    facil: { nombre: 'Fácil', n: 4, colores: 6, repetir: false, max: 10, k: 60 },
    medio: { nombre: 'Medio', n: 4, colores: 6, repetir: true, max: 10, k: 100 },
    dificil: { nombre: 'Difícil', n: 5, colores: 8, repetir: true, max: 12, k: 120 }
  };
  var NIVELES_FINAL = [[0, 'Curioso'], [300, 'Detective'], [600, 'Descifrador'], [900, 'Criptógrafo'], [1200, 'Maestro del código']];
  var sesion = TYJ.Sesion(null, { etiquetaMejor: 'Mejor puntuación: ' });
  var nivel = 'medio', g = null, ui = null, alTecla = null;

  /* ---- lógica */
  function valorar(secreto, intento) {                     // {ex: en su sitio, co: color correcto en otro sitio}
    var ex = 0, a = {}, b = {};
    secreto.forEach(function (v, i) {
      if (v === intento[i]) ex++;
      else { a[v] = (a[v] || 0) + 1; b[intento[i]] = (b[intento[i]] || 0) + 1; }
    });
    var co = 0; Object.keys(a).forEach(function (k) { co += Math.min(a[k], b[k] || 0); });
    return { ex: ex, co: co };
  }
  function nuevoSecreto(cfg) {
    var disp = Array.from({ length: cfg.colores }, function (_, i) { return i; });
    if (!cfg.repetir) return U.muestra(disp, cfg.n);
    var s = []; for (var i = 0; i < cfg.n; i++) s.push(U.elegir(disp));
    return s;
  }

  /* ---- partida */
  function nueva() {
    var cfg = NIVELES[nivel];
    g = { cfg: cfg, secreto: nuevoSecreto(cfg), intentos: [], actual: [], fin: false };
    montar(); pintar();
    TYJ.anunciar('Nueva partida: código de ' + cfg.n + ' colores entre ' + cfg.colores + ', con ' + cfg.max + ' intentos.');
  }
  function poner(c) {
    if (g.fin || g.actual.length >= g.cfg.n) return;
    if (!g.cfg.repetir && g.actual.indexOf(c) >= 0) return aviso('En este nivel no se repiten colores.', true);
    g.actual.push(c); aviso(''); pintar();
  }
  function quitar(i) {
    if (g.fin) return;
    if (i == null) g.actual.pop(); else g.actual.splice(i, 1);
    aviso(''); pintar();
  }
  function probar() {
    if (g.fin) return;
    if (g.actual.length < g.cfg.n) return aviso('Faltan ' + (g.cfg.n - g.actual.length) + ' colores para completar la combinación.', true);
    var v = valorar(g.secreto, g.actual);
    g.intentos.push({ c: g.actual.slice(), ex: v.ex, co: v.co });
    g.actual = [];
    TYJ.anunciar('Intento ' + g.intentos.length + ': ' + v.ex + ' en su sitio y ' + v.co + ' con el color correcto en otro sitio.');
    if (v.ex === g.cfg.n) return terminar(true);
    if (g.intentos.length >= g.cfg.max) return terminar(false);
    aviso(''); pintar();
  }
  function terminar(gana) {
    g.fin = true; pintar();
    var usados = g.intentos.length, puntos = gana ? (g.cfg.max - usados + 1) * g.cfg.k : 0;
    sesion.registrar(puntos, gana);
    var nv = U.nivel(puntos, NIVELES_FINAL), codigo = g.secreto.map(function (c) { return COLORES[c].n; }).join(', ');
    ui.secreto.hidden = false;
    TYJ.final(ui.final.appendChild(h('div')), { titulo: gana ? '¡Código descifrado!' : 'Se acabaron los intentos', puntos: puntos, unidad: 'puntos', nivel: gana ? nv : null,
      detalles: [(gana ? 'Intentos usados: ' + usados + ' de ' + g.cfg.max : 'El código era: ' + codigo), 'Nivel: ' + g.cfg.nombre],
      compartir: 'Código secreto (' + g.cfg.nombre.toLowerCase() + '): ' + (gana ? 'descifrado en ' + usados + ' de ' + g.cfg.max + ' intentos.' : 'no lo conseguí.'), textoRepetir: 'Otro código', alRepetir: nueva });
  }
  function aviso(t, mal) { if (ui) { ui.msg.textContent = t; ui.msg.className = 'mensaje' + (mal ? ' mensaje--mal' : ''); } }

  /* ---- pantalla */
  function ficha(i, extra) {
    var c = COLORES[i];
    return h('span', { class: 'cs-ficha' + (extra ? ' ' + extra : ''), style: 'background:' + c.c, 'aria-hidden': 'true', title: c.n }, c.s);
  }
  function montar() {
    TYJ.vaciar(raiz);
    ui = { huecos: [], botones: [] };
    ui.niveles = h('div', { class: 'fila', role: 'group', 'aria-label': 'Nivel' });
    Object.keys(NIVELES).forEach(function (k) {
      var c = NIVELES[k];
      ui.niveles.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(k === nivel), onclick: function () { nivel = k; nueva(); } }, c.nombre + ' (' + c.n + ' de ' + c.colores + ')'));
    });
    ui.hud = TYJ.hud([['intento', 'Intento', '1 / ' + g.cfg.max], ['puntos', 'Puntos posibles', (g.cfg.max) * g.cfg.k]]);
    ui.leyenda = h('p', { class: 'texto-suave cs-leyenda' }, '● = color en su sitio · ○ = color correcto en otro sitio. ' + (g.cfg.repetir ? 'Los colores pueden repetirse.' : 'Ningún color se repite.'));
    ui.historial = h('ol', { class: 'cs-historial', 'aria-label': 'Intentos anteriores' });
    ui.actual = h('div', { class: 'cs-actual', role: 'group', 'aria-label': 'Combinación que estás formando' });
    for (var i = 0; i < g.cfg.n; i++) (function (i) {
      var b = h('button', { class: 'cs-hueco', type: 'button', onclick: function () { if (g.actual[i] != null) quitar(i); } });
      ui.huecos.push(b); ui.actual.appendChild(b);
    })(i);
    ui.probar = h('button', { class: 'boton-retro', type: 'button', onclick: probar }, 'Probar');
    ui.paleta = h('div', { class: 'cs-paleta', role: 'group', 'aria-label': 'Colores disponibles' });
    for (var c = 0; c < g.cfg.colores; c++) (function (c) {
      var b = h('button', { class: 'cs-color', type: 'button', 'aria-label': COLORES[c].n + ' ' + COLORES[c].s + ', tecla ' + (c + 1), 'aria-keyshortcuts': String(c + 1), onclick: function () { poner(c); } }, ficha(c), h('span', { class: 'cs-nombre' }, COLORES[c].n));
      ui.paleta.appendChild(b); ui.botones.push(b);
    })(c);
    ui.secreto = h('p', { class: 'texto-suave', hidden: true }, 'El código era: ', g.secreto.map(function (c) { return ficha(c); }));
    ui.secreto.setAttribute('aria-hidden', 'true');
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' }, 'Elige colores para formar tu combinación y pulsa Probar.');
    ui.final = h('div'); ui.est = h('div');
    [ui.niveles, ui.hud.nodo, ui.leyenda, ui.historial, ui.actual, ui.paleta, ui.msg,
      h('div', { class: 'fila fila--centro' }, ui.probar, h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: function () { quitar(); } }, 'Borrar último'), h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: nueva }, 'Otro código')),
      ui.secreto, ui.final, ui.est].forEach(function (x) { raiz.appendChild(x); });
    sesion.montar(ui.est);
    ui.paleta.setAttribute('data-secreto', g.secreto.join(''));
    if (alTecla) document.removeEventListener('keydown', alTecla);
    alTecla = function (ev) {
      if (ev.ctrlKey || ev.metaKey || ev.altKey || !g || g.fin) return;
      var t = ev.target && ev.target.tagName;
      var n = parseInt(ev.key, 10);
      if (n >= 1 && n <= g.cfg.colores) { ev.preventDefault(); poner(n - 1); }
      else if (ev.key === 'Backspace') { ev.preventDefault(); quitar(); }
      else if (ev.key === 'Enter' && t !== 'BUTTON') { ev.preventDefault(); probar(); }
    };
    document.addEventListener('keydown', alTecla);
  }
  function pintar() {
    TYJ.vaciar(ui.historial);
    g.intentos.forEach(function (it, k) {
      var pistas = [];
      for (var i = 0; i < it.ex; i++) pistas.push(h('span', { class: 'cs-pista cs-pista--ex', 'aria-hidden': 'true' }, '●'));
      for (var j = 0; j < it.co; j++) pistas.push(h('span', { class: 'cs-pista cs-pista--co', 'aria-hidden': 'true' }, '○'));
      ui.historial.appendChild(h('li', { class: 'cs-fila', 'data-ex': String(it.ex), 'data-co': String(it.co), 'data-intento': it.c.join('') },
        h('span', { class: 'cs-num', 'aria-hidden': 'true' }, String(k + 1)),
        h('span', { class: 'cs-fichas' }, it.c.map(function (c) { return ficha(c); })),
        h('span', { class: 'cs-pistas' }, pistas),
        h('span', { class: 'solo-lectores' }, 'Intento ' + (k + 1) + ': ' + it.c.map(function (c) { return COLORES[c].n; }).join(', ') + '. ' + it.ex + ' en su sitio, ' + it.co + ' con el color correcto en otro sitio.')));
    });
    ui.huecos.forEach(function (b, i) {
      var c = g.actual[i];
      TYJ.vaciar(b);
      b.setAttribute('aria-label', c == null ? 'Hueco ' + (i + 1) + ' vacío' : 'Hueco ' + (i + 1) + ': ' + COLORES[c].n + ', pulsa para quitarlo');
      b.className = 'cs-hueco' + (c == null ? '' : ' cs-lleno');
      if (c != null) b.appendChild(ficha(c));
    });
    for (var c = 0; c < g.cfg.colores; c++) ui.botones[c].disabled = g.fin || (!g.cfg.repetir && g.actual.indexOf(c) >= 0);
    ui.probar.disabled = g.fin;
    ui.hud.poner('intento', Math.min(g.intentos.length + 1, g.cfg.max) + ' / ' + g.cfg.max);
    ui.paleta.setAttribute('data-intentos', String(g.intentos.length));
  }

  nueva();
})();
