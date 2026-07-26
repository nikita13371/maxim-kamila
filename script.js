
// Ссылки на медиа-файлы (пути к файлам в папке media/)
const LOGO = 'media/logo.png';
const EP1 = КЛИЕНТ.эпизоды[0] ? КЛИЕНТ.эпизоды[0].обложка : 'media/ep1-cover.jpg';
const EP2 = КЛИЕНТ.эпизоды[1] ? КЛИЕНТ.эпизоды[1].обложка : 'media/ep2-cover.jpg';
const EP3 = КЛИЕНТ.эпизоды[2] ? КЛИЕНТ.эпизоды[2].обложка : 'media/ep3-cover.jpg';
const BG = 'media/hero.jpg';

/* ═══ ЗАМЕНА ПЛЕЙСХОЛДЕРОВ ИЗ КЛИЕНТ ═══ */
function replacePlaceholders() {
  const replacements = {
    '{{HIS}}':        КЛИЕНТ.он,
    '{{HER}}':        КЛИЕНТ.она,
    '{{START_DATE}}': КЛИЕНТ.датаНачала,
    '{{NIKAH_DATE}}': КЛИЕНТ.датыКлючевые['Никях'] || '',
    '{{CITY}}':       КЛИЕНТ.город,
    '{{YEAR}}':       КЛИЕНТ.год,
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while (node = walker.nextNode()) nodes.push(node);
  nodes.forEach(n => {
    let text = n.nodeValue;
    for (const [key, val] of Object.entries(replacements)) {
      if (text.includes(key)) text = text.split(key).join(val);
    }
    if (text !== n.nodeValue) n.nodeValue = text;
  });
  // Обновить первую букву аватара
  const avatar = document.querySelector('.nf-avatar');
  if (avatar && КЛИЕНТ.она) avatar.textContent = КЛИЕНТ.она.charAt(0);
  // Также заменю в title
  document.title = document.title
    .split('{{HIS}}').join(КЛИЕНТ.он)
    .split('{{HER}}').join(КЛИЕНТ.она);
}



/* ═══ ФАКТЫ О ПАРЕ ═══ */
const FACTS = КЛИЕНТ.факты;

const CITIES = (function() {
  const result = {};
  for (const key in КЛИЕНТ.городаАктивные) {
    const c = КЛИЕНТ.городаАктивные[key];
    result[key] = { name: c.название, desc: c.описание, photos: c.фото };
  }
  return result;
})();

/* ═══ ЗВУК ЗАПУСКА (как Mac) ═══ */
function playStartupSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    // Мягкий мажорный аккорд — как звук запуска Mac
    const chord = [261.63, 329.63, 392.00, 523.25]; // C-E-G-C
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const delay = i * 0.04;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 2.5);
      osc.start(now + delay);
      osc.stop(now + delay + 2.6);
    });
    // Низкий бас
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.type = 'sine';
    bass.frequency.value = 65.41;
    bassGain.gain.setValueAtTime(0, now);
    bassGain.gain.linearRampToValueAtTime(0.15, now + 0.2);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
    bass.start(now);
    bass.stop(now + 3);
  } catch(e) {}
}

/* ═══ ФОНОВАЯ МУЗЫКА (генеративная) ═══ */
let musicCtx = null, musicPlaying = false, musicNodes = [];

function toggleMusic() {
  const btn = document.getElementById('music-btn');
  if (musicPlaying) {
    stopMusic();
    btn.classList.remove('playing');
    btn.textContent = '♪';
  } else {
    startMusic();
    btn.classList.add('playing');
    btn.textContent = '♫';
  }
}

let musicAudio = null;

function startMusic() {
  // Если у клиента есть файл музыки — играем его
  if (КЛИЕНТ.музыка && КЛИЕНТ.музыка.trim()) {
    try {
      musicAudio = new Audio(КЛИЕНТ.музыка);
      musicAudio.loop = true;
      musicAudio.volume = 0.18;
      musicAudio.play().catch(e => console.log('Не удалось запустить музыку:', e));
      musicPlaying = true;
      return;
    } catch(e) {
      console.log('Ошибка загрузки музыки:', e);
    }
  }
  // Иначе — генеративная мелодия
  try {
    musicCtx = new (window.AudioContext || window.webkitAudioContext)();
    musicPlaying = true;
    const master = musicCtx.createGain();
    master.gain.value = 0.18;
    master.connect(musicCtx.destination);
    const notes = [261.63, 329.63, 392.00, 440.00, 349.23];
    let i = 0;
    function playNote() {
      if (!musicPlaying) return;
      const osc = musicCtx.createOscillator();
      const gain = musicCtx.createGain();
      const filter = musicCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.type = 'sine';
      osc.frequency.value = notes[i % notes.length];
      const now = musicCtx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
      osc.start(now);
      osc.stop(now + 3.6);
      musicNodes.push(osc);
      i++;
      setTimeout(playNote, 2200);
    }
    playNote();
  } catch(e) {}
}

function stopMusic() {
  musicPlaying = false;
  // Остановим mp3 если играл
  if (musicAudio) {
    try { musicAudio.pause(); musicAudio.currentTime = 0; } catch(e) {}
    musicAudio = null;
  }
  // Остановим генератив
  musicNodes.forEach(n => { try { n.stop(); } catch(e){} });
  musicNodes = [];
  if (musicCtx) { try { musicCtx.close(); } catch(e){} }
}

/* ═══ ЭКРАН ФАКТОВ ═══ */
let factIdx = 0, factsPaused = false, factTimer = null, progressTimer = null;
let elapsed = 0;
const TOTAL_TIME = 15000; // 20 секунд

function initFacts() {
  const dots = document.getElementById('fact-dots');
  FACTS.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'fact-dot' + (i === 0 ? ' on' : '');
    dots.appendChild(d);
  });
  showFact(0);
  startFactTimer();
  startProgress();
}

let factTransitioning = false;
function showFact(i) {
  const el = document.getElementById('fact-text');
  document.querySelectorAll('.fact-dot').forEach((d, j) => {
    d.classList.toggle('on', j === i);
  });
  if (factTransitioning) return;
  factTransitioning = true;
  // Fade out если есть текст
  const hadContent = el.innerHTML.trim().length > 0;
  el.classList.remove('show');
  setTimeout(() => {
    el.innerHTML = FACTS[i];
    void el.offsetHeight;
    el.classList.add('show');
    factTransitioning = false;
  }, hadContent ? 700 : 30);
}

function startFactTimer() {
  factTimer = setInterval(() => {
    if (factsPaused) return;
    factIdx = (factIdx + 1) % FACTS.length;
    showFact(factIdx);
  }, 3500);
}

function startProgress() {
  progressTimer = setInterval(() => {
    if (factsPaused) return;
    elapsed += 100;
    const pct = (elapsed / TOTAL_TIME) * 100;
    document.getElementById('facts-progress').style.width = pct + '%';
    if (elapsed >= TOTAL_TIME) {
      skipFacts();
    }
  }, 100);
}

