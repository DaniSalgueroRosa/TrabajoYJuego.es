/* =========================================================
   FP Cuenta · compartido/comun.js
   Lo que hacen todas las páginas: modo claro u oscuro, menú móvil, permiso de cookies,
   carga de AdSense y de sus huecos (solo con permiso) y año del pie.
   ========================================================= */
(function () {
  'use strict';

  var CONFIG = window.FP_CONFIG || {};

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* modo privado: se ignora */ }
  }

  // Lo comparten la portada y las calculadoras
  window.FPComun = { storageGet: storageGet, storageSet: storageSet, config: CONFIG };

  /* ---------- Modo claro u oscuro ----------
     La elección se guarda en el navegador. Sin elección, se sigue el modo del dispositivo.
     El atributo data-theme de <html> lo pone antes de pintar el script del <head> (lo escribe gen/construir.py). */
  var THEME_KEY = CONFIG.themeKey || 'fpcuenta-tema-v1';
  var THEME_COLORS = { light: '#f2f5fa', dark: '#0d1530' };   // = --paper de base.css

  function initTheme() {
    var button = document.querySelector('.theme-toggle');
    if (!button) return;
    var root = document.documentElement;
    var query = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    function current() {
      var chosen = root.getAttribute('data-theme');
      if (chosen === 'dark' || chosen === 'light') return chosen;
      return query && query.matches ? 'dark' : 'light';
    }

    function paint() {
      button.setAttribute('aria-pressed', String(current() === 'dark'));
    }

    button.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      storageSet(THEME_KEY, next);
      Array.prototype.forEach.call(document.querySelectorAll('meta[name="theme-color"]'), function (meta) {
        meta.setAttribute('content', THEME_COLORS[next]);
      });
      paint();
    });

    // Si no hay elección y cambia el modo del dispositivo, el botón lo refleja
    if (query) {
      var onChange = function () { paint(); };
      if (query.addEventListener) query.addEventListener('change', onChange);
      else if (query.addListener) query.addListener(onChange);
    }
    paint();
  }


  /* ---------- Menú móvil ---------- */
  function initNav() {
    var button = document.querySelector('.nav-toggle');
    var nav = document.getElementById('menu-principal');
    if (!button || !nav) return;

    function setOpen(open) {
      button.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    }

    button.addEventListener('click', function () {
      setOpen(button.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        button.focus();
      }
    });

    var desktop = window.matchMedia('(min-width: 52em)');
    var onChange = function (e) { if (e.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }


  /* ---------- Cookies y AdSense ----------
     Dos modos (compartido/configuracion.js → consentimiento):
       'propio' → el aviso de esta web pide el permiso y el script de Google solo se carga si se acepta.
       'google' → el permiso lo pide el mensaje de consentimiento de Google (plataforma certificada); el script se
                  carga siempre, porque es el que lo muestra, y esta web no enseña su aviso.
     Sin ID de AdSense no se carga nada de Google en ninguno de los dos modos. */
  var ADS_ID = CONFIG.adsenseClient || '';
  var GOOGLE_CMP = CONFIG.consentimiento === 'google' && !!ADS_ID;

  function loadAdSense() {
    if (!ADS_ID || document.querySelector('script[data-adsense]')) return;
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.setAttribute('data-adsense', '1');
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(ADS_ID);
    document.head.appendChild(s);
    renderAdSlots();
  }

  // Los huecos <aside data-anuncio="nombre" hidden> de las páginas solo se muestran si su bloque está configurado
  function renderAdSlots() {
    var slots = CONFIG.adsenseSlots || {};
    Array.prototype.forEach.call(document.querySelectorAll('[data-anuncio]'), function (box) {
      var slot = String(slots[box.getAttribute('data-anuncio')] || '');
      var hole = box.querySelector('.anuncio-hueco');
      if (!/^\d{6,20}$/.test(slot) || !hole || hole.firstChild) return;
      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', ADS_ID);
      ins.setAttribute('data-ad-slot', slot);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      hole.appendChild(ins);
      box.hidden = false;
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* sin anuncio */ }
    });
  }

  // Vuelve a enseñar el mensaje de consentimiento de Google (hace falta para poder retirar el permiso)
  function showGoogleMessage() {
    window.googlefc = window.googlefc || {};
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
    window.googlefc.callbackQueue.push({
      CONSENT_DATA_READY: function () { window.googlefc.showRevocationMessage(); }
    });
  }

  function initCookies() {
    var openers = document.querySelectorAll('[data-open-cookies]');

    if (GOOGLE_CMP) {
      Array.prototype.forEach.call(openers, function (el) {
        el.addEventListener('click', showGoogleMessage);
      });
      loadAdSense();
      return;
    }

    var banner = document.getElementById('cookie-banner');
    if (!banner) return;

    function readConsent() {
      var raw = storageGet(CONFIG.consentKey);
      if (!raw) return null;
      try {
        var data = JSON.parse(raw);
        return data && typeof data.ads === 'boolean' ? data : null;
      } catch (e) { return null; }
    }

    function showBanner() {
      banner.hidden = false;
      var first = banner.querySelector('button');
      if (first) first.focus();
    }

    function decide(ads) {
      var previous = readConsent();
      storageSet(CONFIG.consentKey, JSON.stringify({ ads: ads, date: new Date().toISOString() }));
      banner.hidden = true;
      if (ads) {
        loadAdSense();
      } else if (previous && previous.ads) {
        // Un script ya cargado no se puede descargar: se recarga la página sin él
        window.location.reload();
      }
    }

    banner.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-consent]');
      if (!btn) return;
      decide(btn.getAttribute('data-consent') === 'accept');
    });

    Array.prototype.forEach.call(openers, function (el) {
      el.addEventListener('click', showBanner);
    });

    var consent = readConsent();
    if (!consent) {
      banner.hidden = false; // primera visita: se muestra sin robar el foco
    } else if (consent.ads) {
      loadAdSense();
    }
  }


  /* ---------- Año del pie ---------- */
  function initYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }


  /* ---------- Arranque ---------- */
  function init() {
    initTheme();
    initNav();
    initCookies();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
