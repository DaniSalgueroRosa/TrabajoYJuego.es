(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var CAL = function (n) { return n >= 9 ? 'Sobresaliente' : n >= 7 ? 'Notable' : n >= 6 ? 'Bien' : n >= 5 ? 'Suficiente' : 'Insuficiente'; };
    TH.calculadora(raiz, {
      campos: [
        { id: 'cont', etiqueta: 'Nota de la evaluación continua', ph: '7', ayuda: 'Media de trabajos, prácticas y parciales.' },
        { id: 'pcont', etiqueta: 'Peso de la evaluación continua', unidad: '%', ph: '40', valor: '40' },
        { id: 'exam', etiqueta: 'Nota del examen final', ph: '5', ayuda: 'Déjala en blanco para saber qué necesitas sacar.' },
        { id: 'minexam', etiqueta: 'Nota mínima exigida en el examen', ph: '4', ayuda: 'Opcional. Muchas asignaturas piden un mínimo para hacer media.' }
      ],
      ejemplo: { cont: '7', pcont: '40', exam: '5', minexam: '4' },
      vacio: 'Escribe tu nota de evaluación continua y el peso que tiene.',
      calcular: function (v) {
        if (!TH.listos(v, ['cont', 'pcont'])) return { vacio: true };
        if (v.cont < 0 || v.cont > 10 || (!isNaN(v.exam) && (v.exam < 0 || v.exam > 10))) return { error: 'Las notas tienen que estar entre 0 y 10.' };
        if (v.pcont < 0 || v.pcont > 100) return { error: 'El peso debe estar entre 0 y 100 %.' };
        var pex = 100 - v.pcont, base = v.cont * v.pcont / 100;
        var min = isNaN(v.minexam) ? 0 : v.minexam;
        if (isNaN(v.exam)) {
          if (pex === 0) return { vacio: true };
          var nec = (5 - base) / (pex / 100), efectiva = Math.max(nec, min);
          return { filas: [TH.fila('necesaria', 'Nota que necesitas en el examen para aprobar', Math.max(0, efectiva), 'n2'), TH.fila('base', 'Puntos que aporta la evaluación continua', base, 'n3')],
            notas: [nec > 10 ? 'Con esa evaluación continua no es posible llegar al 5: necesitarías más de un 10 en el examen.' : (min > nec ? 'Por la nota mínima exigida, necesitas al menos un ' + TH.fmt(min, [0, 2]) + ' aunque la media saliera antes.' : 'Es la nota con la que la media llega justo al 5.')] };
        }
        var fin = base + v.exam * pex / 100, aprueba = fin >= 5 && v.exam >= min;
        var f = [TH.fila('final', 'Nota final', fin, 'n2'), TH.fila('calificacion', 'Calificación', CAL(fin), 'txt'), TH.fila('resultado', 'Resultado', aprueba ? 'Aprobado' : 'Suspenso', 'txt')];
        var notas = [];
        if (fin >= 5 && v.exam < min) notas.push('La media llega al 5, pero no alcanzas la nota mínima de ' + TH.fmt(min, [0, 2]) + ' en el examen, así que no haces media.');
        return { filas: f, notas: notas };
      }
    });
  });
})();
