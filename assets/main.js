/*
 * Main page logic for the academic homepage.
 *
 * Extracted verbatim from the inline <script> at the bottom of index.html
 * (kept as an external file so changes show up cleanly in diffs/PRs).
 * Loaded at the end of <body>, so the DOM is fully parsed before it runs.
 *
 * Covers: theme toggle, language toggle (i18n), terminal, music player,
 * decorative effects (gated on window.__effectsLite), the effects/perf
 * toggle, and dynamic loading of the Live2D mascot (live2d.min.js +
 * waifu-tips.js).
 */
function getActionButtonLanguage() {
  var storedLang = null;
  try { storedLang = localStorage.getItem('lang'); } catch (e) {}
  var htmlLang = document.documentElement.getAttribute('lang') || 'en';
  return storedLang === 'zh' || htmlLang.indexOf('zh') === 0 ? 'zh' : 'en';
}

function setButtonCopy(button, label) {
  if (!button) return;
  button.setAttribute('title', label);
  button.setAttribute('aria-label', label);
}

function syncActionButtons() {
  var isZh = getActionButtonLanguage() === 'zh';

  var themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    var currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    setButtonCopy(themeToggle, currentTheme === 'dark'
      ? (isZh ? '切换到浅色模式' : 'Switch to light mode')
      : (isZh ? '切换到深色模式' : 'Switch to dark mode'));
  }

  var langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    var langLabel = langToggle.querySelector('.lang-label');
    if (langLabel) langLabel.textContent = isZh ? 'EN' : '中';
    setButtonCopy(langToggle, isZh ? '切换到英文' : 'Switch to Chinese');
  }

  var terminalToggle = document.getElementById('terminal-toggle');
  if (terminalToggle) {
    var terminalModal = document.getElementById('terminal-modal');
    var terminalOpen = terminalToggle.getAttribute('aria-expanded') === 'true' ||
      !!(terminalModal && terminalModal.classList.contains('visible'));
    terminalToggle.setAttribute('aria-expanded', terminalOpen ? 'true' : 'false');
    setButtonCopy(terminalToggle, terminalOpen
      ? (isZh ? '关闭终端控制台' : 'Close console terminal')
      : (isZh ? '打开终端控制台' : 'Open console terminal'));
  }

  var effectsToggle = document.getElementById('effects-toggle');
  if (effectsToggle) {
    var effectsLite = document.documentElement.classList.contains('effects-lite');
    setButtonCopy(effectsToggle, effectsLite
      ? (isZh ? '开启完整视觉效果' : 'Enable full visual effects')
      : (isZh ? '开启性能模式' : 'Enable performance mode'));
  }
}

window.syncActionButtons = syncActionButtons;

// 1. Theme Toggle Logic
var themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', function () {
    var currentTheme = document.documentElement.getAttribute('data-theme');
    var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    syncActionButtons();

    // Notify any active components (like mascot, if listening)
    window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: newTheme } }));
  });
}

// 1b. Visual-effects / performance toggle (full <-> lite). Reload so the
// decorative effect loops re-read window.__effectsLite cleanly.
var effectsToggleBtn = document.getElementById('effects-toggle');
if (effectsToggleBtn) {
  effectsToggleBtn.addEventListener('click', function () {
    var nowLite = !document.documentElement.classList.contains('effects-lite');
    try { localStorage.setItem('effects-mode', nowLite ? 'lite' : 'full'); } catch (e) {}
    location.reload();
  });
}

// 2. Interactive widgets and desktop-only Live2D mascot loading
function loadScript(src, callback, onError) {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = src;
  script.onload = callback || function () {};
  script.onerror = onError || function () {};
  document.body.appendChild(script);
}

function loadStylesheet(href, callback, onError) {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = href;
  link.onload = callback || function () {};
  link.onerror = onError || function () {};
  document.head.appendChild(link);
}

function initializeWaifuWhenLaidOut() {
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      if (typeof initModel === 'function') initModel();
    });
  });
}

function hideWaifu() {
  var waifuEl = document.getElementById('waifu');
  if (waifuEl) waifuEl.style.display = 'none';
}

var suffix = window.location.protocol === 'file:' ? '' : '?v=20260625-1';

if (window.innerWidth > 768) {
  // CSS must be applied before Live2D measures and paints the canvas.
  loadStylesheet('assets/kanban/waifu.css' + suffix, function () {
    loadScript('assets/kanban/live2d.min.js' + suffix, function () {
      loadScript('assets/kanban/waifu-tips.js' + suffix, initializeWaifuWhenLaidOut);
    }, function () {
      hideWaifu();
      loadScript('assets/kanban/waifu-tips.js' + suffix);
    });
  }, function () {
    hideWaifu();
    loadScript('assets/kanban/waifu-tips.js' + suffix);
  });
} else {
  // 移动端隐藏看板娘，但仍加载终端、BGM 和彩蛋等通用交互。
  hideWaifu();
  loadScript('assets/kanban/waifu-tips.js' + suffix);
}

