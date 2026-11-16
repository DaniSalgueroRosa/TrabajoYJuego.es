(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/negocio.js').then(function () {
      var N = TH.negocio, z = N.n0;
      TH.calculadora(raiz, {
        campos: [
          { id: 'importe', etiqueta: 'Importe de la financiación', unidad: '€', ph: '50000' },
          { id: 'meses', etiqueta: 'Plazo total', unidad: 'meses', ph: '60', entero: true },
          { id: 'tin', etiqueta: 'Tipo de interés nominal anual (TIN)', unidad: '%', ph: '6' },
          { id: 'apertura', etiqueta: 'Comisión de apertura', unidad: '%', ph: '1', ayuda: 'Porcentaje sobre el importe, si la hay.' },
          { id: 'gastos', etiqueta: 'Gastos de estudio, notaría y otros', unidad: '€', ph: '300', ayuda: 'Pagos únicos que no forman parte del préstamo.' },
          { id: 'carencia', etiqueta: 'Meses de carencia (solo intereses)', unidad: 'meses', ph: '6', entero: true },
          { id: 'impuesto', etiqueta: 'Tipo impositivo para el coste neto (opcional)', unidad: '%', ph: '25' },
          { id: 'ebitda', etiqueta: 'Beneficio operativo anual (opcional)', unidad: '€', ph: '24000', ayuda: 'Para comprobar si tu negocio cubre la deuda.' }
        ],
        ejemplo: { importe: '50000', meses: '60', tin: '6', apertura: '1', gastos: '300', carencia: '6', impuesto: '25', ebitda: '24000' },
        calcular: function (v) {
          if (!TH.listos(v, ['importe', 'meses', 'tin'])) return { vacio: true };
          var car = z(v.carencia), ap = z(v.apertura), gs = z(v.gastos), imp = z(v.impuesto), eb = z(v.ebitda);
          if (v.importe <= 0) return { error: 'El importe debe ser mayor que 0.' };
          if (v.meses < 1 || v.meses > 360 || v.meses !== Math.floor(v.meses)) return { error: 'El plazo debe ser un número entero de meses entre 1 y 360.' };
          if (v.tin < 0 || v.tin > 40) return { error: 'El tipo de interés debe estar entre 0 y 40 %.' };
          if (car < 0 || car >= v.meses || car !== Math.floor(car)) return { error: 'La carencia debe ser un número entero de meses y menor que el plazo total.' };
          if (ap < 0 || ap > 20 || gs < 0) return { error: 'La comisión de apertura debe estar entre 0 y 20 % y los gastos no pueden ser negativos.' };
          if (imp < 0 || imp > 100) return { error: 'El tipo impositivo debe estar entre 0 y 100 %.' };
          var p = N.prestamo({ importe: v.importe, tin: v.tin, meses: v.meses, carencia: car, apertura: ap, gastos: gs }), cu = p.cuadro;
          var filas = [TH.fila('cuota', 'Cuota mensual' + (car ? ' (tras la carencia)' : ''), cu.cuota, 'eur')];
          if (car) filas.push(TH.fila('cuota-carencia', 'Cuota durante la carencia (solo intereses)', cu.cuotaCarencia, 'eur'));
          filas.push(TH.fila('intereses', 'Intereses totales', cu.intereses, 'eur'), TH.fila('comisiones', 'Comisión de apertura y gastos', p.apertura, 'eur'), TH.fila('coste-total', 'Coste total de la financiación', p.coste, 'eur'),
            TH.fila('total', 'Total a devolver más gastos', v.importe + p.coste, 'eur'), TH.fila('tae', 'TAE', p.tae, 'pct'));
          if (imp > 0) filas.push(TH.fila('coste-neto', 'Coste tras el ahorro fiscal estimado', p.coste * (1 - imp / 100), 'eur'));
          var avisos = [];
          if (eb > 0) {
            var anual = cu.cuota * 12, dscr = eb / anual;
            filas.push(TH.fila('dscr', 'Cobertura de la deuda (beneficio operativo ÷ pagos del año)', dscr, 'n2'));
            if (dscr < 1) avisos.push('Con ese beneficio operativo, los pagos del préstamo superan lo que el negocio genera: tendrías que cubrirlos con otras fuentes.');
            else if (dscr < 1.2) avisos.push('La cobertura es justa: un bache de ventas podría dificultar el pago de la cuota.');
          }
          var anios = Math.ceil(v.meses / 12), tabla = [], a, k, pa, ia, ca;
          for (a = 1; a <= anios; a++) {
            pa = 0; ia = 0; ca = 0;
            for (k = (a - 1) * 12; k < Math.min(a * 12, v.meses); k++) { pa += cu.filas[k].pago; ia += cu.filas[k].interes; ca += cu.filas[k].capital; }
            tabla.push(['Año ' + a, TH.eur(pa), TH.eur(ia), TH.eur(ca), TH.eur(cu.filas[Math.min(a * 12, v.meses) - 1].saldo)]);
          }
          return { filas: filas, avisos: avisos, tabla: { titulo: 'Evolución año a año', cab: ['Año', 'Pagado en el año', 'Intereses', 'Capital amortizado', 'Capital pendiente'], filas: tabla, cabFila: true },
            notas: ['Préstamo de cuota constante con tipo fijo. La TAE tiene en cuenta la comisión y los gastos. El ahorro fiscal supone que los intereses y las comisiones son deducibles en tu caso: confírmalo con tu asesor.'] };
        }
      });
    }, function () {
      var p = document.createElement('p'); p.className = 'herr-estado herr-estado--error'; p.setAttribute('role', 'alert');
      p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.'; TH.vaciar(raiz).appendChild(p);
    });
  });
})();
