// jsDelivr CDN mirror redirect bypass for Chinese network environments
(function () {
    const mirror = 'fastly.jsdelivr.net';
    
    function rewriteUrl(urlStr) {
        if (typeof urlStr !== 'string') return urlStr;
        if (urlStr.includes('cdn.jsdelivr.net')) {
            urlStr = urlStr.replace('cdn.jsdelivr.net', mirror);
        }
        if (urlStr.includes('live2d.fghrsh.net/api/model/')) {
            urlStr = urlStr.replace('live2d.fghrsh.net/api/model/', mirror + '/gh/fghrsh/live2d_api@1.0.1/model/');
        }
        if (urlStr.includes('live2d.fghrsh.net/api/get/../model/')) {
            urlStr = urlStr.replace('live2d.fghrsh.net/api/get/../model/', mirror + '/gh/fghrsh/live2d_api@1.0.1/model/');
        }
        return urlStr;
    }

    // 1. Hook XMLHttpRequest.prototype.open
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...args) {
        if (url instanceof URL) {
            url = new URL(rewriteUrl(url.href));
        } else if (typeof url === 'string') {
            url = rewriteUrl(url);
        }
        return originalOpen.call(this, method, url, ...args);
    };

    // 2. Hook window.fetch
    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
        let urlStr = '';
        let isRequest = false;
        if (typeof input === 'string') {
            urlStr = input;
        } else if (input instanceof URL) {
            urlStr = input.href;
        } else if (input instanceof Request) {
            urlStr = input.url;
            isRequest = true;
        } else {
            urlStr = String(input);
        }

        const targetUrl = rewriteUrl(urlStr);
        if (targetUrl !== urlStr) {
            if (isRequest) {
                input = new Request(targetUrl, input);
            } else if (input instanceof URL) {
                input = new URL(targetUrl);
            } else {
                input = targetUrl;
            }
        }
        return originalFetch(input, init);
    };

    // 3. Hook HTMLImageElement src
    const originalSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (originalSrc && originalSrc.set) {
        Object.defineProperty(HTMLImageElement.prototype, 'src', {
            get: function () {
                return originalSrc.get.call(this);
            },
            set: function (value) {
                if (typeof value === 'string') {
                    value = rewriteUrl(value);
                }
                originalSrc.set.call(this, value);
            }
        });
    }
})();


String.prototype.render = function (context) {
    var tokenReg = /(\\)?\{([^\{\}\\]+)(\\)?\}/g;

    return this.replace(tokenReg, function (word, slash1, token, slash2) {
        if (slash1 || slash2) {
            return word.replace('\\', '');
        }

        var variables = token.replace(/\s/g, '').split('.');
        var currentObject = context;
        var i, length, variable;

        for (i = 0, length = variables.length; i < length; ++i) {
            variable = variables[i];
            currentObject = currentObject[variable];
            if (currentObject === undefined || currentObject === null) return '';
        }
        return currentObject;
    });
};

function getCurrentLanguage() {
    var storedLang = localStorage.getItem('lang');
    var htmlLang = document.documentElement.getAttribute('lang') || 'en';
    return storedLang === 'zh' || htmlLang.indexOf('zh') === 0 ? 'zh' : 'en';
}

var DEFAULT_WAIFU_MODEL_ID = '2';
var DEFAULT_WAIFU_TEXTURE_ID = '49';
var DEFAULT_WAIFU_MODEL_PATH = 'assets/kanban/model/Potion-Maker/Tia/model.json';
var DEFAULT_WAIFU_FALLBACK_IMG = 'assets/kanban/model/Potion-Maker/Tia/fallback.png';

function shouldHideWaifuForViewport() {
    if (window.matchMedia) {
        return window.matchMedia('(max-width: 768px)').matches;
    }
    return window.innerWidth <= 768;
}

function isDefaultWaifuModel(modelId, modelTexturesId) {
    return String(modelId) === DEFAULT_WAIFU_MODEL_ID &&
        String(modelTexturesId) === DEFAULT_WAIFU_TEXTURE_ID;
}

function getDefaultWaifuModelUrl() {
    return new URL(DEFAULT_WAIFU_MODEL_PATH, window.location.href).href;
}

