(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/negocio.js').then(function () {
      var N = TH.negocio, z = N.n0;
      function suma(lista) { var t = 0, n = 0, neg = false; (lista || []).forEach(function (f) { if (isFinite(f.importe)) { t += f.importe; n++; if (f.importe < 0) neg = true; } }); return { total: t, n: n, neg: neg }; }
      TH.calculadora(raiz, {
        campos: [
          { tipo: 'lista', id: 'fijos', etiqueta: 'Costes fijos mensuales', inicial: 3, max: 20, textoAnadir: 'Añadir coste fijo',
            columnas: [{ id: 'concepto', etiqueta: 'Concepto', tipo: 'texto', ph: 'Alquiler del local' }, { id: 'importe', etiqueta: 'Importe al mes (€)', tipo: 'numero', ph: '800' }] },
          { tipo: 'lista', id: 'variables', etiqueta: 'Costes variables por unidad', inicial: 3, max: 20, textoAnadir: 'Añadir coste variable',
            columnas: [{ id: 'concepto', etiqueta: 'Concepto', tipo: 'texto', ph: 'Materiales' }, { id: 'importe', etiqueta: 'Importe por unidad (€)', tipo: 'numero', ph: '4,50' }] },
          { id: 'unidades', etiqueta: 'Unidades que vendes al mes', unidad: 'uds', ph: '400' },
          { id: 'precio', etiqueta: 'Precio de venta por unidad (opcional)', unidad: '€', ph: '15', ayuda: 'Sin IVA. Con él se calcula también el beneficio y el equilibrio.' }
        ],
        ejemplo: { fijos: [{ concepto: 'Alquiler del local', importe: '800' }, { concepto: 'Cuota de autónomos', importe: '300' }, { concepto: 'Seguros y programas', importe: '100' }],
          variables: [{ concepto: 'Materiales', importe: '4,5' }, { concepto: 'Embalaje', importe: '0,8' }, { concepto: 'Comisión de cobro', importe: '0,45' }], unidades: '400', precio: '15' },
        calcular: function (v) {
          var f = suma(v.fijos), w = suma(v.variables);
          if (!TH.listos(v, ['unidades']) || (f.n + w.n === 0)) return { vacio: true };
          if (v.unidades <= 0) return { error: 'Las unidades deben ser mayores que 0.' };
          if (f.neg || w.neg) return { error: 'Los importes de las listas no pueden ser negativos.' };
          var u = v.unidades, total = f.total + w.total * u, filas = [TH.fila('coste-total', 'Coste total del mes', total, 'eur'), TH.fila('coste-unitario', 'Coste medio por unidad', total / u, 'eur'),
            TH.fila('total-fijos', 'Costes fijos del mes', f.total, 'eur'), TH.fila('variable-unidad', 'Coste variable por unidad', w.total, 'eur'), TH.fila('variables-total', 'Costes variables del mes', w.total * u, 'eur'),
            TH.fila('peso-fijos', 'Peso de los costes fijos en el total', total > 0 ? f.total / total * 100 : 0, 'pct')];
          var p = z(v.precio), conPrecio = p > 0;
          if (conPrecio) {
            var mc = p - w.total;
            filas.push(TH.fila('beneficio', 'Beneficio del mes', u * mc - f.total, 'eur'));
            filas.push(mc > 0 ? TH.fila('equilibrio', 'Unidades para el equilibrio', f.total / mc, 'n1') : TH.fila('equilibrio', 'Unidades para el equilibrio', 'No hay: el precio no cubre el coste variable', 'txt'));
          }
          var filasTabla = [25, 50, 100, 150, 200].map(function (pc) {
            var n = Math.max(1, Math.round(u * pc / 100)), c = f.total + w.total * n, fila = [pc + ' % (' + TH.fmt(n, 0) + ' uds)', TH.eur(c), TH.eur(c / n)];
            if (conPrecio) fila.push(TH.eur(n * p - c));
            return fila;
          });
          return { filas: filas, tabla: { titulo: 'El coste por unidad según cuánto vendas', cab: ['Volumen', 'Coste total', 'Coste por unidad'].concat(conPrecio ? ['Resultado'] : []), filas: filasTabla, cabFila: true },
            notas: ['Importes sin IVA. Los costes fijos se suponen iguales en cualquier volumen, algo que deja de cumplirse si necesitas ampliar local o personal.'] };
        }
      });
    }, function () {
      var p = document.createElement('p'); p.className = 'herr-estado herr-estado--error'; p.setAttribute('role', 'alert');
      p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.'; TH.vaciar(raiz).appendChild(p);
    });
  });
})();
