import { key, neighbors } from './engine.js';

// levels.js — Content config for all 5 levels of the eco-game.
//
// Each level is data only. Mechanic twists are pure functions over tiles.
// The engine.js + view-*.jsx files consume these configs.

// ─── Level 1 · Desert Bloom ─────────────────────────────────────────────────

export const LEVEL_DESERT = {
  id: 'desert',
  number: 1,
  name: 'Desert Bloom',
  resourceNames: { primary:'Water', secondary:'Seeds', energy:'Energy' },
  subtitle: 'Biome Reclamation',
  location: 'Wadi al-Bayda · Sahel Corridor',
  coords: 'N 14°47′ · E 1°22′',
  blurb: 'Reclaim 12 acres of cracked Sahel before the dunes win it.',
  theme: 'sunset',
  difficulty: {
    easy:   { budget: 240, primary: 80, secondary: 60, energy: 30, years: 30 },
    normal: { budget: 150, primary: 50, secondary: 40, energy: 18, years: 25 },
    hard:   { budget:  95, primary: 30, secondary: 28, energy: 10, years: 20 },
  },
  resourceLabels: { budget: 'Budget', primary: 'Water', secondary: 'Seeds', energy: 'Energy' },
  guide: { initials: 'SA', name: 'Sahel Almami', role: 'Field ecologist' },
  canopyRequiresHint: 'Trees need irrigation or a bund',
  pioneerSeeds: [[1,1,'shrub'], [2,1,'pioneer'], [1,2,'pioneer'],
                  [12,8,'pioneer'], [11,8,'pioneer']],
  seed: 11,
  damagedRate: 0.45,
  obstacleRate: 0.30,
  vocab: {
    soil:     { name: 'Bare sand',         deco: 'sand' },
    damaged:  { name: 'Degraded farmland', deco: 'cracks' },
    obstacle: { name: 'Rocky outcrop',     deco: 'rocks' },
    pioneer:  { name: 'Native grass',      deco: 'grass' },
    shrub:    { name: 'Drought shrub',     deco: 'shrub' },
    canopy:   { name: 'Acacia tree',       deco: 'tree' },
    water:    { name: 'Retention pond',    deco: 'pond' },
    energy:   { name: 'Solar pump',        deco: 'solar' },
    modifier: { name: 'Stone bund',        deco: 'bund' },
  },
  actions: [
    { id: 'pioneer',  targetRole: 'pioneer', name: 'Native grass',
      sub: 'Drought-hardy cover',  cost: { budget: 5,  primary: 2, secondary: 3 }, kind: 'plant',
      desc: 'Stabilises soil. Spreads naturally.' },
    { id: 'shrub',    targetRole: 'shrub',   name: 'Drought shrub',
      sub: 'Acacia, mesquite',     cost: { budget: 12, primary: 5, secondary: 4 }, kind: 'plant',
      desc: 'Cools microclimate, hosts pollinators.' },
    { id: 'canopy',   targetRole: 'canopy',  name: 'Agroforestry tree',
      sub: 'Canopy + nut yield',   cost: { budget: 25, primary: 8, secondary: 6 }, kind: 'plant',
      desc: 'High biodiversity. Needs irrigation or a bund.' },
    { id: 'water',    targetRole: 'water',   name: 'Retention pond',
      sub: 'Stores rainfall',       cost: { budget: 30, primary: 15 },              kind: 'water',
      desc: 'Irrigates 8 neighbours. +1 water/year.' },
    { id: 'energy',   targetRole: 'energy',  name: 'Solar pump',
      sub: 'PV + bore pump',        cost: { budget: 40, energy: 10 },                kind: 'structure',
      desc: 'Pumps groundwater across a 3-tile radius.' },
    { id: 'modifier', targetRole: 'modifier', name: 'Stone bund',
      sub: 'Half-moon ridge',       cost: { budget: 8 },                             kind: 'modifier',
      desc: 'Slows runoff. Required for trees on bare sand.' },
  ],
  objectives: [
    { id: 'veg',    label: 'Restore 50% vegetation cover',
      check: (s) => s.vegPct >= 0.5, pct: (s) => s.vegPct / 0.5,
      impact: 'Halts dune migration; soil microbes recover' },
    { id: 'hyd',    label: 'Lift soil hydration past 45%',
      check: (s) => s.hydPct >= 0.45, pct: (s) => s.hydPct / 0.45,
      impact: 'Crops survive the dry season' },
    { id: 'water3', label: 'Establish 3 water sources',
      check: (s) => (s.water + s.structures) >= 3, pct: (s) => (s.water + s.structures) / 3,
      impact: 'Year-round drinking water for 200 people' },
    { id: 'trees5', label: 'Grow 7 mature trees',
      check: (s) => s.canopy >= 7, pct: (s) => s.canopy / 7,
      impact: 'Canopy shelters 60+ bird and insect species' },
    { id: 'cool',   label: 'Drop heat index below 0.50',
      check: (s) => s.heat <= 0.5, pct: (s) => Math.max(0, (1 - s.heat) / 0.5),
      impact: 'Surface temp falls 6–9 °C in midday' },
  ],
  wildlife: [
    { id: 'lizard',   label: 'Desert lizard',  bioMin: 0.05, prefer: ['soil','pioneer','obstacle'] },
    { id: 'sparrow',  label: 'Sahel sparrow',  bioMin: 0.20, prefer: ['shrub','canopy','pioneer'] },
    { id: 'fox',      label: 'Fennec fox',     bioMin: 0.32, prefer: ['shrub','pioneer'] },
    { id: 'gazelle',  label: 'Dorcas gazelle', bioMin: 0.50, prefer: ['pioneer','shrub'] },
    { id: 'oryx',     label: 'Scimitar oryx',  bioMin: 0.72, prefer: ['pioneer','canopy'] },
  ],
  intelFeed: [
    '⏵ WMO bulletin · Sahel monsoon forecast +12% for 2026',
    '⏵ Reuters · Niger pledges $40M to Great Green Wall corridor',
    '⏵ FAO · 250M people in dryland transitions globally',
    '⏵ ESA Sentinel-2 · land surface temp at Wadi al-Bayda 47°C',
    '⏵ IPCC · 1.3°C warming amplifies Sahel droughts 2.5×',
    '⏵ Elder Mariama: "When the acacias come back, the birds come back"',
    '⏵ UNCCD · land degradation costs Africa $9B annually',
  ],
  narration: (year, completed, stats, diff) => {
    if (completed) return '"You\'ve done it — this patch will keep recovering on its own."';
    if (year === 0) return '"Start with bunds and grass on the cracked patches. Bunds hold the rain."';
    if (year < 4) return '"Watch the water budget. Each pond irrigates a 3-tile ring."';
    if (year < 9) return '"Grass establishing — good. Drop shrubs in next."';
    if (year < 16) return '"Your biodiversity is climbing. Birds are returning. Push for canopy."';
    if (year >= diff.years - 3) return '"Clock is running out. Focus the shortest objective bar."';
    return '"Push for 50% vegetation and your heat index falls with it."';
  },
  intro: {
    bigNumber: 12, bigNumberLabel: 'M hectares',
    bigNumberCap: 'of Sahel grassland lost to desertification since 1990. This is one of them.',
    lede: 'You are the field lead on a 12-acre patch the desert has been taking back for thirty years. The community wants it to grow grain again. Your job: prove a playbook that scales.',
  },
  win: {
    title: 'The dunes are losing.',
    lede: 'Wadi al-Bayda hit stable recovery in {{years}} years. Grass holds the topsoil; tree roots reach the perched aquifer.',
    citation: 'Niger\'s Maradi region used the same techniques — half-moon bunds, native grass, then nitrogen-fixing acacia. 200 million trees regenerated since 1984.',
  },
  impactScale: {
    acres: 12_000,
    label: '12,000 acres · Sahel corridor',
    metrics: [
      { unit: 'tCO₂ / yr sequestered',  calc: (s, f) => Math.round(s.carbon * f) },
      { unit: 'trees established',      calc: (s, f) => Math.round(s.canopy * f) },
      { unit: 'people food-secure',     calc: (s, f) => Math.round((s.canopy * 4 + s.shrubs * 1.5) * f) },
      { unit: 'ML water captured',      calc: (s, f) => Math.round(s.water * 1.2 * f) },
    ],
  },
};

// ─── Level 2 · Coastal Crisis ───────────────────────────────────────────────
// Mechanic twist: untreated 'damaged' (oil-slick) tiles propagate to adjacent
// water tiles each year unless a 'modifier' (oil boom) blocks the spread.

