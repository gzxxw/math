const App = {
  questions: [],
  chapters: [],
  currentFilteredQuestions: [],

  async init() {
    // 打开页面时自动重新加载题目，但保留本地做题记录
    console.log('📚 页面初始化，开始加载题目...');
    await this.loadData();
    console.log('✅ 题目加载完成，共', this.questions.length, '道题');

    Timer.init();

    if (localStorage.getItem('welcomeShown') === 'true') {
      document.getElementById('welcome-modal').style.display = 'none';
      await Sync.init();
      this.renderAll();
      await AudioMgr.restoreSounds();
      await AudioMgr.restoreBgm();
      WrongbookUI.updateBadge();
      setTimeout(() => { if (AudioMgr.bgmAudio) AudioMgr.bgmAudio.play().catch(() => {}); }, 500);
      setTimeout(() => { MathRender.renderVisible(); MathRender.observe(); }, 1000);
    } else {
      document.getElementById('welcome-modal').style.display = 'flex';
    }

    document.querySelectorAll('.top-nav button').forEach(btn => {
      btn.addEventListener('click', () => this.showView(btn.dataset.view));
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => QuestionsUI.filter());
      searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') QuestionsUI.filter(); });
    }

    document.querySelectorAll('.wf-btn').forEach(btn => {
      btn.addEventListener('click', () => WrongbookUI.render(btn.dataset.filter, btn));
    });

    SettingsUI.init();

    // 每30秒自动保存本地数据
    setInterval(() => {
      const data = Storage.getData();
      Storage.saveLocalData(data);
      Sync.debounceSync(data);
    }, 30000);

    window.addEventListener('beforeunload', () => Sync.onBeforeUnload());
  },

  async loadData() {
    // 加载章节
    try {
      const res = await fetch('./data/chapters.json');
      if (res.ok) {
        this.chapters = await res.json();
        console.log('✅ chapters.json 加载成功，共', this.chapters.length, '个章节');
      } else {
        throw new Error('fetch chapters failed: ' + res.status);
      }
    } catch (e) {
      console.warn('⚠️ 加载章节失败，使用内置备用数据:', e.message);
      this.chapters = FALLBACK_CHAPTERS;
    }
    
    // 加载题目：优先用 questions.json，失败则fallback到config.js内置的QUESTIONS
    try {
      const res = await fetch('./data/questions.json');
      console.log('📥 尝试加载 questions.json，响应状态:', res.status, 'ok:', res.ok);
      if (res.ok) {
        this.questions = await res.json();
        console.log('✅ questions.json 加载成功，共', this.questions.length, '道题');
      } else {
        throw new Error('fetch questions failed: ' + res.status);
      }
    } catch (e) {
      console.warn('❌ questions.json 加载失败，尝试使用内置QUESTIONS:', e.message);
      console.log('🔍 检查内置QUESTIONS:', typeof QUESTIONS, QUESTIONS);
      
      // fallback: 使用 config.js 里内置的 QUESTIONS 数组
      if (typeof QUESTIONS !== 'undefined' && QUESTIONS && Array.isArray(QUESTIONS) && QUESTIONS.length > 0) {
        this.questions = QUESTIONS;
        console.log('✅ 使用内置QUESTIONS数据，共', this.questions.length, '道题');
        console.log('📋 第一题:', this.questions[0]);
      } else if (typeof QUESTIONS !== 'undefined' && QUESTIONS && typeof QUESTIONS.length === 'number') {
        console.warn('⚠️ QUESTIONS存在但长度为0或不是数组');
        this.questions = [];
      } else {
        console.error('❌ 内置QUESTIONS未定义或为空');
        // 最后尝试使用 FALLBACK_QUESTIONS（如果存在）
        if (typeof FALLBACK_QUESTIONS !== 'undefined' && FALLBACK_QUESTIONS && Array.isArray(FALLBACK_QUESTIONS) && FALLBACK_QUESTIONS.length > 0) {
          this.questions = FALLBACK_QUESTIONS;
          console.log('✅ 使用FALLBACK_QUESTIONS数据，共', this.questions.length, '道题');
        } else {
          this.questions = [];
        }
      }
    }
    this.currentFilteredQuestions = [...this.questions];
    console.log('📚 当前题目数量:', this.questions.length);
  },

  showView(viewId) {
    Utils.showLoading(true, '加载中...');
    setTimeout(() => {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      const target = document.getElementById('view-' + viewId);
      if (target) target.classList.add('active');
      document.querySelectorAll('.top-nav button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.top-nav button').forEach(b => {
        if (b.dataset.view === viewId) b.classList.add('active');
      });

      if (viewId === 'wrong') WrongbookUI.render('all', document.querySelector('.wf-btn[data-filter="all"]'));
      if (viewId === 'stats') { StatsUI.update(); StatsUI.updateDaily(); }
      if (viewId === 'settings') {
        (async () => { await AudioMgr.restoreSounds(); await AudioMgr.restoreBgm(); })();
      }
      if (viewId === 'all') { this.currentFilteredQuestions = [...this.questions]; if (document.getElementById('searchInput')) document.getElementById('searchInput').value = ''; }
      window.scrollTo(0, 0);
      setTimeout(() => { MathRender.renderVisible(); MathRender.observe(); Utils.showLoading(false); }, 300);
    }, 200);
  },

  renderAll() {
    MenuUI.render();
    QuestionsUI.renderAll(this.currentFilteredQuestions);
    StatsUI.update();
    StatsUI.updateDaily();
    WrongbookUI.updateBadge();
  },

  exportJsonData() {
    const data = Storage.getData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `刷题备份_${Utils.getTodayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Utils.showToast('📤 JSON 备份已导出');
  },

  importJsonData(file) {
    if (!file) return;
    Utils.showLoading(true, '导入 JSON...');
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!imported.completed || !imported.wrongs || !imported.daily) throw new Error('格式错误');
        const current = Storage.getData();
        Object.assign(current.completed, imported.completed);
        for (const qid in imported.wrongs) {
          if (current.wrongs[qid]) {
            current.wrongs[qid].count = Math.max(current.wrongs[qid].count, imported.wrongs[qid].count);
            current.wrongs[qid].lastTime = Math.max(current.wrongs[qid].lastTime, imported.wrongs[qid].lastTime);
          } else { current.wrongs[qid] = imported.wrongs[qid]; }
        }
        for (const date in imported.daily) {
          if (current.daily[date]) {
            current.daily[date].done = [...new Set([...current.daily[date].done, ...imported.daily[date].done])];
            current.daily[date].wrong = [...new Set([...current.daily[date].wrong, ...imported.daily[date].wrong])];
          } else { current.daily[date] = imported.daily[date]; }
        }
        if (imported.correctBase64) { current.correctBase64 = imported.correctBase64; AudioMgr.correctSound = AudioMgr.audioFromBase64(imported.correctBase64); }
        if (imported.wrongBase64) { current.wrongBase64 = imported.wrongBase64; AudioMgr.wrongSound = AudioMgr.audioFromBase64(imported.wrongBase64); }
        if (imported.bgmBase64) { current.bgmBase64 = imported.bgmBase64; AudioMgr.playBgm(imported.bgmBase64); }
        Storage.saveLocalData(current);
        Sync.debounceSync(current);
        Utils.showToast('✅ JSON 导入成功！');
        this.renderAll();
        Utils.showLoading(false);
      } catch (err) {
        Utils.showLoading(false);
        Utils.showToast('❌ JSON 文件无效: ' + err.message);
      }
    };
    reader.readAsText(file);
  }
};

function acceptWelcome() {
  const dontShow = document.getElementById('dontShowWelcome');
  if (dontShow && dontShow.checked) localStorage.setItem('welcomeShown', 'true');
  document.getElementById('welcome-modal').style.display = 'none';
  Sync.init().then(() => {
    App.renderAll();
    AudioMgr.restoreSounds().then(() => AudioMgr.restoreBgm());
    WrongbookUI.updateBadge();
    setTimeout(() => { MathRender.renderVisible(); MathRender.observe(); }, 1000);
  });
}

function rejectWelcome() {
  const box = document.querySelector('#welcome-modal .modal-box');
  if (box) {
    box.innerHTML = `
      <h2>⚠️ 需要同意才能使用</h2>
      <p>本工具需要本地存储来保存您的做题记录。刷新页面可重新选择。</p>
      <div class="modal-actions">
        <button class="btn-agree" onclick="location.reload()">刷新并同意</button>
      </div>
    `;
  }
}

function showGridZen() {
  const el = document.getElementById('gridzen-placeholder');
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    // 先检查登录状态
    Auth.checkAndInit();
  });
