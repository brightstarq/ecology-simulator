import { useState, useEffect, useRef, useMemo } from 'react';
import { ACTIONS, OBJECTIVES, TILE_LABELS } from '../../sim/sim.js';
import { getRank, ACHIEVEMENTS, RANKS } from '../../sim/rewards.js';
import { CONCEPTS, getQuiz, SCHOLAR_XP_PER_CORRECT } from '../../sim/education.js';

// panels.jsx — HUD, palette, stats, time bar, intro, toasts, impact panel.


// ── Animated number counter (tweens to target over duration ms) ─────────────

function useAnimatedNumber(target, duration = 600) {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    fromRef.current = val;
    const start = performance.now();
    let raf;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      setVal(fromRef.current + (target - fromRef.current) * e);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}

export function AnimatedNum({ value, decimals = 0, suffix = '' }) {
  const v = useAnimatedNumber(value, 600);
  const txt = decimals === 0 ? Math.round(v) : v.toFixed(decimals);
  return <span>{txt}{suffix}</span>;
}

// ── Icons (kept tiny + consistent) ──────────────────────────────────────────

const IconWater = () => <svg viewBox="0 0 16 16" width="14" height="14"><path d="M8 1.5s-5 5.2-5 8.5a5 5 0 0 0 10 0c0-3.3-5-8.5-5-8.5Z" fill="currentColor"/></svg>;
const IconSeed  = () => <svg viewBox="0 0 16 16" width="14" height="14"><ellipse cx="8" cy="9" rx="4" ry="5" fill="currentColor"/><path d="M8 4c0-2 2-3 2-3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/></svg>;
const IconBolt  = () => <svg viewBox="0 0 16 16" width="14" height="14"><path d="M9 1 3 9h4l-1 6 6-8H8l1-6Z" fill="currentColor"/></svg>;
const IconCoin  = () => <svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="6" fill="currentColor"/><text x="8" y="11" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--ink)">$</text></svg>;
const IconPlay  = () => <svg viewBox="0 0 16 16" width="14" height="14"><polygon points="3,2 13,8 3,14" fill="currentColor"/></svg>;
const IconPause = () => <svg viewBox="0 0 16 16" width="14" height="14"><rect x="3" y="2" width="3.5" height="12" fill="currentColor"/><rect x="9.5" y="2" width="3.5" height="12" fill="currentColor"/></svg>;
const IconStep  = () => <svg viewBox="0 0 16 16" width="14" height="14"><polygon points="3,2 11,8 3,14" fill="currentColor"/><rect x="11" y="2" width="2" height="12" fill="currentColor"/></svg>;
const IconReset = () => <svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8a5 5 0 1 0 1.5-3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/><polyline points="2,2 2,5 5,5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Check     = () => <svg viewBox="0 0 16 16" width="11" height="11"><path d="M3 8 6.5 11.5 13 5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconTrend = () => <svg viewBox="0 0 16 16" width="13" height="13"><polyline points="1,12 5,8 9,10 14,3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14,3 14,7 10,3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;

