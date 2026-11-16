(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    Promise.all([TH.script('lib/numeros.js')]).then(function () {
      var cg = raiz.querySelector('#herr-carga');
      if (cg) cg.remove();

      var N = TH.numeros;
      function mayus(s, m) { return m === 'todas' ? s.toLocaleUpperCase('es') : m === 'inicial' ? s.charAt(0).toLocaleUpperCase('es') + s.slice(1) : s; }
      TH.texto(raiz, {
        entrada: { etiqueta: 'Números (uno por línea)', ph: 'Por ejemplo: 1234,56', ejemplo: '2026\n1500000\n21\n3,14' },
        salida: { etiqueta: 'En letras' },
        descargar: { nombre: 'numeros-en-letras.txt' },
        opciones: [
          { id: 'modo', tipo: 'select', etiqueta: 'Tipo de cantidad', valor: 'numero', opciones: [['numero', 'Número'], ['euro', 'Euros'], ['dolar', 'Dólares'], ['peso', 'Pesos']] },
          { id: 'genero', tipo: 'select', etiqueta: 'Cómo termina el uno', valor: 'm', opciones: [['m', 'Sin nombre detrás (veintiuno)'], ['un', 'Delante de un nombre masculino (veintiún libros)'], ['f', 'Delante de un nombre femenino (veintiuna casas)']], mostrarSi: function (v) { return v.modo === 'numero'; } },
          { id: 'decimales', tipo: 'select', etiqueta: 'Decimales', valor: 'numero', opciones: [['numero', 'Como número (coma catorce)'], ['digitos', 'Cifra a cifra (coma uno cuatro)']], mostrarSi: function (v) { return v.modo === 'numero'; } },
          { id: 'ceroCentimos', tipo: 'check', etiqueta: 'Escribir «con cero céntimos» cuando no hay', valor: false, mostrarSi: function (v) { return v.modo !== 'numero'; } },
          { id: 'mayus', tipo: 'select', etiqueta: 'Mayúsculas', valor: 'normal', opciones: [['normal', 'Todo en minúsculas'], ['inicial', 'Primera letra en mayúscula'], ['todas', 'TODO EN MAYÚSCULAS']] }
        ],
        procesar: function (t, op) {
          if (!t.trim()) return { salida: '' };
          var lineas = t.replace(/\r\n?/g, '\n').split('\n'), salida = [], errores = [], bien = 0, avisos = [];
          if (lineas.length > 500) { lineas = lineas.slice(0, 500); avisos.push('Se convierten las 500 primeras líneas; el resto se ha ignorado.'); }
          lineas.forEach(function (l, i) {
            l = l.replace(/[€$]/g, '').trim();
            if (!l) { salida.push(''); return; }
            try {
              var s = op.modo === 'numero' ? N.numero(l, { genero: op.genero === 'f' ? 'f' : 'm', forma: op.genero === 'un' ? 'un' : 'uno', decimales: op.decimales }) : N.moneda(l, { moneda: op.modo, ceroCentimos: op.ceroCentimos });
              salida.push(mayus(s, op.mayus)); bien++;
            } catch (e) { salida.push(''); errores.push('Línea ' + (i + 1) + ': ' + e.message); }
          });
          while (salida.length && salida[salida.length - 1] === '') salida.pop();
          errores.slice(0, 3).forEach(function (e) { avisos.push(e); });
          if (errores.length > 3) avisos.push('Y ' + (errores.length - 3) + ' líneas más con problemas.');
          return { salida: salida.join('\n'), avisos: avisos, filas: [TH.fila('convertidas', 'Líneas convertidas', bien, 'n0'), TH.fila('errores', 'Líneas con problemas', errores.length, 'n0')] };
        }
      });

    }, function () { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); });
  });
})();
