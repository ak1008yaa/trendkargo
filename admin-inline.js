
    const DEFAULT_HASH = "e03896efeec0a98c9ebe92ed37bafd43ac96900dec57c6af58d1f04787e8ea9b";
    const ADMIN_USER = "admin"; // نام کاربری ورود

    async function hash(msg) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function apiRequest(path, options = {}) {
      const base = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : '';
      const isForm = !options.headers || !(options.headers['Content-Type'] || options.headers['content-type']);
      const headers = { ...(options.headers || {}) };
      if (options.body && isForm) {
        headers['Content-Type'] = 'application/json';
      }
      const response = await fetch(`${base}${path}`, {
        method: 'GET',
        credentials: 'include',
        ...options,
        headers
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Request failed');
      }
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }

    async function syncRemoteData(path, payload) {
      // 1) Supabase (منبع حقیقت جدید — بدون نیاز به بک‌اند)
      try {
        const map = {
          '/api/products': ['products', payload.products],
          '/api/special-offer': ['special_offer', payload.offer],
          '/api/discounts': ['discounts', payload.discounts],
          '/api/rates': ['rates', payload.rates],
          '/api/testimonials': ['testimonials', payload.testimonials],
          '/api/news': ['news', payload.news],
        };
        if (map[path]) {
          const [key, val] = map[path];
          const r = await supabaseWrite(key, val);
          if (r && r.ok) return { ok: true };
        }
      } catch (e) { console.warn('[supabase write]', e); }

      // 2) fallback به بک‌اند قدیمی
      try {
        const result = await apiRequest(path, {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify(payload)
        });
        return result;
      } catch (error) {
        console.warn(`[admin-sync] ${path} failed:`, error.message || error);
        return null;
      }
    }

    async function supabaseWrite(key, value) {
      if (!window.SUPABASE_SERVICE_KEY) return { ok: false, reason: 'no service key' };
      try {
        const r = await fetch('https://zepoeywugldczcnvnlyn.supabase.co/rest/v1/rpc/set_site_data', {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: 'Bearer ' + window.SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ p_key: key, p_value: value }),
        });
        return { ok: r.ok };
      } catch (e) {
        return { ok: false, reason: String(e) };
      }
    }

    function saveAccountingInvoice(entry) {
      const normalized = {
        id: entry?.id || `INV-${Date.now()}`,
        customer: entry?.customer || 'مشتری',
        phone: entry?.phone || '-',
        product: entry?.product || 'محصول',
        amount: Number(entry?.amount || 0),
        shipping: Number(entry?.shipping || 0),
        total: Number(entry?.total || 0),
        status: entry?.status || 'pending',
        createdAt: entry?.createdAt || new Date().toISOString()
      };
      normalized.total = Math.round(normalized.amount + normalized.shipping);

      const list = (() => {
        try {
          const raw = localStorage.getItem('trendcargo_accounting_invoices');
          const parsed = raw ? JSON.parse(raw) : [];
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })();

      list.unshift(normalized);
      localStorage.setItem('trendcargo_accounting_invoices', JSON.stringify(list));
      return normalized;
    }

    function checkAuth() {
      const authed = sessionStorage.getItem('tc_auth') === 'true' || document.cookie.includes('tc_auth=true');
      document.getElementById('admin-app').classList.toggle('hidden', !authed);
      document.getElementById('admin-login').classList.toggle('hidden', authed);
      if (authed) renderCMS();
    }

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = document.getElementById('admin-user').value.trim();
      const val = document.getElementById('admin-pass').value.trim();

      try {
        const result = await apiRequest('/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ username: user, password: val })
        });
        if (result && result.success) {
          sessionStorage.setItem('tc_auth', 'true');
          checkAuth();
          return;
        }
      } catch (error) {
        console.warn('Backend auth unavailable, fallback to local auth:', error.message || error);
      }

      const h = await hash(val);
      if (user === ADMIN_USER && h === DEFAULT_HASH) {
        sessionStorage.setItem('tc_auth', 'true');
        checkAuth();
      } else {
        document.getElementById('login-err').style.display = 'block';
      }
    });

    async function logout() {
      sessionStorage.removeItem('tc_auth');
      try {
        await apiRequest('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (error) {
        console.warn('Logout API not available:', error);
      }
      checkAuth();
    }

    function escAttr(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function renderCMS() {
      const grid = document.getElementById('product-grid');
      grid.innerHTML = '';

      TrendStore.products.forEach((p, idx) => {
        const g1 = p.gallery?.[0] || p.mainImg || '';
        const g2 = p.gallery?.[1] || '';
        const g3 = p.gallery?.[2] || '';

        const card = document.createElement('div');
        card.className = 'cms-card';
        card.innerHTML = `
          <div class="cms-header">
            <span class="cms-badge">محصول #${p.id}</span>
            <input type="text" class="form-control" style="width:120px;" id="p-tag-${idx}" value="${escAttr(p.tag)}">
          </div>

          <div class="img-slots">
            <div class="img-slot">
              <span>عکس ۱ (اصلی)</span>
              <img src="${escAttr(g1)}" id="prev-${idx}-0" onerror="this.src='assets/img/products/photo-1526738549149-8e07eca6c147-w150.jpg'">
              <input type="file" class="file-input" accept="image/*" onchange="compressImg(event, ${idx}, 0)">
              <input type="text" class="form-control" style="font-size:0.7rem;margin-top:4px;" id="url-${idx}-0" value="${escAttr(g1)}" oninput="document.getElementById('prev-${idx}-0').src=this.value">
            </div>
            <div class="img-slot">
              <span>عکس ۲</span>
              <img src="${escAttr(g2)}" id="prev-${idx}-1" onerror="this.src='assets/img/products/photo-1526738549149-8e07eca6c147-w150.jpg'">
              <input type="file" class="file-input" accept="image/*" onchange="compressImg(event, ${idx}, 1)">
              <input type="text" class="form-control" style="font-size:0.7rem;margin-top:4px;" id="url-${idx}-1" value="${escAttr(g2)}" oninput="document.getElementById('prev-${idx}-1').src=this.value">
            </div>
            <div class="img-slot">
              <span>عکس ۳</span>
              <img src="${escAttr(g3)}" id="prev-${idx}-2" onerror="this.src='assets/img/products/photo-1526738549149-8e07eca6c147-w150.jpg'">
              <input type="file" class="file-input" accept="image/*" onchange="compressImg(event, ${idx}, 2)">
              <input type="text" class="form-control" style="font-size:0.7rem;margin-top:4px;" id="url-${idx}-2" value="${escAttr(g3)}" oninput="document.getElementById('prev-${idx}-2').src=this.value">
            </div>
          </div>

          <div class="form-group">
            <label>عنوان فارسی:</label>
            <input type="text" class="form-control" id="p-title-${idx}" value="${escAttr(p.title)}">
          </div>
          <div class="form-group">
            <label>قیمت نمایشی (تومان):</label>
            <input type="text" class="form-control" id="p-price-${idx}" value="${escAttr(p.price)}">
          </div>
          <div class="form-group">
            <label>توضیحات کوتاه:</label>
            <textarea class="form-control" id="p-desc-${idx}">${escAttr(p.desc)}</textarea>
          </div>
        `;
        grid.appendChild(card);
      });
    }

    function renderSpecialOfferEditor() {
      const host = document.getElementById('special-offer-editor');
      if (!host) return;
      const sp = TrendStore.specialOffer || {};
      const s1 = sp.gallery && sp.gallery[0] ? sp.gallery[0] : (sp.mainImg || '');
      const s2 = sp.gallery && sp.gallery[1] ? sp.gallery[1] : '';
      const s3 = sp.gallery && sp.gallery[2] ? sp.gallery[2] : '';

      host.innerHTML = `
        <div class="cms-card">
          <div class="cms-header">
            <span class="cms-badge">پیشنهاد ویژه حراجی</span>
            <input type="text" class="form-control" style="width:150px;" id="sp-tag" value="${escAttr(sp.tag || 'تخفیف ویژه')}">
          </div>

          <div class="img-slots">
            <div class="img-slot">
              <span>عکس ۱ (اصلی)</span>
              <img src="${escAttr(s1)}" id="prev-sp-0" onerror="this.src='assets/img/products/photo-1526738549149-8e07eca6c147-w150.jpg'">
              <input type="file" class="file-input" accept="image/*" onchange="compressImg(event, 'sp', 0)">
              <input type="text" class="form-control" style="font-size:0.7rem;margin-top:4px;" id="url-sp-0" value="${escAttr(s1)}" oninput="document.getElementById('prev-sp-0').src=this.value">
            </div>
            <div class="img-slot">
              <span>عکس ۲</span>
              <img src="${escAttr(s2)}" id="prev-sp-1" onerror="this.src='assets/img/products/photo-1526738549149-8e07eca6c147-w150.jpg'">
              <input type="file" class="file-input" accept="image/*" onchange="compressImg(event, 'sp', 1)">
              <input type="text" class="form-control" style="font-size:0.7rem;margin-top:4px;" id="url-sp-1" value="${escAttr(s2)}" oninput="document.getElementById('prev-sp-1').src=this.value">
            </div>
            <div class="img-slot">
              <span>عکس ۳</span>
              <img src="${escAttr(s3)}" id="prev-sp-2" onerror="this.src='assets/img/products/photo-1526738549149-8e07eca6c147-w150.jpg'">
              <input type="file" class="file-input" accept="image/*" onchange="compressImg(event, 'sp', 2)">
              <input type="text" class="form-control" style="font-size:0.7rem;margin-top:4px;" id="url-sp-2" value="${escAttr(s3)}" oninput="document.getElementById('prev-sp-2').src=this.value">
            </div>
          </div>

          <div class="form-group">
            <label>عنوان فارسی:</label>
            <input type="text" class="form-control" id="sp-title" value="${escAttr(sp.title || '')}">
          </div>
          <div class="form-group">
            <label>قیمت جدید (تومان):</label>
            <input type="text" class="form-control" id="sp-price" value="${escAttr(sp.price || '')}">
          </div>
          <div class="form-group">
            <label>قیمت قبل از تخفیف (تومان):</label>
            <input type="text" class="form-control" id="sp-oldprice" value="${escAttr(sp.oldPrice || '')}">
          </div>
          <div class="form-group">
            <label>درصد تخفیف:</label>
            <input type="number" class="form-control" id="sp-discount" value="${Number(sp.discountPercent || 0)}">
          </div>
          <div class="form-group">
            <label>توضیحات:</label>
            <textarea class="form-control" id="sp-desc">${escAttr(sp.desc || '')}</textarea>
          </div>
        </div>
      `;
    }

    async function saveSpecialOfferFromAdmin() {
      if (!TrendStore.specialOffer) TrendStore.specialOffer = {};
      const sp = TrendStore.specialOffer;
      sp.title = document.getElementById('sp-title').value;
      sp.tag = document.getElementById('sp-tag').value;
      sp.price = document.getElementById('sp-price').value;
      sp.oldPrice = document.getElementById('sp-oldprice').value;
      sp.discountPercent = Number(document.getElementById('sp-discount').value || 0);
      sp.desc = document.getElementById('sp-desc').value;

      const img1 = document.getElementById('url-sp-0').value;
      const img2 = document.getElementById('url-sp-1').value;
      const img3 = document.getElementById('url-sp-2').value;
      sp.mainImg = img1;
      sp.gallery = [img1, img2, img3].filter(Boolean);

      TrendStore.saveSpecialOffer(sp);
      const remote = await syncRemoteData('/api/special-offer', { offer: sp });
      showRemoteStatus(remote, 'تخفیف ویژه');
      const t = document.getElementById('toast');
      t.textContent = '🔥 تخفیف ویژه ذخیره شد!';
      t.classList.add('show');
      setTimeout(() => {
        t.classList.remove('show');
        t.textContent = '✅ تغییرات با موفقیت ذخیره شدند!';
      }, 3000);
    }

    function resetDefaultProducts() {
      if (!confirm('همه تغییرات حذف و ۲۰ محصول پیش‌فرض + تخفیف ویژه بازگردانی شود؟')) return;
      try {
        localStorage.removeItem(STORAGE_KEYS.products);
        localStorage.removeItem(STORAGE_KEYS.specialOffer);
      } catch (error) {
        console.warn('Unable to clear stored products:', error);
      }
      TrendStore.products = JSON.parse(JSON.stringify(top20Products));
      TrendStore.specialOffer = JSON.parse(JSON.stringify(specialOfferProduct));
      TrendStore.saveProducts(TrendStore.products);
      TrendStore.saveSpecialOffer(TrendStore.specialOffer);
      renderCMS();
      renderSpecialOfferEditor();
      const t = document.getElementById('toast');
      t.textContent = '♻️ محصولات پیش‌فرض بازگردانی شدند';
      t.classList.add('show');
      setTimeout(() => {
        t.classList.remove('show');
        t.textContent = '✅ تغییرات با موفقیت ذخیره شدند!';
      }, 3000);
    }


    function compressImg(e, pIdx, slotIdx) {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.src = ev.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max = 700;
          let w = img.width, h = img.height;
          if (w > max || h > max) {
            if (w > h) { h = Math.round((h * max) / w); w = max; }
            else { w = Math.round((w * max) / h); h = max; }
          }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          document.getElementById(`url-${pIdx}-${slotIdx}`).value = compressed;
          document.getElementById(`prev-${pIdx}-${slotIdx}`).src = compressed;
        };
      };
      reader.readAsDataURL(file);
    }

    async function saveProducts() {
      TrendStore.products.forEach((p, idx) => {
        p.title = document.getElementById(`p-title-${idx}`).value;
        p.tag = document.getElementById(`p-tag-${idx}`).value;
        p.price = document.getElementById(`p-price-${idx}`).value;
        p.desc = document.getElementById(`p-desc-${idx}`).value;

        const img1 = document.getElementById(`url-${idx}-0`).value;
        const img2 = document.getElementById(`url-${idx}-1`).value;
        const img3 = document.getElementById(`url-${idx}-2`).value;

        p.mainImg = img1;
        p.gallery = [img1, img2, img3].filter(Boolean);
      });

      TrendStore.saveProducts(TrendStore.products);
      const remote = await syncRemoteData('/api/products', { products: TrendStore.products });
      showRemoteStatus(remote, 'محصولات');
      const t = document.getElementById('toast');
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3000);
    }

    function saveInvoiceFromAdmin() {
      const sheetUrl = document.getElementById('sheet-webapp-url')?.value?.trim();
      if (sheetUrl) {
        localStorage.setItem('trendcargo_google_sheet_url', sheetUrl);
      }

      const invoice = {
        id: `INV-${Date.now()}`,
        customer: document.getElementById('invoice-customer').value || 'مشتری',
        phone: document.getElementById('invoice-phone').value || '-',
        product: document.getElementById('invoice-product').value || 'محصول',
        amount: Number(document.getElementById('invoice-amount').value || 0),
        shipping: Number(document.getElementById('invoice-shipping').value || 0),
        status: document.getElementById('invoice-status').value || 'pending'
      };

      invoice.total = Math.round(invoice.amount + invoice.shipping);
      const saved = saveAccountingInvoice(invoice);
      localStorage.setItem('trendcargo_last_invoice', JSON.stringify(saved));

      const t = document.getElementById('toast');
      t.textContent = '✅ فاکتور ثبت شد و به شیت متصل گردید';
      t.classList.add('show');
      setTimeout(() => {
        t.classList.remove('show');
        t.textContent = '✅ تغییرات با موفقیت ذخیره شدند!';
      }, 3000);
    }

    function openInvoicePreview() {
      const invoice = JSON.parse(localStorage.getItem('trendcargo_last_invoice') || '{}');
      const previewUrl = new URL('invoice.html', window.location.href).toString();
      if (Object.keys(invoice).length) {
        window.open(previewUrl + '?fromAdmin=1', '_blank');
      } else {
        window.open(previewUrl, '_blank');
      }
    }

    function hydrateSheetUrl() {
      const url = localStorage.getItem('trendcargo_google_sheet_url');
      const inputs = [
        document.getElementById('sheet-webapp-url'),
        document.getElementById('settings-sheet-url')
      ].filter(Boolean);
      inputs.forEach(input => { if (url) input.value = url; });
    }

    function showSection(sectionName) {
      document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionName);
      });
      document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.toggle('active', section.id === `section-${sectionName}`);
      });
    }

    function escapeHTML(str) {
      return String(str || '').replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[m]));
    }

    function formatCurrency(value) {
      if (!Number.isFinite(Number(value))) return '۰';
      return Number(value).toLocaleString('fa-IR');
    }

    function getStoredDiscounts() {
      try {
        const list = JSON.parse(localStorage.getItem('trendcargo_discounts') || '[]');
        return Array.isArray(list) && list.length ? list : [
          { id: 'TREND10', value: 10, type: '%', active: true },
          { id: 'FREESHIP', value: 250000, type: 'toman', active: false }
        ];
      } catch {
        return [
          { id: 'TREND10', value: 10, type: '%', active: true },
          { id: 'FREESHIP', value: 250000, type: 'toman', active: false }
        ];
      }
    }

    function saveDiscounts(discounts) {
      localStorage.setItem('trendcargo_discounts', JSON.stringify(discounts));
      syncRemoteData('/api/discounts', { discounts });
    }

    function addDiscountRow() {
      const list = getStoredDiscounts();
      list.push({ id: `NEW${Date.now().toString().slice(-4)}`, value: 10, type: '%', active: true });
      saveDiscounts(list);
      renderDiscounts();
    }

    function renderDiscounts() {
      const host = document.getElementById('discounts-list');
      if (!host) return;
      const discounts = getStoredDiscounts();
      host.innerHTML = discounts.map((item, index) => `
        <div class="discount-item">
          <div class="discount-meta">
            <strong>${item.id}</strong>
            <small>${item.type === '%' ? (item.value + '%') : (formatCurrency(item.value) + ' تومان')} · ${item.active ? 'فعال' : 'غیرفعال'}</small>
          </div>
          <div style="display:flex; gap:0.6rem; align-items:center;">
            <input type="number" class="form-control" style="width:110px;" value="${item.value}" data-discount-index="${index}" data-field="value" />
            <select class="form-control" style="width:80px;" data-discount-index="${index}" data-field="type">
              <option value="%" ${item.type === '%' ? 'selected' : ''}>%</option>
              <option value="toman" ${item.type === 'toman' ? 'selected' : ''}>تومان</option>
            </select>
            <button class="toggle-switch ${item.active ? 'active' : ''}" data-discount-index="${index}" data-field="active" title="فعال/غیرفعال"></button>
          </div>
        </div>
      `).join('');

      host.querySelectorAll('[data-field="value"]').forEach(input => {
        input.addEventListener('change', (event) => {
          const idx = Number(event.target.dataset.discountIndex);
          const list = getStoredDiscounts();
          list[idx].value = Number(event.target.value || 0);
          saveDiscounts(list);
          renderDiscounts();
        });
      });

      host.querySelectorAll('[data-field="type"]').forEach(select => {
        select.addEventListener('change', (event) => {
          const idx = Number(event.target.dataset.discountIndex);
          const list = getStoredDiscounts();
          list[idx].type = event.target.value;
          saveDiscounts(list);
          renderDiscounts();
        });
      });

      host.querySelectorAll('[data-field="active"]').forEach(button => {
        button.addEventListener('click', () => {
          const idx = Number(button.dataset.discountIndex);
          const list = getStoredDiscounts();
          list[idx].active = !list[idx].active;
          saveDiscounts(list);
          renderDiscounts();
        });
      });
    }

    function renderOrdersTable() {
      const wrapper = document.getElementById('orders-table-wrapper');
      if (!wrapper) return;
      const invoices = JSON.parse(localStorage.getItem('trendcargo_accounting_invoices') || '[]');
      if (!invoices.length) {
        wrapper.innerHTML = '<p style="color: var(--text-muted);">هیچ سفارشی ثبت نشده است.</p>';
        return;
      }

      wrapper.innerHTML = `
        <table class="orders-table">
          <thead>
            <tr>
              <th>نام</th>
              <th>سفارش</th>
              <th>مبلغ</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.map(invoice => `
              <tr>
                <td>${invoice.customer || 'مشتری'}</td>
                <td>${invoice.product || 'نامشخص'}</td>
                <td>${formatCurrency(invoice.total || 0)} تومان</td>
                <td>
                  <select class="form-control" data-order-id="${invoice.id}" data-status>
                    <option value="pending" ${invoice.status === 'pending' ? 'selected' : ''}>در انتظار</option>
                    <option value="paid" ${invoice.status === 'paid' ? 'selected' : ''}>تسویه شده</option>
                    <option value="shipped" ${invoice.status === 'shipped' ? 'selected' : ''}>در حال ارسال</option>
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      wrapper.querySelectorAll('[data-status]').forEach(select => {
        select.addEventListener('change', (event) => {
          const list = JSON.parse(localStorage.getItem('trendcargo_accounting_invoices') || '[]');
          const idx = list.findIndex(item => item.id === event.target.dataset.orderId);
          if (idx >= 0) {
            list[idx].status = event.target.value;
            localStorage.setItem('trendcargo_accounting_invoices', JSON.stringify(list));
            updateDashboardMetrics();
          }
        });
      });
    }

    function updateDashboardMetrics() {
      const invoices = JSON.parse(localStorage.getItem('trendcargo_accounting_invoices') || '[]');
      const totalOrders = invoices.length;
      const totalRevenue = invoices.reduce((sum, item) => sum + Number(item.total || 0), 0);
      const productCount = TrendStore.products.length || 0;
      const newQuotes = (adminOrdersCache || []).filter((o) => o.status === 'new').length;

      const ordersElement = document.getElementById('metric-orders');
      const incomeElement = document.getElementById('metric-income');
      const productsElement = document.getElementById('metric-products');
      const rateElement = document.getElementById('metric-rate');

      if (ordersElement) ordersElement.textContent = formatCurrency(totalOrders);
      if (incomeElement) incomeElement.textContent = formatCurrency(totalRevenue);
      if (productsElement) productsElement.textContent = formatCurrency(productCount);
      if (rateElement) rateElement.textContent = formatCurrency(newQuotes);
    }

    function hydrateRateInputs() {
      const rates = TrendStore.rates || {};
      const base = rates.baseRates || {};
      const shipping = rates.shipping || {};
      const fields = {
        'rate-usd': Number(base.usd || 188000),
        'rate-amd': Number(base.amd || 170),
        'rate-try': Number(base.try || 5800),
        'rate-spread': Number(rates.exchangeSpreadMultiplier || 1.06),
        'rate-shipping-first': Number(shipping.firstKgToman || 3500000),
        'rate-shipping-extra': Number(shipping.extraKgToman || 2800000)
      };

      Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
      });
    }

    function saveManualRates() {
      const nextRates = {
        baseRates: {
          usd: Number(document.getElementById('rate-usd').value || 188000),
          amd: Number(document.getElementById('rate-amd').value || 170),
          try: Number(document.getElementById('rate-try').value || 5800)
        },
        exchangeSpreadMultiplier: Number(document.getElementById('rate-spread').value || 1.06),
        shipping: {
          firstKgToman: Number(document.getElementById('rate-shipping-first').value || 3500000),
          extraKgToman: Number(document.getElementById('rate-shipping-extra').value || 2800000)
        }
      };

      TrendStore.saveRates(nextRates);
      hydrateRateInputs();
      updateDashboardMetrics();
      const t = document.getElementById('toast');
      syncRemoteData('/api/rates', { rates: nextRates }).then((remote) => {
        if (t) t.textContent = remote
          ? '✅ نرخ‌ها ذخیره و روی سایت منتشر شدند!'
          : '⚠️ نرخ‌ها محلی ذخیره شد — سرور در دسترس نیست.';
      });
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2500);
    }

    function bindNavigation() {
      document.querySelectorAll('.nav-item').forEach(button => {
        button.addEventListener('click', () => showSection(button.dataset.section));
      });
    }

    function syncSheetInputs() {
      const savedUrl = localStorage.getItem('trendcargo_google_sheet_url');
      const urlInputs = ['sheet-webapp-url', 'settings-sheet-url'];
      urlInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el && savedUrl) el.value = savedUrl;
      });
      [document.getElementById('sheet-webapp-url'), document.getElementById('settings-sheet-url')].forEach(el => {
        if (!el) return;
        el.addEventListener('change', (event) => {
          const value = event.target.value.trim();
          if (value) {
            localStorage.setItem('trendcargo_google_sheet_url', value);
            const other = document.getElementById(event.target.id === 'sheet-webapp-url' ? 'settings-sheet-url' : 'sheet-webapp-url');
            if (other) other.value = value;
          }
        });
      });
    }

    function getTestimonials() {
      try {
        const stored = localStorage.getItem('trendcargo_testimonials');
        if (stored && !stored.includes('??')) return JSON.parse(stored);
        return [];
      } catch { return []; }
    }

    function saveTestimonials(list) {
      localStorage.setItem('trendcargo_testimonials', JSON.stringify(list));
      syncRemoteData('/api/testimonials', { testimonials: list });
    }

    function showRemoteStatus(remote, label) {
      if (remote) return;
      console.warn(`[admin-sync] سرور برای «${label}» در دسترس نیست؛ فقط local ذخیره شد.`);
    }

    /* ---------------- استعلام‌های مشتریان (سرور) ---------------- */
    let adminOrdersCache = [];

    async function loadCustomerOrders() {
      try {
        const result = await apiRequest('/api/orders', { method: 'GET', credentials: 'include' });
        adminOrdersCache = Array.isArray(result?.data) ? result.data : [];
      } catch {
        adminOrdersCache = [];
      }
      renderCustomerOrders();
      updateDashboardMetrics();
    }

    function renderCustomerOrders() {
      const host = document.getElementById('customer-orders-wrapper');
      if (!host) return;
      const orders = adminOrdersCache;
      if (!orders.length) {
        host.innerHTML = '<p style="color: var(--text-muted);">هنوز استعلامی ثبت نشده است.</p>';
        return;
      }
      const statusLabels = { new: 'جدید', contacted: 'تماس گرفته شد', invoiced: 'فاکتور شد', closed: 'بسته شد' };
      host.innerHTML = `
        <table class="orders-table">
          <thead>
            <tr>
              <th>مشتری</th>
              <th>لینک محصول</th>
              <th>تماس</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map((o) => `
              <tr>
                <td>${escapeHTML(o.name || 'مشتری')}</td>
                <td><a href="${escAttr(o.link)}" target="_blank" rel="noopener noreferrer" style="color: var(--cyan); font-size: 0.85rem;">مشاهده لینک</a></td>
                <td>${escapeHTML(o.phone || '-')}</td>
                <td>
                  <select class="form-control" data-quote-id="${escAttr(String(o.id))}" data-quote-status>
                    ${['new', 'contacted', 'invoiced', 'closed'].map((s) => `
                      <option value="${s}" ${o.status === s ? 'selected' : ''}>${statusLabels[s]}</option>
                    `).join('')}
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      host.querySelectorAll('[data-quote-status]').forEach((select) => {
        select.addEventListener('change', async (event) => {
          const id = event.target.dataset.quoteId;
          const status = event.target.value;
          const remote = await syncRemoteData('/api/orders/status', { id, status });
          if (remote) {
            const idx = adminOrdersCache.findIndex((o) => String(o.id) === String(id));
            if (idx > -1) adminOrdersCache[idx].status = status;
            updateDashboardMetrics();
          }
        });
      });
    }

    /* ---------------- گوش‌دهندهٔ همگام‌سازی لحظه‌ای (SSE) ---------------- */
    let adminSSE = null;

    function subscribeAdminSync() {
      if (adminSSE || typeof EventSource === 'undefined') return;
      try {
        const src = new EventSource('/api/events');
        src.addEventListener('store-update', () => {
          // هر تغییر روی سرور (از سایت یا ادمین دیگر) → به‌روزرسانی زندهٔ این پنل
          TrendStore.init();
          hydrateRateInputs();
          renderCMS();
          renderSpecialOfferEditor();
          renderTestimonialsAdmin();
          renderNewsAdmin();
          loadCustomerOrders();
          updateDashboardMetrics();
        });
        src.onerror = () => {
          if (src.readyState === EventSource.CLOSED) adminSSE = null;
        };
        adminSSE = src;
      } catch (error) {
        console.warn('[admin-sync] SSE unavailable:', error);
      }
    }

    function renderTestimonialsAdmin() {
      const host = document.getElementById('testimonials-admin-list');
      if (!host) return;
      const testimonials = getTestimonials();
      if (!testimonials.length) {
        host.innerHTML = '<div class="no-testimonials">هنوز نظری ثبت نشده است.</div>';
        return;
      }
      host.innerHTML = testimonials.map((t, i) => `
        <div class="testimonial-admin-card ${t.approved === false ? 'pending' : ''}">
          <div class="testimonial-admin-avatar">${(t.name || '?').charAt(0)}</div>
          <div class="testimonial-admin-info">
            <div class="testimonial-admin-name">
              ${escapeHTML(t.name || 'کاربر')}
              ${t.approved === false ? '<span class="badge-pending">در انتظار</span>' : '<span class="badge-approved">✓ تأیید شده</span>'}
            </div>
            <div class="testimonial-admin-meta">📍 ${escapeHTML(t.city || 'نامشخص')} · ${t.date || ''}</div>
            <div class="testimonial-admin-stars">${'★'.repeat(t.rating || 5)}${'☆'.repeat(5 - (t.rating || 5))}</div>
            <div class="testimonial-admin-text">${escapeHTML(t.text || '')}</div>
          </div>
          <div class="testimonial-admin-actions">
            ${t.approved !== false ? '' : `<button class="btn-approve" onclick="approveTestimonial(${t.id})">✓ تأیید</button>`}
            <button class="btn-reject" onclick="deleteTestimonial(${t.id})">🗑 حذف</button>
          </div>
        </div>
      `).join('');
    }

    function approveTestimonial(id) {
      const list = getTestimonials();
      const idx = list.findIndex(t => t.id === id);
      if (idx > -1) {
        list[idx].approved = true;
        list[idx].verified = true;
        saveTestimonials(list);
        renderTestimonialsAdmin();
      renderBlogAdmin();
      }
    }

    function deleteTestimonial(id) {
      let list = getTestimonials();
      list = list.filter(t => t.id !== id);
      saveTestimonials(list);
      renderTestimonialsAdmin();
    }

    function approveAllTestimonials() {
      const list = getTestimonials();
      list.forEach(t => { t.approved = true; t.verified = true; });
      saveTestimonials(list);
      renderTestimonialsAdmin();
    }

    // ---- Visit Stats (Supabase — بازدید روزانه) ----
    const SUPABASE_URL = 'https://zepoeywugldczcnvnlyn.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplcG9leXd1Z2xkY3pjbnZubHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MjAyNTYsImV4cCI6MjEwNDk5NjI1Nn0.Y4qNjZQJs7x0Z-4RwfE7YgxX49rDlJ8YbMgiyEFgdIQ';

    function faDigits(n) {
      return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
    }

    /** کلید تاریخ به وقت تهران (همسان با ردیفهای جدول daily_visits) */
    function tehranDateKey(date) {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(date);
    }

    function loadVisitStats() {
      const chart = document.getElementById('visits-chart');
      if (!hasRealSupabaseCredentials()) {
        if (chart) chart.innerHTML = '<div class="visits-empty">???? ?????? ?? ????? ???? ? ??????? Supabase ???? ??????.</div>'
        return;
      }
      fetch(`${SUPABASE_URL}/rest/v1/rpc/visit_stats`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_days: 30 }),
      })
        .then(r => r.json())
        .then(rows => {
          if (!Array.isArray(rows)) throw new Error('bad response');
          renderVisitStats(rows);
        })
        .catch(() => {
          if (chart) chart.innerHTML = '<div class="visits-empty">???? ?????? ?? ????? ???? ? ????? Supabase ?? ????? ????.</div>';
        });
    }

    function renderVisitStats(rows) {
      const byDay = new Map(rows.map(r => [r.day, r]));
      const now = new Date();
      const todayKey = tehranDateKey(now);
      const yesterdayKey = tehranDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
      const zero = { unique_visitors: 0, page_views: 0 };
      const todayRow = byDay.get(todayKey) || zero;
      const yesterdayRow = byDay.get(yesterdayKey) || zero;
      const sum = list => list.reduce((s, r) => s + Number(r.unique_visitors || 0), 0);
      const sumViews = list => list.reduce((s, r) => s + Number(r.page_views || 0), 0);

      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = faDigits(v); };
      set('visits-today', Number(todayRow.unique_visitors));
      set('visits-yesterday', Number(yesterdayRow.unique_visitors));
      set('visits-week', sum(rows.slice(0, 7)));
      set('visits-month', sum(rows));
      set('visits-total', sum(rows));
      set('visits-total-views', sumViews(rows));

      // نمودار ۱۴ روز اخیر — قدیمی به جدید (راست به چپ طبیعی RTL)
      const chart = document.getElementById('visits-chart');
      if (!chart) return;
      const slice = rows.slice(0, 14).reverse();
      const max = Math.max(1, ...slice.map(r => Number(r.unique_visitors || 0)));
      chart.innerHTML = slice.map(r => {
        const uniq = Number(r.unique_visitors || 0);
        const h = Math.max(3, Math.round((uniq / max) * 100));
        const isToday = r.day === todayKey;
        const dayLabel = faDigits(r.day.slice(8, 10)) + '/' + faDigits(r.day.slice(5, 7));
        return `
          <div class="v-col ${isToday ? 'is-today' : ''}" title="${r.day}: ${uniq} بازدید یکتا / ${r.page_views} بازدید صفحه">
            <span class="v-count">${faDigits(uniq)}</span>
            <div class="v-bar-wrap"><div class="v-bar" style="height:${h}%"></div></div>
            <span class="v-day">${isToday ? 'امروز' : dayLabel}</span>
          </div>`;
      }).join('');
    }

    function initAdminUi() {
      bindNavigation();
      loadVisitStats();
      const statusUpdate = document.getElementById('status-last-update');
      if (statusUpdate) {
        statusUpdate.textContent = 'آخرین بهروزرسانی: ' +
          new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
      }
      renderDiscounts();
      renderOrdersTable();
      hydrateRateInputs();
      hydrateSheetUrl();
      syncSheetInputs();
      updateDashboardMetrics();
      renderTestimonialsAdmin();
      renderNewsAdmin();
      loadCustomerOrders();
      subscribeAdminSync();
      if (typeof renderCMS === 'function') renderCMS();
      if (typeof renderSpecialOfferEditor === 'function') renderSpecialOfferEditor();
    }

    // News Management
    function getNews() {
      try {
        const stored = localStorage.getItem('trendcargo_custom_news');
        if (stored) return JSON.parse(stored);
        return [];
      } catch { return []; }
    }

    function saveNewsList(list) {
      localStorage.setItem('trendcargo_custom_news', JSON.stringify(list));
    }

    function newsItemId(card, fallback) {
      const idEl = card.querySelector('.news-id');
      const raw = idEl && idEl.dataset ? idEl.dataset.id : '';
      const num = Number(raw);
      if (raw !== '' && Number.isFinite(num)) return num;
      return fallback;
    }

    function renderNewsAdmin() {
      const host = document.getElementById('news-list');
      if (!host) return;
      const news = getNews();
      if (!news.length) {
        host.innerHTML = '<div class="no-testimonials">هنوز خبری ثبت نشده است.</div>';
        return;
      }
      host.innerHTML = news.map((item, i) => `
        <div class="news-admin-card">
          <div class="news-admin-header">
            <span class="news-id" data-id="${escapeHTML(String(item.id != null ? item.id : (i + 1)))}">#${escapeHTML(String(item.id != null ? item.id : (i + 1)))}</span>
            <div class="news-admin-actions">
              <button class="btn-approve" onclick="editNews(${JSON.stringify(item.id)})">✏️ ویرایش</button>
              <button class="btn-reject" onclick="deleteNews(${JSON.stringify(item.id)})">🗑 حذف</button>
            </div>
          </div>
          <div class="news-admin-body">
            <div class="form-group">
              <label>تیتر خبر:</label>
              <input type="text" class="form-control news-title" value="${escapeHTML(item.title || '')}" placeholder="تیتر خبر">
            </div>
            <div class="form-group">
              <label>توضیحات کوتاه:</label>
              <textarea class="form-control news-desc" rows="2" placeholder="توضیحات کوتاه خبر">${escapeHTML(item.desc || item.shortDesc || '')}</textarea>
            </div>
            <div class="form-group">
              <label>متن کامل خبر:</label>
              <textarea class="form-control news-fullbody" rows="4" placeholder="متن کامل گزارش">${escapeHTML(item.fullBody || item.desc || item.shortDesc || '')}</textarea>
            </div>
            <div class="form-group">
              <label>لینک تصویر:</label>
              <input type="text" class="form-control news-img" value="${escapeHTML(item.img || item.image || item.mainImg || '')}" placeholder="لینک تصویر خبر">
            </div>
            <div class="form-group">
              <label>تگ/دسته‌بندی:</label>
              <input type="text" class="form-control news-tag" value="${escapeHTML(item.category || item.tag || '')}" placeholder="مثلاً: تکنولوژی، فشن">
            </div>
            <div class="form-group">
              <label>زمان مطالعه:</label>
              <input type="text" class="form-control news-readtime" value="${escapeHTML(item.readTime || '')}" placeholder="مثلاً: زمان مطالعه: ۳ دقیقه">
            </div>
          </div>
        </div>
      `).join('');
    }

    function addNewsRow() {
      const list = getNews();
      const newId = Date.now();
      list.unshift({
        id: newId,
        title: 'خبر جدید',
        category: 'اخبار',
        badge: 'اخبار',
        shortDesc: 'توضیحات کوتاه خبر را اینجا بنویسید',
        fullBody: 'متن کامل خبر را اینجا بنویسید',
        desc: 'توضیحات کوتاه خبر را اینجا بنویسید',
        img: 'assets/img/products/photo-1518770660439-4636190af475-w600.jpg',
        image: 'assets/img/products/photo-1518770660439-4636190af475-w600.jpg',
        tag: 'اخبار',
        date: new Date().toLocaleDateString('fa-IR'),
        readTime: 'زمان مطالعه: ۳ دقیقه',
        specs: []
      });
      saveNewsList(list);
      renderNewsAdmin();
    }

    async function saveNews() {
      const cards = document.querySelectorAll('#news-list .news-admin-card');
      const oldList = getNews();
      const list = [];
      cards.forEach((card, i) => {
        const old = oldList[i] || {};
        const id = newsItemId(card, old.id != null ? old.id : Date.now());
        const title = card.querySelector('.news-title').value;
        const desc = card.querySelector('.news-desc').value;
        const fullBody = card.querySelector('.news-fullbody').value || desc;
        const img = card.querySelector('.news-img').value;
        const tag = card.querySelector('.news-tag').value;
        const readTime = card.querySelector('.news-readtime').value;
        list.push({
          id: id,
          title: title,
          category: tag,
          badge: tag,
          shortDesc: desc,
          fullBody: fullBody,
          desc: desc,
          img: img,
          image: img,
          tag: tag,
          date: old.date || new Date().toLocaleDateString('fa-IR'),
          readTime: readTime,
          specs: Array.isArray(old.specs) ? old.specs : []
        });
      });
      saveNewsList(list);
      const remote = await syncRemoteData('/api/news', { news: list });
      showRemoteStatus(remote, 'اخبار');
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = remote
          ? '✅ اخبار ذخیره و روی سایت منتشر شدند!'
          : '⚠️ اخبار محلی ذخیره شد ولی سرور در دسترس نیست — روی سایت منتشر نمی‌شود.';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
      }
    }

    function editNews(id) {
      // Edit functionality - already handled by inline editing
    }

    function deleteNews(id) {
      let list = getNews();
      list = list.filter(item => String(item.id) !== String(id));
      saveNewsList(list);
      syncRemoteData('/api/news', { news: list });
      renderNewsAdmin();
    }

    checkAuth();
    initAdminUi();
  
