/* codeLadder — comportamiento común a todas las páginas. Sin dependencias, sin peticiones externas. */
(function () {
  'use strict';

  var root = document.documentElement;
  var BASE = root.getAttribute('data-base') || '';
  var I18N = window.CL_I18N || { es: {} };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* Almacenamiento: solo preferencias (tema, idioma y lenguaje elegido), en este navegador. */
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    remove: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  var lang = store.get('cl-lang') === 'en' ? 'en' : 'es';

  function t(key) {
    var d = I18N[lang] || {};
    if (d[key] != null) return d[key];
    var f = I18N.es || {};
    return f[key] != null ? f[key] : key;
  }

  /* ---------- Toast ---------- */
  var toastEl = $('#toast');
  var toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2600);
  }
  function soon() { showToast(t('toast.soon')); }
  function fmt(str, vars) {
    return str.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-soon]') : null;
    if (el) { e.preventDefault(); soon(); }
  });

  /* ---------- Lenguaje elegido y niveles ----------
     Para entrar en un nivel hace falta un lenguaje. Si no hay ninguno elegido,
     se abre el selector y, al elegir, se continúa con lo que se había pedido. */
  var LANG_NAMES = {
    java: 'Java', python: 'Python', javascript: 'JavaScript', typescript: 'TypeScript',
    c: 'C', cpp: 'C++', csharp: 'C#', sql: 'SQL', php: 'PHP', go: 'Go', kotlin: 'Kotlin', rust: 'Rust'
  };
  var langList = $('#lang-list');      // solo existe en la portada
  var picker = $('#picker');           // solo existe en la portada
  var pickerList = $('#picker-list');
  var pickerSub = $('#picker-sub');
  var track = null;
  var pendingIntent = null;

  function tiles() { return langList ? $$('.lang', langList) : []; }
  function langName(id) { return LANG_NAMES[id] || ''; }
  function levelName(n) { return t('lvl' + n + '.name'); }

  (function restoreTrack() {
    var saved = store.get('cl-track');
    if (saved && LANG_NAMES[saved]) track = saved;
  })();

  function renderTrack() {
    tiles().forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === track ? 'true' : 'false');
    });
    var text = $('#pick-text');
    var btn = $('#pick-open');
    var sb = $('#sb-lang');
    if (track) {
      if (text) {
        text.textContent = t('levels.chosen') + ' ';
        var strong = document.createElement('strong');
        strong.className = 'pick-name';
        strong.textContent = langName(track);
        text.appendChild(strong);
      }
      if (btn) btn.textContent = t('levels.change');
      sb.textContent = langName(track);
    } else {
      if (text) text.textContent = t('levels.none');
      if (btn) btn.textContent = t('levels.pick');
      sb.textContent = t('status.pick');
    }
  }

  function setTrack(id) {
    track = id;
    store.set('cl-track', id);
    renderTrack();
  }

  function proceed(intent) {
    var name = langName(track);
    if (intent && intent.level) {
      showToast(fmt(t('toast.level'), { lang: name, level: levelName(intent.level) }));
    } else {
      showToast(fmt(t('toast.lang'), { lang: name }));
    }
  }

  function enter(intent) {
    if (!track) { openPicker(intent); return; }
    proceed(intent);
  }

  function openPicker(intent) {
    pendingIntent = intent || null;
    pickerList.textContent = '';
    tiles().forEach(function (b) {
      var li = document.createElement('li');
      li.appendChild(b.cloneNode(true));
      pickerList.appendChild(li);
    });
    if (intent && intent.level) {
      pickerSub.textContent = fmt(t('picker.level'), { level: levelName(intent.level) });
      pickerSub.hidden = false;
    } else if (intent && intent.know) {
      pickerSub.textContent = t('cta.know');
      pickerSub.hidden = false;
    } else {
      pickerSub.hidden = true;
    }
    root.classList.add('modal-open');
    if (picker.showModal) picker.showModal(); else picker.setAttribute('open', '');
    var first = $('.lang[aria-pressed="true"]', pickerList) || $('.lang', pickerList);
    if (first) first.focus();
  }

  function closePicker() {
    if (picker.close) picker.close(); else picker.removeAttribute('open');
    root.classList.remove('modal-open');
  }

  if (langList && picker) {
    langList.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.lang') : null;
      if (b) setTrack(b.getAttribute('data-lang'));
    });

    pickerList.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.lang') : null;
      if (!b) return;
      var intent = pendingIntent;
      setTrack(b.getAttribute('data-lang'));
      closePicker();
      if (intent) proceed(intent);
    });

    picker.addEventListener('click', function (e) { if (e.target === picker) closePicker(); });
    picker.addEventListener('close', function () { root.classList.remove('modal-open'); pendingIntent = null; });
    $('#picker-close').addEventListener('click', closePicker);

    $$('[data-level]').forEach(function (b) {
      b.addEventListener('click', function () { enter({ level: parseInt(b.getAttribute('data-level'), 10) }); });
    });
    $('[data-start]').addEventListener('click', function () { enter({ level: 1 }); });
    $('[data-know]').addEventListener('click', function () { enter({ know: true }); });
    $('#pick-open').addEventListener('click', function () { openPicker(null); });
  }

  /* Desde cualquier página: el selector de la barra de estado lleva a «Elige lenguaje». */
  $('#sb-lang').addEventListener('click', function () {
    if (picker) openPicker(null);
    else window.location.href = BASE + 'index.html#h-lenguajes';
  });

  /* ---------- Tema ---------- */
  var themeColors = { dark: '#1e2128', light: '#fbfbfd' };
  function currentTheme() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function applyTheme(theme, save) {
    root.setAttribute('data-theme', theme);
    if (save) store.set('cl-theme', theme);
    $$('[data-theme-set]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-theme-set') === theme ? 'true' : 'false');
    });
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', themeColors[theme]);
  }
  function toggleTheme() { applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true); }

  $$('[data-theme-set]').forEach(function (b) {
    b.addEventListener('click', function () { applyTheme(b.getAttribute('data-theme-set'), true); });
  });

  /* ---------- Idioma ---------- */
  function applyLang(next, save) {
    lang = next === 'en' ? 'en' : 'es';
    if (save) store.set('cl-lang', lang);
    root.setAttribute('lang', lang);

    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    // textos propios con enlaces (nunca contenido de usuarios)
    $$('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':');
        if (p.length === 2) el.setAttribute(p[0].trim(), t(p[1].trim()));
      });
    });

    var titleKey = root.getAttribute('data-title-key');
    if (titleKey) document.title = t(titleKey);
    var descKey = root.getAttribute('data-desc-key');
    var md = $('meta[name="description"]');
    if (descKey && md) md.setAttribute('content', t(descKey));

    $$('[data-lang-set]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang-set') === lang ? 'true' : 'false');
    });

    renderTrack();
    renderAuthTexts();
    buildCommands();
    if (!palette.hidden) renderPalette();
    startTyping();
  }
  function toggleLang() { applyLang(lang === 'es' ? 'en' : 'es', true); }

  $$('[data-lang-set]').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang-set'), true); });
  });

  /* ---------- Animación de jshell ---------- */
  var runId = 0;
  function startTyping() {
    var term = $('#term');
    if (!term) return;
    var my = ++runId;
    var typed = $('#typed');
    var cur1 = $('#cursor-1');
    var out = $('#out');
    var line3 = $('#line-3');
    var hello = t('term.hello');
    var toks = [
      ['System', 't-type'], ['.', 't-p'], ['out', 't-prop'], ['.', 't-p'],
      ['println', 't-fn'], ['(', 't-p'], ['"' + hello + '"', 't-str'], [')', 't-p'], [';', 't-p']
    ];

    typed.textContent = '';
    out.textContent = hello;
    term.classList.add('is-live');

    if (reduceMotion) {
      toks.forEach(function (tk) {
        var s = document.createElement('span');
        s.className = tk[1];
        s.textContent = tk[0];
        typed.appendChild(s);
      });
      cur1.classList.add('is-off');
      out.classList.remove('is-off');
      line3.classList.remove('is-off');
      return;
    }

    cur1.classList.remove('is-off');
    out.classList.add('is-off');
    line3.classList.add('is-off');

    var ti = 0, ci = 0, span = null;
    function step() {
      if (my !== runId) return;
      if (ti >= toks.length) { setTimeout(finish, 420); return; }
      if (ci === 0) {
        span = document.createElement('span');
        span.className = toks[ti][1];
        typed.appendChild(span);
      }
      span.textContent += toks[ti][0].charAt(ci);
      ci++;
      if (ci >= toks[ti][0].length) { ti++; ci = 0; }
      setTimeout(step, 40 + Math.random() * 55);
    }
    function finish() {
      if (my !== runId) return;
      cur1.classList.add('is-off');
      out.classList.remove('is-off');
      setTimeout(function () {
        if (my !== runId) return;
        line3.classList.remove('is-off');
      }, 260);
    }
    setTimeout(step, 650);
  }

  /* ---------- Paleta de comandos (Ctrl K / ⌘ K) ---------- */
  var palette = $('#palette');
  var input = $('#palette-input');
  var list = $('#palette-list');
  var commands = [];
  var visible = [];
  var active = 0;
  var lastFocus = null;

  function norm(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  var PAGES = [
    ['home', 'nav.home', 'index.html'],
    ['login', 'acc.login.link', 'iniciar-sesion.html'],
    ['register', 'acc.register.link', 'crear-cuenta.html'],
    ['notice', 'foot.notice', 'aviso-legal.html'],
    ['privacy', 'foot.privacy', 'politica-de-privacidad.html'],
    ['cookies', 'foot.cookies', 'politica-de-cookies.html'],
    ['terms', 'foot.terms', 'condiciones-de-uso.html'],
    ['about', 'foot.about', 'sobre-codeladder.html'],
    ['contact', 'foot.contact', 'contacto.html']
  ];

  function go(href) { window.location.href = BASE + href; }

  function buildCommands() {
    commands = [];
    if (langList) {
      commands.push({ id: 'start', label: t('cta.start'), hint: '', run: function () { enter({ level: 1 }); } });
      commands.push({ id: 'know', label: t('cta.know'), hint: '', run: function () { enter({ know: true }); } });
      tiles().forEach(function (b) {
        var id = b.getAttribute('data-lang');
        commands.push({
          id: 'l-' + id,
          label: $('.lang-name', b).textContent,
          hint: $('.lang-state', b).textContent,
          run: function () { setTrack(id); showToast(fmt(t('toast.selected'), { lang: langName(id) })); }
        });
      });
      [1, 2, 3, 4].forEach(function (n) {
        commands.push({ id: 'lvl' + n, label: levelName(n), hint: t('levels.title'), run: function () { enter({ level: n }); } });
      });
    }
    PAGES.forEach(function (p) {
      commands.push({ id: 'go-' + p[0], label: t(p[1]), hint: t('palette.page'), run: function () { go(p[2]); } });
    });
    commands.push({ id: 'cookies-settings', label: t('foot.settings'), hint: '', run: openCookies });
    commands.push({ id: 'theme', label: t('cmd.theme'), hint: '', run: toggleTheme });
    commands.push({ id: 'lang', label: t('cmd.lang'), hint: '', run: toggleLang });
  }

  function setActive(i) {
    active = i;
    var items = $$('li[role="option"]', list);
    items.forEach(function (li, idx) {
      li.setAttribute('aria-selected', idx === i ? 'true' : 'false');
    });
    if (items[i]) {
      input.setAttribute('aria-activedescendant', items[i].id);
      if (items[i].scrollIntoView) items[i].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function renderPalette() {
    var q = norm(input.value.trim());
    visible = commands.filter(function (c) { return !q || norm(c.label).indexOf(q) !== -1; });
    list.textContent = '';
    if (!visible.length) {
      var empty = document.createElement('li');
      empty.className = 'palette-empty';
      empty.textContent = t('palette.empty');
      list.appendChild(empty);
      input.removeAttribute('aria-activedescendant');
      return;
    }
    if (active >= visible.length) active = 0;
    visible.forEach(function (c, i) {
      var li = document.createElement('li');
      li.id = 'cmd-' + c.id;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', i === active ? 'true' : 'false');
      var a = document.createElement('span');
      a.textContent = c.label;
      li.appendChild(a);
      if (c.hint) {
        var b = document.createElement('span');
        b.className = 'palette-hint';
        b.textContent = c.hint;
        li.appendChild(b);
      }
      li.addEventListener('mousemove', function () { if (active !== i) setActive(i); });
      li.addEventListener('click', function () { runCommand(c); });
      list.appendChild(li);
    });
    setActive(active);
  }

  function openPalette() {
    lastFocus = document.activeElement;
    palette.hidden = false;
    root.classList.add('modal-open');
    input.value = '';
    active = 0;
    renderPalette();
    input.focus();
  }
  function closePalette() {
    if (palette.hidden) return;
    palette.hidden = true;
    root.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function runCommand(c) {
    closePalette();
    c.run();
  }

  input.addEventListener('input', function () { active = 0; renderPalette(); });
  palette.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (visible.length) setActive((active + 1) % visible.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (visible.length) setActive((active - 1 + visible.length) % visible.length); }
    else if (e.key === 'Enter') { e.preventDefault(); if (visible[active]) runCommand(visible[active]); }
    else if (e.key === 'Tab') { e.preventDefault(); }
  });
  palette.addEventListener('click', function (e) {
    if (e.target.hasAttribute && e.target.hasAttribute('data-palette-close')) closePalette();
  });

  $('#open-palette').addEventListener('click', openPalette);
  $$('[data-open-palette]').forEach(function (b) { b.addEventListener('click', openPalette); });

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key && e.key.toLowerCase() === 'k') {
      if ((picker && picker.open) || cookieDlg.open) return;
      e.preventDefault();
      if (palette.hidden) openPalette(); else closePalette();
    }
  });

  var platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  if (/Mac|iPhone|iPad/i.test(platform)) { $('#kbd-hint').textContent = '⌘ K'; }

  /* ---------- Cookies y almacenamiento ---------- */
  var cookieDlg = $('#cookie-dialog');

  function openCookies() {
    root.classList.add('modal-open');
    if (cookieDlg.showModal) cookieDlg.showModal(); else cookieDlg.setAttribute('open', '');
  }
  function closeCookies() {
    if (cookieDlg.close) cookieDlg.close(); else cookieDlg.removeAttribute('open');
    root.classList.remove('modal-open');
  }
  $$('[data-cookie-settings]').forEach(function (b) { b.addEventListener('click', openCookies); });
  $$('[data-cookie-close]').forEach(function (b) { b.addEventListener('click', closeCookies); });
  cookieDlg.addEventListener('click', function (e) { if (e.target === cookieDlg) closeCookies(); });
  cookieDlg.addEventListener('close', function () { root.classList.remove('modal-open'); });
  $('#cookie-clear').addEventListener('click', function () {
    ['cl-theme', 'cl-lang', 'cl-track'].forEach(store.remove);
    track = null;
    applyTheme('dark', false);
    applyLang('es', false);
    closeCookies();
    showToast(t('cookie.cleared'));
  });

  /* ---------- Formularios de cuenta ----------
     Solo diseño: validan en el navegador y no envían ni guardan nada hasta que existan las cuentas. */
  var authForm = $('form[data-auth]');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function ruleError(input) {
    var rule = input.getAttribute('data-rule');
    var v = input.value.trim();
    if (rule === 'email') {
      if (!v) return 'acc.err.email.required';
      return EMAIL_RE.test(v) ? '' : 'acc.err.email.invalid';
    }
    if (rule === 'pw') return input.value ? '' : 'acc.err.pw.required';
    if (rule === 'pwnew') {
      if (!input.value) return 'acc.err.pw.required';
      return input.value.length >= 8 ? '' : 'acc.err.pw.short';
    }
    if (rule === 'terms') return input.checked ? '' : 'acc.err.terms';
    if (rule === 'age') return input.checked ? '' : 'acc.err.age';
    return '';
  }

  function showError(input, key) {
    var el = $('#err-' + input.id);
    if (!el) return;
    if (key) {
      el.setAttribute('data-key', key);
      el.textContent = t(key);
      el.hidden = false;
      input.setAttribute('aria-invalid', 'true');
    } else {
      el.removeAttribute('data-key');
      el.textContent = '';
      el.hidden = true;
      input.removeAttribute('aria-invalid');
    }
  }

  function renderPwToggle(btn) {
    var shown = btn.getAttribute('data-shown') === 'true';
    btn.textContent = t(shown ? 'acc.pw.hide' : 'acc.pw.show');
    btn.setAttribute('aria-label', t(shown ? 'acc.pw.hide.label' : 'acc.pw.show.label'));
  }

  function renderAuthTexts() {
    if (!authForm) return;
    $$('.field-error[data-key]', authForm).forEach(function (el) { el.textContent = t(el.getAttribute('data-key')); });
    $$('[data-toggle-pw]', authForm).forEach(renderPwToggle);
    var note = $('#form-note');
    if (note && note.classList.contains('is-visible')) note.textContent = t('acc.note');
  }

  if (authForm) {
    authForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null;
      $$('[data-rule]', authForm).forEach(function (inp) {
        var k = ruleError(inp);
        showError(inp, k);
        if (k && !first) first = inp;
      });
      var note = $('#form-note');
      if (first) {
        note.classList.remove('is-visible');
        note.textContent = '';
        first.focus();
        return;
      }
      $$('input[type="password"], input[data-pw]', authForm).forEach(function (i) { i.value = ''; });
      note.textContent = t('acc.note');
      note.classList.add('is-visible');
    });

    function recheck(e) {
      var inp = e.target;
      if (inp.getAttribute && inp.getAttribute('data-rule') && inp.hasAttribute('aria-invalid')) {
        showError(inp, ruleError(inp));
      }
    }
    authForm.addEventListener('input', recheck);
    authForm.addEventListener('change', recheck);

    $$('[data-toggle-pw]', authForm).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var inp = document.getElementById(btn.getAttribute('aria-controls'));
        var show = btn.getAttribute('data-shown') !== 'true';
        btn.setAttribute('data-shown', show ? 'true' : 'false');
        inp.type = show ? 'text' : 'password';
        inp.setAttribute('data-pw', '1');
        renderPwToggle(btn);
      });
    });
  }

  /* ---------- Arranque ---------- */
  applyTheme(currentTheme(), false);
  applyLang(lang, false);
})();
