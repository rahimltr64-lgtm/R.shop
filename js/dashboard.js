// ============================================================
// هواتف ماركت - كود لوحة التحكم (نسخة معدلة لاستخدام i.postimg.cc)
// ============================================================

// متغيرات عامة
let allProductsData = {};
let allOrdersData = {};
let ordersChart = null;
let salesChart = null;
let selectedOrderKeys = new Set();
let currentEditProductKey = null;
let currentOrderKey = null;
let uploadImages = [];

// ============================================================
// دوال رفع الصور إلى i.postimg.cc (مجاني 100%)
// ============================================================

// رفع صورة واحدة إلى i.postimg.cc
async function uploadToPostImage(file) {
    return new Promise(async (resolve, reject) => {
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            // محاولة 1: i.postimg.cc
            const response = await fetch('https://i.postimg.cc/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result && result.image && result.image.url) {
                resolve(result.image.url);
                return;
            }
            
            // محاولة 2: خدمة بديلة مجانية
            const formData2 = new FormData();
            formData2.append('source', file);
            formData2.append('type', 'file');
            
            const response2 = await fetch('https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5', {
                method: 'POST',
                body: formData2
            });
            
            const result2 = await response2.json();
            if (result2 && result2.image && result2.image.url) {
                resolve(result2.image.url);
                return;
            }
            
            reject(new Error('فشل رفع الصورة'));
            
        } catch (error) {
            console.error('خطأ في رفع الصورة:', error);
            reject(error);
        }
    });
}

// ضغط الصورة قبل الرفع
function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxWidth = 1200;
                const maxHeight = 1200;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.8);
            };
        };
    });
}

// رفع صور متعددة
async function uploadMultipleImages(files) {
    const uploadedUrls = [];
    const progressBar = document.getElementById('uploadProgressBar');
    const progressContainer = document.getElementById('uploadProgress');
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // ضغط الصورة
        const compressedFile = await compressImage(file);
        
        if (progressContainer) progressContainer.style.display = 'block';
        if (progressBar) progressBar.style.width = `${((i + 1) / files.length) * 100}%`;
        
        try {
            const url = await uploadToPostImage(compressedFile);
            uploadedUrls.push(url);
            showToast(`✅ تم رفع الصورة ${i + 1} من ${files.length}`, 'success');
        } catch (error) {
            showToast(`❌ فشل رفع الصورة ${i + 1}`, 'error');
        }
    }
    
    if (progressContainer) progressContainer.style.display = 'none';
    if (progressBar) progressBar.style.width = '0%';
    
    return uploadedUrls;
}

// معالجة الملفات المختارة
async function handleImageFiles(files) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (uploadImages.length + imageFiles.length > 8) {
        showToast('⚠️ يمكنك رفع 8 صور كحد أقصى', 'error');
        return;
    }
    
    const newUrls = await uploadMultipleImages(imageFiles);
    uploadImages = [...uploadImages, ...newUrls];
    updateImagePreview();
    
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) fileInput.value = '';
}

function removeImage(index) {
    uploadImages.splice(index, 1);
    updateImagePreview();
}

function updateImagePreview() {
    const container = document.getElementById('imagesPreview');
    if (!container) return;
    
    if (uploadImages.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">📸 لم يتم رفع أي صور بعد. اسحب الصور هنا أو انقر للاختيار.</p>';
        return;
    }
    
    container.innerHTML = uploadImages.map((url, index) => `
        <div class="preview-image-item">
            <img src="${url}" alt="صورة المنتج" loading="lazy">
            <button class="preview-remove-btn" onclick="removeImage(${index})">✕</button>
        </div>
    `).join('');
}

function setupImageUpload() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('imageUpload');
    
    if (!dropzone) return;
    
    dropzone.addEventListener('click', () => {
        if (fileInput) fileInput.click();
    });
    
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
    });
    
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over');
    });
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleImageFiles(files);
        }
    });
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleImageFiles(Array.from(e.target.files));
            }
        });
    }
}

// ============================================================
// تهيئة الصفحة والمصادقة
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const isAdminUser = await isAdmin();
            if (isAdminUser) {
                showDashboard();
                await loadAllData();
                setupRealtimeListeners();
                setupImageUpload();
            } else {
                showLoginScreen('ليس لديك صلاحيات الدخول إلى لوحة التحكم');
            }
        } else {
            showLoginScreen();
        }
    });
});

function showLoginScreen(errorMsg = null) {
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('dashContainer').style.display = 'none';
    if (errorMsg) {
        const errorEl = document.getElementById('loginError');
        if (errorEl) {
            errorEl.textContent = errorMsg;
            errorEl.style.display = 'block';
        }
    }
}

function showDashboard() {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('dashContainer').style.display = 'block';
}

// ============================================================
// دوال تسجيل الدخول
// ============================================================

