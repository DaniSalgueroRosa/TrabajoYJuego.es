(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    (function () {
      var z = function (x) { return typeof x === 'number' && isFinite(x) ? x : 0; };
      TH.calculadora(raiz, {
        campos: [
          { id: 'plantilla', etiqueta: 'Personas en la plantilla', unidad: 'personas', ph: '40', entero: true },
          { id: 'dias', etiqueta: 'Días laborables del periodo', unidad: 'días', ph: '21', ayuda: 'Un mes ronda los 21; un año, unos 220.' },
          { id: 'jornada', etiqueta: 'Horas de la jornada diaria', unidad: 'h', valor: '8' },
          { id: 'ausencias', etiqueta: 'Días de ausencia (suma de todos)', unidad: 'días', ph: '52' },
          { id: 'coste', etiqueta: 'Coste medio por hora de trabajo (opcional)', unidad: '€', ph: '18' }
        ],
        ejemplo: { plantilla: '40', dias: '21', jornada: '8', ausencias: '52', coste: '18' },
        calcular: function (v) {
          if (!TH.listos(v, ['plantilla', 'dias', 'jornada', 'ausencias'])) return { vacio: true };
          var co = z(v.coste);
          if (v.plantilla < 1 || v.plantilla !== Math.floor(v.plantilla)) return { error: 'La plantilla debe ser un número entero de 1 o más.' };
          if (v.dias <= 0 || v.dias > 366 || v.jornada <= 0 || v.jornada > 24 || v.ausencias < 0 || co < 0) return { error: 'Los días laborables deben estar entre 1 y 366, la jornada entre 1 y 24 horas, y las ausencias y el coste no pueden ser negativos.' };
          var teor = v.plantilla * v.dias;
          if (v.ausencias > teor) return { error: 'Las ausencias no pueden superar los días de trabajo previstos de toda la plantilla (' + TH.fmt(teor, [0, 2]) + ').' };
          var filas = [TH.fila('tasa', 'Tasa de absentismo', v.ausencias / teor * 100, 'pct'), TH.fila('dias-persona', 'Días de ausencia por persona', v.ausencias / v.plantilla, 'n2'), TH.fila('puestos', 'Puestos a tiempo completo equivalentes sin cubrir', v.ausencias / v.dias, 'n2'),
            TH.fila('horas', 'Horas de trabajo perdidas', v.ausencias * v.jornada, 'n1'), TH.fila('dias-teoricos', 'Días de trabajo previstos', teor, 'n0')];
          if (co > 0) filas.push(TH.fila('coste-total', 'Coste de las horas perdidas', v.ausencias * v.jornada * co, 'eur'));
          return { filas: filas, notas: ['Cuenta solo ausencias no previstas. No incluye el efecto sobre la productividad del equipo ni los costes de sustitución.'] };
        }
      });
    })();
  });
})();
