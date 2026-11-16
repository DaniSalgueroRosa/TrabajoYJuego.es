(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/azar.js').then(function () {
      var A = TH.azar, cg = raiz.querySelector('#herr-carga');
      if (cg) cg.remove();

      var h = TH.h, TEXTOS = ["El viento del norte trajo consigo el olor de la lluvia, y los vecinos se apresuraron a recoger la ropa tendida antes de que cayeran las primeras gotas.", "Para llegar a ser rápido en el teclado hay que empezar por ser preciso: cada error corregido cuesta más tiempo que escribir despacio y bien.", "La panadería de la esquina abre antes del amanecer, y desde la calle se adivina el calor del horno a través del cristal empañado.", "Mi abuela guardaba las fotografías antiguas en una caja de galletas, y cada vez que la abríamos aparecía una historia que nadie recordaba.", "El pequeño faro, construido sobre un acantilado de roca oscura, guía todavía a las barcas que vuelven a puerto cuando cae la noche.", "Cuando los alumnos terminaron el examen, el profesor recogió los folios, apagó la luz del aula y se quedó mirando el patio vacío.", "En primavera el parque se llena de bicicletas, risas y mantas extendidas sobre la hierba; es el mejor momento para leer bajo un árbol.", "Una buena contraseña, como una buena llave, no debe prestarse ni copiarse sin motivo, y conviene cambiarla si alguna vez se pierde."];
      var e = { fase: 'espera', texto: '', ini: 0, dur: 60, tildes: true, timer: null, ultimo: -1 };
      function opcion(v, t, sel) { return h('option', { value: String(v), selected: sel }, t); }
      var dur = h('select', { id: 'c-duracion' }, [opcion(30, '30 segundos'), opcion(60, '1 minuto', true), opcion(120, '2 minutos')]);
      var origen = h('select', { id: 'c-origen' }, [opcion('azar', 'Un texto al azar', true), opcion('propio', 'Mi propio texto')]);
      var propio = h('textarea', { id: 'c-propio', rows: 4, spellcheck: 'false', placeholder: 'Pega aquí el texto que quieres copiar (de 20 a 2.000 caracteres).' });
      var nodoPropio = h('div', { class: 'campo campo--completo', hidden: true }, h('label', { for: 'c-propio', texto: 'Tu texto' }), propio);
      var tildes = h('input', { id: 'c-tildes', type: 'checkbox', checked: true });
      var objetivo = h('p', { class: 'mc-objetivo', id: 'm-objetivo' });
      var entrada = h('textarea', { id: 'm-entrada', rows: 4, spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', 'aria-label': 'Escribe aquí el texto de arriba', placeholder: 'Empieza a escribir aquí. El tiempo corre desde la primera tecla.' });
      var tiempo = h('strong', { 'data-k': 'tiempo', 'data-v': '60', texto: '60' });
      var vivo = h('span', { 'data-k': 'vivo', 'data-v': '0', texto: '0' });
      var res = h('div', { class: 'herr-salida', 'aria-live': 'polite' });
      raiz.appendChild(h('div', { class: 'herr-campos' }, h('div', { class: 'campo' }, h('label', { for: 'c-duracion', texto: 'Duración' }), dur), h('div', { class: 'campo' }, h('label', { for: 'c-origen', texto: 'Texto' }), origen),
        h('div', { class: 'campo campo--check' }, h('span', { class: 'campo-check' }, tildes, h('label', { for: 'c-tildes', texto: 'Exigir tildes y diéresis' }))), nodoPropio));
      raiz.appendChild(h('p', { class: 'mc-reloj' }, 'Tiempo restante: ', tiempo, ' s · Palabras por minuto ahora: ', vivo));
      raiz.appendChild(objetivo); raiz.appendChild(h('div', { class: 'campo' }, entrada));
      raiz.appendChild(h('div', { class: 'herr-acciones' }, h('button', { class: 'boton', type: 'button', id: 'm-nuevo', onclick: nuevo }, 'Reiniciar con otro texto'), h('button', { class: 'boton boton--secundario', type: 'button', id: 'm-terminar', onclick: function () { if (e.fase === 'escribiendo') terminar(Math.min(e.dur, (TH.ahora() - e.ini) / 1000)); } }, 'Terminar ahora')));
      raiz.appendChild(res);
      function sinTilde(c) { return c.normalize('NFD').replace(/[̀́̈]/g, '').normalize('NFC'); }
      function igual(a, b) { return e.tildes ? a === b : sinTilde(a) === sinTilde(b); }
      function contar(esc) { var ok = 0, i, n = Math.min(esc.length, e.texto.length); for (i = 0; i < n; i++) if (igual(esc.charAt(i), e.texto.charAt(i))) ok++; return ok; }
      function nivel(p) { return p < 20 ? 'Principiante' : p < 35 ? 'Normal' : p < 50 ? 'Rápido' : p < 70 ? 'Muy rápido' : 'Profesional'; }
      function pintar() {
        var esc = entrada.value, i;
        TH.vaciar(objetivo);
        for (i = 0; i < e.texto.length; i++) {
          var cl = i < esc.length ? (igual(esc.charAt(i), e.texto.charAt(i)) ? 'ok' : 'mal') : i === esc.length ? 'actual' : 'pend';
          objetivo.appendChild(h('span', { class: 'mc-' + cl, texto: e.texto.charAt(i) }));
        }
      }
      function parar() { if (e.timer) { clearInterval(e.timer); e.timer = null; } }
      function nuevo() {
        parar(); e.fase = 'espera'; e.dur = +dur.value; e.tildes = tildes.checked; nodoPropio.hidden = origen.value !== 'propio';
        TH.vaciar(res); entrada.value = ''; entrada.readOnly = false; entrada.disabled = false; tiempo.textContent = String(e.dur); tiempo.setAttribute('data-v', String(e.dur)); vivo.textContent = '0'; vivo.setAttribute('data-v', '0');
        if (origen.value === 'propio') {
          var t = propio.value.replace(/\s+/g, ' ').trim();
          if (t.length < 20 || t.length > 2000) {
            e.texto = ''; TH.vaciar(objetivo); entrada.disabled = true;
            res.appendChild(h('p', { class: 'herr-estado herr-estado--aviso', role: 'status', texto: 'Escribe o pega un texto de entre 20 y 2.000 caracteres para poder practicar con él.' }));
            return;
          }
          e.texto = t;
        } else {
          var n; do { n = A.entero(TEXTOS.length); } while (n === e.ultimo && TEXTOS.length > 1);
          e.ultimo = n; e.texto = TEXTOS[n];
        }
        pintar();
      }
      function tick() {
        var r = Math.max(0, e.dur - (TH.ahora() - e.ini) / 1000);
        tiempo.textContent = String(Math.ceil(r)); tiempo.setAttribute('data-v', String(Math.ceil(r)));
        var seg = Math.max(1, e.dur - r), p = Math.round(contar(entrada.value) / 5 / (seg / 60));
        vivo.textContent = String(p); vivo.setAttribute('data-v', String(p));
        if (r <= 0) terminar(e.dur);
      }
      function terminar(seg) {
        if (e.fase !== 'escribiendo') return;
        parar(); e.fase = 'fin'; entrada.readOnly = true;
        var esc = entrada.value.slice(0, e.texto.length), ok = contar(esc), s = Math.max(1, seg), min = s / 60;
        var netas = Math.round(ok / 5 / min), brutas = Math.round(esc.length / 5 / min), prec = esc.length ? ok / esc.length * 100 : 0;
        var dl = h('dl', { class: 'herr-res' });
        [TH.fila('ppm', 'Palabras por minuto (netas)', netas, 'n0'), TH.fila('brutas', 'Palabras por minuto (brutas)', brutas, 'n0'), TH.fila('precision', 'Precisión', prec, function (x) { return TH.fmt(x, [0, 1]) + ' %'; }),
         TH.fila('errores', 'Errores sin corregir', esc.length - ok, 'n0'), TH.fila('escritos', 'Caracteres escritos', esc.length, 'n0'), TH.fila('segundos', 'Tiempo empleado', s, function (x) { return TH.fmt(x, [0, 1]) + ' s'; }), TH.fila('nivel', 'Nivel', nivel(netas), 'txt')
        ].forEach(function (f) { dl.appendChild(h('div', { class: 'herr-fila' }, h('dt', { texto: f.t }), h('dd', { 'data-k': f.k, 'data-v': String(f.v), texto: f.f }))); });
        TH.vaciar(res); res.appendChild(dl);
        res.appendChild(h('p', { class: 'herr-nota', texto: 'Las palabras netas solo cuentan los caracteres bien escritos y cada cinco caracteres equivalen a una palabra. Las brutas cuentan todo lo que has tecleado.' }));
        TH.anunciar('Resultado: ' + netas + ' palabras por minuto con una precisión del ' + TH.fmt(prec, [0, 0]) + ' por ciento.');
        pintar();
      }
      entrada.addEventListener('input', function () {
        if (e.fase === 'fin') return;
        if (/[\r\n]/.test(entrada.value)) entrada.value = entrada.value.replace(/[\r\n]+/g, ' ');
        if (!entrada.value) { pintar(); return; }
        if (e.fase === 'espera') { e.fase = 'escribiendo'; e.ini = TH.ahora(); e.timer = setInterval(tick, 200); }
        pintar(); tick();
        if (e.fase === 'escribiendo' && entrada.value.length >= e.texto.length) terminar(Math.min(e.dur, (TH.ahora() - e.ini) / 1000));
      });
      entrada.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') ev.preventDefault(); });
      ['paste', 'drop'].forEach(function (n) { entrada.addEventListener(n, function (ev) { ev.preventDefault(); }); });
      [dur, origen, tildes].forEach(function (c) { c.addEventListener('change', nuevo); });
      propio.addEventListener('input', nuevo);
      nuevo();

    }, function () { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); });
  });
})();
