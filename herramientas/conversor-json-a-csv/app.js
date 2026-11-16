(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/json.js').then(function () {
      var J = TH.json;

      function esc(t, sep) { return /[\r\n"]/.test(t) || t.indexOf(sep) >= 0 ? '"' + t.replace(/"/g, '""') + '"' : t; }
      function celda(nodo, aplanado, neutral) {
        if (!nodo) return '';
        if (nodo.t === 'z') return '';
        if (nodo.t === 's') { var s = JSON.parse(nodo.r); return neutral && /^[=+\-@\t\r]/.test(s) ? "'" + s : s; }
        if (nodo.t === 'n' || nodo.t === 'b') return nodo.r;
        return J.escribir(nodo, { sangria: null });
      }
      function aplanar(nodo, pref, out, flat) {
        nodo.p.forEach(function (p) {
          var c = pref + p.c;
          if (flat && p.v.t === 'o' && p.v.p.length) aplanar(p.v, c + '.', out, flat); else out.push([c, p.v]);
        });
        return out;
      }
      TH.texto(raiz, {
        entrada: { etiqueta: 'Pega aquí tu JSON', ph: '[{"nombre":"Ana","edad":30},{"nombre":"Luis","edad":25}]', ejemplo: '[{"id":1,"nombre":"Ana","direccion":{"ciudad":"Madrid","cp":"28001"},"etiquetas":["socio","vip"]},{"id":2,"nombre":"Luis","direccion":{"ciudad":"Sevilla","cp":"41001"},"activo":true}]' },
        salida: { etiqueta: 'CSV' },
        filas: 11,
        descargar: { nombre: 'datos.csv', mime: 'text/csv;charset=utf-8' },
        botones: [{ texto: 'Descargar CSV para Excel (con BOM)', accion: function (api) { if (api.salida.value) TH.descargar('\ufeff' + api.salida.value, 'datos.csv', 'text/csv;charset=utf-8'); } }],
        opciones: [
          { id: 'sep', tipo: 'select', etiqueta: 'Separador', valor: ',', opciones: [[',', 'Coma (,)'], [';', 'Punto y coma (;) — Excel en español'], ['\t', 'Tabulador'], ['|', 'Barra vertical (|)']] },
          { id: 'aplanar', tipo: 'check', etiqueta: 'Aplanar los objetos anidados (direccion.ciudad)', valor: true },
          { id: 'formulas', tipo: 'check', etiqueta: 'Neutralizar textos que parecen fórmulas (= + - @)', valor: false }
        ],
        procesar: function (t, op) {
          if (!t.trim()) return { salida: '' };
          var r = J.analizar(t);
          if (!r.ok) return { salida: '', avisos: [J.describirError(r.error)] };
          var raiz = r.raiz, registros = [], avisos = [], mezcla = false, cabeceraListas = false;
          if (raiz.t === 'a') {
            var todasListas = raiz.e.length && raiz.e.every(function (x) { return x.t === 'a'; });
            if (todasListas) { cabeceraListas = true; raiz.e.forEach(function (x) { registros.push(x.e.map(function (v, i) { return ['col' + (i + 1), v]; })); }); }
            else raiz.e.forEach(function (x) { if (x.t === 'o') registros.push(aplanar(x, '', [], op.aplanar)); else { mezcla = x.t === 'a' || x.t === 'o' || mezcla; registros.push([['valor', x]]); } });
          } else if (raiz.t === 'o') registros.push(aplanar(raiz, '', [], op.aplanar));
          else return { salida: '', avisos: ['El JSON tiene que ser una lista de objetos, por ejemplo [{"a":1},{"a":2}], o un solo objeto.'] };
          if (!registros.length) return { salida: '', avisos: ['La lista está vacía: no hay datos que convertir.'] };
          var cols = [], idx = {};
          registros.forEach(function (f) { f.forEach(function (p) { if (!Object.prototype.hasOwnProperty.call(idx, '$' + p[0])) { idx['$' + p[0]] = cols.length; cols.push(p[0]); } }); });
          var lineas = [cols.map(function (c) { return esc(c, op.sep); }).join(op.sep)];
          registros.forEach(function (f) {
            var fila = new Array(cols.length), k;
            for (k = 0; k < cols.length; k++) fila[k] = '';
            f.forEach(function (p) { fila[idx['$' + p[0]]] = celda(p[1], op.aplanar, op.formulas); });
            lineas.push(fila.map(function (c) { return esc(c, op.sep); }).join(op.sep));
          });
          if (registros.some(function (f) { return f.length === 1 && f[0][0] === 'valor'; }) && raiz.t === 'a' && !raiz.e.every(function (x) { return x.t !== 'o'; })) avisos.push('Algunos elementos de la lista no son objetos: sus valores se han puesto en la columna «valor».');
          return { salida: lineas.join('\n'), filas: [TH.fila('filas', 'Filas de datos', registros.length, 'n0'), TH.fila('columnas', 'Columnas', cols.length, 'n0')], avisos: avisos };
        }
      });

    }, function () { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); });
  });
})();
