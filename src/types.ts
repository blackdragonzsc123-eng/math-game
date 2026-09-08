export type GameMode = 'yesno' | 'op' | 'result' | 'stroop' | 'rotation' | 'mix' | 'high_thinking';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'grad';

export interface GameMetadata {
  id: GameMode;
  name: string;
  desc: string;
  iconName: string;
  gradient: string;
  badge?: string;
}

export interface QuestionData {
  type: 'op' | 'result' | 'stroop' | 'rotation';
  title: string;
  cardContent: {
    text?: string;
    subtext?: string;
    equationA?: number;
    equationOp?: string;
    equationB?: number;
    equationRes?: number;
    missingSlot?: 'op' | 'result';
    colorHex?: string;
    colorName?: string;
    arrowAngle?: number;
  };
  options: {
    id: number;
    label: string;
    icon?: string;
    colorBg?: string;
  }[];
  correctIndex: number;
}

export interface StoredStats {
  bestScore: number;
  bestLevel: number;
  bestScoresByMode: Record<string, number>;
  soundEnabled: boolean;
  darkMode: boolean;
  history: { date: string; mode: string; score: number; level: number }[];
}

export interface HighThinkingRequest {
  type: 'riddle' | 'analyze' | 'solve';
  category?: string;
  puzzleInput?: string;
  userAnswer?: string;
  gameStats?: {
    bestScore: number;
    bestLevel: number;
    recentScores: Record<string, number>;
  };
}

export interface HighThinkingResponse {
  success: boolean;
  title?: string;
  content: string;
  thinkingSummary?: string;
  riddleData?: {
    puzzle: string;
    question: string;
    hint: string;
    solution: string;
    difficultyRating: string;
    cognitiveDomain: string;
  };
  evaluation?: {
    isCorrect: boolean;
    feedback: string;
    explanation: string;
  };
  error?: string;
}
