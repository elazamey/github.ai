---
name: github-engineering-control-center
description: Build or extend a GitHub-based engineering control center for project governance, Gate Engine decisions, execution Evidence, reusable Actions, project registries, review templates, and branch-protection preparation. Use when the user asks to turn GitHub into a project governance and verification system, formalize Gates, track baselines/SHA, automate PASS/BLOCK checks, or create a reusable repository template.
---

# GitHub Engineering Control Center

حوّل GitHub من مكان لحفظ الكود إلى طبقة **Governance + Verification + Automation**. نفّذ العمل على مراحل قابلة للتحقق، واحفظ كل نتيجة مرتبطة بـSHA وفرع ووقت تنفيذ.

## مبادئ إلزامية

- افحص المستودع الحالي والمشاريع المستهدفة قراءةً فقط قبل التعديل.
- افصل بين توثيق الحالة ونتيجة التنفيذ؛ لا تعتبر موافقة المالك أو Checkpoint بديلًا عن Evidence.
- لا تستخدم نجاحًا ضمنيًا: `NOT_RUN` أو نتيجة مفقودة تعني `BLOCK` لأي شرط مطلوب.
- اجعل المراجع الآلي Read-Only؛ لا تسمح له بتعديل مصدر المشروع أو إنشاء commit أو تجاوز Gate.
- لا تفعّل حماية فرع قد تمنع العمل قبل نجاح الـWorkflow على الفرع المستهدف. عند رفض GitHub بسبب خطة الحساب، اترك سياسة الحماية موثقة بحالة `PREPARED_NOT_ENABLED`.
- لا تصف المشروع بأنه Production Ready قبل اكتمال الفحوصات والأدلة التجريبية المطلوبة.

## سير العمل الأساسي

