// sim.js — World generation, simulation, stats, constants for Desert Bloom.
// Plain JS (no JSX) so it loads fast and keeps the React files focused.

export const COLS = 14;
export const ROWS = 10;
export const TILE_W = 78;
export const TILE_H = 44;

// Each game tile represents 1 acre of land. The investor impact panel uses
// this scaling factor; 1 acre × per-tile carbon ≈ project tCO2/yr per acre.
export const ACRES_PER_TILE = 1;

export const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "sunset",
  "overlay": "none",
  "difficulty": "normal",
  "showGrid": false,
  "showWildlife": true,
  "showImpact": true,
  "weather": "clear"
}/*EDITMODE-END*/;

export const DIFFICULTY = {
  easy:   { budget: 240, water: 80, seeds: 60, energy: 30, years: 30 },
  normal: { budget: 150, water: 50, seeds: 40, energy: 18, years: 25 },
  hard:   { budget:  95, water: 30, seeds: 28, energy: 10, years: 20 },
};

export const ACTIONS = [
  { id: 'grass',  name: 'Native grass',       sub: 'Drought-hardy cover',
    cost: { budget: 5,  water: 2, seeds: 3 }, kind: 'plant',
    desc: 'Stabilises soil. Spreads to adjacent sand naturally.' },
  { id: 'shrub',  name: 'Drought shrub',      sub: 'Acacia, mesquite',
    cost: { budget: 12, water: 5, seeds: 4 }, kind: 'plant',
    desc: 'Cools microclimate, hosts pollinators.' },
  { id: 'tree',   name: 'Agroforestry tree',  sub: 'Canopy + nut yield',
    cost: { budget: 25, water: 8, seeds: 6 }, kind: 'plant',
    desc: 'High biodiversity. Needs irrigation or a bund.' },
  { id: 'pond',   name: 'Retention pond',     sub: 'Stores rainfall',
    cost: { budget: 30, water: 15, energy: 0 }, kind: 'water',
    desc: 'Irrigates 8 neighbours. +1 water/year passively.' },
  { id: 'solar',  name: 'Solar pump',         sub: 'PV + bore pump',
    cost: { budget: 40, water: 0, energy: 10 }, kind: 'structure',
    desc: 'Pumps groundwater across a 3-tile radius.' },
  { id: 'bund',   name: 'Stone bund',         sub: 'Half-moon ridge',
    cost: { budget: 8,  water: 0, seeds: 0 }, kind: 'modifier',
    desc: 'Slows runoff. Required to plant trees on bare sand.' },
];

export const OBJECTIVES = [
  { id: 'veg',    label: 'Restore 50% vegetation cover',
    check: (s) => s.vegPct >= 0.5, pct: (s) => s.vegPct / 0.5,
    impact: 'Halts dune migration; soil microbes recover' },
  { id: 'hyd',    label: 'Lift soil hydration past 45%',
    check: (s) => s.hydPct >= 0.45, pct: (s) => s.hydPct / 0.45,
    impact: 'Crops survive the dry season' },
  { id: 'water3', label: 'Establish 3 water sources',
    check: (s) => (s.water + s.structures) >= 3, pct: (s) => (s.water + s.structures) / 3,
    impact: 'Provides year-round drinking for 200 people' },
  { id: 'trees5', label: 'Grow 7 mature trees',
    check: (s) => s.trees >= 7, pct: (s) => s.trees / 7,
    impact: 'Canopy shelters 60+ bird and insect species' },
  { id: 'cool',   label: 'Drop heat index below 0.50',
    check: (s) => s.heat <= 0.5, pct: (s) => Math.max(0, (1 - s.heat) / 0.5),
    impact: 'Surface temp falls 6–9 °C in midday' },
];

