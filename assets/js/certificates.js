/* ═══ Certificates — visor + selector accesible (tabs) ═══ */

const certificates = {
  init() {
    const root = document.querySelector('.certs');
    if (!root) return;

    const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    if (!tabs.length || panels.some(panel => !panel)) return;

    const select = (index, moveFocus = false) => {
      tabs.forEach((tab, i) => {
        const active = i === index;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        panels[i].classList.toggle('is-active', active);
      });
      if (moveFocus) tabs[index].focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));

      tab.addEventListener('keydown', (e) => {
        const last = tabs.length - 1;
        let next = null;

        switch (e.key) {
          case 'ArrowDown':
          case 'ArrowRight': next = i === last ? 0 : i + 1; break;
          case 'ArrowUp':
          case 'ArrowLeft':  next = i === 0 ? last : i - 1; break;
          case 'Home':       next = 0; break;
          case 'End':        next = last; break;
          default: return;
        }

        e.preventDefault();
        select(next, true);
      });
    });
  }
};
