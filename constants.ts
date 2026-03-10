import { Project, VersionLog, Note, StatData } from '@/types';

export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'تطبيق المتجر الإلكتروني',
    description: 'تطبيق تجارة إلكترونية متعدد المنصات باستخدام React Native.',
    language: 'React Native',
    version: 'v2.4.0',
    lastUpdate: 'منذ ساعتين',
    status: 'active',
    repoUrl: 'github.com/user/shop-app',
    localPath: '~/dev/mobile/shop-app',
    branch: 'main'
  },
  {
    id: '2',
    name: 'واجهة المخزون (API)',
    description: 'نظام إدارة المخزون الخلفي.',
    language: 'Node.js',
    version: 'v1.1.2',
    lastUpdate: 'أمس',
    status: 'active',
    repoUrl: 'github.com/user/inventory-api',
    localPath: '~/dev/backend/inventory-api',
    branch: 'dev'
  },
  {
    id: '3',
    name: 'بوت تداول',
    description: 'سكربت بايثون لتحليل العملات الرقمية.',
    language: 'Python',
    version: 'v0.8.4',
    lastUpdate: 'منذ 3 أيام',
    status: 'archived',
    repoUrl: 'github.com/user/crypto-bot',
    localPath: '~/dev/scripts/bot',
    branch: 'v1-legacy'
  }
];

export const MOCK_LOGS: VersionLog[] = [
  {
    id: '101',
    projectId: '1',
    version: 'v2.4.0',
    date: '2024-03-15',
    title: 'تحديث الوضع الليلي',
    description: 'إضافة دعم كامل للوضع الداكن بناءً على إعدادات النظام.',
    type: 'feature',
    changes: ['تحسين ألوان التباين', 'إصلاح مشكلة الأيقونات في الخلفية السوداء']
  },
  {
    id: '102',
    projectId: '1',
    version: 'v2.3.5',
    date: '2024-03-10',
    title: 'إصلاح انهيار التطبيق',
    description: 'حل مشكلة تؤدي إلى إغلاق التطبيق عند فتح سلة المشتريات.',
    type: 'bugfix',
    changes: ['Fix NullPointerException in CartProvider', 'تحديث مكتبة التنقل']
  },
];

export const MOCK_NOTES: Note[] = [
  {
    id: 'n1',
    projectId: '1',
    title: 'مشكلة في الدفع عبر Visa',
    content: 'البوابة ترفض العمليات القادمة من IP معين، أحتاج لمراجعة الـ Logs.',
    type: 'bug',
    date: '2024-03-16',
    status: 'in_progress',
    reminder: true,
    progressLogs: [
      { id: 'u1', date: '2024-03-16 10:00 AM', content: 'تم التحقق من الـ API Key وهو يعمل بشكل صحيح.' },
      { id: 'u2', date: '2024-03-16 02:30 PM', content: 'اكتشفت أن المشكلة في إعدادات الـ Firewall، سأقوم بتجربة IP مختلف.' }
    ]
  },
  {
    id: 'n2',
    projectId: '2',
    title: 'فكرة: تحويل التخزين إلى Redis',
    content: 'قاعدة البيانات الحالية بطيئة في الاستعلامات المتكررة.',
    type: 'idea',
    date: '2024-03-14',
    status: 'pending',
    reminder: false,
    progressLogs: []
  },
  {
    id: 'n3',
    projectId: '1',
    title: 'تحديث مكتبة UI',
    content: 'المكتبة الحالية قديمة وتسبب مشاكل في التوافق.',
    type: 'todo',
    date: '2024-03-12',
    status: 'pending',
    reminder: true,
    progressLogs: []
  }
];

export const ACTIVITY_DATA: StatData[] = [
  { name: 'يناير', value: 12 },
  { name: 'فبراير', value: 19 },
  { name: 'مارس', value: 35 },
  { name: 'أبريل', value: 24 },
  { name: 'مايو', value: 42 },
  { name: 'يونيو', value: 38 },
];

export const LANGUAGE_STATS: StatData[] = [
  { name: 'JS/TS', value: 65 },
  { name: 'Python', value: 20 },
  { name: 'Rust', value: 15 },
];