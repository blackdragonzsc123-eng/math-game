import React from 'react';
import { Sliders, Sprout, Gauge, Flame, TrendingUp, Play, X } from 'lucide-react';
import { Difficulty } from '../types';

interface DifficultyModalProps {
  isOpen: boolean;
  gameName: string;
  selectedDifficulty: Difficulty;
  onSelectDifficulty: (diff: Difficulty) => void;
  onStart: () => void;
  onClose: () => void;
}

const DIFFICULTIES: { id: Difficulty; title: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    id: 'easy',
    title: 'سهل',
    desc: 'بداية هادئة وأرقام بسيطة',
    icon: <Sprout className="w-5 h-5 text-emerald-500" />,
    color: 'border-emerald-500/30 hover:border-emerald-500'
  },
  {
    id: 'medium',
    title: 'متوسط',
    desc: 'تحدٍ مناسب وتوازن رائع',
    icon: <Gauge className="w-5 h-5 text-cyan-500" />,
    color: 'border-cyan-500/30 hover:border-cyan-500'
  },
  {
    id: 'hard',
    title: 'صعب',
    desc: 'للمحترفين وأصحاب السرعة الفائقة',
    icon: <Flame className="w-5 h-5 text-rose-500" />,
    color: 'border-rose-500/30 hover:border-rose-500'
  },
  {
    id: 'grad',
    title: 'متدرج',
    desc: 'يبدأ سهلاً ثم يزداد صعوبة تدريجياً',
    icon: <TrendingUp className="w-5 h-5 text-amber-500" />,
    color: 'border-amber-500/30 hover:border-amber-500'
  }
];

export const DifficultyModal: React.FC<DifficultyModalProps> = ({
  isOpen,
  gameName,
  selectedDifficulty,
  onSelectDifficulty,
  onStart,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-pop-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-lg">
            <Sliders className="w-5 h-5" />
            <span>{gameName}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">
          اختر مستوى الصعوبة المطلوب:
        </p>

        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {DIFFICULTIES.map(item => {
            const isSelected = selectedDifficulty === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectDifficulty(item.id)}
                className={`p-3 rounded-2xl border-2 text-center flex flex-col items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-sm scale-102'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {item.title}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 line-clamp-1">
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onStart}
          className="w-full py-3.5 px-4 rounded-2xl font-black text-sm bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 hover:opacity-95"
        >
          <Play className="w-5 h-5" /> ابدأ التحدي الآن
        </button>
      </div>
    </div>
  );
};
