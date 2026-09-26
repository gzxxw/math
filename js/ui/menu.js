
const MenuUI = {
  render() {
    const list = document.getElementById('menu-list');
    if (!list) return;
    const data = Storage.getData();
    let html = '';
    App.chapters.forEach((name, index) => {
      const chId = index + 1;
      const chQuestions = App.questions.filter(q => q.ch === chId);
      const total = chQuestions.length;
      let done = 0;
      chQuestions.forEach(q => { if (data.completed[q.id]) done++; });
      const progress = total > 0 ? `${done}/${total}` : '0/0';
      const cls = done === total && total > 0 ? 'done' : 'pending';
      html += `<div class="menu-item reveal" onclick="QuestionsUI.renderChapter(${chId})">
        <span style="display:flex;align-items:center;flex:1;min-width:0;">
          <span class="ch-num">${String(chId).padStart(3, '0')}</span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Utils.escapeHtml(name)}</span>
        </span>
        <span class="progress-indicator ${cls}">${progress}</span>
      </div>`;
    });
    list.innerHTML = html;
    ScrollReveal.init();
  }
};
