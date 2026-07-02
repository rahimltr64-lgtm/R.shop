/**
 * 🛠️ ملف المساعدات والدوال العامة
 * يحتوي على دوال مشتركة تُستخدم في جميع أنحاء التطبيق
 */

// ==================== تنسيق الأرقام ====================

/**
 * تنسيق الرقم بصيغة عملة جزائرية
 * @param {number} num - الرقم المراد تنسيقه
 * @returns {string} الرقم بصيغة DA
 */
function formatPrice(num) {
  if (!num) return '0 DA';
  return Number(num).toLocaleString('ar-DZ') + ' DA';
}

/**
 * تنسيق الرقم بآلاف
 * @param {number} num - الرقم
 * @returns {string} الرقم منسّق
 */
function formatNumber(num) {
  return Number(num).toLocaleString('ar-DZ');
}

// ==================== التحقق من الصحة ====================

/**
 * التحقق من رقم الهاتف الجزائري
 * @param {string} phone - رقم الهاتف
 * @returns {boolean} صحيح أم خطأ
 */
function validateAlgerianPhone(phone) {
  const regex = /^(05|06|07|09)[0-9]{8}$/;
  return regex.test(phone.replace(/\s+/g, ''));
}

/**
 * التحقق من البريد الإلكتروني
 * @param {string} email - البريد الإلكتروني
 * @returns {boolean} صحيح أم خطأ
 */
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * التحقق من عدم ترك الحقول فارغة
 * @param {...string} fields - الحقول
 * @returns {boolean} جميع الحقول ممتلئة
 */
function validateRequired(...fields) {
  return fields.every(field => field && field.trim().length > 0);
}

// ==================== تنظيف البيانات ====================

/**
 * تنظيف النص من الأحرف الخطرة
 * @param {string} input - النص المراد تنظيفه
 * @returns {string} النص المنظّف
 */
function sanitizeInput(input) {
  if (!input) return '';
  return input
    .trim()
    .replace(/[<>"']/g, '')
    .substring(0, 500); // حد أقصى 500 حرف
}

/**
 * تنظيف اسم المنتج
 * @param {string} name - اسم المنتج
 * @returns {string} الاسم المنظّف
 */
function sanitizeProductName(name) {
  return sanitizeInput(name).trim();
}

// ==================== التاريخ والوقت ====================

/**
 * الحصول على التاريخ الحالي بصيغة عربية
 * @returns {string} التاريخ
 */
function getArabicDate() {
  return new Date().toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * الحصول على الوقت الحالي
 * @returns {string} الوقت
 */
function getCurrentTime() {
  return new Date().toLocaleTimeString('ar-DZ');
}

/**
 * تنسيق التاريخ
 * @param {string|Date} date - التاريخ
 * @returns {string} التاريخ منسّق
 */
function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ar-DZ');
}

// ==================== العمليات الحسابية ====================

/**
 * حساب الخصم
 * @param {number} price - السعر الأصلي
 * @param {number} oldPrice - السعر القديم
 * @returns {number} نسبة الخصم
 */
function calculateDiscount(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

/**
 * حساب السعر بعد الخصم
 * @param {number} price - السعر
 * @param {number} discountPercent - نسبة الخصم
 * @returns {number} السعر بعد الخصم
 */
function applyDiscount(price, discountPercent) {
  return price - (price * discountPercent / 100);
}

/**
 * حساب الربح
 * @param {number} price - سعر البيع
 * @param {number} cost - سعر التكلفة
 * @returns {number} الربح
 */
function calculateProfit(price, cost) {
  return price - cost;
}

/**
 * حساب نسبة هامش الربح
 * @param {number} price - سعر البيع
 * @param {number} cost - سعر التكلفة
 * @returns {number} نسبة هامش الربح
 */
function calculateMargin(price, cost) {
  if (cost === 0) return 0;
  return Math.round(((price - cost) / price) * 100);
}

// ==================== العمليات على الصور ====================

/**
 * التحقق من صحة رابط الصورة
 * @param {string} url - رابط الصورة
 * @returns {Promise<boolean>} الصورة موجودة أم لا
 */
async function validateImageUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (e) {
    return false;
  }
}

/**
 * احصل على صورة بديلة في حالة الخطأ
 * @param {string} imageUrl - رابط الصورة
 * @returns {string} الرابط أو صورة بديلة
 */
function getFallbackImage(imageUrl) {
  return imageUrl || 'https://placehold.co/400x400?text=No+Image';
}

// ==================== العمليات على التخزين ====================

/**
 * حفظ البيانات في localStorage
 * @param {string} key - المفتاح
 * @param {any} value - القيمة
 */
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage error:', e);
  }
}