function togglePause() {
  factsPaused = !factsPaused;
  const btn = document.getElementById('pause-btn');
  btn.textContent = factsPaused ? '▶ Продолжить' : '⏸ Пауза';
}

function skipFacts() {
  clearInterval(factTimer);
  clearInterval(progressTimer);
  document.getElementById('facts-screen').classList.add('hide');
  setTimeout(() => {
    document.getElementById('facts-screen').style.display = 'none';
    showLogo();
  }, 800);
}

/* ═══ ЛОГОТИП + ЗВУК ═══ */
function showLogo() {
  const logo = document.getElementById('logo-intro');
  logo.classList.add('on');
  playStartupSound();
  setTimeout(() => {
    // Показываем browse ПОД лого, потом плавно убираем лого
    document.getElementById('browse').style.visibility = 'visible';
    document.getElementById('browse').style.opacity = '0';
    document.getElementById('browse').style.transition = 'opacity 1s';
    requestAnimationFrame(() => {
      document.getElementById('browse').style.opacity = '1';
    });
    logo.classList.add('hide');
    setTimeout(() => {
      logo.style.display = 'none';
      setTimeout(() => {
        if (!musicPlaying) toggleMusic();
      }, 500);
    }, 1000);
  }, 3200);
}

/* ═══ КАРТА ═══ */
let currentSlide = 0, currentCityPhotos = [];

function openMap() {
  const modal = document.getElementById('map-modal');
  modal.classList.add('on');
  // Сброс анимаций точек
  setTimeout(() => {
    modal.querySelectorAll('.city-active, .city-inactive').forEach((el, i) => {
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = `cityAppear .5s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms forwards`;
    });
    const region = modal.querySelector('.kz-region');
    if (region) {
      region.style.animation = 'none';
      void region.offsetWidth;
      region.style.animation = 'mapAppear 1.2s cubic-bezier(0.16,1,0.3,1) forwards';
    }
  }, 100);
}

function closeMap() {
  document.getElementById('map-modal').classList.remove('on');
  document.getElementById('city-panel').classList.remove('on');
  document.querySelectorAll('.city-dot').forEach(d => d.classList.remove('active'));
}

function showCity(key) {
  if (key === 'none') {
    document.getElementById('city-name').textContent = 'Здесь вы ещё не были';
    document.getElementById('city-desc').textContent = 'Возможно, следующий эпизод вашей истории случится именно здесь ❤';
    document.getElementById('slides').innerHTML = '';
    document.getElementById('slide-nav').innerHTML = '';
    document.getElementById('city-panel').classList.add('on');
    return;
  }
  const city = CITIES[key];
  currentCityPhotos = city.photos;
  currentSlide = 0;

  const activeEl = document.getElementById('dot-' + key);
  if (activeEl) activeEl.classList.add('active');

  document.getElementById('city-name').textContent = city.name;
  document.getElementById('city-desc').textContent = city.desc;

  const slides = document.getElementById('slides');
  slides.innerHTML = '';
  city.photos.forEach((p, i) => {
    const img = document.createElement('img');
    img.src = p;
    img.className = 'slide' + (i === 0 ? ' on' : '');
    img.alt = city.name;
    img.style.cursor = 'zoom-in';
    // Клик по фото открывает лайтбокс на весь экран
    img.addEventListener('click', () => openLightbox(city.photos, i, city.name));
    slides.appendChild(img);
  });

  const nav = document.getElementById('slide-nav');
  nav.innerHTML = '';
  city.photos.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'slide-dot' + (i === 0 ? ' on' : '');
    d.onclick = () => goToSlide(i);
    nav.appendChild(d);
  });

  document.getElementById('city-panel').classList.add('on');
  // Плавно скроллим панель в вид
  setTimeout(() => {
    const panel = document.getElementById('city-panel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

// ═══ ЛАЙТБОКС ФОТО НА ВЕСЬ ЭКРАН ═══
let lightboxPhotos = [];
let lightboxIdx = 0;

function openLightbox(photos, startIdx, title) {
  lightboxPhotos = photos;
  lightboxIdx = startIdx;
  
  let lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.innerHTML = `
      <div class="lb-backdrop" onclick="closeLightbox()"></div>
      <button class="lb-close" onclick="closeLightbox()" aria-label="Закрыть">✕</button>
      <button class="lb-prev" onclick="lbPrev()" aria-label="Предыдущее">‹</button>
      <button class="lb-next" onclick="lbNext()" aria-label="Следующее">›</button>
      <div class="lb-title" id="lb-title"></div>
      <div class="lb-counter" id="lb-counter"></div>
      <div class="lb-stage">
        <img class="lb-image" id="lb-image" alt=""/>
      </div>
    `;
    document.body.appendChild(lb);
    
    // Свайпы на мобильных
    let touchStartX = 0;
    lb.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) {
        if (dx > 0) lbPrev(); else lbNext();
      }
    }, { passive: true });
  }
  
  updateLightbox(title);
  requestAnimationFrame(() => {
    lb.classList.add('on');
    document.body.style.overflow = 'hidden';
  });
}

function updateLightbox(title) {
  const img = document.getElementById('lb-image');
  const titleEl = document.getElementById('lb-title');
  const counter = document.getElementById('lb-counter');
  
  // Плавная замена фото
  img.style.opacity = '0';
  img.style.transform = 'scale(0.98)';
  
  setTimeout(() => {
    img.src = lightboxPhotos[lightboxIdx];
    img.onload = () => {
      img.style.opacity = '1';
      img.style.transform = 'scale(1)';
    };
  }, 150);
  
  if (title) titleEl.textContent = title;
  counter.textContent = (lightboxIdx + 1) + ' / ' + lightboxPhotos.length;
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.remove('on');
  document.body.style.overflow = '';
  setTimeout(() => { if (!lb.classList.contains('on')) lb.remove(); }, 400);
}

function lbNext() {
  lightboxIdx = (lightboxIdx + 1) % lightboxPhotos.length;
  updateLightbox();
}

function lbPrev() {
  lightboxIdx = (lightboxIdx - 1 + lightboxPhotos.length) % lightboxPhotos.length;
  updateLightbox();
}

function goToSlide(i) {
  currentSlide = i;
  document.querySelectorAll('.slide').forEach((s, j) => {
    s.classList.toggle('on', j === i);
  });
  document.querySelectorAll('.slide-dot').forEach((d, j) => {
    d.classList.toggle('on', j === i);
  });
}

function nextSlide() {
  goToSlide((currentSlide + 1) % currentCityPhotos.length);
}

function prevSlide() {
  goToSlide((currentSlide - 1 + currentCityPhotos.length) % currentCityPhotos.length);
}

/* ═══ ЭПИЗОДЫ ═══ */
const eps = КЛИЕНТ.эпизоды.map(ep => ({
  num: ep.номер,
  title: ep.название,
  blurb: ep.подзаголовок,
  story: ep.описание,
  thumb: ep.обложка,
  bg: ep.обложка,
  vid: ep.видео
}));

