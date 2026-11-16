(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var CAL = function (n) { return n >= 9 ? 'Sobresaliente' : n >= 7 ? 'Notable' : n >= 6 ? 'Bien' : n >= 5 ? 'Suficiente' : 'Insuficiente'; };
    TH.calculadora(raiz, {
      campos: [
        { id: 'notas', tipo: 'lista', etiqueta: 'Tus notas', inicial: 3, min: 1, max: 40, textoAnadir: 'Añadir nota',
          columnas: [{ id: 'nombre', etiqueta: 'Asignatura o examen (opcional)', tipo: 'texto', ph: 'Matemáticas' }, { id: 'nota', etiqueta: 'Nota', ph: '7,5' }] }
      ],
      ejemplo: { notas: [{ nombre: 'Matemáticas', nota: '7' }, { nombre: 'Lengua', nota: '5,5' }, { nombre: 'Inglés', nota: '9' }] },
      vacio: 'Escribe al menos una nota de 0 a 10.',
      calcular: function (v) {
        var n = v.notas.map(function (f) { return f.nota; }).filter(function (x) { return !isNaN(x); });
        if (!n.length) return { vacio: true };
        if (n.some(function (x) { return x < 0 || x > 10; })) return { error: 'Las notas tienen que estar entre 0 y 10.' };
        var suma = n.reduce(function (a, b) { return a + b; }, 0), media = suma / n.length, ord = n.slice().sort(function (a, b) { return a - b; });
        var mediana = ord.length % 2 ? ord[(ord.length - 1) / 2] : (ord[ord.length / 2 - 1] + ord[ord.length / 2]) / 2;
        return { filas: [TH.fila('media', 'Nota media', media, 'n2'), TH.fila('calificacion', 'Calificación de la media', CAL(media), 'txt'), TH.fila('maxima', 'Nota más alta', ord[ord.length - 1], 'n2'), TH.fila('minima', 'Nota más baja', ord[0], 'n2'),
          TH.fila('mediana', 'Mediana', mediana, 'n2'), TH.fila('aprobadas', 'Aprobadas (5 o más)', n.filter(function (x) { return x >= 5; }).length + ' de ' + n.length, 'txt'), TH.fila('suma', 'Suma de las notas', suma, 'n2')] };
      }
    });
  });
})();