export const LEVEL_COASTAL = {
  id: 'coastal',
  number: 2,
  name: 'Coastal Crisis',
  resourceNames: { primary:'Water', secondary:'Seedlings', energy:'Power' },
  subtitle: 'Mangrove Restoration',
  location: 'Niger Delta · Bonny estuary',
  coords: 'N 4°25′ · E 7°10′',
  blurb: 'Contain an oil spill and rebuild the mangrove curtain that protects 800 km of coast.',
  theme: 'coastal',
  difficulty: {
    easy:   { budget: 280, primary: 80, secondary: 60, energy: 30, years: 30 },
    normal: { budget: 180, primary: 50, secondary: 40, energy: 18, years: 25 },
    hard:   { budget: 110, primary: 30, secondary: 28, energy: 10, years: 20 },
  },
  resourceLabels: { budget: 'Budget', primary: 'Boats', secondary: 'Saplings', energy: 'Crew' },
  guide: { initials: 'AE', name: 'Adaeze Eboh', role: 'Marine biologist' },
  canopyRequiresHint: 'Mangroves need a wetland or boom nearby',
  pioneerSeeds: [[2,2,'pioneer'], [12,9,'pioneer'], [11,9,'pioneer']],
  seed: 23,
  damagedRate: 0.55,
  obstacleRate: 0.10,
  vocab: {
    soil:     { name: 'Tidal flat',     deco: 'sand-wet' },
    damaged:  { name: 'Oil slick',      deco: 'oil' },
    obstacle: { name: 'Reef outcrop',   deco: 'reef' },
    pioneer:  { name: 'Saltmarsh',      deco: 'marsh' },
    shrub:    { name: 'Mangrove sapling', deco: 'mangrove-young' },
    canopy:   { name: 'Mature mangrove', deco: 'mangrove' },
    water:    { name: 'Wetland pool',   deco: 'wetland' },
    energy:   { name: 'Skim platform',  deco: 'platform' },
    modifier: { name: 'Oil boom',       deco: 'boom' },
  },
  actions: [
    { id: 'pioneer',  targetRole: 'pioneer', name: 'Plant saltmarsh',
      sub: 'Spartina cordgrass',    cost: { budget: 6, primary: 1, secondary: 3 }, kind: 'plant',
      desc: 'Filters water, traps sediment, spreads naturally.' },
    { id: 'shrub',    targetRole: 'shrub',   name: 'Plant young mangrove',
      sub: 'Red mangrove sapling',  cost: { budget: 14, primary: 3, secondary: 4 }, kind: 'plant',
      desc: 'Stabilises banks. Grows into canopy within 5 years.' },
    { id: 'canopy',   targetRole: 'canopy',  name: 'Mature mangrove',
      sub: 'Direct transplant',     cost: { budget: 28, primary: 5, secondary: 8 }, kind: 'plant',
      desc: 'Storm buffer. Needs a wetland or boom adjacent.' },
    { id: 'water',    targetRole: 'water',   name: 'Wetland pool',
      sub: 'Dredged retention basin', cost: { budget: 34, primary: 10 }, kind: 'water',
      desc: 'Filters runoff. Supports 8 surrounding tiles.' },
    { id: 'energy',   targetRole: 'energy',  name: 'Oil skim platform',
      sub: 'Mechanical skimmer',    cost: { budget: 45, energy: 12 }, kind: 'structure',
      desc: 'Cleans adjacent water. Reduces slick spread.' },
    { id: 'modifier', targetRole: 'modifier', name: 'Oil boom',
      sub: 'Floating containment',  cost: { budget: 9 }, kind: 'modifier',
      desc: 'Blocks oil from spreading to this tile.' },
  ],
  objectives: [
    { id: 'oilfree', label: 'Contain spill (<10% slick)',
      check: (s) => s.damagedPct <= 0.10, pct: (s) => Math.max(0, (0.30 - s.damagedPct) / 0.20),
      impact: '120 km of shoreline cleared for fishing' },
    { id: 'mang5',   label: '7 mature mangrove stands',
      check: (s) => s.canopy >= 7, pct: (s) => s.canopy / 7,
      impact: 'Storm surge damages drop 40%' },
    { id: 'cover',   label: '50% wetland cover',
      check: (s) => s.vegPct >= 0.5, pct: (s) => s.vegPct / 0.5,
      impact: 'Fish nurseries return; shrimp catch up 3×' },
    { id: 'wetlands', label: 'Build 3 wetland pools',
      check: (s) => s.water >= 3, pct: (s) => s.water / 3,
      impact: 'Filters 4M L/yr of estuarine runoff' },
    { id: 'bio',     label: 'Biodiversity index past 0.5',
      check: (s) => s.bio >= 0.5, pct: (s) => s.bio / 0.5,
      impact: 'Hawksbill turtles and herons return' },
  ],
  wildlife: [
    { id: 'crab',     label: 'Fiddler crab',   bioMin: 0.05, prefer: ['pioneer','soil'] },
    { id: 'heron',    label: 'Mangrove heron', bioMin: 0.22, prefer: ['canopy','water'] },
    { id: 'turtle',   label: 'Hawksbill turtle', bioMin: 0.38, prefer: ['water','soil'] },
    { id: 'dolphin',  label: 'Pink river dolphin', bioMin: 0.55, prefer: ['water'] },
    { id: 'monkey',   label: 'Putty-nosed monkey', bioMin: 0.70, prefer: ['canopy'] },
  ],
  intelFeed: [
    '⏵ NOAA · Niger Delta oil spill 9,000 bbl spread overnight',
    '⏵ UNEP · mangrove loss in West Africa 1% per year',
    '⏵ Local cooperative: "Skimming saves the season"',
    '⏵ Reuters · Shell agrees $1.2B Niger Delta restitution',
    '⏵ Sci. paper · mangroves store 3× the carbon of rainforest',
    '⏵ WWF · estuary supports 60 fish species',
    '⏵ Bonny tide forecast · 1.4 m peak Thursday',
  ],
  narration: (year, completed, stats, diff) => {
    if (completed) return '"The mangrove curtain is back. Storm surges will break here, not on the village."';
    if (year === 0) return '"Drop oil booms around the spill first. Every untreated tile spreads next year."';
    if (year < 4) return '"Skim platforms clean adjacent water. Place them where the slick is densest."';
    if (year < 9) return '"Saltmarsh first — it filters before you bring mangrove saplings in."';
    if (year < 16) return '"Heron sightings are up. Move to mature mangrove for storm protection."';
    if (year >= diff.years - 3) return '"Tide is rising. Focus on canopy and contain the last slick patches."';
    return '"Wetland pools amplify everything around them. Drop more if you can."';
  },
  intro: {
    bigNumber: 35, bigNumberLabel: 'M people',
    bigNumberCap: 'rely on West Africa\'s mangroves for fish, fuel, and storm protection.',
    lede: 'A pipeline ruptured 9,000 barrels last week. The slick is creeping through the estuary. You have crews, booms, and 25 years to rebuild what protects the coast.',
  },
  win: {
    title: 'The estuary breathes again.',
    lede: 'Bonny is restored in {{years}} years. Slick contained, mangroves towering, fish nurseries thriving.',
    citation: 'Vietnam\'s Mekong Delta restored 28,000 ha of mangrove between 2008-2020. Storm damage in protected villages fell 40%.',
  },
  impactScale: {
    acres: 28_000,
    label: '28,000 ha · West African coast',
    metrics: [
      { unit: 'tCO₂ / yr sequestered',     calc: (s, f) => Math.round(s.carbon * 3 * f) },
      { unit: 'mangrove stands',           calc: (s, f) => Math.round(s.canopy * f) },
      { unit: 'fish nursery hectares',     calc: (s, f) => Math.round(s.vegPct * f * 100) },
      { unit: 'people storm-protected',    calc: (s, f) => Math.round((s.canopy * 12 + s.shrubs * 5) * f) },
    ],
  },
  // Twist — each year, untreated oil tiles infect adjacent tidal flats.
  simulateTwist: (tiles) => {
    const idx = new Map(tiles.map((t) => [key(t.i, t.j), t]));
    for (const t of tiles) {
      if (t.role === 'damaged' && !t.modifier) {
        for (const [ni, nj] of neighbors(t.i, t.j, 1, true)) {
          const n = idx.get(key(ni, nj));
          if (!n) continue;
          if (n.modifier) continue;            // boom blocks
          if (n.role === 'soil' && Math.random() < 0.14) {
            n.role = 'damaged'; n.age = 0;
          }
        }
      }
      // Slow natural decay — energy structures (skim platforms) help
      if (t.role === 'damaged') {
        let cleanForce = 0;
        for (const [ni, nj] of neighbors(t.i, t.j, 1)) {
          const n = idx.get(key(ni, nj));
          if (n && (n.role === 'energy' || n.role === 'water')) cleanForce += 1;
        }
        if (cleanForce > 0 && Math.random() < 0.10 * cleanForce) {
          t.role = 'soil'; t.age = 0; t.placedAt = performance.now();
        }
      }
    }
    return [...idx.values()];
  },
  events: [
    {
      id: 'oil_surge', name: 'Oil Surge', icon: '🛢️', color: '#1A1208', weight: 12,
      desc: 'A new pipeline rupture has doubled the slick overnight.',
      flavour: '"Every hour counts," says Adaeze. "The booms won\'t hold forever."',
      choices: [
        { label: 'Emergency skim teams', sub: 'Deploy extra crew', cost:{ budget:18 },
          apply:(tiles,res)=>({ resources:{...res,primary:Math.max(0,res.primary-6)}, tiles, log:'Emergency teams deployed — spill contained but resources strained.' }) },
        { label: 'Let it spread, focus on mangroves', sub: 'Accept the loss',
          apply:(tiles,res)=>({ resources:res, tiles:tiles.map(t=>t.role==='soil'&&Math.random()<0.25?{...t,role:'damaged',deco:'oil'}:t), log:'Spill spread — 3 new tiles contaminated.' }) },
      ]
    },
    {
      id: 'storm_surge', name: 'Storm Surge', icon: '🌊', color: '#1A4A6A', weight: 10,
      desc: 'Atlantic surge pushes saltwater 2 km inland. Coastal vegetation at risk.',
      flavour: '"We built here knowing the sea would come," says the chief fisherman.',
      choices: [
        { label: 'Reinforce gabion barriers', sub: 'Spend water + budget',
          cost:{ budget:16, primary:8 },
          apply:(tiles,res)=>({ resources:{...res,primary:Math.max(0,res.primary-8)}, tiles, log:'Gabions held. Storm damage minimal.' }) },
        { label: 'Evacuate and wait',
          apply:(tiles,res)=>({ resources:res, tiles:tiles.map(t=>['pioneer','shrub'].includes(t.role)&&Math.random()<0.35?{...t,role:'damaged'}:t), log:'Storm rolled through — several young plantings lost.' }) },
      ]
    },
    {
      id: 'fishing_coop', name: 'Fishing Cooperative Grant', icon: '🐟', color: '#2A8A5A', weight: 8,
      desc: 'Local cooperative offers resources in exchange for protecting their fishing grounds.',
      flavour: '"Healthy mangroves mean healthy catch. We\'ll help."',
      choices: [
        { label: 'Accept the partnership', sub: 'Gain resources + trust',
          apply:(tiles,res)=>({ resources:{...res,budget:res.budget+25,secondary:res.secondary+10}, tiles, log:'Cooperative partnership secured. +25 budget, +10 saplings.' }) },
        { label: 'Decline — maintain independence',
          apply:(tiles,res)=>({ resources:res, tiles, log:'Declined the cooperative. Work continues independently.' }) },
      ]
    },
    {
      id: 'turtle_nesting', name: 'Hawksbill Nesting Season', icon: '🐢', color: '#4A7848', weight: 6,
      desc: 'Hawksbill turtles are nesting on the beach. Any disturbance risks the clutch.',
      flavour: '"They have been coming here for 10,000 years," says the ranger.',
      choices: [
        { label: 'Restrict activity, protect nests', sub: 'Lose 1 turn of placement',
          apply:(tiles,res)=>({ resources:{...res,secondary:res.secondary+5}, tiles, log:'Nests protected. Biodiversity bonus incoming.' }) },
        { label: 'Continue work cautiously',
          apply:(tiles,res)=>({ resources:res, tiles, log:'Continued work. Some nests disturbed.' }) },
      ]
    },
    {
      id: 'ngo_vessel', name: 'NGO Vessel Arrives', icon: '🚢', color: '#2A6A9A', weight: 7,
      desc: 'An international NGO vessel offers bioremediation equipment.',
      flavour: '"We have the tech. You have the local knowledge. Let\'s combine them."',
      choices: [
        { label: 'Accept the equipment', sub: 'Gain skim capacity',
          apply:(tiles,res)=>({ resources:{...res,energy:res.energy+12,budget:res.budget+15}, tiles, log:'NGO equipment onboarded. Skim capacity doubled.' }) },
        { label: 'Request mangrove seedlings instead',
          apply:(tiles,res)=>({ resources:{...res,secondary:res.secondary+20}, tiles, log:'20 additional mangrove saplings received.' }) },
      ]
    },
  ],
};

