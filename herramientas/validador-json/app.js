(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/json.js').then(function () {
      var J = TH.json;

      var TIPOS = { o: 'objeto', a: 'lista (array)', s: 'texto', n: 'número', b: 'verdadero o falso', z: 'nulo (null)' };
      TH.texto(raiz, {
        entrada: { etiqueta: 'Pega aquí tu JSON', ph: '{"nombre":"Ana"}', ejemplo: '{"nombre":"Ana","edad":30,"aficiones":["leer","correr"],"direccion":{"calle":"Calle Mayor 1"},"activo":true}' },
        salida: { etiqueta: 'Resultado de la comprobación' },
        filas: 9,
        procesar: function (t) {
          if (!t.trim()) return { salida: '' };
          var r = J.analizar(t);
          if (!r.ok) {
            var linea = t.split('\n')[r.error.linea - 1] || '', col = r.error.columna, ini = Math.max(0, col - 41), trozo = linea.slice(ini, ini + 90).replace(/\r$/, '');
            var marca = h2('pre', { class: 'json-error', 'aria-label': 'Línea del error' }, (ini > 0 ? '…' : '') + trozo + '\n' + new Array(col - ini + (ini > 0 ? 1 : 0)).join(' ') + '^ aquí');
            return { salida: 'JSON no válido.\n\n' + J.describirError(r.error), filas: [TH.fila('estado', 'Resultado', 'JSON no válido', 'txt'), TH.fila('error-linea', 'Línea del error', r.error.linea, 'n0'), TH.fila('error-columna', 'Columna del error', r.error.columna, 'n0')], html: marca };
          }
          var s = r.stats, tipo = TIPOS[r.raiz.t], avisos = [];
          if (s.duplicadas.length) avisos.push('El JSON es válido, pero repite claves dentro de un mismo objeto: ' + s.duplicadas.slice(0, 5).map(function (d) { return '«' + d.clave + '» (línea ' + (t.slice(0, d.pos).split('\n').length) + ')'; }).join(', ') + '. Casi todos los programas se quedan solo con la última.');
          var resumen = ['JSON válido.', '', 'Tipo del valor principal: ' + tipo, 'Objetos: ' + s.objetos, 'Listas: ' + s.matrices, 'Claves: ' + s.claves, 'Valores sencillos: ' + s.valores, 'Niveles de anidamiento: ' + s.profundidad].join('\n');
          return { salida: resumen, filas: [TH.fila('estado', 'Resultado', 'JSON válido', 'txt'), TH.fila('tipo', 'Tipo del valor principal', tipo, 'txt'), TH.fila('objetos', 'Objetos', s.objetos, 'n0'), TH.fila('listas', 'Listas', s.matrices, 'n0'), TH.fila('claves', 'Claves', s.claves, 'n0'),
              TH.fila('valores', 'Valores sencillos', s.valores, 'n0'), TH.fila('profundidad', 'Niveles de anidamiento', s.profundidad, 'n0')], avisos: avisos };
        }
      });
      function h2(e, a, t) { return TH.h(e, a, t); }

    }, function () { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); });
  });
})();
