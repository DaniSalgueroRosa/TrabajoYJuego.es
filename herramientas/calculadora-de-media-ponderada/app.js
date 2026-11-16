(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.calculadora(raiz, {
      campos: [
        { id: 'datos', tipo: 'lista', etiqueta: 'Valores y pesos', inicial: 3, min: 1, max: 40, textoAnadir: 'Añadir fila',
          columnas: [{ id: 'nombre', etiqueta: 'Concepto (opcional)', tipo: 'texto', ph: 'Examen final' }, { id: 'valor', etiqueta: 'Valor o nota', ph: '8' }, { id: 'peso', etiqueta: 'Peso', ph: '30' }] }
      ],
      ejemplo: { datos: [{ nombre: 'Examen parcial', valor: '8', peso: '30' }, { nombre: 'Trabajo', valor: '6', peso: '50' }, { nombre: 'Prácticas', valor: '9', peso: '20' }] },
      vacio: 'Escribe cada valor con su peso. El peso puede ser un porcentaje, unos créditos o unas horas.',
      calcular: function (v) {
        var f = v.datos.filter(function (x) { return !isNaN(x.valor) && !isNaN(x.peso); });
        if (!f.length) return { vacio: true };
        if (f.some(function (x) { return x.peso < 0; })) return { error: 'Los pesos no pueden ser negativos.' };
        var sp = f.reduce(function (a, x) { return a + x.peso; }, 0);
        if (sp === 0) return { error: 'La suma de los pesos es 0: no se puede calcular la media.' };
        var s = f.reduce(function (a, x) { return a + x.valor * x.peso; }, 0), media = s / sp;
        var filas = [TH.fila('media', 'Media ponderada', media, 'n2'), TH.fila('pesos', 'Suma de los pesos', sp, 'n2'), TH.fila('simple', 'Media simple (sin pesos)', f.reduce(function (a, x) { return a + x.valor; }, 0) / f.length, 'n2')];
        var tabla = { titulo: 'Aportación de cada valor a la media', cab: ['Concepto', 'Valor', 'Peso', 'Aporta'], cabFila: true,
          filas: f.map(function (x, i) { var origen = v.datos.filter(function (d) { return d.valor === x.valor && d.peso === x.peso; })[0]; return [(origen && origen.nombre) || 'Fila ' + (i + 1), TH.fmt(x.valor, [0, 2]), TH.fmt(x.peso, [0, 2]), TH.fmt(x.valor * x.peso / sp, [0, 3])]; }) };
        return { filas: filas, tabla: tabla, notas: Math.abs(sp - 100) < 1e-9 ? [] : ['Los pesos no suman 100 y no hace falta: la media ponderada divide entre la suma de los pesos, sean cuales sean.'] };
      }
    });
  });
})();
