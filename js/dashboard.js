// ============================================================
// هواتف ماركت - كود لوحة التحكم
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
let uploadProgress = 0;

// تهيئة لوحة التحكم
document.addEventListener('DOMContentLoaded', async () => {
    // التحقق من حالة تسجيل الدخول
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const isAdminUser = await isAdmin();
            if (isAdminUser) {
                showDashboard();
                await loadAllData();
                setupRealtimeListeners();
            } else {
                showLoginScreen('ليس لديك صلاحيات الدخول إلى لوحة التحكم');
            }
        } else {
            showLoginScreen();
        }
    });
});

// ========== شاشة تسجيل الدخول ==========
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

// ========== تسجيل الدخول ==========
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
        
        // التحقق من صلاحيات الأدمن
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims.admin === true || email === 'admin@phonesmarket.dz') {
            showDashboard();
            await loadAllData();
            setupRealtimeListeners();
        } else {
            await auth.signOut();
            showToast('ليس لديك صلاحيات الدخول إلى لوحة التحكم', 'error');
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        let errorMessage = 'فشل تسجيل الدخول';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'البريد الإلكتروني غير مسجل';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'كلمة المرور غير صحيحة';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'البريد الإلكتروني غير صالح';
        }
        showToast(errorMessage, 'error');
    }
}

async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // التحقق من صلاحيات الأدمن
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims.admin === true || user.email === 'admin@phonesmarket.dz') {
            showDashboard();
            await loadAllData();
            setupRealtimeListeners();
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

// ========== تغيير كلمة المرور ==========
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('كلمة المرور الجديدة غير متطابقة', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    const user = auth.currentUser;
    if (!user || !user.email) {
        showToast('لم يتم العثور على المستخدم', 'error');
        return;
    }
    
    // إعادة المصادقة قبل تغيير كلمة المرور
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
    
    try {
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPassword);
        showToast('تم تغيير كلمة المرور بنجاح', 'success');
        
        // مسح الحقول
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        // إغلاق المودال إذا كان مفتوحاً
        closePasswordModal();
        
    } catch (error) {
        console.error('خطأ في تغيير كلمة المرور:', error);
        if (error.code === 'auth/wrong-password') {
            showToast('كلمة المرور الحالية غير صحيحة', 'error');
        } else {
            showToast('حدث خطأ أثناء تغيير كلمة المرور', 'error');
        }
    }
}

async function resetPassword() {
    const email = prompt('أدخل بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور:');
    if (!email) return;
    
    try {
        await auth.sendPasswordResetEmail(email);
        showToast('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', 'success');
    } catch (error) {
        console.error('خطأ في إعادة تعيين كلمة المرور:', error);
        showToast('فشل إرسال رابط إعادة التعيين', 'error');
    }
}

