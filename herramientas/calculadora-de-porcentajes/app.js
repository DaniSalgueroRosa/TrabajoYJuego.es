(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var h = TH.h;
    var BLOQUES = [
      { n: 1, titulo: '¿Cuánto es el X % de una cantidad?', campos: [{ id: 'p1', etiqueta: 'Porcentaje', unidad: '%', ph: '15' }, { id: 'c1', etiqueta: 'Cantidad', ph: '240' }],
        f: function (v) { return [TH.fila('r1', 'Resultado', v.c1 * v.p1 / 100, 'n2')]; } },
      { n: 2, titulo: '¿Qué porcentaje es una cantidad de otra?', campos: [{ id: 'a2', etiqueta: 'Parte', ph: '30' }, { id: 'b2', etiqueta: 'Total', ph: '120' }],
        f: function (v) { return v.b2 === 0 ? null : [TH.fila('r2', 'Porcentaje', v.a2 / v.b2 * 100, 'pct')]; } },
      { n: 3, titulo: 'Aumentar una cantidad un X %', campos: [{ id: 'p3', etiqueta: 'Porcentaje', unidad: '%', ph: '21' }, { id: 'c3', etiqueta: 'Cantidad', ph: '100' }],
        f: function (v) { return [TH.fila('r3', 'Cantidad aumentada', v.c3 * (1 + v.p3 / 100), 'n2'), TH.fila('r3d', 'Aumento', v.c3 * v.p3 / 100, 'n2')]; } },
      { n: 4, titulo: 'Disminuir una cantidad un X %', campos: [{ id: 'p4', etiqueta: 'Porcentaje', unidad: '%', ph: '20' }, { id: 'c4', etiqueta: 'Cantidad', ph: '80' }],
        f: function (v) { return [TH.fila('r4', 'Cantidad reducida', v.c4 * (1 - v.p4 / 100), 'n2'), TH.fila('r4d', 'Reducción', v.c4 * v.p4 / 100, 'n2')]; } },
      { n: 5, titulo: 'Variación porcentual entre dos valores', campos: [{ id: 'a5', etiqueta: 'Valor inicial', ph: '50' }, { id: 'b5', etiqueta: 'Valor final', ph: '65' }],
        f: function (v) { return v.a5 === 0 ? null : [TH.fila('r5', 'Variación', (v.b5 - v.a5) / Math.abs(v.a5) * 100, 'pct'), TH.fila('r5d', 'Diferencia', v.b5 - v.a5, 'n2')]; } },
      { n: 6, titulo: 'Si una cantidad es el X %, ¿cuál es el total?', campos: [{ id: 'a6', etiqueta: 'Cantidad conocida', ph: '45' }, { id: 'p6', etiqueta: 'Es el', unidad: '%', ph: '30' }],
        f: function (v) { return v.p6 === 0 ? null : [TH.fila('r6', 'Total (el 100 %)', v.a6 / v.p6 * 100, 'n2')]; } }
    ];
    TH.vaciar(raiz);
    BLOQUES.forEach(function (b) {
      var caja = h('section', { class: 'herr-bloque', 'aria-labelledby': 'pc-t' + b.n }, h('h3', { id: 'pc-t' + b.n, class: 'herr-bloque-titulo', texto: b.titulo }));
      var interior = h('div', {}); caja.appendChild(interior); raiz.appendChild(caja);
      TH.calculadora(interior, {
        campos: b.campos, vacio: 'Rellena los dos datos.',
        calcular: function (v) {
          if (!TH.listos(v, b.campos.map(function (c) { return c.id; }))) return { vacio: true };
          var f = b.f(v); if (!f) return { error: 'Con ese dato no se puede calcular: no se puede dividir entre cero.' };
          return { filas: f };
        }
      });
    });
  });
})();
