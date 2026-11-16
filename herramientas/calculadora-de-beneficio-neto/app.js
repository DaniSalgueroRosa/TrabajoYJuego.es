(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/negocio.js').then(function () {
      var N = TH.negocio, z = N.n0;
      TH.calculadora(raiz, {
        campos: [
          { id: 'ingresos', etiqueta: 'Ingresos del periodo', unidad: '€', ph: '120000', ayuda: 'Ventas netas, sin IVA.' },
          { id: 'coste', etiqueta: 'Coste de las ventas', unidad: '€', ph: '55000', ayuda: 'Mercancía, materiales o producción directamente ligados a lo vendido.' },
          { id: 'gastos', etiqueta: 'Gastos operativos', unidad: '€', ph: '38000', ayuda: 'Alquiler, sueldos, suministros, publicidad, asesoría…' },
          { id: 'amort', etiqueta: 'Amortizaciones', unidad: '€', ph: '4000' },
          { id: 'intereses', etiqueta: 'Intereses y gastos financieros', unidad: '€', ph: '1500' },
          { id: 'tipo', etiqueta: 'Tipo de impuesto sobre el beneficio', unidad: '%', ph: '25', ayuda: 'En sociedades, el tipo general es el 25 %. En autónomos, tu tipo medio estimado de IRPF.' }
        ],
        ejemplo: { ingresos: '120000', coste: '55000', gastos: '38000', amort: '4000', intereses: '1500', tipo: '25' },
        calcular: function (v) {
          if (!TH.listos(v, ['ingresos'])) return { vacio: true };
          var c = z(v.coste), g = z(v.gastos), a = z(v.amort), i = z(v.intereses), t = z(v.tipo);
          if (v.ingresos <= 0) return { error: 'Los ingresos deben ser mayores que 0.' };
          if (c < 0 || g < 0 || a < 0 || i < 0) return { error: 'Los costes, gastos, amortizaciones e intereses no pueden ser negativos: escríbelos como importes positivos.' };
          if (t < 0 || t > 100) return { error: 'El tipo de impuesto debe estar entre 0 y 100 %.' };
          var bruto = v.ingresos - c, ebit = bruto - g - a, bai = ebit - i, imp = Math.max(0, bai) * t / 100, neto = bai - imp, pc = function (x) { return x / v.ingresos * 100; };
          var filas = [TH.fila('neto', 'Beneficio neto', neto, 'eur'), TH.fila('margen-neto', 'Margen neto', pc(neto), 'pct'), TH.fila('bruto', 'Beneficio bruto', bruto, 'eur'), TH.fila('margen-bruto', 'Margen bruto', pc(bruto), 'pct'),
            TH.fila('ebit', 'Resultado de explotación', ebit, 'eur'), TH.fila('margen-operativo', 'Margen operativo', pc(ebit), 'pct'), TH.fila('bai', 'Resultado antes de impuestos', bai, 'eur'), TH.fila('impuesto', 'Impuesto sobre el beneficio', imp, 'eur')];
          var cuenta = [['Ingresos', v.ingresos], ['− Coste de las ventas', -c], ['= Beneficio bruto', bruto], ['− Gastos operativos', -g], ['− Amortizaciones', -a], ['= Resultado de explotación', ebit], ['− Intereses y gastos financieros', -i], ['= Resultado antes de impuestos', bai], ['− Impuesto sobre el beneficio', -imp], ['= Beneficio neto', neto]];
          return { filas: filas, avisos: bai < 0 ? ['El resultado antes de impuestos es negativo: hay pérdidas y no se calcula impuesto. No se tienen en cuenta compensaciones de pérdidas de otros años.'] : [],
            tabla: { titulo: 'Cuenta de resultados', cab: ['Concepto', 'Importe', '% de los ingresos'], cabFila: true, filas: cuenta.map(function (f) { return [f[0], TH.eur(f[1]), TH.pct(pc(f[1]), [0, 1])]; }) },
            notas: ['Usa importes sin IVA. Es una estimación para valorar el negocio, no una declaración fiscal.'] };
        }
      });
    }, function () {
      var p = document.createElement('p'); p.className = 'herr-estado herr-estado--error'; p.setAttribute('role', 'alert');
      p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.'; TH.vaciar(raiz).appendChild(p);
    });
  });
})();
