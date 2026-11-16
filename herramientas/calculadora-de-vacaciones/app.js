(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    function bisiesto(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
    TH.calculadora(raiz, {
      campos: [
        { id: 'inicio', tipo: 'fecha', etiqueta: 'Desde (inicio del año o del contrato)' },
        { id: 'hasta', tipo: 'fecha', etiqueta: 'Hasta (hoy o el último día de trabajo)', valor: 'hoy' },
        { id: 'anual', tipo: 'select', etiqueta: 'Vacaciones al año', valor: '30', opciones: [['30', '30 días naturales (mínimo legal)'], ['22', '22 días laborables'], ['otro', 'Otro número de días']] },
        { id: 'otro', etiqueta: 'Días de vacaciones al año', unidad: 'días', ph: '25', mostrarSi: function (v) { return v.anual === 'otro'; } },
        { id: 'tomados', etiqueta: 'Días ya disfrutados', unidad: 'días', ph: '0' },
        { id: 'bruto', etiqueta: 'Sueldo bruto anual (para calcular la compensación)', unidad: '€', ph: '24.000', ayuda: 'Opcional. Se usa para valorar los días pendientes si cuentan en días naturales.' }
      ],
      ejemplo: { inicio: '2026-01-01', hasta: '2026-06-30', anual: '30', tomados: '10', bruto: '24000' },
      vacio: 'Indica desde cuándo trabajas y hasta qué fecha para ver tus vacaciones generadas.',
      calcular: function (v) {
        if (!v.inicio || !v.hasta) return { vacio: true };
        var a = TH.fechaUTC(v.inicio), b = TH.fechaUTC(v.hasta), anual = v.anual === 'otro' ? v.otro : +v.anual, tomados = isFinite(v.tomados) ? v.tomados : 0, y;
        if (!a || !b) return { error: 'Escribe fechas válidas.' };
        if (a > b) return { error: 'La fecha de inicio es posterior a la de fin. Revisa las fechas.' };
        if (!isFinite(anual) || anual <= 0 || anual > 366) return { error: 'Los días de vacaciones al año deben estar entre 1 y 366.' };
        if (tomados < 0) return { error: 'Los días disfrutados no pueden ser negativos.' };
        if (TH.dias(a, b) > 36500) return { error: 'El periodo no puede superar los 100 años.' };
        var dev = 0;
        for (y = a.getUTCFullYear(); y <= b.getUTCFullYear(); y++) {
          var ini = a > new Date(Date.UTC(y, 0, 1, 12)) ? a : new Date(Date.UTC(y, 0, 1, 12)), fin = b < new Date(Date.UTC(y, 11, 31, 12)) ? b : new Date(Date.UTC(y, 11, 31, 12));
          if (ini <= fin) dev += anual * (TH.dias(ini, fin) + 1) / (bisiesto(y) ? 366 : 365);
        }
        var pend = dev - tomados, filas = [TH.fila('generadas', 'Vacaciones generadas', dev, 'n2'), TH.fila('pendientes', pend >= 0 ? 'Vacaciones pendientes de disfrutar' : 'Días disfrutados de más', pend >= 0 ? pend : -pend, 'n2'), TH.fila('por-mes', 'Se generan al mes', anual / 12, 'n2')], notas = [];
        filas[1].v = pend; filas[1].f = TH.fmt(Math.abs(pend), 2);
        if (isFinite(v.bruto) && v.bruto > 0 && v.anual === '30') { var dia = v.bruto / 365; filas.push(TH.fila('dia', 'Valor de un día natural de sueldo', dia, 'eur')); filas.push(TH.fila('compensacion', pend > 0 ? 'Compensación por los días pendientes' : 'Descuento por los días de más', Math.abs(pend) * dia, 'eur')); }
        else if (isFinite(v.bruto) && v.bruto > 0) notas.push('La compensación económica solo se calcula cuando las vacaciones se cuentan en días naturales; con días laborables depende de tu convenio.');
        if (pend < 0) notas.push('Has disfrutado más días de los que has generado hasta esta fecha. Según tu contrato o convenio, la empresa podría descontarlos del finiquito.');
        notas.push('Cálculo proporcional por días trabajados, año a año. Tu convenio o contrato puede fijar otro método de devengo, los días pendientes se pueden redondear de otra forma y, si causas baja, las vacaciones no disfrutadas por una situación como una incapacidad pueden tener un tratamiento especial.');
        return { filas: filas, notas: notas };
      }
    });
  });
})();
