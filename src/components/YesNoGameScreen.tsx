import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Pause, 
  Star, 
  Clock, 
  Play, 
  RotateCw, 
  Home, 
  Trophy, 
  Crown,
  HelpCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface YesNoGameScreenProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBackHome: () => void;
  onUpdateBestScore: (score: number) => void;
  bestScore: number;
}

const SMILING = ['😀', '😃', '😄', '😁', '🙂', '😊', '😎', '😉'];
const NOT_SMILING = ['😠', '😡', '😢', '😔', '😐', '😦'];

export const YesNoGameScreen: React.FC<YesNoGameScreenProps> = ({
  soundEnabled,
  onToggleSound,
  onBackHome,
  onUpdateBestScore,
  bestScore
}) => {
  type GameState = 'tutorial' | 'countdown' | 'playing' | 'paused' | 'gameover';

  const [gameState, setGameState] = useState<GameState>('tutorial');
  const [tutSlide, setTutSlide] = useState(0);
  const [countdownNum, setCountdownNum] = useState(3);
  
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  // Round data
  const [isTopFull, setIsTopFull] = useState(true);
  const [cardNumber, setCardNumber] = useState(8);
  const [cardEmoji, setCardEmoji] = useState('😃');
  const [currentAnswer, setCurrentAnswer] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const questionStartTimeRef = useRef(Date.now());

  // Visual effects
  const [feedback, setFeedback] = useState<'ok' | 'no' | null>(null);
  const [floatingScore, setFloatingScore] = useState<{ text: string; positive: boolean } | null>(null);
  const [splatMultiplier, setSplatMultiplier] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextRound = useCallback(() => {
    setIsLocked(false);
    const top = Math.random() < 0.5;
    const num = Math.floor(Math.random() * 9) + 1; // 1 to 9
    const allEmojis = [...SMILING, ...NOT_SMILING];
    const emo = allEmojis[Math.floor(Math.random() * allEmojis.length)];
    const isSmiling = SMILING.includes(emo);

    setIsTopFull(top);
    setCardNumber(num);
    setCardEmoji(emo);

    if (top) {
      // Top card asks: Is number even?
      setCurrentAnswer(num % 2 === 0);
    } else {
      // Bottom card asks: Is face smiling?
      setCurrentAnswer(isSmiling);
    }

    questionStartTimeRef.current = Date.now();
  }, []);

  const startGameTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setGameState('gameover');
          soundEffects.gameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startCountdown = useCallback(() => {
    setGameState('countdown');
    setCountdownNum(3);

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        setGameState('playing');
        setScore(0);
        setStreak(0);
        setMultiplier(1);
        setCorrectCount(0);
        setWrongCount(0);
        setTimeLeft(60);
        nextRound();
        startGameTimer();
      } else {
        setCountdownNum(count);
      }
    }, 800);
  }, [nextRound, startGameTimer]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Update best score when game over
  useEffect(() => {
    if (gameState === 'gameover') {
      onUpdateBestScore(score);
    }
  }, [gameState, score, onUpdateBestScore]);

  // Answer handler
  const handleAnswer = (userChoice: boolean) => {
    if (isLocked || gameState !== 'playing') return;
    setIsLocked(true);

    const elapsed = (Date.now() - questionStartTimeRef.current) / 1000;
    const isCorrect = userChoice === currentAnswer;

    if (isCorrect) {
      soundEffects.correct();
      const speedBonus = Math.round(180 * Math.max(0, 1 - elapsed / 3));
      const points = (100 + speedBonus) * multiplier;
      const nextScore = score + points;
      const nextStreak = streak + 1;

      setScore(nextScore);
      setStreak(nextStreak);
      setCorrectCount(c => c + 1);

      setFeedback('ok');
      setFloatingScore({ text: `+${points}`, positive: true });

      if (nextStreak > 0 && nextStreak % 3 === 0) {
        const nextMultiplier = multiplier + 1;
        setMultiplier(nextMultiplier);
        setSplatMultiplier(`×${nextMultiplier}`);
        soundEffects.splat();
        setTimeout(() => setSplatMultiplier(null), 900);
      }

      setTimeout(() => {
        setFeedback(null);
        setFloatingScore(null);
        nextRound();
      }, 350);
    } else {
      soundEffects.wrong();
      const penalty = 50;
      setScore(prev => Math.max(0, prev - penalty));
      setStreak(0);
      setMultiplier(1);
      setWrongCount(w => w + 1);

      setFeedback('no');
      setFloatingScore({ text: `-${penalty}`, positive: false });

      setTimeout(() => {
        setFeedback(null);
        setFloatingScore(null);
        nextRound();
      }, 450);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || isLocked) return;
      if (e.key === 'ArrowRight' || e.key === 'y' || e.key === 'Y') {
        handleAnswer(true);
      } else if (e.key === 'ArrowLeft' || e.key === 'n' || e.key === 'N') {
        handleAnswer(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, isLocked, handleAnswer]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const isNewRecord = score > bestScore && score > 0;

  return (
    <div className="fixed inset-0 z-30 bg-gradient-to-b from-[#2F8BF6] to-[#7A2BE0] text-white flex flex-col font-cairo select-none">
      <div className="max-w-md w-full mx-auto h-full flex flex-col p-4 relative justify-between">
        {/* Top HUD */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setGameState('paused')}
            className="w-10 h-10 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center text-white active:scale-95"
            aria-label="إيقاف مؤقت"
          >
            <Pause className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md font-extrabold text-sm shadow-sm">
            <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>{score}</span>
          </div>

          <div className="flex-1" />

          <button
            onClick={onToggleSound}
            className="w-10 h-10 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center text-white active:scale-95"
            aria-label="تبديل الصوت"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-rose-300" />}
          </button>

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md font-extrabold text-sm shadow-sm">
            <Clock className="w-4 h-4 text-white/80" />
            <span>{timeFormatted}</span>
          </div>
        </div>

        {/* Central Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative py-6">
          {/* Feedback popup circle */}
          {feedback && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl text-white shadow-2xl animate-pop-in ${
                  feedback === 'ok' ? 'bg-[#7ED321]' : 'bg-[#D94A3D]'
                }`}
              >
                {feedback === 'ok' ? '✔' : '✖'}
              </div>
            </div>
          )}

          {/* Floating point banner */}
          {floatingScore && (
            <div
              className={`absolute top-1/3 left-1/2 -translate-x-1/2 font-black text-2xl animate-float-up pointer-events-none z-20 ${
                floatingScore.positive ? 'text-[#7ED321]' : 'text-[#ff5c6c]'
              }`}
            >
              {floatingScore.text}
            </div>
          )}

          {/* Multiplier Splat */}
          {splatMultiplier && (
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-20 px-6 py-2.5 rounded-full bg-[#7ED321] text-white font-black text-2xl shadow-xl shadow-green-500/50 animate-pop-in">
              {splatMultiplier}
            </div>
          )}

          {/* Top Card */}
          <div className="w-[82%] max-w-[270px] aspect-[1.45] rounded-2xl bg-[#F5F5F7] text-slate-800 flex items-center justify-center gap-4 shadow-xl relative transition-all duration-200">
            {isTopFull ? (
              <>
                <span className="text-6xl font-black text-[#F0821E] leading-none">
                  {cardNumber}
                </span>
                <span className="text-5xl leading-none">{cardEmoji}</span>
              </>
            ) : (
              <div className="w-full h-full border-2 border-dashed border-slate-300 rounded-2xl bg-white/40" />
            )}
          </div>

          {/* Prompt Bubble */}
          <div
            className={`my-3 px-5 py-2.5 rounded-2xl bg-[#0A1233] text-white font-extrabold text-sm sm:text-base shadow-lg transition-all relative ${
              isTopFull
                ? 'after:content-[""] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-[#0A1233]'
                : 'after:content-[""] after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-b-[#0A1233]'
            }`}
          >
            {isTopFull ? 'هل الرقم زوجي؟' : 'هل الوجه مبتسم؟'}
          </div>

          {/* Bottom Card */}
          <div className="w-[82%] max-w-[270px] aspect-[1.45] rounded-2xl bg-[#F5F5F7] text-slate-800 flex items-center justify-center gap-4 shadow-xl relative transition-all duration-200">
            {!isTopFull ? (
              <>
                <span className="text-6xl font-black text-[#F0821E] leading-none">
                  {cardNumber}
                </span>
                <span className="text-5xl leading-none">{cardEmoji}</span>
              </>
            ) : (
              <div className="w-full h-full border-2 border-dashed border-slate-300 rounded-2xl bg-white/40" />
            )}
          </div>
        </div>

        {/* Buttons (Yes & No) */}
        <div className="flex gap-4 pb-4">
          <button
            id="btn-yn-no"
            onClick={() => handleAnswer(false)}
            disabled={isLocked || gameState !== 'playing'}
            className="flex-1 py-4 px-6 rounded-2xl font-black text-2xl text-white bg-[#E57E22] hover:bg-[#d67219] active:scale-95 shadow-lg shadow-orange-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            لا
          </button>
          <button
            id="btn-yn-yes"
            onClick={() => handleAnswer(true)}
            disabled={isLocked || gameState !== 'playing'}
            className="flex-1 py-4 px-6 rounded-2xl font-black text-2xl text-white bg-[#E57E22] hover:bg-[#d67219] active:scale-95 shadow-lg shadow-orange-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            نعم
          </button>
        </div>
      </div>

      {/* Tutorial Overlay */}
      {gameState === 'tutorial' && (
        <div className="fixed inset-0 z-40 bg-gradient-to-b from-[#2F8BF6] to-[#7A2BE0] flex flex-col justify-between p-6">
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            {tutSlide === 0 && (
              <div className="space-y-6 animate-pop-in">
                <p className="text-xl font-extrabold leading-relaxed">
                  1. سيظهر رقم ووجه أمامك داخل إحدى البطاقتين
                </p>
                <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md flex flex-col items-center gap-3">
                  <div className="w-44 h-20 rounded-xl bg-[#F5F5F7] text-slate-800 flex items-center justify-center gap-3 shadow-md">
                    <span className="text-4xl font-black text-[#F0821E]">8</span>
                    <span className="text-3xl">😃</span>
                  </div>
                  <div className="w-44 h-14 border-2 border-dashed border-white/30 rounded-xl bg-white/5" />
                </div>
              </div>
            )}

            {tutSlide === 1 && (
              <div className="space-y-6 animate-pop-in">
                <p className="text-xl font-extrabold leading-relaxed">
                  2. إذا ظهر المحتوى في البطاقة <span className="text-amber-300">العليا</span>:<br />
                  حدد هل الرقم <span className="underline decoration-amber-300">زوجي</span>؟
                </p>
                <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md flex flex-col items-center gap-3">
                  <div className="px-4 py-1.5 rounded-lg bg-[#0A1233] text-white font-bold text-sm">
                    هل الرقم زوجي؟
                  </div>
                  <div className="w-44 h-20 rounded-xl bg-[#F5F5F7] text-slate-800 flex items-center justify-center gap-3 shadow-md">
                    <span className="text-4xl font-black text-[#F0821E]">8</span>
                    <span className="text-3xl">😊</span>
                  </div>
                  <div className="w-44 h-14 border-2 border-dashed border-white/30 rounded-xl bg-white/5" />
                </div>
              </div>
            )}

            {tutSlide === 2 && (
              <div className="space-y-6 animate-pop-in">
                <p className="text-xl font-extrabold leading-relaxed">
                  3. إذا ظهر المحتوى في البطاقة <span className="text-amber-300">السفلى</span>:<br />
                  حدد هل الوجه <span className="underline decoration-amber-300">مبتسم</span>؟
                </p>
                <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md flex flex-col items-center gap-3">
                  <div className="w-44 h-14 border-2 border-dashed border-white/30 rounded-xl bg-white/5" />
                  <div className="w-44 h-20 rounded-xl bg-[#F5F5F7] text-slate-800 flex items-center justify-center gap-3 shadow-md">
                    <span className="text-4xl font-black text-[#F0821E]">8</span>
                    <span className="text-3xl">😃</span>
                  </div>
                  <div className="px-4 py-1.5 rounded-lg bg-[#0A1233] text-white font-bold text-sm">
                    هل الوجه مبتسم؟
                  </div>
                </div>
              </div>
            )}

            {tutSlide === 3 && (
              <div className="space-y-6 animate-pop-in">
                <p className="text-xl font-extrabold leading-relaxed">
                  4. اضغط <span className="text-amber-300">"نعم"</span> أو <span className="text-amber-300">"لا"</span> بأقصى سرعة لجمع النقاط والمضاعفات!
                </p>
                <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md flex flex-col items-center gap-4">
                  <span className="text-4xl">👆</span>
                  <div className="flex gap-3">
                    <button className="py-2.5 px-6 rounded-xl bg-[#E57E22] font-black text-lg text-white shadow-md pointer-events-none">
                      نعم
                    </button>
                    <button className="py-2.5 px-6 rounded-xl bg-[#E57E22] font-black text-lg text-white shadow-md pointer-events-none">
                      لا
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="max-w-sm w-full mx-auto">
            {/* Dots */}
            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2, 3].map(idx => (
                <div
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === tutSlide ? 'bg-white scale-125' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                if (tutSlide < 3) {
                  setTutSlide(s => s + 1);
                } else {
                  startCountdown();
                }
              }}
              className="w-full py-4 rounded-2xl font-black text-lg text-white bg-[#2FB9DE] hover:bg-[#28a8ca] shadow-xl shadow-cyan-600/30 transition-all active:scale-98"
            >
              {tutSlide < 3 ? 'التالي' : 'ابدأ اللعب الآن'}
            </button>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {gameState === 'countdown' && (
        <div className="fixed inset-0 z-40 bg-gradient-to-b from-[#2F8BF6] to-[#7A2BE0] flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border-4 border-dashed border-white/40 flex items-center justify-center animate-spin">
            <span className="text-6xl font-black text-white not-italic inline-block [animation:spin_1s_linear_infinite_reverse]">
              {countdownNum}
            </span>
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 z-50 bg-[#0A1233]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white text-slate-900 p-6 text-center shadow-2xl">
            <h3 className="text-xl font-black mb-4 flex items-center justify-center gap-2 text-indigo-700">
              <Pause className="w-6 h-6" /> إيقاف مؤقت
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setGameState('playing');
                  startGameTimer();
                }}
                className="w-full py-3.5 px-4 rounded-xl font-black text-base bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 hover:opacity-95"
              >
                <Play className="w-5 h-5" /> استئناف اللعب
              </button>
              <button
                onClick={startCountdown}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-base bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-200"
              >
                <RotateCw className="w-5 h-5" /> إعادة البدء
              </button>
              <button
                onClick={onBackHome}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-base bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center gap-2 hover:bg-rose-100"
              >
                <Home className="w-5 h-5" /> الخروج للرئيسية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <div className="fixed inset-0 z-50 bg-[#0A1233]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white text-slate-900 p-6 text-center shadow-2xl animate-pop-in">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30">
              <Trophy className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-2">انتهت اللعبة!</h2>

            {isNewRecord && (
              <div className="mb-4 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black text-sm flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20">
                <Crown className="w-4 h-4" /> رقم قياسي شخصي جديد!
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="p-3 rounded-xl bg-slate-100 text-center">
                <span className="text-2xl font-black text-slate-900 block leading-tight">
                  {score}
                </span>
                <span className="text-xs font-bold text-slate-500">النتيجة</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 text-center">
                <span className="text-2xl font-black text-slate-900 block leading-tight">
                  {Math.max(bestScore, score)}
                </span>
                <span className="text-xs font-bold text-slate-500">الأفضل</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 text-center">
                <span className="text-2xl font-black text-emerald-600 block leading-tight">
                  {correctCount}
                </span>
                <span className="text-xs font-bold text-slate-500">صحيحة</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 text-center">
                <span className="text-2xl font-black text-rose-500 block leading-tight">
                  {wrongCount}
                </span>
                <span className="text-xs font-bold text-slate-500">خاطئة</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={startCountdown}
                className="w-full py-3.5 px-4 rounded-xl font-extrabold text-base bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 hover:opacity-95 active:scale-95"
              >
                <RotateCw className="w-5 h-5" /> العب من جديد
              </button>
              <button
                onClick={() => {
                  setGameState('tutorial');
                  setTutSlide(0);
                }}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-base bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-200"
              >
                <HelpCircle className="w-5 h-5" /> كيفية اللعب
              </button>
              <button
                onClick={onBackHome}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-base bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-200"
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
