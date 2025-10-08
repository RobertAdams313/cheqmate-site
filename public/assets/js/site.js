// Minimal JS: scroll the screenshot strip with arrow buttons
document.addEventListener('DOMContentLoaded', () => {
  const strip = document.getElementById('shotStrip');
  const buttons = document.querySelectorAll('[data-scroll]');
  if (!strip) return;

  const step = () => Math.min(360, strip.clientWidth * 0.8);

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.getAttribute('data-scroll');
      strip.scrollBy({ left: dir === 'next' ? step() : -step(), behavior: 'smooth' });
    });
  });
});