// Live2D needs WebGL. When hardware acceleration is disabled or the GPU is
// blocklisted, modern Chrome refuses to fall back to software WebGL, so the
// canvas stays blank. Detect that up front so we can show a static image
// instead of an empty box.
var _waifuWebGLSupport = null;
function waifuSupportsWebGL() {
    // Cache the result: each getContext('webgl') spins up a real GPU context,
    // and churning throwaway contexts can itself destabilize a flaky GPU.
    if (_waifuWebGLSupport !== null) return _waifuWebGLSupport;
    if (typeof window.__waifuWebGLOK === 'boolean') {
        _waifuWebGLSupport = window.__waifuWebGLOK; // reuse the head-script probe
        return _waifuWebGLSupport;
    }
    try {
        if (!window.WebGLRenderingContext) { _waifuWebGLSupport = false; return false; }
        var c = document.createElement('canvas');
        _waifuWebGLSupport = !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch (e) {
        _waifuWebGLSupport = false;
    }
    return _waifuWebGLSupport;
}

function showWaifuFallback() {
    var waifu = document.querySelector('.waifu');
    if (!waifu) return;
    var canvas = document.getElementById('live2d');
    if (canvas) canvas.style.display = 'none';
    var img = waifu.querySelector('.waifu-fallback');
    if (!img) {
        img = document.createElement('img');
        img.className = 'waifu-fallback';
        img.alt = '';
        img.src = new URL(DEFAULT_WAIFU_FALLBACK_IMG, window.location.href).href;
        if (canvas && canvas.parentNode) {
            canvas.parentNode.insertBefore(img, canvas.nextSibling);
        } else {
            waifu.appendChild(img);
        }
    }
    img.style.display = 'block';
}

function hideWaifuFallback() {
    var img = document.querySelector('.waifu .waifu-fallback');
    if (img) img.style.display = 'none';
    var canvas = document.getElementById('live2d');
    if (canvas) canvas.style.display = 'block';
}

function getWaifuModelUrl(modelId, modelTexturesId) {
    if (isDefaultWaifuModel(modelId, modelTexturesId)) {
        return getDefaultWaifuModelUrl();
    }
    return 'https://live2d.fghrsh.net/api/get/?id=' + modelId + '-' + modelTexturesId;
}

function isSafeWaifuUrl(value) {
    return /^(https?:|mailto:|#|assets\/)/i.test(value || '');
}

function sanitizeWaifuInlineStyle(value) {
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

function setSafeWaifuHtml(el, html) {
    var template = document.createElement('template');
    template.innerHTML = String(html == null ? '' : html);
    var allowedTags = {
        A: ['href', 'target', 'rel'],
        SPAN: ['style', 'class'],
        DIV: ['style', 'class'],
        STRONG: [],
        B: [],
        EM: [],
        I: [],
        BR: []
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
                if (name === 'href' && !isSafeWaifuUrl(attr.value)) {
                    child.removeAttribute(attr.name);
                }
                if (name === 'target' && attr.value !== '_blank') {
                    child.removeAttribute(attr.name);
                }
                if (name === 'class' && attr.value !== 'cmd-highlight') {
                    child.removeAttribute(attr.name);
                }
                if (name === 'style') {
                    var safeStyle = sanitizeWaifuInlineStyle(attr.value);
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

var t = 1;
var re = /x/;
console.log(re);
re.toString = function() {
    showMessage(getCurrentLanguage() === 'zh' ? '哈哈，你打开了控制台，是想要看看我的秘密吗？' : 'Haha, you opened the console. Are you trying to look at my secrets? (◍•ᴗ•◍)', 5000, true);
    return '';
};

document.addEventListener('copy', function () {
    showMessage(getCurrentLanguage() === 'zh' ? '你都复制了些什么呀，转载要记得加上出处哦' : 'What did you copy? Remember to give credit when reposting!', 5000, true);
});

document.addEventListener("visibilitychange", function() {
    if (!document.hidden) showMessage(getCurrentLanguage() === 'zh' ? "(◍'౪`◍)ﾉﾞ欢迎回来 ! ^_^o" : "(◍'౪`◍)ﾉﾞ Welcome back! ^_^o", 6000, 9);
});

// Waifu tools event listeners
const fuiHome = document.querySelector('.waifu-tool .fui-home');
if (fuiHome) {
    fuiHome.addEventListener('click', function () {
        const header = document.getElementById('Header1_HeaderTitle');
        window.location = header ? header.getAttribute('href') : './';
    });
}

const fuiEye = document.querySelector('.waifu-tool .fui-eye');
if (fuiEye) {
    fuiEye.addEventListener('click', loadOtherModel);
}

const fuiChat = document.querySelector('.waifu-tool .fui-chat');
if (fuiChat) {
    fuiChat.addEventListener('click', showHitokoto);
}

const fuiUser = document.querySelector('.waifu-tool .fui-user');
if (fuiUser) {
    fuiUser.addEventListener('click', function () {
        loadRandModel();
        showMessage(getCurrentLanguage() === 'zh' ? '我的新衣服好看嘛' : 'Do you like my new clothes?', 3000, true);
    });
}

const fuiScience = document.querySelector('.waifu-tool .fui-science');
if (fuiScience) {
    fuiScience.addEventListener('click', showScienceQuote);
}

const fuiPhoto = document.querySelector('.waifu-tool .fui-photo');
if (fuiPhoto) {
    fuiPhoto.addEventListener('click', function () {
        if (window.Live2D) {
            showMessage(getCurrentLanguage() === 'zh' ? '照好了嘛，是不是很可爱呢？' : 'Did you take the photo? Am I cute? (◍•ᴗ•◍)', 5000, true);
            window.Live2D.captureName = 'Live2D.png';
            window.Live2D.captureFrame = true;
        } else {
            showMessage(getCurrentLanguage() === 'zh' ? 'Live2D 还没有准备好，稍后再拍照吧。' : 'Live2D is not ready yet. Please try again in a moment.', 4000, true);
        }
    });
}

const fuiInfo = document.querySelector('.waifu-tool .fui-info-circle');
if (fuiInfo) {
    fuiInfo.addEventListener('click', function () {
        var modelId = localStorage.getItem('modelId');
        var suffix = 'Live2D';
        if (modelId) {
            var id = parseInt(modelId);
            switch (id) {
                case 1:
                    suffix = 'PIO';
                    break;
                case 2:
                    suffix = 'TIA';
                    break;
                case 3:
                case 4:
                    suffix = 'Bilibili娘';
                    break;
                case 5:
                    suffix = 'Live2D';
                    break;
                case 6:
                    suffix = '涅普缇努';
                    break;
                case 7:
                    suffix = '舰队Collection:丛云';
                    break;
                default:
                    suffix = 'Live2D';
                    break;
            }
        }
        window.open('https://zh.moegirl.org.cn/' + encodeURIComponent(suffix));
    });
}

const fuiCross = document.querySelector('.waifu-tool .fui-cross');
if (fuiCross) {
    fuiCross.addEventListener('click', function () {
        sessionStorage.setItem('waifu-display', 'none');
        sessionStorage.removeItem('waifu-dsiplay');
        showMessage(getCurrentLanguage() === 'zh' ? '愿你有一天能与重要的人重逢' : 'I hope you will meet the important person again someday.', 1300, true);
        window.setTimeout(function() {
            const waifu = document.querySelector('.waifu');
            if (waifu) waifu.style.display = 'none';
        }, 1300);
    });
}

function waifuWelcome(){
    var text;
    var SiteIndexUrl = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + '/';

    var isHomepage = (window.location.href == SiteIndexUrl || 
                      window.location.pathname === '/' || 
                      window.location.pathname === '/index.html' || 
                      window.location.pathname.endsWith('/'));

    var isZh = getCurrentLanguage() === 'zh';

    if (isHomepage) {      // 如果是主页
        var now = (new Date()).getHours();
        if (now > 23 || now <= 5) {
            text = isZh ? '你是夜猫子呀？这么晚还不睡觉，明天起的来嘛' : 'Are you a night owl? Still awake at this hour? Can you get up tomorrow?';
        } else if (now > 5 && now <= 7) {
            text = isZh ? '早上好！一日之计在于晨，美好的一天就要开始了' : 'Good morning! A beautiful day has just begun.';
        } else if (now > 7 && now <= 11) {
            text = isZh ? '上午好！工作顺利嘛，不要久坐，多起来走动走动哦！' : 'Good morning! How is work going? Don\'t sit for too long, stand up and stretch!';
        } else if (now > 11 && now <= 14) {
            text = isZh ? '中午了，工作了一个上午，现在是午餐时间！' : 'It\'s noon, time for lunch!';
        } else if (now > 14 && now <= 17) {
            text = isZh ? '午后很容易犯困呢，今天的运动目标完成了吗？' : 'It\'s easy to feel sleepy in the afternoon. Have you finished your exercise goals today?';
        } else if (now > 17 && now <= 19) {
            text = isZh ? '傍晚了！窗外夕阳的景色很美丽呢，最美不过夕阳红~' : 'It\'s evening! The sunset outside is beautiful.';
        } else if (now > 19 && now <= 21) {
            text = isZh ? '晚上好，今天过得怎么样？' : 'Good evening! How has your day been?';
        } else if (now > 21 && now <= 23) {
            text = isZh ? '已经这么晚了呀，早点休息吧，晚安~' : 'It\'s getting very late, take an early rest. Good night~';
        } else {
            text = isZh ? '嗨~ 快来逗我玩吧！' : 'Hi~ Come play with me!';
        }
    } else {
        if(document.referrer !== ''){
            var referrer = document.createElement('a');
            referrer.href = document.referrer;
            var domain = referrer.hostname.split('.')[1];
            if (window.location.hostname == referrer.hostname) {
                text = isZh ? '欢迎阅读<span style="color:var(--link);">『' + document.title.split(/\s*[-|]\s*/)[0] + '』</span>' : 'Welcome to read <span style="color:var(--link);">"' + document.title.split(/\s*[-|]\s*/)[0] + '"</span>';
            } else if (domain == 'baidu') {
                text = isZh ? 'Hello! 来自 百度搜索 的朋友<br>你是搜索 <span style="color:var(--link);">' + (referrer.search.split('&wd=')[1] ? referrer.search.split('&wd=')[1].split('&')[0] : '') + '</span> 找到的我吗？' : 'Hello! Friend from Baidu Search.<br>Did you find me by searching <span style="color:var(--link);">' + (referrer.search.split('&wd=')[1] ? referrer.search.split('&wd=')[1].split('&')[0] : '') + '</span>?';
            } else if (domain == 'so') {
                text = isZh ? 'Hello! 来自 360搜索 的朋友<br>你是搜索 <span style="color:var(--link);">' + (referrer.search.split('&q=')[1] ? referrer.search.split('&q=')[1].split('&')[0] : '') + '</span> 找到的我吗？' : 'Hello! Friend from 360 Search.<br>Did you find me by searching <span style="color:var(--link);">' + (referrer.search.split('&q=')[1] ? referrer.search.split('&q=')[1].split('&')[0] : '') + '</span>?';
            } else if (domain == 'google') {
                text = isZh ? 'Hello! 来自 谷歌搜索 的朋友<br>欢迎阅读<span style="color:var(--link);">『' + document.title.split(/\s*[-|]\s*/)[0] + '』</span>' : 'Hello! Friend from Google Search.<br>Welcome to read <span style="color:var(--link);">"' + document.title.split(/\s*[-|]\s*/)[0] + '"</span>';
            } else {
                text = isZh ? 'Hello! 来自 <span style="color:var(--link);">' + referrer.hostname + '</span> 的朋友' : 'Hello! Friend from <span style="color:var(--link);">' + referrer.hostname + '</span>';
            }
        } else {
            text = isZh ? '欢迎阅读<span style="color:var(--link);">『' + document.title.split(/\s*[-|]\s*/)[0] + '』</span>' : 'Welcome to read <span style="color:var(--link);">"' + document.title.split(/\s*[-|]\s*/)[0] + '"</span>';
        }
    }
    showMessage(text, 6000, true);
}

var getActed = false;
window.hitokotoTimer = 0;
var hitokotoInterval = false;

document.addEventListener('mousemove', function() { getActed = true; }, { passive: true });
document.addEventListener('keydown', function() { getActed = true; }, { passive: true });

setInterval(function() { if (!getActed) ifActed(); else elseActed(); }, 1000);

function ifActed(){
    if (!hitokotoInterval) {
        hitokotoInterval = true;
        hitokotoTimer = window.setInterval(showHitokoto, 30000);
    }
}

function elseActed(){
    getActed = hitokotoInterval = false;
    window.clearInterval(hitokotoTimer);
}

function showHitokoto(){
    window.clearTimeout(t);
    fetch('https://v1.hitokoto.cn')
        .then(function (response) { return response.json(); })
        .then(function (result) {
            var text = getCurrentLanguage() === 'zh'
                ? '这句一言出自 <span style="color:var(--link);">『{source}』</span>'
                : 'This quote is from <span style="color:var(--link);">{source}</span>';
            text = text.render({source: result.from || 'Unknown'});
            showMessage(result.hitokoto || '', 5000, false, { plain: true });
            t = window.setTimeout(function() { showMessage(text, 3000); }, 5000);
        })
        .catch(function() { /* silently fail */ });
}

var messageTimeoutId = null;
var hideTimeoutId = null;

function showMessage(text, timeout, flag, options){
    if(flag || sessionStorage.getItem('waifu-text') === '' || sessionStorage.getItem('waifu-text') === null){
        if(Array.isArray(text)) text = text[Math.floor(Math.random() * text.length)];

        if(flag) sessionStorage.setItem('waifu-text', text);

        const tipsEl = document.querySelector('.waifu-tips');
        if (tipsEl) {
            if (options && options.plain) {
                tipsEl.textContent = text == null ? '' : String(text);
            } else {
                setSafeWaifuHtml(tipsEl, text);
            }
            tipsEl.style.opacity = '1';
            tipsEl.style.pointerEvents = 'none';
            tipsEl.style.animationPlayState = 'running';
        }
        if (timeout === undefined) timeout = 5000;
        hideMessage(timeout);
    }
}

function hideMessage(timeout){
    if (timeout === undefined) timeout = 5000;
    window.clearTimeout(messageTimeoutId);
    window.clearTimeout(hideTimeoutId);
    
    hideTimeoutId = window.setTimeout(function() {
        sessionStorage.removeItem('waifu-text');
        const tipsEl = document.querySelector('.waifu-tips');
        if (tipsEl) {
            tipsEl.style.opacity = '0';
            tipsEl.style.pointerEvents = 'none';
            tipsEl.style.animationPlayState = 'paused';
        }
    }, timeout);
}

var waifuJsonZh = {
    "mouseover": [
        {
            "selector": ".waifu-tool .fui-home",
            "text": ["回首页看看吧！"]
        },
        {
            "selector": ".waifu-tool .fui-eye",
            "text": ["要切换看板娘吗？"]
        },
        {
            "selector": ".waifu-tool .fui-chat",
            "text": ["猜猜我要说些什么？"]
        },
        {
            "selector": ".waifu-tool .fui-user",
            "text": ["喜欢换装PLAY吗？"]
        },
        {
            "selector": ".waifu-tool .fui-science",
            "text": ["想要听听科学名言或者硬核冷笑话吗？"]
        },
        {
            "selector": ".waifu-tool .fui-info-circle",
            "text": ["想要知道更多有关我的事吗？"]
        },
        {
            "selector": ".waifu-tool .fui-cross",
            "text": ["到了要说再见的时候了吗~"]
        },
        {
            "selector": ".waifu-tool .fui-photo",
            "text": ["你要给我拍照呀，一二三~茄子~~"]
        },
        {
            "selector": ".waifu #live2d",
            "text": ["干嘛呢你，快把手拿开", "鼠…鼠标放错地方了！"]
        }
    ],
    "click": [
        {
            "selector": ".waifu #live2d",
            "text": ["是…是不小心碰到了吧！", "萝莉控是什么呀！", "你看到我的小熊了吗？", "再摸的话我可要报警了！⌇●﹏●⌇", "110吗，这里有个变态一直在摸我(ó﹏ò｡)"]
        }
    ],
    "seasons": [
        {
            "date": "01/01",
            "text": "<span style=\"color:var(--link);\">元旦</span>了呢，新的一年又开始了，今年是{year}年~"
        },
        {
            "date": "02/14",
            "text": "又是一年<span style=\"color:var(--link);\">情人节</span>，{year}年找到对象了嘛~"
        },
        {
            "date": "03/08",
            "text": "今天是<span style=\"color:var(--link);\">妇女节</span>！"
        },
        {
            "date": "03/12",
            "text": "今天是<span style=\"color:var(--link);\">植树节</span>，要保护环境呀！"
        },
        {
            "date": "04/01",
            "text": "悄悄告诉你一个秘密~<span style=\"background-color:#34495e;\">今天是愚人节，不要被骗了哦~</span>"
        },
        {
            "date": "05/01",
            "text": "今天是<span style=\"color:var(--link);\">五一劳动节</span>，计划好假期去哪里了吗~"
        },
        {
            "date": "06/01",
            "text": "<span style=\"color:var(--link);\">儿童节</span>了呢，快活的时光总是短暂，要是永远长不大该多好啊…"
        },
        {
            "date": "09/03",
            "text": "<span style=\"color:var(--link);\">中国人民抗日战争胜利纪念日</span>，铭记历史、缅怀先烈、珍爱和平、开创未来。"
        },
        {
            "date": "09/10",
            "text": "<span style=\"color:var(--link);\">教师节</span>，在学校要给老师问声好呀~"
        },
        {
            "date": "10/01",
            "text": "<span style=\"color:var(--link);\">国庆节</span>，新中国已经成立69年了呢"
        },
        {
            "date": "11/05-11/12",
            "text": "今年的<span style=\"color:var(--link);\">双十一</span>是和谁一起过的呢~"
        },
        {
            "date": "12/20-12/31",
            "text": "这几天是<span style=\"color:var(--link);\">圣诞节</span>，主人肯定又去剁手买买买了~"
        }
    ]
};

var waifuJsonEn = {
    "mouseover": [
        {
            "selector": ".waifu-tool .fui-home",
            "text": ["Let's go back to the homepage!"]
        },
        {
            "selector": ".waifu-tool .fui-eye",
            "text": ["Want to switch the mascot?"]
        },
        {
            "selector": ".waifu-tool .fui-chat",
            "text": ["Guess what I am going to say?"]
        },
        {
            "selector": ".waifu-tool .fui-user",
            "text": ["Do you like dress-up games?"]
        },
        {
            "selector": ".waifu-tool .fui-science",
            "text": ["Want to hear some scientific quotes or chemistry jokes?"]
        },
        {
            "selector": ".waifu-tool .fui-info-circle",
            "text": ["Want to know more about me?"]
        },
        {
            "selector": ".waifu-tool .fui-cross",
            "text": ["Is it time to say goodbye?"]
        },
        {
            "selector": ".waifu-tool .fui-photo",
            "text": ["Cheese! Let's take a cute screenshot!"]
        },
        {
            "selector": ".waifu #live2d",
            "text": ["Hey, put your hand away!", "Where are you placing your mouse?"]
        }
    ],
    "click": [
        {
            "selector": ".waifu #live2d",
            "text": ["Did you touch me by accident?", "What is a lolicon?", "Have you seen my bear?", "I will call the police if you keep doing that! ⌇●﹏●⌇", "Hello 911? There's a pervert touching me! (ó﹏ò｡)"]
        }
    ],
    "seasons": [
        {
            "date": "01/01",
            "text": "Happy New Year! Welcome to year {year}~"
        },
        {
            "date": "02/14",
            "text": "It's Valentine's Day! Have you found a date this year?"
        },
        {
            "date": "03/08",
            "text": "Happy International Women's Day!"
        },
        {
            "date": "03/12",
            "text": "Today is Arbor Day, protect the environment!"
        },
        {
            "date": "04/01",
            "text": "Let me tell you a secret... <span style=\"background-color:#34495e;\">It's April Fool's Day, don't get fooled!</span>"
        },
        {
            "date": "05/01",
            "text": "Happy Labour Day! Any vacation plans?"
        },
        {
            "date": "06/01",
            "text": "Happy Children's Day! I wish I never grew up..."
        },
        {
            "date": "09/03",
            "text": "Remembering history and cherishing peace."
        },
        {
            "date": "09/10",
            "text": "Happy Teacher's Day! Remember to thank your teachers."
        },
        {
            "date": "10/01",
            "text": "Happy National Day!"
        },
        {
            "date": "11/05-11/12",
            "text": "Who are you spending Single's Day / Double 11 with?"
        },
        {
            "date": "12/20-12/31",
            "text": "Merry Christmas! The owner is probably shopping again~"
        }
    ]
};

function getWaifuJson() {
    return getCurrentLanguage() === 'zh' ? waifuJsonZh : waifuJsonEn;
}

function initModel(){
    if (sessionStorage.getItem('waifu-dsiplay') === 'none') {
        sessionStorage.setItem('waifu-display', 'none');
        sessionStorage.removeItem('waifu-dsiplay');
    }

    if (sessionStorage.getItem('waifu-display') === 'none') {
        const waifuEl = document.querySelector('.waifu');
        if (waifuEl) waifuEl.style.display = 'none';
        return;
    }

    if (shouldHideWaifuForViewport()) {
        const waifuEl = document.querySelector('.waifu');
        if (waifuEl) waifuEl.style.display = 'none';
        return;
    }

    waifuWelcome();

    // Always start from a local default model so stale browser state or a slow
    // external Live2D API cannot leave the homepage with an empty canvas.
    loadModel(DEFAULT_WAIFU_MODEL_ID, DEFAULT_WAIFU_TEXTURE_ID);

    // Mouseover event delegation
    document.addEventListener('mouseover', function(event) {
        var activeJson = getWaifuJson();
        for (var i = 0; i < activeJson.mouseover.length; i++) {
            var tips = activeJson.mouseover[i];
            var target = event.target.closest(tips.selector);
            if (target) {
                var text = tips.text;
                if (Array.isArray(text)) {
                    text = text[Math.floor(Math.random() * text.length)];
                }
                text = text.render({text: target.innerText || target.textContent});
                showMessage(text, 3000);
                break;
            }
        }
    });

    // Click event delegation
    document.addEventListener('click', function(event) {
        var activeJson = getWaifuJson();
        for (var i = 0; i < activeJson.click.length; i++) {
            var tips = activeJson.click[i];
            var target = event.target.closest(tips.selector);
            if (target) {
                var text = tips.text;
                if (Array.isArray(text)) {
                    text = text[Math.floor(Math.random() * text.length)];
                }
                text = text.render({text: target.innerText || target.textContent});
                showMessage(text, 3000, true);
                break;
            }
        }
    });

    getWaifuJson().seasons.forEach(function (tips) {
        var now = new Date();
        var after = tips.date.split('-')[0];
        var before = tips.date.split('-')[1] || after;

        if ((after.split('/')[0] <= now.getMonth() + 1 && now.getMonth() + 1 <= before.split('/')[0]) &&
            (after.split('/')[1] <= now.getDate() && now.getDate() <= before.split('/')[1])) {
            var text = tips.text;
            if (Array.isArray(text)) {
                text = text[Math.floor(Math.random() * text.length)];
            }
            text = text.render({year: now.getFullYear()});
            showMessage(text, 6000, true);
        }
    });
}

function loadModel(modelId, modelTexturesId){
    modelId = modelId == null ? DEFAULT_WAIFU_MODEL_ID : String(modelId);
    localStorage.setItem('modelId', modelId);
    if (modelTexturesId === undefined || modelTexturesId === null) {
        modelTexturesId = isDefaultWaifuModel(modelId, DEFAULT_WAIFU_TEXTURE_ID) ? DEFAULT_WAIFU_TEXTURE_ID : 0;
    }
    modelTexturesId = String(modelTexturesId);
    localStorage.setItem('modelTexturesId', modelTexturesId);
    // Some macOS/Chrome builds crash the GPU process when WebGL runs. Once that
    // has happened for this visitor, stop retrying WebGL — the static image is
    // safer than repeatedly crashing the GPU.
    var webglBroken = false;
    try { webglBroken = localStorage.getItem('waifu-webgl-broken') === '1'; } catch (err) {}
    if (typeof loadlive2d !== 'function' || !waifuSupportsWebGL() || webglBroken) {
        // No Live2D runtime, no WebGL (hardware acceleration off), or WebGL
        // previously crashed: show the static mascot image instead of a blank
        // or torn canvas.
        showWaifuFallback();
        return;
    }
    hideWaifuFallback();

    // If the GPU process crashes mid-session (common on some macOS/Chrome
    // builds), the canvas fires 'webglcontextlost' and the model would
    // otherwise freeze or tear. Swap to the static image instead.
    var liveCanvas = document.getElementById('live2d');
    if (liveCanvas && !liveCanvas.dataset.lostHandler) {
        liveCanvas.dataset.lostHandler = '1';
        liveCanvas.addEventListener('webglcontextlost', function (e) {
            e.preventDefault();
            // Graceful ladder, keeping the dynamic mascot as long as possible:
            //  1st crash -> next load keeps the model but drops the GPU-heavy
            //               frosted glass (biggest consumer) to cut pressure.
            //  crashes again -> give up WebGL and use the static image.
            try {
                if (localStorage.getItem('waifu-gpu-trouble') !== '1') {
                    localStorage.setItem('waifu-gpu-trouble', '1');
                    document.documentElement.classList.add('no-gpu-glass');
                } else {
                    localStorage.setItem('waifu-webgl-broken', '1');
                }
            } catch (err) {}
            showWaifuFallback();
        });
    }

    var modelUrl = getWaifuModelUrl(modelId, modelTexturesId);

    // IMPORTANT: loadlive2d(id, url, X) — the 3rd argument is the vertical
    // look-at center factor (default 0.5), NOT a load callback. Older code
    // passed a function here, which set X to a function, so the mouse-follow
    // math evaluated `canvas.height * X` = NaN. That NaN flowed into the
    // model's angle parameters and tore the mesh apart (and crashed the GPU
    // process on some drivers) the instant the cursor moved over the mascot.
    // Pass no 3rd argument so X stays 0.5.
    loadlive2d('live2d', modelUrl);
    console.log('live2d', '模型 ' + modelId + '-' + modelTexturesId + ' 已请求加载');
}

function loadRandModel(){
    var modelId = localStorage.getItem('modelId') || 2;
    var modelTexturesId = localStorage.getItem('modelTexturesId') || 49;
    var modelTexturesRandMode = 'switch';

    fetch('https://live2d.fghrsh.net/api/'+modelTexturesRandMode+'_textures/?id='+modelId+'-'+modelTexturesId, { cache: 'no-cache' })
        .then(function (response) { return response.json(); })
        .then(function (result) {
            if (result && result.textures && result.textures.id !== undefined) {
                loadModel(modelId, result.textures.id);
            }
        })
        .catch(function () { /* silently fail */ });
}

function loadOtherModel(){
    var modelId = localStorage.getItem('modelId') || 2;
    var modelTexturesRandMode = 'switch';

    fetch('https://live2d.fghrsh.net/api/'+modelTexturesRandMode+'/?id='+modelId, { cache: 'no-cache' })
        .then(function (response) { return response.json(); })
        .then(function (result) {
            if (result && result.model && result.model.id !== undefined) {
                loadModel(result.model.id);
                if (result.model.message) {
                    showMessage(result.model.message, 3000, true);
                }
            }
        })
        .catch(function () { /* silently fail */ });
}

// ==========================================
// Option 6: Science Quotes Library
// ==========================================
var scienceQuotes = {
    zh: [
        "如果想学好化学，你得常常在溶液里泡着。不过要是没学好，你可能就变成沉淀了。🧪",
        "为什么化学家最擅长解决纠纷？因为他们总能找到“溶剂”。",
        "计算机领域只有两大难题：缓存失效、命名，以及差一错误。💻",
        "All you need is attention... 以及一块充足预算的 GPU！🧠",
        "世上共有 10 种人：懂得二进制的，和不懂的。",
        "化学家不会死，他们只是停止了反应。⚗️",
        "有机化学是关于碳化合物的科学；生物化学是研究“会爬的”碳化合物。—— 迈克·亚当斯",
        "一个中子走进酒吧说：“来杯啤酒，多少钱？” 调酒师笑了笑：“对你，免单（No charge）。” ⚛️",
        "爱因斯坦说：宇宙中只有两件事是无限的，那就是宇宙和人类的愚蠢。不过对于前者，我还不太确定。",
        "在 AI for Science 的时代，神经网络不仅在预测性质，它甚至在重新定义分子的审美。",
        "科学家说我们都是由星尘组成的。也就是说，我们是一群会做微积分的星尘。✨",
        "代码写完了，编译也通过了，可是为什么它能动起来？这大概是继量子力学后的第二大宇宙谜题。",
        "为什么程序员分不清万圣节和圣诞节？因为 Oct 31 == Dec 25！🎃🎄",
    ],
    en: [
        "If you want to learn chemistry, you have to soak in solution. But if you don't learn it well, you might become a precipitate. 🧪",
        "Why are chemists so good at solving problems? Because they always find a 'solvent'.",
        "There are only two hard things in Computer Science: cache invalidation, naming things, and off-by-one errors. 💻",
        "All you need is attention... and a GPU with a generous budget! 🧠",
        "There are 10 types of people in the world: those who understand binary, and those who don't.",
        "Chemists do not die, they just stop reacting. ⚗️",
        "Organic chemistry is the study of carbon compounds; biochemistry is the study of carbon compounds that crawl. — Mike Adams",
        "A neutron walks into a bar and asks, 'How much for a beer?' The bartender smiles and says, 'For you, no charge.' ⚛️",
        "Einstein said: Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
        "In the era of AI for Science, neural networks are not just predicting properties, they are redefining molecular aesthetics.",
        "Scientists say we are made of stardust. That means we are a bunch of stardust that can do calculus. ✨",
        "Code is written and compiled, but why does it run? This is probably the second greatest mystery in the universe after quantum mechanics.",
        "Why do programmers always confuse Halloween and Christmas? Because Oct 31 == Dec 25! 🎃🎄",
    ]
};

function showScienceQuote() {
    var lang = getCurrentLanguage();
    var quotes = scienceQuotes[lang] || scienceQuotes.en;
    var quote = quotes[Math.floor(Math.random() * quotes.length)];
    showMessage(quote, 5000, true);
}

// ==========================================
// Option 3: Konami Code & Falling Stars Animation
// ==========================================
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
let konamiIndex = 0;

document.addEventListener('keydown', function (e) {
    let key = e.code;
    if (!key) {
        if (e.key === 'b' || e.key === 'B') key = 'KeyB';
        if (e.key === 'a' || e.key === 'A') key = 'KeyA';
    }
    
    // Support loose case matching
    if (e.key && e.key.toLowerCase() === 'b') key = 'KeyB';
    if (e.key && e.key.toLowerCase() === 'a') key = 'KeyA';

    if (key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            konamiIndex = 0;
            triggerKonamiStars();
            showMessage(getCurrentLanguage() === 'zh' ? "你激活了科乐美终极秘籍！(◍•ᴗ•◍) 送你漫天星光！" : "You activated the ultimate Konami code! (◍•ᴗ•◍) Here is a sky full of stars for you!", 8000, true);
        }
    } else {
        konamiIndex = (key === konamiCode[0]) ? 1 : 0;
    }
});

function triggerKonamiStars() {
    const canvas = document.getElementById('easter-egg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.style.display = 'block';
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#ffeb3b', '#ffc107', '#ff5722', '#e91e63', '#9c27b0', '#3f51b5', '#00abcd', '#4caf50'];

    for (let i = 0; i < 80; i++) {
        particles.push({
            x: Math.random() * width,
            y: -20 - Math.random() * 100,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 5 + 3,
            size: Math.random() * 8 + 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * Math.PI,
            rotSpeed: (Math.random() - 0.5) * 0.1,
            opacity: 1
        });
    }

    function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color, opacity) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    let start = null;
    function render(timestamp) {
        if (!start) start = timestamp;
        let progress = timestamp - start;

        ctx.clearRect(0, 0, width, height);

        let active = false;
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotSpeed;
            if (progress > 3000) {
                p.opacity -= 0.02;
            }
            if (p.opacity > 0 && p.y < height + 20) {
                active = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                drawStar(ctx, 0, 0, 5, p.size, p.size / 2, p.color, Math.max(0, p.opacity));
                ctx.restore();
            }
        });

        if (active && progress < 6000) {
            requestAnimationFrame(render);
        } else {
            canvas.style.display = 'none';
        }
    }

    requestAnimationFrame(render);
}

// ==========================================
// Option 2: Retro Terminal Console CLI Modal
// ==========================================
function isCompactWidgetViewport() {
    if (window.matchMedia) {
        return window.matchMedia('(max-width: 820px)').matches;
    }
    return window.innerWidth <= 820;
}

function setMusicPlayerExpanded(expanded) {
    const musicCard = document.getElementById('music-card');
    const musicToggle = document.getElementById('music-toggle-btn');
    if (!musicCard || !musicToggle) return false;

    musicCard.style.display = expanded ? 'flex' : 'none';
    musicToggle.style.display = expanded ? 'none' : 'flex';
    return true;
}

function syncTerminalToggleState(isVisible) {
    const terminalToggle = document.getElementById('terminal-toggle');
    if (terminalToggle) {
        terminalToggle.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
    }
    if (typeof window.syncActionButtons === 'function') {
        window.syncActionButtons();
    }
}

function toggleTerminal(forceState) {
    const modal = document.getElementById('terminal-modal');
    const input = document.getElementById('terminal-input');
    if (!modal || !input) return;

    const isVisible = forceState !== undefined ? forceState : modal.hasAttribute('hidden');
    if (isVisible) {
        if (isCompactWidgetViewport()) {
            setMusicPlayerExpanded(false);
        }
        modal.removeAttribute('hidden');
        setTimeout(() => {
            modal.classList.add('visible');
            input.focus();
        }, 10);
    } else {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.setAttribute('hidden', '');
        }, 300);
    }
    syncTerminalToggleState(isVisible);
}

const termToggle = document.getElementById('terminal-toggle');
if (termToggle) {
    termToggle.addEventListener('click', function() {
        toggleTerminal();
    });
}

const termClose = document.querySelector('#terminal-modal .close-btn');
if (termClose) {
    termClose.addEventListener('click', function() {
        toggleTerminal(false);
        const modal = document.getElementById('terminal-modal');
        if (modal) modal.classList.remove('maximized');
        const outputEl = document.getElementById('terminal-output');
        if (outputEl) {
            setSafeWaifuHtml(outputEl, `
        <div>Welcome to Zongmin's Academic Homepage Console.</div>
        <div>Type <span class="cmd-highlight">help</span> to list available commands.</div>
        <div style="margin-bottom: 10px;">Press <span class="cmd-highlight">\`</span> (backtick) to close this terminal.</div>
`);
        }
    });
}

const termMinimize = document.querySelector('#terminal-modal .minimize-btn');
if (termMinimize) {
    termMinimize.addEventListener('click', function() {
        toggleTerminal(false);
        const modal = document.getElementById('terminal-modal');
        if (modal) modal.classList.remove('maximized');
    });
}

const termExpand = document.querySelector('#terminal-modal .expand-btn');
if (termExpand) {
    termExpand.addEventListener('click', function() {
        const modal = document.getElementById('terminal-modal');
        if (modal) {
            modal.classList.toggle('maximized');
        }
    });
}

document.addEventListener('keydown', function(e) {
    if (e.key === '`' || e.code === 'Backquote') {
        e.preventDefault();
        toggleTerminal();
    }
});

const termInput = document.getElementById('terminal-input');
if (termInput) {
    termInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            handleTerminalCommand(this.value);
        }
    });
}

