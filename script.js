/* Personalize this block. Empty values are intentionally rendered as unavailable.
   No real accounts, credentials, achievements, or project repositories are invented. */
const PROFILE = {
  portrait: './assets/portrait.png', // User-supplied original; visual grading is CSS only.
  discord: '192.168.88.1',
  repositories: { osint: '', bot: '', network: '', toolkit: '', pos: '', investigation: '' }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(pointer: fine)');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const storage = {
  get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { sessionStorage.setItem(key, value); } catch { /* Private-mode fallback. */ } }
};

/* Procedural sound: no downloads or autoplay. Every sound follows explicit consent. */
const audio = (() => {
  let context, master, drone, noiseSource, enabled = false, lastClick = 0;
  function initialize() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);
    drone = context.createOscillator();
    const low = context.createGain();
    drone.type = 'sine';
    drone.frequency.value = 58;
    low.gain.value = 0.13;
    drone.connect(low).connect(master);
    drone.start();
    const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * 0.035;
    noiseSource = context.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 240;
    noiseSource.connect(filter).connect(master);
    noiseSource.start();
    return true;
  }
  function updateButton() {
    $('#sound-toggle').setAttribute('aria-pressed', String(enabled));
    $('#sound-toggle').setAttribute('aria-label', enabled ? 'Mute sound' : 'Enable sound');
    $('#sound-label').textContent = enabled ? 'SOUND ON' : 'SOUND OFF';
  }
  async function set(on) {
    try {
      if (on && !context && !initialize()) return;
      if (on) await context.resume();
      enabled = on;
      if (context) {
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(on ? 0.12 : 0, context.currentTime, 0.2);
      }
    } catch { enabled = false; }
    updateButton();
  }
  function click(kind = 'click') {
    if (!enabled || !context || context.state !== 'running') return;
    const now = context.currentTime;
    if (now - lastClick < 0.06) return;
    lastClick = now;
    const osc = context.createOscillator(), gain = context.createGain();
    const metallic = kind === 'complete';
    osc.type = metallic ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(metallic ? 190 : kind === 'key' ? 740 : 420, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.07);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (metallic ? 0.4 : 0.065));
    osc.connect(gain).connect(master); osc.start(now); osc.stop(now + 0.45);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  document.addEventListener('visibilitychange', () => {
    if (!context) return;
    if (document.hidden) context.suspend().catch(() => {});
    else if (enabled) context.resume().catch(() => {});
  });
  return { set, click, toggle: () => set(!enabled) };
})();

function initEntry() {
  const dialog = $('#entry');
  function enter(withSound) {
    if (withSound) audio.set(true);
    dialog.close();
    storage.set('ab-entered', 'yes');
    $('.header .brand').focus({ preventScroll: true });
  }
  $('#enter-sound').addEventListener('click', () => enter(true));
  $('#enter-silent').addEventListener('click', () => enter(false));
  dialog.addEventListener('cancel', () => { storage.set('ab-entered', 'yes'); });
  $('#sound-toggle').addEventListener('click', audio.toggle);
  if (!storage.get('ab-entered') && typeof dialog.showModal === 'function') dialog.showModal();
  document.addEventListener('click', event => {
    if (event.target.closest('button, a, summary')) audio.click();
  });
}

function initNavigation() {
  const toggle = $('#menu-toggle'), nav = $('#navigation');
  function close() { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open);
  });
  $$('a', nav).forEach(link => link.addEventListener('click', close));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('is-open')) { close(); toggle.focus(); } });
  document.addEventListener('click', event => { if (!event.target.closest('.header')) close(); });
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    $$('a', nav).forEach(link => {
      const active = link.hash === '#' + visible.target.id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-15% 0px -50% 0px', threshold: [0, 0.15] });
  $$('main section[id]').forEach(section => observer.observe(section));
}

function initProfile() {
  if (PROFILE.portrait) {
    const img = $('#portrait');
    img.addEventListener('load', () => {
      img.hidden = false;
      $('#portrait-stage').classList.add('has-portrait');
      $('#portrait-stage').setAttribute('aria-label', 'Portrait of Ahmed Al-Bahadli');
    });
    img.addEventListener('error', () => {
      img.hidden = true;
      $('#portrait-stage').classList.remove('has-portrait');
      $('#portrait-stage').setAttribute('aria-label', 'Portrait temporarily unavailable');
    });
    img.src = PROFILE.portrait;
  }
  $('#discord-username').textContent = PROFILE.discord;
  $('#copy-discord').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.discord);
      $('#discord-status').textContent = 'تم نسخ يوزر دسكورد: ' + PROFILE.discord;
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents($('#discord-username'));
      selection.removeAllRanges(); selection.addRange(range);
      $('#discord-status').textContent = 'النسخ التلقائي غير متاح. اليوزر محدد الآن؛ انسخه يدويًا.';
    }
  });
}

