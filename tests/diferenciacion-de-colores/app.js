/* Diferenciación de colores: en cada cuadrícula hay una casilla con un tono un poco más claro u oscuro. 60 s; cada fallo resta 3 s. */
(function () {
  'use strict';
  var host = TT.app();
  if (!host) return;
  var DUR = 60, PENAL = 3;
  var estado = 'espera', nivel = 0, fallos = 0, penal = 0, t0 = 0, reloj = 0, panel = null, marcas = [], delta = 0, minDelta = null, lado = 2, aciertoT = [];
  var datos = TT.datos([['t', 'Tiempo restante', TT.fmt(DUR, 1) + ' s'], ['n', 'Nivel', '0'], ['f', 'Fallos', '0']]);
  var mensaje = TT.h('p', { class: 'dc-mensaje' });
  var cuadricula = TT.h('div', { class: 'dc-grid', role: 'group', 'aria-label': 'Casillas de colores: una es un poco distinta de las demás' });
  var inicio = TT.boton('Empezar', function () { empezar(); });
  var zona = TT.h('div', { class: 'tt-zona dc-zona' }, mensaje, inicio, cuadricula);

  function ladoDe(n) { return n < 2 ? 2 : n < 4 ? 3 : n < 7 ? 4 : n < 11 ? 5 : n < 16 ? 6 : n < 22 ? 7 : 8; }
  function nueva() {
    lado = ladoDe(nivel); delta = Math.max(0.7, 22 * Math.pow(0.9, nivel));
    var h = TT.azar(0, 359), s = TT.azar(45, 75), l = TT.azar(40, 62), signo = l + delta > 85 ? -1 : l - delta < 20 ? 1 : (Math.random() < 0.5 ? 1 : -1);
    var base = 'hsl(' + h + ' ' + s + '% ' + l + '%)', raro = 'hsl(' + h + ' ' + s + '% ' + (l + signo * delta).toFixed(2) + '%)', n = lado * lado, otra = TT.azar(0, n - 1);
    TT.vaciar(cuadricula);
    cuadricula.style.gridTemplateColumns = 'repeat(' + lado + ', 1fr)';
    for (var i = 0; i < n; i++) {
      var b = TT.h('button', { type: 'button', class: 'dc-casilla', 'aria-label': 'Casilla ' + (i + 1) + ' de ' + n, style: 'background:' + (i === otra ? raro : base) });
      if (i === otra) b.setAttribute('data-distinta', '1');
      cuadricula.appendChild(b);
    }
  }
  function empezar() {
    estado = 'jugando'; t0 = performance.now(); penal = 0; nivel = 0; fallos = 0; marcas = []; minDelta = null;
    inicio.style.display = 'none'; mensaje.textContent = ''; cuadricula.style.display = '';
    datos.poner('n', '0', false); datos.poner('f', '0', false);
    nueva();
    reloj = window.setInterval(tic, 100);
    TT.anunciar('Empieza el test, un minuto.');
  }
  function resta() { return DUR - (performance.now() - t0) / 1000 - penal; }
  function tic() { var r = resta(); if (r <= 0) { terminar(); return; } datos.poner('t', TT.fmt(r, 1) + ' s', r < 10); }
  cuadricula.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.dc-casilla') : null;
    if (!b || estado !== 'jugando') return;
    if (b.getAttribute('data-distinta') === '1') {
      nivel++; marcas.push((performance.now() - t0) / 1000); minDelta = delta;
      datos.poner('n', String(nivel));
    } else { fallos++; penal += PENAL; datos.poner('f', String(fallos), true); }
    if (resta() <= 0) { terminar(); return; }
    nueva();
  });
  function terminar() {
    if (estado !== 'jugando') return;
    window.clearInterval(reloj); estado = 'fin';
    datos.poner('t', TT.fmt(0, 1) + ' s', false);
    cuadricula.style.display = 'none'; mensaje.textContent = '¡Tiempo!';
    var rango = TT.rango(nivel, [
      [0, 'Calentando', 'Las primeras cuadrículas se superan casi siempre; si te quedas aquí, revisa el brillo de la pantalla y prueba otra vez.'],
      [6, 'Atento', 'Distingues bien los tonos con diferencias claras.'],
      [12, 'Fino', 'Notas diferencias pequeñas de luminosidad sin mucho esfuerzo.'],
      [18, 'Ojo de artista', 'Diferencias de pocos puntos de luminosidad no se te escapan.'],
      [24, 'Ojo de halcón', 'Un nivel muy alto. En este punto el límite lo pone también tu pantalla.'],
      [30, 'Ojo de lince', 'Estás en el borde de lo que una pantalla normal puede mostrar.']]);
    var cubos = 6, v = [], i;
    for (i = 0; i < cubos; i++) v.push(0);
    marcas.forEach(function (m) { v[Math.min(cubos - 1, Math.floor(m / (DUR / cubos)))]++; });
    var detalles = [['Niveles superados', nivel], ['Fallos', fallos], ['Cuadrícula más grande', lado + ' × ' + lado]];
    if (minDelta != null) detalles.push(['Diferencia más fina que viste', TT.fmt(minDelta, 1) + ' puntos de luminosidad']);
    if (nivel) detalles.push(['Tiempo medio por acierto', TT.fmt(DUR / nivel, 1) + ' s']);
    window.setTimeout(function () {
      if (estado !== 'fin') return;
      panel = TT.resultado(host, { titulo: 'Tu diferenciación de colores', valor: nivel, unidad: nivel === 1 ? 'nivel' : 'niveles', rango: rango,
        extra: TT.barras(v, { max: Math.max.apply(null, v.concat([1])), formato: function (x) { return x + ' aciertos'; }, descripcion: 'Aciertos en cada tramo de diez segundos', pie: ['0 s', DUR + ' s'] }),
        detalles: detalles, copia: 'He llegado al nivel ' + nivel + ' en el test de diferenciación de colores (' + fallos + ' fallos).', alRepetir: reiniciar });
      TT.anunciar('Resultado: nivel ' + nivel + ', ' + fallos + ' fallos.');
      TT.enfocar(panel);
    }, 500);
  }
  function reiniciar() {
    window.clearInterval(reloj); estado = 'espera'; nivel = 0; fallos = 0;
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
    datos.poner('t', TT.fmt(DUR, 1) + ' s', false); datos.poner('n', '0', false); datos.poner('f', '0', false);
    cuadricula.style.display = 'none'; inicio.style.display = '';
    mensaje.textContent = 'En cada cuadrícula hay una casilla con un tono un poco distinto. Púlsala. Cada acierto sube el nivel y reduce la diferencia; cada fallo resta 3 segundos.';
  }
  host.appendChild(TT.h('p', { class: 'tt-aviso', texto: 'Pon el brillo de la pantalla en un nivel normal y desactiva el modo noche o el filtro de luz azul: alteran los tonos.' }));
  host.appendChild(datos.nodo);
  host.appendChild(zona);
  reiniciar();
})();
