// src/sim/guides.js — Level strategy guides / walkthroughs.
// Free tier: build order + 3 tips. Premium tier (locked): optimal combos,
// speed-run strategy, common mistakes, real-world deep-dive.

export const GUIDES = {

  schoolyard: {
    name: 'Schoolyard Meadow',
    tagline: 'The golden rule: wildflowers → pollinators → berries → birds → trees → pond.',
    difficulty: 'Beginner',
    timeToWin: '12–18 years',
    free: {
      buildOrder: [
        { step: 1, action: 'Wildflowers', icon: '🌸', tip: 'Cover at least 6 bare tiles. Work from the centre outward — soil in the middle tends to be best.' },
        { step: 2, action: 'Compost patch', icon: '♻️', tip: 'Drop 2–3 compost patches near where you plan to put trees later. They\'ll boost soil health while you wait.' },
        { step: 3, action: 'Berry bushes', icon: '🍒', tip: 'Unlocks once you have 4 wildflower patches. Plant 3 near the wildflowers so bees can move between them.' },
        { step: 4, action: 'Bug hotel', icon: '🪲', tip: 'Place next to berry bushes and wildflowers — insects need both food and shelter nearby.' },
        { step: 5, action: 'Young trees', icon: '🌳', tip: 'Unlocks after 2 berry bushes. Plant next to compost patches for fastest growth. Trees near water also grow taller.' },
        { step: 6, action: 'Wildlife pond', icon: '💧', tip: 'Dig the pond once you have 20%+ vegetation. Place it near the centre with wildflowers on at least 2 sides.' },
      ],
      tips: [
        { icon: '🐝', title: 'Why order matters', body: 'Each stage creates the conditions for the next. Bees need flowers before they\'ll pollinate berries. Birds need berries before they\'ll spread tree seeds. You can\'t skip ahead.' },
        { icon: '💰', title: 'Save coins for the pond', body: 'The pond costs 24 coins and is the hardest objective. Don\'t spend everything on berry bushes — hold back at least 30 coins for the pond + surrounding plants.' },
        { icon: '📊', title: 'Watch the biodiversity bar', body: 'Biodiversity is your winning stat. It rises fastest when you have all four habitat types: wildflowers, shrubs, trees and water. One of each is worth more than four of the same.' },
      ],
    },
    premium: {
      optimalCombo: 'Place compost patches at positions (4,3), (8,6) and (10,4) — these hit the highest soil-health tiles. Trees planted on these tiles reach canopy in 2 fewer years.',
      speedRun: 'Skip bug hotel entirely on easy mode. Spend all energy budget on extra wildflowers in Year 1, rush to berry bush threshold by Year 3, pond by Year 7. Win in 11 years.',
      mistakes: [
        'Placing trees before berry bushes — they won\'t reach canopy height and waste coins',
        'Pond in a corner with no vegetation around it — frogs won\'t arrive',
        'Spending budget on compost before wildflowers — soil boost is wasted without plants',
      ],
      realWorld: 'The succession order in this level mirrors the exact methodology used by UK rewilding charity Plantlife in their "No Mow May" programme — native wildflowers first, then managed scrub, then structural trees over 5–15 years.',
    },
  },

  desert: {
    name: 'Desert Bloom',
    tagline: 'Half-moon bunds first — water retention is everything in the Sahel.',
    difficulty: 'Intermediate',
    timeToWin: '15–22 years',
    free: {
      buildOrder: [
        { step: 1, action: 'Stone bund', icon: '🪨', tip: 'Build 4–6 bunds in a crescent pattern across the damaged tiles. They capture rain and feed everything downstream.' },
        { step: 2, action: 'Native grass', icon: '🌾', tip: 'Plant grass in the soil pockets created behind your bunds. The moisture the bunds trap gives grass its best chance.' },
        { step: 3, action: 'Drought shrub', icon: '🌿', tip: 'Once grass covers 25% of the land, shrubs become viable. They fix nitrogen, improving soil for trees.' },
        { step: 4, action: 'Solar pump', icon: '☀️', tip: 'One solar pump powers irrigation for a 3×3 area. Place it central to your shrub zone.' },
        { step: 5, action: 'Agroforestry tree', icon: '🌳', tip: 'Plant trees only after shrubs are established. Acacia is the priority — it fixes nitrogen AND provides shade.' },
        { step: 6, action: 'Retention pond', icon: '💧', tip: 'Build the pond late, once you have trees. Tree roots prevent pond walls collapsing in the dry season.' },
      ],
      tips: [
        { icon: '🌧️', title: 'Bunds before everything', body: 'In the Sahel, water is the limiting factor. Every bund you place captures rainfall that would otherwise run off. Without bunds, plants die in the dry season regardless of what else you do.' },
        { icon: '🌡️', title: 'Watch the heat meter', body: 'The heat stat falls as vegetation covers the ground. High heat kills seedlings. If heat stays above 70%, add more bunds and grass before trying trees.' },
        { icon: '🌱', title: 'Succession still applies', body: 'Same rule as the schoolyard: grass → shrubs → trees. Desert environments just require the extra step of water retention infrastructure first.' },
      ],
    },
    premium: {
      optimalCombo: 'Build a chain of 5 bunds along the north-east ridge (tiles follow the natural contour). This creates a cascade effect where each bund\'s overflow waters the next zone.',
      speedRun: 'Year 1: 4 bunds + 6 grass tiles. Year 4: 4 shrubs. Year 6: solar pump. Year 8: 3 trees. Year 12: pond. Achievable in 14 years on normal difficulty.',
      mistakes: [
        'Planting trees before shrubs — they die in the first dry year without nitrogen-fixed soil',
        'Building the solar pump before having shrubs — wastes energy budget on unneeded irrigation',
        'Skipping bunds and going straight to grass — plants die in Year 2 dry season',
      ],
      realWorld: 'Niger\'s Great Green Wall used exactly this technique — half-moon bunds called "zai" pits, native Acacia senegal, and community-managed solar pumps. 200 million trees regenerated since 1984 across 5 million hectares.',
    },
  },

  coastal: {
    name: 'Coastal Crisis',
    tagline: 'Contain the oil first — you can\'t restore what\'s still being poisoned.',
    difficulty: 'Intermediate',
    timeToWin: '14–20 years',
    free: {
      buildOrder: [
        { step: 1, action: 'Oil boom', icon: '🟠', tip: 'Deploy booms around the oil slick immediately — they stop the spread. Cover the perimeter of all oil tiles before doing anything else.' },
        { step: 2, action: 'Oil skim platform', icon: '⚙️', tip: 'Place one skimmer inside the boom perimeter. It actively removes oil. One skimmer per 4 oil tiles is ideal.' },
        { step: 3, action: 'Saltmarsh', icon: '🌿', tip: 'Once oil is contained, plant saltmarsh on the tidal flats. It stabilises the shore and provides nursery habitat for fish.' },
        { step: 4, action: 'Young mangrove', icon: '🌱', tip: 'Mangrove saplings need saltmarsh established first — they share root space. Plant in clusters of 3–4.' },
        { step: 5, action: 'Wetland pool', icon: '💧', tip: 'Create wetland pools behind the mangrove line. They filter pollutants from inland runoff before it reaches the sea.' },
        { step: 6, action: 'Mature mangrove', icon: '🌳', tip: 'Mangroves take 6–8 years to mature. Patience here — a mature mangrove belt is the level\'s most powerful biodiversity multiplier.' },
      ],
      tips: [
        { icon: '🛢️', title: 'Oil spreads if you ignore it', body: 'Every year an oil tile is uncontained, it has a chance to spread to adjacent reef tiles. Skimmers remove oil 3× faster with a boom surrounding the area.' },
        { icon: '🦀', title: 'Reef tiles are precious', body: 'Reef obstacles can\'t be placed — but they\'re natural biodiversity hotspots. Keep them clean and mangroves will colonise around them automatically over time.' },
        { icon: '🌊', title: 'Tidal flat placement', body: 'Saltmarsh only grows on tidal flat (wet sand) tiles — not on reef or deep water. Plan your planting zones around the sandy shallows.' },
      ],
    },
    premium: {
      optimalCombo: 'Surround all 6 oil tiles with booms in Year 1 (costs 36 budget). Place 2 skimmers in Year 2. This clears all oil by Year 5, letting you start saltmarsh 8 years earlier than reactive players.',
      speedRun: 'Boom all oil immediately, 2 skimmers, then ignore the oil and rush saltmarsh + 4 mangrove saplings by Year 6. The biodiversity from mangroves outpaces oil damage on easy mode.',
      mistakes: [
        'Planting saltmarsh before containing oil — oil tides kill fresh plantings',
        'Building wetland before mangrove — wetland needs the mangrove root system to filter effectively',
        'Only one oil boom — the slick will creep around a partial barrier',
      ],
      realWorld: 'The 2010 Deepwater Horizon response used boom-and-skim exactly as modelled here. Louisiana\'s subsequent mangrove restoration has sequestered 1.4M tonnes of carbon and reduced storm surge damage by 40%.',
    },
  },

  urban: {
    name: 'City Rewild',
    tagline: 'Green roofs and rain gardens cool the city — concrete is your enemy, not your canvas.',
    difficulty: 'Advanced',
    timeToWin: '16–24 years',
    free: {
      buildOrder: [
        { step: 1, action: 'Pocket lawn', icon: '🌱', tip: 'Replace asphalt and concrete tiles with pocket lawns first. Even a thin layer of grass dramatically cuts surface heat.' },
        { step: 2, action: 'Rain garden', icon: '🌧️', tip: 'Place rain gardens at low points — they capture stormwater runoff. Every rain garden placed reduces flood risk for adjacent tiles.' },
        { step: 3, action: 'Street planter', icon: '🌿', tip: 'Plant street planters along corridors to connect green patches. Connectivity is how wildlife moves through the city.' },
        { step: 4, action: 'Cool pavement + PV', icon: '☀️', tip: 'Converts remaining hard surfaces into energy-generating cooler ground. Essential for hitting the heat reduction objective.' },
        { step: 5, action: 'Green roof', icon: '🏠', tip: 'Green roofs on building tiles insulate, cool and create elevated habitat. Prioritise buildings surrounded by other green.' },
        { step: 6, action: 'Mature street tree', icon: '🌳', tip: 'Plant trees last — they need the rain garden infrastructure to handle urban stormwater. Trees near rain gardens grow 40% faster.' },
      ],
      tips: [
        { icon: '🌡️', title: 'Urban heat island is the main threat', body: 'The city starts at 85% heat. You need to get it below 40% to win. Canopy trees cool the most per tile, but they need support infrastructure first.' },
        { icon: '🔗', title: 'Connectivity matters', body: 'Isolated green patches don\'t create corridors. Connect pocket lawns and planters into chains — biodiversity jumps when patches touch each other.' },
        { icon: '💸', title: 'Budget is tight here', body: 'Urban restoration is expensive. Green roofs cost 28 coins each. Prioritise cool pavement for energy income first — it pays back through the energy budget.' },
      ],
    },
    premium: {
      optimalCombo: 'Rain garden at every intersection tile (low points), then use the water budget from reduced runoff to fund green roofs. The combined stormwater + insulation effect drops heat faster than any other combination.',
      speedRun: 'Max out pocket lawns and cool pavement in Years 1–4 (energy income), use energy budget to fund green roofs in Year 5–8, trees in Year 9–12. Win by Year 16.',
      mistakes: [
        'Trees before rain gardens — urban stormwater drowns root zones in Year 1',
        'Green roofs before street-level green — rooftop wildlife needs ground-level corridors to reach them',
        'Ignoring buildings entirely — building tiles give the most cooling per coin when converted to green roof',
      ],
      realWorld: 'Singapore\'s "City in a Garden" strategy (2009–present) used this exact sequence: street-level lawn → rain gardens → rooftop gardens → street trees. Urban biodiversity up 40% in 15 years.',
    },
  },

  forest: {
    name: 'Forest Frontline',
    tagline: 'Firebreaks first — you\'re fighting the burn as much as growing the forest.',
    difficulty: 'Advanced',
    timeToWin: '18–28 years',
    free: {
      buildOrder: [
        { step: 1, action: 'Firebreak', icon: '🔥', tip: 'Build firebreaks in a diagonal line across the burn zone. They don\'t stop fire — they slow its spread long enough for your vegetation to mature.' },
        { step: 2, action: 'Cover crop', icon: '🌾', tip: 'Plant cover crops immediately behind the firebreak. They stabilise the burnt soil and prevent erosion before trees can take hold.' },
        { step: 3, action: 'Cocoa shade plot', icon: '🍫', tip: 'Cocoa shade plots generate community income AND provide intermediate canopy. Plant in the most sheltered areas first.' },
        { step: 4, action: 'Solar weir pump', icon: '⚡', tip: 'One weir pump per river tile provides irrigation for a 4×4 zone. Essential for dry season survival in Year 3+.' },
        { step: 5, action: 'Native canopy', icon: '🌳', tip: 'Plant native trees only after cocoa provides shade. Direct sunlight on bare soil kills native seedlings in the Borneo dry season.' },
        { step: 6, action: 'Stream weir', icon: '💧', tip: 'Build weirs on stream tiles to slow water flow and recharge the water table. Late-game but critical for long-term forest water budget.' },
      ],
      tips: [
        { icon: '🔥', title: 'Fire can ruin your work', body: 'Damaged (burnt) tiles can randomly catch fire again each year if not covered by a firebreak or vegetation. A single fire event can set you back 4 years.' },
        { icon: '🌿', title: 'Cocoa before canopy', body: 'Native canopy trees need 30% shade cover to germinate in this climate. Cocoa shade plots create that intermediate canopy without full water demand.' },
        { icon: '💰', title: 'Community trust pays', body: 'Trust above 70 unlocks cocoa market bonuses — budget income increases by 20%. Keep trust high by planting cocoa before anything else.' },
      ],
    },
    premium: {
      optimalCombo: 'Firebreaks in an X-pattern through the centre, cover crops filling all damaged tiles in Year 2. This creates a fireproof core from Year 3 onward, letting you stop defending and start expanding.',
      speedRun: 'Y1: 3 firebreaks + all cover crops. Y3: 4 cocoa. Y5: solar weir. Y8: native canopy burst (plant 6 tiles at once). Y14: stream weirs. Win in 17 years.',
      mistakes: [
        'Native canopy before cocoa — 60% seedling death rate without intermediate shade',
        'No firebreak — one fire event in Year 5 can destroy half your canopy investment',
        'Stream weirs before the water table is stable — they collapse in drought years',
      ],
      realWorld: 'The Rainforest Trust\'s Borneo corridor project (2018–present) used cocoa agroforestry as the economic bridge between slash-and-burn and native forest restoration — exactly the mechanic in this level.',
    },
  },

  planet: {
    name: 'Planet Reboot',
    tagline: 'Atmosphere first — nothing else is possible on a toxic world.',
    difficulty: 'Expert',
    timeToWin: '20–30 years',
    free: {
      buildOrder: [
        { step: 1, action: 'Atmosphere processor', icon: '⚙️', tip: 'Build 2 processors in Years 1–2. Nothing grows until atmospheric toxicity drops below 60%. Processors are the unlock condition for everything else.' },
        { step: 2, action: 'Microbial mat', icon: '🦠', tip: 'Once atmosphere hits 60%, seed microbial mats on regolith tiles. They are the only pioneer organism that survives these conditions.' },
        { step: 3, action: 'Biodome shell', icon: '🔵', tip: 'Build biodome shells around microbial clusters. They amplify growth rate 3× and protect against atmospheric spikes.' },
        { step: 4, action: 'Lichen colony', icon: '🟢', tip: 'Lichen grows in microbial zones — it creates soil from regolith. Without lichen, nothing larger can grow.' },
        { step: 5, action: 'Algae pool', icon: '💚', tip: 'Algae pools produce oxygen and sequester carbon simultaneously. Place them in the lowest terrain tiles for natural water pooling.' },
        { step: 6, action: 'Dome tree', icon: '🌳', tip: 'The final stage. Dome trees only survive inside completed biodome shells. Plant in the centre of your most established biodome cluster.' },
      ],
      tips: [
        { icon: '🌡️', title: 'Atmosphere is a countdown', body: 'Without processors running, atmospheric toxicity rises 2% per year. If it hits 100%, you lose immediately. Always keep at least 2 processors running.' },
        { icon: '🔗', title: 'Biodomes must connect', body: 'A biodome that doesn\'t touch another biodome provides 1× growth. Touching one other = 2×. Touching two or more = 3×. Cluster them.' },
        { icon: '⚡', title: 'Energy is your bottleneck', body: 'Atmosphere processors consume 8 energy each per year. Plan your energy budget around keeping them running — lichen and algae generate small energy offsets.' },
      ],
    },
    premium: {
      optimalCombo: 'Build 3 processors in a triangle (not a line). The triangle formation covers the most tiles while sharing atmosphere improvement. Add biodomes to each processor tile to start a connected cluster from Day 1.',
      speedRun: 'Y1: 3 processors. Y3: 5 microbial mats (cluster). Y5: 3 biodomes (touching). Y7: lichen fills the cluster. Y10: 2 algae pools. Y13: dome trees. Win in 19 years.',
      mistakes: [
        'Only 1 atmosphere processor — toxicity rises faster than 1 unit can clear it',
        'Lichen before microbial mat — lichen can\'t form without the microbial substrate',
        'Biodomes in a line instead of a cluster — you lose the exponential connection bonus',
      ],
      realWorld: 'This level mirrors real proposals for Mars terraforming (NASA/SpaceX roadmaps): atmospheric CO₂ processors first, then extremophile microbial mats (Bacillus and Cyanobacteria), then enclosed dome habitats for photosynthetic organisms.',
    },
  },
};

export function getGuide(levelId) {
  return GUIDES[levelId] || null;
}
