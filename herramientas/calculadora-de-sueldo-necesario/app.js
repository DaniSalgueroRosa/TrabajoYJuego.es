(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/negocio.js').then(function () {
      var N = TH.negocio, z = N.n0;
      function emp(v) { return v.modo === 'empleado'; }
      TH.calculadora(raiz, {
        campos: [
          { id: 'modo', tipo: 'select', etiqueta: '¿Cómo trabajas?', valor: 'empleado', ancho: 'completo', opciones: [['empleado', 'Por cuenta ajena (con nómina)'], ['autonomo', 'Por cuenta propia (autónomo)']] },
          { id: 'vivienda', etiqueta: 'Vivienda: alquiler o hipoteca, comunidad y suministros', unidad: '€ al mes', ph: '800' },
          { id: 'comida', etiqueta: 'Alimentación', unidad: '€ al mes', ph: '300' },
          { id: 'transporte', etiqueta: 'Transporte', unidad: '€ al mes', ph: '120' },
          { id: 'otros', etiqueta: 'Ocio, salud, ropa y otros gastos', unidad: '€ al mes', ph: '250' },
          { id: 'deudas', etiqueta: 'Cuotas de préstamos y deudas', unidad: '€ al mes', ph: '150' },
          { id: 'ahorro', etiqueta: 'Ahorro que quieres conseguir', unidad: '€ al mes', ph: '200' },
          { id: 'colchon', etiqueta: 'Margen para imprevistos', unidad: '%', valor: '10', ayuda: 'Se suma a tus gastos para no ir justo. Pon 0 si no lo quieres.' },
          { id: 'pagas', tipo: 'select', etiqueta: 'Número de pagas', valor: '14', opciones: [['12', '12 pagas (extras prorrateadas)'], ['14', '14 pagas (dos extras)']], mostrarSi: emp },
          { id: 'cuota', etiqueta: 'Cuota de autónomos', unidad: '€ al mes', ph: '300', mostrarSi: function (v) { return !emp(v); } },
          { id: 'gastosNegocio', etiqueta: 'Gastos del negocio (sin IVA)', unidad: '€ al mes', ph: '400', mostrarSi: function (v) { return !emp(v); } },
          { id: 'irpf', etiqueta: 'IRPF estimado sobre tu beneficio', unidad: '%', ph: '20', mostrarSi: function (v) { return !emp(v); } },
          { id: 'horas', etiqueta: 'Horas que puedes facturar al mes (opcional)', unidad: 'h', ph: '100', mostrarSi: function (v) { return !emp(v); } }
        ],
        ejemplo: { modo: 'empleado', vivienda: '800', comida: '300', transporte: '120', otros: '250', deudas: '150', ahorro: '200', colchon: '10', pagas: '14' },
        calcular: function (v) {
          var gastos = z(v.vivienda) + z(v.comida) + z(v.transporte) + z(v.otros) + z(v.deudas);
          if (gastos <= 0) return { vacio: true };
          var col = z(v.colchon), ah = z(v.ahorro);
          if ([v.vivienda, v.comida, v.transporte, v.otros, v.deudas, v.ahorro].some(function (x) { return z(x) < 0; })) return { error: 'Los gastos y el ahorro no pueden ser negativos.' };
          if (col < 0 || col > 100) return { error: 'El margen para imprevistos debe estar entre 0 y 100 %.' };
          var conMargen = gastos * (1 + col / 100), neto = conMargen + ah, filas;
          if (emp(v)) {
            var pagas = +v.pagas;
            filas = [TH.fila('neto-mensual', 'Neto mensual que necesitas', neto, 'eur'), TH.fila('neto-anual', 'Neto anual que necesitas', neto * 12, 'eur'), TH.fila('por-paga', 'Neto de cada paga (' + pagas + ' pagas)', neto * 12 / pagas, 'eur'),
              TH.fila('gastos', 'Gastos mensuales con el margen', conMargen, 'eur'), TH.fila('ahorro-anual', 'Ahorro al año', ah * 12, 'eur')];
            return { filas: filas, notas: ['Para saber qué sueldo bruto corresponde a ese neto anual, usa la calculadora de sueldo bruto y neto.'] };
          }
          var t = z(v.irpf), cuota = z(v.cuota), g = z(v.gastosNegocio), horas = z(v.horas);
          if (cuota < 0 || g < 0) return { error: 'La cuota y los gastos del negocio no pueden ser negativos.' };
          if (t < 0 || t >= 100) return { error: 'El IRPF debe estar entre 0 y 99 %.' };
          var beneficio = neto / (1 - t / 100), fact = beneficio + g + cuota;
          filas = [TH.fila('facturacion', 'Facturación mensual necesaria (sin IVA)', fact, 'eur'), TH.fila('facturacion-anual', 'Facturación anual necesaria', fact * 12, 'eur')];
          if (horas > 0) filas.push(TH.fila('tarifa-hora', 'Precio mínimo por hora facturable (sin IVA)', fact / horas, 'eur'));
          filas.push(TH.fila('beneficio', 'Beneficio antes de IRPF', beneficio, 'eur'), TH.fila('irpf-eur', 'IRPF estimado al mes', beneficio - neto, 'eur'), TH.fila('neto-mensual', 'Neto mensual que necesitas', neto, 'eur'));
          return { filas: filas, notas: ['La cuota de autónomos se trata como gasto deducible. El IVA que cobras a tus clientes va aparte: súmalo a estas cifras al facturar.'] };
        }
      });
    }, function () {
      var p = document.createElement('p'); p.className = 'herr-estado herr-estado--error'; p.setAttribute('role', 'alert');
      p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.'; TH.vaciar(raiz).appendChild(p);
    });
  });
})();
