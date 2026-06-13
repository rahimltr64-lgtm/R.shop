// ============================================================
// هواتف ماركت - كود واجهة المتجر
// ============================================================

// متغيرات عامة
let allProducts = {};
let favoriteIds = JSON.parse(localStorage.getItem('storeFavorites')) || [];
let compareList = [];
let currentCategory = 'الكل';
let currentBrand = 'الكل';
let searchQuery = '';
let showFavoritesOnly = false;
let selectedActiveProduct = null;
let selectedStorage = null;
let selectedColor = null;
let selectedDeliveryType = 'home';
let lastOrderProductId = null;
let shippingRates = [];
let storeSettings = {};

// تهيئة المتجر عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 تهيئة المتجر...');
    showLoadProgress(30);
    
    // تحميل الإعدادات
    await loadStoreSettings();
    
    // تحميل أسعار التوصيل
    await loadShippingRates();
    
    // تعبئة قائمة الولايات
    populateWilayas();
    
    // تحميل المنتجات
    await loadProducts();
    
    // تحديث عدد المفضلة
    updateFavBadge();
    
    // إضافة مستمعين للأحداث
    setupEventListeners();
    
    showLoadProgress(100);
    setTimeout(() => {
        document.getElementById('loadProgress').style.width = '0%';
    }, 500);
});

// ========== دوال التحميل ==========
function showLoadProgress(percent) {
    const bar = document.getElementById('loadProgress');
    if (bar) bar.style.width = percent + '%';
}

async function loadStoreSettings() {
    try {
        const snapshot = await db.ref(DB_REF.settings).once('value');
        const data = snapshot.val();
        if (data) {
            storeSettings = data;
            applyStoreSettings();
        } else {
            // إعدادات افتراضية
            storeSettings = {
                storeName: 'هواتف ماركت',
                storeLogo: 'https://i.postimg.cc/mr3Txdqm/1781273630296.png',
                primaryColor: '#f5b041',
                phone: '0555000000',
                email: 'contact@phonesmarket.dz',
                whatsapp: '213555000000',
                facebook: '',
                instagram: '',
                welcomeMessage: 'مرحباً بك في هواتف ماركت - أكبر متجر هواتف في الجزائر'
            };
            await db.ref(DB_REF.settings).set(storeSettings);
        }
    } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error);
    }
}

function applyStoreSettings() {
    // تحديث عنوان المتجر
    document.title = storeSettings.storeName || 'هواتف ماركت';
    
    // تحديث شعار المتجر
    const logoImgs = document.querySelectorAll('.logo-img');
    logoImgs.forEach(img => {
        if (storeSettings.storeLogo) img.src = storeSettings.storeLogo;
    });
    
    // تحديث اللون الرئيسي
    if (storeSettings.primaryColor) {
        document.documentElement.style.setProperty('--accent-gold', storeSettings.primaryColor);
    }
    
    // تحديث روابط التواصل
    const whatsappLink = document.querySelector('.whatsapp-float');
    if (whatsappLink && storeSettings.whatsapp) {
        whatsappLink.href = `https://wa.me/${storeSettings.whatsapp}`;
    }
    
    // تحديث رسالة الترحيب
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && storeSettings.welcomeMessage) {
        heroTitle.textContent = storeSettings.welcomeMessage;
    }
}

async function loadShippingRates() {
    try {
        const snapshot = await db.ref(DB_REF.shippingRates).once('value');
        const data = snapshot.val();
        if (data && Object.keys(data).length > 0) {
            shippingRates = Object.values(data).sort((a, b) => parseInt(a.code) - parseInt(b.code));
        } else {
            shippingRates = WILAYAS;
            // حفظ الأسعار الافتراضية
            const defaultRates = {};
            WILAYAS.forEach(w => {
                defaultRates[w.code] = w;
            });
            await db.ref(DB_REF.shippingRates).set(defaultRates);
        }
    } catch (error) {
        console.error('خطأ في تحميل أسعار التوصيل:', error);
        shippingRates = WILAYAS;
    }
}

