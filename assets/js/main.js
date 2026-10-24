/* ═══ Main — Entry Point ═══ */

document.addEventListener('DOMContentLoaded', () => {
  /* Initialize all modules */
  i18n.init();
  navigation.init();
  parametric.init();
  animations.init();

  /* Lang switcher event listeners */
  document.querySelectorAll('.lang-switcher__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      i18n.setLang(btn.dataset.lang);
    });
  });

  /* Smooth scroll for anchor links */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - headerOffset,
          behavior: 'smooth'
        });
      }
    });
  });
});
