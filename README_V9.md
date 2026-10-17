# المنارة الطلابية — V8
- CSP: frame-src لـ *.firebaseio.com (Firebase يفتح iframe عند Long-Polling) وscript-src لـ *.firebaseio.com وcdnjs. قواعد قاعدة البيانات سليمة: الموقع العام يقرأ appData فقط (قراءة عامة) والكتابة للأدمن.
- boot.js: عند أول فتح للنسخة الجديدة يحذف الكاش وخدمة العمل القديمة ويعيد التحميل مرة واحدة، دون لمس localStorage أو بيانات Firebase.
- توافق: JS مُحوَّل لدعم المتصفحات القديمة (ES2017: Chrome 58 / Safari 11 / Firefox 53)، وCSS بدائل لـ inset، والـ 3D يتعطل بهدوء إن لم يدعم المتصفح PointerEvent.
- تصميم: خلفية WebGL ثلاثية الأبعاد (Three.js من cdnjs) بأشكال هندسية ذهبية وزرقاء تطفو وتتفاعل مع المؤشر والتمرير؛ بطاقات بدون ميلان؛ ترويسة جديدة.
- manifest: id/scope وأيقونة maskable منفصلة.