async function loginWithEmail() {
    const email = document.getElementById('adminEmail')?.value.trim();
    const password = document.getElementById('adminPassword')?.value;
    
    if (!email || !password) {
        showToast('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
        return;
    }
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims.admin === true || email === 'admin@phonesmarket.dz') {
            showDashboard();
            await loadAllData();
            setupRealtimeListeners();
            setupImageUpload();
        } else {
            await auth.signOut();
            showToast('ليس لديك صلاحيات الدخول إلى لوحة التحكم', 'error');
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showToast('فشل تسجيل الدخول: البريد أو كلمة المرور غير صحيحة', 'error');
    }
}

async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims.admin === true || user.email === 'admin@phonesmarket.dz') {
            showDashboard();
            await loadAllData();
            setupRealtimeListeners();
            setupImageUpload();
        } else {
            await auth.signOut();
            showToast('ليس لديك صلاحيات الدخول إلى لوحة التحكم', 'error');
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول بجوجل:', error);
        showToast('فشل تسجيل الدخول بجوجل', 'error');
    }
}

function logout() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        auth.signOut().then(() => {
            location.reload();
        });
    }
}

// ============================================================
// تحميل البيانات
// ============================================================

async function loadAllData() {
    showToast('جاري تحميل البيانات...', 'info');
    
    try {
        const [productsSnapshot, ordersSnapshot] = await Promise.all([
            db.ref(DB_REF.products).once('value'),
            db.ref(DB_REF.orders).once('value')
        ]);
        
        const productsRaw = productsSnapshot.val() || {};
        const ordersRaw = ordersSnapshot.val() || {};
        
        if (Array.isArray(productsRaw)) {
            allProductsData = {};
            productsRaw.forEach((item, i) => {
                if (item) allProductsData[item.id || i] = item;
            });
        } else {
            allProductsData = productsRaw;
        }
        
        if (Array.isArray(ordersRaw)) {
            allOrdersData = {};
            ordersRaw.forEach((item, i) => {
                if (item) allOrdersData[item.orderId || i] = item;
            });
        } else {
            allOrdersData = ordersRaw;
        }
        
        renderProductsTable();
        filterOrdersTable();
        calculateFinance();
        renderOrdersChart();
        renderSalesChart();
        renderTopProducts();
        renderOrdersByWilaya();
        
        const now = new Date();
        document.getElementById('lastUpdatedTime').innerHTML = now.toLocaleTimeString('ar-DZ');
        
        showToast('تم تحديث البيانات', 'success');
        
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        showToast('خطأ في تحميل البيانات', 'error');
    }
}

function setupRealtimeListeners() {
    db.ref(DB_REF.products).on('value', (snapshot) => {
        const data = snapshot.val() || {};
        if (Array.isArray(data)) {
            allProductsData = {};
            data.forEach((item, i) => {
                if (item) allProductsData[item.id || i] = item;
            });
        } else {
            allProductsData = data;
        }
        renderProductsTable();
        calculateFinance();
        renderTopProducts();
    });
    
    db.ref(DB_REF.orders).on('value', (snapshot) => {
        const data = snapshot.val() || {};
        if (Array.isArray(data)) {
            allOrdersData = {};
            data.forEach((item, i) => {
                if (item) allOrdersData[item.orderId || i] = item;
            });
        } else {
            allOrdersData = data;
        }
        filterOrdersTable();
        calculateFinance();
        renderOrdersChart();
        renderSalesChart();
        renderTopProducts();
        renderOrdersByWilaya();
    });
}