// ========== تحميل البيانات ==========
async function loadAllData() {
    showToast('جاري تحميل البيانات...', 'info');
    
    try {
        const [productsSnapshot, ordersSnapshot] = await Promise.all([
            db.ref(DB_REF.products).once('value'),
            db.ref(DB_REF.orders).once('value')
        ]);
        
        const productsRaw = productsSnapshot.val() || {};
        const ordersRaw = ordersSnapshot.val() || {};
        
        // معالجة المنتجات
        if (Array.isArray(productsRaw)) {
            allProductsData = {};
            productsRaw.forEach((item, i) => {
                if (item) allProductsData[item.id || i] = item;
            });
        } else {
            allProductsData = productsRaw;
        }
        
        // معالجة الطلبات
        if (Array.isArray(ordersRaw)) {
            allOrdersData = {};
            ordersRaw.forEach((item, i) => {
                if (item) allOrdersData[item.orderId || i] = item;
            });
        } else {
            allOrdersData = ordersRaw;
        }
        
        // تحديث واجهة المستخدم
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

// ========== مستمعات الوقت الفعلي ==========
function setupRealtimeListeners() {
    // مراقبة التغييرات في المنتجات
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
    
    // مراقبة التغييرات في الطلبات
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

// ========== عرض جدول المنتجات ==========
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
        if (!prod) continue;
        
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
                    <td class="product-name-cell">
                        <strong>${escapeHtml(prod.name)}</strong>
                        <small>${prod.category || ''} ${prod.isHot ? '🔥' : ''} ${prod.isNew ? '✨' : ''}</small>
                    </td>
                    <td><span style="color:var(--accent-blue);font-weight:700;">${prod.brand || '-'}</span></td>
                    <td><strong style="color:var(--accent-gold);">${formatCurrency(prod.price || 0)}</strong></td>
                    <td><span style="color:var(--text-muted);">${formatCurrency(prod.cost || 0)}</span></td>
                    <td><strong style="color:${profitColor};">${formatCurrency(profit)}</strong></td>
                    <td><strong style="color:${stockColor};">${stock}</strong></td>
                    <td><span style="color:var(--accent-gold);">★ ${prod.rating || 0}</span> <small style="color:var(--text-muted);">(${prod.reviews || 0})</small></td>
                    <td>
                        <button class="btn-icon" onclick="editProduct('${key}')" title="تعديل">✏️</button>
                        <button class="btn-icon" onclick="duplicateProduct('${key}')" title="نسخ">📋</button>
                        <button class="btn-icon success" onclick="toggleArchiveProduct('${key}')" title="${prod.archived ? 'إلغاء الأرشفة' : 'أرشفة'}">
                            ${prod.archived ? '📂' : '🗄️'}
                        </button>
                        <button class="btn-icon danger" onclick="deleteProduct('${key}')" title="حذف">🗑️</button>
                    </td>
                </tr>
            `;
        }
    }
    
    const stockAlertTrend = document.getElementById('stockAlertTrend');
    if (stockAlertTrend) {
        if (lowStockCount > 0) {
            stockAlertTrend.innerHTML = `<span class="trend-down">⚠️ ${lowStockCount} منتج بمخزون منخفض</span>`;
        } else {
            stockAlertTrend.innerHTML = '';
        }
    }
    
    if (visible === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد منتجات مطابقة</td></tr>';
    }
}

// ========== عرض جدول الطلبات ==========
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
    
    // ترتيب الطلبات
    keys.sort((a, b) => {
        const oA = allOrdersData[a];
        const oB = allOrdersData[b];
        if (!oA || !oB) return 0;
        switch (sortBy) {
            case 'newest': return new Date(oB.createdAt || 0) - new Date(oA.createdAt || 0);
            case 'oldest': return new Date(oA.createdAt || 0) - new Date(oB.createdAt || 0);
            case 'price_desc': return (oB.totalPrice || 0) - (oA.totalPrice || 0);
            case 'price_asc': return (oA.totalPrice || 0) - (oB.totalPrice || 0);
            default: return 0;
        }
    });
    
    let pending = 0;
    let visible = 0;
    
    for (const key of keys) {
        const order = allOrdersData[key];
        if (!order) continue;
        
        const currentStatus = order.status || 'قيد الانتظار';
        if (currentStatus === 'قيد الانتظار') pending++;
        
        const matchSearch = !search ||
            (order.name && order.name.toLowerCase().includes(search)) ||
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
                <td>
                    <strong style="color:#fff;">${escapeHtml(order.name || '-')}</strong>
                    ${order.storage ? `<br><small style="color:var(--accent-blue);">${escapeHtml(order.storage)}${order.color ? ' • ' + order.color : ''}</small>` : ''}
                </td>
                <td><a href="tel:${order.phone}" style="color:var(--accent-blue);text-decoration:none;font-weight:700;">${order.phone || '-'}</a></td>
                <td><small>${order.wilaya || '-'}<br><span style="color:var(--text-muted);">${order.baladia || ''}</span></small></td>
                <td><small>${order.productBrand ? '🏷️ ' + order.productBrand + '<br>' : ''}${escapeHtml(order.product || '-')}</small></td>
                <td><strong style="color:var(--accent-gold);">${formatCurrency(order.totalPrice || 0)}</strong></td>
                <td>
                    <select class="status-select" onchange="updateOrderStatus('${key}', this.value)">
                        <option value="">-- تعديل --</option>
                        <option value="قيد الانتظار" ${currentStatus === 'قيد الانتظار' ? 'selected' : ''}>⏳ قيد الانتظار</option>
                        <option value="تم التأكيد" ${currentStatus === 'تم التأكيد' ? 'selected' : ''}>📞 تم التأكيد</option>
                        <option value="تم الشحن" ${currentStatus === 'تم الشحن' ? 'selected' : ''}>🚚 تم الشحن</option>
                        <option value="تم التوصيل" ${currentStatus === 'تم التوصيل' ? 'selected' : ''}>✅ تم التوصيل</option>
                        <option value="ملغى" ${currentStatus === 'ملغى' ? 'selected' : ''}>❌ ملغى</option>
                    </select>
                    <br><span class="status-badge ${badgeClass}" style="margin-top:5px;">${currentStatus}</span>
                </td>
                <td><small style="color:var(--text-muted);">${dateStr}</small></td>
                <td>
                    <button class="btn-icon success" onclick="viewOrderDetail('${key}')" title="عرض">👁️</button>
                    <button class="btn-icon" onclick="printOrderInvoice('${key}')" title="طباعة">🖨️</button>
                    <button class="btn-icon danger" onclick="deleteOrder('${key}')" title="حذف">🗑️</button>
                </td>
            </tr>
        `;
    }
    
    const pendingOrdersNum = document.getElementById('pendingOrdersNum');
    if (pendingOrdersNum) pendingOrdersNum.innerText = pending;
    
    const ordersCount = document.getElementById('ordersCount');
    if (ordersCount) {
        ordersCount.innerText = visible > 0 ? `عرض ${visible} من ${keys.length} طلب` : 'لا توجد نتائج مطابقة';
    }
    
    if (visible === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد طلبات مطابقة</td></tr>';
    }
}

// ========== الحسابات المالية ==========
function calculateFinance() {
    let totalSales = 0;
    let totalProfit = 0;
    let pendingOrdersValue = 0;
    
    for (const key in allOrdersData) {
        const order = allOrdersData[key];
        if (!order) continue;
        
        const status = order.status || 'قيد الانتظار';
        const price = order.totalPrice || 0;
        
        if (['تم التأكيد', 'تم الشحن', 'تم التوصيل'].includes(status)) {
            totalSales += price;
            
            // حساب الربح
            if (order.productId) {
                const product = allProductsData[order.productId];
                if (product && product.cost) {
                    totalProfit += Math.max(0, price - product.cost);
                }
            }
        }
        
        if (status === 'قيد الانتظار') {
            pendingOrdersValue += price;
        }
    }
    
    document.getElementById('totalSalesNum').innerHTML = formatCurrency(totalSales);
    document.getElementById('netProfitNum').innerHTML = formatCurrency(totalProfit);
    document.getElementById('pendingOrdersValue').innerHTML = formatCurrency(pendingOrdersValue);
}

// ========== الرسوم البيانية ==========
function renderOrdersChart() {
    const counts = {
        'قيد الانتظار': 0,
        'تم التأكيد': 0,
        'تم الشحن': 0,
        'تم التوصيل': 0,
        'ملغى': 0
    };
    
    for (const key in allOrdersData) {
        const order = allOrdersData[key];
        if (order && order.status) {
            const status = order.status;
            if (counts[status] !== undefined) counts[status]++;
        } else if (order) {
            counts['قيد الانتظار']++;
        }
    }
    
    const ctx = document.getElementById('ordersStatusChart');
    if (!ctx) return;
    
    if (ordersChart) ordersChart.destroy();
    
    ordersChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: ['#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#94a3b8'],
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Cairo', size: 11 },
                        padding: 14,
                        boxWidth: 12
                    }
                }
            }
        }
    });
}