function handleTerminalCommand(cmdString) {
    const outputEl = document.getElementById('terminal-output');
    const inputEl = document.getElementById('terminal-input');
    if (!outputEl || !inputEl) return;

    const commandLine = document.createElement('div');
    const promptSpan = document.createElement('span');
    promptSpan.style.color = '#4ade80';
    promptSpan.style.fontWeight = 'bold';
    promptSpan.textContent = 'zongmin@hkust:~$';
    commandLine.appendChild(promptSpan);
    commandLine.appendChild(document.createTextNode(' ' + cmdString));
    outputEl.appendChild(commandLine);

    const trimmed = cmdString.trim();
    const args = trimmed.split(/\s+/);
    const command = args[0].toLowerCase();

    const responseLine = document.createElement('div');

    var isZh = getCurrentLanguage() === 'zh';
    if (command === 'help') {
        setSafeWaifuHtml(responseLine, isZh ? `
可用命令:
  <span class="cmd-highlight">about</span>      - 张宗民的个人简介
  <span class="cmd-highlight">cv</span>         - 学术简历摘要
  <span class="cmd-highlight">waifu &lt;msg&gt;</span> - 让看板娘说出指定内容
  <span class="cmd-highlight">bgm</span>        - 显示/隐藏背景音乐播放器
  <span class="cmd-highlight">matrix</span>     - 在终端背景运行代码雨
  <span class="cmd-highlight">hack</span>       - 运行一段有趣的黑客模拟动效
  <span class="cmd-highlight">clear</span>      - 清空屏幕
  <span class="cmd-highlight">close</span>      - 关闭终端控制台
` : `
Available commands:
  <span class="cmd-highlight">about</span>      - Short bio of Zongmin Zhang
  <span class="cmd-highlight">cv</span>         - Academic profile summary
  <span class="cmd-highlight">waifu &lt;msg&gt;</span> - Make the mascot say a message
  <span class="cmd-highlight">bgm</span>        - Toggle the background music player card
  <span class="cmd-highlight">matrix</span>     - Run Matrix code rain in terminal background
  <span class="cmd-highlight">hack</span>       - Run a fun hacker console output
  <span class="cmd-highlight">clear</span>      - Clear the screen
  <span class="cmd-highlight">close</span>      - Close the console
`);
    } else if (command === 'clear') {
        outputEl.replaceChildren();
        inputEl.value = '';
        return;
    } else if (command === 'close') {
        toggleTerminal(false);
        inputEl.value = '';
        return;
    } else if (command === 'about') {
        setSafeWaifuHtml(responseLine, isZh ? `
张宗民，香港科技大学计算机科学大四本科生（辅修化学）。
研究方向：科学智能 (AI4Sci)、化学智能 (AI4Chem)、自主科学发现 (AutoResearch)、多智能体系统 (MAS)、大语言模型 (LLM)。
实验室：港科大 AI4PhysSci 实验室（导师：程立雪教授）。
` : `
Zongmin Zhang is a senior CS undergraduate at HKUST (minor in Chemistry).
Research Interests: AI for Science, AI for Chemistry, Autonomous Scientific Discovery, Multi-Agent Systems, Large Language Models.
Lab: AI4PhysSci Lab (Supervisor: Prof. Sherry Lixue Cheng).
`);
    } else if (command === 'cv') {
        responseLine.textContent = isZh ? "正在新标签页中打开张宗民的简历..." : "Opening Zongmin Zhang's CV in a new tab...";
        window.open('assets/CV_Zongmin.pdf', '_blank');
    } else if (command === 'waifu') {
        const msg = args.slice(1).join(' ');
        if (!msg) {
            responseLine.textContent = isZh ? '用法: waifu <内容>' : 'Usage: waifu <message>';
        } else {
            showMessage(msg, 6000, true, { plain: true });
            responseLine.textContent = isZh ? `已让看板娘说: "${msg}"` : `Told Waifu to say: "${msg}"`;
        }
    } else if (command === 'bgm') {
        const musicCard = document.getElementById('music-card');
        const musicToggle = document.getElementById('music-toggle-btn');
        if (musicCard && musicToggle) {
            const isMusicHidden = window.getComputedStyle(musicCard).display === 'none';
            if (isMusicHidden) {
                setMusicPlayerExpanded(true);
                if (isCompactWidgetViewport()) {
                    setTimeout(() => toggleTerminal(false), 120);
                }
                responseLine.textContent = isZh ? '已恢复音乐播放器卡片。' : 'Restored background music player card.';
            } else {
                setMusicPlayerExpanded(false);
                responseLine.textContent = isZh ? '已最小化音乐播放器卡片。' : 'Minimized background music player card.';
            }
        } else {
            responseLine.textContent = isZh ? '未找到音乐播放器卡片。' : 'Music player card not found.';
        }
    } else if (command === 'matrix') {
        responseLine.textContent = isZh ? '正在启动代码雨... 按 ESC、` 或点击屏幕任意位置可退出。' : 'Starting Matrix digital rain... Press ESC, Backtick (`) or click anywhere to exit.';
        startMatrixRain();
    } else if (command === 'hack') {
        responseLine.textContent = isZh ? '正在对香港科技大学服务器发起模拟攻击...' : 'Initiating brute force hack on HKUST servers...';
        runHackSequence(outputEl);
    } else if (trimmed === '') {
        inputEl.value = '';
        return;
    } else {
        responseLine.appendChild(document.createTextNode(isZh ? '未找到命令: ' : 'Command not found: '));
        const badCommand = document.createElement('span');
        badCommand.style.color = '#f87171';
        badCommand.textContent = command;
        responseLine.appendChild(badCommand);
        responseLine.appendChild(document.createTextNode(isZh ? '。输入 ' : '. Type '));
        const helpCommand = document.createElement('span');
        helpCommand.className = 'cmd-highlight';
        helpCommand.textContent = 'help';
        responseLine.appendChild(helpCommand);
        responseLine.appendChild(document.createTextNode(isZh ? ' 查看可用命令。' : ' for commands.'));
    }

    outputEl.appendChild(responseLine);
    inputEl.value = '';
    
    if (outputEl) outputEl.scrollTop = outputEl.scrollHeight;
    const bodyEl = document.getElementById('terminal-body');
    if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
}