// 3. Dynamic Molecular Particle Network Background
(function () {
  var canvas = document.getElementById('bg-canvas');
  if (!canvas || window.__effectsLite) return;
  var ctx = canvas.getContext('2d');
  var width = canvas.width = window.innerWidth;
  var height = canvas.height = window.innerHeight;

  var particles = [];
  var maxParticles = Math.min(42, Math.floor((width * height) / 36000));
  var connectionDistance = 115;

  var mouse = { x: null, y: null };

  function Particle() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.baseVx = (Math.random() - 0.5) * 0.35;
    this.baseVy = (Math.random() - 0.5) * 0.35;
    this.vx = this.baseVx;
    this.vy = this.baseVy;
    this.radius = Math.random() * 2.5 + 1.5;
    this.colorType = Math.floor(Math.random() * 3); // 0: Cyan, 1: Violet, 2: Pink
  }
  Particle.prototype.update = function () {
    if (mouse.x !== null && mouse.y !== null) {
      var dx = this.x - mouse.x;
      var dy = this.y - mouse.y;
      var distSq = dx * dx + dy * dy;
      var repelRadius = 140;
      if (distSq < repelRadius * repelRadius) {
        var dist = Math.sqrt(distSq) || 0.001;
        var force = (repelRadius - dist) / repelRadius;
        this.vx += (dx / dist) * force * 0.45;
        this.vy += (dy / dist) * force * 0.45;
      }
    }

    // Damp and return to base velocity
    this.vx += (this.baseVx - this.vx) * 0.06;
    this.vy += (this.baseVy - this.vy) * 0.06;

    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0) {
      this.x = 0;
      this.baseVx *= -1;
      this.vx *= -1;
    } else if (this.x > width) {
      this.x = width;
      this.baseVx *= -1;
      this.vx *= -1;
    }
    if (this.y < 0) {
      this.y = 0;
      this.baseVy *= -1;
      this.vy *= -1;
    } else if (this.y > height) {
      this.y = height;
      this.baseVy *= -1;
      this.vy *= -1;
    }
  };
  Particle.prototype.draw = function () {
    ctx.fillStyle = palette.particles[this.colorType];
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  };

  function init() {
    particles = [];
    for (var i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }
  }

  function getPalette() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      particles: isDark ? [
        'rgba(56, 189, 248, 0.65)', // Cyan
        'rgba(167, 139, 250, 0.65)', // Violet
        'rgba(244, 114, 182, 0.60)'  // Pink
      ] : [
        'rgba(14, 116, 144, 0.45)',   // Cyan
        'rgba(109, 40, 217, 0.45)',   // Violet
        'rgba(190, 24, 74, 0.42)'    // Pink
      ]
    };
  }

  var palette = getPalette();
  window.addEventListener('themechanged', function () {
    palette = getPalette();
  });

  // Cap the background to ~30fps. On 60/120Hz (ProMotion) displays this
  // roughly halves/quarters main-thread work AND how often every
  // backdrop-filter glass layer above the canvas has to re-composite,
  // which is the single biggest source of page jank.
  var bgFrameInterval = 1000 / 30;
  var bgLastDraw = 0;
  function animate(now) {
    if (!isPaused) {
      requestAnimationFrame(animate);
    }
    now = now || 0;
    if (now - bgLastDraw < bgFrameInterval) return;
    bgLastDraw = now;

    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var distSq = dx * dx + dy * dy;
        var maxDistSq = connectionDistance * connectionDistance;

        if (distSq < maxDistSq) {
          var dist = Math.sqrt(distSq);
          var alpha = (1 - dist / connectionDistance);
          var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          ctx.strokeStyle = isDark ? 
            'rgba(147, 197, 253, ' + (alpha * 0.22) + ')' : 
            'rgba(0, 102, 204, ' + (alpha * 0.16) + ')';
          
          ctx.beginPath();
          ctx.lineWidth = alpha * 0.8;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }

      // Connect to mouse
      if (mouse.x !== null && mouse.y !== null) {
        var dx2 = particles[i].x - mouse.x;
        var dy2 = particles[i].y - mouse.y;
        var distSq2 = dx2 * dx2 + dy2 * dy2;
        var maxMouseDist = connectionDistance * 1.3;
        if (distSq2 < maxMouseDist * maxMouseDist) {
          var dist2 = Math.sqrt(distSq2);
          var alpha2 = (1 - dist2 / maxMouseDist);
          var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          ctx.strokeStyle = isDark ? 
            'rgba(147, 197, 253, ' + (alpha2 * 0.22) + ')' : 
            'rgba(0, 102, 204, ' + (alpha2 * 0.16) + ')';
          
          ctx.beginPath();
          ctx.lineWidth = alpha2 * 0.7;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }
  }

  var isPaused = false;
  // Pause the particle-background canvas whenever the page is hidden or
  // unfocused so it stops consuming CPU/GPU when not visible. Driven by
  // events (not document.hasFocus polling, which is unreliable).
  var winFocused = true;
  function syncPauseState() {
    var shouldPause = document.hidden || !winFocused;
    if (shouldPause) {
      isPaused = true;
    } else if (isPaused) {
      isPaused = false;
      animate();
    }
  }
  document.addEventListener('visibilitychange', syncPauseState);
  window.addEventListener('blur', function () { winFocused = false; syncPauseState(); });
  window.addEventListener('focus', function () { winFocused = true; syncPauseState(); });

  window.addEventListener('resize', function () {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    maxParticles = Math.min(42, Math.floor((width * height) / 36000));
    init();
  });

  window.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', function () {
    mouse.x = null;
    mouse.y = null;
  });

  init();
  animate();
})();

