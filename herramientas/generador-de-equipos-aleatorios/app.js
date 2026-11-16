(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/azar.js').then(function () {
      var A = TH.azar, cg = raiz.querySelector('#herr-carga');
      if (cg) cg.remove();

      function lineas(t) { return t.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
      var forzar = true, clave = '', equipos = [];
      TH.texto(raiz, {
        entrada: { etiqueta: 'Participantes (uno por línea)', ph: 'Ana\nLuis\nMarta\nPablo\nElena\nJorge', ejemplo: 'Ana\nLuis\nMarta\nPablo\nElena\nJorge\nLucía\nIván\nSara\nDiego' },
        salida: { etiqueta: 'Equipos' },
        filas: 12,
        botones: [{ texto: 'Mezclar de nuevo', accion: function (api) { forzar = true; api.actualizar(); } }],
        opciones: [
          { id: 'modo', tipo: 'select', etiqueta: 'Repartir según', valor: 'equipos', opciones: [['equipos', 'Número de equipos'], ['tamano', 'Personas por equipo']] },
          { id: 'cantidad', etiqueta: 'Cantidad', valor: 2, entero: true },
          { id: 'formato', tipo: 'select', etiqueta: 'Presentación', valor: 'listas', opciones: [['listas', 'Una lista por equipo'], ['lineas', 'Un equipo por línea']] },
          { id: 'capitanes', tipo: 'check', etiqueta: 'Marcar un capitán o capitana por equipo', valor: false }
        ],
        procesar: function (t, op) {
          var nombres = lineas(t), c = op.cantidad, n, i;
          if (!nombres.length) return { salida: '', avisos: ['Escribe o pega los participantes, uno por línea, y aquí aparecerán los equipos.'] };
          if (!(c >= 1) || c !== Math.floor(c)) return { salida: '', avisos: ['Indica la cantidad con un número entero de 1 en adelante.'] };
          n = op.modo === 'equipos' ? c : Math.ceil(nombres.length / c);
          if (n < 2) return { salida: '', filas: [TH.fila('personas', 'Participantes', nombres.length, 'n0')], avisos: ['Con ese tamaño solo saldría un equipo. Pide equipos más pequeños o añade más participantes.'] };
          if (n > nombres.length) return { salida: '', filas: [TH.fila('personas', 'Participantes', nombres.length, 'n0')], avisos: ['Hay ' + nombres.length + (nombres.length === 1 ? ' participante' : ' participantes') + ' y pides ' + n + ' equipos: cada equipo necesita al menos una persona.'] };
          var k = [nombres.join('\u0001'), n].join('|');
          if (forzar || k !== clave) {
            var mezcla = A.barajar(nombres); equipos = [];
            for (i = 0; i < n; i++) equipos.push([]);
            mezcla.forEach(function (x, j) { equipos[j % n].push(x); });
            clave = k; forzar = false;
          }
          var tam = equipos.map(function (e) { return e.length; }), mn = Math.min.apply(null, tam), mx = Math.max.apply(null, tam);
          var salida = equipos.map(function (e, j) {
            var l = e.map(function (x, p) { return x + (op.capitanes && p === 0 ? ' (capitán/a)' : ''); });
            return op.formato === 'lineas' ? 'Equipo ' + (j + 1) + ': ' + l.join(', ') : 'Equipo ' + (j + 1) + '\n' + l.map(function (x) { return '- ' + x; }).join('\n');
          }).join(op.formato === 'lineas' ? '\n' : '\n\n');
          return { salida: salida, filas: [TH.fila('personas', 'Participantes', nombres.length, 'n0'), TH.fila('equipos', 'Equipos', n, 'n0'), TH.fila('tamanos', 'Personas por equipo', mn === mx ? String(mn) : 'de ' + mn + ' a ' + mx, 'txt')] };
        }
      });

    }, function () { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); });
  });
})();