let matrixInterval = null;
function startMatrixRain() {
    const canvas = document.getElementById('easter-egg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    clearInterval(matrixInterval);

    canvas.style.display = 'block';
    canvas.style.pointerEvents = 'auto';
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;

    const columns = Math.floor(width / 20) + 1;
    const ypos = Array(columns).fill(0);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    function matrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#0f0';
        ctx.font = '15pt monospace';

        ypos.forEach((y, ind) => {
            const text = String.fromCharCode(Math.random() * 128);
            const x = ind * 20;
            ctx.fillText(text, x, y);

            if (y > 100 + Math.random() * 10000) ypos[ind] = 0;
            else ypos[ind] = y + 20;
        });

        // Draw exit hint at the top center of the canvas
        ctx.save();
        ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
        ctx.font = 'bold 12pt monospace';
        ctx.textAlign = 'center';
        var exitText = getCurrentLanguage() === 'zh' ? '按 ESC、` 或点击任意位置退出 Matrix 代码雨' : 'Press ESC, Backtick (`) or click anywhere to exit Matrix Rain';
        ctx.fillText(exitText, width / 2, 45);
        ctx.restore();
    }

    matrixInterval = setInterval(matrix, 33);

    function stopMatrix() {
        clearInterval(matrixInterval);
        canvas.style.display = 'none';
        canvas.style.pointerEvents = 'none';
        document.removeEventListener('click', stopMatrix);
        document.removeEventListener('keydown', keyStopMatrix);
    }
    function keyStopMatrix(e) {
        if (e.key === 'Escape' || e.key === '`') {
            stopMatrix();
        }
    }

    setTimeout(() => {
        document.addEventListener('click', stopMatrix);
        document.addEventListener('keydown', keyStopMatrix);
    }, 100);

    showMessage(getCurrentLanguage() === 'zh' ? "已进入矩阵世界。点击屏幕任意位置或按 ESC/` 退出。" : "Entered Matrix Rain. Click anywhere or press ESC/` to exit.", 5000, true);
}

