/**
 * Loft Line – Auto Translate
 * ─────────────────────────────────────────────────────────────
 * Mark any visible element whose text is written in Georgian:
 *
 *   <h1 data-translate>ქართული ტექსტი</h1>
 *   <input data-translate placeholder="ქართული placeholder">
 *
 * The script builds a Georgian → English reverse map from
 * translations.js and applies it when the user selects English.
 * The selected language is persisted in localStorage.
 *
 * Updating Georgian text in the HTML + translations.js
 * automatically updates the English – no additional edits needed.
 *
 * Requires: js/translations.js loaded before this file.
 * ─────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  /* ── Config ───────────────────────────────────────────────── */
  var STORAGE_KEY  = 'loftline_lang';
  var DEFAULT_LANG = 'ka';

  /* ── Build Georgian → English reverse map ─────────────────── *
   * Iterates every key in translations.ka, normalises the value  *
   * (collapses whitespace) and uses it as the lookup key.        */
  var geoToEn = (function () {
    var map = {};
    if (typeof translations === 'undefined') return map;
    var ka = translations.ka;
    var en = translations.en;
    Object.keys(ka).forEach(function (k) {
      if (ka[k] !== undefined && en[k] !== undefined) {
        map[_norm(String(ka[k]))] = en[k];
      }
    });
    return map;
  }());

  /* ── Normalise whitespace (leaves HTML tags / entities intact) */
  function _norm(s) {
    return s.replace(/[ \t\r\n]+/g, ' ').trim();
  }

  /* ── localStorage helpers ─────────────────────────────────── */
  function getLang() {
    try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG; }
    catch (e) { return DEFAULT_LANG; }
  }
  function saveLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  /* ── Store original Georgian content ──────────────────────── *
   * Called once on init; saves innerHTML / placeholder so KA    *
   * can always be perfectly restored.                           */
  function storeOriginals() {
    document.querySelectorAll('[data-translate]').forEach(function (el) {
      if (!el.hasAttribute('data-geo')) {
        el.setAttribute('data-geo', el.innerHTML);
      }
      if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') &&
          !el.hasAttribute('data-geo-ph')) {
        el.setAttribute('data-geo-ph', el.getAttribute('placeholder') || '');
      }
    });
  }

  /* ── Apply language to all [data-translate] elements ─────── */
  function applyLang(lang) {

    document.querySelectorAll('[data-translate]').forEach(function (el) {
      /* capture originals for any element missed by storeOriginals */
      var geo = el.getAttribute('data-geo') || el.innerHTML;
      if (!el.hasAttribute('data-geo')) el.setAttribute('data-geo', geo);

      var isInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';

      if (!isInput) {
        /* regular element – swap innerHTML */
        if (lang === 'en') {
          var translated = geoToEn[_norm(geo)];
          if (translated !== undefined) el.innerHTML = translated;
        } else {
          el.innerHTML = geo;
        }
      } else {
        /* input / textarea – swap placeholder */
        var geoPh = el.getAttribute('data-geo-ph') ||
                    el.getAttribute('placeholder') || '';
        if (!el.hasAttribute('data-geo-ph')) {
          el.setAttribute('data-geo-ph', geoPh);
        }
        if (lang === 'en') {
          var enPh = geoToEn[_norm(geoPh)];
          if (enPh !== undefined) el.setAttribute('placeholder', enPh);
        } else {
          el.setAttribute('placeholder', geoPh);
        }
      }
    });

    /* ── Repeated per-product elements (selector-based) ──────── *
     * Product cards are cloned dynamically; no data-translate    *
     * needed on every card – handled here by CSS selector.       */
    var t = (typeof translations !== 'undefined') && translations[lang];
    if (t) {
      var selectorMap = {
        '.add-to-cart-btn span':    'btn_add_cart',
        '.btn-order':               'btn_order',
        '.product-badge.badge-new': 'badge_new',
        '.ll-badge.ll-badge-new':   'badge_new'
      };
      Object.keys(selectorMap).forEach(function (sel) {
        var val = t[selectorMap[sel]];
        if (val !== undefined) {
          document.querySelectorAll(sel).forEach(function (node) {
            node.textContent = val;
          });
        }
      });
    }

    /* ── Sync <html lang> attribute ───────────────────────────── */
    document.documentElement.lang = lang;

    /* ── Update KA | EN button appearance ────────────────────── */
    _updateButtons(lang);
  }

  /* ── Highlight active language in KA | EN toggle ─────────── */
  function _updateButtons(lang) {
    document.querySelectorAll('.lang-btn, .ll-lang-btn').forEach(function (btn) {
      var ka = btn.querySelector('.lang-ka');
      var en = btn.querySelector('.lang-en');
      if (!ka || !en) return;
      if (lang === 'ka') {
        ka.classList.add('lang-active');
        en.classList.remove('lang-active');
      } else {
        en.classList.add('lang-active');
        ka.classList.remove('lang-active');
      }
    });
  }

  /* ── Attach click handlers to KA | EN toggle buttons ─────── */
  function _bindButtons() {
    document.querySelectorAll('.lang-btn, .ll-lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = getLang() === 'ka' ? 'en' : 'ka';
        saveLang(next);
        applyLang(next);
      });
    });
  }

  /* ── Public API ───────────────────────────────────────────── */
  window.loftLang = {
    get: getLang,
    set: function (lang) { saveLang(lang); applyLang(lang); }
  };

  /* ── Bootstrap ────────────────────────────────────────────── */
  function init() {
    storeOriginals();
    applyLang(getLang());
    _bindButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
