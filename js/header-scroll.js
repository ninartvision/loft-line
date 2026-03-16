document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('siteHeader');

  // Sticky header on scroll
  function handleScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 120);
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Mobile menu
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileOverlay = document.getElementById('mobileMenuOverlay');
  const mobileClose = document.getElementById('mobileMenuClose');

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
