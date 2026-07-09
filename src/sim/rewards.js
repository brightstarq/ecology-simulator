// sim/rewards.js — XP, ranks, achievements & streaks.
//
// Mirrors the storage pattern used by progress.js (localStorage-first) so it
// can be swapped for a Supabase-synced version later without touching the
// call sites in App.jsx — just change load/save under the hood.

const KEY = 'verdant-rewards-v1';

const DEFAULT = {
  xp: 0,
  unlocked: {},          // { achievementId: isoDateString }
  streak: { count: 0, lastDay: null, best: 0 },
  levelsCompleted: 0,
};

export function loadRewards() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT, unlocked: {}, streak: { ...DEFAULT.streak } };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT, ...parsed, streak: { ...DEFAULT.streak, ...(parsed.streak || {}) } };
  } catch { return { ...DEFAULT, unlocked: {}, streak: { ...DEFAULT.streak } }; }
}

export function saveRewards(rewards) {
  try { localStorage.setItem(KEY, JSON.stringify(rewards)); } catch {}
}

// ── Ranks ─────────────────────────────────────────────────────────────────
// Each rank needs progressively more XP. Titles lean into the restoration
// theme so leveling up feels like an in-world accomplishment, not a meta-game
// bolted on top.
export const RANKS = [
  { title: 'Seedling',            min: 0    },
  { title: 'Sprout Tender',       min: 150  },
  { title: 'Grove Apprentice',    min: 400  },
  { title: 'Soil Steward',        min: 800  },
  { title: 'Watershed Warden',    min: 1400 },
  { title: 'Canopy Keeper',       min: 2200 },
  { title: 'Restoration Lead',    min: 3200 },
  { title: 'Ecosystem Architect', min: 4500 },
  { title: 'Bioregion Guardian',  min: 6200 },
  { title: 'Planet Steward',      min: 8500 },
];

export function getRank(xp) {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].min) idx = i;
  const current = RANKS[idx];
  const next = RANKS[idx + 1] || null;
  const span = next ? next.min - current.min : 1;
  const into = xp - current.min;
  return {
    index: idx,
    title: current.title,
    nextTitle: next?.title || null,
    xpIntoRank: into,
    xpForNextRank: next ? next.min - xp : 0,
    progressPct: next ? Math.min(1, into / span) : 1,
    maxed: !next,
  };
}

// XP awarded for finishing a level, scaled by how well objectives/trust/
// ecology stack up — mirrors the scoring already used in progress.js so the
// numbers feel consistent with the score shown on the win screen.
export function xpForLevelCompletion(stats, trust) {
  const base = 120;
  const qualityBonus = Math.round(
    stats.vegPct * 80 + stats.hydPct * 40 + stats.bio * 90 +
    Math.min(1, stats.carbon / 50) * 40 + (trust / 100) * 30
  );
  return base + qualityBonus;
}

