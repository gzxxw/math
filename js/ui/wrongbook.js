
const WrongbookUI = {
  render(filter, btnEl) {
    document.querySelectorAll('.wf-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    const data = Storage.getData();
    const wrongList = document.getElementById('wrong-list');
    if (!wrongList) return;
    let html = '', count = 0;
    const now = Date.now(), sevenDays = 7 * 24 * 3600 * 1000;
    const items = [];
    for (let qid in data.wrongs) {
      const item = data.wrongs[qid];
      const qData = App.questions.find(q => q.id == qid);
      if (!qData) continue;
      if (filter === 'week' && (now - item.lastTime > sevenDays)) continue;
      if (filter === 'high' && item.count < 2) continue;
      items.push({ qid, qData, item });
    }
    items.sort((a, b) => b.item.count - a.item.count);
    items.forEach(({ qid, qData, item }) => {
      count++;
      const lastDate = Utils.formatDate(item.lastTime);
      html += `<div class="card" id="wrong-card-${qid}">
        <div style="color:#e74c3c; font-weight:700; margin-bottom:10px;">
          🔴 错 ${item.count} 次 | 最后错误: ${lastDate} | 第${qData.ch}章 ${Utils.escapeHtml(App.chapters[qData.ch - 1])}
        </div>
        <div class="q-title">${qid}. ${Utils.escapeHtml(qData.q)}</div>
        <div class="answer-box show" style="display:block;">
          <b>✅ 正确答案：</b>${qData.ans}<br>
          <b>📖 解析：</b>${Utils.escapeHtml(qData.ana)}
        </div>
        <div style="margin-top:10px; display:flex; gap:8px;">
          <button class="small-btn" onclick="WrongbookUI.redo(${qid})">🔄 重做</button>
          <button class="small-btn" style="background:#e74c3c;" onclick="WrongbookUI.remove(${qid})">🗑️ 移除</button>
        </div>
      </div>`;
    });
    if (count === 0) html = '<div class="empty-msg">🎉 该分类下暂无错题！</div>';
    wrongList.innerHTML = html;
    this.updateBadge();
    setTimeout(() => { MathRender.renderVisible(); MathRender.observe(); }, 200);
  },

  updateBadge() {
    const data = Storage.getData();
    const count = Object.keys(data.wrongs).length;
    const badge = document.getElementById('wrong-badge');
    if (badge) {
      if (count > 0) { badge.style.display = 'inline-block'; badge.textContent = count; }
      else badge.style.display = 'none';
    }
  },

  redo(qid) {
    Utils.showLoading(true, '重做...');
    setTimeout(() => {
      App.currentFilteredQuestions = App.questions.filter(q => q.id == qid);
      QuestionsUI.renderAll(App.currentFilteredQuestions);
      App.showView('all');
      const card = document.getElementById('q-card-' + qid);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.querySelectorAll('.opt').forEach(o => o.classList.remove('correct', 'wrong', 'disabled'));
        const fb = document.getElementById('fb-' + qid);
        if (fb) { fb.textContent = ''; fb.className = 'feedback'; }
        const ans = document.getElementById('ans-' + qid);
        if (ans) ans.classList.remove('show');
        const status = card.querySelector('.q-status');
        if (status) {
          const data = Storage.getData();
          const isDone = data.completed[qid] || false;
          status.textContent = isDone ? '✓ 已完成' : '○ 待完成';
          status.className = 'q-status ' + (isDone ? 'done' : 'pending');
        }
      }
      Utils.showLoading(false);
      setTimeout(() => { MathRender.renderVisible(); MathRender.observe(); }, 300);
    }, 300);
  },

  remove(qid) {
    const data = Storage.getData();
    delete data.wrongs[qid];
    Storage.saveLocalData(data);
    Sync.debounceSync(data);
    this.updateBadge();
    this.render('all', document.querySelector('.wf-btn[data-filter="all"]'));
    Utils.showToast('🗑️ 已移除该错题');
  }
};
