(() => {
    'use strict';
    const $ = id => document.getElementById(id),
        canvas = $('previewCanvas'),
        ctx = canvas.getContext('2d');
    const refs = {
        'zh-CN': ['重要之事，虽险必行。', '以本源推理，而非类比模仿。', '允许失败，持续创新。', '永远选择拥抱乐观。', '热爱可抵御漫长苦难。'],
        'zh-TW': ['重要之事，雖險必行。', '以本源推理，而非類比模仿。', '允許失敗，持續創新。', '永遠選擇擁抱樂觀。', '熱愛可抵禦漫長苦難。'],
        en: ['Important things are worth the risk.', 'Reason from first principles, not analogy.', 'Allow failure. Keep innovating.', 'Always choose optimism.', 'Passion withstands long hardship.']
    };
    const appearance = {
        accent: '#e76543',
        background: '#09152a',
        size: 112,
        speed: 0.2,
        radius: 70,
        rope: 155,
        volume: .75
    };
    const demos = {
        'zh-CN': {
            locale: 'zh-CN',
            title: '夏夜知了',
            subtitle: '一转，就听见夏天',
            echoMode: 'single',
            echoes: ['哇', '呀', '嗡', '鸣', '知'],
            ...appearance
        },
        'zh-TW': {
            locale: 'zh-TW',
            title: '夏夜知了',
            subtitle: '一轉，就聽見夏天',
            echoMode: 'single',
            echoes: ['哇', '呀', '嗡', '鳴', '知'],
            ...appearance
        },
        en: {
            locale: 'en',
            title: 'Summer Cicada',
            subtitle: 'Spin it and hear the sound of summer',
            echoMode: 'phrase',
            echoes: ['BUZZ', 'WHIRR', 'HUM', 'CHIRP', 'SING'],
            ...appearance
        }
    };
    const demoFor = l => ({
        ...demos[l] || demos['zh-CN'],
        echoes: [...(demos[l] || demos['zh-CN']).echoes]
    });
    let locale = 'zh-CN',
        config = demoFor(locale),
        echoMode = 'single',
        editingId = window.EDIT_PROJECT_ID || '',
        imageFile = null,
        audioFile = null,
        image = null,
        imageUrl = '',
        audio = null,
        audioFileUrl = '',
        originalHasImage = false,
        originalHasAudio = false,
        removeImage = false,
        removeAudio = false,
        passwordProtected = false,
        lastSharePassword = '',
        draftId = '',
        spinning = true,
        phase = -Math.PI / 2,
        last = performance.now(),
        recorder = null,
        recording = false,
        recordStartedAt = 0,
        chunks = [],
        adminTargetId = '',
        historyPage = 1;
    const pageSize = 8,
        drag = {
            active: false,
            angle: 0,
            velocity: 0,
            last: 0
        };
    const keys = {
        locale: 'zzl-mvp-locale',
        tab: 'zzl-mvp-tab',
        draft: 'zzl-mvp-local-draft',
        projects: 'zzl-mvp-my-projects'
    };
    const get = k => {
            try {
                return localStorage.getItem(k)
            } catch {
                return null
            }
        },
        set = (k, v) => {
            try {
                localStorage.setItem(k, v)
            } catch {}
        };
    const t = (k, v = {}) => ZZLI18N.t(locale, k, v),
        status = s => $('status').textContent = s,
        statusT = (k, v) => status(t(k, v));

    function myIds() {
        try {
            return [...new Set(JSON.parse(get(keys.projects) || '[]').filter(x => /^[a-z0-9]{10,20}$/.test(x)))].slice(0, 20)
        } catch {
            return []
        }
    }

    function remember(id) {
        set(keys.projects, JSON.stringify([id, ...myIds().filter(x => x !== id)].slice(0, 20)))
    }

    function forget(id) {
        set(keys.projects, JSON.stringify(myIds().filter(x => x !== id)))
    }

    function applyLocale(l) {
        locale = ZZLI18N.normalize(l);
        config.locale = locale;
        $('languageSelect').value = locale;
        ZZLI18N.apply(locale);
        const shareWords = window.ZZL_SHARE_CONFIG?.locales?.[locale];
        if (shareWords) {
            $('posterShareBtn').textContent = shareWords.posterOpen;
            $('viewerPosterShare').textContent = shareWords.posterOpen;
            $('previewShareBtn').textContent = shareWords.previewWork;
            $('mobilePreviewToggle').querySelector('span').textContent = document.body.classList.contains('mobile-preview-open')
                ? shareWords.mobilePreviewClose
                : shareWords.mobilePreviewOpen
        }
        $('limitPolicy').textContent = t('limitPolicy', {
            perIp: APP_LIMITS.perIp,
            total: APP_LIMITS.total
        });
        renderReferences();
        syncEdit();
    }

    function normalizeEchoes(a, mode = echoMode) {
        const values = a.map(x => String(x).trim()).filter(Boolean).slice(0, 12).map(x => Array.from(x).slice(0, mode === 'single' ? 1 : 30).join(''));
        return values.length ? values : (mode === 'single' ? [demos[locale].echoes[0]] : [...refs[locale]])
    }

    function readControls() {
        config = {
            ...config,
            locale,
            title: $('titleInput').value.trim() || demos[locale].title,
            subtitle: $('subtitleInput').value.trim() || demos[locale].subtitle,
            echoMode,
            echoes: normalizeEchoes($('echoArrayInput').value.split(/\n+/)),
            accent: $('accentInput').value,
            background: $('backgroundInput').value,
            size: +$('sizeInput').value,
            speed: +$('speedInput').value,
            radius: +$('radiusInput').value,
            rope: +$('ropeInput').value,
            volume: +$('volumeInput').value
        };
        syncValues();
    }

    function fillControls() {
        locale = ZZLI18N.normalize(config.locale);
        echoMode = config.echoMode || 'single';
        $('titleInput').value = config.title;
        $('subtitleInput').value = config.subtitle;
        $('echoArrayInput').value = (config.echoes || [config.echo || '哇']).join('\n');
        $('accentInput').value = config.accent;
        $('backgroundInput').value = config.background;
        $('sizeInput').value = config.size;
        $('speedInput').value = config.speed;
        $('radiusInput').value = config.radius;
        $('ropeInput').value = config.rope;
        $('volumeInput').value = config.volume;
        document.documentElement.style.setProperty('--accent', config.accent);
        applyLocale(locale);
        syncValues();
        syncViewer();
        syncEchoMode();
    }

    function syncValues() {
        for (const k of ['size', 'speed', 'radius', 'rope']) $(k + 'Value').textContent = config[k];
        $('volumeValue').textContent = Math.round(config.volume * 100) + '%';
        document.documentElement.style.setProperty('--accent', config.accent);
        document.querySelectorAll('.color-swatch').forEach(button => {
            const input = $(button.dataset.colorTarget);
            const selected = input && input.value.toLowerCase() === button.dataset.color.toLowerCase();
            button.classList.toggle('active', selected);
            button.setAttribute('aria-pressed', selected ? 'true' : 'false')
        });
        syncViewer();
    }

    function syncViewer() {
        $('previewTitle').textContent = $('viewerTitle').textContent = config.title;
        $('previewSubtitle').textContent = $('viewerSubtitle').textContent = config.subtitle;
    }

    function syncEchoMode() {
        $('echoSingleBtn').classList.toggle('active', echoMode === 'single');
        $('echoPhraseBtn').classList.toggle('active', echoMode === 'phrase');
        $('echoReference').hidden = echoMode !== 'phrase';
    }

    function renderReferences() {
        const box = $('echoReference');
        box.querySelectorAll('button').forEach(x => x.remove());
        refs[locale].forEach(text => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = text;
            b.onclick = () => {
                $('echoArrayInput').value = [$('echoArrayInput').value.trim(), text].filter(Boolean).join('\n');
                readControls()
            };
            box.appendChild(b)
        })
    }

    function syncEdit() {
        const yes = !!editingId;
        $('editNotice').hidden = !yes;
        $('editingId').textContent = editingId;
        $('publishBtn').textContent = t(yes ? 'updateWork' : 'publish');
        $('publishBottomBtn').textContent = t(yes ? 'updateLink' : 'makeLink');
    }

    function syncPassword() {
        $('passwordFields').hidden = !$('passwordEnabled').checked;
        $('passwordHelp').textContent = passwordProtected ? t('passwordKeep') : t('passwordHint');
    }
    $('languageSelect').onchange = e => {
        const l = ZZLI18N.normalize(e.target.value),
            isDemo = Object.values(demos).some(d => config.title === d.title && config.subtitle === d.subtitle);
        set(keys.locale, l);
        config = isDemo ? demoFor(l) : {
            ...config,
            locale: l
        };
        fillControls();
        if (!$('historyTabPanel').hidden) loadHistory();
        if (!$('myTabPanel').hidden) loadMine()
    };
    for (const id of ['titleInput', 'subtitleInput', 'echoArrayInput', 'accentInput', 'backgroundInput', 'sizeInput', 'speedInput', 'radiusInput', 'ropeInput', 'volumeInput']) $(id).addEventListener('input', readControls);
    document.querySelectorAll('.color-swatch').forEach(button => {
        button.onclick = () => {
            const input = $(button.dataset.colorTarget);
            input.value = button.dataset.color;
            readControls()
        }
    });
    $('mobilePreviewToggle').onclick = () => {
        const open = document.body.classList.toggle('mobile-preview-open');
        $('mobilePreviewToggle').setAttribute('aria-expanded', open ? 'true' : 'false');
        const words = window.ZZL_SHARE_CONFIG?.locales?.[locale];
        if (words) $('mobilePreviewToggle').querySelector('span').textContent = open ? words.mobilePreviewClose : words.mobilePreviewOpen;
        if (open) requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
    };
    $('echoSingleBtn').onclick = () => {
        echoMode = 'single';
        config.echoMode = echoMode;
        $('echoArrayInput').value = normalizeEchoes($('echoArrayInput').value.split(/\n+/), 'single').join('\n');
        syncEchoMode();
        readControls()
    };
    $('echoPhraseBtn').onclick = () => {
        echoMode = 'phrase';
        config.echoMode = echoMode;
        if (!$('echoArrayInput').value.trim() || normalizeEchoes($('echoArrayInput').value.split(/\n+/), 'single').every(x => Array.from(x).length === 1)) $('echoArrayInput').value = refs[locale].join('\n');
        syncEchoMode();
        readControls()
    };
    $('resetDemoBtn').onclick = () => {
        config = demoFor(locale);
        fillControls();
        statusT('statusDemoReset')
    };
    $('passwordEnabled').onchange = syncPassword;

    function drawStandardCicada(size, now) {
        const TAU = Math.PI * 2, scale = size / 70, active = spinning ? 1 : .18;
        ctx.save(); ctx.scale(scale, scale);
        const body = ctx.createLinearGradient(-12, 0, 12, 0);
        body.addColorStop(0, '#b7a271'); body.addColorStop(.3, '#eadfb8'); body.addColorStop(.62, '#dfd0a2'); body.addColorStop(1, '#9b8452');
        ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(-12, 4, 24, 46, 6); ctx.fill();
        ctx.fillStyle = '#4c3d24'; ctx.beginPath(); ctx.ellipse(0, 49, 11, 4.2, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(234,223,184,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, 49, 11, 4.2, 0, .05, Math.PI - .05); ctx.stroke();
        const spread = .30 + active * .38, flutter = active * Math.sin(now / 22) * .22;
        for (const side of [-1, 1]) {
            ctx.save(); ctx.translate(side * 9, 13); ctx.rotate(side * (spread + flutter)); ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.bezierCurveTo(side * 13, 9, side * 14, 30, side * 5, 42); ctx.bezierCurveTo(-side, 33, -side * 4, 12, 0, 0);
            ctx.fillStyle = 'rgba(243,235,211,.88)'; ctx.fill(); ctx.strokeStyle = 'rgba(150,120,70,.55)'; ctx.lineWidth = 1; ctx.stroke();
            ctx.strokeStyle = 'rgba(150,120,70,.45)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(side * 2, 4); ctx.quadraticCurveTo(side * 9, 18, side * 5, 38); ctx.moveTo(side, 6); ctx.quadraticCurveTo(side * 3, 20, side * 1.5, 34); ctx.stroke(); ctx.restore();
        }
        ctx.fillStyle = '#cf3b2a'; ctx.beginPath(); ctx.roundRect(-12.5, 2, 25, 10, 4); ctx.fill();
        ctx.fillStyle = '#f6eed8'; ctx.beginPath(); ctx.ellipse(0, 3, 10.5, 4.2, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = active * .75; ctx.shadowColor = '#ffcf8e'; ctx.shadowBlur = 15 * active; ctx.fillStyle = '#ffe9bd'; ctx.beginPath(); ctx.ellipse(0, 3, 8.5, 3.4, 0, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        for (const side of [-1, 1]) { ctx.fillStyle = '#17130c'; ctx.beginPath(); ctx.arc(side * 8.5, 7.5, 2.4, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(side * 8.5 - .7, 6.8, .7, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#d84a35'; ctx.beginPath(); ctx.arc(0, 2, 2, 0, TAU); ctx.fill(); ctx.restore();
    }

    function useImage(src, file = null) {
        if (imageUrl && imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
        imageFile = file;
        imageUrl = src;
        image = new Image();
        image.onload = () => statusT('statusImageReady');
        image.src = src;
        removeImage = false
    }
    $('imageInput').onchange = e => {
        const f = e.target.files[0];
        if (!f || f.size > 5 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) {
            statusT('imageInvalid');
            return
        }
        useImage(URL.createObjectURL(f), f)
    };

    function useAudio(src, name, file = null, durationHint = 0) {
        if (audio) {
            audio.pause()
        }
        if (audioFileUrl && audioFileUrl.startsWith('blob:')) URL.revokeObjectURL(audioFileUrl);
        audioFile = file;
        audioFileUrl = src;
        audio = new Audio(src);
        audio.loop = true;
        $('audioPreviewPanel').hidden = false;
        $('audioPreviewName').textContent = name || t('audioReady');
        $('audioPreviewMeta').textContent = t('audioHint');
        const updateAudioMeta = seconds => {
            const parts = [];
            if (Number.isFinite(seconds) && seconds > 0) parts.push((seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)) + (locale === 'en' ? ' sec' : ' 秒'));
            if (file && file.size) parts.push(file.size < 1024 * 1024 ? Math.ceil(file.size / 1024) + ' KB' : (file.size / 1024 / 1024).toFixed(1) + ' MB');
            if (parts.length) $('audioPreviewMeta').textContent = parts.join(' · ') + (locale === 'en' ? ' · Ready to preview' : locale === 'zh-TW' ? ' · 可立即試聽' : ' · 可立即试听')
        };
        updateAudioMeta(durationHint);
        audio.onloadedmetadata = () => updateAudioMeta(audio.duration);
        removeAudio = false;
        statusT('statusAudioReady')
    }
    $('audioInput').onchange = e => {
        const f = e.target.files[0];
        if (!f || f.size > 10 * 1024 * 1024) {
            statusT('audioInvalid');
            return
        }
        useAudio(URL.createObjectURL(f), f.name, f)
    };
    $('audioPreviewBtn').onclick = async () => {
        if (!audio) return;
        if (audio.paused) {
            audio.volume = config.volume;
            await audio.play().catch(() => {});
            $('audioPreviewBtn').textContent = t('pauseAudio')
        } else {
            audio.pause();
            $('audioPreviewBtn').textContent = t('previewAudio')
        }
    };
    $('clearAudioBtn').onclick = () => {
        if (audio) audio.pause();
        audio = null;
        audioFile = null;
        audioFileUrl = '';
        removeAudio = true;
        $('audioPreviewPanel').hidden = true;
        statusT('statusRemoved')
    };
    $('recordBtn').onclick = async () => {
        if (recording) {
            recorder.stop();
            return
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });
            chunks = [];
            recorder = new MediaRecorder(stream);
            recorder.ondataavailable = e => {
                if (e.data.size) chunks.push(e.data)
            };
            recorder.onstop = () => {
                stream.getTracks().forEach(x => x.stop());
                const blob = new Blob(chunks, {
                    type: recorder.mimeType || 'audio/webm'
                });
                const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
                const f = new File([blob], 'recording.' + ext, {
                    type: blob.type
                });
                recording = false;
                $('recordBtn').classList.remove('on');
                $('recordLabel').textContent = t('record');
                useAudio(URL.createObjectURL(f), t('recordingName'), f, Math.max(.1, (performance.now() - recordStartedAt) / 1000));
                statusT('statusRecorded')
            };
            recorder.start();
            recordStartedAt = performance.now();
            recording = true;
            $('recordBtn').classList.add('on');
            $('recordLabel').textContent = t('stopRecord');
            statusT('statusRecording')
        } catch (e) {
            status(e.message || '无法使用麦克风')
        }
    };

    function drawScene(now) {
        const rect = canvas.getBoundingClientRect(),
            dpr = Math.min(devicePixelRatio || 1, 2);
        if (rect.width < 2 || rect.height < 2) {
            last = now;
            requestAnimationFrame(drawScene);
            return
        }
        if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
            canvas.width = Math.round(rect.width * dpr);
            canvas.height = Math.round(rect.height * dpr)
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const w = rect.width,
            h = rect.height,
            dt = Math.min(.05, (now - last) / 1000);
        last = now;
        if (!drag.active && spinning) phase += dt * config.speed * Math.PI * 2;
        else if (!drag.active) {
            phase += drag.velocity * dt;
            drag.velocity *= Math.pow(.88, dt * 60)
        }
        const grad = ctx.createRadialGradient(w * .52, h * .46, 20, w * .5, h * .5, Math.max(w, h) * .7);
        grad.addColorStop(0, config.background);
        grad.addColorStop(1, '#030713');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = .45;
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = i % 8 ? '#f4ead5' : config.accent;
            ctx.beginPath();
            ctx.arc((i * 97.3) % w, (i * 51.7) % h, i % 6 ? .65 : 1.2, 0, Math.PI * 2);
            ctx.fill()
        }
        ctx.globalAlpha = 1;
        const ax = w / 2,
            ay = Math.max(105, h * .31),
            radius = Math.min(config.radius, w * .22),
            hx = ax + Math.cos(phase) * radius,
            hy = ay + Math.sin(phase) * radius * .62,
            angle = phase + Math.PI * .68,
            tx = hx + Math.cos(angle) * config.rope,
            ty = hy + Math.sin(angle) * config.rope;
        ctx.strokeStyle = config.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.quadraticCurveTo((hx + tx) / 2, (hy + ty) / 2 + 9, tx, ty);
        ctx.stroke();
        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate(.96);
        ctx.strokeStyle = '#d9bf86';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(66, 0);
        ctx.stroke();
        ctx.fillStyle = config.accent;
        ctx.beginPath();
        ctx.arc(-5, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(angle + Math.PI / 2);
        if (image && image.complete && image.naturalWidth) {
            ctx.shadowColor = config.accent;
            ctx.shadowBlur = 22;
            ctx.fillStyle = '#f0e6d2';
            ctx.beginPath();
            ctx.arc(0, 0, config.size * .48, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, config.size * .41, 0, Math.PI * 2);
            ctx.clip();
            const s = Math.max(config.size / image.naturalWidth, config.size / image.naturalHeight);
            ctx.drawImage(image, -image.naturalWidth * s / 2, -image.naturalHeight * s / 2, image.naturalWidth * s, image.naturalHeight * s);
            ctx.restore();
            ctx.strokeStyle = config.accent;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, config.size * .48, 0, Math.PI * 2);
            ctx.stroke()
        } else drawStandardCicada(config.size, now);
        ctx.restore();
        if (spinning) {
            const arr = config.echoes || ['哇'],
                text = arr[Math.floor(now / 900) % arr.length];
            ctx.fillStyle = config.accent;
            ctx.font = `700 ${text.length>6?18:Math.max(28,config.size*.3)}px serif`;
            ctx.fillText(text, tx + config.size * .55, ty - config.size * .18, Math.min(w * .38, 320))
        }
        if (audio) {
            audio.volume = Math.min(1, config.volume * (spinning ? 1 : .15));
            audio.playbackRate = Math.min(1.35, .82 + config.speed * .09)
        }
        $('viewerRps').textContent = (spinning ? config.speed : Math.abs(drag.velocity) / (Math.PI * 2)).toFixed(1);
        requestAnimationFrame(drawScene)
    }
    requestAnimationFrame(drawScene);

    function angleOf(e) {
        const r = canvas.getBoundingClientRect();
        return Math.atan2(e.clientY - r.top - r.height * .31, e.clientX - r.left - r.width / 2)
    }
    canvas.onpointerdown = e => {
        drag.active = true;
        drag.angle = angleOf(e);
        drag.last = performance.now();
        canvas.setPointerCapture(e.pointerId)
    };
    canvas.onpointermove = e => {
        if (!drag.active) return;
        const a = angleOf(e),
            elapsed = Math.max(16, performance.now() - drag.last) / 1000;
        let d = a - drag.angle;
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        drag.velocity = d / elapsed;
        drag.angle = a;
        drag.last = performance.now()
    };
    canvas.onpointerup = canvas.onpointercancel = () => drag.active = false;
    $('spinBtn').onclick = async () => {
        spinning = !spinning;
        $('spinBtn').textContent = t(spinning ? 'pauseSpin' : 'startSpin');
        if (audio) {
            if (spinning) await audio.play().catch(() => {});
            else audio.pause()
        }
    };

    function saveLocal() {
        readControls();
        set(keys.draft, JSON.stringify({
            version: 1,
            config,
            savedAt: new Date().toISOString()
        }));
        statusT('savedLocal')
    }
    $('saveLocalBtn').onclick = saveLocal;
    async function saveDraft() {
        readControls();
        const f = new FormData();
        f.set('mode', 'draft');
        f.set('config', JSON.stringify(config));
        if (draftId) f.set('id', draftId);
        try {
            const r = await fetch('api/project.php', {
                    method: 'POST',
                    body: f
                }),
                d = await r.json();
            if (!r.ok) throw Error(d.error);
            draftId = d.id;
            saveLocal();
            statusT('draftSaved')
        } catch (e) {
            status(e.message || t('draftFailed'))
        }
    }
    $('draftBtn').onclick = saveDraft;

    function shareUrl(id, pwd = '') {
        const u = new URL(location.pathname, location.origin);
        u.searchParams.set('id', id);
        if (pwd) u.searchParams.set('pwd', pwd);
        return u.href
    }

    function shareText(url = $('shareUrl').value) {
        return t('shareTextTemplate', {
            title: config.title,
            subtitle: config.subtitle,
            url
        })
    }

    function renderQr(url, target) {
        target.replaceChildren();
        if (window.QRCode) {
            new QRCode(target, {
                text: url,
                width: 146,
                height: 146
            })
        } else {
            const a = document.createElement('a');
            a.href = url;
            a.textContent = 'QR\n' + url;
            a.style.fontSize = '9px';
            target.appendChild(a)
        }
    }
    async function publish() {
        readControls();
        const enabled = $('passwordEnabled').checked,
            pwd = $('accessPassword').value.trim();
        if (enabled && !passwordProtected && !pwd) {
            statusT('passwordRequired');
            return
        }
        const updating = !!editingId,
            buttons = [$('publishBtn'), $('publishBottomBtn')];
        buttons.forEach(b => b.disabled = true);
        statusT(updating ? 'statusUpdating' : 'statusPublishing');
        const f = new FormData();
        f.set('mode', updating ? 'update' : 'publish');
        f.set('config', JSON.stringify(config));
        if (updating) f.set('id', editingId);
        if (imageFile) f.set('image', imageFile);
        if (audioFile) f.set('audio', audioFile);
        if (removeImage) f.set('removeImage', '1');
        if (removeAudio) f.set('removeAudio', '1');
        if (enabled && pwd) f.set('accessPassword', pwd);
        if (!enabled && passwordProtected) f.set('clearPassword', '1');
        try {
            const r = await fetch('api/project.php', {
                    method: 'POST',
                    body: f
                }),
                d = await r.json();
            if (!r.ok) throw Error(d.error);
            editingId = d.id;
            remember(d.id);
            passwordProtected = enabled;
            lastSharePassword = enabled ? pwd : '';
            imageFile = audioFile = null;
            originalHasImage = !!image || originalHasImage;
            originalHasAudio = !!audio || originalHasAudio;
            removeImage = removeAudio = false;
            localStorage.removeItem(keys.draft);
            history.replaceState(null, '', new URL('?edit=' + d.id, location.href));
            syncEdit();
            syncPassword();
            $('shareSheetTitle').textContent = t(updating ? 'updated' : 'published');
            $('shareUrl').value = shareUrl(d.id, lastSharePassword);
            renderQr($('shareUrl').value, $('shareQr'));
            $('shareSheet').hidden = false;
            statusT(updating ? 'statusUpdated' : 'statusPublished');
            loadHistory();
            loadMine()
        } catch (e) {
            status(e.message || t('publishFailed'))
        } finally {
            buttons.forEach(b => b.disabled = false)
        }
    }
    $('publishBtn').onclick = $('publishBottomBtn').onclick = publish;
    $('copyBtn').onclick = async () => {
        await navigator.clipboard.writeText($('shareUrl').value).catch(() => {});
        $('copyBtn').textContent = t('copied')
    };
    $('copyTextBtn').onclick = () => navigator.clipboard.writeText(shareText()).catch(() => {});
    $('systemShareBtn').onclick = () => navigator.share ? navigator.share({
        title: config.title,
        text: config.subtitle,
        url: $('shareUrl').value
    }).catch(() => {}) : navigator.clipboard.writeText(shareText()).catch(() => {});
    const openPoster = urlValue => {
        const posterUrl = new URL(urlValue, location.href);
        posterUrl.searchParams.set('poster', '1');
        window.open(posterUrl.toString(), '_blank', 'noopener')
    };
    $('posterShareBtn').onclick = () => openPoster($('shareUrl').value);
    $('previewShareBtn').onclick = () => location.href = $('shareUrl').value;
    $('closeShareBtn').onclick = () => $('shareSheet').hidden = true;

    function setTab(name) {
        for (const n of ['create', 'my', 'history']) {
            $(n + 'TabPanel').hidden = n !== name;
            $(n + 'TabBtn').classList.toggle('active', n === name)
        }
        set(keys.tab, name);
        $('editorPanel').scrollTop = 0;
        if (name === 'history') loadHistory();
        if (name === 'my') loadMine()
    }
    $('createTabBtn').onclick = () => setTab('create');
    $('myTabBtn').onclick = () => setTab('my');
    $('historyTabBtn').onclick = () => setTab('history');

    function openAdmin(id = '') {
        adminTargetId = id;
        $('adminError').textContent = '';
        $('adminHelp').textContent = t(id ? 'adminHelp' : 'adminManageHelp');
        $('adminSheet').hidden = false;
        $('adminUsername').focus()
    }

    function syncAdmin(ok) {
        $('adminLoginBtn').disabled = ok;
        $('adminLoginBtn').textContent = t(ok ? 'adminActive' : 'adminLoginEntry')
    }
    $('adminLoginBtn').onclick = () => openAdmin();
    $('adminCancel').onclick = () => {
        $('adminSheet').hidden = true;
        adminTargetId = ''
    };
    $('adminForm').onsubmit = async e => {
        e.preventDefault();
        try {
            const r = await fetch('api/admin.php', {
                    method: 'POST',
                    body: new FormData(e.currentTarget)
                }),
                d = await r.json();
            if (!r.ok) throw Error(d.error);
            const id = adminTargetId || editingId;
            $('adminSheet').hidden = true;
            syncAdmin(true);
            if (id) {
                location.href = '?edit=' + id;
                return
            }
            loadHistory();
            loadMine()
        } catch (err) {
            $('adminError').textContent = err.message || t('adminInvalid')
        }
    };

    function dateText(v) {
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? t('unknownTime') : new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : locale, {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(d)
    }

    function requestEdit(item) {
        if (item.canEdit) location.href = '?edit=' + item.id;
        else openAdmin(item.id)
    }
    async function removeWork(item, b) {
        if (!item.canDelete || !confirm(t('confirmDelete', {
                title: item.title
            }))) return;
        b.disabled = true;
        b.textContent = t('deleting');
        try {
            const r = await fetch('api/project.php?id=' + item.id, {
                    method: 'DELETE'
                }),
                d = await r.json();
            if (!r.ok) throw Error(d.error);
            forget(item.id);
            statusT('deleted');
            if (editingId === item.id) {
                location.href = './';
                return
            }
            await Promise.all([loadHistory(), loadMine()])
        } catch (e) {
            status(e.message || t('deleteFailed'));
            b.disabled = false;
            b.textContent = t('deleteWork')
        }
    }

    function renderList(items, total, sort, target = 'history') {
        const mine = target === 'my',
            list = $(mine ? 'myList' : 'historyList');
        list.replaceChildren();
        $(mine ? 'mySummary' : 'historySummary').textContent = mine ? t('myWorksCount', {
            count: total
        }) : t({
            time_desc: 'totalLatest',
            time_asc: 'totalOldest',
            views_desc: 'totalViewsHigh',
            views_asc: 'totalViewsLow'
        } [sort], {
            count: total
        });
        if (!items.length) {
            const e = document.createElement('div');
            e.className = 'history-empty';
            e.textContent = t(mine ? 'emptyMyWorks' : 'emptyHistory');
            list.append(e);
            return
        }
        items.forEach(item => {
            const card = document.createElement('article');
            card.className = 'history-card';
            const thumb = document.createElement('a');
            thumb.className = 'history-thumb';
            thumb.href = '?id=' + item.id;
            thumb.target = '_blank';
            thumb.style.borderColor = item.accent;
            if (item.imageUrl) {
                const img = new Image();
                img.src = item.imageUrl;
                img.alt = '';
                thumb.append(img)
            } else thumb.textContent = '知';
            const info = document.createElement('div'),
                name = document.createElement('div');
            name.className = 'history-name';
            name.textContent = item.title;
            const meta = document.createElement('div');
            meta.className = 'history-meta';
            meta.append(Object.assign(document.createElement('span'), {
                textContent: dateText(item.publishedAt)
            }), Object.assign(document.createElement('span'), {
                textContent: t('views', {
                    count: item.views
                })
            }));
            for (const [yes, key] of [
                    [item.hasImage, 'hasImage'],
                    [item.hasAudio, 'hasAudio'],
                    [item.passwordProtected, 'protected']
                ])
                if (yes) {
                    const s = document.createElement('span');
                    s.className = 'history-badge';
                    s.textContent = t(key);
                    meta.append(s)
                } const actions = document.createElement('div');
            actions.className = 'history-actions';
            const edit = document.createElement('button');
            edit.className = 'edit-action';
            edit.textContent = t('editWork');
            edit.onclick = () => requestEdit(item);
            const preview = document.createElement('a');
            preview.href = '?id=' + item.id;
            preview.target = '_blank';
            preview.textContent = t('preview');
            const copy = document.createElement('button');
            copy.textContent = t('copyLink');
            copy.onclick = () => navigator.clipboard.writeText(new URL('?id=' + item.id, location.href)).catch(() => {});
            const del = document.createElement('button');
            del.className = 'delete-action';
            del.textContent = t('deleteWork');
            del.disabled = !item.canDelete;
            del.title = item.canDelete ? t('deleteWork') : t('deleteAdminOnly');
            del.onclick = () => removeWork(item, del);
            actions.append(edit, preview, copy, del);
            info.append(name, meta, actions);
            card.append(thumb, info);
            list.append(card)
        })
    }
    async function loadHistory(page = historyPage) {
        const sort = $('historySort').value;
        page = Math.max(1, +page || 1);
        try {
            const r = await fetch(`api/projects.php?limit=${pageSize}&offset=${(page-1)*pageSize}&sort=${sort}`, {
                    cache: 'no-store'
                }),
                d = await r.json();
            if (!r.ok) throw Error(d.error);
            syncAdmin(!!d.adminAuthenticated);
            const pages = Math.max(1, Math.ceil(d.total / pageSize));
            if (page > pages) return loadHistory(pages);
            historyPage = page;
            $('historyPageInfo').textContent = t('pageInfo', {
                page,
                pages
            });
            $('historyPrev').disabled = page <= 1;
            $('historyNext').disabled = page >= pages;
            renderList(d.items, d.total, sort)
        } catch (e) {
            $('historySummary').textContent = e.message || t('historyFailed')
        }
    }
    async function loadMine() {
        const ids = myIds();
        if (!ids.length) {
            renderList([], 0, 'time_desc', 'my');
            return
        }
        try {
            const r = await fetch(`api/projects.php?limit=20&sort=time_desc&ids=${encodeURIComponent(ids.join(','))}`, {
                    cache: 'no-store'
                }),
                d = await r.json();
            if (!r.ok) throw Error(d.error);
            renderList(d.items, d.total, 'time_desc', 'my')
        } catch (e) {
            $('mySummary').textContent = e.message || t('historyFailed')
        }
    }
    $('refreshHistoryBtn').onclick = () => loadHistory();
    $('historySort').onchange = () => {
        historyPage = 1;
        loadHistory(1)
    };
    $('historyPrev').onclick = () => loadHistory(historyPage - 1);
    $('historyNext').onclick = () => loadHistory(historyPage + 1);
    $('refreshMyBtn').onclick = loadMine;
    async function loadEdit(id) {
        statusT('statusEditLoading');
        try {
            const r = await fetch(`api/project.php?id=${id}&track=0&edit=1`, {
                    cache: 'no-store'
                }),
                d = await r.json();
            if (r.status === 403 && d.code === 'admin_required') {
                openAdmin(id);
                statusT('adminRequired');
                return
            }
            if (!r.ok) throw Error(d.error);
            const p = d.project;
            config = {
                ...demoFor(p.config?.locale || locale),
                ...p.config
            };
            originalHasImage = !!p.imageUrl;
            originalHasAudio = !!p.audioUrl;
            passwordProtected = !!p.passwordProtected;
            $('passwordEnabled').checked = passwordProtected;
            fillControls();
            syncPassword();
            if (p.imageUrl) useImage(p.imageUrl);
            if (p.audioUrl) useAudio(p.audioUrl, t('existingAudio'));
            if (p.ownedByRequester) remember(id);
            syncEdit();
            statusT('statusEditLoaded')
        } catch (e) {
            status(e.message || t('loadFailed'))
        }
    }
    async function loadShared(id, pwd = '') {
        statusT('statusShareLoading');
        try {
            const r = await fetch(`api/project.php?id=${id}${pwd?'&pwd='+encodeURIComponent(pwd):''}`, {
                    cache: 'no-store'
                }),
                d = await r.json();
            if (r.status === 401) {
                applyLocale(d.locale || locale);
                $('accessError').textContent = d.code === 'password_invalid' ? t('passwordWrong') : '';
                $('accessGate').hidden = false;
                return
            }
            if (!r.ok) throw Error(d.error);
            config = {
                ...demoFor(d.project.config?.locale || locale),
                ...d.project.config
            };
            fillControls();
            if (d.project.imageUrl) useImage(d.project.imageUrl);
            if (d.project.audioUrl) useAudio(d.project.audioUrl, t('audioReady'));
            document.title = config.title;
            $('accessGate').hidden = true;
            statusT('statusShareReady')
        } catch (e) {
            status(e.message || t('loadFailed'))
        }
    }
    $('accessForm').onsubmit = e => {
        e.preventDefault();
        const pwd = $('viewerPassword').value.trim();
        if (pwd) {
            const u = new URL(location.href);
            u.searchParams.set('pwd', pwd);
            history.replaceState(null, '', u);
            loadShared(SHARE_PROJECT_ID, pwd)
        }
    };
    $('viewerShareBtn').onclick = () => {
        $('viewerShareUrl').value = location.href;
        renderQr(location.href, $('viewerQr'));
        $('viewerShareSheet').hidden = false
    };
    $('viewerShareClose').onclick = () => $('viewerShareSheet').hidden = true;
    $('viewerPosterShare').onclick = () => openPoster($('viewerShareUrl').value);
    $('viewerCopyLink').onclick = () => navigator.clipboard.writeText(location.href).catch(() => {});
    $('viewerSystemShare').onclick = () => navigator.share ? navigator.share({
        title: config.title,
        text: config.subtitle,
        url: location.href
    }).catch(() => {}) : navigator.clipboard.writeText(location.href).catch(() => {});
    locale = ZZLI18N.normalize(get(keys.locale) || 'zh-CN');
    config = demoFor(locale);
    fillControls();
    syncPassword();
    const saved = get(keys.tab);
    setTab(editingId ? 'create' : (['my', 'history'].includes(saved) ? saved : 'create'));
    const draft = !SHARE_PROJECT_ID && !editingId ? get(keys.draft) : null;
    if (draft) try {
        const d = JSON.parse(draft);
        $('draftSheet').hidden = false;
        $('draftSavedAt').textContent = d.savedAt ? t('draftSavedAt', {
            time: new Date(d.savedAt).toLocaleString()
        }) : '';
        $('resumeDraftBtn').onclick = () => {
            config = {
                ...demoFor(d.config.locale || locale),
                ...d.config
            };
            fillControls();
            $('draftSheet').hidden = true
        };
        $('newFromDraftBtn').onclick = () => {
            localStorage.removeItem(keys.draft);
            $('draftSheet').hidden = true
        }
    } catch {}
    if (editingId) loadEdit(editingId);
    if (SHARE_PROJECT_ID) loadShared(SHARE_PROJECT_ID, new URLSearchParams(location.search).get('pwd') || '');
    else loadHistory();
})();
