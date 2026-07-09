// engine.js — Shared simulation engine for all 5 levels.
//
// Levels reskin the visuals + actions but share a common tile "role" system:
//   soil      — empty land (plantable)
//   damaged   — degraded variant of soil (cracked / oil-soaked / concrete / burnt)
//   obstacle  — un-buildable (rock / building / boulder)
//   pioneer   — first-stage vegetation (grass / marsh / lichen / microbe-mat)
//   shrub     — mid-stage (shrub / sapling / saltmarsh / agroforest)
//   canopy    — late-stage (tree / mangrove / pine / dome-tree)
//   water     — water source (pond / wetland / rain-garden / algae-pool)
//   energy    — power structure (solar / processor / atmosphere proc.)
//
// Each level supplies a tileVocab that re-names these roles for display and
// supplies decorations + colors. Mechanic twists per level live in
// `level.simulateTwist(tiles, year) → tiles`.

export const COLS = 14;
export const ROWS = 10;
export const TILE_W = 78;
export const TILE_H = 44;

// Deterministic PRNG for reproducible worlds.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Default world generator. Each level can override by passing
// {soilMix, damagedRate, obstacleRate, pioneers} into makeWorldFromConfig.
export function makeWorldFromConfig(cfg) {
  const seed = cfg.seed ?? 11;
  const rnd = mulberry32(seed);
  const damagedRate  = cfg.damagedRate  ?? 0.40;
  const obstacleRate = cfg.obstacleRate ?? 0.30;
  const tiles = [];
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const cx = COLS / 2, cy = ROWS / 2;
      const d = Math.hypot(i - cx, j - cy) / Math.hypot(cx, cy);
      let role = 'soil';
      const r = rnd();
      if (d > 0.8 && r < obstacleRate) role = 'obstacle';
      else if (d < 0.55 && r < damagedRate) role = 'damaged';
      else if (r < 0.04) role = 'obstacle';
      else if (r < 0.07 && d > 0.4) role = 'pioneer';
      tiles.push({
        i, j,
        role,
        age: 0,
        irrigated: 0,
        modifier: false,   // generic "bund/firebreak/boom" flag
        burning: false,    // per-tile fire flag (Forest Frontline)
        placedAt: 0,
      });
    }
  }
  // Optional pioneer seeds at fixed corners so the map doesn't look fully dead.
  if (cfg.pioneerSeeds) {
    for (const [i, j, role] of cfg.pioneerSeeds) {
      const t = tiles[j * COLS + i];
      if (t) t.role = role;
    }
  }
  return tiles;
}

export function key(i, j) { return j * COLS + i; }

export function neighbors(i, j, range = 1, cardinalOnly = false) {
  const out = [];
  for (let dj = -range; dj <= range; dj++) {
    for (let di = -range; di <= range; di++) {
      if (di === 0 && dj === 0) continue;
      if (cardinalOnly && Math.abs(di) + Math.abs(dj) !== 1) continue;
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= COLS || nj >= ROWS) continue;
      out.push([ni, nj]);
    }
  }
  return out;
}

export function recomputeIrrigation(tiles) {
  const m = new Map(tiles.map((t) => [key(t.i, t.j), { ...t, irrigated: 0 }]));
  const q = [];
  for (const t of m.values()) {
    if (t.role === 'water' || t.role === 'energy') {
      t.irrigated = 3; q.push([t.i, t.j, 3]);
    }
  }
  while (q.length) {
    const [i, j, lvl] = q.shift();
    if (lvl <= 1) continue;
    for (const [ni, nj] of neighbors(i, j, 1)) {
      const k = key(ni, nj);
      const t = m.get(k);
      if (!t) continue;
      if (t.irrigated < lvl - 1) {
        t.irrigated = lvl - 1;
        q.push([ni, nj, lvl - 1]);
      }
    }
  }
  return [...m.values()].sort((a, b) => key(a.i, a.j) - key(b.i, b.j));
}

export function simulateYear(tiles, level) {
  let next = recomputeIrrigation(tiles);

  // Generic death / propagation
  next = next.map((t) => {
    const tile = { ...t, age: t.age + 1 };
    if (tile.role === 'pioneer' && tile.irrigated === 0 && Math.random() < 0.05) tile.role = 'soil';
    if (tile.role === 'shrub' && tile.irrigated < 1 && Math.random() < 0.08) tile.role = 'pioneer';
    if (tile.role === 'canopy' && tile.irrigated < 1 && !tile.modifier && Math.random() < 0.10) tile.role = 'shrub';
    return tile;
  });

  // Spread
  const idx = new Map(next.map((t) => [key(t.i, t.j), t]));
  for (const t of next) {
    if (t.role === 'pioneer' && t.age >= 2) {
      for (const [ni, nj] of neighbors(t.i, t.j, 1, true)) {
        const n = idx.get(key(ni, nj));
        if (n && n.role === 'soil' && Math.random() < 0.18) {
          n.role = 'pioneer'; n.age = 0; n.placedAt = performance.now();
        }
      }
    }
    if (t.role === 'shrub' && t.age >= 3 && t.irrigated >= 1) {
      for (const [ni, nj] of neighbors(t.i, t.j, 1, true)) {
        const n = idx.get(key(ni, nj));
        if (n && n.role === 'pioneer' && Math.random() < 0.10) {
          n.role = 'shrub'; n.age = 0; n.placedAt = performance.now();
        }
      }
    }
  }

  let result = [...idx.values()];

  // Level-specific twist
  if (level && level.simulateTwist) result = level.simulateTwist(result);

  return result;
}

