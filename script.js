(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const home = $('#home');
  const profiles = $$('.profile-section');
  const views = [home, ...profiles];
  const navList = $('#navList');
  const navToggle = $('#navToggle');
  const toTop = $('#backToTop');

  /* ---------- Progress bar ---------- */
  const progress = document.createElement('div');
  progress.id = 'progress';
  document.body.prepend(progress);

  /* ---------- Foto gagal dimuat: tampilkan inisial ---------- */
  function fallback(img) {
    if (img.dataset.failed) return;
    img.dataset.failed = '1';
    img.style.display = 'none';
    const box = document.createElement('div');
    box.className = 'initials-fallback';
    box.textContent = img.dataset.initials || '';
    img.parentElement.appendChild(box);
  }
  $$('img[data-initials]').forEach(img => {
    img.addEventListener('error', () => fallback(img));
    if (img.complete && img.naturalWidth === 0) fallback(img);
  });

  /* ---------- Tema ---------- */
  const themeBtn = $('#themeToggle');
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    themeBtn.textContent = t === 'dark' ? 'Mode Terang' : 'Mode Gelap';
    try { localStorage.setItem('theme', t); } catch (e) {}
  }
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  setTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  themeBtn.addEventListener('click', () => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ---------- Menu mobile ---------- */
  navToggle.addEventListener('click', () => {
    const open = navList.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  /* ---------- Hitung angka statistik ---------- */
  function countUp(el, to) {
    const dur = 1100, t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Siapkan tiap halaman profil ---------- */
  profiles.forEach(sec => {
    // Statistik
    const exp = $$('.experience li, .organizations li', sec).length + $$('.work p', sec).length;
    const wins = $$('li', sec).filter(li => /^Juara/i.test(li.textContent.trim())).length;
    const comps = $$('.competitions li', sec).length;
    const edu = $$('.education .timeline li', sec).length;
    const items = [
      ['Pengalaman', exp],
      wins ? ['Juara', wins] : ['Lomba', comps],
      ['Jenjang pendidikan', edu]
    ].filter(i => i[1] > 0);
    const stats = document.createElement('div');
    stats.className = 'stats';
    items.forEach(([label, n]) => {
      const d = document.createElement('div');
      d.className = 'stat';
      d.innerHTML = '<b data-to="' + n + '">0</b><span>' + label + '</span>';
      stats.appendChild(d);
    });
    $('.profile-meta', sec).appendChild(stats);

    // Tandai juara
    $$('.bullets li', sec).forEach(li => {
      if (/^Juara/i.test(li.textContent.trim())) li.classList.add('win');
    });

    // Daftar panjang bisa dilipat
    $$('.bullets', sec).forEach(ul => {
      const lis = $$('li', ul);
      if (lis.length <= 6) return;
      ul.classList.add('collapsed');
      const b = document.createElement('button');
      b.className = 'btn toggle-list';
      b.textContent = 'Tampilkan semua (' + lis.length + ')';
      b.addEventListener('click', () => {
        const c = ul.classList.toggle('collapsed');
        b.textContent = c ? 'Tampilkan semua (' + lis.length + ')' : 'Ringkas daftar';
      });
      ul.after(b);
    });

    // Pindah ke profil lain
    const others = profiles.filter(p => p !== sec);
    const sw = document.createElement('div');
    sw.className = 'section switcher';
    sw.innerHTML = '<h3 class="switcher-title">Lihat profil lainnya</h3>';
    others.forEach(o => {
      const btn = document.createElement('button');
      btn.className = 'switch-btn';
      btn.dataset.target = o.id;
      btn.style.background = getComputedStyle(o).getPropertyValue('--accent') || '#3b5bdb';
      btn.innerHTML = $('.profile-name', o).textContent + '<small>' + $('.profile-field', o).textContent + '</small>';
      btn.addEventListener('click', () => show(o.id));
      sw.appendChild(btn);
    });
    $('.profile-content', sec).appendChild(sw);
  });

  // Warna tombol pindah profil ambil dari variabel (jaga-jaga getComputedStyle kosong)
  const accents = { 'profile-1': '#d6336c', 'profile-2': '#0c9f8e', 'profile-3': '#3b5bdb' };
  $$('.switch-btn').forEach(b => { b.style.background = accents[b.dataset.target]; });

  /* ---------- Reveal saat scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: .12 });
  $$('.section').forEach(s => io.observe(s));

  /* ---------- Pindah tampilan ---------- */
  function show(id, updateHash = true) {
    const target = views.find(v => v.id === id) || home;
    views.forEach(v => {
      const on = v === target;
      v.classList.toggle('hidden', !on);
      v.setAttribute('aria-hidden', String(!on));
    });
    $$('.nav-list .nav-link').forEach(a => a.classList.toggle('active', a.dataset.target === target.id));
    navList.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    if (updateHash) history.replaceState(null, '', '#' + target.id);
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

    if (target !== home) {
      $$('.stat b', target).forEach(b => countUp(b, +b.dataset.to));
    }
  }

  $$('.nav-link').forEach(a => a.addEventListener('click', e => { e.preventDefault(); show(a.dataset.target); }));
  $$('.view-profile').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); show(b.dataset.target); }));
  $$('.back-home').forEach(b => b.addEventListener('click', () => show('home')));

  /* ---------- Panel kartu: ketuk untuk buka (layar sentuh) ---------- */
  const cards = $$('.profile-card');
  cards.forEach(c => {
    c.addEventListener('click', () => {
      const wasOpen = c.classList.contains('is-open');
      cards.forEach(x => x.classList.remove('is-open'));
      if (!wasOpen) c.classList.add('is-open');
    });
    c.addEventListener('keydown', e => {
      if (e.key === 'Enter') show('profile-' + c.dataset.profile);
    });
  });

  /* ---------- Scroll: progress + tombol ke atas ---------- */
  function onScroll() {
    const h = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
    toTop.classList.toggle('show', scrollY > 400);
  }
  addEventListener('scroll', onScroll, { passive: true });
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Hash dan tombol back browser ---------- */
  addEventListener('hashchange', () => show(location.hash.slice(1), false));
  show(location.hash.slice(1) || 'home', false);
  onScroll();
})();
