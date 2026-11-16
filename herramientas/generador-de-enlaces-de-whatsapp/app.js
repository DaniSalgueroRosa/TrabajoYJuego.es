(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    Promise.all([TH.script('lib/qr.js')]).then(function () {
      var cg = raiz.querySelector('#herr-carga');
      if (cg) cg.remove();

      var h = TH.h, QR = TH.qr;
      var PREFIJOS = [["34", "España (+34)"], ["351", "Portugal (+351)"], ["33", "Francia (+33)"], ["39", "Italia (+39)"], ["49", "Alemania (+49)"], ["44", "Reino Unido (+44)"], ["52", "México (+52)"], ["54", "Argentina (+54)"], ["57", "Colombia (+57)"], ["56", "Chile (+56)"], ["51", "Perú (+51)"], ["58", "Venezuela (+58)"], ["593", "Ecuador (+593)"], ["598", "Uruguay (+598)"], ["595", "Paraguay (+595)"], ["591", "Bolivia (+591)"], ["506", "Costa Rica (+506)"], ["507", "Panamá (+507)"], ["503", "El Salvador (+503)"], ["502", "Guatemala (+502)"], ["504", "Honduras (+504)"], ["505", "Nicaragua (+505)"], ["53", "Cuba (+53)"], ["1", "EE. UU. y Canadá (+1)"], ["55", "Brasil (+55)"], ["otro", "Otro país (escribe el número con + o 00)"]];
      function cod(s) { return encodeURIComponent(s).replace(/[!'()*]/g, function (c) { return '%' + c.charCodeAt(0).toString(16).toUpperCase(); }); }
      function numero(prefijo, tel) {
        var s = tel.replace(/[\s.\-()]/g, '');
        if (!s) return null;
        if (!/^(\+|00)?\d+$/.test(s)) throw new Error('El teléfono solo puede tener cifras y, al principio, un + o un 00. Se admiten espacios, guiones, puntos y paréntesis.');
        var intl = /^(\+|00)/.test(s), d = s.replace(/^(\+|00)/, '');
        if (!intl) { if (prefijo === 'otro') throw new Error('Con «Otro país» escribe el número completo empezando por + o 00, por ejemplo +34 600 123 456.'); d = prefijo + d; }
        if (d.length < 8 || d.length > 15) throw new Error('Un número internacional tiene entre 8 y 15 cifras, contando el prefijo del país. El tuyo tiene ' + d.length + '.');
        return d;
      }
      TH.texto(raiz, {
        entrada: { etiqueta: 'Mensaje (opcional)', ph: 'Hola, me gustaría información sobre…', ejemplo: 'Hola, me gustaría reservar mesa para dos personas el sábado.' },
        salida: { etiqueta: 'Enlace de WhatsApp' },
        filas: 5,
        opciones: [
          { id: 'prefijo', tipo: 'select', etiqueta: 'País del teléfono', valor: '34', opciones: PREFIJOS },
          { id: 'telefono', tipo: 'texto', etiqueta: 'Teléfono', ph: '600 123 456', ayuda: 'Si empiezas por + o 00, se ignora el país elegido.', ancho: 'completo' }
        ],
        procesar: function (msg, op, api) {
          var d = numero(op.prefijo, op.telefono), m = msg.replace(/\r\n?/g, '\n').trim();
          if (d === null && !m) return { salida: '', avisos: ['Escribe un teléfono, un mensaje o las dos cosas para crear el enlace.'] };
          var enlace = 'https://wa.me/' + (d || '') + (m ? '?text=' + cod(m) : ''), avisos = [];
          if (enlace.length > 2000) avisos.push('El enlace es muy largo (' + enlace.length + ' caracteres) y algunas aplicaciones o navegadores podrían cortarlo. Acorta el mensaje.');
          if (d === null) avisos.push('Sin teléfono, el enlace abre WhatsApp para que elijas a quién enviar el mensaje.');
          if (d && /^0/.test(op.telefono.replace(/[\s.\-()+]/g, '')) && !/^(\+|00)/.test(op.telefono.trim())) avisos.push('El número empieza por 0. Con el prefijo del país suele escribirse sin ese cero; si el enlace no abre el chat, prueba a quitarlo.');
          var codigo = '<a href="' + enlace + '" target="_blank" rel="noopener noreferrer">Escríbenos por WhatsApp</a>';
          var area = h('textarea', { id: 't-html', rows: 3, readonly: true, spellcheck: 'false' }); area.value = codigo;
          var lienzo = h('canvas', { id: 'wa-qr', role: 'img', 'aria-label': 'Código QR del enlace de WhatsApp' }), qr = null;
          try { qr = QR.generar(enlace, { nivel: 'M' }); QR.aLienzo(qr, lienzo, { px: 240, margen: 2 }); } catch (e) { avisos.push('No se ha podido crear el código QR: ' + e.message); }
          function entregar(nombre, blob) { TH.entregas = [{ nombre: nombre, blob: blob }]; TH.descargar(blob, nombre); api.estado.poner('Descargado: ' + nombre + ' (' + TH.tamano(blob.size) + ').', 'ok'); }
          var html = h('div', { class: 'herr-salida' },
            h('div', { class: 'herr-acciones' }, h('a', { class: 'boton boton--secundario', id: 'wa-probar', href: enlace, target: '_blank', rel: 'noopener noreferrer', texto: 'Probar el enlace' })),
            qr ? h('div', { class: 'campo' }, h('span', { texto: 'Código QR' }), lienzo, h('div', { class: 'herr-acciones' }, h('button', { class: 'boton boton--secundario', type: 'button', id: 'wa-png', onclick: function () { TH.lienzoABlob(lienzo, 'image/png').then(function (b) { entregar('whatsapp-qr.png', b); }); } }, 'Descargar el QR (PNG)'))) : null,
            h('div', { class: 'campo' }, h('label', { for: 't-html', texto: 'Código HTML para tu web' }), area),
            h('div', { class: 'herr-acciones' }, h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { TH.copiar(codigo, api.estado); } }, 'Copiar el código HTML')));
          return { salida: enlace, avisos: avisos, html: html, filas: [
            TH.fila('telefono', 'Teléfono internacional', d ? '+' + d : 'Sin teléfono', 'txt'), TH.fila('cifras', 'Cifras del número', d ? d.length : 0, 'n0'), TH.fila('longitud', 'Longitud del enlace', enlace.length, 'n0')] };
        }
      });

    }, function () { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); });
  });
})();
