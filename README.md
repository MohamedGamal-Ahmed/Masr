<div align="center">
  <img src="public/icon-512.png" alt="Masar App Logo" width="120" />
  <h1>مسار (Masar) 🚀</h1>
  <p><strong>تطبيق محلي ومدير مشاريع شخصي للمطورين مصمم للسرعة والخصوصية</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/GitHub_API-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
    <img src="https://img.shields.io/badge/PWA_Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
    <img src="https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor" />
  </p>
</div>

<br />

## 📋 نظرة عامة (Overview)

**مسار (Masar)** هو تطبيق احترافي ومتكامل لإدارة المشاريع البرمجية والملاحظات المتعلقة بها. صُمم التطبيق خصيصاً للمطورين كمساحة عمل موحدة (Workspace) لتتبع تقدم مشاريعهم، كتابة الأفكار (Ideas)، تسجيل المشاكل (Bugs)، وإدارة المهام (Todos) بطريقة منظمة وبسيطة.

التطبيق يعمل **مباشرة في المتصفح وتطبيقات الموبايل/الديسكتوب (PWA & Capacitor)** ويعتمد على نهج **(Local-First)** بتخزين البيانات محلياً لمنحك أعلى درجات الخصوصية والسرعة، مع دعم **المزامنة الكاملة** مع مستودعات GitHub لتحويل الملاحظات والمهام إلى قضايا (Issues) فعلية.

🌟 **تم إطلاق الإصدار V1.0!** التطبيق اجتاز فحصاً أمنياً شاملاً قبل الإطلاق (Security & Performance Audit) وحقق تقييم **9.4/10** بفضل تطبيق كامل لتقنيات مثل `virtualization` و `DOMPurify` (للحماية من XSS)، واعتماد معمارية In-Memory Caching لمستودع البيانات، وإدارة أخطاء موثوقة عبر `Error Boundary`.

---

## ✨ المميزات الرئيسية (Core Features)

### � لوحة البيانات والإحصائيات (Dashboard & Stats)
- **إحصائيات تفاعلية:** إجمالي المشاريع النشطة، وسلاسل الأيام المستمرة (Streak).
- **مخططات النشاط:** رسوم بيانية تفصيلية للغات البرمجة ونشاط المطورين عبر الأشهر.

### 💼 إدارة المشاريع (Project Management)
- تسجيل مشاريع جديدة وتحديد (اللغة، مسار المجلد المحلي للفروع، ورابط الـ Repo).
- تتبع حالة المشروع ونسبة الإنجاز التلقائية بناءً على المهام.
- سجل خاص ومخصص لتحديثات وإصدارات المشروع (Changelog & Version Logs).

### 📝 الملاحظات والمهام المعززة (Notes, Tasks & Markdown)
- ثلاث تصنيفات منظمة: 💡 **فكرة (Idea)**، 🐛 **مشكلة (Bug)**، 📌 **مهمة (Todo)**.
- سجل تقدم محلي (Progress Logs) لكل مهمة لمتابعة مسار تطويرها من `New` إلى `Pending` ثم `Done`.

### 🔗 مزامنة عميقة مع GitHub API
- **ربط ذكي للايشوز:** تحويل أي مهمة أو ملاحظة إلى Issue فعلي على مستودع مشروعك على جيت هب بضغطة زر.
- **تزامن ثنائي الاتجاه:** جلب الـ Issues السابقة من المستودع وتحويلها لملاحظات داخل "مسار"، وتحديث حالاتها (Open/Closed) بالتبادل.

### 💾 النسخ الاحتياطي السحابي والمحلي (Backup & Sync)
- **ملف محلي:** تصدير واستيراد البيانات بتنسيق JSON (أو `.db` extensions).
- **Private Repo Backup:** رفع نسخة مشفرة وآمنة من قاعدة بيانات التطبيق كاملة كمستودع خاص `masar-data-backup` على حسابك الشخصي في GitHub لتستعيدها من أي جهاز آخر.

---

## 🛠 التكنولوجيا المُستخدمة (Tech Stack)

تم إعادة بناء **مسار** في نسخته الحديثة (V1.0) ليصبح تطبيق ويب سريع تقدمي يتخلص من أي حزم زائدة:

