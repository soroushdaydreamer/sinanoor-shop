// سبد خرید — ذخیره در localStorage (کلاینت‌ساید)، هنگام ثبت سفارش با API هماهنگ می‌شود
const CART_KEY = 'sn_cart';

function cartGet() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}
function cartSave(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  cartUpdateBadges();
}
function cartCount(items) {
  return (items || cartGet()).reduce((sum, i) => sum + i.qty, 0);
}
function cartAdd(product, qty = 1) {
  const items = cartGet();
  const existing = items.find(i => i.product_id === product.id);
  if (existing) existing.qty += qty;
  else items.push({ product_id: product.id, title: product.title, price: product.price, image_url: product.image_url || null, ph: product.ph || null, qty });
  cartSave(items);
}
function cartSetQty(productId, qty) {
  let items = cartGet();
  if (qty <= 0) items = items.filter(i => i.product_id !== productId);
  else items = items.map(i => i.product_id === productId ? { ...i, qty } : i);
  cartSave(items);
}
function cartRemove(productId) { cartSetQty(productId, 0); }
function cartClear() { cartSave([]); }
function cartTotal(items) { return (items || cartGet()).reduce((sum, i) => sum + i.price * i.qty, 0); }

function cartUpdateBadges() {
  const count = cartCount();
  document.querySelectorAll('#headerCartBadge, #bottomCartBadge').forEach(el => {
    if (!el) return;
    el.textContent = count > 99 ? '99+' : String(count);
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}
document.addEventListener('DOMContentLoaded', cartUpdateBadges);

window.cart = { get: cartGet, save: cartSave, count: cartCount, add: cartAdd, setQty: cartSetQty, remove: cartRemove, clear: cartClear, total: cartTotal, updateBadges: cartUpdateBadges };
