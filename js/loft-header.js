document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.getElementById('loftHamburger');
  const mobileMenu = document.getElementById('loftMobileMenu');
  const closeBtn = document.getElementById('loftMobileClose');

  hamburger?.addEventListener('click', function() {
    mobileMenu.classList.add('open');
    document.body.classList.add('loft-menu-open');
  });

  closeBtn?.addEventListener('click', function() {
    mobileMenu.classList.remove('open');
    document.body.classList.remove('loft-menu-open');
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileMenu?.classList.contains('open')) {
      mobileMenu.classList.remove('open');
      document.body.classList.remove('loft-menu-open');
    }
  });
});