function renderSalesChart() {
    // إحصائيات المبيعات الشهرية
    const monthlySales = {};
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    for (const key in allOrdersData) {
        const order = allOrdersData[key];
        if (!order || !order.createdAt) continue;
        
        const status = order.status || 'قيد الانتظار';
        if (!['تم التأكيد', 'تم الشحن', 'تم التوصيل'].includes(status)) continue;
        
        const date = new Date(order.createdAt);
        const month = date.getMonth();
        const year = date.getFullYear();
        const keyName = `${year}-${month}`;
        
        if (!monthlySales[keyName]) {
            monthlySales[keyName] = { total: 0, month: month, year: year };
        }
        monthlySales[keyName].total += order.totalPrice || 0;
    }
    
    // ترتيب الأشهر
    const sortedMonths = Object.values(monthlySales).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
    });
    
    const labels = sortedMonths.map(m => `${months[m.month]} ${m.year}`);
    const data = sortedMonths.map(m => m.total);
    
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    if (salesChart) salesChart.destroy();
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'المبيعات (DA)',
                data: data,
                borderColor: '#f5b041',
                backgroundColor: 'rgba(245, 176, 65, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#f5b041',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => `${formatCurrency(context.raw)}`
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        }
    });
}

// ========== أعلى المنتجات مبيعاً ==========
function renderTopProducts() {
    const productCounts = {};
    
    for (const key in allOrdersData) {
        const order = allOrdersData[key];
        if (!order) continue;
        
        const productId = order.productId || order.product;
        if (!productId) continue;
        
        productCounts[productId] = (productCounts[productId] || 0) + 1;
    }
    
    const sorted = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const container = document.getElementById('topProductsList');
    if (!container) return;
    
    if (sorted.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">لا توجد طلبات بعد</p>';
        return;
    }
    
    container.innerHTML = sorted.map(([id, count], index) => {
        const product = allProductsData[id];
        const name = product ? product.name : `منتج #${id}`;
        let rankClass = '';
        let rankIcon = '';
        if (index === 0) {
            rankClass = 'rank-1';
            rankIcon = '🥇';
        } else if (index === 1) {
            rankClass = 'rank-2';
            rankIcon = '🥈';
        } else if (index === 2) {
            rankClass = 'rank-3';
            rankIcon = '🥉';
        } else {
            rankIcon = `${index + 1}.`;
        }
        
        return `
            <div class="top-product-item">
                <div class="top-rank ${rankClass}">${rankIcon}</div>
                <div class="top-product-name">${escapeHtml(name.substring(0, 40))}${name.length > 40 ? '...' : ''}</div>
                <div class="top-product-count">${count} طلب</div>
            </div>
        `;
    }).join('');
}

