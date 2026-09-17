/* ==========================================================================
   Samuel Isham - portfolio scripts

   Plain JavaScript, no libraries. Each feature is its own function and they
   are all started from init() at the bottom of the file.

   Everything here is written in plain ASCII on purpose: any special
   characters are escaped, so the file renders the same no matter what
   character set the server reports.
   ========================================================================== */

/* Respect the visitor's "reduce motion" setting for the animated pieces. */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* The sections of the page, in the order they appear. Used by the nav,
   the terminal's "ls" command, and "cd" autocomplete. */
const SECTIONS = ['about', 'experience', 'education', 'skills', 'projects', 'terminal', 'contact'];

/* ============ Theme toggle ============ */
function setupTheme() {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const iconMoon = document.getElementById('iconMoon');
  const iconSun = document.getElementById('iconSun');

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    iconMoon.hidden = theme !== 'dark';
    iconSun.hidden = theme !== 'light';
    try {
      localStorage.setItem('portfolio-theme', theme);
    } catch (error) {
      /* Private browsing can block storage. The theme still works. */
    }
  }

  let saved = 'dark';
  try {
    saved = localStorage.getItem('portfolio-theme') || 'dark';
  } catch (error) {
    saved = 'dark';
  }
  apply(saved);

  toggle.addEventListener('click', () => {
    apply(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });

  /* The terminal's "theme" command reuses this. */
  return {
    toggle: () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      apply(next);
      return next;
    }
  };
}

/* ============ Mobile menu ============ */
function setupMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  function close() {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    navLinks.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', close);
  });
}

/* ============ Progress bar, sticky nav, active link, back to top ============ */
function setupScrollEffects() {
  const nav = document.getElementById('nav');
  const progressBar = document.getElementById('progressBar');
  const toTop = document.getElementById('toTop');
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('main .section, .hero');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
    toTop.classList.toggle('visible', window.scrollY > 500);

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressBar.style.width = percent + '%';
  }, { passive: true });

  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  /* Highlight the nav link for whichever section is in the middle of the screen. */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute('id');
      links.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
      });
    });
  }, { rootMargin: '-45% 0px -45% 0px' });

  sections.forEach((section) => observer.observe(section));
}

