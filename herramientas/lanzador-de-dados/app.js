(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/azar.js').then(function () {
      var A = TH.azar, cg = raiz.querySelector('#herr-carga');
      if (cg) cg.remove();

      var h = TH.h, historial = [];
      var CARAS = [[4, 'd4 · 4 caras'], [6, 'd6 · 6 caras (el dado normal)'], [8, 'd8 · 8 caras'], [10, 'd10 · 10 caras'], [12, 'd12 · 12 caras'], [20, 'd20 · 20 caras'], [100, 'd100 · porcentual']];
      var PUNTOS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
      var dado = h('select', { id: 'c-dado' }, CARAS.map(function (c) { return h('option', { value: String(c[0]), selected: c[0] === 6 }, c[1]); }));
      var cantidad = h('input', { id: 'c-cantidad', type: 'text', inputmode: 'numeric', value: '2', autocomplete: 'off' });
      var modificador = h('input', { id: 'c-modificador', type: 'text', inputmode: 'numeric', value: '0', autocomplete: 'off' });
      var salida = h('div', { class: 'herr-salida', 'aria-live': 'polite' });
      var tirada = h('div', { class: 'dados', 'aria-label': 'Dados lanzados' });
      function campo(id, et, el, ayuda) { return h('div', { class: 'campo' }, h('label', { for: id, texto: et }), el, ayuda ? h('span', { class: 'campo-ayuda', texto: ayuda }) : null); }
      raiz.appendChild(h('div', { class: 'herr-campos' }, campo('c-dado', 'Tipo de dado', dado), campo('c-cantidad', 'Cuántos dados', cantidad, 'De 1 a 20.'), campo('c-modificador', 'Modificador', modificador, 'Se suma al total. De -100 a 100.')));
      raiz.appendChild(h('div', { class: 'herr-acciones' }, h('button', { class: 'boton', type: 'button', id: 'l-lanzar', onclick: lanzar }, 'Lanzar')));
      raiz.appendChild(tirada); raiz.appendChild(salida);
      function cara(v, caras, i) {
        var d = h('div', { class: 'dado dado--d' + caras, role: 'img', 'aria-label': 'Dado ' + (i + 1) + ': ' + v });
        if (caras === 6) { var p = PUNTOS[v], k; d.classList.add('dado--puntos'); for (k = 0; k < 9; k++) d.appendChild(h('i', { class: p.indexOf(k) >= 0 ? 'on' : '' })); }
        else { d.appendChild(h('span', { class: 'dado-num', 'aria-hidden': 'true', texto: String(v) })); d.appendChild(h('span', { class: 'dado-tipo', 'aria-hidden': 'true', texto: 'd' + caras })); }
        return d;
      }
      function lanzar() {
        TH.vaciar(salida); TH.vaciar(tirada);
        var caras = +dado.value, n = TH.num(cantidad.value), m = TH.num(modificador.value), i;
        function aviso(t) { salida.appendChild(h('p', { class: 'herr-estado herr-estado--aviso', role: 'status', texto: t })); }
        if (!(n >= 1 && n <= 20) || n !== Math.floor(n)) return aviso('Indica cuántos dados quieres con un número entero de 1 a 20.');
        if (!isFinite(m) || m !== Math.floor(m) || Math.abs(m) > 100) return aviso('El modificador debe ser un número entero de -100 a 100.');
        var valores = [], suma = 0;
        for (i = 0; i < n; i++) { var v = A.entre(1, caras); valores.push(v); suma += v; tirada.appendChild(cara(v, caras, i)); }
        var total = suma + m;
        historial.unshift(total); historial = historial.slice(0, 10);
        var filas = [TH.fila('dados', 'Dados', valores.join(' + '), 'txt'), TH.fila('suma', 'Suma de los dados', suma, 'n0')];
        if (m) filas.push(TH.fila('modificador', 'Modificador', m, function (x) { return (x > 0 ? '+' : '−') + TH.fmt(Math.abs(x), 0); }));
        filas.push(TH.fila('total', 'Total', total, 'n0'));
        if (n === 1 && caras === 20 && valores[0] === 20) filas.push(TH.fila('nota', 'Resultado especial', 'Máximo del dado (20 natural)', 'txt'));
        if (n === 1 && caras === 20 && valores[0] === 1) filas.push(TH.fila('nota', 'Resultado especial', 'Mínimo del dado (1 natural)', 'txt'));
        filas.push(TH.fila('historial', 'Últimos totales (el más reciente primero)', historial.join(' · '), 'txt'));
        var dl = h('dl', { class: 'herr-res' });
        filas.forEach(function (f) { dl.appendChild(h('div', { class: 'herr-fila' }, h('dt', { texto: f.t }), h('dd', { 'data-k': f.k, 'data-v': String(f.v), texto: f.f }))); });
        salida.appendChild(dl);
        TH.anunciar('Total ' + total);
      }
      salida.appendChild(h('p', { class: 'herr-vacio', texto: 'Elige el dado y pulsa Lanzar.' }));

    }, function () { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); });
  });
})();
