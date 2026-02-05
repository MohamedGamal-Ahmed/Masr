# 🤝 المساهمة في مشروع مسار | Contributing to Masar

شكراً لاهتمامك بالمساهمة في مشروع مسار! نرحب بجميع المساهمات سواء كانت إصلاح أخطاء، إضافة ميزات جديدة، أو تحسين التوثيق.

---

## 🚀 البدء السريع

### 1. Fork المشروع
```bash
# انسخ المشروع لحسابك
git clone https://github.com/YOUR_USERNAME/Masar.git
cd Masar
```

### 2. تثبيت التبعيات
```bash
npm install
```

### 3. تشغيل بيئة التطوير
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev
```

---

## 📋 قواعد المساهمة

### Git Workflow
1. أنشئ branch جديد من `main`:
   ```bash
   git checkout -b feature/اسم-الميزة
   # أو
   git checkout -b fix/اسم-الإصلاح
   ```

2. اعمل commits واضحة ومحددة:
   ```bash
   git commit -m "feat: إضافة ميزة تصدير المشاريع"
   git commit -m "fix: إصلاح مشكلة في عرض الملاحظات"
   ```

3. ادفع التغييرات وافتح Pull Request:
   ```bash
   git push origin feature/اسم-الميزة
   ```

### تنسيق Commit Messages
نستخدم [Conventional Commits](https://www.conventionalcommits.org/):

| النوع | الاستخدام |
|-------|---------|
| `feat:` | ميزة جديدة |
| `fix:` | إصلاح خطأ |
| `docs:` | تحديث التوثيق |
| `style:` | تنسيق الكود (بدون تغيير المنطق) |
| `refactor:` | إعادة هيكلة الكود |
| `test:` | إضافة أو تعديل الاختبارات |

---

## 🏗️ هيكل المشروع

```
Masar/
├── backend/          # Express.js API Server
│   ├── server.cjs    # نقطة الدخول للسيرفر
│   └── schema.sql    # هيكل قاعدة البيانات
├── src/
│   ├── services/     # API Client
│   └── components/   # المكونات المشتركة
├── pages/            # صفحات التطبيق
├── App.tsx           # Router الرئيسي
└── types.ts          # TypeScript Types
```

---

## ✅ قبل فتح Pull Request

- [ ] تأكد من عمل الكود بدون أخطاء: `npm run dev`
- [ ] اختبر التغييرات مع الـ Backend: `npm run server`
- [ ] تأكد من عدم وجود أخطاء TypeScript
- [ ] حدّث README.md إذا لزم الأمر

---

## 💬 التواصل

لأي استفسارات أو اقتراحات:
- **Email**: [mgamal.ahmed@outlook.com](mailto:mgamal.ahmed@outlook.com)
- **GitHub Issues**: افتح Issue جديد للإبلاغ عن مشاكل أو اقتراح ميزات

---

**شكراً لمساهمتك! 🙏**