// Deterministic PRNG — keep the world identical across reloads.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeWorld(seed = 11) {
  const rnd = mulberry32(seed);
  const tiles = [];
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const cx = COLS / 2, cy = ROWS / 2;
      const d = Math.hypot(i - cx, j - cy) / Math.hypot(cx, cy);
      let type = 'sand';
      const r = rnd();
      // The middle of the map is more degraded (old failing farmland);
      // edges have rock outcrops; sparse wisps of dry grass survive.
      if (d > 0.8 && r < 0.30) type = 'rock';
      else if (d < 0.5 && r < 0.45) type = 'degraded';
      else if (r < 0.04) type = 'rock';
      else if (r < 0.07 && d > 0.4) type = 'grass';
      tiles.push({
        i, j, type,
        age: 0,
        irrigated: 0,
        bund: false,
        placedAt: 0,    // ms timestamp when last placed (for spring animation)
      });
    }
  }
  // Seed one pioneer cluster near corner so the map doesn't look fully dead.
  for (const [i, j, t] of [[1,1,'shrub'], [2,1,'grass'], [1,2,'grass'],
                            [COLS-2, ROWS-2, 'grass'], [COLS-3, ROWS-2, 'grass']]) {
    const tile = tiles[j * COLS + i];
    if (tile) tile.type = t;
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
    if (t.type === 'pond' || t.type === 'solar') {
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

export function simulateYear(tiles) {
  let next = recomputeIrrigation(tiles);

  next = next.map((t) => {
    const tile = { ...t, age: t.age + 1 };
    if (tile.type === 'grass' && tile.irrigated === 0 && Math.random() < 0.05) tile.type = 'sand';
    if (tile.type === 'shrub' && tile.irrigated < 1 && Math.random() < 0.08) tile.type = 'grass';
    if (tile.type === 'tree' && tile.irrigated < 1 && !tile.bund && Math.random() < 0.10) tile.type = 'shrub';
    return tile;
  });

  const idx = new Map(next.map((t) => [key(t.i, t.j), t]));
  for (const t of next) {
    if (t.type === 'grass' && t.age >= 2) {
      for (const [ni, nj] of neighbors(t.i, t.j, 1, true)) {
        const n = idx.get(key(ni, nj));
        if (n && n.type === 'sand' && Math.random() < 0.18) { n.type = 'grass'; n.age = 0; n.placedAt = performance.now(); }
      }
    }
    if (t.type === 'shrub' && t.age >= 3 && t.irrigated >= 1) {
      for (const [ni, nj] of neighbors(t.i, t.j, 1, true)) {
        const n = idx.get(key(ni, nj));
        if (n && n.type === 'grass' && Math.random() < 0.10) { n.type = 'shrub'; n.age = 0; n.placedAt = performance.now(); }
      }
    }
  }
  return [...idx.values()];
}

export function passiveYield(tiles) {
  let water = 0, energy = 0, budget = 0, seeds = 0;
  for (const t of tiles) {
    if (t.type === 'pond')  water += 1;
    if (t.type === 'solar') { water += 2; energy += 2; }
    if (t.type === 'tree')  { seeds += 1; budget += 1; }
    if (t.type === 'shrub') seeds += 0.4;
  }
  return {
    water:  Math.round(water),
    energy: Math.round(energy),
    seeds:  Math.round(seeds),
    budget: Math.round(budget),
  };
}

export function computeStats(tiles) {
  const total = tiles.length;
  let veg = 0, water = 0, trees = 0, shrubs = 0, grass = 0, structures = 0;
  let hydration = 0;
  for (const t of tiles) {
    if (t.type === 'grass') { veg++; grass++; hydration += 0.3; }
    if (t.type === 'shrub') { veg++; shrubs++; hydration += 0.5; }
    if (t.type === 'tree')  { veg++; trees++; hydration += 0.65; }
    if (t.type === 'pond')  { water++; hydration += 1; }
    if (t.type === 'solar') structures++;
    hydration += t.irrigated * 0.12;
    if (t.bund) hydration += 0.05;
  }
  const vegPct = veg / total;
  const hydPct = Math.min(1, hydration / total);
  const heat = Math.max(0, 1 - (vegPct * 0.7 + hydPct * 0.4));
  const bio = Math.min(1, (grass * 1 + shrubs * 2.2 + trees * 4 + water * 3) / (total * 1.4));
  const carbon = trees * 1.8 + shrubs * 0.6 + grass * 0.2;
  return { vegPct, hydPct, heat, bio, carbon, trees, shrubs, grass, water, structures, total };
}

export const TILE_LABELS = {
  sand: 'Bare sand', degraded: 'Degraded farmland', rock: 'Rocky outcrop',
  grass: 'Native grass', shrub: 'Drought shrub', tree: 'Agroforestry tree',
  pond: 'Retention pond', solar: 'Solar pump',
};

// Field-intel headlines that scroll under the map. Mix of real and stylised
// climate news to make the world feel alive.
export const INTEL_FEED = [
  '⏵ WMO bulletin · Sahel monsoon forecast +12% for 2026',
  '⏵ Reuters · Niger pledges $40M to Great Green Wall corridor',
  '⏵ FAO · 250 million people in dryland transitions globally',
  '⏵ ESA Sentinel-2 · land surface temp at Wadi al-Bayda 47°C',
  '⏵ IPCC · 1.3°C warming amplifies Sahel droughts 2.5×',
  '⏵ Local elder, Mariama: "When the acacias come back, the birds come back"',
  '⏵ UNCCD · land degradation costs Africa $9B annually',
  '⏵ NASA GRACE · West Sahel aquifer recharge up 4% YoY',
];

// Wildlife species that spawn as the biome recovers. Each has a threshold
// on biodiversity and a preferred substrate.
export const WILDLIFE = [
  { id: 'lizard',    label: 'Desert lizard',  bioMin: 0.05, prefer: ['sand','grass','rock'], emoji: null },
  { id: 'beetle',    label: 'Dung beetle',    bioMin: 0.10, prefer: ['grass','shrub'] },
  { id: 'sparrow',   label: 'Sahel sparrow',  bioMin: 0.20, prefer: ['shrub','tree','grass'] },
  { id: 'fox',       label: 'Fennec fox',     bioMin: 0.32, prefer: ['shrub','grass'] },
  { id: 'gazelle',   label: 'Dorcas gazelle', bioMin: 0.45, prefer: ['grass','shrub'] },
  { id: 'hornbill',  label: 'Hornbill',       bioMin: 0.55, prefer: ['tree'] },
  { id: 'oryx',      label: 'Scimitar oryx',  bioMin: 0.72, prefer: ['grass','tree'] },
];



// ─── Random Event System ─────────────────────────────────────────────────────

export const EVENTS = [
  {
    id: 'drought',
    name: 'Severe Drought',
    icon: '☀️',
    color: '#C2462B',
    desc: 'Eight months without rain. The aquifer drops another metre.',
    flavour: '"We have seen worse," says Mariama. "But not much worse."',
    weight: 12,
    choices: [
      {
        label: 'Emergency bore-pump',
        sub: 'Spend budget to drill deep',
        cost: { budget: 20 },
        apply: (tiles, res) => ({
          resources: { ...res, water: Math.max(0, res.water - 8) },
          tiles,
          log: 'Emergency pump drilled — water secure but costly.',
        }),
      },
      {
        label: 'Triage — let weakest go',
        sub: 'Accept some plant losses',
        cost: {},
        apply: (tiles, res) => ({
          resources: { ...res, water: Math.max(0, res.water - 3) },
          tiles: tiles.map(t =>
            t.type === 'grass' && t.irrigated === 0 && Math.random() < 0.35
              ? { ...t, type: 'sand', age: 0 } : t),
          log: 'Drought triage — some grass lost, water partially conserved.',
        }),
      },
    ],
  },
  {
    id: 'locusts',
    name: 'Locust Swarm',
    icon: '🦗',
    color: '#8B6E3A',
    desc: 'A cloud three kilometres wide descends from the north. Grass goes first.',
    flavour: '"They pass in two days," says the radio. "But the damage stays."',
    weight: 8,
    choices: [
      {
        label: 'Biopesticide spray',
        sub: 'Costs energy, saves shrubs',
        cost: { energy: 6, budget: 12 },
        apply: (tiles, res) => ({
          resources: { ...res, energy: Math.max(0, res.energy - 6), budget: Math.max(0, res.budget - 12) },
          tiles: tiles.map(t =>
            t.type === 'grass' && Math.random() < 0.20
              ? { ...t, type: 'sand', age: 0 } : t),
          log: 'Biopesticide deployed — partial grass loss, shrubs protected.',
        }),
      },
      {
        label: 'Ride it out',
        sub: 'Save resources, lose more grass',
        cost: {},
        apply: (tiles, res) => ({
          resources: { ...res, seeds: Math.max(0, res.seeds - 4) },
          tiles: tiles.map(t =>
            t.type === 'grass' && Math.random() < 0.50
              ? { ...t, type: 'sand', age: 0 } : t),
          log: 'Swarm passed — significant grass loss across the patch.',
        }),
      },
    ],
  },
  {
    id: 'flood',
    name: 'Flash Flood',
    icon: '🌊',
    color: '#2E8DA6',
    desc: 'Three days of rain in six hours. The wadi runs for the first time in a decade.',
    flavour: '"This is what we prayed for," says the elder. "And feared."',
    weight: 9,
    choices: [
      {
        label: 'Channel the flow',
        sub: 'Build emergency berms — costly but fills ponds',
        cost: { budget: 14 },
        apply: (tiles, res) => ({
          resources: { ...res, water: res.water + 14, budget: Math.max(0, res.budget - 14) },
          tiles,
          log: 'Flash flood channelled — ponds full, infrastructure intact.',
        }),
      },
      {
        label: 'Let it run',
        sub: 'Free water but some roots wash out',
        cost: {},
        apply: (tiles, res) => ({
          resources: { ...res, water: res.water + 8 },
          tiles: tiles.map(t =>
            (t.type === 'grass' || t.type === 'shrub') && Math.random() < 0.18
              ? { ...t, type: 'sand', age: 0 } : t),
          log: 'Flood ran free — some vegetation uprooted, water table raised.',
        }),
      },
    ],
  },
  {
    id: 'ngo',
    name: 'NGO Field Visit',
    icon: '🤝',
    color: '#3F9A4F',
    desc: 'A delegation from the Great Green Wall secretariat arrives to assess the patch.',
    flavour: '"If what we see here scales," says the lead assessor, "this changes the corridor."',
    weight: 10,
    choices: [
      {
        label: 'Full site tour',
        sub: 'Time intensive but maximises funding',
        cost: {},
        trustDelta: +8,
        apply: (tiles, res) => {
          // NGO team plants demonstration shrubs at centre tiles
          const now = performance.now();
          let count = 0;
          const cx = Math.floor(tiles.reduce((s,t)=>s+t.i,0)/tiles.length);
          const cy = Math.floor(tiles.reduce((s,t)=>s+t.j,0)/tiles.length);
          const newTiles = tiles.map((t, idx) => {
            const dist = Math.abs(t.i-cx)+Math.abs(t.j-cy);
            if (dist <= 3 && t.type === 'grass' && Math.random() < 0.30) {
              count++;
              return { ...t, type: 'shrub', age: 0, placedAt: now + idx * 25 };
            }
            if (dist <= 4 && (t.type==='sand'||t.type==='degraded') && Math.random() < 0.18) {
              count++;
              return { ...t, type: 'grass', age: 0, placedAt: now + idx * 25 };
            }
            return t;
          });
          return {
            resources: { ...res, budget: res.budget + 35, seeds: res.seeds + 10 },
            tiles: newTiles,
            log: `NGO site tour complete — ${count} demonstration plantings made. Major grant received.`,
          };
        },
      },
      {
        label: 'Data package only',
        sub: 'Quick — smaller grant, keeps momentum',
        cost: {},
        apply: (tiles, res) => ({
          resources: { ...res, budget: res.budget + 18, water: res.water + 6 },
          tiles,
          log: 'NGO data package submitted — moderate grant + water allocation.',
        }),
      },
    ],
  },
  {
    id: 'heatwave',
    name: 'Extreme Heatwave',
    icon: '🌡️',
    color: '#E08C26',
    desc: '52°C for eleven days. Surface soil temperatures crack the thermometer.',
    flavour: '"The sand is moving again," says the elder. "We must hold it."',
    weight: 10,
    choices: [
      {
        label: 'Emergency mulching',
        sub: 'Spend seeds to protect root zones',
        cost: { seeds: 8, budget: 8 },
        apply: (tiles, res) => ({
          resources: { ...res, seeds: Math.max(0, res.seeds - 8), budget: Math.max(0, res.budget - 8) },
          tiles,
          log: 'Mulching saved most vegetation through the heatwave.',
        }),
      },
      {
        label: 'Irrigate what you can',
        sub: 'Spend water, save irrigated tiles',
        cost: { water: 10 },
        apply: (tiles, res) => ({
          resources: { ...res, water: Math.max(0, res.water - 10) },
          tiles: tiles.map(t =>
            t.type === 'grass' && t.irrigated === 0 && Math.random() < 0.40
              ? { ...t, type: 'sand', age: 0 } : t),
          log: 'Heatwave managed — non-irrigated grass scorched.',
        }),
      },
    ],
  },
  {
    id: 'rally',
    name: 'Community Rally',
    icon: '👥',
    color: '#3F9A4F',
    desc: 'Fifty villagers show up at dawn with shovels. The word got out.',
    flavour: '"This land fed our grandparents," says a young farmer. "It will feed ours."',
    weight: 11,
    choices: [
      {
        label: 'Planting brigade',
        sub: 'Put them to work planting grass',
        cost: {},
        trustDelta: +7,
        apply: (tiles, res) => {
          // Villagers plant grass on ~25% of bare sand/degraded tiles
          // Stagger placedAt so each tile springs in with a slight delay
          const now = performance.now();
          let count = 0;
          const newTiles = tiles.map((t, idx) => {
            if ((t.type === 'sand' || t.type === 'degraded') && Math.random() < 0.25) {
              count++;
              return { ...t, type: 'grass', age: 0, placedAt: now + idx * 18 };
            }
            return t;
          });
          return {
            resources: { ...res, seeds: res.seeds + 8, budget: res.budget + 10 },
            tiles: newTiles,
            log: `Community brigade planted grass on ${count} tiles — the patch is greening.`,
          };
        },
      },
      {
        label: 'Bund-building crew',
        sub: 'Focus on water harvesting structures',
        cost: {},
        trustDelta: +6,
        apply: (tiles, res) => {
          // Villagers bund ~30% of bare sand/degraded tiles, staggered animation
          const now = performance.now();
          let count = 0;
          const newTiles = tiles.map((t, idx) => {
            if ((t.type === 'sand' || t.type === 'degraded') && !t.bund && Math.random() < 0.30) {
              count++;
              return { ...t, bund: true, placedAt: now + idx * 22 };
            }
            return t;
          });
          return {
            resources: { ...res, water: res.water + 10, budget: res.budget + 8 },
            tiles: newTiles,
            log: `Bund crew finished — ${count} tiles now harvest rain runoff.`,
          };
        },
      },
    ],
  },
  {
    id: 'grant',
    name: 'Government Grant',
    icon: '💰',
    color: '#3F9A4F',
    desc: 'The ministry approves a restoration pilot grant. First disbursement arrives.',
    flavour: '"Don\'t spend it all at once," laughs the project coordinator.',
    weight: 9,
    choices: [
      {
        label: 'Infrastructure focus',
        sub: 'Ponds and solar pumps first',
        cost: {},
        trustDelta: +5,
        apply: (tiles, res) => {
          // Government contractors sink one pond at best available location
          const now = performance.now();
          const candidates = tiles.filter(t => t.type==='sand'||t.type==='degraded');
          const best = candidates[Math.floor(candidates.length/2)];
          const newTiles = best
            ? tiles.map(t => t.i===best.i&&t.j===best.j
                ? {...t, type:'pond', age:0, placedAt:now} : t)
            : tiles;
          return {
            resources: { ...res, budget: res.budget + 30, energy: res.energy + 8 },
            tiles: newTiles,
            log: 'Government grant: contractors sank a retention pond. Infrastructure budget allocated.',
          };
        },
      },
      {
        label: 'Planting focus',
        sub: 'Seeds and community wages first',
        cost: {},
        trustDelta: +6,
        apply: (tiles, res) => {
          const now = performance.now();
          let count = 0;
          const newTiles = tiles.map((t, idx) => {
            if ((t.type==='sand'||t.type==='degraded') && Math.random() < 0.20) {
              count++;
              return { ...t, type:'grass', age:0, placedAt: now + idx*20 };
            }
            return t;
          });
          return {
            resources: { ...res, budget: res.budget + 20, seeds: res.seeds + 14, water: res.water + 8 },
            tiles: newTiles,
            log: `Government planting crews seeded ${count} tiles. Community wages funded.`,
          };
        },
      },
    ],
  },
  {
    id: 'disease',
    name: 'Tree Disease Outbreak',
    icon: '🍂',
    color: '#8B6E3A',
    desc: 'A fungal blight moves through the older trees. Leaves yellow by week two.',
    flavour: '"We have seen this before in Mali," says the agronomist. "It passes."',
    weight: 6,
    minTrees: 4,
    choices: [
      {
        label: 'Quarantine + treat',
        sub: 'Spend budget to save most trees',
        cost: { budget: 16 },
        apply: (tiles, res) => ({
          resources: { ...res, budget: Math.max(0, res.budget - 16) },
          tiles: tiles.map(t =>
            t.type === 'tree' && Math.random() < 0.15
              ? { ...t, type: 'shrub', age: 0 } : t),
          log: 'Disease quarantine — most trees saved, some downgraded to shrub.',
        }),
      },
      {
        label: 'Natural resistance',
        sub: 'Let it run — stronger trees survive',
        cost: {},
        apply: (tiles, res) => ({
          resources: res,
          tiles: tiles.map(t =>
            t.type === 'tree' && Math.random() < 0.35
              ? { ...t, type: 'shrub', age: 0 } : t),
          log: 'Disease ran its course — significant tree loss, survivors are resilient.',
        }),
      },
    ],
  },
  {
    id: 'migration',
    name: 'Bird Migration Wave',
    icon: '🐦',
    color: '#3F9A4F',
    desc: 'Ten thousand birds stop here on the trans-Saharan route. The canopy is alive.',
    flavour: '"They used to stop here thirty years ago," says Mariama. "They remember."',
    weight: 8,
    choices: [
      {
        label: 'Document and protect',
        sub: 'Gains conservation funding',
        cost: {},
        apply: (tiles, res) => ({
          resources: { ...res, budget: res.budget + 20, seeds: res.seeds + 8 },
          tiles,
          log: 'Bird migration documented — conservation grant and seed donation received.',
        }),
      },
    ],
  },
];

// Roll for an event this year. Returns an event object or null.
export function rollEvent(year, tiles, stats, level) {
  // Events start from year 2 onward; not every year
  if (year < 2) return null;
  // Base 40% chance per year, increases with time pressure
  if (Math.random() > 0.40) return null;

  // Use level-specific events if available, fall back to global EVENTS
  const eventPool = (level?.events && level.events.length > 0) ? level.events : EVENTS;

  // Filter eligible events
  const pool = eventPool.filter(e => {
    if (e.minTrees && stats.trees < e.minTrees) return false;
    return true;
  });

  // Weighted random pick
  const totalWeight = pool.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const e of pool) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return pool[pool.length - 1];
}

// ─── Trust System ─────────────────────────────────────────────────────────────
export const TRUST_LEVELS = [
  { min: 0,  label: 'Hostile',    color: '#C2462B' },
  { min: 20, label: 'Sceptical',  color: '#E08C26' },
  { min: 40, label: 'Watching',   color: '#D9AC6A' },
  { min: 60, label: 'Supportive', color: '#7BB75D' },
  { min: 80, label: 'Champions',  color: '#3F9A4F' },
];

export function getTrustLevel(trust) {
  let level = TRUST_LEVELS[0];
  for (const l of TRUST_LEVELS) { if (trust >= l.min) level = l; }
  return level;
}

// Trust deltas for actions
export const TRUST_DELTAS = {
  grass:   +2,  shrub:  +3,  tree:    +5,
  pond:    +4,  solar:  +2,  bund:    +3,
  remove:  -2,
  // Event choices
  drought_pump:   -3,  drought_triage: -6,
  locusts_spray:  +3,  locusts_rideout:-4,
  flood_channel:  +5,  flood_runfree:  -2,
  ngo_tour:       +8,  ngo_data:       +4,
  heat_mulch:     +4,  heat_irrigate:  +2,
  rally_plant:    +7,  rally_bund:     +6,
  grant_infra:    +5,  grant_planting: +6,
  disease_treat:  +4,  disease_natural:-3,
  migration:      +6,
};

// ─── Fire & Flood tile logic ───────────────────────────────────────────────────

// Ignite random vegetated tiles in a radius around epicentre
export function applyFire(tiles, epicentreI, epicentreJ, radius = 2) {
  return tiles.map(t => {
    const dist = Math.abs(t.i - epicentreI) + Math.abs(t.j - epicentreJ);
    if (dist > radius) return t;
    if (!['grass','shrub','tree'].includes(t.type)) return t;
    if (Math.random() < 0.65) return { ...t, burning: true };
    return t;
  });
}

// Spread fire one step and burn tiles
export function spreadFire(tiles) {
  const idx = new Map(tiles.map(t => [key(t.i, t.j), t]));
  const next = tiles.map(t => ({ ...t }));
  const nextIdx = new Map(next.map(t => [key(t.i, t.j), t]));

  for (const t of tiles) {
    if (!t.burning) continue;
    // Burn the tile itself
    const me = nextIdx.get(key(t.i, t.j));
    if (me.type === 'grass') { me.type = 'degraded'; me.burning = false; me.age = 0; }
    else if (me.type === 'shrub') { me.type = 'grass'; me.burning = false; me.age = 0; }
    else if (me.type === 'tree') { me.type = 'shrub'; me.burning = false; me.age = 0; }
    else { me.burning = false; }

    // Spread to neighbours
    for (const [ni, nj] of neighbors(t.i, t.j, 1, true)) {
      const n = nextIdx.get(key(ni, nj));
      if (!n || n.burning) continue;
      if (['grass','shrub','tree'].includes(n.type) && Math.random() < 0.35) {
        n.burning = true;
      }
    }
  }
  return next;
}

// Apply flood — raises water on low tiles, damages plants
export function applyFlood(tiles, epicentreI, epicentreJ, radius = 3) {
  return tiles.map(t => {
    const dist = Math.abs(t.i - epicentreI) + Math.abs(t.j - epicentreJ);
    if (dist > radius) return t;
    if (t.type === 'rock') return t;
    if (['grass','shrub'].includes(t.type) && Math.random() < 0.30) {
      return { ...t, flooded: true, type: dist <= 1 ? 'sand' : t.type };
    }
    if (t.type === 'sand' || t.type === 'degraded') {
      return { ...t, flooded: true };
    }
    return { ...t, flooded: true };
  });
}

// Drain flood over time
export function drainFlood(tiles) {
  return tiles.map(t => t.flooded ? { ...t, flooded: false } : t);
}