function buildEpisodesGrid() {
  const grid = document.getElementById('eps-grid');
  grid.innerHTML = '';
  eps.forEach((ep, i) => {
    const d = document.createElement('div');
    d.className = 'eps-big-card';
    d.id = 'eps-big-' + i;
    d.innerHTML = `
      <img class="eps-big-img" src="${ep.thumb}" alt="${ep.title}"/>
      <div class="eps-big-info">
        <div class="eps-big-num">Эпизод ${ep.num}</div>
        <div class="eps-big-title">${ep.title}</div>
        <div class="eps-big-desc">${ep.blurb || ''}</div>
      </div>`;
    d.addEventListener('click', () => {
      closeEpisodes();
      setTimeout(() => playEp(i), 300);
    });
    grid.appendChild(d);
  });
  // Add "+ Заказать ещё 1 серию" card
  const addCard = document.createElement('a');
  addCard.className = 'eps-add-card';
  addCard.href = 'https://wa.me/' + КЛИЕНТ.whatsapp + '?text=Хочу%20заказать%20ещё%201%20серию';
  addCard.target = '_blank';
  addCard.innerHTML = `
    <div class="eps-add-icon">+</div>
    <div class="eps-add-title">Заказать ещё 1 серию</div>
    <div class="eps-add-sub">Написать в WhatsApp</div>`;
  grid.appendChild(addCard);
}

