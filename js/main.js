import { FULL_PRODUCT_LIST } from './productsData.js';

// Google Sheets endpoint (obfuscated)
const GS_ENDPOINT = atob('aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4UkdOdEtOeDVpWmdvcG5VSGhDZktQVEJOUDlUM1J4U2VORmgtalhrSFJLQW1LWlJTWHExbmFxQ1Vza2YwcWdBdkwvZXhlYw==');

let cartItems = JSON.parse(localStorage.getItem('medicare_cart') || '[]');
let selectedShippingCost = 45;

// Save cart
function saveCart() {
  localStorage.setItem('medicare_cart', JSON.stringify(cartItems));
}

// Add to cart with animation
function addToCart(product, event) {
  const existing = cartItems.find(i => i.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cartItems.push({ ...product, quantity: 1 });
  }
  saveCart();
  updateCartUI();
  
  // Button animation
  if (event && event.target) {
    const btn = event.target.closest('.add-to-cart');
    if (btn) {
      btn.classList.add('cart-animation');
      setTimeout(() => btn.classList.remove('cart-animation'), 400);
    }
  }
  
  // Cart icon animation
  const cartBtn = document.getElementById('cartIconBtn');
  if (cartBtn) {
    cartBtn.style.transform = 'scale(1.15)';
    setTimeout(() => { cartBtn.style.transform = ''; }, 300);
  }
  
  showToast(`${product.name} added to cart! 🎉`, false);
  
  // Send to Google Sheets
  sendCartUpdateToSheet(product);
}

// Update cart UI
function updateCartUI() {
  const totalQty = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const badges = document.querySelectorAll('#cartCountBadge');
  badges.forEach(b => b.innerText = totalQty);
  
  const cartContainer = document.getElementById('cartItemsList');
  if (!cartContainer) return;
  
  if (cartItems.length === 0) {
    cartContainer.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-bag"></i>
        <p>Your cart is empty</p>
        <small>Add items to get started</small>
      </div>`;
  } else {
    cartContainer.innerHTML = cartItems.map((item, idx) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <strong>${item.name}</strong>
          <small>$${item.price.toFixed(2)} x ${item.quantity}</small>
        </div>
        <div class="cart-item-actions">
          <span>$${(item.price * item.quantity).toFixed(2)}</span>
          <button class="remove-item" data-idx="${idx}" aria-label="Remove item">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `).join('');
    
    // Add remove listeners
    document.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        const removedItem = cartItems[idx];
        cartItems.splice(idx, 1);
        saveCart();
        updateCartUI();
        computeCartTotal();
        showToast(`${removedItem.name} removed`, false);
      });
    });
  }
  
  computeCartTotal();
}

// Compute cart total
function computeCartTotal() {
  const subtotal = cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const total = subtotal + selectedShippingCost;
  
  const subEl = document.getElementById('cartSubtotal');
  const shipEl = document.getElementById('cartShippingCost');
  const totalEl = document.getElementById('cartTotalAmount');
  
  if (subEl) subEl.innerText = subtotal.toFixed(2);
  if (shipEl) shipEl.innerText = selectedShippingCost.toFixed(2);
  if (totalEl) totalEl.innerText = total.toFixed(2);
  
  return total;
}

// Send cart update to Google Sheets
async function sendCartUpdateToSheet(product) {
  try {
    await fetch(GS_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'cart_add',
        product: product.name,
        price: product.price,
        timestamp: new Date().toISOString()
      })
    });
  } catch(e) {
    // Silent fail
  }
}

// PayPal checkout
function paypalCheckout() {
  if (cartItems.length === 0) {
    showToast("Your cart is empty", true);
    return;
  }
  
  const subtotal = cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const total = subtotal + selectedShippingCost;
  const orderId = "MC-" + Math.floor(Math.random() * 90000 + 10000);
  const itemsSummary = cartItems.map(i => `${i.name} x${i.quantity}`).join(', ');
  
  // Send order to sheets
  fetch(GS_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'order',
      orderId,
      items: itemsSummary,
      subtotal: subtotal.toFixed(2),
      shippingCost: selectedShippingCost,
      totalAmount: total.toFixed(2),
      timestamp: new Date().toISOString(),
      status: 'pending'
    })
  });
  
  // Store pending order
  sessionStorage.setItem('pendingOrder', JSON.stringify({ orderId, cart: cartItems, total }));
  
  // Redirect to PayPal sandbox
  window.location.href = `https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_xclick&business=sb-7k6zg37418146@business.example.com&item_name=MediCare+Order+${orderId}&amount=${total.toFixed(2)}&currency_code=USD&return=${window.location.origin}/index.html?payment=success&cancel_return=${window.location.origin}/index.html?payment=cancelled`;
}

// Shipping selection
function setupShipping() {
  const shipSelect = document.getElementById('cartShipSelect');
  if (shipSelect) {
    shipSelect.addEventListener('change', (e) => {
      selectedShippingCost = parseFloat(e.target.value);
      computeCartTotal();
    });
  }
  
  document.querySelectorAll('.ship-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.ship-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      selectedShippingCost = parseFloat(card.dataset.shipCost);
      computeCartTotal();
    });
  });
}

// Dark mode
function setupDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  const body = document.body;
  
  if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark');
    if (toggle) toggle.checked = true;
  }
  
  toggle?.addEventListener('change', (e) => {
    if (e.target.checked) {
      body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  });
}

