// Shared JavaScript for about, blog, contact pages
const GS_ENDPOINT = atob('aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4UkdOdEtOeDVpWmdvcG5VSGhDZktQVEJOUDlUM1J4U2VORmgtalhrSFJLQW1LWlJTWHExbmFxQ1Vza2YwcWdBdkwvZXhlYw==');

function setupDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    if (toggle) toggle.checked = true;
  }
  toggle?.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  });
}

function setupContactForm() {
  const form = document.getElementById('contactForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    try {
      await fetch(GS_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          name: form.name.value,
          email: form.email.value,
          phone: form.phone.value,
          subject: form.subject.value,
          message: form.message.value,
          timestamp: new Date().toISOString()
        })
      });
      
      showToast('Message sent successfully! ✅', false);
      form.reset();
    } catch(e) {
      showToast('Error sending message. Please try again.', true);
    }
    
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  });
}

function showToast(msg, isError = false) {
  const container = document.createElement('div');
  container.id = 'toastMsgContainer';
  document.body.appendChild(container);
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    padding: 14px 28px;
    border-radius: 60px;
    z-index: 3000;
    font-weight: 600;
    animation: toastSlide 0.3s ease, toastFade 0.3s ease 2.7s forwards;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    background: ${isError ? '#e34d4c' : '#27ae60'};
    color: white;
    pointer-events: none;
  `;
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupDarkMode();
  setupContactForm();
  
  // Mobile menu
  document.getElementById('hamburgerBtn')?.addEventListener('click', () => {
    document.getElementById('navMenu').classList.toggle('active');
  });
  
  // Chat widget
  document.getElementById('chatToggle')?.addEventListener('click', () => {
    document.getElementById('chatBox').classList.toggle('open');
  });
  document.getElementById('chatClose')?.addEventListener('click', () => {
    document.getElementById('chatBox').classList.remove('open');
  });
  
  // Cart count
  const cart = JSON.parse(localStorage.getItem('medicare_cart') || '[]');
  const totalQty = cart.reduce((sum, i) => sum + i.quantity, 0);
  const badge = document.getElementById('cartCountBadge');
  if (badge) badge.innerText = totalQty;
});