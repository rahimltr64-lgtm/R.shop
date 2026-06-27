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

  // 🔔 Webhook لإشعارات الطلبات الجديدة (Pipedream → Firebase Cloud Messaging)
  // آمن أن يكون هنا - لا يحتوي أي سر، فقط نقطة استقبال
  ORDER_WEBHOOK_URL: "https://eoql8us6k80w5c2.m.pipedream.net",

  // 🤖 Telegram Bot
  // ⚠️ لا تضع توكن البوت هنا أبداً. أي قيمة في ملف يُحمَّل في المتصفح (config.js)
  // تكون مرئية لأي زائر يفتح "عرض المصدر". التوكن الحقيقي يجب أن يعيش فقط على
  // الخادم (Cloud Function) ولا يُرفع لهذا المتجر العام.
  // راجع FIREBASE_SETUP.md لطريقة إعداد إشعار Telegram من جهة الخادم.
  
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