function renderSkills() {
  const skills = [
    ['NETWORK SECURITY', 'Connections, boundaries, trust.', '> inspect network topology\n> trace trust boundaries', '⌁'],
    ['OSINT', 'Public signals. Better questions.', '> correlate public sources\n> verify before concluding', '◎'],
    ['DIGITAL INVESTIGATION', 'From scattered traces to context.', '> preserve evidence\n> reconstruct the timeline', '⌕'],
    ['SECURITY AUTOMATION', 'Make repetitive work repeatable.', '> define workflow\n> automate with permission', '⤧'],
    ['WEB SECURITY', 'Look beneath the interface.', '> review application logic\n> examine input boundaries', '⌘'],
    ['SYSTEM ADMINISTRATION', 'Understand what keeps it running.', '> inspect configuration\n> maintain system hygiene', '⊞'],
    ['PYTHON', 'Small scripts. Useful tools.', '> parse · transform · inspect\n> build research utilities', 'λ'],
    ['C# / .NET', 'Structured software for real work.', '> model the workflow\n> build maintainable software', '#']
  ];
  skills.forEach(([name, description, command, symbol], i) => {
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'skill-card'; card.setAttribute('aria-pressed', 'false');
    // All markup here is authored static data, never user input.
    card.innerHTML = `<span class="skill-top"><span>${String(i + 1).padStart(2, '0')}</span><span class="skill-symbol" aria-hidden="true">${symbol}</span></span><h3>${name}</h3><p class="skill-description">${description}</p><p class="skill-command">${command.replace('\n', '<br>')}</p>`;
    card.addEventListener('click', () => card.setAttribute('aria-pressed', String(card.getAttribute('aria-pressed') !== 'true')));
    card.addEventListener('pointerenter', () => audio.click());
    $('#security-grid').append(card);
  });
}

