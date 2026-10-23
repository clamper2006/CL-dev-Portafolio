/* ═══ Orbital 3D — Hero Animation ═══ */

const orbital = {
  container: null,
  mouseX: 0,
  mouseY: 0,
  currentX: 0,
  currentY: 0,
  isReducedMotion: false,
  rafId: null,

  init() {
    this.container = document.querySelector('.orbital-container');
    if (!this.container) return;

    /* Check reduced motion preference */
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (this.isReducedMotion) {
      /* Show static orbital without animation */
      this.container.style.opacity = '1';
      this.container.style.transform = 'scale(1)';
      this.container.querySelectorAll('.orbital-ring').forEach(ring => {
        ring.style.animationPlayState = 'paused';
      });
      this.container.querySelectorAll('.orbital-node').forEach(node => {
        node.style.opacity = '1';
      });
      return;
    }

    /* Parallax on desktop only */
    if (!this.isTouchDevice()) {
      document.addEventListener('mousemove', (e) => {
        this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });

      this.animate();
    }

    /* Pause when tab hidden */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  },

  isTouchDevice() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  },

  animate() {
    if (!this.container || document.hidden) return;

    /* Lerp towards mouse position */
    const lerpFactor = 0.03;
    this.currentX += (this.mouseX - this.currentX) * lerpFactor;
    this.currentY += (this.mouseY - this.currentY) * lerpFactor;

    /* Apply subtle tilt (max ±8deg) */
    const tiltX = this.currentY * -8;
    const tiltY = this.currentX * 8;

    this.container.style.transform = `scale(1) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

    this.rafId = requestAnimationFrame(() => this.animate());
  },

  pause() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    /* Pause CSS animations */
    if (this.container) {
      this.container.querySelectorAll('.orbital-ring').forEach(ring => {
        ring.style.animationPlayState = 'paused';
      });
    }
  },

  resume() {
    if (this.isReducedMotion) return;

    /* Resume CSS animations */
    if (this.container) {
      this.container.querySelectorAll('.orbital-ring').forEach(ring => {
        ring.style.animationPlayState = 'running';
      });
    }

    if (!this.rafId && !this.isTouchDevice()) {
      this.animate();
    }
  },

  destroy() {
    this.pause();
    this.container = null;
  }
};
