# 🔒 دليل الأمان لمتجر هواتف ماركت

## ⚠️ أولويات الأمان

### 1. 🔐 حماية المفاتيح والتوكنات

#### ❌ **خطأ شائع:**
```javascript
const CONFIG = {
  TELEGRAM_TOKEN: "8447738345:AAHgpNg_aRPIZAZRsg1tJ4OGjYqA7Tl0ZjM", // خطر!
  FIREBASE_KEY: "AIzaSyD..." // خطر!
};
```

#### ✅ **الطريقة الصحيحة:**
```javascript
// استخدم متغيرات البيئة
const CONFIG = {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  FIREBASE_KEY: process.env.FIREBASE_KEY
};
```

### 2. 📝 إضافة ملفات حساسة إلى .gitignore

```
.env
.env.local
credentials.json
serviceAccountKey.json
```

### 3. 🛡️ Firebase Security Rules

استخدم هذه القواعد:

```json
{
  "rules": {
    "products": {
      ".read": true,
      ".write": "auth !== null && auth.token.admin === true"
    },
    "orders": {
      ".read": "auth !== null",
      ".write": true,
      "$orderId": {
        ".validate": "newData.hasChild('name') && newData.hasChild('phone')"
      }
    },
    "admins": {
      ".read": false,
      ".write": false
    }
  }
}
```

### 4. 🔑 تغيير كلمة المرور

غيّر كلمة مرور الأدمن في `config.js`:

```javascript
ADMIN_PASSWORD: "كلمة-مرور-قوية-جديدة-16-حرف" // استخدم كلمة قوية!
```

### 5. 🚀 في الإنتاج - استخدم Firebase Cloud Functions

```javascript
// بدلاً من إرسال الطلبات مباشرة من الموقع
// استخدم Cloud Function آمنة

exports.submitOrder = functions.https.onCall(async (data, context) => {
  // تحقق من بيانات المستخدم
  // أرسل الإشعارات بأمان
  // لا تعرّض البيانات الحساسة
});
```

### 6. 📊 مراقبة الأمان

- ✅ تفعيل Firebase Authentication
- ✅ تسجيل جميع العمليات (Logging)
- ✅ مراقبة محاولات تسجيل الدخول الفاشلة
- ✅ تحديث الملفات بانتظام

### 7. 🔄 تحديث الحزم

```bash
npm audit
npm audit fix
npm update
```

### 8. 📱 HTTPS فقط

- ✅ استخدم HTTPS دائماً
- ✅ فعّل HSTS (HTTP Strict Transport Security)
- ✅ تحقق من شهادات SSL

### 9. 🎯 Validation والتنظيف

```javascript
// ✅ تحقق من المدخلات
function validatePhoneNumber(phone) {
  const regex = /^(05|06|07|09)[0-9]{8}$/;
  return regex.test(phone);
}

// ✅ نظّف البيانات
function sanitizeInput(input) {
  return input.trim().replace(/[<>]/g, '');
}
```

### 10. 🚨 معالجة الأخطاء الآمنة

```javascript
// ❌ لا تعرّض معلومات حساسة
console.error(error); // قد تحتوي على بيانات حساسة

// ✅ أرسل رسالة عامة للمستخدم
showError("حدث خطأ. يرجى المحاولة لاحقاً.");

// ✅ سجّل التفاصيل بأمان
logErrorSecurely(error);
```

## 📋 قائمة التحقق قبل الإطلاق

- [ ] تم تغيير كلمة مرور الأدمن
- [ ] تم إزالة جميع التوكنات من الكود
- [ ] تم تفعيل Firebase Authentication
- [ ] تم تحديث Security Rules
- [ ] تم إضافة HTTPS
- [ ] تم تحديث جميع الحزم
- [ ] تم اختبار معالجة الأخطاء
- [ ] تم تفعيل Cloud Functions
- [ ] تم إعداد مراقبة الأمان
- [ ] تم تسجيل Audit Log

## 🔗 روابط مفيدة

- [Firebase Security Best Practices](https://firebase.google.com/docs/database/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**آخر تحديث**: 2026-06-14
**الحالة**: ⚠️ قيد المراجعة