// 4. Floating research keywords
(function () {
  var layer = document.getElementById('research-float-layer');
  var supportsWideViewport = window.matchMedia && window.matchMedia('(min-width: 720px)').matches;
  if (!layer || window.__effectsLite || !supportsWideViewport) return;

  var keywordBanks = {
    en: [
      'AI4Sci',
      'AI4Chem',
      'AutoResearch',
      'Multi-Agent Systems',
      'AI Agents',
      'Digital Twin',
      'Adsorption',
      'Heterogeneous Catalysis',
      'Materials Science',
      'RAG'
    ],
    zh: [
      '科学智能',
      '化学智能',
      '自主科学发现',
      '多智能体系统',
      'AI 智能体',
      '数字孪生',
      '吸附',
      '异相催化',
      '材料科学',
      '检索增强生成'
    ]
  };
  var activeKeywords = 0;
  var maxKeywords = 6;
  var spawnTimer = null;

  function getCurrentLanguage() {
    var storedLang = localStorage.getItem('lang');
    var htmlLang = document.documentElement.getAttribute('lang') || 'en';
    return storedLang === 'zh' || htmlLang.indexOf('zh') === 0 ? 'zh' : 'en';
  }

  function spawnKeyword() {
    if (activeKeywords >= maxKeywords) return;

    var lang = getCurrentLanguage();
    var keywords = keywordBanks[lang] || keywordBanks.en;
    var keyword = document.createElement('span');
    var fromLeft = Math.random() > 0.5;
    var y = Math.max(80, Math.min(window.innerHeight - 90, 96 + Math.random() * (window.innerHeight - 220)));
    var driftY = -46 + Math.random() * 92;
    var startX = fromLeft ? -240 : window.innerWidth + 40;
    var endX = fromLeft ? window.innerWidth + 60 : -260;
    var duration = 12000 + Math.random() * 6500;

    activeKeywords += 1;
    var index = Math.floor(Math.random() * keywords.length);
    keyword.setAttribute('data-keyword-index', index);
    keyword.className = 'research-float-keyword';
    keyword.textContent = keywords[index];
    keyword.style.setProperty('--keyword-start-x', startX + 'px');
    keyword.style.setProperty('--keyword-start-y', y + 'px');
    keyword.style.setProperty('--keyword-end-x', endX + 'px');
    keyword.style.setProperty('--keyword-end-y', (y + driftY) + 'px');
    keyword.style.setProperty('--keyword-duration', duration + 'ms');
    keyword.style.setProperty('--keyword-delay', Math.random() * 320 + 'ms');
    keyword.style.setProperty('--keyword-size', (12 + Math.random() * 3.5) + 'px');

    layer.appendChild(keyword);
    keyword.addEventListener('animationend', function () {
      activeKeywords -= 1;
      keyword.remove();
    }, { once: true });
  }

  for (var i = 0; i < 3; i += 1) {
    window.setTimeout(spawnKeyword, i * 850);
  }

  spawnTimer = window.setInterval(spawnKeyword, 2300);

  window.addEventListener('langchanged', function (e) {
    var newLang = e.detail.lang;
    var keywords = keywordBanks[newLang] || keywordBanks.en;
    var activeSpans = layer.querySelectorAll('.research-float-keyword');
    activeSpans.forEach(function (span) {
      var idx = parseInt(span.getAttribute('data-keyword-index'), 10);
      if (!isNaN(idx) && keywords[idx]) {
        span.textContent = keywords[idx];
      }
    });
  });

  window.addEventListener('pagehide', function () {
    window.clearInterval(spawnTimer);
  }, { once: true });
})();

