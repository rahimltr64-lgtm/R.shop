# 🔥 إعداد Firebase لمتجر هواتف ماركت

## ⚠️ ملاحظة مهمة جداً
عند فتح `index.html` و `dashboard.html` على جهازك مباشرة (file://) لن يعمل Firebase لأن قواعد الأمان ترفض الطلبات من نطاقات غير معتمدة. يجب رفع الموقع على استضافة أولاً.

## 📋 خطوات الإعداد

### 1. إنشاء مشروع Firebase
1. ادخل إلى [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروع جديد باسم `phones-market`
3. من القائمة الجانبية اختر **Realtime Database**
4. أنشئ قاعدة بيانات واختر موقع `europe-west1` (الأقرب للجزائر)
5. اختر **Start in test mode** (للتجربة فقط)

### 2. هيكل قاعدة البيانات
في Realtime Database، ارفع ملف `sample-data.json` الذي يحتوي على:
