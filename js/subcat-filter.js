/**
 * subcat-filter.js
 * CMS-driven subcategory filter for category pages.
 * Buttons are rendered by cms-loader.js from Sanity categories.
 * Cards are matched directly via exact filterKey values in data-category.
 */
(function () {
  'use strict';

  var GRID_IDS  = ['products', 'productGrid', 'sanity-product-grid'];
  var BAR_CLASS = 'll-iconcat';
  var BTN_CLASS = 'll-iconcat-btn';
  var EMPTY_ID  = 'll-filter-empty';

  var currentFilter = 'all';

  function getLang() {
    try {
      return localStorage.getItem('loftline_lang') || 'ka';
    } catch (e) {
      return 'ka';
    }
  }

  function text(ka, en) {
    return getLang() === 'en' ? en : ka;
  }

  function translate(key) {
    var lang = getLang();
    var table = typeof translations !== 'undefined' ? translations[lang] : null;
    return table && table[key] !== undefined ? table[key] : '';
  }

  function getGrid() {
    for (var i = 0; i < GRID_IDS.length; i++) {
      var grid = document.getElementById(GRID_IDS[i]);
      if (grid) return grid;
    }
    return null;
  }

  /* ── Derive visible count and toggle empty-state message ── */
  function updateEmpty(grid) {
    var visible = grid.querySelectorAll('.ll-product-card:not([hidden])').length;
    var empty   = document.getElementById(EMPTY_ID);
    if (visible === 0) {
      if (!empty) {
        empty = document.createElement('p');
        empty.id = EMPTY_ID;
        empty.className = 'll-filter-empty';
        grid.appendChild(empty);
      }
      empty.textContent = translate('filter_empty_category');
    } else {
      if (empty) empty.remove();
    }
  }

  /* ── Apply the current filter to every card in the grid ── */
  function applyFilter(grid, filter) {
    var cards = grid.querySelectorAll('.ll-product-card');
    cards.forEach(function (card) {
      var cardFilters = (card.dataset.category || '').split(/\s+/).filter(Boolean);
      if (filter === 'all' || cardFilters.indexOf(filter) !== -1) {
        card.removeAttribute('hidden');
      } else {
        card.setAttribute('hidden', '');
      }
    });
    updateEmpty(grid);
  }

  function resolveFilter(bar, filter) {
    var buttons = Array.prototype.slice.call(bar.querySelectorAll('.' + BTN_CLASS));
    var nextFilter = filter || 'all';
    var exists = nextFilter === 'all' || buttons.some(function (button) {
      return button.dataset.filter === nextFilter;
    });
    return exists ? nextFilter : 'all';
  }

  function setActiveButton(bar, filter) {
    var activeFilter = resolveFilter(bar, filter);
    bar.querySelectorAll('.' + BTN_CLASS).forEach(function (button) {
      var isActive = button.dataset.filter === activeFilter;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    bar.setAttribute('data-current-filter', activeFilter);
    return activeFilter;
  }

  /* ── Wire up filter buttons ── */
  function init() {
    var bar  = document.querySelector('.' + BAR_CLASS);
    var grid = getGrid();
    if (!bar || !grid) return;

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.' + BTN_CLASS);
      if (!btn) return;

      currentFilter = setActiveButton(bar, btn.dataset.filter || 'all');
      applyFilter(grid, currentFilter);
    });

    /* Re-apply filter whenever cms-loader.js injects new cards.
       Uses MutationObserver to watch for added nodes in the grid. */
    var observer = new MutationObserver(function (mutations) {
      var hasNew = mutations.some(function (m) { return m.addedNodes.length > 0; });
      if (hasNew) {
        applyFilter(grid, currentFilter);
      }
    });
    observer.observe(grid, { childList: true });

    document.addEventListener('cms:ready', function () {
      currentFilter = setActiveButton(bar, bar.getAttribute('data-current-filter') || currentFilter);
      applyFilter(grid, currentFilter);
    });

    document.addEventListener('loftline:langchange', function () {
      applyFilter(grid, currentFilter);
    });

    currentFilter = setActiveButton(bar, bar.getAttribute('data-current-filter') || currentFilter);
    applyFilter(grid, currentFilter);
  }

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