// ─── Level 3 · Urban Heat Trap ──────────────────────────────────────────────
// Mechanic twist: heat is computed entirely differently — concrete + buildings
// add heat, green cover removes. Trees on building tiles ARE allowed (green roof).

export const LEVEL_URBAN = {
  id: 'urban',
  number: 3,
  name: 'Urban Heat Trap',
  resourceNames: { primary:'Water', secondary:'Plants', energy:'Power' },
  subtitle: 'Cooling the City',
  location: 'Karachi · Saddar district · 12 city blocks',
  coords: 'N 24°51′ · E 67°00′',
  blurb: 'Drop the lethal heat-island effect over a dense, low-income neighborhood.',
  theme: 'urban',
  difficulty: {
    easy:   { budget: 320, primary: 80, secondary: 60, energy: 40, years: 25 },
    normal: { budget: 210, primary: 50, secondary: 40, energy: 25, years: 20 },
    hard:   { budget: 130, primary: 30, secondary: 28, energy: 14, years: 15 },
  },
  resourceLabels: { budget: 'Budget', primary: 'Permits', secondary: 'Saplings', energy: 'kW' },
  guide: { initials: 'ZK', name: 'Zoya Khan', role: 'Urban planner' },
  canopyRequiresHint: 'Street trees need a rain garden adjacent',
  pioneerSeeds: [[1,1,'pioneer'], [12,8,'pioneer']],
  seed: 37,
  damagedRate: 0.55,
  obstacleRate: 0.35,
  vocab: {
    soil:     { name: 'Concrete plaza',  deco: 'concrete' },
    damaged:  { name: 'Asphalt parking', deco: 'asphalt' },
    obstacle: { name: 'Existing building', deco: 'building' },
    pioneer:  { name: 'Pocket lawn',     deco: 'lawn' },
    shrub:    { name: 'Street planting', deco: 'planter' },
    canopy:   { name: 'Mature street tree', deco: 'tree' },
    water:    { name: 'Rain garden',     deco: 'rain-garden' },
    energy:   { name: 'Cool pavement +PV', deco: 'cool-pave' },
    modifier: { name: 'Green roof',      deco: 'green-roof' },
  },
  actions: [
    { id: 'pioneer',  targetRole: 'pioneer', name: 'Pocket lawn',
      sub: 'Native ground cover',  cost: { budget: 8, primary: 2, secondary: 2 }, kind: 'plant',
      desc: 'Cools immediate surface. Spreads slowly.' },
    { id: 'shrub',    targetRole: 'shrub',   name: 'Street planter',
      sub: 'Shrubs + flowering plants', cost: { budget: 16, primary: 4, secondary: 4 }, kind: 'plant',
      desc: 'Lowers temp 2°C in a 1-block radius.' },
    { id: 'canopy',   targetRole: 'canopy',  name: 'Mature street tree',
      sub: 'Neem, gulmohar',       cost: { budget: 32, primary: 8, secondary: 6 }, kind: 'plant',
      desc: 'Shade canopy. Needs a rain garden or green roof nearby.' },
    { id: 'water',    targetRole: 'water',   name: 'Rain garden',
      sub: 'Bioswale + retention', cost: { budget: 40, primary: 12 }, kind: 'water',
      desc: 'Filters stormwater. Cools 8 surrounding tiles.' },
    { id: 'energy',   targetRole: 'energy',  name: 'Cool pavement + PV',
      sub: 'Reflective + solar',   cost: { budget: 55, energy: 14 }, kind: 'structure',
      desc: 'Reflects heat, generates power for cooling pumps.' },
    { id: 'modifier', targetRole: 'modifier', name: 'Green roof',
      sub: 'Lightweight sedum',    cost: { budget: 14 }, kind: 'modifier',
      desc: 'Adds vegetation to a paved tile. Required for trees.' },
  ],
  objectives: [
    { id: 'cool',   label: 'Drop heat index below 0.45',
      check: (s) => s.heat <= 0.45, pct: (s) => Math.max(0, (1 - s.heat) / 0.55),
      impact: 'Heat-related ER visits fall 28%' },
    { id: 'cover', label: '40% green cover',
      check: (s) => s.vegPct >= 0.4, pct: (s) => s.vegPct / 0.4,
      impact: 'PM2.5 in air drops by 15%' },
    { id: 'trees', label: '8 mature street trees',
      check: (s) => s.canopy >= 8, pct: (s) => s.canopy / 8,
      impact: 'Daytime sidewalk temp 8 °C cooler' },
    { id: 'rain',  label: 'Build 3 rain gardens',
      check: (s) => s.water >= 3, pct: (s) => s.water / 3,
      impact: 'Monsoon flooding contained in district' },
    { id: 'mod',   label: 'Add green roofs to 6 buildings',
      check: (s) => tilesWithModifier(s) >= 6, pct: (s) => tilesWithModifier(s) / 6,
      impact: 'Top-floor temperatures drop 5°C' },
  ],
  wildlife: [
    { id: 'sparrow',  label: 'House sparrow', bioMin: 0.06, prefer: ['shrub','canopy','pioneer'] },
    { id: 'parakeet', label: 'Rose-ringed parakeet', bioMin: 0.20, prefer: ['canopy'] },
    { id: 'crow',     label: 'House crow',   bioMin: 0.10, prefer: ['canopy','obstacle'] },
    { id: 'cat',      label: 'Street cat',   bioMin: 0.15, prefer: ['shrub','obstacle','pioneer'] },
    { id: 'mongoose', label: 'Mongoose',     bioMin: 0.45, prefer: ['shrub','pioneer'] },
  ],
  intelFeed: [
    '⏵ Karachi Met · 47°C heat wave Day 14',
    '⏵ Pakistan Today · 1,200 heat-related ER visits this week',
    '⏵ WHO · urban heat will kill 2.5M annually by 2050',
    '⏵ Mayor announces $14M green-roof subsidy',
    '⏵ ETH Zürich · every street tree cools 0.4 km²',
    '⏵ Aunty Naseem: "Old trees, like grandparents — keep them"',
    '⏵ Bloomberg · cool pavements cut peak temp 6 °C',
  ],
  narration: (year, completed, stats, diff) => {
    if (completed) return '"You broke the heat wave. The neighborhood can breathe again."';
    if (year === 0) return '"Rain gardens first — they let you put street trees on concrete tiles."';
    if (year < 4) return '"Green roofs convert any asphalt block into a tree-ready plot."';
    if (year < 9) return '"Cover the parking lots with pocket lawns. The cooling stacks up."';
    if (year < 14) return '"Sparrows are back. Push canopy now — that\'s the real shade."';
    if (year >= diff.years - 3) return '"Monsoon coming. Last gardens you can afford should go in."';
    return '"Don\'t neglect the periphery. The block\'s heat seeps in from the edges."';
  },
  intro: {
    bigNumber: 47, bigNumberLabel: '°C',
    bigNumberCap: 'recorded street temperature in Karachi last June — the deadliest urban climate threat.',
    lede: 'A 12-block district of asphalt, concrete, and tin roofs. 6,000 residents. Your job: prove that planted shade and water can save lives in cities like this one.',
  },
  win: {
    title: 'The block can breathe.',
    lede: 'Saddar dropped peak temps in {{years}} years. ER visits down, top-floor flats livable again, kids playing outside before dusk.',
    citation: 'Medellín planted 8,300 trees on 30 corridors and dropped city temperature 2 °C in 3 years. Mortality from heat-related illness fell 5%.',
  },
  impactScale: {
    acres: 5_000,
    label: '5,000 acres · greater Karachi',
    metrics: [
      { unit: 'people heat-protected', calc: (s, f) => Math.round((s.canopy * 80 + s.shrubs * 30) * f) },
      { unit: 'street trees',          calc: (s, f) => Math.round(s.canopy * f) },
      { unit: 'ML stormwater captured',calc: (s, f) => Math.round(s.water * 1.5 * f) },
      { unit: '°C drop at peak',       calc: (s)    => +(s.vegPct * 6 + (s.water / 30) * 2).toFixed(1) },
    ],
  },
  events: [
    {
      id: 'heat_dome', name: 'Heat Dome', icon: '🌡️', color: '#C2462B', weight: 14,
      desc: 'A stationary high pressure system has trapped heat over the city for 8 days.',
      flavour: '"The hospitals are full," reports the city health officer.',
      choices: [
        { label: 'Emergency cooling centres', sub: 'Spend budget to open shelters',
          cost:{ budget:20 },
          apply:(tiles,res)=>({ resources:{...res,primary:res.primary+5}, tiles, log:'Cooling centres opened. Heat casualties reduced.' }) },
        { label: 'Accelerate green roof deployment', sub: 'Double energy cost this turn',
          cost:{ energy:15 },
          apply:(tiles,res)=>({ resources:{...res,energy:Math.max(0,res.energy-10)}, tiles, log:'Emergency green roof push. Heat index dropping.' }) },
      ]
    },
    {
      id: 'municipal_grant', name: 'Municipal Climate Grant', icon: '🏛️', color: '#2A7A4A', weight: 9,
      desc: 'The city council approved emergency green infrastructure funding.',
      flavour: '"The data convinced them. Two consecutive 47°C days will do that."',
      choices: [
        { label: 'Accept the full grant', sub: 'Budget injection',
          apply:(tiles,res)=>({ resources:{...res,budget:res.budget+40}, tiles, log:'Municipal grant received. +40 budget.' }) },
        { label: 'Request technical crew support instead',
          apply:(tiles,res)=>({ resources:{...res,energy:res.energy+20,secondary:res.secondary+15}, tiles, log:'Technical crew dispatched. +20 energy, +15 seeds.' }) },
      ]
    },
    {
      id: 'urban_flooding', name: 'Flash Flood', icon: '⛈️', color: '#1A4A7A', weight: 10,
      desc: 'Impermeable surfaces have channelled rainfall into a flash flood.',
      flavour: '"The drains can\'t cope. We need more permeable surface."',
      choices: [
        { label: 'Emergency drainage work', sub: 'Spend budget',
          cost:{ budget:15 },
          apply:(tiles,res)=>({ resources:{...res,primary:res.primary+10}, tiles, log:'Drainage improved. Water absorbed. +10 water.' }) },
        { label: 'Document for planning report',
          apply:(tiles,res)=>({ resources:{...res,budget:res.budget+10}, tiles:tiles.map(t=>['pioneer'].includes(t.role)&&Math.random()<0.2?{...t,role:'soil'}:t), log:'Flooding data documented. Some lawns washed out.' }) },
      ]
    },
    {
      id: 'cycling_rally', name: 'Community Cycling Rally', icon: '🚲', color: '#4A8A3A', weight: 7,
      desc: 'Residents demand more cycling infrastructure and green corridors.',
      flavour: '"Every street we convert is a 3°C reduction in that block."',
      choices: [
        { label: 'Support the movement', sub: 'Gain community trust + budget',
          apply:(tiles,res)=>({ resources:{...res,budget:res.budget+20}, tiles, log:'Community support galvanised. +20 budget, trust rising.' }) },
        { label: 'Defer to next planning cycle',
          apply:(tiles,res)=>({ resources:res, tiles, log:'Deferred. Community disappointed.' }) },
      ]
    },
    {
      id: 'heat_island_study', name: 'University Heat Study', icon: '🔬', color: '#6A5A9A', weight: 6,
      desc: 'Researchers offer to install sensor networks in exchange for data sharing.',
      flavour: '"We can pinpoint the 5 hottest blocks with 50m precision."',
      choices: [
        { label: 'Accept the sensor network', sub: 'Gain targeted placement data',
          apply:(tiles,res)=>({ resources:{...res,energy:res.energy+15,budget:res.budget+10}, tiles, log:'Sensor network deployed. Hotspot data received.' }) },
        { label: 'Share existing data instead',
          apply:(tiles,res)=>({ resources:{...res,budget:res.budget+15}, tiles, log:'Data shared. Research grant awarded in return.' }) },
      ]
    },
  ],
};

