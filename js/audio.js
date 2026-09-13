
const AudioMgr = {
  correctSound: null,
  wrongSound: null,
  bgmAudio: null,
  soundVolume: CONFIG.DEFAULT_SOUND_VOLUME,
  bgmVolume: CONFIG.DEFAULT_BGM_VOLUME,

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  audioFromBase64(base64) { return new Audio(base64); },

  playSound(sound) {
    if (!sound) return;
    sound.volume = this.soundVolume;
    sound.currentTime = 0;
    sound.play().catch(() => {});
  },

  playCorrect() { this.playSound(this.correctSound); },
  playWrong() { this.playSound(this.wrongSound); },

  async loadSound(file, type) {
    if (!file) return;
    const size = file.size;
    if (size > CONFIG.MAX_AUDIO_PLAY_SIZE) {
      Utils.showToast('音效文件超过2MB，无法使用'); return;
    }
    const base64 = await this.fileToBase64(file);
    const audio = this.audioFromBase64(base64);
    const data = Storage.getData();
    const statusEl = document.getElementById(type === 'correct' ? 'correctSoundStatus' : 'wrongSoundStatus');
    const name = file.name;

    if (size <= CONFIG.MAX_AUDIO_LOCAL_SIZE) {
      // 存 localStorage + 云端
      if (type === 'correct') { data.correctBase64 = base64; this.correctSound = audio; }
      else { data.wrongBase64 = base64; this.wrongSound = audio; }
      Storage.saveLocalData(data);
      if (statusEl) statusEl.textContent = name + ' (已同步)';
      Utils.showToast('✅ 音效已保存（本地+云端）');
    } else if (size <= CONFIG.MAX_AUDIO_INDEXED_SIZE) {
      // 存 IndexedDB（本地）
      await Storage.saveAudio(type + 'Sound', base64);
      if (type === 'correct') this.correctSound = audio;
      else this.wrongSound = audio;
      if (statusEl) statusEl.textContent = name + ' (本地DB)';
      Utils.showToast('✅ 音效已保存（IndexedDB）');
    } else {
      // 仅内存播放
      if (type === 'correct') this.correctSound = audio;
      else this.wrongSound = audio;
      if (statusEl) statusEl.textContent = name + ' (临时)';
      Utils.showToast('音效 >500KB，仅播放不存储');
    }
  },

  async restoreSounds() {
    const data = Storage.getData();
    // 答对音效
    if (data.correctBase64) {
      this.correctSound = this.audioFromBase64(data.correctBase64);
      const el = document.getElementById('correctSoundStatus');
      if (el) el.textContent = '已加载(云端)';
    } else {
      const local = await Storage.getAudio('correctSound');
      if (local) {
        this.correctSound = this.audioFromBase64(local);
        const el = document.getElementById('correctSoundStatus');
        if (el) el.textContent = '已加载(本地DB)';
      }
    }
    // 答错音效
    if (data.wrongBase64) {
      this.wrongSound = this.audioFromBase64(data.wrongBase64);
      const el = document.getElementById('wrongSoundStatus');
      if (el) el.textContent = '已加载(云端)';
    } else {
      const local = await Storage.getAudio('wrongSound');
      if (local) {
        this.wrongSound = this.audioFromBase64(local);
        const el = document.getElementById('wrongSoundStatus');
        if (el) el.textContent = '已加载(本地DB)';
      }
    }
    // 音量
    const sVol = localStorage.getItem('soundVolume');
    if (sVol !== null) {
      this.soundVolume = parseFloat(sVol);
      const slider = document.getElementById('soundVolumeSlider');
      const label = document.getElementById('soundVolumeLabel');
      if (slider) slider.value = this.soundVolume * 100;
      if (label) label.textContent = Math.round(this.soundVolume * 100) + '%';
    }
    const bVol = localStorage.getItem('bgmVolume');
    if (bVol !== null) {
      this.bgmVolume = parseFloat(bVol);
      const slider = document.getElementById('bgmVolumeSlider');
      const label = document.getElementById('bgmVolumeLabel');
      if (slider) slider.value = this.bgmVolume * 100;
      if (label) label.textContent = Math.round(this.bgmVolume * 100) + '%';
    }
  },

  playBgm(src) {
    this.stopBgm();
    if (!src) return;
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = this.bgmVolume;
    audio.play().catch(() => {});
    this.bgmAudio = audio;
  },

  stopBgm() {
    if (this.bgmAudio) { this.bgmAudio.pause(); this.bgmAudio.currentTime = 0; this.bgmAudio = null; }
  },

  async restoreBgm() {
    const bgmType = localStorage.getItem('bgmType') || 'off';
    const select = document.getElementById('bgmSelect');
    if (select) select.value = bgmType;

    if (bgmType === 'url') {
      const url = localStorage.getItem('bgmUrl');
      if (url) {
        const input = document.getElementById('bgmUrlInput');
        const row = document.getElementById('bgmUrlRow');
        if (input) input.value = url;
        if (row) row.style.display = 'flex';
        this.playBgm(url);
      }
    } else if (bgmType === 'upload') {
      const data = Storage.getData();
      let base64 = data.bgmBase64 || await Storage.getAudio('bgm');
      if (base64) {
        const row = document.getElementById('bgmUploadRow');
        const status = document.getElementById('bgmFileStatus');
        if (row) row.style.display = 'flex';
        if (status) status.textContent = '已加载';
        this.playBgm(base64);
      }
    }
  },

  async handleMusicUpload(file) {
    if (!file) return;
    const size = file.size;
    const url = URL.createObjectURL(file);
    this.playBgm(url);
    const status = document.getElementById('bgmFileStatus');
    if (size > CONFIG.MAX_AUDIO_PLAY_SIZE) {
      Utils.showToast('🎵 音乐 >2MB，无法使用');
      if (status) status.textContent = file.name + ' (过大)';
      return;
    }
    const base64 = await this.fileToBase64(file);
    const data = Storage.getData();
    if (size <= CONFIG.MAX_AUDIO_LOCAL_SIZE) {
      data.bgmBase64 = base64;
      Storage.saveLocalData(data);
      if (status) status.textContent = file.name + ' (已同步)';
      Utils.showToast('🎵 音乐已保存（本地+云端）');
    } else if (size <= CONFIG.MAX_AUDIO_INDEXED_SIZE) {
      await Storage.saveAudio('bgm', base64);
      if (status) status.textContent = file.name + ' (本地DB)';
      Utils.showToast('🎵 音乐已保存（IndexedDB）');
    } else {
      if (status) status.textContent = file.name + ' (临时)';
      Utils.showToast('🎵 音乐 >500KB，仅播放不存储');
    }
    this.playBgm(base64);
  },

  // 语音反馈（带降级检测）
  speak(phrases) {
    const toggle = document.getElementById('voiceToggle');
    if (!toggle || !toggle.checked) return;
    if (!window.speechSynthesis) return; // 静默降级
    const utter = new SpeechSynthesisUtterance(phrases[Math.floor(Math.random() * phrases.length)]);
    utter.lang = 'zh-CN';
    utter.rate = 1.1;
    window.speechSynthesis.speak(utter);
  }
};

const correctPhrases = ['回答正确！', '太棒了！', '非常好！', '继续加油！', '完美！'];
const wrongPhrases = ['再想想', '不要灰心', '你可以的', '再试一次', '保持专注'];
