/**
 * site-components.js
 * Single source of truth for the shared header (announce + header + overlay + drawer)
 * and shared footer across all category pages.
 *
 * Usage in each page:
 *   1. Place <div id="site-header"></div> at the very start of <body>
 *   2. Place <script src="js/site-components.js"></script> immediately after it
 *      → header is injected synchronously (no flash of unstyled content)
 *   3. Place <div id="site-footer"></div> just before the bottom <script> block
 *      → footer is injected via the DOMContentLoaded listener (fires before
 *        language-switch.js's own DOMContentLoaded listener)
 *
 * To update header or footer site-wide: edit HEADER_HTML or FOOTER_HTML below.
 */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────────────
     SHARED HEADER
     Includes: announcement bar · sticky header · mobile overlay · side drawer
     Do NOT add class="active" here — setActiveLinks() handles it dynamically.
     ───────────────────────────────────────────────────────────────────────── */
  var HEADER_HTML = `
<div class="ll-announce" data-i18n="announce_loft_full">🚚 უფასო მიტანა ₾200+ შეკვეთაზე &nbsp;•&nbsp; ხელნაკეთი ლოფტ ავეჯი</div>

<header class="ll-header" id="llHeader">
  <div class="container">
    <div class="ll-header-inner">
      <a href="index.html" class="ll-logo" aria-label="Loft Line მთავარი">
        <span class="ll-logo-main">Loft</span>
        <span class="ll-logo-sub">line</span>
      </a>
      <nav class="ll-nav" aria-label="მთავარი ნავიგაცია">
        <a href="index.html" data-i18n="nav_home">მთავარი</a>
        <a href="main-furniture.html" data-i18n="nav_main_furniture">მთავარი ავეჯი</a>
        <a href="office-furniture.html" data-i18n="nav_office_full">საოფისე ავეჯი</a>
        <a href="loft-collection.html" data-i18n="nav_loft_collection">ლოფტ კოლექცია</a>
        <a href="lighting.html" data-i18n="nav_lighting">განათება</a>
        <a href="decoration.html" data-i18n="nav_decoration">დეკორაცია</a>
        <a href="index.html#contact-form" data-i18n="nav_contact">კონტაქტი</a>
      </nav>
      <div class="ll-header-actions">
        <button class="ll-icon-btn" aria-label="ძიება">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
        <button id="langToggle" class="ll-lang-btn" aria-label="ენა">KA</button>
        <button class="ll-icon-btn ll-cart-btn" aria-label="კალათა">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span class="ll-cart-badge" id="cartBadge">0</span>
        </button>
        <a href="https://wa.me/995579388833" target="_blank" rel="noopener" class="ll-wa-header-btn" aria-label="WhatsApp">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.975 0C5.361 0 0 5.359 0 11.975c0 2.094.549 4.062 1.508 5.773L.055 23.455a.477.477 0 0 0 .574.603l5.898-1.543C8.163 23.43 10.047 24 11.975 24 18.589 24 24 18.641 24 12.025 24 5.41 18.589 0 11.975 0zm0 21.897c-1.84 0-3.596-.502-5.109-1.451l-.365-.217-3.783.99 1.008-3.666-.239-.378A9.916 9.916 0 0 1 2.079 12.025c0-5.463 4.44-9.901 9.896-9.901 5.456 0 9.896 4.438 9.896 9.901 0 5.462-4.44 9.872-9.896 9.872z"/></svg>
          <span class="wa-label">WhatsApp</span>
        </a>
        <button class="ll-hamburger" id="llHamburger" aria-label="მენიუ" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </div>
</header>

<div class="ll-overlay" id="llOverlay" aria-hidden="true"></div>
<nav class="ll-drawer" id="llDrawer" aria-label="გვერდითი მენიუ" aria-hidden="true">
  <div class="ll-drawer-head">
    <span class="ll-drawer-logo">Loft <span>Line</span></span>
    <button class="ll-drawer-close" id="llDrawerClose" aria-label="დახურვა">&#x2715;</button>
  </div>
  <span class="ll-drawer-section-label" data-i18n="drawer_categories">კატეგორიები</span>
  <div class="ll-drawer-nav">
    <a href="index.html"><svg class="dn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span data-i18n="nav_home">მთავარი</span><svg class="dn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></a>
    <a href="main-furniture.html"><svg class="dn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.059 7H3.941A.94.94 0 003 7.94v2.12C3 10.58 3.42 11 3.941 11H20.06A.94.94 0 0021 10.059V7.94A.94.94 0 0020.059 7z"/><path d="M5 11v6m14-6v6M3 17h18"/></svg><span data-i18n="nav_main_furniture">მთავარი ავეჯი</span><svg class="dn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></a>
    <a href="office-furniture.html"><svg class="dn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg><span data-i18n="nav_office_full">საოფისე ავეჯი</span><svg class="dn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></a>
    <a href="loft-collection.html"><svg class="dn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg><span data-i18n="nav_loft_collection">ლოფტ კოლექცია</span><svg class="dn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></a>
    <a href="lighting.html"><svg class="dn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg><span data-i18n="nav_lighting">განათება</span><svg class="dn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></a>
    <a href="decoration.html"><svg class="dn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22c4.97 0 9-3.134 9-7s-4.03-7-9-7-9 3.134-9 7 4.03 7 9 7z"/><path d="M12 8V2m0 0L9 5m3-3 3 3"/></svg><span data-i18n="nav_decoration">დეკორაცია</span><svg class="dn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></a>
  </div>
  <div class="ll-drawer-footer">
    <a href="https://wa.me/995579388833?text=გამარჯობა! მინდა შეკვეთა." target="_blank" rel="noopener" class="ll-drawer-wa">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.975 0C5.361 0 0 5.359 0 11.975c0 2.094.549 4.062 1.508 5.773L.055 23.455a.477.477 0 0 0 .574.603l5.898-1.543C8.163 23.43 10.047 24 11.975 24 18.589 24 24 18.641 24 12.025 24 5.41 18.589 0 11.975 0zm0 21.897c-1.84 0-3.596-.502-5.109-1.451l-.365-.217-3.783.99 1.008-3.666-.239-.378A9.916 9.916 0 0 1 2.079 12.025c0-5.463 4.44-9.901 9.896-9.901 5.456 0 9.896 4.438 9.896 9.901 0 5.462-4.44 9.872-9.896 9.872z"/></svg>
      <span data-i18n="drawer_wa_btn">შეგვიკვეთეთ WhatsApp-ზე</span>
    </a>
  </div>
</nav>`;

  /* ─────────────────────────────────────────────────────────────────────────
     SHARED FOOTER
     Uses footer_ll_* translation keys (all confirmed present in translations.js).
     ───────────────────────────────────────────────────────────────────────── */
  var FOOTER_HTML = `
<footer class="ll-footer">
  <div class="container">
    <div class="ll-footer-grid">
      <div class="ll-footer-brand">
        <div class="ll-footer-logo"><span class="ll-fl-main">Loft</span><span class="ll-fl-sub">line</span></div>
        <p data-i18n="footer_ll_brand_desc">პრემიუმ ლოფტ სტილის ხელნაკეთი ავეჯი ხისა და შავი ლითონისგან.</p>
        <div class="ll-footer-social">
          <a href="#" aria-label="Facebook"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></a>
          <a href="#" aria-label="Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
        </div>
      </div>
      <div class="ll-footer-col">
        <h4 data-i18n="footer_ll_categories">კატეგორიები</h4>
        <ul>
          <li><a href="main-furniture.html" data-i18n="nav_main_furniture">მთავარი ავეჯი</a></li>
          <li><a href="office-furniture.html" data-i18n="nav_office_full">საოფისე ავეჯი</a></li>
          <li><a href="loft-collection.html" data-i18n="nav_loft_collection">ლოფტ კოლექცია</a></li>
          <li><a href="lighting.html" data-i18n="nav_lighting">განათება</a></li>
          <li><a href="decoration.html" data-i18n="nav_decoration">დეკორაცია</a></li>
        </ul>
      </div>
      <div class="ll-footer-col">
        <h4 data-i18n="footer_ll_info">ინფორმაცია</h4>
        <ul>
          <li><a href="index.html#about" data-i18n="footer_ll_about">ჩვენ შესახებ</a></li>
          <li><a href="#" data-i18n="footer_ll_delivery">მიტანის პირობები</a></li>
          <li><a href="#" data-i18n="footer_ll_warranty">გარანტია</a></li>
          <li><a href="index.html#contact-form" data-i18n="nav_contact">კონტაქტი</a></li>
        </ul>
      </div>
      <div class="ll-footer-col">
        <h4 data-i18n="footer_ll_contact">კონტაქტი</h4>
        <ul class="ll-footer-contact">
          <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.61 8.73 19.79 19.79 0 01.75 5.18 2 2 0 012.72 3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 10.1a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>+995 579 388 833</li>
          <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>info@loftline.ge</li>
        </ul>
      </div>
    </div>
    <div class="ll-footer-bottom">
      <span data-i18n="footer_ll_copyright">&copy; 2026 Loft Line.</span>
      <span>Made with ♥ in Georgia</span>
    </div>
  </div>
</footer>`;

  /* ─────────────────────────────────────────────────────────────────────────
     Active nav link — called after each injection
     ───────────────────────────────────────────────────────────────────────── */
  function setActiveLinks() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.ll-nav a, .ll-drawer-nav a').forEach(function (a) {
      if (a.getAttribute('href') === page) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────────────────
     1. Inject header synchronously (this script runs right after the
        <div id="site-header"> placeholder, so the element is already in DOM)
     ───────────────────────────────────────────────────────────────────────── */
  var headerEl = document.getElementById('site-header');
  if (headerEl) {
    headerEl.outerHTML = HEADER_HTML;
    setActiveLinks();
  }

  /* ─────────────────────────────────────────────────────────────────────────
     2. Inject footer at DOMContentLoaded.
        This listener is registered BEFORE language-switch.js loads, so it
        fires first — footer elements are in DOM when language-switch runs init().
     ───────────────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var footerEl = document.getElementById('site-footer');
    if (footerEl) {
      footerEl.outerHTML = FOOTER_HTML;
      setActiveLinks();
    }
  });

}());
