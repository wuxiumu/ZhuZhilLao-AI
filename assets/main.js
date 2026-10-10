/* cgos.cc 项目展示首页脚本 */

const API_BASE = (window.CGOS_CONFIG && window.CGOS_CONFIG.API_BASE) ? window.CGOS_CONFIG.API_BASE : '/api';

async function fetchJSON(url, opts, retry = 2) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let err = text;
      try { err = JSON.parse(text).error || text; } catch (_) {}
      throw new Error(err || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (e) {
    if (retry > 0) return fetchJSON(url, opts, retry - 1);
    throw e;
  }
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

function renderList(containerId, items, render) {
  const box = document.getElementById(containerId);
  if (!items || !items.length) {
    box.innerHTML = '<div class="list-empty">暂无内容</div>';
    return;
  }
  box.innerHTML = items.map(render).join('');
}

const guestbookItem = item => `
  <div class="list-item">
    <div class="meta"><span>${escapeHtml(item.email)}</span><span>${fmtTime(item.time)}</span></div>
    <div class="body">${escapeHtml(item.message)}</div>
  </div>`;

const chatItem = item => `
  <div class="list-item">
    <div class="meta"><span>${escapeHtml(item.name)}</span><span>${fmtTime(item.time)}</span></div>
    <div class="body">${escapeHtml(item.message)}</div>
  </div>`;

/* 移动端菜单 */
const menuBtn = document.getElementById('menu-btn');
const navLinks = document.getElementById('nav-links');
if (menuBtn && navLinks) {
  menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
}

/* 导航高亮 */
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
if (sections.length && navAnchors.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => observer.observe(s));
}

/* 统计 */
async function loadStats() {
  try {
    const data = await fetchJSON(`${API_BASE}/stats.php`);
    setStat('stat-pv', data.pv);
    setStat('stat-uv', data.uv);
    setStat('stat-today', data.today_pv);
    setStat('stat-online', data.online);
  } catch (e) { console.error('stats', e); }
}
function setStat(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value ?? 0;
  el.classList.remove('loading');
}
if (document.getElementById('stat-pv')) {
  loadStats();
  setInterval(loadStats, 30000);
}

/* 表单处理 */
function handleForm(formId, msgId, url, getPayload, successText, onSuccess) {
  const form = document.getElementById(formId);
  const msg = document.getElementById(msgId);
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.disabled = true;
    msg.textContent = '';
    msg.className = 'msg';
    try {
      await fetchJSON(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPayload())
      });
      msg.textContent = successText;
      onSuccess();
    } catch (err) {
      msg.textContent = err.message || '提交失败';
      msg.className = 'msg error';
    } finally { btn.disabled = false; }
  });
}

/* 留言 */
async function loadGuestbook(limit = 20) {
  try {
    const data = await fetchJSON(`${API_BASE}/guestbook.php?limit=${limit}`);
    renderList('guestbook-list', data.list, guestbookItem);
    return data.list || [];
  } catch (e) { console.error('guestbook', e); return []; }
}

handleForm('guestbook-form', 'gb-msg', `${API_BASE}/guestbook.php`, () => ({
  email: document.getElementById('gb-email').value.trim(),
  message: document.getElementById('gb-message').value.trim()
}), '留言已提交', () => {
  loadGuestbook();
  document.getElementById('guestbook-form').reset();
});

/* 聊天 */
async function loadChat(limit = 50) {
  try {
    const data = await fetchJSON(`${API_BASE}/chat.php?limit=${limit}`);
    const list = (data.list || []).slice().reverse();
    renderList('chat-list', list, chatItem);
    return list;
  } catch (e) { console.error('chat', e); return []; }
}

handleForm('chat-form', 'chat-msg', `${API_BASE}/chat.php`, () => ({
  name: document.getElementById('chat-name').value.trim() || '匿名',
  message: document.getElementById('chat-message').value.trim()
}), '发送成功', () => {
  loadChat();
  document.getElementById('chat-message').value = '';
});

// 初始化页面上的留言/聊天列表（如果存在）
if (document.getElementById('guestbook-list')) loadGuestbook();
if (document.getElementById('chat-list')) {
  loadChat();
  setInterval(loadChat, 10000);
}

/* 顶部滚动留言条（留言页专用） */
async function loadTicker() {
  const ticker = document.getElementById('ticker');
  if (!ticker) return;
  try {
    const data = await fetchJSON(`${API_BASE}/guestbook.php?limit=20`);
    const list = data.list || [];
    if (!list.length) {
      ticker.innerHTML = '<span class="ticker-empty">暂无留言，快来抢沙发</span>';
      return;
    }
    const html = list.map(item => `
      <span class="ticker-item">
        <span class="dot"></span>
        <span class="email">${escapeHtml(item.email)}</span>
        <span>${escapeHtml(item.message)}</span>
      </span>
    `).join('');
    // 复制一份实现无缝滚动
    ticker.innerHTML = html + html;
  } catch (e) { console.error('ticker', e); }
}

if (document.getElementById('ticker')) {
  loadTicker();
  setInterval(loadTicker, 30000);
}
