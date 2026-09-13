# سراج 2010 — بوابة الطلاب

## محتويات المشروع
- `index.html` — الموقع العام للزوار (قراءة فقط).
- `admin/index.html` — لوحة الإدارة المنفصلة، ولا يظهر رابطها داخل الموقع العام.
- `assets/css/style.css` — جميع التنسيقات.
- `assets/js/app.js` — منطق الموقع العام.
- `assets/js/admin.js` — منطق الدخول للوحة الإدارة.
- `assets/js/firebase-config.js` — إعداد Firebase العام.
- `database.rules.json` — قواعد Realtime Database.

## 1) إعداد Firebase Authentication
1. افتح Firebase Console واختر المشروع `mycollegeapp-e5362`.
2. Authentication → Sign-in method → فعّل **Google**.
3. Authentication → Settings → Authorized domains.
4. أضف:
   - `majd377.github.io`
   - `localhost` (اختياري للاختبار المحلي)
5. لا تضف المسار `/st_p/` في Authorized Domains؛ اكتب الدومين فقط.

## 2) إعداد Realtime Database
افتح Realtime Database → Rules، واستبدل القواعد الحالية بمحتوى `database.rules.json`.

مهم: الموقع العام يقرأ `appData` فقط، والإدارة فقط (حساب المالك المصرّح به) تستطيع الكتابة.
محاولات الدخول إلى `/admin/` تُحفظ تحت `accessLogs` للحسابات التي تسجل عبر Google.

## 3) رفع المشروع إلى GitHub Pages
ارفع **محتويات هذا المجلد** إلى جذر المستودع، مع الحفاظ على البنية التالية:

```
/
├─ index.html
├─ admin/
│  └─ index.html
├─ assets/
│  ├─ css/style.css
│  └─ js/
│     ├─ app.js
│     ├─ admin.js
│     └─ firebase-config.js
├─ database.rules.json
└─ .nojekyll
```

بعدها يصبح الموقع العام:
`https://majd377.github.io/st_p/`

ولوحة الإدارة:
`https://majd377.github.io/st_p/admin/`

## 4) إذا ظهر خطأ عند تسجيل Google
- `auth/unauthorized-domain`: تأكد أن `majd377.github.io` موجود في Authorized Domains.
- `auth/popup-blocked`: اسمح بالنوافذ المنبثقة للموقع.
- `auth/operation-not-allowed`: تأكد أن Google مفعّل في Authentication.
- إذا كانت القواعد ترفض القراءة/الكتابة، أعد نسخ `database.rules.json` إلى Realtime Database → Rules ثم اضغط Publish.

## 5) ملاحظة مهمة عن الأمان
لا يمكن منع مستخدم المتصفح من رؤية JavaScript الذي يحتاجه المتصفح لتشغيل الموقع. لذلك لا تعتمد على إخفاء الكود كحماية. الحماية الفعلية هنا تعتمد على Firebase Rules والصلاحيات في الخادم.

`firebase-config.js` يحتوي إعدادات عميل Firebase العامة، وليس كلمة مرور أو مفتاح خدمة خاص. لا تضع Service Account JSON أو أي secret داخل GitHub Pages.
