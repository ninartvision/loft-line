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
    console.log('[CMS] query URL:', url);
    return fetch(url, {cache: 'default'})
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' for Sanity request');
        return r.json();
      })
      .then(function (d) {
        var result = d ? d.result : null;
        console.log('[CMS] result count:', Array.isArray(result) ? result.length : result);
        if (Array.isArray(result) && result.length) {
          console.log('[CMS] first document fields:', Object.keys(result[0]));
        }
        var payload = {ok: true, result: result, error: null};
        QUERY_CACHE[cacheKey] = payload;
        return payload;
      })
      .catch(function (err) {
        console.error('[CMS] fetch error:', err);
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

  /* ── Load products from Sanity ───────────────────────────── */

  /*
   * Field names in the GROQ projection match the existing JSON schema
   * exactly, so buildProductCard() and all rendering helpers are unchanged.
   */
  var PRODUCT_PROJECTION = [
    '_id,',
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
      console.warn('[CMS] No products matched page="' + pageSlug + '". Trying category->pageKey fallback.');
      var fallbackGroq = '*[_type == "product" && coalesce(available, true) == true && category->pageKey == $page] | order(_createdAt desc) { ' + PRODUCT_PROJECTION + ' }';  // coalesce handles null available field
      return sanityQuery(fallbackGroq, {page: pageSlug}).then(function (fallbackResponse) {
        var fallback = fallbackResponse.ok ? fallbackResponse.result : null;
        if (Array.isArray(fallback) && fallback.length) {
          return {items: processProducts(fallback), error: null};
        }

        if (!fallbackResponse.ok) {
          return {items: [], error: fallbackResponse.error};
        }

        // Last resort: if page/category mapping is missing in Sanity, still render
        // all available products rather than leaving the grid empty.
        console.warn('[CMS] No page mapping found for "' + pageSlug + '". Falling back to all available products.');
        return sanityQuery('*[_type == "product" && coalesce(available, true) == true] | order(_createdAt desc) { ' + PRODUCT_PROJECTION + ' }', {})
          .then(function (all) {
            return {
              items: all.ok ? processProducts(all.result) : [],
              error: all.ok ? null : all.error
            };
          });
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

      // ── Debug: flag documents that are missing critical fields ──
      if (!p.title_ka && !p.title_en) {
        console.warn('[CMS] product missing title — check name_ka/name_en in Sanity. _id:', p._id);
      }
      if (!p.image) {
        console.warn('[CMS] product missing image, using placeholder. _id:', p._id);
      }

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
        '<button class="product-quick-view" aria-label="სწრაფი ნახვა">',
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
    '"title_en": title,',
    'title_ka,',
    'filterKey,',
    'pageKey,',
    'sortOrder'
  ].join(' ');

  function loadCategories(pageSlug) {
    var groq;
    var params = {};

    if (!pageSlug) return Promise.resolve({items: [], error: null});

    if (pageSlug === 'index') {
      groq = '*[_type == "category" && count(*[_type == "product" && coalesce(available, true) == true && references(^._id)]) > 0] | order(coalesce(sortOrder, 9999) asc, coalesce(title_ka, title) asc) { ' + CATEGORY_PROJECTION + ' }';
    } else {
      groq = '*[_type == "category" && pageKey == $page] | order(coalesce(sortOrder, 9999) asc, coalesce(title_ka, title) asc) { ' + CATEGORY_PROJECTION + ' }';
      params.page = pageSlug;
    }

    return sanityQuery(groq, params).then(function (response) {
      return {
        items: response.ok ? processCategories(response.result) : [],
        error: response.ok ? null : response.error
      };
    });
  }

  function processCategories(categories) {
    if (!Array.isArray(categories) || !categories.length) return [];
    return categories
      .filter(function (category) {
        return category && category.filterKey;
      })
      .map(function (category) {
        return {
          title_ka: category.title_ka || category.title_en || '',
          title_en: category.title_en || category.title_ka || '',
          filterKey: String(category.filterKey || ''),
          pageKey: category.pageKey || '',
        };
      });
  }

  function filterButtonIcon(isAll) {
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

    return [
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
        '<path d="M5 7h14"/>',
        '<path d="M5 12h14"/>',
        '<path d="M5 17h9"/>',
        '<circle cx="17.5" cy="17" r="1.5" fill="currentColor" stroke="none"/>',
      '</svg>'
    ].join('');
  }

  function buildFilterButton(filterKey, label, isActive, isAll) {
    var button = document.createElement('button');
    button.className = 'll-iconcat-btn' + (isActive ? ' active' : '');
    button.setAttribute('data-filter', filterKey);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    button.innerHTML = [
      '<span class="ll-iconcat-circle">',
        filterButtonIcon(isAll),
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
    renderInlineState(bar, 'll-filter-empty', text('კატეგორიები იტვირთება...', 'Loading categories...'));
  }

  function showCategoryFilterError(bar) {
    if (!bar) return;
    bar.hidden = false;
    bar.removeAttribute('aria-hidden');
    renderInlineState(bar, 'll-filter-empty', text('კატეგორიები დროებით მიუწვდომელია.', 'Categories are temporarily unavailable.'));
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

    if (!categories.length) {
      bar.hidden = true;
      bar.setAttribute('aria-hidden', 'true');
      bar.setAttribute('data-current-filter', 'all');
      return;
    }

    var fragment = document.createDocumentFragment();
    fragment.appendChild(buildFilterButton('all', lang === 'en' ? 'All' : 'ყველა', activeFilter === 'all', true));

    categories.forEach(function (category) {
      var label = lang === 'en' ? category.title_en : category.title_ka;
      fragment.appendChild(buildFilterButton(category.filterKey, label, category.filterKey === activeFilter, false));
    });

    bar.hidden = false;
    bar.removeAttribute('aria-hidden');
    bar.setAttribute('data-current-filter', activeFilter);
    bar.appendChild(fragment);
  }

  function showHomepageCategoryLoading(container) {
    if (!container) return;
    renderInlineState(container, 'filter-loading', text('კატეგორიები იტვირთება...', 'Loading categories...'));
  }

  function showHomepageCategoryError(container) {
    if (!container) return;
    renderInlineState(container, 'filter-loading', text('კატეგორიები დროებით მიუწვდომელია.', 'Categories are temporarily unavailable.'));
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
      badgeHtml = '<span class="ll-badge ll-badge-new">ახალი</span>';
    } else if (product.badge === 'sale') {
      var pct = product.discount_pct ? ('-' + product.discount_pct + '%') : 'Sale';
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
        '<button class="ll-quick-view" aria-label="სწრაფი ნახვა">',
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
          '<button class="btn-order">შეკვეთა</button>',
          '<button class="btn-wa" aria-label="WhatsApp">' + waSvg + '</button>',
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
    error.textContent = text('პროდუქტების ჩატვირთვა ვერ მოხერხდა. სცადეთ მოგვიანებით.', 'We could not load products right now. Please try again later.');
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
    if (countEl) countEl.textContent = products.length + ' ' + text('პროდუქტი', 'Products');
    if (!products.length) {
      var empty = document.createElement('p');
      empty.className = grid.id === 'sanity-product-grid' ? 'll-filter-empty' : 'filter-no-results is-visible';
      empty.textContent = text('პროდუქტი ვერ მოიძებნა.', 'No products found.');
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

  function init() {
    var gen = ++_renderGen; // capture this render's generation token

    // System B (index.html) uses id="productGrid"; System A pages use id="sanity-product-grid"
    var isLoftSystem = !!document.getElementById('sanity-product-grid');
    var grid         = isLoftSystem
      ? document.getElementById('sanity-product-grid')
      : document.getElementById('productGrid');
    var filterBar    = isLoftSystem ? document.querySelector('.ll-iconcat[data-cms-filters]') : null;
    var homeCategoryContainer = !isLoftSystem ? document.querySelector('[data-cms-home-categories]') : null;
    var cardBuilder  = isLoftSystem ? buildLoftCard : buildProductCard;
    var tasks        = [];

    if (grid) {
      // Immediately replace any static HTML placeholder cards with skeletons.
      // This prevents stale images from the baked-in HTML from ever being visible.
      showSkeletons(grid, isLoftSystem);

      tasks.push(loadProducts(_pageSlug).then(function (payload) {
        if (gen !== _renderGen) return; // stale — a newer render is already in flight
        if (payload.error) {
          renderGridError(grid, isLoftSystem);
          return;
        }
        renderProducts(payload.items, grid, cardBuilder);
      }));
    }

    if (filterBar && _pageSlug !== 'index') {
      showCategoryFilterLoading(filterBar);
      tasks.push(loadCategories(_pageSlug).then(function (payload) {
        if (gen !== _renderGen) return;
        if (payload.error) {
          showCategoryFilterError(filterBar);
          return;
        }
        renderCategoryFilters(payload.items, filterBar);
      }));
    }

    if (homeCategoryContainer && _pageSlug === 'index') {
      showHomepageCategoryLoading(homeCategoryContainer);
      tasks.push(loadCategories('index').then(function (payload) {
        if (gen !== _renderGen) return;
        if (payload.error) {
          showHomepageCategoryError(homeCategoryContainer);
          return;
        }
        renderHomepageCategoryFilters(payload.items, homeCategoryContainer);
      }));
    }

    if (tasks.length) {
      Promise.all(tasks).then(function () {
        if (gen !== _renderGen) return;
        dispatchReady();
      });
    }

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
