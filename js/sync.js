// ============================================================
//  sync.js  —  Gist 云端同步模块（通过本地代理，token 永不进前端）
//  前端只调用 /api/gist，token 由服务端 .env 注入
// ============================================================

const Sync = {
  syncTimeout: null,
  lastSyncStatus: null,
  isSyncing: false,

  async init() {
    console.log('[Sync] 初始化云端同步');
    try {
      const health = await fetch('/api/health').then(r => r.json()).catch(() => null);
      if (!health || !health.ok) {
        console.warn('[Sync] 代理服务不可用，仅使用本地存储');
        this.showSyncStatus('warning', '代理服务未运行，云端同步不可用');
        return;
      }
      if (!health.tokenConfigured) {
        console.warn('[Sync] 服务端未配置 Token');
        this.showSyncStatus('warning', '服务端未配置 GitHub Token');
        return;
      }
      if (!health.gistConfigured) {
        console.log('[Sync] Gist 未创建，尝试自动创建');
        await this.ensureGist();
      }
      await this.loadCloudData();
    } catch (e) {
      console.warn('[Sync] 初始化失败:', e.message);
    }
  },

  async ensureGist() {
    try {
      const res = await fetch('/api/gist/init', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        console.log('[Sync] Gist 已就绪:', data.gistId);
        this.showSyncStatus('ok', '云端已连接');
      } else {
        this.showSyncStatus('error', data.message || 'Gist 初始化失败');
      }
    } catch (e) {
      this.showSyncStatus('error', '网络错误，无法连接代理');
    }
  },

  async loadCloudData() {
    try {
      const res = await fetch('/api/gist');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error === 'no_gist' || err.error === 'gist_not_found') {
          await this.ensureGist();
          return;
        }
        if (err.error === 'invalid_token') {
          this.showSyncStatus('error', 'GitHub Token 无效或已过期');
          return;
        }
        if (err.error === 'network_error') {
          this.showSyncStatus('warning', '网络异常，使用本地数据');
          return;
        }
        this.showSyncStatus('warning', err.message || '云端读取失败');
        return;
      }

      const { files } = await res.json();

      if (files['data.json']) {
        try {
          const cloudData = JSON.parse(files['data.json']);
          const local = Storage.getData();

          Object.assign(local.completed, cloudData.completed || {});
          for (const qid in cloudData.wrongs || {}) {
            if (local.wrongs[qid]) {
              local.wrongs[qid].count = Math.max(local.wrongs[qid].count, cloudData.wrongs[qid].count);
              local.wrongs[qid].lastTime = Math.max(local.wrongs[qid].lastTime, cloudData.wrongs[qid].lastTime);
            } else {
              local.wrongs[qid] = cloudData.wrongs[qid];
            }
          }
          Object.assign(local.daily, cloudData.daily || {});

          if (cloudData.correctBase64) local.correctBase64 = cloudData.correctBase64;
          if (cloudData.wrongBase64) local.wrongBase64 = cloudData.wrongBase64;
          if (cloudData.bgmBase64) local.bgmBase64 = cloudData.bgmBase64;

          Storage.saveLocalData(local);
          this.showSyncStatus('ok', '云端数据已同步');
          App.renderAll();
        } catch (e) {
          console.warn('[Sync] 解析云端数据失败:', e);
        }
      }
    } catch (e) {
      console.warn('[Sync] 加载云端数据失败:', e);
      this.showSyncStatus('warning', '网络异常，使用本地数据');
    }
  },

  async saveToGist() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    const data = Storage.getData();
    const payload = JSON.stringify(data, null, 2);

    try {
      const res = await fetch('/api/gist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: {
            'data.json': { content: payload }
          }
        })
      });

      if (res.ok) {
        this.lastSyncStatus = 'ok';
        this.showSyncStatus('ok', '已保存到云端');
      } else {
        const err = await res.json().catch(() => ({}));
        this.lastSyncStatus = 'error';
        if (err.error === 'invalid_token') {
          this.showSyncStatus('error', 'Token 无效，同步失败');
        } else {
          this.showSyncStatus('warning', err.message || '同步失败');
        }
      }
    } catch (e) {
      this.lastSyncStatus = 'error';
      this.showSyncStatus('warning', '网络异常，稍后重试');
    } finally {
      this.isSyncing = false;
    }
  },

  debounceSync(data) {
    clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => this.saveToGist(), 2000);
  },

  showSyncStatus(type, message) {
    const container = document.getElementById('sync-status-container');
    if (!container) return;
    const iconMap = { ok: 'check-circle-2', warning: 'alert-triangle', error: 'alert-circle' };
    container.innerHTML = `<div class="sync-status ${type}">${Icons.get(iconMap[type] || 'alert-circle', 'sm')}<span>${message}</span></div>`;
    if (type === 'ok') {
      clearTimeout(this._statusTimer);
      this._statusTimer = setTimeout(() => { container.innerHTML = ''; }, 4000);
    }
  },

  generateRecoveryCode() {
    const data = Storage.getData();
    const payload = {
      completed: data.completed,
      wrongs: data.wrongs,
      daily: data.daily,
      bgmBase64: data.bgmBase64 || null,
      correctBase64: data.correctBase64 || null,
      wrongBase64: data.wrongBase64 || null
    };
    const json = JSON.stringify(payload);
    const compressed = LZString.compressToUTF16(json);
    const b64 = btoa(unescape(encodeURIComponent(compressed)));
    const sum = Utils.checksum(b64);
    return b64 + '::' + sum;
  },

  importRecoveryCode(code) {
    if (!code || !code.includes('::')) { Utils.showToast(`${Icons.get('alert-circle', 'sm')} 恢复码格式错误`); return false; }
    const [b64, sum] = code.split('::');
    if (Utils.checksum(b64) !== sum) { Utils.showToast(`${Icons.get('alert-circle', 'sm')} 恢复码校验失败`); return false; }
    try {
      const compressed = decodeURIComponent(escape(atob(b64)));
      const json = LZString.decompressFromUTF16(compressed);
      if (!json) throw new Error('解压失败');
      const imported = JSON.parse(json);
      const current = Storage.getData();
      Object.assign(current.completed, imported.completed || {});
      for (const qid in imported.wrongs || {}) {
        if (current.wrongs[qid]) {
          current.wrongs[qid].count = Math.max(current.wrongs[qid].count, imported.wrongs[qid].count);
          current.wrongs[qid].lastTime = Math.max(current.wrongs[qid].lastTime, imported.wrongs[qid].lastTime);
        } else {
          current.wrongs[qid] = imported.wrongs[qid];
        }
      }
      for (const date in imported.daily || {}) {
        if (current.daily[date]) {
          current.daily[date].done = [...new Set([...current.daily[date].done, ...imported.daily[date].done])];
          current.daily[date].wrong = [...new Set([...current.daily[date].wrong, ...imported.daily[date].wrong])];
        } else {
          current.daily[date] = imported.daily[date];
        }
      }
      if (imported.bgmBase64) current.bgmBase64 = imported.bgmBase64;
      if (imported.correctBase64) current.correctBase64 = imported.correctBase64;
      if (imported.wrongBase64) current.wrongBase64 = imported.wrongBase64;
      Storage.saveLocalData(current);
      this.debounceSync(current);
      Utils.showToast(`${Icons.get('check-circle-2', 'sm')} 导入成功并已同步云端`);
      return true;
    } catch (e) {
      Utils.showToast(`${Icons.get('alert-circle', 'sm')} 恢复码无效`);
      return false;
    }
  },

  onBeforeUnload() {
    this.saveToGist();
  }
};
