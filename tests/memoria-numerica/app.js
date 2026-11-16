/* Memoria numérica: se muestra un número unos segundos; luego hay que escribirlo. Cada acierto añade una cifra; dos fallos seguidos en el mismo nivel terminan el test. */
(function () {
  'use strict';
  var host = TT.app();
  if (!host) return;
  var INICIAL = 3;
  var estado = 'espera', nivel = INICIAL, mejor = 0, intento = 1, numero = '', fallos = 0, panel = null, t0 = 0, espera = 0, expo = 0, historial = [];
  var datos = TT.datos([['n', 'Cifras', String(INICIAL)], ['m', 'Mejor nivel', '—'], ['i', 'Intento', '1/2']]);
  var cifras = TT.h('p', { class: 'mn-cifras', 'aria-live': 'off' });
  var barra = TT.h('div', { class: 'mn-barra', 'aria-hidden': 'true' }, TT.h('i'));
  var mensaje = TT.h('p', { class: 'mn-mensaje', role: 'status' });
  var entrada = TT.h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', class: 'tt-campo mn-entrada', id: 'mn-entrada', 'aria-label': 'Número que has visto' });
  var bEnviar = TT.boton('Comprobar', function () { comprobar(); });
  var bSeguir = TT.boton('Continuar', function () { nuevo(); });
  var formulario = TT.h('div', { class: 'tt-fila tt-fila--centro' }, entrada, bEnviar);
  var inicio = TT.boton('Empezar', function () { empezar(); });
  var zona = TT.h('div', { class: 'tt-zona mn-zona' }, mensaje, cifras, barra, formulario, bSeguir, inicio);

  function generar(n) { var s = String(TT.azar(1, 9)); while (s.length < n) s += TT.azar(0, 9); return s; }
  function empezar() { estado = 'jugando'; nivel = INICIAL; intento = 1; mejor = 0; fallos = 0; historial = []; t0 = performance.now(); inicio.style.display = 'none'; nuevo(); }
  function nuevo() {
    window.clearTimeout(espera);
    numero = generar(nivel); expo = 600 + 450 * nivel;
    estado = 'mostrando';
    bSeguir.style.display = 'none'; formulario.style.display = 'none'; entrada.value = '';
    cifras.textContent = numero; cifras.setAttribute('data-numero', numero); cifras.classList.remove('mn-error', 'mn-oculto');
    mensaje.textContent = 'Memoriza el número…';
    datos.poner('n', String(nivel)); datos.poner('i', intento + '/2');
    var i = barra.firstChild; i.style.transition = 'none'; i.style.width = '100%';
    void i.offsetWidth; i.style.transition = 'width ' + expo + 'ms linear'; i.style.width = '0%';
    espera = window.setTimeout(ocultar, expo);
  }
  function ocultar() {
    estado = 'respuesta';
    cifras.textContent = '?'; cifras.removeAttribute('data-numero'); cifras.classList.add('mn-oculto');
    mensaje.textContent = 'Escribe el número que has visto y pulsa Intro.';
    formulario.style.display = '';
    entrada.focus({ preventScroll: true });
  }
  function comprobar() {
    if (estado !== 'respuesta') return;
    var dado = entrada.value.replace(/\s+/g, '');
    if (!dado) { mensaje.textContent = 'Escribe las cifras que recuerdes.'; entrada.focus(); return; }
    formulario.style.display = 'none';
    if (dado === numero) {
      historial.push([nivel, true]);
      mejor = Math.max(mejor, nivel); nivel++; intento = 1;
      datos.poner('m', String(mejor));
      mensaje.textContent = '¡Correcto!'; estado = 'pausa';
      espera = window.setTimeout(nuevo, 600);
    } else {
      historial.push([nivel, false]); fallos++;
      cifras.textContent = numero; cifras.classList.remove('mn-oculto'); cifras.classList.add('mn-error');
      mensaje.textContent = 'Era ' + numero + '. Tú escribiste ' + dado + '.';
      if (intento >= 2) { terminar(); return; }
      intento++; datos.poner('i', intento + '/2'); estado = 'pausa';
      bSeguir.style.display = ''; bSeguir.focus();
    }
  }
  entrada.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); comprobar(); } });
  function terminar() {
    estado = 'fin'; window.clearTimeout(espera);
    var seg = (performance.now() - t0) / 1000;
    var rango = TT.rango(mejor, [
      [0, 'Primer intento', 'Con tres cifras es fácil fallar por prisa. Prueba a agruparlas de dos en dos.'],
      [4, 'Memoria corriente', 'Un resultado habitual. Agrupar las cifras en bloques lo hace más fácil.'],
      [7, 'Buena memoria', 'Pasar de siete cifras ya pide técnica o práctica.'],
      [9, 'Muy buena memoria', 'Un resultado destacado.'],
      [11, 'Excelente', 'Muy por encima de lo habitual.'],
      [13, 'Prodigiosa', 'Un nivel de memoria entrenada.']]);
    window.setTimeout(function () {
      if (estado !== 'fin') return;
      panel = TT.resultado(host, { titulo: 'Tu memoria numérica', valor: mejor || '—', unidad: mejor ? 'cifras' : '', rango: rango,
        detalles: [['Niveles superados', historial.filter(function (h) { return h[1]; }).length], ['Intentos fallidos', fallos], ['Último número', numero], ['Duración', TT.fmt(seg, 0) + ' s']],
        copia: mejor ? 'He recordado un número de ' + mejor + ' cifras en el test de memoria numérica.' : null, alRepetir: reiniciar });
      TT.anunciar('Resultado: ' + (mejor ? mejor + ' cifras.' : 'ningún nivel superado.'));
      TT.enfocar(panel);
    }, 900);
    formulario.style.display = 'none'; bSeguir.style.display = 'none';
  }
  function reiniciar() {
    window.clearTimeout(espera); estado = 'espera';
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
    datos.poner('n', String(INICIAL)); datos.poner('m', '—'); datos.poner('i', '1/2');
    cifras.textContent = ''; cifras.removeAttribute('data-numero'); cifras.classList.remove('mn-error', 'mn-oculto');
    formulario.style.display = 'none'; bSeguir.style.display = 'none'; inicio.style.display = '';
    barra.firstChild.style.transition = 'none'; barra.firstChild.style.width = '0%';
    mensaje.textContent = 'Verás un número durante unos segundos. Después se oculta y tendrás que escribirlo. Empiezas con tres cifras y cada acierto añade una. Dos fallos seguidos en el mismo nivel terminan el test.';
  }
  bSeguir.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); nuevo(); } });
  host.appendChild(datos.nodo);
  host.appendChild(zona);
  reiniciar();
})();
