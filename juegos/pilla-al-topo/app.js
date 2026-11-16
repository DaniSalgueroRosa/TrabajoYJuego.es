/* PILLA AL TOPO: nueve agujeros y 30 segundos. Los topos asoman y se esconden cada vez más rápido; pulsa o toca los topos (+10), no pulses las bombas (−15) y no falles en agujeros vacíos (−3).
   Teclas 1 a 9 para los nueve agujeros (en orden de lectura). Nunca baja de 0. Todo en memoria; nada se guarda. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('pt');
  if (!raiz) return;

  var HUECOS = 9, DURACION = 30;
  var NIVELES = [[0, 'Manos de mantequilla'], [60, 'Cazador novato'], [120, 'Martillo ágil'], [180, 'Reflejos de gato'], [240, 'Maestro del martillo']];
  var sesion = TYJ.Sesion(null, { mejor: true, etiquetaMejor: 'Mejor puntuación: ', racha: false });
  var g = null, ui = null, temp = null;

  function nivelDe(p) { var r = NIVELES[0][1]; NIVELES.forEach(function (n) { if (p >= n[0]) r = n[1]; }); return r; }
  function nueva() {
    parar();
    g = { fase: 'espera', puntos: 0, topos: 0, escapados: 0, bombas: 0, fallos: 0, huecos: [], marca: 0, timers: [] };
    for (var i = 0; i < HUECOS; i++) g.huecos.push({ tipo: null, marca: 0 });
    montar();
  }
  function parar() {
    if (temp) { temp.parar(); temp = null; }
    if (g) g.timers.forEach(clearTimeout);
  }
  function luego(fn, ms) { var id = setTimeout(fn, ms); g.timers.push(id); return id; }

  function empezar() {
    if (g.fase !== 'espera') return;
    g.fase = 'juego';
    ui.empezar.disabled = true; ui.empezar.textContent = 'En juego…';
    ui.msg.textContent = 'Pulsa los topos y esquiva las bombas.';
    var mia = g;
    temp = new TYJ.Temporizador({ segundos: DURACION, alTick: function (r) { ui.barra.poner(r / DURACION); ui.hud.poner('tiempo', Math.ceil(r) + ' s', r <= 5); }, alFin: function () { if (g === mia) terminar(); } });
    temp.iniciar();
    luego(sacar, 500);
  }
  function fraccion() { return temp ? 1 - temp.restante / DURACION : 0; }
  function sacar() {
    if (g.fase !== 'juego') return;
    var f = fraccion(), libres = [], activos = 0;
    g.huecos.forEach(function (q, i) { if (q.tipo) activos++; else libres.push(i); });
    if (libres.length && activos < (f > 0.6 ? 3 : 2)) {
      var i = libres[U.entre(0, libres.length - 1)], q = g.huecos[i], tipo = Math.random() < 0.2 ? 'bomba' : 'topo', marca = ++g.marca;
      q.tipo = tipo; q.marca = marca; pintar(i);
      luego(function () {
        if (g.fase !== 'juego' || q.marca !== marca || !q.tipo) return;
        if (q.tipo === 'topo') g.escapados++;
        q.tipo = null; pintar(i);
      }, Math.round((1100 - 500 * f) * (tipo === 'bomba' ? 1.1 : 1)));
    }
    luego(sacar, Math.round(U.entre(260, 700) * (1 - 0.4 * f)));
  }

  function pintar(i) {
    var q = g.huecos[i], b = ui.huecos[i];
    b.className = 'pt-hueco' + (q.tipo ? ' pt-hueco--' + q.tipo : '');
    b.setAttribute('aria-label', 'Agujero ' + (i + 1) + (q.tipo === 'topo' ? ': topo, púlsalo' : q.tipo === 'bomba' ? ': bomba, no la pulses' : ': vacío'));
    b.setAttribute('data-tipo', q.tipo || '');
  }
  function efecto(i, clase) {
    var b = ui.huecos[i];
    b.classList.remove('pt-hueco--pillado', 'pt-hueco--bomba-pulsada', 'pt-hueco--fallo');
    b.classList.add(clase);
    luego(function () { b.classList.remove(clase); }, 260);
  }
  function pulsar(i) {
    if (!g || g.fase !== 'juego') return;
    var q = g.huecos[i];
    if (q.tipo === 'topo') { g.puntos += 10; g.topos++; q.tipo = null; pintar(i); efecto(i, 'pt-hueco--pillado'); }
    else if (q.tipo === 'bomba') { g.puntos = Math.max(0, g.puntos - 15); g.bombas++; q.tipo = null; pintar(i); efecto(i, 'pt-hueco--bomba-pulsada'); }
    else { g.puntos = Math.max(0, g.puntos - 3); g.fallos++; efecto(i, 'pt-hueco--fallo'); }
    ui.hud.poner('puntos', g.puntos);
  }
  function terminar() {
    g.fase = 'fin'; parar();
    for (var i = 0; i < HUECOS; i++) { g.huecos[i].tipo = null; pintar(i); ui.huecos[i].disabled = true; }
    ui.barra.poner(0); ui.hud.poner('tiempo', '0 s');
    ui.empezar.textContent = 'Terminado';
    var pulsaciones = g.topos + g.bombas + g.fallos, precision = pulsaciones ? Math.round(100 * g.topos / pulsaciones) : 0;
    sesion.registrar(g.puntos, g.puntos > 0);
    ui.msg.textContent = '';
    TYJ.final(ui.final.appendChild(h('div')), { titulo: '¡Se acabó el tiempo!', puntos: g.puntos, unidad: 'puntos', nivel: nivelDe(g.puntos),
      detalles: ['Topos pillados: ' + g.topos, 'Topos que se escaparon: ' + g.escapados, 'Bombas pulsadas: ' + g.bombas, 'Pulsaciones en agujeros vacíos: ' + g.fallos, 'Precisión: ' + precision + ' %'],
      compartir: 'Pilla al topo: ' + g.puntos + ' puntos en 30 segundos (' + g.topos + ' topos pillados).', textoRepetir: 'Otra ronda', alRepetir: nueva });
  }

  function montar() {
    TYJ.vaciar(raiz); ui = { huecos: [] };
    ui.hud = TYJ.hud([['puntos', 'Puntos', '0'], ['tiempo', 'Tiempo', DURACION + ' s']]);
    ui.barra = TYJ.barraDeTiempo();
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite', texto: 'Pulsa «Empezar»: tienes 30 segundos. Topos +10, bombas −15, agujeros vacíos −3. También puedes usar las teclas 1 a 9.' });
    var campo = h('div', { class: 'pt-campo', role: 'group', 'aria-label': 'Nueve agujeros, numerados del 1 al 9 de izquierda a derecha y de arriba abajo' });
    for (var i = 0; i < HUECOS; i++) {
      (function (k) {
        var b = h('button', { class: 'pt-hueco', type: 'button', 'data-i': String(k), onclick: function () { pulsar(k); } },
          h('span', { class: 'pt-boca' }),
          h('span', { class: 'pt-bicho', 'aria-hidden': 'true' }, h('span', { class: 'pt-cara' })),
          h('span', { class: 'pt-num', 'aria-hidden': 'true', texto: String(k + 1) }));
        ui.huecos.push(b); campo.appendChild(b); pintar(k);
      })(i);
    }
    ui.empezar = h('button', { class: 'boton-retro', type: 'button', onclick: empezar }, 'Empezar');
    ui.final = h('div'); ui.est = h('div');
    [ui.hud.nodo, ui.barra.nodo, ui.msg, campo, h('div', { class: 'fila fila--centro' }, ui.empezar, h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: nueva }, 'Reiniciar')), ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
    ui.barra.poner(1);
  }

  document.addEventListener('keydown', function (ev) {
    if (!g || g.fase !== 'juego' || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var t = ev.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (ev.key >= '1' && ev.key <= '9') { ev.preventDefault(); pulsar(Number(ev.key) - 1); }
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden && g && g.fase === 'juego') terminar(); });

  nueva();
})();
