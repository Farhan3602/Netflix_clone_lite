// Email subscription UX: basic validation + demo alert
const form = document.querySelector('.email-form');
const emailInput = document.getElementById('email');
const help = document.querySelector('.form-help');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      help.textContent = 'Please enter a valid email address.';
      emailInput.focus();
      return;
    }
    help.textContent = '';
    alert('Subscription feature coming soon!');
  });

  emailInput.addEventListener('input', () => help.textContent = '');
}

// FAQ accordion with aria support
document.querySelectorAll('.faq-item').forEach((item) => {
  const btn = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');

  // Initialize ARIA
  btn.setAttribute('aria-expanded', 'false');
  answer.setAttribute('aria-hidden', 'true');

  btn.addEventListener('click', () => {
    const isActive = item.classList.contains('active');

    // Collapse others
    document.querySelectorAll('.faq-item').forEach((other) => {
      if (other !== item) {
        other.classList.remove('active');
        const ob = other.querySelector('.faq-question');
        const oa = other.querySelector('.faq-answer');
        ob.setAttribute('aria-expanded', 'false');
        oa.setAttribute('aria-hidden', 'true');
      }
    });

    // Toggle current
    item.classList.toggle('active', !isActive);
    btn.setAttribute('aria-expanded', String(!isActive));
    answer.setAttribute('aria-hidden', String(isActive));
  });

  // Keyboard support (Enter/Space already works on button, this is extra for clarity)
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = Array.from(document.querySelectorAll('.faq-question'));
      const idx = items.indexOf(btn);
      const next = e.key === 'ArrowDown' ? items[idx + 1] : items[idx - 1];
      if (next) next.focus();
    }
  });
});
