// sim/education.js — Learn Mode: contextual eco-facts, knowledge checks, Eco-Dex.
//
// This is the pedagogical layer that turns the simulation into a teaching tool
// for younger learners. Three parts:
//
//   1. CONCEPTS   — an "Eco-Dex" glossary of environmental ideas, each unlocked
//                   the first time the player does something that demonstrates it.
//   2. ECO_FACTS  — bite-sized, kid-friendly facts surfaced contextually as a
//                   card while playing (place a tree → learn about canopy, etc.).
//   3. QUIZZES    — a short, friendly knowledge check shown at level completion.
//                   Correct answers grant bonus XP and progress the Scholar track.
//
// Everything is data + pure helpers so App.jsx stays declarative. Nothing here
// depends on React.

// ── Concepts / Eco-Dex ──────────────────────────────────────────────────────
// `unlock(ctx)` returns true when the player has demonstrated the concept.
// ctx = { stats, trust, year, level, action, tileRole }
export const CONCEPTS = [
  {
    id: 'succession',
    term: 'Ecological Succession',
    icon: '🌱',
    kid: 'Nature rebuilds in order — tiny plants first, then bushes, then big trees. You can\'t skip ahead!',
    deep: 'Pioneer species stabilise bare ground and build soil, creating the conditions later, larger species need. Skipping stages leaves later plantings without support.',
    unlock: ({ stats }) => stats.pioneer >= 1,
  },
  {
    id: 'pollinators',
    term: 'Pollinators',
    icon: '🐝',
    kid: 'Bees, butterflies and beetles move pollen between flowers so plants can make seeds and fruit.',
    deep: 'Roughly 75% of leading food crops depend at least partly on animal pollination. Flowering shrubs provide the nectar corridors that keep pollinator populations stable.',
    unlock: ({ stats }) => stats.shrubs >= 1,
  },
  {
    id: 'canopy',
    term: 'Tree Canopy',
    icon: '🌳',
    kid: 'The leafy roof of a tree makes shade, cools the air, and gives animals a home.',
    deep: 'Canopy cover reduces surface temperature through shading and evapotranspiration, intercepts rainfall, and provides vertical habitat structure for birds and insects.',
    unlock: ({ stats }) => stats.canopy >= 1,
  },
  {
    id: 'water-cycle',
    term: 'The Water Cycle',
    icon: '💧',
    kid: 'Water moves in a loop: it rains, plants drink it, ponds store it, and the sun lifts it back to the sky.',
    deep: 'Retention ponds and wetlands slow runoff, recharge groundwater, and buffer both floods and droughts — the same infrastructure logic used in real watershed restoration.',
    unlock: ({ stats }) => stats.water >= 1,
  },
  {
    id: 'biodiversity',
    term: 'Biodiversity',
    icon: '🦋',
    kid: 'Biodiversity means "many kinds of life". More kinds of plants and animals make a place healthier and stronger.',
    deep: 'Diverse ecosystems are more resilient to shocks like disease or drought because different species fill overlapping roles — if one falters, others compensate.',
    unlock: ({ stats }) => stats.bio >= 0.3,
  },
  {
    id: 'food-web',
    term: 'Food Web',
    icon: '🔗',
    kid: 'Every animal is part of a chain: plants feed insects, insects feed birds, and so on. Everything is connected.',
    deep: 'Food webs describe energy flow through trophic levels. Restoring plant life at the base allows higher trophic levels — herbivores, then predators — to return in sequence.',
    unlock: ({ stats }) => stats.bio >= 0.5,
  },
  {
    id: 'carbon',
    term: 'Carbon Capture',
    icon: '🌍',
    kid: 'Plants breathe in a gas called carbon dioxide and lock it away as they grow. That helps cool the planet.',
    deep: 'Through photosynthesis, plants fix atmospheric CO₂ into biomass and soil. Reforestation and healthy soils are among the most cost-effective natural climate solutions.',
    unlock: ({ stats }) => stats.carbon >= 10,
  },
  {
    id: 'soil-health',
    term: 'Healthy Soil',
    icon: '🪱',
    kid: 'Good soil is alive! It\'s full of worms, fungi and tiny microbes that help plants grow.',
    deep: 'Soil organic matter and microbial communities govern nutrient cycling and water retention. Ground cover prevents erosion and feeds the soil food web.',
    unlock: ({ stats }) => stats.vegPct >= 0.35,
  },
  {
    id: 'microclimate',
    term: 'Microclimate',
    icon: '🌡️',
    kid: 'Plants can make their own little weather — shade and leaves keep the ground cooler and wetter.',
    deep: 'Vegetation moderates local temperature and humidity. Even small green patches lower surface heat measurably — the basis of urban cooling strategies.',
    unlock: ({ stats }) => stats.heat <= 0.5,
  },
  {
    id: 'community',
    term: 'People & Nature',
    icon: '🤝',
    kid: 'Taking care of nature works best when the whole community helps and shares in what grows.',
    deep: 'Durable restoration depends on local stewardship. Projects that share benefits with residents — food, income, cooling — sustain far higher long-term survival rates.',
    unlock: ({ trust }) => trust >= 70,
  },
];

