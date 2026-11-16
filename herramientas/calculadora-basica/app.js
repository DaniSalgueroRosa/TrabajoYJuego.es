(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var h = TH.h, e = { texto: '0', previo: null, op: null, nuevo: true, cinta: [] };
    var pant = h('output', { class: 'calc-pantalla', 'data-k': 'pantalla', 'data-v': '0', 'aria-label': 'Resultado' }, '0');
    var oper = h('div', { class: 'calc-operacion', 'aria-hidden': 'true' });
    var cinta = h('ol', { class: 'calc-cinta', 'aria-label': 'Operaciones anteriores' });
    var estado = TH.estado(raiz);
    var NOMBRES = { '÷': 'dividir', '×': 'multiplicar', '−': 'restar', '+': 'sumar', '=': 'igual', '%': 'porcentaje', '±': 'cambiar signo', '⌫': 'borrar el último dígito', 'C': 'borrar todo', ',': 'coma decimal' };
    function limpio(x) { return isFinite(x) ? String(parseFloat(x.toPrecision(12))) : 'Error'; }
    function num() { return parseFloat(e.texto); }
    function formato(t) {
      if (t === 'Error') return t;
      var neg = t.charAt(0) === '-', cuerpo = neg ? t.slice(1) : t;
      if (/e/.test(cuerpo)) return (neg ? '-' : '') + cuerpo.replace('.', ',').replace('e+', ' × 10^').replace('e-', ' × 10^-');
      var p = cuerpo.split('.');
      return (neg ? '-' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p.length > 1 ? ',' + p[1] : '');
    }
    function mostrar() {
      pant.textContent = formato(e.texto); pant.setAttribute('data-v', e.texto);
      oper.textContent = e.previo !== null ? formato(limpio(e.previo)) + ' ' + e.op : ' ';
      TH.vaciar(cinta);
      e.cinta.slice(-6).forEach(function (l) { cinta.appendChild(h('li', { texto: l })); });
    }
    function aplicar(a, op, b) { return op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : (b === 0 ? NaN : a / b); }
    function resolver() {
      var a = e.previo, b = num(), r = aplicar(a, e.op, b);
      e.cinta.push(formato(limpio(a)) + ' ' + e.op + ' ' + formato(limpio(b)) + ' = ' + formato(limpio(r)));
      e.texto = limpio(r); e.previo = null; e.op = null; e.nuevo = true;
    }
    function pulsar(t) {
      if (e.texto === 'Error' && t !== 'C') { if (/^[0-9,]$/.test(t)) { e.texto = '0'; e.nuevo = true; } else return; }
      if (/^[0-9]$/.test(t)) { if (e.nuevo) { e.texto = t; e.nuevo = false; } else if (e.texto === '0') e.texto = t; else if (e.texto.replace(/[-.]/g, '').length < 15) e.texto += t; }
      else if (t === ',') { if (e.nuevo) { e.texto = '0.'; e.nuevo = false; } else if (e.texto.indexOf('.') < 0) e.texto += '.'; }
      else if (t === '+' || t === '−' || t === '×' || t === '÷') {
        if (e.op && !e.nuevo) resolver();
        if (e.texto !== 'Error') { e.previo = e.op && e.nuevo ? e.previo : num(); e.op = t; e.nuevo = true; }
      }
      else if (t === '=') { if (e.op) resolver(); }
      else if (t === '%') { e.texto = limpio(e.op && e.previo !== null ? e.previo * num() / 100 : num() / 100); e.nuevo = false; }
      else if (t === '±') { if (e.texto !== '0') e.texto = e.texto.charAt(0) === '-' ? e.texto.slice(1) : '-' + e.texto; }
      else if (t === '⌫') { if (!e.nuevo) e.texto = e.texto.length > 1 && !/^-.$/.test(e.texto) ? e.texto.slice(0, -1) : '0'; }
      else if (t === 'C') { e.texto = '0'; e.previo = null; e.op = null; e.nuevo = true; }
      mostrar();
      TH.anunciar(pant.textContent);
    }
    var teclas = [['C', 'f'], ['⌫', 'f'], ['%', 'f'], ['÷', 'o'], ['7'], ['8'], ['9'], ['×', 'o'], ['4'], ['5'], ['6'], ['−', 'o'], ['1'], ['2'], ['3'], ['+', 'o'], ['±', 'f'], ['0'], [','], ['=', 'i']];
    var rejilla = h('div', { class: 'calc-teclas', role: 'group', 'aria-label': 'Teclas' });
    teclas.forEach(function (k) {
      rejilla.appendChild(h('button', { type: 'button', class: 'calc-tecla' + (k[1] ? ' calc-tecla--' + k[1] : ''), 'aria-label': NOMBRES[k[0]] || k[0], onclick: function () { pulsar(k[0]); } }, k[0]));
    });
    TH.vaciar(raiz).appendChild(h('div', { class: 'calc' },
      h('div', { class: 'calc-aparato' }, oper, pant, rejilla),
      h('div', { class: 'calc-lado' }, h('p', { class: 'herr-chico', texto: 'Operaciones anteriores' }), cinta,
        h('div', { class: 'herr-acciones' }, h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { TH.copiar(pant.getAttribute('data-v') === 'Error' ? '' : pant.textContent, estado); } }, 'Copiar resultado'),
          h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { e.cinta = []; mostrar(); } }, 'Borrar historial')),
        estado.nodo)));
    raiz.addEventListener('keydown', function (ev) {
      var k = ev.key, m = { '*': '×', '/': '÷', '-': '−', '+': '+', ',': ',', '.': ',', 'Enter': '=', '=': '=', 'Backspace': '⌫', 'Escape': 'C', '%': '%' };
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.target.tagName === 'BUTTON' && (k === 'Enter' || k === ' ')) return;
      if (/^[0-9]$/.test(k)) { ev.preventDefault(); pulsar(k); } else if (m[k]) { ev.preventDefault(); pulsar(m[k]); }
    });
    mostrar();
    document.addEventListener('keydown', function (ev) {
      if (ev.defaultPrevented || ev.ctrlKey || ev.metaKey || ev.altKey || raiz.contains(ev.target)) return;
      if (ev.target.closest && ev.target.closest('input, textarea, select, details, summary, a')) return;
      var k = ev.key, m = { '*': '×', '/': '÷', '-': '−', '+': '+', ',': ',', '.': ',', 'Enter': '=', '=': '=', 'Backspace': '⌫', 'Escape': 'C', '%': '%' };
      if (/^[0-9]$/.test(k)) pulsar(k); else if (m[k] && ev.target.tagName !== 'BUTTON') pulsar(m[k]);
    });
  });
})();