export function passiveYield(tiles) {
  let primary = 0, energy = 0, budget = 0, secondary = 0;
  for (const t of tiles) {
    if (t.role === 'water')  primary += 1;
    if (t.role === 'energy') { primary += 2; energy += 2; }
    if (t.role === 'canopy') { secondary += 1; budget += 1; }
    if (t.role === 'shrub')  secondary += 0.4;
  }
  return {
    primary:   Math.round(primary),
    energy:    Math.round(energy),
    secondary: Math.round(secondary),
    budget:    Math.round(budget),
  };
}

export function computeStats(tiles) {
  const total = tiles.length;
  let veg = 0, water = 0, canopy = 0, shrubs = 0, pioneer = 0;
  let structures = 0, damaged = 0, obstacles = 0;
  let hydration = 0;
  for (const t of tiles) {
    if (t.role === 'pioneer') { veg++; pioneer++; hydration += 0.3; }
    if (t.role === 'shrub')   { veg++; shrubs++;  hydration += 0.5; }
    if (t.role === 'canopy')  { veg++; canopy++;  hydration += 0.65; }
    if (t.role === 'water')   { water++; hydration += 1; }
    if (t.role === 'energy')  structures++;
    if (t.role === 'damaged') damaged++;
    if (t.role === 'obstacle') obstacles++;
    hydration += t.irrigated * 0.12;
    if (t.modifier) hydration += 0.05;
  }
  const vegPct = veg / total;
  const hydPct = Math.min(1, hydration / total);
  const heat = Math.max(0, 1 - (vegPct * 0.7 + hydPct * 0.4));
  const bio = Math.min(1, (pioneer * 1 + shrubs * 2.2 + canopy * 4 + water * 3) / (total * 1.4));
  const carbon = canopy * 1.8 + shrubs * 0.6 + pioneer * 0.2;
  const damagedPct = damaged / total;
  let modifiers = 0;
  for (const t of tiles) { if (t.modifier) modifiers++; }
  return { vegPct, hydPct, heat, bio, carbon, damagedPct,
           canopy, shrubs, pioneer, water, structures, damaged, obstacles, modifiers, total };
}

// ─── Placement rules ────────────────────────────────────────────────────────

export function canPlace(level, action, tile) {
  if (!action) return false;
  if (action.targetRole === 'remove') {
    return !['soil', 'damaged', 'obstacle'].includes(tile.role);
  }
  if (tile.role === 'obstacle') return false;
  if (tile.role === 'water' || tile.role === 'energy') return false;

  const t = action.targetRole;
  if (t === 'modifier') {
    return !tile.modifier && (tile.role === 'soil' || tile.role === 'damaged');
  }
  if (t === 'water' || t === 'energy') {
    return tile.role === 'soil' || tile.role === 'damaged';
  }
  if (t === 'pioneer') {
    return tile.role === 'soil' || tile.role === 'damaged';
  }
  if (t === 'shrub') {
    return ['soil', 'damaged', 'pioneer'].includes(tile.role);
  }
  if (t === 'canopy') {
    const ok = ['soil', 'damaged', 'pioneer', 'shrub'].includes(tile.role);
    if (!ok) return false;
    // Canopy needs irrigation OR modifier on raw soil/damaged
    if ((tile.role === 'soil' || tile.role === 'damaged')
        && !tile.modifier && tile.irrigated < 1) return false;
    return true;
  }
  return false;
}

export function placementBlockReason(level, action, tile) {
  if (!action) return null;
  if (action.targetRole === 'remove') {
    if (['soil', 'damaged', 'obstacle'].includes(tile.role)) return 'Nothing to clear';
    return null;
  }
  if (tile.role === 'obstacle') return level.vocab.obstacle.name;
  if (tile.role === 'water' || tile.role === 'energy') return `Already a ${tile.role}`;
  if (action.targetRole === 'canopy'
      && (tile.role === 'soil' || tile.role === 'damaged')
      && !tile.modifier && tile.irrigated < 1) {
    return level.canopyRequiresHint || 'Needs irrigation or modifier';
  }
  if (action.targetRole === 'modifier' && tile.modifier) return 'Already modified';
  return null;
}



// ─── Advanced Realism Systems ──────────────────────────────────────────────

/**
 * Soil health (0-1) per tile — builds under vegetation, decays under stress.
 * Affects plant survival and spread probability.
 */
