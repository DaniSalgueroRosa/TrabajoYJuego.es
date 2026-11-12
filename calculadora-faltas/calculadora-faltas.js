/* =========================================================
   FP Cuenta · calculadora-faltas/calculadora-faltas.js
   Comunidad, ciclo y curso → módulos (con las horas de esa comunidad) → horas que puedes faltar.
   Todo se calcula en el navegador. Lo que escribes se guarda solo en este
   navegador (localStorage) y se puede borrar con un botón.
   ========================================================= */
(function () {
  'use strict';

  var DATA = window.FP_DATA;
  var Combo = window.FPCombobox;
  if (!DATA || !DATA.comunidad || !Combo || !document.getElementById('calc-form')) return;

  var STORAGE_KEY = 'fpcuenta-calc-v1';
  var DEFAULT_PCT = 15;
  var nf = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

  var ORIGEN = {
    'norma': 'Dato de la normativa',
    'indicio': 'Dato de documentos de centros o sindicatos',
    'centro': 'Lo fija cada centro',
    'sin-datos': 'Sin verificar'
  };
  var CUENTAN = {
    'todas': 'Cuentan justificadas e injustificadas',
    'injust': 'Solo cuentan las injustificadas',
    'centro': 'Depende del centro'
  };

  function $(id) { return document.getElementById(id); }
  function fmtH(n) { return nf.format(n) + ' h'; }

  /* ---------- Estado ---------- */
  var state = {
    comunidad: null,   // id de comunidad
    ciclo: null,       // id de ciclo
    curso: 1,          // 1 o 2
    pct: null,         // porcentaje elegido a mano (null = el de la comunidad)
    criterio: 'superar',
    cuentan: null,     // 'todas' | 'injust' | null (null = lo que dice la comunidad)
    trimestre: null,   // null = según la fecha de hoy
    progreso: {}       // "cicloId:curso" → { m: [{ n, h, f, j, r }], t: trimestres de clase o null, src: de qué comunidad son las horas }
  };

  function storageGet() {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function storageSet(value) {
    try { window.localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* sin almacenamiento */ }
  }
  function storageClear() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* sin almacenamiento */ }
  }

  var saveTimer = null;
  function saveSoon() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(function () { storageSet(JSON.stringify(state)); }, 300);
  }

  function num(value, min, max, fallback) {
    var n = Number(value);
    if (!isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  // Valor guardado válido: un número dentro del rango (si no, se ignora y se usa el de siempre)
  function inRange(value, min, max) {
    if (value == null || value === '' || typeof value === 'boolean') return false;
    var n = Number(value);
    return isFinite(n) && n >= min && n <= max;
  }

  function loadState() {
    var raw = storageGet();
    if (!raw) return;
    var saved;
    try { saved = JSON.parse(raw); } catch (e) { return; }
    if (!saved || typeof saved !== 'object') return;

    if (comunidadById(saved.comunidad)) state.comunidad = saved.comunidad;
    if (cicloById(saved.ciclo)) state.ciclo = saved.ciclo;
    state.curso = saved.curso === 2 ? 2 : 1;
    state.pct = inRange(saved.pct, 1, 100) ? Number(saved.pct) : null;
    state.criterio = saved.criterio === 'alcanzar' ? 'alcanzar' : 'superar';
    state.cuentan = saved.cuentan === 'todas' || saved.cuentan === 'injust' ? saved.cuentan : null;
    state.trimestre = inRange(saved.trimestre, 1, 3) ? Math.round(Number(saved.trimestre)) : null;

    var prog = saved.progreso && typeof saved.progreso === 'object' ? saved.progreso : {};
    Object.keys(prog).forEach(function (key) {
      var p = prog[key];
      if (!p || !Array.isArray(p.m)) return;
      state.progreso[key] = {
        t: p.t === 2 || p.t === 3 ? p.t : null,
        src: typeof p.src === 'string' ? p.src.slice(0, 20) : null,
        m: p.m.slice(0, 40).map(function (m) {
          var f = num(m && m.f, 0, 3000, 0);
          return {
            n: String(m && m.n || '').slice(0, 80),
            h: num(m && m.h, 0, 3000, 0),
            f: f,
            j: Math.min(f, num(m && m.j, 0, 3000, 0)),
            r: !!(m && m.r)
          };
        })
      };
    });
  }

  /* ---------- Datos ---------- */
  // Los ciclos dependen de la comunidad: cada una tiene su lista (comunidades/<comunidad>/datos.js)
  function comunidadById(id) { return DATA.comunidad(id); }
  function cicloById(id) { return DATA.cicloDe(state.comunidad, id); }

  // Horas de los módulos de un ciclo en la comunidad elegida; null si no las tenemos y la persona apunta los suyos.
  function datosModulos(cicloId, comunidadId) {
    var d = comunidadId ? DATA.modulosDe(comunidadId, cicloId) : null;
    return d ? { d: d, key: comunidadId } : null;
  }

  // Módulos del curso: lista, [] (solo FCT) o null (sin datos)
  function refModules(ciclo, curso) {
    var info = ciclo ? datosModulos(ciclo.id, state.comunidad) : null;
    var list = info && info.d.modulos ? info.d.modulos[String(curso)] : null;
    return Array.isArray(list) ? list : null;
  }

  function autoTrimestre() {
    var month = new Date().getMonth() + 1;
    if (month >= 9) return 1;          // septiembre a diciembre
    if (month <= 3) return 2;          // enero a marzo
    return 3;                          // abril a agosto
  }

  function defaultNTrim(ciclo, curso) {
    var info = ciclo ? datosModulos(ciclo.id, state.comunidad) : null;
    var t = info && info.d.trimestres && info.d.trimestres[String(curso)];
    return t === 2 || t === 3 ? t : (curso === 1 ? 3 : 2);
  }

  function currentKey() { return state.ciclo + ':' + state.curso; }

  function norm(text) { return window.FPCombobox.fold(String(text || '')).replace(/\s+/g, ' ').trim(); }

  function blankRow() { return { n: '', h: 0, f: 0, j: 0, r: false }; }

  function sourceKey() {
    var info = datosModulos(state.ciclo, state.comunidad);
    return info ? info.key : 'manual';
  }

  // Cambió la comunidad (y con ella las horas): se ponen los módulos y las horas de la nueva fuente y se conserva lo ya apuntado
  // en los módulos que se llaman igual. Lo apuntado en módulos que ya no existen pasa a ser un módulo propio, para no perderlo.
  function syncSource(p, key) {
    var ciclo = cicloById(state.ciclo);
    var refs = refModules(ciclo, state.curso);
    var previous = {};
    p.m.forEach(function (m) { if (m.r) previous[norm(m.n)] = m; });
    var custom = p.m.filter(function (m) { return !m.r; });
    var next = [];
    if (refs) {
      next = refs.map(function (r) {
        var old = previous[norm(r[0])];
        return { n: r[0], h: r[1], f: old ? old.f : 0, j: old ? old.j : 0, r: true };
      });
      p.m.forEach(function (m) {
        if (m.r && m.f > 0 && !next.some(function (x) { return norm(x.n) === norm(m.n); })) {
          custom.push({ n: m.n, h: m.h, f: m.f, j: m.j, r: false });
        }
      });
    } else {
      // Sin horas para esta comunidad: los módulos de referencia anteriores pasan a ser editables
      p.m.forEach(function (m) { if (m.r) custom.push({ n: m.n, h: m.h, f: m.f, j: m.j, r: false }); });
    }
    p.m = next.concat(custom);
    if (!p.m.length && !(refs && !refs.length)) p.m = [blankRow()];
    p.t = null;
    p.src = key;
  }

  function getProgress() {
    var ciclo = cicloById(state.ciclo);
    var key = currentKey();
    var src = sourceKey();
    var p = state.progreso[key];
    if (p) {
      if (p.src !== src) syncSource(p, src);
      return p;
    }

    var refs = refModules(ciclo, state.curso);
    p = { t: null, src: src, m: [] };
    if (refs && refs.length) {
      p.m = refs.map(function (r) { return { n: r[0], h: r[1], f: 0, j: 0, r: true }; });
    } else if (!refs) {
      p.m = [blankRow()];   // ciclo sin datos: una fila en blanco para empezar
    }
    state.progreso[key] = p;
    return p;
  }

  function nTrimFor(ciclo, p) {
    return (p && p.t) || defaultNTrim(ciclo, state.curso);
  }

  /* ---------- Cálculo ---------- */
  // Porcentaje de la comunidad para el curso elegido (algunas comunidades tienen uno por curso)
  function communityPct() {
    var c = comunidadById(state.comunidad);
    if (!c) return DEFAULT_PCT;
    var byCourse = c.porcentajeCurso && c.porcentajeCurso[String(state.curso)];
    return byCourse != null ? byCourse : c.porcentaje;
  }

  function currentPct() {
    return state.pct != null ? state.pct : communityPct();
  }

  // Qué faltas cuentan: lo elegido a mano o, si no, lo que dice la comunidad (si no lo dice, todas)
  function currentCuentan() {
    if (state.cuentan) return state.cuentan;
    var c = comunidadById(state.comunidad);
    return c && c.cuentan === 'injust' ? 'injust' : 'todas';
  }

  // Horas de falta que cuentan para el límite
  function counted(m) {
    return currentCuentan() === 'injust' ? Math.max(0, m.f - Math.min(m.j, m.f)) : m.f;
  }

  // Máximo de horas que se pueden faltar sin perder la evaluación continua
  function allowed(hours, pct, criterio) {
    var limit = hours * pct / 100;
    if (criterio === 'alcanzar') return Math.max(0, Math.ceil(limit - 1e-9) - 1);
    return Math.floor(limit + 1e-9);
  }

  function trimestresRestantes(nTrim) {
    var now = Math.min(state.trimestre || autoTrimestre(), nTrim);
    return Math.max(1, nTrim - now + 1);
  }

  function calcModule(m, pct, criterio, restantes) {
    if (!(m.h > 0)) return { estado: 'none' };
    var max = allowed(m.h, pct, criterio);
    var used = counted(m);
    var left = max - used;
    var estado;
    if (used > max) estado = 'over';
    else if (left === 0) estado = 'limit';
    else if (max > 0 && used / max >= 0.6) estado = 'warn';
    else estado = 'ok';
    return {
      estado: estado,
      max: max,
      used: used,
      left: left,
      perTrim: left > 0 ? left / restantes : 0,
      ratio: max > 0 ? Math.min(1, used / max) : (used > 0 ? 1 : 0)
    };
  }

  var LABELS = { ok: 'Vas bien', warn: 'Cerca del límite', limit: 'Sin margen', over: 'Límite superado', none: 'Escribe las horas del módulo' };

  /* ---------- Elementos ---------- */
  var el = {
    pct: $('pct'), pctReset: $('pct-reset'), pctNote: $('pct-note'),
    comInfo: $('com-info'),
    title: $('res-titulo'), source: $('res-fuente'), notice: $('res-aviso'), hint: $('res-pista'),
    table: $('tabla-modulos'), rows: $('filas'), actions: $('res-acciones'),
    add: $('btn-anadir'), restore: $('btn-restaurar'), copy: $('btn-copiar'), print: $('btn-imprimir'),
    copyStatus: $('copiar-estado'), printMeta: $('print-meta'), summary: $('resumen'),
    wipe: $('btn-borrar')
  };

  function radios(name) { return document.querySelectorAll('input[name="' + name + '"]'); }
  function setRadio(name, value) {
    Array.prototype.forEach.call(radios(name), function (r) { r.checked = String(r.value) === String(value); });
  }

  /* ---------- Desplegables con búsqueda ---------- */
  var comboCiclo = null;
  var comboComunidad = Combo.create({
    root: $('combo-comunidad'),
    items: DATA.comunidades.map(function (c) {
      return { value: c.id, label: c.nombre, search: c.alias || '' };
    }),
    emptyText: function () { return 'No encuentro esa comunidad. Escribe parte del nombre.'; },
    onChange: function (item) {
      state.comunidad = item ? item.value : null;
      state.pct = null;                       // vuelve al porcentaje de la comunidad
      state.cuentan = null;                   // y a lo que cuenta su normativa
      if (comboCiclo) {
        comboCiclo.setItems(buildCicloItems());                  // cada comunidad tiene sus propios ciclos
        if (state.ciclo && !cicloById(state.ciclo)) { state.ciclo = null; comboCiclo.setValue(null, true); }
      }
      renderAll();
      saveSoon();
    }
  });

  // Ciclos de la comunidad elegida (sin comunidad no hay lista: los ciclos y sus horas dependen de ella)
  function buildCicloItems() {
    return DATA.ciclosDe(state.comunidad).map(function (c) {
      return {
        value: c.id,
        label: c.nombre + (c.sigla ? ' (' + c.sigla + ')' : ''),
        detail: c.familia,
        badge: '',
        group: c.grado === 'superior' ? 'Grado superior' : 'Grado medio',
        search: [c.sigla || '', c.alias || '', c.familia2 || '', 'grado ' + c.grado].join(' ')
      };
    }).sort(function (a, b) { return a.label.localeCompare(b.label, 'es'); });
  }

  comboCiclo = Combo.create({
    root: $('combo-ciclo'),
    items: buildCicloItems(),
    groups: ['Grado superior', 'Grado medio'],
    emptyText: function (q) {
      return 'No hay ningún ciclo que coincida con «' + q.trim() + '». Prueba con otra palabra o con las siglas, por ejemplo DAW o SMR.';
    },
    onChange: function (item) {
      state.ciclo = item ? item.value : null;
      renderAll();
      saveSoon();
    }
  });

  /* ---------- Pintado ---------- */
  function td(label, cls) {
    var cell = document.createElement('td');
    cell.className = cls;
    if (label) cell.setAttribute('data-label', label);
    return cell;
  }

  function numberInput(value) {
    var input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = '3000';
    input.step = '1';
    input.inputMode = 'numeric';
    input.value = value > 0 ? String(value) : '';
    input.placeholder = '0';
    return input;
  }

  function readInt(input) {
    var n = parseInt(input.value, 10);
    return isNaN(n) || n < 0 ? 0 : Math.min(n, 3000);
  }

  var ICON_MINUS = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false"><path d="M3 8h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_PLUS = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false"><path d="M3 8h10M8 3v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  // Campo numérico con botones − y + para ir sumando horas de una en una
  function stepper(input) {
    var wrap = document.createElement('div');
    wrap.className = 'stepper';
    var minus = document.createElement('button');
    minus.type = 'button';
    minus.className = 'step-btn';
    minus.innerHTML = ICON_MINUS;
    var plus = document.createElement('button');
    plus.type = 'button';
    plus.className = 'step-btn';
    plus.innerHTML = ICON_PLUS;
    function bump(delta) {
      var max = input.max === '' ? 3000 : Number(input.max);
      var next = Math.max(0, Math.min(max, readInt(input) + delta));
      input.value = next > 0 ? String(next) : '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    minus.addEventListener('click', function () { bump(-1); });
    plus.addEventListener('click', function () { bump(1); });
    wrap.appendChild(minus);
    wrap.appendChild(input);
    wrap.appendChild(plus);
    return { wrap: wrap, minus: minus, plus: plus };
  }

  function makeRow(m) {
    var tr = document.createElement('tr');

    var cName = td('Módulo', 'col-name');
    var name = null;
    if (m.r) {
      cName.textContent = m.n;
    } else {
      name = document.createElement('input');
      name.type = 'text';
      name.maxLength = 80;
      name.value = m.n;
      name.placeholder = 'Nombre del módulo';
      name.setAttribute('aria-label', 'Nombre del módulo');
      name.className = 'in-name';
      cName.appendChild(name);
    }

    var cHours = td('Horas del módulo', 'col-num');
    var inHours = numberInput(m.h);
    cHours.appendChild(inHours);

    var cFalt = td('Horas faltadas', 'col-num');
    var inFalt = numberInput(m.f);
    var stFalt = stepper(inFalt);
    cFalt.appendChild(stFalt.wrap);

    var cJust = td('De ellas, justificadas', 'col-num col-just');
    var inJust = numberInput(m.j);
    var stJust = stepper(inJust);
    cJust.appendChild(stJust.wrap);

    var cMax = td('Máximo permitido', 'col-out');
    var outMax = document.createElement('span');
    outMax.className = 'out-max';
    cMax.appendChild(outMax);

    var cLeft = td('Te quedan', 'col-out col-left');
    var outLeft = document.createElement('span');
    outLeft.className = 'out-left';
    var outState = document.createElement('span');
    outState.className = 'out-state';
    var bar = document.createElement('span');
    bar.className = 'bar';
    bar.setAttribute('aria-hidden', 'true');
    var fill = document.createElement('span');
    bar.appendChild(fill);
    cLeft.appendChild(outLeft);
    cLeft.appendChild(outState);
    cLeft.appendChild(bar);

    var cTrim = td('Por trimestre', 'col-out');
    var outTrim = document.createElement('span');
    outTrim.className = 'out-trim';
    cTrim.appendChild(outTrim);

    var cAct = td('', 'col-act');
    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn-icon';
    remove.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    cAct.appendChild(remove);

    [cName, cHours, cFalt, cJust, cMax, cLeft, cTrim, cAct].forEach(function (c) { tr.appendChild(c); });

    // Las etiquetas para lectores de pantalla siguen al nombre del módulo
    function relabel() {
      var label = m.n || 'módulo sin nombre';
      inHours.setAttribute('aria-label', 'Horas totales de ' + label);
      inFalt.setAttribute('aria-label', 'Horas faltadas en ' + label);
      inJust.setAttribute('aria-label', 'De las horas faltadas, justificadas en ' + label);
      stFalt.minus.setAttribute('aria-label', 'Quitar una hora de faltas en ' + label);
      stFalt.plus.setAttribute('aria-label', 'Sumar una hora de faltas en ' + label);
      stJust.minus.setAttribute('aria-label', 'Quitar una hora justificada en ' + label);
      stJust.plus.setAttribute('aria-label', 'Sumar una hora justificada en ' + label);
      remove.setAttribute('aria-label', 'Quitar ' + label);
    }
    relabel();

    function syncJust() {
      inJust.max = String(m.f);
      if (m.j > m.f) {
        m.j = m.f;
        inJust.value = m.j > 0 ? String(m.j) : '';
      }
    }
    syncJust();

    function update() {
      var p = getProgress();
      var ciclo = cicloById(state.ciclo);
      var res = calcModule(m, currentPct(), state.criterio, trimestresRestantes(nTrimFor(ciclo, p)));
      tr.setAttribute('data-estado', res.estado);
      outState.textContent = LABELS[res.estado];
      if (res.estado === 'none') {
        outMax.textContent = '—';
        outLeft.textContent = '—';
        outTrim.textContent = '—';
        fill.style.width = '0%';
        return;
      }
      outMax.textContent = fmtH(res.max);
      outLeft.textContent = res.estado === 'over' ? 'Te has pasado ' + fmtH(res.used - res.max) : fmtH(res.left);
      outTrim.textContent = res.perTrim > 0 ? '≈ ' + fmtH(res.perTrim) : '—';
      fill.style.width = Math.round(res.ratio * 100) + '%';
    }
    tr._update = update;

    if (name) {
      name.addEventListener('input', function () { m.n = name.value; relabel(); saveSoon(); scheduleSummary(); });
    }
    inHours.addEventListener('input', function () { m.h = readInt(inHours); update(); scheduleSummary(); saveSoon(); });
    inFalt.addEventListener('input', function () { m.f = readInt(inFalt); syncJust(); update(); scheduleSummary(); saveSoon(); });
    inJust.addEventListener('input', function () {
      var v = readInt(inJust);
      m.j = Math.min(v, m.f);
      if (v > m.f) inJust.value = m.j > 0 ? String(m.j) : '';   // no puede haber más justificadas que faltadas
      update(); scheduleSummary(); saveSoon();
    });
    remove.addEventListener('click', function () {
      var p = getProgress();
      var i = p.m.indexOf(m);
      if (i === -1) return;
      p.m.splice(i, 1);
      renderModules();
      saveSoon();
      (el.add).focus();
    });

    update();
    return tr;
  }

  function updateAllRows() {
    Array.prototype.forEach.call(el.rows.children, function (tr) { if (tr._update) tr._update(); });
    scheduleSummary();
  }

  var summaryTimer = null;
  function scheduleSummary() {
    window.clearTimeout(summaryTimer);
    summaryTimer = window.setTimeout(renderSummary, 350);
  }

  function criterioTexto() {
    return state.criterio === 'alcanzar' ? 'se pierde al alcanzar el límite' : 'se pierde al superar el límite';
  }

  function renderSummary() {
    var ciclo = cicloById(state.ciclo);
    if (!ciclo) { el.summary.hidden = true; return; }
    var p = getProgress();
    el.summary.textContent = '';
    if (!p.m.length) { el.summary.hidden = true; return; }

    var pct = currentPct();
    var nTrim = nTrimFor(ciclo, p);
    var rest = trimestresRestantes(nTrim);
    var total = 0, justified = 0, over = [], near = [];
    p.m.forEach(function (m) {
      total += counted(m);
      justified += currentCuentan() === 'injust' ? Math.min(m.j, m.f) : 0;
      var res = calcModule(m, pct, state.criterio, rest);
      var name = m.n || 'Módulo sin nombre';
      if (res.estado === 'over') over.push(name);
      else if (res.estado === 'limit' || res.estado === 'warn') near.push(name);
    });

    function line(text, strong) {
      var para = document.createElement('p');
      if (strong) { var s = document.createElement('strong'); s.textContent = strong; para.appendChild(s); para.appendChild(document.createTextNode(' ')); }
      para.appendChild(document.createTextNode(text));
      el.summary.appendChild(para);
    }

    var heading = document.createElement('h3');
    heading.textContent = 'Resumen';
    el.summary.appendChild(heading);
    var modulos = p.m.length + (p.m.length === 1 ? ' módulo' : ' módulos');
    if (currentCuentan() === 'injust') {
      line('Llevas ' + fmtH(total) + ' de faltas que cuentan en ' + modulos + (justified ? ' (' + fmtH(justified) + ' justificadas no se cuentan).' : '.'));
    } else {
      line('Llevas ' + fmtH(total) + ' faltadas en ' + modulos + '.');
    }
    if (over.length) {
      line(over.join(', ') + '. Habla con tu tutor o tutora para saber cómo se evaluará.', 'Has superado el límite en:');
    }
    if (near.length) {
      line(near.join(', ') + '.', 'Cerca del límite o sin margen:');
    }
    if (!over.length && !near.length) {
      line('Por ahora ningún módulo está cerca del límite.');
    }

    var nowT = Math.min(state.trimestre || autoTrimestre(), nTrim);
    var assumptions = document.createElement('p');
    assumptions.className = 'summary-note';
    assumptions.textContent = 'Cálculo con un límite del ' + nf.format(pct) + ' % (' + criterioTexto() + '), ' + nTrim +
      ' trimestres de clase y estando en el ' + nowT + 'º trimestre: lo que te queda se reparte entre ' + rest +
      (rest === 1 ? ' trimestre.' : ' trimestres.');
    el.summary.appendChild(assumptions);
    el.summary.hidden = false;
  }

  function renderModules() {
    var ciclo = cicloById(state.ciclo);
    el.rows.textContent = '';
    if (!ciclo) return;
    var p = getProgress();
    p.m.forEach(function (m) { el.rows.appendChild(makeRow(m)); });
    el.table.hidden = p.m.length === 0;
    el.table.setAttribute('data-cuentan', currentCuentan());
    renderSummary();
  }

  /* ---------- Normativa de la comunidad ---------- */
  function renderComInfo() {
    var box = el.comInfo;
    var com = comunidadById(state.comunidad);
    box.textContent = '';
    if (!com) { box.hidden = true; return; }

    var pct = communityPct();
    var title = document.createElement('h3');
    title.id = 'com-info-title';
    title.textContent = 'Faltas en ' + com.nombre + ': ' + nf.format(pct) + ' %';
    box.appendChild(title);
    box.setAttribute('aria-labelledby', 'com-info-title');
    box.setAttribute('data-origen', com.origen || 'sin-datos');

    var badges = document.createElement('p');
    badges.className = 'com-badges';
    function badge(text, cls) {
      var b = document.createElement('span');
      b.className = 'badge ' + cls;
      b.textContent = text;
      badges.appendChild(b);
    }
    badge(ORIGEN[com.origen] || ORIGEN['sin-datos'], 'badge-origen');
    badge(CUENTAN[com.cuentan] || CUENTAN.centro, 'badge-plain');
    box.appendChild(badges);

    function para(text, cls) {
      if (!text) return;
      var p = document.createElement('p');
      if (cls) p.className = cls;
      p.textContent = text;
      box.appendChild(p);
    }
    para(com.nota);
    para(com.matricula, 'com-matricula');

    if (com.fuentes && com.fuentes.length) {
      var det = document.createElement('details');
      det.className = 'com-sources';
      var sum = document.createElement('summary');
      sum.textContent = com.fuentes.length === 1 ? 'Fuente' : 'Fuentes (' + com.fuentes.length + ')';
      det.appendChild(sum);
      var ul = document.createElement('ul');
      com.fuentes.forEach(function (f) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = f.u;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = f.t;
        var hid = document.createElement('span');
        hid.className = 'sr-only';
        hid.textContent = ' (se abre en una pestaña nueva)';
        li.appendChild(a);
        li.appendChild(hid);
        ul.appendChild(li);
      });
      det.appendChild(ul);
      box.appendChild(det);
    }

    var more = document.createElement('p');
    more.className = 'com-more';
    var link = document.createElement('a');
    link.href = '../normativa/normativa-faltas.html#com-' + com.id;
    link.textContent = 'Ver la normativa y las fuentes';
    more.appendChild(link);
    box.appendChild(more);
    box.hidden = false;
  }

  function syncSettings() {
    var ciclo = cicloById(state.ciclo);
    var p = ciclo ? getProgress() : null;
    var nTrim = ciclo ? nTrimFor(ciclo, p) : 3;

    setRadio('curso', state.curso);
    setRadio('criterio', state.criterio);
    setRadio('cuentan', currentCuentan());
    setRadio('ntrim', nTrim);

    var nowT = Math.min(state.trimestre || autoTrimestre(), nTrim);
    setRadio('trimestre', nowT);
    var third = $('trim-3');
    if (third) third.disabled = nTrim < 3;

    el.pct.value = String(currentPct());
    el.pctReset.hidden = state.pct == null;

    var com = comunidadById(state.comunidad);
    if (!com) {
      el.pctNote.textContent = 'Elige tu comunidad para ver su porcentaje. Mientras tanto se usa el ' + DEFAULT_PCT + ' %.';
    } else if (com.origen === 'sin-datos') {
      el.pctNote.textContent = 'No hemos encontrado el porcentaje de ' + com.nombre + ': se usa el ' + nf.format(communityPct()) + ' %, un valor prudente. Cámbialo si tu centro usa otro.';
    } else if (com.origen === 'centro') {
      el.pctNote.textContent = 'Valor orientativo para ' + com.nombre + ': lo fija cada centro. Cámbialo por el de tu centro.';
    } else {
      el.pctNote.textContent = 'Porcentaje de ' + com.nombre + ': ' + nf.format(communityPct()) + ' %. Cámbialo si tu centro usa otro.';
    }

    renderComInfo();
    renderHint();
  }

  function renderHint() {
    el.hint.textContent = currentCuentan() === 'injust'
      ? 'Aquí solo cuentan las faltas injustificadas: apunta en «De ellas, justificadas» las que hayas justificado y no se sumarán.'
      : 'Aquí cuentan todas las faltas, justificadas o no. Si en tu centro solo cuentan las injustificadas, cámbialo en «Qué faltas cuentan».';
  }

  function renderPrintMeta() {
    var ciclo = cicloById(state.ciclo);
    var com = comunidadById(state.comunidad);
    if (!ciclo) { el.printMeta.textContent = ''; return; }
    el.printMeta.textContent = (com ? com.nombre + ' · ' : '') + ciclo.nombre + ' · ' + state.curso + 'º · límite del ' +
      nf.format(currentPct()) + ' % (' + criterioTexto() + ') · ' + (currentCuentan() === 'injust' ? 'solo cuentan las injustificadas' : 'cuentan todas las faltas');
  }

  function renderAll() {
    var ciclo = cicloById(state.ciclo);
    syncSettings();

    el.notice.hidden = true;
    el.notice.textContent = '';
    el.source.textContent = '';

    if (!ciclo) {
      el.title.textContent = 'Elige tu ciclo para ver los módulos';
      el.table.hidden = true;
      el.rows.textContent = '';
      el.actions.hidden = true;
      el.summary.hidden = true;
      el.hint.hidden = true;
      el.notice.hidden = false;
      el.notice.textContent = state.comunidad
        ? 'Escribe el nombre del ciclo o sus siglas (por ejemplo DAW, SMR o enfermería) en el segundo desplegable.'
        : 'Elige primero tu comunidad en el primer desplegable: los ciclos y sus horas dependen de ella.';
      renderPrintMeta();
      return;
    }

    el.title.textContent = 'Módulos de ' + state.curso + 'º de ' + ciclo.nombre;
    el.actions.hidden = false;
    el.hint.hidden = false;

    var refs = refModules(ciclo, state.curso);
    var com = comunidadById(state.comunidad);
    el.restore.hidden = !(refs && refs.length);

    if (refs && refs.length) {
      var h = com && com.horas;
      el.source.textContent = 'Horas de los módulos: ' + (h && h.fuente ? h.fuente : 'currículo de ' + (com ? com.nombre : 'tu comunidad')) + '. ' +
        (h && h.nota ? h.nota + ' ' : 'Pueden variar según tu centro. ') + 'Edítalas si no coinciden con tu horario.';
    } else if (refs && !refs.length) {
      el.notice.hidden = false;
      el.notice.textContent = 'En ' + state.curso + 'º de este ciclo solo hay Formación en centros de trabajo (FCT), que tiene sus propias normas de asistencia, así que no hay módulos de aula que calcular. Si tu centro tiene otros módulos, puedes añadirlos.';
    } else {
      el.notice.hidden = false;
      el.notice.textContent = '';
      el.notice.appendChild(document.createTextNode('Todavía no tenemos los módulos de este ciclo. Añade los tuyos con su nombre y sus horas totales (las encontrarás en tu horario o en la programación). Se guardan solo en este navegador. '));
      var a = document.createElement('a');
      a.href = '../index.html#sugerencias';
      a.textContent = 'Avísanos para añadir el ciclo';
      el.notice.appendChild(a);
      el.notice.appendChild(document.createTextNode('.'));
    }

    renderModules();
    renderPrintMeta();
  }

  /* ---------- Copiar e imprimir ---------- */
  function summaryText() {
    var ciclo = cicloById(state.ciclo);
    if (!ciclo) return '';
    var p = getProgress();
    var com = comunidadById(state.comunidad);
    var pct = currentPct();
    var rest = trimestresRestantes(nTrimFor(ciclo, p));
    var lines = [];
    lines.push('FP Cuenta · Calculadora de faltas');
    lines.push((com ? com.nombre + ' · ' : '') + ciclo.nombre + ' · ' + state.curso + 'º');
    lines.push('Límite del ' + nf.format(pct) + ' % (' + criterioTexto() + '). ' +
      (currentCuentan() === 'injust' ? 'Solo cuentan las faltas injustificadas.' : 'Cuentan todas las faltas.'));
    lines.push('');
    p.m.forEach(function (m) {
      var res = calcModule(m, pct, state.criterio, rest);
      var name = m.n || 'Módulo sin nombre';
      if (res.estado === 'none') {
        lines.push('- ' + name + ': sin horas del módulo');
      } else if (res.estado === 'over') {
        lines.push('- ' + name + ' (' + fmtH(m.h) + '): faltas ' + fmtH(res.used) + ', máximo ' + fmtH(res.max) + '. Límite superado por ' + fmtH(res.used - res.max));
      } else {
        lines.push('- ' + name + ' (' + fmtH(m.h) + '): faltas ' + fmtH(res.used) + ', máximo ' + fmtH(res.max) + ', te quedan ' + fmtH(res.left) +
          (res.perTrim > 0 ? ' (≈ ' + fmtH(res.perTrim) + ' por trimestre)' : ''));
      }
    });
    lines.push('');
    lines.push('Cálculo orientativo. Mandan la normativa de tu comunidad y las normas de tu centro.');
    return lines.join('\n');
  }

  var copyTimer = null;
  function showCopyStatus(text) {
    el.copyStatus.textContent = text;
    window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(function () { el.copyStatus.textContent = ''; }, 4000);
  }

  function legacyCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  el.copy.addEventListener('click', function () {
    var text = summaryText();
    if (!text) return;
    function done(ok) { showCopyStatus(ok ? 'Resumen copiado. Ya puedes pegarlo donde quieras.' : 'No se ha podido copiar. Prueba con «Imprimir» o selecciona la tabla a mano.'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(legacyCopy(text)); });
    } else {
      done(legacyCopy(text));
    }
  });

  el.print.addEventListener('click', function () { renderPrintMeta(); window.print(); });

  /* ---------- Acciones ---------- */
  el.add.addEventListener('click', function () {
    var p = getProgress();
    p.m.push(blankRow());
    renderModules();
    saveSoon();
    var last = el.rows.lastElementChild;
    var field = last && last.querySelector('.in-name');
    if (field) field.focus();
  });

  el.restore.addEventListener('click', function () {
    var ciclo = cicloById(state.ciclo);
    var refs = refModules(ciclo, state.curso);
    if (!refs || !refs.length) return;
    var p = getProgress();
    var previous = {};
    p.m.forEach(function (m) { if (m.r) previous[m.n] = m; });
    var custom = p.m.filter(function (m) { return !m.r; });
    p.m = refs.map(function (r) {
      var old = previous[r[0]];
      return { n: r[0], h: r[1], f: old ? old.f : 0, j: old ? old.j : 0, r: true };   // conserva tus faltas
    }).concat(custom);
    renderModules();
    saveSoon();
  });

  var wipeTimer = null;
  el.wipe.addEventListener('click', function () {
    if (el.wipe.getAttribute('data-confirm') !== '1') {
      el.wipe.setAttribute('data-confirm', '1');
      el.wipe.textContent = 'Pulsa otra vez para borrar todo';
      wipeTimer = window.setTimeout(function () {
        el.wipe.removeAttribute('data-confirm');
        el.wipe.textContent = 'Borrar mis datos guardados';
      }, 5000);
      return;
    }
    window.clearTimeout(wipeTimer);
    el.wipe.removeAttribute('data-confirm');
    el.wipe.textContent = 'Borrar mis datos guardados';
    window.clearTimeout(saveTimer);
    storageClear();
    state.comunidad = null; state.ciclo = null; state.curso = 1; state.pct = null;
    state.criterio = 'superar'; state.cuentan = null; state.trimestre = null; state.progreso = {};
    comboComunidad.setValue(null, true);
    comboCiclo.setValue(null, true);
    renderAll();
  });

  // Curso
  Array.prototype.forEach.call(radios('curso'), function (r) {
    r.addEventListener('change', function () {
      state.curso = Number(r.value) === 2 ? 2 : 1;
      renderAll();
      saveSoon();
    });
  });

  // Trimestre en el que estás
  Array.prototype.forEach.call(radios('trimestre'), function (r) {
    r.addEventListener('change', function () {
      state.trimestre = Number(r.value);
      updateAllRows();
      saveSoon();
    });
  });

  // Trimestres de clase del curso
  Array.prototype.forEach.call(radios('ntrim'), function (r) {
    r.addEventListener('change', function () {
      if (!state.ciclo) return;
      getProgress().t = Number(r.value);
      syncSettings();
      updateAllRows();
      saveSoon();
    });
  });

  // Criterio: superar o alcanzar
  Array.prototype.forEach.call(radios('criterio'), function (r) {
    r.addEventListener('change', function () {
      state.criterio = r.value === 'alcanzar' ? 'alcanzar' : 'superar';
      updateAllRows();
      renderPrintMeta();
      saveSoon();
    });
  });

  // Qué faltas cuentan: todas o solo las injustificadas
  Array.prototype.forEach.call(radios('cuentan'), function (r) {
    r.addEventListener('change', function () {
      state.cuentan = r.value === 'injust' ? 'injust' : 'todas';
      el.table.setAttribute('data-cuentan', currentCuentan());
      renderHint();
      updateAllRows();
      renderPrintMeta();
      saveSoon();
    });
  });

  // Porcentaje
  el.pct.addEventListener('input', function () {
    var v = parseFloat(String(el.pct.value).replace(',', '.'));
    if (!isFinite(v) || v < 1 || v > 100) return;
    state.pct = v;
    el.pctReset.hidden = false;
    updateAllRows();
    renderPrintMeta();
    saveSoon();
  });
  el.pct.addEventListener('blur', function () { el.pct.value = String(currentPct()); });
  el.pctReset.addEventListener('click', function () {
    state.pct = null;
    syncSettings();
    updateAllRows();
    renderPrintMeta();
    saveSoon();
  });

  // El formulario no se envía a ningún sitio
  $('calc-form').addEventListener('submit', function (event) { event.preventDefault(); });

  /* ---------- Arranque ---------- */
  loadState();
  if (!state.comunidad && DATA.comunidades.length === 1) state.comunidad = DATA.comunidades[0].id;   // con una sola comunidad, ya está elegida
  if (state.comunidad) comboComunidad.setValue(state.comunidad, true);
  comboCiclo.setItems(buildCicloItems());
  if (state.ciclo) comboCiclo.setValue(state.ciclo, true);
  renderAll();
})();
