
const Utils = {
  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  getTodayKey() {
    return new Date().toISOString().split('T')[0];
  },

  showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; // textContent 天然防 XSS
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  },

  setProgress(pct) {
    const bar = document.getElementById('progress-bar');
    const container = document.getElementById('progress-container');
    if (!bar || !container) return;
    if (pct === 0) {
      container.style.display = 'block';
      bar.style.width = '0%';
    } else if (pct >= 100) {
      bar.style.width = '100%';
      setTimeout(() => { container.style.display = 'none'; bar.style.width = '0%'; }, 400);
    } else {
      container.style.display = 'block';
      bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
    }
  },

  showLoading(show, text) {
    const overlay = document.getElementById('loading-overlay');
    const textEl = document.getElementById('loading-text');
    if (!overlay) return;
    if (show) {
      overlay.style.display = 'flex';
      if (textEl && text) textEl.textContent = text;
    } else {
      overlay.style.display = 'none';
    }
  },

  // 恢复码校验和（简单但有效）
  checksum(str) {
    let sum = 0;
    for (let i = 0; i < Math.min(str.length, 64); i++) sum += str.charCodeAt(i);
    return (sum % 9973).toString(36).padStart(4, '0');
  },

  formatDate(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    return d.toLocaleDateString();
  }
};
