/* ═══ Navigation — Header scroll, Mobile menu ═══ */

const navigation = {
  header: null,
  mobileBtn: null,
  mobileMenu: null,
  scrollThreshold: 40,

  init() {
    this.header = document.getElementById('site-header');
    this.mobileBtn = document.querySelector('.mobile-menu-btn');
    this.mobileMenu = document.querySelector('.mobile-menu');

    if (!this.header) return;

    /* Scroll behavior */
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.onScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    /* Mobile menu */
    if (this.mobileBtn && this.mobileMenu) {
      this.mobileBtn.addEventListener('click', () => this.toggleMobile());

      /* Close on nav link click */
      this.mobileMenu.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => this.closeMobile());
      });

      /* Close on Escape */
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isMobileOpen()) {
          this.closeMobile();
          this.mobileBtn.focus();
        }
      });
    }

    /* Active nav highlight on scroll */
    this.initScrollSpy();

    /* Initial scroll check */
    this.onScroll();
  },

  onScroll() {
    if (!this.header) return;
    const scrolled = window.scrollY > this.scrollThreshold;
    this.header.classList.toggle('is-scrolled', scrolled);
  },

  isMobileOpen() {
    return this.mobileMenu?.classList.contains('is-open');
  },

  toggleMobile() {
    if (this.isMobileOpen()) {
      this.closeMobile();
    } else {
      this.openMobile();
    }
  },

  openMobile() {
    if (!this.mobileMenu || !this.mobileBtn) return;
    this.mobileMenu.classList.add('is-open');
    this.mobileBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    /* Focus first link */
    const firstLink = this.mobileMenu.querySelector('.nav__link');
    if (firstLink) firstLink.focus();
  },

  closeMobile() {
    if (!this.mobileMenu || !this.mobileBtn) return;
    this.mobileMenu.classList.remove('is-open');
    this.mobileBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  },

  initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__link[href^="#"]');

    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, {
      rootMargin: '-30% 0px -60% 0px',
      threshold: 0
    });

    sections.forEach(section => observer.observe(section));
  }
};
