(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/negocio.js').then(function () {
      var N = TH.negocio, z = N.n0;
      TH.calculadora(raiz, {
        campos: [
          { id: 'precio', etiqueta: 'Precio de compra', unidad: '€', ph: '20000' },
          { id: 'reventa', etiqueta: 'Valor al que esperas venderlo', unidad: '€', ph: '11000' },
          { id: 'anos', etiqueta: 'Años que lo vas a tener', unidad: 'años', ph: '5' },
          { id: 'km', etiqueta: 'Kilómetros al año', unidad: 'km', ph: '12000' },
          { id: 'consumo', etiqueta: 'Consumo', unidad: 'l o kWh por 100 km', ph: '6' },
          { id: 'combustible', etiqueta: 'Precio del combustible o de la electricidad', unidad: '€ por l o kWh', ph: '1,65' },
          { id: 'seguro', etiqueta: 'Seguro', unidad: '€ al año', ph: '450' },
          { id: 'impuesto', etiqueta: 'Impuesto de circulación', unidad: '€ al año', ph: '90' },
          { id: 'mantenimiento', etiqueta: 'Mantenimiento, neumáticos e ITV', unidad: '€ al año', ph: '600' },
          { id: 'aparcamiento', etiqueta: 'Aparcamiento o garaje', unidad: '€ al mes', ph: '40' },
          { id: 'otros', etiqueta: 'Peajes, lavados y otros gastos', unidad: '€ al año', ph: '100' },
          { id: 'financiado', etiqueta: 'Importe financiado (opcional)', unidad: '€', ph: '15000' },
          { id: 'tin', etiqueta: 'Interés del préstamo', unidad: '%', ph: '7' },
          { id: 'mesesFin', etiqueta: 'Plazo del préstamo', unidad: 'meses', ph: '48', entero: true }
        ],
        ejemplo: { precio: '20000', reventa: '11000', anos: '5', km: '12000', consumo: '6', combustible: '1,65', seguro: '450', impuesto: '90', mantenimiento: '600', aparcamiento: '40', otros: '100', financiado: '15000', tin: '7', mesesFin: '48' },
        calcular: function (v) {
          if (!TH.listos(v, ['precio', 'anos', 'km'])) return { vacio: true };
          var rev = z(v.reventa), fin = z(v.financiado), cons = z(v.consumo), comb = z(v.combustible), seg = z(v.seguro), imp = z(v.impuesto), man = z(v.mantenimiento), apa = z(v.aparcamiento), ot = z(v.otros);
          if (v.precio <= 0) return { error: 'El precio de compra debe ser mayor que 0.' };
          if (rev < 0 || rev > v.precio) return { error: 'El valor de reventa debe estar entre 0 y el precio de compra.' };
          if (v.anos <= 0 || v.anos > 40) return { error: 'Los años de uso deben estar entre 0 y 40.' };
          if (v.km < 0 || [cons, comb, seg, imp, man, apa, ot, fin].some(function (x) { return x < 0; })) return { error: 'Ningún importe puede ser negativo.' };
          var inter = 0, avisos = [];
          if (fin > 0) {
            if (!isFinite(v.tin) || !isFinite(v.mesesFin) || v.mesesFin < 1 || v.mesesFin !== Math.floor(v.mesesFin) || v.tin < 0 || v.tin > 40) return { error: 'Para incluir la financiación indica un interés entre 0 y 40 % y un plazo en meses enteros.' };
            if (fin > v.precio) return { error: 'El importe financiado no puede superar el precio de compra.' };
            var cu = N.cuadro(fin, v.tin, v.mesesFin, 0), tope = Math.min(v.mesesFin, Math.round(v.anos * 12)), k;
            for (k = 0; k < tope; k++) inter += cu.filas[k].interes;
            if (v.mesesFin > v.anos * 12) avisos.push('El préstamo dura más que el tiempo que tendrás el coche: solo se cuentan los intereses de ese periodo y el resto de la deuda se supone liquidado con la venta.');
          }
          var dep = v.precio - rev, gas = v.km * cons / 100 * comb * v.anos, fijos = (seg + imp + man + ot) * v.anos, apar = apa * 12 * v.anos, total = dep + gas + fijos + apar + inter, meses = v.anos * 12;
          var filas = [TH.fila('mensual', 'Coste mensual', total / meses, 'eur'), TH.fila('total', 'Coste total durante ' + TH.fmt(v.anos, [0, 1]) + ' años', total, 'eur'), TH.fila('anual', 'Coste anual', total / v.anos, 'eur')];
          if (v.km > 0) filas.push(TH.fila('por-km', 'Coste por kilómetro', total / (v.km * v.anos), 'eur'));
          filas.push(TH.fila('depreciacion', 'Depreciación (lo que pierde de valor)', dep, 'eur'), TH.fila('combustible', 'Combustible o electricidad', gas, 'eur'), TH.fila('seguro-impuestos', 'Seguro, impuesto, mantenimiento y otros', fijos, 'eur'),
            TH.fila('aparcamiento', 'Aparcamiento', apar, 'eur'), TH.fila('intereses', 'Intereses de la financiación', inter, 'eur'));
          var partes = [['Depreciación', dep], ['Combustible o electricidad', gas], ['Seguro, impuesto, mantenimiento y otros', fijos], ['Aparcamiento', apar], ['Intereses', inter]];
          return { filas: filas, avisos: avisos, tabla: { titulo: 'En qué se va el dinero', cab: ['Partida', 'Total', 'Al mes', '% del coste'], cabFila: true,
            filas: partes.filter(function (p) { return p[1] > 0; }).map(function (p) { return [p[0], TH.eur(p[1]), TH.eur(p[1] / meses), TH.pct(p[1] / total * 100)]; }) },
            notas: ['No se incluyen multas, averías extraordinarias ni lo que habría rendido ese dinero si lo hubieras invertido.'] };
        }
      });
    }, function () {
      var p = document.createElement('p'); p.className = 'herr-estado herr-estado--error'; p.setAttribute('role', 'alert');
      p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.'; TH.vaciar(raiz).appendChild(p);
    });
  });
})();
