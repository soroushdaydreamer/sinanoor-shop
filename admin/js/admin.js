const content = document.getElementById('content');
const pageTitle = document.getElementById('pageTitle');
const whoAmI = document.getElementById('whoAmI');
const modalOverlay = document.getElementById('modalOverlay');
const modalBox = document.getElementById('modalBox');

const TITLES = { products: 'محصولات', categories: 'دسته‌بندی‌ها', orders: 'سفارش‌ها', users: 'کاربران' };
const fmt = n => Number(n).toLocaleString('fa-IR');
let categoriesCache = [];

function openModal(html) {
  modalBox.innerHTML = html;
  modalOverlay.classList.add('open');
}
function closeModal() { modalOverlay.classList.remove('open'); modalBox.innerHTML = ''; }
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

function setActiveTab(tab) {
  document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
  pageTitle.textContent = TITLES[tab] || '';
}

async function router() {
  const tab = (location.hash || '#products').slice(1);
  setActiveTab(tab);
  content.innerHTML = '<div class="empty">در حال بارگذاری...</div>';
  try {
    if (tab === 'products') await renderProducts();
    else if (tab === 'categories') await renderCategories();
    else if (tab === 'orders') await renderOrders();
    else if (tab === 'users') await renderUsers();
    else content.innerHTML = '<div class="empty">صفحه یافت نشد</div>';
  } catch (err) {
    content.innerHTML = `<div class="empty">خطا: ${err.message}</div>`;
  }
}
window.addEventListener('hashchange', router);

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  api.clearToken();
  window.location.href = 'login.html';
});

// ===================== محصولات =====================
async function ensureCategories() {
  const { categories } = await api.listCategories();
  categoriesCache = categories;
  return categories;
}

async function renderProducts() {
  const [{ products }] = await Promise.all([api.listProducts('?limit=100'), ensureCategories()]);
  content.innerHTML = `
    <div class="toolbar"><button class="btn btn-primary" id="addProductBtn">+ محصول جدید</button></div>
    <div class="card">
      <table>
        <thead><tr><th>#</th><th>عنوان</th><th>دسته</th><th>قیمت</th><th>قیمت قبل</th><th>موجودی</th><th>پیشنهاد ویژه</th><th></th></tr></thead>
        <tbody>
          ${products.length ? products.map(p => `
            <tr>
              <td>${p.id}</td>
              <td>${p.title}</td>
              <td>${categoriesCache.find(c => c.id === p.category_id)?.name || '—'}</td>
              <td>${fmt(p.price)}</td>
              <td>${p.old_price ? fmt(p.old_price) : '—'}</td>
              <td>${p.stock}</td>
              <td>${p.is_deal ? '✅' : '—'}</td>
              <td>
                <button class="btn btn-ghost" data-edit="${p.id}">ویرایش</button>
                <button class="btn btn-danger" data-del="${p.id}">حذف</button>
              </td>
            </tr>
          `).join('') : `<tr><td colspan="8" class="empty">محصولی ثبت نشده</td></tr>`}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('addProductBtn').addEventListener('click', () => openProductForm());
  content.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
    const p = products.find(x => x.id == btn.dataset.edit);
    openProductForm(p);
  }));
  content.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('این محصول حذف شود؟')) return;
    await api.deleteProduct(btn.dataset.del);
    router();
  }));
}

function openProductForm(p) {
  const catOptions = categoriesCache.map(c => `<option value="${c.id}" ${p?.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
  openModal(`
    <h2>${p ? 'ویرایش محصول' : 'محصول جدید'}</h2>
    <p class="form-error" id="formError"></p>
    <form id="productForm">
      <input class="field" name="title" placeholder="عنوان محصول" value="${p?.title || ''}" required>
      <select class="field" name="category_id"><option value="">بدون دسته</option>${catOptions}</select>
      <div class="form-grid">
        <input class="field" name="price" type="number" placeholder="قیمت (تومان)" value="${p?.price || ''}" required>
        <input class="field" name="old_price" type="number" placeholder="قیمت قبل (اختیاری)" value="${p?.old_price || ''}">
        <input class="field" name="stock" type="number" placeholder="موجودی" value="${p?.stock ?? 0}">
        <input class="field" name="image_url" placeholder="آدرس تصویر (اختیاری)" value="${p?.image_url || ''}">
      </div>
      <label style="font-size:13px;display:flex;align-items:center;gap:6px;margin-bottom:10px">
        <input type="checkbox" name="is_deal" ${p?.is_deal ? 'checked' : ''}> نمایش در «پیشنهاد شگفت‌انگیز»
      </label>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="cancelBtn">انصراف</button>
        <button type="submit" class="btn btn-primary">ذخیره</button>
      </div>
    </form>
  `);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      title: fd.get('title').trim(),
      category_id: fd.get('category_id') || null,
      price: Number(fd.get('price')),
      old_price: fd.get('old_price') ? Number(fd.get('old_price')) : null,
      stock: Number(fd.get('stock') || 0),
      image_url: fd.get('image_url').trim() || null,
      is_deal: fd.get('is_deal') === 'on',
    };
    try {
      if (p) await api.updateProduct(p.id, payload); else await api.createProduct(payload);
      closeModal();
      router();
    } catch (err) {
      document.getElementById('formError').textContent = err.message;
    }
  });
}

