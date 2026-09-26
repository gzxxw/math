
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
      html += `<div class="card reveal" id="wrong-card-${qid}">
        <div class="wrong-meta">
          ${Icons.get('alert-circle', 'sm')}
          <span>错 ${item.count} 次</span>
          <span style="color:var(--text-tertiary);font-weight:400;">·</span>
          <span style="color:var(--text-secondary);font-weight:400;">最后错误: ${lastDate}</span>
          <span class="ch-tag">第${qData.ch}章 ${Utils.escapeHtml(App.chapters[qData.ch - 1])}</span>
        </div>
        <div class="q-title"><span class="q-id">${String(qid).padStart(2, '0')}</span><span style="flex:1;">${Utils.escapeHtml(qData.q)}</span></div>
        <div class="answer-box show" style="display:block;">
          <div style="margin-bottom:6px;"><span class="ans-label">${Icons.get('check-circle-2', 'sm')}正确答案：</span>${qData.ans}</div>
          <div><span class="ans-label">${Icons.get('book-text', 'sm')}解析：</span>${Utils.escapeHtml(qData.ana)}</div>
        </div>
        <div style="margin-top:12px; display:flex; gap:8px;">
          <button class="small-btn" onclick="WrongbookUI.redo(${qid})">${Icons.get('rotate-ccw', 'sm')}重做</button>
          <button class="small-btn danger" onclick="WrongbookUI.remove(${qid})">${Icons.get('trash-2', 'sm')}移除</button>
        </div>
      </div>`;
    });
    if (count === 0) html = `<div class="empty-msg">${Icons.get('sparkles', 'xl')}<span>该分类下暂无错题</span></div>`;
    wrongList.innerHTML = html;
    this.updateBadge();
    setTimeout(() => { MathRender.renderVisible(); MathRender.observe(); ScrollReveal.init(); }, 200);
  },

  updateBadge() {
    const data = Storage.getData();
    const count = Object.keys(data.wrongs).length;
    const badge = document.getElementById('wrong-badge');
    if (badge) {
      if (count > 0) { badge.style.display = 'inline-flex'; badge.textContent = count; }
      else badge.style.display = 'none';
    }
  },

  redo(qid) {
    Utils.showLoading(true, '重做…');
    setTimeout(() => {
      App.currentFilteredQuestions = App.questions.filter(q => q.id == qid);
      QuestionsUI.renderAll(App.currentFilteredQuestions);
      App.showView('all');
      const card = document.getElementById('q-card-' + qid);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.querySelectorAll('.opt').forEach(o => o.classList.remove('correct', 'wrong', 'disabled'));
        const fb = document.getElementById('fb-' + qid);
        if (fb) { fb.innerHTML = ''; fb.className = 'feedback'; }
        const ans = document.getElementById('ans-' + qid);
        if (ans) ans.classList.remove('show');
        const status = card.querySelector('.q-status');
        if (status) {
          const data = Storage.getData();
          const isDone = data.completed[qid] || false;
          status.innerHTML = (isDone ? Icons.get('check-circle-2', 'sm') : Icons.get('circle', 'sm')) + (isDone ? '已完成' : '待完成');
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
    Utils.showToast(`${Icons.get('trash-2', 'sm')} 已移除该错题`);
  }
};
