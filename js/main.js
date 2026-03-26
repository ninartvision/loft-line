document.addEventListener('DOMContentLoaded', () => {
  const LANG_STORAGE_KEY = 'loftline_lang';
  const CONTACT_WHATSAPP_NUMBER = '995579388833';

  function isCmsDebugEnabled() {
    try {
      if (window.location.search.indexOf('cmsDebug=1') !== -1) return true;
      return localStorage.getItem('loftline_cms_debug') === '1';
    } catch (e) {
      return false;
    }
  }

  function cmsDebug(label, payload) {
    if (!isCmsDebugEnabled() || !window.console || typeof window.console.log !== 'function') return;
    if (payload === undefined) {
      window.console.log('[main.js]', label);
      return;
    }
    window.console.log('[main.js]', label, payload);
  }

  function getRuntimeLang() {
    try {
      return localStorage.getItem(LANG_STORAGE_KEY) || 'ka';
    } catch (e) {
      return 'ka';
    }
  }

  function runtimeText(key, kaText, enText) {
    const lang = getRuntimeLang();
    const table = typeof translations !== 'undefined' ? translations[lang] : null;
    if (key && table && table[key] !== undefined) {
      return table[key];
    }
    if (arguments.length === 1) {
      return '';
    }
    return lang === 'en' ? enText : kaText;
  }

  function filterCountText(count) {
    return count + ' ' + runtimeText('product_count_word');
  }

  function renderNoResults(node) {
    if (!node) return;
    node.innerHTML =
      '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/><line x1="8" y1="8" x2="14" y2="14"/></svg><p>' +
      runtimeText('state_no_products') +
      '</p>';
  }

  function setAddedCartLabel(button) {
    const labelEl = button && button.querySelector('span');
    if (labelEl) {
      labelEl.textContent = runtimeText('state_added');
    }
  }

  function setNewsletterSubscribedLabel(button) {
    if (button) {
      button.textContent = runtimeText('state_subscribed');
    }
  }

  function setContactIdleLabel(button) {
    if (button) {
      button.textContent = runtimeText('contact_submit_whatsapp');
    }
  }

  function setContactOpeningLabel(button) {
    if (button) {
      button.textContent = runtimeText('contact_opening_whatsapp');
    }
  }

  function syncContactFormCopy() {
    const sectionTag = document.getElementById('contactSectionTag');
    const sectionTitle = document.getElementById('contactSectionTitle');
    const sectionDesc = document.getElementById('contactSectionDesc');
    const whatsappNote = document.getElementById('contactWhatsappNote');
    const nameLabel = document.getElementById('contactLabelName');
    const emailLabel = document.getElementById('contactLabelEmail');
    const messageLabel = document.getElementById('contactLabelMessage');

    if (sectionTag) {
      sectionTag.textContent = runtimeText('nav_contact');
    }

    if (sectionTitle) {
      sectionTitle.textContent = runtimeText('contact_title_whatsapp');
    }

    if (sectionDesc) {
      sectionDesc.textContent = runtimeText('contact_desc_whatsapp');
    }

    if (whatsappNote) {
      whatsappNote.textContent = runtimeText('contact_note_whatsapp');
    }

    if (nameLabel) {
      nameLabel.textContent = runtimeText('label_name');
    }

    if (emailLabel) {
      emailLabel.textContent = runtimeText('label_email');
    }

    if (messageLabel) {
      messageLabel.textContent = runtimeText('label_message');
    }
  }

  function renderContactFeedback(feedback, state, waUrl) {
    if (!feedback || !state) return;

    if (state === 'error-required') {
      feedback.textContent = runtimeText('contact_error_required');
      feedback.className = 'contact-form-feedback error';
      return;
    }

    if (state === 'success-whatsapp') {
      feedback.innerHTML =
        runtimeText('contact_success_whatsapp') +
        '<a href="' + waUrl + '" target="_blank" rel="noopener" style="color:var(--color-gold);text-decoration:underline;">WhatsApp</a>.';
      feedback.className = 'contact-form-feedback success';
    }
  }

  let applyRuntimeFilters = null;

  function syncRuntimeLanguage() {
    document.querySelectorAll('.add-to-cart-btn[data-runtime-state="added"]').forEach(setAddedCartLabel);

    if (newsletterForm) {
      const btn = newsletterForm.querySelector('button');
      if (btn && btn.dataset.runtimeState === 'subscribed') {
        setNewsletterSubscribedLabel(btn);
      }
    }

    if (contactForm) {
      const feedback = document.getElementById('contactFeedback');
      const submitBtn = contactForm.querySelector('.contact-submit');

      syncContactFormCopy();

      if (submitBtn && submitBtn.dataset.runtimeState === 'opening-whatsapp') {
        setContactOpeningLabel(submitBtn);
      } else if (submitBtn) {
        setContactIdleLabel(submitBtn);
      }

      if (feedback && feedback.dataset.runtimeState) {
        renderContactFeedback(feedback, feedback.dataset.runtimeState, feedback.dataset.waUrl || '');
      }
    }

    if (applyRuntimeFilters) {
      applyRuntimeFilters();
    }
  }

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
    const categoryContainer = filterDrawer.querySelector('[data-cms-home-categories]');
    const materialContainer  = filterDrawer.querySelector('[data-cms-materials]');
    const homeIconFilterBar = document.querySelector('.ll-iconcat[data-home-icon-filters]');
    const SLIDER_MAX = 2000;

    function getCards() {
      return productGrid.querySelectorAll('.ll-product-card:not(.ll-product-card--skeleton)');
    }

    function getCategoryCheckboxes() {
      return filterDrawer.querySelectorAll('input[name="category"]');
    }

    function syncHomeIconFilterBar() {
      if (!homeIconFilterBar) return;

      const categoryCheckboxes = Array.from(getCategoryCheckboxes());
      const checked = categoryCheckboxes.filter(cb => cb.checked).map(cb => cb.value);
      const allValues = categoryCheckboxes.map(cb => cb.value);

      let activeFilter = 'all';
      if (checked.length === 1) {
        activeFilter = checked[0];
      } else if (checked.length > 1 && checked.length !== allValues.length) {
        activeFilter = 'all';
      }

      homeIconFilterBar.setAttribute('data-current-filter', activeFilter);
      homeIconFilterBar.querySelectorAll('.ll-iconcat-btn').forEach(btn => {
        const isActive = (btn.dataset.filter || 'all') === activeFilter;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    function getStyleCheckboxes() {
      return filterDrawer.querySelectorAll('input[name="style"]');
    }

    function getMaterialCheckboxes() {
      return filterDrawer.querySelectorAll('input[name="material"]');
    }

    function buildMaterialFilters(container) {
      if (!container) return;
      const seen = {};
      productGrid.querySelectorAll('.ll-product-card[data-material]').forEach(card => {
        (card.dataset.material || '').split(/\s+/).filter(Boolean).forEach(key => {
          if (!seen[key]) seen[key] = key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        });
      });
      const keys = Object.keys(seen).sort();
      const group = container.closest('.filter-group');
      if (!keys.length) {
        if (group) group.hidden = true;
        return;
      }
      container.innerHTML = '';
      keys.forEach(key => {
        container.insertAdjacentHTML('beforeend',
          '<label class="filter-checkbox">' +
            '<input type="checkbox" name="material" value="' + key + '">' +
            '<span class="checkbox-mark"></span>' +
            '<span class="checkbox-label">' + seen[key] + '</span>' +
          '</label>'
        );
      });
      if (group) group.hidden = false;
    }

    // Open / Close drawer helpers
    function openDrawer() {
      filterDrawer.classList.add('is-open');
      filterDrawer.setAttribute('aria-hidden', 'false');
      if (filterOverlay) filterOverlay.classList.add('is-active');
      document.body.classList.add('body-drawer-open');
      if (filterToggle) filterToggle.setAttribute('aria-expanded', 'true');
      console.log('[filter-drawer] openDrawer called. Overlay:', filterOverlay ? filterOverlay.className : 'NOT FOUND', '| Drawer transform computed:', window.getComputedStyle(filterDrawer).transform);
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
        const wasOpen = filterDrawer.classList.contains('is-open');
        console.log('[filter-toggle] click fired. Drawer currently:', wasOpen ? 'OPEN' : 'CLOSED');
        wasOpen ? closeDrawer() : openDrawer();
        console.log('[filter-toggle] Drawer class after toggle:', filterDrawer.className);
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
      const activeCategories = getCheckedValues(getCategoryCheckboxes());
      const activeStyles     = getCheckedValues(getStyleCheckboxes());
      const activeMaterials  = getCheckedValues(getMaterialCheckboxes());
      const minPrice = rangeMin ? parseInt(rangeMin.value, 10) : 0;
      const maxPrice = rangeMax ? parseInt(rangeMax.value, 10) : SLIDER_MAX;
      const allCards = getCards();

      console.log('[filter] applyFilters cards=' + allCards.length,
        'cat=' + JSON.stringify(activeCategories),
        'style=' + JSON.stringify(activeStyles),
        'mat=' + JSON.stringify(activeMaterials),
        'price=' + minPrice + '-' + maxPrice
      );
      if (allCards.length > 0) {
        const c = allCards[0];
        console.log('[filter] card[0] data:', {
          category: c.dataset.category,
          style: c.dataset.style,
          price: c.dataset.price,
          material: c.dataset.material
        });
      }

      if (categoryContainer) {
        categoryContainer.setAttribute('data-selected-values', JSON.stringify(activeCategories));
      }

      syncHomeIconFilterBar();

      let visibleCount = 0;

      const allCatBoxes   = Array.from(getCategoryCheckboxes());
      const allStyleBoxes = Array.from(getStyleCheckboxes());

      allCards.forEach(card => {
        const cardFilters = (card.dataset.category || '').split(/\s+/).filter(Boolean);
        // catMatch: no filter when none OR all checked; uncategorised products always pass
        const catAllChecked = allCatBoxes.length > 0 && activeCategories.length === allCatBoxes.length;
        const catMatch = activeCategories.length === 0 || catAllChecked || !cardFilters.length ||
                         activeCategories.some(value => cardFilters.includes(value));
        // styleMatch: no filter when none OR all checked; blank style always passes
        const styleAllChecked = allStyleBoxes.length > 0 && activeStyles.length === allStyleBoxes.length;
        const styleMatch = activeStyles.length === 0 || styleAllChecked || !card.dataset.style ||
                           activeStyles.includes(card.dataset.style);
        const matValues = (card.dataset.material || '').split(/\s+/).filter(Boolean);
        const matMatch  = activeMaterials.length === 0 || activeMaterials.some(v => matValues.includes(v));
        const price = parseInt(card.dataset.price, 10);
        const priceMatch = isNaN(price) || (price >= minPrice && price <= maxPrice);

        const show = catMatch && styleMatch && priceMatch && matMatch;

        if (show) {
          visibleCount++;
          card.classList.remove('filter-hidden');
          card.classList.add('filter-visible');
          card.removeAttribute('hidden');
        } else {
          card.classList.remove('filter-visible');
          card.classList.add('filter-hidden');
        }
      });

      if (filterCount) {
        filterCount.textContent = filterCountText(visibleCount);
      }

      productGrid.classList.add('is-visible');

      cmsDebug('applyFilters', {
        totalCards: allCards.length,
        visibleCount,
        activeCategories,
        activeStyles,
        activeMaterials,
        minPrice,
        maxPrice
      });

      // No results message
      let noResults = productGrid.querySelector('.filter-no-results');
      if (visibleCount === 0) {
        if (!noResults) {
          noResults = document.createElement('div');
          noResults.className = 'filter-no-results is-visible';
          renderNoResults(noResults);
          productGrid.appendChild(noResults);
        } else {
          renderNoResults(noResults);
          noResults.classList.add('is-visible');
        }
      } else if (noResults) {
        noResults.classList.remove('is-visible');
      }
    }

    applyRuntimeFilters = applyFilters;

    // Checkbox change handlers
    filterDrawer.addEventListener('change', (e) => {
      if (!e.target.matches('input[name="category"], input[name="style"], input[name="material"]')) return;
      console.log('[filter] change →', e.target.name, e.target.value, e.target.checked ? 'ON' : 'OFF');
      applyFilters();
    });

    if (homeIconFilterBar) {
      homeIconFilterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.ll-iconcat-btn');
        if (!btn) return;

        const filter = btn.dataset.filter || 'all';
        const categoryCheckboxes = Array.from(getCategoryCheckboxes());
        if (!categoryCheckboxes.length) return;

        if (filter === 'all') {
          categoryCheckboxes.forEach(cb => { cb.checked = true; });
        } else {
          categoryCheckboxes.forEach(cb => {
            cb.checked = cb.value === filter;
          });
        }

        applyFilters();
      });
    }

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
        getCategoryCheckboxes().forEach(cb => { cb.checked = true; });
        getStyleCheckboxes().forEach(cb => { cb.checked = true; });
        getMaterialCheckboxes().forEach(cb => { cb.checked = false; });
        if (rangeMin) { rangeMin.value = 0; }
        if (rangeMax) { rangeMax.value = SLIDER_MAX; }
        updateSliderRange();
        applyFilters();
      });
    }

    document.addEventListener('cms:ready', () => {
      cmsDebug('cms:ready received', {
        productCards: getCards().length
      });
      buildMaterialFilters(materialContainer);
      applyFilters();
    });
  }

  // ── Cart Badge ──
  let cartCount = 0;
  const cartBadgeEl   = document.getElementById('cartBadge');
  const bottomBadgeEl = document.querySelector('.bottom-bar-badge');

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (!btn) return;

    cartCount++;
    if (cartBadgeEl)   cartBadgeEl.textContent   = cartCount;
    if (bottomBadgeEl) bottomBadgeEl.textContent = cartCount;

    const labelEl = btn.querySelector('span');
    if (labelEl) {
      btn.dataset.runtimeState = 'added';
      setAddedCartLabel(btn);
      btn.disabled = true;
      setTimeout(() => {
        delete btn.dataset.runtimeState;
        labelEl.textContent = runtimeText('btn_add_cart', 'კალათაში', 'Add to Cart');
        btn.disabled = false;
      }, 1400);
    }
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
          btn.dataset.runtimeState = 'subscribed';
          setNewsletterSubscribedLabel(btn);
          btn.disabled = true;
          input.disabled = true;
        }
      }
    });
  }

  // ── Contact Form ──
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const submitBtn = contactForm.querySelector('.contact-submit');

    syncContactFormCopy();
    setContactIdleLabel(submitBtn);

    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const feedback = document.getElementById('contactFeedback');
      const name = contactForm.querySelector('#cf-name').value.trim();
      const email = contactForm.querySelector('#cf-email').value.trim();
      const message = contactForm.querySelector('#cf-message').value.trim();

      if (!name || !email || !message) {
        if (feedback) {
          feedback.dataset.runtimeState = 'error-required';
          delete feedback.dataset.waUrl;
          renderContactFeedback(feedback, 'error-required', '');
        }
        return;
      }

      // Open WhatsApp with a prefilled message instead of submitting to a backend.
      const waText = encodeURIComponent(
        runtimeText('label_name') + ': ' + name + '\n' +
        runtimeText('label_email') + ': ' + email + '\n\n' + message
      );
      const waUrl = 'https://wa.me/' + CONTACT_WHATSAPP_NUMBER + '?text=' + waText;

      if (submitBtn) {
        submitBtn.dataset.runtimeState = 'opening-whatsapp';
        setContactOpeningLabel(submitBtn);
        submitBtn.disabled = true;
        setTimeout(function() {
          if (feedback) {
            feedback.dataset.runtimeState = 'success-whatsapp';
            feedback.dataset.waUrl = waUrl;
            renderContactFeedback(feedback, 'success-whatsapp', waUrl);
          }
          delete submitBtn.dataset.runtimeState;
          setContactIdleLabel(submitBtn);
          submitBtn.disabled = false;
          contactForm.reset();
          window.open(waUrl, '_blank', 'noopener');
        }, 800);
      }
    });
  }

  // ── Mobile bottom bar active state on scroll ──
  const sections = document.querySelectorAll('section[id], footer[id]');
  const bottomItems = document.querySelectorAll('.bottom-bar-item[href^="#"]');
  if (sections.length && bottomItems.length) {
    const activateBottomItem = () => {
      let current = '';
      sections.forEach(sec => {
        if (window.scrollY + window.innerHeight / 2 >= sec.offsetTop) {
          current = '#' + sec.id;
        }
      });
      bottomItems.forEach(item => {
        item.classList.toggle('active', item.getAttribute('href') === current);
      });
    };
    window.addEventListener('scroll', activateBottomItem, { passive: true });
    activateBottomItem();
  }

  // ── Scroll-to-Top Button ──
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) {
    const toggleScrollBtn = () => {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', toggleScrollBtn, { passive: true });

  document.addEventListener('loftline:langchange', syncRuntimeLanguage);
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
