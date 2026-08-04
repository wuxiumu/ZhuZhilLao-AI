/**
 * 聊天室弹窗组件
 * 任意页面引入 config.js + chat-widget.css + chat-widget.js 即可使用。
 * 自动在右下角显示浮动图标，点击展开全屏居中弹窗。
 */
(function () {
  const API_BASE = (window.CGOS_CONFIG && window.CGOS_CONFIG.API_BASE) ? window.CGOS_CONFIG.API_BASE : '/api';
  const LS_KEY = 'cgw_lastReadAt';
  const POLL_INTERVAL = 8000;

  let lastReadAt = parseInt(localStorage.getItem(LS_KEY) || '0', 10) || 0;
  let messages = [];
  let selfIds = new Set();
  let pollTimer = null;

  async function fetchJSON(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let err = text;
      try { err = JSON.parse(text).error || text; } catch (_) {}
      throw new Error(err || `HTTP ${res.status}`);
    }
    return res.json();
  }

  function fmtTime(ts) {
    const d = new Date(ts * 1000);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  function countUnread(list) {
    let n = 0;
    for (const m of list) {
      if (m.time > lastReadAt && !selfIds.has(m.time)) n++;
    }
    return n;
  }

  function updateBadge() {
    const n = countUnread(messages);
    const badge = document.getElementById('cgw-badge');
    badge.textContent = n > 99 ? '99+' : String(n);
    badge.classList.toggle('cgw-hidden', n === 0);
  }

  function renderMessages() {
    const box = document.getElementById('cgw-body');
    if (!messages.length) {
      box.innerHTML = '<div class="cgw-empty">暂无消息，来说两句吧</div>';
      return;
    }
    box.innerHTML = messages.map(m => `
      <div class="cgw-message ${selfIds.has(m.time) ? 'self' : ''}">
        <div class="cgw-message-meta">
          <span>${escapeHtml(m.name)}</span>
          <span>${fmtTime(m.time)}</span>
        </div>
        <div class="cgw-message-body">${escapeHtml(m.message)}</div>
      </div>
    `).join('');
    box.scrollTop = box.scrollHeight;
  }

  async function loadMessages() {
    try {
      const data = await fetchJSON(`${API_BASE}/chat.php?limit=100`);
      messages = (data.list || []).slice().reverse();
      updateBadge();
      if (document.getElementById('cgw-overlay').classList.contains('open')) {
        renderMessages();
      }
    } catch (e) { console.error('chat-widget poll', e); }
  }

  async function sendMessage() {
    const input = document.getElementById('cgw-input');
    const btn = document.getElementById('cgw-send');
    const msg = document.getElementById('cgw-msg');
    const name = document.getElementById('cgw-name')?.value?.trim() || '匿名';
    const text = input.value.trim();
    if (!text) return;

    btn.disabled = true;
    msg.textContent = '';
    msg.className = 'cgw-msg';
    try {
      const res = await fetchJSON(`${API_BASE}/chat.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message: text })
      });
      selfIds.add(res.id);
      input.value = '';
      msg.textContent = '发送成功';
      await loadMessages();
    } catch (err) {
      msg.textContent = err.message || '发送失败';
      msg.className = 'cgw-msg error';
    } finally {
      btn.disabled = false;
    }
  }

  function openModal() {
    document.getElementById('cgw-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    lastReadAt = Math.floor(Date.now() / 1000);
    localStorage.setItem(LS_KEY, String(lastReadAt));
    updateBadge();
    renderMessages();
    setTimeout(() => document.getElementById('cgw-input').focus(), 100);
  }

  function closeModal() {
    document.getElementById('cgw-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  function createDOM() {
    if (document.getElementById('cgw-fab')) return;

    const fab = document.createElement('button');
    fab.id = 'cgw-fab';
    fab.className = 'cgw-fab';
    fab.setAttribute('aria-label', '聊天');
    fab.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span id="cgw-badge" class="cgw-badge cgw-hidden">0</span>
    `;
    fab.addEventListener('click', openModal);
    document.body.appendChild(fab);

    const overlay = document.createElement('div');
    overlay.id = 'cgw-overlay';
    overlay.className = 'cgw-overlay';
    overlay.innerHTML = `
      <div class="cgw-modal" role="dialog" aria-modal="true">
        <div class="cgw-header">
          <h3>聊天室</h3>
          <button id="cgw-close" class="cgw-close" aria-label="关闭">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div id="cgw-body" class="cgw-body">
          <div class="cgw-empty">加载中…</div>
        </div>
        <div class="cgw-footer">
          <div class="form-group" style="margin-bottom:8px;">
            <input id="cgw-name" type="text" class="cgw-input" maxlength="32" placeholder="昵称" style="padding:8px 12px;" value="${escapeHtml(localStorage.getItem('cgw_name') || '')}">
          </div>
          <div class="cgw-input-wrap">
            <input id="cgw-input" type="text" class="cgw-input" maxlength="500" placeholder="说点什么…" autocomplete="off">
            <button id="cgw-send" class="cgw-send">发送</button>
          </div>
          <div id="cgw-msg" class="cgw-msg"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('cgw-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.getElementById('cgw-send').addEventListener('click', sendMessage);
    document.getElementById('cgw-input').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    document.getElementById('cgw-name').addEventListener('input', e => {
      localStorage.setItem('cgw_name', e.target.value.trim());
    });
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    createDOM();
    loadMessages();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(loadMessages, POLL_INTERVAL);
  }

  init();
})();