function ActionIcon({ id, name, deco }) {
  const W = 34;
  const n = (name||'').toLowerCase();

  // Priority 1: vocab deco — exact same key IsoMap uses on the canvas tile.
  // This guarantees the palette icon matches what gets drawn after placement.
  // Priority 2: name keywords for actions without a vocab entry (e.g. remove).
  // Priority 3: slot id fallback.
  let cat = deco; // start with canvas deco

  if (!cat || cat === 'shrub' || cat === 'tree' || cat === 'grass') {
    // These are generic — refine with name keywords for better visuals
    if      (n.includes('wildflower') || n.includes('flower'))        cat = 'wildflower';
    else if (n.includes('berry'))                                      cat = 'berry';
    else if (n.includes('cocoa') || n.includes('cacao'))              cat = cat || 'cocoa';
    else if (n.includes('young tree') || n.includes('agroforest'))    cat = cat || 'tree';
    else if (!cat) {
      // no deco at all — fall back to slot id
      cat = id === 'pioneer' ? 'grass'
          : id === 'shrub'   ? 'shrub'
          : id === 'canopy'  ? 'tree'
          : id === 'water'   ? 'pond'
          : id === 'energy'  ? 'solar'
          : id === 'modifier'? 'bund'
          : id === 'remove'  ? 'remove'
          : 'unknown';
    }
  }

  // Map canvas deco keys that need renaming for the icon switch
  if (cat === 'mangrove-young') cat = 'mangrove';
  if (cat === 'algae-pool')     cat = 'algae';
  if (cat === 'dometree')       cat = 'dome';
  if (cat === 'platform')       cat = 'skim';
  if (cat === 'solar-pump')     cat = 'weir-pump';
  if (cat === 'covercrop')      cat = 'crop';
  if (cat === 'atmoproc')       cat = 'atmoproc';
  if (cat === 'cool-pave')      cat = 'cool-pave';
  if (cat === 'green-roof')     cat = 'green-roof';
  if (cat === 'rain-garden')    cat = 'rain-garden';
  if (cat === 'sand' || cat === 'sand-wet' || cat === 'regolith' || cat === 'salt') cat = 'grass';
  if (cat === 'cracks' || cat === 'asphalt' || cat === 'concrete' ||
      cat === 'burnt' || cat === 'cleared')  cat = 'remove'; // damaged/soil tiles
  if (cat === 'icerock')        cat = 'bund';
  if (cat === 'oil')            cat = 'oil-boom';
  if (cat === 'reef' || cat === 'rocks' || cat === 'building') cat = 'bund';
  if (id === 'remove')          cat = 'remove';

  switch (cat) {
    // ── Schoolyard specials ───────────────────────────────────────────────────
    case 'wildflower': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="23" rx="10" ry="2" fill="var(--soil-dk)" opacity=".4"/>
        {[[8,15,'#f9a8d4'],[14,12,'#fcd34d'],[20,15,'#86efac'],[11,19,'#a78bfa'],[17,18,'#fb923c']].map(([x,y,c],k)=>(
          <g key={k}>
            <circle cx={x} cy={y} r="3.5" fill={c} opacity=".85"/>
            <circle cx={x} cy={y} r="1.5" fill="#fef3c7"/>
          </g>
        ))}
        {[[8,15],[14,12],[20,15],[11,19],[17,18]].map(([x,y],k)=>(
          <line key={k} x1={x} y1={y+3} x2={x} y2={23} stroke="var(--pioneer-dk)" strokeWidth="1.5" strokeLinecap="round"/>
        ))}
      </svg>);
    case 'berry': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="23" rx="10" ry="2" fill="var(--soil-dk)" opacity=".4"/>
        <rect x="13" y="14" width="2.5" height="9" fill="#7A4E2A"/>
        <circle cx="9"  cy="13" r="5.5" fill="var(--shrub-dk)"/>
        <circle cx="17" cy="12" r="6.5" fill="var(--shrub)"/>
        <circle cx="14" cy="11" r="5" fill="var(--shrub-dk)"/>
        {[[8,11],[12,9],[16,10],[10,14],[18,13]].map(([x,y],k)=>(
          <circle key={k} cx={x} cy={y} r="1.8" fill="#dc2626" opacity=".9"/>
        ))}
      </svg>);
    case 'bug-hotel': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <rect x="5" y="10" width="18" height="14" rx="2" fill="#92400e"/>
        <rect x="5" y="8"  width="18" height="3.5" rx="1" fill="#78350f"/>
        {/* Rows of circular holes */}
        {[[8,13],[13,13],[18,13],[8,17],[13,17],[18,17],[10.5,21],[15.5,21]].map(([x,y],k)=>(
          <circle key={k} cx={x} cy={y} r="2" fill="#1c0a00" opacity=".8"/>
        ))}
        {/* Tiny bee */}
        <ellipse cx="21" cy="8" rx="2.5" ry="1.8" fill="#fbbf24"/>
        <line x1="19" y1="8" x2="23" y2="8" stroke="#1c0a00" strokeWidth=".8"/>
        <path d="M20 6 Q21 4 22 6" stroke="#1c0a00" strokeWidth=".8" fill="none"/>
      </svg>);
    case 'compost': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        {/* Bin */}
        <path d="M6 14 Q6 24 14 24 Q22 24 22 14 L20 12 H8 Z" fill="#78350f"/>
        <rect x="8" y="10" width="12" height="3" rx="1" fill="#92400e"/>
        {/* Leaves/organic matter inside */}
        <ellipse cx="11" cy="18" rx="2.5" ry="1.5" fill="#4ade80" opacity=".7" transform="rotate(-20,11,18)"/>
        <ellipse cx="16" cy="17" rx="2.5" ry="1.5" fill="#86efac" opacity=".7" transform="rotate(15,16,17)"/>
        <ellipse cx="13" cy="20" rx="2" ry="1.2" fill="#4ade80" opacity=".6"/>
        {/* Worm */}
        <path d="M9 21 Q11 19 13 21 Q15 23 17 21" stroke="#f87171" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* Steam */}
        <path d="M12 10 Q11 8 12 6" stroke="var(--soil-dk)" strokeWidth="1" fill="none" strokeLinecap="round" opacity=".5"/>
        <path d="M16 10 Q15 7 16 5" stroke="var(--soil-dk)" strokeWidth="1" fill="none" strokeLinecap="round" opacity=".4"/>
      </svg>);
    case 'oil-boom': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="20" rx="12" ry="5" fill="var(--water)" opacity=".35"/>
        {/* Dark oil slick */}
        <ellipse cx="14" cy="19" rx="8" ry="3" fill="#1c1917" opacity=".55"/>
        {/* Boom — orange floating barrier */}
        <path d="M4 20 Q14 16 24 20" stroke="#f97316" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        {[5,10,14,18,23].map((x,k)=>(
          <circle key={k} cx={x} cy={20 - Math.sin((x-4)/20*Math.PI)*4} r="2.2" fill="#f97316"/>
        ))}
      </svg>);
    case 'weir-pump': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <rect x="3" y="16" width="22" height="4" rx="1" fill="var(--soil-dk)"/>
        <ellipse cx="14" cy="15" rx="10" ry="4" fill="var(--water)" opacity=".5"/>
        {/* Pump unit */}
        <rect x="11" y="8" width="6" height="8" rx="1" fill="var(--obstacle-dk)"/>
        <polygon points="8,8 20,8 14,4" fill="var(--obstacle-dk)"/>
        {/* Solar panel on top */}
        <rect x="11" y="5" width="6" height="3" fill="var(--water)" opacity=".8"/>
        <line x1="14" y1="5" x2="14" y2="8" stroke="#fff" opacity=".5" strokeWidth=".8"/>
      </svg>);
    case 'cocoa': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="23" rx="10" ry="2" fill="var(--soil-dk)" opacity=".4"/>
        <rect x="12.5" y="14" width="3" height="9" fill="#92400e"/>
        {/* Canopy */}
        <ellipse cx="14" cy="11" rx="9" ry="7" fill="var(--canopy-dk)"/>
        <ellipse cx="12" cy="9" rx="6" ry="4.5" fill="var(--canopy)"/>
        {/* Cocoa pods */}
        {[[9,14],[16,13],[12,16]].map(([x,y],k)=>(
          <ellipse key={k} cx={x} cy={y} rx="2" ry="3" fill="#b45309" opacity=".9" transform={`rotate(${k*15-10},${x},${y})`}/>
        ))}
      </svg>);
    // ── Vegetation (shared) ───────────────────────────────────────────────────
    case 'grass': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="22" rx="11" ry="2.5" fill="var(--soil-dk)" opacity=".5"/>
        <path d="M5 22 q1 -10 3 -14 M11 22 q-1 -10 0 -14 M17 22 q0 -10 1 -14 M23 22 q-1 -10 -2 -13"
              stroke="var(--pioneer-dk)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>);
    case 'crop': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="22" rx="11" ry="2.5" fill="var(--soil-dk)" opacity=".5"/>
        {[5,10,15,20].map((x,k)=><path key={k} d={`M${x} 22 q1 -6 2 -10`} stroke="var(--pioneer)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>)}
        <ellipse cx="14" cy="11" rx="7" ry="3" fill="var(--pioneer)" opacity=".6"/>
      </svg>);
    case 'marsh': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="20" rx="12" ry="4" fill="var(--water)" opacity=".4"/>
        {[7,12,17,22].map((x,k)=><path key={k} d={`M${x} 20 q1 -8 ${k%2?1.5:-1.5} -12`} stroke="var(--pioneer)" strokeWidth="2" fill="none" strokeLinecap="round"/>)}
      </svg>);
    case 'microbe': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="22" rx="11" ry="3" fill="var(--soil-dk)" opacity=".4"/>
        {[[8,16],[14,14],[20,16],[11,18],[17,18]].map(([x,y],k)=>(
          <circle key={k} cx={x} cy={y} r="2.2" fill="var(--pioneer)" opacity=".75"/>
        ))}
        <circle cx="14" cy="12" r="3.5" fill="var(--pioneer)" opacity=".9"/>
        {[[14,8],[10,9],[18,9]].map(([x,y],k)=>(
          <circle key={k} cx={x} cy={y} r="1.2" fill="var(--pioneer-dk)"/>
        ))}
      </svg>);
    case 'shrub': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="22" rx="11" ry="2.5" fill="var(--soil-dk)" opacity=".5"/>
        <circle cx="9"  cy="14" r="6" fill="var(--shrub)"/>
        <circle cx="17" cy="13" r="7" fill="var(--shrub-dk)"/>
        <circle cx="17" cy="12" r="5.5" fill="var(--shrub)"/>
      </svg>);
    case 'lichen': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="22" rx="11" ry="2" fill="var(--soil-dk)" opacity=".4"/>
        {[[7,18],[14,15],[21,18],[10,20],[18,20]].map(([x,y],k)=>(
          <ellipse key={k} cx={x} cy={y} rx="3.5" ry="2.2" fill="var(--shrub)" opacity=".8"/>
        ))}
      </svg>);
    case 'mangrove': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="22" rx="12" ry="3" fill="var(--water)" opacity=".45"/>
        <line x1="14" y1="22" x2="10" y2="14" stroke="var(--shrub-dk)" strokeWidth="1.8"/>
        <line x1="14" y1="22" x2="18" y2="14" stroke="var(--shrub-dk)" strokeWidth="1.8"/>
        <line x1="14" y1="14" x2="14" y2="8"  stroke="var(--shrub-dk)" strokeWidth="1.5"/>
        <circle cx="14" cy="8" r="5.5" fill="var(--shrub)" opacity=".9"/>
        <circle cx="11" cy="6" r="3.5" fill="var(--shrub-dk)" opacity=".7"/>
      </svg>);
    case 'mangrove-big': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="23" rx="12" ry="3" fill="var(--water)" opacity=".45"/>
        {[[8,23],[14,23],[20,23]].map(([x,y],k)=>(
          <line key={k} x1={x} y1={y} x2={14} y2={10} stroke="var(--canopy-dk)" strokeWidth="1.5"/>
        ))}
        <rect x="12.5" y="10" width="3" height="8" fill="var(--canopy-dk)"/>
        <ellipse cx="14" cy="8" rx="9" ry="7" fill="var(--canopy-dk)"/>
        <ellipse cx="12" cy="6" rx="6" ry="4" fill="var(--canopy)"/>
      </svg>);
    case 'tree': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="24" rx="11" ry="2" fill="var(--soil-dk)" opacity=".5"/>
        <rect x="12.5" y="14" width="3" height="10" fill="#7A4E2A"/>
        <ellipse cx="14" cy="11" rx="10" ry="9" fill="var(--canopy-dk)"/>
        <ellipse cx="12" cy="9" rx="7" ry="5" fill="var(--canopy)"/>
      </svg>);
    case 'dome': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="22" rx="11" ry="2" fill="var(--soil-dk)" opacity=".4"/>
        <rect x="12.5" y="14" width="3" height="8" fill="var(--canopy-dk)" opacity=".7"/>
        <ellipse cx="14" cy="12" rx="9" ry="8" fill="none" stroke="var(--water)" strokeWidth="1.5" opacity=".6"/>
        <ellipse cx="14" cy="12" rx="6" ry="5.5" fill="var(--canopy)" opacity=".8"/>
      </svg>);
    // ── Water / infrastructure ────────────────────────────────────────────────
    case 'pond': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="16" rx="12" ry="7" fill="var(--water-dk)"/>
        <ellipse cx="14" cy="15" rx="10" ry="5.5" fill="var(--water)"/>
        <path d="M6 14 q3 -2 6 0 M16 16 q3 -2 6 0" stroke="#fff" strokeWidth="1" fill="none" opacity=".7" strokeLinecap="round"/>
      </svg>);
    case 'wetland': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="17" rx="12" ry="6" fill="var(--water)" opacity=".6"/>
        {[6,14,22].map((x,k)=><path key={k} d={`M${x} 17 q1 -5 1.5 -8`} stroke="var(--pioneer)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>)}
        <ellipse cx="14" cy="17" rx="10" ry="4" fill="var(--water)" opacity=".4"/>
      </svg>);
    case 'rain-garden': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="19" rx="11" ry="4" fill="var(--water)" opacity=".5"/>
        <ellipse cx="14" cy="18" rx="8" ry="3" fill="var(--pioneer)" opacity=".6"/>
        {[9,14,19].map((x,k)=><path key={k} d={`M${x} 18 q0 -4 1 -6`} stroke="var(--pioneer-dk)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>)}
        {[10,15,20].map((x,k)=><path key={k} d={`M${x} 8 q0 3 0 5`} stroke="var(--water)" strokeWidth="1.2" strokeDasharray="2 2" fill="none"/>)}
      </svg>);
    case 'algae': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="16" rx="12" ry="7" fill="var(--water-dk)" opacity=".5"/>
        <ellipse cx="14" cy="15" rx="10" ry="5.5" fill="var(--water)" opacity=".6"/>
        {[[8,14],[14,12],[20,14],[11,16],[17,15]].map(([x,y],k)=>(
          <ellipse key={k} cx={x} cy={y} rx="2.5" ry="1.5" fill="var(--pioneer)" opacity=".8"/>
        ))}
      </svg>);
    case 'weir': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <rect x="3" y="16" width="22" height="4" rx="1" fill="var(--soil-dk)"/>
        <ellipse cx="14" cy="15" rx="10" ry="4" fill="var(--water)" opacity=".6"/>
        <path d="M3 16 q5 -2 11 0 q5 2 11 0" stroke="var(--water-dk)" strokeWidth="1.2" fill="none"/>
      </svg>);
    case 'solar': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="24" rx="9" ry="2" fill="var(--soil-dk)" opacity=".5"/>
        <polygon points="3,14 13,6 25,9 15,18" fill="var(--water)" stroke="var(--water-dk)" strokeWidth="1"/>
        <line x1="8" y1="11" x2="20" y2="13" stroke="#fff" opacity=".5"/>
        <rect x="13" y="17" width="2" height="6" fill="var(--soil-dk)"/>
        <rect x="10" y="22" width="8" height="2" rx="1" fill="var(--soil-dk)"/>
      </svg>);
    case 'skim': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="20" rx="12" ry="4" fill="var(--water)" opacity=".4"/>
        <rect x="5" y="15" width="18" height="5" rx="2" fill="var(--soil-dk)"/>
        <rect x="8" y="10" width="12" height="3" rx="1" fill="var(--soil-dk)" opacity=".7"/>
        <path d="M7 18 q7 -2 14 0" stroke="var(--water)" strokeWidth="1.2" fill="none"/>
        <circle cx="14" cy="11.5" r="2" fill="var(--water-dk)"/>
      </svg>);
    case 'atmoproc': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <rect x="10" y="16" width="8" height="8" rx="2" fill="var(--soil-dk)"/>
        <rect x="12" y="10" width="4" height="6" fill="var(--soil-dk)"/>
        <circle cx="14" cy="8" r="4" fill="none" stroke="var(--water)" strokeWidth="1.5"/>
        <circle cx="14" cy="8" r="2" fill="var(--water)" opacity=".6"/>
        {[[6,6],[22,6],[6,16],[22,16]].map(([x,y],k)=>(
          <line key={k} x1={14} y1={8} x2={x} y2={y} stroke="var(--water)" strokeWidth=".8" opacity=".5"/>
        ))}
      </svg>);
    case 'cool-pave': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <rect x="3" y="14" width="22" height="9" rx="1" fill="var(--soil)" opacity=".8"/>
        {[[6,17],[12,17],[18,17],[6,20],[12,20],[18,20]].map(([x,y],k)=>(
          <rect key={k} x={x} y={y} width="4" height="2" rx=".5" fill="var(--water)" opacity=".5"/>
        ))}
        {[8,14,20].map((x,k)=><path key={k} d={`M${x} 14 q0 -4 0 -6`} stroke="var(--pioneer)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>)}
        <ellipse cx="14" cy="7" rx="6" ry="4" fill="var(--pioneer)" opacity=".6"/>
      </svg>);
    case 'bund': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="22" rx="11" ry="2" fill="var(--soil-dk)" opacity=".5"/>
        <path d="M4 18 q10 -10 20 0" stroke="var(--obstacle)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="3 2"/>
        <circle cx="8" cy="16" r="2" fill="var(--obstacle)"/>
        <circle cx="14" cy="13.5" r="2.2" fill="var(--obstacle-dk)"/>
        <circle cx="20" cy="16" r="2" fill="var(--obstacle)"/>
      </svg>);
    case 'firebreak': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="22" rx="11" ry="2" fill="var(--soil-dk)" opacity=".4"/>
        <path d="M4 18 L24 18" stroke="var(--soil-edge)" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M4 14 L24 14" stroke="var(--soil-edge)" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="3 2"/>
        {[7,14,21].map((x,k)=>(
          <path key={k} d={`M${x} 18 q0 -3 2 -5`} stroke="#E05A18" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        ))}
      </svg>);
    case 'green-roof': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <rect x="5" y="16" width="18" height="8" rx="1" fill="var(--obstacle-dk)"/>
        <rect x="5" y="12" width="18" height="5" rx="1" fill="var(--pioneer)" opacity=".8"/>
        {[8,13,18].map((x,k)=><circle key={k} cx={x} cy={11} r="2.5" fill="var(--shrub)" opacity=".9"/>)}
      </svg>);
    case 'biodome': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <ellipse cx="14" cy="22" rx="11" ry="2" fill="var(--soil-dk)" opacity=".4"/>
        <rect x="8" y="17" width="12" height="5" rx="1" fill="var(--obstacle-dk)" opacity=".6"/>
        <path d="M8 17 Q14 4 20 17 Z" fill="var(--water)" opacity=".25" stroke="var(--water)" strokeWidth="1.2"/>
        <circle cx="14" cy="15" r="3" fill="var(--pioneer)" opacity=".7"/>
      </svg>);
    case 'remove': return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <circle cx="14" cy="14" r="11" fill="none" stroke="var(--ink-2)" strokeWidth="1.6"/>
        <line x1="8" y1="14" x2="20" y2="14" stroke="var(--ink-2)" strokeWidth="2" strokeLinecap="round"/>
      </svg>);
    default: return (
      <svg viewBox="0 0 28 28" width={W} height={W}>
        <circle cx="14" cy="14" r="10" fill="var(--shrub)" opacity=".4"/>
        <text x="14" y="18" textAnchor="middle" fontSize="12" fill="var(--shrub-dk)">?</text>
      </svg>);
  }
}