function openEpisodes() {
  buildEpisodesGrid();
  document.getElementById('episodes-modal').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeEpisodes() {
  document.getElementById('episodes-modal').classList.remove('on');
  document.body.style.overflow = '';
}

function buildEps() {
  const row = document.getElementById('ep-row');
  if (!row) return; // ep-row больше нет в новом лейауте
  eps.forEach((ep, i) => {
    const d = document.createElement('div');
    d.className = 'ep-card';
    d.innerHTML = `
      <div style="position:relative;">
        <img class="ep-img" src="${ep.thumb}" alt="${ep.title}"/>
        <div class="ep-num-tag">Эп. ${ep.num}</div>
      </div>
      <div class="ep-info">
        <div class="ep-name">${ep.title}</div>
        <div class="ep-dur">Эпизод ${ep.num}</div>
      </div>`;
    let clicking = false;
    d.addEventListener('click', () => {
      if (clicking) return;
      clicking = true;
      setTimeout(() => { playEp(i); clicking = false; }, 200);
    });
    row.appendChild(d);
  });

    const addCard = document.createElement('a');
    addCard.className = 'ep-card';
    addCard.href = 'https://wa.me/' + КЛИЕНТ.whatsapp + '?text=Хочу%20заказать%20ещё%201%20серию';
    addCard.target = '_blank';
    addCard.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed rgba(183,28,28,0.4);background:rgba(183,28,28,0.05);text-decoration:none;color:#fff;min-height:170px;';
    addCard.innerHTML = `
      <div style="font-size:40px;color:var(--red2);margin-bottom:8px;">+</div>
      <div style="font-size:12px;font-weight:600;text-align:center;padding:0 12px;">Заказать ещё 1 серию</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px;">WhatsApp</div>`;
    row.appendChild(addCard);

}


/* ═══ MODAL ПОДРОБНЕЕ ═══ */
function openInfo() {
  const modal = document.getElementById('info-modal');
  
  // Заполняем данные из КЛИЕНТ
  fillInfoModal();
  
  modal.classList.add('on');
  // Сбросить и заново запустить анимации прогресс-баров и счётчиков
  setTimeout(() => resetAndAnimateCompat(modal), 100);
}

function fillInfoModal() {
  // Фото на фоне
  const img = document.getElementById('info-hero-img');
  if (img) img.src = BG;
  
  // Общая совместимость (в шапке)
  const score = document.getElementById('info-compat-score');
  if (score) {
    // Общая всегда 100%
    score.textContent = '100%';
    delete score.dataset.originalValue;
    delete score.dataset.animated;
  }
  
  // Параметры совместимости (4 прогресс-бара)
  const rows = document.getElementById('info-compat-rows');
  if (rows && КЛИЕНТ.параметры) {
    rows.innerHTML = КЛИЕНТ.параметры.map(p => {
      const pct = Math.min(p.процент, 100);
      return `
        <div class="compat-row">
          <div class="compat-row-head">
            <span class="compat-row-label">${p.название}</span>
            <span class="compat-row-val">${pct}%</span>
          </div>
          <div class="compat-track"><div class="compat-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');
  }
  
  // История (массив абзацев)
  const storyEl = document.getElementById('info-story');
  if (storyEl && КЛИЕНТ.история) {
    storyEl.innerHTML = КЛИЕНТ.история
      .map(p => `<p class="info-story-text">${p}</p>`)
      .join('');
  }
  
  // Цитата
  const quoteEl = document.getElementById('info-quote');
  if (quoteEl && КЛИЕНТ.цитата) {
    quoteEl.textContent = '«' + КЛИЕНТ.цитата + '»';
  }
  
  // Теги
  const tagsEl = document.getElementById('info-tags');
  if (tagsEl && КЛИЕНТ.теги) {
    tagsEl.innerHTML = КЛИЕНТ.теги
      .map(t => `<span class="info-tag">${t}</span>`)
      .join('');
  }
  
  // Правая колонка "Подробнее" — Она, Он, даты, города
  const detailsEl = document.getElementById('info-details-rows');
  if (detailsEl) {
    const items = [];
    if (КЛИЕНТ.она) items.push(['Она', КЛИЕНТ.она]);
    if (КЛИЕНТ.он) items.push(['Он', КЛИЕНТ.он]);
    if (КЛИЕНТ.датыКлючевые) {
      for (const [key, value] of Object.entries(КЛИЕНТ.датыКлючевые)) {
        items.push([key, value]);
      }
    }
    if (КЛИЕНТ.жанр) items.push(['Жанр', КЛИЕНТ.жанр]);
    detailsEl.innerHTML = items
      .map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`)
      .join('');
  }
}


function resetAndAnimateCompat(container) {
  // Сброс прогресс-баров с ограничением 100%
  container.querySelectorAll('.compat-fill').forEach(bar => {
    // Сохраним оригинальную ширину если не сохранена
    if (!bar.dataset.targetWidth) {
      const inline = bar.getAttribute('style') || '';
      const match = inline.match(/width:\s*(\d+)/);
      let target = match ? parseInt(match[1]) : 100;
      if (target > 100) target = 100;
      bar.dataset.targetWidth = target;
    }
    bar.style.setProperty('--target-width', bar.dataset.targetWidth + '%');
    bar.classList.remove('filled');
    void bar.offsetWidth;
  });
  // Сброс счётчиков
  container.querySelectorAll('.compat-score, .compat-row-val').forEach(el => {
    if (el.dataset.originalValue) {
      el.textContent = el.dataset.originalValue;
    } else {
      el.dataset.originalValue = el.textContent;
    }
    delete el.dataset.animated;
  });
  // Запуск заново с задержкой
  setTimeout(() => {
    container.querySelectorAll('.compat-fill').forEach((bar, i) => {
      setTimeout(() => bar.classList.add('filled'), i * 120);
    });
    container.querySelectorAll('.compat-score, .compat-row-val').forEach((el, i) => {
      const target = parseInt(el.dataset.originalValue);
      if (!isNaN(target)) {
        el.dataset.animated = '1';
        setTimeout(() => animateCounter(el, target, 1200), i * 120);
      }
    });
  }, 200);
}
function closeInfo() {
  document.getElementById('info-modal').classList.remove('on');
}
function closeInfoOutside(e) {
  if (e.target === document.getElementById('info-modal')) closeInfo();
}

/* ═══ ФИЛЬМЫ ═══ */
const MOVIES = КЛИЕНТ.фильмы.map(f => ({
  title: f.название,
  year: f.год,
  score: f.рейтинг,
  img: f.обложка,
  link: f.ссылка
}));

function buildMovies() {
  const row = document.getElementById('movies-row');
  MOVIES.forEach(m => {
    const d = document.createElement('div');
    d.className = 'movie-card';
    d.innerHTML = `
      <div class="movie-badge">★ ${m.score}</div>
      <a class="movie-watch" href="${m.link}" target="_blank" onclick="event.stopPropagation()">Кинопоиск</a>
      <img src="${m.img}" alt="${m.title}" onerror="this.style.background='linear-gradient(135deg,#1a0000,#B71C1C)';this.style.padding='20px';this.style.opacity='0.4';"/>
      <div class="movie-overlay">
        <div class="movie-title">${m.title}</div>
        <div class="movie-year">${m.year}</div>
      </div>`;
    d.addEventListener('click', () => window.open(m.link, '_blank'));
    row.appendChild(d);
  });
}




/* ═══ CREDITS ═══ */
let crAnim = null, crListenersAdded = false;
function fillCredits() {
  // Фото пары
  const photos = document.getElementById('cr-photos');
  if (photos) {
    const shots = [];
    if (typeof EP1 !== 'undefined') shots.push(EP1);
    if (typeof EP2 !== 'undefined') shots.push(EP2);
    if (typeof EP3 !== 'undefined') shots.push(EP3);
    photos.innerHTML = shots.map((src, i) => `<img src="${src}" alt="${i+1}"/>`).join('');
  }
  // Имена
  const name = document.getElementById('cr-name');
  if (name) name.innerHTML = `${КЛИЕНТ.он} <em>&amp;</em> ${КЛИЕНТ.она}`;
  // Подзаголовок
  const sub = document.getElementById('cr-sub');
  if (sub) sub.textContent = `История любви · ${КЛИЕНТ.датаНачала} — навсегда`;
  // История (текст)
  const love = document.getElementById('cr-love');
  if (love && КЛИЕНТ.история) {
    love.innerHTML = КЛИЕНТ.история.map(p => `${p}<br/><br/>`).join('');
  }
  // Статистика
  const stats = document.getElementById('cr-stats');
  if (stats && КЛИЕНТ.статистика) {
    stats.innerHTML = КЛИЕНТ.статистика.map(s => 
      `<div><span class="cr-stat-n">${s.число}</span><div class="cr-stat-l">${s.подпись}</div></div>`
    ).join('');
  }
  // Роли (Главная героиня, Главный герой, Города, Даты, Рейтинг)
  const roles = document.getElementById('cr-roles');
  if (roles) {
    const rolesList = [];
    if (КЛИЕНТ.она) rolesList.push(['Главная героиня', КЛИЕНТ.она]);
    if (КЛИЕНТ.он) rolesList.push(['Главный герой', КЛИЕНТ.он]);
    if (КЛИЕНТ.город) rolesList.push(['Города', КЛИЕНТ.город]);
    if (КЛИЕНТ.датаНачала) rolesList.push(['Начало', КЛИЕНТ.датаНачала]);
    // Добавим ключевые даты
    if (КЛИЕНТ.датыКлючевые) {
      for (const [k, v] of Object.entries(КЛИЕНТ.датыКлючевые)) {
        if (k !== 'Начало' && k !== 'Города') rolesList.push([k, v]);
      }
    }
    if (КЛИЕНТ.рейтинг) rolesList.push(['Рейтинг', '★★★★★ ' + КЛИЕНТ.рейтинг]);
    roles.innerHTML = rolesList.map(([k, v]) => 
      `<div class="cr-role"><span class="cr-role-k">${k}</span><div class="cr-role-dots"></div><span class="cr-role-v">${v}</span></div>`
    ).join('');
  }
}

function startCredits() {
  if (crAnim) { cancelAnimationFrame(crAnim); crAnim = null; }
  fillCredits();
  goBack(); // закрыть плеер
  const cr = document.getElementById('credits');
  const scroll = document.getElementById('cr-scroll');
  scroll.style.transform = 'translateX(-50%) translateY(0)';
  cr.classList.add('on');
  let pos = 0, paused = false, last = null;
  if (!crListenersAdded) {
    scroll.addEventListener('mouseenter', () => paused = true);
    scroll.addEventListener('mouseleave', () => paused = false);
    scroll.addEventListener('touchstart', () => paused = true, { passive: true });
    scroll.addEventListener('touchend', () => setTimeout(() => paused = false, 2000), { passive: true });
    crListenersAdded = true;
  }
  function tick(ts) {
    if (!last) last = ts;
    const dt = (ts - last) / 1000; last = ts;
    if (!paused) { pos += 62 * dt; scroll.style.transform = `translateX(-50%) translateY(-${pos}px)`; }
    crAnim = requestAnimationFrame(tick);
  }
  crAnim = requestAnimationFrame(tick);
}
function closeCredits() {
  document.getElementById('credits').classList.remove('on');
  if (crAnim) { cancelAnimationFrame(crAnim); crAnim = null; }
}

/* ═══ PLAYER ═══ */
let cur = 0, isMini = false, isPlaying = false;

function playEp(i) {
  const v = document.getElementById('pl-video');
  v.pause();
  document.getElementById('pl-toast').classList.remove('show');
  showEpIntro(i, () => {
    cur = i;
    const ep = eps[i];
    document.getElementById('pl-bg').style.backgroundImage = `url('${ep.bg}')`;
    document.getElementById('pl-fs-title').textContent = ep.title;
    document.getElementById('pl-fs-sub').textContent = `Эпизод ${ep.num} · ${КЛИЕНТ.он} & ${КЛИЕНТ.она}`;
    document.getElementById('pl-ep-badge').textContent = `Эп. ${ep.num}`;
    document.getElementById('pl-ep-title-bar').textContent = ep.title;
    if (i + 1 < eps.length) document.getElementById('toast-title').textContent = eps[i + 1].title;
    isMini = false;
    document.getElementById('player').classList.remove('mini');
    document.getElementById('size-btn').textContent = '⊡ Свернуть';
    document.getElementById('browse').style.display = 'none';
    document.getElementById('player').classList.add('on');
    // Останавливаем фоновую музыку на время видео
    if (musicPlaying) toggleMusic();
    loadVideo(ep.vid);
  });
}

function showEpIntro(i, cb) {
  const ep = eps[i];
  document.getElementById('ep-lbl-intro').textContent = `Эпизод ${ep.num} · ${ep.title}`;
  const ei = document.getElementById('ep-intro');
  ei.querySelectorAll('.ep-n,.ep-pair,.ep-lbl-intro').forEach(el => {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = '';
  });
  ei.classList.add('on');
  setTimeout(() => { ei.classList.remove('on'); cb(); }, 1800);
}

// ═══ ОЗВУЧКА ЭПИЗОДОВ ═══
let voiceAudio = null;

function stopVoice() {
  if (voiceAudio) {
    try { voiceAudio.pause(); voiceAudio.currentTime = 0; } catch(e) {}
    voiceAudio = null;
  }
}

function startVoice(voiceSrc, videoElement) {
  stopVoice();
  if (!voiceSrc || !voiceSrc.trim()) return;
  try {
    voiceAudio = new Audio(voiceSrc);
    voiceAudio.volume = 1.0;
    // Синхронизация с видео — воспр./пауза/сик
    videoElement.addEventListener('pause', () => { if (voiceAudio) voiceAudio.pause(); });
    videoElement.addEventListener('play', () => { if (voiceAudio) voiceAudio.play().catch(() => {}); });
    videoElement.addEventListener('seeked', () => { if (voiceAudio) voiceAudio.currentTime = videoElement.currentTime; });
    voiceAudio.play().catch(e => console.log('Озвучка не запустилась:', e));
  } catch(e) {
    console.log('Ошибка загрузки озвучки:', e);
  }
}

function loadVideo(src) {
  const v = document.getElementById('pl-video');
  const loading = document.getElementById('pl-loading');
  loading.classList.remove('hide');
  document.getElementById('pl-prog').style.width = '0%';
  document.getElementById('t-cur').textContent = '0:00';
  document.getElementById('t-tot').textContent = '0:00';
  
  // Остановим озвучку предыдущего эпизода
  stopVoice();
  
  v.src = src;
  v.muted = false;
  v.volume = 1.0;
  v.load();
  v.play().then(() => {
    loading.classList.add('hide');
    isPlaying = true;
    document.getElementById('ico-play').style.display = 'none';
    document.getElementById('ico-pause').style.display = 'block';
    // Запустим озвучку текущего эпизода если она есть
    if (eps[cur] && eps[cur].voice) {
      startVoice(eps[cur].voice, v);
    }
  }).catch(() => {
    loading.classList.add('hide');
    document.getElementById('ico-play').style.display = 'block';
    document.getElementById('ico-pause').style.display = 'none';
  });
  v.ontimeupdate = () => {
    if (!v.duration) return;
    const pct = (v.currentTime / v.duration) * 100;
    document.getElementById('pl-prog').style.width = pct + '%';
    const fmt = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    document.getElementById('t-cur').textContent = fmt(v.currentTime);
    document.getElementById('t-tot').textContent = fmt(v.duration);
    if (pct >= 80 && cur + 1 < eps.length) document.getElementById('pl-toast').classList.add('show');
  };
  v.onended = () => {
    isPlaying = false;
    stopVoice();
    if (cur + 1 < eps.length) {
      nextEp();
    } else {
      setTimeout(startCredits, 800);
    }
  };
}

function togglePlay() {
  const v = document.getElementById('pl-video');
  if (v.paused) {
    v.play();
    isPlaying = true;
    document.getElementById('ico-play').style.display = 'none';
    document.getElementById('ico-pause').style.display = 'block';
  } else {
    v.pause();
    isPlaying = false;
    document.getElementById('ico-play').style.display = 'block';
    document.getElementById('ico-pause').style.display = 'none';
  }
}

function seekBy(sec) {
  const v = document.getElementById('pl-video');
  v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec));
}