// ========== الطلبات حسب الولايات ==========
function renderOrdersByWilaya() {
    const wilayaCounts = {};
    
    for (const key in allOrdersData) {
        const order = allOrdersData[key];
        if (!order || !order.wilaya) continue;
        
        wilayaCounts[order.wilaya] = (wilayaCounts[order.wilaya] || 0) + 1;
    }
    
    const sorted = Object.entries(wilayaCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const container = document.getElementById('ordersByWilayaList');
    if (!container) return;
    
    if (sorted.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">لا توجد طلبات بعد</p>';
        return;
    }
    
    container.innerHTML = sorted.map(([wilaya, count], index) => `
        <div class="top-product-item">
            <div class="top-rank">${index + 1}.</div>
            <div class="top-product-name">${escapeHtml(wilaya)}</div>
            <div class="top-product-count">${count} طلب</div>
        </div>
    `).join('');
}

// ========== إدارة المنتجات ==========
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
        
        // تعيين قيم افتراضية
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
    document.getElementById('p_stock').value = product.stock !== undefined ? product.stock : '';
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
    
    const images = product.images || [];
    uploadImages = [...images];
    updateImagePreview();
}

function closeProductModal(event) {
    if (event && event.target !== document.getElementById('productModal')) return;
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('show');
}

// ========== رفع الصور ==========
function setupImageUpload() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('imageUpload');
    
    if (dropzone) {
        dropzone.addEventListener('click', () => fileInput?.click());
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
            handleImageFiles(files);
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleImageFiles(Array.from(e.target.files));
        });
    }
}

async function handleImageFiles(files) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    
    if (uploadImages.length + imageFiles.length > 8) {
        showToast('يمكنك رفع 8 صور كحد أقصى', 'error');
        return;
    }
    
    const progressBar = document.getElementById('uploadProgress');
    if (progressBar) progressBar.style.display = 'block';
    
    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        
        // ضغط الصورة
        const compressedFile = await compressImage(file);
        
        // رفع إلى Firebase Storage
        const fileName = `${Date.now()}_${i}_${file.name}`;
        const storageRef = storage.ref(`products/${fileName}`);
        
        const uploadTask = storageRef.put(compressedFile);
        
        await new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (progressBar) {
                        progressBar.style.width = `${progress}%`;
                    }
                },
                reject,
                async () => {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    uploadImages.push(downloadURL);
                    resolve();
                }
            );
        });
    }
    
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.style.display = 'none';
    }
    
    updateImagePreview();
    if (fileInput) fileInput.value = '';
}

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

function updateImagePreview() {
    const container = document.getElementById('imagesPreview');
    if (!container) return;
    
    if (uploadImages.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">لم يتم رفع أي صور بعد</p>';
        return;
    }
    
    container.innerHTML = uploadImages.map((url, index) => `
        <div class="preview-image-item">
            <img src="${url}" alt="صورة المنتج">
            <button class="preview-remove-btn" onclick="removeImage(${index})">✕</button>
        </div>
    `).join('');
}

function removeImage(index) {
    uploadImages.splice(index, 1);
    updateImagePreview();
}

