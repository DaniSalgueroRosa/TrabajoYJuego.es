(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var FREQ = { '12': ['mensual', 'cada mes'], '4': ['trimestral', 'cada trimestre'], '2': ['semestral', 'cada semestre'], '1': ['anual', 'cada año'] };
    TH.calculadora(raiz, {
      campos: [
        { id: 'inicial', etiqueta: 'Capital inicial', unidad: '€', ph: '5.000' },
        { id: 'aporte', etiqueta: 'Aportación periódica', unidad: '€', ph: '200', ayuda: 'Déjalo vacío si no vas a añadir más dinero.' },
        { id: 'freq', tipo: 'select', etiqueta: 'Frecuencia de aportación y capitalización', valor: '12', opciones: [['12', 'Mensual'], ['4', 'Trimestral'], ['2', 'Semestral'], ['1', 'Anual']] },
        { id: 'tasa', etiqueta: 'Rentabilidad anual', unidad: '%', ph: '5' },
        { id: 'anios', etiqueta: 'Duración', unidad: 'años', ph: '10', entero: true },
        { id: 'inicio', tipo: 'check', etiqueta: 'Aporto al principio de cada periodo (por defecto, al final)', valor: false }
      ],
      ejemplo: { inicial: '5000', aporte: '200', freq: '12', tasa: '5', anios: '10' },
      calcular: function (v) {
        var ap = isFinite(v.aporte) ? v.aporte : 0, ini = isFinite(v.inicial) ? v.inicial : 0;
        if (!TH.listos(v, ['tasa', 'anios']) || (ini === 0 && ap === 0)) return { vacio: true };
        if (ini < 0 || ap < 0) return { error: 'El capital y las aportaciones no pueden ser negativos.' };
        if (v.tasa < -50 || v.tasa > 100) return { error: 'La rentabilidad anual debe estar entre −50 % y 100 %.' };
        if (v.anios < 1 || v.anios > 100) return { error: 'La duración debe estar entre 1 y 100 años.' };
        var m = +v.freq, i = v.tasa / 100 / m, filas = [], bal = ini, aportado = ini, n = Math.round(v.anios * m), p;
        for (p = 1; p <= n; p++) {
          bal = v.inicio ? (bal + ap) * (1 + i) : bal * (1 + i) + ap; aportado += ap;
          if (p % m === 0 || p === n) filas.push(['Año ' + Math.ceil(p / m), TH.eur(aportado), TH.eur(bal - aportado), TH.eur(bal)]);
        }
        return { filas: [TH.fila('final', 'Capital final', bal, 'eur'), TH.fila('aportado', 'Total aportado (capital inicial más aportaciones)', aportado, 'eur'), TH.fila('intereses', 'Intereses ganados', bal - aportado, 'eur'),
            TH.fila('multiplo', 'Veces el dinero aportado', aportado > 0 ? bal / aportado : 0, 'n2')],
          tabla: { titulo: 'Evolución año a año', cab: ['Año', 'Aportado hasta ahora', 'Intereses acumulados', 'Capital'], filas: filas, cabFila: true },
          notas: ['Resultado teórico con rentabilidad constante, sin impuestos, comisiones ni inflación. Las inversiones reales fluctúan y pueden dar pérdidas.'] };
      }
    });
  });
})();
