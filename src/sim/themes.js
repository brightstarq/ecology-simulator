// sim/themes.js — Per-level colour palettes using CSS vars.
// CSS vars are defined per [data-theme] in index.css from the prototypes.
// This returns CSS var() references so the SVG tiles respond to theme switching.

export const THEME_PALETTES = {
  sunset:  {
    soil:     { top:'var(--soil,#F1D29A)',     edge:'var(--soil-edge,#B98444)' },
    damaged:  { top:'var(--damaged,#C58F5C)',  edge:'var(--damaged-dk,#9B6837)' },
    obstacle: { top:'var(--obstacle,#9A8A78)', edge:'var(--obstacle-dk,#6F5F4E)' },
    pioneer:  { top:'var(--pioneer,#C4DA7A)',  edge:'var(--pioneer-dk,#92B452)' },
    shrub:    { top:'var(--shrub,#7BB75D)',    edge:'var(--shrub-dk,#4E8838)' },
    canopy:   { top:'var(--canopy,#3E8C46)',   edge:'var(--canopy-dk,#245C2C)' },
    water:    { top:'var(--water,#6FC4D9)',    edge:'var(--water-dk,#2E8DA6)' },
    energy:   { top:'var(--soil-dk,#D9AC6A)', edge:'var(--soil-edge,#B98444)' },
    modifier: { top:'var(--obstacle,#9A8A78)', edge:'var(--obstacle-dk,#6F5F4E)' },
  },
  coastal: {
    soil:     { top:'var(--soil,#D4C8A8)',     edge:'var(--soil-edge,#6E6042)' },
    damaged:  { top:'var(--damaged,#2A2218)',  edge:'var(--damaged-dk,#0A0808)' },
    obstacle: { top:'var(--obstacle,#8A7080)', edge:'var(--obstacle-dk,#5A4555)' },
    pioneer:  { top:'var(--pioneer,#8AAA60)',  edge:'var(--pioneer-dk,#5A8038)' },
    shrub:    { top:'var(--shrub,#5A8A45)',    edge:'var(--shrub-dk,#3A6A30)' },
    canopy:   { top:'var(--canopy,#2A6A35)',   edge:'var(--canopy-dk,#154420)' },
    water:    { top:'var(--water,#5AB0C8)',    edge:'var(--water-dk,#2A7090)' },
    energy:   { top:'var(--soil-dk,#A89770)', edge:'var(--soil-edge,#6E6042)' },
    modifier: { top:'var(--obstacle,#8A7080)', edge:'var(--obstacle-dk,#5A4555)' },
  },
  urban: {
    soil:     { top:'var(--soil,#B8B0A0)',     edge:'var(--soil-edge,#5A4F40)' },
    damaged:  { top:'var(--damaged,#4A3A30)',  edge:'var(--damaged-dk,#2A1F18)' },
    obstacle: { top:'var(--obstacle,#8A7868)', edge:'var(--obstacle-dk,#5A4838)' },
    pioneer:  { top:'var(--pioneer,#C4DA7A)',  edge:'var(--pioneer-dk,#92B452)' },
    shrub:    { top:'var(--shrub,#5AAE50)',    edge:'var(--shrub-dk,#2F8030)' },
    canopy:   { top:'var(--canopy,#2D8A45)',   edge:'var(--canopy-dk,#155525)' },
    water:    { top:'var(--water,#6FC4D9)',    edge:'var(--water-dk,#2E8DA6)' },
    energy:   { top:'var(--soil-dk,#8A8070)', edge:'var(--soil-edge,#5A4F40)' },
    modifier: { top:'var(--obstacle,#8A7868)', edge:'var(--obstacle-dk,#5A4838)' },
  },
  forest: {
    soil:     { top:'var(--soil,#C8A878)',     edge:'var(--soil-edge,#604A20)' },
    damaged:  { top:'var(--damaged,#4A2818)',  edge:'var(--damaged-dk,#2A1208)' },
    obstacle: { top:'var(--obstacle,#8A8070)', edge:'var(--obstacle-dk,#5A5040)' },
    pioneer:  { top:'var(--pioneer,#B8D060)',  edge:'var(--pioneer-dk,#7AAA30)' },
    shrub:    { top:'var(--shrub,#5A8A45)',    edge:'var(--shrub-dk,#3A6A30)' },
    canopy:   { top:'var(--canopy,#1F6A30)',   edge:'var(--canopy-dk,#0A4015)' },
    water:    { top:'var(--water,#5AB8C8)',    edge:'var(--water-dk,#2A7890)' },
    energy:   { top:'var(--soil-dk,#957848)', edge:'var(--soil-edge,#604A20)' },
    modifier: { top:'var(--obstacle,#8A8070)', edge:'var(--obstacle-dk,#5A5040)' },
  },
  planet: {
    soil:     { top:'var(--soil,#8A5040)',     edge:'var(--soil-edge,#3A1A10)' },
    damaged:  { top:'var(--damaged,#E0D0E0)',  edge:'var(--damaged-dk,#B0A0B0)' },
    obstacle: { top:'var(--obstacle,#4A5A6A)', edge:'var(--obstacle-dk,#2A3A4A)' },
    pioneer:  { top:'var(--pioneer,#5A9A6A)',  edge:'var(--pioneer-dk,#3A7045)' },
    shrub:    { top:'var(--shrub,#8AC080)',    edge:'var(--shrub-dk,#5A9050)' },
    canopy:   { top:'var(--canopy,#4AC080)',   edge:'var(--canopy-dk,#2A8050)' },
    water:    { top:'var(--water,#45C0A0)',    edge:'var(--water-dk,#208A70)' },
    energy:   { top:'var(--soil-dk,#5A2A20)', edge:'var(--soil-edge,#3A1A10)' },
    modifier: { top:'var(--obstacle,#4A5A6A)', edge:'var(--obstacle-dk,#2A3A4A)' },
  },
};

export function getTileColors(role, theme) {
  // Normalise legacy tile types to roles
  const r = role === 'grass' ? 'pioneer'
    : role === 'tree'      ? 'canopy'
    : role === 'pond'      ? 'water'
    : role === 'solar'     ? 'energy'
    : role === 'rock'      ? 'obstacle'
    : role === 'sand'      ? 'soil'
    : role === 'degraded'  ? 'damaged'
    : role === 'bund'      ? 'modifier'
    : role || 'soil';
  const palette = THEME_PALETTES[theme] || THEME_PALETTES.sunset;
  return palette[r] || palette.soil;
}