
const QuestionsUI = {
  renderCard(q) {
    const data = Storage.getData();
    const isDone = data.completed[q.id] || false;
    const statusClass = isDone ? 'done' : 'pending';
    const statusIcon = isDone ? Icons.get('check-circle-2', 'sm') : Icons.get('circle', 'sm');
    const statusText = isDone ? '已完成' : '待完成';
    const optsHtml = q.opts.map((opt, idx) => {
      const val = String.fromCharCode(65 + idx);
      return `<div class="opt" data-qid="${q.id}" data-val="${val}" onclick="QuestionsUI.checkAnswer(this, ${q.id}, '${q.ans}')">${Utils.escapeHtml(opt)}</div>`;
    }).join('');
    return `<div class="card reveal" id="q-card-${q.id}">
      <div class="q-title"><span class="q-id">${String(q.id).padStart(2, '0')}</span><span style="flex:1;">${Utils.escapeHtml(q.q)}</span><span class="q-status ${statusClass}">${statusIcon}${statusText}</span></div>
      ${optsHtml}
      <div class="feedback" id="fb-${q.id}"></div>
      <div class="answer-box" id="ans-${q.id}"><span class="ans-label">${Icons.get('book-text', 'sm')}解析：</span>${Utils.escapeHtml(q.ana)}</div>
    </div>`;
  },

  renderAll(filteredQs) {
    const qs = filteredQs || App.questions;
    const allList = document.getElementById('all-list');
    if (!allList) return;
    let html = '', currentCh = 0;
    qs.forEach(q => {
      if (q.ch !== currentCh) {
        currentCh = q.ch;
        const count = qs.filter(x => x.ch === currentCh).length;
        html += `<h2 class="chapter-header reveal"><span style="font-family:var(--font-mono);font-size:13px;color:var(--text-tertiary);font-weight:400;">${String(currentCh).padStart(2, '0')}</span>${Utils.escapeHtml(App.chapters[currentCh - 1])} <span class="tag-chapter">${count}题</span></h2>`;
      }
      html += this.renderCard(q);
    });
    allList.innerHTML = html || `<div class="empty-msg">${Icons.get('search', 'xl')}<span>未找到匹配的题目</span></div>`;
    setTimeout(() => { MathRender.renderVisible(); MathRender.observe(); ScrollReveal.init(); }, 300);
  },

  renderChapter(chId) {
    const chQuestions = App.questions.filter(q => q.ch === chId);
    if (!chQuestions.length) { Utils.showToast('本章暂无题目'); return; }
    Utils.showLoading(true, '加载题目…');
    setTimeout(() => {
      App.currentFilteredQuestions = chQuestions;
      const allList = document.getElementById('all-list');
      let html = `<h2 class="chapter-header reveal"><span style="font-family:var(--font-mono);font-size:13px;color:var(--text-tertiary);font-weight:400;">${String(chId).padStart(2, '0')}</span>${Utils.escapeHtml(App.chapters[chId - 1])} <span class="tag-chapter">${chQuestions.length}题</span></h2>`;
      html += chQuestions.map(q => this.renderCard(q)).join('');
      allList.innerHTML = html;
      document.getElementById('searchInput').value = '';
      App.showView('all');
      Utils.showLoading(false);
      setTimeout(() => { MathRender.renderVisible(); MathRender.observe(); ScrollReveal.init(); }, 300);
    }, 200);
  },

  checkAnswer(el, qid, correctAns) {
    const card = document.getElementById('q-card-' + qid);
    if (!card) return;
    const opts = card.querySelectorAll('.opt');
    const selected = el.getAttribute('data-val');
    if (el.classList.contains('disabled')) return;
    opts.forEach(o => o.classList.add('disabled'));
    const fb = document.getElementById('fb-' + qid);
    const ansBox = document.getElementById('ans-' + qid);

    this.markAsDone(qid);
    if (selected === correctAns) {
      el.classList.add('correct');
      fb.innerHTML = `${Icons.get('check-circle-2', 'md')}回答正确！`;
      fb.className = 'feedback show correct-fb';
      AudioMgr.playCorrect();
      AudioMgr.speak(correctPhrases);
    } else {
      el.classList.add('wrong');
      opts.forEach(o => { if (o.getAttribute('data-val') === correctAns) o.classList.add('correct'); });
      fb.innerHTML = `${Icons.get('x-circle', 'md')}回答错误，正确答案是 ${correctAns}`;
      fb.className = 'feedback show wrong-fb';
      AudioMgr.playWrong();
      AudioMgr.speak(wrongPhrases);
      this.markWrong(qid);
    }
    ansBox.classList.add('show');
    const statusSpan = card.querySelector('.q-status');
    if (statusSpan) { statusSpan.innerHTML = Icons.get('check-circle-2', 'sm') + '已完成'; statusSpan.className = 'q-status done'; }
    StatsUI.update();
    WrongbookUI.updateBadge();
    MenuUI.render();
    setTimeout(() => { ansBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 150);
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
      MathJax.typesetPromise([card]).catch(() => {});
    }
  },

  markAsDone(qid) {
    const data = Storage.getData();
    data.completed[qid] = true;
    const today = Utils.getTodayKey();
    if (!data.daily[today]) data.daily[today] = { done: [], wrong: [] };
    if (!data.daily[today].done.includes(Number(qid))) data.daily[today].done.push(Number(qid));
    Storage.saveLocalData(data);
    Sync.debounceSync(data);
  },

  markWrong(qid) {
    const data = Storage.getData();
    const now = Date.now();
    if (data.wrongs[qid]) {
      data.wrongs[qid].count++;
      data.wrongs[qid].lastTime = now;
    } else {
      data.wrongs[qid] = { count: 1, lastTime: now };
    }
    const today = Utils.getTodayKey();
    if (!data.daily[today]) data.daily[today] = { done: [], wrong: [] };
    if (!data.daily[today].wrong.includes(Number(qid))) data.daily[today].wrong.push(Number(qid));
    Storage.saveLocalData(data);
    Sync.debounceSync(data);
  },

  filter() {
    const query = (document.getElementById('searchInput').value || '').trim().toLowerCase();
    if (!query) {
      App.currentFilteredQuestions = [...App.questions];
      this.renderAll(App.currentFilteredQuestions);
      return;
    }
    App.currentFilteredQuestions = App.questions.filter(q => {
      const chName = App.chapters[q.ch - 1] || '';
      const fullText = `${q.id} ${q.q} ${q.opts.join(' ')} ${q.ana} ${chName} ${q.ch}`.toLowerCase();
      return fullText.includes(query);
    });
    this.renderAll(App.currentFilteredQuestions);
    Utils.showToast(`${Icons.get('search', 'sm')} 找到 ${App.currentFilteredQuestions.length} 道匹配题目`);
  },

  random() {
    const data = Storage.getData();
    const undone = App.questions.filter(q => !data.completed[q.id]);
    const pool = undone.length > 0 ? undone : App.questions;
    const randomQ = pool[Math.floor(Math.random() * pool.length)];
    App.currentFilteredQuestions = [randomQ];
    this.renderAll(App.currentFilteredQuestions);
    App.showView('all');
    document.getElementById('searchInput').value = '';
    setTimeout(() => {
      const card = document.getElementById('q-card-' + randomQ.id);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.borderColor = 'var(--primary)';
        card.style.boxShadow = '0 0 0 3px rgba(44,95,78,0.15)';
        setTimeout(() => { card.style.borderColor = ''; card.style.boxShadow = ''; }, 2000);
      }
    }, 400);
    const label = undone.length > 0 ? `未完成(${undone.length}道)` : '全部';
    Utils.showToast(`${Icons.get('shuffle', 'sm')} 随机抽取一题（${label}）`);
  }
};