// ============================================================
// عرض المنتجات
// ============================================================

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const keys = Object.keys(allProductsData);
    document.getElementById('totalProductsNum').innerText = keys.length;
    
    const search = document.getElementById('productSearchInput')?.value.toLowerCase() || '';
    const brand = document.getElementById('productFilterBrand')?.value || 'الكل';
    const stockFilter = document.getElementById('productFilterStock')?.value || 'الكل';
    
    let lowStockCount = 0;
    let visible = 0;
    
    for (const key of keys) {
        const prod = allProductsData[key];
        if (!prod || prod.archived) continue;
        
        const matchSearch = !search || 
            (prod.name && prod.name.toLowerCase().includes(search)) || 
            (prod.brand && prod.brand.toLowerCase().includes(search));
        const matchBrand = brand === 'الكل' || prod.brand === brand;
        const stock = prod.stock || 0;
        const matchStock = stockFilter === 'الكل' ||
            (stockFilter === 'out' && stock === 0) ||
            (stockFilter === 'low' && stock > 0 && stock < 5) ||
            (stockFilter === 'ok' && stock >= 5);
        
        if (stock > 0 && stock < 5) lowStockCount++;
        
        if (matchSearch && matchBrand && matchStock) {
            visible++;
            const thumb = (prod.images && prod.images.length > 0) ? prod.images[0] : 'https://placehold.co/50';
            const stockColor = stock === 0 ? 'var(--accent-red)' : (stock < 5 ? 'var(--accent-gold)' : 'var(--accent-green)');
            const profit = (prod.price || 0) - (prod.cost || 0);
            const profitColor = profit > 0 ? 'var(--accent-green)' : 'var(--accent-red)';
            
            tbody.innerHTML += `
                <tr>
                    <td><strong style="color:var(--accent-blue);">#${prod.id}</strong></td>
                    <td><img src="${thumb}" class="product-thumb" onerror="this.src='https://placehold.co/50'"></td>
                    <td><strong>${escapeHtml(prod.name)}</strong><br><small>${prod.category || ''} ${prod.isHot ? '🔥' : ''} ${prod.isNew ? '✨' : ''}</small></td>
                    <td><span style="color:var(--accent-blue);">${prod.brand || '-'}</span></td>
                    <td><strong style="color:var(--accent-gold);">${formatCurrency(prod.price || 0)}</strong></td>
                    <td>${formatCurrency(prod.cost || 0)}</td>
                    <td><strong style="color:${profitColor};">${formatCurrency(profit)}</strong></td>
                    <td><strong style="color:${stockColor};">${stock}</strong></td>
                    <td>★ ${prod.rating || 0} (${prod.reviews || 0})</td>
                    <td>
                        <button class="btn-icon" onclick="editProduct('${key}')">✏️</button>
                        <button class="btn-icon" onclick="duplicateProduct('${key}')">📋</button>
                        <button class="btn-icon danger" onclick="deleteProduct('${key}')">🗑️</button>
                     </td>
                 </tr>
            `;
        }
    }
    
    if (visible === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;">لا توجد منتجات مطابقة</td></tr>';
    }
}

// ============================================================
// إدارة المنتجات
// ============================================================

function openProductModal(editKey = null) {
    currentEditProductKey = editKey;
    uploadImages = [];
    updateImagePreview();
    
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    if (form) form.reset();
    
    if (editKey && allProductsData[editKey]) {
        document.getElementById('modalTitle').innerHTML = '✏️ تعديل المنتج';
        fillProductForm(allProductsData[editKey]);
    } else {
        document.getElementById('modalTitle').innerHTML = '➕ إضافة هاتف جديد';
        document.getElementById('editProductKey').value = '';
        document.getElementById('p_stock').value = 10;
        document.getElementById('p_isNew').value = 'true';
        document.getElementById('p_isHot').value = 'false';
    }
    
    if (modal) modal.classList.add('show');
}

function fillProductForm(product) {
    document.getElementById('editProductKey').value = currentEditProductKey;
    document.getElementById('p_id').value = product.id || '';
    document.getElementById('p_brand').value = product.brand || '';
    document.getElementById('p_cat').value = product.category || '';
    document.getElementById('p_name').value = product.name || '';
    document.getElementById('p_price').value = product.price || '';
    document.getElementById('p_oldPrice').value = product.oldPrice || '';
    document.getElementById('p_cost').value = product.cost || '';
    document.getElementById('p_installment').value = product.installment || '';
    document.getElementById('p_stock').value = product.stock || '';
    document.getElementById('p_rating').value = product.rating || '';
    document.getElementById('p_reviews').value = product.reviews || '';
    document.getElementById('p_colors').value = (product.colors || []).join(', ');
    document.getElementById('p_storage').value = (product.storage || []).join(', ');
    document.getElementById('p_isNew').value = product.isNew ? 'true' : 'false';
    document.getElementById('p_isHot').value = product.isHot ? 'true' : 'false';
    
    const specs = product.specs || {};
    document.getElementById('p_screen').value = specs['الشاشة'] || '';
    document.getElementById('p_battery').value = specs['البطارية'] || '';
    document.getElementById('p_camera').value = specs['الكاميرا'] || '';
    document.getElementById('p_processor').value = specs['المعالج'] || '';
    document.getElementById('p_ram').value = specs['الرام'] || '';
    document.getElementById('p_os').value = specs['النظام'] || '';
    
    uploadImages = [...(product.images || [])];
    updateImagePreview();
}

function closeProductModal(event) {
    if (event && event.target !== document.getElementById('productModal')) return;
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('show');
}

