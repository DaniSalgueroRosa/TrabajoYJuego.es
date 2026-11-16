(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    Promise.all([TH.script('lib/estilo.js')]).then(function () {
      var cg = raiz.querySelector('#herr-carga');
      if (cg) cg.remove();

      var E = TH.estilo, h = TH.h;
      var EJEMPLO = "En la era digital actual, la tecnología juega un papel fundamental en la educación. Además, permite que los estudiantes accedan a información con el fin de aprender a su ritmo. Además, facilita la comunicación con los profesores. Asimismo, cabe destacar que muchos centros todavía no la usan debido a que faltan recursos. Por otro lado, es importante señalar que formar al profesorado es clave. Además, hay que llevar a cabo cambios en los horarios.";
      function aviso(t) { return { salida: '', avisos: [t] }; }
      TH.texto(raiz, {
        entrada: { etiqueta: 'Texto que quieres pulir', ph: 'Pega aquí tu texto…', ejemplo: EJEMPLO },
        salida: { etiqueta: 'Texto pulido' },
        descargar: { nombre: 'texto-pulido.txt' },
        opciones: [
          { id: 'nivel', tipo: 'select', etiqueta: 'Intensidad', valor: 'normal', opciones: [['suave', 'Suave: aperturas vacías y fórmulas largas'], ['normal', 'Normal: además, conectores repetidos'], ['intenso', 'Intenso: más sustituciones y un conector por tanda']] },
          { id: 'aperturas', tipo: 'check', etiqueta: 'Quitar aperturas vacías («Cabe destacar que…»)', valor: true },
          { id: 'sustituciones', tipo: 'check', etiqueta: 'Cambiar fórmulas largas por palabras directas («con el fin de» → «para»)', valor: true },
          { id: 'conectores', tipo: 'check', etiqueta: 'Quitar conectores repetidos al abrir frase (solo en Normal e Intenso)', valor: true }
        ],
        procesar: function (t, op) {
          if (!t.trim()) return { salida: '' };
          var r = E.humanizar(t, { nivel: op.nivel, aperturas: op.aperturas, sustituciones: op.sustituciones, conectores: op.conectores }), avisos = [];
          function n(tipo) { return r.cambios.filter(function (c) { return c.tipo === tipo; }).length; }
          var restos = r.restos.reduce(function (a, x) { return a + x.veces; }, 0);
          if (!r.cambios.length) avisos.push('No he encontrado nada que cambiar automáticamente con estas opciones.');
          r.largas.slice(0, 3).forEach(function (l) { avisos.push('Frase de ' + l.palabras + ' palabras que conviene partir: «' + (l.frase.length > 70 ? l.frase.slice(0, 70).trim() + '…' : l.frase) + '»'); });
          if (r.largas.length > 3) avisos.push('Hay ' + (r.largas.length - 3) + ' frases largas más.');
          if (restos) avisos.push('Quedan fórmulas que conviene reescribir a mano: ' + r.restos.slice(0, 5).map(function (x) { return '«' + x.frase + '»' + (x.veces > 1 ? ' ×' + x.veces : ''); }).join(', ') + '.');
          var html = h('div', { class: 'herr-salida' },
            r.cambios.length ? h('details', { class: 'herr-detalle' }, h('summary', { texto: 'Ver los ' + r.cambios.length + ' cambios hechos' }),
              h('ul', {}, r.cambios.slice(0, 60).map(function (c) { return h('li', { texto: c.tipo + ': «' + c.antes + '»' + (c.despues ? ' → «' + c.despues + '»' : ' → (se quita)') }); }))) : null,
            h('p', { class: 'herr-nota', texto: 'Es un editor de estilo: no garantiza que ningún detector de textos generados por IA lea el resultado como escrito por una persona. Revisa el texto entero antes de usarlo.' }));
          return { salida: r.texto, avisos: avisos, html: html, filas: [
            TH.fila('cambios', 'Cambios hechos', r.cambios.length, 'n0'), TH.fila('aperturas', 'Aperturas vacías quitadas', n('apertura'), 'n0'), TH.fila('sustituciones', 'Fórmulas sustituidas', n('sustitución'), 'n0'),
            TH.fila('conectores', 'Conectores repetidos quitados', n('conector'), 'n0'), TH.fila('largas', 'Frases largas por revisar', r.largas.length, 'n0'), TH.fila('restos', 'Fórmulas que quedan por reescribir', restos, 'n0')] };
        }
      });

    }, function () { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); });
  });
})();
