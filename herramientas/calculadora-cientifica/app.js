(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var h = TH.h;
    var ayuda = { pi: Math.PI, 'π': Math.PI, e: Math.E, tau: 2 * Math.PI };
    var rad;
    function fact(n) { if (n < 0 || n !== Math.floor(n) || n > 170) throw new Error('El factorial solo existe para números enteros de 0 a 170.'); var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }
    var FUN = {
      sin: function (x) { return Math.sin(rad ? x : x * Math.PI / 180); }, cos: function (x) { return Math.cos(rad ? x : x * Math.PI / 180); }, tan: function (x) { return Math.tan(rad ? x : x * Math.PI / 180); },
      asin: function (x) { var r = Math.asin(x); return rad ? r : r * 180 / Math.PI; }, acos: function (x) { var r = Math.acos(x); return rad ? r : r * 180 / Math.PI; }, atan: function (x) { var r = Math.atan(x); return rad ? r : r * 180 / Math.PI; },
      sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, ln: Math.log, log: Math.log10, log2: Math.log2, sqrt: Math.sqrt, 'raiz': Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, exp: Math.exp,
      floor: Math.floor, ceil: Math.ceil, round: Math.round, fact: fact
    };
    function tokens(t) {
      var s = t.replace(/×|·|⋅/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/\*\*/g, '^').replace(/√/g, 'sqrt'), out = [], i = 0, m;
      while (i < s.length) {
        var ch = s.charAt(i);
        if (/\s/.test(ch)) { i++; continue; }
        if ((m = /^(\d+([.,]\d*)?|[.,]\d+)/.exec(s.slice(i)))) { out.push({ t: 'n', v: parseFloat(m[0].replace(',', '.')) }); i += m[0].length; continue; }
        if ((m = /^[a-zA-Zπ]+/.exec(s.slice(i)))) { out.push({ t: 'id', v: m[0].toLowerCase() }); i += m[0].length; continue; }
        if ('+-*/^()!%'.indexOf(ch) >= 0) { out.push({ t: ch }); i++; continue; }
        throw new Error('No entiendo el signo «' + ch + '».');
      }
      return out;
    }
    function evaluar(t) {
      var tk = tokens(t), p = 0;
      function ver() { return tk[p]; }
      function sig() { return tk[p++]; }
      function expr() { var v = term(); while (ver() && (ver().t === '+' || ver().t === '-')) { var o = sig().t; var w = term(); v = o === '+' ? v + w : v - w; } return v; }
      function empieza(x) { return x && (x.t === 'n' || x.t === '(' || x.t === 'id'); }
      function term() {
        var v = unario();
        while (ver() && (ver().t === '*' || ver().t === '/' || empieza(ver()))) {
          if (ver().t === '*') { sig(); v *= unario(); } else if (ver().t === '/') { sig(); var d = unario(); if (d === 0) throw new Error('No se puede dividir entre cero.'); v /= d; } else v *= unario();
        }
        return v;
      }
      function unario() { if (ver() && ver().t === '-') { sig(); return -unario(); } if (ver() && ver().t === '+') { sig(); return unario(); } return potencia(); }
      function potencia() { var b = posfijo(); if (ver() && ver().t === '^') { sig(); var e = unario(); return Math.pow(b, e); } return b; }
      function posfijo() {
        var v = primario();
        while (ver() && (ver().t === '!' || ver().t === '%')) { if (sig().t === '!') v = fact(v); else v = v / 100; }
        return v;
      }
      function primario() {
        var x = sig();
        if (!x) throw new Error('La expresión está incompleta.');
        if (x.t === 'n') return x.v;
        if (x.t === '(') { var v = expr(); if (!ver() || ver().t !== ')') throw new Error('Falta cerrar un paréntesis.'); sig(); return v; }
        if (x.t === 'id') {
          if (FUN[x.v]) {
            if (!ver() || ver().t !== '(') throw new Error('Después de «' + x.v + '» van paréntesis: ' + x.v + '(…).');
            sig(); var a = expr(); if (!ver() || ver().t !== ')') throw new Error('Falta cerrar un paréntesis.'); sig();
            return FUN[x.v](a);
          }
          if (ayuda[x.v] !== undefined) return ayuda[x.v];
          throw new Error('No conozco «' + x.v + '». Usa pi, e o funciones como sin, cos, ln, log, sqrt.');
        }
        throw new Error('Algo sobra o falta cerca de «' + x.t + '».');
      }
      if (!tk.length) return null;
      var r = expr();
      if (p < tk.length) throw new Error(tk[p].t === ')' ? 'Hay un paréntesis de cierre de más.' : 'Algo sobra al final de la expresión.');
      return r;
    }
    var api = TH.calculadora(raiz, {
      campos: [
        { id: 'expr', tipo: 'texto', etiqueta: 'Operación', ph: 'Ej.: sqrt(16) + 2^3 * 3', ancho: 'completo', ayuda: 'Usa + − * / ^ ( ) ! % y funciones como sin, cos, tan, ln, log, sqrt. La coma es decimal.' },
        { id: 'angulo', tipo: 'select', etiqueta: 'Ángulos en', valor: 'grados', opciones: [['grados', 'Grados'], ['radianes', 'Radianes']] }
      ],
      ejemplo: { expr: 'sqrt(16) + 2^3 * 3', angulo: 'grados' },
      vacio: 'Escribe una operación y verás aquí el resultado.',
      calcular: function (v) {
        if (!v.expr.trim()) return { vacio: true };
        rad = v.angulo === 'radianes';
        var r;
        try { r = evaluar(v.expr); } catch (e) { return { error: e.message }; }
        if (r === null) return { vacio: true };
        if (!isFinite(r)) return { error: 'El resultado no es un número real. Revisa la operación.' };
        r = parseFloat(r.toPrecision(12));
        return { filas: [TH.fila('resultado', v.expr.trim() + ' =', r, 'auto')], notas: ['Se muestran hasta doce cifras significativas. Las funciones trigonométricas usan ' + (rad ? 'radianes' : 'grados') + '.'] };
      }
    });
    var panel = h('div', { class: 'cient-teclas', role: 'group', 'aria-label': 'Insertar funciones y signos' });
    [['sin(', 'sin'], ['cos(', 'cos'], ['tan(', 'tan'], ['ln(', 'ln'], ['log(', 'log'], ['sqrt(', '√'], ['^', 'xʸ'], ['(', '('], [')', ')'], ['pi', 'π'], ['e', 'e'], ['!', 'n!'], ['%', '%'], ['abs(', 'abs']].forEach(function (b) {
      panel.appendChild(h('button', { type: 'button', class: 'boton boton--secundario boton--chico', 'aria-label': 'Insertar ' + b[0], onclick: function () {
        var el = api.campo('expr').el, a = el.selectionStart == null ? el.value.length : el.selectionStart, z = el.selectionEnd == null ? a : el.selectionEnd;
        el.value = el.value.slice(0, a) + b[0] + el.value.slice(z); var pos = a + b[0].length; el.focus(); el.setSelectionRange(pos, pos);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      } }, b[1]));
    });
    raiz.querySelector('.herr-campos').appendChild(h('div', { class: 'campo campo--completo' }, h('span', { class: 'campo-titulo', texto: 'Atajos' }), panel));
  });
})();