function ResourcePill({ icon, label, value, delta, color }) {
  const v = Math.round(value);
  return (
    <div className="res-pill">
      <span className="res-pill-icon" style={{ background: color }}>{icon}</span>
      <span className="res-pill-label">{label}</span>
      <span className="res-pill-val">{v}</span>
      {delta ? (
        <span className="res-pill-delta" style={{
          color: delta > 0 ? 'var(--good)' : 'var(--bad)',
          opacity: 1, background: delta > 0 ? 'rgba(63,154,79,0.12)' : 'rgba(194,70,43,0.12)',
        }}>
          {delta > 0 ? `+${Math.round(delta)}` : Math.round(delta)}
        </span>
      ) : null}
    </div>
  );
}

// ── Top HUD ───────────────────────────────────────────────────────────────────
export function TopHUD({ year, maxYears, resources, lastDelta, stats, level, onMenu, rewards, onOpenAchievements, onOpenProfile, user }) {
  const vegPct  = Math.round((stats?.vegPct  || 0) * 100);
  const carbon  = Math.round(stats?.carbon   || 0);
  const bio     = Math.round((stats?.bio     || 0) * 100);
  const rank    = rewards ? getRank(rewards.xp) : null;
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || null;
  const avatar  = user?.user_metadata?.avatar_url;

  return (
    <div className="top-hud">

      {/* Left — nav + level identity */}
      <div className="hud-left">
        <div className="hud-nav-row">
          <button className="hud-menu-btn" onClick={onMenu}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 2.5h12M1 7h12M1 11.5h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Menu
          </button>
          <div className="hud-level-badge">
            LVL {String(level?.number ?? 0).padStart(2,'0')} · {(level?.subtitle||'BIOME').toUpperCase()}
          </div>
        </div>
        <h1 className="hud-title">{level?.name||'Verdant'}</h1>
        <div className="hud-location">{level?.location}</div>
      </div>

      {/* Centre — resources */}
      <div className="hud-centre">
        <div className="hud-resources">
          <ResourcePill icon={<IconWater />}
            label={level?.resourceLabels?.primary||level?.resourceNames?.primary||'Water'}
            value={resources.primary}    delta={lastDelta?.primary}    color="var(--water-dk)" />
          <ResourcePill icon={<IconSeed />}
            label={level?.resourceLabels?.secondary||level?.resourceNames?.secondary||'Seeds'}
            value={resources.secondary}  delta={lastDelta?.secondary}  color="var(--shrub-dk)" />
          <ResourcePill icon={<IconBolt />}
            label={level?.resourceLabels?.energy||level?.resourceNames?.energy||'Energy'}
            value={resources.energy}     delta={lastDelta?.energy}     color="var(--accent)" />
          <ResourcePill icon={<IconCoin />}
            label={level?.resourceLabels?.budget||'Budget'}
            value={resources.budget}     delta={lastDelta?.budget}     color="var(--ink)" />
          {/* Rank shown inline in resource strip on mobile */}
          {rank && (
            <div className="hud-rank-mobile" onClick={onOpenAchievements}>
              <span>{rank.title}</span>
              <span className="hud-rank-mobile-xp">{rewards.xp} XP</span>
            </div>
          )}
        </div>
        <div className="hud-meters">
          <HudMeter label="VEG" value={vegPct} max={100} color="var(--shrub-dk)" unit="%" />
          <HudMeter label="BIO" value={bio}    max={100} color="#6fbf73" unit="%" />
          <HudMeter label="CO₂" value={carbon} max={80}  color="var(--water-dk)" unit=" t" />
        </div>
      </div>

      {/* Right — year + rank + profile */}
      <div className="hud-right">
        <div className="hud-year-block">
          <div className="hud-year-num">{year}<span>/{maxYears}</span></div>
          <div className="hud-year-lbl">YEAR</div>
          <div className="hud-year-bar">
            <div className="hud-year-fill" style={{width:`${Math.min(100,year/maxYears*100)}%`}}/>
          </div>
        </div>
        {rank && (
          <button className="hud-rank-chip" onClick={onOpenAchievements}>
            <div className="hud-rank-bar">
              <div className="hud-rank-fill" style={{width:`${Math.round(rank.progressPct*100)}%`}}/>
            </div>
            <div className="hud-rank-row">
              <span className="hud-rank-title">{rank.title}</span>
              <span className="hud-rank-xp">{rewards.xp} XP</span>
            </div>
          </button>
        )}
        {user && (
          <button className="hud-profile-btn" onClick={onOpenProfile}>
            {avatar
              ? <img src={avatar} alt="" className="hud-profile-avatar"/>
              : <span className="hud-profile-avatar hud-profile-fallback">{displayName?.[0]?.toUpperCase()||'?'}</span>}
            <span className="hud-profile-name">{displayName}</span>
          </button>
        )}
      </div>

    </div>
  );
}

function HudMeter({ label, value, max, color, unit }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="hud-meter">
      <div className="hud-meter-head">
        <span className="hud-meter-lbl">{label}</span>
        <span className="hud-meter-val">{value}{unit}</span>
      </div>
      <div className="hud-meter-track">
        <div className="hud-meter-fill" style={{width:`${pct}%`, background: color}}/>
      </div>
    </div>
  );
}

// alias for backward compat
export const ToHUD = TopHUD;