// ===================== دسته‌بندی‌ها =====================
async function renderCategories() {
  const { categories } = await api.listCategories();
  categoriesCache = categories;
  content.innerHTML = `
    <div class="toolbar"><button class="btn btn-primary" id="addCatBtn">+ دسته‌بندی جدید</button></div>
    <div class="card">
      <table>
        <thead><tr><th>#</th><th>نام</th><th>اسلاگ</th><th>آیکون</th><th>ترتیب</th><th></th></tr></thead>
        <tbody>
          ${categories.length ? categories.map(c => `
            <tr>
              <td>${c.id}</td><td>${c.name}</td><td>${c.slug}</td><td>${c.icon || '—'}</td><td>${c.sort_order}</td>
              <td>
                <button class="btn btn-ghost" data-edit="${c.id}">ویرایش</button>
                <button class="btn btn-danger" data-del="${c.id}">حذف</button>
              </td>
            </tr>
          `).join('') : `<tr><td colspan="6" class="empty">دسته‌بندی‌ای ثبت نشده</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
  document.getElementById('addCatBtn').addEventListener('click', () => openCategoryForm());
  content.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
    openCategoryForm(categories.find(x => x.id == btn.dataset.edit));
  }));
  content.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('این دسته‌بندی حذف شود؟')) return;
    await api.deleteCategory(btn.dataset.del);
    router();
  }));
}

function openCategoryForm(c) {
  openModal(`
    <h2>${c ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}</h2>
    <p class="form-error" id="formError"></p>
    <form id="catForm">
      <input class="field" name="name" placeholder="نام دسته‌بندی" value="${c?.name || ''}" required>
      <input class="field" name="slug" placeholder="اسلاگ (اختیاری، انگلیسی)" value="${c?.slug || ''}">
      <div class="form-grid">
        <input class="field" name="icon" placeholder="ایموجی آیکون (مثال: 💡)" value="${c?.icon || ''}">
        <input class="field" name="sort_order" type="number" placeholder="ترتیب نمایش" value="${c?.sort_order ?? 0}">
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="cancelBtn">انصراف</button>
        <button type="submit" class="btn btn-primary">ذخیره</button>
      </div>
    </form>
  `);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('catForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = { name: fd.get('name').trim(), slug: fd.get('slug').trim(), icon: fd.get('icon').trim(), sort_order: Number(fd.get('sort_order') || 0) };
    try {
      if (c) await api.updateCategory(c.id, payload); else await api.createCategory(payload);
      closeModal();
      router();
    } catch (err) {
      document.getElementById('formError').textContent = err.message;
    }
  });
}

// ===================== سفارش‌ها =====================
const STATUS_FA = { pending: 'در انتظار بررسی', confirmed: 'تایید شده', shipped: 'ارسال شده', delivered: 'تحویل شده', cancelled: 'لغو شده' };
const STATUS_LIST = Object.keys(STATUS_FA);

async function renderOrders() {
  const { orders } = await api.listOrders();
  content.innerHTML = `
    <div class="card">
      <table>
        <thead><tr><th>#</th><th>مشتری</th><th>موبایل</th><th>مبلغ</th><th>اقلام</th><th>وضعیت</th><th>تاریخ</th></tr></thead>
        <tbody>
          ${orders.length ? orders.map(o => `
            <tr>
              <td>${o.id}</td>
              <td>${o.user_name}</td>
              <td>${o.user_phone}</td>
              <td>${fmt(o.total_amount)} تومان</td>
              <td>${o.items.map(i => `${i.title} ×${i.qty}`).join('، ')}</td>
              <td>
                <select class="field" style="margin:0;padding:5px 8px" data-order="${o.id}">
                  ${STATUS_LIST.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${STATUS_FA[s]}</option>`).join('')}
                </select>
              </td>
              <td>${o.created_at}</td>
            </tr>
          `).join('') : `<tr><td colspan="7" class="empty">سفارشی ثبت نشده</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
  content.querySelectorAll('[data-order]').forEach(sel => sel.addEventListener('change', async () => {
    try { await api.updateOrderStatus(sel.dataset.order, sel.value); } catch (err) { alert(err.message); router(); }
  }));
}

// ===================== کاربران =====================
async function renderUsers() {
  const { users } = await api.listUsers();
  const me = api.getUser();
  content.innerHTML = `
    <div class="card">
      <table>
        <thead><tr><th>#</th><th>نام</th><th>موبایل</th><th>نقش</th><th>تاریخ عضویت</th><th></th></tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>${u.id}</td><td>${u.name}</td><td>${u.phone}</td>
              <td><span class="badge ${u.role}">${u.role === 'admin' ? 'مدیر' : 'کاربر'}</span></td>
              <td>${u.created_at}</td>
              <td>
                <button class="btn btn-ghost" data-toggle="${u.id}" data-role="${u.role}">${u.role === 'admin' ? 'تنزل به کاربر' : 'ارتقا به مدیر'}</button>
                ${u.id !== me?.id ? `<button class="btn btn-danger" data-del="${u.id}">حذف</button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  content.querySelectorAll('[data-toggle]').forEach(btn => btn.addEventListener('click', async () => {
    const newRole = btn.dataset.role === 'admin' ? 'user' : 'admin';
    try { await api.updateUserRole(btn.dataset.toggle, newRole); router(); } catch (err) { alert(err.message); }
  }));
  content.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('این کاربر حذف شود؟')) return;
    try { await api.deleteUser(btn.dataset.del); router(); } catch (err) { alert(err.message); }
  }));
}

// ===================== شروع =====================
(async function init() {
  const user = await guardAdmin();
  if (!user) return;
  whoAmI.textContent = `${user.name} (مدیر)`;
  router();
})();