function runHackSequence(outputEl) {
    let isZh = getCurrentLanguage() === 'zh';
    let steps = isZh ? [
        "正在连接到 hkust.edu.hk:22...",
        "通过端口 443 代理绕过防火墙...",
        "防火墙已绕过！正在注入 SQL Union 载荷...",
        "正在导出数据表: 'users', 'grades', 'scholarships'...",
        "正在访问优秀奖学金数据库...",
        "正在修改数据库条目: ZONGMIN ZHANG -> SCHOLARSHIP_AWARD = INFINITE...",
        "提交完成。正在删除访问日志...",
        "访问被允许！系统已被控制。👩‍💻"
    ] : [
        "Connecting to hkust.edu.hk:22...",
        "Bypassing Firewall via port 443 proxy...",
        "Firewall bypassed! Injecting SQL Union payload...",
        "Dumping tables: 'users', 'grades', 'scholarships'...",
        "Accessing Continuing Scholarships DB...",
        "Modifying database entry: ZONGMIN ZHANG -> SCHOLARSHIP_AWARD = INFINITE...",
        "Commit complete. Deleting access logs...",
        "ACCESS GRANTED! System compromised. 👩‍💻"
    ];
    let i = 0;
    function printStep() {
        if (i < steps.length) {
            const line = document.createElement('div');
            line.style.color = i === steps.length - 1 ? '#4ade80' : '#fb923c';
            line.style.fontWeight = 'bold';
            line.textContent = steps[i];
            outputEl.appendChild(line);
            i++;
            if (outputEl) outputEl.scrollTop = outputEl.scrollHeight;
            const bodyEl = document.getElementById('terminal-body');
            if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
            setTimeout(printStep, 600);
        }
    }
    printStep();
}

