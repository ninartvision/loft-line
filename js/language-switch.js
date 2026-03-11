/**
 * Loft Line – Language Switcher
 * Detects, stores and applies KA / EN translations site-wide.
 * Depends on: js/translations.js (must be loaded first)
 */
(function () {
  'use strict';

  var DEFAULT_LANG = 'ka';
  var STORAGE_KEY  = 'loftline_lang';

  /* ── helpers ─────────────────────────────────────────────── */
  function getLang() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  }

  function saveLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
  }

  /* ── core translation engine ─────────────────────────────── */
  function applyTranslations(lang) {
    var t = (typeof translations !== 'undefined') && translations[lang];
    if (!t) return;

    /* 1. data-i18n → innerHTML */
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) {
        el.innerHTML = t[key];
      }
    });

    /* 2. data-i18n-placeholder → input placeholder */
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (t[key] !== undefined) {
        el.placeholder = t[key];
      }
    });

    /* 3. data-i18n-aria → aria-label */
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (t[key] !== undefined) {
        el.setAttribute('aria-label', t[key]);
      }
    });

    /* 4. Selector-based translations for repeated per-product elements
          (avoids needing data-i18n on every single product card) */
    var selectorMap = {
      '.add-to-cart-btn span':    'btn_add_cart',
      '.btn-order':               'btn_order',
      '.product-badge.badge-new': 'badge_new',
      '.ll-badge.ll-badge-new':   'badge_new',
    };
    Object.keys(selectorMap).forEach(function (selector) {
      var key = selectorMap[selector];
      if (t[key] !== undefined) {
        document.querySelectorAll(selector).forEach(function (el) {
          el.textContent = t[key];
        });
      }
    });

    /* 5. Update <html lang=""> */
    document.documentElement.lang = lang;
  }

  /* ── button active-state ─────────────────────────────────── */
  function updateButtons(lang) {
    document.querySelectorAll('.lang-btn, .ll-lang-btn').forEach(function (btn) {
      var ka = btn.querySelector('.lang-ka');
      var en = btn.querySelector('.lang-en');
      if (ka && en) {
        if (lang === 'ka') {
          ka.classList.add('lang-active');
          en.classList.remove('lang-active');
        } else {
          en.classList.add('lang-active');
          ka.classList.remove('lang-active');
        }
      }
    });
  }

  /* ── public setter (called on toggle click) ──────────────── */
  function setLang(lang) {
    saveLang(lang);
    applyTranslations(lang);
    updateButtons(lang);
  }

  /* ── bind click handlers ─────────────────────────────────── */
  function bindButtons() {
    document.querySelectorAll('.lang-btn, .ll-lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = getLang() === 'ka' ? 'en' : 'ka';
        setLang(next);
      });
    });
  }

  /* ── initialise ──────────────────────────────────────────── */
  function init() {
    var lang = getLang();
    applyTranslations(lang);
    updateButtons(lang);
    bindButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
