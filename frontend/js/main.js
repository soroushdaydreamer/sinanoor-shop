// ===== Off-canvas menu =====
const body = document.getElementById('body');
const menuOpen = document.getElementById('menuOpen');
const menuClose = document.getElementById('menuClose');
const menuOverlay = document.getElementById('menuOverlay');

function openMenu(){ body.setAttribute('dir-open','1'); }
function closeMenu(){ body.removeAttribute('dir-open'); }

menuOpen && menuOpen.addEventListener('click', openMenu);
menuClose && menuClose.addEventListener('click', closeMenu);
menuOverlay && menuOverlay.addEventListener('click', closeMenu);

// ===== Hero slider =====
const slider = document.getElementById('slider');
if (slider) {
  const slides = Array.from(slider.querySelectorAll('.slide'));
  const dotsWrap = document.getElementById('dots');
  slides.forEach((_, i) => {
    const d = document.createElement('span');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    dotsWrap.appendChild(d);
  });
  const dots = Array.from(dotsWrap.children);
  let current = 0;

  function goTo(i) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = i;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  setInterval(() => goTo((current + 1) % slides.length), 4200);
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
}

// ===== Fallback sample data (وقتی API در دسترس نیست) =====
const fallbackProducts = [
  { id: 1, title: 'چندراهی ۶ خانه با محافظ برق', price: 385000, old_price: 460000, ph: 'ph-1', is_deal: 1 },
  { id: 2, title: 'آیفون تصویری دو واحدی رنگی', price: 2450000, old_price: 2890000, ph: 'ph-2', is_deal: 1 },
  { id: 3, title: 'پنل LED مربعی ۲۴ وات پارس شعاع توس', price: 195000, old_price: null, ph: 'ph-3', is_deal: 0 },
  { id: 4, title: 'لامپ COB هالوژنی ۱۲ وات', price: 118000, old_price: 149000, ph: 'ph-4', is_deal: 1 },
  { id: 5, title: 'کلید و پریز سری آوا', price: 62000, old_price: null, ph: 'ph-5', is_deal: 0 },
  { id: 6, title: 'چراغ خطی سقفی ۶۰ سانت', price: 275000, old_price: 320000, ph: 'ph-1', is_deal: 0 },
  { id: 7, title: 'محافظ ولتاژ یخچالی', price: 340000, old_price: null, ph: 'ph-2', is_deal: 0 },
  { id: 8, title: 'آیفون صوتی تک واحدی', price: 890000, old_price: 990000, ph: 'ph-3', is_deal: 0 },
  { id: 9, title: 'پروژکتور LED ۵۰ وات ضدآب', price: 410000, old_price: 470000, ph: 'ph-4', is_deal: 0 },
  { id: 10, title: 'ریسه نواری هوشمند ۵ متری', price: 275000, old_price: null, ph: 'ph-5', is_deal: 0 },
];
const PH_CLASSES = ['ph-1', 'ph-2', 'ph-3', 'ph-4', 'ph-5'];

function fmt(n){ return Number(n).toLocaleString('fa-IR'); }

function offPercent(p){
  if (!p.old_price) return null;
  return Math.round((1 - p.price / p.old_price) * 100);
}

function renderGrid(elId, items){
  const grid = document.getElementById(elId);
  if (!grid) return;
  grid.innerHTML = items.map((p, i) => {
    const off = offPercent(p);
    const ph = p.ph || PH_CLASSES[i % PH_CLASSES.length];
    const thumb = p.image_url
      ? `<img src="${p.image_url}" alt="${p.title}" loading="lazy">`
      : `<span class="ph ${ph}"></span>`;
    return `
    <div class="product-card" data-id="${p.id}">
      <div class="thumb">
        ${off ? `<span class="badge-off">${off}%-</span>` : ''}
        <button class="badge-fav" aria-label="افزودن به علاقه‌مندی">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4.5 5.6 4c2-.3 3.6.7 4.4 2.2C10.8 4.7 12.4 3.7 14.4 4 18 4.5 19.6 8 22 11.7 19.5 16.4 12 21 12 21z"/></svg>
        </button>
        ${thumb}
      </div>
      <div class="product-info">
        <div class="title">${p.title}</div>
        <div class="price-row">
          ${p.old_price ? `<span class="price-old">${fmt(p.old_price)}</span>` : ''}
          <span class="price-new">${fmt(p.price)}</span>
        </div>
        <button class="btn-add-cart" data-add="${p.id}">افزودن به سبد</button>
      </div>
    </div>
  `;
  }).join('');

  // اتصال دکمه‌های «افزودن به سبد» به داده‌ی همین آیتم‌ها (برای قیمت/تصویر صحیح)
  grid.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = items.find(x => String(x.id) === btn.dataset.add);
      if (!p || !window.cart) return;
      window.cart.add(p, 1);
      btn.textContent = 'به سبد اضافه شد ✓';
      setTimeout(() => { btn.textContent = 'افزودن به سبد'; }, 1200);
    });
  });
}

async function loadProducts(){
  try {
    if (!window.api) throw new Error('api.js not loaded');
    const [dealsRes, allRes] = await Promise.all([
      api.listProducts('?deal=1&limit=5'),
      api.listProducts('?limit=10'),
    ]);
    renderGrid('dealsGrid', dealsRes.products);
    const bestList = allRes.products.filter(p => !dealsRes.products.some(d => d.id === p.id)).slice(0, 5);
    renderGrid('bestGrid', bestList.length ? bestList : allRes.products.slice(0, 5));
  } catch (err) {
    // بک‌اند در دسترس نیست یا هنوز دیپلوی نشده — از داده‌ی نمونه استفاده می‌کنیم
    const deals = fallbackProducts.filter(p => p.is_deal);
    renderGrid('dealsGrid', deals);
    renderGrid('bestGrid', fallbackProducts.filter(p => !p.is_deal));
  }
}

loadProducts();

// ===== وضعیت ورود در هدر و ناوبری پایین =====
(function reflectAuthState(){
  if (!window.api || !api.isLoggedIn()) return;
  const user = api.getUser();
  document.querySelectorAll('a[href="login.html"], a[href="/login.html"]').forEach(el => {
    if (el.closest('.bottom-nav') || el.closest('.icon-btn')) {
      el.href = 'account.html';
      if (el.textContent.includes('ورود')) el.textContent = user?.name ? user.name.split(' ')[0] : 'حساب من';
    }
  });
})();
