document.addEventListener('DOMContentLoaded', () => {

  // ── Scroll Animations (IntersectionObserver) ──
  const animatedEls = document.querySelectorAll('[data-animate], [data-animate-stagger]');

  if (animatedEls.length) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    animatedEls.forEach(el => observer.observe(el));
  }

  // ── Hero Parallax Effect ──
  const heroBg = document.getElementById('heroBg');

  if (heroBg) {
    let ticking = false;
    function updateParallax() {
      const scrollY = window.scrollY;
      const heroH = heroBg.closest('.hero')?.offsetHeight || 800;
      if (scrollY < heroH) {
        heroBg.style.transform = `translateY(${scrollY * 0.35}px) scale(1.1)`;
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  // ── Product Filter System (Drawer + Checkbox + Range Slider) ──
  const filterDrawer = document.getElementById('filterDrawer');
  const filterOverlay = document.getElementById('filterOverlay');
  const filterToggle = document.getElementById('filterToggle');
  const filterDrawerClose = document.getElementById('filterDrawerClose');
  const filterApplyBtn = document.getElementById('filterApplyBtn');
  const filterClear = document.getElementById('filterClear');
  const filterCount = document.getElementById('filterCount');
  const productGrid = document.getElementById('productGrid');
  const rangeMin = document.getElementById('rangeMin');
  const rangeMax = document.getElementById('rangeMax');
  const sliderRange = document.getElementById('sliderRange');
  const priceMinDisplay = document.getElementById('priceMinDisplay');
  const priceMaxDisplay = document.getElementById('priceMaxDisplay');

  if (filterDrawer && productGrid) {
    const allCards = productGrid.querySelectorAll('.product-card');
    const categoryCheckboxes = filterDrawer.querySelectorAll('input[name="category"]');
    const styleCheckboxes = filterDrawer.querySelectorAll('input[name="style"]');
    const SLIDER_MAX = 2000;

    // Open / Close drawer helpers
    function openDrawer() {
      filterDrawer.classList.add('is-open');
      filterDrawer.setAttribute('aria-hidden', 'false');
      if (filterOverlay) filterOverlay.classList.add('is-active');
      document.body.classList.add('body-drawer-open');
      if (filterToggle) filterToggle.setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
      filterDrawer.classList.remove('is-open');
      filterDrawer.setAttribute('aria-hidden', 'true');
      if (filterOverlay) filterOverlay.classList.remove('is-active');
      document.body.classList.remove('body-drawer-open');
      if (filterToggle) filterToggle.setAttribute('aria-expanded', 'false');
    }

    // Toggle button
    if (filterToggle) {
      filterToggle.addEventListener('click', () => {
        filterDrawer.classList.contains('is-open') ? closeDrawer() : openDrawer();
      });
    }

    // Close button inside drawer
    if (filterDrawerClose) {
      filterDrawerClose.addEventListener('click', closeDrawer);
    }

    // Overlay click closes drawer
    if (filterOverlay) {
      filterOverlay.addEventListener('click', closeDrawer);
    }

    // Apply button closes drawer
    if (filterApplyBtn) {
      filterApplyBtn.addEventListener('click', closeDrawer);
    }

    // Escape key closes drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && filterDrawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });

    // Format price for display
    function formatPrice(val) {
      return '\u20be' + Number(val).toLocaleString('ka-GE');
    }

    // Update slider visual range bar
    function updateSliderRange() {
      if (!rangeMin || !rangeMax || !sliderRange) return;
      const minVal = parseInt(rangeMin.value, 10);
      const maxVal = parseInt(rangeMax.value, 10);
      const leftPct = (minVal / SLIDER_MAX) * 100;
      const rightPct = 100 - (maxVal / SLIDER_MAX) * 100;
      sliderRange.style.left = leftPct + '%';
      sliderRange.style.right = rightPct + '%';
      if (priceMinDisplay) priceMinDisplay.textContent = formatPrice(minVal);
      if (priceMaxDisplay) priceMaxDisplay.textContent = formatPrice(maxVal);
    }

    // Get checked values from a group
    function getCheckedValues(checkboxes) {
      const values = [];
      checkboxes.forEach(cb => { if (cb.checked) values.push(cb.value); });
      return values;
    }

    // Apply all active filters
    function applyFilters() {
      const activeCategories = getCheckedValues(categoryCheckboxes);
      const activeStyles = getCheckedValues(styleCheckboxes);
      const minPrice = rangeMin ? parseInt(rangeMin.value, 10) : 0;
      const maxPrice = rangeMax ? parseInt(rangeMax.value, 10) : SLIDER_MAX;

      let visibleCount = 0;

      allCards.forEach(card => {
        const catMatch = activeCategories.length === 0 || activeCategories.includes(card.dataset.category);
        const styleMatch = activeStyles.length === 0 || activeStyles.includes(card.dataset.style);
        const price = parseInt(card.dataset.price, 10);
        const priceMatch = price >= minPrice && price <= maxPrice;

        const show = catMatch && styleMatch && priceMatch;

        if (show) {
          visibleCount++;
          card.classList.remove('filter-hidden');
          card.classList.add('filter-visible');
          card.style.display = '';
        } else {
          card.classList.remove('filter-visible');
          card.classList.add('filter-hidden');
          setTimeout(() => {
            if (card.classList.contains('filter-hidden')) {
              card.style.display = 'none';
            }
          }, 350);
        }
      });

      if (filterCount) {
        filterCount.textContent = visibleCount + ' \u10de\u10e0\u10dd\u10d3\u10e3\u10e5\u10e2\u10d8';
      }

      // No results message
      let noResults = productGrid.querySelector('.filter-no-results');
      if (visibleCount === 0) {
        if (!noResults) {
          noResults = document.createElement('div');
          noResults.className = 'filter-no-results is-visible';
          noResults.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/><line x1="8" y1="8" x2="14" y2="14"/></svg><p>\u10de\u10e0\u10dd\u10d3\u10e3\u10e5\u10e2\u10d8 \u10d5\u10d4\u10e0 \u10db\u10dd\u10d8\u10eb\u10d4\u10d1\u10dc\u10d0</p>';
          productGrid.appendChild(noResults);
        } else {
          noResults.classList.add('is-visible');
        }
      } else if (noResults) {
        noResults.classList.remove('is-visible');
      }
    }

    // Checkbox change handlers
    categoryCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));
    styleCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));

    // Range slider handlers
    if (rangeMin && rangeMax) {
      rangeMin.addEventListener('input', () => {
        if (parseInt(rangeMin.value, 10) > parseInt(rangeMax.value, 10)) {
          rangeMin.value = rangeMax.value;
        }
        updateSliderRange();
        applyFilters();
      });

      rangeMax.addEventListener('input', () => {
        if (parseInt(rangeMax.value, 10) < parseInt(rangeMin.value, 10)) {
          rangeMax.value = rangeMin.value;
        }
        updateSliderRange();
        applyFilters();
      });

      // Initial range bar position
      updateSliderRange();
    }

    // Clear all filters
    if (filterClear) {
      filterClear.addEventListener('click', () => {
        categoryCheckboxes.forEach(cb => { cb.checked = true; });
        styleCheckboxes.forEach(cb => { cb.checked = true; });
        if (rangeMin) { rangeMin.value = 0; }
        if (rangeMax) { rangeMax.value = SLIDER_MAX; }
        updateSliderRange();
        applyFilters();
      });
    }
  }

  // ── Cart Badge ──
  let cartCount = 0;
  const cartBadgeEl   = document.getElementById('cartBadge');
  const bottomBadgeEl = document.querySelector('.bottom-bar-badge');

  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cartCount++;
      if (cartBadgeEl)   cartBadgeEl.textContent   = cartCount;
      if (bottomBadgeEl) bottomBadgeEl.textContent = cartCount;
      const labelEl = btn.querySelector('span');
      if (labelEl) {
        const orig = labelEl.textContent;
        labelEl.textContent = 'დამატებულია ✓';
        btn.disabled = true;
        setTimeout(() => {
          labelEl.textContent = orig;
          btn.disabled = false;
        }, 1400);
      }
    });
  });

  // ── Newsletter Form ──
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      if (input && input.value) {
        const btn = newsletterForm.querySelector('button');
        if (btn) {
          btn.textContent = 'გამოწერილია ✓';
          btn.disabled = true;
          input.disabled = true;
        }
      }
    });
  }
});