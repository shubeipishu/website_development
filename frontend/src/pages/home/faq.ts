export function initFAQ() {
  document.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest<HTMLElement>('.faq-item');
      if (!item) return;

      const isActive = item.classList.contains('active');

      document.querySelectorAll('.faq-item.active').forEach((activeItem) => {
        activeItem.classList.remove('active');
      });

      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

export async function loadFAQData(lang: 'zh' | 'en' = 'zh') {
  const faqList = document.getElementById('faq-list');
  if (!faqList) return;

  try {
    const primaryUrl = lang === 'en' ? '/data/faq.en.json' : '/data/faq.json';
    let response = await fetch(primaryUrl);
    if (!response.ok && lang === 'en') {
      response = await fetch('/data/faq.json');
    }
    if (!response.ok) return;

    const faqData = await response.json();
    renderFAQ(faqData);
  } catch (error) {
    console.log('FAQ data not available, using static content');
  }
}

function renderFAQ(faqData: Array<{ question: string; answer: string }>) {
  const faqList = document.getElementById('faq-list');
  if (!faqList || !faqData.length) return;

  faqList.innerHTML = faqData
    .map(
      (item) => `
        <div class="faq-item">
            <button class="faq-question">
                <span>${item.question}</span>
                <span class="faq-icon">+</span>
            </button>
            <div class="faq-answer">
                <div class="faq-answer-inner">${item.answer}</div>
            </div>
        </div>
    `
    )
    .join('');

  initFAQ();
}