function renderProjects() {
  const projects = [
    { id: 'osint', title: 'OSINT ENGINE', status: 'INTERACTIVE CONCEPT', description: 'A browser-based concept for exploring fictional public-data relationships. The simulation above is functional; a live intelligence engine has not been supplied.', tech: 'THIS DEMO: HTML / CSS / JAVASCRIPT', demo: '#osint' },
    { id: 'bot', title: 'AUTOMATION BOT', status: 'INTERACTIVE CONCEPT', description: 'A simulated automation queue for research and data-processing workflows. No actual bot service or repository has been supplied.', tech: 'THIS DEMO: JAVASCRIPT / WEB AUDIO', demo: '#bot-toggle' },
    { id: 'network', title: 'NETWORK MONITOR', status: 'PLACEHOLDER', description: 'Reserved for a future network-monitoring project. Scope, implementation, screenshots, and results have not yet been added.', tech: 'TECHNOLOGIES: TO BE DOCUMENTED' },
    { id: 'toolkit', title: 'SECURITY TOOLKIT', status: 'PLACEHOLDER', description: 'Reserved for security-focused utilities. Project details and source code will be added when available.', tech: 'TECHNOLOGIES: TO BE DOCUMENTED' },
    { id: 'pos', title: 'CUSTOM POS / BUSINESS SOFTWARE', status: 'PLACEHOLDER', description: 'Reserved for business software and point-of-sale work. No client names, deployments, or performance claims are available.', tech: 'TECHNOLOGIES: TO BE DOCUMENTED' },
    { id: 'investigation', title: 'DIGITAL INVESTIGATION LAB', status: 'INTERACTIVE CONCEPT', description: 'An evidence-bench concept with a real, local SHA-256 check on a known text fixture. The timeline and case record are fictional.', tech: 'THIS DEMO: JAVASCRIPT / WEB CRYPTO', demo: '#lab' }
  ];
  projects.forEach((project, i) => {
    const row = document.createElement('details'); row.className = 'project-row';
    row.innerHTML = `<summary><span class="project-number">${String(i + 1).padStart(2, '0')}</span><h3>${project.title}</h3><span class="project-status">${project.status}</span><span class="project-expand" aria-hidden="true">+</span></summary><div class="project-detail"><div><p>${project.description}</p><p class="project-tech">${project.tech}</p></div><div class="project-links"></div></div>`;
    const links = $('.project-links', row);
    const repo = PROFILE.repositories[project.id];
    const github = document.createElement(repo && /^https:\/\//i.test(repo) ? 'a' : 'span');
    github.className = 'placeholder-link'; github.textContent = 'GITHUB / NOT ADDED';
    if (github.tagName === 'A') { github.href = repo; github.target = '_blank'; github.rel = 'noopener noreferrer'; github.textContent = 'GITHUB ↗'; github.className = 'text-link'; }
    links.append(github);
    if (project.demo) {
      const demo = document.createElement('a'); demo.href = project.demo; demo.className = 'text-link'; demo.textContent = 'EXPLORE DEMO ↗'; links.append(demo);
    }
    $('#project-list').append(row);
  });
}

function initOSINT() {
  const form = $('#osint-form'), log = $('#scan-log'), button = $('#scan-button');
  const examples = { Username: 'archive_subject_07', Domain: 'example.com', Email: 'analyst@example.com', IP: '192.0.2.7', Phone: '+1 202 555 0147', 'Social Handle': '@archive_subject_07' };
  $('#target-type').addEventListener('change', event => { $('#target').value = examples[event.target.value]; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const target = $('#target').value.trim();
    if (!target || button.disabled) return;
    button.disabled = true; button.textContent = 'SIMULATING…';
    $('#target-type').disabled = true; $('#target').readOnly = true;
    $('.engine').classList.add('is-scanning');
    log.replaceChildren(); $('#signal-count').textContent = '00';
    const stages = [
      ['TARGET IDENTIFIED', `${$('#target-type').value}: ${target} (fictional input)`],
      ['PUBLIC RECORDS', '2 synthetic archive entries linked.'],
      ['SOCIAL PRESENCE', '3 fictional profiles in the demo dataset.'],
      ['DOMAIN DATA', 'example.com · reserved example domain.'],
      ['USERNAME CORRELATION', 'Illustrative match; not a verified identity.'],
      ['TECHNICAL FOOTPRINT', '192.0.2.7 · documentation-only address.']
    ];
    try {
      for (let i = 0; i < stages.length; i++) {
        if (!reducedMotion.matches) await delay(420);
        const row = document.createElement('p'); row.className = 'log-line';
        const time = document.createElement('time'); time.textContent = `00:0${i + 1}`;
        const text = document.createElement('span'); text.textContent = stages[i][0];
        const detail = document.createElement('small'); detail.textContent = stages[i][1];
        text.append(detail); row.append(time, text); log.append(row);
        $('#signal-count').textContent = String(i + 1).padStart(2, '0'); audio.click('key');
      }
      audio.click('complete');
    } finally {
      button.disabled = false; button.innerHTML = 'RUN AGAIN <span>↗</span>';
      $('#target-type').disabled = false; $('#target').readOnly = false;
      $('.engine').classList.remove('is-scanning');
    }
  });
}

function initBot() {
  let running = false, generation = 0;
  const button = $('#bot-toggle'), log = $('#bot-log');
  button.addEventListener('click', async () => {
    if (running) {
      generation++; running = false; $('#bot-state').textContent = 'STOPPED / DEMO';
      log.textContent += '\n> simulation stopped'; button.innerHTML = 'RESTART DEMO <span>↗</span>'; return;
    }
    running = true;
    const token = ++generation;
    button.innerHTML = 'STOP DEMO <span>■</span>'; $('#bot-state').textContent = 'RUNNING / DEMO';
    $('#task-count').textContent = '000'; $('#module-count').textContent = '00'; log.textContent = '';
    const stages = ['initializing local simulation...', 'loading 4 fictional modules...', 'connecting to in-memory queue...', 'task queue active', 'automation engine online'];
    for (let i = 0; i < stages.length; i++) {
      if (!reducedMotion.matches) await delay(380);
      if (generation !== token) return;
      log.textContent += `> ${stages[i]}\n`;
      $('#module-count').textContent = String(Math.min(i + 1, 4)).padStart(2, '0');
      audio.click('key');
    }
    const steps = reducedMotion.matches ? [24] : [3, 7, 11, 16, 20, 24];
    for (const count of steps) {
      if (!reducedMotion.matches) await delay(280);
      if (generation !== token) return;
      $('#task-count').textContent = String(count).padStart(3, '0');
    }
    log.textContent += '> 24 synthetic tasks processed. Demo complete.';
    running = false; $('#bot-state').textContent = 'COMPLETE / DEMO'; button.innerHTML = 'REPLAY DEMO <span>↗</span>'; audio.click('complete');
  });
}

function initTerminal() {
  const output = $('#terminal-output'), input = $('#command');
  const history = []; let historyPosition = 0;
  const commands = {
    help: 'AVAILABLE COMMANDS\nhelp · about · whoami · location · skills · projects · contact · status · clear',
    about: 'Ahmed Al-Bahadli. Iraqi cybersecurity enthusiast and security-focused developer. Curious about systems, public information, and useful software.',
    whoami: 'ahmed@iraq\nأحمد البهادلي',
    location: 'IRAQ\nVisual inspiration: Basra / Mesopotamia. Precise residence is not specified.',
    skills: 'CYBERSECURITY · OSINT · DIGITAL INVESTIGATION\nPYTHON · C# / .NET · NETWORKING · LINUX · DATABASES\nAreas of interest; no proficiency ratings claimed.',
    projects: '01 OSINT ENGINE — local demo\n02 AUTOMATION BOT — local demo\n03 NETWORK MONITOR — placeholder\n04 SECURITY TOOLKIT — placeholder\n05 CUSTOM POS / BUSINESS SOFTWARE — placeholder\n06 DIGITAL INVESTIGATION LAB — local demo',
    status: 'ONLINE\nStatic portfolio. All interactive demonstrations run locally.',
    contact: `DISCORD: ${PROFILE.discord}`
  };
  function print(text, className = '') {
    const line = document.createElement('p'); line.textContent = text; line.className = className; output.append(line);
    while (output.children.length > 80) output.firstElementChild.remove();
  }
  function run(raw) {
    const command = raw.trim().toLowerCase(); if (!command) return;
    history.push(raw); if (history.length > 50) history.shift(); historyPosition = history.length;
    if (command === 'clear') output.replaceChildren();
    else { print(`root@ahmed:~$ ${raw}`, 'terminal-echo'); print(commands[command] || `Unknown command: ${raw}\nType "help" for the available commands.`); }
    input.value = ''; output.scrollTop = output.scrollHeight; audio.click('key');
  }
  $('#terminal-form').addEventListener('submit', event => { event.preventDefault(); run(input.value); });
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault(); historyPosition = Math.max(0, Math.min(history.length, historyPosition + (event.key === 'ArrowUp' ? -1 : 1)));
      input.value = history[historyPosition] || '';
    } else if (event.key.length === 1) audio.click('key');
  });
  $$('[data-command]').forEach(button => button.addEventListener('click', () => { run(button.dataset.command); input.focus({ preventScroll: true }); }));
}

