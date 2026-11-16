(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    Promise.all([TH.script('lib/estilo.js')]).then(function () {
      var cg = raiz.querySelector('#herr-carga');
      if (cg) cg.remove();

      var E = TH.estilo, EJEMPLO = "El café es una de las bebidas más consumidas del mundo. Se obtiene de las semillas tostadas del cafeto, un arbusto que crece en zonas tropicales. El cafeto necesita altitud, sombra y lluvias regulares para dar buenos frutos. Los frutos del cafeto se recogen a mano o con máquinas y después se secan. Tras el secado, las semillas se tuestan y se muelen antes de preparar la bebida. Cada país tiene su propia forma de tomar café, con más leche, más agua o más azúcar. En España es habitual tomarlo después de comer. El precio del café depende de la cosecha, del clima y de la demanda internacional. Los productores reciben solo una parte pequeña de lo que pagan los clientes. Por eso existen sellos que garantizan un precio justo a quienes cultivan el cafeto.";
      function aviso(t) { return { salida: '', avisos: [t] }; }
      TH.texto(raiz, {
        entrada: { etiqueta: 'Texto que quieres resumir', ph: 'Pega aquí un texto de varios párrafos…', ejemplo: EJEMPLO },
        salida: { etiqueta: 'Resumen' },
        descargar: { nombre: 'resumen.txt' },
        opciones: [
          { id: 'modo', tipo: 'select', etiqueta: 'Cuánto resumir', valor: 'porcentaje', opciones: [['porcentaje', 'Un porcentaje de las frases'], ['cantidad', 'Un número de frases']] },
          { id: 'porcentaje', etiqueta: 'Porcentaje', valor: 30, unidad: '%', ayuda: 'De 5 a 80.', mostrarSi: function (v) { return v.modo === 'porcentaje'; } },
          { id: 'cantidad', etiqueta: 'Frases', valor: 3, entero: true, ayuda: 'De 1 a 30.', mostrarSi: function (v) { return v.modo === 'cantidad'; } },
          { id: 'formato', tipo: 'select', etiqueta: 'Presentación', valor: 'parrafo', opciones: [['parrafo', 'Un párrafo'], ['lineas', 'Una frase por línea']] }
        ],
        procesar: function (t, op) {
          if (!t.trim()) return { salida: '' };
          var pct = op.modo === 'porcentaje', n = pct ? op.porcentaje : op.cantidad;
          if (pct && !(n >= 5 && n <= 80)) return aviso('El porcentaje debe estar entre 5 y 80.');
          if (!pct && !(n >= 1 && n <= 30 && n === Math.floor(n))) return aviso('Pide entre 1 y 30 frases, con un número entero.');
          var total = E.frases(t).length;
          if (total < 3) return aviso('El texto tiene ' + total + (total === 1 ? ' frase' : ' frases') + ' y con menos de 3 no hay nada que resumir.');
          var r = E.resumir(t, pct ? { porcentaje: n } : { cantidad: n });
          if (!r.frases.length) return aviso('Las frases son demasiado cortas para elegir cuáles resumen el texto. Prueba con un texto más desarrollado.');
          var filas = [TH.fila('frases-total', 'Frases del texto', total, 'n0'), TH.fila('frases-resumen', 'Frases del resumen', r.frases.length, 'n0'),
            TH.fila('palabras-original', 'Palabras del texto', E.palabras(t).length, 'n0'), TH.fila('palabras-resumen', 'Palabras del resumen', E.palabras(r.frases.join(' ')).length, 'n0')];
          if (r.palabrasClave.length) filas.push(TH.fila('claves', 'Palabras más repetidas', r.palabrasClave.map(function (k) { return k.palabra + ' ×' + k.veces; }).join(', '), 'txt'));
          return { salida: r.frases.join(op.formato === 'lineas' ? '\n' : ' '), filas: filas };
        }
      });

    }, function () { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); });
  });
})();
