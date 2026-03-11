/* ============================================================
   LOFT LINE — Product Quick View System
   Handles: color swatches in cards + quick view modal
   Works on: index.html (product-card) + all loft pages (ll-product-card)
   ============================================================ */
(function () {
  'use strict';

  /* ── Color Palette ─────────────────────────────────────────────────────────
     Each entry: swatch hex color, overlay blend for image simulation,
     and a CSS filter for thumbnail preview images.
  ──────────────────────────────────────────────────────────────────────────── */
  /* Order matches user spec: Black, Dark Brown, Light Oak, White, Grey */
  var COLORS = [
    {
      id: 'black',
      name: 'შავი',
      hex: '#1c1c1c',
      blend: '#0a0a0a',
      blendMode: 'multiply',
      blendOpacity: 0.7,
      thumbFilter: 'brightness(0.18) saturate(0.08) contrast(1.15)'
    },
    {
      id: 'brown',
      name: 'მუქი ყავი',
      hex: '#5c3010',
      blend: '#3a1a06',
      blendMode: 'multiply',
      blendOpacity: 0.52,
      thumbFilter: 'sepia(90%) saturate(220%) brightness(0.58) hue-rotate(-10deg)'
    },
    {
      id: 'oak',
      name: 'ნათელი მუხა',
      hex: '#c8a879',
      blend: null,
      blendMode: null,
      blendOpacity: 0,
      thumbFilter: 'none'
    },
    {
      id: 'white',
      name: 'თეთრი',
      hex: '#f0ece4',
      blend: '#ffffff',
      blendMode: 'screen',
      blendOpacity: 0.58,
      thumbFilter: 'brightness(1.85) saturate(0.12) contrast(0.82)'
    },
    {
      id: 'grey',
      name: 'ნაცრისფერი',
      hex: '#6e6e6e',
      blend: '#3a3a3a',
      blendMode: 'multiply',
      blendOpacity: 0.4,
      thumbFilter: 'saturate(0.08) brightness(0.68) contrast(1.1)'
    }
  ];

  /* ── State ──────────────────────────────────────────────────────────────── */
  var currentCard = null;
  var selectedColorIdx = 0;
  var qty = 1;

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  function applyOverlay(overlayEl, colorIdx) {
    var c = COLORS[colorIdx];
    if (!overlayEl) return;
    if (!c.blend) {
      overlayEl.style.opacity = '0';
    } else {
      overlayEl.style.backgroundColor = c.blend;
      overlayEl.style.mixBlendMode = c.blendMode;
      overlayEl.style.opacity = c.blendOpacity;
    }
  }

  /* ── Inject Card Overlays (used by modal color sync only) ───────────────── */
  function injectSwatchesIntoCards() {
    var cards = qsa('.product-card, .ll-product-card');

    cards.forEach(function (card) {
      /* Inject overlay into image wrapper — used by modal to tint card image */
      var imgWrap = qs('.product-image-wrap, .ll-prod-img-wrap', card);
      if (imgWrap && !qs('.pqv-card-overlay', imgWrap)) {
        var ov = document.createElement('div');
        ov.className = 'pqv-card-overlay';
        imgWrap.appendChild(ov);
      }
      /* No swatches injected into cards — colors appear only inside the popup */
    });
  }

  /* ── Wire Up Click Triggers ─────────────────────────────────────────────── */
  function setupTriggers() {
    qsa('.product-card, .ll-product-card').forEach(function (card) {
      /* Quick view button */
      var qvBtn = qs('.product-quick-view, .ll-quick-view', card);
      if (qvBtn) {
        qvBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          openModal(card);
        });
      }

      /* Image wrap click */
      var imgWrap = qs('.product-image-wrap, .ll-prod-img-wrap', card);
      if (imgWrap) {
        imgWrap.style.cursor = 'pointer';
        imgWrap.addEventListener('click', function () {
          openModal(card);
        });
      }
    });
  }

  /* ── Modal Elements ─────────────────────────────────────────────────────── */
  var domOverlay, domDialog, domClose;
  var domMainImg, domImgOverlay, domThumbs;
  var domCat, domName, domDesc, domPrice, domOldPrice;
  var domColorName, domModalSwatches;
  var domQtyMinus, domQtyNum, domQtyPlus;
  var domAddBtn;

  function cacheModalElements() {
    domOverlay       = document.getElementById('pqvOverlay');
    domDialog        = document.getElementById('pqvDialog');
    domClose         = document.getElementById('pqvClose');
    domMainImg       = document.getElementById('pqvMainImg');
    domImgOverlay    = document.getElementById('pqvImgOverlay');
    domThumbs        = document.getElementById('pqvThumbs');
    domCat           = document.getElementById('pqvCat');
    domName          = document.getElementById('pqvName');
    domDesc          = document.getElementById('pqvDesc');
    domPrice         = document.getElementById('pqvPrice');
    domOldPrice      = document.getElementById('pqvOldPrice');
    domColorName     = document.getElementById('pqvColorName');
    domModalSwatches = document.getElementById('pqvModalSwatches');
    domQtyMinus      = document.getElementById('pqvQtyMinus');
    domQtyNum        = document.getElementById('pqvQtyNum');
    domQtyPlus       = document.getElementById('pqvQtyPlus');
    domAddBtn        = document.getElementById('pqvAddBtn');
  }

  /* ── Open Modal ─────────────────────────────────────────────────────────── */
  function openModal(card) {
    if (!domDialog || !domOverlay) return;

    currentCard = card;
    qty = 1;

    /* Read active color from card swatches */
    var activeSwatch = qs('.pqv-swatch.is-active', card);
    selectedColorIdx = activeSwatch ? (parseInt(activeSwatch.getAttribute('data-pqv-idx')) || 0) : 0;

    /* Extract values from card DOM */
    var imgEl    = qs('.product-image-wrap img, .ll-prod-img-wrap img', card);
    var imgSrc   = imgEl ? imgEl.getAttribute('src') : '';
    var nameEl   = qs('.product-name, .ll-prod-name', card);
    var descEl   = qs('.product-desc, .ll-prod-material', card);
    var catEl    = qs('.product-category, .ll-prod-cat', card);
    var priceEl  = qs('.product-price, .ll-prod-price', card);
    var oldPEl   = qs('.product-old-price, .ll-prod-old-price', card);

    var nameText     = nameEl  ? nameEl.textContent.trim()  : '';
    var descText     = descEl  ? descEl.textContent.trim()  : '';
    var catText      = catEl   ? catEl.textContent.trim()   : '';
    var priceText    = priceEl ? priceEl.textContent.trim() : '';
    var oldPriceText = oldPEl  ? oldPEl.textContent.trim()  : '';

    /* Populate main image */
    if (domMainImg) {
      domMainImg.src = imgSrc;
      domMainImg.alt = nameText;
    }

    /* Populate text */
    if (domCat)   domCat.textContent = catText;
    if (domName)  domName.textContent = nameText;
    if (domDesc)  domDesc.textContent = descText;
    if (domPrice) domPrice.textContent = priceText;
    if (domOldPrice) {
      domOldPrice.textContent = oldPriceText;
      domOldPrice.style.display = oldPriceText ? '' : 'none';
    }

    /* Quantity reset */
    if (domQtyNum) domQtyNum.textContent = '1';

    /* Build thumbnails — color preview variants */
    if (domThumbs) {
      domThumbs.innerHTML = '';
      COLORS.slice(0, 4).forEach(function (color, i) {
        var imgThumb = document.createElement('img');
        imgThumb.src = imgSrc;
        imgThumb.alt = color.name;
        imgThumb.className = 'pqv-thumb' + (i === selectedColorIdx ? ' is-active' : '');
        imgThumb.style.filter = color.thumbFilter;
        imgThumb.loading = 'lazy';
        imgThumb.addEventListener('click', function () {
          selectColor(i);
          domThumbs.querySelectorAll('.pqv-thumb').forEach(function (t) { t.classList.remove('is-active'); });
          imgThumb.classList.add('is-active');
        });
        domThumbs.appendChild(imgThumb);
      });
    }

    /* Build modal swatches */
    if (domModalSwatches) {
      domModalSwatches.innerHTML = '';
      COLORS.forEach(function (color, i) {
        var btn = document.createElement('button');
        btn.className = 'pqv-mswatch' + (i === selectedColorIdx ? ' is-active' : '');
        btn.style.cssText = 'background:' + color.hex + ';';
        btn.setAttribute('title', color.name);
        btn.setAttribute('aria-label', color.name);
        btn.setAttribute('type', 'button');
        btn.addEventListener('click', function () { selectColor(i); });
        domModalSwatches.appendChild(btn);
      });
    }

    /* Apply default color */
    selectColor(selectedColorIdx, false);

    /* Show modal */
    domOverlay.classList.add('is-open');
    domOverlay.setAttribute('aria-hidden', 'false');
    domDialog.classList.add('is-open');
    domDialog.setAttribute('aria-hidden', 'false');
    document.body.classList.add('pqv-open');

    /* Reset add button */
    resetAddBtn();

    /* Accessibility focus */
    setTimeout(function () { if (domClose) domClose.focus(); }, 60);
  }

  /* ── Select Color ───────────────────────────────────────────────────────── */
  function selectColor(idx, syncCard) {
    if (syncCard === undefined) syncCard = true;
    selectedColorIdx = idx;
    var color = COLORS[idx];

    /* Color label */
    if (domColorName) domColorName.textContent = color.name;

    /* Modal image overlay */
    applyOverlay(domImgOverlay, idx);

    /* Modal swatches active state */
    if (domModalSwatches) {
      domModalSwatches.querySelectorAll('.pqv-mswatch').forEach(function (s, i) {
        s.classList.toggle('is-active', i === idx);
      });
    }

    /* Thumbnails active state */
    if (domThumbs) {
      domThumbs.querySelectorAll('.pqv-thumb').forEach(function (t, i) {
        t.classList.toggle('is-active', i === idx);
      });
    }

    /* Sync card color if desired */
    if (syncCard && currentCard) {
      applyOverlay(qs('.pqv-card-overlay', currentCard), idx);
      var cardSwatches = qsa('.pqv-swatch', currentCard);
      cardSwatches.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
    }
  }

  /* ── Close Modal ────────────────────────────────────────────────────────── */
  function closeModal() {
    if (!domDialog || !domOverlay) return;
    domOverlay.classList.remove('is-open');
    domOverlay.setAttribute('aria-hidden', 'true');
    domDialog.classList.remove('is-open');
    domDialog.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('pqv-open');
  }

  /* ── Add-to-cart helpers ────────────────────────────────────────────────── */
  function resetAddBtn() {
    if (!domAddBtn) return;
    domAddBtn.classList.remove('pqv-added');
    domAddBtn.disabled = false;
    domAddBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>' +
      ' კალათაში დამატება';
  }

  /* ── Event: Close ───────────────────────────────────────────────────────── */
  function wireModalControls() {
    if (!domDialog) return;

    if (domClose) domClose.addEventListener('click', closeModal);

    if (domOverlay) {
      domOverlay.addEventListener('click', function (e) {
        if (e.target === domOverlay) closeModal();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && domDialog.classList.contains('is-open')) closeModal();
    });

    /* Quantity */
    if (domQtyMinus) {
      domQtyMinus.addEventListener('click', function () {
        if (qty > 1) { qty--; if (domQtyNum) domQtyNum.textContent = qty; }
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
        /* Update cart badges */
        var badges = document.querySelectorAll('#cartBadge, .bottom-bar-badge, .ll-cart-badge');
        badges.forEach(function (badge) {
          badge.textContent = (parseInt(badge.textContent) || 0) + qty;
        });

        domAddBtn.classList.add('pqv-added');
        domAddBtn.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' +
          ' დამატებულია!';

        setTimeout(resetAddBtn, 2000);
      });
    }
  }

  /* ── Init ───────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    cacheModalElements();
    injectSwatchesIntoCards();
    setupTriggers();
    wireModalControls();
  });

})();