/* ============ Fade sections in as they scroll into view ============ */
function setupScrollReveal() {
  const items = document.querySelectorAll('.reveal');

  if (prefersReducedMotion) {
    items.forEach((item) => item.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  items.forEach((item) => observer.observe(item));
}

/* ============ Hero spotlight follows the cursor ============ */
function setupHeroSpotlight() {
  const hero = document.querySelector('.hero');
  const spotlight = document.getElementById('spotlight');
  if (!hero || !spotlight) return;

  hero.addEventListener('mousemove', (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    spotlight.style.setProperty('--x', x + '%');
    spotlight.style.setProperty('--y', y + '%');
  });
}

/* ============ Typewriter under the hero title ============ */
function setupTypewriter() {
  const target = document.getElementById('typed');
  if (!target) return;

  const phrases = [
    'IT Assistant at USD 352.',
    'Informatics student at FHSU.',
    'Help desk to switch stack.',
    'sudo make it work.'
  ];

  if (prefersReducedMotion) {
    target.textContent = phrases[0];
    return;
  }

  let phraseIndex = 0;
  let charCount = 0;
  let deleting = false;

  function tick() {
    const phrase = phrases[phraseIndex];

    if (deleting) {
      charCount -= 1;
      target.textContent = phrase.slice(0, charCount);
      if (charCount === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    } else {
      charCount += 1;
      target.textContent = phrase.slice(0, charCount);
      if (charCount === phrase.length) {
        deleting = true;
        setTimeout(tick, 1600);
        return;
      }
    }

    setTimeout(tick, deleting ? 35 : 65);
  }

  tick();
}

/* ==========================================================================
   Interactive terminal
   Commands live in one object. Each one returns the text to print, or
   handles its own output through the helpers passed to it.
   ========================================================================== */
function setupTerminal(theme) {
  const body = document.getElementById('terminalBody');
  const output = document.getElementById('terminalOutput');
  const input = document.getElementById('terminalInput');
  const ghost = document.getElementById('terminalGhost');
  if (!body || !output || !input || !ghost) return;

  const history = [];
  let historyIndex = 0;

  /* ---- output helpers ---- */

  function print(text, className) {
    const line = document.createElement('p');
    line.className = 'terminal-line' + (className ? ' ' + className : '');
    line.textContent = text;
    output.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }

  function clearScreen() {
    output.textContent = '';
  }

  function goToSection(id) {
    const target = document.getElementById(id);
    if (!target) return false;
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    return true;
  }

  /* ---- the git-style graph used by the "experience" command ---- */

  function gitRow(lanes, title, dates) {
    return lanes + '  ' + title.padEnd(44, ' ') + dates;
  }

  const experienceGraph = [
    gitRow('* |', 'Information Technology Assistant, USD 352', 'Aug 2025 - Present'),
    '| |',
    gitRow('* |', 'Water Laborer, City of Goodland', 'Sep 2024 - Jul 2025'),
    '| |',
    gitRow('| *', 'Summer Camp Counselor, Camp Christy', 'Jun 2023 - Present'),
    '|/',
    gitRow('*  ', 'Associate, Ace Hardware Corporation', 'Aug 2021 - May 2023')
  ].join('\n');

  /* ---- commands ---- */

  const commands = {
    help: () => [
      'Commands',
      '',
      '  about        who I am',
      '  experience   work history, drawn as a git graph',
      '  education    degree and certifications',
      '  skills       what I work with',
      '  projects     things I have built',
      '  contact      how to reach me',
      '',
      '  ls           list the sections of this page',
      '  cd <section> jump to a section',
      '  theme        switch between dark and light',
      '  whoami       you',
      '  date         current date and time',
      '  clear        clear the screen',
      '',
      'Press Tab to autocomplete, and the up arrow for history.'
    ].join('\n'),

    about: () => [
      'Samuel Isham',
      'IT Assistant at USD 352 in Goodland, Kansas, and a full-time',
      'Information Networking and Telecommunications student at Fort',
      'Hays State University.',
      '',
      'Switches and routers on UniFi at work. CCNA material and Cisco',
      'switching on my own time. As comfortable in a switch CLI as I am',
      'writing a script in Python.',
      '',
      'Goal: make USD 352 a place that uses technology more efficiently,',
      'to enrich our students in a more meaningful way.'
    ].join('\n'),

    experience: () => experienceGraph,

    education: () => [
      'B.S. Information Networking and Telecommunications',
      'Fort Hays State University - junior, in progress',
      '',
      'freeCodeCamp - Legacy Relational Databases v8    2026',
      'freeCodeCamp - Legacy Responsive Web Design      2026'
    ].join('\n'),

    skills: () => [
      'networking   UniFi, switch configuration, network deployment,',
      '             Cisco CLI (coursework), troubleshooting',
      'systems      Apple School Manager, Mosyle MDM, Google Workspace,',
      '             VOIP and intercom, access control',
      'development  Python, HTML and CSS, Bash, PostgreSQL, Git'
    ].join('\n'),

    projects: () => [
      'district network upgrade   UniFi rollout across every building',
      'this portfolio             HTML, CSS, and JavaScript, no frameworks',
      'how to play skull king     technical documentation site',
      'command-line databases     4 Bash and PostgreSQL programs',
      '',
      'Run "cd projects" for the full write-ups.'
    ].join('\n'),

    contact: () => [
      'email      sbisham@mail.fhsu.edu',
      'linkedin   linkedin.com/in/samuel-isham',
      'github     github.com/samisham-collab'
    ].join('\n'),

    ls: () => SECTIONS.map((section) => section + '/').join('  '),

    cd: (args) => {
      const target = args[0];
      if (!target || target === '~' || target === '/' || target === '..') {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        return '';
      }
      const name = target.replace(/\/$/, '');
      if (!goToSection(name)) {
        return { text: 'cd: no such section: ' + target, error: true };
      }
      return '';
    },

    theme: () => 'theme set to ' + theme.toggle(),

    whoami: () => 'guest -- but you already knew that',

    date: () => new Date().toString(),

    clear: () => {
      clearScreen();
      return '';
    },

    /* Not listed in help, for anyone who goes looking. */
    sudo: () => ({ text: 'sudo: permission denied -- this terminal runs as guest.', error: true }),

    git: (args) => (args[0] === 'log' ? experienceGraph : 'usage: git log')
  };

  /* Commands offered by Tab completion, in the order help lists them. */
  const completable = [
    'about', 'experience', 'education', 'skills', 'projects', 'contact',
    'ls', 'cd', 'theme', 'whoami', 'date', 'clear', 'help'
  ].sort();

  /* ---- running a command ---- */

  function runCommand(raw) {
    print('guest@samuel-isham:~$ ' + raw, 'echo');

    const trimmed = raw.trim();
    if (!trimmed) return;

    history.push(raw);
    historyIndex = history.length;

    const parts = trimmed.split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = parts.slice(1);
    const command = commands[name];

    if (!command) {
      print('command not found: ' + name + '. Type help for a list.', 'error');
      return;
    }

    const result = command(args);
    if (!result) return;

    if (typeof result === 'string') {
      print(result);
    } else {
      print(result.text, result.error ? 'error' : '');
    }
  }

  /* ---- autocomplete ---- */

  /* The word Tab should complete, plus the list of things it could become. */
  function completionState() {
    const value = input.value;
    const parts = value.split(' ');
    const word = parts[parts.length - 1];

    let candidates = [];
    if (parts.length === 1) {
      candidates = completable.filter((name) => name.startsWith(word));
    } else if (parts[0].toLowerCase() === 'cd' && parts.length === 2) {
      candidates = SECTIONS.filter((section) => section.startsWith(word));
    }

    return { value: value, word: word, candidates: candidates };
  }

  /* The longest start that every candidate shares, e.g. cd + clear -> "c". */
  function longestSharedPrefix(words) {
    if (words.length === 0) return '';
    let prefix = words[0];
    words.forEach((word) => {
      while (prefix && !word.startsWith(prefix)) {
        prefix = prefix.slice(0, -1);
      }
    });
    return prefix;
  }

  /* Grey hint showing what Tab would add. Only ever suggests text that all
     the remaining candidates agree on, so it can never mislead. */
  function updateGhost() {
    const state = completionState();
    const shared = longestSharedPrefix(state.candidates);
    const addition = shared.slice(state.word.length);
    const overflowing = input.scrollWidth > input.clientWidth;

    if (!addition || !state.value || overflowing) {
      ghost.textContent = '';
      return;
    }

    ghost.innerHTML = '';

    const typed = document.createElement('span');
    typed.className = 'ghost-typed';
    typed.textContent = state.value;

    const rest = document.createElement('span');
    rest.textContent = addition;

    ghost.appendChild(typed);
    ghost.appendChild(rest);
  }

  function acceptGhost() {
    const state = completionState();
    const shared = longestSharedPrefix(state.candidates);
    if (shared.length <= state.word.length) return false;

    const parts = state.value.split(' ');
    parts[parts.length - 1] = shared;
    input.value = parts.join(' ');
    updateGhost();
    return true;
  }

  function handleTab() {
    const state = completionState();
    if (state.candidates.length === 0) return;

    /* One match: finish the word. "cd" gets a space, since it takes a section. */
    if (state.candidates.length === 1) {
      const parts = state.value.split(' ');
      parts[parts.length - 1] = state.candidates[0];
      input.value = parts.join(' ') + (state.candidates[0] === 'cd' ? ' ' : '');
      updateGhost();
      return;
    }

    /* Several matches: fill in what they share, or list them like a shell. */
    if (!acceptGhost()) {
      print('guest@samuel-isham:~$ ' + state.value, 'echo');
      print(state.candidates.join('  '));
    }
  }

  /* ---- input handling ---- */

  input.addEventListener('input', updateGhost);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      runCommand(input.value);
      input.value = '';
      updateGhost();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      handleTab();
      return;
    }

    /* Right arrow at the end of the line accepts the grey suggestion. */
    if (event.key === 'ArrowRight' && input.selectionStart === input.value.length) {
      if (acceptGhost()) event.preventDefault();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (historyIndex > 0) {
        historyIndex -= 1;
        input.value = history[historyIndex];
        updateGhost();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex += 1;
        input.value = history[historyIndex];
      } else {
        historyIndex = history.length;
        input.value = '';
      }
      updateGhost();
      return;
    }

    if (event.key === 'Escape') {
      input.value = '';
      updateGhost();
    }
  });

  /* Clicking anywhere in the window puts the caret back in the input. */
  body.addEventListener('click', () => input.focus());
}