// ========== حفظ المنتج ==========
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
    
    // التحقق من الحقول المطلوبة
    if (!id || !brand || !category || !name || !price || uploadImages.length === 0 || colors.length === 0) {
        showToast('يرجى ملء الحقول المطلوبة (الاسم، السعر، الألوان، صورة واحدة على الأقل)', 'error');
        return;
    }
    
    // المواصفات
    const specs = {};
    const specFields = {
        'p_screen': 'الشاشة',
        'p_battery': 'البطارية',
        'p_camera': 'الكاميرا',
        'p_processor': 'المعالج',
        'p_ram': 'الرام',
        'p_os': 'النظام'
    };
    
    for (const [fieldId, specName] of Object.entries(specFields)) {
        const value = document.getElementById(fieldId)?.value.trim();
        if (value) specs[specName] = value;
    }
    
    const productData = {
        id: parseInt(id),
        brand,
        category,
        name,
        price,
        oldPrice,
        cost,
        installment,
        stock,
        rating,
        reviews,
        colors,
        storage,
        specs,
        images: uploadImages,
        isNew,
        isHot,
        updatedAt: new Date().toISOString()
    };
    
    try {
        await db.ref(`${DB_REF.products}/${id}`).set(productData);
        
        // حذف المنتج القديم إذا تم تغيير المفتاح
        if (currentEditProductKey && currentEditProductKey !== id.toString()) {
            await db.ref(`${DB_REF.products}/${currentEditProductKey}`).remove();
        }
        
        showToast(currentEditProductKey ? '✅ تم تحديث المنتج بنجاح' : '✅ تم إضافة المنتج بنجاح', 'success');
        closeProductModal();
        
        // تحديث البيانات
        await loadAllData();
        
    } catch (error) {
        console.error('خطأ في حفظ المنتج:', error);
        showToast('❌ حدث خطأ أثناء حفظ المنتج', 'error');
    }
}

async function duplicateProduct(key) {
    const original = allProductsData[key];
    if (!original) return;
    
    // إنشاء نسخة جديدة
    const newId = Date.now();
    const duplicate = {
        ...original,
        id: newId,
        name: original.name + ' (نسخة)',
        stock: 0,
        rating: 0,
        reviews: 0,
        createdAt: new Date().toISOString()
    };
    
    try {
        await db.ref(`${DB_REF.products}/${newId}`).set(duplicate);
        showToast('✅ تم نسخ المنتج بنجاح', 'success');
        await loadAllData();
    } catch (error) {
        console.error('خطأ في نسخ المنتج:', error);
        showToast('❌ حدث خطأ أثناء نسخ المنتج', 'error');
    }
}

