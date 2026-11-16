(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/azar.js').then(function () {
      var A = TH.azar, cg = raiz.querySelector('#herr-carga');
      if (cg) cg.remove();
      function clave(x) { return x.trim().toLowerCase(); }
      var forzar = true, k0 = '', reparto = null;
      TH.texto(raiz, {
        entrada: { etiqueta: 'Participantes (uno por línea)', ph: 'Ana\nLuis\nMarta\nPablo', ejemplo: 'Ana\nLuis\nMarta\nPablo\nElena\nJorge' },
        salida: { etiqueta: 'Quién regala a quién' },
        filas: 9,
        botones: [{ texto: 'Sortear de nuevo', accion: function (api) { forzar = true; api.actualizar(); } }],
        opciones: [
          { id: 'excluir', tipo: 'texto', etiqueta: 'Parejas que no pueden tocarse (opcional)', ph: 'Ana-Luis, Marta-Pablo' },
          { id: 'formato', tipo: 'select', etiqueta: 'Presentación', valor: 'flecha', opciones: [['flecha', 'Ana → Luis'], ['frase', 'Ana regala a Luis']] }
        ],
        procesar: function (t, op) {
          var nombres = t.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean), avisos = [], i;
          if (!nombres.length) return { salida: '', avisos: ['Escribe los participantes, uno por línea, y aquí aparecerá el reparto.'] };
          var vistos = {}, repes = [];
          nombres.forEach(function (n) { var c = clave(n); if (vistos[c]) repes.push(n); vistos[c] = true; });
          if (repes.length) return { salida: '', avisos: ['Hay nombres repetidos (' + repes.slice(0, 3).join(', ') + '). Añade un apellido o una inicial para distinguirlos.'] };
          if (nombres.length < 2) return { salida: '', filas: [TH.fila('personas', 'Participantes', 1, 'n0')], avisos: ['Hacen falta al menos dos participantes.'] };
          var prohibidas = {}, nProh = 0;
          String(op.excluir || '').split(/[,;\n]/).forEach(function (par) {
            if (!par.trim()) return;
            var m = /^(.+?)\s*[-\/&]\s*(.+)$/.exec(par.trim());
            if (!m) { avisos.push('No entiendo la exclusión «' + par.trim() + '». Escríbela como Ana-Luis.'); return; }
            var a = clave(m[1]), b = clave(m[2]);
            if (!vistos[a] || !vistos[b]) { avisos.push('En la exclusión «' + par.trim() + '» hay un nombre que no está en la lista.'); return; }
            prohibidas[a + '|' + b] = prohibidas[b + '|' + a] = true; nProh++;
          });
          var llave = nombres.join('\u0001') + '|' + Object.keys(prohibidas).sort().join(',');
          if (forzar || llave !== k0) {
            reparto = null;
            for (var intento = 0; intento < 3000 && !reparto; intento++) {
              var mezcla = A.barajar(nombres), bien = true;
              for (i = 0; i < nombres.length && bien; i++) {
                var da = nombres[i], recibe = mezcla[i];
                if (clave(da) === clave(recibe) || prohibidas[clave(da) + '|' + clave(recibe)]) bien = false;
              }
              if (bien) reparto = nombres.map(function (n, j) { return [n, mezcla[j]]; });
            }
            k0 = llave; forzar = false;
          }
          var filas = [TH.fila('personas', 'Participantes', nombres.length, 'n0'), TH.fila('exclusiones', 'Parejas excluidas', nProh, 'n0')];
          if (!reparto) { avisos.unshift('Con esas exclusiones no hay ningún reparto posible. Quita alguna pareja o añade más participantes.'); return { salida: '', filas: filas, avisos: avisos }; }
          return { salida: reparto.map(function (p) { return op.formato === 'frase' ? p[0] + ' regala a ' + p[1] + '.' : p[0] + ' → ' + p[1]; }).join('\n'), filas: filas, avisos: avisos };
        }
      });
    }, function () { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); });
  });
})();
