/* ============================================================
   LOFT LINE - Product Quick View System + Image Gallery
   Works on: index.html (product-card) + all loft pages (ll-product-card)
   ============================================================ */
(function () {
  'use strict';

  /* State */
  var currentCard = null;
  var currentCardSlug = '';
  var qty = 1;
  var galleryImages = [];
  var galleryIdx = 0;

  /* Helpers */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  function getRuntimeLang() {
    try {
      return localStorage.getItem('loftline_lang') || 'ka';
    } catch (e) {
      return 'ka';
    }
  }

  function runtimeText(key, kaText, enText) {
    var lang = getRuntimeLang();
    var table = typeof translations !== 'undefined' ? translations[lang] : null;
    if (key && table && table[key] !== undefined) {
      return table[key];
    }
    if (arguments.length === 1) {
      return '';
    }
    return lang === 'en' ? enText : kaText;
  }

  function thumbAriaLabel(altText, index) {
    var base = altText || runtimeText('pqv_color_name');
    return runtimeText('quickview_thumb_image') + ' ' + (index + 1) + ': ' + base;
  }

  function setModalStaticText() {
    var colorLabel = document.querySelector('.pqv-color-label');
    var colorName = document.getElementById('pqvColorName');

    if (colorName && !colorName.dataset.dynamicColor) {
      colorName.textContent = runtimeText('pqv_color_name');
    }

    if (colorLabel && colorName) {
      colorLabel.innerHTML = runtimeText('pqv_color_label') + ' <span id="pqvColorName">' + colorName.textContent + '</span>';
    }

    if (domGalleryPrev) {
      domGalleryPrev.setAttribute('aria-label', runtimeText('aria_previous'));
    }

    if (domGalleryNext) {
      domGalleryNext.setAttribute('aria-label', runtimeText('aria_next'));
    }

    if (domClose) {
      domClose.setAttribute('aria-label', runtimeText('aria_close'));
    }

    if (domQtyMinus) {
      domQtyMinus.setAttribute('aria-label', runtimeText('aria_decrease_quantity'));
    }

    if (domQtyPlus) {
      domQtyPlus.setAttribute('aria-label', runtimeText('aria_increase_quantity'));
    }
  }

  function setAddButtonIdle() {
    if (!domAddBtn) return;
    domAddBtn.dataset.runtimeState = 'idle';
    domAddBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>' +
      ' ' + runtimeText('pqv_add_btn');
  }

  function setAddButtonAdded() {
    if (!domAddBtn) return;
    domAddBtn.dataset.runtimeState = 'added';
    domAddBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' +
      ' ' + runtimeText('quickview_added');
  }

  function syncQuickViewRuntimeLanguage() {
    setModalStaticText();
    if (!domAddBtn) return;
    if (domAddBtn.dataset.runtimeState === 'added') {
      setAddButtonAdded();
      return;
    }
    setAddButtonIdle();
  }

  function findLiveCardBySlug() {
    if (!currentCardSlug) return null;
    var cards = document.querySelectorAll('.product-card, .ll-product-card');
    for (var i = 0; i < cards.length; i++) {
      if ((cards[i].getAttribute('data-slug') || '') === currentCardSlug) {
        return cards[i];
      }
    }
    return null;
  }

  function refreshOpenModalFromCurrentCard() {
    if (!domDialog || !domDialog.classList.contains('is-open')) return;
    var liveCard = findLiveCardBySlug();
    var currentQty = qty;
    if (liveCard) {
      openModal(liveCard);
      qty = currentQty;
      if (domQtyNum) domQtyNum.textContent = String(qty);
    }
    syncQuickViewRuntimeLanguage();
  }

  /* Build a thumbnail-sized URL for Sanity CDN assets */
  function thumbUrl(src) {
    if (!src) return src;
    if (src.indexOf('sanity.io') !== -1) {
      return src.split('?')[0] + '?w=140&h=140&fit=crop&auto=format&q=75';
    }
    return src;
  }

  /*
   * Wire up click triggers with event delegation.
   *
   * A single delegated listener on document.body handles clicks from every
   * product card, whether static HTML or CMS-injected, past, present, and future.
   * Because listeners are not attached to individual cards:
   *
   * - No duplicate handlers regardless of how many times CMS re-renders.
   * - No listeners are orphaned on discarded DOM nodes.
   * - Re-renders, language switches, and filter changes need no re-wiring.
   *
   * setupTriggers() stays as a no-op so window.loftQuickView.init() and
   * older integrations remain safe to call.
   */
  var _delegatedSetup = false;

  function setupTriggers() {
    // No-op: real click wiring is performed once by setupDelegatedTriggers().
    // Preserved for backwards compatibility with window.loftQuickView.init()
    // and any external code that still calls it.
  }

  function setupDelegatedTriggers() {
    if (_delegatedSetup) return;
    _delegatedSetup = true;

    document.body.addEventListener('click', function (e) {
      var target = e.target;

      // Quick-view button, or any child element inside it.
      var qvBtn = target.closest
        ? target.closest('.product-quick-view, .ll-quick-view')
        : null;
      if (qvBtn) {
        var card = qvBtn.closest('.product-card, .ll-product-card');
        if (card) {
          e.preventDefault();
          e.stopPropagation();
          openModal(card);
          return;
        }
      }

      // Product image click.
      var imgWrap = target.closest
        ? target.closest('.product-image-wrap, .ll-prod-img-wrap')
        : null;
      if (imgWrap) {
        var card2 = imgWrap.closest('.product-card, .ll-product-card');
        if (card2) openModal(card2);
      }
    });
  }

  /* Modal DOM refs */
  var domOverlay, domDialog, domClose;
  var domGallery, domGalleryTrack, domGalleryPrev, domGalleryNext, domThumbs;
  var domCat, domName, domDesc, domPrice, domOldPrice;
  var domQtyMinus, domQtyNum, domQtyPlus, domAddBtn;

  function cacheModalElements() {
    domOverlay = document.getElementById('pqvOverlay');
    domDialog = document.getElementById('pqvDialog');
    domClose = document.getElementById('pqvClose');
    domGallery = document.getElementById('pqvGallery');
    domGalleryTrack = document.getElementById('pqvGalleryTrack');
    domGalleryPrev = document.getElementById('pqvGalleryPrev');
    domGalleryNext = document.getElementById('pqvGalleryNext');
    domThumbs = document.getElementById('pqvThumbs');
    domCat = document.getElementById('pqvCat');
    domName = document.getElementById('pqvName');
    domDesc = document.getElementById('pqvDesc');
    domPrice = document.getElementById('pqvPrice');
    domOldPrice = document.getElementById('pqvOldPrice');
    domQtyMinus = document.getElementById('pqvQtyMinus');
    domQtyNum = document.getElementById('pqvQtyNum');
    domQtyPlus = document.getElementById('pqvQtyPlus');
    domAddBtn = document.getElementById('pqvAddBtn');
    setModalStaticText();
  }

  /* Gallery: build */
  function buildGallery(images, altText) {
    galleryImages = images;
    galleryIdx = 0;
    if (!domGalleryTrack) return;

    /* Build slide track: first image loads eagerly, rest lazy. */
    domGalleryTrack.innerHTML = '';
    domGalleryTrack.style.cssText = 'transition:none;transform:translateX(0)';

    /* Batch slide insertions in one DOM operation to avoid layout thrash. */
    var trackFrag = document.createDocumentFragment();
    images.forEach(function (src, i) {
      var slide = document.createElement('div');
      slide.className = 'pqv-slide';

      var img = document.createElement('img');
      img.className = 'pqv-slide-img';
      img.alt = altText;
      img.width = 800;
      img.height = 800;

      if (i === 0) {
        img.src = src;
        img.loading = 'eager';
      } else {
        img.loading = 'lazy';
        img.dataset.lazySrc = src;
        /* Transparent 1x1 placeholder keeps layout stable. */
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      }

      slide.appendChild(img);
      trackFrag.appendChild(slide);
    });
    domGalleryTrack.appendChild(trackFrag);

    /* Show or hide controls based on image count. */
    var multi = images.length > 1;
    if (domGalleryPrev) domGalleryPrev.hidden = !multi;
    if (domGalleryNext) domGalleryNext.hidden = !multi;
    if (domThumbs) domThumbs.hidden = !multi;

    if (multi) buildThumbs(images, altText);

    /* Preload the first two slides. */
    lazyLoadAdjacent(0);
  }

  /* Gallery: navigate */
  function goToSlide(idx) {
    var len = galleryImages.length;
    if (!len) return;
    galleryIdx = ((idx % len) + len) % len;

    domGalleryTrack.style.transition = 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)';
    domGalleryTrack.style.transform = 'translateX(-' + (galleryIdx * 100) + '%)';

    lazyLoadAdjacent(galleryIdx);
    updateThumbActive();
  }

  /* Eagerly load the current slide plus its neighbors. */
  function lazyLoadAdjacent(idx) {
    var len = galleryImages.length;
    [-1, 0, 1].forEach(function (offset) {
      var i = ((idx + offset) % len + len) % len;
      var slide = domGalleryTrack && domGalleryTrack.children[i];
      if (!slide) return;
      var img = slide.querySelector('.pqv-slide-img');
      if (img && img.dataset.lazySrc) {
        img.src = img.dataset.lazySrc;
        delete img.dataset.lazySrc;
      }
    });
  }

  /* Gallery: thumbnails */
  function buildThumbs(images, altText) {
    if (!domThumbs) return;
    domThumbs.innerHTML = '';

    /* Batch thumbnail buttons in one DOM operation to avoid layout thrash. */
    var thumbFrag = document.createDocumentFragment();
    images.forEach(function (src, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pqv-thumb' + (i === 0 ? ' is-active' : '');
      btn.setAttribute('aria-label', thumbAriaLabel(altText, i));

      var img = document.createElement('img');
      img.src = thumbUrl(src);
      img.alt = '';
      img.loading = 'lazy';
      img.width = 140;
      img.height = 140;

      btn.appendChild(img);
      btn.addEventListener('click', function () { goToSlide(i); });
      thumbFrag.appendChild(btn);
    });
    domThumbs.appendChild(thumbFrag);
  }

  function updateThumbActive() {
    if (!domThumbs) return;
    var thumbs = domThumbs.querySelectorAll('.pqv-thumb');
    thumbs.forEach(function (thumb, i) {
      thumb.classList.toggle('is-active', i === galleryIdx);
    });
    var active = thumbs[galleryIdx];
    if (active) {
      active.scrollIntoView({ inline: 'nearest', behavior: 'smooth', block: 'nearest' });
    }
  }

  /* Open modal */
  function openModal(card) {
    if (!domDialog || !domOverlay) return;
    currentCard = card;
    currentCardSlug = card ? (card.getAttribute('data-slug') || '') : '';
    qty = 1;

    var imgEl = qs('.product-image-wrap img, .ll-prod-img-wrap img', card);
    var imgSrc = imgEl ? (imgEl.getAttribute('src') || '') : '';
    var nameEl = qs('.product-name, .ll-prod-name', card);
    var descEl = qs('.product-desc, .ll-prod-material', card);
    var catEl = qs('.product-category, .ll-prod-cat', card);
    var priceEl = qs('.product-price, .ll-prod-price', card);
    var oldPEl = qs('.product-old-price, .ll-prod-old-price', card);

    var nameText = nameEl ? nameEl.textContent.trim() : '';
    var oldPriceText = oldPEl ? oldPEl.textContent.trim() : '';

    if (domCat) domCat.textContent = catEl ? catEl.textContent.trim() : '';
    if (domName) domName.textContent = nameText;
    if (domDesc) domDesc.textContent = descEl ? descEl.textContent.trim() : '';
    if (domPrice) domPrice.textContent = priceEl ? priceEl.textContent.trim() : '';
    if (domOldPrice) {
      domOldPrice.textContent = oldPriceText;
      domOldPrice.style.display = oldPriceText ? '' : 'none';
    }

    setModalStaticText();

    /* Read image list from data-gallery, which is set by cms-loader. */
    var images = [];
    try {
      var raw = card.getAttribute('data-gallery');
      if (raw) images = JSON.parse(raw);
    } catch (e) {
      images = [];
    }
    if (!images.length && imgSrc) images = [imgSrc];
    buildGallery(images, nameText);

    if (domQtyNum) domQtyNum.textContent = '1';

    domOverlay.classList.add('is-open');
    domOverlay.setAttribute('aria-hidden', 'false');
    domDialog.classList.add('is-open');
    domDialog.setAttribute('aria-hidden', 'false');
    document.body.classList.add('pqv-open');

    resetAddBtn();
    setTimeout(function () {
      if (domClose) domClose.focus();
    }, 60);
  }

  /* Close modal */
  function closeModal() {
    if (!domDialog || !domOverlay) return;
    domOverlay.classList.remove('is-open');
    domOverlay.setAttribute('aria-hidden', 'true');
    domDialog.classList.remove('is-open');
    domDialog.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('pqv-open');
  }

  /* Add-to-cart helpers */
  function resetAddBtn() {
    if (!domAddBtn) return;
    domAddBtn.classList.remove('pqv-added');
    domAddBtn.disabled = false;
    setAddButtonIdle();
  }

  /* Wire modal controls once. */
  function wireModalControls() {
    if (!domDialog) return;

    /* Close controls */
    if (domClose) domClose.addEventListener('click', closeModal);
    if (domOverlay) {
      domOverlay.addEventListener('click', function (e) {
        if (e.target === domOverlay) closeModal();
      });
    }

    /* Gallery arrows */
    if (domGalleryPrev) {
      domGalleryPrev.addEventListener('click', function (e) {
        e.stopPropagation();
        goToSlide(galleryIdx - 1);
      });
    }
    if (domGalleryNext) {
      domGalleryNext.addEventListener('click', function (e) {
        e.stopPropagation();
        goToSlide(galleryIdx + 1);
      });
    }

    /* Swipe and touch navigation */
    if (domGallery) {
      var touchStartX = 0;
      var touchStartY = 0;
      var swiping = false;

      domGallery.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        swiping = false;
      }, { passive: true });

      domGallery.addEventListener('touchmove', function (e) {
        var dx = e.touches[0].clientX - touchStartX;
        var dy = e.touches[0].clientY - touchStartY;
        if (!swiping && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
          swiping = true;
        }
      }, { passive: true });

      domGallery.addEventListener('touchend', function (e) {
        if (!swiping || galleryImages.length < 2) return;
        var dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) goToSlide(dx < 0 ? galleryIdx + 1 : galleryIdx - 1);
      });
    }

    /* Keyboard navigation */
    document.addEventListener('keydown', function (e) {
      if (!domDialog || !domDialog.classList.contains('is-open')) return;
      if (e.key === 'Escape') {
        closeModal();
        return;
      }
      if (e.key === 'ArrowLeft' && galleryImages.length > 1) goToSlide(galleryIdx - 1);
      if (e.key === 'ArrowRight' && galleryImages.length > 1) goToSlide(galleryIdx + 1);
    });

    /* Quantity controls */
    if (domQtyMinus) {
      domQtyMinus.addEventListener('click', function () {
        if (qty > 1) {
          qty--;
          if (domQtyNum) domQtyNum.textContent = qty;
        }
      });
    }
    if (domQtyPlus) {
      domQtyPlus.addEventListener('click', function () {
        qty++;
        if (domQtyNum) domQtyNum.textContent = qty;
      });
    }

    /* Add to cart */
    if (domAddBtn) {
      domAddBtn.addEventListener('click', function () {
        document.querySelectorAll('#cartBadge, .bottom-bar-badge, .ll-cart-badge').forEach(function (badge) {
          badge.textContent = (parseInt(badge.textContent, 10) || 0) + qty;
        });
        domAddBtn.classList.add('pqv-added');
        setAddButtonAdded();
        setTimeout(resetAddBtn, 2000);
      });
    }
  }

  /* Init */
  document.addEventListener('DOMContentLoaded', function () {
    cacheModalElements();
    setupDelegatedTriggers();
    wireModalControls();
    syncQuickViewRuntimeLanguage();
  });

  document.addEventListener('loftline:langchange', syncQuickViewRuntimeLanguage);
  document.addEventListener('cms:ready', refreshOpenModalFromCurrentCard);

  // Backwards compatibility: external callers can still invoke
  // window.loftQuickView.init() safely. Delegation covers all cards.
  window.loftQuickView = { init: setupTriggers };
})();

