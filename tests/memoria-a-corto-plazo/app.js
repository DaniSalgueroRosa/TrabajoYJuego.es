/* Memoria a corto plazo: una cuadrícula de 3 × 3 ilumina una secuencia de casillas, que cada ronda crece en una. Repítela en el mismo orden. */
(function () {
  'use strict';
  var host = TT.app();
  if (!host) return;
  var estado = 'espera', seq = [], pos = 0, mejor = 0, panel = null, timers = [], t0 = 0;
  var datos = TT.datos([['n', 'Longitud', '0'], ['m', 'Mejor', '0']]);
  var mensaje = TT.h('p', { class: 'cp-mensaje', role: 'status' });
  var rejilla = TT.h('div', { class: 'cp-rejilla', role: 'group', 'aria-label': 'Cuadrícula de nueve casillas' });
  var casillas = [];
  for (var i = 0; i < 9; i++) {
    var b = TT.h('button', { type: 'button', class: 'cp-casilla', 'aria-label': 'Casilla ' + (i + 1) });
    b.setAttribute('data-i', i); casillas.push(b); rejilla.appendChild(b);
  }
  var inicio = TT.boton('Empezar', function () { empezar(); });
  var zona = TT.h('div', { class: 'tt-zona cp-zona' }, mensaje, rejilla, inicio);

  function al(fn, ms) { timers.push(window.setTimeout(fn, ms)); }
  function limpiar() { timers.forEach(function (t) { window.clearTimeout(t); }); timers = []; }
  function encender(i, ms, clase) { casillas[i].classList.add(clase || 'cp-on'); al(function () { casillas[i].classList.remove(clase || 'cp-on'); }, ms); }
  function bloquear(s) { casillas.forEach(function (b) { b.disabled = s; }); }
  function empezar() { limpiar(); seq = []; mejor = 0; t0 = performance.now(); inicio.style.display = 'none'; datos.poner('m', '0'); ronda(); }
  function ronda() {
    seq.push(TT.azar(0, 8)); pos = 0; estado = 'mostrando';
    rejilla.setAttribute('data-secuencia', seq.join(','));
    datos.poner('n', String(seq.length));
    bloquear(true); mensaje.textContent = 'Mira la secuencia…';
    seq.forEach(function (c, k) { al(function () { encender(c, 450); }, 700 + k * 650); });
    al(function () { estado = 'turno'; bloquear(false); mensaje.textContent = 'Tu turno: repite la secuencia (' + seq.length + (seq.length === 1 ? ' casilla' : ' casillas') + ').'; TT.anunciar('Tu turno.'); }, 700 + seq.length * 650);
  }
  rejilla.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.cp-casilla') : null;
    if (!b || estado !== 'turno') return;
    var i = +b.getAttribute('data-i');
    if (i === seq[pos]) {
      encender(i, 160, 'cp-ok'); pos++;
      if (pos === seq.length) { mejor = seq.length; datos.poner('m', String(mejor)); estado = 'pausa'; bloquear(true); mensaje.textContent = '¡Bien!'; al(ronda, 800); }
    } else { fallo(i); }
  });
  function fallo(i) {
    estado = 'fin'; limpiar(); bloquear(true);
    casillas[i].classList.add('cp-mal'); casillas[seq[pos]].classList.add('cp-on');
    mensaje.textContent = 'Fallaste en la casilla ' + (pos + 1) + ' de ' + seq.length + '.';
    var seg = (performance.now() - t0) / 1000, fallada = seq.length, pasos = pos;
    var rango = TT.rango(mejor, [
      [0, 'A calentar', 'Con la primera casilla basta fijarse: prueba otra vez con calma.'],
      [3, 'Memoria corriente', 'Un resultado normal. Crear un dibujo con el recorrido ayuda a retener la secuencia.'],
      [6, 'Buena memoria', 'Retienes bien secuencias de varias casillas.'],
      [9, 'Muy buena memoria', 'Un resultado por encima de lo habitual.'],
      [12, 'Excelente', 'Secuencias largas que casi nadie retiene sin una técnica.'],
      [16, 'Prodigiosa', 'Un nivel de memoria visual entrenada.']]);
    al(function () {
      if (estado !== 'fin') return;
      panel = TT.resultado(host, { titulo: 'Tu memoria a corto plazo', valor: mejor, unidad: mejor === 1 ? 'casilla' : 'casillas', rango: rango,
        detalles: [['Secuencia más larga repetida', mejor], ['Fallaste en una secuencia de', fallada], ['Aciertos antes del fallo', pasos], ['Duración', TT.fmt(seg, 0) + ' s']],
        copia: 'He repetido una secuencia de ' + mejor + ' casillas en el test de memoria a corto plazo.', alRepetir: reiniciar });
      TT.anunciar('Resultado: ' + mejor + ' casillas.');
      TT.enfocar(panel);
    }, 900);
  }
  function reiniciar() {
    limpiar(); estado = 'espera'; seq = [];
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
    casillas.forEach(function (b) { b.classList.remove('cp-on', 'cp-ok', 'cp-mal'); });
    rejilla.removeAttribute('data-secuencia'); bloquear(true);
    datos.poner('n', '0'); datos.poner('m', '0');
    inicio.style.display = '';
    mensaje.textContent = 'Se iluminarán casillas una a una. Repite la secuencia en el mismo orden. Cada ronda añade una casilla más.';
  }
  host.appendChild(datos.nodo);
  host.appendChild(zona);
  reiniciar();
})();
