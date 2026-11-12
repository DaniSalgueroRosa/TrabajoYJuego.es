/* =========================================================
   FP Cuenta · combobox.js
   Desplegable en el que se puede escribir para buscar.
   Sin tildes ni mayúsculas, por palabras y por siglas.
   Accesible: patrón "combobox" de WAI-ARIA con teclado y lector de pantalla.

   Uso:
     var combo = FPCombobox.create({
       root: document.getElementById('combo-ciclo'),   // contiene .combo-input, .combo-toggle, .combo-clear, .combo-list, .combo-status
       items: [{ value, label, detail, badge, group, search }],
       groups: ['Grado superior', 'Grado medio'],       // orden de los grupos (opcional)
       emptyText: function (query) { return 'Sin resultados'; },
       onChange: function (item) {}                     // item es null si se borra la elección
     });
     combo.setValue('daw-gs', true);   // true = sin disparar onChange
   ========================================================= */
(function () {
  'use strict';

  // Quita tildes y pasa a minúsculas conservando la longitud (para poder resaltar)
  function fold(text) {
    return Array.prototype.map.call(String(text), function (ch) {
      return ch.normalize('NFD').charAt(0);
    }).join('').toLowerCase();
  }

  var uid = 0;

  function create(opts) {
    var root = opts.root;
    var input = root.querySelector('.combo-input');
    var list = root.querySelector('.combo-list');
    var toggle = root.querySelector('.combo-toggle');
    var clear = root.querySelector('.combo-clear');
    var status = root.querySelector('.combo-status');
    if (!input || !list) return null;

    var id = 'cb' + (++uid);
    var groupsOrder = opts.groups || [];
    var items = [];
    var selected = null;      // elemento elegido
    var visible = [];         // opciones que se ven ahora, en orden
    var active = -1;          // posición de la opción resaltada en "visible"
    var isOpen = false;
    var statusTimer = null;

    list.id = list.id || id + '-list';
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-expanded', 'false');

    /* ---------- Datos ---------- */
    function setItems(newItems) {
      items = newItems.map(function (it, i) {
        return {
          value: it.value,
          label: it.label,
          detail: it.detail || '',
          badge: it.badge || '',
          group: it.group || '',
          order: i,
          _label: fold(it.label),
          _search: fold([it.label, it.detail || '', it.search || ''].join(' '))
        };
      });
      if (selected) selected = find(selected.value);
    }

    function find(value) {
      for (var i = 0; i < items.length; i++) if (items[i].value === value) return items[i];
      return null;
    }

    /* ---------- Búsqueda ---------- */
    function filter(query) {
      var tokens = fold(query).split(/\s+/).filter(Boolean);
      if (!tokens.length) return items.slice();

      var out = [];
      items.forEach(function (it) {
        var score = 0;
        for (var t = 0; t < tokens.length; t++) {
          var idx = it._label.indexOf(tokens[t]);
          if (idx === 0) score += 0;
          else if (idx > 0 && it._label.charAt(idx - 1) === ' ') score += 1;
          else if (idx > 0) score += 2;
          else if (it._search.indexOf(tokens[t]) !== -1) score += 5;
          else return;
        }
        out.push({ item: it, score: score });
      });
      out.sort(function (a, b) { return a.score - b.score || a.item.order - b.item.order; });
      return out.map(function (o) { return o.item; });
    }

    /* ---------- Pintado ---------- */
    function highlight(parent, text, query) {
      var tokens = fold(query).split(/\s+/).filter(Boolean);
      var folded = fold(text);
      var marks = [];
      tokens.forEach(function (tk) {
        var i = folded.indexOf(tk);
        if (i !== -1) marks.push([i, i + tk.length]);
      });
      if (!marks.length) { parent.appendChild(document.createTextNode(text)); return; }
      marks.sort(function (a, b) { return a[0] - b[0]; });
      var merged = [marks[0]];
      marks.slice(1).forEach(function (m) {
        var last = merged[merged.length - 1];
        if (m[0] <= last[1]) last[1] = Math.max(last[1], m[1]); else merged.push(m);
      });
      var pos = 0;
      merged.forEach(function (m) {
        if (m[0] > pos) parent.appendChild(document.createTextNode(text.slice(pos, m[0])));
        var mark = document.createElement('mark');
        mark.textContent = text.slice(m[0], m[1]);
        parent.appendChild(mark);
        pos = m[1];
      });
      if (pos < text.length) parent.appendChild(document.createTextNode(text.slice(pos)));
    }

    function render(query) {
      var results = filter(query);
      visible = results;
      list.textContent = '';

      if (!results.length) {
        var empty = document.createElement('li');
        empty.className = 'combo-empty';
        empty.setAttribute('role', 'presentation');
        var msg = opts.emptyText ? opts.emptyText(query) : 'Sin resultados';
        if (msg && msg.nodeType) empty.appendChild(msg); else empty.textContent = msg;
        list.appendChild(empty);
        active = -1;
        input.removeAttribute('aria-activedescendant');
        return;
      }

      // Agrupa conservando el orden de los grupos
      var byGroup = {};
      var names = [];
      results.forEach(function (it) {
        var g = it.group || '';
        if (!byGroup[g]) { byGroup[g] = []; names.push(g); }
        byGroup[g].push(it);
      });
      names.sort(function (a, b) {
        var ia = groupsOrder.indexOf(a), ib = groupsOrder.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });

      // El orden visual (y el del teclado) sigue los grupos
      var flat = [];
      names.forEach(function (g, gi) {
        var holder = list;
        if (g) {
          var wrap = document.createElement('li');
          wrap.setAttribute('role', 'presentation');
          var title = document.createElement('span');
          title.className = 'combo-group-title';
          title.id = id + '-g' + gi;
          title.textContent = g;
          var ul = document.createElement('ul');
          ul.className = 'combo-group';
          ul.setAttribute('role', 'group');
          ul.setAttribute('aria-labelledby', title.id);
          wrap.appendChild(title);
          wrap.appendChild(ul);
          list.appendChild(wrap);
          holder = ul;
        }
        byGroup[g].forEach(function (it) {
          var li = document.createElement('li');
          li.className = 'combo-option';
          li.setAttribute('role', 'option');
          li.id = id + '-o' + flat.length;
          li.setAttribute('aria-selected', String(!!selected && selected.value === it.value));
          li.dataset.index = String(flat.length);

          var main = document.createElement('span');
          main.className = 'combo-option-label';
          highlight(main, it.label, query);
          li.appendChild(main);

          if (it.badge) {
            var badge = document.createElement('span');
            badge.className = 'combo-badge';
            badge.textContent = it.badge;
            li.appendChild(badge);
          }
          if (it.detail) {
            var detail = document.createElement('span');
            detail.className = 'combo-option-detail';
            detail.textContent = it.detail;
            li.appendChild(detail);
          }
          holder.appendChild(li);
          flat.push(it);
        });
      });
      visible = flat;

      // Resalta la opción elegida si se abre sin escribir; si no, la primera
      var start = 0;
      if (!query && selected) {
        var si = flat.indexOf(selected);
        if (si !== -1) start = si;
      }
      setActive(start, !query && !!selected);
    }

    function setActive(index, scroll) {
      var old = list.querySelector('.is-active');
      if (old) old.classList.remove('is-active');
      active = index;
      if (index < 0 || index >= visible.length) {
        input.removeAttribute('aria-activedescendant');
        return;
      }
      var el = document.getElementById(id + '-o' + index);
      if (!el) return;
      el.classList.add('is-active');
      input.setAttribute('aria-activedescendant', el.id);
      if (scroll !== false) {
        var top = el.offsetTop, bottom = top + el.offsetHeight;
        // offsetTop es relativo al ancestro posicionado (la lista)
        if (top < list.scrollTop + 28) list.scrollTop = Math.max(0, top - 36);
        else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 8;
      }
    }

    function announce() {
      if (!status) return;
      window.clearTimeout(statusTimer);
      statusTimer = window.setTimeout(function () {
        if (!isOpen) { status.textContent = ''; return; }
        status.textContent = visible.length
          ? visible.length + (visible.length === 1 ? ' resultado' : ' resultados') + '. Usa las flechas arriba y abajo y Intro para elegir.'
          : 'Sin resultados.';
      }, 200);
    }

    /* ---------- Abrir y cerrar ---------- */
    function open(query) {
      render(query || '');
      isOpen = true;
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      root.classList.add('is-open');
      announce();
    }

    function close() {
      isOpen = false;
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      root.classList.remove('is-open');
      announce();
    }

    function refreshClear() {
      if (clear) clear.hidden = !input.value;
    }

    /* ---------- Elegir ---------- */
    function choose(item, silent) {
      var changed = (selected && selected.value) !== (item && item.value);
      selected = item;
      input.value = item ? item.label : '';
      refreshClear();
      close();
      if (changed && !silent && opts.onChange) opts.onChange(item);
    }

    // Al salir del campo: texto exacto, se elige; vacío, se borra; otra cosa, se vuelve a lo elegido
    function settle() {
      var text = fold(input.value).trim();
      if (!text) {
        if (selected) choose(null);
        else { input.value = ''; refreshClear(); close(); }
        return;
      }
      var exact = items.filter(function (it) { return it._label === text; })[0];
      if (exact) { choose(exact); return; }
      input.value = selected ? selected.label : '';
      refreshClear();
      close();
    }

    /* ---------- Eventos ---------- */
    input.addEventListener('focus', function () {
      input.select();
      if (!isOpen) open('');
    });

    input.addEventListener('click', function () {
      if (!isOpen) open('');
    });

    input.addEventListener('input', function () {
      refreshClear();
      open(input.value);
    });

    input.addEventListener('keydown', function (event) {
      var key = event.key;
      if (key === 'ArrowDown') {
        event.preventDefault();
        if (!isOpen) { open(input.value === (selected && selected.label) ? '' : input.value); return; }
        if (visible.length) setActive((active + 1) % visible.length);
      } else if (key === 'ArrowUp') {
        event.preventDefault();
        if (!isOpen) { open(''); return; }
        if (visible.length) setActive((active - 1 + visible.length) % visible.length);
      } else if (key === 'Home' && isOpen && event.ctrlKey) {
        event.preventDefault(); setActive(0);
      } else if (key === 'End' && isOpen && event.ctrlKey) {
        event.preventDefault(); setActive(visible.length - 1);
      } else if (key === 'Enter') {
        if (isOpen && active >= 0 && visible[active]) {
          event.preventDefault();
          choose(visible[active]);
        } else if (isOpen) {
          event.preventDefault();
        }
      } else if (key === 'Escape') {
        if (isOpen) {
          event.preventDefault();
          input.value = selected ? selected.label : '';
          refreshClear();
          close();
        } else if (input.value) {
          event.preventDefault();
          choose(null);
        }
      } else if (key === 'Tab') {
        settle();
      }
    });

    // Elegir con ratón o dedo sin que el campo pierda el foco
    list.addEventListener('mousedown', function (event) { event.preventDefault(); });
    list.addEventListener('click', function (event) {
      var li = event.target.closest('.combo-option');
      if (!li) return;
      var item = visible[Number(li.dataset.index)];
      if (item) { choose(item); input.focus({ preventScroll: true }); }
    });
    list.addEventListener('mousemove', function (event) {
      var li = event.target.closest('.combo-option');
      if (li && Number(li.dataset.index) !== active) setActive(Number(li.dataset.index), false);
    });

    if (toggle) {
      toggle.addEventListener('mousedown', function (event) { event.preventDefault(); });
      toggle.addEventListener('click', function () {
        if (isOpen) { close(); } else { input.focus(); open(''); }
      });
    }

    if (clear) {
      clear.addEventListener('mousedown', function (event) { event.preventDefault(); });
      clear.addEventListener('click', function () {
        choose(null);
        input.focus();
      });
    }

    root.addEventListener('focusout', function () {
      window.setTimeout(function () {
        if (!root.contains(document.activeElement)) settle();
      }, 0);
    });

    refreshClear();
    list.hidden = true;
    setItems(opts.items || []);

    return {
      setItems: setItems,
      getValue: function () { return selected ? selected.value : null; },
      getItem: function () { return selected; },
      setValue: function (value, silent) {
        choose(value == null ? null : find(value), !!silent);
      },
      focus: function () { input.focus(); }
    };
  }

  window.FPCombobox = { create: create, fold: fold };
})();