function seekVideo(e) {
  const v = document.getElementById('pl-video');
  if (!v.duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
}

function toggleMini() {
  isMini = !isMini;
  document.getElementById('player').classList.toggle('mini', isMini);
  document.getElementById('size-btn').textContent = isMini ? '⛶ На весь экран' : '⊡ Свернуть';
  // Показываем главный экран когда плеер в мини-режиме
  document.getElementById('browse').style.display = isMini ? 'block' : 'none';
}

function nextEp() {
  document.getElementById('pl-toast').classList.remove('show');
  if (cur < eps.length - 1) playEp(cur + 1);
}

function prevEp() {
  document.getElementById('pl-toast').classList.remove('show');
  if (cur > 0) playEp(cur - 1);
}

function goBack() {
  const v = document.getElementById('pl-video');
  v.pause();
  v.src = '';
  isPlaying = false;
  document.getElementById('pl-toast').classList.remove('show');
  document.getElementById('player').classList.remove('on', 'mini');
  document.getElementById('browse').style.display = 'block';
  isMini = false;
  stopVoice();
}

/* ═══ ESC ═══ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeLightbox(); closeMap(); closeInfo(); closeCredits(); closeEpisodes(); closeProfile(); if (document.getElementById('player').classList.contains('on')) goBack(); }
  if (e.key === ' ' && document.getElementById('player').classList.contains('on')) { e.preventDefault(); togglePlay(); }
  if (e.key === 'ArrowLeft' && document.getElementById('player').classList.contains('on')) seekBy(-10);
  if (e.key === 'ArrowRight' && document.getElementById('player').classList.contains('on')) seekBy(10);
  // Лайтбокс: стрелки листают фото
  if (document.getElementById('lightbox') && document.getElementById('lightbox').classList.contains('on')) {
    if (e.key === 'ArrowLeft') lbPrev();
    if (e.key === 'ArrowRight') lbNext();
  }
});


/* ═══════════════════════════════════════════════
   АНИМАЦИИ UX/UI
   ═══════════════════════════════════════════════ */

// ─── 1. INTERSECTION OBSERVER — ПОЯВЛЕНИЕ ПРИ СКРОЛЛЕ ───
function initScrollReveal() {
  const targets = document.querySelectorAll('.section, .compat-block, .info-grid, .movies-row, .kz-map-svg');
  targets.forEach((el, i) => {
    el.classList.add('reveal');
    if (i % 3 === 1) el.classList.add('delay-1');
    if (i % 3 === 2) el.classList.add('delay-2');
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Прогресс-бары
        entry.target.querySelectorAll('.compat-fill').forEach(bar => {
          const w = bar.getAttribute('style');
          if (w) {
            const match = w.match(/width:(\d+)%/);
            if (match) {
              bar.style.setProperty('--target-width', match[1] + '%');
              setTimeout(() => bar.classList.add('filled'), 200);
            }
          }
        });
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(el => observer.observe(el));
}

// ─── 2. KINETIC TYPOGRAPHY НА ИМЕНАХ ───
function replayKineticNames() {
  const chars = document.querySelectorAll('.welcome-title .kinetic-char');
  chars.forEach(ch => ch.classList.remove('on'));
  setTimeout(() => {
    chars.forEach((ch, i) => {
      setTimeout(() => ch.classList.add('on'), i * 40);
    });
  }, 100);
}

function initKineticNames() {
  const title = document.querySelector('.welcome-title');
  if (!title) return;
  const text = title.innerHTML;
  // Разобьём на символы, сохраняя <em> и <br>
  const parts = text.split(/(<em>[^<]*<\/em>|<br\s*\/?>)/);
  let html = '';
  let charIdx = 0;
  parts.forEach(part => {
    if (part.match(/<em>/) || part.match(/<br/)) {
      html += part;
    } else {
      part.split('').forEach(ch => {
        if (ch === ' ') html += '<span class="kinetic-char">&nbsp;</span>';
        else html += `<span class="kinetic-char">${ch}</span>`;
        charIdx++;
      });
    }
  });
  title.innerHTML = html;
  // Также обработаем em отдельно
  document.querySelectorAll('.welcome-title em').forEach(em => {
    const emText = em.textContent;
    em.innerHTML = emText.split('').map(ch => 
      `<span class="kinetic-char">${ch === ' ' ? '&nbsp;' : ch}</span>`
    ).join('');
  });
  // Плавное появление букв
  setTimeout(() => {
    document.querySelectorAll('.welcome-title .kinetic-char').forEach((ch, i) => {
      setTimeout(() => ch.classList.add('on'), i * 40);
    });
  }, 300);
}

// ─── 3. PARALLAX НА HERO ───
function initParallax() {
  const bg = document.querySelector('.welcome-bg');
  if (!bg) return;
  const welcome = document.querySelector('.welcome-screen');
  if (!welcome) return;
  welcome.addEventListener('mousemove', (e) => {
    const rect = welcome.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    bg.style.transform = `translate(${x * -20}px, ${y * -15}px) scale(1.05)`;
  });
  welcome.addEventListener('mouseleave', () => {
    bg.style.transform = 'translate(0,0) scale(1)';
  });
}

// ─── 4. NUMERIC COUNTER ДЛЯ СОВМЕСТИМОСТИ ───
function animateCounter(el, target, duration = 1500) {
  const cappedTarget = Math.min(target, 100);
  const start = 0;
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(start + (cappedTarget - start) * eased);
    el.textContent = value + '%';
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function initCounters() {
  // Основной счётчик 100% в модалке "Подробнее"
  const scores = document.querySelectorAll('.compat-score');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = '1';
        const target = parseInt(entry.target.textContent);
        if (!isNaN(target)) animateCounter(entry.target, target);
      }
    });
  }, { threshold: 0.5 });
  scores.forEach(el => observer.observe(el));
  
  // Проценты у прогресс-баров тоже
  const rowVals = document.querySelectorAll('.compat-row-val');
  const observer2 = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = '1';
        const target = parseInt(entry.target.textContent);
        if (!isNaN(target)) animateCounter(entry.target, target, 1200);
      }
    });
  }, { threshold: 0.5 });
  rowVals.forEach(el => observer2.observe(el));
}

