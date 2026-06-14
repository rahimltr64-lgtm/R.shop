/**
 * 🔒 ملف الإعدادات الآمن
 * 
 * ⚠️ ملاحظة مهمة: 
 * في الإنتاج، يجب نقل هذه المتغيرات إلى متغيرات البيئة (Environment Variables)
 * أو استخدام Cloud Functions من Firebase
 * 
 * لا تشارك هذا الملف في المستودع العام!
 */

const CONFIG = {
  // 🔥 Firebase Configuration
  FIREBASE_BASE_URL: "https://phones-market-default-rtdb.europe-west1.firebasedatabase.app",
  
  // 🤖 Telegram Bot (يجب نقله إلى متغيرات البيئة في الإنتاج)
  // استخدم متغيرات البيئة بدلاً من الضع الكود مباشرة
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN || "YOUR_TELEGRAM_TOKEN_HERE",
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || "YOUR_CHAT_ID_HERE",
  
  // 🔐 Admin Configuration
  ADMIN_PASSWORD: "Admin2026", // يجب تغيير كلمة المرور في الإنتاج!
  
  // ⏱️ Timeouts
  FETCH_TIMEOUT: 10000, // 10 ثوان
  CACHE_DURATION: 3600000, // 1 ساعة
};

// التحقق من أن جميع الإعدادات موجودة
function validateConfig() {
  const requiredKeys = ['FIREBASE_BASE_URL'];
  const missing = requiredKeys.filter(key => !CONFIG[key]);
  
  if (missing.length > 0) {
    console.error('❌ إعدادات مفقودة:', missing);
    return false;
  }
  
  console.log('✅ جميع الإعدادات صحيحة');
  return true;
}

// التحقق من الإعدادات عند التحميل
if (typeof window !== 'undefined') {
  validateConfig();
}

// تصدير الإعدادات
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}