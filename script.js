// Script for navigation, theming, profile switching, image fallback, smooth scrolling, hamburger, back-to-top

(function(){
  // Helpers
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  // Elements
  const navToggle = $('#navToggle');
  const navList = $('#navList');
  const navLinks = $$('.nav-link');
  const viewBtns = $$('.view-profile');
  const backButtons = $$('.back-home');
  const homeSection = $('#home');
  const profileSections = $$('.profile-section');
  const backToTop = $('#backToTop');
  const themeToggle = $('#themeToggle');

  // Initialize theme from localStorage
  const storedTheme = localStorage.getItem('theme') || 'light';
  setTheme(storedTheme);

  // Nav toggle (mobile)
  navToggle.addEventListener('click', () => {
    navList.classList.toggle('open');
  });

  // Close mobile nav when clicking a nav link and navigate
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.target;
      if(navList.classList.contains('open')) navList.classList.remove('open');
      if(target === 'home') {
        showHome();
      } else {
        showProfile(target);
      }
    });
  });

  // View profile buttons on cards
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      showProfile(target);
      // scroll to top of profile smoothly
      document.getElementById(target).scrollIntoView({behavior:'smooth'});
    });
  });

  // Back buttons
  backButtons.forEach(btn => btn.addEventListener('click', showHome));

  // Show home
  function showHome(){
    homeSection.classList.remove('hidden');
    profileSections.forEach(s => {
      s.classList.add('hidden');
      s.setAttribute('aria-hidden','true');
    });
    window.scrollTo({top:0, behavior:'smooth'});
  }

  // Show profile container by id (profile-1, profile-2, profile-3)
  function showProfile(id){
    const target = document.getElementById(id);
    if(!target) return;
    homeSection.classList.add('hidden');
    profileSections.forEach(s => {
      if(s.id === id){
        s.classList.remove('hidden');
        s.setAttribute('aria-hidden','false');
      } else {
        s.classList.add('hidden');
        s.setAttribute('aria-hidden','true');
      }
    });
    // Ensure top visible
    target.scrollIntoView({behavior:'smooth'});
  }

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  });

  function setTheme(mode){
    if(mode === 'dark'){
      document.documentElement.setAttribute('data-theme','dark');
      themeToggle.textContent = 'Dark';
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeToggle.textContent = 'Light';
    }
  }

  // Smooth scroll for internal nav anchors (if used)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if(a){
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if(el) el.scrollIntoView({behavior:'smooth'});
    }
  });

  // Back to top visibility
  window.addEventListener('scroll', () => {
    if(window.scrollY > 300){
      backToTop.style.display = 'block';
    } else {
      backToTop.style.display = 'none';
    }
  });
  backToTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

  // Image fallback: if image not found, replace with SVG data URL with initials
  function setInitialFallback(img){
    if(!img) return;
    img.addEventListener('error', () => {
      const initials = img.dataset.initials || getInitialsFromAlt(img.alt || '');
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--accent-surface').trim() || '#F3EDE5';
      const fg = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#3E2723';
      const size = 240;
      const fontSize = Math.floor(size * 0.36);
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
        <rect width='100%' height='100%' fill='${bg}' rx='999'/>
        <text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-family='Arial, Verdana, sans-serif' font-size='${fontSize}' fill='${fg}' font-weight='700'>${escapeHtml(initials)}</text>
      </svg>`;
      const uri = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
      img.src = uri;
    });
    // If already failed previously (cached), ensure onerror triggered:
    if(!img.complete){
      // nothing
    }
  }

  function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function getInitialsFromAlt(text){
    const parts = text.trim().split(/\s+/).filter(Boolean);
    if(parts.length === 0) return '';
    if(parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Attach to all profile images
  $$('img[data-initials]').forEach(setInitialFallback);

  // Ensure profile sections that are empty are hidden (defensive)
  profileSections.forEach(section => {
    const hasContent = section.querySelector('.profile-content') && section.querySelector('.profile-content').children.length > 0;
    if(!hasContent){
      section.classList.add('hidden');
    }
  });

  // Keyboard accessibility: Esc closes mobile nav
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && navList.classList.contains('open')){
      navList.classList.remove('open');
    }
  });

  // Initial state: show home
  showHome();

  // Ensure no uncaught errors: wrap common event listener callbacks
  window.addEventListener('error', (ev) => {
    // swallow to avoid console noise for users; optionally could log
    // console.warn('Captured error:', ev.message);
  });
})();