// ─── 5. NAVBAR HIDE/SHOW ПРИ СКРОЛЛЕ ───
function initNavScroll() {
  const nav = document.querySelector('.nf-nav');
  if (!nav) return;
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 100) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
    if (y > lastY && y > 300) nav.classList.add('hidden');
    else nav.classList.remove('hidden');
    lastY = y;
  }, { passive: true });
}

// ─── 6. 3D TILT НА ЭПИЗОДАХ ───
function initTilt() {
  const cards = document.querySelectorAll('.ep-card, .eps-big-card, .movie-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotY = x * 10;
      const rotX = -y * 10;
      const baseTransform = card.classList.contains('eps-big-card') 
        ? 'translateY(-10px) scale(1.03)' 
        : 'translateY(-8px) scale(1.05)';
      card.style.transform = `${baseTransform} perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ─── 7. АНИМИРОВАННЫЕ ЗВЁЗДЫ РЕЙТИНГА ───
function animateStars() {
  document.querySelectorAll('.stars').forEach(starEl => {
    if (starEl.dataset.animated) return;
    starEl.dataset.animated = '1';
    const text = starEl.textContent.trim();
    starEl.classList.add('stars-anim');
    starEl.innerHTML = text.split('').map(ch => `<span>${ch}</span>`).join('');
    const spans = starEl.querySelectorAll('span');
    // Наблюдатель — запустить когда попадает в вид
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          spans.forEach((s, i) => setTimeout(() => s.classList.add('on'), i * 120));
          obs.disconnect();
        }
      });
    });
    obs.observe(starEl);
  });
}

// ─── 8. SMOOTH SCROLL ДЛЯ ЯКОРНЫХ ССЫЛОК ───
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ─── ЗАПУСК ВСЕХ АНИМАЦИЙ ───
function initAllAnimations() {
  initScrollReveal();
  initKineticNames();
  initParallax();
  initCounters();
  initNavScroll();
  initTilt();
  animateStars();
  initSmoothScroll();
}




/* ═══════════════════════════════════════════════
   ПРЕМИУМ АНИМАЦИИ 2026
   ═══════════════════════════════════════════════ */

// ─── 1. CURSOR SPOTLIGHT + FOLLOWER ───
function initCustomCursor() {
  // Только для desktop с mouse
  if (window.matchMedia('(hover:none)').matches) return;
  
  const spotlight = document.createElement('div');
  spotlight.className = 'cursor-spotlight';
  document.body.appendChild(spotlight);
  
  const follower = document.createElement('div');
  follower.className = 'cursor-follower';
  document.body.appendChild(follower);
  
  document.body.classList.add('has-custom-cursor');
  
  let mouseX = 0, mouseY = 0;
  let spotX = 0, spotY = 0;
  let follX = 0, follY = 0;
  let active = false;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!active) {
      active = true;
      spotlight.classList.add('active');
      follower.classList.add('active');
    }
  }, { passive: true });
  
  document.addEventListener('mouseleave', () => {
    active = false;
    spotlight.classList.remove('active');
    follower.classList.remove('active');
  });
  
  // Плавное следование (lerp)
  function animate() {
    // Spotlight — медленно, для мягкого свечения
    spotX += (mouseX - spotX) * 0.08;
    spotY += (mouseY - spotY) * 0.08;
    spotlight.style.transform = `translate(${spotX}px, ${spotY}px) translate(-50%,-50%)`;
    
    // Follower — быстро, но с небольшой задержкой
    follX += (mouseX - follX) * 0.25;
    follY += (mouseY - follY) * 0.25;
    follower.style.transform = `translate(${follX}px, ${follY}px) translate(-50%,-50%)`;
    
    requestAnimationFrame(animate);
  }
  animate();
  
  // Курсор становится "рукой" на кликабельных
  const hoverables = 'a, button, .ep-card, .movie-card, .eps-big-card, .city-active, .city-inactive, .music-btn, .compat-bar, .info-tag, [onclick]';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverables)) {
      follower.classList.add('hover-link');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverables)) {
      follower.classList.remove('hover-link');
    }
  });
}

// ─── 2. MAGNETIC BUTTONS ───
function initMagneticButtons() {
  if (window.matchMedia('(hover:none)').matches) return;
  
  const magnets = document.querySelectorAll('.btn-play, .btn-more, .info-btn-play, .info-btn-list, .map-btn, .music-btn');
  const strength = 0.4;
  const radius = 80;
  
  magnets.forEach(btn => {
    btn.classList.add('magnetic');
    let currentX = 0, currentY = 0;
    let targetX = 0, targetY = 0;
    let animating = false;
    
    function tick() {
      currentX += (targetX - currentX) * 0.2;
      currentY += (targetY - currentY) * 0.2;
      if (Math.abs(targetX - currentX) < 0.1 && Math.abs(targetY - currentY) < 0.1 && targetX === 0 && targetY === 0) {
        btn.style.transform = '';
        animating = false;
        return;
      }
      btn.style.transform = `translate(${currentX}px, ${currentY}px)`;
      requestAnimationFrame(tick);
    }
    
    document.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const btnCenterX = rect.left + rect.width / 2;
      const btnCenterY = rect.top + rect.height / 2;
      const dx = e.clientX - btnCenterX;
      const dy = e.clientY - btnCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius) {
        targetX = dx * strength;
        targetY = dy * strength;
        if (!animating) { animating = true; tick(); }
      } else if (targetX !== 0 || targetY !== 0) {
        targetX = 0; targetY = 0;
        if (!animating) { animating = true; tick(); }
      }
    }, { passive: true });
    
    btn.addEventListener('mouseleave', () => {
      targetX = 0; targetY = 0;
    });
  });
}

// ─── 3. SCROLL-DRIVEN ZOOM HERO ───
function initScrollHero() {
  const bg = document.querySelector('.welcome-bg');
  const content = document.querySelector('.welcome-content');
  if (!bg) return;
  
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const maxScroll = window.innerHeight;
        const progress = Math.min(y / maxScroll, 1);
        
        // Плавный zoom и blur фона по мере скролла
        const scale = 1 + progress * 0.15;
        const blur = progress * 8;
        bg.style.transform = `scale(${scale})`;
        bg.style.filter = `blur(${blur}px)`;
        
        // Контент немного уходит наверх и становится прозрачным
        if (content) {
          content.style.transform = `translateY(${-y * 0.3}px)`;
          content.style.opacity = 1 - progress * 0.7;
        }
        
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ─── 4. TEXT SCRAMBLE НА "netfilm.studio" ───
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#@%$';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 30);
      const end = start + Math.floor(Math.random() * 30);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          this.queue[i].char = char;
        }
        output += `<span class="scr-char scrambling">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
}

function initTextScramble() {
  const brand = document.querySelector('.nf-brand');
  if (!brand) return;
  const original = brand.textContent;
  brand.classList.add('scramble');
  
  const scramble = new TextScramble(brand);
  
  // При старте — эффект появления
  setTimeout(() => scramble.setText(original), 600);
  
  // При hover — re-scramble
  brand.addEventListener('mouseenter', () => {
    scramble.setText(original);
  });
}

// ─── 5. HOVER-СВЕЧЕНИЕ ПО КАРТОЧКАМ ЭПИЗОДОВ ───
function initCardGlow() {
  if (window.matchMedia('(hover:none)').matches) return;
  
  const cards = document.querySelectorAll('.ep-card, .eps-big-card, .movie-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', x + '%');
      card.style.setProperty('--mouse-y', y + '%');
      card.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(211,47,47,0.15) 0%, var(--card) 60%)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.background = '';
    });
  });
}

