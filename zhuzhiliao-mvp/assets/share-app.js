(() => {
    'use strict';

    const PROJECT_ID = window.ZZL_SHARE_PROJECT_ID;
    const SHARE_CONFIG = window.ZZL_SHARE_CONFIG;
    const q = id => document.getElementById(id);
    let project = null;
    let projectAudio = null;
    let projectAudioStarted = false;
    let currentPassword = new URLSearchParams(location.search).get('pwd') || '';
    let currentLocale = SHARE_CONFIG.defaultLocale;
    let currentWords = SHARE_CONFIG.locales[currentLocale];
    let echoIndex = 0;
    let posterTemplate = 'quick';
    let posterBlob = null;

    const normalizeLocale = locale => SHARE_CONFIG.locales[locale] ? locale : SHARE_CONFIG.defaultLocale;
    const mix = (hex, amount) => {
        const value = parseInt(String(hex).replace('#', ''), 16);
        if (!Number.isFinite(value)) return '#0a1028';
        const channels = [value >> 16, (value >> 8) & 255, value & 255].map(channel =>
            Math.max(0, Math.min(255, Math.round(channel + (255 - channel) * amount)))
        );
        return '#' + channels.map(channel => channel.toString(16).padStart(2, '0')).join('');
    };

    function setLore(top, bottom) {
        const lore = document.querySelector('.lore');
        lore.textContent = top;
        lore.appendChild(document.createElement('br'));
        lore.appendChild(document.createTextNode(bottom));
    }

    function applyLanguage(locale) {
        currentLocale = normalizeLocale(locale);
        currentWords = SHARE_CONFIG.locales[currentLocale];
        const words = currentWords;
        window.ZZL_MVP_UI = words;
        document.documentElement.lang = currentLocale;
        q('ghlink').textContent = words.standard;
        document.querySelector('.ghlink.author').textContent = words.create;
        q('zzlShareLink').textContent = words.share;
        document.querySelector('.masthead .seal').textContent = words.seal;
        q('zzlHintText').textContent = words.hint;
        document.querySelector('#hint .snd').textContent = words.sound;
        document.querySelector('.meter label').textContent = words.rps;
        q('autoBtn').textContent = words.autoStart;
        setLore(words.loreTop, words.loreBottom);
        q('zzlGateTitle').textContent = words.gate;
        q('zzlGateHelp').textContent = words.gateHelp;
        q('zzlPassword').placeholder = words.passwordPlaceholder;
        q('zzlGateOpen').textContent = words.open;
        q('zzlShareTitle').textContent = words.share;
        q('zzlCopy').textContent = words.copy;
        q('zzlSystemShare').textContent = words.system;
        q('zzlPosterOpen').textContent = words.posterOpen;
        q('zzlShareClose').textContent = words.close;
        q('zzlPosterTitle').textContent = words.posterTitle;
        q('zzlPosterDownload').textContent = words.posterDownload;
        q('zzlPosterShare').textContent = words.posterShare;
        q('zzlPosterClose').textContent = words.close;
        const templateButtons = document.querySelectorAll('[data-poster-template]');
        templateButtons[0].textContent = words.posterQuick;
        templateButtons[1].textContent = words.posterCraft;
    }

    function shareUrl() {
        const url = new URL(location.href);
        url.search = '';
        url.searchParams.set('id', PROJECT_ID);
        if (currentPassword) url.searchParams.set('pwd', currentPassword);
        return url.toString();
    }

    function showShare() {
        const url = shareUrl();
        q('zzlShareUrl').value = url;
        q('zzlShareQr').innerHTML = '';
        new QRCode(q('zzlShareQr'), {
            text: url, width: 164, height: 164,
            colorDark: '#111827', colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
        q('zzlShare').hidden = false;
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('Poster image failed to load'));
            image.src = src;
        });
    }

    async function createQrSource(text, size) {
        const box = q('zzlPosterQrTemp');
        box.innerHTML = '';
        new QRCode(box, {
            text, width: size, height: size,
            colorDark: '#111827', colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const source = box.querySelector('canvas, img');
        if (source instanceof HTMLImageElement && !source.complete) await source.decode();
        if (!source) throw new Error('QR code failed to render');
        return source;
    }

    function fitText(context, text, maxWidth, startSize, minSize = 20) {
        let size = startSize;
        while (size > minSize) {
            context.font = `700 ${size}px "Songti SC","Noto Serif SC",serif`;
            if (context.measureText(text).width <= maxWidth) break;
            size -= 2;
        }
        return size;
    }

    function roundedRect(context, x, y, width, height, radius) {
        if (typeof context.roundRect === 'function') {
            context.roundRect(x, y, width, height, radius);
            return;
        }
        const r = Math.min(radius, width / 2, height / 2);
        context.moveTo(x + r, y);
        context.arcTo(x + width, y, x + width, y + height, r);
        context.arcTo(x + width, y + height, x, y + height, r);
        context.arcTo(x, y + height, x, y, r);
        context.arcTo(x, y, x + width, y, r);
        context.closePath();
    }

    async function renderPoster(templateName = posterTemplate) {
        posterTemplate = templateName;
        const template = SHARE_CONFIG.posterTemplates[templateName];
        const background = await loadImage(template.src);
        const canvas = q('zzlPosterCanvas');
        const context = canvas.getContext('2d');
        canvas.width = background.naturalWidth;
        canvas.height = background.naturalHeight;
        context.drawImage(background, 0, 0);

        const panel = template.panel;
        context.fillStyle = 'rgba(4,15,31,.88)';
        context.strokeStyle = 'rgba(240,230,210,.28)';
        context.lineWidth = 2;
        context.beginPath();
        roundedRect(context, panel.x, panel.y, panel.width, panel.height, 24);
        context.fill();
        context.stroke();

        const qr = template.qr;
        context.fillStyle = '#fff';
        context.fillRect(qr.x - 10, qr.y - 10, qr.size + 20, qr.size + 20);
        const qrSource = await createQrSource(shareUrl(), qr.size);
        context.drawImage(qrSource, qr.x, qr.y, qr.size, qr.size);

        const text = template.text;
        const title = project?.config?.title || currentWords.fallbackTitle;
        const subtitle = project?.config?.subtitle || currentWords.fallbackSubtitle;
        context.fillStyle = '#f4ead5';
        fitText(context, title, text.maxWidth, templateName === 'quick' ? 42 : 38);
        context.fillText(title, text.x, text.y);
        context.fillStyle = '#ef8a63';
        context.font = `500 ${templateName === 'quick' ? 24 : 22}px system-ui,sans-serif`;
        const subtitleCharacters = Array.from(subtitle);
        const shortSubtitle = subtitleCharacters.slice(0, currentWords.posterSubtitleLimit).join('') +
            (subtitleCharacters.length > currentWords.posterSubtitleLimit ? '…' : '');
        context.fillText(shortSubtitle, text.x, text.y + 43, text.maxWidth);
        context.fillStyle = 'rgba(244,234,213,.72)';
        context.font = `500 ${templateName === 'quick' ? 20 : 18}px system-ui,sans-serif`;
        context.fillText(currentWords.posterScan, text.x, text.y + 82);

        posterBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', .95));
        document.querySelectorAll('[data-poster-template]').forEach(button =>
            button.classList.toggle('active', button.dataset.posterTemplate === templateName)
        );
        return posterBlob;
    }

    async function showPoster() {
        q('zzlShare').hidden = true;
        q('zzlPoster').hidden = false;
        q('zzlPosterDownload').disabled = true;
        q('zzlPosterShare').disabled = true;
        try {
            await renderPoster(posterTemplate);
        } finally {
            q('zzlPosterDownload').disabled = false;
            q('zzlPosterShare').disabled = false;
        }
    }

    async function downloadPoster() {
        if (!posterBlob) await renderPoster();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(posterBlob);
        link.download = `${project?.config?.title || 'zhuzhiliao'}-poster.png`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1500);
    }

    async function sharePoster() {
        if (!posterBlob) await renderPoster();
        const file = new File([posterBlob], `${project?.config?.title || 'zhuzhiliao'}-poster.png`, { type: 'image/png' });
        if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
            await navigator.share({ title: project?.config?.title || currentWords.fallbackTitle, text: project?.config?.subtitle || '', files: [file] });
            return;
        }
        await downloadPoster();
    }

    function applyProject(data) {
        project = data;
        const config = data.config || {};
        applyLanguage(config.locale);
        const title = config.title || currentWords.fallbackTitle;
        const subtitle = config.subtitle || currentWords.fallbackSubtitle;
        document.title = `${title} · ${currentWords.documentSuffix}`;
        document.querySelector('.masthead h1').textContent = title;
        document.querySelector('.masthead .sub').textContent = subtitle;
        window.ZZL_MVP_SPEED = Math.max(.2, Number(config.speed) || 3.4);
        window.ZZL_MVP_RADIUS = Math.max(30, Number(config.radius) || 58);
        window.ZZL_MVP_ROPE = Math.max(80, Number(config.rope) || 150);
        window.ZZL_MVP_SIZE = Math.max(64, (Number(config.size) || 112) * .72);
        const background = config.background || '#0a1028';
        window.ZZL_MVP_NIGHT_COLORS = [mix(background, -.08), mix(background, .1), mix(background, .24), mix(background, .34)];
        const echoes = Array.isArray(config.echoes) && config.echoes.length ? config.echoes : [config.echo || '哇'];
        window.ZZL_MVP_NEXT_ECHO = () => echoes[(echoIndex++) % echoes.length];

        if (data.imageUrl) {
            const image = new Image();
            image.onload = () => {
                window.ZZL_MVP_CUSTOM_IMAGE = image;
                try { want3d = false; set3d(false); } catch (_) {}
            };
            image.src = data.imageUrl;
            window.ZZL_MVP_DRAW_IMAGE = () => {
                const source = window.ZZL_MVP_CUSTOM_IMAGE;
                if (!source) return;
                const dx = tube.x - stick.x;
                const dy = tube.y - stick.y;
                const size = Math.max(70, Number(config.size) || 112);
                ctx.save();
                ctx.translate(tube.x, tube.y);
                ctx.rotate(Math.atan2(dy, dx) + Math.PI / 2);
                ctx.beginPath();
                ctx.arc(0, 0, size / 2, 0, TAU);
                ctx.clip();
                const scale = Math.max(size / source.width, size / source.height);
                const width = source.width * scale;
                const height = source.height * scale;
                ctx.drawImage(source, -width / 2, -height / 2, width, height);
                ctx.restore();
            };
        }

        if (data.audioUrl) {
            projectAudio = new Audio(data.audioUrl);
            projectAudio.id = 'zzlProjectAudio';
            projectAudio.hidden = true;
            projectAudio.loop = true;
            projectAudio.preload = 'auto';
            document.body.appendChild(projectAudio);
        }
        try { resize(); } catch (_) {}
    }

    const originalEnsureAudio = ensureAudio;
    const originalUpdateAudio = updateAudio;
    ensureAudio = function (fromGesture) {
        if (!projectAudio) return originalEnsureAudio(fromGesture);
        if (fromGesture && projectAudio.paused) {
            projectAudio.play().then(() => { projectAudioStarted = true; }).catch(() => {});
        }
        return true;
    };
    updateAudio = function () {
        if (!projectAudio) return originalUpdateAudio();
        projectAudio.volume = clamp((Number(project?.config?.volume) || .75) * Math.pow(active, 1.3), 0, 1);
        projectAudio.playbackRate = clamp(Math.pow(Math.max(rps, .2) / 2.33, .5), .65, 1.5);
        if (projectAudioStarted && active > .025 && projectAudio.paused) projectAudio.play().catch(() => {});
    };

    async function load(password = currentPassword) {
        const url = `api/project.php?id=${encodeURIComponent(PROJECT_ID)}&track=1${password ? '&pwd=' + encodeURIComponent(password) : ''}`;
        const response = await fetch(url, { credentials: 'same-origin' });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
            currentPassword = password;
            applyLanguage(data.locale);
            q('zzlGate').hidden = false;
            q('zzlGateError').textContent = password ? (data.error || currentWords.passwordWrong) : '';
            return false;
        }
        if (!response.ok) throw new Error(data.error || currentWords.loadFailed);
        currentPassword = password;
        q('zzlGate').hidden = true;
        applyProject(data.project);
        return true;
    }

    q('ghlink').href = '../zhuzhiliao/';
    q('ghlink').removeAttribute('target');
    const author = document.querySelector('.ghlink.author');
    author.href = './';
    author.removeAttribute('target');
    const shareLink = document.createElement('a');
    shareLink.id = 'zzlShareLink';
    shareLink.className = 'ghlink share';
    shareLink.onclick = showShare;
    document.body.appendChild(shareLink);
    applyLanguage(currentLocale);

    q('zzlGateForm').onsubmit = event => {
        event.preventDefault();
        load(q('zzlPassword').value).then(loaded => {
            if (loaded && new URLSearchParams(location.search).get('poster') === '1') showPoster();
        }).catch(error => { q('zzlGateError').textContent = error.message; });
    };
    q('zzlShareClose').onclick = () => { q('zzlShare').hidden = true; };
    q('zzlCopy').onclick = async () => { await navigator.clipboard.writeText(shareUrl()); q('zzlCopy').textContent = currentWords.copied; };
    q('zzlSystemShare').onclick = () => navigator.share
        ? navigator.share({ title: project?.config?.title || currentWords.fallbackTitle, text: project?.config?.subtitle || '', url: shareUrl() })
        : navigator.clipboard.writeText(shareUrl());
    q('zzlPosterOpen').onclick = showPoster;
    q('zzlPosterClose').onclick = () => { q('zzlPoster').hidden = true; };
    q('zzlPosterDownload').onclick = downloadPoster;
    q('zzlPosterShare').onclick = () => sharePoster().catch(() => downloadPoster());
    document.querySelectorAll('[data-poster-template]').forEach(button => {
        button.onclick = async () => {
            button.disabled = true;
            try { await renderPoster(button.dataset.posterTemplate); } finally { button.disabled = false; }
        };
    });
    [q('zzlShare'), q('zzlPoster')].forEach(modal => {
        modal.onclick = event => { if (event.target === modal) modal.hidden = true; };
    });
    load().then(loaded => {
        if (loaded && new URLSearchParams(location.search).get('poster') === '1') showPoster();
    }).catch(error => { document.querySelector('.masthead .sub').textContent = error.message; });
})();
