/* ═══ Scroll Reveal Animations ═══ */

const animations = {
  observer: null,

  init() {
    const items = document.querySelectorAll('[data-reveal], [data-reveal-group]');

    /* Show all elements immediately when motion is reduced
       or when IntersectionObserver is not available */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !('IntersectionObserver' in window)) {
      items.forEach(el => {
        el.classList.add('is-visible');
      });
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -50px 0px'
    });

    items.forEach(el => {
      this.observer.observe(el);
    });
  },

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
};