function populateWilayas() {
    const select = document.getElementById('custWilaya');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- اختر ولاية الإقامة --</option>';
    shippingRates.forEach(w => {
        const option = document.createElement('option');
        option.value = w.code;
        option.dataset.home = w.home;
        option.dataset.office = w.office;
        option.textContent = `${w.code} - ${w.name}`;
        select.appendChild(option);
    });
}

async function loadProducts() {
    const container = document.getElementById('productsContainer');
    if (container) {
        container.innerHTML = `
            <div class="skeleton-loader">
                ${Array(8).fill('<div class="skeleton-card"></div>').join('')}
            </div>
        `;
    }
    
    try {
        const snapshot = await db.ref(DB_REF.products).once('value');
        const data = snapshot.val();
        
        if (data && typeof data === 'object') {
            allProducts = data;
        } else if (Array.isArray(data)) {
            allProducts = {};
            data.forEach((item, index) => {
                if (item) allProducts[item.id || index] = item;
            });
        } else {
            allProducts = {};
        }
        
        renderStoreProducts();
        
        // تحديث عدد المنتجات في الهيرو
        const total = Object.keys(allProducts).length;
        const heroTotal = document.getElementById('heroTotal');
        if (heroTotal) heroTotal.innerText = total + '+';
        
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
        showToast('حدث خطأ في تحميل المنتجات', 'error');
        renderStoreProducts();
    }
}

