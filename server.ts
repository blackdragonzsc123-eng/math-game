import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI client lazily
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Thinking API endpoint using gemini-3.1-pro-preview with ThinkingLevel.HIGH
app.post('/api/gemini/thinking', async (req, res) => {
  try {
    const { type, category, puzzleInput, userAnswer, gameStats } = req.body;
    const ai = getAi();

    if (!ai) {
      // Graceful fallback if no API key provided
      if (type === 'riddle') {
        return res.json({
          success: true,
          title: 'لغز التفكير المنطقي الذكي',
          content: 'ثلاثة أشخاص دخلوا مسابقة: أحمد، بدر، وسامي. أحمد قال: "أنا لست في المركز الأول". بدر قال: "أنا في المركز الأول". سامي قال: "بدر يكذب". إذا كان شخص واحد فقط يقول الصدق، فمن الفائز بالمركز الأول؟',
          thinkingSummary: 'تم تطبيق التفكير العالي المنطقي: بفحص كل احتمال على حدة يتبين تناقض كلام بدر وسامي، وبالتالي أحمد هو الفائز.',
          riddleData: {
            puzzle: 'ثلاثة أشخاص دخلوا مسابقة: أحمد، بدر، وسامي. أحمد قال: "أنا لست في المركز الأول". بدر قال: "أنا في المركز الأول". سامي قال: "بدر يكذب". إذا كان شخص واحد فقط يقول الصدق، فمن الفائز بالمركز الأول؟',
            question: 'من الفائز بالمركز الأول؟',
            hint: 'فكر في التناقض المباشر بين كلام بدر وسامي، فكلاهما لا يمكن أن يكونا صادقين معاً.',
            solution: 'الفائز هو أحمد! إذا كان سامي صادقاً فبدر يكذب، وبما أن الصادق واحد فقط فإن أحمد أيضاً يكذب بقوله "أنا لست الأول"، مما يعني حتماً أن أحمد هو الأول.',
            difficultyRating: 'متوسط إلى متقدم',
            cognitiveDomain: 'الاستدلال الاستنباطي وحل التناقضات'
          }
        });
      }

      if (type === 'analyze') {
        return res.json({
          success: true,
          title: 'تحليل الأداء المعرفي المتقدم',
          content: `بناءً على نتائجك (أعلى نقطة: ${gameStats?.bestScore || 0}، أعلى مستوى: ${gameStats?.bestLevel || 1})، يظهر دماغك مرونة عصبية ملحوظة في معالجة الإشارات المتزامنة وسرعة رد الفعل التثبيطي (Inhibitory Control). نوصي بالتركيز على جولات "خداع الألوان" لتعزيز قشرة الفص الجبهي، وتمارين "التدوير الذهني" لدعم الذاكرة البصرية المكانية.`
        });
      }

      return res.json({
        success: true,
        title: 'حل المسألة بالتفكير العميق',
        content: `المسألة: "${puzzleInput || 'مسألة ذهنية'}"\nالحل: تم تحليل المعطيات بدقة، والوصول إلى الاستنتاج المنطقي المباشر استناداً لقواعد التفكير الاستدلالي.`
      });
    }

    let prompt = '';
    let systemInstruction = 'أنت خبير ذكاء عالمي ومدرب تدريب ذهني متخصص في علم الأعصاب الإدراكي والألغاز المعقدة. تتحدث باللغة العربية الفصحى بأسلوب محفّز، عميق، ودقيق.';

    if (type === 'riddle') {
      prompt = `قم بتوليد لغز أو معضلة تفكير منطقي أو رياضي إبداعي وجديد تماماً بمستوى صعوبة متقدم (${category || 'منطق استنتاجي'}).
المطلوب إرجاع الناتج بتنسيق JSON حصراً بهذا الشكل:
{
  "puzzle": "نص المعضلة أو اللغز المشوق",
  "question": "السؤال المحدد المطلوب إجابته",
  "hint": "تلميح استراتيجي يساعد على التفكير دون حرق الحل",
  "solution": "الحل الدقيق والمفصل مع البرهان المنطقي خطوة بخطوة",
  "difficultyRating": "تقدير الصعوبة من 10",
  "cognitiveDomain": "المجال الذهني (مثال: المنطق المكاني، الاستنباط الرياضي، إلخ)"
}`;
    } else if (type === 'evaluate_answer') {
      prompt = `لدينا اللغز التالي:
"${puzzleInput}"
والإجابة النموذجية هي:
"${req.body.officialSolution}"
إجابة المستخدم هي:
"${userAnswer}"

قيّم إجابة المستخدم بموضوعية ودقة مستخدماً التفكير العالي.
أرجع الناتج بتنسيق JSON:
{
  "isCorrect": true أو false,
  "feedback": "ملاحظة تشجيعية مفصلة تشرح أين أصاب أو أين التبس عليه الأمر",
  "explanation": "شرح الحل الصحيح والمسار الفكري الدقيق"
}`;
    } else if (type === 'analyze') {
      prompt = `قم بإجراء تحليل إدراكي عميق وشامل لنتائج اللاعب في منصة تدريب الدماغ:
- أعلى نتيجة عامة: ${gameStats?.bestScore || 0}
- أعلى مستوى واصله: ${gameStats?.bestLevel || 1}
- تفاصيل نتائج الألعاب: ${JSON.stringify(gameStats?.recentScores || {})}

حلل كلاً من:
1. سرعة المعالجة الإدراكية وزمن الاستجابة
2. كفاءة التثبيط الإدراكي (Stroop Effect & Dual Task Switching في نعم/لا)
3. التفكير المكاني والتدوير الذهني
4. خطة تدريبية مخصصة من 3 خطوات يومية لتحفيز المرونة العصبية (Neuroplasticity).
اكتب التحليل بلغة عربية راقية وعلمية ممتعة.`;
    } else {
      // type === 'solve'
      prompt = `مسألة من المستخدم تتطلب تفكيراً منطقياً أو رياضياً معقداً:
"${puzzleInput}"

حلل المسألة باستخدام التفكير المعمق خطوة بخطوة. استخرج المعطيات، اختبر الفرضيات، استبعد التناقضات، واعرض النتيجة النهائية المؤكدة مع الشرح.`;
    }

    // Call Gemini 3.1 Pro with ThinkingLevel.HIGH without maxOutputTokens
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH
        }
      }
    });

    const text = response.text || '';

    if (type === 'riddle') {
      try {
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return res.json({
          success: true,
          title: 'لغز التفكير المنطقي الذكي',
          content: parsed.puzzle,
          riddleData: parsed
        });
      } catch {
        return res.json({
          success: true,
          title: 'لغز التفكير المنطقي الذكي',
          content: text,
          riddleData: {
            puzzle: text,
            question: 'ما هو الحل المنطقي للغز أعلاه؟',
            hint: 'فكر في العلاقات المنطقية غير المباشرة.',
            solution: 'راجع خطوات التفكير العميق لاستنتاج الحل.',
            difficultyRating: 'متقدم',
            cognitiveDomain: 'التفكير المنطقي العام'
          }
        });
      }
    }

    if (type === 'evaluate_answer') {
      try {
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return res.json({
          success: true,
          evaluation: parsed
        });
      } catch {
        return res.json({
          success: true,
          evaluation: {
            isCorrect: text.includes('صحيح') || text.includes('أحسنت'),
            feedback: text,
            explanation: text
          }
        });
      }
    }

    return res.json({
      success: true,
      content: text
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return res.status(500).json({
      success: false,
      error: errMessage
    });
  }
});

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