export function ActionPalette({ selected, onSelect, resources, level, tip, lockedActions = {}, onToggleDrawer, drawerOpen }) {
  // Group actions by stage for educational levels
  const byStage = {};
  for (const a of (level?.actions || [])) {
    const s = a.stage ?? 99;
    if (!byStage[s]) byStage[s] = [];
    byStage[s].push(a);
  }
  const hasStages = level?.educational && Object.keys(byStage).length > 1;

  const stageLabels = {
    0: null,
    1: 'Stage 1 — Start here',
    2: 'Stage 2 — Unlocks with wildflowers',
    3: 'Stage 3 — Unlocks with berry bushes',
    4: 'Stage 4 — Unlocks with vegetation',
  };

  function renderCard(a) {
    const isSel = a.id === selected || a.targetRole === selected;
    const c = a.cost || {};
    const isLocked = !!lockedActions[a.id];
    const broke = !isLocked && (
      (c.budget     && resources.budget    < c.budget)    ||
      (c.primary    && resources.primary   < c.primary)   ||
      (c.secondary  && resources.secondary < c.secondary) ||
      (c.energy     && resources.energy    < c.energy)
    );
    const decoHint = level?.vocab?.[a.targetRole]?.deco || null;

    return (
      <button
        key={a.id}
        onClick={() => onSelect(a.id)}
        className={`action-card ${isSel ? 'sel' : ''} ${broke ? 'broke' : ''} ${isLocked ? 'locked-action' : ''}`}
        title={isLocked ? lockedActions[a.id] : a.desc}
      >
        <div className="action-icon">
          {isLocked
            ? <span className="action-lock-icon">🔒</span>
            : <ActionIcon id={a.id} name={a.name} deco={decoHint} />}
        </div>
        <div className="action-textblock">
          <div className="action-name">{a.name}</div>
          {isLocked
            ? <div className="action-locked-reason">{lockedActions[a.id]}</div>
            : <div className="action-sub">{a.sub}</div>}
          {!isLocked && (
            <div className="cost-row">
              {c.budget    ? <CostChip label="$"  v={c.budget}    ok={resources.budget    >= c.budget}    /> : null}
              {c.primary   ? <CostChip label="💧" v={c.primary}   ok={resources.primary   >= c.primary}   /> : null}
              {c.secondary ? <CostChip label="🌱" v={c.secondary} ok={resources.secondary >= c.secondary} /> : null}
              {c.energy    ? <CostChip label="⚡" v={c.energy}    ok={resources.energy    >= c.energy}    /> : null}
            </div>
          )}
        </div>
        {isSel && !isLocked && <div className="action-sel-dot"/>}
      </button>
    );
  }

  return (
    <aside className="left-rail">
      <div className="rail-header" onClick={onToggleDrawer} style={onToggleDrawer ? {cursor:'pointer'} : {}}>
        <span className="rail-eyebrow">{level?.educational ? 'SUCCESSION TOOLKIT' : 'TOOLKIT'}</span>
        <h2 className="rail-title">{level?.educational ? 'Build in order' : 'Actions'} {onToggleDrawer && <span style={{fontSize:10,opacity:.5}}>{drawerOpen ? '▼' : '▲'}</span>}</h2>
      </div>

      {hasStages
        ? Object.keys(byStage).sort((a,b)=>a-b).map(stage => {
            const label = stageLabels[stage];
            const actions = byStage[stage];
            const allLocked = actions.every(a => lockedActions[a.id]);
            return (
              <div key={stage} className={`action-stage ${allLocked ? 'stage-locked' : 'stage-open'}`}>
                {label && (
                  <div className="action-stage-header">
                    <span className="action-stage-dot">{allLocked ? '🔒' : '▶'}</span>
                    <span className="action-stage-label">{label}</span>
                  </div>
                )}
                <div className="action-list">
                  {actions.map(renderCard)}
                </div>
              </div>
            );
          })
        : <div className="action-list">{(level?.actions || []).map(renderCard)}</div>}

      {/* Remove tool always at bottom */}
      {!hasStages && (
        <button
          onClick={() => onSelect('remove')}
          className={`action-card alt ${selected === 'remove' ? 'sel' : ''}`}
        >
          <div className="action-icon"><ActionIcon id="remove" /></div>
          <div className="action-textblock">
            <div className="action-name">Inspect / clear</div>
            <div className="action-sub">Click a tile to inspect. 50% refund.</div>
          </div>
        </button>
      )}

      {tip && (
        <div className="rail-tip">
          <span className="rail-tip-icon">💡</span>
          <span>{tip.replace(/^['"]+|['"]+$/g, '')}</span>
        </div>
      )}
    </aside>
  );
}

// ── Map overlays — legend + hover tooltip ───────────────────────────────────

export function OverlayLegend({ overlay }) {
  if (overlay === 'none') return null;
  const items = overlay === 'hydration'
    ? [['Wet', 'rgba(46,141,166,0.7)'], ['Damp', 'rgba(111,196,217,0.7)'], ['Dry', 'rgba(255,220,150,0.7)'], ['Arid', 'rgba(243,122,48,0.6)']]
  : overlay === 'heat'
    ? [['Cool', 'rgba(63,154,79,0.5)'], ['Mild', 'rgba(180,210,90,0.5)'], ['Warm', 'rgba(255,220,100,0.6)'], ['Hot', 'rgba(220,80,40,0.7)']]
  : [['High', 'rgba(60,140,80,0.7)'], ['Med', 'rgba(60,140,80,0.45)'], ['Low', 'rgba(60,140,80,0.25)'], ['None', 'rgba(120,120,120,0.4)']];
  const titleMap = { hydration: 'SOIL HYDRATION', heat: 'HEAT INDEX', biodiversity: 'BIODIVERSITY' };
  return (
    <div className="legend">
      <div className="legend-title">{titleMap[overlay]}</div>
      <div className="legend-items">
        {items.map(([l, c]) => (
          <div key={l} className="legend-item">
            <span className="legend-swatch" style={{ background: c }} />
            <span>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CostChip({ label, v, ok }) {
  return (
    <span className={`cost-chip ${ok ? '' : 'cost-chip-broke'}`}>
      <span className="cost-chip-lbl">{label}</span>
      <span className="cost-chip-val">{v}</span>
    </span>
  );
}

export function HoverTooltip({ tile, action, reason, level }) {
  if (!tile) return null;
  const role = tile.role || tile.type;
  const label = level?.vocab?.[role]?.name || tile.type;
  return (
    <div className="hover-tip">
      <div className="hover-head">
        <b>{label}</b>
        <span className="hover-coord">[{tile.i},{tile.j}]</span>
      </div>
      <div className="hover-meta">
        <span>Irrigation</span><b>{['none','low','med','high'][tile.irrigated]}</b>
        <span>Age</span><b>{tile.age}y</b>
        {tile.bund && <><span>Modifier</span><b>Stone bund</b></>}
      </div>
      {action && action.id !== 'remove' && (
        <div className="hover-hint">
          {reason
            ? <span style={{ color: 'var(--bad)' }}>✕ {reason}</span>
            : <span style={{ color: 'var(--good)' }}>✓ Click to place {action.name.toLowerCase()}</span>}
        </div>
      )}
    </div>
  );
}

// ── Right Stats Panel ───────────────────────────────────────────────────────

export function StatsPanel({ stats, year, log, objectives, history, showImpact, level }) {
  return (
    <aside className="right-rail">
      <div className="panel-head">
        <span className="panel-eyebrow">MISSION · LVL {level?.number||1}</span>
        <h3 className="panel-title">{level?.location?.split('·')[0]?.trim() || 'Wadi al-Bayda'}</h3>
        <p className="panel-lede">{level?.blurb || 'Restore this patch before the years run out.'}</p>
      </div>

      <div className="obj-list">
        {objectives.map((o) => (
          <div key={o.id} className="obj-row">
            <div className="obj-check" style={{ background: o.done ? 'var(--good)' : 'rgba(42,31,18,.08)' }}>
              {o.done ? <Check /> : null}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="obj-label">{o.label}</div>
              <div className="obj-bar">
                <div className="obj-bar-fill" style={{
                  width: `${Math.min(100, o.p * 100)}%`,
                  background: o.done ? 'var(--good)' : 'var(--accent)',
                }} />
              </div>
              <div className="obj-impact">{o.impact}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Season indicator */}
      {stats.seasonLabel && (
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',
                     borderRadius:8,background:'rgba(243,122,48,0.08)',
                     border:'1px solid rgba(243,122,48,0.15)',marginBottom:4}}>
          <span style={{fontSize:14}}>
            {stats.season==='dry'?'☀️':stats.season==='peak-wet'?'🌧️':stats.season==='early-rains'?'🌤️':'🌥️'}
          </span>
          <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,fontWeight:700,
                        color:'rgba(243,122,48,0.9)',letterSpacing:'0.08em'}}>
            {stats.seasonLabel?.toUpperCase()}
          </span>
        </div>
      )}
      <div className="stat-block">
        <div className="stat-row">
          <StatBar label="Soil hydration"   v={stats.hydPct}     unit="%" />
          <StatBar label="Vegetation cover" v={stats.vegPct}     unit="%" />
        </div>
        <div className="stat-row">
          <StatBar label="Heat index"       v={stats.heat}       unit="" inverse />
          <StatBar label="Biodiversity"     v={stats.bio}        unit="" />
        </div>
        <div className="stat-row">
          <StatBar label="Soil health"      v={stats.soilHealth||0} unit="" />
          <StatBar label="Pollinators"      v={stats.pollinatorCover||0} unit="" />
        </div>
        <div className="stat-row">
          <StatBar label="Groundwater"      v={stats.groundwater||0} unit="" />
          <StatBar label="Erosion risk"     v={stats.erosionRisk||0} unit="" inverse />
        </div>
      </div>

      <div className="history-block">
        <div className="history-head">
          <IconTrend />
          <span>ECOSYSTEM TRAJECTORY</span>
          <span className="history-yr">YR {year}</span>
        </div>
        <HistoryChart history={history} />
        <div className="history-legend">
          <span><i style={{ background: 'var(--shrub-dk)' }} /> Vegetation</span>
          <span><i style={{ background: 'var(--water-dk)' }} /> Hydration</span>
          <span><i style={{ background: 'var(--accent-dk)' }} /> Biodiversity</span>
        </div>
      </div>

      <div className="log-block">
        <div className="log-head">FIELD LOG</div>
        <div className="log-list">
          {log.slice(-6).reverse().map((l, i) => (
            <div key={i} className="log-item">
              <span className="log-tag" style={logTagStyle(l.kind)}>Y{String(l.y).padStart(2,'0')}</span>
              <span>{l.text}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function logTagStyle(kind) {
  if (kind === 'win')     return { background: 'var(--good)', color: '#fff' };
  if (kind === 'plant')   return { background: 'var(--shrub)', color: '#fff' };
  if (kind === 'water')   return { background: 'var(--water-dk)', color: '#fff' };
  if (kind === 'mission') return { background: 'var(--accent)', color: '#fff' };
  if (kind === 'wildlife')return { background: '#7A4E2A', color: '#fff' };
  return { background: 'rgba(42,31,18,.08)', color: 'var(--ink-2)' };
}

function StatBar({ label, v, unit, inverse }) {
  const pct = Math.max(0, Math.min(1, v));
  const greenish = inverse ? 1 - pct : pct;
  const color = greenish > 0.65 ? 'var(--good)' : greenish > 0.4 ? 'var(--warn)' : 'var(--bad)';
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="stat-bar-head">
        <span className="stat-lbl">{label}</span>
        <span className="stat-val"><AnimatedNum value={Math.round(pct * 100)} suffix={unit} /></span>
      </div>
      <div className="stat-bar">
        <div className="stat-bar-fill" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
    </div>
  );
}

// Multi-series time chart that draws history of veg/hydration/bio over years.
function HistoryChart({ history }) {
  if (!history || history.length < 2) {
    return (
      <div className="history-empty">
        <span>Press play to begin charting recovery.</span>
      </div>
    );
  }
  const w = 280, h = 96, pad = { l: 22, r: 6, t: 8, b: 14 };
  const xs = history.map((h) => h.year);
  const maxYear = Math.max(...xs, 5);
  const xFor = (yr) => pad.l + (w - pad.l - pad.r) * (yr / maxYear);
  const yFor = (v)  => pad.t + (h - pad.t - pad.b) * (1 - v);
  const mkPath = (key) => history.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${xFor(p.year).toFixed(1)} ${yFor(p[key]).toFixed(1)}`).join(' ');
  const veg = mkPath('vegPct');
  const hyd = mkPath('hydPct');
  const bio = mkPath('bio');
  // Axis ticks
  const yticks = [0, 0.5, 1];
  const xticks = [0, Math.round(maxYear / 2), maxYear];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      <rect x="0" y="0" width={w} height={h} fill="rgba(42,31,18,.03)" rx="6" />
      {yticks.map((t) => (
        <g key={`y${t}`}>
          <line x1={pad.l} x2={w - pad.r} y1={yFor(t)} y2={yFor(t)}
                stroke="rgba(42,31,18,.08)" strokeDasharray="2 2" />
          <text x={pad.l - 4} y={yFor(t) + 3} textAnchor="end"
                fontFamily="JetBrains Mono, monospace" fontSize="8" fill="var(--ink-3)">
            {Math.round(t * 100)}
          </text>
        </g>
      ))}
      {xticks.map((t) => (
        <text key={`x${t}`} x={xFor(t)} y={h - 3} textAnchor="middle"
              fontFamily="JetBrains Mono, monospace" fontSize="8" fill="var(--ink-3)">
          Y{t}
        </text>
      ))}
      {/* Vegetation area */}
      <path d={`${veg} L${xFor(maxYear)} ${yFor(0)} L${xFor(0)} ${yFor(0)} Z`}
            fill="var(--shrub-dk)" opacity="0.12" />
      <path d={veg} stroke="var(--shrub-dk)" strokeWidth="1.6" fill="none" />
      <path d={hyd} stroke="var(--water-dk)" strokeWidth="1.4" fill="none" />
      <path d={bio} stroke="var(--accent-dk)" strokeWidth="1.4" fill="none" strokeDasharray="3 2" />
      {/* End dot for veg */}
      {history.length > 0 && (
        <circle cx={xFor(history[history.length - 1].year)} cy={yFor(history[history.length - 1].vegPct)} r="2.4"
                fill="var(--shrub-dk)" />
      )}
    </svg>
  );
}

// ── Impact Panel — extrapolates the player's per-acre actions to project scale.

// Compact version for inside StatsPanel
function ImpactPanelInline({ stats }) {
  const F = 12000;
  const f = F / stats.total;
  return (
    <div style={{
      background:'rgba(42,31,18,0.06)', borderRadius:10,
      border:'1px solid rgba(42,31,18,0.10)', padding:'10px 12px',
    }}>
      <div style={{
        fontFamily:'JetBrains Mono,monospace', fontSize:9, fontWeight:700,
        letterSpacing:'0.12em', color:'var(--ink-3)', marginBottom:8,
      }}>
        ● IF DEPLOYED AT CORRIDOR SCALE · 12,000 ACRES
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px'}}>
        {[
          [Math.round(stats.carbon*f), 'tCO₂/yr sequestered'],
          [Math.round(stats.trees*f), 'trees established'],
          [Math.round((stats.trees*4+stats.shrubs*1.5)*f), 'people food-secure'],
          [Math.round(stats.water*1200*f/1000), 'ML water captured'],
        ].map(([v,l])=>(
          <div key={l}>
            <div style={{fontSize:18,fontWeight:900,fontFamily:'Fraunces,serif',color:'var(--ink)',lineHeight:1}}>{v.toLocaleString()}</div>
            <div style={{fontSize:10,color:'var(--ink-3)',marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ImpactPanel({ stats }) {
  // 1 tile = 1 acre. Project scale = 12,000 acres (a realistic Sahel cluster).
  const PROJECT_ACRES = 12_000;
  const factor = PROJECT_ACRES / stats.total;

  const carbonScaled = Math.round(stats.carbon * factor);
  const treesScaled  = Math.round(stats.trees * factor);
  const peopleFed    = Math.round((stats.trees * 4 + stats.shrubs * 1.5) * factor);
  const waterScaled  = Math.round(stats.water * 1200 * factor / 1000);
  // Rough proxies: each tree → 4 people food/yr, each shrub → 1.5
  // each pond stores ~1200 m³, scaled to project size, displayed in megaliters

  return (
    <div className="impact-bar">
      <div className="impact-eyebrow">
        <span className="impact-dot" /> IF DEPLOYED AT CORRIDOR SCALE · 12,000 ACRES
      </div>
      <div className="impact-grid">
        <div className="impact-cell">
          <div className="impact-val"><AnimatedNum value={carbonScaled} /></div>
          <div className="impact-unit">tCO₂ / yr sequestered</div>
        </div>
        <div className="impact-cell">
          <div className="impact-val"><AnimatedNum value={treesScaled} /></div>
          <div className="impact-unit">trees established</div>
        </div>
        <div className="impact-cell">
          <div className="impact-val"><AnimatedNum value={peopleFed} /></div>
          <div className="impact-unit">people food-secure</div>
        </div>
        <div className="impact-cell">
          <div className="impact-val"><AnimatedNum value={waterScaled} /></div>
          <div className="impact-unit">ML water captured</div>
        </div>
      </div>
    </div>
  );
}

// ── Time Bar ────────────────────────────────────────────────────────────────

export function TimeBar({ year, maxYears, playing, speed, completed, onPlay, onStep, onSpeed, onReset, narration, guide, learnMode, onToggleLearn, onOpenEcoDex, conceptCount, onOpenGuide }) {
  const initials = guide?.initials || (guide?.name ? guide.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : 'SA');
  return (
    <footer className="time-bar">
      <div className="guide-block">
        <div className="guide-avatar">
          <svg viewBox="0 0 40 40" width="40" height="40">
            <circle cx="20" cy="20" r="20" fill="var(--accent)" />
            <text x="20" y="26" textAnchor="middle" fontFamily="Fraunces, serif"
                  fontWeight="700" fontSize="16" fill="#fff">{initials}</text>
          </svg>
        </div>
        <div className="guide-text">
          <b>{guide?.name||'Sahel Almami'}, {guide?.role||'field ecologist'}:</b>{' '}
          {narration}
        </div>
      </div>

      <div className="time-controls">
        {(onToggleLearn || onOpenEcoDex || onOpenGuide) && (
          <div className="learn-row">
            {onToggleLearn && <LearnModeToggle on={learnMode} onToggle={onToggleLearn} />}
            {onOpenEcoDex && (
              <button className="ecodex-btn" onClick={onOpenEcoDex} title="Eco-Dex: things you've learned">
                📖 <span>Eco-Dex</span>{conceptCount ? <b>{conceptCount}</b> : null}
              </button>
            )}
            {onOpenGuide && (
              <button className="guide-btn" onClick={onOpenGuide} title="Strategy guide for this level">
                🗺️ <span>Guide</span>
              </button>
            )}
          </div>
        )}
        <div className="year-track">
          <span className="year-track-lbl">YEAR</span>
          <div className="year-track-bar">
            <div className="year-track-fill" style={{ width: `${Math.min(100, year / maxYears * 100)}%` }} />
            <div className="year-track-handle" style={{ left: `${Math.min(100, year / maxYears * 100)}%` }} />
            {[5, 10, 15, 20].filter((y) => y <= maxYears).map((y) => (
              <div key={y} className="year-tick" style={{ left: `${y / maxYears * 100}%` }} />
            ))}
          </div>
          <span className="year-track-end">{maxYears}</span>
        </div>
        <div className="btn-row">
          <button className="btn-ghost" onClick={onReset} title="Reset world"><IconReset /></button>
          <button className="btn-primary" onClick={onPlay}>
            {playing ? <IconPause /> : <IconPlay />}
            <span>{playing ? 'Pause' : 'Play'}</span>
          </button>
          <button className="btn-ghost" onClick={onStep} disabled={playing}>
            <IconStep /><span>+1 yr</span>
          </button>
          <div className="speed-row">
            {[1, 2, 4].map((s) => (
              <button key={s} onClick={() => onSpeed(s)}
                className={`speed-btn ${speed === s ? 'sel' : ''}`}>{s}×</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Mobile Game Bar + Side Stats Drawer ───────────────────────────────────
// Bottom bar has 2 tabs: ▶ Play | 🎒 Actions
// Stats panel slides in from the RIGHT as a drawer, opened by a sticky
// pull-tab on the right edge of the map (like a zip-lock label).
export function MobileGameBar({
  year, maxYears, playing, speed, onPlay, onStep, onSpeed, onReset,
  narration, guide, learnMode, onToggleLearn, onOpenEcoDex, conceptCount, onOpenGuide,
  actions, selected, onSelect, resources, level, lockedActions,
  stats, objectives, history, log,
}) {
  const [tab, setTab]           = useState('play');
  const [statsOpen, setStatsOpen] = useState(false);
  const initials = guide?.initials || (guide?.name
    ? guide.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : 'RM');
  const pct      = Math.min(100, year / maxYears * 100);
  const doneCount = objectives?.filter(o=>o.done).length || 0;
  const totalObj  = objectives?.length || 0;

  function handleSelect(id) { onSelect(id); setTab('play'); }

  return (
    <>
      {statsOpen && <div className="msd-dismiss" onClick={()=>setStatsOpen(false)}/>}

      {/* ── Bottom game bar ── */}
      <div className="mgb">
        <div className="mgb-tabs">
          <button className={`mgb-tab ${tab==='play'?'on':''}`} onClick={()=>setTab('play')}>
            {playing ? <IconPause/> : <IconPlay/>}
            <span>Play</span>
          </button>
          <button className={`mgb-tab ${tab==='actions'?'on':''}`} onClick={()=>setTab('actions')}>
            🎒 <span>Actions</span>
            {selected && <span className="mgb-tab-dot"/>}
          </button>
        </div>

        {tab === 'play' && (
          <div className="mgb-play">
            <div className="mgb-year-row">
              <div className="mgb-year">
                <span className="mgb-year-num">{year}</span>
                <span className="mgb-year-of">/{maxYears}</span>
              </div>
              <div className="mgb-year-bar"><div className="mgb-year-fill" style={{width:`${pct}%`}}/></div>
            </div>
            <div className="mgb-controls">
              <button className="mgb-btn-ghost" onClick={onReset}><IconReset/></button>
              <button className="mgb-btn-play" onClick={onPlay}>
                {playing?<IconPause/>:<IconPlay/>}<span>{playing?'Pause':'Play'}</span>
              </button>
              <button className="mgb-btn-ghost" onClick={onStep} disabled={playing}>
                <IconStep/><span>+1yr</span>
              </button>
              <div className="mgb-speed">
                {[1,2,4].map(s=>(
                  <button key={s} onClick={()=>onSpeed(s)} className={`mgb-speed-btn${speed===s?' sel':''}`}>{s}×</button>
                ))}
              </div>
            </div>
            <div className="mgb-learn-row">
              {onToggleLearn && <LearnModeToggle on={learnMode} onToggle={onToggleLearn}/>}
              {onOpenEcoDex && <button className="ecodex-btn" onClick={onOpenEcoDex}>📖 Eco-Dex{conceptCount?<b>{conceptCount}</b>:null}</button>}
              {onOpenGuide  && <button className="guide-btn"  onClick={onOpenGuide}>🗺️ Guide</button>}
              <button className="guide-btn" onClick={()=>setStatsOpen(o=>!o)}
                style={statsOpen?{background:'var(--ink)',color:'#fff',borderColor:'var(--ink)'}:{}}>
                📊 Stats{doneCount>0?<b style={{marginLeft:4,fontSize:9,background:'var(--good)',color:'#fff',borderRadius:999,padding:'1px 5px'}}>{doneCount}/{totalObj}</b>:null}
              </button>
            </div>

            {/* Stats panel — expands inline below learn row */}
            {statsOpen && (
              <div className="mgb-stats-panel">
                <div className="msd-section">OBJECTIVES · {doneCount}/{totalObj}</div>
                <div className="msd-obj-list">
                  {(objectives||[]).map(o=>(
                    <div key={o.id} className={`msd-obj ${o.done?'done':''}`}>
                      <span className="msd-obj-check">{o.done?'✓':'○'}</span>
                      <div className="msd-obj-body">
                        <div className="msd-obj-label">{o.label}</div>
                        <div className="msd-obj-bar">
                          <div className="msd-obj-fill" style={{
                            width:`${Math.min(100,(o.p||0)*100)}%`,
                            background: o.done?'var(--good)':'var(--accent)',
                          }}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="msd-section" style={{marginTop:8}}>ECOSYSTEM HEALTH</div>
                <div className="msd-stat-grid">
                  {[
                    {label:'Vegetation',  v:stats?.vegPct||0},
                    {label:'Hydration',   v:stats?.hydPct||0},
                    {label:'Biodiversity',v:stats?.bio||0},
                    {label:'Soil health', v:stats?.soilHealth||0},
                    {label:'Heat',        v:stats?.heat||0,inv:true},
                    {label:'Erosion',     v:stats?.erosionRisk||0,inv:true},
                  ].map(({label,v,inv})=>{
                    const p=Math.max(0,Math.min(1,v));
                    const g=inv?1-p:p;
                    const col=g>.65?'var(--good)':g>.4?'var(--warn)':'var(--bad)';
                    return (
                      <div key={label} className="msd-stat">
                        <div className="msd-stat-row"><span>{label}</span><b style={{color:col}}>{Math.round(p*100)}%</b></div>
                        <div className="msd-stat-bar"><div style={{width:`${p*100}%`,height:'100%',background:col,borderRadius:999,transition:'width .4s'}}/></div>
                      </div>
                    );
                  })}
                </div>

                <div className="msd-section" style={{marginTop:8}}>TRAJECTORY</div>
                <MobileHistoryChart history={history}/>
                <div className="msd-legend">
                  <span><i style={{background:'var(--shrub-dk)'}}/> Veg</span>
                  <span><i style={{background:'var(--water-dk)'}}/> Hyd</span>
                  <span><i style={{background:'var(--accent-dk)'}}/> Bio</span>
                </div>

                <div className="msd-section" style={{marginTop:8}}>FIELD LOG</div>
                <div className="msd-log">
                  {(log||[]).slice(-5).reverse().map((l,i)=>(
                    <div key={i} className="msd-log-item">
                      <span className="msd-log-yr" style={logTagStyle(l.kind)}>Y{String(l.y).padStart(2,'0')}</span>
                      <span className="msd-log-text">{l.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mgb-guide">
              <div className="mgb-guide-avatar">
                <svg viewBox="0 0 32 32" width="32" height="32">
                  <circle cx="16" cy="16" r="16" fill="var(--accent)"/>
                  <text x="16" y="21" textAnchor="middle" fontFamily="Fraunces,serif" fontWeight="700" fontSize="13" fill="#fff">{initials}</text>
                </svg>
              </div>
              <div className="mgb-guide-text">{narration}</div>
            </div>
          </div>
        )}

        {tab === 'actions' && (
          <div className="mgb-actions">
            <ActionPalette
              actions={actions} selected={selected} onSelect={handleSelect}
              resources={resources} level={level} lockedActions={lockedActions}
            />
          </div>
        )}
      </div>
    </>
  );
}

function MobileHistoryChart({ history }) {
  if (!history || history.length < 2)
    return <div className="msd-chart-empty">Press play to chart recovery.</div>;
  const W=280,H=68,pad={l:18,r:4,t:4,b:12};
  const maxYear = Math.max(...history.map(h=>h.year),5);
  const xFor = yr => pad.l+(W-pad.l-pad.r)*(yr/maxYear);
  const yFor = v  => pad.t+(H-pad.t-pad.b)*(1-v);
  const mk = key => history.map((p,i)=>`${i===0?'M':'L'}${xFor(p.year).toFixed(1)} ${yFor(p[key]).toFixed(1)}`).join(' ');
  const last = history[history.length-1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{display:'block'}}>
      <rect width={W} height={H} fill="rgba(42,31,18,.03)" rx="6"/>
      {[0,.5,1].map(t=>(
        <g key={t}>
          <line x1={pad.l} x2={W-pad.r} y1={yFor(t)} y2={yFor(t)} stroke="rgba(42,31,18,.07)" strokeDasharray="2 2"/>
          <text x={pad.l-3} y={yFor(t)+3} textAnchor="end" fontFamily="JetBrains Mono,monospace" fontSize="7" fill="var(--ink-3)">{Math.round(t*100)}</text>
        </g>
      ))}
      {[0,Math.round(maxYear/2),maxYear].map(t=>(
        <text key={t} x={xFor(t)} y={H-2} textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="7" fill="var(--ink-3)">Y{t}</text>
      ))}
      <path d={`${mk('vegPct')} L${xFor(maxYear)} ${yFor(0)} L${xFor(0)} ${yFor(0)} Z`} fill="var(--shrub-dk)" opacity=".1"/>
      <path d={mk('vegPct')} stroke="var(--shrub-dk)" strokeWidth="1.5" fill="none"/>
      <path d={mk('hydPct')} stroke="var(--water-dk)" strokeWidth="1.3" fill="none"/>
      <path d={mk('bio')}    stroke="var(--accent-dk)" strokeWidth="1.3" fill="none" strokeDasharray="3 2"/>
      <circle cx={xFor(last.year)} cy={yFor(last.vegPct)} r="2.2" fill="var(--shrub-dk)"/>
    </svg>
  );
}


// ── Toast notifications ─────────────────────────────────────────────────────

// ── Intro Overlay ─────────────────────────────────────────────────────────────
export function IntroOverlay({ level, onBegin }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 700);
    const t3 = setTimeout(() => setPhase(3), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="intro-back">
      <div className="intro-bg-grid"/>
      <div className="intro-bg-sun"/>
      <div className="intro-card">
        <div className={`intro-eyebrow ${phase>=1?'in':''}`}>
          <span className="intro-dot"/>
          {(level?.subtitle||'BIOME RECLAMATION').toUpperCase()}
        </div>
        <h1 className={`intro-title ${phase>=1?'in':''}`}>
          {level?.name||'Desert Bloom'}
        </h1>
        <div className={`intro-coords ${phase>=1?'in':''}`}>
          <span>LEVEL {String(level?.number||1).padStart(2,'0')}</span>
          <span className="intro-sep">·</span>
          <span>{(level?.location||'WADI AL-BAYDA').split('·')[0].trim().toUpperCase()}</span>
          <span className="intro-sep">·</span>
          <span>{level?.coords||'N 14°47′ · E 1°22′'}</span>
        </div>
        <p className={`intro-lede ${phase>=2?'in':''}`}>
          {level?.blurb||'Restore the ecosystem before the clock runs out.'}
        </p>

        {/* Guide block */}
        <div className={`intro-stat ${phase>=3?'in':''}`} style={{padding:'12px 16px',gap:14}}>
          <div style={{
            width:44,height:44,borderRadius:'50%',flexShrink:0,
            background:'var(--accent)',display:'flex',alignItems:'center',
            justifyContent:'center',fontFamily:'Fraunces,serif',
            fontWeight:800,fontSize:16,color:'#fff',
          }}>
            {level?.guide?.initials||'SA'}
          </div>
          <div>
            <div style={{fontWeight:700,color:'rgba(248,239,220,0.95)',fontSize:14}}>
              {level?.guide?.name||'Sahel Almami'}
              <span style={{fontWeight:400,color:'rgba(248,239,220,0.55)',marginLeft:6}}>
                · {level?.guide?.role||'field ecologist'}
              </span>
            </div>
            <div style={{fontSize:11.5,color:'rgba(248,239,220,0.5)',marginTop:3}}>
              Your guide for this mission
            </div>
          </div>
        </div>

        <div className={`intro-actions ${phase>=3?'in':''}`}>
          <button className="intro-cta" onClick={onBegin}>
            Begin mission <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}


export function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 4400);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className={`toast toast-${toast.kind}`}>
      <div className="toast-glyph">
        {toast.kind === 'achievement' ? '★' : toast.kind === 'species' ? '◉' : '!'}
      </div>
      <div className="toast-text">
        <div className="toast-title">{toast.title}</div>
        <div className="toast-body">{toast.body}</div>
      </div>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss">✕</button>
    </div>
  );
}

// ── Win modal ───────────────────────────────────────────────────────────────

export function WinModal({ year, stats, level, rewards, hasNext, nextLevelName, onContinue, onReset, onNext }) {
  const PROJECT_ACRES = 12_000;
  const carbonScaled = Math.round(stats.carbon * PROJECT_ACRES / stats.total);
  const rank = rewards ? getRank(rewards.xp) : null;
  return (
    <div className="modal-back" onClick={onContinue}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-eyebrow">▲ LEVEL COMPLETE</div>
        <h2 className="modal-title">{level?.winTitle || `${level?.name || 'The site'} is recovering.`}</h2>
        <p className="modal-lede">
          {level?.location || 'This site'} hit stable recovery in <b>{year} years</b>.
          {level?.winBlurb ? ` ${level.winBlurb}` : ' Vegetation holds the topsoil, and the local ecosystem is beginning to rebound.'}
        </p>

        <div className="modal-stats">
          <div className="modal-stat">
            <div className="modal-stat-val">{Math.round(stats.vegPct * 100)}%</div>
            <div className="modal-stat-lbl">vegetation cover</div>
          </div>
          <div className="modal-stat">
            <div className="modal-stat-val">{Math.round(stats.carbon)}</div>
            <div className="modal-stat-lbl">tCO₂/yr local</div>
          </div>
          <div className="modal-stat hero">
            <div className="modal-stat-val">{carbonScaled.toLocaleString()}</div>
            <div className="modal-stat-lbl">tCO₂/yr at corridor scale</div>
          </div>
        </div>

        {rank && (
          <div className="modal-rank">
            <div className="modal-rank-row">
              <span className="modal-rank-title">{rank.title}</span>
              <span className="modal-rank-xp">{rewards.xp} XP</span>
            </div>
            <div className="xp-chip-bar" style={{width:'100%'}}>
              <span className="xp-chip-fill" style={{width:`${Math.round(rank.progressPct*100)}%`}}/>
            </div>
            <div className="modal-rank-next">
              {rank.maxed ? 'Maximum rank reached' : `${rank.xpForNextRank} XP to ${rank.nextTitle}`}
            </div>
          </div>
        )}

        {level?.realWorldNote && (
          <div className="modal-cite"><b>Real-world parallel.</b> {level.realWorldNote}</div>
        )}

        <div className="modal-btn-row">
          <button className="btn-primary" onClick={onContinue}>Keep playing</button>
          <button className="btn-ghost" onClick={onReset}>Replay level</button>
          {hasNext
            ? <button className="btn-ghost" onClick={onNext}>Next: {nextLevelName} →</button>
            : <button className="btn-ghost" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
                {nextLevelName ? `Next: ${nextLevelName} →` : 'All levels complete →'}
              </button>}
        </div>
      </div>
    </div>
  );
}



// ── Achievements modal ─────────────────────────────────────────────────────

export function AchievementsModal({ rewards, onClose }) {
  const rank = getRank(rewards.xp);
  const unlockedCount = Object.keys(rewards.unlocked).length;
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal-card achievements-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-eyebrow">🏆 PROGRESS</div>
        <h2 className="modal-title">{rank.title}</h2>
        <p className="modal-lede">
          {rewards.xp} XP earned · {unlockedCount}/{ACHIEVEMENTS.length} badges ·{' '}
          {rewards.streak.count > 1 ? `${rewards.streak.count}-day streak` : 'Play today to start a streak'}
        </p>

        <div className="xp-chip-bar" style={{ width: '100%', height: 10 }}>
          <span className="xp-chip-fill" style={{ width: `${Math.round(rank.progressPct * 100)}%` }} />
        </div>
        <div className="modal-rank-next">
          {rank.maxed ? 'Maximum rank reached' : `${rank.xpForNextRank} XP to ${rank.nextTitle}`}
        </div>

        <div className="achievements-grid">
          {ACHIEVEMENTS.map(ach => {
            const isUnlocked = !!rewards.unlocked[ach.id];
            return (
              <div key={ach.id} className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                <div className="achievement-glyph">{isUnlocked ? '★' : '☆'}</div>
                <div className="achievement-body">
                  <div className="achievement-title">{ach.title}</div>
                  <div className="achievement-desc">{ach.desc}</div>
                </div>
                <div className="achievement-xp">+{ach.xp} XP</div>
              </div>
            );
          })}
        </div>

        <div className="modal-btn-row">
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}


// ── Education layer: eco-fact card, Eco-Dex, knowledge check ────────────────

export function EcoFactCard({ fact, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 9000);
    return () => clearTimeout(t);
  }, [fact, onClose]);
  if (!fact) return null;
  return (
    <div className="ecofact" role="status">
      <div className="ecofact-icon">{fact.icon}</div>
      <div className="ecofact-body">
        <div className="ecofact-kicker">DID YOU KNOW?</div>
        <div className="ecofact-title">{fact.title}</div>
        <div className="ecofact-text">{fact.body}</div>
      </div>
      <button className="ecofact-close" onClick={onClose} aria-label="Dismiss">×</button>
    </div>
  );
}

export function EcoDexModal({ unlockedIds, onClose }) {
  const unlocked = new Set(unlockedIds);
  const count = CONCEPTS.filter(c => unlocked.has(c.id)).length;
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal-card achievements-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-eyebrow">📖 ECO-DEX</div>
        <h2 className="modal-title">Things you've learned</h2>
        <p className="modal-lede">{count}/{CONCEPTS.length} ideas discovered. Play more to unlock the rest!</p>
        <div className="ecodex-grid">
          {CONCEPTS.map(c => {
            const on = unlocked.has(c.id);
            return (
              <div key={c.id} className={`ecodex-card ${on ? 'on' : 'off'}`}>
                <div className="ecodex-icon">{on ? c.icon : '❔'}</div>
                <div className="ecodex-body">
                  <div className="ecodex-term">{on ? c.term : '???'}</div>
                  <div className="ecodex-desc">{on ? c.kid : 'Keep playing to discover this.'}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="modal-btn-row">
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export function KnowledgeCheckModal({ levelId, onComplete, onSkip }) {
  const quiz = useMemo(() => getQuiz(levelId), [levelId]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [correct, setCorrect] = useState(0);
  if (!quiz || !quiz.length) return null;
  const q = quiz[idx];
  const isLast = idx === quiz.length - 1;
  const answered = picked !== null;

  function choose(i) {
    if (answered) return;
    setPicked(i);
    if (i === q.answer) setCorrect(c => c + 1);
  }
  function next() {
    if (isLast) { onComplete(correct); return; }
    setIdx(idx + 1); setPicked(null);
  }

  return (
    <div className="modal-back">
      <div className="modal-card quiz-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-eyebrow">🧠 QUICK QUIZ · {idx + 1} / {quiz.length}</div>
        <h2 className="modal-title" style={{ fontSize: 22 }}>{q.q}</h2>
        <div className="quiz-options">
          {q.options.map((opt, i) => {
            let cls = 'quiz-opt';
            if (answered && i === q.answer) cls += ' correct';
            else if (answered && i === picked) cls += ' wrong';
            return (
              <button key={i} className={cls} onClick={() => choose(i)} disabled={answered}>
                <span className="quiz-opt-mark">
                  {answered && i === q.answer ? '✓' : answered && i === picked ? '✗' : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        {answered && (
          <div className={`quiz-why ${picked === q.answer ? 'good' : 'bad'}`}>
            {picked === q.answer ? 'Correct! ' : 'Good try! '}{q.why}
          </div>
        )}
        <div className="modal-btn-row">
          {!answered
            ? <button className="btn-ghost" onClick={onSkip}>Skip quiz</button>
            : <button className="btn-primary" onClick={next}>
                {isLast ? `Finish (+${correct * SCHOLAR_XP_PER_CORRECT} XP)` : 'Next question →'}
              </button>}
        </div>
      </div>
    </div>
  );
}

export function LearnModeToggle({ on, onToggle }) {
  return (
    <button className={`learn-toggle ${on ? 'on' : ''}`} onClick={onToggle}
      title="Learn Mode shows friendly facts and a quiz for young learners">
      <span className="learn-toggle-dot" /> Learn Mode {on ? 'ON' : 'OFF'}
    </button>
  );
}

export function EventModal({ event, onChoice }) {
  if (!event) return null;
  const hasChoice = event.choices.length > 1;
  return (
    <div className="modal-back" style={{ zIndex: 190 }}>
      <div className="modal-card" style={{ maxWidth: 560 }}
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: event.color + '22', border: `2px solid ${event.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
          }}>{event.icon}</div>
          <div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.14em', color: event.color, marginBottom: 3,
            }}>⚡ FIELD EVENT</div>
            <h2 className="modal-title" style={{ fontSize: 26 }}>{event.name}</h2>
          </div>
        </div>

        <p style={{ margin: '4px 0 2px', fontSize: 14, lineHeight: 1.6,
                    color: 'var(--ink)' }}>{event.desc}</p>

        <div style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 12.5,
          fontStyle: 'italic', lineHeight: 1.5, color: 'var(--ink-2)',
          background: event.color + '0d', border: `1px solid ${event.color}30`,
        }}>{event.flavour}</div>

        {/* Choices */}
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5,
            letterSpacing: '0.12em', color: 'var(--ink-3)', fontWeight: 700,
          }}>{hasChoice ? 'CHOOSE YOUR RESPONSE' : 'RESPONSE'}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {event.choices.map((choice, idx) => {
              const costs = Object.entries(choice.cost || {})
                .filter(([, v]) => v > 0)
                .map(([k, v]) => `-${v} ${k}`)
                .join(' · ');
              return (
                <button key={idx}
                  onClick={() => onChoice(choice)}
                  style={{
                    flex: 1, padding: '12px 14px', border: '1.5px solid',
                    borderColor: idx === 0 ? event.color : 'var(--line-2)',
                    borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    background: idx === 0 ? event.color + '10' : 'transparent',
                    transition: 'transform .12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = ''}
                >
                  <div style={{ fontWeight: 700, fontSize: 13,
                                color: 'var(--ink)', marginBottom: 3 }}>{choice.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-2)',
                                marginBottom: costs ? 6 : 0 }}>{choice.sub}</div>
                  {costs && (
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                      color: 'var(--bad)', fontWeight: 600,
                    }}>{costs}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Agent HUD — shows reach and move tip ─────────────────────────────────────

export function AgentHUD({ agentPos }) {
  return (
    <div style={{
      position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(42,31,18,0.88)', color: '#FAF3E2',
      borderRadius: 8, padding: '5px 14px', fontSize: 11,
      fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em',
      pointerEvents: 'none', whiteSpace: 'nowrap',
      boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
    }}>
      📍 AGENT [{agentPos.i},{agentPos.j}] · Click any tile to move · Plant within reach (2 tiles)
    </div>
  );
}

// ── Trust Meter ───────────────────────────────────────────────────────────────
export function TrustMeter({ trust, level }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'4px 12px', borderRadius:20,
      background:'rgba(42,31,18,0.07)',
      border:'1px solid rgba(42,31,18,0.1)',
    }}>
      <div style={{fontSize:10,fontFamily:'JetBrains Mono,monospace',fontWeight:700,
                   letterSpacing:'0.08em',color:level.color}}>
        COMMUNITY
      </div>
      <div style={{position:'relative',width:80,height:6,borderRadius:3,
                   background:'rgba(42,31,18,0.12)',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,right:`${100-trust}%`,
                     background:level.color,borderRadius:3,
                     transition:'right 0.6s cubic-bezier(.4,0,.2,1)'}}/>
      </div>
      <div style={{fontSize:11,fontWeight:700,color:level.color,minWidth:72}}>
        {level.label}
      </div>
    </div>
  );
}

// ── Level Transition Screen ───────────────────────────────────────────────────
export function LevelTransition({ stats, year, trust, level, allLevels, onContinue }) {
  const score = Math.round(
    stats.vegPct*30 + stats.hydPct*20 + stats.bio*25 +
    Math.min(1,stats.carbon/50)*15 + (trust/100)*10
  );

  const ALL = [
    { id:'coastal', name:'Coastal Crisis',   sub:'Contain an oil spill and rebuild the mangrove curtain protecting 800 km of coast.' },
    { id:'urban',   name:'Urban Heat Trap',  sub:'Drop the lethal heat-island effect over a dense Karachi neighbourhood.' },
    { id:'forest',  name:'Forest Frontline', sub:'Stop the slash-and-burn front and transition Borneo farmers to agroforestry.' },
    { id:'planet',  name:'Planet B',         sub:'Terraform Kepler-442b highland basin into a self-sustaining biosphere.' },
  ];
  const NEXT_LEVELS = ALL.map((l, i) => ({ ...l, locked: i >= (currentLevelIdx ?? 0) }));

  return (
    <div className="modal-back" style={{zIndex:200}}>
      <div className="modal-card" style={{maxWidth:620}} onClick={e=>e.stopPropagation()}>
        <div className="modal-eyebrow">✓ LEVEL 01 COMPLETE — BIOME RECLAMATION</div>
        <h2 className="modal-title">{level?.win?.title || "Mission complete."}</h2>
        <p className="modal-lede">
          {(level?.win?.lede || "Completed in {{years}} years.").replace("{{years}}", year)} Vegetation at <b>{Math.round(stats.vegPct*100)}%</b>.
          Your reputation carries to the next site.
        </p>

        {/* Score card */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,margin:'12px 0'}}>
          {[
            ['Vegetation','#3F9A4F',`${Math.round(stats.vegPct*100)}%`],
            ['Biodiversity','#7BB75D',`${Math.round(stats.bio*100)}%`],
            ['Community','#F37A30',`${trust}%`],
            ['Carbon','#2E8DA6',`${Math.round(stats.carbon)} t`],
            ['Hydration','#6FC4D9',`${Math.round(stats.hydPct*100)}%`],
            ['SCORE','#C2462B',String(score)],
          ].map(([label,color,val])=>(
            <div key={label} style={{background:`${color}12`,border:`1.5px solid ${color}30`,
                                     borderRadius:10,padding:'10px 14px',textAlign:'center'}}>
              <div style={{fontSize:20,fontWeight:900,color,fontFamily:'Fraunces,serif'}}>{val}</div>
              <div style={{fontSize:10,color:'var(--ink-2)',fontWeight:600,letterSpacing:'0.08em',
                           textTransform:'uppercase',marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>

        <div className="modal-cite">
          <b>Reputation carries over.</b> Your score of <b>{score}/100</b> unlocks additional starting
          resources on the next level. The community trust you built in Wadi al-Bayda means
          local volunteers will already be waiting.
        </div>

        {/* Next level selection */}
        <div style={{marginTop:12}}>
          <div style={{fontSize:10,fontFamily:'JetBrains Mono,monospace',fontWeight:700,
                       letterSpacing:'0.12em',color:'var(--ink-3)',marginBottom:8}}>
            CHOOSE YOUR NEXT MISSION
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {NEXT_LEVELS.map((l,i)=>(
              <div key={l.id} style={{
                display:'flex',alignItems:'center',gap:14,padding:'12px 14px',
                borderRadius:10,border:'1.5px solid',cursor:l.locked?'not-allowed':'pointer',
                borderColor:l.locked?'rgba(42,31,18,0.08)':'var(--accent)',
                background:l.locked?'transparent':'rgba(243,122,48,0.06)',
                opacity:l.locked?0.45:1,
                transition:'transform .12s',
              }}
              onClick={()=>!l.locked&&onContinue(l.id)}
              onMouseEnter={e=>{if(!l.locked)e.currentTarget.style.transform='translateX(4px)'}}
              onMouseLeave={e=>e.currentTarget.style.transform=''}>
                <div style={{width:32,height:32,borderRadius:8,
                             background:l.locked?'rgba(42,31,18,0.08)':'rgba(243,122,48,0.15)',
                             display:'flex',alignItems:'center',justifyContent:'center',
                             fontFamily:'Fraunces,serif',fontWeight:700,fontSize:14,
                             color:l.locked?'var(--ink-3)':'var(--accent-dk)',flexShrink:0}}>
                  {String(i+2).padStart(2,'0')}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:'var(--ink)',marginBottom:2}}>
                    {l.name} {l.locked&&<span style={{fontSize:10,opacity:0.5}}>🔒 LOCKED</span>}
                  </div>
                  <div style={{fontSize:11.5,color:'var(--ink-2)',lineHeight:1.4}}>{l.sub}</div>
                </div>
                {!l.locked&&<div style={{fontSize:16,color:'var(--accent)'}}>→</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-btn-row" style={{marginTop:14}}>
          <button className="btn-ghost" onClick={()=>onContinue('replay')}>↩ Replay this level</button>
        </div>
      </div>
    </div>
  );
}

// ── Game Over Modal ───────────────────────────────────────────────────────────
export function GameOverModal({ year, stats, level, objectives, onReplay }) {
  const done = objectives.filter(o => o.done).length;
  const total = objectives.length;
  return (
    <div className="modal-back" style={{ zIndex: 200 }}>
      <div className="modal-card" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-eyebrow" style={{ color:'var(--bad)' }}>⏱ TIME EXPIRED — MISSION FAILED</div>
        <h2 className="modal-title">The clock ran out.</h2>
        <p className="modal-lede">
          {level?.name} reached year <b>{year}</b> without completing all objectives.
          You finished <b>{done}/{total}</b> objectives. Every attempt leaves the land
          a little better than before.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:6, margin:'12px 0' }}>
          {objectives.map(o => (
            <div key={o.id} style={{ display:'flex', alignItems:'center', gap:10,
                                     padding:'8px 12px', borderRadius:8,
                                     background: o.done ? 'rgba(63,154,79,0.08)' : 'rgba(194,70,43,0.06)',
                                     border: `1px solid ${o.done ? 'rgba(63,154,79,0.2)' : 'rgba(194,70,43,0.15)'}` }}>
              <span style={{ fontSize:16 }}>{o.done ? '✓' : '○'}</span>
              <span style={{ fontSize:12.5, color: o.done ? 'var(--good)' : 'var(--ink-2)' }}>{o.label}</span>
            </div>
          ))}
        </div>
        <div className="modal-cite">
          <b>Real-world note.</b> {level?.win?.citation || 'Restoration takes decades — every year of effort counts.'}
        </div>
        <div className="modal-btn-row">
          <button className="btn-primary" onClick={onReplay}>↩ Try again</button>
        </div>
      </div>
    </div>
  );
}

// ── Game Over Modal ─────────────────────────────────────────────────────────
// ── Auth Gate Modal ──────────────────────────────────────────────────────────
// Shown when a guest clicks Play. Warm, game-first language — no mention of
// Google, just "create an account to save your progress".

export function AuthGate({ onAuth, onClose }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal-card auth-gate" onClick={(e) => e.stopPropagation()}>
        <div className="auth-gate-icon">🌱</div>
        <h2 className="modal-title" style={{ textAlign: 'center' }}>Save your progress</h2>
        <p className="modal-lede" style={{ textAlign: 'center' }}>
          Create a free account so your levels, achievements and XP are saved across devices.
          Takes about 10 seconds.
        </p>
        <div className="auth-gate-perks">
          <div className="auth-gate-perk"><span>🏆</span> XP and rank saved forever</div>
          <div className="auth-gate-perk"><span>🗺️</span> Pick up where you left off</div>
          <div className="auth-gate-perk"><span>📖</span> Eco-Dex synced across devices</div>
        </div>
        <div className="modal-btn-row" style={{ flexDirection: 'column', gap: 10 }}>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onAuth}>
            Create account to play
          </button>
          <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }} onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}