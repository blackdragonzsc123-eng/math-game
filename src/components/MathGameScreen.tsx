import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Pause, 
  Heart, 
  HeartCrack, 
  Flame, 
  Volume2, 
  VolumeX, 
  Home, 
  Star, 
  Zap, 
  RotateCw, 
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Play,
  RotateCcw,
  Trophy,
  Check,
  X
} from 'lucide-react';
import { GameMode, Difficulty, QuestionData } from '../types';
import { generateQuestion, getDifficultyParams } from '../utils/mathQuestions';
import { soundEffects } from '../utils/audio';

interface MathGameScreenProps {
  mode: 'op' | 'result' | 'stroop' | 'rotation' | 'mix';
  diff: Difficulty;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBackHome: () => void;
  onUpdateBestScore: (mode: GameMode, score: number, level: number) => void;
}

export const MathGameScreen: React.FC<MathGameScreenProps> = ({
  mode,
  diff,
  soundEnabled,
  onToggleSound,
  onBackHome,
  onUpdateBestScore
}) => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [hearts, setHearts] = useState(3);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [correctInLevel, setCorrectInLevel] = useState(0);
  
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Timer state
  const [timeMax, setTimeMax] = useState(10);
  const [timeLeft, setTimeLeft] = useState(10);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const modeArabicTitles: Record<string, string> = {
    op: 'العامل المفقود',
    result: 'الناتج المفقود',
    stroop: 'خداع الألوان',
    rotation: 'التدوير الذهني',
    mix: 'مزيج الألعاب المعرفية'
  };

  const diffArabicTitles: Record<Difficulty, string> = {
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
    grad: 'متدرج'
  };

  // Load next question
  const loadNextQuestion = useCallback((targetLevel = level) => {
    setIsLocked(false);
    setSelectedOption(null);
    const q = generateQuestion(mode, diff, targetLevel);
    setCurrentQuestion(q);

    const p = getDifficultyParams(diff, targetLevel);
    setTimeMax(p.time);
    setTimeLeft(p.time);
  }, [mode, diff, level]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    if (isLocked || isGameOver || isPaused) return;
    setIsLocked(true);
    soundEffects.wrong();

    setScore(prev => Math.max(0, prev - 1));
    setStreak(0);
    setWrongCount(w => w + 1);
    
    setHearts(prevH => {
      const nextH = prevH - 1;
      if (nextH <= 0) {
        soundEffects.gameOver();
        setTimeout(() => {
          setIsGameOver(true);
        }, 500);
      } else {
        setTimeout(() => {
          loadNextQuestion();
        }, 600);
      }
      return nextH;
    });

    setToastMessage('انتهى الوقت!');
    setTimeout(() => setToastMessage(null), 1200);
  }, [isLocked, isGameOver, isPaused, loadNextQuestion]);

  // Run timer interval
  useEffect(() => {
    if (isPaused || isGameOver || isLocked) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.05) {
          clearInterval(timerIntervalRef.current!);
          handleTimeout();
          return 0;
        }
        return prev - 0.05;
      });
    }, 50);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPaused, isGameOver, isLocked, handleTimeout]);

  // Initial question load
  useEffect(() => {
    loadNextQuestion(1);
  }, [loadNextQuestion]);

  // End of game callback
  useEffect(() => {
    if (isGameOver) {
      onUpdateBestScore(mode, score, level);
    }
  }, [isGameOver, mode, score, level, onUpdateBestScore]);

  // Handle Option Click
  const handleSelectOption = (index: number) => {
    if (isLocked || isPaused || isGameOver || !currentQuestion) return;
    setIsLocked(true);
    setSelectedOption(index);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const isCorrect = index === currentQuestion.correctIndex;

    if (isCorrect) {
      soundEffects.correct();
      const nextScore = score + 1;
      const nextStreak = streak + 1;
      const nextCorrect = correctCount + 1;
      const nextInLevel = correctInLevel + 1;

      setScore(nextScore);
      setStreak(nextStreak);
      setCorrectCount(nextCorrect);

      if (nextInLevel >= 4) {
        // Level up!
        soundEffects.levelUp();
        const nextLevel = level + 1;
        setLevel(nextLevel);
        setCorrectInLevel(0);
        setToastMessage(`أحسنت! تقدمت إلى المستوى ${nextLevel}`);
        setTimeout(() => setToastMessage(null), 1400);
        setTimeout(() => {
          loadNextQuestion(nextLevel);
        }, 400);
      } else {
        setCorrectInLevel(nextInLevel);
        setTimeout(() => {
          loadNextQuestion(level);
        }, 250);
      }
    } else {
      soundEffects.wrong();
      setScore(prev => Math.max(0, prev - 1));
      setStreak(0);
      setWrongCount(w => w + 1);

      setHearts(prevH => {
        const nextH = prevH - 1;
        if (nextH <= 0) {
          soundEffects.gameOver();
          setTimeout(() => {
            setIsGameOver(true);
          }, 500);
        } else {
          setTimeout(() => {
            loadNextQuestion(level);
          }, 550);
        }
        return nextH;
      });
    }
  };

  const restartGame = () => {
    setScore(0);
    setLevel(1);
    setHearts(3);
    setStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setCorrectInLevel(0);
    setIsPaused(false);
    setIsGameOver(false);
    loadNextQuestion(1);
  };

  const timerPct = Math.max(0, Math.min(100, (timeLeft / timeMax) * 100));
  const timerBarColor =
    timerPct > 50
      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
      : timerPct > 25
      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
      : 'bg-gradient-to-r from-rose-500 to-red-600';

  return (
    <div className="max-w-xl mx-auto px-4 py-4 min-h-screen flex flex-col justify-between relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full font-black text-sm text-white bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-xl shadow-indigo-500/30 animate-pop-in pointer-events-none">
          {toastMessage}
        </div>
      )}

      <div>
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(true)}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:scale-105 active:scale-95"
              aria-label="إيقاف مؤقت"
            >
              <Pause className="w-5 h-5" />
            </button>

            {/* Hearts indicator */}
            <div className="flex items-center gap-1.5 px-2">
              {[0, 1, 2].map(idx => (
                <span key={idx} className="transition-all">
                  {idx < hearts ? (
                    <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                  ) : (
                    <HeartCrack className="w-6 h-6 text-slate-400 dark:text-slate-600" />
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Streak chip */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-extrabold text-xs transition-all ${
                streak >= 2
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 animate-pulse-gentle'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-500" />
              <span>{streak}</span>
            </div>

            <button
              onClick={onToggleSound}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:scale-105 active:scale-95"
              aria-label="تبديل الصوت"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-rose-500" />}
            </button>

            <button
              onClick={onBackHome}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:scale-105 active:scale-95"
              aria-label="الرئيسية"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chips for Score & Level */}
        <div className="grid grid-cols-2 gap-3 my-3">
          <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            النقاط: <span className="font-black text-amber-500 text-base">{score}</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm">
            <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            المستوى: <span className="font-black text-cyan-500 text-base">{level}</span>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-75 ${timerBarColor}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>

        {/* Question Meta Title */}
        <p className="text-center text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">
          {currentQuestion?.title || 'أجب على السؤال'}
        </p>

        {/* Question Visual Card */}
        <div className="min-h-[190px] rounded-3xl bg-white/90 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center p-6 text-center">
          {currentQuestion?.type === 'op' && (
            <div className="text-3xl sm:text-4xl font-extrabold tracking-wide text-slate-900 dark:text-white" dir="ltr">
              <span>{currentQuestion.cardContent.equationA}</span>
              <span className="inline-flex items-center justify-center min-w-[1.6em] mx-2 px-2 py-0.5 rounded-xl border-2 border-dashed border-amber-500 bg-amber-500/10 text-amber-500">
                ?
              </span>
              <span>{currentQuestion.cardContent.equationB}</span>
              <span className="mx-2">=</span>
              <span>{currentQuestion.cardContent.equationRes}</span>
            </div>
          )}

          {currentQuestion?.type === 'result' && (
            <div className="text-3xl sm:text-4xl font-extrabold tracking-wide text-slate-900 dark:text-white" dir="ltr">
              <span>{currentQuestion.cardContent.equationA}</span>
              <span className="mx-2">{currentQuestion.cardContent.equationOp}</span>
              <span>{currentQuestion.cardContent.equationB}</span>
              <span className="mx-2">=</span>
              <span className="inline-flex items-center justify-center min-w-[1.6em] mx-2 px-2 py-0.5 rounded-xl border-2 border-dashed border-amber-500 bg-amber-500/10 text-amber-500">
                ?
              </span>
            </div>
          )}

          {currentQuestion?.type === 'stroop' && (
            <div>
              <span
                className="text-5xl sm:text-6xl font-black tracking-wider block"
                style={{ color: currentQuestion.cardContent.colorHex }}
              >
                {currentQuestion.cardContent.text}
              </span>
              <span className="text-xs font-bold text-slate-400 block mt-2">
                اختر لون الحبر الظاهر وليس الكلمة
              </span>
            </div>
          )}

          {currentQuestion?.type === 'rotation' && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-full border-4 border-indigo-500/40 bg-indigo-500/10 flex items-center justify-center relative">
                <div
                  className="transition-transform duration-500 ease-out"
                  style={{ transform: `rotate(${currentQuestion.cardContent.arrowAngle || 0}deg)` }}
                >
                  <ArrowUp className="w-14 h-14 text-cyan-400 stroke-[3]" />
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400">
                حدد اتجاه السهم النهائي بعد الدوران
              </span>
            </div>
          )}
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {currentQuestion?.options.map((opt, idx) => {
            const isChosen = selectedOption === idx;
            const isCorrectTarget = currentQuestion.correctIndex === idx;

            let buttonTheme =
              'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-indigo-500';

            if (isLocked) {
              if (isCorrectTarget) {
                buttonTheme = 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]';
              } else if (isChosen && !isCorrectTarget) {
                buttonTheme = 'bg-rose-500 border-rose-500 text-white animate-shake';
              }
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(idx)}
                disabled={isLocked}
                className={`py-4 px-3 rounded-2xl border-2 font-extrabold text-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${buttonTheme}`}
              >
                {currentQuestion.type === 'stroop' && opt.colorBg ? (
                  <span
                    className="w-8 h-8 rounded-full border-2 border-white/50 shadow-sm"
                    style={{ backgroundColor: opt.colorBg }}
                  />
                ) : null}

                {currentQuestion.type === 'rotation' ? (
                  <span className="flex items-center gap-2 text-base">
                    {opt.label === 'أعلى' && <ArrowUp className="w-5 h-5 text-cyan-400" />}
                    {opt.label === 'أسفل' && <ArrowDown className="w-5 h-5 text-cyan-400" />}
                    {opt.label === 'يمين' && <ArrowRight className="w-5 h-5 text-cyan-400" />}
                    {opt.label === 'يسار' && <ArrowLeft className="w-5 h-5 text-cyan-400" />}
                    {opt.label}
                  </span>
                ) : (
                  <span>{opt.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Game Mode Status Label */}
        <p className="text-center text-xs font-semibold text-slate-400 mt-4">
          {modeArabicTitles[mode]} • الصعوبة: {diffArabicTitles[diff]} • المستوى {level}
        </p>
      </div>

      {/* Pause Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 flex items-center justify-center gap-2">
              <Pause className="w-6 h-6 text-indigo-500" />
              إيقاف مؤقت
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-3.5 px-4 rounded-xl font-extrabold text-base bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 hover:opacity-95"
              >
                <Play className="w-5 h-5" /> استئناف اللعب
              </button>
              <button
                onClick={restartGame}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-base bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <RotateCcw className="w-5 h-5" /> إعادة البدء
              </button>
              <button
                onClick={onBackHome}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-base bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center justify-center gap-2 hover:bg-rose-500/20"
              >
                <Home className="w-5 h-5" /> العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-6 text-center shadow-2xl animate-pop-in">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30">
              <Trophy className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
              انتهت اللعبة!
            </h2>

            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-center">
                <span className="text-2xl font-black text-amber-500 block leading-tight">
                  {score}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400" /> نتيجتك
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-center">
                <span className="text-2xl font-black text-cyan-500 block leading-tight">
                  {level}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" /> المستوى
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-center">
                <span className="text-2xl font-black text-emerald-500 block leading-tight">
                  {correctCount}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> صحيحة
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-center">
                <span className="text-2xl font-black text-rose-500 block leading-tight">
                  {wrongCount}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                  <X className="w-3.5 h-3.5 text-rose-400" /> خاطئة
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={restartGame}
                className="w-full py-3.5 px-4 rounded-xl font-extrabold text-base bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 hover:opacity-95 active:scale-95"
              >
                <RotateCw className="w-5 h-5" /> العب مجدداً
              </button>
              <button
                onClick={onBackHome}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-base bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <Home className="w-5 h-5" /> العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
