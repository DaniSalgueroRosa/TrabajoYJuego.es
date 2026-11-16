(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/negocio.js').then(function () {
      var N = TH.negocio, z = N.n0;
      TH.calculadora(raiz, {
        campos: [
          { id: 'fijos', etiqueta: 'Costes fijos del periodo', unidad: '€', ph: '3000', ayuda: 'Lo que pagas aunque no vendas nada: alquiler, cuotas, sueldos fijos.' },
          { id: 'precio', etiqueta: 'Precio de venta por unidad', unidad: '€', ph: '25', ayuda: 'Sin IVA.' },
          { id: 'variable', etiqueta: 'Coste variable por unidad', unidad: '€', ph: '10', ayuda: 'Lo que cuesta producir y entregar cada unidad.' },
          { id: 'objetivo', etiqueta: 'Beneficio que quieres ganar (opcional)', unidad: '€', ph: '2000' },
          { id: 'ventas', etiqueta: 'Unidades que esperas vender (opcional)', unidad: 'uds', ph: '300' }
        ],
        ejemplo: { fijos: '3000', precio: '25', variable: '10', objetivo: '2000', ventas: '300' },
        calcular: function (v) {
          if (!TH.listos(v, ['fijos', 'precio', 'variable'])) return { vacio: true };
          if (v.fijos < 0 || v.variable < 0 || z(v.objetivo) < 0 || z(v.ventas) < 0) return { error: 'Los importes no pueden ser negativos.' };
          if (v.precio <= 0) return { error: 'El precio de venta debe ser mayor que 0.' };
          var mc = v.precio - v.variable;
          if (mc <= 0) return { error: 'Con ese coste variable cada venta pierde dinero: el precio no supera lo que cuesta cada unidad, así que no hay punto de equilibrio. Sube el precio o baja el coste variable.' };
          var eq = v.fijos / mc, obj = z(v.objetivo), filas = [
            TH.fila('unidades', 'Unidades para llegar al equilibrio', eq, 'n1'), TH.fila('unidades-enteras', 'Unidades enteras que hay que vender', Math.ceil(eq - 1e-9), 'n0'),
            TH.fila('facturacion', 'Facturación en el punto de equilibrio', eq * v.precio, 'eur'), TH.fila('contribucion', 'Margen de contribución por unidad', mc, 'eur'),
            TH.fila('contribucion-pct', 'Margen de contribución sobre el precio', mc / v.precio * 100, 'pct')];
          if (obj > 0) filas.push(TH.fila('unidades-objetivo', 'Unidades para ganar ' + TH.eur(obj), (v.fijos + obj) / mc, 'n1'), TH.fila('facturacion-objetivo', 'Facturación para ganar ' + TH.eur(obj), (v.fijos + obj) / mc * v.precio, 'eur'));
          var ventas = z(v.ventas);
          if (ventas > 0) filas.push(TH.fila('beneficio', 'Resultado con ' + TH.fmt(ventas, 0) + ' unidades', ventas * mc - v.fijos, 'eur'), TH.fila('margen-seguridad', 'Margen de seguridad', (ventas - eq) / ventas * 100, 'pct'));
          var escenarios = [50, 100, 150, 200, 300].map(function (p) {
            var u = Math.ceil(eq * p / 100 - 1e-9);
            return [p + ' % del equilibrio', TH.fmt(u, 0), TH.eur(u * v.precio), TH.eur(v.fijos + u * v.variable), TH.eur(u * mc - v.fijos)];
          });
          return { filas: filas, tabla: { titulo: 'Qué pasa con otros volúmenes de venta', cab: ['Escenario', 'Unidades', 'Ingresos', 'Costes totales', 'Resultado'], filas: escenarios, cabFila: true },
            avisos: ventas > 0 && ventas < eq ? ['Con las ventas que esperas no llegas al equilibrio: el negocio perdería dinero en este periodo.'] : [],
            notas: ['Todos los importes deben ser del mismo periodo y sin IVA. Los costes fijos se suponen constantes en cualquier volumen.'] };
        }
      });
    }, function () {
      var p = document.createElement('p'); p.className = 'herr-estado herr-estado--error'; p.setAttribute('role', 'alert');
      p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.'; TH.vaciar(raiz).appendChild(p);
    });
  });
})();
