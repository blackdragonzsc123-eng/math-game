import React from 'react';
import { 
  HelpCircle, 
  Calculator, 
  Palette, 
  RotateCw, 
  Heart, 
  Sparkles, 
  Check, 
  X 
} from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-pop-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-lg">
            <HelpCircle className="w-6 h-6" />
            <span>تعليمات وقواعد الألعاب</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ul className="space-y-3.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
          <li className="flex items-start gap-3">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 flex-shrink-0 mt-0.5">
              <Calculator className="w-4 h-4" />
            </span>
            <span>
              <strong>العمليات الحسابية:</strong> أكمل المعادلة باختيار رمز العملية المفقود (+, −, ×, ÷) أو ناتج المسألة في أسرع وقت.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 flex-shrink-0 mt-0.5">
              <Palette className="w-4 h-4" />
            </span>
            <span>
              <strong>خداع الألوان (تأثير ستروب):</strong> اختر لون الحبر الذي كُتبت به الكلمة، وتجاهل المعنى النصي للكلمة!
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 flex-shrink-0 mt-0.5">
              <RotateCw className="w-4 h-4" />
            </span>
            <span>
              <strong>التدوير الذهني:</strong> تخيل دوران السهم في ذهنك وحدد الاتجاه النهائي الصحيح (أعلى، أسفل، يمين، يسار).
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 flex-shrink-0 mt-0.5">
              <HelpCircle className="w-4 h-4" />
            </span>
            <span>
              <strong>لعبة نعم أو لا:</strong> إذا كان الرمز بالأعلى اختبر هل الرقم زوجي، وإذا كان بالأسفل اختبر هل الوجه مبتسم.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 flex-shrink-0 mt-0.5">
              <Heart className="w-4 h-4" />
            </span>
            <span>
              <strong>القلوب والنقاط:</strong> الإجابة الصحيحة تمنحك نقطة وتزيد التتابع، بينما الخطأ ينقص نقطة ويفقدك قلباً من أصل 3.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </span>
            <span>
              <strong>التفكير العالي:</strong> يتيح لك تجربة حل ألغاز منطقية رياضية عميقة ومتقدمة بالذكاء الاصطناعي الفائق.
            </span>
          </li>
        </ul>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3.5 px-4 rounded-2xl font-black text-sm bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 hover:opacity-95"
        >
          <Check className="w-5 h-5" /> فهمت ذلك، دعنا نبدأ!
        </button>
      </div>
    </div>
  );
};
