(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.calculadora(raiz, {
      campos: [
        { id: 'a', etiqueta: 'A (numerador de la primera razón)', ph: '2' }, { id: 'b', etiqueta: 'B (denominador de la primera razón)', ph: '3' },
        { id: 'c', etiqueta: 'C (numerador de la segunda razón)', ph: '' }, { id: 'd', etiqueta: 'D (denominador de la segunda razón)', ph: '9' }
      ],
      ejemplo: { a: '2', b: '3', c: '', d: '9' },
      vacio: 'Deja en blanco el valor que buscas y rellena los otros tres. Si rellenas los cuatro, comprobamos si es una proporción.',
      calcular: function (v) {
        var ids = ['a', 'b', 'c', 'd'], vacios = ids.filter(function (k) { return isNaN(v[k]); });
        if (vacios.length > 1) return { vacio: true };
        var f = TH.fmt;
        if (vacios.length === 0) {
          if (v.b === 0 || v.d === 0) return { error: 'Los denominadores no pueden ser 0.' };
          var ok = Math.abs(v.a * v.d - v.b * v.c) < 1e-9 * Math.max(1, Math.abs(v.a * v.d));
          return { filas: [TH.fila('comprobacion', '¿Es una proporción?', ok ? 'Sí' : 'No', 'txt'), TH.fila('razon1', 'A ÷ B', v.a / v.b, 'n4'), TH.fila('razon2', 'C ÷ D', v.c / v.d, 'n4')],
            notas: ['Es una proporción si A × D = B × C. Aquí: ' + f(v.a * v.d, [0, 6]) + ' y ' + f(v.b * v.c, [0, 6]) + '.'] };
        }
        var k = vacios[0], x, formula;
        if (k === 'a') { if (v.d === 0) return { error: 'D no puede ser 0.' }; x = v.b * v.c / v.d; formula = 'A = B × C ÷ D'; }
        if (k === 'b') { if (v.c === 0) return { error: 'C no puede ser 0 para hallar B.' }; x = v.a * v.d / v.c; formula = 'B = A × D ÷ C'; }
        if (k === 'c') { if (v.b === 0) return { error: 'B no puede ser 0.' }; x = v.a * v.d / v.b; formula = 'C = A × D ÷ B'; }
        if (k === 'd') { if (v.a === 0) return { error: 'A no puede ser 0 para hallar D.' }; x = v.b * v.c / v.a; formula = 'D = B × C ÷ A'; }
        return { filas: [TH.fila('x', k.toUpperCase() + ' (el valor que falta)', x, 'n4')], notas: ['Se usa el producto cruzado: ' + formula + '.'] };
      }
    });
  });
})();
