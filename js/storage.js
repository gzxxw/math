
const Storage = {
  dataCache: null,
  db: null,

  getData() {
    if (!this.dataCache) this.dataCache = this.loadLocalData();
    return this.dataCache;
  },

  loadLocalData() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) return { completed: {}, wrongs: {}, daily: {}, correctBase64: null, wrongBase64: null, bgmBase64: null };
    try { return JSON.parse(raw); } catch (e) { return { completed: {}, wrongs: {}, daily: {}, correctBase64: null, wrongBase64: null, bgmBase64: null }; }
  },

  saveLocalData(data) {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    this.dataCache = data;
  },

  // IndexedDB 大音频存储
  async initDB() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(CONFIG.DB_NAME, 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore(CONFIG.STORE_NAME);
      req.onsuccess = e => { this.db = e.target.result; resolve(this.db); };
      req.onerror = e => reject(e);
    });
  },

  async saveAudio(key, base64) {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(CONFIG.STORE_NAME, 'readwrite');
        const store = tx.objectStore(CONFIG.STORE_NAME);
        const r = store.put(base64, key);
        r.onsuccess = () => resolve();
        r.onerror = () => reject();
      });
    } catch (e) { console.warn('IndexedDB save failed', e); }
  },

  async getAudio(key) {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const tx = db.transaction(CONFIG.STORE_NAME, 'readonly');
        const store = tx.objectStore(CONFIG.STORE_NAME);
        const r = store.get(key);
        r.onsuccess = e => resolve(e.target.result || null);
        r.onerror = () => resolve(null);
      });
    } catch (e) { return null; }
  },

  // 恢复码生成与导入（带校验和）
  generateRecoveryCode() {
    const data = this.getData();
    const payload = {
      completed: data.completed,
      wrongs: data.wrongs,
      daily: data.daily,
      correctBase64: data.correctBase64 || null,
      wrongBase64: data.wrongBase64 || null,
      bgmBase64: data.bgmBase64 || null
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
    if (Utils.checksum(b64) !== sum) { Utils.showToast('❌ 恢复码校验失败，请检查是否复制完整'); return false; }
    try {
      const compressed = decodeURIComponent(escape(atob(b64)));
      const json = LZString.decompressFromUTF16(compressed);
      if (!json) throw new Error('解压失败');
      const imported = JSON.parse(json);
      if (!imported.completed || !imported.wrongs || !imported.daily) throw new Error('格式错误');
      const current = this.getData();
      Object.assign(current.completed, imported.completed);
      for (const qid in imported.wrongs) {
        if (current.wrongs[qid]) {
          current.wrongs[qid].count = Math.max(current.wrongs[qid].count, imported.wrongs[qid].count);
          current.wrongs[qid].lastTime = Math.max(current.wrongs[qid].lastTime, imported.wrongs[qid].lastTime);
        } else {
          current.wrongs[qid] = imported.wrongs[qid];
        }
      }
      for (const date in imported.daily) {
        if (current.daily[date]) {
          current.daily[date].done = [...new Set([...current.daily[date].done, ...imported.daily[date].done])];
          current.daily[date].wrong = [...new Set([...current.daily[date].wrong, ...imported.daily[date].wrong])];
        } else {
          current.daily[date] = imported.daily[date];
        }
      }
      if (imported.correctBase64) current.correctBase64 = imported.correctBase64;
      if (imported.wrongBase64) current.wrongBase64 = imported.wrongBase64;
      if (imported.bgmBase64) current.bgmBase64 = imported.bgmBase64;
      this.saveLocalData(current);
      Utils.showToast('✅ 恢复码导入成功！');
      return true;
    } catch (e) {
      Utils.showToast('❌ 恢复码无效或已损坏');
      return false;
    }
  }
};
