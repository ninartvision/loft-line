/* header-scroll.js — supplemental scroll/menu handlers.
   NOTE: loft-line.js already handles these on all current pages.
   This file is kept as a standalone utility but is not loaded by any HTML page.
   If you include it, ensure you do NOT also include loft-line.js (they overlap). */
document.addEventListener('DOMContentLoaded', () => {
  // Sticky header — matches the real header ID injected by site-components.js
  const header = document.getElementById('llHeader');

  function handleScroll() {
    if (!header) return;
    header.classList.toggle('elevated', window.scrollY > 40);
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Mobile drawer — matches IDs injected by site-components.js
  const hamburgerBtn = document.getElementById('llHamburger');
  const mobileMenu   = document.getElementById('llDrawer');
  const mobileOverlay = document.getElementById('llOverlay');
  const mobileClose  = document.getElementById('llDrawerClose');

  function openMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    hamburgerBtn?.setAttribute('aria-expanded', 'true');
    hamburgerBtn?.classList.add('active');
    mobileOverlay?.classList.add('active');
    document.body.classList.add('menu-open');
  }

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburgerBtn?.setAttribute('aria-expanded', 'false');
    hamburgerBtn?.classList.remove('active');
    mobileOverlay?.classList.remove('active');
    document.body.classList.remove('menu-open');
  }

  hamburgerBtn?.addEventListener('click', () => {
    if (mobileMenu?.classList.contains('open')) closeMenu();
    else openMenu();
  });
  mobileClose?.addEventListener('click', closeMenu);
  mobileOverlay?.addEventListener('click', closeMenu);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileMenu?.classList.contains('open')) closeMenu();
  });

  // Close mobile menu on nav link click
  mobileMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
});
