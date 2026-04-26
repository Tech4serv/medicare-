import { FULL_PRODUCT_LIST } from './productsData.js';
import { cartManager } from './cartManager.js';

const GS_ENDPOINT = atob('aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4UkdOdEtOeDVpWmdvcG5VSGhDZktQVEJOUDlUM1J4U2VORmgtalhrSFJLQW1LWlJTWHExbmFxQ1Vza2YwcWdBdkwvZXhlYw==');

let cartItems = JSON.parse(localStorage.getItem('medicare_cart') || '[]');
let selectedShippingCost = 45;

function saveCart() { localStorage.setItem('medicare_cart', JSON.stringify(cartItems)); }

function addToCart(product, event) {
  const existing = cartItems.find(i => i.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cartItems.push({ ...product, quantity: 1 });
  }
  saveCart();
  updateCartUI();
  
  if (event && event.target) {
    const btn = event.target.closest('.add-to-cart');
    if (btn) {
      btn.classList.add('cart-animation');
      setTimeout(() => btn.classList.remove('cart-animation'), 400);
    }
  }
  
  const cartBtn = document.getElementById('cartIconBtn');
  if (cartBtn) {
    cartBtn.style.transform = 'scale(1.15)';
    setTimeout(() => { cartBtn.style.transform = ''; }, 300);
  }
  
  showToast(`${product.name} added to cart! 🎉`, false);
  
  fetch(GS_ENDPOINT, {
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
}

function updateCartUI() {
  const totalQty = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const badge = document.getElementById('cartCountBadge');
  if (badge) badge.innerText = totalQty;
  
  const cartContainer = document.getElementById('cartItemsList');
  if (!cartContainer) return;
  
  if (cartItems.length === 0) {
    cartContainer.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-bag"></i><p>Your cart is empty</p></div>';
  } else {
    cartContainer.innerHTML = cartItems.map((item, idx) => `
      <div class="cart-item">
        <div><strong>${item.name}</strong><small>$${item.price} x${item.quantity}</small></div>
        <div>$${(item.price * item.quantity).toFixed(2)} <button class="remove-item" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button></div>
      </div>
    `).join('');
    
    document.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        cartItems.splice(idx, 1);
        saveCart();
        updateCartUI();
        computeCartTotal();
        showToast('Item removed', false);
      });
    });
  }
  computeCartTotal();
}

function computeCartTotal() {
  const subtotal = cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const total = subtotal + selectedShippingCost;
  const totalEl = document.getElementById('cartTotalAmount');
  const subEl = document.getElementById('cartSubtotal');
  const shipEl = document.getElementById('cartShippingCost');
  
  if (subEl) subEl.innerText = subtotal.toFixed(2);
  if (shipEl) shipEl.innerText = selectedShippingCost.toFixed(2);
  if (totalEl) totalEl.innerText = total.toFixed(2);
  return total;
}

function renderProducts(filterCategory = 'all', searchQuery = '') {
  const container = document.getElementById('productsGridContainer');
  if (!container) return;
  
  let products = FULL_PRODUCT_LIST;
  
  if (filterCategory !== 'all') {
    products = products.filter(p => p.category === filterCategory);
  }
  
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.desc.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }
  
  if (products.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>No products found</h3>
        <p>Try adjusting your search or filter criteria</p>
      </div>`;
    return;
  }
  
  container.innerHTML = products.map(p => `
    <div class="product-card" data-aos="fade-up">
      <span class="product-badge">${p.supply}</span>
      <img src="${p.image}" alt="${p.name}" class="product-image" loading="lazy" />
      <div class="product-info">
        <span class="product-category">${p.category}</span>
        <h3 class="product-title">${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-price-row">
          <div class="product-price">$${p.price.toFixed(2)}</div>
          <div class="product-supply">${p.supply}</div>
        </div>
        <button class="add-to-cart" data-id="${p.id}">
          <i class="fas fa-cart-shopping"></i> <span>Add to Cart</span>
        </button>
      </div>
    </div>
  `).join('');
  
  document.querySelectorAll('#productsGridContainer .add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(btn.dataset.id);
      const product = FULL_PRODUCT_LIST.find(p => p.id === id);
      if (product) addToCart(product, e);
    });
  });
}

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

function showToast(msg, isError = false) {
  const container = document.getElementById('toastMsgContainer');
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.style.background = isError ? '#e34d4c' : '#27ae60';
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  updateCartUI();
  setupDarkMode();
  
  // Search
  const searchInput = document.getElementById('medicineSearch');
  let searchTimeout;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
      renderProducts(activeCategory, searchInput.value);
    }, 300);
  });
  
  // Category filters
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts(btn.dataset.category, searchInput?.value || '');
    });
  });
  
  // Cart
  document.getElementById('cartIconBtn')?.addEventListener('click', openCart);
  document.getElementById('closeCartBtn')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
  
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
  
  // AOS
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('aos-animate');
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));
});