- **الإطار واللغة:** `React 18` و `TypeScript` لبنية قوية وخالية من أخطاء الـ Types.
- **بناء التطبيق والتوجيه:** `Vite.js` لسرعة التحميل العالية، مع التوجيه باستخدام `React Router DOM`.
- **الخلفية وقاعدة البيانات:** `Node.js` مع `Express` لخدمة الـ API، و `SQLite3` لتخزين البيانات محلياً بشكل دائم وموثوق.
- **تصميم الواجهات:** `Tailwind CSS` و `Framer Motion` للحركات والتأثيرات، وأيقونات من `Lucide React`.
- **الأداء العالي:** ذاكرة تخزين مؤقت داخلية (In-Memory Cache) لتخفيف الضغط على الـ LocalStorage/Database، وعرض القوائم الضخمة بكفاءة عبر `react-virtuoso`.
- **تطبيقات الأجهزة (Cross-platform):** يمكن تغليفه للديسكتوب والموبايل بسلاسة عن طريق دعم الـ **PWA** بالكامل، وبنية `Capacitor` المجهزة مسبقاً.

---

## 🚀 كيفية التشغيل محلياً (How to Run)

لتشغيل المشروع على جهازك (أو بناء تطبيق الهاتف/الكمبيوتر الشخصي)، اتبع الخطوات التالية:

### 1. تثبيت المشروع
```bash
# قم بعمل استنساخ للمستودع (Clone)
git clone https://github.com/MohamedGamal-Ahmed/Masar-App.git
cd Masar-App

# تثبيت الحزم (عبر npm أو yarn)
npm install
```

### 2. تشغيل المشروع (Development)
التطبيق يحتاج إلى تشغيل الـ Frontend والـ Backend معاً:

```bash
# تشغيل واجهة المستخدم (Vite)
npm run dev

# في نافذة terminal أخرى، تشغيل الخادم (Node backend)
npm run server
```
وسيتم تشغيل الواجهة على `http://localhost:3000` والخادم على `http://localhost:5000`.

### 3. بناء نسخة الإنتاج والـ PWA (Build)
```bash
npm run build
```
*(مجلد `dist` الناتج يمكن استضافته على Netlify أو Vercel أو GitHub Pages، وسيكون داعماً للعمل Offline).*

---

## 🔐 إعداد مزامنة GitHub والتخزين السحابي

للاستمتاع بالمزامنة والنسخ الاحتياطي عبر GitHub:
1. اذهب لشاشة **الإعدادات والتخزين (Settings / Backup Modal)** في التطبيق.
2. قم باستخراج رمز وصول شخصي **(Personal Access Token)** من حساب GitHub خاصتك مع إعطائه صلاحية `repo`.
3. الصق الرمز واضغط اتصال السيرفر بـ GitHub. التطبيق سييقوم تلقائياً بتهيئة مستودع مغلق لتخزين بياناتك داخله للحفاظ على استمراريتها بعيداً عن المتصفح فقط.

---

## 🧩 الهيكل (Folder Structure)

├── backend/             # خادم Express وقاعدة بيانات SQLite
│   ├── server.cjs       # ملف السيرفر الأساسي
│   └── schema.sql       # هيكل قاعدة البيانات
├── src/
│   ├── components/      # مكونات الواجهة المعزولة (Modals, Charts, Animations)
│   ├── pages/           # صفحات التطبيق الأساسية (Dashboard, ProjectDetails, AddNote...)
│   ├── services/        # الاتصال بـ GitHub API ومنسق التخزين المحلي (api.ts)
│   ├── utils/           # الملفات المساعدة (مثلاً التشفير والمعالجة)
│   ├── types.ts         # أنواع TypeScript المشتركة
│   └── index.tsx        # مدخل التطبيق وتغليف الأخطاء (ErrorBoundary)
├── public/              # أيقونات وبيانات الـ PWA (Manifest)
├── android/             # ملفات Capacitor لتشغيل التطبيق على أندرويد
├── constants.ts         # الثوابت والبيانات التجريبية
└── vite.config.ts       # إعدادات Vite وملحقات الـ PWA

---

<div align="center">
  <br/>
  <p><strong>تطوير وبناء بواسطة:</strong> <a href="mailto:mgamal.ahmed@outlook.com">محمد جمال</a></p>
  <p><em>تم بناء هذا المشروع بشغف لزيادة الإنتاجية البرمجية ⚡️</em></p>
</div>