// ─── ЗАПУСК ВСЕХ ПРЕМИУМ АНИМАЦИЙ ───
function initPremiumAnimations() {
  initCustomCursor();
  initMagneticButtons();
  initScrollHero();
  initTextScramble();
  initCardGlow();
  initHeroTilt();
  setTimeout(initSoundDesign, 500);
  setTimeout(initMusicAutoStop, 800);
}




/* ═══════════════════════════════════════════════
   SOUND DESIGN — микро-звуки UI
   Генерятся через Web Audio API, mp3 не грузятся
   ═══════════════════════════════════════════════ */
let soundCtx = null;
let soundEnabled = true; // Можно выключить кнопкой

function getSoundCtx() {
  if (!soundCtx) {
    try {
      soundCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) { return null; }
  }
  if (soundCtx.state === 'suspended') soundCtx.resume();
  return soundCtx;
}

// Универсальный генератор звука
function playTone({ freq = 440, duration = 0.1, volume = 0.1, type = 'sine', attack = 0.005, decay = null, filter = 4000 }) {
  if (!soundEnabled) return;
  const ctx = getSoundCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const flt = ctx.createBiquadFilter();
  flt.type = 'lowpass';
  flt.frequency.value = filter;
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(flt);
  flt.connect(gain);
  gain.connect(ctx.destination);
  const d = decay || duration;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, now + attack + d);
  osc.start(now);
  osc.stop(now + attack + d + 0.05);
}

// Готовые пресеты звуков
const sounds = {
  // Тихий "тик" при hover — минималистичный
  hover: () => playTone({ freq: 800, duration: 0.03, volume: 0.02, type: 'sine', filter: 6000 }),
  
  // Мягкий клик — короткий низкий
  click: () => {
    playTone({ freq: 600, duration: 0.06, volume: 0.05, type: 'sine' });
    playTone({ freq: 1200, duration: 0.04, volume: 0.03, type: 'sine' });
  },
  
  // Открытие модалки — плавный подъём
  open: () => {
    playTone({ freq: 400, duration: 0.15, volume: 0.06, type: 'sine' });
    setTimeout(() => playTone({ freq: 600, duration: 0.15, volume: 0.05, type: 'sine' }), 40);
    setTimeout(() => playTone({ freq: 800, duration: 0.2, volume: 0.04, type: 'sine' }), 80);
  },
  
  // Закрытие модалки — плавный спуск
  close: () => {
    playTone({ freq: 800, duration: 0.1, volume: 0.05, type: 'sine' });
    setTimeout(() => playTone({ freq: 500, duration: 0.15, volume: 0.04, type: 'sine' }), 50);
  },
  
  // Успех — небольшой аккорд
  success: () => {
    playTone({ freq: 523, duration: 0.15, volume: 0.06, type: 'sine' }); // C
    playTone({ freq: 659, duration: 0.15, volume: 0.05, type: 'sine' }); // E
    setTimeout(() => playTone({ freq: 784, duration: 0.25, volume: 0.05, type: 'sine' }), 100); // G
  },
  
  // Переключение (свайп, next)
  swipe: () => {
    playTone({ freq: 1000, duration: 0.05, volume: 0.03, type: 'sine' });
    setTimeout(() => playTone({ freq: 1400, duration: 0.05, volume: 0.02, type: 'sine' }), 30);
  },
  
  // Notification / плавный blip
  notify: () => {
    playTone({ freq: 880, duration: 0.08, volume: 0.05, type: 'sine' });
    setTimeout(() => playTone({ freq: 1108, duration: 0.1, volume: 0.04, type: 'sine' }), 60);
  },
};

