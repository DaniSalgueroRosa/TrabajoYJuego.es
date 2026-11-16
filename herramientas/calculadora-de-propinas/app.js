(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.calculadora(raiz, {
      campos: [
        { id: 'cuenta', etiqueta: 'Importe de la cuenta', unidad: '€', ph: '80' },
        { id: 'pct', tipo: 'select', etiqueta: 'Propina', valor: '10', opciones: [['0', 'Sin propina'], ['5', '5 %'], ['10', '10 %'], ['15', '15 %'], ['18', '18 %'], ['20', '20 %'], ['otro', 'Otro porcentaje']] },
        { id: 'otro', etiqueta: 'Otro porcentaje', unidad: '%', ph: '12', mostrarSi: function (v) { return v.pct === 'otro'; } },
        { id: 'personas', etiqueta: 'Personas que pagan', valor: '1', entero: true },
        { id: 'redondeo', tipo: 'select', etiqueta: 'Redondeo', valor: 'no', opciones: [['no', 'Sin redondear'], ['persona', 'Cada persona paga un euro entero (hacia arriba)'], ['total', 'El total se redondea al euro (hacia arriba)']] }
      ],
      ejemplo: { cuenta: '80', pct: '10', personas: '4', redondeo: 'no' },
      calcular: function (v) {
        var p = v.pct === 'otro' ? v.otro : +v.pct, n = v.personas;
        if (!TH.listos(v, ['cuenta', 'personas']) || !isFinite(p)) return { vacio: true };
        if (v.cuenta < 0) return { error: 'El importe de la cuenta no puede ser negativo.' };
        if (p < 0 || p > 100) return { error: 'La propina debe estar entre 0 y 100 %.' };
        if (n < 1 || n > 1000 || n !== Math.floor(n)) return { error: 'El número de personas debe ser un entero de 1 a 1.000.' };
        var total = v.cuenta * (1 + p / 100), pagar;
        if (v.redondeo === 'persona') pagar = Math.ceil(Math.round(total / n * 1000) / 1000) * n; else if (v.redondeo === 'total') pagar = Math.ceil(Math.round(total * 1000) / 1000); else pagar = total;
        var propina = pagar - v.cuenta;
        return { filas: [TH.fila('persona', n > 1 ? 'Cada persona paga' : 'Total a pagar', pagar / n, 'eur'), TH.fila('total', 'Total con propina', pagar, 'eur'), TH.fila('propina', 'Propina', propina, 'eur'),
            TH.fila('propina-persona', 'Propina por persona', propina / n, 'eur'), TH.fila('pct-real', 'Propina sobre la cuenta', v.cuenta > 0 ? propina / v.cuenta * 100 : 0, 'pct')],
          notas: v.redondeo === 'no' ? [] : ['Con el redondeo, la propina real es algo mayor que el porcentaje elegido.'] };
      }
    });
  });
})();