async function saveProduct() {
    const id = document.getElementById('p_id')?.value.trim();
    const brand = document.getElementById('p_brand')?.value;
    const category = document.getElementById('p_cat')?.value;
    const name = document.getElementById('p_name')?.value.trim();
    const price = parseInt(document.getElementById('p_price')?.value);
    const oldPrice = parseInt(document.getElementById('p_oldPrice')?.value) || 0;
    const cost = parseInt(document.getElementById('p_cost')?.value) || 0;
    const installment = parseInt(document.getElementById('p_installment')?.value) || 0;
    const stock = parseInt(document.getElementById('p_stock')?.value) || 0;
    const rating = parseFloat(document.getElementById('p_rating')?.value) || 0;
    const reviews = parseInt(document.getElementById('p_reviews')?.value) || 0;
    const colors = document.getElementById('p_colors')?.value.split(',').map(c => c.trim()).filter(c => c) || [];
    const storage = document.getElementById('p_storage')?.value.split(',').map(s => s.trim()).filter(s => s) || [];
    const isNew = document.getElementById('p_isNew')?.value === 'true';
    const isHot = document.getElementById('p_isHot')?.value === 'true';
    
    if (!id || !brand || !category || !name || !price || uploadImages.length === 0 || colors.length === 0) {
        showToast('يرجى ملء جميع الحقول المطلوبة (الاسم، السعر، الألوان، صورة واحدة على الأقل)', 'error');
        return;
    }
    
    const specs = {};
    const specFields = {
        'p_screen': 'الشاشة', 'p_battery': 'البطارية', 'p_camera': 'الكاميرا',
        'p_processor': 'المعالج', 'p_ram': 'الرام', 'p_os': 'النظام'
    };
    
    for (const [fieldId, specName] of Object.entries(specFields)) {
        const value = document.getElementById(fieldId)?.value.trim();
        if (value) specs[specName] = value;
    }
    
    const productData = {
        id: parseInt(id), brand, category, name, price, oldPrice, cost,
        installment, stock, rating, reviews, colors, storage, specs,
        images: uploadImages, isNew, isHot, updatedAt: new Date().toISOString()
    };
    
    try {
        await db.ref(`${DB_REF.products}/${id}`).set(productData);
        
        if (currentEditProductKey && currentEditProductKey !== id.toString()) {
            await db.ref(`${DB_REF.products}/${currentEditProductKey}`).remove();
        }
        
        showToast(currentEditProductKey ? '✅ تم تحديث المنتج' : '✅ تم إضافة المنتج', 'success');
        closeProductModal();
        await loadAllData();
        
    } catch (error) {
        console.error(error);
        showToast('❌ حدث خطأ أثناء حفظ المنتج', 'error');
    }
}

async function duplicateProduct(key) {
    const original = allProductsData[key];
    if (!original) return;
    
    const newId = Date.now();
    const duplicate = {
        ...original, id: newId, name: original.name + ' (نسخة)',
        stock: 0, rating: 0, reviews: 0, createdAt: new Date().toISOString()
    };
    
    try {
        await db.ref(`${DB_REF.products}/${newId}`).set(duplicate);
        showToast('✅ تم نسخ المنتج', 'success');
        await loadAllData();
    } catch (error) {
        showToast('❌ حدث خطأ', 'error');
    }
}

async function deleteProduct(key) {
    if (!confirm('⚠️ حذف المنتج نهائياً؟ لا يمكن التراجع!')) return;
    
    try {
        await db.ref(`${DB_REF.products}/${key}`).remove();
        showToast('🗑️ تم حذف المنتج', 'success');
        await loadAllData();
    } catch (error) {
        showToast('❌ حدث خطأ', 'error');
    }
}

function editProduct(key) {
    openProductModal(key);
}

// ============================================================
// عرض الطلبات
// ============================================================

function filterOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    let keys = Object.keys(allOrdersData);
    document.getElementById('totalOrdersNum').innerText = keys.length;
    
    const search = document.getElementById('orderSearchInput')?.value.toLowerCase() || '';
    const status = document.getElementById('statusFilterSelect')?.value || 'الكل';
    const wilaya = document.getElementById('wilayaFilterSelect')?.value || 'الكل';
    const sortBy = document.getElementById('orderSortSelect')?.value || 'newest';
    
    keys.sort((a, b) => {
        const oA = allOrdersData[a], oB = allOrdersData[b];
        if (!oA || !oB) return 0;
        switch (sortBy) {
            case 'newest': return new Date(oB.createdAt || 0) - new Date(oA.createdAt || 0);
            case 'oldest': return new Date(oA.createdAt || 0) - new Date(oB.createdAt || 0);
            case 'price_desc': return (oB.totalPrice || 0) - (oA.totalPrice || 0);
            case 'price_asc': return (oA.totalPrice || 0) - (oB.totalPrice || 0);
            default: return 0;
        }
    });
    
    let pending = 0, visible = 0;
    
    for (const key of keys) {
        const order = allOrdersData[key];
        if (!order) continue;
        
        const currentStatus = order.status || 'قيد الانتظار';
        if (currentStatus === 'قيد الانتظار') pending++;
        
        const matchSearch = !search || (order.name && order.name.toLowerCase().includes(search)) ||
            (order.phone && order.phone.includes(search)) ||
            (order.product && order.product.toLowerCase().includes(search)) ||
            (order.orderId && order.orderId.includes(search));
        const matchStatus = status === 'الكل' || currentStatus === status;
        const matchWilaya = wilaya === 'الكل' || order.wilaya === wilaya;
        
        if (!matchSearch || !matchStatus || !matchWilaya) continue;
        
        visible++;
        
        let badgeClass = 'status-pending';
        if (currentStatus === 'تم التأكيد') badgeClass = 'status-confirmed';
        else if (currentStatus === 'تم الشحن') badgeClass = 'status-shipped';
        else if (currentStatus === 'تم التوصيل') badgeClass = 'status-delivered';
        else if (currentStatus === 'ملغى') badgeClass = 'status-cancelled';
        
        const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-DZ') : '-';
        
        tbody.innerHTML += `
            <tr id="order-row-${key}">
                <td><input type="checkbox" class="row-checkbox" data-key="${key}" onchange="onRowCheckChange()"></td>
                <td><strong style="color:var(--accent-red);">${order.orderId || '-'}</strong></td>
                <td><strong>${escapeHtml(order.name || '-')}</strong>${order.storage ? `<br><small>${order.storage}${order.color ? ' • ' + order.color : ''}</small>` : ''}</td>
                <td><a href="tel:${order.phone}" style="color:var(--accent-blue);">${order.phone || '-'}</a></td>
                <td><small>${order.wilaya || '-'}<br>${order.baladia || ''}</small></td>
                <td><small>${order.productBrand ? '🏷️ ' + order.productBrand + '<br>' : ''}${escapeHtml(order.product || '-')}</small></td>
                <td><strong style="color:var(--accent-gold);">${formatCurrency(order.totalPrice || 0)}</strong></td>
                <td>
                    <select class="status-select" onchange="updateOrderStatus('${key}', this.value)">
                        <option value="قيد الانتظار" ${currentStatus === 'قيد الانتظار' ? 'selected' : ''}>⏳ قيد الانتظار</option>
                        <option value="تم التأكيد" ${currentStatus === 'تم التأكيد' ? 'selected' : ''}>📞 تم التأكيد</option>
                        <option value="تم الشحن" ${currentStatus === 'تم الشحن' ? 'selected' : ''}>🚚 تم الشحن</option>
                        <option value="تم التوصيل" ${currentStatus === 'تم التوصيل' ? 'selected' : ''}>✅ تم التوصيل</option>
                        <option value="ملغى" ${currentStatus === 'ملغى' ? 'selected' : ''}>❌ ملغى</option>
                    </select>
                    <br><span class="status-badge ${badgeClass}">${currentStatus}</span>
                </td>
                <td><small>${dateStr}</small></td>
                <td>
                    <button class="btn-icon success" onclick="viewOrderDetail('${key}')">👁️</button>
                    <button class="btn-icon" onclick="printOrderInvoice('${key}')">🖨️</button>
                    <button class="btn-icon danger" onclick="deleteOrder('${key}')">🗑️</button>
                </td>
            </tr>
        `;
    }
    
    document.getElementById('pendingOrdersNum').innerText = pending;
    const ordersCount = document.getElementById('ordersCount');
    if (ordersCount) ordersCount.innerText = visible > 0 ? `عرض ${visible} من ${keys.length} طلب` : 'لا توجد نتائج مطابقة';
    
    if (visible === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;">لا توجد طلبات مطابقة</td></tr>';
    }
}

// ============================================================
// إدارة الطلبات
// ============================================================

async function updateOrderStatus(key, newStatus) {
    if (!newStatus) return;
    try {
        await db.ref(`${DB_REF.orders}/${key}`).update({ status: newStatus, updatedAt: new Date().toISOString() });
        showToast(`✅ تم تحديث الحالة إلى: ${newStatus}`, 'success');
    } catch (error) {
        showToast('❌ فشل تحديث الحالة', 'error');
    }
}

