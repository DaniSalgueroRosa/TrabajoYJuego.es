/* =========================================================
   FP Cuenta · calculadora-notas/calculadora-notas.js
   Resultados de aprendizaje (RA) de un módulo → nota que llevas y media que necesitas en el resto.
   Todo se calcula en el navegador. Lo que escribes se guarda solo en este navegador (localStorage).

   Los RA de cada módulo todavía no están cargados: los apunta la persona. Cuando existan,
   se añaden en datos/ra.js (formato explicado en ese archivo) y aparece el botón «Cargar los RA de este módulo».
   ========================================================= */
(function () {
  'use strict';

  var DATA = window.FP_DATA;
  var Combo = window.FPCombobox;
  if (!DATA || !DATA.todosLosCiclos || !Combo || !document.getElementById('notas-form')) return;

  var STORAGE_KEY = 'fpcuenta-notas-v1';
  var MAX_RA = 30;
  var nf = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
  var nf1 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

  function $(id) { return document.getElementById(id); }
  function fmt(n) { return nf.format(Math.round(n * 100) / 100); }
  function fmtPeso(n) { return nf.format(Math.round(n * 100) / 100) + ' %'; }

  /* ---------- Estado ---------- */
  var state = {
    ciclo: null,        // id de ciclo (opcional)
    curso: 1,
    modulo: '',         // nombre del módulo (texto libre)
    objetivo: 5,        // nota que se quiere sacar
    minRA: false,       // hay que sacar al menos 5 en cada RA
    auto: true,         // los pesos se reparten por igual mientras nadie los toque
    ras: []             // [{ n: nombre, w: peso, g: nota o null, s: todavía no cursado }]
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

  function inRange(value, min, max) {
    if (value == null || value === '' || typeof value === 'boolean') return false;
    var n = Number(value);
    return isFinite(n) && n >= min && n <= max;
  }

  function newRA(i, w) { return { n: 'RA ' + i, w: w, g: null, s: false }; }

  // Primer «RA n» que no esté ya en la lista
  function nextRAName() {
    var used = {};
    state.ras.forEach(function (ra) { used[norm(ra.n)] = true; });
    for (var i = 1; i <= MAX_RA + 1; i++) if (!used['ra ' + i]) return i;
    return state.ras.length + 1;
  }

  function equalWeights() {
    var n = state.ras.length;
    if (!n) return;
    var w = Math.round(10000 / n) / 100;
    state.ras.forEach(function (ra) { ra.w = w; });
    // el último absorbe el redondeo para que sumen 100
    state.ras[n - 1].w = Math.round((100 - w * (n - 1)) * 100) / 100;
  }

  function defaultRAs() {
    state.ras = [1, 2, 3, 4].map(function (i) { return newRA(i, 25); });
    state.auto = true;
  }

  function loadState() {
    var raw = storageGet();
    var saved = null;
    if (raw) { try { saved = JSON.parse(raw); } catch (e) { saved = null; } }
    if (!saved || typeof saved !== 'object') { defaultRAs(); return; }

    if (cicloById(saved.ciclo)) state.ciclo = saved.ciclo;
    state.curso = saved.curso === 2 ? 2 : 1;
    state.modulo = String(saved.modulo || '').slice(0, 100);
    state.objetivo = inRange(saved.objetivo, 1, 10) ? Number(saved.objetivo) : 5;
    state.minRA = !!saved.minRA;
    state.auto = saved.auto !== false;
    if (Array.isArray(saved.ras) && saved.ras.length) {
      state.ras = saved.ras.slice(0, MAX_RA).map(function (ra, i) {
        return {
          n: String(ra && ra.n || 'RA ' + (i + 1)).slice(0, 80),
          w: inRange(ra && ra.w, 0, 100) ? Number(ra.w) : 0,
          g: inRange(ra && ra.g, 0, 10) ? Number(ra.g) : null,
          s: !!(ra && ra.s)
        };
      });
    } else {
      defaultRAs();
    }
  }

  /* ---------- Datos ---------- */
  // Esta calculadora no pide la comunidad: ofrece los ciclos de todas las comunidades disponibles (sin repetir)
  function cicloById(id) {
    var list = DATA.todosLosCiclos();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function norm(text) { return Combo.fold(String(text || '')).replace(/\s+/g, ' ').trim(); }

  // Nombres de módulo de un ciclo y curso, de cualquier comunidad que los tenga (sin repetir)
  // Nombres de los módulos de un ciclo y curso en todas las comunidades, sin repetir.
  // Los que vienen de una comunidad con los módulos en otro idioma (idioma: "ca") se anotan en `otroIdioma`.
  var otroIdioma = {};
  function moduleNames(cicloId, curso) {
    var M = DATA.modulos || {};
    var seen = {};
    var out = [];
    otroIdioma = {};
    if (!cicloId) return out;
    Object.keys(M).forEach(function (com) {
      var d = M[com] && M[com][cicloId];
      var list = d && d.modulos && d.modulos[String(curso)];
      if (!Array.isArray(list)) return;
      var info = DATA.comunidad ? DATA.comunidad(com) : null;
      list.forEach(function (m) {
        var k = norm(m[0]);
        if (!seen[k]) {
          seen[k] = true;
          out.push(m[0]);
          if (info && info.idioma) otroIdioma[m[0]] = info.nombre;
        }
      });
    });
    return out;
  }

  // RA ya cargados para un módulo (datos/ra.js): [[nombre, peso], …] o null
  function loadedRAs() {
    var table = DATA.ra && state.ciclo && DATA.ra[state.ciclo];
    if (!table || !state.modulo) return null;
    var wanted = norm(state.modulo);
    var keys = Object.keys(table);
    for (var i = 0; i < keys.length; i++) {
      if (norm(keys[i]) === wanted && Array.isArray(table[keys[i]]) && table[keys[i]].length) return table[keys[i]];
    }
    return null;
  }

  /* ---------- Cálculo ---------- */
  // Devuelve todo lo que hace falta para pintar: medias, puntos, media necesaria…
  function compute() {
    var objetivo = state.objetivo;
    var total = 0;
    state.ras.forEach(function (ra) { total += ra.w; });
    var equal = total <= 0;            // sin pesos: todos valen lo mismo
    var weightOf = function (ra) { return equal ? 1 : ra.w; };
    if (equal) total = state.ras.length;

    var sumDone = 0, wDone = 0, wRest = 0;
    var done = [], rest = [], below = [];
    state.ras.forEach(function (ra) {
      var w = weightOf(ra);
      if (!ra.s && ra.g != null) {
        sumDone += w * ra.g;
        wDone += w;
        done.push(ra);
        if (ra.g < 5) below.push(ra);
      } else {
        wRest += w;
        rest.push(ra);
      }
    });

    var res = {
      total: total, equal: equal, done: done, rest: rest, below: below,
      wDone: wDone, wRest: wRest,
      sumDone: sumDone,
      media: wDone > 0 ? sumDone / wDone : null,                   // media de lo cursado
      aportado: total > 0 ? sumDone / total : 0,                  // puntos sobre 10 ya asegurados
      maxima: total > 0 ? (sumDone + 10 * wRest) / total : 0,      // si sacas 10 en el resto
      necesaria: null,                                             // media necesaria en el resto
      weightOf: weightOf
    };
    if (wRest > 0 && total > 0) res.necesaria = (objetivo * total - sumDone) / wRest;
    res.final = wRest === 0 && total > 0 ? sumDone / total : null;   // todos los RA tienen nota
    return res;
  }

  function sumPesos() {
    var s = 0;
    state.ras.forEach(function (ra) { s += ra.w; });
    return Math.round(s * 100) / 100;
  }

  /* ---------- Elementos ---------- */
  var el = {
    modulo: $('in-modulo'), datalist: $('lista-modulos'), moduloPista: $('modulo-pista'),
    objetivo: $('objetivo'),
    title: $('res-titulo'), source: $('res-fuente'), notice: $('res-aviso'), printMeta: $('print-meta'),
    rows: $('filas'), table: $('tabla-ra'),
    add: $('btn-anadir'), igual: $('btn-igual'), cargar: $('btn-cargar-ra'),
    copy: $('btn-copiar'), print: $('btn-imprimir'), copyStatus: $('copiar-estado'),
    summary: $('resumen'), wipe: $('btn-borrar')
  };

  function radios(name) { return document.querySelectorAll('input[name="' + name + '"]'); }
  function setRadio(name, value) {
    Array.prototype.forEach.call(radios(name), function (r) { r.checked = String(r.value) === String(value); });
  }

  /* ---------- Desplegable de ciclo ---------- */
  var comboCiclo = Combo.create({
    root: $('combo-ciclo'),
    items: DATA.todosLosCiclos().map(function (c) {
      return {
        value: c.id,
        label: c.nombre + (c.sigla ? ' (' + c.sigla + ')' : ''),
        detail: c.familia,
        group: c.grado === 'superior' ? 'Grado superior' : 'Grado medio',
        search: [c.sigla || '', c.alias || '', c.familia2 || '', 'grado ' + c.grado].join(' ')
      };
    }).sort(function (a, b) { return a.label.localeCompare(b.label, 'es'); }),
    groups: ['Grado superior', 'Grado medio'],
    emptyText: function (q) {
      return 'No hay ningún ciclo que coincida con «' + q.trim() + '». Prueba con otra palabra o con las siglas, por ejemplo DAW o SMR.';
    },
    onChange: function (item) {
      state.ciclo = item ? item.value : null;
      renderModuleField();
      renderAll();
      saveSoon();
    }
  });

  function renderModuleField() {
    var names = moduleNames(state.ciclo, state.curso);
    el.datalist.textContent = '';
    names.forEach(function (n) {
      var o = document.createElement('option');
      o.value = n;
      if (otroIdioma[n]) o.label = n + ' (' + otroIdioma[n] + ')';
      el.datalist.appendChild(o);
    });
    if (!state.ciclo) {
      el.moduloPista.textContent = 'Elige un ciclo y un curso para ver sus módulos, o escribe el nombre del tuyo.';
    } else if (names.length) {
      el.moduloPista.textContent = 'Escribe para buscar entre los ' + names.length + ' módulos de ' + state.curso + 'º, o escribe el tuyo si no está.';
    } else {
      el.moduloPista.textContent = 'Todavía no tenemos los módulos de este ciclo. Escribe el nombre del tuyo.';
    }
  }

  /* ---------- Filas ---------- */
  function numInput(value, min, max, step) {
    var input = document.createElement('input');
    input.type = 'number';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.inputMode = 'decimal';
    input.value = value == null ? '' : String(value);
    return input;
  }

  function td(label, cls) {
    var cell = document.createElement('td');
    cell.className = cls;
    if (label) cell.setAttribute('data-label', label);
    return cell;
  }

  var ESTADOS = {
    ok: 'Aprobado', fail: 'Por debajo de 5', none: 'Todavía no cursado', empty: 'Falta la nota'
  };

  function makeRow(ra, index) {
    var tr = document.createElement('tr');

    var cName = td('Resultado de aprendizaje', 'col-name');
    var name = document.createElement('input');
    name.type = 'text';
    name.maxLength = 80;
    name.value = ra.n;
    name.className = 'in-name';
    name.placeholder = 'RA ' + (index + 1);
    cName.appendChild(name);

    var cW = td('Peso (%)', 'col-num');
    var inW = numInput(ra.w, 0, 100, 0.5);
    inW.placeholder = '0';
    cW.appendChild(inW);

    var cG = td('Nota (0 a 10)', 'col-num');
    var inG = numInput(ra.g, 0, 10, 0.1);
    inG.placeholder = '—';
    cG.appendChild(inG);

    var cS = td('Todavía no cursado', 'col-check');
    var label = document.createElement('label');
    label.className = 'check';
    var inS = document.createElement('input');
    inS.type = 'checkbox';
    inS.checked = ra.s;
    var checkText = document.createElement('span');
    checkText.textContent = 'Sin cursar';
    label.appendChild(inS);
    label.appendChild(checkText);
    cS.appendChild(label);

    var cAp = td('Aporta', 'col-out');
    var outAp = document.createElement('span');
    outAp.className = 'out-ap';
    cAp.appendChild(outAp);

    var cSt = td('Estado', 'col-out col-left');
    var outSt = document.createElement('span');
    outSt.className = 'out-left';
    cSt.appendChild(outSt);

    var cAct = td('', 'col-act');
    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn-icon';
    remove.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    cAct.appendChild(remove);

    [cName, cW, cG, cS, cAp, cSt, cAct].forEach(function (c) { tr.appendChild(c); });

    function relabel() {
      var n = ra.n || 'RA ' + (index + 1);
      inW.setAttribute('aria-label', 'Peso de ' + n + ', en porcentaje');
      inG.setAttribute('aria-label', 'Nota de ' + n + ', de 0 a 10');
      inS.setAttribute('aria-label', n + ' todavía no cursado');
      name.setAttribute('aria-label', 'Nombre del resultado de aprendizaje ' + (index + 1));
      remove.setAttribute('aria-label', 'Quitar ' + n);
    }
    relabel();

    function update() {
      inG.disabled = ra.s;
      var res = compute();
      var est;
      if (ra.s) est = 'none';
      else if (ra.g == null) est = 'empty';
      else est = ra.g >= 5 ? 'ok' : 'fail';
      tr.setAttribute('data-estado', est === 'ok' ? 'ok' : est === 'fail' ? 'over' : est === 'empty' ? 'warn' : 'none');
      outSt.textContent = ESTADOS[est];
      if (est === 'ok' || est === 'fail') {
        outAp.textContent = res.total > 0 ? fmt(res.weightOf(ra) * ra.g / res.total) + ' pts' : '—';
      } else {
        outAp.textContent = '—';
      }
    }
    tr._update = update;

    name.addEventListener('input', function () { ra.n = name.value; relabel(); renderSummarySoon(); saveSoon(); });
    inW.addEventListener('input', function () {
      var v = parseFloat(inW.value);
      ra.w = isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
      state.auto = false;
      updateAll();
      saveSoon();
    });
    inG.addEventListener('input', function () {
      var v = parseFloat(String(inG.value).replace(',', '.'));
      ra.g = isFinite(v) ? Math.max(0, Math.min(10, v)) : null;
      updateAll();
      saveSoon();
    });
    inS.addEventListener('change', function () {
      ra.s = inS.checked;
      if (ra.s) { ra.g = null; inG.value = ''; }
      updateAll();
      saveSoon();
    });
    remove.addEventListener('click', function () {
      var i = state.ras.indexOf(ra);
      if (i === -1) return;
      state.ras.splice(i, 1);
      if (state.auto) equalWeights();
      renderRows();
      saveSoon();
      el.add.focus();
    });

    update();
    return tr;
  }

  function renderRows() {
    el.rows.textContent = '';
    state.ras.forEach(function (ra, i) { el.rows.appendChild(makeRow(ra, i)); });
    el.table.hidden = state.ras.length === 0;
    updateAll();
  }

  function updateAll() {
    Array.prototype.forEach.call(el.rows.children, function (tr) { if (tr._update) tr._update(); });
    renderNotice();
    renderSummary();
    renderPrintMeta();
  }

  var summaryTimer = null;
  function renderSummarySoon() {
    window.clearTimeout(summaryTimer);
    summaryTimer = window.setTimeout(renderSummary, 250);
  }

  /* ---------- Avisos ---------- */
  function renderNotice() {
    var s = sumPesos();
    var offBy = Math.abs(s - 100);
    el.notice.textContent = '';
    if (!state.ras.length) {
      el.notice.hidden = false;
      el.notice.textContent = 'No hay ningún resultado de aprendizaje. Pulsa «Añadir RA» para empezar.';
    } else if (s <= 0) {
      el.notice.hidden = false;
      el.notice.textContent = 'Los pesos están a cero, así que todos los RA valen lo mismo. Escribe el peso de cada uno o pulsa «Repartir los pesos por igual».';
    } else if (offBy > 0.5) {
      el.notice.hidden = false;
      el.notice.textContent = 'Los pesos suman ' + fmtPeso(s) + ', no 100 %. La calculadora lo hace igualmente en proporción, pero revisa que no te falte o sobre alguno.';
    } else {
      el.notice.hidden = true;
    }
  }

  function renderPrintMeta() {
    var ciclo = cicloById(state.ciclo);
    var parts = [];
    if (ciclo) parts.push(ciclo.nombre + ' · ' + state.curso + 'º');
    if (state.modulo) parts.push(state.modulo);
    parts.push('objetivo: ' + nf1.format(state.objetivo));
    el.printMeta.textContent = parts.join(' · ');
  }

  /* ---------- Resumen ---------- */
  function stat(list, label, value, note, cls) {
    var wrap = document.createElement('div');
    wrap.className = 'stat' + (cls ? ' ' + cls : '');
    var dt = document.createElement('dt');
    dt.textContent = label;
    var dd = document.createElement('dd');
    var big = document.createElement('span');
    big.className = 'stat-value';
    big.textContent = value;
    dd.appendChild(big);
    if (note) {
      var small = document.createElement('span');
      small.className = 'stat-note';
      small.textContent = note;
      dd.appendChild(small);
    }
    wrap.appendChild(dt);
    wrap.appendChild(dd);
    list.appendChild(wrap);
  }

  // Frase principal según dónde estés
  function verdict(r) {
    var obj = nf1.format(state.objetivo);
    var below = r.below.length;
    var needAll = state.minRA && below > 0;

    if (!r.done.length) {
      return { tone: 'idle', text: 'Escribe la nota de algún RA para ver tu resultado.' };
    }
    if (r.final != null) {
      var pass = r.final >= state.objetivo - 1e-9 && !needAll;
      if (needAll) {
        return { tone: 'bad', text: 'Tu nota final sería un ' + fmt(r.final) + ', pero tienes ' + below + ' RA' + ' por debajo de 5 y tu programación exige aprobar cada uno. Tendrás que recuperarlos.' };
      }
      return pass
        ? { tone: 'good', text: 'Con todos los RA con nota, la nota del módulo es un ' + fmt(r.final) + '. Llegas a tu objetivo de ' + obj + '.' }
        : { tone: 'bad', text: 'Con todos los RA con nota, la nota del módulo es un ' + fmt(r.final) + '. No llegas a tu objetivo de ' + obj + '.' };
    }
    // Quedan RA por cursar o sin nota
    var nRest = r.rest.length;
    var restTxt = nRest === 1 ? 'el RA que te queda' : 'los ' + nRest + ' RA que te quedan';
    var need = r.necesaria;
    var floor5 = state.minRA ? 5 : 0;
    var needEff = Math.max(need, floor5);

    if (need > 10 + 1e-9) {
      return { tone: 'bad', text: 'Con lo que llevas no llegas a un ' + obj + ' ni sacando un 10 en ' + restTxt + ': la nota máxima posible es un ' + fmt(r.maxima) + '.' };
    }
    if (needAll) {
      return { tone: 'warn', text: 'Tienes ' + below + ' RA' + ' por debajo de 5 y tu programación exige aprobar cada uno: tendrás que recuperarlos. Para el resto, necesitas una media de ' + fmt(needEff) + ' en ' + restTxt + '.' };
    }
    if (state.minRA) {
      if (need > 5) {
        return { tone: need > 8 ? 'warn' : 'good', text: 'Para llegar a un ' + obj + ' necesitas una media de ' + fmt(need) + ' en ' + restTxt + ', con al menos un 5 en cada uno.' };
      }
      return { tone: 'good', text: 'Como hay que aprobar cada RA, necesitas al menos un 5 en ' + restTxt + '. Con eso llegas a un ' + obj + '.' };
    }
    if (need <= 1e-9) {
      return { tone: 'good', text: 'Ya llegas a un ' + obj + ' con lo que llevas, aunque sacaras un 0 en ' + restTxt + '.' };
    }
    return { tone: need > 8 ? 'warn' : 'good', text: 'Para llegar a un ' + obj + ' necesitas una media de ' + fmt(need) + ' en ' + restTxt + '.' };
  }

  function renderSummary() {
    var box = el.summary;
    box.textContent = '';
    if (!state.ras.length) return;
    var r = compute();

    var heading = document.createElement('h3');
    heading.textContent = 'Resumen';
    box.appendChild(heading);

    var v = verdict(r);
    var main = document.createElement('p');
    main.className = 'verdict';
    main.setAttribute('data-tone', v.tone);
    main.textContent = v.text;
    box.appendChild(main);

    if (r.done.length) {
      var dl = document.createElement('dl');
      dl.className = 'stats';
      var pesoHecho = r.total > 0 ? r.wDone / r.total * 100 : 0;
      stat(dl, 'Media de lo cursado', fmt(r.media), r.done.length + ' RA con nota (' + fmtPeso(pesoHecho) + ' del módulo)');
      stat(dl, 'Puntos asegurados', fmt(r.aportado), 'sobre 10, si el resto saliera 0');
      if (r.rest.length) {
        if (r.necesaria != null) {
          var shown = r.necesaria > 10 + 1e-9 ? 'No llegas' : r.necesaria <= 1e-9 ? 'Ya llegas' : fmt(Math.max(r.necesaria, state.minRA ? 5 : 0));
          stat(dl, 'Media necesaria en el resto', shown, 'para sacar un ' + nf1.format(state.objetivo) + ' en el módulo');
        }
        stat(dl, 'Nota máxima posible', fmt(r.maxima), 'si sacas un 10 en lo que queda');
      } else {
        stat(dl, 'Nota del módulo', fmt(r.final), 'media ponderada de todos los RA', 'stat-final');
      }
      box.appendChild(dl);
    }

    var note = document.createElement('p');
    note.className = 'summary-note';
    note.textContent = 'Cálculo con la media ponderada de los RA' +
      (state.minRA ? ' y un 5 como mínimo en cada uno' : '') + '. Los RA sin nota o sin cursar no cuentan en la media de lo que llevas.';
    box.appendChild(note);
  }

  /* ---------- RA ya cargados (datos/ra.js) ---------- */
  function renderLoadButton() {
    var ras = loadedRAs();
    el.cargar.hidden = !ras;
    if (ras) el.cargar.textContent = 'Cargar los ' + ras.length + ' RA de este módulo';
  }

  el.cargar.addEventListener('click', function () {
    var ras = loadedRAs();
    if (!ras) return;
    var previous = state.ras.slice();
    state.ras = ras.slice(0, MAX_RA).map(function (r, i) {
      var old = previous[i];
      return { n: String(r[0]).slice(0, 80), w: Number(r[1]) || 0, g: old ? old.g : null, s: old ? old.s : false };
    });
    state.auto = false;
    renderRows();
    saveSoon();
  });

  /* ---------- Pintado general ---------- */
  function renderAll() {
    setRadio('curso', state.curso);
    setRadio('minra', state.minRA ? 'si' : 'no');
    el.objetivo.value = String(state.objetivo);
    if (el.modulo.value !== state.modulo) el.modulo.value = state.modulo;

    var ciclo = cicloById(state.ciclo);
    el.title.textContent = state.modulo ? 'Resultados de aprendizaje de ' + state.modulo : 'Resultados de aprendizaje del módulo';
    el.source.textContent = '';
    renderLoadButton();
    renderRows();
    if (ciclo && !el.cargar.hidden) {
      el.source.textContent = 'Tenemos cargados los RA de este módulo: pulsa «Cargar los RA de este módulo».';
    }
  }

  /* ---------- Copiar e imprimir ---------- */
  function summaryText() {
    var r = compute();
    var ciclo = cicloById(state.ciclo);
    var lines = ['FP Cuenta · Calculadora de notas'];
    var head = [];
    if (ciclo) head.push(ciclo.nombre + ' · ' + state.curso + 'º');
    if (state.modulo) head.push(state.modulo);
    if (head.length) lines.push(head.join(' · '));
    lines.push('Objetivo: ' + nf1.format(state.objetivo) + (state.minRA ? ' (mínimo 5 en cada RA)' : ''));
    lines.push('');
    state.ras.forEach(function (ra) {
      var estado = ra.s ? 'todavía no cursado' : ra.g == null ? 'sin nota' : 'nota ' + fmt(ra.g);
      lines.push('- ' + (ra.n || 'RA') + ' (' + fmtPeso(ra.w) + '): ' + estado);
    });
    lines.push('');
    lines.push(verdict(r).text);
    lines.push('');
    lines.push('Cálculo orientativo. Mandan la programación del módulo y las normas de tu centro.');
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
    if (state.ras.length >= MAX_RA) { showCopyStatus('Puedes tener hasta ' + MAX_RA + ' RA.'); return; }
    state.ras.push(newRA(nextRAName(), 0));
    if (state.auto) equalWeights();
    renderRows();
    saveSoon();
    var last = el.rows.lastElementChild;
    var field = last && last.querySelector('.in-name');
    if (field) { field.focus(); field.select(); }
  });

  el.igual.addEventListener('click', function () {
    state.auto = true;
    equalWeights();
    renderRows();
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
    state.ciclo = null; state.curso = 1; state.modulo = ''; state.objetivo = 5; state.minRA = false;
    defaultRAs();
    comboCiclo.setValue(null, true);
    renderModuleField();
    renderAll();
  });

  // Curso
  Array.prototype.forEach.call(radios('curso'), function (r) {
    r.addEventListener('change', function () {
      state.curso = Number(r.value) === 2 ? 2 : 1;
      renderModuleField();
      renderAll();
      saveSoon();
    });
  });

  // Módulo
  el.modulo.addEventListener('input', function () {
    state.modulo = el.modulo.value.slice(0, 100);
    el.title.textContent = state.modulo ? 'Resultados de aprendizaje de ' + state.modulo : 'Resultados de aprendizaje del módulo';
    renderLoadButton();
    renderPrintMeta();
    saveSoon();
  });

  // Objetivo
  el.objetivo.addEventListener('input', function () {
    var v = parseFloat(String(el.objetivo.value).replace(',', '.'));
    if (!isFinite(v) || v < 1 || v > 10) return;
    state.objetivo = v;
    updateAll();
    saveSoon();
  });
  el.objetivo.addEventListener('blur', function () { el.objetivo.value = String(state.objetivo); });

  // ¿Hay que aprobar cada RA?
  Array.prototype.forEach.call(radios('minra'), function (r) {
    r.addEventListener('change', function () {
      state.minRA = r.value === 'si';
      updateAll();
      saveSoon();
    });
  });

  // El formulario no se envía a ningún sitio
  $('notas-form').addEventListener('submit', function (event) { event.preventDefault(); });

  /* ---------- Arranque ---------- */
  loadState();
  if (state.ciclo) comboCiclo.setValue(state.ciclo, true);
  renderModuleField();
  renderAll();
})();
