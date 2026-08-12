
const Timer = {
  interval: null,
  totalSeconds: 0,
  state: 'idle', // idle | running | paused
  longPressTimer: null,

  init() {
    const el = document.getElementById('fab-timer');
    if (!el) return;
    el.addEventListener('pointerdown', e => {
      this.longPressTimer = setTimeout(() => {
        this.longPressTimer = null;
        App.exportJsonData();
        const code = Storage.generateRecoveryCode();
        navigator.clipboard.writeText(code).then(() => {
          Utils.showToast('📤 已导出JSON并复制恢复码');
        }).catch(() => {
          Utils.showToast('📤 已导出JSON（恢复码请手动复制）');
        });
      }, 2000);
    });
    el.addEventListener('pointerup', e => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
        this.handleClick();
      }
    });
    el.addEventListener('pointerleave', () => {
      if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
    });
    el.addEventListener('dblclick', () => {
      if (this.state !== 'idle' && confirm('确定要清零计时器吗？')) {
        clearInterval(this.interval);
        this.interval = null;
        this.totalSeconds = 0;
        this.state = 'idle';
        el.classList.remove('running');
        document.getElementById('timerDisplay').textContent = '00:00';
        document.getElementById('timerStatus').textContent = '待命';
      }
    });
  },

  handleClick() {
    const el = document.getElementById('fab-timer');
    const disp = document.getElementById('timerDisplay');
    const status = document.getElementById('timerStatus');
    if (this.state === 'idle') {
      this.state = 'running';
      el.classList.add('running');
      status.textContent = '计时中';
      this.interval = setInterval(() => { this.totalSeconds++; this.updateDisplay(); }, 1000);
    } else if (this.state === 'running') {
      this.state = 'paused';
      clearInterval(this.interval);
      this.interval = null;
      el.classList.remove('running');
      status.textContent = '已暂停';
    } else if (this.state === 'paused') {
      this.state = 'running';
      el.classList.add('running');
      status.textContent = '计时中';
      this.interval = setInterval(() => { this.totalSeconds++; this.updateDisplay(); }, 1000);
    }
  },

  updateDisplay() {
    const m = Math.floor(this.totalSeconds / 60);
    const s = this.totalSeconds % 60;
    const el = document.getElementById('timerDisplay');
    if (el) el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
};