function viewOrderDetail(key) {
    currentOrderKey = key;
    const order = allOrdersData[key];
    if (!order) return;
    
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('ar-DZ') : '-';
    
    const content = document.getElementById('orderDetailContent');
    if (content) {
        content.innerHTML = `
            <div class="order-detail-grid">
                <div class="order-detail-item"><div class="order-detail-label">🆔 رقم الطلب</div><div class="order-detail-value">${order.orderId || '-'}</div></div>
                <div class="order-detail-item"><div class="order-detail-label">👤 الزبون</div><div class="order-detail-value">${escapeHtml(order.name || '-')}</div></div>
                <div class="order-detail-item"><div class="order-detail-label">📞 رقم الهاتف</div><div class="order-detail-value">${order.phone || '-'}</div></div>
                <div class="order-detail-item"><div class="order-detail-label">📍 الولاية</div><div class="order-detail-value">${order.wilaya || '-'}</div></div>
                <div class="order-detail-item"><div class="order-detail-label">🏙️ البلدية</div><div class="order-detail-value">${order.baladia || '-'}</div></div>
                <div class="order-detail-item"><div class="order-detail-label">🚚 نوع التوصيل</div><div class="order-detail-value">${order.deliveryType || '-'}</div></div>
                <div class="order-detail-item" style="grid-column:span 2"><div class="order-detail-label">🛍️ المنتج</div><div class="order-detail-value">${escapeHtml(order.product || '-')}</div></div>
                <div class="order-detail-item"><div class="order-detail-label">💰 الإجمالي</div><div class="order-detail-value">${formatCurrency(order.totalPrice || 0)}</div></div>
                <div class="order-detail-item"><div class="order-detail-label">🚦 الحالة</div><div class="order-detail-value">${order.status || 'قيد الانتظار'}</div></div>
                <div class="order-detail-item" style="grid-column:span 2"><div class="order-detail-label">📅 تاريخ الطلب</div><div class="order-detail-value">${dateStr}</div></div>
            </div>
        `;
    }
    
    document.getElementById('orderDetailModal').classList.add('show');
}

function closeOrderDetailModal(event) {
    if (event && event.target !== document.getElementById('orderDetailModal')) return;
    document.getElementById('orderDetailModal').classList.remove('show');
}

async function deleteOrder(key) {
    if (!confirm('⚠️ حذف الطلب نهائياً؟')) return;
    try {
        await db.ref(`${DB_REF.orders}/${key}`).remove();
        showToast('🗑️ تم حذف الطلب', 'success');
        await loadAllData();
    } catch (error) {
        showToast('❌ حدث خطأ', 'error');
    }
}

// ============================================================
// طباعة الفاتورة
// ============================================================

function printOrderInvoice(key) {
    const order = allOrdersData[key];
    if (!order) return;
    
    const product = allProductsData[order.productId];
    const productPrice = product ? product.price : (order.totalPrice || 0);
    const shippingFee = (order.totalPrice || 0) - productPrice;
    
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-DZ') : new Date().toLocaleDateString('ar-DZ');
    
    const invoiceHTML = `
        <div class="inv-header">
            <div class="inv-logo-block"><h1>📱 هواتف ماركت</h1><p>أكبر متجر هواتف في الجزائر</p></div>
            <div class="inv-meta">
                <h2>فاتورة طلب</h2>
                <div class="inv-meta-row">رقم الفاتورة: <span>#${order.orderId || '-'}</span></div>
                <div class="inv-meta-row">التاريخ: <span>${dateStr}</span></div>
            </div>
        </div>
        <div class="inv-section-title">معلومات الزبون</div>
        <div class="inv-info-grid">
            <div class="inv-info-cell"><div class="lbl">الاسم الكامل</div><div class="val">${escapeHtml(order.name || '-')}</div></div>
            <div class="inv-info-cell"><div class="lbl">رقم الهاتف</div><div class="val">${order.phone || '-'}</div></div>
            <div class="inv-info-cell"><div class="lbl">الولاية</div><div class="val">${order.wilaya || '-'}</div></div>
            <div class="inv-info-cell"><div class="lbl">البلدية</div><div class="val">${order.baladia || '-'}</div></div>
        </div>
        <div class="inv-section-title">تفاصيل الطلب</div>
        <table class="inv-product-table">
            <thead><tr><th>المنتج</th><th>الماركة</th><th>المواصفات</th><th>السعر</th></tr></thead>
            <tbody><tr><td><strong>${escapeHtml(product ? product.name : (order.product || '-'))}</strong></td>
            <td>${order.productBrand || (product ? product.brand : '-')}</td>
            <td>${order.storage ? '💾 ' + order.storage : ''} ${order.color ? '🎨 ' + order.color : ''}</td>
            <td>${formatCurrency(productPrice)}</td></tr></tbody>
        </table>
        <div class="inv-totals">
            <div class="inv-total-row"><span>سعر المنتج</span><span>${formatCurrency(productPrice)}</span></div>
            <div class="inv-total-row"><span>تكلفة الشحن</span><span>${shippingFee > 0 ? formatCurrency(shippingFee) : 'مجاني'}</span></div>
            <div class="inv-total-row"><span>المبلغ الإجمالي</span><span>${formatCurrency(order.totalPrice || 0)}</span></div>
        </div>
        <div class="inv-footer"><div>شكراً لثقتكم بنا 🙏</div><div>${new Date().toLocaleDateString('ar-DZ')}</div></div>
    `;
    
    const printArea = document.getElementById('invoicePrintArea');
    if (printArea) {
        printArea.innerHTML = invoiceHTML;
        window.print();
        printArea.innerHTML = '';
    }
}

// ============================================================
// الإحصائيات
// ============================================================