// Toast notification
function showToast(msg, isError = false) {
  const container = document.getElementById('toastMsgContainer');
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.style.background = isError ? '#e34d4c' : '#27ae60';
  toast.style.color = 'white';
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Cart sidebar
function openCart() {
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

// Featured products
function renderFeaturedProducts() {
  const container = document.getElementById('featuredGrid');
  if (!container) return;
  
  const featured = FULL_PRODUCT_LIST.slice(0, 6);
  container.innerHTML = featured.map(p => `
    <div class="product-card" data-aos="fade-up">
      <img src="${p.image}" alt="${p.name}" class="product-image" loading="lazy" />
      <div class="product-info">
        <span class="product-category">${p.category}</span>
        <h3 class="product-title">${p.name}</h3>
        <p class="product-desc">${p.desc.substring(0, 100)}...</p>
        <div class="product-price-row">
          <div class="product-price">$${p.price.toFixed(2)}</div>
          <div class="product-supply">${p.supply}</div>
        </div>
        <button class="add-to-cart" data-id="${p.id}">
          <i class="fas fa-cart-shopping"></i> Add to Cart
        </button>
      </div>
    </div>
  `).join('');
  
  document.querySelectorAll('#featuredGrid .add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(btn.dataset.id);
      const product = FULL_PRODUCT_LIST.find(p => p.id === id);
      if (product) addToCart(product, e);
    });
  });
}

// FAQ Accordion
function setupFAQ() {
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const isActive = item.classList.contains('active');
      
      // Close all
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      
      // Open clicked if not already open
      if (!isActive) item.classList.add('active');
    });
  });
}

// Stats Counter
function animateStats() {
  const stats = document.querySelectorAll('.stat-number');
  stats.forEach(stat => {
    const target = parseInt(stat.dataset.count);
    const suffix = stat.dataset.count === '100' ? '%' : '';
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        stat.innerText = target + suffix;
        clearInterval(timer);
      } else {
        stat.innerText = Math.floor(current) + suffix;
      }
    }, 30);
  });
}

// AOS Animation
function setupAOS() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('aos-animate');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  
  document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));
}

// Hero Particles
function createHeroParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
      width: ${Math.random() * 10 + 5}px;
      height: ${Math.random() * 10 + 5}px;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation-delay: ${Math.random() * 6}s;
      animation-duration: ${Math.random() * 4 + 4}s;
    `;
    container.appendChild(particle);
  }
}

// Chat widget
function setupChatWidget() {
  const toggle = document.getElementById('chatToggle');
  const box = document.getElementById('chatBox');
  const close = document.getElementById('chatClose');
  
  toggle?.addEventListener('click', () => box.classList.toggle('open'));
  close?.addEventListener('click', () => box.classList.remove('open'));
}

// Check payment status
function checkPaymentStatus() {
  const params = new URLSearchParams(window.location.search);
  const payment = params.get('payment');
  
  if (payment === 'success') {
    const pending = JSON.parse(sessionStorage.getItem('pendingOrder') || '{}');
    if (pending.orderId) {
      showToast(`Payment successful! Order #${pending.orderId} confirmed. ✅`, false);
      cartItems = [];
      saveCart();
      updateCartUI();
      sessionStorage.removeItem('pendingOrder');
      
      // Update sheet
      fetch(GS_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment_success',
          orderId: pending.orderId,
          status: 'completed',
          timestamp: new Date().toISOString()
        })
      });
    }
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (payment === 'cancelled') {
    showToast('Payment cancelled. Your cart is saved.', true);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Contact form
function setupContactForm() {
  const form = document.getElementById('contactForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
      type: 'contact',
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      subject: form.subject.value,
      message: form.message.value,
      timestamp: new Date().toISOString()
    };
    
    await fetch(GS_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    showToast('Message sent successfully! We\'ll get back to you soon. 📧', false);
    form.reset();
  });
}

// Newsletter form
function setupNewsletterForm() {
  const form = document.getElementById('newsletterForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]').value;
    
    await fetch(GS_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'newsletter',
        email,
        timestamp: new Date().toISOString()
      })
    });
    
    showToast('Subscribed! Stay tuned for updates 🎉', false);
    form.reset();
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  setupShipping();
  setupDarkMode();
  setupFAQ();
  setupAOS();
  setupChatWidget();
  setupContactForm();
  setupNewsletterForm();
  createHeroParticles();
  renderFeaturedProducts();
  checkPaymentStatus();
  
  // Cart buttons
  document.getElementById('cartIconBtn')?.addEventListener('click', openCart);
  document.getElementById('closeCartBtn')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
  document.getElementById('checkoutFinalBtn')?.addEventListener('click', paypalCheckout);
  
  // Mobile menu
  const hamburger = document.getElementById('hamburgerBtn');
  const navMenu = document.getElementById('navMenu');
  hamburger?.addEventListener('click', () => navMenu.classList.toggle('active'));
  
  // Close mobile menu on link click
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navMenu.classList.remove('active'));
  });
  
  // Stats observer
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateStats();
        statsObserver.disconnect();
      }
    });
  });
  const statsSection = document.querySelector('.stats-section');
  if (statsSection) statsObserver.observe(statsSection);
  
  // Swiper
  if (typeof Swiper !== 'undefined') {
    new Swiper('.testimonials-slider', {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: true,
      pagination: { el: '.swiper-pagination', clickable: true },
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      breakpoints: { 768: { slidesPerView: 2 } }
    });
  }
  
  // Make addToCart globally accessible
  window.addToCart = addToCart;
});