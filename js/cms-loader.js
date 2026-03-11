/**
 * cms-loader.js – Loft Line CMS Data Loader
 * ─────────────────────────────────────────────────────────────
 * Fetches JSON content files written by Decap CMS and renders
 * products + page sections dynamically, so editing content in
 * the admin panel immediately changes the website.
 *
 * Works alongside auto-translate.js (loaded after this script).
 * ─────────────────────────────────────────────────────────────
 *
 * Usage: include once per page:
 *   <script src="js/cms-loader.js" data-page="index" defer></script>
 *
 * data-page values:
 *   index | main-furniture | office-furniture |
 *   loft-collection | lighting | decoration
 * ─────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  /* ── Helpers ─────────────────────────────────────────────── */

  function getLang() {
    try { return localStorage.getItem('loftline_lang') || 'ka'; }
    catch (e) { return 'ka'; }
  }

  function t(obj, field) {
    var lang = getLang();
    return (lang === 'en' && obj[field + '_en'] !== undefined)
      ? obj[field + '_en']
      : (obj[field + '_ka'] !== undefined ? obj[field + '_ka'] : obj[field] || '');
  }

  /** Fetch a JSON file; returns a Promise resolving to parsed object or null. */
  function fetchJSON(url) {
    return fetch(url + '?_=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  /** Load all product JSON files for a given page slug. */
  function loadProducts(pageSlug) {
    var productFiles = [
      'industrial-oak-table',
      'park-wooden-chair',
      'ergonomic-work-desk',
      'table-chairs-set',
      'industrial-pendant-light',
      'outdoor-dining-table'
    ];

    return Promise.all(
      productFiles.map(function (slug) {
        return fetchJSON('/content/products/' + slug + '.json');
      })
    ).then(function (products) {
      // Filter out nulls and products not on this page
      return products.filter(function (p) {
        return p && p.available !== false &&
          (pageSlug === 'index'
            ? (p.featured || p.page === 'index' || !p.page)
            : p.page === pageSlug);
      });
    });
  }

  /* ── Product card builder ──────────────────────────────────── */

  function buildBadgeHTML(product) {
    if (!product.badge) return '';
    if (product.badge === 'sale') {
      var pct = product.discount_pct ? ('-' + product.discount_pct + '%') : 'Sale';
      return '<span class="product-badge badge-sale">' + pct + '</span>';
    }
    if (product.badge === 'new') {
      return '<span class="product-badge badge-new">ახალი</span>';
    }
    if (product.badge === 'best') {
      return '<span class="product-badge badge-best">Best</span>';
    }
    return '';
  }

  function buildMaterialDots(product) {
    var mats = getLang() === 'en'
      ? (product.materials_en || product.materials_ka || [])
      : (product.materials_ka || []);

    var dotColors = ['#c8a879', '#2c2c2c', '#d4a574', '#4a4a4a', '#8b6914', '#a0734a'];
    return mats.slice(0, 3).map(function (mat, i) {
      return '<span class="material-dot" style="background:' + dotColors[i % dotColors.length] + ';" title="' + esc(mat) + '"></span>';
    }).join('');
  }

  function buildOldPrice(product) {
    if (!product.old_price || product.old_price <= 0) return '';
    return '<span class="product-old-price">₾' + product.old_price.toLocaleString() + '</span>';
  }

  /** Build a product card article element from a product data object. */
  function buildProductCard(product) {
    var name    = t(product, 'name');
    var desc    = t(product, 'description');
    var article = document.createElement('article');
    article.className  = 'product-card';
    article.setAttribute('data-category', product.category || 'indoor');
    article.setAttribute('data-price',    String(product.price || 0));
    article.setAttribute('data-style',    product.style || 'loft');
    article.setAttribute('data-slug',     product.slug || '');

    article.innerHTML = [
      '<div class="product-image-wrap">',
        buildBadgeHTML(product),
        '<img src="' + esc(product.image || '') + '" alt="' + esc(name) + '" loading="lazy" width="500" height="500">',
        '<button class="product-quick-view" aria-label="სწრაფი ნახვა">',
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
            '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>',
            '<circle cx="12" cy="12" r="3"/>',
          '</svg>',
        '</button>',
      '</div>',
      '<div class="product-info">',
        '<span class="product-category">' + esc(categoryLabel(product.category)) + '</span>',
        '<h3 class="product-name">' + esc(name) + '</h3>',
        '<p class="product-desc">' + esc(desc) + '</p>',
        '<div class="product-footer">',
          '<div class="product-prices">',
            '<span class="product-price">₾' + (product.price || 0).toLocaleString() + '</span>',
            buildOldPrice(product),
          '</div>',
          '<div class="product-materials">',
            buildMaterialDots(product),
          '</div>',
        '</div>',
        '<button class="add-to-cart-btn" aria-label="კალათაში დამატება">',
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
            '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>',
            '<line x1="3" y1="6" x2="21" y2="6"/>',
            '<path d="M16 10a4 4 0 01-8 0"/>',
          '</svg>',
          '<span>კალათაში</span>',
        '</button>',
      '</div>'
    ].join('');

    return article;
  }

  function categoryLabel(val) {
    var lang = getLang();
    var labels = {
      indoor:     { ka: 'შიდა ავეჯი',        en: 'Indoor Furniture' },
      outdoor:    { ka: 'გარე ავეჯი',         en: 'Outdoor Furniture' },
      office:     { ka: 'საოფისე ავეჯი',      en: 'Office Furniture' },
      loft:       { ka: 'ლოფტ კოლექცია',     en: 'Loft Collection' },
      lighting:   { ka: 'განათება',           en: 'Lighting' },
      decoration: { ka: 'დეკორაცია',          en: 'Decoration' }
    };
    var entry = labels[val];
    if (!entry) return val || '';
    return lang === 'en' ? entry.en : entry.ka;
  }

  /** Escape HTML entities to prevent XSS */
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Render products into #productGrid ─────────────────────── */

  function renderProducts(products, grid) {
    if (!grid || !products.length) return;
    // Clear only CMS-generated cards (keep any static ones if present)
    grid.querySelectorAll('[data-cms-card]').forEach(function (el) { el.remove(); });
    // If grid has no static cards, replace all content
    var staticCards = grid.querySelectorAll('.product-card:not([data-cms-card])');
    if (!staticCards.length) {
      grid.innerHTML = '';
    }
    products.forEach(function (product) {
      var card = buildProductCard(product);
      card.setAttribute('data-cms-card', '1');
      grid.appendChild(card);
    });
  }

  /* ── Homepage Hero ──────────────────────────────────────────── */

  function applyHero(data) {
    if (!data) return;
    var lang = getLang();

    var tagEl    = document.querySelector('.hero-tag');
    var titleEl  = document.querySelector('.hero-title');
    var descEl   = document.querySelector('.hero-desc');
    var btn1El   = document.querySelector('.hero-actions .btn-primary');
    var btn2El   = document.querySelector('.hero-actions .btn-outline');
    var heroBg   = document.getElementById('heroBg');

    if (tagEl)   tagEl.textContent   = lang === 'en' ? data.tag_en   : data.tag_ka;
    if (titleEl) titleEl.textContent  = lang === 'en' ? data.title_en : data.title_ka;
    if (descEl)  descEl.textContent   = lang === 'en' ? data.desc_en  : data.desc_ka;
    if (btn1El)  btn1El.textContent   = lang === 'en' ? data.btn1_en  : data.btn1_ka;
    if (btn2El)  btn2El.textContent   = lang === 'en' ? data.btn2_en  : data.btn2_ka;
    if (heroBg && data.bg_image) {
      heroBg.style.backgroundImage = "url('" + esc(data.bg_image) + "')";
    }
  }

  /* ── Announcement Bar ───────────────────────────────────────── */

  function applyAnnouncement(data) {
    if (!data) return;
    var lang    = getLang();
    var bar     = document.querySelector('.announcement-bar');
    var spans   = bar ? bar.querySelectorAll('span[data-translate]') : [];
    if (data.visible === false && bar) { bar.style.display = 'none'; return; }
    if (spans[0]) spans[0].textContent = lang === 'en' ? data.text1_en : data.text1_ka;
    if (spans[1]) spans[1].textContent = lang === 'en' ? data.text2_en : data.text2_ka;
  }

  /* ── Category page hero ─────────────────────────────────────── */

  function applyCategoryPageHero(data) {
    if (!data) return;
    var lang    = getLang();
    var heroH   = document.querySelector('.ll-hero-title, .hero-title');
    var heroSub = document.querySelector('.ll-hero-sub, .hero-desc');
    if (heroH)   heroH.textContent   = lang === 'en' ? data.hero_title_en : data.hero_title_ka;
    if (heroSub) heroSub.textContent = lang === 'en' ? data.hero_sub_en   : data.hero_sub_ka;
  }

  /* ── Re-run when language changes ──────────────────────────── */

  document.addEventListener('loftline:langchange', function () {
    init();
  });

  /* ── Re-initialise Decap CMS quick-view after CMS render ───── */

  function dispatchReady() {
    document.dispatchEvent(new Event('cms:ready'));
  }

  /* ── Bootstrap ─────────────────────────────────────────────── */

  var _pageSlug = document.currentScript
    ? (document.currentScript.getAttribute('data-page') || 'index')
    : 'index';

  function init() {
    var grid = document.getElementById('productGrid');

    // Always load products for pages that have a grid
    if (grid) {
      loadProducts(_pageSlug).then(function (products) {
        renderProducts(products, grid);
        dispatchReady();
        // Re-bind quick-view if the module exposes a rebind hook
        if (window.loftQuickView && typeof window.loftQuickView.init === 'function') {
          window.loftQuickView.init();
        }
      });
    }

    // Homepage-only sections
    if (_pageSlug === 'index') {
      fetchJSON('/content/pages/homepage-hero.json').then(applyHero);
      fetchJSON('/content/pages/announcement.json').then(applyAnnouncement);
    }

    // Category pages
    if (_pageSlug !== 'index') {
      fetchJSON('/content/pages/' + _pageSlug + '.json').then(applyCategoryPageHero);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
