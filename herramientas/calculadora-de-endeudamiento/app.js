(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/negocio.js').then(function () {
      var N = TH.negocio, z = N.n0;
      TH.calculadora(raiz, {
        campos: [
          { id: 'ingresos', etiqueta: 'Ingresos netos mensuales del hogar', unidad: '€', ph: '3000', ayuda: 'Después de impuestos, con las pagas extra repartidas.' },
          { id: 'hipoteca', etiqueta: 'Cuota de hipoteca', unidad: '€ al mes', ph: '600' },
          { id: 'prestamos', etiqueta: 'Cuotas de préstamos personales y de vehículos', unidad: '€ al mes', ph: '150' },
          { id: 'tarjetas', etiqueta: 'Cuotas de tarjetas y compras aplazadas', unidad: '€ al mes', ph: '50' },
          { id: 'otras', etiqueta: 'Otras cuotas de deudas', unidad: '€ al mes', ph: '0' },
          { id: 'nueva', etiqueta: 'Cuota de una nueva deuda (opcional)', unidad: '€ al mes', ph: '200' },
          { id: 'limite', etiqueta: 'Límite de endeudamiento que quieres respetar', unidad: '% de los ingresos', valor: '35' },
          { id: 'tin', etiqueta: 'Interés para estimar el préstamo máximo (opcional)', unidad: '%', ph: '6' },
          { id: 'meses', etiqueta: 'Plazo para estimar el préstamo máximo (opcional)', unidad: 'meses', ph: '60', entero: true }
        ],
        ejemplo: { ingresos: '3000', hipoteca: '600', prestamos: '150', tarjetas: '50', otras: '0', nueva: '200', limite: '35', tin: '6', meses: '60' },
        calcular: function (v) {
          if (!TH.listos(v, ['ingresos'])) return { vacio: true };
          var cu = z(v.hipoteca) + z(v.prestamos) + z(v.tarjetas) + z(v.otras), nu = z(v.nueva), lim = z(v.limite);
          if (v.ingresos <= 0) return { error: 'Los ingresos deben ser mayores que 0.' };
          if ([v.hipoteca, v.prestamos, v.tarjetas, v.otras, v.nueva].some(function (x) { return z(x) < 0; })) return { error: 'Las cuotas no pueden ser negativas.' };
          if (lim <= 0 || lim > 100) return { error: 'El límite debe ser mayor que 0 y no superar el 100 %.' };
          var actual = cu / v.ingresos * 100, tope = v.ingresos * lim / 100, margen = tope - cu;
          var filas = [TH.fila('actual', 'Ratio de endeudamiento actual', actual, 'pct'), TH.fila('cuotas', 'Cuotas mensuales de deudas', cu, 'eur')];
          if (nu > 0) filas.push(TH.fila('tras-nueva', 'Ratio con la nueva cuota', (cu + nu) / v.ingresos * 100, 'pct'), TH.fila('cuotas-tras', 'Cuotas mensuales con la nueva deuda', cu + nu, 'eur'));
          filas.push(TH.fila('limite-eur', 'Cuota máxima según tu límite (' + TH.fmt(lim, [0, 2]) + ' %)', tope, 'eur'), TH.fila('margen', 'Margen disponible sobre tus cuotas actuales', margen, 'eur'));
          if (isFinite(v.tin) && isFinite(v.meses) && v.meses >= 1 && v.tin >= 0 && v.tin <= 40) filas.push(TH.fila('prestamo-max', 'Préstamo máximo con ese margen', N.principalMaximo(Math.max(0, margen), v.tin, v.meses), 'eur'));
          var avisos = [];
          if (actual > lim) avisos.push('Tus cuotas actuales ya superan el límite que has fijado: no queda margen para nuevas deudas.');
          else if (nu > 0 && (cu + nu) / v.ingresos * 100 > lim) avisos.push('Con la nueva cuota pasarías de tu límite de endeudamiento.');
          return { filas: filas, avisos: avisos, notas: ['El ratio solo cuenta cuotas de deudas. No incluye alquiler, suministros, comida ni otros gastos fijos, que también limitan lo que puedes pagar.'] };
        }
      });
    }, function () {
      var p = document.createElement('p'); p.className = 'herr-estado herr-estado--error'; p.setAttribute('role', 'alert');
      p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.'; TH.vaciar(raiz).appendChild(p);
    });
  });
})();
