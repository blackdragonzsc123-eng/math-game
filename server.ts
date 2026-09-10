import express from 'express';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to get DeepSeek API key
function getDeepSeekKey(req: express.Request): string | null {
  const customHeader = req.headers['x-deepseek-key'];
  if (typeof customHeader === 'string' && customHeader.trim().length > 0) {
    return customHeader.trim();
  }
  if (req.body && typeof req.body.customApiKey === 'string' && req.body.customApiKey.trim().length > 0) {
    return req.body.customApiKey.trim();
  }
  const envKey = process.env.DEEPSEEK_API_KEY;
  if (envKey && envKey.trim().length > 0 && envKey !== 'MY_DEEPSEEK_API_KEY') {
    return envKey.trim();
  }
  return null;
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// System telemetry & background metrics endpoint (CPU, Memory, Load)
app.get('/api/system/metrics', (_req, res) => {
  const mem = process.memoryUsage();
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  res.json({
    success: true,
    server: {
      heapUsedMb: +(mem.heapUsed / 1024 / 1024).toFixed(1),
      heapTotalMb: +(mem.heapTotal / 1024 / 1024).toFixed(1),
      rssMb: +(mem.rss / 1024 / 1024).toFixed(1),
      externalMb: +(mem.external / 1024 / 1024).toFixed(1),
      systemTotalMb: +(totalMem / 1024 / 1024).toFixed(0),
      systemFreeMb: +(freeMem / 1024 / 1024).toFixed(0),
      uptimeSec: Math.floor(process.uptime()),
      cpuCount: cpus.length,
      loadAvg1m: +loadAvg[0].toFixed(2),
    },
    hasDeepSeekKey: !!(process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim() !== ''),
    timestamp: Date.now()
  });
});

// DeepSeek Status endpoint
app.get('/api/deepseek/status', (req, res) => {
  const key = getDeepSeekKey(req);
  res.json({
    hasKey: !!key,
    provider: 'deepseek',
    models: ['deepseek-reasoner', 'deepseek-chat']
  });
});

// Offline Bank of High-Thinking Deductive Puzzles (works with zero internet & no API key)
const OFFLINE_RIDDLES = [
  {
    puzzle: 'ثلاثة أشخاص دخلوا مسابقة: أحمد، بدر، وسامي. أحمد قال: "أنا لست في المركز الأول". بدر قال: "أنا في المركز الأول". سامي قال: "بدر يكذب". إذا كان شخص واحد فقط يقول الصدق، فمن الفائز بالمركز الأول؟',
    question: 'من الفائز بالمركز الأول وما هو التبرير المنطقي؟',
    hint: 'فكر في التناقض المباشر بين كلام بدر وسامي؛ كلاهما لا يمكن أن يكونا صادقين معاً ولا كاذبين معاً بالضرورة.',
    solution: 'الفائز هو أحمد! إذا افترضنا أن سامي صادق، فبدر يكذب. وبما أن الصادق واحد فقط، فإن أحمد أيضاً يكذب بقوله "أنا لست الأول"، مما يعني حتماً أن أحمد هو صاحب المركز الأول دون أي تناقض.',
    difficultyRating: '8 / 10',
    cognitiveDomain: 'الاستدلال الاستنباطي وحل التناقضات'
  },
  {
    puzzle: 'في جزيرة المنطق، يسكن فصيلتان: فرسان يقولون الصدق دائماً، ولصوص يكذبون دائماً. التقيت بساكنين أ و ب. قال أ: "على الأقل واحد منا لص". ما هو نوع كل من أ و ب؟',
    question: 'حدد بدقة هل أ فارس أم لص، وهل ب فارس أم لص مع البرهان.',
    hint: 'افترض أن أ لص؛ هل يستطيع اللص أن يقول عبارة صحيحة في الواقع؟',
    solution: 'أ فارس و ب لص! إذا كان أ لصاً، فإن عبارته "على الأقل واحد منا لص" ستكون صادقة، ولكن اللص لا يمكنه قول الصدق أبداً، وهذا تناقض مستحيل. إذن أ فارس صادق حتماً، ولتكون عبارته صادقة يجب أن يكون ب لصاً.',
    difficultyRating: '8.5 / 10',
    cognitiveDomain: 'منطق الفرسان واللصوص والمغالطات الصورية'
  },
  {
    puzzle: 'خمسة صناديق مرقمة من 1 إلى 5. أربعة صناديق تحتوي على كرات ذهب وزن كل كرة 10 غرامات، وصندوق واحد يحتوي على كرات مزيفة وزن كل منها 9 غرامات. لديك ميزان إلكتروني رقمي مسموح لك باستخدامه لوزنة واحدة فقط.',
    question: 'كيف تحدد رقم الصندوق الذي يحتوي على الكرات المزيفة بوزنة واحدة فقط؟',
    hint: 'خذ أعداداً مختلفة من الكرات من كل صندوق بناءً على رقمه (مثلاً 1 من الأول، 2 من الثاني...).',
    solution: 'نأخذ 1 كرة من الصندوق 1، و2 كرات من الصندوق 2، و3 من الصندوق 3، و4 من الصندوق 4، و5 من الصندوق 5. المجموع = 15 كرة. لو كانت كلها أصلية لكان الوزن = 150 غراماً. نطرح الوزن الفعلي من 150، ومقدار النقص بالغرامات يمثل رقم الصندوق المزيف بالضبط! (إذا نقص 3 غرامات فالصندوق 3 هو المزيف).',
    difficultyRating: '9 / 10',
    cognitiveDomain: 'التفكير الرياضي الخوارزمي والمصفوفات'
  },
  {
    puzzle: 'لديك ساعتان رمليتان: الأولى تقيس 7 دقائق بالضبط، والثانية تقيس 11 دقيقة بالضبط. كيف يمكنك استخدام هاتين الساعتين لقياس 15 دقيقة بالضبط لتحضير تجربة علمية؟',
    question: 'ما هي خطوات القياس الدقيقة بالساعتين معاً؟',
    hint: 'ابدأ بتشغيل الساعتين معاً في نفس اللحظة.',
    solution: 'نبدأ بتشغيل الساعتين معاً في اللحظة صفر. بعد 7 دقائق تنتهي الساعة الأولى (يتبقى 4 دقائق في الساعة الثانية). نقلب الساعة الأولى فوراً (7 دقائق). بعد 4 دقائق أخرى (عند الدقيقة 11)، تنتهي الساعة الثانية، ويكون قد مضى 4 دقائق في الساعة الأولى ويتبقى فيها 3 دقائق بالضبط. في هذه اللحظة نقلب الساعة الأولى، فنحصل على 4 دقائق إضافية (11 + 4 = 15 دقيقة بالضبط)!',
    difficultyRating: '9 / 10',
    cognitiveDomain: 'الجدولة الزمنية المنطقية والعد الديناميكي'
  },
  {
    puzzle: 'ثلاثة مصابيح كهربائية داخل غرفة مغلقة بالكامل لا يمكن رؤية داخلها. خارج الغرفة توجد 3 مفاتيح كهربائية منفصلة (A, B, C). يمكنك الدخول إلى الغرفة مرة واحدة فقط لمعاينة المصابيح.',
    question: 'كيف تكتشف أي مفتاح يتحكم في أي مصباح بعد فحص الغرفة مرة واحدة فقط؟',
    hint: 'المصباح الكهربائي لا يصدر ضوءاً فقط، بل ينتج شيئاً آخر عند تشغيله لفترة.',
    solution: 'نشغل المفتاح A وننتظر 10 دقائق حتى يسخن المصباح. بعد ذلك، نطفئ المفتاح A ونشغل المفتاح B مباشرة وندخل الغرفة فوراً. المصباح المضاء يتحكم فيه المفتاح B، والمصباح المطفأ والساخن عند لمسه يتحكم فيه المفتاح A، والمصباح المطفأ والبارد يتحكم فيه المفتاح C!',
    difficultyRating: '8.5 / 10',
    cognitiveDomain: 'التفكير الجانبي وتوسيع أبعاد المشكلة الفيزيائية'
  }
];

let riddleIndex = 0;

// Unified DeepSeek / AI handler
async function handleThinkingRequest(req: express.Request, res: express.Response) {
  const { type, category, puzzleInput, userAnswer, gameStats } = req.body;
  const apiKey = getDeepSeekKey(req);

  // If no API key provided, gracefully fallback to the offline reasoning bank
  if (!apiKey) {
    if (type === 'riddle') {
      const selected = OFFLINE_RIDDLES[riddleIndex % OFFLINE_RIDDLES.length];
      riddleIndex++;
      return res.json({
        success: true,
        title: 'لغز التفكير المنطقي الذكي (أوفلاين)',
        content: selected.puzzle,
        provider: 'offline_bank',
        thinkingSummary: 'تم استدعاء لغز من بنك الاستدلال المنطقي غير المتصل. أضف مفتاح DEEPSEEK_API_KEY لتوليد ألغاز ذكاء اصطناعي حية غير محدودة مع نموذج التفكير العالي.',
        reasoningContent: 'تم تحليل المعضلة منطقياً عبر استبعاد الفرضيات المتناقضة خطوة بخطوة للوصول إلى النتيجة الحتمية.',
        riddleData: selected
      });
    }

    if (type === 'evaluate_answer') {
      const userText = (userAnswer || '').toLowerCase().trim();
      const official = (req.body.officialSolution || '').toLowerCase();
      // Basic heuristic for offline evaluation
      const keywords = official.split(/\s+/).filter((w: string) => w.length > 3);
      const matched = keywords.filter((k: string) => userText.includes(k));
      const isLikelyCorrect = matched.length >= Math.min(2, Math.max(1, Math.floor(keywords.length * 0.25)));

      return res.json({
        success: true,
        provider: 'offline_bank',
        evaluation: {
          isCorrect: isLikelyCorrect,
          feedback: isLikelyCorrect
            ? 'أحسنت! إجابتك تقترب بشكل كبير من الحل والبرهان المنطقي السليم.'
            : 'تحتاج إجابتك لمزيد من التدقيق المنطقي واستبعاد الفرضيات البديلة. راجع الحل والبرهان أدناه.',
          explanation: req.body.officialSolution || 'راجع الخطوات المنطقية للتأكد من انعدام التناقض.'
        }
      });
    }

    if (type === 'analyze') {
      const bestScore = gameStats?.bestScore || 0;
      const bestLevel = gameStats?.bestLevel || 1;
      return res.json({
        success: true,
        provider: 'offline_bank',
        title: 'التحليل الإدراكي والمرونة العصبية (محلي)',
        content: `بناءً على نتائجك المسجلة (أعلى مجموع: ${bestScore} نقطة، أعلى مستوى: ${bestLevel}):\n\n1. كفاءة التثبيط وسرعة البديهة: تظهر استجابة عالية في التبديل بين الأنماط المتعارضة ومقاومة تأثير ستروب الإدراكي.\n2. التفكير المكاني والتدوير الذهني: تدل النتائج على نشاط متوازن في الفص الجداري المسؤول عن المعالجة المكانية للأشكال والزوايا.\n3. خطة التطوير المقترحة: خصص 5 دقائق يومياً لألعاب "العامل المفقود" لتسريع الحساب الذهني، و3 جولات في "نعم أو لا" لتعزيز المرونة العصبية.\n\n*ملاحظة: يمكنك إدخال مفتاح DeepSeek API للحصول على تحليل عصبي عميق ومفصل بالذكاء الاصطناعي.*`
      });
    }

    return res.json({
      success: true,
      provider: 'offline_bank',
      title: 'حل المسألة المنطقية (محلي)',
      content: `المسألة: "${puzzleInput || 'مسألة رياضية'}"\n\nالحل المنطقي: تم استلام المسألة. للحصول على تحليل تفصيلي خطوة بخطوة بالذكاء الاصطناعي العالي، يرجى تزويد مفتاح DeepSeek API في شريط الإعدادات أو عبر متغير DEEPSEEK_API_KEY.`
    });
  }

  // If API key is available, call DeepSeek API
  try {
    let systemPrompt = 'أنت خبير ذكاء واستدلال عالمي ومدرب ألعاب ذهنية متخصص في علم الأعصاب الإدراكي والألغاز الرياضية المعقدة. تتحدث باللغة العربية الفصحى الراقية، وتستخدم التفكير المنطقي العميق المتسلسل خطوة بخطوة.';
    let userPrompt = '';

    if (type === 'riddle') {
      userPrompt = `قم بتوليد لغز أو معضلة تفكير منطقي أو رياضي إبداعي وجديد تماماً بمستوى صعوبة متقدم (${category || 'منطق استنتاجي وتفكير جانبي'}).
المطلوب إرجاع الناتج بصيغة JSON حصراً بهذا التنسيق:
{
  "puzzle": "نص المعضلة أو اللغز المشوق",
  "question": "السؤال المحدد المطلوب إجابته",
  "hint": "تلميح استراتيجي يساعد على التفكير دون حرق الحل",
  "solution": "الحل الدقيق والمفصل مع البرهان المنطقي خطوة بخطوة",
  "difficultyRating": "تقدير الصعوبة من 10 (مثال: 8.5 / 10)",
  "cognitiveDomain": "المجال الذهني (مثال: المنطق المكاني، الاستنباط الرياضي، إلخ)"
}`;
    } else if (type === 'evaluate_answer') {
      userPrompt = `لدينا اللغز التالي:
"${puzzleInput}"
والإجابة النموذجية مع البرهان هي:
"${req.body.officialSolution}"
إجابة المستخدم هي:
"${userAnswer}"

قيّم إجابة المستخدم بموضوعية ودقة مستخدماً الاستدلال المنطقي العالي.
أرجع الناتج بصيغة JSON حصراً:
{
  "isCorrect": true أو false,
  "feedback": "ملاحظة تشجيعية مفصلة تشرح أين أصاب وأين أخطأ بدقة وبلاغة",
  "explanation": "شرح الحل الصحيح والمسار الفكري الدقيق"
}`;
    } else if (type === 'analyze') {
      userPrompt = `قم بإجراء تحليل إدراكي عميق وشامل لنتائج اللاعب في منصة تدريب الدماغ:
- أعلى نتيجة عامة: ${gameStats?.bestScore || 0}
- أعلى مستوى: ${gameStats?.bestLevel || 1}
- تفاصيل نتائج الألعاب: ${JSON.stringify(gameStats?.recentScores || {})}

حلل كلاً من:
1. سرعة المعالجة الإدراكية وزمن الاستجابة الحركي
2. كفاءة التثبيط الإدراكي (Stroop Effect ومقاومة التشتت)
3. التفكير المكاني والتدوير الذهني في الذاكرة العاملة
4. خطة تدريبية مخصصة من 3 خطوات يومية لتحفيز المرونة العصبية (Neuroplasticity).
اكتب التحليل بلغة عربية فصحى راقية، علمية، وممتعة.`;
    } else {
      userPrompt = `مسألة من المستخدم تتطلب تفكيراً منطقياً أو رياضياً معقداً:
"${puzzleInput}"

حلل المسألة باستخدام التفكير المعمق خطوة بخطوة. استخرج المعطيات، اختبر الفرضيات، استبعد التناقضات، واعرض النتيجة النهائية المؤكدة مع التفسير الرياضي أو المنطقي الشافي.`;
    }

    // Call DeepSeek API with deepseek-reasoner (or deepseek-chat fallback)
    let deepSeekModel = 'deepseek-reasoner';
    let deepseekRes = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: deepSeekModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    // If deepseek-reasoner is unavailable or rejects system message, try deepseek-chat
    if (!deepseekRes.ok) {
      deepSeekModel = 'deepseek-chat';
      deepseekRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: deepSeekModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7
        })
      });
    }

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      throw new Error(`DeepSeek API error: ${deepseekRes.status} ${errText}`);
    }

    const data = await deepseekRes.json() as any;
    const choice = data.choices?.[0]?.message;
    const content = choice?.content || '';
    const reasoningContent = choice?.reasoning_content || '';

    if (type === 'riddle') {
      try {
        const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return res.json({
          success: true,
          provider: 'deepseek',
          title: 'لغز التفكير المنطقي (DeepSeek R1)',
          content: parsed.puzzle,
          reasoningContent,
          riddleData: parsed
        });
      } catch {
        return res.json({
          success: true,
          provider: 'deepseek',
          title: 'لغز التفكير المنطقي (DeepSeek R1)',
          content,
          reasoningContent,
          riddleData: {
            puzzle: content,
            question: 'ما هو الحل المنطقي للغز أعلاه؟',
            hint: 'فكر في العلاقات الاستنتاجية بين المعطيات.',
            solution: 'راجع خطوات التفكير العالي المنطقي لاستنتاج البرهان الكامل.',
            difficultyRating: '8.5 / 10',
            cognitiveDomain: 'الاستدلال الاستنباطي'
          }
        });
      }
    }

    if (type === 'evaluate_answer') {
      try {
        const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return res.json({
          success: true,
          provider: 'deepseek',
          reasoningContent,
          evaluation: parsed
        });
      } catch {
        return res.json({
          success: true,
          provider: 'deepseek',
          reasoningContent,
          evaluation: {
            isCorrect: content.includes('صحيح') || content.includes('أحسنت') || content.includes('دقيق'),
            feedback: content,
            explanation: content
          }
        });
      }
    }

    return res.json({
      success: true,
      provider: 'deepseek',
      reasoningContent,
      content
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'حدث خطأ في الاتصال بـ DeepSeek';
    console.error('DeepSeek Error:', message);

    // Provide seamless fallback so user experience is uninterrupted
    if (type === 'riddle') {
      const selected = OFFLINE_RIDDLES[0];
      return res.json({
        success: true,
        provider: 'offline_bank',
        title: 'لغز التفكير المنطقي (أوفلاين)',
        content: selected.puzzle,
        riddleData: selected,
        error: `تعذر الاتصال بـ DeepSeek (${message}). تم عرض لغز من البنك المحلي.`
      });
    }

    return res.status(500).json({
      success: false,
      error: message
    });
  }
}

// DeepSeek Thinking routes (with alias to gemini for backward compatibility)
app.post('/api/deepseek/thinking', handleThinkingRequest);
app.post('/api/gemini/thinking', handleThinkingRequest);

// Vite dev server or static files
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
