(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    (function () {
      var z = function (x) { return typeof x === 'number' && isFinite(x) ? x : 0; };
      TH.calculadora(raiz, {
        campos: [
          { id: 'produccion', etiqueta: 'Producción del periodo', unidad: 'unidades', ph: '5200' },
          { id: 'horas', etiqueta: 'Horas trabajadas', unidad: 'h', ph: '1600' },
          { id: 'trabajadores', etiqueta: 'Trabajadores (opcional)', unidad: 'personas', ph: '10', entero: true },
          { id: 'coste', etiqueta: 'Coste laboral del periodo (opcional)', unidad: '€', ph: '32000' },
          { id: 'prodAnt', etiqueta: 'Producción del periodo anterior (opcional)', unidad: 'unidades', ph: '4800' },
          { id: 'horasAnt', etiqueta: 'Horas trabajadas del periodo anterior (opcional)', unidad: 'h', ph: '1600' }
        ],
        ejemplo: { produccion: '5200', horas: '1600', trabajadores: '10', coste: '32000', prodAnt: '4800', horasAnt: '1600' },
        calcular: function (v) {
          if (!TH.listos(v, ['produccion', 'horas'])) return { vacio: true };
          var tr = z(v.trabajadores), co = z(v.coste), pa = z(v.prodAnt), ha = z(v.horasAnt);
          if (v.produccion < 0 || v.horas <= 0 || tr < 0 || co < 0 || pa < 0 || ha < 0) return { error: 'La producción y los costes no pueden ser negativos y las horas deben ser mayores que 0.' };
          var ph = v.produccion / v.horas, filas = [TH.fila('prod-hora', 'Productividad por hora', ph, 'n2')];
          if (tr > 0) filas.push(TH.fila('prod-trabajador', 'Producción por trabajador', v.produccion / tr, 'n1'), TH.fila('horas-trabajador', 'Horas por trabajador', v.horas / tr, 'n1'));
          if (co > 0) { filas.push(TH.fila('coste-hora', 'Coste laboral por hora', co / v.horas, 'eur')); if (v.produccion > 0) filas.push(TH.fila('coste-unidad', 'Coste laboral por unidad', co / v.produccion, 'eur')); }
          if (pa > 0 && ha > 0) { var pha = pa / ha; filas.push(TH.fila('prod-hora-anterior', 'Productividad por hora anterior', pha, 'n2'), TH.fila('variacion', 'Variación de la productividad', (ph / pha - 1) * 100, 'pct')); }
          return { filas: filas, notas: ['La productividad mide cantidad por tiempo, no calidad. Compara siempre con la misma definición de producción y de horas.'] };
        }
      });
    })();
  });
})();
