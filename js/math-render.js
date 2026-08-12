
const MathRender = {
  observer: null,

  renderVisible() {
    if (typeof MathJax === 'undefined' || !MathJax.typesetPromise) return;
    const cards = document.querySelectorAll('.card:not(.math-rendered)');
    if (cards.length === 0) return;
    const batchSize = 5;
    const batches = [];
    for (let i = 0; i < cards.length; i += batchSize) {
      batches.push(Array.from(cards).slice(i, i + batchSize));
    }
    batches.forEach((batch, idx) => {
      setTimeout(() => {
        MathJax.typesetPromise(batch).then(() => {
          batch.forEach(el => el.classList.add('math-rendered'));
        }).catch(() => {});
      }, idx * 100);
    });
  },

  setupObserver() {
    if (this.observer) this.observer.disconnect();
    this.observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .map(e => e.target)
        .filter(el => !el.classList.contains('math-rendered'));
      if (visible.length > 0 && typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise(visible).then(() => {
          visible.forEach(el => el.classList.add('math-rendered'));
        }).catch(() => {});
      }
    }, { rootMargin: '100px' });
    document.querySelectorAll('.card').forEach(card => this.observer.observe(card));
  },

  observe() {
    if (this.observer) this.observer.disconnect();
    this.setupObserver();
  }
};
