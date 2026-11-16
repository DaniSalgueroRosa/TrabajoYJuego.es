(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/json.js').then(function () {
      var J = TH.json;

      var bytes = function (t) { return new TextEncoder().encode(t).length; };
      TH.texto(raiz, {
        entrada: { etiqueta: 'Pega aquí tu JSON', ph: '{"nombre":"Ana","edad":30}', ejemplo: '{"nombre":"Ana","edad":30,"aficiones":["leer","correr"],"direccion":{"calle":"Calle Mayor 1","cp":"28001"},"activo":true,"saldo":1250.50}' },
        salida: { etiqueta: 'JSON formateado' },
        filas: 12,
        descargar: { nombre: 'datos.json', mime: 'application/json;charset=utf-8' },
        opciones: [
          { id: 'modo', tipo: 'select', etiqueta: 'Qué hacer', valor: 'bello', opciones: [['bello', 'Embellecer (con sangría)'], ['min', 'Minificar (sin espacios)']] },
          { id: 'sangria', tipo: 'select', etiqueta: 'Sangría', valor: '2', opciones: [['2', '2 espacios'], ['4', '4 espacios'], ['tab', 'Tabulador']], mostrarSi: function (v) { return v.modo === 'bello'; } },
          { id: 'ordenar', tipo: 'check', etiqueta: 'Ordenar las claves alfabéticamente', valor: false }
        ],
        procesar: function (t, op) {
          if (!t.trim()) return { salida: '' };
          var r = J.analizar(t);
          if (!r.ok) return { salida: '', filas: [TH.fila('estado', 'Estado', 'JSON no válido', 'txt'), TH.fila('error-linea', 'Línea del error', r.error.linea, 'n0'), TH.fila('error-columna', 'Columna del error', r.error.columna, 'n0')], avisos: [J.describirError(r.error)] };
          var sang = op.modo === 'min' ? null : op.sangria === 'tab' ? '\t' : op.sangria === '4' ? '    ' : '  ';
          var s = J.escribir(r.raiz, { sangria: sang, ordenar: op.ordenar }), avisos = [];
          if (r.stats.duplicadas.length) {
            var nom = r.stats.duplicadas.slice(0, 3).map(function (d) { return '«' + d.clave + '»'; }).join(', ');
            avisos.push('Hay claves repetidas dentro de un mismo objeto (' + nom + (r.stats.duplicadas.length > 3 ? '…' : '') + '). JSON lo permite, pero casi todos los programas se quedan solo con la última. Se han conservado todas.');
          }
          return { salida: s, filas: [TH.fila('estado', 'Estado', 'JSON válido', 'txt'), TH.fila('bytes-entrada', 'Tamaño original', bytes(t.charCodeAt(0) === 0xFEFF ? t.slice(1) : t), function (n) { return TH.pl(n, 'byte', 'bytes'); }), TH.fila('bytes-salida', 'Tamaño del resultado', bytes(s), function (n) { return TH.pl(n, 'byte', 'bytes'); })], avisos: avisos };
        }
      });

    }, function () { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); });
  });
})();