/* ============ Animated node background ============ */
function setupNetworkBackground() {
  const canvas = document.getElementById('net-bg');
  if (!canvas) return;
  const context = canvas.getContext('2d');

  let width = 0;
  let height = 0;
  let nodes = [];
  const pointer = { x: null, y: null };

  function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    const count = Math.min(90, Math.floor((width * height) / 18000));
    nodes = [];
    for (let i = 0; i < count; i += 1) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.6 + 1
      });
    }
  }

  function moveNodes() {
    nodes.forEach((node) => {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;

      /* Nudge nodes away from the cursor. */
      if (pointer.x === null) return;
      const dx = node.x - pointer.x;
      const dy = node.y - pointer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 0 && distance < 120) {
        const push = (120 - distance) / 120;
        node.x += (dx / distance) * push * 1.2;
        node.y += (dy / distance) * push * 1.2;
      }
    });
  }

  function draw() {
    const lineColor = isLightTheme() ? '0, 90, 60' : '0, 230, 160';
    const dotColor = isLightTheme() ? '0, 60, 130' : '63, 169, 255';

    context.clearRect(0, 0, width, height);

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= 140) continue;

        context.strokeStyle = 'rgba(' + lineColor + ', ' + (1 - distance / 140) * 0.5 + ')';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(nodes[i].x, nodes[i].y);
        context.lineTo(nodes[j].x, nodes[j].y);
        context.stroke();
      }
    }

    nodes.forEach((node) => {
      context.fillStyle = 'rgba(' + dotColor + ', 0.9)';
      context.beginPath();
      context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      context.fill();
    });
  }

  function frame() {
    moveNodes();
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => {
    resize();
    if (prefersReducedMotion) draw();
  });

  resize();

  /* Still shows the network for people who asked for less motion. */
  if (prefersReducedMotion) {
    draw();
    return;
  }

  window.addEventListener('mousemove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
  window.addEventListener('mouseout', () => {
    pointer.x = null;
    pointer.y = null;
  });

  frame();
}

/* ============ Footer year ============ */
function setFooterYear() {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
}

/* ============ Start everything ============ */
function init() {
  const theme = setupTheme();
  setupMobileMenu();
  setupScrollEffects();
  setupScrollReveal();
  setupHeroSpotlight();
  setupTypewriter();
  setupTerminal(theme);
  setupNetworkBackground();
  setFooterYear();
}

init();