// 5. Nagato cursor trail particles
(function () {
  var trail = document.getElementById('nagato-trail');
  var supportsFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  if (!trail || !supportsFinePointer || window.__effectsLite) return;

  var ctx = trail.getContext('2d');
  if (!ctx) return;

  var palette = [
    'rgba(56, 189, 248, 0.88)', // Cyan
    'rgba(147, 197, 253, 0.82)', // Blue
    'rgba(244, 114, 182, 0.78)', // Pink
    'rgba(255, 255, 255, 0.9)'   // White
  ];
  var lastX = null;
  var lastY = null;
  var lastTime = 0;
  var particles = [];
  var maxParticles = 26;
  var animId = null;

  // Cap DPR: a full-screen trail canvas at 2x/3x Retina is a huge GPU
  // surface for a decorative effect. 1.5x looks fine and cuts GPU memory.
  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  function resizeCanvas() {
    trail.width = window.innerWidth * dpr;
    trail.height = window.innerHeight * dpr;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height - radius);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function loop() {
    var now = performance.now();
    ctx.clearRect(0, 0, trail.width, trail.height);

    ctx.save();
    ctx.scale(dpr, dpr);

    var alive = [];
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var elapsed = now - p.spawnTime;
      if (elapsed < p.duration) {
        alive.push(p);

        var progress = elapsed / p.duration;
        var ep = progress * (2 - progress); // Quadratic ease-out curve

        var alpha, scale, currentX, currentY, currentRot;
        if (ep < 0.14) {
          var k = ep / 0.14;
          alpha = p.baseAlpha * k;
          scale = 0.35 + (1 - 0.35) * k;
          currentX = p.startX;
          currentY = p.startY;
          currentRot = p.rotate;
        } else {
          var k = (ep - 0.14) / 0.86;
          alpha = p.baseAlpha * (1 - k);
          scale = 1.0 + (0.12 - 1.0) * k;
          currentX = p.startX + p.dx * k;
          currentY = p.startY + p.dy * k;
          currentRot = p.rotate + (55 * Math.PI / 180) * k;
        }

        ctx.save();
        ctx.translate(currentX, currentY);
        ctx.scale(scale, scale);
        ctx.rotate(currentRot);

        // Apply shadow/glow matching box-shadow: 0 0 10px var(--trail-color)
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;

        // Replace alpha in style
        var finalColor = p.color;
        if (p.color.indexOf('rgba') === 0) {
          finalColor = p.color.replace(/[\d.]+\)$/, alpha.toFixed(4) + ')');
        } else {
          finalColor = p.color.replace('rgb', 'rgba').replace(')', ', ' + alpha.toFixed(4) + ')');
        }
        ctx.fillStyle = finalColor;

        if (p.isDiamond) {
          drawRoundedRect(ctx, -p.size / 2, -p.size / 2, p.size, p.size, 1.5);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    ctx.restore();

    particles = alive;
    if (particles.length > 0) {
      animId = requestAnimationFrame(loop);
    } else {
      animId = null;
      ctx.clearRect(0, 0, trail.width, trail.height);
    }
  }

  function spawnParticle(x, y) {
    if (particles.length >= maxParticles) return;

    var angle = Math.random() * Math.PI * 2;
    var distance = 10 + Math.random() * 22;
    var size = 4 + Math.random() * 5;
    var color = palette[Math.floor(Math.random() * palette.length)];
    var rotate = Math.random() * Math.PI * 2;

    particles.push({
      startX: x,
      startY: y,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 8,
      size: size,
      color: color,
      rotate: rotate,
      isDiamond: Math.random() > 0.62,
      spawnTime: performance.now(),
      duration: 720,
      baseAlpha: 0.85
    });

    if (animId === null) {
      animId = requestAnimationFrame(loop);
    }
  }

  window.addEventListener('pointermove', function (event) {
    var now = performance.now();
    if (now - lastTime < 26) return;

    if (lastX !== null && lastY !== null) {
      var dx = event.clientX - lastX;
      var dy = event.clientY - lastY;
      if ((dx * dx + dy * dy) < 64) return;
    }

    lastX = event.clientX;
    lastY = event.clientY;
    lastTime = now;
    spawnParticle(event.clientX, event.clientY);
  }, { passive: true });

  window.addEventListener('pointerleave', function () {
    lastX = null;
    lastY = null;
  }, { passive: true });

  window.addEventListener('pagehide', function () {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }, { once: true });
})();

// 6. Sticky Navigation — add scrolled class on scroll
(function () {
  var nav = document.getElementById('top-nav');
  if (!nav) return;
  var scrolled = false;
  window.addEventListener('scroll', function () {
    if (window.scrollY > 60 && !scrolled) {
      nav.classList.add('scrolled');
      scrolled = true;
    } else if (window.scrollY <= 60 && scrolled) {
      nav.classList.remove('scrolled');
      scrolled = false;
    }
  }, { passive: true });
})();

// 7. Back-to-Top Button
(function () {
  var btn = document.getElementById('back-to-top');
  if (!btn) return;
  var visible = false;
  window.addEventListener('scroll', function () {
    if (window.scrollY > 500 && !visible) {
      btn.classList.add('visible');
      visible = true;
    } else if (window.scrollY <= 500 && visible) {
      btn.classList.remove('visible');
      visible = false;
    }
  }, { passive: true });
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// 8. BibTeX Copy Buttons
(function () {
  var toast = document.getElementById('bibtex-toast');
  var toastTimer = null;

  function getCurrentLanguage() {
    var storedLang = localStorage.getItem('lang');
    var htmlLang = document.documentElement.getAttribute('lang') || 'en';
    return storedLang === 'zh' || htmlLang.indexOf('zh') === 0 ? 'zh' : 'en';
  }

  function getLocalizedText(key, fallback) {
    var lang = getCurrentLanguage();
    var strings = {
      en: {
        'bibtex.copied': 'Copied!',
        'bibtex.failed': 'Copy failed',
        'bibtex.toast': 'BibTeX copied to clipboard',
        'bibtex.toastFailed': 'Copy failed. Please copy manually.'
      },
      zh: {
        'bibtex.copied': '已复制！',
        'bibtex.failed': '复制失败',
        'bibtex.toast': 'BibTeX 已复制到剪贴板',
        'bibtex.toastFailed': '复制失败，请手动复制。'
      }
    };
    return strings[lang][key] || fallback;
  }

  function fallbackCopyText(text) {
    return new Promise(function (resolve, reject) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        var copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        copied ? resolve() : reject(new Error('execCommand copy failed'));
      } catch (err) {
        document.body.removeChild(textarea);
        reject(err);
      }
    });
  }

  function copyTextToClipboard(text) {
    return fallbackCopyText(text).catch(function (fallbackError) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }
      throw fallbackError;
    });
  }

  function showBibtexToast(messageKey) {
    if (!toast) return;
    var toastText = toast.querySelector('.bibtex-toast-text');
    if (toastText) {
      toastText.textContent = getLocalizedText(messageKey || 'bibtex.toast', 'BibTeX copied to clipboard');
    }
    window.clearTimeout(toastTimer);
    toast.hidden = false;
    requestAnimationFrame(function () {
      toast.classList.add('visible');
    });
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('visible');
      toastTimer = window.setTimeout(function () {
        toast.hidden = true;
      }, 240);
    }, 1800);
  }

  // Delegated, so publication cards rendered from data/content.js (and
  // re-rendered on language switch) keep working without re-binding.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.bibtex-copy') : null;
    if (!btn) return;
    var box = btn.closest('.bibtex');
    var pre = box && box.querySelector('.bibtex-text');
    if (!pre) return;
    var bibtex = pre.textContent || '';
    var original = btn.textContent;
    copyTextToClipboard(bibtex).then(function () {
      btn.textContent = '✓ ' + getLocalizedText('bibtex.copied', 'Copied!');
      btn.classList.add('copied');
      showBibtexToast();
      setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove('copied');
      }, 2000);
    }).catch(function () {
      btn.textContent = getLocalizedText('bibtex.failed', 'Copy failed');
      showBibtexToast('bibtex.toastFailed');
      setTimeout(function () {
        btn.textContent = original;
      }, 2000);
    });
  });
})();