// Автопривязка звуков к элементам
function initMusicAutoStop() {
  // При клике на любой интерактив (кроме кнопки музыки) — остановить фоновую музыку
  document.addEventListener('click', (e) => {
    if (!musicPlaying) return;
    const target = e.target;
    // Игнорируем клик по самой кнопке музыки
    if (target.closest('.music-btn')) return;
    // Игнорируем клики на пустое место (не по кликабельным элементам)
    const isInteractive = target.closest('button, a, .ep-card, .movie-card, .eps-big-card, .city-active, .city-inactive, [onclick]');
    if (!isInteractive) return;
    // Останавливаем музыку
    toggleMusic();
  });
}

function initSoundDesign() {
  // Только desktop — на мобильных не имеет смысла (тактильная обратная связь важнее)
  if (window.matchMedia('(hover:none)').matches) return;
  
  // Hover-звуки на всех кликабельных
  const hoverables = document.querySelectorAll('.btn-play, .btn-more, .info-btn-play, .info-btn-list, .map-btn, .music-btn, .ep-card, .movie-card, .eps-big-card, .city-active, .city-inactive, .pause-btn, .skip-btn, .info-tag, .sec-see-all');
  
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', sounds.hover);
  });
  
  // Click-звуки
  document.querySelectorAll('.btn-play, .btn-more, .info-btn-play, .info-btn-list').forEach(el => {
    el.addEventListener('click', sounds.click);
  });
  
  // Карточки эпизодов — swipe при клике
  document.querySelectorAll('.ep-card, .eps-big-card, .movie-card').forEach(el => {
    el.addEventListener('click', sounds.swipe);
  });
  
  // Города на карте
  document.querySelectorAll('.city-active, .city-inactive').forEach(el => {
    el.addEventListener('click', sounds.notify);
  });
  
  // Модалки — open/close звуки
  const origOpenInfo = window.openInfo;
  const origOpenMap = window.openMap;
  const origOpenEpisodes = window.openEpisodes;
  const origCloseInfo = window.closeInfo;
  const origCloseMap = window.closeMap;
  const origCloseEpisodes = window.closeEpisodes;
  
  if (origOpenInfo) window.openInfo = function() { sounds.open(); return origOpenInfo.apply(this, arguments); };
  if (origOpenMap) window.openMap = function() { sounds.open(); return origOpenMap.apply(this, arguments); };
  if (origOpenEpisodes) window.openEpisodes = function() { sounds.open(); return origOpenEpisodes.apply(this, arguments); };
  if (origCloseInfo) window.closeInfo = function() { sounds.close(); return origCloseInfo.apply(this, arguments); };
  if (origCloseMap) window.closeMap = function() { sounds.close(); return origCloseMap.apply(this, arguments); };
  if (origCloseEpisodes) window.closeEpisodes = function() { sounds.close(); return origCloseEpisodes.apply(this, arguments); };
}

// Кнопка отключения звуков UI (интегрируется с music-btn или отдельно)
function toggleUISound() {
  soundEnabled = !soundEnabled;
  return soundEnabled;
}

/* ═══════════════════════════════════════════════
   TILT НА HERO ФОТО — 3D эффект наклона
   ═══════════════════════════════════════════════ */
function initHeroTilt() {
  if (window.matchMedia('(hover:none)').matches) return;
  const bg = document.querySelector('.welcome-bg');
  const welcome = document.querySelector('.welcome-screen');
  if (!bg || !welcome) return;
  
  welcome.style.perspective = '1200px';
  
  welcome.addEventListener('mousemove', (e) => {
    const rect = welcome.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotY = x * 6;
    const rotX = -y * 6;
    bg.style.transform = `translate(${x * -20}px, ${y * -15}px) scale(1.05) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });
  welcome.addEventListener('mouseleave', () => {
    bg.style.transform = 'translate(0,0) scale(1) rotateX(0) rotateY(0)';
  });
}

/* ═══════════════════════════════════════════════
   MARQUEE ПОЛОСА — бегущая строка внизу
   ═══════════════════════════════════════════════ */





/* ═══════════════════════════════════════════════
   PROFILE MODAL — как в Netflix
   ═══════════════════════════════════════════════ */
function openProfile() {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  
  // Обновим данные из КЛИЕНТ
  const nameEl = modal.querySelector('.profile-name');
  const avatarBig = modal.querySelector('.profile-avatar-big');
  const sinceEl = modal.querySelector('.profile-since');
  const thumb = document.getElementById('prof-thumb');
  
  if (nameEl) nameEl.textContent = КЛИЕНТ.она;
  if (avatarBig) avatarBig.textContent = КЛИЕНТ.она.charAt(0);
  if (sinceEl) sinceEl.textContent = 'С нами с ' + КЛИЕНТ.датаНачала;
  
  // Установить обложку "Продолжить смотреть" из первого эпизода
  if (thumb && eps[0] && eps[0].thumb) {
    thumb.style.backgroundImage = `url('${eps[0].thumb}')`;
  }
  
  // Обновим счётчики stats с реальными данными
  const stats = modal.querySelectorAll('.profile-stat-num[data-target]');
  stats.forEach(el => {
    // Первая — количество эпизодов
    if (el.dataset.target === '3') {
      el.dataset.target = eps.length;
    }
    // Вторая — совместимость
    if (el.dataset.target === '100') {
      el.dataset.target = КЛИЕНТ.совместимость || 100;
    }
  });
  
  modal.classList.add('on');
  
  // Анимация счётчиков после открытия
  setTimeout(() => {
    stats.forEach(el => {
      const target = parseInt(el.dataset.target);
      if (!isNaN(target)) {
        el.textContent = '0';
        animateCounter(el, target, 1200);
      }
    });
    // Убрать % у первого (эпизоды — не проценты)
    const first = stats[0];
    if (first) {
      setTimeout(() => {
        first.textContent = first.textContent.replace('%', '');
      }, 1250);
    }
  }, 300);
}

function closeProfile() {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  modal.classList.remove('on');
}

function closeProfileOutside(e) {
  if (e.target.id === 'profile-modal') closeProfile();
}


/* ═══ СТАРТ ═══ */
// Wait for DOM to be fully ready
function initAll() {
  replacePlaceholders();
  setTimeout(initAllAnimations, 100);
  setTimeout(initPremiumAnimations, 200);
  initFacts();
  buildEps();
  buildMovies();
  // Set welcome background
  const wbg = document.getElementById('welcome-bg-img');
  if (wbg && typeof BG !== 'undefined') wbg.style.backgroundImage = "url('" + BG + "')";
  // Описание на главном
  const desc = document.getElementById('welcome-desc');
  if (desc && КЛИЕНТ.описание) desc.textContent = КЛИЕНТ.описание;
  // Credits photos теперь заполняются в fillCredits() при запуске титров
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
