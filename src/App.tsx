import React, { useState, useEffect } from 'react';
import { GameMode, Difficulty, StoredStats } from './types';
import { HomeScreen } from './components/HomeScreen';
import { MathGameScreen } from './components/MathGameScreen';
import { YesNoGameScreen } from './components/YesNoGameScreen';
import { HighThinkingScreen } from './components/HighThinkingScreen';
import { InstructionsModal } from './components/InstructionsModal';
import { DifficultyModal } from './components/DifficultyModal';
import { setSoundMuted } from './utils/audio';

const STORAGE_KEY = 'brain_trainer_stats_v1';

const DEFAULT_STATS: StoredStats = {
  bestScore: 0,
  bestLevel: 1,
  bestScoresByMode: {
    yesno: 0,
    op: 0,
    result: 0,
    stroop: 0,
    rotation: 0,
    mix: 0
  },
  soundEnabled: true,
  darkMode: true,
  history: []
};

export default function App() {
  const [stats, setStats] = useState<StoredStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_STATS, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore read error
    }
    return DEFAULT_STATS;
  });

  const [currentScreen, setCurrentScreen] = useState<'home' | 'math_game' | 'yesno' | 'high_thinking'>('home');
  const [activeMathMode, setActiveMathMode] = useState<'op' | 'result' | 'stroop' | 'rotation' | 'mix'>('mix');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isDifficultyModalOpen, setIsDifficultyModalOpen] = useState(false);
  const [pendingGameName, setPendingGameName] = useState('');

  // Sync sound muted state
  useEffect(() => {
    setSoundMuted(!stats.soundEnabled);
  }, [stats.soundEnabled]);

  // Sync dark mode class on document
  useEffect(() => {
    if (stats.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [stats.darkMode]);

  // Persist stats changes
  const saveStats = (newStats: StoredStats) => {
    setStats(newStats);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
    } catch {
      // Ignore storage error
    }
  };

  const handleToggleTheme = () => {
    saveStats({
      ...stats,
      darkMode: !stats.darkMode
    });
  };

  const handleToggleSound = () => {
    saveStats({
      ...stats,
      soundEnabled: !stats.soundEnabled
    });
  };

  const handleSelectGame = (mode: GameMode) => {
    if (mode === 'yesno') {
      setCurrentScreen('yesno');
    } else if (mode === 'high_thinking') {
      setCurrentScreen('high_thinking');
    } else {
      setActiveMathMode(mode);
      const names: Record<string, string> = {
        op: 'العامل المفقود',
        result: 'الناتج المفقود',
        stroop: 'خداع الألوان',
        rotation: 'التدوير الذهني',
        mix: 'مزيج الألعاب المعرفية'
      };
      setPendingGameName(names[mode] || 'اللعبة الذهنية');
      setIsDifficultyModalOpen(true);
    }
  };

  const handleStartMathGame = () => {
    setIsDifficultyModalOpen(false);
    setCurrentScreen('math_game');
  };

  const handleUpdateBestMathScore = (mode: GameMode, score: number, level: number) => {
    const updatedScores = {
      ...stats.bestScoresByMode,
      [mode]: Math.max(stats.bestScoresByMode[mode] || 0, score)
    };
    const overallBest = Math.max(stats.bestScore, score);
    const overallLevel = Math.max(stats.bestLevel, level);

    saveStats({
      ...stats,
      bestScore: overallBest,
      bestLevel: overallLevel,
      bestScoresByMode: updatedScores
    });
  };

  const handleUpdateBestYesNoScore = (score: number) => {
    const updatedScores = {
      ...stats.bestScoresByMode,
      yesno: Math.max(stats.bestScoresByMode.yesno || 0, score)
    };
    const overallBest = Math.max(stats.bestScore, score);

    saveStats({
      ...stats,
      bestScore: overallBest,
      bestScoresByMode: updatedScores
    });
  };

  return (
    <div className="min-h-screen bg-[#eef1fb] dark:bg-[#0f1226] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-cairo">
      {currentScreen === 'home' && (
        <HomeScreen
          stats={stats}
          darkMode={stats.darkMode}
          soundEnabled={stats.soundEnabled}
          onToggleTheme={handleToggleTheme}
          onToggleSound={handleToggleSound}
          onOpenInstructions={() => setIsInstructionsOpen(true)}
          onSelectGame={handleSelectGame}
        />
      )}

      {currentScreen === 'math_game' && (
        <MathGameScreen
          mode={activeMathMode}
          diff={selectedDifficulty}
          soundEnabled={stats.soundEnabled}
          onToggleSound={handleToggleSound}
          onBackHome={() => setCurrentScreen('home')}
          onUpdateBestScore={handleUpdateBestMathScore}
        />
      )}

      {currentScreen === 'yesno' && (
        <YesNoGameScreen
          soundEnabled={stats.soundEnabled}
          onToggleSound={handleToggleSound}
          onBackHome={() => setCurrentScreen('home')}
          onUpdateBestScore={handleUpdateBestYesNoScore}
          bestScore={stats.bestScoresByMode.yesno || 0}
        />
      )}

      {currentScreen === 'high_thinking' && (
        <HighThinkingScreen
          stats={stats}
          onBackHome={() => setCurrentScreen('home')}
        />
      )}

      {/* Instructions Modal */}
      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />

      {/* Difficulty Selection Modal */}
      <DifficultyModal
        isOpen={isDifficultyModalOpen}
        gameName={pendingGameName}
        selectedDifficulty={selectedDifficulty}
        onSelectDifficulty={setSelectedDifficulty}
        onStart={handleStartMathGame}
        onClose={() => setIsDifficultyModalOpen(false)}
      />
    </div>
  );
}