// 9. Data-driven content: publications (+ topic filter) and news (+ show more).
//    Source of truth is data/content.js (window.PUBLICATIONS / window.NEWS).
//    Re-rendered on language switch via window.renderSiteContent(lang).
(function () {
  var newsExpanded = false;
  var activeFilter = 'all';

  function getLang() {
    var stored = localStorage.getItem('lang');
    var htmlLang = document.documentElement.getAttribute('lang') || 'en';
    return stored === 'zh' || htmlLang.indexOf('zh') === 0 ? 'zh' : 'en';
  }
  function pick(obj, lang) { return obj ? (obj[lang] != null ? obj[lang] : obj.en) : ''; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function attr(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }
  function t(en, zh, lang) { return lang === 'zh' ? zh : en; }

  // Citation counts: a static map { arxivId: count } loaded from
  // data/citations.json (generated server-side by tools/fetch-citations.mjs).
  var citationMap = {};
  function arxivIdOf(p) {
    var href = (p.links && p.links[0] && p.links[0].href) || '';
    var m = href.match(/arxiv\.org\/abs\/([^?#/]+)/i);
    return m ? m[1] : '';
  }

  var BIBTEX_SVG =
    '<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>' +
    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

  function applyFilter() {
    var cards = document.querySelectorAll('#pub-list .publication-card');
    Array.prototype.forEach.call(cards, function (card) {
      var tags = (card.getAttribute('data-tags') || '').split(/\s+/);
      var show = activeFilter === 'all' || tags.indexOf(activeFilter) !== -1;
      card.style.display = show ? '' : 'none';
    });
  }

  function renderPublications(lang) {
    var list = document.getElementById('pub-list');
    var filters = document.getElementById('pub-filters');
    var pubs = window.PUBLICATIONS || [];
    var tagDefs = window.TAGS || {};
    if (!list) return;

    list.innerHTML = pubs.map(function (p) {
      var cover = (p.cover && p.cover.img)
        ? '<img src="' + attr(p.cover.img) + '" alt="' + attr(p.cover.alt || '') + '" class="publication-cover logo-cover" loading="lazy" width="250" height="150">'
        : '<div class="publication-cover-text" aria-label="' + attr((p.cover && p.cover.text) || '') + '">' + esc((p.cover && p.cover.text) || '') + '</div>';
      var links = (p.links || []).map(function (l) {
        return '<a class="mini-link" href="' + attr(l.href) + '" target="_blank" rel="noopener noreferrer">' + esc(l.label) + '</a>';
      }).join('\n');
      var bib = p.bibtex
        ? '<details class="bibtex"><summary class="bibtex-summary">' + BIBTEX_SVG + '<span>BibTeX</span></summary>' +
            '<div class="bibtex-body"><pre class="bibtex-text">' + esc(p.bibtex) + '</pre>' +
            '<button class="bibtex-copy" type="button">' + t('Copy', '复制', lang) + '</button></div></details>'
        : '';
      var cites = citationMap[arxivIdOf(p)];
      var cite = (cites && cites > 0)
        ? '<span class="cite-badge">' + esc(t('Cited by ' + cites, '被引用 ' + cites + ' 次', lang)) + '</span>'
        : '';
      var tags = (p.tags || []).map(function (id) {
        var d = tagDefs[id];
        return '<span class="tag">' + esc(d ? pick(d, lang) : id) + '</span>';
      }).join('\n');
      return '<div class="publication-card" data-tags="' + attr((p.tags || []).join(' ')) + '">' +
        '<div class="publication-cover-wrap">' + cover + '</div>' +
        '<div>' +
          '<div class="item-title">' + esc(pick(p.title, lang)) + '</div>' +
          '<div class="authors">' + (p.authorsHtml || '') + '</div>' +
          '<div class="highlight"><span class="highlight-label">' + t('Highlight:', '亮点:', lang) + '</span> <span>' + esc(pick(p.highlight, lang)) + '</span></div>' +
          '<div class="muted">' + esc(pick(p.venue, lang)) + '</div>' +
          '<div class="mini-links">' + links + (cite ? '\n' + cite : '') + '</div>' +
          (bib || '') +
          tags +
        '</div>' +
      '</div>';
    }).join('\n');

    if (filters) {
      var used = {};
      pubs.forEach(function (p) { (p.tags || []).forEach(function (id) { used[id] = true; }); });
      var keys = Object.keys(used);
      // Only show the filter bar when there is more than one topic to choose.
      if (keys.length > 1) {
        var chips = ['<button class="pub-filter' + (activeFilter === 'all' ? ' active' : '') + '" data-filter="all">' + t('All', '全部', lang) + '</button>'];
        Object.keys(tagDefs).forEach(function (id) {
          if (!used[id]) return;
          chips.push('<button class="pub-filter' + (activeFilter === id ? ' active' : '') + '" data-filter="' + attr(id) + '">' + esc(pick(tagDefs[id], lang)) + '</button>');
        });
        filters.innerHTML = chips.join('\n');
        filters.hidden = false;
      } else {
        filters.innerHTML = '';
        filters.hidden = true;
      }
    }
    applyFilter();
  }

  function renderNews(lang) {
    var list = document.getElementById('news-list');
    if (!list) return;
    var news = window.NEWS || [];
    var featured = window.NEWS_FEATURED_COUNT || 4;
    list.innerHTML = news.map(function (n, i) {
      var hidden = i >= featured;
      var style = hidden && newsExpanded ? ' style="display:flex"' : '';
      return '<div class="news-item' + (hidden ? ' news-hidden' : '') + '"' + style + '>' +
        '<span class="news-date">' + esc(pick(n.date, lang)) + '</span>' +
        '<span class="news-text">' + pick(n.html, lang) + '</span>' +
      '</div>';
    }).join('\n');

    var toggleBtn = document.getElementById('news-toggle');
    if (toggleBtn) toggleBtn.hidden = news.length <= featured;
  }

  // ---- CV sections (education / research / honors / activities / projects /
  //      collaborators). Section + sub-headings stay static HTML (translated by
  //      applyLanguage); only the repeated leaf items are rendered from data. ----
  function setHTML(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
  function logoImg(schoolKey) {
    var s = (window.SCHOOLS || {})[schoolKey];
    if (!s) return '';
    return '<img class="school-logo ' + attr(s.cls) + '" src="' + attr(s.logo) + '" alt="' + attr(s.alt) + '" loading="lazy">';
  }
  function timelineItems(arr, lang) {
    return (arr || []).map(function (it) {
      return '<div class="timeline-item">' + logoImg(it.school) +
        '<div><div class="timeline-time">' + esc(pick(it.date, lang)) + '</div>' +
        '<div class="timeline-title">' + esc(pick(it.title, lang)) + '</div></div></div>';
    }).join('\n');
  }
  function awardChips(arr, lang) {
    return (arr || []).map(function (it) { return '<span class="award-chip">' + esc(pick(it, lang)) + '</span>'; }).join('\n');
  }
  function listItems(arr, lang) {
    return (arr || []).map(function (it) {
      return '<li>' + esc(typeof it === 'string' ? it : pick(it, lang)) + '</li>';
    }).join('\n');
  }
  function collaboratorInitials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    var first = parts[0].charAt(0);
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : parts[0].charAt(1);
    return (first + (last || '')).toUpperCase();
  }
  function collaboratorAvatarHtml(c) {
    var initials = collaboratorInitials(c.name);
    if (c.avatar) {
      return '<img class="collab-avatar collab-avatar-img" src="' + attr(c.avatar) + '" alt="" loading="lazy" width="64" height="64" data-initials="' + attr(initials) + '">';
    }
    return '<span class="collab-avatar collab-avatar-fallback" aria-hidden="true">' + esc(initials) + '</span>';
  }
  function renderCV(lang) {
    setHTML('edu-timeline', timelineItems(window.EDUCATION, lang));
    setHTML('research-timeline', timelineItems(window.RESEARCH, lang));
    var h = window.HONORS || {};
    setHTML('scholarships-list', awardChips(h.scholarships, lang));
    setHTML('deans-list', awardChips(h.honors, lang));
    setHTML('awards-list', awardChips(h.awards, lang));
    var a = window.ACTIVITIES || {};
    setHTML('leadership-list', listItems(a.leadership, lang));
    setHTML('teaching-list', listItems(a.teaching, lang));
    setHTML('techstack-list', listItems(a.techStack, lang));
    setHTML('languages-list', listItems(a.languages, lang));
    setHTML('project-grid', (window.PROJECTS || []).map(function (p) {
      var links = (p.links || []).map(function (l) {
        return '<a class="mini-link" href="' + attr(l.href) + '" target="_blank" rel="noopener noreferrer">' + esc(l.label) + '</a>';
      }).join('\n');
      return '<div class="project-card"><div><div class="project-title">' + esc(p.title) + '</div>' +
        '<div class="project-desc">' + esc(pick(p.desc, lang)) + '</div></div>' +
        '<div class="mini-links">' + links + '</div></div>';
    }).join('\n'));
    setHTML('collab-grid', (window.COLLABORATORS || []).map(function (c) {
      return '<a class="collab-card" href="' + attr(c.href) + '" target="_blank" rel="noopener noreferrer">' +
        collaboratorAvatarHtml(c) +
        '<div class="collab-name">' + esc(c.name) + '</div>' +
        '<div class="collab-affil">' + esc(c.affil) + '</div></a>';
    }).join('\n'));
  }

  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || !img.classList || !img.classList.contains('collab-avatar-img')) return;
    var fallback = document.createElement('span');
    fallback.className = 'collab-avatar collab-avatar-fallback';
    fallback.setAttribute('aria-hidden', 'true');
    fallback.textContent = img.getAttribute('data-initials') || '?';
    img.replaceWith(fallback);
  }, true);

  function renderSiteContent(lang) {
    lang = lang || getLang();
    renderNews(lang);
    renderPublications(lang);
    renderCV(lang);
  }
  window.renderSiteContent = renderSiteContent;

  // Topic filter (delegated — survives re-render).
  var filterBar = document.getElementById('pub-filters');
  if (filterBar) {
    filterBar.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.pub-filter') : null;
      if (!b) return;
      activeFilter = b.getAttribute('data-filter') || 'all';
      Array.prototype.forEach.call(filterBar.querySelectorAll('.pub-filter'), function (x) {
        x.classList.toggle('active', x === b);
      });
      applyFilter();
    });
  }

  // News "show more / show less".
  var newsToggle = document.getElementById('news-toggle');
  if (newsToggle) {
    newsToggle.addEventListener('click', function () {
      newsExpanded = !newsExpanded;
      Array.prototype.forEach.call(document.querySelectorAll('#news-list .news-hidden'), function (item) {
        item.style.display = newsExpanded ? 'flex' : 'none';
      });
      newsToggle.setAttribute('data-i18n', newsExpanded ? 'news.showLess' : 'news.showMore');
      newsToggle.textContent = t('Show more', '展开更多', getLang());
      if (newsExpanded) newsToggle.textContent = t('Show less', '收起', getLang());
    });
  }

  // Per-paper ScholarlyArticle JSON-LD (helps Google / Scholar link these works
  // to the author). Injected once; language-independent (canonical = English).
  function parseAuthors(html) {
    return String(html || '').replace(/<[^>]+>/g, '').split(/,| and /)
      .map(function (s) { return s.trim(); }).filter(Boolean)
      .map(function (name) { return { '@type': 'Person', name: name }; });
  }
  function injectPubJsonLd() {
    if (document.getElementById('pubs-jsonld')) return;
    var pubs = window.PUBLICATIONS || [];
    if (!pubs.length) return;
    var arr = pubs.map(function (p) {
      var href = (p.links && p.links[0] && p.links[0].href) || location.href;
      return {
        '@context': 'https://schema.org',
        '@type': 'ScholarlyArticle',
        name: p.title.en,
        headline: p.title.en,
        author: parseAuthors(p.authorsHtml),
        datePublished: p.date || String(p.year || ''),
        url: href,
        sameAs: href,
        publisher: { '@type': 'Organization', name: 'arXiv' }
      };
    });
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = 'pubs-jsonld';
    s.textContent = JSON.stringify(arr);
    document.head.appendChild(s);
  }

  // "Download all BibTeX" — one .bib of every publication.
  var dlBtn = document.getElementById('download-all-bib');
  if (dlBtn) {
    dlBtn.addEventListener('click', function () {
      var bib = (window.PUBLICATIONS || []).map(function (p) { return p.bibtex; })
        .filter(Boolean).join('\n\n') + '\n';
      var blob = new Blob([bib], { type: 'application/x-bibtex' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'zongmin-zhang-publications.bib';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
  }

  // Load static citation counts (same-origin; no per-visitor API calls / CORS).
  // Re-renders publications so any "Cited by N" badges appear once data exists.
  function loadCitations() {
    fetch('data/citations.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (m) { if (m && typeof m === 'object') { citationMap = m; renderPublications(getLang()); } })
      .catch(function () { /* offline / file:// — badges simply don't show */ });
  }
  renderSiteContent(getLang());
  injectPubJsonLd();
  loadCitations();
})();

// 10. i18n Language Toggle
(function () {
  var langBtn = document.getElementById('lang-toggle');
  if (!langBtn) return;
  var i18nData = null;
  var currentLang = localStorage.getItem('lang') || 'en';

  // Apply stored language on load
  if (currentLang === 'zh') {
    langBtn.querySelector('.lang-label').textContent = 'EN';
    document.documentElement.setAttribute('lang', 'zh');
  }

  function isSafeI18nUrl(value) {
    return /^(https?:|mailto:|#|assets\/|feed\.xml)/i.test(value || '');
  }

  function sanitizeInlineStyle(value) {
    var safeRules = [];
    String(value || '').split(';').forEach(function (rule) {
      var parts = rule.split(':');
      if (parts.length < 2) return;
      var prop = parts[0].trim().toLowerCase();
      var val = parts.slice(1).join(':').trim();
      var safeValue = /^(var\(--[a-z0-9-]+\)|#[0-9a-f]{3,8}|rgba?\([0-9.,\s%]+\)|[a-z]+)$/i.test(val);
      if ((prop === 'color' || prop === 'background-color') && safeValue) {
        safeRules.push(prop + ': ' + val);
      }
    });
    return safeRules.join('; ');
  }

  function setSafeI18nHtml(el, html) {
    var template = document.createElement('template');
    template.innerHTML = String(html);
    var allowedTags = {
      A: ['href', 'target', 'rel'],
      STRONG: [],
      B: [],
      EM: [],
      I: [],
      BR: [],
      SPAN: ['style']
    };

    function cleanNode(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === Node.TEXT_NODE) return;
        if (child.nodeType !== Node.ELEMENT_NODE) {
          child.remove();
          return;
        }

        var allowedAttrs = allowedTags[child.tagName];
        if (!allowedAttrs) {
          child.replaceWith(document.createTextNode(child.textContent || ''));
          return;
        }

        Array.prototype.slice.call(child.attributes).forEach(function (attr) {
          var name = attr.name.toLowerCase();
          if (allowedAttrs.indexOf(name) === -1 || name.indexOf('on') === 0) {
            child.removeAttribute(attr.name);
            return;
          }
          if (name === 'href' && !isSafeI18nUrl(attr.value)) {
            child.removeAttribute(attr.name);
          }
          if (name === 'target' && attr.value !== '_blank') {
            child.removeAttribute(attr.name);
          }
          if (name === 'style') {
            var safeStyle = sanitizeInlineStyle(attr.value);
            if (safeStyle) child.setAttribute('style', safeStyle);
            else child.removeAttribute(attr.name);
          }
        });

        if (child.tagName === 'A' && child.getAttribute('target') === '_blank') {
          child.setAttribute('rel', 'noopener noreferrer');
        }
        cleanNode(child);
      });
    }

    cleanNode(template.content);
    el.replaceChildren(template.content.cloneNode(true));
  }

  function applyLanguage(lang) {
    var isZh = lang === 'zh';
    document.documentElement.setAttribute('lang', isZh ? 'zh' : 'en');
    window.dispatchEvent(new CustomEvent('langchanged', { detail: { lang: lang } }));
    syncActionButtons();
    
    // Translate accessibility attributes for buttons and inputs
    var backToTop = document.getElementById('back-to-top');
    if (backToTop) {
      var b2tTitle = isZh ? '回到顶部' : 'Back to top';
      backToTop.setAttribute('title', b2tTitle);
      backToTop.setAttribute('aria-label', b2tTitle);
    }
    var terminalInput = document.getElementById('terminal-input');
    if (terminalInput) {
      terminalInput.setAttribute('aria-label', isZh ? '终端输入' : 'Terminal input');
    }
    var musicCloseBtn = document.getElementById('music-close-btn');
    if (musicCloseBtn) {
      var mcTitle = isZh ? '最小化播放器' : 'Minimize player';
      musicCloseBtn.setAttribute('title', mcTitle);
      musicCloseBtn.setAttribute('aria-label', mcTitle);
    }
    var musicToggleBtn = document.getElementById('music-toggle-btn');
    if (musicToggleBtn) {
      var mtTitle = isZh ? '展开背景音乐播放器' : 'Open BGM player';
      musicToggleBtn.setAttribute('title', mtTitle);
      musicToggleBtn.setAttribute('aria-label', mtTitle);
    }
    var musicCover = document.getElementById('music-cover');
    if (musicCover) {
      musicCover.setAttribute('alt', isZh ? '唱片封面' : 'Vinyl record cover');
    }
    var musicPlayBtn = document.getElementById('music-play-btn');
    if (musicPlayBtn) {
      musicPlayBtn.setAttribute('aria-label', isZh ? '播放音乐' : 'Play music');
    }
    var musicNextBtn = document.getElementById('music-next-btn');
    if (musicNextBtn) {
      musicNextBtn.setAttribute('aria-label', isZh ? '下一首' : 'Next track');
    }

    if (!i18nData) return;
    var strings = i18nData[lang];
    if (!strings) return;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (strings[key]) {
        if (el.tagName === 'IMG') {
          el.setAttribute('alt', strings[key]);
        } else {
          setSafeI18nHtml(el, strings[key]);
        }
      }
    });
    // Update SEO Meta Description
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && strings["meta.description"]) {
      metaDesc.setAttribute('content', strings["meta.description"]);
    }
  }

  // Load i18n data
  fetch('i18n.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      i18nData = data;
      // Apply if not English
      if (currentLang !== 'en') {
        applyLanguage(currentLang);
      }
    })
    .catch(function () { /* silently fail — English is the default */ });

  langBtn.addEventListener('click', function () {
    currentLang = currentLang === 'en' ? 'zh' : 'en';
    localStorage.setItem('lang', currentLang);
    langBtn.querySelector('.lang-label').textContent = currentLang === 'en' ? '中' : 'EN';
    applyLanguage(currentLang);
    // Re-render the data-driven publications + news in the new language.
    if (typeof window.renderSiteContent === 'function') window.renderSiteContent(currentLang);
  });
  syncActionButtons();
})();