export function updateSoilHealth(tiles) {
  return tiles.map(t => {
    let health = t.soilHealth ?? 0.2;
    if (t.role === 'canopy')  health = Math.min(1, health + 0.04);
    if (t.role === 'shrub')   health = Math.min(1, health + 0.025);
    if (t.role === 'pioneer') health = Math.min(1, health + 0.012);
    if (t.role === 'damaged') health = Math.max(0, health - 0.03);
    if (t.role === 'soil' && !t.modifier) health = Math.max(0, health - 0.008);
    if (t.modifier) health = Math.min(1, health + 0.015); // bund helps
    if (t.irrigated > 1) health = Math.min(1, health + 0.01);
    return { ...t, soilHealth: health };
  });
}

/**
 * Erosion spread — damaged tiles can spread to adjacent bare soil.
 * Probability increases with no vegetation and wind (storm weather).
 */
export function spreadErosion(tiles, weather = 'clear') {
  const idx = new Map(tiles.map(t => [key(t.i, t.j), t]));
  const next = tiles.map(t => ({ ...t }));
  const nextIdx = new Map(next.map(t => [key(t.i, t.j), t]));
  const windFactor = weather === 'storm' ? 0.22 : weather === 'cloudy' ? 0.10 : 0.06;

  for (const t of tiles) {
    if (t.role !== 'damaged') continue;
    for (const [ni, nj] of neighbors(t.i, t.j, 1, true)) {
      const n = nextIdx.get(key(ni, nj));
      if (!n || n.role !== 'soil' || n.modifier) continue;
      const prob = windFactor * (1 - (n.soilHealth ?? 0.2));
      if (Math.random() < prob) n.role = 'damaged';
    }
  }
  return next;
}

/**
 * Microclimate cooling — canopy tiles reduce heat of neighbours.
 * Each canopy tile adds 0.08 cooling units to its ring.
 */
export function computeMicroclimate(tiles) {
  const cooling = new Map();
  for (const t of tiles) {
    if (t.role !== 'canopy') continue;
    for (const [ni, nj] of neighbors(t.i, t.j, 2, false)) {
      const k2 = key(ni, nj);
      cooling.set(k2, (cooling.get(k2) || 0) + 0.08);
    }
  }
  return tiles.map(t => ({
    ...t,
    microCooling: Math.min(0.6, cooling.get(key(t.i, t.j)) || 0),
  }));
}

/**
 * Pollinator network — shrubs and canopy create pollinator zones.
 * Tiles inside pollinator zones get a seed spread bonus.
 */
export function computePollinators(tiles) {
  const poll = new Map();
  for (const t of tiles) {
    if (t.role !== 'shrub' && t.role !== 'canopy') continue;
    for (const [ni, nj] of neighbors(t.i, t.j, 3, false)) {
      const k2 = key(ni, nj);
      poll.set(k2, (poll.get(k2) || 0) + (t.role === 'canopy' ? 0.15 : 0.08));
    }
  }
  return tiles.map(t => ({
    ...t,
    pollinator: Math.min(1, poll.get(key(t.i, t.j)) || 0),
  }));
}

/**
 * Groundwater recharge — ponds and deep-rooted canopy recharge aquifer.
 * Expressed as a 0-1 recharge score that boosts irrigation range.
 */
export function computeGroundwater(tiles) {
  let recharge = 0;
  for (const t of tiles) {
    if (t.role === 'water')  recharge += 0.08;
    if (t.role === 'canopy') recharge += 0.015;
    if (t.modifier)          recharge += 0.005;
  }
  const score = Math.min(1, recharge);
  // Apply as bonus irrigated level near water sources
  return { tiles, groundwaterScore: score };
}

/**
 * Seasonal cycle (year % 4):
 *   0 = dry season   — plants under stress, higher die-off
 *   1 = early rains  — spread bonus
 *   2 = peak wet     — max growth
 *   3 = late wet     — settling
 */
export function getSeason(year) {
  const s = year % 4;
  return s === 0 ? 'dry' : s === 1 ? 'early-rains' : s === 2 ? 'peak-wet' : 'late-wet';
}

export function seasonLabel(year) {
  const map = { 'dry':'Dry Season','early-rains':'Early Rains','peak-wet':'Peak Wet','late-wet':'Late Wet' };
  return map[getSeason(year)] || '';
}

/**
 * Enhanced computeStats that includes realism metrics.
 */
export function computeDetailedStats(tiles, year = 0) {
  const base = computeStats(tiles);
  const season = getSeason(year);
  const avgSoilHealth = tiles.reduce((s,t)=>s+(t.soilHealth??0.2),0)/tiles.length;
  const avgCooling    = tiles.reduce((s,t)=>s+(t.microCooling||0),0)/tiles.length;
  const pollinatorPct = tiles.filter(t=>t.pollinator>0.2).length/tiles.length;
  const { groundwaterScore } = computeGroundwater(tiles);
  const erosionRisk   = tiles.filter(t=>t.role==='damaged').length/tiles.length;

  return {
    ...base,
    soilHealth:      avgSoilHealth,
    microCooling:    avgCooling,
    pollinatorCover: pollinatorPct,
    groundwater:     groundwaterScore,
    erosionRisk,
    season,
    seasonLabel:     seasonLabel(year),
  };
}