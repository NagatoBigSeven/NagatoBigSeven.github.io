/* Host adapter for the existing Destroy Any Website game. */
(function () {
  var session = null;
  var launchButton = document.getElementById('destroy-page-button');
  var status = document.getElementById('destroy-page-status');

  function language() {
    return document.documentElement.lang === 'zh' ? 'zh' : 'en';
  }

  function capturePage() {
    var page = document.documentElement.cloneNode(true);
    page.querySelectorAll([
      'script', 'iframe', 'canvas', 'base', '#waifu', '#terminal-modal',
      '#music-card', '#music-toggle-btn', '#back-to-top', '#theme-toggle',
      '#lang-toggle', '#terminal-toggle', '#effects-toggle', '#scroll-indicator',
      '#research-float-layer', '#bibtex-toast', '.site-counter', '.skip-link',
      '.destroy-page-tools'
    ].join(',')).forEach(function (element) { element.remove(); });
    page.querySelectorAll('details[open]').forEach(function (details) {
      details.removeAttribute('open');
    });
    page.querySelectorAll('img[loading="lazy"]').forEach(function (image) {
      image.setAttribute('loading', 'eager');
    });
    var head = page.querySelector('head');
    var base = document.createElement('base');
    base.href = document.baseURI;
    head.prepend(base);
    var style = document.createElement('style');
    style.textContent =
      '*,*::before,*::after{animation:none!important;transition:none!important;animation-timeline:auto!important;scroll-timeline:none!important;scroll-behavior:auto!important}' +
      'html,body{overflow:visible!important}' +
      '.card,.publication-card,.project-card,.info-panel,.collab-card{opacity:1!important;transform:none!important}' +
      '#top-nav{position:static!important;opacity:1!important;transform:none!important;pointer-events:auto!important}' +
      '.news-hidden{display:flex!important}#news-toggle{display:none!important}';
    head.appendChild(style);
    return '<!doctype html>' + page.outerHTML;
  }

  function startDestroyGame() {
    if (session) {
      session.frame.focus();
      return;
    }
    var activeElement = document.activeElement;
    if (typeof window.toggleTerminal === 'function') window.toggleTerminal(false);
    if (activeElement && activeElement.blur) activeElement.blur();

    var isZh = language() === 'zh';
    if (window.innerWidth < 760 || window.matchMedia('(pointer: coarse)').matches) {
      status.textContent = isZh
        ? '请在电脑上使用键盘和鼠标游玩'
        : 'Please play on a computer with a keyboard and mouse.';
      status.hidden = false;
      status.scrollIntoView({ block: 'nearest' });
      return;
    }
    status.hidden = true;
    status.textContent = '';

    // Capture before adding the game host so the snapshot cannot contain itself.
    window.__destroyPageHTML = capturePage();
    var host = document.createElement('div');
    host.id = 'destroy-game-host';
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-label', isZh ? '摧毁网页小游戏' : 'Destroy this webpage game');

    var exit = document.createElement('button');
    exit.id = 'destroy-game-exit';
    exit.type = 'button';
    exit.textContent = isZh ? '退出并恢复' : 'Exit & restore';
    exit.addEventListener('click', stopDestroyGame);

    var frame = document.createElement('iframe');
    frame.id = 'destroy-game-frame';
    frame.title = isZh ? '摧毁网页小游戏' : 'Destroy this webpage game';
    frame.src = 'assets/destroy/index.html?lang=' + language();
    frame.addEventListener('load', function () { frame.contentWindow.focus(); });
    host.append(exit, frame);

    session = {
      host: host,
      frame: frame,
      activeElement: activeElement,
      htmlOverflow: document.documentElement.style.overflow,
      htmlScrollbarGutter: document.documentElement.style.scrollbarGutter,
      bodyOverflow: document.body.style.overflow,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };
    document.documentElement.style.scrollbarGutter = 'stable';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.appendChild(host);
  }

  function stopDestroyGame() {
    if (!session) return;
    var previous = session;
    session = null;
    previous.host.remove();
    delete window.__destroyPageHTML;
    document.documentElement.style.overflow = previous.htmlOverflow;
    document.documentElement.style.scrollbarGutter = previous.htmlScrollbarGutter;
    document.body.style.overflow = previous.bodyOverflow;
    window.scrollTo(previous.scrollX, previous.scrollY);
    var focusTarget = previous.activeElement;
    if (focusTarget && focusTarget.closest('#terminal-modal')) {
      focusTarget = document.getElementById('terminal-toggle');
    }
    if (focusTarget && focusTarget.isConnected) focusTarget.focus({ preventScroll: true });
  }

  window.startDestroyGame = startDestroyGame;
  window.stopDestroyGame = stopDestroyGame;
  launchButton.addEventListener('click', startDestroyGame);
  window.addEventListener('beforeprint', stopDestroyGame);
  window.addEventListener('langchanged', function () {
    stopDestroyGame();
    status.hidden = true;
    status.textContent = '';
  });
})();