function calculateFinance() {
    let totalSales = 0, totalProfit = 0, pendingValue = 0;
    
    for (const key in allOrdersData) {
        const order = allOrdersData[key];
        if (!order) continue;
        const status = order.status || 'قيد الانتظار';
        const price = order.totalPrice || 0;
        
        if (['تم التأكيد', 'تم الشحن', 'تم التوصيل'].includes(status)) {
            totalSales += price;
            const product = allProductsData[order.productId];
            if (product && product.cost) totalProfit += Math.max(0, price - product.cost);
        }
        if (status === 'قيد الانتظار') pendingValue += price;
    }
    
    document.getElementById('totalSalesNum').innerHTML = formatCurrency(totalSales);
    document.getElementById('netProfitNum').innerHTML = formatCurrency(totalProfit);
    document.getElementById('pendingOrdersValue').innerHTML = formatCurrency(pendingValue);
}

function renderOrdersChart() {
    const counts = { 'قيد الانتظار': 0, 'تم التأكيد': 0, 'تم الشحن': 0, 'تم التوصيل': 0, 'ملغى': 0 };
    for (const key in allOrdersData) {
        const order = allOrdersData[key];
        if (order) counts[order.status || 'قيد الانتظار']++;
    }
    
    const ctx = document.getElementById('ordersStatusChart');
    if (!ctx) return;
    if (ordersChart) ordersChart.destroy();
    
    ordersChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ['#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#94a3b8'], borderWidth: 0 }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } } }
    });
}

function renderSalesChart() {
    const monthlySales = {};
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    for (const key in allOrdersData) {
        const order = allOrdersData[key];
        if (!order || !order.createdAt) continue;
        if (!['تم التأكيد', 'تم الشحن', 'تم التوصيل'].includes(order.status || '')) continue;
        
        const date = new Date(order.createdAt);
        const keyName = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthlySales[keyName]) monthlySales[keyName] = { total: 0, month: date.getMonth(), year: date.getFullYear() };
        monthlySales[keyName].total += order.totalPrice || 0;
    }
    
    const sorted = Object.values(monthlySales).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    if (salesChart) salesChart.destroy();
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: { labels: sorted.map(m => `${months[m.month]} ${m.year}`), datasets: [{ label: 'المبيعات (DA)', data: sorted.map(m => m.total), borderColor: '#f5b041', backgroundColor: 'rgba(245,176,65,0.1)', fill: true, tension: 0.3 }] },
        options: { responsive: true, plugins: { tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } } } }
    });
}

function renderTopProducts() {
    const counts = {};
    for (const key in allOrdersData) {
        const order = allOrdersData[key];
        if (order) counts[order.productId || order.product] = (counts[order.productId || order.product] || 0) + 1;
    }
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const container = document.getElementById('topProductsList');
    if (!container) return;
    
    if (sorted.length === 0) { container.innerHTML = '<p style="text-align:center;">لا توجد طلبات بعد</p>'; return; }
    
    container.innerHTML = sorted.map(([id, count], i) => {
        const product = allProductsData[id];
        return `<div class="top-product-item"><div class="top-rank ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div><div class="top-product-name">${escapeHtml(product ? product.name : id)}</div><div class="top-product-count">${count} طلب</div></div>`;
    }).join('');
}

function renderOrdersByWilaya() {
    const counts = {};
    for (const key in allOrdersData) {
        const order = allOrdersData[key];
        if (order && order.wilaya) counts[order.wilaya] = (counts[order.wilaya] || 0) + 1;
    }
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const container = document.getElementById('ordersByWilayaList');
    if (!container) return;
    
    if (sorted.length === 0) { container.innerHTML = '<p style="text-align:center;">لا توجد طلبات بعد</p>'; return; }
    
    container.innerHTML = sorted.map(([wilaya, count], i) => `<div class="top-product-item"><div class="top-rank">${i + 1}</div><div class="top-product-name">${escapeHtml(wilaya)}</div><div class="top-product-count">${count} طلب</div></div>`).join('');
}

// ============================================================
// التحديث الجماعي
// ============================================================

function onRowCheckChange() {
    selectedOrderKeys.clear();
    document.querySelectorAll('.row-checkbox:checked').forEach(cb => selectedOrderKeys.add(cb.dataset.key));
    
    const allCb = document.querySelectorAll('.row-checkbox');
    const selectAll = document.getElementById('selectAllCheckbox');
    if (selectAll) {
        selectAll.indeterminate = selectedOrderKeys.size > 0 && selectedOrderKeys.size < allCb.length;
        selectAll.checked = allCb.length > 0 && selectedOrderKeys.size === allCb.length;
    }
    
    document.querySelectorAll('.row-checkbox').forEach(cb => {
        const row = cb.closest('tr');
        if (row) cb.checked ? row.classList.add('selected-row') : row.classList.remove('selected-row');
    });
    
    updateBulkBar();
}

