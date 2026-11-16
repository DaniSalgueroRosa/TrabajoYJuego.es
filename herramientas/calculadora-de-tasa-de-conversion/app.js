(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    (function () {
      var z = function (x) { return typeof x === 'number' && isFinite(x) ? x : 0; };
      TH.calculadora(raiz, {
        campos: [
          { id: 'visitas', etiqueta: 'Visitas', unidad: 'visitas', ph: '8000', entero: true },
          { id: 'conv', etiqueta: 'Conversiones', unidad: 'conversiones', ph: '240', entero: true },
          { id: 'valor', etiqueta: 'Valor medio de cada conversión (opcional)', unidad: '€', ph: '45' },
          { id: 'objetivo', etiqueta: 'Tasa de conversión objetivo (opcional)', unidad: '%', ph: '4' },
          { id: 'ventas', etiqueta: 'Conversiones que quieres conseguir (opcional)', unidad: 'conversiones', ph: '400', entero: true }
        ],
        ejemplo: { visitas: '8000', conv: '240', valor: '45', objetivo: '4', ventas: '400' },
        calcular: function (v) {
          if (!TH.listos(v, ['visitas', 'conv'])) return { vacio: true };
          var val = z(v.valor), ob = z(v.objetivo), vt = z(v.ventas);
          if (v.visitas < 1 || v.visitas !== Math.floor(v.visitas) || v.conv < 0 || v.conv !== Math.floor(v.conv)) return { error: 'Las visitas y las conversiones deben ser números enteros, con al menos una visita.' };
          if (v.conv > v.visitas) return { error: 'Las conversiones no pueden superar a las visitas.' };
          if (val < 0 || ob < 0 || ob > 100 || vt < 0) return { error: 'El valor y el objetivo no pueden ser negativos, y la tasa objetivo debe estar entre 0 y 100 %.' };
          var p = v.conv / v.visitas, n = v.visitas, zz = 1.96, d = 1 + zz * zz / n, c = (p + zz * zz / (2 * n)) / d, m = zz * Math.sqrt(p * (1 - p) / n + zz * zz / (4 * n * n)) / d;
          var filas = [TH.fila('tasa', 'Tasa de conversión', p * 100, 'pct'), TH.fila('ic-bajo', 'Intervalo de confianza 95 %: desde', Math.max(0, c - m) * 100, 'pct'), TH.fila('ic-alto', 'Intervalo de confianza 95 %: hasta', Math.min(1, c + m) * 100, 'pct')], avisos = [];
          if (v.conv < 30) avisos.push('Con menos de 30 conversiones el dato es poco fiable: fíjate en el intervalo antes de sacar conclusiones.');
          if (val > 0) filas.push(TH.fila('ingresos', 'Ingresos totales', v.conv * val, 'eur'), TH.fila('por-visita', 'Ingresos por visita', v.conv * val / v.visitas, 'eur'));
          if (ob > 0) {
            var cob = v.visitas * ob / 100; filas.push(TH.fila('conv-objetivo', 'Conversiones con la tasa objetivo', cob, 'n0'), TH.fila('conv-extra', 'Conversiones adicionales', cob - v.conv, 'n0'));
            if (val > 0) filas.push(TH.fila('ingresos-extra', 'Ingresos adicionales', (cob - v.conv) * val, 'eur'));
          }
          if (vt > 0 && p > 0) filas.push(TH.fila('visitas-necesarias', 'Visitas necesarias para ' + vt + ' conversiones', Math.ceil(vt / p - 1e-9), 'n0'));
          return { filas: filas, avisos: avisos, notas: ['Intervalo de Wilson al 95 %. Mide con la misma definición de visita y de conversión en todos los periodos.'] };
        }
      });
    })();
  });
})();
