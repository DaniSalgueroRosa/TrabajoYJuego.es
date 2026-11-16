/* Prueba del mouse: dibuja un ratón y enciende cada parte cuando la usas. Cuenta pulsaciones, vueltas de rueda y dobles clics sospechosos. */
(function () {
  'use strict';
  var host = TT.app();
  if (!host) return;
  var NS = 'http://www.w3.org/2000/svg';
  function s(tag, atrib) { var e = document.createElementNS(NS, tag); Object.keys(atrib || {}).forEach(function (k) { e.setAttribute(k, atrib[k]); }); return e; }

  var ENTRADAS = [['b0', 'Izquierdo'], ['b1', 'Central'], ['b2', 'Derecho'], ['b3', 'Lateral atrás'], ['b4', 'Lateral adelante'], ['up', 'Rueda arriba'], ['down', 'Rueda abajo']];
  var cuenta = {}, ultima = {}, rebotes = 0, parpadeo = 0;
  ENTRADAS.forEach(function (e) { cuenta[e[0]] = 0; });

  var datos = TT.datos(ENTRADAS.map(function (e) { return [e[0], e[1], '0']; }).concat([['ok', 'Probados', '0/7'], ['reb', 'Dobles clics sospechosos', '0'], ['pos', 'Cursor (x, y)', '—']]));
  var estado = TT.h('p', { class: 'tt-aviso', role: 'status', texto: 'Pulsa cada botón dentro del recuadro y gira la rueda hacia arriba y hacia abajo. Cada parte se enciende al usarla.' });

  var svg = s('svg', { viewBox: '0 0 200 300', class: 'rt-mouse', role: 'img', 'aria-label': 'Dibujo de un ratón con botón izquierdo, derecho, rueda y dos botones laterales' });
  var partes = {
    b0: s('path', { d: 'M96 12 C52 13 24 40 22 98 L96 98 Z' }),
    b2: s('path', { d: 'M104 12 C148 13 176 40 178 98 L104 98 Z' }),
    b1: s('rect', { x: 91, y: 38, width: 18, height: 46, rx: 9 }),
    b3: s('rect', { x: 6, y: 162, width: 13, height: 34, rx: 5 }),
    b4: s('rect', { x: 6, y: 120, width: 13, height: 34, rx: 5 })
  };
  svg.appendChild(s('path', { d: 'M100 10 C150 10 180 42 180 100 L180 210 C180 266 148 292 100 292 C52 292 20 266 20 210 L20 100 C20 42 50 10 100 10 Z' }));
  ['b0', 'b2', 'b1', 'b3', 'b4'].forEach(function (k) { svg.appendChild(partes[k]); });
  svg.appendChild(s('path', { d: 'M20 100 L180 100', fill: 'none' }));

  var zona = TT.h('div', { class: 'tt-zona rt-zona', tabindex: '0', role: 'application', 'aria-label': 'Zona de prueba del ratón: pulsa los botones y gira la rueda aquí' }, svg);

  function encender(k, on) { if (partes[k]) partes[k].classList.toggle('rt-on', on); }
  function ver(k) {
    datos.poner(k, String(cuenta[k]), cuenta[k] > 0);
    var n = ENTRADAS.filter(function (e) { return cuenta[e[0]] > 0; }).length;
    datos.poner('ok', n + '/7', n === 7);
    if (n === 7) estado.textContent = 'Todo funciona: los cinco botones y la rueda en los dos sentidos han respondido.';
  }
  function sumar(k, ev) {
    cuenta[k]++;
    var t = ev.timeStamp, previa = ultima[k];
    if (previa != null && t - previa < 40 && k.charAt(0) === 'b') { rebotes++; datos.poner('reb', String(rebotes), true); estado.textContent = 'Ojo: dos pulsaciones del mismo botón en menos de 40 ms. Si te pasa sin querer, el interruptor puede estar rebotando.'; }
    ultima[k] = t;
    ver(k);
  }

  zona.addEventListener('mousedown', function (e) {
    e.preventDefault();
    var k = 'b' + e.button;
    if (!(k in cuenta)) return;
    zona.focus({ preventScroll: true });
    encender(k, true); sumar(k, e);
  });
  zona.addEventListener('mouseup', function (e) { e.preventDefault(); encender('b' + e.button, false); });
  window.addEventListener('mouseup', function (e) { encender('b' + e.button, false); });
  zona.addEventListener('mouseleave', function () { Object.keys(partes).forEach(function (k) { encender(k, false); }); });
  zona.addEventListener('auxclick', function (e) { e.preventDefault(); });
  zona.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  zona.addEventListener('wheel', function (e) {
    e.preventDefault();
    if (!e.deltaY) return;
    sumar(e.deltaY < 0 ? 'up' : 'down', e);
    encender('b1', true);
    clearTimeout(parpadeo); parpadeo = setTimeout(function () { encender('b1', false); }, 140);
  }, { passive: false });
  zona.addEventListener('mousemove', function (e) {
    var r = zona.getBoundingClientRect();
    datos.poner('pos', Math.round(e.clientX - r.left) + ', ' + Math.round(e.clientY - r.top));
  });

  function reiniciar() {
    ENTRADAS.forEach(function (e) { cuenta[e[0]] = 0; ultima[e[0]] = null; datos.poner(e[0], '0', false); });
    rebotes = 0; datos.poner('reb', '0', false); datos.poner('ok', '0/7', false);
    estado.textContent = 'Contadores a cero. Pulsa cada botón y gira la rueda.';
    Object.keys(partes).forEach(function (k) { encender(k, false); });
  }
  var tactil = false;
  try { tactil = window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches; } catch (e) { tactil = false; }
  if (tactil) estado.textContent = 'Parece que tu pantalla es táctil. Para probar botones y rueda necesitas un ratón conectado.';

  host.appendChild(estado);
  host.appendChild(zona);
  host.appendChild(datos.nodo);
  host.appendChild(TT.h('div', { class: 'tt-fila' }, TT.boton('Poner contadores a cero', reiniciar)));
})();
