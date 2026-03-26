/**
 * cms-loader.js – Loft Line CMS Data Loader (Sanity.io Edition)
 * ─────────────────────────────────────────────────────────────
 * Fetches content from Sanity.io CDN API using GROQ queries and
 * renders products + page sections dynamically.
 *
 * Sanity project : 4n3g4zv5
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

  var SANITY_PROJECT_ID = '4n3g4zv5';
  var SANITY_DATASET    = 'production';
  var SANITY_API_VER    = '2024-01-01';
  var SANITY_HOST       = 'https://' + SANITY_PROJECT_ID + '.apicdn.sanity.io';
  var QUERY_CACHE       = Object.create(null);

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
    var cacheKey = JSON.stringify([query, params || {}]);
    if (QUERY_CACHE[cacheKey]) {
      return Promise.resolve(QUERY_CACHE[cacheKey]);
    }

    var url = SANITY_HOST + '/v' + SANITY_API_VER + '/data/query/' + SANITY_DATASET;
    url += '?query=' + encodeURIComponent(query);
    if (params) {
      Object.keys(params).forEach(function (key) {
        url += '&$' + key + '=' + encodeURIComponent(JSON.stringify(params[key]));
      });
    }
    return fetch(url, {cache: 'default'})
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' for Sanity request');
        return r.json();
      })
      .then(function (d) {
        var result = d ? d.result : null;
        var payload = {ok: true, result: result, error: null};
        QUERY_CACHE[cacheKey] = payload;
        return payload;
      })
      .catch(function (err) {
        return {ok: false, result: null, error: err};
      });
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

  function text(ka, en) {
    return getLang() === 'en' ? en : ka;
  }

  function translate(key) {
    var lang = getLang();
    var table = typeof translations !== 'undefined' ? translations[lang] : null;
    return table && table[key] !== undefined ? table[key] : '';
  }

  function makeFilterKey(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  var CATEGORY_FALLBACK_LIBRARY = {
    tables: {title_ka: 'მაგიდები', title_en: 'Tables', iconKey: 'tables'},
    chairs: {title_ka: 'სკამები', title_en: 'Chairs', iconKey: 'chairs'},
    'office-tables': {title_ka: 'საოფისე მაგიდები', title_en: 'Office Tables', iconKey: 'office-tables'},
    cabinets: {title_ka: 'კარადები', title_en: 'Cabinets', iconKey: 'cabinets'},
    shelves: {title_ka: 'თაროები', title_en: 'Shelves', iconKey: 'shelves'},
    lighting: {title_ka: 'განათება', title_en: 'Lighting', iconKey: 'lighting'},
    decoration: {title_ka: 'დეკორაცია', title_en: 'Decoration', iconKey: 'decoration'},
    'metal-works': {title_ka: 'ლითონის ნაკეთობა', title_en: 'Metal Works', iconKey: 'metal-works'},
    wood: {title_ka: 'ხის ავეჯი', title_en: 'Wood Furniture', iconKey: 'wood'},
    metal: {title_ka: 'ლითონის ავეჯი', title_en: 'Metal Furniture', iconKey: 'metal'}
  };

  var PAGE_FALLBACK_KEYS = {
    index: ['tables', 'chairs', 'office-tables', 'cabinets', 'shelves'],
    'main-furniture': ['tables', 'chairs', 'cabinets', 'shelves'],
    'office-furniture': ['office-tables', 'cabinets', 'shelves'],
    'loft-collection': ['metal-works', 'shelves'],
    lighting: ['lighting'],
    decoration: ['decoration', 'shelves']
  };

  function humanizeFilterKey(value) {
    return String(value || '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, function (char) { return char.toUpperCase(); });
  }

  function normalizeCategory(category) {
    if (!category) return null;

    var titleKa = category.title_ka || category.title_en || '';
    var titleEn = category.title_en || category.title_ka || '';
    var rawKey = category.filterKey || category.slug || titleEn || titleKa || category._id;
    var filterKey = makeFilterKey(rawKey);
    var fallback = CATEGORY_FALLBACK_LIBRARY[filterKey] || null;

    if (!titleKa && fallback) titleKa = fallback.title_ka;
    if (!titleEn && fallback) titleEn = fallback.title_en;
    if (!titleEn) titleEn = humanizeFilterKey(filterKey);
    if (!titleKa) titleKa = titleEn;

    return {
      _id: category._id || '',
      title_ka: titleKa,
      title_en: titleEn,
      filterKey: filterKey,
      pageKey: category.pageKey || '',
      slug: category.slug || '',
      image: category.image || category.icon || '',
      iconKey: category.iconKey || (fallback && fallback.iconKey) || filterKey
    };
  }

  function dedupeCategories(categories) {
    var seen = Object.create(null);
    return categories.filter(function (category) {
      if (!category || !category.filterKey || seen[category.filterKey]) return false;
      seen[category.filterKey] = true;
      return true;
    });
  }

  function deriveCategoriesFromProducts(products) {
    if (!Array.isArray(products) || !products.length) return [];

    var derived = [];

    products.forEach(function (product) {
      var keys = filterValues(product);
      if (!keys.length && product.category_filter) {
        keys = [product.category_filter];
      }

      keys.forEach(function (key) {
        var normalizedKey = makeFilterKey(key);
        if (!normalizedKey) return;

        derived.push(normalizeCategory({
          _id: 'derived-' + normalizedKey,
          filterKey: normalizedKey,
          title_ka: product.category_ka || '',
          title_en: product.category_en || '',
          pageKey: product.page || '',
          iconKey: normalizedKey
        }));
      });
    });

    return dedupeCategories(derived.filter(Boolean));
  }

  function defaultCategoriesForPage(pageSlug) {
    var keys = PAGE_FALLBACK_KEYS[pageSlug] || PAGE_FALLBACK_KEYS.index;
    return dedupeCategories(keys.map(function (key) {
      var category = CATEGORY_FALLBACK_LIBRARY[key] || {title_ka: key, title_en: humanizeFilterKey(key), iconKey: key};
      return normalizeCategory({
        _id: 'fallback-' + key,
        filterKey: key,
        title_ka: category.title_ka,
        title_en: category.title_en,
        iconKey: category.iconKey
      });
    }).filter(Boolean));
  }

  function resolveCategories(categories, products, pageSlug) {
    var normalized = dedupeCategories((categories || []).map(normalizeCategory).filter(Boolean));
    if (normalized.length) return normalized;

    var derived = deriveCategoriesFromProducts(products);
    if (derived.length) return derived;

    return defaultCategoriesForPage(pageSlug);
  }

  /* ── Load products from Sanity ───────────────────────────── */

  /*
   * Field names in the GROQ projection match the existing JSON schema
   * exactly, so buildProductCard() and all rendering helpers are unchanged.
   */
  var PRODUCT_PROJECTION = [
    '_id,',
    '_createdAt,',
    '"slug": slug.current,',
    // Alias name_ka/name_en → title_ka/title_en so t(product, "title") works
    '"title_ka": name_ka,',
    '"title_en": name_en,',
    // Resolve category reference to its display names
    '"category_ka": category->title_ka, "category_en": category->title, "category_filter": category->filterKey,',
    'filterTags, style,',
    'price,',
    // Alias old_price → oldPrice
    '"oldPrice": old_price,',
    'badge, discount_pct,',
    'description_ka, description_en,',
    'materials_ka, materials_en,',
    // Support both the current gallery-based data and the schema main image field.
    '"image": coalesce(gallery[0].asset->url, image.asset->url),',
    '"gallery": gallery[].asset->url,',
    'available, featured, page',
  ].join(' ');

  function loadProducts(pageSlug) {
    var groq, params;

    if (pageSlug === 'index') {
      groq = '*[_type == "product" && coalesce(available, true) == true] | order(_createdAt desc) { ' + PRODUCT_PROJECTION + ' }';
      params = {};
      return sanityQuery(groq, params).then(function (response) {
        return {
          items: response.ok ? processProducts(response.result) : [],
          error: response.ok ? null : response.error
        };
      });
    }

    // Primary query: match by `page` field (exact schema value)
    groq   = '*[_type == "product" && coalesce(available, true) == true && page == $page] | order(_createdAt desc) { ' + PRODUCT_PROJECTION + ' }';  // coalesce handles null available field
    params = {page: pageSlug};

    return sanityQuery(groq, params).then(function (response) {
      var products = response.ok ? response.result : null;
      if (Array.isArray(products) && products.length) {
        return {items: processProducts(products), error: null};
      }

      if (!response.ok) {
        return {items: [], error: response.error};
      }

      // Fallback: if product.page is missing, derive membership from the referenced category.
      var fallbackGroq = '*[_type == "product" && coalesce(available, true) == true && category->pageKey == $page] | order(_createdAt desc) { ' + PRODUCT_PROJECTION + ' }';  // coalesce handles null available field
      return sanityQuery(fallbackGroq, {page: pageSlug}).then(function (fallbackResponse) {
        var fallback = fallbackResponse.ok ? fallbackResponse.result : null;
        if (Array.isArray(fallback) && fallback.length) {
          return {items: processProducts(fallback), error: null};
        }

        if (!fallbackResponse.ok) {
          return {items: [], error: fallbackResponse.error};
        }

        // No broad fallback here: if page/category mapping is missing, keep the
        // result empty so the UI renders the existing "No products found" state.
        return {items: [], error: null};
      });
    });
  }

  var PLACEHOLDER_IMG = 'images/placeholder.svg';

  /**
   * Normalise every product document into a guaranteed-safe shape.
   * Card builders MUST receive products through this function.
   * All defaults live here — no need for || fallbacks in UI code.
   */
  function processProducts(products) {
    if (!Array.isArray(products) || !products.length) return [];
    return products.map(function (item) {
      var p = Object.assign({}, item);

      // ── Image ────────────────────────────────────────────────────
      // Always resolves to a non-empty string; <img src> will never be blank.
      p.image = p.image
        ? buildImageUrl(p.image, {width: 600})
        : PLACEHOLDER_IMG;

      // ── Gallery ──────────────────────────────────────────────────
      p.gallery = Array.isArray(p.gallery)
        ? p.gallery.map(function (u) { return u ? buildImageUrl(u, {width: 1200}) : PLACEHOLDER_IMG; })
        : [];

      // ── Numeric fields ───────────────────────────────────────────
      // parseFloat handles strings like "890"; || 0 catches NaN/null/undefined.
      p.price    = (typeof p.price    === 'number' ? p.price    : parseFloat(p.price))    || 0;
      p.oldPrice = (typeof p.oldPrice === 'number' ? p.oldPrice : parseFloat(p.oldPrice)) || 0;

      // ── String fields ─────────────────────────────────────────────
      // Cross-fill so t(product,'title') always finds at least one language.
      p.title_ka = p.title_ka || p.title_en || '';
      p.title_en = p.title_en || p.title_ka || '';
      // slug may arrive as object {_type:'slug',current:'...'} on some paths.
      p.slug     = (typeof p.slug === 'string' ? p.slug : (p.slug && p.slug.current)) || '';
      p.style    = p.style || 'loft';
      p.badge    = p.badge || '';
      p.category_ka = p.category_ka || p.category_en || '';
      p.category_en = p.category_en || p.category_ka || '';

      // ── Array fields ──────────────────────────────────────────────
      p.filterTags   = Array.isArray(p.filterTags) && p.filterTags.length
        ? p.filterTags.filter(Boolean)
        : (p.category_filter ? [p.category_filter] : []);
      p.materials_ka = Array.isArray(p.materials_ka) ? p.materials_ka : [];
      p.materials_en = Array.isArray(p.materials_en) ? p.materials_en : [];

      return p;
    });
  }

  function buildBadgeHTML(product) {
    if (!product.badge) return '';
    if (product.badge === 'sale') {
      var pct = product.discount_pct ? ('-' + product.discount_pct + '%') : translate('badge_sale_word');
      return '<span class="product-badge badge-sale">' + pct + '</span>';
    }
    if (product.badge === 'new') {
      return '<span class="product-badge badge-new">' + translate('badge_new') + '</span>';
    }
    if (product.badge === 'best') {
      return '<span class="product-badge badge-best">' + translate('badge_best') + '</span>';
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
    if (!product.oldPrice || product.oldPrice <= 0) return '';
    return '<span class="product-old-price">₾' + product.oldPrice.toLocaleString() + '</span>';
  }

  /** Build a product card article element from a product data object. */
  function buildProductCard(product) {
    var name    = t(product, 'title');
    var desc    = t(product, 'description');
    var article = document.createElement('article');
    article.className  = 'product-card';
    article.setAttribute('data-category', filterValues(product).join(' '));
    article.setAttribute('data-price',    String(product.price));
    article.setAttribute('data-style',    product.style);
    article.setAttribute('data-slug',     product.slug);

    /* Store all product images so the quick-view gallery can display them */
    var _imgs = [product.image]
      .concat(Array.isArray(product.gallery) ? product.gallery : [])
      .filter(Boolean);
    if (_imgs.length) article.setAttribute('data-gallery', JSON.stringify(_imgs));

    article.innerHTML = [
      '<div class="product-image-wrap">',
        buildBadgeHTML(product),
        '<img src="' + esc(product.image) + '" alt="' + esc(name) + '" loading="lazy" width="500" height="500">',
        '<button class="product-quick-view" aria-label="' + esc(translate('aria_quick_view')) + '">',
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
            '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>',
            '<circle cx="12" cy="12" r="3"/>',
          '</svg>',
        '</button>',
      '</div>',
      '<div class="product-info">',
        '<span class="product-category">' + esc(categoryLabel(product)) + '</span>',
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
        '<button class="add-to-cart-btn" aria-label="' + esc(translate('aria_add_to_cart')) + '">',
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
            '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>',
            '<line x1="3" y1="6" x2="21" y2="6"/>',
            '<path d="M16 10a4 4 0 01-8 0"/>',
          '</svg>',
          '<span>' + esc(translate('btn_add_cart')) + '</span>',
        '</button>',
      '</div>'
    ].join('');

    return article;
  }

  // categoryLabel now reads the names resolved directly from Sanity
  // (category->title_ka / category->title) so no local mapping is needed.
  function categoryLabel(product) {
    var lang = getLang();
    return (lang === 'en' ? product.category_en : product.category_ka) || '';
  }

  // Keep exact Sanity filter keys end-to-end.
  function filterValues(product) {
    return Array.isArray(product.filterTags) ? product.filterTags.filter(Boolean) : [];
  }

  var CATEGORY_PROJECTION = [
    '_id,',
    '"title_en": title,',
    'title_ka,',
    'filterKey,',
    'pageKey,',
    'sortOrder,',
    '"slug": slug.current,',
    '"image": image.asset->url'
  ].join(' ');

  function loadCategories(pageSlug) {
    var groq;
    var fallbackGroq;
    var params = {};

    if (!pageSlug) return Promise.resolve({items: [], error: null});

    if (pageSlug === 'index') {
      groq = '*[_type == "category" && count(*[_type == "product" && coalesce(available, true) == true && references(^._id)]) > 0] | order(coalesce(sortOrder, 9999) asc, coalesce(title_ka, title) asc) { ' + CATEGORY_PROJECTION + ' }';
      fallbackGroq = '*[_type == "category" && _id in *[_type == "product" && coalesce(available, true) == true && defined(category._ref)].category._ref] | order(coalesce(sortOrder, 9999) asc, coalesce(title_ka, title) asc) { ' + CATEGORY_PROJECTION + ' }';
    } else {
      groq = '*[_type == "category" && pageKey == $page] | order(coalesce(sortOrder, 9999) asc, coalesce(title_ka, title) asc) { ' + CATEGORY_PROJECTION + ' }';
      fallbackGroq = '*[_type == "category" && _id in *[_type == "product" && coalesce(available, true) == true && page == $page && defined(category._ref)].category._ref] | order(coalesce(sortOrder, 9999) asc, coalesce(title_ka, title) asc) { ' + CATEGORY_PROJECTION + ' }';
      params.page = pageSlug;
    }

    return sanityQuery(groq, params).then(function (response) {
      var items = response.ok ? processCategories(response.result) : [];
      if (items.length || !fallbackGroq) {
        return {
          items: items,
          error: response.ok ? null : response.error
        };
      }

      return sanityQuery(fallbackGroq, params).then(function (fallbackResponse) {
        return {
          items: fallbackResponse.ok ? processCategories(fallbackResponse.result) : [],
          error: fallbackResponse.ok ? null : fallbackResponse.error
        };
      });
    }).catch(function (err) {
      return {
        items: [],
        error: err
      };
    });
  }

  function processCategories(categories) {
    if (!Array.isArray(categories) || !categories.length) return [];
    return dedupeCategories(categories.map(normalizeCategory).filter(Boolean));
  }

  function filterButtonIcon(iconKey, isAll) {
    if (isAll) {
      return [
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
          '<rect x="3" y="3" width="7" height="7" rx="1.5"/>',
          '<rect x="14" y="3" width="7" height="7" rx="1.5"/>',
          '<rect x="3" y="14" width="7" height="7" rx="1.5"/>',
          '<rect x="14" y="14" width="7" height="7" rx="1.5"/>',
        '</svg>'
      ].join('');
    }

    switch (iconKey) {
      case 'tables':
      case 'office-tables':
        return [
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
            '<path d="M4 8h16"/>',
            '<path d="M6 8v8"/>',
            '<path d="M18 8v8"/>',
            '<path d="M4 16h16"/>',
          '</svg>'
        ].join('');
      case 'chairs':
        return [
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
            '<path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
            '<path d="M7 11h10v4H7z"/>',
            '<path d="M8 15v3"/>',
            '<path d="M16 15v3"/>',
          '</svg>'
        ].join('');
      case 'cabinets':
        return [
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
            '<rect x="5" y="4" width="14" height="16" rx="1.5"/>',
            '<path d="M12 4v16"/>',
            '<circle cx="10" cy="12" r="0.8" fill="currentColor" stroke="none"/>',
            '<circle cx="14" cy="12" r="0.8" fill="currentColor" stroke="none"/>',
          '</svg>'
        ].join('');
      case 'shelves':
        return [
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
            '<path d="M5 6h14"/>',
            '<path d="M5 12h14"/>',
            '<path d="M5 18h14"/>',
            '<path d="M7 6v12"/>',
            '<path d="M17 6v12"/>',
          '</svg>'
        ].join('');
      case 'lighting':
        return [
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
            '<path d="M12 3v3"/>',
            '<path d="M8 10a4 4 0 1 1 8 0c0 1.6-.8 2.6-1.8 3.8-.7.8-1.2 1.6-1.2 2.7"/>',
            '<path d="M10 20h4"/>',
            '<path d="M10.5 17h3"/>',
          '</svg>'
        ].join('');
      case 'decoration':
        return [
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
            '<path d="M12 4c3 2.2 5 4.6 5 7.2A5 5 0 0 1 7 11.2C7 8.6 9 6.2 12 4z"/>',
            '<path d="M12 14v6"/>',
            '<path d="M9 20h6"/>',
          '</svg>'
        ].join('');
      case 'metal-works':
      case 'metal':
        return [
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
            '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l2.3-2.3a4 4 0 0 1-5.3 5.3l-5.9 5.9a1.8 1.8 0 1 1-2.6-2.6l5.9-5.9a4 4 0 0 1 5.3-5.3z"/>',
          '</svg>'
        ].join('');
      case 'wood':
        return [
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
            '<path d="M12 3c3 2.2 5 4.9 5 7.8A5 5 0 0 1 7 10.8C7 7.9 9 5.2 12 3z"/>',
            '<path d="M12 9v10"/>',
            '<path d="M9 14c1 .2 2 1 3 2 1-1 2-1.8 3-2"/>',
          '</svg>'
        ].join('');
      default:
        return [
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
            '<path d="M5 7h14"/>',
            '<path d="M5 12h14"/>',
            '<path d="M5 17h9"/>',
            '<circle cx="17.5" cy="17" r="1.5" fill="currentColor" stroke="none"/>',
          '</svg>'
        ].join('');
    }
  }

  function buildFilterButton(category, label, isActive, isAll) {
    var filterKey = category && category.filterKey ? category.filterKey : 'all';
    var visual = category && category.image && !isAll
      ? '<img src="' + esc(buildImageUrl(category.image, {width: 96, height: 96, quality: 80})) + '" alt="" loading="lazy">'
      : filterButtonIcon(category && category.iconKey, isAll);
    var button = document.createElement('button');
    button.className = 'll-iconcat-btn' + (isActive ? ' active' : '');
    button.setAttribute('data-filter', filterKey);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    button.innerHTML = [
      '<span class="ll-iconcat-circle">',
        visual,
      '</span>',
      '<span class="ll-iconcat-label">' + esc(label) + '</span>'
    ].join('');
    return button;
  }

  function renderInlineState(container, className, message) {
    if (!container) return;
    container.innerHTML = '';
    var state = document.createElement('p');
    state.className = className;
    state.textContent = message;
    container.appendChild(state);
  }

  function showCategoryFilterLoading(bar) {
    if (!bar) return;
    bar.hidden = false;
    bar.removeAttribute('aria-hidden');
    renderInlineState(bar, 'll-filter-empty', translate('state_categories_loading'));
  }

  function showCategoryFilterError(bar) {
    if (!bar) return;
    bar.hidden = false;
    bar.removeAttribute('aria-hidden');
    renderInlineState(bar, 'll-filter-empty', translate('state_categories_unavailable'));
  }

  function renderCategoryFilters(categories, bar) {
    if (!bar) return;

    var lang = getLang();
    var activeFilter = bar.getAttribute('data-current-filter') || 'all';
    var hasActiveFilter = activeFilter === 'all' || categories.some(function (category) {
      return category.filterKey === activeFilter;
    });

    if (!hasActiveFilter) activeFilter = 'all';

    bar.innerHTML = '';

    var fragment = document.createDocumentFragment();
    fragment.appendChild(buildFilterButton({filterKey: 'all', iconKey: 'all'}, translate('filter_all'), activeFilter === 'all', true));

    if (!categories.length) {
      bar.hidden = false;
      bar.removeAttribute('aria-hidden');
      bar.setAttribute('data-current-filter', 'all');
      bar.appendChild(fragment);
      return;
    }

    categories.forEach(function (category) {
      var label = lang === 'en' ? category.title_en : category.title_ka;
      fragment.appendChild(buildFilterButton(category, label, category.filterKey === activeFilter, false));
    });

    bar.hidden = false;
    bar.removeAttribute('aria-hidden');
    bar.setAttribute('data-current-filter', activeFilter);
    bar.appendChild(fragment);
  }

  function showHomepageCategoryLoading(container) {
    if (!container) return;
    renderInlineState(container, 'filter-loading', translate('state_categories_loading'));
  }

  function showHomepageCategoryError(container) {
    if (!container) return;
    renderInlineState(container, 'filter-loading', translate('state_categories_unavailable'));
  }

  function renderHomepageCategoryFilters(categories, container) {
    if (!container) return;

    var filterGroup = container.closest('.filter-group');
    var selected = [];

    container.querySelectorAll('input[name="category"]:checked').forEach(function (input) {
      selected.push(input.value);
    });

    if (!selected.length) {
      try {
        selected = JSON.parse(container.getAttribute('data-selected-values') || '[]');
      } catch (e) {
        selected = [];
      }
    }

    selected = selected.filter(function (value) {
      return categories.some(function (category) { return category.filterKey === value; });
    });

    if (!selected.length) {
      selected = categories.map(function (category) { return category.filterKey; });
    }

    container.innerHTML = '';

    if (!categories.length) {
      if (filterGroup) filterGroup.hidden = true;
      container.setAttribute('data-selected-values', '[]');
      return;
    }

    if (filterGroup) filterGroup.hidden = false;

    var fragment = document.createDocumentFragment();
    categories.forEach(function (category) {
      var label = document.createElement('label');
      label.className = 'filter-checkbox';
      label.innerHTML = [
        '<input type="checkbox" name="category" value="' + esc(category.filterKey) + '"' + (selected.indexOf(category.filterKey) !== -1 ? ' checked' : '') + '>',
        '<span class="checkbox-mark"></span>',
        '<span class="checkbox-label">' + esc(getLang() === 'en' ? category.title_en : category.title_ka) + '</span>'
      ].join('');
      fragment.appendChild(label);
    });

    container.setAttribute('data-selected-values', JSON.stringify(selected));
    container.appendChild(fragment);
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
    var name    = t(product, 'title');
    var matArr  = getLang() === 'en' ? (product.materials_en || product.materials_ka || []) : (product.materials_ka || []);
    var matStr  = Array.isArray(matArr) ? matArr.join(' & ') : String(matArr || '');

    var badgeHtml = '';
    if (product.badge === 'new') {
      badgeHtml = '<span class="ll-badge ll-badge-new">' + esc(translate('badge_new')) + '</span>';
    } else if (product.badge === 'sale') {
      var pct = product.discount_pct ? ('-' + product.discount_pct + '%') : translate('badge_sale_word');
      badgeHtml = '<span class="ll-badge ll-badge-sale">' + pct + '</span>';
    }

    var oldPriceHtml = (product.oldPrice && product.oldPrice > 0)
      ? '<span class="ll-prod-old-price">₾' + product.oldPrice.toLocaleString() + '</span>'
      : '';

    var waSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">'
      + '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>'
      + '<path d="M11.975 0C5.361 0 0 5.359 0 11.975c0 2.094.549 4.062 1.508 5.773L.055 23.455a.477.477 0 0 0 .574.603l5.898-1.543C8.163 23.43 10.047 24 11.975 24 18.589 24 24 18.641 24 12.025 24 5.41 18.589 0 11.975 0zm0 21.897c-1.84 0-3.596-.502-5.109-1.451l-.365-.217-3.783.99 1.008-3.666-.239-.378A9.916 9.916 0 0 1 2.079 12.025c0-5.463 4.44-9.901 9.896-9.901 5.456 0 9.896 4.438 9.896 9.901 0 5.462-4.44 9.872-9.896 9.872z"/>'
      + '</svg>';

    var article = document.createElement('article');
    article.className = 'll-product-card';
    article.setAttribute('data-category', filterValues(product).join(' '));
    article.setAttribute('data-price',    String(product.price));
    article.setAttribute('data-style',    product.style);
    article.setAttribute('data-slug',     product.slug);

    var _imgs = [product.image]
      .concat(Array.isArray(product.gallery) ? product.gallery : [])
      .filter(Boolean);
    if (_imgs.length) article.setAttribute('data-gallery', JSON.stringify(_imgs));

    article.innerHTML = [
      '<div class="ll-prod-img-wrap">',
        badgeHtml,
        '<img src="' + esc(product.image) + '" alt="' + esc(name) + '" loading="lazy">',
        '<button class="ll-quick-view" aria-label="' + esc(translate('aria_quick_view')) + '">',
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
            '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>',
            '<circle cx="12" cy="12" r="3"/>',
          '</svg>',
        '</button>',
      '</div>',
      '<div class="ll-prod-body">',
        '<span class="ll-prod-cat">' + esc(categoryLabel(product)) + '</span>',
        '<h3 class="ll-prod-name">' + esc(name) + '</h3>',
        '<p class="ll-prod-material">' + esc(matStr) + '</p>',
        '<div class="ll-prod-footer"><div>',
          '<span class="ll-prod-price">₾' + (product.price || 0).toLocaleString() + '</span>',
          oldPriceHtml,
        '</div></div>',
        '<div class="ll-prod-actions">',
          '<button class="btn-order">' + esc(translate('btn_order')) + '</button>',
          '<button class="btn-wa" aria-label="' + esc(translate('aria_whatsapp')) + '">' + waSvg + '</button>',
        '</div>',
      '</div>'
    ].join('');

    return article;
  }

  /* ── Skeleton loaders ───────────────────────────────────────── */

  /**
   * Immediately fill the grid with inert skeleton cards so that static
   * placeholder content (baked into the HTML) is never visible.
   * Skeletons are replaced in-place when renderProducts() runs.
   */
  function showSkeletons(grid, isLoftSystem) {
    grid.innerHTML = '';
    var frag = document.createDocumentFragment();
    var count = 6;
    for (var i = 0; i < count; i++) {
      var article = document.createElement('article');
      if (isLoftSystem) {
        article.className = 'll-product-card ll-product-card--skeleton';
        article.setAttribute('aria-hidden', 'true');
        article.innerHTML = [
          '<div class="ll-prod-img-wrap">',
            '<div class="ll-skel ll-skel-img"></div>',
          '</div>',
          '<div class="ll-prod-body">',
            '<div class="ll-skel ll-skel-cat"></div>',
            '<div class="ll-skel ll-skel-name"></div>',
            '<div class="ll-skel ll-skel-mat"></div>',
            '<div class="ll-skel ll-skel-price"></div>',
          '</div>',
        ].join('');
      } else {
        article.className = 'product-card product-card--skeleton';
        article.setAttribute('aria-hidden', 'true');
        article.innerHTML = [
          '<div class="product-image-wrap">',
            '<div class="skel-block skel-img"></div>',
          '</div>',
          '<div class="product-info">',
            '<div class="skel-block skel-cat"></div>',
            '<div class="skel-block skel-name"></div>',
            '<div class="skel-block skel-desc"></div>',
            '<div class="skel-block skel-price"></div>',
          '</div>',
        ].join('');
      }
      frag.appendChild(article);
    }
    grid.appendChild(frag);
  }

  function renderGridError(grid, isLoftSystem) {
    if (!grid) return;
    grid.innerHTML = '';
    var error = document.createElement('p');
    error.className = isLoftSystem ? 'll-filter-empty' : 'filter-no-results is-visible';
    error.textContent = translate('state_products_load_error');
    grid.appendChild(error);
  }

  /* ── Render products into the product grid ──────────────────── */

  /**
   * @param {Array}    products    - Product objects from Sanity
   * @param {Element}  grid        - The grid container element
   * @param {Function} cardBuilder - buildProductCard | buildLoftCard
   */
  function renderProducts(products, grid, cardBuilder) {
    if (!grid) return;
    // Always clear skeletons/placeholder cards — even when Sanity returns nothing
    grid.innerHTML = '';
    // Always update the count badge, including the 0-products case
    var countEl = document.getElementById('ll-catalog-count') || document.getElementById('filterCount');
    if (countEl) countEl.textContent = products.length + ' ' + translate('product_count_word');
    if (!products.length) {
      var empty = document.createElement('p');
      empty.className = grid.id === 'sanity-product-grid' ? 'll-filter-empty' : 'filter-no-results is-visible';
      empty.textContent = translate('state_no_products');
      grid.appendChild(empty);
      return;
    }
    /* Batch all card insertions in one DOM operation to avoid layout thrash */
    var frag = document.createDocumentFragment();
    products.forEach(function (product) {
      var card = cardBuilder(product);
      card.setAttribute('data-cms-card', '1');
      frag.appendChild(card);
    });
    grid.appendChild(frag); // single reflow for the entire product list
  }

  function getSortMode(sortSelect) {
    if (!sortSelect) return 'default';
    var value = sortSelect.value || sortSelect.getAttribute('value') || 'default';

    switch (value) {
      case 'price-asc':
      case 'price-desc':
      case 'newest':
      case 'default':
        return value;
      default:
        return 'default';
    }
  }

  function sortProducts(products, sortMode) {
    var items = Array.isArray(products) ? products.slice() : [];

    if (sortMode === 'price-asc') {
      items.sort(function (a, b) { return a.price - b.price; });
      return items;
    }

    if (sortMode === 'price-desc') {
      items.sort(function (a, b) { return b.price - a.price; });
      return items;
    }

    if (sortMode === 'newest') {
      items.sort(function (a, b) {
        return new Date(b._createdAt || 0).getTime() - new Date(a._createdAt || 0).getTime();
      });
      return items;
    }

    return items;
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
    if (btn1El && data.btn1_url) btn1El.setAttribute('href', data.btn1_url);
    if (btn2El && data.btn2_url) btn2El.setAttribute('href', data.btn2_url);
    if (heroBg && data.bg_image) {
      // Apply WebP optimisation on hero background (full-width → 1600 px)
      var heroUrl = buildImageUrl(data.bg_image, {width: 1600, quality: 90});
      heroBg.style.backgroundImage = "url('" + esc(heroUrl) + "')";
    }
  }

  function setMeta(name, value, attr) {
    if (!value) return;
    var key = attr === 'property' ? 'property' : 'name';
    var selector = 'meta[' + key + '="' + name + '"]';
    var el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(key, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  }

  function applySeo(seo) {
    if (!seo) return;
    if (seo.metaTitle) document.title = seo.metaTitle;
    setMeta('description', seo.metaDescription);
    setMeta('keywords', seo.keywords);
    setMeta('robots', seo.noIndex ? 'noindex, nofollow' : 'index, follow');
    setMeta('og:title', seo.ogTitle || seo.metaTitle, 'property');
    setMeta('og:description', seo.ogDescription || seo.metaDescription, 'property');
    setMeta('og:image', seo.ogImage, 'property');
    setMeta('og:image:alt', seo.ogTitle || seo.metaTitle, 'property');
    setMeta('twitter:title', seo.twitterTitle || seo.ogTitle || seo.metaTitle);
    setMeta('twitter:description', seo.twitterDescription || seo.ogDescription || seo.metaDescription);
    setMeta('twitter:image', seo.ogImage);
    setMeta('twitter:image:alt', seo.twitterTitle || seo.ogTitle || seo.metaTitle);
  }

  /* ── Homepage GROQ query (hero + announcement in one request) ── */

  // Field aliases are kept identical so applyHero() / applyAnnouncement()
  // require no changes — only the source paths are corrected to match the schema.
  var HOMEPAGE_GROQ = [
    '*[_type == "homepage" && _id == "homepage-singleton"][0] {',
    '  "tag_ka":   heroSection.label_ka,',
    '  "tag_en":   heroSection.label_en,',
    '  "title_ka": heroSection.heading_ka,',
    '  "title_en": heroSection.heading_en,',
    '  "desc_ka":  heroSection.sub_ka,',
    '  "desc_en":  heroSection.sub_en,',
    '  "btn1_ka":  coalesce(heroSection.btnPrimary_ka, heroSection.btnPrimaryLabel_ka),',
    '  "btn1_en":  coalesce(heroSection.btnPrimary_en, heroSection.btnPrimaryLabel_en),',
    '  "btn2_ka":  coalesce(heroSection.btnSecondary_ka, heroSection.btnSecondaryLabel_ka),',
    '  "btn2_en":  coalesce(heroSection.btnSecondary_en, heroSection.btnSecondaryLabel_en),',
    '  "btn1_url": coalesce(heroSection.btnPrimary_url, heroSection.btnPrimaryUrl),',
    '  "btn2_url": coalesce(heroSection.btnSecondary_url, heroSection.btnSecondaryUrl),',
    '  "bg_image": heroSection.bgImage.asset->url,',
    '  "text1_ka": announcementSection.text1_ka,',
    '  "text1_en": announcementSection.text1_en,',
    '  "text2_ka": announcementSection.text2_ka,',
    '  "text2_en": announcementSection.text2_en,',
    '  "text3_ka": announcementSection.text3_ka,',
    '  "text3_en": announcementSection.text3_en,',
    '  "visible":  announcementSection.visible,',
    '  "seo": seo {',
    '    metaTitle,',
    '    metaDescription,',
    '    keywords,',
    '    "ogTitle": coalesce(ogTitle, metaTitle),',
    '    "ogDescription": coalesce(ogDescription, metaDescription),',
    '    "ogImage": ogImage.asset->url,',
    '    "twitterTitle": coalesce(twitterTitle, ogTitle, metaTitle),',
    '    "twitterDescription": coalesce(twitterDescription, ogDescription, metaDescription),',
    '    noIndex',
    '  }',
    '}',
  ].join('');

  /* ── Announcement Bar ───────────────────────────────────────── */

  function applyAnnouncement(data) {
    if (!data) return;
    var lang    = getLang();
    var bar     = document.querySelector('.ll-announce, .announcement-bar');
    var parts   = [
      lang === 'en' ? data.text1_en : data.text1_ka,
      lang === 'en' ? data.text2_en : data.text2_ka,
      lang === 'en' ? data.text3_en : data.text3_ka,
    ].filter(Boolean);
    if (data.visible === false && bar) { bar.style.display = 'none'; return; }
    if (bar && parts.length) {
      bar.style.display = '';
      bar.innerHTML = parts.map(esc).join(' &nbsp;•&nbsp; ');
    }
  }

  /* ── Category page hero ─────────────────────────────────────── */

  function applyCategoryPageHero(data) {
    if (!data) return;
    var lang    = getLang();
    var heroH   = document.querySelector('.ll-hero-title, .ll-page-hero-content h1, .hero-title');
    var heroSub = document.querySelector('.ll-hero-sub, .ll-page-hero-content p, .hero-desc');
    if (heroH)   heroH.textContent   = lang === 'en' ? data.hero_title_en : data.hero_title_ka;
    if (heroSub) heroSub.textContent = lang === 'en' ? data.hero_sub_en   : data.hero_sub_ka;
  }

  /* ── Re-run when language changes ──────────────────────────── */

  document.addEventListener('loftline:langchange', function () {
    init();
  });

  /* ── Notify other scripts that CMS render is complete ─────── */

  function dispatchReady() {
    document.dispatchEvent(new CustomEvent('cms:ready', {detail: {page: _pageSlug}}));
  }

  /* ── Bootstrap ─────────────────────────────────────────────── */

  // Capture the script element now (currentScript is null after defer in some browsers)
  var _thisScript = document.currentScript || document.querySelector('script[src*="cms-loader"]');
  var _pageSlug   = _thisScript ? (_thisScript.getAttribute('data-page') || 'index') : 'index';
  // Incremented on every init() call; lets async callbacks detect stale responses
  var _renderGen  = 0;
  var _currentProducts = [];
  var _currentGrid = null;
  var _currentCardBuilder = null;

  function rerenderSortedProducts() {
    if (!_currentGrid || !_currentCardBuilder) return;
    var sortSelect = document.querySelector('.ll-sort-select');
    var sortedProducts = sortProducts(_currentProducts, getSortMode(sortSelect));
    renderProducts(sortedProducts, _currentGrid, _currentCardBuilder);
    dispatchReady();
  }

  function init() {
    var gen = ++_renderGen; // capture this render's generation token

    // Support all known product grid IDs without changing the existing render flow.
    var grid = document.getElementById('sanity-product-grid')
      || document.getElementById('productGrid')
      || document.getElementById('products');
    var isLoftSystem = !!grid && grid.id === 'sanity-product-grid';
    var filterBar    = isLoftSystem ? document.querySelector('.ll-iconcat[data-cms-filters]') : null;
    var homeCategoryContainer = !isLoftSystem ? document.querySelector('[data-cms-home-categories]') : null;
    var cardBuilder  = isLoftSystem ? buildLoftCard : buildProductCard;
    var sortSelect   = document.querySelector('.ll-sort-select');
    var productPromise = Promise.resolve({items: [], error: null});
    var categoryPromise = Promise.resolve({items: [], error: null});

    _currentGrid = grid;
    _currentCardBuilder = cardBuilder;

    if (sortSelect) {
      sortSelect.onchange = function () {
        rerenderSortedProducts();
      };
    }

    if (grid) {
      // Immediately replace any static HTML placeholder cards with skeletons.
      // This prevents stale images from the baked-in HTML from ever being visible.
      showSkeletons(grid, isLoftSystem);
      productPromise = loadProducts(_pageSlug);
    }

    if (filterBar && _pageSlug !== 'index') {
      showCategoryFilterLoading(filterBar);
      categoryPromise = loadCategories(_pageSlug);
    }

    if (homeCategoryContainer && _pageSlug === 'index') {
      showHomepageCategoryLoading(homeCategoryContainer);
      categoryPromise = loadCategories('index');
    }

    Promise.all([productPromise, categoryPromise]).then(function (results) {
      if (gen !== _renderGen) return;

      var productPayload = results[0] || {items: [], error: null};
      var categoryPayload = results[1] || {items: [], error: null};
      var products = Array.isArray(productPayload.items) ? productPayload.items.slice() : [];
      var categories = resolveCategories(categoryPayload.items, products, _pageSlug);

      _currentProducts = products;

      if (grid) {
        if (productPayload.error) {
          renderGridError(grid, isLoftSystem);
        } else {
          renderProducts(sortProducts(_currentProducts, getSortMode(sortSelect)), grid, cardBuilder);
        }
      }

      if (filterBar && _pageSlug !== 'index') {
        if (categories.length) {
          renderCategoryFilters(categories, filterBar);
        } else if (categoryPayload.error) {
          showCategoryFilterError(filterBar);
        }
      }

      if (homeCategoryContainer && _pageSlug === 'index') {
        if (categories.length) {
          renderHomepageCategoryFilters(categories, homeCategoryContainer);
        } else if (categoryPayload.error) {
          showHomepageCategoryError(homeCategoryContainer);
        }
      }

      dispatchReady();
    });

    // Homepage-only: fetch hero + announcement in a single Sanity request
    if (_pageSlug === 'index') {
      sanityQuery(HOMEPAGE_GROQ).then(function (response) {
        var data = response.ok ? response.result : null;
        applySeo(data && data.seo);
        applyHero(data);
        applyAnnouncement(data);
      });
    }

    // Category pages: fetch hero title/subtitle from pageContent document
    if (_pageSlug !== 'index') {
      var pageGroq = [
        '*[_type == "pageContent" && pageKey == $page][0] {',
        '  "hero_title_ka": hero.heading_ka,',
        '  "hero_title_en": hero.heading_en,',
        '  "hero_sub_ka":   hero.sub_ka,',
        '  "hero_sub_en":   hero.sub_en,',
        '  "seo": seo {',
        '    metaTitle,',
        '    metaDescription,',
        '    keywords,',
        '    "ogTitle": coalesce(ogTitle, metaTitle),',
        '    "ogDescription": coalesce(ogDescription, metaDescription),',
        '    "ogImage": ogImage.asset->url,',
        '    "twitterTitle": coalesce(twitterTitle, ogTitle, metaTitle),',
        '    "twitterDescription": coalesce(twitterDescription, ogDescription, metaDescription),',
        '    noIndex',
        '  }',
        '}',
      ].join('');
      sanityQuery(pageGroq, {page: _pageSlug}).then(function (response) {
        var data = response.ok ? response.result : null;
        applySeo(data && data.seo);
        applyCategoryPageHero(data);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