// ==========================================
// Option 4: NetEase Cloud Music BGM Player
// ==========================================
(function () {
    const playlistId = '5160427354';
    const apiUrl = `https://api.injahow.cn/meting/?server=netease&type=playlist&id=${playlistId}`;
    
    // Fallback track list containing "棠梨煎雪"
    const fallbackPlaylist = [{
        name: '棠梨煎雪',
        artist: '银临',
        pic: 'https://p1.music.126.net/LBnYDAUED2mD1veBvBnC8g==/5859297464524710.jpg',
        url: 'https://music.163.com/song/media/outer/url?id=28188427.mp3'
    }];
    
    let playlist = [];
    let currentIndex = 0;
    let isPlaying = false;
    
    const audio = document.getElementById('music-audio');
    const playBtn = document.getElementById('music-play-btn');
    const nextBtn = document.getElementById('music-next-btn');
    const titleEl = document.getElementById('music-title');
    const artistEl = document.getElementById('music-artist');
    const coverEl = document.getElementById('music-cover');
    const progressEl = document.getElementById('music-progress');
    const progressBar = document.querySelector('.music-progress-bar');
    const closeBtn = document.getElementById('music-close-btn');
    const toggleBtn = document.getElementById('music-toggle-btn');
    const musicCard = document.getElementById('music-card');

    if (!audio || !playBtn || !nextBtn || !titleEl || !artistEl || !coverEl || !progressEl) return;

    if (isCompactWidgetViewport()) {
        setMusicPlayerExpanded(false);
    }

    let wasCompactWidgetViewport = isCompactWidgetViewport();
    window.addEventListener('resize', () => {
        const isCompact = isCompactWidgetViewport();
        if (isCompact && !wasCompactWidgetViewport) {
            setMusicPlayerExpanded(false);
        }
        wasCompactWidgetViewport = isCompact;
    });

    if (coverEl) {
        coverEl.onerror = function() {
            this.src = 'assets/vinyl-placeholder.svg';
            this.onerror = null;
        };
    }

    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                playlist = data;
                // Shuffle BGM playlist
                playlist.sort(() => Math.random() - 0.5);
                loadTrack(0);
            } else {
                console.warn('API returned invalid data, using fallback playlist.');
                useFallback();
            }
        })
        .catch(err => {
            console.error('Netease music load error:', err);
            useFallback();
        });

    function useFallback() {
        playlist = fallbackPlaylist;
        loadTrack(0);
    }

    function loadTrack(index) {
        if (playlist.length === 0) return;
        currentIndex = index;
        const track = playlist[currentIndex];
        
        titleEl.textContent = track.title || track.name || 'Unknown Track';
        artistEl.textContent = track.author || track.artist || 'Unknown Artist';
        
        // Reset instantly to placeholder to ensure real-time response when skipping
        coverEl.src = 'assets/vinyl-placeholder.svg';
        
        let trackPic = typeof track.pic === 'string' ? track.pic : '';
        if (window.location.protocol === 'https:' && trackPic.startsWith('http:')) {
            trackPic = trackPic.replace('http:', 'https:');
        }

        if (trackPic && trackPic.trim() !== '') {
            const img = new Image();
            img.onload = () => {
                if (playlist[currentIndex] === track) {
                    coverEl.src = trackPic;
                }
            };
            img.src = trackPic;
        }

        // Set audio stream link with mixed-content bypass logic
        let trackUrl = typeof track.url === 'string' ? track.url : '';
        if (!trackUrl) {
            audio.removeAttribute('src');
            progressEl.style.width = '0%';
            isPlaying = false;
            updateUI();
            return;
        }
        if (window.location.protocol === 'https:' && trackUrl.startsWith('http:')) {
            trackUrl = trackUrl.replace('http:', 'https:');
        }
        audio.src = trackUrl;
        audio.load();

        if (isPlaying) {
            audio.play().catch(e => {
                isPlaying = false;
                updateUI();
            });
        }
        updateUI();
    }

    function togglePlay() {
        if (playlist.length === 0) return;
        if (audio.paused) {
            audio.play().catch(err => {
                console.error("Audio play failed:", err);
            });
        } else {
            audio.pause();
        }
    }

    function updateUI() {
        if (isPlaying) {
            coverEl.classList.add('playing');
            playBtn.innerHTML = `
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <rect x="5" y="4" width="4" height="16" rx="1"></rect>
                <rect x="15" y="4" width="4" height="16" rx="1"></rect>
              </svg>
            `;
        } else {
            coverEl.classList.remove('playing');
            playBtn.innerHTML = `
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            `;
        }
    }

    // Toggle states using actual audio media listeners to guarantee synchronization
    audio.addEventListener('play', () => {
        isPlaying = true;
        updateUI();
    });

    audio.addEventListener('pause', () => {
        isPlaying = false;
        updateUI();
    });

    playBtn.addEventListener('click', togglePlay);
    nextBtn.addEventListener('click', () => {
        if (playlist.length === 0) return;
        const nextIdx = (currentIndex + 1) % playlist.length;
        loadTrack(nextIdx);
    });

    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            const pct = (audio.currentTime / audio.duration) * 100;
            progressEl.style.width = `${pct}%`;
        }
    });

    audio.addEventListener('ended', () => {
        if (playlist.length === 0) return;
        const nextIdx = (currentIndex + 1) % playlist.length;
        loadTrack(nextIdx);
    });

    // Seek track by clicking/tapping progress bar ("跳伞" function)
    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            if (!audio.duration) return;
            const rect = progressBar.getBoundingClientRect();
            if (!rect.width) return;
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const percentage = clickX / width;
            audio.currentTime = percentage * audio.duration;
        });
    }

    // Minimize and Toggle restore player logic
    if (closeBtn && toggleBtn && musicCard) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setMusicPlayerExpanded(false);
        });

        toggleBtn.addEventListener('click', () => {
            if (isCompactWidgetViewport()) {
                toggleTerminal(false);
            }
            setMusicPlayerExpanded(true);
        });
    }
})();

