import { Difficulty, QuestionData } from '../types';

export const COLORS = [
  { name: 'أحمر', hex: '#ff4d5a' },
  { name: 'أزرق', hex: '#3ea6ff' },
  { name: 'أخضر', hex: '#2ecc71' },
  { name: 'أصفر', hex: '#ffd93d' },
  { name: 'بنفسجي', hex: '#b06cff' },
  { name: 'برتقالي', hex: '#ff9f43' }
];

export const DIRS = [
  { label: 'أعلى', angle: 0 },
  { label: 'يسار', angle: 270 },
  { label: 'أسفل', angle: 180 },
  { label: 'يمين', angle: 90 }
];

const DIR_MAP = [0, 3, 2, 1]; // 0=0deg(up), 1=90deg(right), 2=180deg(down), 3=270deg(left)
const OPS = ['+', '−', '×', '÷'];

function rand(n: number) {
  return Math.floor(Math.random() * n);
}

function randRange(a: number, b: number) {
  return a + rand(b - a + 1);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getDifficultyParams(diff: Difficulty, level: number) {
  if (diff === 'easy') {
    return {
      maxN: Math.min(30, 6 + Math.floor((level - 1) * 1.5)),
      ops: ['+', '−'],
      time: Math.max(4, 9 - (level - 1) * 0.25),
      distr: 6,
      mulF: Math.min(5, 2 + Math.floor(level / 3)),
      colors: 4,
      rotExtra: 0
    };
  }
  if (diff === 'medium') {
    return {
      maxN: Math.min(60, 12 + Math.floor((level - 1) * 2.5)),
      ops: ['+', '−', '×'],
      time: Math.max(3, 7 - (level - 1) * 0.3),
      distr: 4,
      mulF: Math.min(9, 3 + Math.floor(level / 2)),
      colors: 5,
      rotExtra: 1
    };
  }
  if (diff === 'hard') {
    return {
      maxN: Math.min(99, 20 + Math.floor((level - 1) * 4)),
      ops: ['+', '−', '×', '÷'],
      time: Math.max(2.2, 5 - (level - 1) * 0.35),
      distr: 2,
      mulF: Math.min(12, 4 + Math.floor(level / 2)),
      colors: 6,
      rotExtra: 2
    };
  }
  // Gradual mode
  return {
    maxN: Math.min(99, 5 + (level - 1) * 3),
    ops: level >= 6 ? ['+', '−', '×', '÷'] : level >= 3 ? ['+', '−', '×'] : ['+', '−'],
    time: Math.max(2, 12 - (level - 1) * 0.5),
    distr: Math.max(2, 6 - Math.floor(level / 3)),
    mulF: Math.min(12, 2 + Math.floor(level / 2)),
    colors: Math.min(6, 3 + Math.floor(level / 2)),
    rotExtra: Math.floor(level / 2)
  };
}

function pickEquation(diff: Difficulty, level: number) {
  const p = getDifficultyParams(diff, level);
  const op = p.ops[rand(p.ops.length)];
  let a: number, b: number, res: number;
  if (op === '+') {
    a = randRange(1, p.maxN);
    b = randRange(1, p.maxN);
    res = a + b;
  } else if (op === '−') {
    a = randRange(2, p.maxN);
    b = randRange(1, a);
    res = a - b;
  } else if (op === '×') {
    a = randRange(2, p.mulF);
    b = randRange(2, p.mulF);
    res = a * b;
  } else {
    const d = randRange(2, Math.min(9, p.mulF));
    const q = randRange(2, Math.min(12, p.mulF));
    a = d * q;
    b = d;
    res = q;
  }
  return { a, b, op, res };
}

function distractors(res: number, diff: Difficulty, level: number): number[] {
  const p = getDifficultyParams(diff, level);
  const set = new Set<number>([res]);
  const out: number[] = [];
  while (out.length < 3) {
    let d = res + randRange(-(p.distr + 2), p.distr + 2);
    if (d < 0) d = res + randRange(1, p.distr + 2);
    if (!set.has(d)) {
      set.add(d);
      out.push(d);
    }
  }
  return out;
}

export function generateQuestion(
  mode: 'op' | 'result' | 'stroop' | 'rotation' | 'mix',
  diff: Difficulty,
  level: number
): QuestionData {
  let effectiveMode = mode;
  if (mode === 'mix') {
    const pool: ('op' | 'result' | 'stroop' | 'rotation')[] = ['op', 'result', 'stroop', 'rotation'];
    effectiveMode = pool[rand(pool.length)];
  }

  if (effectiveMode === 'op') {
    const eq = pickEquation(diff, level);
    const correctIndex = OPS.indexOf(eq.op);
    return {
      type: 'op',
      title: 'اختر رمز العملية الحسابية الصحيح',
      cardContent: {
        equationA: eq.a,
        equationOp: eq.op,
        equationB: eq.b,
        equationRes: eq.res,
        missingSlot: 'op'
      },
      options: OPS.map((op, idx) => ({
        id: idx,
        label: op
      })),
      correctIndex
    };
  }

  if (effectiveMode === 'result') {
    const eq = pickEquation(diff, level);
    const rawOptions = shuffle([eq.res, ...distractors(eq.res, diff, level)]);
    const correctIndex = rawOptions.indexOf(eq.res);
    return {
      type: 'result',
      title: 'احسب الناتج الصحيح للمعادلة',
      cardContent: {
        equationA: eq.a,
        equationOp: eq.op,
        equationB: eq.b,
        equationRes: eq.res,
        missingSlot: 'result'
      },
      options: rawOptions.map((val, idx) => ({
        id: idx,
        label: val.toString()
      })),
      correctIndex
    };
  }

  if (effectiveMode === 'stroop') {
    const p = getDifficultyParams(diff, level);
    const n = p.colors;
    const w = rand(n);
    let c = rand(n);
    while (c === w) {
      c = rand(n);
    }
    const colorOptions = COLORS.slice(0, n);
    return {
      type: 'stroop',
      title: 'اختر لون الخط — ليس معنى الكلمة!',
      cardContent: {
        text: COLORS[w].name,
        colorHex: COLORS[c].hex,
        colorName: COLORS[c].name
      },
      options: colorOptions.map((col, idx) => ({
        id: idx,
        label: col.name,
        colorBg: col.hex
      })),
      correctIndex: c
    };
  }

  // Mental Rotation
  const p = getDifficultyParams(diff, level);
  const steps = randRange(1, 3) + p.rotExtra;
  const targetDeg = steps * 90;
  const correctOptionIdx = DIR_MAP[steps % 4];

  return {
    type: 'rotation',
    title: 'أين يشير السهم بعد اكتمال التدوير؟',
    cardContent: {
      arrowAngle: targetDeg
    },
    options: DIRS.map((dir, idx) => ({
      id: idx,
      label: dir.label
    })),
    correctIndex: correctOptionIdx
  };
}