export function tilesWithModifier(s) {
  return s.modifiers ?? 0;
}

// ─── Level 4 · Forest Frontline ─────────────────────────────────────────────
// Mechanic twist: untreated 'damaged' (burning slash farm) tiles can flare each
// year and damage adjacent canopy unless a 'modifier' (firebreak) blocks.

export const LEVEL_FOREST = {
  id: 'forest',
  number: 4,
  name: 'Forest Frontline',
  resourceNames: { primary:'Water', secondary:'Seeds', energy:'Fuel' },
  subtitle: 'Deforestation vs Agroecology',
  location: 'Borneo · Sebangau watershed',
  coords: 'S 2°35′ · E 113°50′',
  blurb: 'Stop the slash-and-burn front and transition farmers to agroforestry.',
  theme: 'forest',
  difficulty: {
    easy:   { budget: 260, primary: 80, secondary: 60, energy: 24, years: 30 },
    normal: { budget: 170, primary: 50, secondary: 40, energy: 16, years: 25 },
    hard:   { budget: 100, primary: 30, secondary: 28, energy: 10, years: 20 },
  },
  resourceLabels: { budget: 'Budget', primary: 'Seedlings', secondary: 'Tools', energy: 'Crews' },
  guide: { initials: 'RH', name: 'Reza Hartono', role: 'Forest steward' },
  canopyRequiresHint: 'New trees need a water pump or firebreak adjacent',
  pioneerSeeds: [[2,2,'shrub'], [11,9,'canopy'], [12,9,'shrub'], [1,9,'canopy']],
  seed: 47,
  damagedRate: 0.50,
  obstacleRate: 0.10,
  vocab: {
    soil:     { name: 'Cleared land',    deco: 'cleared' },
    damaged:  { name: 'Slash-burn farm', deco: 'burnt' },
    obstacle: { name: 'Limestone karst', deco: 'rocks' },
    pioneer:  { name: 'Cover crop',      deco: 'covercrop' },
    shrub:    { name: 'Cocoa shade plot',deco: 'cocoa' },
    canopy:   { name: 'Native canopy',   deco: 'tree' },
    water:    { name: 'Stream weir',     deco: 'weir' },
    energy:   { name: 'Solar weir pump', deco: 'solar-pump' },
    modifier: { name: 'Firebreak',       deco: 'firebreak' },
  },
  actions: [
    { id: 'pioneer',  targetRole: 'pioneer', name: 'Cover crop',
      sub: 'Nitrogen-fixing legumes', cost: { budget: 6, primary: 2, secondary: 2 }, kind: 'plant',
      desc: 'Restores soil fertility. Spreads naturally.' },
    { id: 'shrub',    targetRole: 'shrub',   name: 'Cocoa shade plot',
      sub: 'Cacao under partial shade', cost: { budget: 14, primary: 4, secondary: 4 }, kind: 'plant',
      desc: 'Income for farmers without clearing canopy.' },
    { id: 'canopy',   targetRole: 'canopy',  name: 'Native canopy',
      sub: 'Dipterocarp seedling',  cost: { budget: 28, primary: 7, secondary: 6 }, kind: 'plant',
      desc: 'Closes the canopy gap. Needs water or firebreak.' },
    { id: 'water',    targetRole: 'water',   name: 'Stream weir',
      sub: 'Sediment + flood control', cost: { budget: 32, primary: 11 }, kind: 'water',
      desc: 'Stabilises water table for 8 surrounding tiles.' },
    { id: 'energy',   targetRole: 'energy',  name: 'Solar weir pump',
      sub: 'Drip irrigation crew',  cost: { budget: 42, energy: 11 }, kind: 'structure',
      desc: 'Powers drip lines across 3-tile radius.' },
    { id: 'modifier', targetRole: 'modifier', name: 'Firebreak',
      sub: 'Cleared strip + crews', cost: { budget: 10 }, kind: 'modifier',
      desc: 'Stops fire from leaping to this tile.' },
  ],
  objectives: [
    { id: 'cover', label: 'Restore 55% canopy + agroforest',
      check: (s) => s.vegPct >= 0.55, pct: (s) => s.vegPct / 0.55,
      impact: 'Orangutan corridors reconnect' },
    { id: 'trees', label: '10 mature canopy stands',
      check: (s) => s.canopy >= 10, pct: (s) => s.canopy / 10,
      impact: 'Carbon stocks pass 80 t/ha' },
    { id: 'burns', label: 'Eliminate active fires (<5% slash)',
      check: (s) => s.damagedPct <= 0.05, pct: (s) => Math.max(0, (0.30 - s.damagedPct) / 0.25),
      impact: 'Peat haze season prevented' },
    { id: 'weirs', label: 'Build 3 stream weirs',
      check: (s) => s.water >= 3, pct: (s) => s.water / 3,
      impact: '600 farmers protected from drought' },
    { id: 'bio',   label: 'Biodiversity past 0.55',
      check: (s) => s.bio >= 0.55, pct: (s) => s.bio / 0.55,
      impact: 'Hornbills, gibbons return to ridge' },
  ],
  wildlife: [
    { id: 'beetle',   label: 'Rhinoceros beetle', bioMin: 0.05, prefer: ['canopy','shrub'] },
    { id: 'hornbill', label: 'Rhinoceros hornbill', bioMin: 0.20, prefer: ['canopy'] },
    { id: 'sunbear',  label: 'Sun bear',     bioMin: 0.32, prefer: ['canopy','shrub'] },
    { id: 'orangutan',label: 'Orangutan',   bioMin: 0.50, prefer: ['canopy'] },
    { id: 'tiger',    label: 'Clouded leopard', bioMin: 0.72, prefer: ['canopy','shrub'] },
  ],
  intelFeed: [
    '⏵ Mongabay · 13,000 ha lost to fire in Sebangau last dry season',
    '⏵ Indonesia commits $200M to peatland rewetting',
    '⏵ Dayak elder: "We farm under the canopy. Always have."',
    '⏵ NASA FIRMS · 47 active fire alerts in basin',
    '⏵ Reuters · Cocoa price up 18% — agroforestry premium grows',
    '⏵ WWF · orangutan population 14,000 in remaining habitat',
    '⏵ Local co-op pays 30% premium for shade-grown coffee',
  ],
  narration: (year, completed, stats, diff) => {
    if (completed) return '"Frontline holds. The forest is rebuilding itself faster than the fires."';
    if (year === 0) return '"Firebreaks first. Then cover crops on the cleared land — soil first, trees second."';
    if (year < 4) return '"Watch the burning tiles. Untouched, they jump to your young canopy."';
    if (year < 9) return '"Cocoa plots pay the farmers. Stack them under existing canopy."';
    if (year < 16) return '"Hornbills back. That\'s the index — keep planting toward closure."';
    if (year >= diff.years - 3) return '"Dry season looming. Lock down those last fires."';
    return '"Stream weirs keep this through the dry months. Build more if budget allows."';
  },
  intro: {
    bigNumber: 11, bigNumberLabel: 'M hectares',
    bigNumberCap: 'of primary forest lost globally in 2024 alone. Borneo\'s share: 13%.',
    lede: 'You hold a 14-acre stretch where the slash-and-burn front meets the old forest. Farmers need income; orangutans need canopy. Show that both work together.',
  },
  win: {
    title: 'The frontline holds.',
    lede: 'Sebangau watershed stabilised in {{years}} years. Fires contained, cocoa plots paying, orangutans crossing again.',
    citation: 'Costa Rica reforested 50% of its land area between 1987 and 2018 through PES (Payment for Ecosystem Services) — the model spreading to Borneo now.',
  },
  impactScale: {
    acres: 90_000,
    label: '90,000 ha · Sebangau buffer zone',
    metrics: [
      { unit: 'tCO₂ / yr sequestered', calc: (s, f) => Math.round(s.carbon * 2.4 * f) },
      { unit: 'canopy hectares',       calc: (s, f) => Math.round(s.canopy * f) },
      { unit: 'farmers in agroforestry', calc: (s, f) => Math.round(s.shrubs * 2.2 * f) },
      { unit: 'orangutan corridor (ha)', calc: (s, f) => Math.round(s.vegPct * f * 100) },
    ],
  },
  simulateTwist: (tiles) => {
    const idx = new Map(tiles.map((t) => [key(t.i, t.j), t]));
    for (const t of tiles) {
      if (t.role === 'damaged') {
        // burning slash-farm: chance to damage adjacent canopy + spread
        for (const [ni, nj] of neighbors(t.i, t.j, 1)) {
          const n = idx.get(key(ni, nj));
          if (!n) continue;
          if (n.modifier) continue; // firebreak blocks
          if (n.role === 'canopy' && Math.random() < 0.10) {
            n.role = 'shrub'; n.age = 0;
          } else if (n.role === 'shrub' && Math.random() < 0.08) {
            n.role = 'pioneer'; n.age = 0;
          } else if (n.role === 'soil' && Math.random() < 0.09) {
            n.role = 'damaged'; n.age = 0;
          }
        }
        // burnouts: each year some fires extinguish
        if (Math.random() < 0.12) {
          t.role = 'soil'; t.age = 0;
        }
      }
    }
    return [...idx.values()];
  },
  events: [
    {
      id: 'wildfire', name: 'Wildfire Outbreak', icon: '🔥', color: '#C2462B', weight: 16,
      desc: 'Slash-and-burn has jumped the firebreak. Three new tiles are burning.',
      flavour: '"The smoke reached Kuching today," reports the ranger station.',
      choices: [
        { label: 'Emergency firebreak extension', sub: 'Deploy ranger crews',
          cost:{ budget:20, secondary:8 },
          apply:(tiles,res)=>({ resources:{...res,energy:Math.max(0,res.energy-8)}, tiles:tiles.map(t=>t.burning?{...t,burning:false,role:'damaged',deco:'burnt'}:t), log:'Emergency firebreak held. Burning tiles contained.' }) },
        { label: 'Controlled backburn', sub: 'Fight fire with fire',
          cost:{ energy:12 },
          apply:(tiles,res)=>({ resources:{...res,energy:Math.max(0,res.energy-8)}, tiles:tiles.map(t=>t.burning&&Math.random()<0.6?{...t,burning:false,role:'damaged',deco:'burnt'}:t), log:'Backburn partially successful. Some tiles still burning.' }) },
      ]
    },
    {
      id: 'logging_encroachment', name: 'Illegal Logging Detected', icon: '🪚', color: '#8A4A1A', weight: 12,
      desc: 'Satellite data shows fresh clearcut 2 km into the concession.',
      flavour: '"We found their camp. They\'ve been working for weeks," says the ranger.',
      choices: [
        { label: 'Report to authorities', sub: 'Delay but legal protection',
          apply:(tiles,res)=>({ resources:{...res,budget:res.budget+15}, tiles:tiles.map(t=>t.role==='canopy'&&Math.random()<0.1?{...t,role:'damaged',deco:'cleared'}:t), log:'Reported to forestry ministry. Investigation underway.' }) },
        { label: 'Deploy ranger patrol immediately',
          cost:{ energy:15 },
          apply:(tiles,res)=>({ resources:{...res,energy:Math.max(0,res.energy-10)}, tiles, log:'Rangers deployed. Loggers dispersed. Area secured.' }) },
      ]
    },
    {
      id: 'peatland_rewet', name: 'Peatland Rewetting Grant', icon: '💧', color: '#2A7A9A', weight: 8,
      desc: 'Government releases emergency peatland restoration funds.',
      flavour: '"Wet peat doesn\'t burn. That\'s worth every rupiah," says the district officer.',
      choices: [
        { label: 'Accept the full grant', sub: '+budget + water',
          apply:(tiles,res)=>({ resources:{...res,budget:res.budget+35,primary:res.primary+15}, tiles, log:'Peatland grant received. Rewetting begins.' }) },
        { label: 'Request seedlings and crews',
          apply:(tiles,res)=>({ resources:{...res,secondary:res.secondary+25,energy:res.energy+12}, tiles, log:'Seedlings and crew support granted.' }) },
      ]
    },
    {
      id: 'orangutan_sighting', name: 'Orangutan Corridor Spotted', icon: '🦧', color: '#C87820', weight: 7,
      desc: 'Camera traps confirm orangutan movement through your restored corridor.',
      flavour: '"This is the first sighting in this valley in 12 years," says the researcher.',
      choices: [
        { label: 'Mark and protect the corridor', sub: 'Expand canopy focus',
          apply:(tiles,res)=>({ resources:{...res,budget:res.budget+20}, tiles, log:'Corridor protected. Biodiversity index rising.' }) },
        { label: 'Share data with WWF for funding',
          apply:(tiles,res)=>({ resources:{...res,budget:res.budget+30}, tiles, log:'WWF partnership secured. +30 budget incoming.' }) },
      ]
    },
    {
      id: 'agroforestry_premium', name: 'Shade-Grown Coffee Premium', icon: '☕', color: '#5A3A1A', weight: 9,
      desc: 'International buyers offer 30% premium for shade-grown coffee from your plots.',
      flavour: '"The farmers are asking for more cocoa plots. The price is speaking."',
      choices: [
        { label: 'Expand agroforestry plots', sub: 'Reinvest the premium',
          apply:(tiles,res)=>({ resources:{...res,budget:res.budget+28,secondary:res.secondary+12}, tiles, log:'Premium secured. Farmers investing in agroforestry expansion.' }) },
        { label: 'Bank the premium for emergency use',
          apply:(tiles,res)=>({ resources:{...res,budget:res.budget+40}, tiles, log:'Premium banked. +40 budget reserve.' }) },
      ]
    },
  ],
};

