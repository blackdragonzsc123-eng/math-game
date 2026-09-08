import React from 'react';
import { 
  Brain, 
  Trophy, 
  Zap, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Sparkles, 
  ChevronLeft,
  Flame,
  Shuffle,
  Calculator,
  Equal,
  Palette,
  RotateCw
} from 'lucide-react';
import { GameMode, GameMetadata, StoredStats } from '../types';

interface HomeScreenProps {
  stats: StoredStats;
  darkMode: boolean;
  soundEnabled: boolean;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onOpenInstructions: () => void;
  onSelectGame: (mode: GameMode) => void;
}

const GAMES: GameMetadata[] = [
  {
    id: 'yesno',
    name: 'نعم أو لا',
    desc: 'اختبار التبديل المعرفي السريع: رقم زوجي أم وجه مبتسم؟',
    iconName: 'HelpCircle',
    gradient: 'from-blue-500 to-purple-600',
    badge: 'الأكثر تحدياً'
  },
  {
    id: 'high_thinking',
    name: 'نمط التفكير العالي (AI)',
    desc: 'ألغاز استنتاجية عميقة وتحليل إدراكي مع Gemini 3.1 Pro',
    iconName: 'Sparkles',
    gradient: 'from-amber-500 to-indigo-600',
    badge: 'High Thinking'
  },
  {
    id: 'op',
    name: 'العامل المفقود',
    desc: 'أوجد رمز العملية الحسابية الصحيح (+, −, ×, ÷)',
    iconName: 'Calculator',
    gradient: 'from-emerald-500 to-cyan-500'
  },
  {
    id: 'result',
    name: 'الناتج المفقود',
    desc: 'احسب ناتج المعادلة الحسابية في أسرع وقت',
    iconName: 'Equal',
    gradient: 'from-indigo-500 to-sky-500'
  },
  {
    id: 'stroop',
    name: 'خداع الألوان (Stroop)',
    desc: 'ركز على لون الخط وتجاهل المعنى النصي للكلمة!',
    iconName: 'Palette',
    gradient: 'from-rose-500 to-amber-400'
  },
  {
    id: 'rotation',
    name: 'التدوير الذهني',
    desc: 'تتبع حركة السهم في الفضاء ثلاثي/ثنائي الأبعاد',
    iconName: 'RotateCw',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'mix',
    name: 'مزيج الألعاب المعرفية',
    desc: 'تحدٍ عشوائي يجمع كافة العمليات الحسابية والذهنية',
    iconName: 'Shuffle',
    gradient: 'from-amber-500 to-orange-500'
  }
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  stats,
  darkMode,
  soundEnabled,
  onToggleTheme,
  onToggleSound,
  onOpenInstructions,
  onSelectGame
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'HelpCircle':
        return <HelpCircle className="w-6 h-6 text-white" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-white" />;
      case 'Calculator':
        return <Calculator className="w-6 h-6 text-white" />;
      case 'Equal':
        return <Equal className="w-6 h-6 text-white" />;
      case 'Palette':
        return <Palette className="w-6 h-6 text-white" />;
      case 'RotateCw':
        return <RotateCw className="w-6 h-6 text-white" />;
      case 'Shuffle':
        return <Shuffle className="w-6 h-6 text-white" />;
      default:
        return <Brain className="w-6 h-6 text-white" />;
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 min-h-screen flex flex-col justify-between">
      <div>
        {/* Top bar */}
        <header className="flex items-center justify-between pb-4 border-b border-white/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                تدريب الدماغ
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                منصة الألعاب الذهنية والذكاء المعرفي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-sound-toggle"
              onClick={onToggleSound}
              className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              aria-label="تبديل الصوت"
              title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-rose-500" />}
            </button>

            <button
              id="btn-theme-toggle"
              onClick={onToggleTheme}
              className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              aria-label="تبديل المظهر"
              title={darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>

            <button
              id="btn-help-modal"
              onClick={onOpenInstructions}
              className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              aria-label="تعليمات اللعب"
              title="تعليمات اللعب"
            >
              <HelpCircle className="w-5 h-5 text-cyan-500" />
            </button>
          </div>
        </header>

        {/* Global Statistics */}
        <section className="grid grid-cols-2 gap-3 my-5">
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 text-white shadow-md shadow-orange-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block leading-tight">
                {stats.bestScore}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                أفضل نتيجة عامة
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 text-white shadow-md shadow-cyan-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block leading-tight">
                {stats.bestLevel}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                أعلى مستوى بلغته
              </span>
            </div>
          </div>
        </section>

        {/* Game List */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Flame className="w-5 h-5 text-indigo-500" />
              اختر التحدي الذهني
            </h2>
            <span className="text-xs font-bold text-slate-400">
              {GAMES.length} تحديات متوفرة
            </span>
          </div>

          <div className="space-y-3">
            {GAMES.map((game) => {
              const bestScore = stats.bestScoresByMode[game.id] || 0;
              const isAiMode = game.id === 'high_thinking';

              return (
                <button
                  key={game.id}
                  id={`btn-game-${game.id}`}
                  onClick={() => onSelectGame(game.id)}
                  className={`w-full text-right p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-3.5 group relative overflow-hidden ${
                    isAiMode 
                      ? 'bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border-amber-400/50 dark:border-amber-400/30 hover:border-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-indigo-500/60 dark:hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.gradient} flex items-center justify-center flex-shrink-0 shadow-md shadow-black/10 group-hover:scale-105 transition-transform`}>
                    {getIcon(game.iconName)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-slate-900 dark:text-white">
                        {game.name}
                      </span>
                      {game.badge && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isAiMode 
                            ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-sm'
                            : 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300'
                        }`}>
                          {game.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {game.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {bestScore > 0 && (
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        {bestScore}
                      </span>
                    )}
                    <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="mt-8 pt-4 border-t border-slate-200/50 dark:border-slate-800 text-center text-xs font-medium text-slate-400">
        تطبيق تدريب الدماغ باللغة العربية • دعم التفكير المنطقي والمرونة العصبية
      </footer>
    </div>
  );
};
