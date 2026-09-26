// ============================================================
//  scroll-reveal.js  —  Intersection Observer 板块淡入上移
//  translateY 10px + opacity，350ms ease-out
//  尊重 prefers-reduced-motion
// ============================================================

const ScrollReveal = {
  observer: null,
  initialized: false,

  init() {
    // 尊重用户系统设置：减少动效时直接显示
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
      return;
    }

    if (!this.observer) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            this.observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px'
      });
    }

    // 观察所有尚未可见的 .reveal 元素
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      this.observer.observe(el);
    });
    this.initialized = true;
  },

  refresh() {
    this.init();
  }
};

if (typeof window !== 'undefined') window.ScrollReveal = ScrollReveal;
