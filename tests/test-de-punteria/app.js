/* Test de puntería: 30 objetivos de uno en uno. Se mide el tiempo desde que aparece cada uno hasta que se pulsa (el primero solo sirve para empezar). */
(function () {
  'use strict';
  var host = TT.app();
  if (!host) return;
  var TOTAL = 30, estado = 'espera', hechos = 0, fallos = 0, tiempos = [], aparece = 0, objetivo = null, previo = null, panel = null, inicio = 0;
  var datos = TT.datos([['o', 'Objetivos', '0/' + TOTAL], ['m', 'Media por objetivo', '—'], ['f', 'Fallos', '0']]);
  var mensaje = TT.h('p', { class: 'pu-mensaje' });
  var area = TT.h('div', { class: 'tt-zona pu-area', role: 'application', 'aria-label': 'Zona de puntería: pulsa cada círculo en cuanto aparezca' }, mensaje);

  function tam() { return Math.max(40, Math.min(64, area.clientWidth * 0.075)); }
  function nuevo(centro) {
    if (objetivo && objetivo.parentNode) objetivo.parentNode.removeChild(objetivo);
    var d = tam(), w = area.clientWidth, h = area.clientHeight, x, y, intentos = 0;
    do {
      x = centro ? w / 2 : d / 2 + 8 + Math.random() * (w - d - 16);
      y = centro ? h / 2 : d / 2 + 8 + Math.random() * (h - d - 16);
      intentos++;
    } while (!centro && previo && intentos < 30 && Math.hypot(x - previo[0], y - previo[1]) < d * 3);
    previo = [x, y];
    objetivo = TT.h('button', { type: 'button', class: 'pu-obj', tabindex: '-1', 'aria-label': 'Objetivo', style: 'width:' + d + 'px;height:' + d + 'px;left:' + (x - d / 2) + 'px;top:' + (y - d / 2) + 'px' });
    area.appendChild(objetivo);
    aparece = performance.now();
    requestAnimationFrame(function (t) { aparece = t; });
  }
  function reiniciar() {
    estado = 'espera'; hechos = 0; fallos = 0; tiempos = []; previo = null;
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
    datos.poner('o', '0/' + TOTAL); datos.poner('m', '—'); datos.poner('f', '0');
    mensaje.textContent = 'Pulsa el círculo para empezar. Después irán apareciendo ' + TOTAL + ' más: pulsa cada uno lo antes que puedas.';
    nuevo(true);
  }
  area.addEventListener('pointerdown', function (e) {
    if (estado === 'fin') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (objetivo && (e.target === objetivo)) {
      if (estado === 'espera') { estado = 'jugando'; inicio = performance.now(); mensaje.textContent = ''; nuevo(false); return; }
      tiempos.push(e.timeStamp - aparece); hechos++;
      datos.poner('o', hechos + '/' + TOTAL); datos.poner('m', TT.fmt(TT.media(tiempos), 0) + ' ms');
      if (hechos >= TOTAL) terminar(); else nuevo(false);
    } else if (estado === 'jugando') { fallos++; datos.poner('f', String(fallos), true); }
  });
  area.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  function terminar() {
    estado = 'fin';
    if (objetivo && objetivo.parentNode) objetivo.parentNode.removeChild(objetivo);
    mensaje.textContent = '¡Hecho!';
    var media = TT.media(tiempos), total = (performance.now() - inicio) / 1000, prec = TOTAL / (TOTAL + fallos) * 100;
    var rango = TT.rangoMax(media, [
      [450, 'Francotirador', 'Tiempo por objetivo muy bajo. Tu pulso y tu vista van de la mano.'],
      [550, 'Muy preciso', 'Encuentras y alcanzas cada objetivo con rapidez.'],
      [700, 'Buen pulso', 'Un resultado sólido, por encima de lo habitual.'],
      [900, 'Normal', 'Un ritmo habitual para una prueba de puntería con ratón.'],
      [Infinity, 'Con calma', 'Vas con cuidado. Con práctica, el tiempo por objetivo baja rápido.']]);
    panel = TT.resultado(host, { titulo: 'Tu puntería', valor: TT.fmt(media, 0), unidad: 'ms por objetivo', rango: rango,
      extra: TT.barras(tiempos.map(function (x) { return Math.round(x); }), { formato: function (x) { return x + ' ms'; }, descripcion: 'Tiempo de cada uno de los 30 objetivos', pie: ['Objetivo 1', 'Objetivo ' + TOTAL] }),
      detalles: [['Mejor objetivo', TT.fmt(Math.min.apply(null, tiempos), 0) + ' ms'], ['Peor objetivo', TT.fmt(Math.max.apply(null, tiempos), 0) + ' ms'], ['Mediana', TT.fmt(TT.mediana(tiempos), 0) + ' ms'],
        ['Fallos (clics fuera)', fallos], ['Precisión', TT.fmt(prec, 0) + ' %'], ['Tiempo total', TT.fmt(total, 1) + ' s']],
      copia: 'Mi puntería: ' + TT.fmt(media, 0) + ' ms por objetivo con ' + fallos + ' fallos.', alRepetir: reiniciar });
    TT.anunciar('Resultado: ' + TT.fmt(media, 0) + ' milisegundos por objetivo y ' + fallos + ' fallos.');
    TT.enfocar(panel);
  }
  var tactil = false;
  try { tactil = window.matchMedia('(pointer: coarse)').matches; } catch (e) { tactil = false; }
  host.appendChild(TT.h('p', { class: 'tt-aviso', texto: tactil ? 'Pantalla táctil detectada: el test funciona con el dedo, aunque con ratón los tiempos suelen ser distintos.' : 'Este test es para ratón o pantalla táctil: los círculos no se pueden pulsar con el teclado.' }));
  host.appendChild(datos.nodo);
  host.appendChild(area);
  reiniciar();
})();
