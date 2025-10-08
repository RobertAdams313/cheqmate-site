// site.js — CheqMate static site
// - Screenshot strip scroller
// - Smooth in-page anchor scrolling

(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    // Screenshot strip scroller
    const strip = document.getElementById('shotStrip');
    if (strip) {
      const buttons = document.querySelectorAll('[data-scroll]');
      const step = () => Math.min(360, Math.floor(strip.clientWidth * 0.8));

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const dir = btn.getAttribute('data-scroll');
          strip.scrollBy({
            left: dir === 'next' ? step() : -step(),
            behavior: 'smooth'
          });
        });
      });
    }

    // Smooth in-page anchor scroll (e.g., #features, #pro)
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const el = document.querySelector(id);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  });
})();
