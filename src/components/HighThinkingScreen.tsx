import React, { useState } from 'react';
import { 
  Sparkles, 
  Home, 
  Brain, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  Activity, 
  Loader2, 
  RotateCw, 
  HelpCircle, 
  Cpu, 
  Code, 
  ChevronDown, 
  ChevronUp, 
  WifiOff, 
  Key 
} from 'lucide-react';
import { StoredStats, HighThinkingResponse } from '../types';
import { soundEffects } from '../utils/audio';

interface HighThinkingScreenProps {
  stats: StoredStats;
  customApiKey: string;
  onBackHome: () => void;
  onOpenKeySettings?: () => void;
}

export const HighThinkingScreen: React.FC<HighThinkingScreenProps> = ({
  stats,
  customApiKey,
  onBackHome,
  onOpenKeySettings
}) => {
  const [activeTab, setActiveTab] = useState<'riddle' | 'analysis' | 'solver'>('riddle');
  
  // Riddle state
  const [isLoadingRiddle, setIsLoadingRiddle] = useState(false);
  const [currentRiddle, setCurrentRiddle] = useState<HighThinkingResponse['riddleData'] | null>({
    puzzle: 'ثلاثة علماء يتحدّثون: قال الأوّل: "نحن جميعاً كاذبون"، وقال الثاني: "واحد فقط منّا صادق"، وقال الثالث: "الثاني كاذب". إذا كان هناك صادق واحد فقط على الأقل، فمن الصادق ومن الكاذب؟',
    question: 'حدد بدقة مَن الصادق ومَن الكاذب مع بيان السبب المنطقي.',
    hint: 'فكّر في تصريح الأول: هل يمكن لشخص أن يقول "نحن جميعاً كاذبون" ويكون صادقاً؟ هذا تناقض مباشر (مفارقة إبيمينيدس).',
    solution: 'الثاني هو الصادق، والأول والثالث كاذبان! الأول كاذب حتماً لأن قوله متناقض ذاتياً. إذا كان الثاني صادقاً (واحد فقط صادق) فإن الثالث يكذب بقوله "الثاني كاذب"، وهو ما يتفق منطقياً دون أي تناقض.',
    difficultyRating: '8.5 / 10',
    cognitiveDomain: 'المنطق الاستنباطي وتحليل التناقضات'
  });
  const [riddleProvider, setRiddleProvider] = useState<'deepseek' | 'offline_bank'>('deepseek');
  const [riddleReasoning, setRiddleReasoning] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{ isCorrect: boolean; feedback: string; explanation: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // Analysis state
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisReasoning, setAnalysisReasoning] = useState<string | null>(null);

  // Solver state
  const [customProblem, setCustomProblem] = useState('');
  const [solverResult, setSolverResult] = useState<string | null>(null);
  const [solverReasoning, setSolverReasoning] = useState<string | null>(null);
  const [isLoadingSolver, setIsLoadingSolver] = useState(false);

  // Fetch new riddle from DeepSeek (or offline bank)
  const fetchNewRiddle = async (category = 'منطق استنتاجي ورياضي') => {
    setIsLoadingRiddle(true);
    setUserAnswer('');
    setEvaluationResult(null);
    setShowHint(false);
    setShowSolution(false);
    setRiddleReasoning(null);

    try {
      const res = await fetch('/api/deepseek/thinking', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-deepseek-key': customApiKey } : {})
        },
        body: JSON.stringify({
          type: 'riddle',
          category,
          customApiKey
        })
      });
      const data = await res.json();
      if (data.riddleData) {
        setCurrentRiddle(data.riddleData);
      }
      setRiddleProvider(data.provider || 'deepseek');
      if (data.reasoningContent) {
        setRiddleReasoning(data.reasoningContent);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingRiddle(false);
    }
  };

  // Evaluate user's answer
  const handleEvaluateAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || !currentRiddle || isEvaluating) return;

    setIsEvaluating(true);
    try {
      const res = await fetch('/api/deepseek/thinking', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-deepseek-key': customApiKey } : {})
        },
        body: JSON.stringify({
          type: 'evaluate_answer',
          puzzleInput: currentRiddle.puzzle,
          officialSolution: currentRiddle.solution,
          userAnswer: userAnswer.trim(),
          customApiKey
        })
      });
      const data = await res.json();
      if (data.evaluation) {
        setEvaluationResult(data.evaluation);
        if (data.evaluation.isCorrect) {
          soundEffects.correct();
        } else {
          soundEffects.wrong();
        }
      }
      if (data.reasoningContent) {
        setRiddleReasoning(data.reasoningContent);
      }
    } catch {
      setEvaluationResult({
        isCorrect: false,
        feedback: 'تم استلام إجابتك. يرجى مراجعة البرهان المنطقي أدناه للتحقق من سلامة الاستنتاج.',
        explanation: currentRiddle.solution
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Request deep performance analysis
  const handleRequestAnalysis = async () => {
    setIsLoadingAnalysis(true);
    setAnalysisReasoning(null);
    try {
      const res = await fetch('/api/deepseek/thinking', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-deepseek-key': customApiKey } : {})
        },
        body: JSON.stringify({
          type: 'analyze',
          customApiKey,
          gameStats: {
            bestScore: stats.bestScore,
            bestLevel: stats.bestLevel,
            recentScores: stats.bestScoresByMode
          }
        })
      });
      const data = await res.json();
      setAnalysisText(data.content || 'تم إتمام التحليل الإدراكي بنجاح.');
      if (data.reasoningContent) {
        setAnalysisReasoning(data.reasoningContent);
      }
    } catch {
      setAnalysisText('تعذر إتمام التحليل في الوقت الحالي، يرجى التحقق من المفتاح أو الاتصال.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Solve custom complex problem
  const handleSolveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customProblem.trim() || isLoadingSolver) return;

    setIsLoadingSolver(true);
    setSolverReasoning(null);
    try {
      const res = await fetch('/api/deepseek/thinking', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-deepseek-key': customApiKey } : {})
        },
        body: JSON.stringify({
          type: 'solve',
          puzzleInput: customProblem.trim(),
          customApiKey
        })
      });
      const data = await res.json();
      setSolverResult(data.content || 'تم حل المسألة بنجاح.');
      if (data.reasoningContent) {
        setSolverReasoning(data.reasoningContent);
      }
    } catch {
      setSolverResult('حدث خطأ أثناء معالجة المسألة عبر DeepSeek.');
    } finally {
      setIsLoadingSolver(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 min-h-screen flex flex-col justify-between pb-16">
      <div>
        {/* Header */}
        <header className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  التفكير العالي
                </h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> DeepSeek R1
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                نمط التفكير المعمق والاستدلال المنطقي المتسلسل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenKeySettings && (
              <button
                onClick={onOpenKeySettings}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-amber-500 flex items-center justify-center hover:scale-105 active:scale-95"
                title="إعدادات مفتاح DeepSeek"
                aria-label="إعدادات المفتاح"
              >
                <Key className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onBackHome}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:scale-105 active:scale-95"
              aria-label="الرئيسية"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl my-4 text-xs sm:text-sm font-extrabold">
          <button
            onClick={() => setActiveTab('riddle')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'riddle'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>ألغاز التفكير</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('analysis');
              if (!analysisText) handleRequestAnalysis();
            }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'analysis'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>تحليل الأداء</span>
          </button>

          <button
            onClick={() => setActiveTab('solver')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'solver'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>حل المسائل</span>
          </button>
        </div>

        {/* Tab 1: Deep Riddle Challenge */}
        {activeTab === 'riddle' && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {currentRiddle?.cognitiveDomain || 'منطق استنتاجي'}
                  </span>
                  {riddleProvider === 'offline_bank' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                      <WifiOff className="w-3 h-3" /> أوفلاين
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-amber-500">
                  مستوى الصعوبة: {currentRiddle?.difficultyRating || '8/10'}
                </span>
              </div>

              {isLoadingRiddle ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                  <p className="text-sm font-bold animate-pulse">
                    DeepSeek R1 يصيغ لغز تفكير عالي استنتاجي...
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed mb-3">
                    {currentRiddle?.puzzle}
                  </p>

                  <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mb-4">
                    ❓ {currentRiddle?.question}
                  </p>

                  {/* DeepSeek Chain of Thought Collapsible */}
                  {riddleReasoning && (
                    <div className="mb-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 p-3 text-xs">
                      <button
                        onClick={() => setShowReasoning(!showReasoning)}
                        className="w-full flex items-center justify-between text-cyan-400 font-bold"
                      >
                        <span className="flex items-center gap-1.5">
                          <Code className="w-4 h-4" />
                          مسار تفكير DeepSeek Reasoner (Chain-of-Thought)
                        </span>
                        {showReasoning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {showReasoning && (
                        <div className="mt-2 text-slate-300 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line p-2 bg-black/40 rounded-xl">
                          {riddleReasoning}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hints and Solution Toggles */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="text-xs font-bold py-1.5 px-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/20"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      {showHint ? 'إخفاء التلميح' : 'تلميح استراتيجي'}
                    </button>

                    <button
                      onClick={() => setShowSolution(!showSolution)}
                      className="text-xs font-bold py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-200"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                      {showSolution ? 'إخفاء الحل' : 'كشف الحل والبرهان'}
                    </button>
                  </div>

                  {showHint && currentRiddle?.hint && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-200 mb-4 animate-pop-in">
                      💡 <strong>تلميح:</strong> {currentRiddle.hint}
                    </div>
                  )}

                  {showSolution && currentRiddle?.solution && (
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs sm:text-sm font-medium text-indigo-900 dark:text-indigo-200 mb-4 animate-pop-in">
                      🔍 <strong>البرهان المنطقي للتفكير العالي:</strong>
                      <p className="mt-1 leading-relaxed">{currentRiddle.solution}</p>
                    </div>
                  )}

                  {/* User Answer Form */}
                  <form onSubmit={handleEvaluateAnswer} className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={e => setUserAnswer(e.target.value)}
                        placeholder="اكتب إجابتك أو فرضيتك المنطقية هنا..."
                        className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isEvaluating || !userAnswer.trim()}
                        className="flex-1 py-3 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
                      >
                        {isEvaluating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            جاري التقييم بـ DeepSeek...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            تحقق من صحة الحل
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => fetchNewRiddle()}
                        className="py-3 px-4 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-200"
                        title="لغز جديد"
                      >
                        <RotateCw className="w-4 h-4" />
                        لغز جديد
                      </button>
                    </div>
                  </form>

                  {/* Evaluation Result */}
                  {evaluationResult && (
                    <div
                      className={`p-4 rounded-2xl border mt-4 animate-pop-in ${
                        evaluationResult.isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-black text-sm mb-1">
                        {evaluationResult.isCorrect ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            إجابة دقيقة وصحيحة!
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-rose-500" />
                            تحتاج لمزيد من الدقة المنطقية
                          </>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                        {evaluationResult.feedback}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Cognitive Analysis */}
        {activeTab === 'analysis' && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  تحليل الكفاءة الإدراكية والمرونة العصبية
                </h3>
                <button
                  onClick={handleRequestAnalysis}
                  disabled={isLoadingAnalysis}
                  className="text-xs font-bold py-1 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 hover:bg-indigo-100"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  تحديث التحليل
                </button>
              </div>

              {isLoadingAnalysis ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                  <p className="text-sm font-bold">
                    DeepSeek يحلل مؤشرات الاستجابة الإدراكية والمرونة العصبية...
                  </p>
                </div>
              ) : (
                <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed space-y-3 whitespace-pre-line font-medium">
                  {analysisText}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Problem Solver */}
        {activeTab === 'solver' && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-500" />
                مختبر حل المعضلات والمسائل بـ DeepSeek R1
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                اكتب أي مسألة رياضية أو لغز استنتاجي معقد، وسيقوم نموذج التفكير العميق بتحليلها خطوة بخطوة.
              </p>

              <form onSubmit={handleSolveProblem} className="space-y-3">
                <textarea
                  rows={3}
                  value={customProblem}
                  onChange={e => setCustomProblem(e.target.value)}
                  placeholder="مثال: خمسة منازل متجاورة بألوان مختلفة ويسكنها أشخاص بجنسيات مختلفة..."
                  className="w-full p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-indigo-500 resize-none"
                />

                <button
                  type="submit"
                  disabled={isLoadingSolver || !customProblem.trim()}
                  className="w-full py-3 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
                >
                  {isLoadingSolver ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      DeepSeek R1 يفكر في المعطيات الرياضية...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      حل المسألة بنموذج التفكير العالي
                    </>
                  )}
                </button>
              </form>

              {solverResult && (
                <div className="mt-5 p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pop-in">
                  <h4 className="text-xs font-black text-cyan-500 mb-2">
                    النتيجة والمسار التحليلي:
                  </h4>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                    {solverResult}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-6 text-center text-xs font-bold text-slate-400">
        مدعوم بنموذج الاستدلال العالي DeepSeek R1 & Offline Deductive Bank
      </footer>
    </div>
  );
};
