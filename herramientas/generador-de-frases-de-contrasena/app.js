(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    Promise.all([TH.script('lib/azar.js'), TH.script('lib/palabras-es.js')]).then(function () {
      var cg = raiz.querySelector('#herr-carga');
      if (cg) cg.remove();

      var A = TH.azar, PAL = TH.listaPalabras.lista;
      function nivel(b) { return b < 28 ? 'Muy débil' : b < 40 ? 'Débil' : b < 60 ? 'Aceptable' : b < 80 ? 'Fuerte' : 'Muy fuerte'; }
      function aviso(t) { return { salida: '', avisos: [t] }; }
      TH.texto(raiz, {
        sinEntrada: true,
        salida: { etiqueta: 'Frases de contraseña' },
        filas: 6,
        botones: [{ texto: 'Generar otra', accion: function (api) { api.actualizar(); } }],
        opciones: [
          { id: 'palabras', etiqueta: 'Palabras', valor: 6, entero: true, ayuda: 'De 3 a 10. Para cuentas importantes, 6 o más.' },
          { id: 'cantidad', etiqueta: 'Cuántas frases', valor: 1, entero: true, ayuda: 'De 1 a 20.' },
          { id: 'separador', tipo: 'select', etiqueta: 'Separador', valor: '-', opciones: [['-', 'Guion (-)'], [' ', 'Espacio'], ['.', 'Punto (.)'], ['_', 'Guion bajo (_)'], ['', 'Ninguno']] },
          { id: 'mayus', tipo: 'check', etiqueta: 'Empezar cada palabra con mayúscula', valor: false },
          { id: 'numero', tipo: 'check', etiqueta: 'Añadir un número de dos cifras al final', valor: false }
        ],
        procesar: function (t, op) {
          var n = op.palabras, c = op.cantidad, i, j;
          if (!(n >= 3 && n <= 10) || n !== Math.floor(n)) return aviso('El número de palabras debe ser un entero de 3 a 10.');
          if (!(c >= 1 && c <= 20) || c !== Math.floor(c)) return aviso('Pide entre 1 y 20 frases, con un número entero.');
          var lineas = [];
          for (i = 0; i < c; i++) {
            var ws = [];
            for (j = 0; j < n; j++) { var w = PAL[A.entero(PAL.length)]; ws.push(op.mayus ? w.charAt(0).toUpperCase() + w.slice(1) : w); }
            if (op.numero) ws.push(String(A.entre(10, 99)));
            lineas.push(ws.join(op.separador));
          }
          var bits = n * Math.log(PAL.length) / Math.LN2 + (op.numero ? Math.log(90) / Math.LN2 : 0);
          return { salida: lineas.join('\n'), filas: [TH.fila('palabras', 'Palabras de cada frase', n, 'n0'), TH.fila('lista', 'Palabras de la lista', PAL.length, 'n0'),
            TH.fila('entropia', 'Entropía aproximada', bits, function (x) { return TH.fmt(x, 1) + ' bits'; }), TH.fila('nivel', 'Fortaleza', nivel(bits), 'txt')] };
        }
      });

    }, function () { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); });
  });
})();
