const SettingsUI = {
  init() {
    // 夜间模式
    const darkToggle = document.getElementById('darkModeToggle');
    const savedDark = localStorage.getItem('darkMode');
    if (savedDark === 'on') { if (darkToggle) darkToggle.checked = true; document.body.classList.add('dark-mode'); }
    if (darkToggle) darkToggle.addEventListener('change', function() {
      document.body.classList.toggle('dark-mode', this.checked);
      localStorage.setItem('darkMode', this.checked ? 'on' : 'off');
    });

    // 音效音量
    const sSlider = document.getElementById('soundVolumeSlider');
    if (sSlider) sSlider.addEventListener('input', function() {
      const val = this.value / 100;
      AudioMgr.soundVolume = val;
      const label = document.getElementById('soundVolumeLabel');
      if (label) label.textContent = Math.round(val * 100) + '%';
      localStorage.setItem('soundVolume', val);
      if (AudioMgr.correctSound) AudioMgr.correctSound.volume = val;
      if (AudioMgr.wrongSound) AudioMgr.wrongSound.volume = val;
    });

    // BGM音量
    const bSlider = document.getElementById('bgmVolumeSlider');
    if (bSlider) bSlider.addEventListener('input', function() {
      const val = this.value / 100;
      AudioMgr.bgmVolume = val;
      const label = document.getElementById('bgmVolumeLabel');
      if (label) label.textContent = Math.round(val * 100) + '%';
      localStorage.setItem('bgmVolume', val);
      if (AudioMgr.bgmAudio) AudioMgr.bgmAudio.volume = val;
    });

    // 音效文件
    const cFile = document.getElementById('correctSoundFile');
    if (cFile) cFile.addEventListener('change', e => { if (e.target.files.length) AudioMgr.loadSound(e.target.files[0], 'correct'); });
    const wFile = document.getElementById('wrongSoundFile');
    if (wFile) wFile.addEventListener('change', e => { if (e.target.files.length) AudioMgr.loadSound(e.target.files[0], 'wrong'); });

    // 背景音乐
    const bgmSelect = document.getElementById('bgmSelect');
    const savedBgm = localStorage.getItem('bgmType') || 'off';
    if (bgmSelect) bgmSelect.value = savedBgm;
    if (bgmSelect) bgmSelect.addEventListener('change', function() {
      const val = this.value;
      localStorage.setItem('bgmType', val);
      const urlRow = document.getElementById('bgmUrlRow');
      const upRow = document.getElementById('bgmUploadRow');
      if (urlRow) urlRow.style.display = val === 'url' ? 'flex' : 'none';
      if (upRow) upRow.style.display = val === 'upload' ? 'flex' : 'none';
      if (val === 'off') AudioMgr.stopBgm();
      if (val === 'url') {
        const url = (document.getElementById('bgmUrlInput') || {}).value || '';
        if (url) { AudioMgr.playBgm(url); localStorage.setItem('bgmUrl', url); }
      }
      if (val === 'upload') {
        const input = document.getElementById('bgmFileInput');
        if (input) input.click();
      }
    });
    if (savedBgm === 'url') {
      const urlRow = document.getElementById('bgmUrlRow');
      if (urlRow) urlRow.style.display = 'flex';
      const url = localStorage.getItem('bgmUrl');
      if (url) {
        const input = document.getElementById('bgmUrlInput');
        if (input) input.value = url;
        AudioMgr.playBgm(url);
      }
    } else if (savedBgm === 'upload') {
      const upRow = document.getElementById('bgmUploadRow');
      if (upRow) upRow.style.display = 'flex';
    }
    const bgmApply = document.getElementById('bgmUrlApply');
    if (bgmApply) bgmApply.addEventListener('click', () => {
      const url = (document.getElementById('bgmUrlInput') || {}).value || '';
      if (url) { localStorage.setItem('bgmUrl', url); AudioMgr.playBgm(url); Utils.showToast('🎵 背景音乐已切换'); }
      else Utils.showToast('⚠️ 请输入有效的音乐URL');
    });
    const bgmFile = document.getElementById('bgmFileInput');
    if (bgmFile) bgmFile.addEventListener('change', e => { if (e.target.files.length) AudioMgr.handleMusicUpload(e.target.files[0]); });

    // JSON 导出导入
    const expBtn = document.getElementById('exportJsonBtn');
    if (expBtn) expBtn.addEventListener('click', () => App.exportJsonData());
    
    const impBtn = document.getElementById('importJsonBtn');
    if (impBtn) impBtn.addEventListener('click', () => {
      const inp = document.getElementById('importJsonInput');
      if (inp) inp.click();
    });
    
    const impInput = document.getElementById('importJsonInput');
    if (impInput) impInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        App.importJsonData(this.files[0]);
        this.value = ''; // 清空，允许重复导入同一文件
      }
    });

    // 清空错题
    const clearBtn = document.getElementById('clearWrongsBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      if (confirm('确定要清空所有错题记录吗？此操作不可恢复。')) {
        const data = Storage.getData();
        data.wrongs = {};
        Storage.saveLocalData(data);
        Sync.debounceSync(data);
        WrongbookUI.updateBadge();
        WrongbookUI.render('all', document.querySelector('.wf-btn[data-filter="all"]'));
        Utils.showToast('🗑️ 错题记录已清空');
      }
    });

    // 云端同步按钮
    const syncBtn = document.getElementById('syncCloudBtn');
    if (syncBtn) syncBtn.addEventListener('click', async () => {
      const token = await Sync.getToken();
      if (!token) {
        Utils.showToast('⚠️ 请先设置 GitHub Token');
        return;
      }
      Utils.showLoading(true, '同步到云端...');
      await Sync.saveToGist();
      Utils.showLoading(false);
      Utils.showToast('✅ 已同步到云端');
    });

    const loadBtn = document.getElementById('loadCloudBtn');
    if (loadBtn) loadBtn.addEventListener('click', async () => {
      const token = await Sync.getToken();
      if (!token) {
        Utils.showToast('⚠️ 请先设置 GitHub Token');
        return;
      }
      Utils.showLoading(true, '从云端读取...');
      await Sync.loadCloudData();
      Utils.showLoading(false);
    });

    // 恢复码
    const importCodeBtn = document.getElementById('importCodeBtn');
    if (importCodeBtn) importCodeBtn.addEventListener('click', () => {
      const code = (document.getElementById('code-input') || {}).value || '';
      if (Storage.importRecoveryCode(code.trim())) {
        App.renderAll();
      }
    });
    const exportCodeBtn = document.getElementById('exportCodeBtn');
    if (exportCodeBtn) exportCodeBtn.addEventListener('click', () => {
      const code = Sync.generateRecoveryCode();
      const ta = document.getElementById('code-input');
      if (ta) ta.value = code;
      navigator.clipboard.writeText(code).then(() => Utils.showToast('📋 恢复码已复制')).catch(() => Utils.showToast('⚠️ 复制失败'));
    });
  }
};