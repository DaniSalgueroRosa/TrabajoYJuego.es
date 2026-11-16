(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/minificar.js').then(function () {
      var Mi = TH.minificar, MIME = { html: 'text/html;charset=utf-8', css: 'text/css;charset=utf-8', js: 'text/javascript;charset=utf-8' };
      function bytes(t) { return new TextEncoder().encode(t).length; }
      TH.texto(raiz, {
        entrada: { etiqueta: 'Tu código', ph: 'Pega aquí el HTML, el CSS o el JavaScript…', ejemplo: "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>Mi página</title>\n  <style>\n    /* estilos */\n    .caja  >  p { color : #333 ; margin : 0 auto ; }\n  </style>\n</head>\n<body>\n  <!-- cabecera -->\n  <h1 class=\"titulo   grande\">Hola, mundo</h1>\n  <p>Un texto con <b>negrita</b> y <i>cursiva</i>.</p>\n  <script>\n    // saludo\n    function saludar(nombre) {\n      return \"Hola, \" + nombre;\n    }\n    console.log( saludar(\"Ana\") );\n  </script>\n</body>\n</html>\n" },
        salida: { etiqueta: 'Código minificado' },
        filas: 12,
        botones: [{ texto: 'Descargar el archivo', accion: function (api) { var v = api.valores(); if (api.salida.value) TH.descargar(api.salida.value, 'codigo.min.' + v.tipo, MIME[v.tipo]); } }],
        opciones: [
          { id: 'tipo', tipo: 'select', etiqueta: 'Qué lenguaje es', valor: 'html', opciones: [['html', 'HTML'], ['css', 'CSS'], ['js', 'JavaScript']] },
          { id: 'bloques', tipo: 'check', etiqueta: 'Quitar los espacios entre etiquetas de bloque (div, p, li…)', valor: true, mostrarSi: function (v) { return v.tipo === 'html'; } },
          { id: 'incrustado', tipo: 'check', etiqueta: 'Minificar también el CSS y el JavaScript incluidos en el HTML', valor: true, mostrarSi: function (v) { return v.tipo === 'html'; } }
        ],
        procesar: function (t, op) {
          if (!t.trim()) return { salida: '' };
          var r = Mi[op.tipo](t, { bloques: op.bloques, incrustado: op.incrustado }), a = bytes(t), c = bytes(r.salida);
          return { salida: r.salida, avisos: r.avisos, filas: [
            TH.fila('original', 'Tamaño original', a, function (n) { return TH.pl(n, 'byte', 'bytes'); }),
            TH.fila('resultado', 'Tamaño minificado', c, function (n) { return TH.pl(n, 'byte', 'bytes'); }),
            TH.fila('ahorro', 'Reducción', Math.round((a - c) / a * 1000) / 10, 'pct')] };
        }
      });
    }, function () { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); });
  });
})();
