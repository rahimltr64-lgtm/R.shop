# 🔥 إعداد Firebase لمتجر هواتف ماركت

## ⚠️ ملاحظة مهمة جداً

عند فتح `index.html` و `dashboard.html` على جهازك مباشرة (file://) **لن يعمل Firebase** لأن قواعد الأمان في Firebase ترفض الطلبات من نطاقات غير معتمدة. يجب رفع الموقع على استضافة (Hosting) أولاً.

## 📋 خطوات الإعداد

### 1. إنشاء مشروع Firebase

1. ادخل إلى [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروع جديد باسم `phones-market`
3. من القائمة الجانبية اختر **Realtime Database**
4. أنشئ قاعدة بيانات واختر موقع `europe-west1` (الأقرب للجزائر)
5. اختر **Start in test mode** (للتجربة فقط - سنتشدد لاحقاً)

### 2. هيكل قاعدة البيانات

في Realtime Database، أنشئ الهيكل التالي يدوياً أو ارفع ملف `sample-data.json`:

```
phones-market-xxxxx/
├── products/
│   ├── 1001/
│   │   ├── id: 1001
│   │   ├── brand: "آبل"
│   │   ├── category: "flagship"
│   │   ├── name: "iPhone 15 Pro Max 256GB"
│   │   ├── price: 285000
│   │   ├── oldPrice: 320000
│   │   ├── cost: 230000
│   │   ├── installment: 23750
│   │   ├── stock: 15
│   │   ├── rating: 4.9
│   │   ├── reviews: 128
│   │   ├── colors: ["تيتانيوم طبيعي", ...]
│   │   ├── storage: ["256GB", "512GB", "1TB"]
│   │   ├── specs: { ... }
│   │   ├── images: ["url1", "url2"]
│   │   ├── isNew: true
│   │   └── isHot: true
│   └── ...
└── orders/
    ├── 123456/
    │   ├── orderId: "123456"
    │   ├── name: "..."
    │   ├── phone: "..."
    │   ├── product: "..."
    │   ├── totalPrice: 287400
    │   └── status: "قيد الانتظار"
    └── ...
```

### 3. تحديث رابط Firebase في الكود

في ملفي `index.html` و `dashboard.html`، استبدل:

```javascript
FIREBASE_BASE_URL: "https://phones-market-5cb17-default-rtdb.firebaseio.com"
```

بالرابط الفعلي لمشروعك من Firebase Console:
- Realtime Database → URL → انسخ الرابط الذي ينتهي بـ `.firebaseio.com`

### 4. قواعد الأمان (مهمة للإنتاج)

في تبويب **Rules** في Realtime Database، استبدل القواعد بهذه:

```json
{
  "rules": {
    "products": {
      ".read": true,
      ".write": "auth !== null && auth.token.admin === true"
    },
    "orders": {
      ".read": true,
      "$orderId": {
        ".write": true
      }
    }
  }
}
```

> **ملاحظة**: هذه القواعد للسماح للجمهور بالقراءة والكتابة في الطلبات. في الإنتاج يفضل تفعيل Firebase Authentication.

### 5. إعداد بوت تيليجرام (اختياري)

في `index.html`، استبدل:

```javascript
TELEGRAM_TOKEN: "YOUR_BOT_TOKEN",
TELEGRAM_CHAT_ID: "YOUR_CHAT_ID"
```

ببيانات بوتك من @BotFather.

## 🚀 رفع الموقع (Hosting)

### الخيار 1: Firebase Hosting (مجاني)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### الخيار 2: Netlify (أسهل)

1. ادخل إلى [netlify.com](https://app.netlify.com/)
2. اسحب وأفلت مجلد `phone_store` في الصفحة
3. احصل على رابط مجاني مثل `phones-market.netlify.app`

### الخيار 3: استضافة عادية

ارفع الملفات الثلاثة:
- `index.html`
- `dashboard.html`  
- `manifest.json`

إلى أي استضافة (Hostinger، GoDaddy، أو حتى GitHub Pages).

## 📱 إضافة المنتجات للبداية

افتح `dashboard.html` على الموقع المنشور، سجّل الدخول بكلمة المرور `Admin2026`، ثم:

### طريقة 1: رفع ملف العينة
1. في Firebase Console → Realtime Database → products
2. استورد ملف `sample-data.json` (يحتوي على 10 هواتف جاهزة)

### طريقة 2: من الداشبورد
1. اضغط "➕ إضافة هاتف جديد"
2. املأ الحقول (الاسم، السعر، الماركة، الألوان، صور...)
3. اضغط حفظ

## 🎯 خريطة الملفات

| الملف | الوصف |
|------|------|
| `index.html` | واجهة المتجر للزبائن |
| `dashboard.html` | لوحة تحكم الأدمن (كلمة المرور: Admin2026) |
| `manifest.json` | إعدادات PWA (تثبيت كتطبيق على الموبايل) |
| `sample-data.json` | 10 هواتف جاهزة للاستيراد في Firebase |

## 🔒 أمان

- **غيّر كلمة مرور الأدمن** في `dashboard.html`:
  ```javascript
  ADMIN_PASSWORD: "كلمة-مرور-قوية-جديدة"
  ```
- **فعّل Firebase Authentication** للإنتاج
- **لا تشارك بوت التيليجرام** في الكود العام (الأفضل نقله لـ Cloud Functions)

## 💡 نصائح

1. **الصور**: استخدم روابط من `fdn2.gsmarena.com` أو `i.postimg.cc` (مجانية وسريعة)
2. **الألوان**: تأكد من تطابق الأسماء بين `COLOR_HEX_MAP` في `index.html` والألوان المدخلة في الداشبورد لعرض الدوائر الملونة
3. **الأداء**: الصور الخارجية أبطأ - استضف صورك على PostImg أو ImgBB
4. **SEO**: أضف Google Analytics و Meta tags إضافية في `<head>`

بالتوفيق! 🚀
