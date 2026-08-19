# Engineering Control Center

مستودع مركزي لإدارة دورة حياة المشاريع البرمجية من خلال **الحوكمة، التحقق، الـGates، وأدلة التنفيذ**. الهدف هو جعل حالة المشروع قابلة للتتبع بين الجلسات والـcommits، بحيث يعتمد الانتقال بين المراحل على Evidence قابل للمراجعة بدلًا من التقديرات الشفهية.

## المكونات الأساسية

| المكوّن | الغرض |
|---|---|
| `PROJECT_STATUS.md` | الحالة الحالية للمشاريع والـGates المفتوحة |
| `ARCHITECTURE.md` | وصف المعمارية والحدود بين المكونات |
| `ROADMAP.md` | المراحل القادمة والأولويات |
| `GATES/` | تعريف شروط كل Gate وحالته |
| `EVIDENCE/` | تقارير الاختبارات والبناء والنشر |
| `DECISIONS/` | القرارات التقنية والاستثناءات |
| `CHECKPOINTS/` | الـSHA والـbaselines المعتمدة |
| `PROMPTS/` | التعليمات الرئيسية القابلة لإعادة الاستخدام |
| `PROJECTS/` | سجل المشاريع وملفات تعريفها وأوامر التحقق |
| `SCRIPTS/` | أدوات التحقق وتوليد الأدلة |
| `.github/` | Workflows وقوالب Pull Requests وIssues وسياسة حماية الفرع |

## نموذج الـGate

كل Gate يحدد شروطًا قابلة للتحقق. لا ينتقل المشروع إلى Gate لاحق إلا بعد استيفاء شروط Gate الحالي وتسجيل Evidence يذكر الـcommit والفرع ونتائج الفحص ووقت التنفيذ.

```text
Source Change
     ↓
Lint → TypeScript Check → Tests → Build → Secret Scan
     ↓
Architecture Checks → Evidence Generator
     ↓
Gate Decision: PASS / BLOCK
```

## التشغيل المحلي

لتوليد Evidence وتقييم Gate 0:

```bash
./SCRIPTS/generate-evidence.sh --gate gate-0
```

لتشغيل اختبارات المحرك التي تتحقق من حالتي `PASS` و`BLOCK`:

```bash
./SCRIPTS/test-gate-engine.sh
```

للتحقق من أن ملفات الـGates الأساسية موجودة ومنظمة:

```bash
./SCRIPTS/validate-gates.sh
```

يقرأ `SCRIPTS/gate-engine.py` تعريفات `GATES/gates.json` ونتائج الفحوصات في JSON. غياب أي شرط مطلوب أو وجود `FAIL` أو `NOT_RUN` يؤدي إلى قرار `BLOCK`؛ ولا توجد حالة نجاح ضمنية.

## سياسة التغيير

هذا المستودع مخصص للحوكمة والتحقق. لا تعدّل أدوات المشروع المصدرية من خلاله، ولا تعتبر موافقة المالك أو وجود Checkpoint بديلًا عن Execution Evidence. يجب أن تكون نتائج الاختبارات والبناء مرتبطة بـSHA محدد وقابلة لإعادة الفحص.

## الحالة الحالية

الإصدار الأول يوفّر الهيكل، قوالب التوثيق، مولّد Evidence محليًا، والتحقق الآلي الأساسي. تكامل حماية الفروع، وربط مشاريع GitHub، ومراجع الذكاء الاصطناعي للـPull Requests تُضاف لاحقًا ضمن الـRoadmap.

## الترخيص

يُترك الترخيص غير محدد إلى أن يختار مالك المستودع السياسة المناسبة للاستخدام والمشاركة.

## References

[1]: https://docs.github.com/en/actions "GitHub Actions documentation"
[2]: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches "GitHub protected branches documentation"
[3]: https://docs.github.com/en/issues/planning-and-tracking-with-projects "GitHub Projects documentation"
