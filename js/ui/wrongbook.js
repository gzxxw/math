
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
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="vertical-align:-0.125em" aria-hidden="true"><circle cx="12" cy="12" r="6"/></svg> 错 ${item.count} 次 | 最后错误: ${lastDate} | 第${qData.ch}章 ${Utils.escapeHtml(App.chapters[qData.ch - 1])}
        </div>
        <div class="q-title">${qid}. ${Utils.escapeHtml(qData.q)}</div>
        <div class="answer-box show" style="display:block;">
          <b><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> 正确答案：</b>${qData.ans}<br>
          <b><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> 解析：</b>${Utils.escapeHtml(qData.ana)}
        </div>
        <div style="margin-top:10px; display:flex; gap:8px;">
          <button class="small-btn" onclick="WrongbookUI.redo(${qid})"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> 重做</button>
          <button class="small-btn" style="background:#e74c3c;" onclick="WrongbookUI.remove(${qid})"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> 移除</button>
        </div>
      </div>`;
    });
    if (count === 0) html = '<div class="empty-msg">' + '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em" aria-hidden="true"><path d="M5.8 11.3L2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="M22 2l-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.76-.05 1.54-.45 2.19l-1.6 2.6"/><path d="M4.9 12.6c-.3-.36-.5-.83-.5-1.35 0-1.2.98-2.18 2.18-2.18.53 0 1 .2 1.35.5"/><path d="M11.4 19.1c.36.3.83.5 1.35.5 1.2 0 2.18-.98 2.18-2.18 0-.53-.2-1-.5-1.35"/><path d="M8 6h.01"/><path d="M16 18h.01"/></svg>' + ' 该分类下暂无错题！</div>';
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
    Utils.showToast('已移除该错题');
  }
};
