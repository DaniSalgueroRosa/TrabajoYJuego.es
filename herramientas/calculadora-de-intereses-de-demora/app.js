(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    (function () {
      var z = function (x) { return typeof x === 'number' && isFinite(x) ? x : 0; };
      TH.calculadora(raiz, {
        campos: [
          { id: 'importe', etiqueta: 'Importe impagado', unidad: '€', ph: '6000' },
          { id: 'venc', tipo: 'fecha', etiqueta: 'Fecha de vencimiento de la factura' },
          { id: 'pago', tipo: 'fecha', etiqueta: 'Calcular hasta (pago o reclamación)', valor: 'hoy' },
          { id: 'tipo', etiqueta: 'Tipo de interés de demora', unidad: '% anual', valor: '10,4', ayuda: 'Tipo legal del 2.º semestre de 2026: tipo del BCE (2,40 %) más 8 puntos.' },
          { id: 'cambio', tipo: 'fecha', etiqueta: 'Fecha en que cambia el tipo (opcional)' },
          { id: 'tipo2', etiqueta: 'Nuevo tipo desde esa fecha (opcional)', unidad: '% anual', ph: '10,15' },
          { id: 'indem', tipo: 'check', etiqueta: 'Añadir la indemnización de 40 € por costes de cobro', valor: true }
        ],
        ejemplo: { importe: '6000', venc: '2026-07-10', pago: '2026-10-08', tipo: '10,4', indem: true },
        calcular: function (v) {
          if (!TH.listos(v, ['importe', 'tipo']) || !v.venc || !v.pago) return { vacio: true };
          var a = TH.fechaUTC(v.venc), b = TH.fechaUTC(v.pago), c = v.cambio ? TH.fechaUTC(v.cambio) : null;
          if (!a || !b) return { error: 'Escribe fechas válidas.' };
          if (v.importe <= 0 || v.tipo < 0 || v.tipo > 100) return { error: 'El importe debe ser mayor que 0 y el tipo debe estar entre 0 y 100 %.' };
          if (b <= a) return { error: 'La fecha de pago o reclamación debe ser posterior al vencimiento para que haya intereses.' };
          var dias = TH.dias(a, b), interes, tramos = [], avisos = [];
          if (c && isFinite(v.tipo2)) {
            if (v.tipo2 < 0 || v.tipo2 > 100) return { error: 'El nuevo tipo debe estar entre 0 y 100 %.' };
            if (c <= a || c >= b) return { error: 'La fecha de cambio de tipo debe estar entre el vencimiento y la fecha de cálculo.' };
            var d1 = TH.dias(a, c), d2 = TH.dias(c, b), i1 = v.importe * v.tipo / 100 * d1 / 365, i2 = v.importe * v.tipo2 / 100 * d2 / 365;
            interes = i1 + i2; tramos = [['Primer tramo', d1 + ' días', TH.fmt(v.tipo, [0, 2]) + ' %', TH.eur(i1)], ['Segundo tramo', d2 + ' días', TH.fmt(v.tipo2, [0, 2]) + ' %', TH.eur(i2)]];
          } else { interes = v.importe * v.tipo / 100 * dias / 365; tramos = [['Todo el periodo', dias + ' días', TH.fmt(v.tipo, [0, 2]) + ' %', TH.eur(interes)]]; }
          var ind = v.indem ? 40 : 0, tot = v.importe + interes + ind;
          var filas = [TH.fila('total', 'Total reclamable', tot, 'eur'), TH.fila('intereses', 'Intereses de demora', interes, 'eur'), TH.fila('dias', 'Días de demora', dias, 'n0'), TH.fila('indemnizacion', 'Indemnización por costes de cobro', ind, 'eur'), TH.fila('principal', 'Importe impagado', v.importe, 'eur'),
            TH.fila('interes-diario', 'Interés por cada día adicional', v.importe * (isFinite(v.tipo2) && c && c < b ? v.tipo2 : v.tipo) / 100 / 365, 'eur')];
          return { filas: filas, avisos: avisos, tabla: { titulo: 'Cálculo por tramos', cab: ['Tramo', 'Días', 'Tipo anual', 'Intereses'], filas: tramos, cabFila: true },
            notas: ['Interés simple sobre 365 días, desde el día siguiente al vencimiento. Solo para operaciones comerciales entre empresas o con la Administración. Estimación: no sustituye el asesoramiento jurídico.'] };
        }
      });
    })();
  });
})();