1. **حلّل النطاق.** حدّد هل المطلوب مركز تحكم جديد أم تحديث مستودع قائم، وحدد اسم المستودع، الخصوصية، الفرع الافتراضي، والمشاريع المراد ربطها. إذا كانت المعطيات واضحة، افترض القيم المعقولة ونفّذ بدل طرح أسئلة غير مؤثرة.
2. **افحص المصادر.** اقرأ حالة المستودع، أحدث commit، بنية الملفات، ملفات الحزم، وأوامر الاختبار والبناء في كل مشروع مستهدف. سجّل المشاريع التي لا تحتوي مصدرًا أو أوامر تحقق على أنها `REGISTERED` أو `NOT_CONFIGURED`، ولا تدّعي نجاحها.
3. **أنشئ الهيكل.** استخدم `README.md` و`PROJECT_STATUS.md` و`ARCHITECTURE.md` و`GOVERNANCE.md` و`ROADMAP.md`، إضافة إلى `GATES/` و`EVIDENCE/` و`DECISIONS/` و`CHECKPOINTS/` و`PROJECTS/` و`PROMPTS/` و`SCRIPTS/` و`.github/`. استخدم [project-profile.md](templates/project-profile.md) لكل مشروع.
4. **عرّف Gates قابلة للتنفيذ.** أنشئ `GATES/gates.json`؛ عرّف Gate 0 لسلامة مركز التحكم، ثم Gates اللاحقة للمعمارية والواجهة والخلفية والبيانات والذكاء الاصطناعي وE2E والنشر والاستعداد الإنتاجي. اربط كل Gate بـ`requires` و`previous` عند الحاجة. اقرأ [gate-engine.md](references/gate-engine.md) قبل تغيير صيغة القرار.
5. **طبّق المحرك والأدلة.** أنشئ محركًا حتميًا يقرأ تعريف Gate ونتائج JSON، ويخرج تقريرًا يحتوي `decision`, `baseline`, `branch`, `evaluated_at_utc`, والفحوصات والأسباب. اجعل رمز الخروج صفرًا عند `PASS` وواحدًا عند `BLOCK` وخطأً تشغيليًا عند إعداد غير صالح. اجعل مولّد Evidence يحفظ JSON وMarkdown، ويجمع SHA والفرع والوقت وWorkflow Run ورابط النشر عندما تتوفر.
6. **أضف فحوصات ذاتية.** اختبر على الأقل حالة `PASS` وحالة `BLOCK` بسبب `NOT_RUN` أو نقص النتيجة. تحقق من JSON وSyntax للسكربتات ووجود Gates والملفات الإلزامية.
7. **اربط GitHub Actions.** شغّل فحص البنية، والفحوصات الذاتية، وتقييم Gate، ثم ارفع Evidence كـArtifact. أضف فحوصات المشروع الفعلية فقط عندما تكون أوامرها معروفة؛ لا تضع `npm test` أو `npm build` افتراضيًا لمشروع لا يحتوي `package.json`.
8. **أضف قوالب المراجعة.** استخدم [pull_request_template.md](templates/pull_request_template.md) وقوالب Gate Blocker وTechnical Decision. اطلب في Pull Request الـGate المستهدف، SHA، Workflow Run، Evidence، نتائج الاختبارات، والاستثناءات.
9. **أنشئ السجل والسياسات.** أنشئ `PROJECTS/projects.json` وملفات تعريف Markdown، وقوالب Decisions وCheckpoints، وسياسة حماية فرع مثل [main-policy.json](templates/main-policy.json). اجعل السياسة قابلة للتفعيل لاحقًا ولا تخلط payload API التابع لـGitHub مع وثيقة السياسة.
10. **اختبر ثم انشر.** شغّل التحقق محليًا، افحص `git diff --check`، نفّذ commit واضحًا، ادفع إلى الفرع الافتراضي، وانتظر تشغيل GitHub Actions المرتبط بالـSHA الجديد. اقرأ [github-integration.md](references/github-integration.md) عند إعداد حماية الفرع أو التعامل مع رفض الخطة.
11. **سلّم نتيجة قابلة للمراجعة.** اذكر رابط المستودع، آخر commit، رابط Workflow الناجح، المكونات المنفذة، وأي قيد لم يُفعّل. أرفق نسخة مضغوطة من المشروع إذا كان التسليم البرمجي مطلوبًا.

## بنية النتيجة الافتراضية

| المسار | الوظيفة |
|---|---|
| `GATES/gates.json` | تعريف Gates وشروطها وانتقالاتها |
| `SCRIPTS/gate-engine.py` | إصدار `PASS` أو `BLOCK` |
| `SCRIPTS/generate-evidence.sh` | جمع Evidence وتوليد القرار |
| `SCRIPTS/validate-control-center.sh` | فحص الهيكل وJSON وSyntax |
| `SCRIPTS/test-gate-engine.sh` | اختبار النجاح والحجب |
| `.github/workflows/control-center.yml` | التشغيل الآلي عند Push وPull Request |
| `PROJECTS/projects.json` | سجل آلي للمشاريع |
| `.github/branch-protection/main-policy.json` | سياسة حماية جاهزة وغير مفعلة افتراضيًا |

## معايير القبول

اعتبر المهمة مكتملة فقط إذا كان الهيكل موجودًا، وGate Engine يثبت حالتي `PASS/BLOCK`، وEvidence يتضمن SHA ووقتًا، وGitHub Actions ينجح على commit المنشور، وقوالب المراجعة والسياسات موجودة. إذا تعذر تفعيل Branch Protection بسبب خصوصية مستودع مجاني، سجّل ذلك بوضوح ولا تغيّر خصوصية المستودع دون طلب صريح.

## موارد اختيارية

- اقرأ [gate-engine.md](references/gate-engine.md) عند تصميم الشروط أو تفسير القرار.
- اقرأ [github-integration.md](references/github-integration.md) قبل استدعاءات GitHub أو حماية الفروع.
- انسخ القوالب من `templates/` ثم خصصها للمستودع بدل إعادة اختراعها.
