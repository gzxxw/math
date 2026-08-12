
const StatsUI = {
  update() {
    const data = Storage.getData();
    const total = App.questions.length;
    const doneCount = Object.keys(data.completed).length;
    const wrongCount = Object.keys(data.wrongs).length;
    const elTotal = document.getElementById('stat-total');
    const elDone = document.getElementById('stat-done');
    const elWrong = document.getElementById('stat-wrong');
    const elRate = document.getElementById('stat-rate');
    if (elTotal) elTotal.textContent = total;
    if (elDone) elDone.textContent = doneCount;
    if (elWrong) elWrong.textContent = wrongCount;
    const rate = doneCount > 0 ? Math.round(((doneCount - wrongCount) / doneCount) * 100) : 0;
    if (elRate) elRate.textContent = Math.max(0, rate) + '%';
  },

  updateDaily() {
    const data = Storage.getData();
    const container = document.getElementById('daily-stats-content');
    if (!container) return;
    const today = Utils.getTodayKey();
    const dates = Object.keys(data.daily).sort().reverse().slice(0, 7);
    if (!dates.length) { container.innerHTML = '<p class="empty-msg">暂无做题记录</p>'; return; }
    let html = '<table><tr><th>日期</th><th>完成</th><th>错题</th><th>正确率</th><th>涉及章节</th></tr>';
    dates.forEach(date => {
      const day = data.daily[date];
      const done = day.done.length || 0;
      const wrong = day.wrong.length || 0;
      const rate = done > 0 ? Math.round(((done - wrong) / done) * 100) : 0;
      const isToday = date === today ? ' class="today-row"' : '';
      let detail = '';
      if (day.done.length > 0) {
        const chMap = {};
        day.done.forEach(qid => {
          const q = App.questions.find(q => q.id === qid);
          if (q) {
            if (!chMap[q.ch]) chMap[q.ch] = [];
            chMap[q.ch].push(q.id);
          }
        });
        const parts = [];
        for (const ch in chMap) parts.push(`${ch}.${chMap[ch].join(',')}`);
        detail = parts.join('; ');
      }
      html += `<tr${isToday}>
        <td>${date}${date === today ? ' 📍' : ''}</td>
        <td><strong>${done}</strong></td>
        <td>${wrong > 0 ? '<span style="color:#e74c3c;">'+wrong+'</span>' : '0'}</td>
        <td>${rate}%</td>
        <td style="font-size:11px; max-width:180px; word-break:break-all;">${detail || '-'}</td>
      </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
  }
};
