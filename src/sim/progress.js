// sim/progress.js — Persistent game progress via localStorage.

// ─── DEV FLAG ─────────────────────────────────────────────────────────────────
// Set to true  → all levels unlocked for everyone (demo / dev mode)
// Set to false → levels unlock progressively by completing the previous one
export const DEV_UNLOCK_ALL = true;
// ─────────────────────────────────────────────────────────────────────────────

const KEY = 'desert-bloom-progress-v1';

const DEFAULT = {
  unlockedLevels: ['schoolyard','desert','coastal','urban','forest','planet'],   // all unlocked in dev
  completedLevels: {},          // { desert: { year, score, trust, vegPct } }
  totalPlaytime: 0,
  firstLaunch: true,
};

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch { return { ...DEFAULT }; }
}

export function saveProgress(progress) {
  try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch {}
}

export function markLevelComplete(levelId, nextLevelId, stats, year, trust) {
  const p = loadProgress();
  const score = Math.round(
    stats.vegPct*30 + stats.hydPct*20 + stats.bio*25 +
    Math.min(1,stats.carbon/50)*15 + (trust/100)*10
  );
  p.completedLevels[levelId] = { year, score, trust, vegPct: stats.vegPct, bio: stats.bio };
  if (nextLevelId && !p.unlockedLevels.includes(nextLevelId)) {
    p.unlockedLevels.push(nextLevelId);
  }
  p.firstLaunch = false;
  saveProgress(p);
  return score;
}

export function isLevelUnlocked(levelId, progress) {
  if (DEV_UNLOCK_ALL) return true;
  return progress.unlockedLevels.includes(levelId);
}

export function getLevelBest(levelId, progress) {
  return progress.completedLevels[levelId] || null;
}

export function resetProgress() {
  localStorage.removeItem(KEY);
}