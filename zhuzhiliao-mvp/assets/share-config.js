(() => {
    'use strict';

    const posterTemplates = {
        quick: {
            src: '../assets/icons/zlkz.png',
            panel: { x: 64, y: 728, width: 570, height: 232 },
            qr: { x: 84, y: 750, size: 188 },
            text: { x: 298, y: 786, maxWidth: 304 }
        },
        craft: {
            src: '../assets/icons/zlzwj.png',
            panel: { x: 98, y: 662, width: 650, height: 196 },
            qr: { x: 118, y: 682, size: 156 },
            text: { x: 302, y: 718, maxWidth: 414 }
        }
    };

    window.ZZL_SHARE_CONFIG = {
        defaultLocale: 'zh-CN',
        posterTemplates,
        locales: {
            'zh-CN': {
                documentSuffix: '知了', fallbackTitle: '竹知了', fallbackSubtitle: '一转，就哇哇地叫',
                standard: '标准版', create: '做一只自己的', share: '分享', seal: '儿时玩物',
                hint: '按住 · 画圈 · 甩起来', sound: '🔊 有声音', rps: '圈 / 秒',
                autoStart: '自动甩', autoStop: '停一停', loreTop: '竹膜为鼓 · 松香为弦', loreBottom: '摩擦生振 · 膜腔共鸣',
                gate: '请输入访问密码', gateHelp: '这个作品设置了访问保护。', passwordPlaceholder: '访问密码', open: '打开作品', passwordWrong: '密码不正确',
                copy: '复制链接', copied: '已复制', system: '系统分享', close: '关闭', loadFailed: '作品加载失败',
                posterOpen: '生成分享海报', posterTitle: '分享海报', posterQuick: '知了快做', posterCraft: '知了造物局',
                posterDownload: '下载海报', posterShare: '分享海报', posterScan: '扫码打开作品', posterSaved: '海报已生成', posterSubtitleLimit: 24,
                mobilePreviewOpen: '展开实时预览', mobilePreviewClose: '收起实时预览', previewWork: '直接预览作品'
            },
            'zh-TW': {
                documentSuffix: '知了', fallbackTitle: '竹知了', fallbackSubtitle: '一轉，就哇哇地叫',
                standard: '標準版', create: '做一隻自己的', share: '分享', seal: '兒時玩物',
                hint: '按住 · 畫圈 · 甩起來', sound: '🔊 有聲音', rps: '圈 / 秒',
                autoStart: '自動甩', autoStop: '停一停', loreTop: '竹膜為鼓 · 松香為弦', loreBottom: '摩擦生振 · 膜腔共鳴',
                gate: '請輸入訪問密碼', gateHelp: '這個作品設置了訪問保護。', passwordPlaceholder: '訪問密碼', open: '打開作品', passwordWrong: '密碼不正確',
                copy: '複製連結', copied: '已複製', system: '系統分享', close: '關閉', loadFailed: '作品載入失敗',
                posterOpen: '生成分享海報', posterTitle: '分享海報', posterQuick: '知了快做', posterCraft: '知了造物局',
                posterDownload: '下載海報', posterShare: '分享海報', posterScan: '掃碼打開作品', posterSaved: '海報已生成', posterSubtitleLimit: 24,
                mobilePreviewOpen: '展開即時預覽', mobilePreviewClose: '收起即時預覽', previewWork: '直接預覽作品'
            },
            en: {
                documentSuffix: 'Cicada', fallbackTitle: 'Bamboo Cicada', fallbackSubtitle: 'Spin it and hear it sing',
                standard: 'Standard', create: 'Create yours', share: 'Share', seal: 'A childhood toy',
                hint: 'HOLD · CIRCLE · SWING', sound: '🔊 SOUND ON', rps: 'REV / SEC',
                autoStart: 'AUTO SPIN', autoStop: 'PAUSE', loreTop: 'BAMBOO MEMBRANE · ROSIN STRING', loreBottom: 'FRICTION BECOMES SOUND',
                gate: 'Enter password', gateHelp: 'This work is password protected.', passwordPlaceholder: 'Access password', open: 'Open work', passwordWrong: 'Incorrect password',
                copy: 'Copy link', copied: 'Copied', system: 'System share', close: 'Close', loadFailed: 'Unable to load this work',
                posterOpen: 'Create poster', posterTitle: 'Share poster', posterQuick: 'Quick Studio', posterCraft: 'Cicada Atelier',
                posterDownload: 'Download poster', posterShare: 'Share poster', posterScan: 'Scan to open', posterSaved: 'Poster created', posterSubtitleLimit: 28,
                mobilePreviewOpen: 'Show live preview', mobilePreviewClose: 'Hide live preview', previewWork: 'View published work'
            }
        }
    };
})();
