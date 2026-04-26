// Shared cart manager
export const cartManager = {
  items: JSON.parse(localStorage.getItem('medicare_cart') || '[]'),
  shippingCost: 45,
  
  save() {
    localStorage.setItem('medicare_cart', JSON.stringify(this.items));
  },
  
  add(product) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({ ...product, quantity: 1 });
    }
    this.save();
    return this;
  },
  
  remove(index) {
    this.items.splice(index, 1);
    this.save();
    return this;
  },
  
  getTotalQty() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  },
  
  getSubtotal() {
    return this.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  },
  
  getTotal() {
    return this.getSubtotal() + this.shippingCost;
  },
  
  clear() {
    this.items = [];
    this.save();
  }
};