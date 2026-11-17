(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // curtain + progress bar
  document.body.insertAdjacentHTML('afterbegin', '<div class="page-curtain" aria-hidden="true"></div><div class="progress" aria-hidden="true"></div>');
  const curtain = $('.page-curtain'), bar = $('.progress'), header = $('#header');

  // header, progress
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    header?.classList.toggle('scrolled', scrollY > 24);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // mobile menu
  const burger = $('.burger'), nav = $('#nav');
  const setMenu = (open) => { nav.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : ''; };
  burger?.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // page transition on internal links
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || reduce || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname || !/\.html$|\/$/.test(url.pathname)) return;
    e.preventDefault(); curtain.classList.add('leaving');
    setTimeout(() => { location.href = a.href; }, 420);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) curtain.classList.remove('leaving'); });

  // reveal on scroll (auto-stagger siblings)
  const targets = $$('[data-reveal]');
  const groups = new Map();
  targets.forEach((el) => {
    if (el.style.getPropertyValue('--d')) return;
    const p = el.parentElement; const i = groups.get(p) || 0; groups.set(p, i + 1);
    el.style.setProperty('--d', Math.min(i * 0.09, 0.5) + 's');
  });
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((el) => io.observe(el));
  } else targets.forEach((el) => el.classList.add('in'));

  // counters
  const count = (el) => {
    const end = +el.dataset.count, dur = 1600, t0 = performance.now();
    const tick = (t) => { const k = Math.min((t - t0) / dur, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))).toLocaleString('ru-RU') + (el.dataset.suffix || ''); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  const cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { count(e.target); cio.unobserve(e.target); } }), { threshold: 0.6 });
  $$('[data-count]').forEach((el) => reduce ? (el.textContent = (+el.dataset.count).toLocaleString('ru-RU') + (el.dataset.suffix || '')) : cio.observe(el));

  // spotlight glow follows cursor (event delegation, works for dynamic cards)
  document.addEventListener('pointermove', (e) => {
    const c = e.target.closest?.('[data-glow]'); if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  // hero parallax for floating pieces
  const art = $('.hero-art');
  if (art && !reduce) $('.hero')?.addEventListener('pointermove', (e) => {
    const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    art.style.transform = `translate(${x * -22}px,${y * -22}px)`;
  });
  if (art) art.style.transition = 'transform .4s ease-out';
})();
