(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/negocio.js').then(function () {
      var N = TH.negocio, z = N.n0;
      var EQUIV = [10, 20, 25, 30, 40, 50, 60, 70];
      TH.calculadora(raiz, {
        campos: [
          { id: 'modo', tipo: 'select', etiqueta: '¿Qué quieres calcular?', valor: 'margen', ancho: 'completo', opciones: [['margen', 'El margen a partir del coste y el precio'], ['precio', 'El precio a partir del coste y el margen'], ['coste', 'El coste máximo a partir del precio y el margen']] },
          { id: 'coste', etiqueta: 'Coste por unidad', unidad: '€', ph: '12', mostrarSi: function (v) { return v.modo !== 'coste'; } },
          { id: 'precio', etiqueta: 'Precio de venta por unidad', unidad: '€', ph: '20', mostrarSi: function (v) { return v.modo !== 'precio'; } },
          { id: 'margen', etiqueta: 'Margen de beneficio', unidad: '%', ph: '40', mostrarSi: function (v) { return v.modo !== 'margen'; } },
          { id: 'unidades', etiqueta: 'Unidades vendidas (opcional)', unidad: 'uds', ph: '500', ayuda: 'Si lo rellenas, verás también los totales.' }
        ],
        ejemplo: { modo: 'margen', coste: '12', precio: '20', unidades: '500' },
        calcular: function (v) {
          var need = v.modo === 'margen' ? ['coste', 'precio'] : v.modo === 'precio' ? ['coste', 'margen'] : ['precio', 'margen'];
          if (!TH.listos(v, need)) return { vacio: true };
          var coste = v.coste, precio = v.precio, margen = v.margen;
          if (v.modo !== 'precio' && precio <= 0) return { error: 'El precio de venta debe ser mayor que 0.' };
          if (v.modo !== 'coste' && coste < 0) return { error: 'El coste no puede ser negativo.' };
          if (v.modo !== 'margen' && (margen >= 100 || margen < 0)) return { error: 'El margen debe estar entre 0 y 99,99 %. Un margen sobre el precio nunca puede llegar al 100 %.' };
          if (v.modo === 'precio') precio = coste / (1 - margen / 100);
          if (v.modo === 'coste') coste = precio * (1 - margen / 100);
          var ben = precio - coste, m = ben / precio * 100, rec = coste > 0 ? ben / coste * 100 : NaN, filas = [];
          if (v.modo === 'margen') filas.push(TH.fila('margen', 'Margen de beneficio', m, 'pct'));
          else if (v.modo === 'precio') filas.push(TH.fila('precio', 'Precio de venta necesario', precio, 'eur'));
          else filas.push(TH.fila('coste', 'Coste máximo por unidad', coste, 'eur'));
          filas.push(TH.fila('beneficio', 'Beneficio por unidad', ben, 'eur'));
          if (v.modo !== 'margen') filas.push(TH.fila('margen-final', 'Margen sobre el precio', m, 'pct'));
          filas.push(TH.fila('recargo', 'Recargo sobre el coste', rec, 'pct'));
          var u = z(v.unidades);
          if (u > 0) filas.push(TH.fila('ingresos', 'Ingresos totales', precio * u, 'eur'), TH.fila('coste-total', 'Coste total', coste * u, 'eur'), TH.fila('beneficio-total', 'Beneficio total', ben * u, 'eur'));
          return { filas: filas, tabla: { titulo: 'Equivalencia entre margen y recargo', cab: ['Margen sobre el precio', 'Recargo sobre el coste', 'Precio si el coste es 100 €'], cabFila: true,
            filas: EQUIV.map(function (e) { return [e + ' %', TH.pct(e / (100 - e) * 100, [0, 1]), TH.eur(100 / (1 - e / 100))]; }) },
            notas: ['Usa importes sin IVA. El margen se calcula sobre el precio de venta y el recargo sobre el coste.'] };
        }
      });
    }, function () {
      var p = document.createElement('p'); p.className = 'herr-estado herr-estado--error'; p.setAttribute('role', 'alert');
      p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.'; TH.vaciar(raiz).appendChild(p);
    });
  });
})();
