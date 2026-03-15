/* ============================================================
   LOFT LINE â€” Product Quick View System + Image Gallery
   Works on: index.html (product-card) + all loft pages (ll-product-card)
   ============================================================ */
(function () {
  'use strict';

  /* â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  var currentCard   = null;
  var qty           = 1;
  var galleryImages = [];
  var galleryIdx    = 0;

  /* â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function qs(sel, ctx)  { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  /* Build a thumbnail-sized URL for Sanity CDN assets */
  function thumbUrl(src) {
    if (!src) return src;
    if (src.indexOf('sanity.io') !== -1) {
      return src.split('?')[0] + '?w=140&h=140&fit=crop&auto=format&q=75';
    }
    return src;
  }

  /* â”€â”€ Wire Up Click Triggers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function setupTriggers() {
    qsa('.product-card, .ll-product-card').forEach(function (card) {
      var qvBtn   = qs('.product-quick-view, .ll-quick-view', card);
      var imgWrap = qs('.product-image-wrap, .ll-prod-img-wrap', card);

      if (qvBtn) {
        qvBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          openModal(card);
        });
      }
      if (imgWrap) {
        imgWrap.style.cursor = 'pointer';
        imgWrap.addEventListener('click', function () { openModal(card); });
      }
    });
  }

  /* â”€â”€ Modal DOM Refs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  var domOverlay, domDialog, domClose;
  var domGallery, domGalleryTrack, domGalleryPrev, domGalleryNext, domThumbs;
  var domCat, domName, domDesc, domPrice, domOldPrice;
  var domQtyMinus, domQtyNum, domQtyPlus, domAddBtn;

  function cacheModalElements() {
    domOverlay      = document.getElementById('pqvOverlay');
    domDialog       = document.getElementById('pqvDialog');
    domClose        = document.getElementById('pqvClose');
    domGallery      = document.getElementById('pqvGallery');
    domGalleryTrack = document.getElementById('pqvGalleryTrack');
    domGalleryPrev  = document.getElementById('pqvGalleryPrev');
    domGalleryNext  = document.getElementById('pqvGalleryNext');
    domThumbs       = document.getElementById('pqvThumbs');
    domCat          = document.getElementById('pqvCat');
    domName         = document.getElementById('pqvName');
    domDesc         = document.getElementById('pqvDesc');
    domPrice        = document.getElementById('pqvPrice');
    domOldPrice     = document.getElementById('pqvOldPrice');
    domQtyMinus     = document.getElementById('pqvQtyMinus');
    domQtyNum       = document.getElementById('pqvQtyNum');
    domQtyPlus      = document.getElementById('pqvQtyPlus');
    domAddBtn       = document.getElementById('pqvAddBtn');
  }

  /* â”€â”€ Gallery: Build â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function buildGallery(images, altText) {
    galleryImages = images;
    galleryIdx    = 0;
    if (!domGalleryTrack) return;

    /* Build slide track â€” first image loads eagerly, rest lazy */
    domGalleryTrack.innerHTML    = '';
    domGalleryTrack.style.cssText = 'transition:none;transform:translateX(0)';

    images.forEach(function (src, i) {
      var slide = document.createElement('div');
      slide.className = 'pqv-slide';

      var img = document.createElement('img');
      img.className = 'pqv-slide-img';
      img.alt       = altText;
      img.width     = 800;
      img.height    = 800;

      if (i === 0) {
        img.src     = src;
        img.loading = 'eager';
      } else {
        img.loading          = 'lazy';
        img.dataset.lazySrc  = src;
        /* Transparent 1Ã—1 placeholder keeps layout stable */
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      }

      slide.appendChild(img);
      domGalleryTrack.appendChild(slide);
    });

    /* Show/hide controls based on whether there are multiple images */
    var multi = images.length > 1;
    if (domGalleryPrev) domGalleryPrev.hidden = !multi;
    if (domGalleryNext) domGalleryNext.hidden = !multi;
    if (domThumbs)      domThumbs.hidden      = !multi;

    if (multi) buildThumbs(images, altText);

    /* Pre-load first two slides */
    lazyLoadAdjacent(0);
  }

  /* â”€â”€ Gallery: Navigate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function goToSlide(idx) {
    var len = galleryImages.length;
    if (!len) return;
    galleryIdx = ((idx % len) + len) % len;         /* wraps both directions */

    domGalleryTrack.style.transition = 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)';
    domGalleryTrack.style.transform  = 'translateX(-' + (galleryIdx * 100) + '%)';

    lazyLoadAdjacent(galleryIdx);
    updateThumbActive();
  }

  /* Eagerly load the current slide plus its neighbours */
  function lazyLoadAdjacent(idx) {
    var len = galleryImages.length;
    [-1, 0, 1].forEach(function (offset) {
      var i     = ((idx + offset) % len + len) % len;
      var slide = domGalleryTrack && domGalleryTrack.children[i];
      if (!slide) return;
      var img = slide.querySelector('.pqv-slide-img');
      if (img && img.dataset.lazySrc) {
        img.src = img.dataset.lazySrc;
        delete img.dataset.lazySrc;
      }
    });
  }

  /* â”€â”€ Gallery: Thumbnails â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function buildThumbs(images, altText) {
    if (!domThumbs) return;
    domThumbs.innerHTML = '';

    images.forEach(function (src, i) {
      var btn = document.createElement('button');
      btn.type      = 'button';
      btn.className = 'pqv-thumb' + (i === 0 ? ' is-active' : '');
      btn.setAttribute('aria-label', altText + ' â€” ' + (i + 1));

      var img = document.createElement('img');
      img.src     = thumbUrl(src);
      img.alt     = '';
      img.loading = 'lazy';
      img.width   = 140;
      img.height  = 140;

      btn.appendChild(img);
      btn.addEventListener('click', function () { goToSlide(i); });
      domThumbs.appendChild(btn);
    });
  }

  function updateThumbActive() {
    if (!domThumbs) return;
    var thumbs = domThumbs.querySelectorAll('.pqv-thumb');
    thumbs.forEach(function (t, i) {
      t.classList.toggle('is-active', i === galleryIdx);
    });
    var active = thumbs[galleryIdx];
    if (active) active.scrollIntoView({ inline: 'nearest', behavior: 'smooth', block: 'nearest' });
  }

  /* â”€â”€ Open Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function openModal(card) {
    if (!domDialog || !domOverlay) return;
    currentCard = card;
    qty = 1;

    var imgEl   = qs('.product-image-wrap img, .ll-prod-img-wrap img', card);
    var imgSrc  = imgEl ? (imgEl.getAttribute('src') || '') : '';
    var nameEl  = qs('.product-name, .ll-prod-name',       card);
    var descEl  = qs('.product-desc, .ll-prod-material',   card);
    var catEl   = qs('.product-category, .ll-prod-cat',    card);
    var priceEl = qs('.product-price, .ll-prod-price',     card);
    var oldPEl  = qs('.product-old-price, .ll-prod-old-price', card);

    var nameText     = nameEl  ? nameEl.textContent.trim()  : '';
    var oldPriceText = oldPEl  ? oldPEl.textContent.trim()  : '';

    if (domCat)   domCat.textContent  = catEl   ? catEl.textContent.trim()   : '';
    if (domName)  domName.textContent = nameText;
    if (domDesc)  domDesc.textContent = descEl  ? descEl.textContent.trim()  : '';
    if (domPrice) domPrice.textContent = priceEl ? priceEl.textContent.trim() : '';
    if (domOldPrice) {
      domOldPrice.textContent   = oldPriceText;
      domOldPrice.style.display = oldPriceText ? '' : 'none';
    }

    /* Build gallery â€” read image list from data-gallery (set by cms-loader) */
    var images = [];
    try {
      var raw = card.getAttribute('data-gallery');
      if (raw) images = JSON.parse(raw);
    } catch (e) { images = []; }
    if (!images.length && imgSrc) images = [imgSrc];
    buildGallery(images, nameText);

    if (domQtyNum) domQtyNum.textContent = '1';

    domOverlay.classList.add('is-open');
    domOverlay.setAttribute('aria-hidden', 'false');
    domDialog.classList.add('is-open');
    domDialog.setAttribute('aria-hidden', 'false');
    document.body.classList.add('pqv-open');

    resetAddBtn();
    setTimeout(function () { if (domClose) domClose.focus(); }, 60);
  }

  /* â”€â”€ Close Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function closeModal() {
    if (!domDialog || !domOverlay) return;
    domOverlay.classList.remove('is-open');
    domOverlay.setAttribute('aria-hidden', 'true');
    domDialog.classList.remove('is-open');
    domDialog.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('pqv-open');
  }

  /* â”€â”€ Add-to-cart helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function resetAddBtn() {
    if (!domAddBtn) return;
    domAddBtn.classList.remove('pqv-added');
    domAddBtn.disabled = false;
    domAddBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>' +
      ' áƒ™áƒáƒšáƒáƒ—áƒáƒ¨áƒ˜ áƒ“áƒáƒ›áƒáƒ¢áƒ”áƒ‘áƒ';
  }

  /* â”€â”€ Wire All Modal Controls (called once) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function wireModalControls() {
    if (!domDialog) return;

    /* â”€â”€ Close â”€â”€ */
    if (domClose)   domClose.addEventListener('click', closeModal);
    if (domOverlay) domOverlay.addEventListener('click', function (e) {
      if (e.target === domOverlay) closeModal();
    });

    /* â”€â”€ Gallery arrows â”€â”€ */
    if (domGalleryPrev) domGalleryPrev.addEventListener('click', function (e) {
      e.stopPropagation();
      goToSlide(galleryIdx - 1);
    });
    if (domGalleryNext) domGalleryNext.addEventListener('click', function (e) {
      e.stopPropagation();
      goToSlide(galleryIdx + 1);
    });

    /* â”€â”€ Swipe / touch â”€â”€ */
    if (domGallery) {
      var touchStartX = 0;
      var touchStartY = 0;
      var swiping     = false;

      domGallery.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        swiping     = false;
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

    /* â”€â”€ Keyboard â”€â”€ */
    document.addEventListener('keydown', function (e) {
      if (!domDialog || !domDialog.classList.contains('is-open')) return;
      if (e.key === 'Escape')                                  { closeModal(); return; }
      if (e.key === 'ArrowLeft'  && galleryImages.length > 1)  goToSlide(galleryIdx - 1);
      if (e.key === 'ArrowRight' && galleryImages.length > 1)  goToSlide(galleryIdx + 1);
    });

    /* â”€â”€ Quantity â”€â”€ */
    if (domQtyMinus) domQtyMinus.addEventListener('click', function () {
      if (qty > 1) { qty--; if (domQtyNum) domQtyNum.textContent = qty; }
    });
    if (domQtyPlus) domQtyPlus.addEventListener('click', function () {
      qty++;
      if (domQtyNum) domQtyNum.textContent = qty;
    });

    /* â”€â”€ Add to cart â”€â”€ */
    if (domAddBtn) {
      domAddBtn.addEventListener('click', function () {
        document.querySelectorAll('#cartBadge, .bottom-bar-badge, .ll-cart-badge').forEach(function (b) {
          b.textContent = (parseInt(b.textContent) || 0) + qty;
        });
        domAddBtn.classList.add('pqv-added');
        domAddBtn.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' +
          ' áƒ“áƒáƒ›áƒáƒ¢áƒ”áƒ‘áƒ£áƒšáƒ˜áƒ!';
        setTimeout(resetAddBtn, 2000);
      });
    }
  }

  /* â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  document.addEventListener('DOMContentLoaded', function () {
    cacheModalElements();
    setupTriggers();
    wireModalControls();
  });

  /* Re-wire triggers after CMS cards are injected into the DOM */
  window.loftQuickView = { init: setupTriggers };
  document.addEventListener('cms:ready', setupTriggers);

})();

