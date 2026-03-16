/**
 * subcat-filter.js
 * Subcategory filter for the მთავარი ავეჯი page.
 *
 * Works with static product cards AND cards injected later by cms-loader.js.
 * Each product card needs:   data-category="magida"   (or skami / karada / taro /
 *                                                       fexsacmlis-karada / komodi)
 * Filter buttons need:       data-filter="magida"     (or "all" for reset)
 */
(function () {
  'use strict';

  var GRID_ID   = 'sanity-product-grid';
  var BAR_CLASS = 'll-subcat-bar';
  var BTN_CLASS = 'll-subcat-btn';
  var EMPTY_ID  = 'll-filter-empty';

  var currentFilter = 'all';

  /* ── Derive visible count and toggle empty-state message ── */
  function updateEmpty(grid) {
    var visible = grid.querySelectorAll('.ll-product-card:not([hidden])').length;
    var empty   = document.getElementById(EMPTY_ID);
    if (visible === 0) {
      if (!empty) {
        empty = document.createElement('p');
        empty.id = EMPTY_ID;
        empty.className = 'll-filter-empty';
        empty.textContent = 'ამ კატეგორიაში პროდუქტი ვერ მოიძებნა.';
        grid.appendChild(empty);
      }
    } else {
      if (empty) empty.remove();
    }
  }

  /* ── Apply the current filter to every card in the grid ── */
  function applyFilter(grid, filter) {
    var cards = grid.querySelectorAll('.ll-product-card');
    cards.forEach(function (card) {
      if (filter === 'all' || card.dataset.category === filter) {
        card.removeAttribute('hidden');
      } else {
        card.setAttribute('hidden', '');
      }
    });
    updateEmpty(grid);
  }

  /* ── Wire up filter buttons ── */
  function init() {
    var bar  = document.querySelector('.' + BAR_CLASS);
    var grid = document.getElementById(GRID_ID);
    if (!bar || !grid) return;

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.' + BTN_CLASS);
      if (!btn) return;

      /* Update active state */
      bar.querySelectorAll('.' + BTN_CLASS).forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      currentFilter = btn.dataset.filter || 'all';
      applyFilter(grid, currentFilter);
    });

    /* Re-apply filter whenever cms-loader.js injects new cards.
       Uses MutationObserver to watch for added nodes in the grid. */
    var observer = new MutationObserver(function (mutations) {
      var hasNew = mutations.some(function (m) { return m.addedNodes.length > 0; });
      if (hasNew && currentFilter !== 'all') {
        applyFilter(grid, currentFilter);
      }
    });
    observer.observe(grid, { childList: true });
  }

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
