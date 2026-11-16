(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.calculadora(raiz, {
      campos: [
        { id: 'modo', tipo: 'select', etiqueta: '¿Qué quieres calcular?', valor: 'inversion', ancho: 'completo', opciones: [['inversion', 'Rentabilidad de una inversión (acciones, fondos, negocio…)'], ['alquiler', 'Rentabilidad de un piso en alquiler']] },
        { id: 'inicial', etiqueta: 'Dinero invertido', unidad: '€', ph: '10.000', mostrarSi: function (v) { return v.modo === 'inversion'; } },
        { id: 'final', etiqueta: 'Valor actual o final', unidad: '€', ph: '12.500', mostrarSi: function (v) { return v.modo === 'inversion'; } },
        { id: 'ingresos', etiqueta: 'Ingresos recibidos (dividendos, intereses…)', unidad: '€', ph: '0', mostrarSi: function (v) { return v.modo === 'inversion'; } },
        { id: 'costes', etiqueta: 'Comisiones y gastos', unidad: '€', ph: '0', mostrarSi: function (v) { return v.modo === 'inversion'; } },
        { id: 'anios', etiqueta: 'Tiempo que has mantenido la inversión', unidad: 'años', ph: '3', mostrarSi: function (v) { return v.modo === 'inversion'; } },
        { id: 'precio', etiqueta: 'Precio de compra del piso', unidad: '€', ph: '150.000', mostrarSi: function (v) { return v.modo === 'alquiler'; } },
        { id: 'gcompra', etiqueta: 'Impuestos y gastos de la compra', unidad: '€', ph: '15.000', mostrarSi: function (v) { return v.modo === 'alquiler'; }, ayuda: 'ITP o IVA, notaría, registro, gestoría, tasación…' },
        { id: 'reforma', etiqueta: 'Reforma y mobiliario', unidad: '€', ph: '5.000', mostrarSi: function (v) { return v.modo === 'alquiler'; } },
        { id: 'alquiler', etiqueta: 'Alquiler mensual', unidad: '€', ph: '800', mostrarSi: function (v) { return v.modo === 'alquiler'; } },
        { id: 'meses', etiqueta: 'Meses alquilado al año', unidad: 'meses', valor: '12', entero: true, mostrarSi: function (v) { return v.modo === 'alquiler'; } },
        { id: 'gastos', etiqueta: 'Gastos anuales del propietario', unidad: '€', ph: '2.500', mostrarSi: function (v) { return v.modo === 'alquiler'; }, ayuda: 'IBI, comunidad, seguros, mantenimiento, impuestos sobre el alquiler…' }
      ],
      ejemplo: { modo: 'inversion', inicial: '10000', final: '12500', ingresos: '300', costes: '50', anios: '3' },
      calcular: function (v) {
        var n = function (x) { return isFinite(x) ? x : 0; };
        if (v.modo === 'inversion') {
          if (!TH.listos(v, ['inicial', 'final', 'anios'])) return { vacio: true };
          if (v.inicial <= 0) return { error: 'El dinero invertido debe ser mayor que 0.' };
          if (v.final < 0 || n(v.ingresos) < 0 || n(v.costes) < 0) return { error: 'Los importes no pueden ser negativos.' };
          if (v.anios <= 0 || v.anios > 100) return { error: 'El tiempo debe ser mayor que 0 y no superar 100 años.' };
          var rec = v.final + n(v.ingresos) - n(v.costes), gan = rec - v.inicial, tot = gan / v.inicial * 100, anual = rec <= 0 ? -100 : (Math.pow(rec / v.inicial, 1 / v.anios) - 1) * 100;
          return { filas: [TH.fila('anual', 'Rentabilidad anualizada', anual, 'pct'), TH.fila('total', 'Rentabilidad total', tot, 'pct'), TH.fila('ganancia', gan >= 0 ? 'Ganancia' : 'Pérdida', gan, 'eur')],
            notas: ['La rentabilidad anualizada supone un crecimiento constante cada año y que los ingresos se reciben al final. No incluye impuestos ni inflación.'] };
        }
        if (!TH.listos(v, ['precio', 'alquiler'])) return { vacio: true };
        var m = isFinite(v.meses) ? v.meses : 12;
        if (v.precio <= 0 || v.alquiler < 0) return { error: 'El precio debe ser mayor que 0 y el alquiler no puede ser negativo.' };
        if (n(v.gcompra) < 0 || n(v.reforma) < 0 || n(v.gastos) < 0) return { error: 'Los importes no pueden ser negativos.' };
        if (m < 0 || m > 12) return { error: 'Los meses alquilados al año deben estar entre 0 y 12.' };
        var inv = v.precio + n(v.gcompra) + n(v.reforma), ing = v.alquiler * m, neto = ing - n(v.gastos), filas = [TH.fila('neta', 'Rentabilidad neta anual', neto / inv * 100, 'pct'), TH.fila('bruta', 'Rentabilidad bruta anual', ing / inv * 100, 'pct'),
          TH.fila('inversion', 'Inversión total', inv, 'eur'), TH.fila('beneficio', 'Beneficio neto anual', neto, 'eur')];
        if (neto > 0) filas.push(TH.fila('recuperacion', 'Años para recuperar la inversión', inv / neto, 'n1'));
        return { filas: filas, notas: ['La rentabilidad bruta divide los ingresos anuales entre la inversión total; la neta resta antes los gastos anuales. No incluye la posible revalorización del piso, la hipoteca ni el IRPF del alquiler.'] };
      }
    });
  });
})();