function initForensics() {
  $('#verify-hash').addEventListener('click', async () => {
    const status = $('#hash-status');
    if (!window.crypto?.subtle) { status.textContent = 'Hash verification requires HTTPS or localhost.'; return; }
    try {
      const bytes = new TextEncoder().encode('hello');
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const hex = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
      const expected = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';
      status.textContent = hex === expected ? 'MATCH VERIFIED / 5-BYTE LOCAL FIXTURE' : 'HASH MISMATCH';
      audio.click('complete');
    } catch { status.textContent = 'Verification unavailable in this browser.'; }
  });
}

function initCipherGame() {
  // Authored local puzzles, not encryption of real data or execution of code.
  const rounds = [
    { type: 'CAESAR / +3', tokens: ['W', 'U', 'D', 'F', 'H'], answer: 'TRACE', instruction: 'كل حرف تحرك ثلاث خطوات للأمام. أعد الحروف للخلف واكتشف الكلمة.', hint: 'مثال: D تصبح A. الكلمة تعني «أثر» بالإنجليزية.' },
    { type: 'HEX / ASCII', tokens: ['49', '52', '41', '51'], answer: 'IRAQ', instruction: 'هذه أرقام بالنظام الست عشري. حوّل كل رقم إلى حرف ASCII.', hint: '0x49 = I، و0x52 = R، و0x41 = A، و0x51 = Q.' },
    { type: 'BINARY / ASCII', tokens: ['01001111', '01010011', '01001001', '01001110', '01010100'], answer: 'OSINT', instruction: 'كل مجموعة من ثمانية بتات تمثل حرفًا. اجمع الحروف لتكشف الاختصار.', hint: 'القيم العشرية هي 79، 83، 73، 78، 84. الاختصار يعني استخبارات المصادر المفتوحة.' }
  ];
  let round = 0, solved = false;
  const field = $('#cipher-field'), answer = $('#cipher-answer'), feedback = $('#cipher-feedback');
  function render() {
    const puzzle = rounds[round]; solved = false;
    $('#cipher-round').textContent = `ROUND ${String(round + 1).padStart(2, '0')} / 03`;
    $('#cipher-type').textContent = puzzle.type;
    $('#cipher-instruction').textContent = puzzle.instruction;
    $('#cipher-hint-text').textContent = puzzle.hint;
    $('#cipher-hint-text').hidden = true;
    $('#cipher-hint').setAttribute('aria-expanded', 'false');
    $('#cipher-hint').textContent = 'SHOW HINT';
    $('#cipher-next').hidden = true; $('#cipher-submit').disabled = false; answer.disabled = false;
    answer.value = ''; answer.removeAttribute('aria-invalid'); feedback.textContent = '';
    field.classList.remove('solved'); field.replaceChildren();
    puzzle.tokens.forEach((token, index) => {
      const slot = document.createElement('div'); slot.className = 'cipher-slot';
      const tile = document.createElement('button'); tile.type = 'button'; tile.className = 'cipher-token';
      const count = document.createElement('small'); count.textContent = `0${index + 1}`;
      const code = document.createElement('span'); code.textContent = token;
      tile.append(count, code); tile.setAttribute('aria-label', `Code ${index + 1}: ${token}`);
      slot.append(tile); field.append(slot);
      slot.addEventListener('pointermove', event => {
        if (reducedMotion.matches || event.pointerType === 'touch') return;
        const rect = slot.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        tile.style.transform = `translate(${x * 22}px, ${y * 18}px) rotate(${x * 10}deg)`;
      });
      slot.addEventListener('pointerleave', () => { tile.style.transform = ''; });
      tile.addEventListener('click', () => {
        audio.click('key');
        if (!reducedMotion.matches) tile.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-12px) rotate(3deg)' }, { transform: 'translateY(0)' }], { duration: 330 });
      });
    });
  }
  $('#cipher-form').addEventListener('submit', event => {
    event.preventDefault(); if (solved) return;
    if (answer.value.trim().toUpperCase() !== rounds[round].answer) {
      feedback.textContent = 'مو هذا الحل. جرّب مرة ثانية أو افتح التلميح.';
      answer.setAttribute('aria-invalid', 'true'); return;
    }
    solved = true; answer.removeAttribute('aria-invalid'); field.classList.add('solved');
    $('#cipher-submit').disabled = true; answer.disabled = true; audio.click('complete');
    feedback.textContent = round === rounds.length - 1 ? 'تم اختراق اللغز! أكملت المراحل الثلاث بنجاح.' : 'صحيح! تم فك الشفرة. جاهز للمرحلة التالية؟';
    $('#cipher-next').hidden = false;
    $('#cipher-next').textContent = round === rounds.length - 1 ? 'PLAY AGAIN ↺' : 'NEXT ROUND →';
    $('#cipher-next').focus({ preventScroll: true });
  });
  $('#cipher-hint').setAttribute('aria-controls', 'cipher-hint-text');
  $('#cipher-hint').addEventListener('click', () => {
    const hint = $('#cipher-hint-text'); hint.hidden = !hint.hidden;
    $('#cipher-hint').setAttribute('aria-expanded', String(!hint.hidden));
    $('#cipher-hint').textContent = hint.hidden ? 'SHOW HINT' : 'HIDE HINT';
  });
  $('#cipher-next').addEventListener('click', () => { round = (round + 1) % rounds.length; render(); answer.focus({ preventScroll: true }); });
  $('#cipher-reset').addEventListener('click', () => { round = 0; render(); answer.focus({ preventScroll: true }); });
  render();
}

