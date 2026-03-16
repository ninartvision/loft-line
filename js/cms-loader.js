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

    /* Store all product images so the quick-view gallery can display them */
    var _imgs = [product.image]
      .concat(Array.isArray(product.gallery) ? product.gallery : [])
      .filter(Boolean);
    if (_imgs.length) article.setAttribute('data-gallery', JSON.stringify(_imgs));

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
      outdoor:    { ka: 'მთავარი ავეჯი',     en: 'Main Furniture' },
      office:     { ka: 'საოფისე ავეჯი',      en: 'Office Furniture' },
      loft:       { ka: 'ლითონის ნაკეთობა',     en: 'Metal Works' },
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

  /* ── Loft-line product card builder (System A pages) ───────── */

  function buildLoftCard(product) {
    var name    = t(product, 'name');
    var matArr  = getLang() === 'en' ? (product.materials_en || product.materials_ka || []) : (product.materials_ka || []);
    var matStr  = Array.isArray(matArr) ? matArr.join(' & ') : String(matArr || '');

    var badgeHtml = '';
    if (product.badge === 'new') {
      badgeHtml = '<span class="ll-badge ll-badge-new">ახალი</span>';
    } else if (product.badge === 'sale') {
      var pct = product.discount_pct ? ('-' + product.discount_pct + '%') : 'Sale';
      badgeHtml = '<span class="ll-badge ll-badge-sale">' + pct + '</span>';
    }

    var oldPriceHtml = (product.old_price && product.old_price > 0)
      ? '<span class="ll-prod-old-price">₾' + product.old_price.toLocaleString() + '</span>'
      : '';

    var waSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">'
      + '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>'
      + '<path d="M11.975 0C5.361 0 0 5.359 0 11.975c0 2.094.549 4.062 1.508 5.773L.055 23.455a.477.477 0 0 0 .574.603l5.898-1.543C8.163 23.43 10.047 24 11.975 24 18.589 24 24 18.641 24 12.025 24 5.41 18.589 0 11.975 0zm0 21.897c-1.84 0-3.596-.502-5.109-1.451l-.365-.217-3.783.99 1.008-3.666-.239-.378A9.916 9.916 0 0 1 2.079 12.025c0-5.463 4.44-9.901 9.896-9.901 5.456 0 9.896 4.438 9.896 9.901 0 5.462-4.44 9.872-9.896 9.872z"/>'
      + '</svg>';

    var article = document.createElement('article');
    article.className = 'll-product-card';
    article.setAttribute('data-category', product.category || 'loft');
    article.setAttribute('data-price',    String(product.price || 0));
    article.setAttribute('data-style',    product.style || 'loft');
    article.setAttribute('data-slug',     product.slug || '');

    var _imgs = [product.image]
      .concat(Array.isArray(product.gallery) ? product.gallery : [])
      .filter(Boolean);
    if (_imgs.length) article.setAttribute('data-gallery', JSON.stringify(_imgs));

    article.innerHTML = [
      '<div class="ll-prod-img-wrap">',
        badgeHtml,
        '<img src="' + esc(product.image || '') + '" alt="' + esc(name) + '" loading="lazy">',
        '<button class="ll-quick-view" aria-label="სწრაფი ნახვა">',
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
            '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>',
            '<circle cx="12" cy="12" r="3"/>',
          '</svg>',
        '</button>',
      '</div>',
      '<div class="ll-prod-body">',
        '<span class="ll-prod-cat">' + esc(categoryLabel(product.category)) + '</span>',
        '<h3 class="ll-prod-name">' + esc(name) + '</h3>',
        '<p class="ll-prod-material">' + esc(matStr) + '</p>',
        '<div class="ll-prod-footer"><div>',
          '<span class="ll-prod-price">₾' + (product.price || 0).toLocaleString() + '</span>',
          oldPriceHtml,
        '</div></div>',
        '<div class="ll-prod-actions">',
          '<button class="btn-order">შეკვეთა</button>',
          '<button class="btn-wa" aria-label="WhatsApp">' + waSvg + '</button>',
        '</div>',
      '</div>'
    ].join('');

    return article;
  }

  /* ── Render products into the product grid ──────────────────── */

  /**
   * @param {Array}    products    - Product objects from Sanity
   * @param {Element}  grid        - The grid container element
   * @param {Function} cardBuilder - buildProductCard | buildLoftCard
   */
  function renderProducts(products, grid, cardBuilder) {
    if (!grid) return;
    // Always clear the template card — even when Sanity returns nothing
    grid.innerHTML = '';
    // Always update the count badge, including the 0-products case
    var countEl = document.getElementById('ll-catalog-count') || document.getElementById('filterCount');
    if (countEl) countEl.textContent = products.length + ' პროდუქტი';
    if (!products.length) return;
    /* Batch all card insertions in one DOM operation to avoid layout thrash */
    var frag = document.createDocumentFragment();
    products.forEach(function (product) {
      var card = cardBuilder(product);
      card.setAttribute('data-cms-card', '1');
      frag.appendChild(card);
    });
    grid.appendChild(frag); // single reflow for the entire product list
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

  // Capture the script element now (currentScript is null after defer in some browsers)
  var _thisScript = document.currentScript || document.querySelector('script[src*="cms-loader"]');
  var _pageSlug   = _thisScript ? (_thisScript.getAttribute('data-page') || 'index') : 'index';
  // Incremented on every init() call; lets async callbacks detect stale responses
  var _renderGen  = 0;

  function init() {
    var gen = ++_renderGen; // capture this render's generation token

    // System B (index.html) uses id="productGrid"; System A pages use id="sanity-product-grid"
    var grid        = document.getElementById('productGrid') || document.getElementById('sanity-product-grid');
    var cardBuilder = document.getElementById('sanity-product-grid') ? buildLoftCard : buildProductCard;

    if (grid) {
      loadProducts(_pageSlug).then(function (products) {
        if (gen !== _renderGen) return; // stale — a newer render is already in flight
        renderProducts(products, grid, cardBuilder);
        dispatchReady(); // fires cms:ready → quick-view.js re-wires click triggers once
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
