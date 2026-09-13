// ============================================================
//  sync.js  —  Gist 云端同步模块
//  用 GitHub Gist API 存储做题数据，免费无限制
// ============================================================

const Sync = {
  gistId: 'gzxxw-math-sync',
  gistToken: null,
  client: null,
  userId: null,
  syncTimeout: null,

  async getToken() {
    if (!this.gistToken) {
      this.gistToken = localStorage.getItem('math_gist_token');
    }
    return this.gistToken;
  },

  setToken(token) {
    this.gistToken = token;
    localStorage.setItem('math_gist_token', token);
  },

  async init() {
    console.log('📱 使用 Gist 云端同步模式');
    const token = await this.getToken();
    if (!token) {
      console.log('⚠️ 未检测到 GitHub Token，将仅使用本地存储');
      return;
    }
    await this.loadCloudData();
  },

  async loadCloudData() {
    const token = await this.getToken();
    if (!token) return;

    try {
      const res = await fetch(`https://api.github.com/gists/${this.gistId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        console.log('📱 Gist 未找到，将创建新记录');
        return;
      }
      
      const data = await res.json();
      const content = data.files?.['data.json']?.content;
      if (!content) return;
      
      const cloudData = JSON.parse(content);
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
      
      Storage.saveLocalData(local);
      Utils.showToast('✅ 已从云端同步数据');
      App.renderAll();
      
    } catch (e) {
      console.warn('加载云端数据失败:', e);
    }
  },

  async saveToGist() {
    const token = await this.getToken();
    if (!token) return;

    const data = Storage.getData();
    const payload = JSON.stringify(data, null, 2);

    try {
      const res = await fetch(`https://api.github.com/gists/${this.gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: '高中数学刷题本数据备份',
          public: false,
          files: {
            'data.json': { content: payload }
          }
        })
      });

      if (res.ok) {
        console.log('✅ 数据已同步到 Gist');
      } else {
        console.warn('同步失败:', res.status);
      }
    } catch (e) {
      console.warn('保存失败:', e);
    }
  },

  debounceSync(data) {
    clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => this.saveToGist(), 2000);
  },

  generateShortCode() {
    return 'GIST_' + this.gistId.substring(0, 8).toUpperCase();
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
    if (!code || !code.includes('::')) { Utils.showToast('❌ 恢复码格式错误'); return false; }
    const [b64, sum] = code.split('::');
    if (Utils.checksum(b64) !== sum) { Utils.showToast('❌ 恢复码校验失败'); return false; }
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
      this.saveToGist();
      Utils.showToast('✅ 导入成功并已同步云端');
      return true;
    } catch (e) {
      Utils.showToast('❌ 恢复码无效');
      return false;
    }
  },

  onBeforeUnload() {
    this.saveToGist();
  }
};