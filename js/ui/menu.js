
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
      const progress = total > 0 ? `(${done}/${total})` : '(0/0)';
      const cls = done === total && total > 0 ? 'done' : 'pending';
      html += `<div class="menu-item" onclick="QuestionsUI.renderChapter(${chId})">
        <span>${Utils.escapeHtml(chId + '. ' + name)}</span>
        <span class="progress-indicator ${cls}">${progress}</span>
      </div>`;
    });
    list.innerHTML = html;
  }
};
