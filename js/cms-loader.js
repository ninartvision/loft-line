/**
 * cms-loader.js – Loft Line CMS Data Loader (Sanity.io Edition)
 * ─────────────────────────────────────────────────────────────
 * Fetches content from Sanity.io CDN API using GROQ queries and
 * renders products + page sections dynamically.
 *
 * Sanity project : 777f2m13
 * Dataset        : production
 * API version    : 2024-01-01
 * ─────────────────────────────────────────────────────────────
 *
 * Usage: include once per page (unchanged from before):
 *   <script src="js/cms-loader.js" data-page="index" defer></script>
 *
 * data-page values:
 *   index | main-furniture | office-furniture |
 *   loft-collection | lighting | decoration
 * ─────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  /* ── Sanity Configuration ────────────────────────────────── */

  var SANITY_PROJECT_ID = '777f2m13';
  var SANITY_DATASET    = 'production';
  var SANITY_API_VER    = '2024-01-01';
  var SANITY_HOST       = 'https://' + SANITY_PROJECT_ID + '.apicdn.sanity.io';

  /* ── Sanity Helpers ──────────────────────────────────────── */

  /**
   * Append Sanity image transformation parameters to a CDN URL.
   * auto=format delivers WebP to supporting browsers automatically.
   *
   * @param {string} url    - Base URL from `image.asset->url` in GROQ
   * @param {{width?: number, height?: number, quality?: number}} [opts]
   * @returns {string}
   */
  function buildImageUrl(url, opts) {
    if (!url) return '';
    var q = [];
    if (opts && opts.width)  q.push('w='  + opts.width);
    if (opts && opts.height) q.push('h='  + opts.height);
    q.push('auto=format');          // delivers WebP to supporting browsers
    q.push('q=' + ((opts && opts.quality) || 85));
    return url + '?' + q.join('&');
  }

  /**
   * Execute a GROQ query against the Sanity CDN API.
   * Public datasets require no authentication token.
   *
   * @param {string} query     - GROQ query string
   * @param {Object} [params]  - Optional query parameters keyed without $
   * @returns {Promise<any|null>}
   */
  function sanityQuery(query, params) {
    var url = SANITY_HOST + '/v' + SANITY_API_VER + '/data/query/' + SANITY_DATASET;
    url += '?query=' + encodeURIComponent(query);
    if (params) {
      Object.keys(params).forEach(function (key) {
        url += '&$' + key + '=' + encodeURIComponent(JSON.stringify(params[key]));
      });
    }
    return fetch(url)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return d ? d.result : null; })
      .catch(function () { return null; });
  }

  /* ── Language Helpers ────────────────────────────────────── */

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

  /* ── Load products from Sanity ───────────────────────────── */

  /*
   * Field names in the GROQ projection match the existing JSON schema
   * exactly, so buildProductCard() and all rendering helpers are unchanged.
   */
  var PRODUCT_PROJECTION = [
    '_id,',
    '"slug": slug.current,',
    'name_ka, name_en,',
    'category, style,',
    'price, old_price,',
    'badge, discount_pct,',
    'description_ka, description_en,',
    'materials_ka, materials_en,',
    '"image": image.asset->url,',
    '"gallery": gallery[].asset->url,',
    'available, featured, page',
  ].join(' ');

  function loadProducts(pageSlug) {
    var groq, params;

    if (pageSlug === 'index') {
      groq   = '*[_type == "product" && available == true && featured == true] | order(_createdAt desc) { ' + PRODUCT_PROJECTION + ' }';
      params = {};
    } else {
      groq   = '*[_type == "product" && available == true && page == $page] | order(_createdAt desc) { ' + PRODUCT_PROJECTION + ' }';
      params = {page: pageSlug};
    }

    return sanityQuery(groq, params).then(function (products) {
      if (!Array.isArray(products) || !products.length) return [];
      return products.map(function (p) {
        // Optimise main image → WebP, max 600 px wide
        if (p.image) p.image = buildImageUrl(p.image, {width: 600});
        // Optimise gallery images → WebP, max 1200 px wide
        if (Array.isArray(p.gallery)) {
          p.gallery = p.gallery.map(function (u) { return buildImageUrl(u, {width: 1200}); });
        }
        return p;
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
      // Apply WebP optimisation on hero background (full-width → 1600 px)
      var heroUrl = buildImageUrl(data.bg_image, {width: 1600, quality: 90});
      heroBg.style.backgroundImage = "url('" + esc(heroUrl) + "')";
    }
  }

  /* ── Homepage GROQ query (hero + announcement in one request) ── */

  var HOMEPAGE_GROQ = [
    '*[_type == "homepage" && _id == "homepage-singleton"][0] {',
    '  "tag_ka":   heroSection.tag_ka,',
    '  "tag_en":   heroSection.tag_en,',
    '  "title_ka": heroSection.title_ka,',
    '  "title_en": heroSection.title_en,',
    '  "desc_ka":  heroSection.desc_ka,',
    '  "desc_en":  heroSection.desc_en,',
    '  "btn1_ka":  heroSection.btn1_ka,',
    '  "btn1_en":  heroSection.btn1_en,',
    '  "btn2_ka":  heroSection.btn2_ka,',
    '  "btn2_en":  heroSection.btn2_en,',
    '  "bg_image": heroSection.bg_image.asset->url,',
    '  "text1_ka": announcementSection.text1_ka,',
    '  "text1_en": announcementSection.text1_en,',
    '  "text2_ka": announcementSection.text2_ka,',
    '  "text2_en": announcementSection.text2_en,',
    '  "visible":  announcementSection.visible',
    '}',
  ].join('');

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

  /* ── Notify other scripts that CMS render is complete ─────── */

  function dispatchReady() {
    document.dispatchEvent(new Event('cms:ready'));
  }

  /* ── Bootstrap ─────────────────────────────────────────────── */

  var _pageSlug = document.currentScript
    ? (document.currentScript.getAttribute('data-page') || 'index')
    : 'index';

  function init() {
    var grid = document.getElementById('productGrid');

    if (grid) {
      loadProducts(_pageSlug).then(function (products) {
        renderProducts(products, grid);
        dispatchReady();
        if (window.loftQuickView && typeof window.loftQuickView.init === 'function') {
          window.loftQuickView.init();
        }
      });
    }

    // Homepage-only: fetch hero + announcement in a single Sanity request
    if (_pageSlug === 'index') {
      sanityQuery(HOMEPAGE_GROQ).then(function (data) {
        applyHero(data);
        applyAnnouncement(data);
      });
    }

    // Category pages: fetch hero title/subtitle from pageContent document
    if (_pageSlug !== 'index') {
      var pageGroq = [
        '*[_type == "pageContent" && pageKey == $page][0] {',
        '  hero_title_ka, hero_title_en,',
        '  hero_sub_ka,   hero_sub_en',
        '}',
      ].join('');
      sanityQuery(pageGroq, {page: _pageSlug}).then(applyCategoryPageHero);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