// ─── Level 5 · Planet B ─────────────────────────────────────────────────────
// Mechanic twist: oxygen index. Plants can only thrive once enough oxygen has
// been built up. Pioneers/microbes can establish anywhere; shrubs need O₂ >
// 0.2; canopy needs O₂ > 0.45.

export const LEVEL_PLANET = {
  id: 'planet',
  number: 5,
  name: 'Planet B',
  resourceNames: { primary:'H₂O ice', secondary:'Bio-matter', energy:'Fusion' },
  subtitle: 'Terraforming an Exoplanet',
  location: 'Kepler-442b · Highland basin',
  coords: 'RA 19h02m · Dec +39°16′',
  blurb: 'Terraform a Mars-like basin into a habitable biosphere from scratch.',
  theme: 'planet',
  difficulty: {
    easy:   { budget: 320, primary: 80, secondary: 60, energy: 60, years: 35 },
    normal: { budget: 200, primary: 50, secondary: 40, energy: 36, years: 30 },
    hard:   { budget: 120, primary: 30, secondary: 28, energy: 20, years: 25 },
  },
  resourceLabels: { budget: 'Budget', primary: 'Microbes', secondary: 'Spores', energy: 'Power' },
  guide: { initials: 'IL', name: 'Iris Lavoie', role: 'Astrobiologist' },
  canopyRequiresHint: 'Plant trees only inside a biodome corridor',
  pioneerSeeds: [],
  seed: 71,
  damagedRate: 0.15,
  obstacleRate: 0.35,
  vocab: {
    soil:     { name: 'Regolith',         deco: 'regolith' },
    damaged:  { name: 'Toxic salt flat',  deco: 'salt' },
    obstacle: { name: 'Frozen boulder',   deco: 'icerock' },
    pioneer:  { name: 'Microbial mat',    deco: 'microbe' },
    shrub:    { name: 'Lichen colony',    deco: 'lichen' },
    canopy:   { name: 'Dome tree',        deco: 'dometree' },
    water:    { name: 'Algae pool',       deco: 'algae-pool' },
    energy:   { name: 'Atmosphere proc.', deco: 'atmoproc' },
    modifier: { name: 'Biodome shell',    deco: 'biodome' },
  },
  actions: [
    { id: 'pioneer',  targetRole: 'pioneer', name: 'Seed microbial mat',
      sub: 'Engineered bacteria',  cost: { budget: 8, primary: 3, secondary: 2 }, kind: 'plant',
      desc: 'Begins biology. Releases tiny amounts of O₂.' },
    { id: 'shrub',    targetRole: 'shrub',   name: 'Establish lichen',
      sub: 'Symbiotic colony',     cost: { budget: 16, primary: 5, secondary: 4 }, kind: 'plant',
      desc: 'Fixes nitrogen. Needs mat or biodome.' },
    { id: 'canopy',   targetRole: 'canopy',  name: 'Dome tree',
      sub: 'Engineered hardwood',  cost: { budget: 36, primary: 9, secondary: 8 }, kind: 'plant',
      desc: 'Major O₂ production. Must be inside a biodome.' },
    { id: 'water',    targetRole: 'water',   name: 'Algae pool',
      sub: 'Cyanobacteria bloom',  cost: { budget: 42, primary: 14 }, kind: 'water',
      desc: 'Photosynthesises. Pumps water vapor + O₂.' },
    { id: 'energy',   targetRole: 'energy',  name: 'Atmosphere processor',
      sub: 'Fusion-powered CO₂→O₂', cost: { budget: 55, energy: 18 }, kind: 'structure',
      desc: 'Raises global O₂ index. Required for canopy stage.' },
    { id: 'modifier', targetRole: 'modifier', name: 'Biodome shell',
      sub: 'Transparent membrane', cost: { budget: 16 }, kind: 'modifier',
      desc: 'Enables canopy on raw regolith.' },
  ],
  objectives: [
    { id: 'micro',  label: '40% surface colonised',
      check: (s) => s.vegPct >= 0.40, pct: (s) => s.vegPct / 0.40,
      impact: 'Self-sustaining biome cycles begin' },
    { id: 'o2',     label: 'Oxygen index past 0.5',
      check: (s) => s.bio >= 0.5, pct: (s) => s.bio / 0.5,
      impact: 'Breathable air outside domes' },
    { id: 'algae',  label: '4 algae pools online',
      check: (s) => s.water >= 4, pct: (s) => s.water / 4,
      impact: 'Hydrological cycle establishes' },
    { id: 'proc',   label: '3 atmosphere processors',
      check: (s) => s.structures >= 3, pct: (s) => s.structures / 3,
      impact: 'Global O₂ rises 0.04 per cycle' },
    { id: 'trees',  label: '6 mature dome trees',
      check: (s) => s.canopy >= 6, pct: (s) => s.canopy / 6,
      impact: 'Biosphere passes the irreversibility threshold' },
  ],
  wildlife: [
    { id: 'beetle',   label: 'Engineered beetle',  bioMin: 0.30, prefer: ['shrub','pioneer'] },
    { id: 'cricket',  label: 'Sky cricket',        bioMin: 0.42, prefer: ['shrub','canopy'] },
    { id: 'sparrow',  label: 'Colonist sparrow',   bioMin: 0.55, prefer: ['canopy','shrub'] },
    { id: 'fox',      label: 'Arctic fox (cloned)',bioMin: 0.68, prefer: ['shrub','pioneer'] },
  ],
  intelFeed: [
    '⏵ ESA · Kepler-442b orbital scan complete · ground temp -18°C',
    '⏵ Mission log: "First mat strain established at sector 4-7"',
    '⏵ NASA · oxygen index reached 0.12 in highland basin',
    '⏵ Dr. Lavoie: "The microbes love it. They love it more than we do."',
    '⏵ Earth committee approves +5 fusion cores for processor scale-up',
    '⏵ Algae pool 2 reached photosynthetic stable state',
    '⏵ Crew morale 78% — biodome 3 holiday party planned',
  ],
  narration: (year, completed, stats, diff) => {
    if (completed) return '"O₂ index has crossed the irreversibility threshold. Kepler-442b is alive."';
    if (year === 0) return '"Start with microbial mats. Bare regolith won\'t support anything else yet."';
    if (year < 5) return '"Algae pools push O₂ faster than processors. Drop them early."';
    if (year < 12) return '"Lichens need a mat or a biodome. You can\'t skip the stages."';
    if (year < 22) return '"O₂ rising. Biodomes let you plant trees on raw regolith."';
    if (year >= diff.years - 3) return '"Approaching mission end. Push canopy for the irreversibility threshold."';
    return '"Every processor adds 0.04 to the global O₂ index. Build as many as you can."';
  },
  intro: {
    bigNumber: 1_206, bigNumberLabel: 'light years',
    bigNumberCap: 'from Earth. Kepler-442b is the closest super-Earth in the habitable zone.',
    lede: 'You command Mission Verdant-3. A 14-acre highland basin. Surface: dust and salt. Atmosphere: 4% O₂. Your job: build a self-perpetuating biome before our oxygen reserves run out.',
  },
  win: {
    title: 'Kepler-442b is breathing.',
    lede: 'Atmospheric O₂ stabilised in {{years}} cycles. Lichens spreading, algae pools photosynthesising, the first dome trees mature.',
    citation: 'The Biosphere 2 closure experiments (1991-1994) proved synthetic biomes can self-regulate above 2 acres. Verdant-3 just proved it at planetary scale.',
  },
  impactScale: {
    acres: 50_000_000,
    label: '50 M acres · planetary biosphere',
    metrics: [
      { unit: 'kT O₂ / yr produced',     calc: (s, f) => Math.round(s.carbon * 0.04 * f) },
      { unit: 'biodome cells',           calc: (s, f) => Math.round((s.water + s.structures) * f / 100) },
      { unit: 'breathable hectares',     calc: (s, f) => Math.round(s.vegPct * f / 50) },
      { unit: 'irreversibility · %',     calc: (s)    => Math.round(Math.min(100, s.bio * 100 + s.canopy * 3)) },
    ],
  },
  simulateTwist: (tiles) => {
    // Slower spread on Planet B — biology is harder here.
    const idx = new Map(tiles.map((t) => [key(t.i, t.j), t]));
    for (const t of idx.values()) {
      // Lichen needs mat or biodome to survive
      if (t.role === 'shrub' && !t.modifier && Math.random() < 0.04) {
        const ns = neighbors(t.i, t.j, 1).map(([i, j]) => idx.get(key(i, j)));
        const hasMat = ns.some((n) => n && n.role === 'pioneer');
        if (!hasMat) t.role = 'pioneer';
      }
    }
    return [...idx.values()];
  },
  events: [
    {
      id: 'solar_storm', name: 'Solar Radiation Storm', icon: '☀️', color: '#C2462B', weight: 12,
      desc: 'A coronal mass ejection has disabled 2 atmosphere processors.',
      flavour: '"The magnetosphere isn\'t strong enough yet," reports Dr. Lavoie.',
      choices: [
        { label: 'Emergency shielding deployment', sub: 'Spend power to protect systems',
          cost:{ energy:18, budget:15 },
          apply:(tiles,res)=>({ resources:{...res,energy:Math.max(0,res.energy-10)}, tiles, log:'Processors shielded. Systems restored.' }) },
        { label: 'Sacrifice the processors, protect the biodomes',
          apply:(tiles,res)=>({ resources:{...res,primary:res.primary+10}, tiles:tiles.map(t=>t.deco==='atmoproc'&&Math.random()<0.4?{...t,role:'damaged',deco:'regolith'}:t), log:'2 processors lost. Biodomes intact. Setback to O₂ index.' }) },
      ]
    },
    {
      id: 'ice_asteroid', name: 'Ice Asteroid Intercept', icon: '☄️', color: '#4A9CC8', weight: 8,
      desc: 'Mission control has redirected an ice asteroid for water extraction.',
      flavour: '"600 million litres incoming. Adjust the collection arrays."',
      choices: [
        { label: 'Full water extraction', sub: 'Massive H₂O boost',
          apply:(tiles,res)=>({ resources:{...res,primary:res.primary+40}, tiles, log:'Ice asteroid extracted. Water supply secured. +40 H₂O.' }) },
        { label: 'Split: water + mineral extraction',
          apply:(tiles,res)=>({ resources:{...res,primary:res.primary+22,budget:res.budget+20}, tiles, log:'Mixed extraction. +22 H₂O, +20 budget in minerals.' }) },
      ]
    },
    {
      id: 'earth_committee', name: 'Earth Committee Approval', icon: '🌍', color: '#2A7A4A', weight: 9,
      desc: 'The Earth terraforming committee has approved Phase 2 resource allocation.',
      flavour: '"They saw the O₂ index readings. The vote was unanimous."',
      choices: [
        { label: 'Accept full resource package', sub: 'Budget + power boost',
          apply:(tiles,res)=>({ resources:{...res,budget:res.budget+45,energy:res.energy+20}, tiles, log:'Earth committee package received. +45 budget, +20 power.' }) },
        { label: 'Request additional crew instead',
          apply:(tiles,res)=>({ resources:{...res,secondary:res.secondary+30,energy:res.energy+15}, tiles, log:'Additional crew and spores delivered.' }) },
      ]
    },
    {
      id: 'microbe_mutation', name: 'Microbe Strain Mutation', icon: '🔬', color: '#60D0C0', weight: 10,
      desc: 'A beneficial mutation has made your microbial mats 40% more efficient.',
      flavour: '"Evolution is on our side," says the astrobiologist.',
      choices: [
        { label: 'Cultivate and spread the strain', sub: 'Boost all pioneer tiles',
          apply:(tiles,res)=>({ resources:{...res,secondary:res.secondary+15}, tiles:tiles.map(t=>t.role==='pioneer'?{...t,health:(t.health||0.5)+0.1}:t), log:'Mutant strain propagated. Pioneer tiles strengthened.' }) },
        { label: 'Isolate for study first',
          apply:(tiles,res)=>({ resources:{...res,budget:res.budget+25}, tiles, log:'Strain isolated for study. Research grant triggered.' }) },
      ]
    },
    {
      id: 'crew_morale', name: 'Crew Morale Event', icon: '🎉', color: '#9878E8', weight: 7,
      desc: 'The crew has hit a milestone. Morale is at 94%. Productivity surge incoming.',
      flavour: '"Biodome 3 holiday party was a success," confirms mission log.',
      choices: [
        { label: 'Channel energy into a push', sub: 'Double output this turn',
          apply:(tiles,res)=>({ resources:{...res,primary:res.primary+12,secondary:res.secondary+10,energy:res.energy+8}, tiles, log:'Morale surge. All resources boosted.' }) },
        { label: 'Give the crew a rest day',
          apply:(tiles,res)=>({ resources:{...res,energy:res.energy+20}, tiles, log:'Rest day taken. Energy fully restored. Crew ready.' }) },
      ]
    },
  ],
};