function toggleSelectAll(master) {
    document.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.checked = master.checked;
        const row = cb.closest('tr');
        if (row) cb.checked ? row.classList.add('selected-row') : row.classList.remove('selected-row');
    });
    selectedOrderKeys.clear();
    if (master.checked) document.querySelectorAll('.row-checkbox').forEach(cb => selectedOrderKeys.add(cb.dataset.key));
    updateBulkBar();
}

function updateBulkBar() {
    const bar = document.getElementById('bulkActionBar');
    document.getElementById('bulkCount').innerText = selectedOrderKeys.size;
    bar ? (selectedOrderKeys.size > 0 ? bar.classList.add('show') : bar.classList.remove('show')) : null;
}

function clearBulkSelection() {
    selectedOrderKeys.clear();
    document.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.checked = false;
        const row = cb.closest('tr');
        if (row) row.classList.remove('selected-row');
    });
    const selectAll = document.getElementById('selectAllCheckbox');
    if (selectAll) selectAll.checked = false;
    document.getElementById('bulkStatusSelect').value = '';
    updateBulkBar();
}

async function applyBulkStatus() {
    const newStatus = document.getElementById('bulkStatusSelect')?.value;
    if (!newStatus) { showToast('اختر الحالة أولاً', 'error'); return; }
    if (selectedOrderKeys.size === 0) { showToast('لم تحدد أي طلب', 'error'); return; }
    if (!confirm(`تطبيق "${newStatus}" على ${selectedOrderKeys.size} طلب؟`)) return;
    
    const keys = Array.from(selectedOrderKeys);
    let completed = 0;
    const progressWrap = document.getElementById('bulkProgressWrap');
    const progressBar = document.getElementById('bulkProgressBar');
    if (progressWrap) progressWrap.style.display = 'block';
    
    for (const key of keys) {
        try {
            await db.ref(`${DB_REF.orders}/${key}`).update({ status: newStatus, updatedAt: new Date().toISOString() });
            if (allOrdersData[key]) allOrdersData[key].status = newStatus;
        } catch (e) { console.error(e); }
        completed++;
        if (progressBar) progressBar.style.width = `${(completed / keys.length) * 100}%`;
    }
    
    if (progressWrap) progressWrap.style.display = 'none';
    if (progressBar) progressBar.style.width = '0%';
    
    showToast(`✅ تم تحديث ${keys.length} طلب`, 'success');
    clearBulkSelection();
    filterOrdersTable();
    calculateFinance();
    renderOrdersChart();
}

// ============================================================
// دوال التصدير
// ============================================================

function exportOrdersCSV() {
    const orders = Object.values(allOrdersData);
    if (orders.length === 0) { showToast('لا توجد طلبات', 'error'); return; }
    
    const headers = ['رقم الطلب', 'الاسم', 'الهاتف', 'الولاية', 'المنتج', 'الإجمالي', 'الحالة', 'التاريخ'];
    const rows = orders.map(o => [o.orderId, o.name, o.phone, o.wilaya, o.product, o.totalPrice, o.status, o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''].map(v => `"${v}"`).join(','));
    
    const blob = new Blob(['\uFEFF' + [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم التصدير', 'success');
}

function exportProductsCSV() {
    const products = Object.values(allProductsData);
    if (products.length === 0) { showToast('لا توجد منتجات', 'error'); return; }
    
    const headers = ['ID', 'الاسم', 'الماركة', 'السعر', 'المخزون', 'التقييم'];
    const rows = products.map(p => [p.id, p.name, p.brand, p.price, p.stock, p.rating].map(v => `"${v}"`).join(','));
    
    const blob = new Blob(['\uFEFF' + [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم التصدير', 'success');
}

// ============================================================
// دوال مساعدة
// ============================================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toastMsg');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => { toast.className = 'toast'; }, 3000);
    }
}

// تصدير الدوال للنطاق العام
window.loginWithEmail = loginWithEmail;
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.loadAllData = loadAllData;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.duplicateProduct = duplicateProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetail = viewOrderDetail;
window.closeOrderDetailModal = closeOrderDetailModal;
window.deleteOrder = deleteOrder;
window.printOrderInvoice = printOrderInvoice;
window.exportOrdersCSV = exportOrdersCSV;
window.exportProductsCSV = exportProductsCSV;
window.filterOrdersTable = filterOrdersTable;
window.onRowCheckChange = onRowCheckChange;
window.toggleSelectAll = toggleSelectAll;
window.clearBulkSelection = clearBulkSelection;
window.applyBulkStatus = applyBulkStatus;
window.removeImage = removeImage;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.openShippingModal = openShippingModal;
window.closeShippingModal = closeShippingModal;
window.saveShippingRates = saveShippingRates;