// ========== عرض المنتجات ==========
function renderStoreProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    let productsArray = Object.values(allProducts);
    
    // تطبيق الفلاتر
    if (currentCategory !== 'الكل') {
        productsArray = productsArray.filter(p => p.category === currentCategory);
    }
    
    if (currentBrand !== 'الكل') {
        productsArray = productsArray.filter(p => p.brand === currentBrand);
    }
    
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        productsArray = productsArray.filter(p => 
            p.name.toLowerCase().includes(query) || 
            (p.brand && p.brand.toLowerCase().includes(query))
        );
    }
    
    if (showFavoritesOnly) {
        productsArray = productsArray.filter(p => favoriteIds.includes(String(p.id)));
    }
    
    // ترتيب المنتجات
    const sortBy = document.getElementById('sortSelect')?.value || 'default';
    productsArray = sortProducts(productsArray, sortBy);
    
    const displayedCount = productsArray.length;
    document.getElementById('productsCount').innerHTML = `${displayedCount} منتج`;
    
    if (displayedCount === 0) {
        let msg = 'لا توجد منتجات تطابق بحثك.';
        if (showFavoritesOnly) msg = 'قائمة المفضلة فارغة. أضف بعض الهواتف أولاً!';
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${showFavoritesOnly ? '💔' : '🔍'}</div>
                <p>${msg}</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="products-grid">';
    
    productsArray.forEach(product => {
        const productId = product.id;
        const isFav = favoriteIds.includes(String(productId));
        const inCompare = compareList.includes(String(productId));
        const mainImg = (product.images && product.images.length > 0) ? product.images[0] : 'https://placehold.co/400x400?text=Phone';
        const isOutOfStock = product.stock === 0;
        
        // شارات المنتج
        let badgesHtml = '<div class="product-badges">';
        if (isOutOfStock) {
            badgesHtml += '<span class="badge-soldout">نفذ المخزون</span>';
        } else {
            if (product.isNew) badgesHtml += '<span class="badge-new">جديد</span>';
            if (product.isHot) badgesHtml += '<span class="badge-hot">الأكثر طلباً</span>';
            if (product.oldPrice && product.oldPrice > product.price) {
                const discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
                badgesHtml += `<span class="badge-sale">-${discount}%</span>`;
            }
        }
        badgesHtml += '</div>';
        
        // حالة المخزون
        let stockClass = '';
        let stockText = 'متوفر';
        if (product.stock !== undefined) {
            if (product.stock === 0) {
                stockClass = 'out';
                stockText = 'نفذ المخزون';
            } else if (product.stock < 5) {
                stockClass = 'low';
                stockText = `آخر ${product.stock} قطع`;
            }
        }
        
        // التقييم
        let ratingHtml = '';
        if (product.rating) {
            const r = Math.max(0, Math.min(5, Number(product.rating) || 0));
            const stars = '★'.repeat(Math.floor(r)) + '☆'.repeat(5 - Math.floor(r));
            ratingHtml = `<div class="product-rating"><span class="stars">${stars}</span><span>(${product.reviews || 0})</span></div>`;
        }
        
        html += `
            <div class="product-card${isOutOfStock ? ' out-of-stock' : ''}" data-product-id="${productId}" onclick="openProductQuickView('${productId}')">
                ${badgesHtml}
                <div class="card-top-actions">
                    <div class="fav-heart-btn ${isFav ? 'is-fav' : ''}" onclick="event.stopPropagation(); toggleFavorite('${productId}', this)">❤️</div>
                    <div class="compare-add-btn ${inCompare ? 'in-compare' : ''}" onclick="event.stopPropagation(); toggleCompare('${productId}', this)">⚖️</div>
                </div>
                <div class="product-img-wrapper">
                    <img src="${mainImg}" alt="${product.name}" loading="lazy" onerror="this.src='https://placehold.co/400x400?text=Phone'">
                    <div class="stock-badge ${stockClass}">${stockText}</div>
                </div>
                <div class="product-details">
                    <div class="product-brand-tag">${product.brand || 'هاتف'}</div>
                    <h3 class="product-title">${escapeHtml(product.name)}</h3>
                    ${ratingHtml}
                    <div class="product-price-row">
                        <div class="product-price">${formatCurrency(product.price)}</div>
                        ${product.oldPrice ? `<div class="product-old-price">${formatCurrency(product.oldPrice)}</div>` : ''}
                    </div>
                    ${product.installment ? `<div class="product-installment">أو ${formatCurrency(product.installment)} / شهر</div>` : ''}
                    <button class="btn-action" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? '❌ نفذ المخزون' : '⚡ شراء مباشر'}
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ========== دوال مساعدة ==========
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sortProducts(products, sortBy) {
    return [...products].sort((a, b) => {
        switch (sortBy) {
            case 'price_asc': return (a.price || 0) - (b.price || 0);
            case 'price_desc': return (b.price || 0) - (a.price || 0);
            case 'rating_desc': return (b.rating || 0) - (a.rating || 0);
            case 'discount_desc': {
                const discA = a.oldPrice ? ((a.oldPrice - a.price) / a.oldPrice) : 0;
                const discB = b.oldPrice ? ((b.oldPrice - b.price) / b.oldPrice) : 0;
                return discB - discA;
            }
            case 'stock_desc': return (b.stock || 0) - (a.stock || 0);
            default: return 0;
        }
    });
}

// ========== الفلاتر ==========
function handleSearch() {
    searchQuery = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    renderStoreProducts();
}

function filterBrand(brand, element) {
    currentBrand = brand;
    document.querySelectorAll('.brand-circle').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');
    renderStoreProducts();
}

function filterCategory(category, element) {
    currentCategory = category;
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');
    renderStoreProducts();
}

function toggleFavFilter() {
    showFavoritesOnly = !showFavoritesOnly;
    const btn = document.getElementById('favToggleBtn');
    if (btn) btn.classList.toggle('active', showFavoritesOnly);
    renderStoreProducts();
}

// ========== المفضلة ==========
function toggleFavorite(productId, btnElement) {
    const id = String(productId);
    if (favoriteIds.includes(id)) {
        favoriteIds = favoriteIds.filter(fav => fav !== id);
        if (btnElement) btnElement.classList.remove('is-fav');
    } else {
        favoriteIds.push(id);
        if (btnElement) btnElement.classList.add('is-fav');
    }
    localStorage.setItem('storeFavorites', JSON.stringify(favoriteIds));
    updateFavBadge();
    if (showFavoritesOnly) renderStoreProducts();
}

function updateFavBadge() {
    const badge = document.getElementById('favCountBadge');
    if (badge) badge.innerText = favoriteIds.length;
}

// ========== المقارنة ==========
function toggleCompare(productId, btnElement) {
    const id = String(productId);
    if (compareList.includes(id)) {
        compareList = compareList.filter(cid => cid !== id);
        if (btnElement) btnElement.classList.remove('in-compare');
    } else {
        if (compareList.length >= 2) {
            showToast('يمكنك مقارنة منتجين كحد أقصى. أزل أحدهما أولاً.', 'error');
            return;
        }
        compareList.push(id);
        if (btnElement) btnElement.classList.add('in-compare');
    }
    updateCompareBar();
}

function updateCompareBar() {
    const bar = document.getElementById('compareBar');
    const itemsContainer = document.getElementById('compareItems');
    
    if (compareList.length === 0) {
        if (bar) bar.classList.remove('show');
        return;
    }
    
    if (bar) bar.classList.add('show');
    if (!itemsContainer) return;
    
    itemsContainer.innerHTML = compareList.map(id => {
        const product = allProducts[id];
        if (!product) return '';
        return `
            <div class="compare-item-chip">
                📱 ${escapeHtml(product.name.substring(0, 30))}...
                <button onclick="toggleCompare('${id}', null); updateCompareBar();">&times;</button>
            </div>
        `;
    }).join('');
}

function clearCompare() {
    compareList = [];
    updateCompareBar();
    renderStoreProducts();
    showToast('تم مسح قائمة المقارنة', 'success');
}

function openCompareModal() {
    if (compareList.length < 2) {
        showToast('اختر منتجين على الأقل للمقارنة', 'error');
        return;
    }
    
    const [id1, id2] = compareList;
    const p1 = allProducts[id1];
    const p2 = allProducts[id2];
    
    if (!p1 || !p2) return;
    
    const img1 = p1.images?.[0] || 'https://placehold.co/100';
    const img2 = p2.images?.[0] || 'https://placehold.co/100';
    
    const discount1 = p1.oldPrice ? Math.round(((p1.oldPrice - p1.price) / p1.oldPrice) * 100) : 0;
    const discount2 = p2.oldPrice ? Math.round(((p2.oldPrice - p2.price) / p2.oldPrice) * 100) : 0;
    
    const rows = [
        ['الصورة', `<img src="${img1}" style="width:80px;height:80px;object-fit:contain;">`, `<img src="${img2}" style="width:80px;height:80px;object-fit:contain;">`],
        ['الاسم', `<strong>${escapeHtml(p1.name)}</strong>`, `<strong>${escapeHtml(p2.name)}</strong>`],
        ['الماركة', p1.brand || '-', p2.brand || '-'],
        ['السعر', `<span class="compare-highlight">${formatCurrency(p1.price)}</span>`, `<span class="compare-highlight">${formatCurrency(p2.price)}</span>`],
        ['الخصم', discount1 ? `<span style="color:var(--accent-red)">-${discount1}%</span>` : '-', discount2 ? `<span style="color:var(--accent-red)">-${discount2}%</span>` : '-'],
        ['التقسيط/شهر', p1.installment ? formatCurrency(p1.installment) : '-', p2.installment ? formatCurrency(p2.installment) : '-'],
        ['التقييم', `${'★'.repeat(Math.floor(Math.min(5, p1.rating || 0)))} (${p1.rating || 0})`, `${'★'.repeat(Math.floor(Math.min(5, p2.rating || 0)))} (${p2.rating || 0})`],
        ['المخزون', p1.stock || '0', p2.stock || '0'],
        ['الشاشة', p1.specs?.الشاشة || '-', p2.specs?.الشاشة || '-'],
        ['البطارية', p1.specs?.البطارية || '-', p2.specs?.البطارية || '-'],
        ['الكاميرا', p1.specs?.الكاميرا || '-', p2.specs?.الكاميرا || '-'],
        ['المعالج', p1.specs?.المعالج || '-', p2.specs?.المعالج || '-']
    ];
    
    let tableHtml = `
        <table class="compare-table">
            <thead>
                <tr>
                    <th>المواصفة</th>
                    <th>${escapeHtml(p1.name.substring(0, 30))}</th>
                    <th>${escapeHtml(p2.name.substring(0, 30))}</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    rows.forEach(row => {
        tableHtml += `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`;
    });
    
    tableHtml += '</tbody></table>';
    
    const container = document.getElementById('compareTableContainer');
    if (container) container.innerHTML = tableHtml;
    
    const modal = document.getElementById('compareModal');
    if (modal) modal.classList.add('show');
}

function closeCompareModal(event) {
    if (event && event.target !== document.getElementById('compareModal')) return;
    const modal = document.getElementById('compareModal');
    if (modal) modal.classList.remove('show');
}

// ========== عرض المنتج السريع ==========
function openProductQuickView(productId) {
    const product = allProducts[productId];
    if (!product || product.stock === 0) return;
    
    selectedActiveProduct = product;
    selectedStorage = null;
    selectedColor = null;
    
    // تعبئة البيانات
    document.getElementById('modalProductTitle').innerText = product.name;
    document.getElementById('modalProductBrand').innerHTML = product.brand || 'هاتف';
    document.getElementById('modalProductPrice').innerHTML = formatCurrency(product.price);
    
    const oldPriceEl = document.getElementById('modalProductOldPrice');
    if (product.oldPrice && product.oldPrice > product.price) {
        oldPriceEl.innerHTML = formatCurrency(product.oldPrice);
        oldPriceEl.style.display = 'block';
    } else {
        oldPriceEl.style.display = 'none';
    }
    
    // المواصفات
    const specsGrid = document.getElementById('modalSpecsGrid');
    if (specsGrid) {
        specsGrid.innerHTML = '';
        if (product.specs) {
            Object.entries(product.specs).forEach(([key, value]) => {
                specsGrid.innerHTML += `
                    <div class="spec-item">
                        <div class="spec-label">${key}</div>
                        <div class="spec-value">${escapeHtml(value)}</div>
                    </div>
                `;
            });
        }
    }
    
    // الصور
    const mainImg = document.getElementById('modalMainImg');
    const thumbRow = document.getElementById('modalThumbnailsRow');
    const images = (product.images && product.images.length > 0) ? product.images : ['https://placehold.co/400x400?text=Phone'];
    
    if (mainImg) mainImg.src = images[0];
    if (thumbRow) {
        thumbRow.innerHTML = '';
        images.forEach((url, index) => {
            const thumb = document.createElement('img');
            thumb.src = url;
            thumb.className = `thumb-img ${index === 0 ? 'active' : ''}`;
            thumb.onclick = () => {
                if (mainImg) mainImg.src = url;
                document.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            };
            thumbRow.appendChild(thumb);
        });
    }
    
    // سعات التخزين
    const storageSection = document.getElementById('modalStorageSection');
    const storageChips = document.getElementById('modalStorageChips');
    if (product.storage && product.storage.length > 0) {
        if (storageSection) storageSection.style.display = 'block';
        if (storageChips) {
            storageChips.innerHTML = '';
            product.storage.forEach(s => {
                const chip = document.createElement('div');
                chip.className = 'chip';
                chip.textContent = s;
                chip.onclick = () => {
                    selectedStorage = s;
                    storageChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                };
                storageChips.appendChild(chip);
            });
        }
    } else if (storageSection) {
        storageSection.style.display = 'none';
    }
    
    // الألوان
    const colorSection = document.getElementById('modalColorSection');
    const colorChips = document.getElementById('modalColorChips');
    if (product.colors && product.colors.length > 0) {
        if (colorSection) colorSection.style.display = 'block';
        if (colorChips) {
            colorChips.innerHTML = '';
            product.colors.forEach(c => {
                const chip = document.createElement('div');
                chip.className = 'color-chip';
                chip.style.setProperty('--color', COLOR_HEX_MAP[c] || '#888888');
                chip.title = c;
                chip.onclick = () => {
                    selectedColor = c;
                    colorChips.querySelectorAll('.color-chip').forEach(cc => cc.classList.remove('active'));
                    chip.classList.add('active');
                };
                colorChips.appendChild(chip);
            });
        }
    } else if (colorSection) {
        colorSection.style.display = 'none';
    }
    
    // إعادة تعيين النموذج
    selectedDeliveryType = 'home';
    document.querySelectorAll('.delivery-opt').forEach(opt => opt.classList.remove('active'));
    const homeOpt = document.querySelector('.delivery-opt[data-value="home"]');
    if (homeOpt) homeOpt.classList.add('active');
    
    const wilayaSelect = document.getElementById('custWilaya');
    if (wilayaSelect) wilayaSelect.value = '';
    
    document.getElementById('custName').value = '';
    document.getElementById('custPhone').value = '';
    document.getElementById('custBaladia').value = '';
    
    calculateLiveShipping();
    openDrawer('productViewDrawer');
}

// ========== الشحن والتوصيل ==========
function selectDelivery(value, element) {
    selectedDeliveryType = value;
    document.querySelectorAll('.delivery-opt').forEach(opt => opt.classList.remove('active'));
    if (element) element.classList.add('active');
    calculateLiveShipping();
}

function calculateLiveShipping() {
    if (!selectedActiveProduct) return;
    
    const select = document.getElementById('custWilaya');
    const selectedOption = select.options[select.selectedIndex];
    
    let shippingFee = 0;
    if (selectedOption && selectedOption.value) {
        const home = parseFloat(selectedOption.dataset.home) || 0;
        const office = parseFloat(selectedOption.dataset.office) || 0;
        shippingFee = selectedDeliveryType === 'office' ? office : home;
    }
    
    const productPrice = selectedActiveProduct.price;
    const total = productPrice + shippingFee;
    
    document.getElementById('summaryProductPrice').innerHTML = formatCurrency(productPrice);
    document.getElementById('summaryShippingFee').innerHTML = formatCurrency(shippingFee);
    document.getElementById('summaryGrandTotal').innerHTML = formatCurrency(total);
}

// ========== تقديم الطلب ==========
async function submitDirectOrder() {
    if (!selectedActiveProduct) {
        showToast('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
        return;
    }
    
    const name = document.getElementById('custName')?.value.trim();
    const phone = document.getElementById('custPhone')?.value.trim();
    const wilayaCode = document.getElementById('custWilaya')?.value;
    const baladia = document.getElementById('custBaladia')?.value.trim();
    
    if (!name || !phone || !wilayaCode || !baladia) {
        showToast('يرجى استكمال جميع البيانات', 'error');
        return;
    }
    
    // التحقق من رقم الهاتف
    const phoneRegex = /^(05|06|07|09)[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
        showToast('رقم الهاتف غير صحيح (يجب أن يبدأ بـ 05،06،07،09 ويتكون من 10 أرقام)', 'error');
        return;
    }
    
    // التحقق من اختيار السعة واللون إذا كانت مطلوبة
    if (selectedActiveProduct.storage?.length > 0 && !selectedStorage) {
        showToast('يرجى اختيار سعة التخزين', 'error');
        return;
    }
    
    if (selectedActiveProduct.colors?.length > 0 && !selectedColor) {
        showToast('يرجى اختيار اللون', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submitOrderBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ جاري الإرسال...';
    }
    
    // إنشاء رقم طلب فريد
    const orderId = Math.floor(100000 + Math.random() * 900000).toString();
    
    // حساب تكلفة الشحن
    const select = document.getElementById('custWilaya');
    const selectedOption = select.options[select.selectedIndex];
    const homeFee = parseFloat(selectedOption.dataset.home) || 0;
    const officeFee = parseFloat(selectedOption.dataset.office) || 0;
    const finalFee = selectedDeliveryType === 'office' ? officeFee : homeFee;
    const finalTotal = selectedActiveProduct.price + finalFee;
    
    // وصف المنتج
    let productDesc = selectedActiveProduct.name;
    if (selectedStorage) productDesc += ` - ${selectedStorage}`;
    if (selectedColor) productDesc += ` - ${selectedColor}`;
    
    const wilayaName = selectedOption.textContent.replace(/^\d+\s*-\s*/, '');
    
    lastOrderProductId = selectedActiveProduct.id;
    
    const orderData = {
        orderId: orderId,
        name: name,
        phone: phone,
        wilaya: wilayaName,
        wilayaCode: wilayaCode,
        baladia: baladia,
        deliveryType: selectedDeliveryType === 'home' ? 'توصيل للمنزل' : 'استلام من المكتب',
        product: productDesc,
        productId: selectedActiveProduct.id,
        productBrand: selectedActiveProduct.brand || '',
        storage: selectedStorage || '',
        color: selectedColor || '',
        totalPrice: finalTotal,
        status: 'قيد الانتظار',
        createdAt: new Date().toISOString()
    };
    
    try {
        // حفظ الطلب في Firebase
        await db.ref(`${DB_REF.orders}/${orderId}`).set(orderData);
        
        // إرسال إشعار تيليجرام (اختياري)
        sendTelegramNotification(orderData);
        
        // إغلاق الدراور
        forceCloseDrawer('productViewDrawer');
        
        // عرض رسالة الشكر
        document.getElementById('thankYouOrderId').innerText = orderId;
        document.getElementById('thankYouModal').classList.add('show');
        
        showToast('تم تسجيل طلبك بنجاح! رقم الطلب: ' + orderId, 'success');
        
    } catch (error) {
        console.error('خطأ في حفظ الطلب:', error);
        showToast('حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '⚡ تأكيد طلب الشراء الآن';
        }
    }
}

async function sendTelegramNotification(order) {
    try {
        const message = `🔔 طلبية جديدة 📱
━━━━━━━━━━━━━━━
🆔 رقم الطلب: ${order.orderId}
👤 الاسم: ${order.name}
📞 الهاتف: ${order.phone}
📍 الولاية: ${order.wilaya}
🏙️ البلدية: ${order.baladia}
🚚 التوصيل: ${order.deliveryType}
🛍️ المنتج: ${order.product}
💰 الإجمالي: ${formatCurrency(order.totalPrice)}
━━━━━━━━━━━━━━━
✅ حالة الطلب: قيد الانتظار`;
        
        // ملاحظة: يجب استبدال هذه البيانات ببيانات بوت التيليجرام الخاص بك
        // const response = await fetch(`https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         chat_id: 'YOUR_CHAT_ID',
        //         text: message
        //     })
        // });
    } catch (error) {
        console.error('خطأ في إرسال إشعار تيليجرام:', error);
    }
}

// ========== تتبع الطلب ==========
async function trackOrderLive() {
    const orderId = document.getElementById('trackOrderIdInput')?.value.trim();
    const resultBox = document.getElementById('trackResult');
    
    if (!orderId) {
        showToast('يرجى إدخال رقم الطلب', 'error');
        return;
    }
    
    try {
        const snapshot = await db.ref(`${DB_REF.orders}/${orderId}`).once('value');
        const order = snapshot.val();
        
        if (order) {
            document.getElementById('resProdName').innerHTML = escapeHtml(order.product || '-');
            document.getElementById('resTotalPrice').innerHTML = formatCurrency(order.totalPrice || 0);
            
            const statusSpan = document.getElementById('resStatus');
            const status = order.status || 'قيد الانتظار';
            statusSpan.innerHTML = status;
            
            // تعيين لون الحالة
            statusSpan.className = 'status-badge';
            if (status === 'تم الشحن') statusSpan.classList.add('status-shipped');
            else if (status === 'تم التوصيل') statusSpan.classList.add('status-completed');
            else if (status === 'تم التأكيد') statusSpan.classList.add('status-confirmed');
            else statusSpan.classList.add('status-pending');
            
            if (resultBox) resultBox.style.display = 'block';
        } else {
            showToast('❌ لم يتم العثور على طلب بهذا الرقم', 'error');
            if (resultBox) resultBox.style.display = 'none';
        }
    } catch (error) {
        console.error('خطأ في تتبع الطلب:', error);
        showToast('حدث خطأ أثناء الاستعلام', 'error');
    }
}

// ========== تقييم المنتج ==========
async function submitRating() {
    const selectedRating = document.querySelector('input[name="rating"]:checked')?.value;
    
    if (!selectedRating) {
        showToast('يرجى اختيار تقييم للمنتج', 'error');
        return;
    }
    
    if (!lastOrderProductId) {
        showToast('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
        return;
    }
    
    const product = allProducts[lastOrderProductId];
    if (!product) return;
    
    const oldRating = product.rating || 0;
    const oldReviews = product.reviews || 0;
    const newReviews = oldReviews + 1;
    const newRating = Math.round(((oldRating * oldReviews) + parseInt(selectedRating)) / newReviews * 10) / 10;
    
    try {
        await db.ref(`${DB_REF.products}/${product.id}`).update({
            rating: newRating,
            reviews: newReviews
        });
        
        // تحديث محلي
        product.rating = newRating;
        product.reviews = newReviews;
        
        const ratingSection = document.getElementById('ratingSection');
        if (ratingSection) {
            ratingSection.innerHTML = `<p style="color:var(--accent-green); font-weight:700;">✅ شكراً على تقييمك! تم الحفظ.</p>`;
        }
        
        showToast('تم حفظ تقييمك بنجاح', 'success');
        
    } catch (error) {
        console.error('خطأ في حفظ التقييم:', error);
        showToast('حدث خطأ في حفظ التقييم', 'error');
    }
}

// ========== إدارة الدراور ==========
function openDrawer(id) {
    const drawer = document.getElementById(id);
    if (drawer) drawer.classList.add('show');
}

function forceCloseDrawer(id) {
    const drawer = document.getElementById(id);
    if (drawer) drawer.classList.remove('show');
}

function closeDrawer(event, id) {
    if (event.target === document.getElementById(id)) {
        forceCloseDrawer(id);
    }
}

// ========== مودال الشكر ==========
function closeThankYouModal() {
    const modal = document.getElementById('thankYouModal');
    if (modal) modal.classList.remove('show');
    
    // إعادة تعيين قسم التقييم
    const ratingSection = document.getElementById('ratingSection');
    if (ratingSection) {
        ratingSection.innerHTML = `
            <p style="color:#fff; font-size:13px; font-weight:700; margin-bottom: 8px;">⭐ قيّم المنتج الذي اخترته</p>
            <div class="star-rating-input" id="starRatingInput">
                <input type="radio" id="s5" name="rating" value="5"><label for="s5">★</label>
                <input type="radio" id="s4" name="rating" value="4"><label for="s4">★</label>
                <input type="radio" id="s3" name="rating" value="3"><label for="s3">★</label>
                <input type="radio" id="s2" name="rating" value="2"><label for="s2">★</label>
                <input type="radio" id="s1" name="rating" value="1"><label for="s1">★</label>
            </div>
            <button id="submitRatingBtn" class="btn-action" style="background:var(--gradient-gold); color:#0a0e16; font-weight:900; width:80%; margin: 0 auto 12px;" onclick="submitRating()">إرسال التقييم</button>
        `;
    }
}

// ========== الوضع الليلي والنهاري ==========
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.innerText = isLight ? '☀️' : '🌙';
    localStorage.setItem('storeTheme', isLight ? 'light' : 'dark');
}

function initTheme() {
    const savedTheme = localStorage.getItem('storeTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const btn = document.getElementById('themeToggleBtn');
        if (btn) btn.innerText = '☀️';
    }
}

// ========== إعدادات المستمعين ==========
function setupEventListeners() {
    // زر العودة للأعلى
    window.addEventListener('scroll', () => {
        const backBtn = document.getElementById('backToTop');
        if (backBtn) {
            if (window.scrollY > 400) backBtn.classList.add('visible');
            else backBtn.classList.remove('visible');
        }
    });
    
    // إغلاق المودالات عند الضغط خارجها
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('show');
        }
    });
}

// ========== تهيئة الصفحة ==========
initTheme();
