(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    function amortizacion(P, tin, n) {
      var r = tin / 1200, c = r === 0 ? P / n : P * r / (1 - Math.pow(1 + r, -n)), saldo = P, filas = [], ia = 0, ca = 0, cuotasA = 0, meses = 0;
      var agrupar = n > 24, hasta = 0;
      for (var m = 1; m <= n; m++) {
        var i = saldo * r, k = m === n ? saldo : c - i;
        saldo = m === n ? 0 : saldo - k; ia += i; ca += k; cuotasA += i + k; meses++;
        if (!agrupar || m % 12 === 0 || m === n) {
          filas.push([agrupar ? 'Año ' + Math.ceil(m / 12) : 'Mes ' + m, TH.eur(cuotasA), TH.eur(ia), TH.eur(ca), TH.eur(Math.max(0, saldo))]);
          ia = 0; ca = 0; cuotasA = 0; meses = 0;
        }
      }
      return { cuota: c, tabla: { titulo: agrupar ? 'Evolución año a año' : 'Evolución mes a mes', cab: [agrupar ? 'Año' : 'Mes', agrupar ? 'Pagado en el año' : 'Cuota', 'Intereses', 'Capital amortizado', 'Capital pendiente'], filas: filas, cabFila: true } };
    }

    function tae(P, comision, c, n, tin) {
      if (!comision) return (Math.pow(1 + tin / 1200, 12) - 1) * 100;
      var lo = 1e-9, hi = 1, mid, i;
      for (i = 0; i < 300; i++) { mid = (lo + hi) / 2; if (c * (1 - Math.pow(1 + mid, -n)) / mid > P - comision) lo = mid; else hi = mid; }
      return (Math.pow(1 + (lo + hi) / 2, 12) - 1) * 100;
    }
    TH.calculadora(raiz, {
      campos: [
        { id: 'importe', etiqueta: 'Importe del préstamo', unidad: '€', ph: '10.000' },
        { id: 'plazo', etiqueta: 'Plazo', ph: '48', entero: true },
        { id: 'unidad', tipo: 'select', etiqueta: 'Unidad del plazo', valor: 'meses', opciones: [['meses', 'Meses'], ['anios', 'Años']] },
        { id: 'tipo', etiqueta: 'Tipo de interés nominal anual (TIN)', unidad: '%', ph: '7' },
        { id: 'comision', etiqueta: 'Comisión de apertura (opcional)', unidad: '%', ph: '0', ayuda: 'Se calcula sobre el importe y se descuenta al recibir el dinero.' }
      ],
      ejemplo: { importe: '10000', plazo: '48', unidad: 'meses', tipo: '7', comision: '1' },
      calcular: function (v) {
        if (!TH.listos(v, ['importe', 'plazo', 'tipo'])) return { vacio: true };
        var n = Math.round(v.unidad === 'anios' ? v.plazo * 12 : v.plazo), com = isFinite(v.comision) ? v.comision : 0;
        if (v.importe <= 0) return { error: 'El importe del préstamo debe ser mayor que 0.' };
        if (n < 1 || n > 600) return { error: 'El plazo debe estar entre 1 mes y 50 años.' };
        if (v.tipo < 0 || v.tipo > 100) return { error: 'El tipo de interés debe estar entre 0 y 100 %.' };
        if (com < 0 || com > 20) return { error: 'La comisión de apertura debe estar entre 0 y 20 %.' };
        var a = amortizacion(v.importe, v.tipo, n), total = a.cuota * n, comEur = v.importe * com / 100;
        return { filas: [TH.fila('cuota', 'Cuota mensual', a.cuota, 'eur'), TH.fila('intereses', 'Intereses totales', total - v.importe, 'eur'), TH.fila('comision', 'Comisión de apertura', comEur, 'eur'),
            TH.fila('total', 'Total a devolver (cuotas más comisión)', total + comEur, 'eur'), TH.fila('tae', 'TAE aproximada', tae(v.importe, comEur, a.cuota, n, v.tipo), 'pct'), TH.fila('meses', 'Número de cuotas', n, 'n0')],
          tabla: a.tabla, notas: ['Cuota constante (sistema francés). La TAE incluye la comisión de apertura pero no seguros ni otros gastos. Compara siempre con la TAE y los gastos que figuran en la oferta de tu entidad.'] };
      }
    });
  });
})();