function initMotion() {
  const dust = document.createElement('div');
  dust.className = 'portrait-dust'; dust.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 12; i++) {
    const particle = document.createElement('i');
    particle.style.left = `${12 + (i * 31) % 80}%`;
    particle.style.top = `${15 + (i * 23) % 70}%`;
    particle.style.animationDelay = `${-i * 1.4}s`;
    dust.append(particle);
  }
  $('#portrait-stage').append(dust);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
  }, { threshold: 0.08 });
  $$('.about-layout, .heritage, .section-heading, .security-grid, .matrix, .feature-intro, .engine, .bot-feature, .lab-grid, .discord-identity').forEach(element => {
    if (!reducedMotion.matches) { element.classList.add('reveal'); observer.observe(element); }
  });
  let frame = 0;
  document.addEventListener('pointermove', event => {
    if (reducedMotion.matches || !finePointer.matches || frame) return;
    frame = requestAnimationFrame(() => {
      $('#spotlight').style.setProperty('--mouse-x', `${event.clientX}px`);
      $('#spotlight').style.setProperty('--mouse-y', `${event.clientY}px`);
      if (event.clientY < innerHeight && window.scrollY < innerHeight) {
        $('#portrait-stage').style.setProperty('--px', `${(event.clientX / innerWidth - 0.5) * 9}px`);
        $('#portrait-stage').style.setProperty('--py', `${(event.clientY / innerHeight - 0.5) * 7}px`);
      }
      frame = 0;
    });
  }, { passive: true });
  $$('.magnetic').forEach(button => {
    button.addEventListener('pointermove', event => {
      if (reducedMotion.matches || !finePointer.matches) return;
      const bounds = button.getBoundingClientRect();
      button.style.transform = `translate(${(event.clientX - bounds.left - bounds.width / 2) * .07}px, ${(event.clientY - bounds.top - bounds.height / 2) * .09}px)`;
    });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });
  // Short scramble of a decorative English label only; the personal name is untouched.
  const label = $('.english-name'); let scrambling = false;
  label.addEventListener('pointerenter', async () => {
    if (reducedMotion.matches || scrambling) return;
    scrambling = true; const original = 'AHMED AL-BAHADLI';
    for (let tick = 0; tick < 9; tick++) {
      label.textContent = [...original].map((char, i) => i < tick * 2 || char === ' ' ? char : 'ABCDEF0123456789'[Math.floor(Math.random() * 16)]).join('');
      await delay(35);
    }
    label.textContent = original; scrambling = false;
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) $$('.reveal').forEach(element => element.classList.add('is-visible'));
  });
}

renderSkills();
renderProjects();
initProfile();
initNavigation();
initOSINT();
initBot();
initTerminal();
initForensics();
initCipherGame();
initMotion();
initEntry();
