(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/diagrama.js').then(function () {
      var D = TH.diagrama, h = TH.h, ultimo = null, temporizador = null, estado;
      var EJEMPLO = '# Pedido en una tienda en línea\nInicio -> /Recibir el pedido/ -> ¿Hay existencias?\n¿Hay existencias? -> Preparar el envío | Sí\n¿Hay existencias? -> Avisar al cliente | No\nAvisar al cliente -> ¿Quiere esperar?\n¿Quiere esperar? -> Reponer existencias | Sí\n¿Quiere esperar? -> Cancelar el pedido | No\nReponer existencias -> ¿Hay existencias?\nPreparar el envío -> Enviar y cobrar -> Fin\nCancelar el pedido -> Fin';
      var lienzo = document.createElement('canvas').getContext('2d');
      function medir(t) { lienzo.font = '14px Arial, Helvetica, sans-serif'; return lienzo.measureText(t).width; }

      var entrada = h('textarea', { id: 'dg-entrada', rows: 14, spellcheck: 'false', placeholder: 'Inicio -> Hacer algo -> ¿Todo bien?\n¿Todo bien? -> Fin | Sí\n¿Todo bien? -> Hacer algo | No' });
      var ajustar = h('input', { type: 'checkbox', id: 'dg-ajustar', checked: true });
      var vista = h('div', { class: 'dg-vista', id: 'dg-vista', tabindex: '0', role: 'region', 'aria-label': 'Diagrama de flujo' });
      var medidas = h('div', { class: 'herr-salida' });
      var botones = h('div', { class: 'herr-acciones' });
      TH.vaciar(raiz);
      raiz.appendChild(h('div', { class: 'herr-dos dg-dos' },
        h('div', { class: 'campo' }, h('label', { for: 'dg-entrada', texto: 'Escribe los pasos, uno o varios por línea' }), entrada,
          h('span', { class: 'campo-ayuda', texto: 'Une los pasos con ->. Para poner texto en una flecha, añade | y el texto al final de la línea. Los pasos entre ¿ ? son decisiones; Inicio y Fin tienen forma de píldora. Las líneas con # son comentarios.' })),
        h('div', { class: 'campo' }, h('span', { class: 'campo-titulo', texto: 'Diagrama' }), vista)));
      raiz.appendChild(h('div', { class: 'herr-campos' }, h('div', { class: 'campo campo--check' }, h('span', { class: 'campo-check' }, ajustar, h('label', { for: 'dg-ajustar', texto: 'Ajustar el dibujo al ancho de la pantalla' })))));
      raiz.appendChild(botones); raiz.appendChild(medidas);
      estado = TH.estado(raiz);

      function pintar() {
        var g = D.analizar(entrada.value), cont = [];
        TH.vaciar(medidas); TH.vaciar(vista); ultimo = null;
        [].forEach.call(botones.querySelectorAll('[data-necesita]'), function (b) { b.disabled = true; });
        g.errores.forEach(function (e) { medidas.appendChild(h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: e })); });
        if (g.errores.length) return;
        if (!g.nodos.length) { vista.appendChild(h('p', { class: 'herr-vacio', texto: 'Escribe los pasos a la izquierda, o prueba con el ejemplo, y aquí aparecerá el diagrama.' })); return; }
        var d = D.disponer(g, { medir: medir }), svg = D.svg(d, { titulo: 'Diagrama de flujo' });
        /* El dibujo se lee como XML y se inserta como nodos: nada pasa por innerHTML, así que un texto raro del usuario nunca puede convertirse en código. */
        var analizado = new DOMParser().parseFromString(svg, 'image/svg+xml');
        if (analizado.getElementsByTagName('parsererror').length) { medidas.appendChild(h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido dibujar el diagrama. Revisa el texto.' })); return; }
        vista.appendChild(document.importNode(analizado.documentElement, true));
        vista.classList.toggle('dg-vista--ajustada', ajustar.checked);
        ultimo = { svg: svg, d: d };
        [].forEach.call(botones.querySelectorAll('[data-necesita]'), function (b) { b.disabled = false; });
        var dl = h('dl', { class: 'herr-res herr-res--compacto' }), decisiones = g.nodos.filter(function (n) { return n.forma === 'decision'; }).length, vueltas = d.aristas.filter(function (a) { return a.atras; }).length;
        [TH.fila('pasos', 'Pasos', g.nodos.length, 'n0'), TH.fila('conexiones', 'Conexiones', g.aristas.length, 'n0'), TH.fila('decisiones', 'Decisiones', decisiones, 'n0'), TH.fila('bucles', 'Flechas que vuelven atrás', vueltas, 'n0')].forEach(function (fi) {
          dl.appendChild(h('div', { class: 'herr-fila' }, h('dt', { texto: fi.t }), h('dd', { 'data-k': fi.k, 'data-v': String(fi.v), texto: fi.f })));
        });
        medidas.appendChild(dl);
        g.avisos.forEach(function (a) { medidas.appendChild(h('p', { class: 'herr-estado herr-estado--aviso', role: 'status', texto: a })); });
      }
      function programar() { clearTimeout(temporizador); temporizador = setTimeout(pintar, 120); }

      function png() {
        if (!ultimo) return Promise.reject(new Error('Escribe primero el diagrama.'));
        return new Promise(function (ok, mal) {
          var d = ultimo.d, k = Math.min(2, 8000 / Math.max(d.ancho, d.alto)), url = URL.createObjectURL(new Blob([ultimo.svg], { type: 'image/svg+xml;charset=utf-8' })), img = new Image();
          img.onload = function () {
            var cv = document.createElement('canvas'); cv.width = Math.round(d.ancho * k); cv.height = Math.round(d.alto * k);
            var g = cv.getContext('2d'); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
            URL.revokeObjectURL(url); cv.toBlob(function (b) { b ? ok(b) : mal(new Error('No se ha podido crear la imagen.')); }, 'image/png');
          };
          img.onerror = function () { URL.revokeObjectURL(url); mal(new Error('No se ha podido crear la imagen.')); };
          img.src = url;
        });
      }
      botones.appendChild(h('button', { class: 'boton', type: 'button', id: 'dg-png', 'data-necesita': '1', disabled: true, onclick: function () {
        png().then(function (b) { TH.descargar(b, 'diagrama-de-flujo.png', 'image/png'); estado.poner('Imagen lista: diagrama-de-flujo.png (' + TH.tamano(b.size) + ').', 'ok'); }, function (e) { estado.poner(e.message, 'error'); });
      } }, 'Descargar imagen (PNG)'));
      botones.appendChild(h('button', { class: 'boton boton--secundario', type: 'button', id: 'dg-svg', 'data-necesita': '1', disabled: true, onclick: function () {
        if (!ultimo) return; var b = new Blob([ultimo.svg], { type: 'image/svg+xml;charset=utf-8' }); TH.descargar(b, 'diagrama-de-flujo.svg', 'image/svg+xml'); estado.poner('Archivo listo: diagrama-de-flujo.svg (' + TH.tamano(b.size) + ').', 'ok');
      } }, 'Descargar SVG'));
      botones.appendChild(h('button', { class: 'boton boton--secundario', type: 'button', id: 'dg-copiar', onclick: function () { if (entrada.value.trim()) TH.copiar(entrada.value, estado); else estado.poner('No hay texto que copiar.', 'error'); } }, 'Copiar el texto'));
      botones.appendChild(h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { entrada.value = EJEMPLO; pintar(); } }, 'Probar con un ejemplo'));
      botones.appendChild(h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { entrada.value = ''; pintar(); entrada.focus(); } }, 'Borrar'));
      entrada.addEventListener('input', programar);
      ajustar.addEventListener('change', function () { vista.classList.toggle('dg-vista--ajustada', ajustar.checked); });
      pintar();
    }, function () {
      var p = document.createElement('p'); p.className = 'herr-estado herr-estado--error'; p.setAttribute('role', 'alert');
      p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.'; TH.vaciar(raiz).appendChild(p);
    });
  });
})();