// ── Achievements ──────────────────────────────────────────────────────────
// `check(ctx)` receives { stats, trust, year, level, rewards, isLevelComplete }
// and returns true the moment the condition is first satisfied. Achievements
// are one-shot: once unlocked they stay unlocked.
export const ACHIEVEMENTS = [
  {
    id: 'first-bloom',
    title: 'First Bloom',
    desc: 'Get any vegetation established on a damaged site.',
    xp: 40,
    check: ({ stats }) => stats.vegPct > 0,
  },
  {
    id: 'half-green',
    title: 'Half Green',
    desc: 'Reach 50% vegetation cover in a single level.',
    xp: 80,
    check: ({ stats }) => stats.vegPct >= 0.5,
  },
  {
    id: 'full-canopy',
    title: 'Full Canopy',
    desc: 'Reach 85% vegetation cover in a single level.',
    xp: 150,
    check: ({ stats }) => stats.vegPct >= 0.85,
  },
  {
    id: 'water-table',
    title: 'Raised Water Table',
    desc: 'Push hydration above 70% on one site.',
    xp: 90,
    check: ({ stats }) => stats.hydPct >= 0.7,
  },
  {
    id: 'biodiversity-basic',
    title: 'Signs of Life',
    desc: 'Reach 40% biodiversity index.',
    xp: 70,
    check: ({ stats }) => stats.bio >= 0.4,
  },
  {
    id: 'biodiversity-thriving',
    title: 'Thriving Ecosystem',
    desc: 'Reach 75% biodiversity index.',
    xp: 160,
    check: ({ stats }) => stats.bio >= 0.75,
  },
  {
    id: 'carbon-sink',
    title: 'Carbon Sink',
    desc: 'Sequester 40 tCO₂/yr on one site.',
    xp: 100,
    check: ({ stats }) => stats.carbon >= 40,
  },
  {
    id: 'trusted',
    title: 'Community Trust',
    desc: 'Reach 80 community trust.',
    xp: 90,
    check: ({ trust }) => trust >= 80,
  },
  {
    id: 'erosion-tamed',
    title: 'Erosion Tamed',
    desc: 'Cut erosion risk below 10% after starting a damaged site.',
    xp: 80,
    check: ({ stats }) => stats.erosionRisk !== undefined && stats.erosionRisk <= 0.1,
  },
  {
    id: 'first-restoration',
    title: 'First Restoration',
    desc: 'Complete your first level.',
    xp: 100,
    check: ({ isLevelComplete, rewards }) => isLevelComplete && rewards.levelsCompleted === 0,
  },
  {
    id: 'three-biomes',
    title: 'Multi-Biome Restorer',
    desc: 'Complete restoration missions in 3 different biomes.',
    xp: 200,
    check: ({ isLevelComplete, rewards }) => isLevelComplete && rewards.levelsCompleted + 1 >= 3,
  },
  {
    id: 'all-biomes',
    title: 'Global Restorer',
    desc: 'Complete every biome in Verdant.',
    xp: 400,
    check: ({ isLevelComplete, rewards }) => isLevelComplete && rewards.levelsCompleted + 1 >= 5,
  },
  {
    id: 'streak-3',
    title: 'Consistent Steward',
    desc: 'Play on 3 different days in a row.',
    xp: 60,
    check: ({ rewards }) => rewards.streak.count >= 3,
  },
  {
    id: 'streak-7',
    title: 'Weeklong Warden',
    desc: 'Play on 7 different days in a row.',
    xp: 180,
    check: ({ rewards }) => rewards.streak.count >= 7,
  },
];

// Evaluate all not-yet-unlocked achievements against the current context.
// Mutates nothing — returns { rewards: updatedRewardsObject, newlyUnlocked: [...] }
// so the caller decides when to persist and how to render toasts.
export function evaluateAchievements(ctx, rewards) {
  const newlyUnlocked = [];
  let xpGain = 0;
  const unlocked = { ...rewards.unlocked };

  for (const ach of ACHIEVEMENTS) {
    if (unlocked[ach.id]) continue;
    let earned = false;
    try { earned = !!ach.check({ ...ctx, rewards }); } catch { earned = false; }
    if (earned) {
      unlocked[ach.id] = new Date().toISOString();
      newlyUnlocked.push(ach);
      xpGain += ach.xp;
    }
  }

  if (!newlyUnlocked.length) return { rewards, newlyUnlocked: [] };

  const updated = { ...rewards, unlocked, xp: rewards.xp + xpGain };
  return { rewards: updated, newlyUnlocked };
}

// ── Daily streak ─────────────────────────────────────────────────────────
// Call once per session (e.g. on app load). Increments the streak if the
// last recorded day was exactly yesterday, resets if a day was missed, and
// is a no-op if already recorded today.
export function recordDailyVisit(rewards) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const { lastDay, count, best } = rewards.streak;
  if (lastDay === today) return rewards;

  let newCount = 1;
  if (lastDay) {
    const prev = new Date(lastDay + 'T00:00:00');
    const cur = new Date(today + 'T00:00:00');
    const diffDays = Math.round((cur - prev) / 86400000);
    if (diffDays === 1) newCount = count + 1;
  }
  return { ...rewards, streak: { count: newCount, lastDay: today, best: Math.max(best, newCount) } };
}

export function addXP(rewards, amount) {
  return { ...rewards, xp: rewards.xp + amount };
}

export function markLevelCompleteReward(rewards) {
  return { ...rewards, levelsCompleted: rewards.levelsCompleted + 1 };
}

export function resetRewards() {
  localStorage.removeItem(KEY);
}
