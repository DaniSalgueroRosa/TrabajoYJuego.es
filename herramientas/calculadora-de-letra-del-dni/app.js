(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    Promise.all([TH.script('lib/numeros.js')]).then(function () {
      var cg = raiz.querySelector('#herr-carga');
      if (cg) cg.remove();

      var N = TH.numeros;
      TH.texto(raiz, {
        entrada: { etiqueta: 'Números de DNI o NIE (uno por línea)', ph: 'Por ejemplo: 12345678 o X1234567', ejemplo: '12345678\n12345678A\nX1234567' },
        salida: { etiqueta: 'Resultado' },
        descargar: { nombre: 'letras-dni.txt' },
        procesar: function (t) {
          if (!t.trim()) return { salida: '' };
          var lineas = t.replace(/\r\n?/g, '\n').split('\n'), salida = [], errores = [], calc = 0, bien = 0, mal = 0, avisos = [], unico = null, validas = 0;
          if (lineas.length > 1000) { lineas = lineas.slice(0, 1000); avisos.push('Se procesan las 1000 primeras líneas; el resto se ha ignorado.'); }
          lineas.forEach(function (l, i) {
            l = l.trim();
            if (!l) { salida.push(''); return; }
            var r = N.revisarDni(l);
            if (r.error) { salida.push(''); errores.push('Línea ' + (i + 1) + ': «' + l + '» no es un DNI (hasta 8 cifras) ni un NIE (X, Y o Z y hasta 7 cifras, con o sin letra final).'); return; }
            validas++; unico = r;
            if (r.ok === null) { calc++; salida.push(r.completo); }
            else if (r.ok) { bien++; salida.push(r.completo + ' → correcta'); }
            else { mal++; salida.push(r.numero + r.escrita + ' → incorrecta (la letra correcta es ' + r.esperada + ')'); }
          });
          while (salida.length && salida[salida.length - 1] === '') salida.pop();
          errores.slice(0, 3).forEach(function (e) { avisos.push(e); });
          if (errores.length > 3) avisos.push('Y ' + (errores.length - 3) + ' líneas más con problemas.');
          var filas = [TH.fila('calculadas', 'Letras calculadas', calc, 'n0'), TH.fila('correctas', 'Letras correctas', bien, 'n0'), TH.fila('incorrectas', 'Letras incorrectas', mal, 'n0'), TH.fila('errores', 'Líneas con problemas', errores.length, 'n0')];
          if (validas === 1) { filas.push(TH.fila('tipo', 'Tipo de documento', unico.tipo, 'txt'), TH.fila('letra', 'Letra de control', unico.esperada, 'txt'), TH.fila('completo', 'Número completo', unico.completo, 'txt')); }
          return { salida: salida.join('\n'), avisos: avisos, filas: filas, html: TH.h('p', { class: 'herr-nota', texto: "Solo comprueba la letra de control: no dice si el documento existe, está vigente o pertenece a alguien. Usa tus propios datos o números de ejemplo." }) };
        }
      });

    }, function () { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); });
  });
})();
