/* ============================================================
   LOFT LINE — Site Interactions
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const WA_NUMBER = '995599000000'; // Replace with real number

  // ── Header scroll elevation ──
  const header = document.querySelector('.ll-header');
  if (header) {
    const onScroll = () => header.classList.toggle('elevated', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Side drawer ──
  const overlay   = document.getElementById('llOverlay');
  const drawer    = document.getElementById('llDrawer');
  const hamburger = document.getElementById('llHamburger');
  const closeBtn  = document.getElementById('llDrawerClose');

  function openDrawer() {
    drawer?.classList.add('open');
    overlay?.classList.add('open');
    hamburger?.classList.add('open');
    hamburger?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
  }
  function closeDrawer() {
    drawer?.classList.remove('open');
    overlay?.classList.remove('open');
    hamburger?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }

  hamburger?.addEventListener('click', () =>
    drawer?.classList.contains('open') ? closeDrawer() : openDrawer()
  );
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  drawer?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
  });

  // ── Intersection Observer scroll animations ──
  const toAnimate = document.querySelectorAll('[data-animate], [data-animate-stagger]');
  if (toAnimate.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });
    toAnimate.forEach(el => observer.observe(el));
  }

  // ── Hero parallax ──
  const heroBg = document.querySelector('.ll-hero-bg');
  if (heroBg) {
    let raf = false;
    window.addEventListener('scroll', () => {
      if (!raf) {
        requestAnimationFrame(() => {
          const sy = window.scrollY;
          const h  = heroBg.closest('.ll-hero')?.offsetHeight || 700;
          if (sy < h) heroBg.style.transform = `translateY(${sy * 0.28}px) scale(1.15)`;
          raf = false;
        });
        raf = true;
      }
    }, { passive: true });
  }

  // ── "შეკვეთა" order button → WhatsApp ──
  document.querySelectorAll('.btn-order').forEach(btn => {
    btn.addEventListener('click', () => {
      const card     = btn.closest('.ll-product-card');
      const name     = card?.querySelector('.ll-prod-name')?.textContent?.trim() || 'პროდუქტი';
      const price    = card?.querySelector('.ll-prod-price')?.textContent?.trim() || '';
      const category = card?.querySelector('.ll-prod-cat')?.textContent?.trim()  || '';
      const text     = `გამარჯობა! მინდა შევუკვეთო:\n\n📦 ${name}\n${category ? '🏷 ' + category + '\n' : ''}💰 ${price}\n\nგთხოვთ, დამიკავშირდეთ.`;
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    });
  });

  // ── WhatsApp product card icon buttons ──
  document.querySelectorAll('.btn-wa').forEach(btn => {
    btn.addEventListener('click', () => {
      const card  = btn.closest('.ll-product-card');
      const name  = card?.querySelector('.ll-prod-name')?.textContent?.trim() || 'პროდუქტი';
      const price = card?.querySelector('.ll-prod-price')?.textContent?.trim() || '';
      const text  = `გამარჯობა! მაინტერესებს: ${name} — ${price}`;
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    });
  });

  // ── Highlight active nav ──
  const page = window.location.pathname.split('/').pop() || 'homepage.html';
  document.querySelectorAll('.ll-nav a, .ll-drawer-nav a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

});