// ─── Level 0 · Schoolyard Meadow ────────────────────────────────────────────
// Educational intro level. Teaches ecological succession through a food-web
// assembly mechanic: each stage unlocks the next. Students must build in the
// correct biological order — wildflowers → pollinators arrive → berry bushes
// become available → birds arrive → trees become available → pond → food web
// complete. Actions are gated by prereqs so the ORDER is the lesson.
//
// prereq system: each action can have a `prereq` object:
//   { stat, min, label }  — checked against computeStats(tiles) in App.jsx
// Locked actions show a "🔒 Needs X first" tooltip instead of firing.

export const LEVEL_SCHOOLYARD = {
  id: 'schoolyard',
  number: 0,
  name: 'Schoolyard Meadow',
  educational: true,          // flags the beginner / Learn-Mode-first level
  recommendedFirst: true,
  resourceNames: { primary:'Water', secondary:'Seeds', energy:'Helpers' },
  subtitle: 'Your First Wild Patch',
  location: 'Maple Street Community Park · the forgotten back field',
  coords: 'A patch of ground near you',
  blurb: 'Turn a bare, trampled corner of the park into a buzzing wildlife meadow.',
  theme: 'meadow',
  worldConfig: { seed: 7, damagedRate: 0.22, obstacleRate: 0.18,
    pioneerSeeds: [[2,2,'pioneer'],[3,2,'pioneer'],[2,3,'pioneer'],[11,7,'pioneer'],[10,7,'shrub']] },
  seed: 7,
  damagedRate: 0.22,
  obstacleRate: 0.18,
  pioneerSeeds: [[2,2,'pioneer'],[3,2,'pioneer'],[2,3,'pioneer'],[11,7,'pioneer'],[10,7,'shrub']],
  difficulty: {
    easy:   { budget: 320, primary: 120, secondary: 90, energy: 40, years: 24 },
    normal: { budget: 260, primary: 100, secondary: 75, energy: 32, years: 20 },
    hard:   { budget: 200, primary:  80, secondary: 60, energy: 24, years: 18 },
  },
  resourceLabels: { budget: 'Coins', primary: 'Water', secondary: 'Seeds', energy: 'Helpers' },
  guide: { initials: 'RM', name: 'Ranger Maya', role: 'Park ranger & your guide' },
  canopyRequiresHint: 'Young trees grow best next to water or good soil',
  vocab: {
    soil:     { name: 'Bare ground',       deco: 'grass' },
    damaged:  { name: 'Trampled dirt',     deco: 'cracks' },
    obstacle: { name: 'Old log / rock',    deco: 'rocks' },
    pioneer:  { name: 'Wildflowers',       deco: 'wildflower' },
    shrub:    { name: 'Berry bush',        deco: 'berry' },
    canopy:   { name: 'Young tree',        deco: 'tree' },
    water:    { name: 'Wildlife pond',     deco: 'pond' },
    energy:   { name: 'Bug hotel',         deco: 'bug-hotel' },
    modifier: { name: 'Compost patch',     deco: 'compost' },
  },
  actions: [
    // ── STAGE 1: Soil builders — always available, teach succession entry point
    {
      id: 'pioneer', targetRole: 'pioneer', name: 'Wildflowers',
      sub: 'Start here — feeds pollinators',
      cost: { budget: 4, primary: 2, secondary: 2 }, kind: 'plant',
      stage: 1,
      desc: 'Wildflowers are the foundation. Their nectar feeds bees and butterflies, and their roots start building healthy soil. Always plant these first.',
      whyFirst: 'Every meadow starts with wildflowers. Nothing else can thrive without them.',
    },
    {
      id: 'modifier', targetRole: 'modifier', name: 'Compost patch',
      sub: 'Feeds the soil — plant near trees',
      cost: { budget: 5 }, kind: 'modifier',
      stage: 1,
      desc: 'Compost turns dead leaves into rich food for the soil. It helps wildflowers grow faster and makes the ground ready for trees.',
      whyFirst: 'Good soil is the foundation of every ecosystem.',
    },

    // ── STAGE 2: Unlocked when pollinators arrive (pioneer >= 4 tiles)
    {
      id: 'shrub', targetRole: 'shrub', name: 'Berry bush',
      sub: 'Food for birds — needs pollinators first',
      cost: { budget: 10, primary: 4, secondary: 3 }, kind: 'plant',
      stage: 2,
      prereq: { stat: 'pioneer', min: 4,
        label: 'Plant 4 wildflower patches first — bees need flowers before they\'ll pollinate berry bushes' },
      desc: 'Berry bushes need bees to pollinate their flowers. Once wildflowers bring in the bees, berry bushes can fruit and feed the birds.',
    },
    {
      id: 'energy', targetRole: 'energy', name: 'Bug hotel',
      sub: 'Homes for insects — needs wildflowers first',
      cost: { budget: 16, energy: 5 }, kind: 'structure',
      stage: 2,
      prereq: { stat: 'pioneer', min: 3,
        label: 'Plant wildflowers first — insects need food before they need a home' },
      desc: 'A bug hotel gives insects like ladybirds and lacewings a warm place to shelter and breed. Without wildflowers nearby, no insects will move in.',
    },

    // ── STAGE 3: Unlocked when shrubs established (shrubs >= 2)
    {
      id: 'canopy', targetRole: 'canopy', name: 'Young tree',
      sub: 'Shade + nesting — needs berry bushes first',
      cost: { budget: 18, primary: 6, secondary: 4 }, kind: 'plant',
      stage: 3,
      prereq: { stat: 'shrubs', min: 2,
        label: 'Plant 2 berry bushes first — trees need birds to spread their seeds, and birds need berry bushes' },
      desc: 'Trees are the final stage of succession. Birds that feed on berries also scatter tree seeds in their droppings — that\'s how real forests spread. Plant trees next to compost for fastest growth.',
    },

    // ── STAGE 4: Unlocked when there is some vegetation (vegPct >= 0.2)
    {
      id: 'water', targetRole: 'water', name: 'Wildlife pond',
      sub: 'Frogs + dragonflies — needs plants around it',
      cost: { budget: 24, primary: 8 }, kind: 'water',
      stage: 4,
      prereq: { stat: 'vegPct', min: 0.2,
        label: 'Build some vegetation first — a pond surrounded by bare ground won\'t attract wildlife' },
      desc: 'A wildlife pond needs plants around its edges for frogs to hide in and dragonflies to perch on. Once you have a green margin, the pond becomes the most biodiverse spot in the whole meadow.',
    },

    // Remove tool — always available
    {
      id: 'remove', targetRole: 'remove', name: 'Inspect / clear',
      sub: 'Check a tile or remove it for 50% refund',
      cost: {}, kind: 'remove',
      stage: 0,
      desc: 'Tap any placed tile to inspect it and see what it\'s doing for the ecosystem, or clear it for a 50% coin refund.',
    },
  ],

  // ── Objectives: tell the succession story explicitly ──────────────────────
  objectives: [
    {
      id: 'stage1',
      label: 'Stage 1 — Sow the seeds: 6 wildflower patches',
      check: (s) => s.pioneer >= 6,
      pct:   (s) => Math.min(1, s.pioneer / 6),
      impact: 'Wildflowers stabilise soil and bring in the first pollinators',
      lesson: 'SUCCESSION STEP 1: Pioneer plants always come first.',
    },
    {
      id: 'stage2',
      label: 'Stage 2 — Build the food chain: 3 berry bushes + bug hotel',
      check: (s) => s.shrubs >= 3 && s.structures >= 1,
      pct:   (s) => Math.min(1, (s.shrubs/3 + (s.structures>=1?1:0)) / 2),
      impact: 'Insects and birds now have food and shelter',
      lesson: 'SUCCESSION STEP 2: Pollinators enable fruiting plants.',
    },
    {
      id: 'stage3',
      label: 'Stage 3 — Grow the canopy: 3 young trees',
      check: (s) => s.canopy >= 3,
      pct:   (s) => Math.min(1, s.canopy / 3),
      impact: 'Trees provide nesting sites and year-round shelter',
      lesson: 'SUCCESSION STEP 3: Shrubs prepare the ground for trees.',
    },
    {
      id: 'stage4',
      label: 'Stage 4 — Complete the web: dig a wildlife pond',
      check: (s) => s.water >= 1,
      pct:   (s) => s.water >= 1 ? 1 : 0,
      impact: 'Amphibians and aquatic insects complete the food web',
      lesson: 'SUCCESSION STEP 4: Water creates the most biodiverse habitat.',
    },
    {
      id: 'foodweb',
      label: 'Food web thriving: biodiversity above 50%',
      check: (s) => s.bio >= 0.5,
      pct:   (s) => Math.min(1, s.bio / 0.5),
      impact: 'A complete, self-sustaining meadow ecosystem',
      lesson: 'A healthy ecosystem has many species at every level of the food chain.',
    },
  ],
  wildlife: [
    { id: 'ladybug',   label: 'Ladybug',        bioMin: 0.05, prefer: ['pioneer','shrub'] },
    { id: 'bee',       label: 'Bumblebee',      bioMin: 0.12, prefer: ['pioneer','shrub'] },
    { id: 'butterfly', label: 'Butterfly',      bioMin: 0.22, prefer: ['pioneer','shrub'] },
    { id: 'frog',      label: 'Frog',           bioMin: 0.30, prefer: ['water','pioneer'] },
    { id: 'robin',     label: 'Robin',          bioMin: 0.38, prefer: ['shrub','canopy'] },
    { id: 'hedgehog',  label: 'Hedgehog',       bioMin: 0.50, prefer: ['shrub','canopy','pioneer'] },
  ],
  intelFeed: [
    '⏵ Did you know? One in three mouthfuls of food depends on pollinators.',
    '⏵ Tip from Ranger Maya: plant flowers before bushes before trees.',
    '⏵ A single oak tree can support over 2,000 species over its life.',
    '⏵ Ponds are one of the best homes you can build for wildlife.',
    '⏵ Worms are heroes — they mix and feed the soil for free.',
    '⏵ Butterflies taste with their feet!',
    '⏵ Leaving a wild corner is one of the kindest things for nature.',
  ],
  narration: (year, completed, stats) => {
    if (completed) return '"You did it! You just built a complete food web from scratch. That\'s real ecology!"';
    if (year === 0) return '"Welcome! Start with wildflowers — tap them in the action list, then tap bare ground. Flowers come first, always."';
    if (stats && stats.pioneer < 3) return '"Keep going with wildflowers! You need 6 patches before the bees arrive and unlock the next stage."';
    if (stats && stats.pioneer >= 3 && stats.shrubs < 1) return '"Bees are coming! Now try a berry bush — notice how it was locked until you had wildflowers? That\'s succession."';
    if (stats && stats.shrubs >= 1 && stats.canopy < 1) return '"Berry bushes feed the birds. Now birds will spread tree seeds — so try planting a young tree next to your compost patch."';
    if (stats && stats.canopy >= 1 && stats.water < 1) return '"Amazing — you can see the stages building! Now dig a wildlife pond. The vegetation around it is what makes frogs move in."';
    if (stats && stats.water >= 1) return '"The food web is almost complete. Watch the biodiversity rise as every species finds its place!"';
    return '"Keep building — each thing you plant makes the next thing possible."';
  },
  intro: {
    bigNumber: 1, bigNumberLabel: 'wild patch',
    bigNumberCap: 'is all it takes to start. Every meadow, forest and wetland began as one small patch someone cared for.',
    lede: 'Ranger Maya needs your help. A corner of the community park is bare, trampled dirt — but with the right plants, in the right order, you can turn it into a buzzing wildlife meadow. Ready to learn how nature rebuilds?',
  },
  win: {
    title: 'Your meadow is alive!',
    lede: 'In just {{years}} years you turned bare dirt into a living meadow full of bees, birds and frogs. This is exactly how real wildlife gardens are made.',
    citation: 'Real schools and parks all over the world are rewilding corners like this. Small patches joined together become "wildlife corridors" that let animals travel safely across whole cities.',
  },
  winTitle: 'Your meadow is alive!',
  winBlurb: 'Bees are buzzing, a pond is full of frogs, and young trees are reaching for the sky — all because you planted things in the right order.',
  realWorldNote: 'Real schools and parks everywhere are rewilding corners just like this. Joined together, these patches become "wildlife corridors" that let animals travel safely across whole cities.',
  impactScale: {
    acres: 500,
    label: '500 similar patches · one city',
    metrics: [
      { unit: 'trees growing',        calc: (s, f) => Math.round(s.canopy * f) },
      { unit: 'homes for wildlife',   calc: (s, f) => Math.round((s.shrubs * 2 + s.canopy * 3 + s.water * 4) * f) },
      { unit: 'pollinator meals/day', calc: (s, f) => Math.round((s.pioneer * 3 + s.shrubs * 5) * f) },
      { unit: 'kg CO₂ captured/yr',   calc: (s, f) => Math.round(s.carbon * 0.9 * f) },
    ],
  },
};

export const ALL_LEVELS = [LEVEL_SCHOOLYARD, LEVEL_DESERT, LEVEL_COASTAL, LEVEL_URBAN, LEVEL_FOREST, LEVEL_PLANET];