/**
 * استرجاع البيانات من localStorage
 * @param {string} key - المفتاح
 * @param {any} defaultValue - القيمة الافتراضية
 * @returns {any} القيمة
 */
function getFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn('Storage error:', e);
    return defaultValue;
  }
}

/**
 * حذف من localStorage
 * @param {string} key - المفتاح
 */
function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('Storage error:', e);
  }
}

// ==================== العمليات على النصوص ====================

/**
 * اختصار النص
 * @param {string} text - النص
 * @param {number} length - الطول المطلوب
 * @returns {string} النص المختصر
 */
function truncateText(text, length = 50) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

/**
 * تحويل النص لـ Title Case
 * @param {string} text - النص
 * @returns {string} النص بصيغة Title Case
 */
function toTitleCase(text) {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ==================== العمليات على المصفوفات ====================

/**
 * إزالة التكرارات من مصفوفة
 * @param {array} array - المصفوفة
 * @returns {array} المصفوفة بدون تكرارات
 */
function removeDuplicates(array) {
  return [...new Set(array)];
}

/**
 * فرز مصفوفة من الأرقام
 * @param {array} array - المصفوفة
 * @param {string} order - ترتيب تصاعدي 'asc' أو تنازلي 'desc'
 * @returns {array} المصفوفة المرتبة
 */
function sortNumbers(array, order = 'asc') {
  return array.sort((a, b) => order === 'asc' ? a - b : b - a);
}

// ==================== معالجة الأخطاء ====================

/**
 * تسجيل الخطأ بشكل آمن
 * @param {Error} error - الخطأ
 * @param {string} context - السياق
 */
function logError(error, context = '') {
  console.error(`❌ Error${context ? ' in ' + context : ''}:`, error.message);
  // في الإنتاج، أرسل الخطأ للخادم
  if (window.location.hostname !== 'localhost') {
    // sendErrorToServer(error, context);
  }
}

/**
 * عرض رسالة خطأ آمنة للمستخدم
 * @param {string} message - الرسالة
 */
function showUserError(message) {
  console.warn('⚠️', message);
  // يمكن استخدام مكتبة toast أو alert
}

// ==================== دوال مساعدة عامة ====================

/**
 * محاكاة تأخير زمني
 * @param {number} ms - الملي ثانية
 * @returns {Promise}
 */
function delay(ms = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * التحقق من الاتصال بالإنترنت
 * @returns {boolean} متصل أم لا
 */
function isOnline() {
  return navigator.onLine;
}

/**
 * نسخ النص للحافظة
 * @param {string} text - النص
 * @returns {Promise<boolean>} نجح أم فشل
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.error('Copy failed:', e);
    return false;
  }
}

/**
 * توليد رقم عشوائي
 * @param {number} min - الحد الأدنى
 * @param {number} max - الحد الأقصى
 * @returns {number} رقم عشوائي
 */
function getRandomNumber(min = 0, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * توليد ID فريد
 * @returns {string} ID فريد
 */
function generateUniqueId() {
  return 'ID_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ==================== التصدير ====================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatPrice,
    formatNumber,
    validateAlgerianPhone,
    validateEmail,
    validateRequired,
    sanitizeInput,
    sanitizeProductName,
    getArabicDate,
    getCurrentTime,
    formatDate,
    calculateDiscount,
    applyDiscount,
    calculateProfit,
    calculateMargin,
    validateImageUrl,
    getFallbackImage,
    saveToStorage,
    getFromStorage,
    removeFromStorage,
    truncateText,
    toTitleCase,
    removeDuplicates,
    sortNumbers,
    logError,
    showUserError,
    delay,
    isOnline,
    copyToClipboard,
    getRandomNumber,
    generateUniqueId
  };
}
