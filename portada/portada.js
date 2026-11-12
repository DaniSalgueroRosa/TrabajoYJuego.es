/* =========================================================
   FP Cuenta · portada/portada.js
   Portada: demo de la hoja de asistencia y buzón de sugerencias.
   ========================================================= */
(function () {
  'use strict';

  var COMUN = window.FPComun || {};
  var CONFIG = COMUN.config || window.FP_CONFIG || {};
  var storageGet = COMUN.storageGet || function () { return null; };
  var storageSet = COMUN.storageSet || function () {};

  /* ---------- Utilidades ---------- */
  var nf = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

  function hours(n) {
    return nf.format(n) + (n === 1 ? ' hora' : ' horas');
  }

  /* ---------- Demo: hoja de asistencia con palotes ---------- */
  function initDemo() {
    var root = document.getElementById('demo');
    if (!root) return;

    var tally = document.getElementById('demo-tally');
    var range = document.getElementById('demo-range');
    var output = document.getElementById('demo-value');
    var result = document.getElementById('demo-resultado');
    if (!tally || !range || !output || !result) return;

    var totalHours = Number(root.dataset.totalHours) || 160;
    var pct = Number(root.dataset.limitPct) || 15;
    var terms = Number(root.dataset.terms) || 3;
    var limit = Math.round(totalHours * pct / 100);
    var slots = Number(range.max) || 30;

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var strokes = [];

    function makeLine(coords, className) {
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', coords.x1);
      line.setAttribute('y1', coords.y1);
      line.setAttribute('x2', coords.x2);
      line.setAttribute('y2', coords.y2);
      line.setAttribute('class', className);
      return line;
    }

    // Cada grupo son cuatro palotes verticales y uno en diagonal que los tacha
    for (var g = 0; g < Math.ceil(slots / 5); g++) {
      var svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('viewBox', '0 0 60 60');
      svg.setAttribute('class', 'tally-group');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');

      for (var k = 0; k < 5; k++) {
        var n = g * 5 + k + 1;
        if (n > slots) break;
        var over = n > limit;
        var coords = k < 4
          ? { x1: 10 + k * 13, y1: 8, x2: 10 + k * 13, y2: 52 }
          : { x1: 3, y1: 46, x2: 57, y2: 14 };

        var ghost = makeLine(coords, 'tally-ghost' + (over ? ' is-over-slot' : ''));
        var ink = makeLine(coords, 'tally-ink' + (over ? ' is-over' : ''));
        ink.setAttribute('pathLength', '1');
        ink.style.setProperty('--i', String(n - 1));

        svg.appendChild(ghost);
        svg.appendChild(ink);
        strokes.push(ink);
      }
      tally.appendChild(svg);
    }

    function renderStrokes(value) {
      for (var i = 0; i < strokes.length; i++) {
        strokes[i].classList.toggle('is-on', i < value);
      }
    }

    function renderText(value) {
      var remaining = limit - value;
      var perTerm = remaining / terms;
      var state = 'ok';
      var text;

      output.textContent = nf.format(value) + ' h';
      range.setAttribute('aria-valuetext', hours(value));
      tally.setAttribute('aria-label', hours(value) + ' faltadas de un límite de ' + limit);

      if (value === 0) {
        text = 'Todavía no has faltado: tienes ' + hours(limit) + ' de margen, unas ' +
               nf.format(limit / terms) + ' por trimestre.';
      } else if (value > limit) {
        state = 'over';
        text = 'Te has pasado ' + hours(value - limit) + ' del límite de ' + limit +
               '. Pregunta a tu tutor o tutora cómo se evaluará el módulo.';
      } else if (value === limit) {
        state = 'limit';
        text = 'Has llegado al límite de ' + limit + ' horas. Ya no te queda margen en este módulo.';
      } else {
        if (value / limit >= 0.6) state = 'warn';
        text = (state === 'warn' ? 'Te acercas al límite. ' : '') +
               'Llevas ' + hours(value) + ' de ' + limit + '. Te quedan ' + hours(remaining) +
               ', unas ' + nf.format(perTerm) + ' por trimestre si las repartes entre ' + terms + '.';
      }

      result.textContent = text;
      result.setAttribute('data-state', state);
    }

    function current() {
      var v = Number(range.value);
      return isNaN(v) ? 0 : v;
    }

    range.addEventListener('input', function () {
      var v = current();
      renderText(v);
      renderStrokes(v);
    });

    // Momento de entrada: el texto aparece ya y los palotes se dibujan uno a uno
    renderText(current());
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      renderStrokes(current());
    } else {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          root.classList.add('is-intro');
          renderStrokes(current());
          window.setTimeout(function () { root.classList.remove('is-intro'); }, 1500);
        });
      });
    }
  }


  /* ---------- Buzón de sugerencias ---------- */
  function initForm() {
    var form = document.getElementById('form-sugerencias');
    if (!form) return;

    var status = document.getElementById('form-status');
    var submit = document.getElementById('sug-enviar');
    var message = document.getElementById('sug-mensaje');
    var counter = document.getElementById('sug-count');
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var LAST_KEY = 'fpcuenta-last-message';

    var fields = [
      {
        el: document.getElementById('sug-tipo'),
        error: document.getElementById('sug-tipo-error'),
        check: function (el) { return el.value ? '' : 'Elige una opción de la lista.'; }
      },
      {
        el: message,
        error: document.getElementById('sug-mensaje-error'),
        check: function (el) {
          return el.value.trim().length >= 10
            ? ''
            : 'Escribe al menos 10 caracteres para que podamos entender tu mensaje.';
        }
      },
      {
        el: document.getElementById('sug-email'),
        error: document.getElementById('sug-email-error'),
        check: function (el) {
          var v = el.value.trim();
          return !v || EMAIL_RE.test(v)
            ? ''
            : 'Revisa el correo: debe tener el formato nombre@dominio.es, o déjalo en blanco.';
        }
      },
      {
        el: document.getElementById('sug-privacidad'),
        error: document.getElementById('sug-privacidad-error'),
        check: function (el) { return el.checked ? '' : 'Marca la casilla para poder enviar el mensaje.'; }
      }
    ];

    function validate(field) {
      var msg = field.check(field.el);
      field.error.textContent = msg;
      field.error.hidden = !msg;
      field.el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    }

    // No se valida al salir del campo: el mensaje de error movería el botón o la casilla
    // justo antes de soltar el clic. Se valida al enviar y, desde entonces, en vivo.
    fields.forEach(function (field) {
      var revalidate = function () {
        if (field.el.getAttribute('aria-invalid') === 'true') validate(field);
      };
      field.el.addEventListener('input', revalidate);
      field.el.addEventListener('change', revalidate);
    });

    message.addEventListener('input', function () {
      counter.textContent = message.value.length + ' / ' + message.maxLength;
    });

    function setStatus(text, kind) {
      status.textContent = text;
      status.className = 'form-status' + (kind ? ' is-' + kind : '');
    }

    function finish(text, kind, reset) {
      submit.disabled = false;
      submit.textContent = 'Enviar sugerencia';
      setStatus(text, kind);
      if (reset) {
        form.reset();
        counter.textContent = '0 / ' + message.maxLength;
        fields.forEach(function (f) { f.el.setAttribute('aria-invalid', 'false'); });
      }
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      setStatus('', '');

      var firstInvalid = null;
      fields.forEach(function (field) {
        if (!validate(field) && !firstInvalid) firstInvalid = field.el;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      // Si el campo trampa tiene contenido, es un bot: se simula el éxito sin enviar nada
      var trap = form.elements.web;
      if (trap && trap.value) {
        finish('Gracias. Hemos recibido tu sugerencia.', 'success', true);
        return;
      }

      var last = Number(storageGet(LAST_KEY)) || 0;
      var waitMs = CONFIG.minSecondsBetweenMessages * 1000 - (Date.now() - last);
      if (waitMs > 0) {
        setStatus('Acabas de enviar un mensaje. Espera ' + Math.ceil(waitMs / 1000) + ' segundos antes de enviar otro.', 'error');
        return;
      }

      var data = {
        tipo: fields[0].el.value,
        mensaje: message.value.trim(),
        email: fields[2].el.value.trim(),
        pagina: window.location.href,
        fecha: new Date().toISOString()
      };

      submit.disabled = true;
      submit.textContent = 'Enviando…';

      if (CONFIG.suggestionsEndpoint) {
        fetch(CONFIG.suggestionsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        }).then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          storageSet(LAST_KEY, String(Date.now()));
          finish('Gracias. Hemos recibido tu sugerencia.', 'success', true);
        }).catch(function () {
          finish('No se ha podido enviar el mensaje. Comprueba tu conexión e inténtalo de nuevo, o escríbenos a ' +
                 CONFIG.contactEmail + '.', 'error', false);
        });
      } else {
        // Sin servidor de formularios: se abre el correo de la persona con el mensaje preparado
        var body = data.mensaje + (data.email ? '\n\nCorreo de contacto: ' + data.email : '');
        var href = 'mailto:' + CONFIG.contactEmail +
                   '?subject=' + encodeURIComponent('Sugerencia: ' + data.tipo) +
                   '&body=' + encodeURIComponent(body);
        storageSet(LAST_KEY, String(Date.now()));
        window.location.href = href;
        finish('Se ha abierto tu programa de correo con el mensaje preparado. Pulsa enviar allí para terminar.', 'success', false);
      }
    });
  }


  /* ---------- Arranque ---------- */
  function init() {
    initDemo();
    initForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