// ── Eco-Facts ────────────────────────────────────────────────────────────────
// Contextual, one-at-a-time cards. Each has a `trigger(ctx)` that fires once.
// Facts are intentionally short and warm for younger players. `tag` groups them
// so we can rate-limit and avoid spamming.
export const ECO_FACTS = [
  {
    id: 'fact-first-plant', tag: 'plant', icon: '🌱',
    title: 'You planted life!',
    body: 'Native grasses hold soil in place with their roots so wind and rain can\'t wash it away.',
    trigger: ({ stats, prev }) => stats.pioneer >= 1 && (!prev || prev.pioneer < 1),
  },
  {
    id: 'fact-first-shrub', tag: 'plant', icon: '🐝',
    title: 'Flowers = food for bees',
    body: 'Shrubs give bees and butterflies nectar. A single bee can visit 5,000 flowers in one day!',
    trigger: ({ stats, prev }) => stats.shrubs >= 1 && (!prev || prev.shrubs < 1),
  },
  {
    id: 'fact-first-tree', tag: 'tree', icon: '🌳',
    title: 'A tree is a whole world',
    body: 'One mature tree can be home to over 500 species of insects, birds and fungi at once.',
    trigger: ({ stats, prev }) => stats.canopy >= 1 && (!prev || prev.canopy < 1),
  },
  {
    id: 'fact-first-water', tag: 'water', icon: '💧',
    title: 'Ponds are super-helpful',
    body: 'A pond stores rainwater for dry days AND becomes a home for frogs, dragonflies and birds.',
    trigger: ({ stats, prev }) => stats.water >= 1 && (!prev || prev.water < 1),
  },
  {
    id: 'fact-bio-30', tag: 'wildlife', icon: '🦋',
    title: 'The animals are noticing',
    body: 'As more plants grow, more animals move in. This is called biodiversity — nature\'s variety pack.',
    trigger: ({ stats, prev }) => stats.bio >= 0.3 && (!prev || prev.bio < 0.3),
  },
  {
    id: 'fact-carbon', tag: 'climate', icon: '🌍',
    title: 'Fighting climate change',
    body: 'Your plants are pulling carbon dioxide out of the air. Trees are like the planet\'s lungs.',
    trigger: ({ stats, prev }) => stats.carbon >= 15 && (!prev || prev.carbon < 15),
  },
  {
    id: 'fact-cool', tag: 'climate', icon: '🌡️',
    title: 'You cooled it down',
    body: 'Green spaces can be up to 8°C cooler than bare concrete. Plants are natural air conditioning!',
    trigger: ({ stats, prev }) => stats.heat <= 0.5 && (!prev || prev.heat > 0.5),
  },
  {
    id: 'fact-half-green', tag: 'milestone', icon: '✨',
    title: 'Halfway to a jungle!',
    body: 'Half your land is green now. Every plant makes it easier for the next one to grow.',
    trigger: ({ stats, prev }) => stats.vegPct >= 0.5 && (!prev || prev.vegPct < 0.5),
  },
];

// Return at most one newly-triggered fact given current + previous stats.
// `seenIds` is a Set of fact ids already shown this level.
export function pickEcoFact(ctx, seenIds) {
  for (const fact of ECO_FACTS) {
    if (seenIds.has(fact.id)) continue;
    let fired = false;
    try { fired = !!fact.trigger(ctx); } catch { fired = false; }
    if (fired) return fact;
  }
  return null;
}

// Which concepts have just become unlockable this frame?
export function newlyUnlockedConcepts(ctx, unlockedSet) {
  const out = [];
  for (const c of CONCEPTS) {
    if (unlockedSet.has(c.id)) continue;
    let ok = false;
    try { ok = !!c.unlock(ctx); } catch { ok = false; }
    if (ok) out.push(c);
  }
  return out;
}

// ── Knowledge checks (per-level quiz) ────────────────────────────────────────
// Keyed by level id. Shown at completion in Learn Mode. Each question has
// options and the index of the correct one, plus a friendly explanation.
export const QUIZZES = {
  schoolyard: [
    {
      q: 'Why do we plant grass and small plants BEFORE big trees?',
      options: [
        'Big trees are too expensive',
        'Small plants build healthy soil the trees will need',
        'Trees don\'t like company',
      ],
      answer: 1,
      why: 'Small pioneer plants stabilise and enrich the soil first. This is called ecological succession.',
    },
    {
      q: 'What do bees and butterflies do for a garden?',
      options: [
        'They move pollen so plants can make seeds',
        'They eat all the leaves',
        'Nothing useful',
      ],
      answer: 0,
      why: 'Pollinators carry pollen between flowers — most of our food depends on them!',
    },
    {
      q: 'How does a pond help a park?',
      options: [
        'It just looks pretty',
        'It stores water and gives animals a home',
        'It makes the ground colder for no reason',
      ],
      answer: 1,
      why: 'Ponds store rainwater for dry times and become homes for frogs, insects and birds.',
    },
  ],
  desert: [
    {
      q: 'What is a stone bund used for in the desert?',
      options: ['Decoration', 'To slow rainwater so it soaks in', 'To block animals'],
      answer: 1,
      why: 'Half-moon bunds trap rainfall so it sinks into the soil instead of running away.',
    },
    {
      q: 'Why plant native grass first on cracked land?',
      options: [
        'It holds the soil and helps the next plants',
        'It is the tallest plant',
        'It scares away the sun',
      ],
      answer: 0,
      why: 'Grass roots stabilise loose soil, starting the chain of recovery.',
    },
  ],
  urban: [
    {
      q: 'Why do cities get so hot in summer?',
      options: [
        'Concrete and asphalt soak up and hold heat',
        'Cities are closer to the sun',
        'Because of streetlights',
      ],
      answer: 0,
      why: 'Hard dark surfaces absorb heat — this is the "urban heat island" effect. Trees and gardens cool it down.',
    },
    {
      q: 'What does a green roof do?',
      options: [
        'Makes a building look tall',
        'Adds plants that cool the building and soak up rain',
        'Nothing',
      ],
      answer: 1,
      why: 'Green roofs insulate buildings, cool the air, and absorb stormwater.',
    },
  ],
};

export function getQuiz(levelId) {
  return QUIZZES[levelId] || null;
}

export const SCHOLAR_XP_PER_CORRECT = 25;
