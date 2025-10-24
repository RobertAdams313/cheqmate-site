// site.js — CheqMate static site
// - Screenshot strip scroller
// - Smooth in-page anchor scrolling (with sticky header + banner offset)
// - Smart App Banner (custom)

/* =========================================
   Screenshot strip scroller
   ========================================= */
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

    /* ===============================
       Smooth in-page anchor scroll
       (accounts for sticky header & smart banner heights)
       =============================== */
    function headerHeight() {
      const header = document.querySelector('.site-header');
      // Smart banner may not be present or visible
      const banner = document.getElementById('smartbanner');
      const bannerVisible = banner && banner.classList.contains('show');
      const h = header ? header.getBoundingClientRect().height : 0;
      const b = bannerVisible ? banner.getBoundingClientRect().height : 0;
      return Math.round(h + b);
    }

    function scrollToWithOffset(el) {
      const rect = el.getBoundingClientRect();
      const target = window.pageYOffset + rect.top - headerHeight() - 6; // small extra pad
      window.scrollTo({ top: Math.max(target, 0), behavior: 'smooth' });
    }

    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const el = document.querySelector(id);
        if (el) {
          e.preventDefault();
          scrollToWithOffset(el);
        }
      });
    });
  });
})();

/* ===============================
   Smart Banner (Custom)
   =============================== */
(function(){
  const APP_STORE_URL = "https://apps.apple.com/app/id6751434695";
  const DEEP_LINK_URL = "cheqmate://";

  const DISMISS_KEY = "sb.dismissedAt";
  const DISMISS_DAYS = 90;

  const ua = navigator.userAgent || "";

  function daysSince(ts){ return (Date.now() - ts) / (1000 * 60 * 60 * 24); }
  function isiOS(){ return /iPhone|iPad|iPod/i.test(ua); }

  // Detect iOS Safari specifically (exclude Chrome/Fx/Edge on iOS)
  function isiOSSafari(){
    const isSafari = /Safari/i.test(ua) &&
                     !/CriOS/i.test(ua) &&
                     !/FxiOS/i.test(ua) &&
                     !/EdgiOS/i.test(ua);
    return isiOS() && isSafari;
  }

  function nativeBannerMetaPresent(){
    return !!document.querySelector('meta[name="apple-itunes-app"]');
  }

  function inStandalone(){
    return (window.navigator.standalone === true) ||
           window.matchMedia("(display-mode: standalone)").matches;
  }

  function alreadyDismissed(){
    const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return ts && daysSince(ts) < DISMISS_DAYS;
  }

  function showBanner(){
    const el = document.getElementById("smartbanner");
    if (!el) return;

    el.classList.add("show");
    el.setAttribute("aria-hidden", "false");

    const onOpen = (e) => {
      e.preventDefault();
      // Try deep link first; fall back to App Store quickly
      const failTimer = setTimeout(() => { window.location.href = APP_STORE_URL; }, 500);
      window.location.href = DEEP_LINK_URL;

      // If app opens, page loses visibility; cancel fallback
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) clearTimeout(failTimer);
      }, { once: true });
    };

    const onGet = (e) => {
      e.preventDefault();
      window.location.href = APP_STORE_URL;
    };

    const onClose = () => {
      el.classList.remove("show");
      el.setAttribute("aria-hidden", "true");
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };

    el.querySelector(".smartbanner__open")?.addEventListener("click", onOpen);
    el.querySelector(".smartbanner__get")?.addEventListener("click", onGet);
    el.querySelector(".smartbanner__close")?.addEventListener("click", onClose);
  }

  // Gate: iOS browsers only, not PWA/standalone, not dismissed recently.
  // Avoid double banner on iOS Safari when native <meta name="apple-itunes-app"> is present.
  const shouldShowCustom =
      isiOS() &&
      !inStandalone() &&
      !alreadyDismissed() &&
      !(isiOSSafari() && nativeBannerMetaPresent());

  if (shouldShowCustom){
    window.addEventListener("DOMContentLoaded", showBanner, { once: true });
  }
})();

window.addEventListener("scroll", () => {
  document.body.classList.toggle("scrolled", window.scrollY > 4);
});