async function toggleArchiveProduct(key) {
    const product = allProductsData[key];
    if (!product) return;
    
    const newArchived = !product.archived;
    
    try {
        await db.ref(`${DB_REF.products}/${key}`).update({
            archived: newArchived,
            updatedAt: new Date().toISOString()
        });
        
        showToast(newArchived ? '📂 تم أرشفة المنتج' : '📁 تم إلغاء أرشفة المنتج', 'success');
    } catch (error) {
        console.error('خطأ في أرشفة المنتج:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}

async function deleteProduct(key) {
    if (!confirm('⚠️ حذف المنتج نهائياً؟ لا يمكن التراجع!')) return;
    
    const product = allProductsData[key];
    if (!product) return;
    
    try {
        // حذف الصور من التخزين
        if (product.images && product.images.length > 0) {
            for (const imageUrl of product.images) {
                try {
                    const imageRef = storage.refFromURL(imageUrl);
                    await imageRef.delete();
                } catch (e) {
                    console.warn('فشل حذف الصورة:', e);
                }
            }
        }
        
        await db.ref(`${DB_REF.products}/${key}`).remove();
        showToast('🗑️ تم حذف المنتج بنجاح', 'success');
        await loadAllData();
        
    } catch (error) {
        console.error('خطأ في حذف المنتج:', error);
        showToast('❌ حدث خطأ أثناء حذف المنتج', 'error');
    }
}

// ========== إدارة الطلبات ==========
async function updateOrderStatus(key, newStatus) {
    if (!newStatus) return;
    
    try {
        await db.ref(`${DB_REF.orders}/${key}`).update({
            status: newStatus,
            updatedAt: new Date().toISOString()
        });
        
        showToast(`✅ تم تحديث الحالة إلى: ${newStatus}`, 'success');
        
    } catch (error) {
        console.error('خطأ في تحديث الحالة:', error);
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
                <div class="order-detail-item">
                    <div class="order-detail-label">🆔 رقم الطلب</div>
                    <div class="order-detail-value" style="color:var(--accent-gold);font-size:18px;">${order.orderId || '-'}</div>
                </div>
                <div class="order-detail-item">
                    <div class="order-detail-label">👤 الزبون</div>
                    <div class="order-detail-value">${escapeHtml(order.name || '-')}</div>
                </div>
                <div class="order-detail-item">
                    <div class="order-detail-label">📞 رقم الهاتف</div>
                    <div class="order-detail-value"><a href="tel:${order.phone}" style="color:var(--accent-blue);">${order.phone || '-'}</a></div>
                </div>
                <div class="order-detail-item">
                    <div class="order-detail-label">📍 الولاية</div>
                    <div class="order-detail-value">${order.wilaya || '-'}</div>
                </div>
                <div class="order-detail-item">
                    <div class="order-detail-label">🏙️ البلدية</div>
                    <div class="order-detail-value">${order.baladia || '-'}</div>
                </div>
                <div class="order-detail-item">
                    <div class="order-detail-label">🚚 نوع التوصيل</div>
                    <div class="order-detail-value">${order.deliveryType || '-'}</div>
                </div>
                <div class="order-detail-item" style="grid-column:span 2">
                    <div class="order-detail-label">🛍️ المنتج</div>
                    <div class="order-detail-value">${escapeHtml(order.product || '-')}</div>
                </div>
                <div class="order-detail-item">
                    <div class="order-detail-label">💰 الإجمالي</div>
                    <div class="order-detail-value" style="color:var(--accent-gold);">${formatCurrency(order.totalPrice || 0)}</div>
                </div>
                <div class="order-detail-item">
                    <div class="order-detail-label">🚦 الحالة</div>
                    <div class="order-detail-value">${order.status || 'قيد الانتظار'}</div>
                </div>
                <div class="order-detail-item" style="grid-column:span 2">
                    <div class="order-detail-label">📅 تاريخ الطلب</div>
                    <div class="order-detail-value">${dateStr}</div>
                </div>
            </div>
        `;
    }
    
    const modal = document.getElementById('orderDetailModal');
    if (modal) modal.classList.add('show');
}

function closeOrderDetailModal(event) {
    if (event && event.target !== document.getElementById('orderDetailModal')) return;
    const modal = document.getElementById('orderDetailModal');
    if (modal) modal.classList.remove('show');
}

async function deleteOrder(key) {
    if (!confirm('⚠️ حذف الطلب نهائياً؟ لا يمكن التراجع!')) return;
    
    try {
        await db.ref(`${DB_REF.orders}/${key}`).remove();
        showToast('🗑️ تم حذف الطلب بنجاح', 'success');
        await loadAllData();
        
    } catch (error) {
        console.error('خطأ في حذف الطلب:', error);
        showToast('❌ حدث خطأ أثناء حذف الطلب', 'error');
    }
}

// ========== طباعة الفاتورة ==========
function printOrderInvoice(key) {
    const order = allOrdersData[key];
    if (!order) return;
    
    const product = allProductsData[order.productId];
    const productPrice = product ? product.price : (order.totalPrice || 0);
    const shippingFee = (order.totalPrice || 0) - productPrice;
    
    const dateStr = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('ar-DZ');
    
    const timeStr = order.createdAt
        ? new Date(order.createdAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })
        : '';
    
    const statusClass = getStatusClass(order.status);
    
    const invoiceHTML = `
        <div class="inv-header">
            <div class="inv-logo-block">
                <h1>📱 هواتف ماركت</h1>
                <p>أكبر متجر هواتف في الجزائر</p>
                <p style="margin-top:4px; font-size:11px; color:#94a3b8;">📞 0555 00 00 00 &nbsp;|&nbsp; 📍 الجزائر العاصمة</p>
            </div>
            <div class="inv-meta">
                <h2>فاتورة طلب</h2>
                <div class="inv-meta-row">رقم الفاتورة: <span>#${order.orderId || '-'}</span></div>
                <div class="inv-meta-row">التاريخ: <span>${dateStr}${timeStr ? ' — ' + timeStr : ''}</span></div>
                <div><span class="inv-badge ${statusClass}">${order.status || 'قيد الانتظار'}</span></div>
            </div>
        </div>
        
        <div class="inv-section-title">معلومات الزبون</div>
        <div class="inv-info-grid">
            <div class="inv-info-cell">
                <div class="lbl">الاسم الكامل</div>
                <div class="val">${escapeHtml(order.name || '-')}</div>
            </div>
            <div class="inv-info-cell">
                <div class="lbl">رقم الهاتف</div>
                <div class="val" style="direction:ltr; text-align:right;">${order.phone || '-'}</div>
            </div>
            <div class="inv-info-cell">
                <div class="lbl">الولاية</div>
                <div class="val">${order.wilaya || '-'}</div>
            </div>
            <div class="inv-info-cell">
                <div class="lbl">البلدية</div>
                <div class="val">${order.baladia || '-'}</div>
            </div>
            <div class="inv-info-cell" style="grid-column:span 2;">
                <div class="lbl">نوع التوصيل</div>
                <div class="val">${order.deliveryType || '-'}</div>
            </div>
        </div>
        
        <div class="inv-section-title">تفاصيل الطلب</div>
        <table class="inv-product-table">
            <thead>
                <tr>
                    <th style="width:50%;">المنتج</th>
                    <th>الماركة</th>
                    <th>المواصفات</th>
                    <th style="text-align:left;">السعر</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>${escapeHtml(product ? product.name : (order.product || '-'))}</strong></td>
                    <td>${order.productBrand || (product ? product.brand : '-')}</td>
                    <td style="font-size:11px; color:#64748b;">
                        ${order.storage ? '💾 ' + order.storage : ''}
                        ${order.color ? ' &nbsp;🎨 ' + order.color : ''}
                    </td>
                    <td style="text-align:left; font-weight:700; color:#1e293b;">
                        ${formatCurrency(productPrice)}
                    </td>
                </tr>
            </tbody>
        </table>
        
        <div class="inv-totals">
            <div class="inv-total-row">
                <span>سعر المنتج</span>
                <span>${formatCurrency(productPrice)}</span>
            </div>
            <div class="inv-total-row">
                <span>تكلفة الشحن (${order.deliveryType || ''})</span>
                <span>${shippingFee > 0 ? formatCurrency(shippingFee) : 'مجاني'}</span>
            </div>
            <div class="inv-total-row">
                <span>المبلغ الإجمالي المستحق</span>
                <span>${formatCurrency(order.totalPrice || 0)}</span>
            </div>
        </div>
        
        <div class="inv-notes">
            <strong>ملاحظات هامة:</strong><br>
            • الدفع يكون عند الاستلام نقداً<br>
            • ضمان أصلي 12 شهراً على جميع المنتجات<br>
            • في حال وجود عيب مصنعي يُستبدل المنتج خلال 7 أيام من تاريخ الاستلام<br>
            • للاستفسار والمتابعة: 0555 00 00 00
        </div>
        
        <div class="inv-footer">
            <div>شكراً لثقتكم في <strong>هواتف ماركت</strong> 🙏</div>
            <div>طُبعت بتاريخ: <strong>${new Date().toLocaleDateString('ar-DZ')}</strong></div>
        </div>
    `;
    
    const printArea = document.getElementById('invoicePrintArea');
    if (printArea) {
        printArea.innerHTML = invoiceHTML;
        window.print();
        printArea.innerHTML = '';
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'قيد الانتظار': return 'pending';
        case 'تم التأكيد': return 'confirmed';
        case 'تم الشحن': return 'shipped';
        case 'تم التوصيل': return 'delivered';
        case 'ملغى': return 'cancelled';
        default: return 'pending';
    }
}

// ========== التحديث الجماعي للطلبات ==========
function onRowCheckChange() {
    selectedOrderKeys.clear();
    const checkboxes = document.querySelectorAll('.row-checkbox:checked');
    checkboxes.forEach(cb => {
        selectedOrderKeys.add(cb.dataset.key);
    });
    
    // تحديث checkbox تحديد الكل
    const allCheckboxes = document.querySelectorAll('.row-checkbox');
    const selectAll = document.getElementById('selectAllCheckbox');
    if (selectAll) {
        selectAll.indeterminate = checkboxes.length > 0 && checkboxes.length < allCheckboxes.length;
        selectAll.checked = allCheckboxes.length > 0 && checkboxes.length === allCheckboxes.length;
    }
    
    // تلوين الصفوف المحددة
    document.querySelectorAll('.row-checkbox').forEach(cb => {
        const row = cb.closest('tr');
        if (row) {
            if (cb.checked) row.classList.add('selected-row');
            else row.classList.remove('selected-row');
        }
    });
    
    updateBulkBar();
}

function toggleSelectAll(masterCheckbox) {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = masterCheckbox.checked;
        const row = cb.closest('tr');
        if (row) {
            if (cb.checked) row.classList.add('selected-row');
            else row.classList.remove('selected-row');
        }
    });
    
    selectedOrderKeys.clear();
    if (masterCheckbox.checked) {
        checkboxes.forEach(cb => selectedOrderKeys.add(cb.dataset.key));
    }
    
    updateBulkBar();
}

function updateBulkBar() {
    const bar = document.getElementById('bulkActionBar');
    const countSpan = document.getElementById('bulkCount');
    
    if (countSpan) countSpan.innerText = selectedOrderKeys.size;
    
    if (bar) {
        if (selectedOrderKeys.size > 0) bar.classList.add('show');
        else bar.classList.remove('show');
    }
}

function clearBulkSelection() {
    selectedOrderKeys.clear();
    document.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.checked = false;
        const row = cb.closest('tr');
        if (row) row.classList.remove('selected-row');
    });
    
    const selectAll = document.getElementById('selectAllCheckbox');
    if (selectAll) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
    }
    
    const statusSelect = document.getElementById('bulkStatusSelect');
    if (statusSelect) statusSelect.value = '';
    
    updateBulkBar();
}

async function applyBulkStatus() {
    const newStatus = document.getElementById('bulkStatusSelect')?.value;
    
    if (!newStatus) {
        showToast('⚠️ اختر الحالة الجديدة أولاً', 'error');
        return;
    }
    
    if (selectedOrderKeys.size === 0) {
        showToast('⚠️ لم تحدد أي طلب', 'error');
        return;
    }
    
    if (!confirm(`تطبيق "${newStatus}" على ${selectedOrderKeys.size} طلب؟`)) return;
    
    const keys = Array.from(selectedOrderKeys);
    const total = keys.length;
    let completed = 0;
    
    const progressWrap = document.getElementById('bulkProgressWrap');
    const progressBar = document.getElementById('bulkProgressBar');
    if (progressWrap) progressWrap.style.display = 'block';
    if (progressBar) progressBar.style.width = '0%';
    
    const applyBtn = document.querySelector('.bulk-apply-btn');
    if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.innerText = '⏳ جاري التحديث...';
    }
    
    const updatedAt = new Date().toISOString();
    
    const promises = keys.map(async (key) => {
        try {
            await db.ref(`${DB_REF.orders}/${key}`).update({
                status: newStatus,
                updatedAt: updatedAt
            });
            
            if (allOrdersData[key]) allOrdersData[key].status = newStatus;
            
        } catch (error) {
            console.error('خطأ في تحديث الطلب:', key, error);
        }
        completed++;
        if (progressBar) progressBar.style.width = `${(completed / total) * 100}%`;
    });
    
    await Promise.all(promises);
    
    if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.innerText = '⚡ تطبيق على الكل';
    }
    
    if (progressWrap) progressWrap.style.display = 'none';
    if (progressBar) progressBar.style.width = '0%';
    
    showToast(`✅ تم تحديث ${total} طلب إلى "${newStatus}"`, 'success');
    clearBulkSelection();
    filterOrdersTable();
    calculateFinance();
    renderOrdersChart();
}

// ========== تصدير البيانات ==========
function exportOrdersCSV() {
    const orders = Object.values(allOrdersData);
    
    if (orders.length === 0) {
        showToast('لا توجد طلبات للتصدير', 'error');
        return;
    }
    
    const headers = ['رقم الطلب', 'الاسم', 'الهاتف', 'الولاية', 'البلدية', 'المنتج', 'الإجمالي', 'الحالة', 'التاريخ'];
    const rows = orders.map(o => [
        o.orderId || '',
        o.name || '',
        o.phone || '',
        o.wilaya || '',
        o.baladia || '',
        (o.product || '').replace(/"/g, '""'),
        o.totalPrice || 0,
        o.status || '',
        o.createdAt ? new Date(o.createdAt).toLocaleDateString('ar-DZ') : ''
    ].map(v => `"${v}"`).join(','));
    
    const bom = '\uFEFF';
    const csv = bom + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast(`📥 تم تصدير ${orders.length} طلب`, 'success');
}

function exportProductsCSV() {
    const products = Object.values(allProductsData);
    
    if (products.length === 0) {
        showToast('لا توجد منتجات للتصدير', 'error');
        return;
    }
    
    const headers = ['ID', 'الاسم', 'الماركة', 'الفئة', 'السعر', 'سعر الجملة', 'الربح', 'المخزون', 'التقييم'];
    const rows = products.map(p => [
        p.id || '',
        (p.name || '').replace(/"/g, '""'),
        p.brand || '',
        p.category || '',
        p.price || 0,
        p.cost || 0,
        (p.price || 0) - (p.cost || 0),
        p.stock || 0,
        p.rating || 0
    ].map(v => `"${v}"`).join(','));
    
    const bom = '\uFEFF';
    const csv = bom + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast(`📥 تم تصدير ${products.length} منتج`, 'success');
}

// ========== دوال مساعدة عامة ==========
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// تصدير الدوال إلى النطاق العام
window.loginWithEmail = loginWithEmail;
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.changePassword = changePassword;
window.resetPassword = resetPassword;
window.closePasswordModal = () => {
    const modal = document.getElementById('changePasswordModal');
    if (modal) modal.classList.remove('show');
};
window.openPasswordModal = () => {
    const modal = document.getElementById('changePasswordModal');
    if (modal) modal.classList.add('show');
};
window.loadAllData = loadAllData;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.saveProduct = saveProduct;
window.editProduct = (key) => openProductModal(key);
window.duplicateProduct = duplicateProduct;
window.toggleArchiveProduct = toggleArchiveProduct;
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
window.openSettingsModal = () => {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('show');
};
window.closeSettingsModal = () => {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('show');
};
window.openShippingModal = openShippingModal;
window.closeShippingModal = closeShippingModal;
window.saveShippingRates = saveShippingRates;
