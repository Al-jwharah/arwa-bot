# دمج المشروعين

المصدر 1: مساحة العمل الكاملة (تطبيق أروى + بوت تلجرام + استوديو + لوحة إدارة + شات).
المصدر 2: arwa_nsfw_mod (personality/safety/grok وبقية وحدات أروى + bot_index).

ما تم:
- المشروع كامل كما هو (src, bot, public, data, scripts, server, ...).
- ملفات المود غطّت `src/lib/arwa/*` و`bot/arwa/*` و`bot/index.ts`.
- صور الهوية الناقصة (avatar/portrait/cafe) نُقلت إلى `public/arwa`.
- نسخة المود محفوظة في `vendor/arwa_nsfw_mod`.

لم يُنسخ مجلد البناء `.vercel` ولا `.grok` (كاش توليد، مو سورس).
