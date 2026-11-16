/* Entrenador de puntería: sesión con tiempo, tamaño y modo a elegir. «Un objetivo» aparece de uno en uno; «Objetivos que se encogen» pone hasta tres a la vez que se esfuman. */
(function () {
  'use strict';
  var host = TT.app();
  if (!host) return;
  var FRAC = { g: 0.12, m: 0.08, p: 0.055 };
  var NOM_TAM = { g: 'tamaño grande', m: 'tamaño mediano', p: 'tamaño pequeño' };
  var NOM_MODO = { uno: 'un objetivo', encoge: 'objetivos que se encogen' };
  var VIDA = 1800, MAXIMO = 3;
  var dur = 30, tam = 'm', modo = 'uno', estado = 'espera', aciertos = 0, fallos = 0, perdidos = 0, tiempos = [], marcas = [];
  var t0 = 0, raf = 0, objetivos = [], previo = null, siguiente = 0, panel = null;

  var cDur = TT.chips([[30, '30 s'], [60, '60 s']], dur, function (v) { dur = v; reiniciar(); }, 'Duración');
  var cTam = TT.chips([['g', 'Grande'], ['m', 'Mediano'], ['p', 'Pequeño']], tam, function (v) { tam = v; reiniciar(); }, 'Tamaño del objetivo');
  var cModo = TT.chips([['uno', 'Un objetivo'], ['encoge', 'Que se encogen']], modo, function (v) { modo = v; reiniciar(); }, 'Modo de juego');
  var datos = TT.datos([['t', 'Tiempo restante', TT.fmt(dur, 1) + ' s'], ['a', 'Aciertos', '0'], ['f', 'Fallos', '0']]);
  var mensaje = TT.h('p', { class: 'en-mensaje' });
  var inicio = TT.boton('Empezar', function () { empezar(); });
  inicio.classList.add('en-inicio');
  var area = TT.h('div', { class: 'tt-zona en-area', role: 'application', 'aria-label': 'Zona de entrenamiento: pulsa cada círculo' }, mensaje, inicio);

  function diametro() { return Math.max(34, Math.min(area.clientWidth * FRAC[tam], area.clientHeight * 0.3)); }
  function quitar(o) {
    if (o.el.parentNode) o.el.parentNode.removeChild(o.el);
    var i = objetivos.indexOf(o);
    if (i >= 0) objetivos.splice(i, 1);
  }
  function crear() {
    var d = diametro(), w = area.clientWidth, h = area.clientHeight, x, y, n = 0, ok;
    do {
      x = d / 2 + 6 + Math.random() * Math.max(1, w - d - 12);
      y = d / 2 + 6 + Math.random() * Math.max(1, h - d - 12);
      ok = objetivos.every(function (o) { return Math.hypot(o.x - x, o.y - y) > d * 1.7; });
      if (ok && previo) ok = Math.hypot(x - previo.x, y - previo.y) > d * 2.5;
      n++;
    } while (!ok && n < 40);
    var el = TT.h('button', { type: 'button', class: 'en-obj', tabindex: '-1', 'aria-label': 'Objetivo', style: 'width:' + d + 'px;height:' + d + 'px;left:' + (x - d / 2) + 'px;top:' + (y - d / 2) + 'px' });
    var o = { el: el, x: x, y: y, nace: performance.now() };
    objetivos.push(o); previo = { x: x, y: y };
    area.appendChild(el);
  }
  function marcador() {
    datos.poner('a', String(aciertos)); datos.poner('f', String(fallos + perdidos));
  }
  function empezar() {
    if (estado !== 'espera') return;
    estado = 'jugando'; t0 = performance.now();
    inicio.style.display = 'none'; mensaje.textContent = '';
    cDur.bloquear(true); cTam.bloquear(true); cModo.bloquear(true);
    previo = null; siguiente = 0;
    crear();
    TT.anunciar('Empieza el entrenamiento, ' + dur + ' segundos.');
    raf = requestAnimationFrame(bucle);
  }
  function bucle() {
    if (estado !== 'jugando') return;
    raf = requestAnimationFrame(bucle);
    var ahora = performance.now(), t = (ahora - t0) / 1000;
    if (t >= dur) { terminar(); return; }
    datos.poner('t', TT.fmt(dur - t, 1) + ' s', dur - t < 3);
    if (modo === 'encoge') {
      for (var i = objetivos.length - 1; i >= 0; i--) {
        var o = objetivos[i], v = (ahora - o.nace) / VIDA;
        if (v >= 1) { quitar(o); perdidos++; marcador(); }
        else o.el.style.transform = 'scale(' + (1 - 0.85 * v).toFixed(3) + ')';
      }
      if (objetivos.length < MAXIMO && ahora >= siguiente) { crear(); siguiente = ahora + TT.azar(150, 350); }
    }
  }
  function reiniciar() {
    cancelar();
    estado = 'espera'; aciertos = 0; fallos = 0; perdidos = 0; tiempos = []; marcas = []; previo = null;
    objetivos.slice().forEach(quitar);
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
    cDur.bloquear(false); cTam.bloquear(false); cModo.bloquear(false);
    datos.poner('t', TT.fmt(dur, 1) + ' s', false); datos.poner('a', '0', false); datos.poner('f', '0', false);
    inicio.style.display = '';
    mensaje.textContent = modo === 'uno' ? 'Los círculos aparecen de uno en uno: pulsa cada uno en cuanto lo veas.' : 'Aparecen hasta tres a la vez y se van encogiendo: pulsa cada uno antes de que desaparezca.';
  }
  function cancelar() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  area.addEventListener('pointerdown', function (e) {
    if (estado !== 'jugando') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var el = e.target.closest ? e.target.closest('.en-obj') : null;
    if (el) {
      var o = null;
      for (var i = 0; i < objetivos.length; i++) if (objetivos[i].el === el) o = objetivos[i];
      if (!o) return;
      var marca = e.timeStamp && e.timeStamp < 1e11 && Math.abs(e.timeStamp - performance.now()) < 5000 ? e.timeStamp : performance.now();
      tiempos.push(Math.max(0, marca - o.nace)); marcas.push((marca - t0) / 1000);
      aciertos++; quitar(o); marcador();
      if (modo === 'uno') crear();
    } else if (e.target === area) { fallos++; marcador(); }
  });
  area.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  function terminar() {
    cancelar();
    estado = 'fin';
    objetivos.slice().forEach(quitar);
    datos.poner('t', TT.fmt(0, 1) + ' s', false); marcador();
    mensaje.textContent = '¡Tiempo!';
    var intentos = aciertos + fallos + perdidos, prec = intentos ? aciertos / intentos * 100 : 0, porS = aciertos / dur;
    var rango = TT.rango(porS * prec / 100, [
      [0, 'Calentando', 'Todavía estás cogiendo el pulso. Prueba con círculos grandes y ve subiendo.'],
      [0.6, 'Aprendiz', 'Aciertas con regularidad. La velocidad llegará con las repeticiones.'],
      [1.0, 'Constante', 'Un ritmo estable y bastante limpio.'],
      [1.4, 'Afinado', 'Rápido y con pocos fallos.'],
      [1.9, 'Preciso', 'Un ritmo muy alto sin perder la puntería.'],
      [2.4, 'Francotirador', 'Un nivel de entrenamiento serio: ritmo alto y casi sin fallos.']]);
    var cubos = 6, ancho = dur / cubos, v = [];
    for (var i = 0; i < cubos; i++) v.push(0);
    marcas.forEach(function (m) { v[Math.min(cubos - 1, Math.floor(m / ancho))]++; });
    var detalles = [['Precisión', TT.fmt(prec, 0) + ' %'], ['Aciertos por segundo', TT.fmt(porS, 2)], ['Clics fuera del objetivo', fallos]];
    if (modo === 'encoge') detalles.push(['Objetivos que se esfumaron', perdidos]);
    if (tiempos.length) { detalles.push(['Tiempo medio por acierto', TT.fmt(TT.media(tiempos), 0) + ' ms']); detalles.push(['Acierto más rápido', TT.fmt(Math.min.apply(null, tiempos), 0) + ' ms']); }
    detalles.push(['Ajustes', dur + ' s · ' + NOM_TAM[tam] + ' · ' + NOM_MODO[modo]]);
    var ajustes = dur + ' s, ' + NOM_TAM[tam] + ', ' + NOM_MODO[modo];
    esperar(function () {
      if (estado !== 'fin') return;
      panel = TT.resultado(host, { titulo: 'Tu entrenamiento', valor: aciertos, unidad: 'aciertos', rango: rango,
        extra: TT.barras(v, { max: Math.max.apply(null, v.concat([1])), formato: function (x) { return x + ' aciertos'; }, descripcion: 'Aciertos en cada tramo del entrenamiento', pie: ['0 s', dur + ' s'] }),
        detalles: detalles, copia: 'He hecho ' + aciertos + ' aciertos en el entrenador de puntería (' + ajustes + ') con ' + TT.fmt(prec, 0) + ' % de precisión.', alRepetir: reiniciar });
      TT.anunciar('Resultado: ' + aciertos + ' aciertos y ' + TT.fmt(prec, 0) + ' por ciento de precisión.');
      TT.enfocar(panel);
    });
  }
  function esperar(f) { window.setTimeout(f, 500); }
  var tactil = false;
  try { tactil = window.matchMedia('(pointer: coarse)').matches; } catch (e) { tactil = false; }
  var ajustes = TT.h('div', { class: 'tt-fila' },
    TT.h('p', { class: 'tt-etiqueta', texto: 'Duración' }), cDur.nodo,
    TT.h('p', { class: 'tt-etiqueta', texto: 'Tamaño' }), cTam.nodo,
    TT.h('p', { class: 'tt-etiqueta', texto: 'Modo' }), cModo.nodo);
  host.appendChild(TT.h('p', { class: 'tt-aviso', texto: tactil ? 'Pantalla táctil detectada: funciona con el dedo, aunque con ratón los resultados suelen ser distintos.' : 'Este entrenamiento es para ratón o pantalla táctil: los círculos no se pueden pulsar con el teclado.' }));
  host.appendChild(ajustes);
  host.appendChild(datos.nodo);
  host.appendChild(area);
  reiniciar();
})();
