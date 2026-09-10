import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  Key, 
  Activity, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import { SystemTelemetry } from '../types';
import { systemMonitor } from '../utils/systemMonitor';

interface BackgroundTelemetryHUDProps {
  customApiKey: string;
  onUpdateApiKey: (key: string) => void;
}

export const BackgroundTelemetryHUD: React.FC<BackgroundTelemetryHUDProps> = ({
  customApiKey,
  onUpdateApiKey
}) => {
  const [telemetry, setTelemetry] = useState<SystemTelemetry>(systemMonitor.getSnapshot());
  const [isExpanded, setIsExpanded] = useState(false);
  const [keyInput, setKeyInput] = useState(customApiKey);
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memHistory, setMemHistory] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsubscribe = systemMonitor.subscribe(data => {
      setTelemetry(data);
      setCpuHistory(prev => [...prev.slice(-29), data.clientCpuPercent]);
      setMemHistory(prev => [...prev.slice(-29), data.clientMemoryMb]);
    });
    return () => unsubscribe();
  }, []);

  // Synchronize customApiKey prop with local state
  useEffect(() => {
    setKeyInput(customApiKey);
  }, [customApiKey]);

  // Draw real-time CPU & Memory telemetry graph on canvas
  useEffect(() => {
    if (!isExpanded || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let y = 10; y < height; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw CPU line (cyan / indigo)
    if (cpuHistory.length > 1) {
      ctx.beginPath();
      const step = width / (cpuHistory.length - 1);
      cpuHistory.forEach((val, i) => {
        const x = i * step;
        const y = height - (val / 100) * (height - 10) - 5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Gradient fill under CPU curve
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }, [isExpanded, cpuHistory, memHistory]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateApiKey(keyInput.trim());
    setIsKeySaved(true);
    setTimeout(() => setIsKeySaved(false), 2500);
  };

  const effectiveHasKey = telemetry.hasDeepSeekKey || customApiKey.trim().length > 0;

  // Status color based on CPU
  const getCpuColor = (cpu: number) => {
    if (cpu < 35) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (cpu < 70) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <>
      {/* Background Micro Bar (Pinned at bottom) */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-xl transition-all duration-300">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer backdrop-blur-md bg-slate-900/85 dark:bg-slate-950/85 border border-white/15 text-slate-200 py-1.5 px-3 rounded-full shadow-lg hover:bg-slate-900 flex items-center justify-between gap-2 text-[11px] font-bold select-none"
        >
          {/* CPU Pill */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${telemetry.clientCpuPercent > 60 ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${telemetry.clientCpuPercent > 60 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            </span>
            <div className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>معالج:</span>
              <span className={`px-1.5 py-0.2 rounded font-mono ${getCpuColor(telemetry.clientCpuPercent)}`}>
                {telemetry.clientCpuPercent}%
              </span>
            </div>
          </div>

          {/* Memory Pill */}
          <div className="flex items-center gap-1 text-slate-300">
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span>ذاكرة:</span>
            <span className="font-mono text-purple-300">
              {telemetry.clientMemoryMb} MB
            </span>
          </div>

          {/* Network / Offline badge */}
          <div className="flex items-center gap-1">
            {telemetry.isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi className="w-3 h-3" />
                <span className="hidden sm:inline">أونلاين</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400">
                <WifiOff className="w-3 h-3" />
                <span>أوفلاين ⚡</span>
              </span>
            )}
          </div>

          {/* DeepSeek Indicator */}
          <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
            <Sparkles className="w-2.5 h-2.5" />
            <span>DeepSeek {effectiveHasKey ? 'R1' : 'محلي'}</span>
          </div>

          <div className="text-slate-400">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* Expanded Telemetry & Hardware Diagnostics HUD Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 animate-pop-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-cyan-400 font-black text-base">
                <Activity className="w-5 h-5" />
                <span>مراقب الموارد ونظام DeepSeek في الخلفية</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Telemetry Real-time Canvas Graph */}
            <div className="bg-slate-950/90 rounded-2xl p-3 border border-slate-800 mb-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-bold">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Cpu className="w-3.5 h-3.5" />
                  معدل استهلاك المعالج الحي (CPU Load): {telemetry.clientCpuPercent}%
                </span>
                <span className="text-purple-400 font-mono">
                  FPS: {telemetry.fps} إطار/ثانية
                </span>
              </div>
              <canvas
                ref={canvasRef}
                width={400}
                height={80}
                className="w-full h-20 rounded-xl bg-slate-900/60"
              />
            </div>

            {/* Hardware Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-center">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-bold">استهلاك المعالج</span>
                <span className="font-mono text-base font-black text-cyan-400">
                  {telemetry.clientCpuPercent}%
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-bold">ذاكرة الجلسة (JS)</span>
                <span className="font-mono text-base font-black text-purple-400">
                  {telemetry.clientMemoryMb} MB
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-bold">ذاكرة الخادم (Node)</span>
                <span className="font-mono text-base font-black text-amber-400">
                  {telemetry.serverHeapMb ? `${telemetry.serverHeapMb} MB` : 'محلي'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-bold">وضع الشبكة</span>
                <span className={`text-xs font-black block mt-1 ${telemetry.isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {telemetry.isOnline ? 'متصل بالإنترنت' : 'أوفلاين ⚡'}
                </span>
              </div>
            </div>

            {/* Offline PWA Status Badge */}
            <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 mb-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <div>
                  <strong className="block text-indigo-200">وضع العمل دون إنترنت (Offline PWA)</strong>
                  <span className="text-slate-400 text-[10px]">
                    الألعاب الحسابية وتأثير ستروب والتدوير الذهني تعمل 100% بدون اتصال.
                  </span>
                </div>
              </div>
            </div>

            {/* DeepSeek API Key Configuration */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  مفتاح DeepSeek API (للألعاب ونمط التفكير العالي)
                </span>
                {effectiveHasKey && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    مفتاح مفعل ✓
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveKey} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    placeholder={telemetry.hasDeepSeekKey ? "المفتاح محفوظ في متغيرات البيئة DEEPSEEK_API_KEY" : "أدخل مفتاح DeepSeek (sk-...)"}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1"
                  >
                    {isKeySaved ? <Check className="w-4 h-4 text-emerald-300" /> : 'حفظ'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  يمكنك وضع المفتاح هنا مباشرة أو وضعه في متغير <code className="text-indigo-300 font-mono">DEEPSEEK_API_KEY</code> في إعدادات البيئة. عند عدم وجود مفتاح، سيعمل التطبيق عبر بنك الألغاز المحلي الذكي بدون إنترنت.
                </p>
              </form>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              إغلاق لوحة المراقبة
            </button>
          </div>
        </div>
      )}
    </>
  );
};
