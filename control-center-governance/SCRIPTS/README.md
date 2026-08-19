# Scripts

أدوات محلية صغيرة لتوليد Evidence، تقييم الـGates، والتحقق من اكتمال مركز التحكم. يجب أن تكون قابلة للتشغيل دون تعديل مصدر المشروع.

| السكربت | الوظيفة |
|---|---|
| `validate-gates.sh` | التحقق من وجود Gates 0–8 وبياناتها الأساسية |
| `validate-control-center.sh` | فحص الملفات المطلوبة وصيغة JSON وSyntax للسكربتات |
| `gate-engine.py` | إصدار قرار `PASS` أو `BLOCK` من نتائج الفحوصات |
| `generate-evidence.sh` | جمع السياق وتوليد Evidence وقرار Gate |
| `test-gate-engine.sh` | اختبار سلوك النجاح والحجب |