// ==========================================
// Drag-and-Drop / Draggable Elements Logic
// ==========================================
function makeElementDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const dragHandle = handle || element;
    
    dragHandle.style.cursor = 'move';
    dragHandle.addEventListener('mousedown', dragMouseDown);
    dragHandle.addEventListener('touchstart', dragTouchStart, { passive: false });

    function dragMouseDown(e) {
        e = e || window.event;
        // Don't drag if clicking buttons, inputs, links, or specific tool panels
        if (e.target.closest('button') || e.target.closest('input') || 
            e.target.closest('select') || e.target.closest('a') || 
            e.target.closest('.waifu-tool') || e.target.closest('.music-progress-bar') ||
            e.target.closest('.music-controls')) {
            return;
        }
        e.preventDefault();
        
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('mousemove', elementDrag);
    }

    function elementDrag(e) {
        e = e || window.event;
        if (element.classList.contains('maximized')) {
            return;
        }
        e.preventDefault();
        
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;
        
        // Prevent dragging outside viewport boundaries
        const maxLeft = window.innerWidth - element.offsetWidth;
        const maxTop = window.innerHeight - element.offsetHeight;
        
        element.style.left = Math.min(Math.max(0, newLeft), maxLeft) + 'px';
        element.style.top = Math.min(Math.max(0, newTop), maxTop) + 'px';
        element.style.bottom = 'auto';
        element.style.right = 'auto';
    }

    function closeDragElement() {
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
    }

    function dragTouchStart(e) {
        if (e.target.closest('button') || e.target.closest('input') || 
            e.target.closest('select') || e.target.closest('a') || 
            e.target.closest('.waifu-tool') || e.target.closest('.music-progress-bar') ||
            e.target.closest('.music-controls')) {
            return;
        }
        
        const touch = e.touches[0];
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        
        document.addEventListener('touchend', closeDragTouch);
        document.addEventListener('touchmove', elementDragTouch, { passive: false });
    }

    function elementDragTouch(e) {
        if (element.classList.contains('maximized')) {
            return;
        }
        e.preventDefault();
        const touch = e.touches[0];
        
        pos1 = pos3 - touch.clientX;
        pos2 = pos4 - touch.clientY;
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;
        
        const maxLeft = window.innerWidth - element.offsetWidth;
        const maxTop = window.innerHeight - element.offsetHeight;
        
        element.style.left = Math.min(Math.max(0, newLeft), maxLeft) + 'px';
        element.style.top = Math.min(Math.max(0, newTop), maxTop) + 'px';
        element.style.bottom = 'auto';
        element.style.right = 'auto';
    }

    function closeDragTouch() {
        document.removeEventListener('touchend', closeDragTouch);
        document.removeEventListener('touchmove', elementDragTouch);
    }
}

// Initialize dragging immediately since the script is loaded dynamically after DOMContentLoaded
(function initDragging() {
    // Terminal Modal draggable (dragging by the header title moves the modal)
    const terminalEl = document.getElementById('terminal-modal');
    const terminalHeader = document.querySelector('#terminal-modal .terminal-header');
    if (terminalEl && terminalHeader) {
        makeElementDraggable(terminalEl, terminalHeader);
    }
})();
