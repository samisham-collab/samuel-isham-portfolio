// ============ Theme toggle ============
(function () {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const iconMoon = document.getElementById('iconMoon');
  const iconSun = document.getElementById('iconSun');

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    iconMoon.style.display = theme === 'dark' ? 'block' : 'none';
    iconSun.style.display = theme === 'light' ? 'block' : 'none';
    try { localStorage.setItem('portfolio-theme', theme); } catch (e) {}
  }

  let saved = 'dark';
  try { saved = localStorage.getItem('portfolio-theme') || 'dark'; } catch (e) {}
  apply(saved);

  toggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    apply(current);
  });
})();

// ============ Nav scroll state + active link ============
(function () {
  const nav = document.getElementById('nav');
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('main .section, .hero');
  const progressBar = document.getElementById('progressBar');
  const toTop = document.getElementById('toTop');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
    toTop.classList.toggle('visible', window.scrollY > 500);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
  }, { passive: true });

  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });

  sections.forEach((s) => observer.observe(s));
})();

// ============ Mobile menu ============
(function () {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
})();

// ============ Scroll reveal ============
(function () {
  const items = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach((item) => observer.observe(item));
})();

// ============ Hero spotlight follows cursor ============
(function () {
  const hero = document.querySelector('.hero');
  const spotlight = document.getElementById('spotlight');
  if (!hero || !spotlight) return;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    spotlight.style.setProperty('--x', x + '%');
    spotlight.style.setProperty('--y', y + '%');
  });
})();

// ============ Typewriter ============
(function () {
  const el = document.getElementById('typed');
  if (!el) return;
  const phrases = [
    'IT Assistant.',
    'Network Technician.',
    'Aspiring Software Developer.',
    'Problem Solver.',
    'sudo make it work.'
  ];
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const current = phrases[phraseIndex];
    if (!deleting) {
      charIndex++;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tick, 1500);
        return;
      }
    } else {
      charIndex--;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    }
    setTimeout(tick, deleting ? 35 : 65);
  }
  tick();
})();

// ============ Interactive terminal ============
(function () {
  const body = document.getElementById('terminalBody');
  const input = document.getElementById('terminalInput');
  if (!body || !input) return;

  const history = [];
  let historyPos = -1;

  const commands = {
    help: () =>
      'Available commands:\n' +
      '  about       show a short bio\n' +
      '  skills      list technical skills\n' +
      '  experience  show work experience\n' +
      '  projects    show featured projects\n' +
      '  contact     show contact info\n' +
      '  whoami      guess who\n' +
      '  ls          list portfolio sections\n' +
      '  date        show current date/time\n' +
      '  clear       clear the terminal',
    about: () =>
      'Samuel Isham — IT Assistant at USD 352, Junior studying Informatics\n' +
      'in Networking and Telecommunications at Fort Hays State University.\n' +
      'Based in Goodland, Kansas. Focused on networking and full-stack\n' +
      'development.',
    skills: () =>
      'Networking:  Cisco CLI, Switch Configuration, Troubleshooting\n' +
      'Development: Python, HTML/CSS, PostgreSQL (CLI)\n' +
      'Soft skills: Patience, Understanding, Clear Communication',
    experience: () =>
      'IT Assistant — USD 352\n' +
      '  Led a district-wide network upgrade (switching infrastructure).\n' +
      '  Daily helpdesk support and technology deployment.\n\n' +
      'B.S. Informatics in Networking and Telecommunications — Fort Hays\n' +
      'State University (Junior)',
    projects: () =>
      'USD 352 Network Upgrade — district-wide switching deployment\n' +
      'freeCodeCamp: Legacy Responsive Web Design\n' +
      'freeCodeCamp: Legacy Relational Databases V8\n' +
      'More projects in progress — check back soon.',
    contact: () =>
      'Phone:    785-821-3124\n' +
      'Email:    sbisham@mail.fhsu.edu\n' +
      'LinkedIn: linkedin.com/in/samuel-isham-b674b7264',
    whoami: () => 'guest (but you already knew that)',
    ls: () => 'about/  experience/  skills/  projects/  terminal/  contact/',
    date: () => new Date().toString(),
    sudo: () => 'Nice try. Permission denied: this terminal runs as guest.',
    clear: () => '__CLEAR__'
  };

  function printLine(text, cls) {
    const line = document.createElement('div');
    line.className = 'terminal-line' + (cls ? ' ' + cls : '');
    line.textContent = text;
    body.insertBefore(line, body.querySelector('.terminal-input-line'));
  }

  function runCommand(raw) {
    const cmd = raw.trim().toLowerCase();
    printLine('guest@samuel-isham:~$ ' + raw, 'echo');
    if (!cmd) return;

    history.push(raw);
    historyPos = history.length;

    if (commands[cmd]) {
      const output = commands[cmd]();
      if (output === '__CLEAR__') {
        body.querySelectorAll('.terminal-line').forEach((l) => l.remove());
        return;
      }
      printLine(output);
    } else {
      printLine(`command not found: ${cmd} (type "help" for a list)`);
    }
    body.scrollTop = body.scrollHeight;
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      runCommand(input.value);
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyPos > 0) { historyPos--; input.value = history[historyPos]; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyPos < history.length - 1) { historyPos++; input.value = history[historyPos]; }
      else { historyPos = history.length; input.value = ''; }
    }
  });

  body.addEventListener('click', () => input.focus());
})();

// ============ Footer year ============
document.getElementById('year').textContent = new Date().getFullYear();

// ============ Animated network background ============
(function () {
  const canvas = document.getElementById('net-bg');
  const ctx = canvas.getContext('2d');
  let width, height, nodes;
  let mouse = { x: null, y: null };

  function isLight() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    const count = Math.min(90, Math.floor((width * height) / 18000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 1
    }));
  }

  function step() {
    ctx.clearRect(0, 0, width, height);
    const lineColor = isLight() ? '0, 90, 60' : '0, 230, 160';
    const dotColor = isLight() ? '0, 60, 130' : '63, 169, 255';

    nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;

      if (mouse.x !== null) {
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          n.x += (dx / dist) * force * 1.2;
          n.y += (dy / dist) * force * 1.2;
        }
      }
    });

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          ctx.strokeStyle = `rgba(${lineColor}, ${(1 - dist / 140) * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    nodes.forEach((n) => {
      ctx.fillStyle = `rgba(${dotColor}, 0.9)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(step);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });

  resize();
  step();
})();
