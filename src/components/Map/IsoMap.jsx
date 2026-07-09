import { useState, useEffect, useMemo, useRef } from 'react';
import { COLS, ROWS, TILE_W, TILE_H } from '../../sim/engine.js';
import { key, neighbors, computeStats } from '../../sim/engine.js';
import { getTileColors } from '../../sim/themes.js';

function useTick(active = true) {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (!active) return;
    let raf;
    const tick = () => { setNow(performance.now()); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return now;
}

export function isoPos(i, j) {
  const ox = ((COLS+ROWS)*TILE_W)/4 - TILE_W/2;
  return { cx:(i-j)*(TILE_W/2)+ox, cy:(i+j)*(TILE_H/2)+TILE_H/2 };
}

// ── Role-based tile decorations — shared across themes ───────────────────────
function TileObject({ t, now, theme }) {
  const sw = Math.sin(now/700+(t.i*7+t.j*13))*0.04;
  const role = t.role||(t.type==='grass'?'pioneer':t.type==='tree'?'canopy':t.type==='pond'?'water':t.type==='solar'?'energy':t.type==='bund'?'modifier':t.type==='rock'?'obstacle':t.type==='degraded'?'damaged':t.type||'soil');
  const { top, edge } = getTileColors(role, theme);
  // t.deco is stamped by App.jsx from level.vocab — falls back to role name
  const d = t.deco || role;

  // ── OIL SLICK ──────────────────────────────────────────────────────────────
  if (d==='oil') return <g>
    <ellipse cx="0" cy="0" rx="30" ry="14" fill="#1A1208" opacity=".9"/>
    <ellipse cx="-5" cy="-2" rx="18" ry="7" fill="#2A1F10" opacity=".8"/>
    <ellipse cx="8" cy="2" rx="12" ry="5" fill="#1A1208" opacity=".6"/>
    {/* rainbow sheen */}
    <ellipse cx="-6" cy="-3" rx="10" ry="4" fill="rgba(80,40,120,0.35)" opacity=".6"/>
    <ellipse cx="6" cy="1" rx="8" ry="3" fill="rgba(40,80,120,0.3)" opacity=".6"/>
    <path d="M-20 -1 q5 -3 10 0 q5 3 10 0" stroke="rgba(120,80,160,0.4)" strokeWidth="1" fill="none"/>
  </g>;

  // ── OIL BOOM ───────────────────────────────────────────────────────────────
  if (d==='boom') return <g>
    <path d="M-24 -4 q12 6 24 0" stroke="#E05A18" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    {[-18,-6,6,18].map((x,k)=><circle key={k} cx={x} cy={k%2?-5:-3} r="2.5" fill="#E05A18"/>)}
    <path d="M-24 -4 q12 6 24 0" stroke="rgba(224,90,24,0.3)" strokeWidth="6" fill="none" strokeLinecap="round"/>
  </g>;

  // ── REEF / ROCKS ───────────────────────────────────────────────────────────
  if (d==='reef') return <g>
    <ellipse cx="-8" cy="2" rx="10" ry="5" fill={edge}/>
    <ellipse cx="-8" cy="0" rx="8" ry="4" fill={top}/>
    <ellipse cx="8" cy="0" rx="7" ry="4" fill={edge}/>
    <ellipse cx="8" cy="-2" rx="5.5" ry="3" fill={top}/>
    <ellipse cx="0" cy="-3" rx="5" ry="3" fill={edge} opacity=".7"/>
  </g>;

  if (d==='rocks') return <g>
    <ellipse cx="-6" cy="-2" rx="14" ry="6" fill={edge}/>
    <ellipse cx="-6" cy="-4" rx="12" ry="5" fill={top}/>
    <ellipse cx="10" cy="2" rx="8" ry="3.5" fill={edge}/>
    <ellipse cx="10" cy="0" rx="7" ry="3" fill={top}/>
  </g>;

  // ── FROZEN BOULDER (planet) ────────────────────────────────────────────────
  if (d==='icerock') return <g>
    <ellipse cx="0" cy="0" rx="16" ry="8" fill={edge}/>
    <ellipse cx="-3" cy="-3" rx="13" ry="6" fill={top}/>
    <ellipse cx="4" cy="-4" rx="5" ry="3" fill="rgba(180,220,255,0.4)"/>
    <path d="M-8 -5 l4 -5 M0 -6 l3 -5 M7 -3 l4 -4" stroke="rgba(180,220,255,0.6)" strokeWidth="1" fill="none"/>
  </g>;

  // ── MARSH / SALTMARSH ──────────────────────────────────────────────────────
  if (d==='marsh') return <g transform={`skewX(${sw*6})`}>
    <ellipse cx="0" cy="4" rx="16" ry="5" fill="var(--water,#5AB0C8)" opacity=".35"/>
    {[-14,-6,2,10].map((x,k)=><path key={k} d={`M${x} 4 q1 -8 ${k%2?2:-2} -12`}
      stroke={top} strokeWidth="2" fill="none" strokeLinecap="round"/>)}
    <ellipse cx="-4" cy="-8" rx="5" ry="2.5" fill={top} opacity=".7"/>
    <ellipse cx="8" cy="-6" rx="4" ry="2" fill={top} opacity=".7"/>
  </g>;

  // ── MANGROVE SAPLING ───────────────────────────────────────────────────────
  if (d==='mangrove-young') return <g transform={`translate(${sw*4},0)`}>
    <ellipse cx="0" cy="6" rx="14" ry="4" fill="var(--water,#5AB0C8)" opacity=".3"/>
    <line x1="-6" y1="6" x2="0" y2="-2" stroke={edge} strokeWidth="1.8"/>
    <line x1="6" y1="6" x2="0" y2="-2" stroke={edge} strokeWidth="1.8"/>
    <line x1="0" y1="-2" x2="0" y2="-10" stroke={edge} strokeWidth="1.5"/>
    <circle cx="0" cy="-10" r="5" fill={top}/>
    <circle cx="-3" cy="-12" r="3" fill={edge} opacity=".7"/>
    <circle cx="3" cy="-11" r="3" fill={top}/>
  </g>;

  // ── MATURE MANGROVE ─────────────────────────────────────────────────────────
  if (d==='mangrove') return <g transform={`translate(${sw*6},0)`}>
    <ellipse cx="0" cy="8" rx="18" ry="5" fill="var(--water,#5AB0C8)" opacity=".35"/>
    {[[-10,8],[0,8],[10,8]].map(([x,y],k)=>(
      <line key={k} x1={x} y1={y} x2="0" y2="-4" stroke={edge} strokeWidth="2"/>
    ))}
    <rect x="-2" y="-4" width="4" height="10" rx="2" fill={edge}/>
    <ellipse cx="0" cy="-10" rx="14" ry="10" fill={edge}/>
    <ellipse cx="-3" cy="-13" rx="9" ry="7" fill={top}/>
    <ellipse cx="5" cy="-10" rx="7" ry="5" fill={top}/>
  </g>;

  // ── WETLAND ────────────────────────────────────────────────────────────────
  if (d==='wetland') return <g>
    <ellipse cx="0" cy="0" rx="28" ry="14" fill="var(--water,#5AB0C8)" opacity=".55"/>
    <ellipse cx="0" cy="-1" rx="22" ry="10" fill="var(--water,#5AB0C8)" opacity=".6"/>
    {[-10,0,10].map((x,k)=><path key={k} d={`M${x} -1 q1 -5 1.5 -8`}
      stroke={top} strokeWidth="1.8" fill="none" strokeLinecap="round"/>)}
    <path d="M-16 0 q4 -2 8 0 M4 1 q4 -2 8 0" stroke="#fff" strokeWidth="1" fill="none" opacity=".5" strokeLinecap="round"/>
  </g>;

  // ── SKIM PLATFORM ──────────────────────────────────────────────────────────
  if (d==='platform') return <g>
    <ellipse cx="0" cy="4" rx="20" ry="6" fill="var(--water,#5AB0C8)" opacity=".4"/>
    <rect x="-14" y="-2" width="28" height="7" rx="2" fill={edge}/>
    <rect x="-10" y="-6" width="20" height="5" rx="1" fill={top}/>
    <rect x="-2" y="-12" width="4" height="7" fill={edge}/>
    <rect x="-7" y="-14" width="14" height="3" rx="1" fill={edge}/>
    <circle cx="0" cy="-10" r="1.5" fill="rgba(255,220,80,0.8)"/>
  </g>;

  // ── CONCRETE / ASPHALT ─────────────────────────────────────────────────────
  if (d==='concrete') return <g fill={edge} opacity=".6">
    {[[-16,-2],[-4,3],[8,-1],[18,2],[-10,6],[4,6]].map(([x,y],k)=>(
      <circle key={k} cx={x} cy={y} r="1.2"/>
    ))}
    <path d="M-20 -1 L20 2" stroke={edge} strokeWidth=".6" opacity=".4"/>
    <path d="M-20 4 L20 5" stroke={edge} strokeWidth=".6" opacity=".4"/>
  </g>;

  if (d==='asphalt') return <g>
    <ellipse cx="0" cy="0" rx="28" ry="13" fill={top} opacity=".5"/>
    {[[-12,-3],[0,-1],[12,-3],[-6,4],[6,4]].map(([x,y],k)=>(
      <line key={k} x1={x-5} y1={y} x2={x+5} y2={y+2} stroke={edge} strokeWidth=".8" opacity=".6"/>
    ))}
  </g>;

  // ── BUILDING ───────────────────────────────────────────────────────────────
  if (d==='building') return <g>
    <rect x="-10" y="-14" width="20" height="20" rx="1" fill={edge}/>
    <rect x="-8" y="-12" width="16" height="16" rx="1" fill={top}/>
    {[[-5,-8],[1,-8],[-5,-2],[1,-2]].map(([x,y],k)=>(
      <rect key={k} x={x} y={y} width="4" height="4" fill="rgba(180,220,255,0.4)" rx=".5"/>
    ))}
  </g>;

  // ── LAWN ───────────────────────────────────────────────────────────────────
  if (d==='lawn') return <g transform={`skewX(${sw*6})`}>
    <ellipse cx="0" cy="4" rx="20" ry="6" fill={top} opacity=".5"/>
    {[-14,-6,2,10,18].map((x,k)=><path key={k} d={`M${x} 4 q0 -5 1 -7`}
      stroke={edge} strokeWidth="1.4" fill="none" strokeLinecap="round"/>)}
  </g>;

  // ── STREET PLANTER ─────────────────────────────────────────────────────────
  if (d==='planter') return <g transform={`translate(${sw*5},0)`}>
    <rect x="-10" y="2" width="20" height="6" rx="2" fill={edge} opacity=".7"/>
    <circle cx="-4" cy="-2" r="6" fill={edge}/>
    <circle cx="-4" cy="-3" r="5" fill={top}/>
    <circle cx="4" cy="-1" r="5" fill={edge}/>
    <circle cx="4" cy="-2" r="4.5" fill={top}/>
  </g>;

  // ── RAIN GARDEN ────────────────────────────────────────────────────────────
  if (d==='rain-garden') return <g>
    <ellipse cx="0" cy="2" rx="20" ry="8" fill="var(--water,#6FC4D9)" opacity=".35"/>
    <ellipse cx="0" cy="1" rx="14" ry="5" fill={top} opacity=".6"/>
    {[-8,0,8].map((x,k)=><path key={k} d={`M${x} 1 q0 -5 1 -8`}
      stroke={edge} strokeWidth="1.6" fill="none" strokeLinecap="round"/>)}
    {[-6,2,10].map((x,k)=><path key={k} d={`M${x} -8 q0 3 0 5`}
      stroke="var(--water,#6FC4D9)" strokeWidth="1.2" strokeDasharray="2 2" fill="none"/>)}
  </g>;

  // ── COOL PAVEMENT ──────────────────────────────────────────────────────────
  if (d==='cool-pave') return <g>
    <ellipse cx="0" cy="2" rx="26" ry="10" fill={top} opacity=".6"/>
    {[[-14,-2],[-4,2],[6,-1],[16,2]].map(([x,y],k)=>(
      <rect key={k} x={x} y={y} width="8" height="3" rx="1" fill="rgba(180,220,255,0.45)"/>
    ))}
    {[-6,4].map((x,k)=><path key={k} d={`M${x} 2 q0 -6 1 -9`}
      stroke={edge} strokeWidth="1.5" fill="none" strokeLinecap="round"/>)}
    <ellipse cx="8" cy="-7" rx="5" ry="3.5" fill={edge} opacity=".7"/>
  </g>;

  // ── GREEN ROOF ─────────────────────────────────────────────────────────────
  if (d==='green-roof') return <g>
    <rect x="-14" y="-4" width="28" height="14" rx="1" fill={edge}/>
    <rect x="-12" y="-8" width="24" height="5" rx="1" fill={top} opacity=".85"/>
    {[-8,-2,4,10].map((x,k)=><circle key={k} cx={x} cy={-8} r="2.8" fill={edge} opacity=".9"/>)}
  </g>;

  // ── COVER CROP ─────────────────────────────────────────────────────────────
  if (d==='covercrop') return <g transform={`skewX(${sw*5})`}>
    <ellipse cx="0" cy="5" rx="22" ry="5.5" fill={top} opacity=".4"/>
    {[-16,-8,0,8,16].map((x,k)=>(
      <path key={k} d={`M${x} 5 q1 -5 2 -8`} stroke={top} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    ))}
    <ellipse cx="0" cy="-3" rx="18" ry="4" fill={top} opacity=".35"/>
  </g>;

  // ── COCOA SHADE ────────────────────────────────────────────────────────────
  if (d==='cocoa') return <g transform={`translate(${sw*5},0)`}>
    <ellipse cx="0" cy="6" rx="16" ry="4" fill="rgba(0,0,0,.18)"/>
    <rect x="-2" y="-6" width="4" height="14" rx="2" fill="#7A5C2A"/>
    <circle cx="-5" cy="-4" r="6" fill={edge}/>
    <circle cx="-5" cy="-5" r="5" fill={top}/>
    <circle cx="5" cy="-3" r="5" fill={edge}/>
    <circle cx="5" cy="-4" r="4.5" fill={top}/>
    <ellipse cx="2" cy="-2" rx="3" ry="2" fill="#C87820" opacity=".8"/>
  </g>;

  // ── FIREBREAK ──────────────────────────────────────────────────────────────
  if (d==='firebreak') return <g>
    <rect x="-24" y="-2" width="48" height="6" rx="1" fill={edge} opacity=".55"/>
    <rect x="-24" y="-4" width="48" height="3" rx="1" fill={edge} opacity=".35"/>
    {[-16,-6,4,14].map((x,k)=>(
      <path key={k} d={`M${x} -4 q1 -4 2 -6`} stroke="#E05A18" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity=".6"/>
    ))}
  </g>;

  // ── STREAM WEIR ────────────────────────────────────────────────────────────
  if (d==='weir') return <g>
    <ellipse cx="0" cy="2" rx="24" ry="9" fill="var(--water,#5AB8C8)" opacity=".5"/>
    <rect x="-18" y="-2" width="36" height="5" rx="1" fill={edge}/>
    <ellipse cx="0" cy="-1" rx="16" ry="5" fill="var(--water,#5AB8C8)" opacity=".5"/>
    <path d="M-18 -2 q9 -2 18 0 q9 2 18 0" stroke="var(--water,#5AB8C8)" strokeWidth="1.2" fill="none"/>
  </g>;

  // ── BURNT / SLASH-BURN ─────────────────────────────────────────────────────
  if (d==='burnt') return <g>
    <ellipse cx="0" cy="1" rx="22" ry="9" fill={top} opacity=".7"/>
    {[-12,-2,8].map((x,k)=>(
      <line key={k} x1={x} y1={8} x2={x+4} y2={-6} stroke="#5A2808" strokeWidth="2" strokeLinecap="round"/>
    ))}
    {[-6,4,14].map((x,k)=>(
      <line key={k} x1={x} y1={8} x2={x+3} y2={-4} stroke="#3A1808" strokeWidth="1.5" strokeLinecap="round"/>
    ))}
  </g>;

  // ── CLEARED LAND ───────────────────────────────────────────────────────────
  if (d==='cleared') return <g fill={edge} opacity=".55">
    {[[-18,-2],[-6,3],[6,-1],[18,2],[-12,6],[2,6]].map(([x,y],k)=>(
      <circle key={k} cx={x} cy={y} r=".9"/>
    ))}
  </g>;

  // ── SOLAR WEIR PUMP ────────────────────────────────────────────────────────
  if (d==='solar-pump') return <g>
    <ellipse cx="0" cy="6" rx="16" ry="4" fill="rgba(0,0,0,.2)"/>
    <polygon points="-14,1 -4,-9 10,-5 0,5" fill="var(--water,#4A9CC8)" stroke={edge} strokeWidth="1"/>
    <rect x="-1" y="4" width="2" height="7" fill={edge}/>
    <ellipse cx="0" cy="9" rx="8" ry="2.5" fill="var(--water,#4A9CC8)" opacity=".4"/>
    <circle cx="0" cy="-2" r={1.4+Math.sin(now/400)*0.4} fill="#fff" opacity={0.6+Math.sin(now/400)*0.3}/>
  </g>;

  // ── MICROBIAL MAT (planet) ─────────────────────────────────────────────────
  if (d==='microbe') return <g>
    <ellipse cx="0" cy="3" rx="24" ry="9" fill={top} opacity=".55"/>
    {[[-12,1],[-4,-2],[4,1],[12,0],[0,4],[-8,4],[8,3]].map(([x,y],k)=>(
      <circle key={k} cx={x} cy={y} r="2.5" fill={top} opacity=".85"/>
    ))}
    {[[-6,-2],[2,-4],[10,-2]].map(([x,y],k)=>(
      <circle key={k} cx={x} cy={y} r="1.4" fill={edge}/>
    ))}
  </g>;

  // ── LICHEN COLONY (planet) ─────────────────────────────────────────────────
  if (d==='lichen') return <g transform={`translate(${sw*4},0)`}>
    <ellipse cx="0" cy="3" rx="20" ry="7" fill="rgba(0,0,0,.15)"/>
    {[[-10,0],[-2,-3],[6,0],[14,2],[-6,4],[4,5]].map(([x,y],k)=>(
      <ellipse key={k} cx={x} cy={y} rx="4.5" ry="2.8" fill={top} opacity=".8"/>
    ))}
  </g>;

  // ── DOME TREE (planet) ─────────────────────────────────────────────────────
  if (d==='dometree') return <g transform={`translate(${sw*5},0)`}>
    <ellipse cx="0" cy="7" rx="16" ry="4" fill="rgba(0,0,0,.2)"/>
    <rect x="-2.5" y="-4" width="5" height="12" rx="2" fill={edge} opacity=".7"/>
    <ellipse cx="0" cy="-10" rx="13" ry="11" fill="none" stroke="var(--water,#45C0A0)" strokeWidth="1.8" opacity=".5"/>
    <ellipse cx="0" cy="-10" rx="9" ry="7" fill={edge}/>
    <ellipse cx="-2" cy="-12" rx="6" ry="5" fill={top}/>
  </g>;

  // ── ALGAE POOL (planet) ────────────────────────────────────────────────────
  if (d==='algae-pool') return <g>
    <ellipse cx="0" cy="0" rx="28" ry="14" fill={edge} opacity=".5"/>
    <ellipse cx="0" cy="-1" rx="22" ry="10" fill={top} opacity=".7"/>
    {[[-10,-2],[0,-4],[10,-2],[-5,2],[5,1]].map(([x,y],k)=>(
      <ellipse key={k} cx={x} cy={y} rx="4" ry="2.5" fill={edge} opacity=".8"/>
    ))}
    <path d="M-14 -1 q4 -2 8 0 M2 2 q4 -2 8 0" stroke="#fff" strokeWidth="1" fill="none" opacity=".45" strokeLinecap="round"/>
  </g>;

  // ── ATMOSPHERE PROCESSOR (planet) ──────────────────────────────────────────
  if (d==='atmoproc') return <g>
    <ellipse cx="0" cy="7" rx="14" ry="3.5" fill="rgba(0,0,0,.2)"/>
    <rect x="-6" y="0" width="12" height="10" rx="2" fill={edge}/>
    <rect x="-4" y="-6" width="8" height="7" rx="1" fill={edge} opacity=".8"/>
    <circle cx="0" cy="-8" r="5" fill="none" stroke="var(--water,#45C0A0)" strokeWidth="1.5"/>
    <circle cx="0" cy="-8" r="2.5" fill="var(--water,#45C0A0)" opacity=".6"/>
    {[[0,-13],[-5,-11],[5,-11]].map(([x,y],k)=>(
      <circle key={k} cx={x} cy={y} r="1.5" fill="var(--water,#45C0A0)" opacity=".5"/>
    ))}
  </g>;

  // ── BIODOME SHELL (planet) ─────────────────────────────────────────────────
  if (d==='biodome') return <g>
    <ellipse cx="0" cy="5" rx="18" ry="4" fill="rgba(0,0,0,.2)"/>
    <rect x="-12" y="0" width="24" height="7" rx="2" fill={edge} opacity=".5"/>
    <path d="M-12 0 Q0 -18 12 0 Z" fill="var(--water,#45C0A0)" opacity=".18" stroke="var(--water,#45C0A0)" strokeWidth="1.5"/>
    <circle cx="0" cy="-2" r="4" fill={top} opacity=".7"/>
  </g>;

  // ── REGOLITH (planet soil) ──────────────────────────────────────────────────
  if (d==='regolith') return <g fill={edge} opacity=".45">
    {[[-18,0],[-8,-3],[2,2],[12,-1],[18,3],[-4,5],[8,4]].map(([x,y],k)=>(
      <circle key={k} cx={x} cy={y} r="1.2"/>
    ))}
    {[[-14,-2],[4,-2],[14,1]].map(([x,y],k)=>(
      <ellipse key={k} cx={x} cy={y} rx="3" ry="1.5" fill={edge} opacity=".3"/>
    ))}
  </g>;

  // ── TOXIC SALT FLAT (planet damaged) ───────────────────────────────────────
  if (d==='salt') return <g>
    <ellipse cx="0" cy="0" rx="26" ry="11" fill={top} opacity=".6"/>
    {[[-14,-2],[-4,1],[6,-1],[16,2],[-8,4],[4,5]].map(([x,y],k)=>(
      <path key={k} d={`M${x-3} ${y} l3 -4 l3 4`} stroke={edge} strokeWidth="1" fill="none" opacity=".7"/>
    ))}
  </g>;

  // ── SAND / SAND-WET (default soil) ─────────────────────────────────────────
  if (d==='sand'||d==='sand-wet') return <g fill={edge} opacity=".5">
    {[[-14,2],[-4,-3],[6,3],[14,-2],[2,6],[-10,5]].map(([x,y],k)=>(
      <circle key={k} cx={x} cy={y} r=".9"/>
    ))}
    {d==='sand-wet'&&<ellipse cx="0" cy="2" rx="16" ry="5" fill="var(--water,#5AB0C8)" opacity=".2"/>}
  </g>;

  // ── CRACKS (desert damaged) ─────────────────────────────────────────────────
  if (d==='cracks') return <g stroke={edge} strokeWidth=".9" fill="none" opacity=".7">
    <path d="M-22 -2 L -6 1 L 4 -3 L 18 2"/>
    <path d="M-14 6 L -2 4 L 8 8"/>
    <path d="M-6 1 L -3 -8"/>
    <path d="M4 -3 L 6 -10"/>
    <path d="M-2 4 L 0 10"/>
  </g>;

  // ── BUND ────────────────────────────────────────────────────────────────────
  if (d==='bund') return <g>
    <path d="M-20 2 q10 -10 20 0" stroke={edge} strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="4 2"/>
    {[-14,-4,6,16].map((x,k)=><circle key={k} cx={x} cy={k%2?-1:2} r="2.2" fill={edge}/>)}
  </g>;

  // ── POND (retention) ────────────────────────────────────────────────────────
  if (d==='pond') {
    const r=1+Math.sin(now/1100+t.i+t.j)*0.03;
    return <g>
      <ellipse cx="0" cy="0" rx="32" ry="17" fill={edge} opacity=".55"/>
      <ellipse cx="0" cy="-1" rx={28*r} ry={14*r} fill={top}/>
      <path d={`M-14 -2 q4 -3 ${10+sw*30} 0 M2 1 q4 -3 12 0`}
            stroke="#fff" strokeWidth="1.2" fill="none" opacity=".55" strokeLinecap="round"/>
    </g>;
  }

  // ── SOLAR ───────────────────────────────────────────────────────────────────
  if (d==='solar') return <g>
    <ellipse cx="0" cy="6" rx="18" ry="3.5" fill="rgba(0,0,0,.22)"/>
    <polygon points="-16,0 -4,-10 14,-6 2,4" fill="var(--water,#4A9CC8)" stroke={edge} strokeWidth="1.2"/>
    <rect x="-1" y="4" width="2" height="6" fill={edge}/>
    <rect x="-4" y="9" width="8" height="2" rx="1" fill={edge}/>
    <circle cx="0" cy="-3" r={1.4+Math.sin(now/400)*0.4} fill="#fff" opacity={0.55+Math.sin(now/400)*0.3}/>
  </g>;

  // ── GRASS (generic pioneer fallback) ────────────────────────────────────────
  // ── WILDFLOWERS ─────────────────────────────────────────────────────────────
  if (d==='wildflower') return <g transform={`skewX(${sw*6})`}>
    {[[-14,2,'#f9a8d4'],[-6,-3,'#fcd34d'],[2,4,'#86efac'],[10,-1,'#a78bfa'],[-2,6,'#fb923c'],[16,3,'#f9a8d4'],[-18,-2,'#fcd34d']].map(([x,y,c],k)=>(
      <g key={k}>
        <line x1={x} y1={y+2} x2={x} y2={y+8} stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx={x} cy={y} r="3.5" fill={c} opacity=".88"/>
        <circle cx={x} cy={y} r="1.5" fill="#fef3c7" opacity=".9"/>
      </g>
    ))}
  </g>;

  // ── BERRY BUSH ──────────────────────────────────────────────────────────────
  if (d==='berry') return <g translate={`translate(${sw*4},0)`}>
    <ellipse cx="0" cy="4" rx="22" ry="9" fill={edge} opacity=".6"/>
    <circle cx="-10" cy="-2" r="9" fill={top}/>
    <circle cx="4" cy="-5" r="11" fill={edge}/>
    <circle cx="4" cy="-6" r="9" fill={top}/>
    <circle cx="12" cy="-1" r="7" fill={edge} opacity=".8"/>
    {[[-14,2],[-7,-4],[1,-8],[9,-3],[15,1],[-3,2],[6,2]].map(([x,y],k)=>(
      <circle key={k} cx={x} cy={y} r="2.8" fill="#dc2626" opacity=".9"/>
    ))}
  </g>;

  // ── BUG HOTEL ───────────────────────────────────────────────────────────────
  if (d==='bug-hotel') return <g>
    <rect x="-18" y="-8" width="36" height="20" rx="2" fill="#92400e"/>
    <rect x="-18" y="-12" width="36" height="5" rx="1" fill="#78350f"/>
    {[[-13,-4],[-5,-4],[3,-4],[11,-4],[-13,2],[-5,2],[3,2],[11,2],[-9,7],[1,7],[9,7]].map(([x,y],k)=>(
      <circle key={k} cx={x} cy={y} r="3" fill="#1c0a00" opacity=".85"/>
    ))}
    {/* Bee flying nearby */}
    <ellipse cx="20" cy="-10" rx="3.5" ry="2.5" fill="#fbbf24"/>
    <line x1="18" y1="-10" x2="22" y2="-10" stroke="#1c0a00" strokeWidth=".8"/>
    <path d="M19 -12.5 Q20 -15 21 -12.5" stroke="rgba(200,200,255,0.7)" strokeWidth=".8" fill="none"/>
  </g>;

  // ── COMPOST PATCH ───────────────────────────────────────────────────────────
  if (d==='compost') return <g>
    <ellipse cx="0" cy="5" rx="20" ry="9" fill="#78350f" opacity=".7"/>
    <ellipse cx="0" cy="3" rx="16" ry="7" fill="#92400e"/>
    {/* Organic material */}
    {[[-10,0],[-3,-3],[6,-1],[12,2],[-5,4],[4,5]].map(([x,y],k)=>(
      <ellipse key={k} cx={x} cy={y} rx="3.5" ry="2" fill={k%2?'#4ade80':'#86efac'} opacity=".75" transform={`rotate(${k*25},${x},${y})`}/>
    ))}
    {/* Worm */}
    <path d="M-8 5 Q-3 2 2 5 Q7 8 12 5" stroke="#f87171" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    {/* Steam wisps */}
    <path d="M-4 -2 Q-5 -6 -4 -10" stroke="rgba(200,200,200,0.5)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <path d="M4 -3 Q3 -7 4 -11" stroke="rgba(200,200,200,0.4)" strokeWidth="1" fill="none" strokeLinecap="round"/>
  </g>;

  if (d==='grass'||role==='pioneer') return <g transform={`skewX(${sw*8})`}>
    <ellipse cx="-10" cy="2" rx="4" ry="1.6" fill={edge} opacity=".55"/>
    <ellipse cx="6" cy="4" rx="5" ry="1.8" fill={edge} opacity=".55"/>
    {[-12,-4,4,12].map((x,k)=><path key={k} d={`M${x} 3 q1 -7 ${(k%2?1:-1)*1.5} -10`}
      stroke={edge} strokeWidth="1.4" fill="none" strokeLinecap="round"/>)}
  </g>;

  // ── SHRUB ───────────────────────────────────────────────────────────────────
  if (role==='shrub') return <g transform={`translate(${sw*6},0)`}>
    <ellipse cx="0" cy="3" rx="14" ry="3.5" fill="rgba(0,0,0,.18)"/>
    <circle cx="-6" cy="-4" r="7" fill={edge}/>
    <circle cx="-6" cy="-6" r="6.5" fill={top}/>
    <circle cx="6" cy="-2" r="6" fill={edge}/>
    <circle cx="6" cy="-4" r="5.5" fill={top}/>
    <circle cx="0" cy="-8" r="4.5" fill={top}/>
  </g>;

  // ── TREE (generic canopy) ────────────────────────────────────────────────────
  if (role==='canopy') return <g transform={`translate(${sw*10},0)`}>
    <ellipse cx="0" cy="6" rx="17" ry="4" fill="rgba(0,0,0,.22)"/>
    <rect x="-2.5" y="-6" width="5" height="14" rx="1.5" fill="#7A4E2A"/>
    <ellipse cx="0" cy="-12" rx="20" ry="14" fill={edge}/>
    <ellipse cx="-3" cy="-15" rx="14" ry="10" fill={top}/>
    <ellipse cx="7" cy="-11" rx="10" ry="7" fill={top}/>
  </g>;

  // ── DEFAULT fallback ────────────────────────────────────────────────────────
  return <g fill={edge} opacity=".5">
    <circle cx="-10" cy="2" r=".9"/><circle cx="0" cy="-2" r=".9"/>
    <circle cx="10" cy="2" r="1"/><circle cx="5" cy="5" r=".7"/>
  </g>;
}


// ── Wildlife glyphs (shared pool) ─────────────────────────────────────────────
function CreatureGlyph({ kind }) {
  switch(kind) {
    case 'lizard':    return <g><path d="M-7 3 q5 -3 10 0 q3 1 7 -1" stroke="#8B6E3A" strokeWidth="2.2" fill="none" strokeLinecap="round"/><circle cx="-6" cy="2" r="2.4" fill="#A28145"/><circle cx="-7" cy="1.5" r=".5" fill="#1A1208"/></g>;
    case 'beetle':    return <g><ellipse cx="0" cy="0" rx="3.5" ry="2.5" fill="#2A1F12"/><ellipse cx="-.6" cy="-.4" rx="1.8" ry="1.2" fill="#5A4A33"/></g>;
    case 'sparrow':   return <g><ellipse cx="0" cy="0" rx="3.2" ry="2.4" fill="#A07A48"/><circle cx="2.4" cy="-1.4" r="1.8" fill="#A07A48"/><polygon points="3.5,-1.4 5.5,-1 3.5,-.5" fill="#3B2A12"/><circle cx="3" cy="-1.6" r=".4" fill="#1A1208"/></g>;
    case 'fox':       return <g><ellipse cx="-1" cy="0" rx="5.5" ry="3" fill="#D89C68"/><circle cx="4" cy="-1" r="3.2" fill="#D89C68"/><polygon points="2.5,-3.5 3.8,-1 5.5,-3.2" fill="#D89C68"/><circle cx="5" cy="-1" r=".5" fill="#1A1208"/><path d="M-6 1 q-5 -2 -7 1" stroke="#D89C68" strokeWidth="3" fill="none" strokeLinecap="round"/></g>;
    case 'gazelle':   return <g><rect x="-2" y="0" width="1.4" height="9" fill="#B8895A"/><rect x="2" y="0" width="1.4" height="9" fill="#B8895A"/><ellipse cx="0" cy="-1" rx="7" ry="3.5" fill="#C99868"/><ellipse cx="6" cy="-3" rx="3" ry="2.4" fill="#C99868"/><path d="M5 -5 q1 -4 -1 -6 M7 -5 q1 -4 3 -6" stroke="#5A3D1E" strokeWidth="1.2" fill="none" strokeLinecap="round"/></g>;
    case 'oryx':      return <g><rect x="-3" y="0" width="1.6" height="9" fill="#F0E4D2"/><rect x="2" y="0" width="1.6" height="9" fill="#F0E4D2"/><ellipse cx="0" cy="-1" rx="9" ry="4" fill="#F0E4D2"/><ellipse cx="7" cy="-3" rx="3.5" ry="2.8" fill="#F0E4D2"/><path d="M6 -5 q-1 -10 -3 -12 M9 -5 q1 -10 3 -12" stroke="#1A1208" strokeWidth="1.4" fill="none" strokeLinecap="round"/></g>;
    case 'hornbill':  return <g><ellipse cx="0" cy="-1" rx="4.5" ry="3" fill="#2A1F12"/><circle cx="3.5" cy="-3" r="2.4" fill="#2A1F12"/><polygon points="4.5,-3 8,-2.5 4.5,-1.5" fill="#F37A30"/></g>;
    case 'crab':      return <g><ellipse cx="0" cy="0" rx="4" ry="2.8" fill="#E07828"/><path d="M-4 0 q-4 -2 -6 -4 M4 0 q4 -2 6 -4 M-3 1 q-4 2 -5 4 M3 1 q4 2 5 4" stroke="#E07828" strokeWidth="1.2" fill="none"/><circle cx="-1.5" cy="-1" r=".6" fill="#1A1208"/><circle cx="1.5" cy="-1" r=".6" fill="#1A1208"/></g>;
    case 'heron':     return <g><rect x="-1" y="-8" width="2" height="12" rx="1" fill="#6080A0"/><ellipse cx="0" cy="-10" rx="2.5" ry="2" fill="#6080A0"/><path d="M0 -9 q4 -2 8 -1" stroke="#6080A0" strokeWidth="1.2" fill="none"/><path d="M0 4 q-2 2 -4 6 M0 4 q2 2 4 6" stroke="#6080A0" strokeWidth="1.2" fill="none"/></g>;
    case 'turtle':    return <g><ellipse cx="0" cy="0" rx="5" ry="3.5" fill="#4A7848"/><ellipse cx="0" cy="0" rx="3.5" ry="2.2" fill="#5A9858"/><circle cx="-5.5" cy="0" r="1" fill="#4A7848"/><circle cx="5.5" cy="0" r="1" fill="#4A7848"/><circle cx="-4" cy="-2.5" r="1" fill="#4A7848"/><circle cx="4" cy="-2.5" r="1" fill="#4A7848"/></g>;
    case 'dolphin':   return <g><path d="M-12 0 q6 -4 14 0 q4 2 6 -2" stroke="#4878A8" strokeWidth="3" fill="none" strokeLinecap="round"/><ellipse cx="-10" cy="0" rx="2" ry="1.5" fill="#4878A8"/></g>;
    case 'monkey':    return <g><circle cx="0" cy="-5" r="4" fill="#8B6E3A"/><ellipse cx="0" cy="2" rx="3.5" ry="5" fill="#8B6E3A"/><circle cx="-1.5" cy="-6" r=".7" fill="#1A1208"/><circle cx="1.5" cy="-6" r=".7" fill="#1A1208"/><path d="M-2 -3.5 q2 1 4 0" stroke="#5A4A20" strokeWidth=".7" fill="none"/></g>;
    case 'crow':      return <g><ellipse cx="0" cy="0" rx="3.5" ry="2.5" fill="#1A1A2A"/><circle cx="2.5" cy="-1.5" r="2" fill="#1A1A2A"/><polygon points="3.5,-1 6,-1 3.5,0" fill="#3A3A4A"/></g>;
    case 'cat':       return <g><ellipse cx="0" cy="1" rx="4.5" ry="3" fill="#C8A878"/><circle cx="3" cy="-2" r="3.2" fill="#C8A878"/><polygon points="1.5,-5 3,-1.5 4.5,-5" fill="#C8A878"/><circle cx="2" cy="-2.5" r=".6" fill="#1A1208"/><circle cx="4" cy="-2.5" r=".6" fill="#1A1208"/></g>;
    case 'mongoose':  return <g><ellipse cx="0" cy="1" rx="6" ry="2.5" fill="#A89068"/><circle cx="5" cy="-1" r="2.5" fill="#A89068"/><circle cx="5.5" cy="-2" r=".5" fill="#1A1208"/><path d="M-6 0 q-3 1 -5 3" stroke="#A89068" strokeWidth="2" fill="none" strokeLinecap="round"/></g>;
    case 'sunbear':   return <g><ellipse cx="0" cy="1" rx="5.5" ry="3.5" fill="#2A1A08"/><circle cx="3.5" cy="-2" r="3.5" fill="#2A1A08"/><ellipse cx="3.5" cy="-1.5" rx="2" ry="1.5" fill="#C8A020"/><circle cx="2.5" cy="-3" r=".6" fill="#1A1208"/><circle cx="4.5" cy="-3" r=".6" fill="#1A1208"/></g>;
    case 'orangutan': return <g><ellipse cx="0" cy="2" rx="5" ry="4" fill="#C87820"/><circle cx="0" cy="-4" r="4.5" fill="#C87820"/><ellipse cx="0" cy="-3" rx="2.5" ry="2" fill="#F0A050"/><circle cx="-1.5" cy="-5" r=".7" fill="#1A1208"/><circle cx="1.5" cy="-5" r=".7" fill="#1A1208"/><path d="M-5 0 q-3 0 -6 3 M5 0 q3 0 6 3" stroke="#C87820" strokeWidth="2.5" fill="none" strokeLinecap="round"/></g>;
    case 'tiger':     return <g><ellipse cx="0" cy="1" rx="5.5" ry="3" fill="#C88020"/><circle cx="4" cy="-2" r="3.2" fill="#C88020"/><line x1="-4" y1="-2" x2="0" y2="0" stroke="#5A3808" strokeWidth=".8"/><line x1="-2" y1="2" x2="2" y2="4" stroke="#5A3808" strokeWidth=".8"/><circle cx="3" cy="-3" r=".6" fill="#1A1208"/><circle cx="5" cy="-3" r=".6" fill="#1A1208"/></g>;
    case 'cricket':   return <g><ellipse cx="0" cy="0" rx="2.5" ry="1.5" fill="#208840"/><path d="M-2 0 q-3 -2 -5 -1 M2 0 q3 -2 5 -1" stroke="#208840" strokeWidth="1" fill="none"/><path d="M0 1 q0 3 -1 5 M0 1 q0 3 1 5" stroke="#208840" strokeWidth="1" fill="none"/></g>;
    case 'parakeet':  return <g><ellipse cx="0" cy="0" rx="2.5" ry="3" fill="#28A828"/><circle cx="1.5" cy="-3" r="2" fill="#28A828"/><polygon points="2,-2.5 5,-2 2,-1.5" fill="#C8A020"/><circle cx="2" cy="-3.5" r=".4" fill="#1A1208"/></g>;
    default: return <g><circle cx="0" cy="0" r="2" fill="rgba(42,31,18,0.4)"/></g>;
  }
}

function WildlifeSprite({ kind, anchorTile, neighborTile, now, seed }) {
  if(!anchorTile) return null;
  const a=isoPos(anchorTile.i,anchorTile.j), b=neighborTile?isoPos(neighborTile.i,neighborTile.j):a;
  const u=(now/(4000+(seed%30)*100)+seed*0.13)%2, f=u<1?u:2-u;
  const e=0.5-Math.cos(f*Math.PI)/2;
  const cx=a.cx+(b.cx-a.cx)*e, cy=a.cy+(b.cy-a.cy)*e-8;
  return <g transform={`translate(${cx},${cy+Math.sin(now/120+seed)*1.2}) scale(${b.cx>=a.cx?1:-1},1)`}><CreatureGlyph kind={kind}/></g>;
}

function FlyingBird({ now, seed, mapW }) {
  const u=((now+seed*1700)/9000)%1;
  const flap=Math.sin(now/100+seed)*0.5+0.5;
  return <g transform={`translate(${-40+u*(mapW+80)},${30+(seed%50)+Math.sin(now/380+seed)*8})`} opacity="0.75">
    <path d={`M-8 0 q4 ${-6+flap*4} 8 0 M0 0 q4 ${-6+flap*4} 8 0`} stroke="#2A1F12" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
  </g>;
}

// ── Fire ──────────────────────────────────────────────────────────────────────
function FireOverlay({ cx, cy, now, seed=0 }) {
  const h=18+Math.sin(now/80+seed)*4;
  return <g transform={`translate(${cx},${cy-4})`} style={{pointerEvents:'none'}}>
    {[[-8,0],[-2,-4],[4,0],[0,4],[-6,6]].map(([x,y],k)=>{
      const s=Math.sin(now/60+k*1.3)*0.25;
      return <ellipse key={k} cx={x+s*6} cy={y} rx={5+s*2} ry={h*0.55+s*3}
        fill={k%2===0?`rgba(243,${100+k*20},20,0.82)`:`rgba(255,${160+k*15},30,0.65)`}/>;
    })}
    <ellipse cx="0" cy="0" rx="14" ry="5" fill="rgba(255,80,0,0.45)"/>
  </g>;
}

function FloodOverlay({ top, now, seed=0 }) {
  return <polygon points={top} fill={`rgba(46,141,166,${(0.55+Math.sin(now/900+seed)*0.15).toFixed(2)})`}/>;
}

function IrrigationPulse({ tile, now, seed=0 }) {
  const {cx,cy}=isoPos(tile.i,tile.j);
  const u=((now+seed*600)/2800)%1;
  return <ellipse cx={cx} cy={cy} rx={u*80} ry={u*44} fill="none"
    stroke={tile.role==='water'?'#2E8DA6':'#F37A30'} strokeWidth="1.4" opacity={(1-u)*0.4}/>;
}

function placementScale(placedAt, now) {
  if(!placedAt) return 1;
  const t=Math.min(1,Math.max(0,(now-placedAt)/500));
  return t>=1?1:0.2+(1-Math.pow(1-t,3))+Math.sin(t*Math.PI)*0.15;
}

function CostFlyout({ x, y, text, color, startTime, now, onDone }) {
  const t=(now-startTime)/1200;
  useEffect(()=>{if(t>=1)onDone();},[t]);
  if(t>=1) return null;
  return <text x={x} y={y+(-t*24)} style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,fontWeight:700}}
    textAnchor="middle" fill={color} opacity={1-t}>{text}</text>;
}


// ── Full-map rain overlay ─────────────────────────────────────────────────────
function RainOverlay({ now, mapW, mapH, weather }) {
  if(weather!=='storm') return null;
  const t=now*0.18;
  const drops=Array.from({length:40},(_,k)=>{
    const x=((k*173+t)%mapW);
    const y=((k*97+t*1.4)%mapH);
    return {x,y,len:12+k%8,op:0.18+((k*31)%10)*0.022};
  });
  return <g pointerEvents="none">
    {drops.map((d,k)=>(
      <line key={k} x1={d.x} y1={d.y} x2={d.x-5} y2={d.y+d.len}
        stroke={`rgba(160,200,230,${d.op.toFixed(2)})`} strokeWidth="0.9"/>
    ))}
  </g>;
}

// ── Heat shimmer overlay ───────────────────────────────────────────────────────
function HeatShimmer({ now, mapW, mapH, theme, stats }) {
  if(theme==='planet'||theme==='coastal') return null;
  if((stats?.heat||0)<50) return null;
  const intensity=Math.min(1,(stats.heat-50)/50);
  const t=now*0.0012;
  return <g pointerEvents="none" opacity={intensity*0.35}>
    {Array.from({length:6},(_,k)=>{
      const x=(k/6)*mapW;
      const wave=Math.sin(t+k*1.1)*6;
      return <line key={k} x1={x+wave} y1={0} x2={x+wave*0.5} y2={mapH}
        stroke="rgba(255,180,80,0.12)" strokeWidth="18"/>;
    })}
  </g>;
}

function CloudShadow({ now, mapW, seed=0, weather }) {
  if(weather==='clear') return null;
  const u=((now+seed*8000)/30000)%1;
  const cx=-200+u*(mapW+400);
  const cy=50+(seed*47)%80;
  const isStorm=weather==='storm';
  // Rain streak offset cycles
  const rainOff=((now*0.15+seed*200)%80);
  return <g opacity={isStorm?0.28:0.13} pointerEvents="none">
    {/* Cloud body */}
    <ellipse cx={cx}    cy={cy}    rx="130" ry="44" fill="#6A6A80"/>
    <ellipse cx={cx+80} cy={cy+18} rx="110" ry="38" fill="#7A7A90"/>
    <ellipse cx={cx-30} cy={cy+10} rx="80"  ry="30" fill="#6A6A80"/>
    {/* Cloud highlight */}
    <ellipse cx={cx-20} cy={cy-12} rx="80" ry="20" fill="rgba(255,255,255,0.12)"/>
    {/* Rain streaks — only in storm/rain */}
    {isStorm && Array.from({length:18}).map((_,k)=>{
      const rx=cx-120+k*14+rainOff%14;
      const ry=cy+30+k*3;
      return <line key={k} x1={rx} y1={ry} x2={rx-4} y2={ry+28}
        stroke="rgba(160,180,220,0.55)" strokeWidth="0.9"/>;
    })}
  </g>;
}

// ── Villager NPC ──────────────────────────────────────────────────────────────
function VillagerSprite({ tile, now, seed }) {
  const {cx,cy}=isoPos(tile.i,tile.j);
  const colors=['#C9551A','#3F9A4F','#2E8DA6','#7A4E2A'];
  const shirtColor=colors[seed%colors.length];
  const bob=Math.sin(now/320+seed)*1.4;
  const wander=Math.sin(now/2200+seed*0.7)*12;
  const wanderY=Math.cos(now/2800+seed*0.5)*7;
  return <g transform={`translate(${cx+wander},${cy-10+wanderY+bob})`} style={{pointerEvents:'none'}}>
    <ellipse cx="0" cy="12" rx="5" ry="2" fill="rgba(0,0,0,0.2)"/>
    <rect x="-2.5" y="6" width="1.8" height="6" rx="0.9" fill="#5A4A33"/>
    <rect x="0.8"  y="6" width="1.8" height="6" rx="0.9" fill="#5A4A33"/>
    <rect x="-3.5" y="-2" width="7" height="9" rx="2" fill={shirtColor}/>
    <circle cx="0" cy="-6" r="4.5" fill="#D89C68"/>
    <ellipse cx="0" cy="-9" rx="5" ry="2" fill="#F5E6C8"/>
    <rect x="-3" y="-11" width="6" height="3" rx="1.5" fill="#E8D4A0"/>
    <circle cx="-1.5" cy="-6" r="0.7" fill="#1A1208"/>
    <circle cx="1.5"  cy="-6" r="0.7" fill="#1A1208"/>
  </g>;
}

// ── Sahel/Guide character ─────────────────────────────────────────────────────
function GuideSprite({ guide, targetTile, now, tip }) {
  const [pos, setPos] = useState(() => isoPos(COLS-3, 2));
  const animRef=useRef(null), sRef=useRef({from:isoPos(COLS-3,2),to:{i:COLS-3,j:2},t0:0});

  useEffect(()=>{
    if(!targetTile) return;
    const toIso=isoPos(targetTile.i,targetTile.j);
    if(Math.abs(toIso.cx-pos.cx)<4&&Math.abs(toIso.cy-pos.cy)<4) return;
    sRef.current={from:pos,to:toIso,t0:performance.now()};
    const tick=()=>{
      const t=Math.min(1,(performance.now()-sRef.current.t0)/900);
      const e=1-Math.pow(1-t,3);
      setPos({cx:sRef.current.from.cx+(sRef.current.to.cx-sRef.current.from.cx)*e,
              cy:sRef.current.from.cy+(sRef.current.to.cy-sRef.current.from.cy)*e});
      if(t<1) animRef.current=requestAnimationFrame(tick);
    };
    cancelAnimationFrame(animRef.current); animRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(animRef.current);
  },[targetTile?.i,targetTile?.j]);

  const bob=Math.sin(now/310)*2, step=Math.sin(now/220)*3;
  const facing=(targetTile&&isoPos(targetTile.i,targetTile.j).cx>=pos.cx)?1:-1;

  return <g transform={`translate(${pos.cx+20},${pos.cy-22+bob})`} style={{pointerEvents:'none'}}>
    <ellipse cx="0" cy="22" rx="11" ry="4" fill="rgba(0,0,0,0.22)"/>
    <g transform={`scale(${facing},1)`}>
      <rect x="-3.5" y="10" width="2.2" height="10" rx="1.1" fill="#5A4A33" transform={`rotate(${step*0.4},-2,10)`}/>
      <rect x="1.5"  y="10" width="2.2" height="10" rx="1.1" fill="#5A4A33" transform={`rotate(${-step*0.4},3,10)`}/>
      <rect x="-5" y="-3" width="10" height="14" rx="2.5" fill="#F5F0E8"/>
      <rect x="-8" y="-2" width="3.5" height="8" rx="1.5" fill="#E8E0D0" transform={`rotate(${step*0.3},-6,-2)`}/>
      <g transform="translate(3,-2)">
        <rect x="0" y="0" width="5" height="7" rx="1" fill="#D9AC6A"/>
        <rect x="0.5" y="1" width="4" height="0.8" fill="#B98444"/>
        <rect x="0.5" y="2.5" width="4" height="0.8" fill="#B98444"/>
      </g>
      <circle cx="0" cy="-8" r="6.5" fill="#7A5C3A"/>
      <ellipse cx="0" cy="-13" rx="5.5" ry="2.2" fill="#F5F0E8"/>
      <rect x="-4" y="-16" width="8" height="4" rx="2" fill="#FFFAF5"/>
      <circle cx="-2.2" cy="-8" r="0.9" fill="#1A1208"/>
      <circle cx="2.2"  cy="-8" r="0.9" fill="#1A1208"/>
      <path d="M-2 -5.5 q2 1.5 4 0" stroke="#5A3D1E" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
    </g>
    {/* Badge */}
    <g transform="translate(-26,-18)">
      <circle cx="0" cy="0" r="8" fill="#F37A30"/>
      <text textAnchor="middle" y="3.5" style={{fontSize:6,fontWeight:700,fill:'#fff',fontFamily:'Inter,sans-serif'}}>{guide?.initials||'SA'}</text>
    </g>
    {/* Tip bubble — always above */}
    {tip&&<g transform="translate(-90,-110)">
      <rect x="0" y="0" width="180" height="48" rx="8" fill="rgba(42,31,18,0.92)"/>
      <polygon points="80,48 90,58 100,48" fill="rgba(42,31,18,0.92)"/>
      <foreignObject x="7" y="5" width="166" height="40">
        <div xmlns="http://www.w3.org/1999/xhtml"
             style={{fontSize:8.5,color:'#FAF3E2',fontFamily:'Inter,sans-serif',lineHeight:1.35,padding:'0 2px'}}>
          {tip}
        </div>
      </foreignObject>
    </g>}
  </g>;
}

// ── Field Agent ───────────────────────────────────────────────────────────────
// Per-theme agent designs
const AGENT_THEMES = {
  // Desert: field ecologist with wide-brim hat + shovel
  sunset: ({ step, s }) => <g>
    <rect x="-3" y="8" width="2.5" height="8" rx="1.2" fill="#5A4A33" transform={`rotate(${step*0.5},-2,8)`}/>
    <rect x="1"  y="8" width="2.5" height="8" rx="1.2" fill="#5A4A33" transform={`rotate(${-step*0.5},2,8)`}/>
    <rect x="-4.5" y="-2" width="9" height="11" rx="2.5" fill="#F37A30"/>
    <rect x="-7" y="-1" width="3" height="7" rx="1.5" fill="#C9551A" transform={`rotate(${-step*0.4},-5,-1)`}/>
    <g transform={`translate(4,-1) rotate(${step*0.3})`}>
      <rect x="0" y="0" width="2" height="12" rx="1" fill="#7A4E2A"/>
      <polygon points="-2,10 4,10 3,14 -1,14" fill="#9A8A78"/>
    </g>
    <circle cx="0" cy="-7" r="6" fill="#C8905A"/>
    <ellipse cx="0" cy="-12" rx="7.5" ry="2.5" fill="#5C3A20"/>
    <rect x="-5" y="-16" width="10" height="5" rx="2" fill="#3A2010"/>
    <circle cx="-2" cy="-7" r="0.9" fill="#1A0A08"/>
    <circle cx="2"  cy="-7" r="0.9" fill="#1A0A08"/>
  </g>,

  // Coastal: marine biologist in wetsuit + oxygen tank
  coastal: ({ step, s }) => <g>
    <rect x="-3" y="8" width="2.5" height="9" rx="1.2" fill="#1A4A5A" transform={`rotate(${step*0.5},-2,8)`}/>
    <rect x="1"  y="8" width="2.5" height="9" rx="1.2" fill="#1A4A5A" transform={`rotate(${-step*0.5},2,8)`}/>
    <rect x="-4.5" y="-2" width="9" height="11" rx="2" fill="#2A7A9A"/>
    {/* oxygen tank on back */}
    <rect x="3.5" y="-2" width="3" height="8" rx="1.5" fill="#4A9AB8"/>
    <rect x="-7" y="-1" width="3" height="7" rx="1.5" fill="#1A5A7A" transform={`rotate(${-step*0.4},-5,-1)`}/>
    {/* flipper tool */}
    <g transform={`translate(4,-1) rotate(${step*0.3})`}>
      <rect x="0" y="0" width="2" height="10" rx="1" fill="#1A4A5A"/>
      <ellipse cx="1" cy="11" rx="3.5" ry="2" fill="#2A8AAA"/>
    </g>
    <circle cx="0" cy="-7" r="6" fill="#A07850"/>
    {/* diving mask */}
    <rect x="-5" y="-11" width="10" height="5" rx="2.5" fill="#1A5A7A"/>
    <ellipse cx="0" cy="-9" rx="3.5" ry="2.5" fill="rgba(100,200,255,0.4)"/>
    <circle cx="-2" cy="-7" r="0.9" fill="#1A0A08"/>
    <circle cx="2"  cy="-7" r="0.9" fill="#1A0A08"/>
  </g>,

  // Urban: city planner in hard hat + clipboard
  urban: ({ step, s }) => <g>
    <rect x="-3" y="8" width="2.5" height="8" rx="1.2" fill="#3A3A4A" transform={`rotate(${step*0.5},-2,8)`}/>
    <rect x="1"  y="8" width="2.5" height="8" rx="1.2" fill="#3A3A4A" transform={`rotate(${-step*0.5},2,8)`}/>
    <rect x="-4.5" y="-2" width="9" height="11" rx="2.5" fill="#6A8A5A"/>
    <rect x="-7" y="-1" width="3" height="7" rx="1.5" fill="#4A6A3A" transform={`rotate(${-step*0.4},-5,-1)`}/>
    {/* clipboard */}
    <g transform={`translate(3.5,-2) rotate(${step*0.3})`}>
      <rect x="0" y="0" width="5" height="7" rx="1" fill="#D9AC6A"/>
      <rect x="0.5" y="1" width="4" height="0.8" fill="#B98444"/>
      <rect x="0.5" y="2.5" width="4" height="0.8" fill="#B98444"/>
      <rect x="0.5" y="4" width="3" height="0.8" fill="#B98444"/>
    </g>
    <circle cx="0" cy="-7" r="6" fill="#C8A878"/>
    {/* hard hat */}
    <ellipse cx="0" cy="-12.5" rx="7.5" ry="3" fill="#F0C020"/>
    <rect x="-5" y="-16" width="10" height="5" rx="1" fill="#E0B010"/>
    <circle cx="-2" cy="-7" r="0.9" fill="#1A0A08"/>
    <circle cx="2"  cy="-7" r="0.9" fill="#1A0A08"/>
  </g>,

  // Forest: ranger in khaki + machete
  forest: ({ step, s }) => <g>
    <rect x="-3" y="8" width="2.5" height="8" rx="1.2" fill="#4A5A2A" transform={`rotate(${step*0.5},-2,8)`}/>
    <rect x="1"  y="8" width="2.5" height="8" rx="1.2" fill="#4A5A2A" transform={`rotate(${-step*0.5},2,8)`}/>
    <rect x="-4.5" y="-2" width="9" height="11" rx="2.5" fill="#6A8A3A"/>
    <rect x="-7" y="-1" width="3" height="7" rx="1.5" fill="#4A6A2A" transform={`rotate(${-step*0.4},-5,-1)`}/>
    {/* machete */}
    <g transform={`translate(4,-1) rotate(${step*0.4})`}>
      <rect x="0" y="0" width="2.5" height="13" rx="1" fill="#5A4A2A"/>
      <polygon points="-1,11 3.5,11 4,16 -1.5,16" fill="#8A8A90"/>
      <path d="M2 11 L5 16" stroke="#6A6A70" strokeWidth="0.8"/>
    </g>
    <circle cx="0" cy="-7" r="6" fill="#8A6A3A"/>
    {/* ranger hat */}
    <ellipse cx="0" cy="-13" rx="8" ry="2.5" fill="#5A6A2A"/>
    <rect x="-4.5" y="-17" width="9" height="5" rx="1.5" fill="#4A5A1A"/>
    <circle cx="-2" cy="-7" r="0.9" fill="#1A0A08"/>
    <circle cx="2"  cy="-7" r="0.9" fill="#1A0A08"/>
  </g>,

  // Planet: astrobiologist in spacesuit + sample probe
  planet: ({ step, s }) => <g>
    <rect x="-3.5" y="8" width="3" height="9" rx="1.5" fill="#3A4A5A" transform={`rotate(${step*0.4},-2,8)`}/>
    <rect x="1"    y="8" width="3" height="9" rx="1.5" fill="#3A4A5A" transform={`rotate(${-step*0.4},2,8)`}/>
    {/* spacesuit body */}
    <rect x="-5.5" y="-3" width="11" height="12" rx="3.5" fill="#D0D8E8"/>
    <rect x="-3.5" y="-1" width="7" height="8" rx="2" fill="#B0B8C8"/>
    {/* life support pack */}
    <rect x="4" y="-2" width="4" height="9" rx="2" fill="#A0A8B8"/>
    <rect x="-8" y="-1" width="3.5" height="8" rx="1.5" fill="#B0B8C8" transform={`rotate(${-step*0.3},-6,-1)`}/>
    {/* probe tool */}
    <g transform={`translate(4.5,-1) rotate(${step*0.3})`}>
      <rect x="0" y="0" width="2" height="11" rx="1" fill="#8090A0"/>
      <circle cx="1" cy="12" r="2.5" fill="#60D0C0"/>
      <circle cx="1" cy="12" r="1.2" fill="rgba(100,255,220,0.6)"/>
    </g>
    {/* helmet */}
    <circle cx="0" cy="-7.5" r="7.5" fill="#B0B8C8"/>
    <ellipse cx="0" cy="-7" rx="5" ry="4.5" fill="rgba(100,180,255,0.35)"/>
    {/* helmet reflection */}
    <path d="M-3 -11 q2 -2 5 -1" stroke="rgba(255,255,255,0.5)" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <circle cx="-2" cy="-7" r="0.9" fill="#1A2030"/>
    <circle cx="2"  cy="-7" r="0.9" fill="#1A2030"/>
  </g>,
};

function AgentSprite({ pos, targetPos, now, theme }) {
  const [rp,setRp]=useState(()=>isoPos(pos.i,pos.j));
  const animRef=useRef(null),sRef=useRef({from:isoPos(pos.i,pos.j),to:targetPos,t0:0});
  useEffect(()=>{
    if(targetPos.i===sRef.current.to.i&&targetPos.j===sRef.current.to.j) return;
    sRef.current={from:rp,to:targetPos,t0:performance.now()};
    const tick=()=>{
      const t=Math.min(1,(performance.now()-sRef.current.t0)/420),e=1-Math.pow(1-t,3);
      const toIso=isoPos(sRef.current.to.i,sRef.current.to.j);
      setRp({cx:sRef.current.from.cx+(toIso.cx-sRef.current.from.cx)*e,
             cy:sRef.current.from.cy+(toIso.cy-sRef.current.from.cy)*e});
      if(t<1) animRef.current=requestAnimationFrame(tick);
    };
    cancelAnimationFrame(animRef.current); animRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(animRef.current);
  },[targetPos.i,targetPos.j]);

  const bob=Math.sin(now/280)*1.8;
  const step=Math.sin(now/200)*3;
  const facing=targetPos.i>=pos.i?1:-1;
  const AgentBody=AGENT_THEMES[theme]||AGENT_THEMES.sunset;

  // Label per theme
  const labels = { sunset:'ECOL.', coastal:'MARINE', urban:'PLAN.', forest:'RANGER', planet:'ASTRO.' };
  const colors  = { sunset:'#F37A30', coastal:'#4A9CC8', urban:'#6A8A5A', forest:'#5A8A3A', planet:'#60D0C0' };

  return <g transform={`translate(${rp.cx},${rp.cy-18+bob})`} style={{pointerEvents:'none'}}>
    <ellipse cx="0" cy="20" rx="10" ry="4" fill="rgba(0,0,0,0.25)"/>
    <g transform={`scale(${facing},1)`}>
      <AgentBody step={step} s={now}/>
    </g>
    <text y="-24" textAnchor="middle"
      style={{fontSize:7,fontFamily:'JetBrains Mono,monospace',fontWeight:700,fill:colors[theme]||'#F37A30'}}>
      {labels[theme]||'YOU'}
    </text>
  </g>;
}

// ── Oil slick spread indicator ────────────────────────────────────────────────
function OilPulse({ tile, now, seed=0 }) {
  const {cx,cy}=isoPos(tile.i,tile.j);
  const u=((now+seed*400)/3200)%1;
  return <ellipse cx={cx} cy={cy} rx={u*60} ry={u*33} fill="none"
    stroke="rgba(42,20,8,0.5)" strokeWidth="2" opacity={(1-u)*0.5}/>;
}

// ── Main IsoMap ───────────────────────────────────────────────────────────────
export function IsoMap({
  tiles, overlay, showGrid, showWildlife, weather,
  hovered, selectedAction, onHover, onClick,
  canPlace, canAfford, flyouts, onFlyoutDone,
  agentPos, agentTarget, sahelTip, level,
}) {
  const now   = useTick(true);
  // ── Zoom & Pan — cursor-anchored zoom, touch support ──────────────────────
  const [zoom, setZoom] = useState(1.0);
  const [pan,  setPan]  = useState({x:0, y:0});
  const [dragging, setDragging] = useState(false);
  const dragRef  = useRef(null);
  const svgRef   = useRef(null);
  const stateRef = useRef({zoom:1.0, pan:{x:0,y:0}});

  // Keep ref in sync so wheel handler always has latest values
  useEffect(() => { stateRef.current = {zoom, pan}; }, [zoom, pan]);

  // Wheel: zoom anchored to cursor position
  const handleWheel = (e) => {
    e.preventDefault();
    const el = svgRef.current; if(!el) return;
    const rect = el.getBoundingClientRect();
    // Mouse position relative to container
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.88 : 1.14;
    const {zoom:oz, pan:op} = stateRef.current;
    const nz = Math.min(3, Math.max(0.45, oz * factor));
    // Adjust pan so the point under cursor stays fixed
    const nx = mx - (mx - op.x) * (nz / oz);
    const ny = my - (my - op.y) * (nz / oz);
    setZoom(nz);
    setPan({x:nx, y:ny});
  };

  // Mouse pan — any button drag (left drag pans, same as before for non-touch)
  const handleMouseDown = (e) => {
    // Left drag to pan, middle click also works
    if(e.button === 2) return; // ignore right-click
    e.preventDefault();
    setDragging(true);
    dragRef.current = {x: e.clientX - pan.x, y: e.clientY - pan.y};
  };
  const handleMouseMove = (e) => {
    if(!dragging || !dragRef.current) return;
    setPan({x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y});
  };
  const handleMouseUp = () => { setDragging(false); dragRef.current = null; };

  // Touch — single finger pan, two finger pinch-zoom anchored to midpoint
  const touchRef = useRef(null);
  const handleTouchStart = (e) => {
    if(e.touches.length === 1) {
      dragRef.current = {x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y};
      setDragging(true);
    } else if(e.touches.length === 2) {
      setDragging(false); dragRef.current = null;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current = {
        dist: Math.hypot(dx, dy),
        mx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        my: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  };
  const handleTouchMove = (e) => {
    e.preventDefault();
    if(e.touches.length === 1 && dragRef.current) {
      setPan({x: e.touches[0].clientX - dragRef.current.x,
              y: e.touches[0].clientY - dragRef.current.y});
    } else if(e.touches.length === 2 && touchRef.current) {
      const el = svgRef.current; if(!el) return;
      const rect = el.getBoundingClientRect();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const factor = newDist / touchRef.current.dist;
      const {zoom:oz, pan:op} = stateRef.current;
      const nz = Math.min(3, Math.max(0.45, oz * factor));
      // Pinch midpoint in container space
      const mx = touchRef.current.mx - rect.left;
      const my = touchRef.current.my - rect.top;
      const nx = mx - (mx - op.x) * (nz / oz);
      const ny = my - (my - op.y) * (nz / oz);
      touchRef.current.dist = newDist;
      setZoom(nz); setPan({x:nx, y:ny});
    }
  };
  const handleTouchEnd = (e) => {
    if(e.touches.length < 2) touchRef.current = null;
    if(e.touches.length === 0) { setDragging(false); dragRef.current = null; }
  };

  useEffect(() => {
    const el = svgRef.current; if(!el) return;
    el.addEventListener('wheel', handleWheel, {passive:false});
    el.addEventListener('touchmove', handleTouchMove, {passive:false});
    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);


  const vbW   = (COLS+ROWS)*TILE_W/2+40;
  const vbH   = (COLS+ROWS)*TILE_H/2+80;
  const theme = level?.theme || 'sunset';
  const wildlife = level?.wildlife || [];

  const reachSet = useMemo(()=>{
    if(!agentPos) return null;
    const s=new Set();
    for(const t of tiles)
      if(Math.abs(t.i-agentPos.i)+Math.abs(t.j-agentPos.j)<=2) s.add(key(t.i,t.j));
    return s;
  },[tiles,agentPos]);

  const validSet = useMemo(()=>{
    if(!selectedAction) return null;
    const s=new Set();
    for(const t of tiles){
      const inR=!reachSet||reachSet.has(key(t.i,t.j));
      if(inR&&canPlace(t)&&canAfford(selectedAction)) s.add(key(t.i,t.j));
    }
    return s;
  },[tiles,selectedAction,reachSet]);

  const stats = useMemo(()=>computeStats(tiles),[tiles]);

  // Villagers appear near recovered tiles
  const villagerPicks = useMemo(()=>{
    if(stats.bio<0.10) return [];
    const count=Math.min(8,1+Math.floor(stats.bio*10));
    const livable=tiles.filter(t=>['pioneer','shrub','canopy','grass','tree'].includes(t.role||t.type));
    return Array.from({length:count},(_,k)=>{
      const t=livable[(k*31+7)%Math.max(1,livable.length)];
      return t?{id:`v${k}`,tile:t,seed:k*17+3}:null;
    }).filter(Boolean);
  },[tiles,stats.bio]);

  // Guide target — worst degraded tile near centre
  const guideTarget = useMemo(()=>{
    const damaged=tiles.filter(t=>t.role==='damaged'||t.role==='soil');
    if(!damaged.length) return tiles[Math.floor(tiles.length/2)];
    const cx=COLS/2,cy=ROWS/2;
    return damaged.sort((a,b)=>Math.hypot(a.i-cx,a.j-cy)-Math.hypot(b.i-cx,b.j-cy))[0];
  },[tiles]);

  // Wildlife picks from level config
  const wildlifePicks = useMemo(()=>{
    if(!showWildlife || !wildlife.length) return [];
    const picks=[]; let seed=0;
    for(const sp of wildlife){
      // Species only unlocks when biodiversity crosses its threshold
      if(stats.bio < sp.bioMin) continue;
      const cands=tiles.filter(t=>sp.prefer.includes(t.role||t.type));
      if(!cands.length) continue;
      // 1 individual at threshold, up to 3 as bio grows
      const count=Math.min(3, 1+Math.floor((stats.bio-sp.bioMin)/0.15));
      for(let k=0;k<count;k++){
        const a=cands[(sp.id.charCodeAt(0)+k*7+seed)%cands.length];
        const ns=neighbors(a.i,a.j,1,false).map(([i,j])=>tiles[j*COLS+i]).filter(n=>n&&sp.prefer.includes(n.role||n.type));
        picks.push({id:`${sp.id}-${k}`,kind:sp.id,anchor:a,partner:ns[k%ns.length]||null,seed:seed++});
      }
    }
    return picks;
  },[tiles,stats.bio,showWildlife,wildlife]);

  // Villagers appear only when trust >= 50 AND enough canopy/shrub tiles exist
  const villagerTiles = useMemo(()=>{
    const trust = stats?.trust ?? 0;
    if(trust < 50) return [];  // community hasn't warmed yet
    const recovered = tiles.filter(t=>['shrub','canopy'].includes(t.role));
    if(recovered.length < 4) return [];  // not enough habitat yet
    // 1 villager per 4 recovered tiles, max 6
    const maxVillagers = Math.min(6, Math.floor(recovered.length / 4));
    const picks = [];
    const step = Math.max(1, Math.floor(recovered.length / maxVillagers));
    for(let i=0; i<recovered.length && picks.length<maxVillagers; i+=step){
      picks.push({ tile:recovered[i], seed:i });
    }
    return picks;
  },[tiles,stats?.trust]);

  const waterTiles   = tiles.filter(t=>t.role==='water'||t.role==='energy');
  const burningTiles = tiles.filter(t=>t.burning||(t.role==='damaged'&&theme==='forest'&&(t.deco==='burnt'||!t.deco)));
  const oilTiles     = tiles.filter(t=>t.role==='damaged'&&theme==='coastal');
  const clouds       = weather==='storm'?4:weather==='cloudy'?2:0;

  // Background colour per theme
  const bgColors = {
    sunset:'#F1D29A', coastal:'#B8D4C8', urban:'#C8C0B8',
    forest:'#C8A878', planet:'#C0B0A0', meadow:'#D4E8C2',
  };
  const bgColor = bgColors[theme]||'#F1D29A';

  // Overlay shade
  function overlayShade(t) {
    const r=t.role||'soil';
    if(overlay==='none') return null;
    if(overlay==='hydration'){
      const h=r==='water'?1:r==='canopy'?0.55+t.irrigated*0.1:r==='shrub'?0.4+t.irrigated*0.12:r==='pioneer'?0.28+t.irrigated*0.12:t.irrigated*0.18;
      if(h>=0.65) return `rgba(46,141,166,${(0.18+h*0.4).toFixed(2)})`;
      if(h>=0.3)  return 'rgba(111,196,217,0.42)';
      if(h>=0.1)  return 'rgba(255,220,150,0.32)';
      return 'rgba(243,122,48,0.32)';
    }
    if(overlay==='heat'){
      if(t.role==='canopy'||t.role==='water') return 'rgba(63,154,79,0.34)';
      if(t.role==='shrub'||t.role==='energy') return 'rgba(180,210,90,0.28)';
      if(role==='pioneer') return 'rgba(255,220,100,0.22)';
      if(t.role==='damaged') return 'rgba(220,80,40,0.44)';
      if(t.role==='obstacle') return 'rgba(180,60,30,0.32)';
      return 'rgba(255,130,50,0.38)';
    }
    if(overlay==='biodiversity'){
      const w=r==='canopy'?1:r==='water'?0.85:r==='shrub'?0.6:r==='pioneer'?0.35:0;
      return w===0?'rgba(120,120,120,0.22)':`rgba(60,140,80,${(0.2+w*0.5).toFixed(2)})`;
    }
    return null;
  }

  // Center the map in the container
  const centerX = vbW/2;
  const centerY = vbH/2;

  return (
    <div style={{position:'relative',width:'100%',height:'100%',overflow:'hidden',
                 cursor:dragging?'grabbing':'grab',
                 touchAction:'none'}}
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
         onTouchStart={handleTouchStart}
         onTouchEnd={handleTouchEnd}>

      {/* Zoom controls */}
      <div style={{position:'absolute',bottom:12,right:12,zIndex:10,
                   display:'flex',flexDirection:'column',gap:4}}>
        <button onClick={()=>setZoom(z=>Math.min(3,z*1.2))} style={{
          width:28,height:28,borderRadius:6,border:'1px solid rgba(42,31,18,.18)',
          background:'rgba(248,239,220,.85)',backdropFilter:'blur(8px)',
          fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',
          justifyContent:'center',color:'var(--ink)',fontWeight:700,
        }}>+</button>
        <button onClick={()=>setZoom(1)} style={{
          width:28,height:28,borderRadius:6,border:'1px solid rgba(42,31,18,.18)',
          background:'rgba(248,239,220,.85)',backdropFilter:'blur(8px)',
          fontSize:9,cursor:'pointer',display:'flex',alignItems:'center',
          justifyContent:'center',color:'var(--ink)',fontFamily:'JetBrains Mono,monospace',
          fontWeight:600,letterSpacing:'-0.05em',
        }}>fit</button>
        <button onClick={()=>setZoom(z=>Math.max(0.5,z*0.83))} style={{
          width:28,height:28,borderRadius:6,border:'1px solid rgba(42,31,18,.18)',
          background:'rgba(248,239,220,.85)',backdropFilter:'blur(8px)',
          fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',
          justifyContent:'center',color:'var(--ink)',fontWeight:700,
        }}>−</button>
      </div>

      <svg ref={svgRef}
           viewBox={`0 0 ${vbW} ${vbH}`}
           style={{
             width:'100%',height:'100%',minHeight:0,display:'block',
             transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
             transformOrigin:'0 0',
             transition: dragging ? 'none' : 'transform 0.05s',
           }}
           preserveAspectRatio="xMidYMid meet">
      <defs>
        {/* Vignette */}
        <radialGradient id="map-vignette" cx="50%" cy="50%" r="65%">
          <stop offset="60%"  stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.22)"/>
        </radialGradient>

        {/* Sky glow — shifts with theme */}
        <linearGradient id="sun-glow" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor={theme==='planet'?'rgba(60,20,40,0.55)':theme==='coastal'?'rgba(160,210,240,0.35)':theme==='forest'?'rgba(140,190,120,0.30)':'rgba(255,210,140,0.45)'}/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </linearGradient>

        {/* Tile drop shadow filter */}
        <filter id="tile-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="3" dy="6" stdDeviation="2.5" floodColor="rgba(0,0,0,0.22)"/>
        </filter>

        {/* Water shimmer */}
        <filter id="water-blur">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="2"
            result="noise">
            <animate attributeName="baseFrequency" values="0.04;0.045;0.04" dur="4s" repeatCount="indefinite"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
        </filter>

        {/* Canopy ambient occlusion */}
        <radialGradient id="canopy-ao" cx="50%" cy="80%" r="55%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.18)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </radialGradient>

        {/* Oil iridescence */}
        <linearGradient id="oil-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="rgba(80,20,120,0.45)"/>
          <stop offset="33%"  stopColor="rgba(20,60,140,0.35)"/>
          <stop offset="66%"  stopColor="rgba(20,120,80,0.30)"/>
          <stop offset="100%" stopColor="rgba(120,60,20,0.25)"/>
          <animateTransform attributeName="gradientTransform" type="rotate"
            from="0 0.5 0.5" to="360 0.5 0.5" dur="6s" repeatCount="indefinite"/>
        </linearGradient>

        {/* Fire glow */}
        <radialGradient id="fire-glow" cx="50%" cy="70%" r="50%">
          <stop offset="0%"   stopColor="rgba(255,120,0,0.55)"/>
          <stop offset="100%" stopColor="rgba(255,80,0,0)"/>
        </radialGradient>
      </defs>

      <rect x="0" y="0" width={vbW} height={vbH} fill={bgColor}/>
      {/* Starfield for planet theme */}
      {theme==='planet'&&Array.from({length:60},(_,k)=>{
        const sx=((k*173+11)%(vbW-20))+10;
        const sy=((k*97+7)%(vbH*0.55))+5;
        const sr=0.6+((k*31)%10)*0.08;
        const twinkle=0.4+Math.sin(now/800+k*0.7)*0.35;
        return <circle key={k} cx={sx} cy={sy} r={sr} fill={`rgba(255,255,220,${twinkle.toFixed(2)})`}/>;
      })}
      {/* Two moons for planet */}
      {theme==='planet'&&<>
        <circle cx={vbW*0.82} cy={vbH*0.08} r="22" fill="rgba(200,180,160,0.55)"/>
        <circle cx={vbW*0.82+8} cy={vbH*0.08} r="22" fill="rgba(16,8,28,0.60)"/>
        <circle cx={vbW*0.65} cy={vbH*0.12} r="10" fill="rgba(160,140,120,0.40)"/>
        <circle cx={vbW*0.65+4} cy={vbH*0.12} r="10" fill="rgba(16,8,28,0.50)"/>
      </>}
      {/* Sun disc for non-planet themes */}
      {theme!=='planet'&&<>
        <circle cx={vbW*0.80} cy={vbH*0.07} r={theme==='sunset'?32:theme==='coastal'?26:22}
          fill={theme==='sunset'?'rgba(255,200,80,0.55)':theme==='forest'?'rgba(255,240,180,0.40)':'rgba(255,230,160,0.35)'}/>
        <circle cx={vbW*0.80} cy={vbH*0.07} r={theme==='sunset'?22:16}
          fill={theme==='sunset'?'rgba(255,220,120,0.70)':'rgba(255,240,200,0.55)'}/>
      </>}
      <rect x="0" y="0" width={vbW} height={vbH} fill="var(--bg-app,#F8EFDC)" opacity="0.12"/>
      <rect x="0" y="0" width={vbW} height={vbH} fill="url(#sun-glow)"/>
      <ellipse cx={(COLS+ROWS)*TILE_W/4} cy={(COLS+ROWS)*TILE_H/2+12}
               rx={(COLS+ROWS)*TILE_W/4-40} ry="22" fill="rgba(0,0,0,0.12)"/>

      {tiles.map((t)=>{
        const {cx,cy}=isoPos(t.i,t.j);
        const w2=TILE_W/2,h2=TILE_H/2,wall=8;
        const top=`${cx},${cy-h2} ${cx+w2},${cy} ${cx},${cy+h2} ${cx-w2},${cy}`;
        const isHover=hovered&&hovered.i===t.i&&hovered.j===t.j;
        const valid=validSet&&validSet.has(key(t.i,t.j));
        const inReach=!reachSet||reachSet.has(key(t.i,t.j));
        const tRole = t.role||(t.type==='grass'?'pioneer':t.type==='tree'?'canopy':t.type==='pond'?'water':t.type==='solar'?'energy':t.type==='degraded'?'damaged':t.type==='rock'?'obstacle':t.type||'soil');
        const colors=getTileColors(tRole,theme);
        const ovFill=overlayShade({...t,role:tRole});
        const sc=placementScale(t.placedAt,now);
        return (
          <g key={key(t.i,t.j)}>
            {/* Drop shadow offset — simulates sun from upper-right */}
            <polygon points={`${cx-w2+3},${cy+4} ${cx+3},${cy+h2+4} ${cx+3},${cy+h2+wall+4} ${cx-w2+3},${cy+wall+4}`}
              fill="rgba(0,0,0,0.10)" opacity="0.7"/>
            {/* Left wall — slightly darker for depth */}
            <polygon points={`${cx-w2},${cy} ${cx},${cy+h2} ${cx},${cy+h2+wall} ${cx-w2},${cy+wall}`}
              fill={colors.edge} opacity="0.96"/>
            {/* Right wall — lighter, sun-facing */}
            <polygon points={`${cx},${cy+h2} ${cx+w2},${cy} ${cx+w2},${cy+wall} ${cx},${cy+h2+wall}`}
              fill={colors.edge} opacity="0.72"/>
            {/* Top face */}
            <polygon points={top} fill={colors.top}
              stroke={showGrid?'rgba(42,31,18,.10)':'none'} strokeWidth="0.5"/>
            {/* Subtle top-face bevel highlight — sun glint */}
            <polygon points={`${cx},${cy-h2} ${cx+w2*0.6},${cy-h2*0.15} ${cx+w2*0.2},${cy+h2*0.4} ${cx-w2*0.2},${cy-h2*0.15}`}
              fill="rgba(255,255,255,0.07)" pointerEvents="none"/>
            {/* Degraded stress pulse */}
            {(tRole==='damaged'||t.type==='degraded')&&<polygon points={top} fill={`rgba(194,70,43,${(0.08+Math.sin(now/1200+t.i*0.7+t.j*0.5)*0.06).toFixed(3)})`}/>}
            {(tRole==='soil'||t.type==='sand')&&!t.modifier&&t.irrigated>0&&<polygon points={top} fill="rgba(63,154,79,0.10)"/>}
            {t.modifier&&<polygon points={top} fill="none" stroke="#6F5F4E" strokeWidth="2.2" strokeDasharray="4 2"/>}
            {ovFill&&<polygon points={top} fill={ovFill}/>}
            {t.flooded&&<FloodOverlay top={top} now={now} seed={t.i*3+t.j}/>}
            {!inReach&&<polygon points={top} fill="rgba(0,0,0,0.08)"/>}
            {agentTarget&&agentTarget.i===t.i&&agentTarget.j===t.j&&
              <polygon points={top} fill="none" stroke="#F37A30" strokeWidth="2.5" strokeDasharray="5 3" opacity="0.8"/>}
            {/* AO shadow under canopy/shrub */}
            {(tRole==='canopy'||tRole==='shrub')&&
              <ellipse cx={cx} cy={cy+h2*0.4} rx={w2*0.65} ry={h2*0.5}
                fill="rgba(0,0,0,0.12)" pointerEvents="none"/>}
            <g transform={`translate(${cx},${cy}) scale(${sc})`}>
              <TileObject t={t} now={now} theme={theme}/>
            </g>
            {valid&&selectedAction&&selectedAction.targetRole!=='remove'&&
              <polygon points={top} fill="rgba(63,154,79,0.08)" stroke="rgba(63,154,79,0.7)" strokeWidth="2.5"/>}
            {isHover&&
              <polygon points={top} fill={valid?'rgba(63,154,79,0.12)':'rgba(194,70,43,0.08)'}
                       stroke={valid?'#3F9A4F':'rgba(194,70,43,0.9)'} strokeWidth="2.5"/>}
            <polygon points={top} fill="rgba(0,0,0,0)" style={{cursor:'pointer'}}
                     onMouseEnter={()=>onHover({i:t.i,j:t.j})} onMouseLeave={()=>onHover(null)}
                     onClick={()=>onClick(t)}/>
          </g>
        );
      })}

      {/* Water/energy pulses + shimmer */}
      {waterTiles.filter(t=>t.role==='water').map((t,k)=>{
        const {cx:wc,cy:wh}=isoPos(t.i,t.j);
        const w2=TILE_W/2,h2=TILE_H/2;
        const wTop=`${wc},${wh-h2} ${wc+w2},${wh} ${wc},${wh+h2} ${wc-w2},${wh}`;
        return <g key={`water-${t.i}-${t.j}`} filter="url(#water-blur)">
          {/* Animated shimmer layer */}
          <polygon points={wTop}
            fill={`rgba(255,255,255,${(0.06+Math.sin(now/900+k)*0.05).toFixed(3)})`}/>
          {/* Moving highlight streak */}
          <ellipse cx={wc+Math.sin(now/1400+k)*12} cy={wh-2} rx="14" ry="4"
            fill={`rgba(255,255,255,${(0.12+Math.sin(now/1100+k*0.7)*0.07).toFixed(3)})`}/>
        </g>;
      })}
      {waterTiles.map((t,k)=>(
        <g key={`pulse-${t.i}-${t.j}`}>
          <IrrigationPulse tile={t} now={now} seed={k}/>
          <IrrigationPulse tile={t} now={now+1400} seed={k+5}/>
        </g>
      ))}

      {/* Coastal oil spread indicators */}
      {oilTiles.slice(0,4).map((t,k)=>
        <OilPulse key={`oil-${t.i}-${t.j}`} tile={t} now={now} seed={k*7}/>
      )}

      {/* Fire overlays */}
      {burningTiles.map(t=>{
        const {cx,cy}=isoPos(t.i,t.j);
        return <FireOverlay key={`fire-${t.i}-${t.j}`} cx={cx} cy={cy} now={now} seed={t.i*7+t.j}/>;
      })}

      {/* Villager NPCs */}
      {villagerPicks.map(v=><VillagerSprite key={v.id} tile={v.tile} now={now} seed={v.seed}/>)}

      {/* Wildlife */}
      {/* Villager NPCs on recovered tiles */}
      {villagerTiles.map(({tile,seed})=>(
        <VillagerNPC key={`v-${seed}`} tile={tile} now={now} seed={seed} theme={theme}/>
      ))}
      {wildlifePicks.map(p=>(
        <WildlifeSprite key={p.id} kind={p.kind} anchorTile={p.anchor} neighborTile={p.partner} now={now} seed={p.seed}/>
      ))}

      {/* Flying birds when bio is high */}
      {stats.bio>0.15&&[0,1].map(k=><FlyingBird key={`bird-${k}`} now={now} seed={k*31+3} mapW={vbW}/>)}

      {/* Rain overlay — behind clouds */}
      <RainOverlay now={now} mapW={vbW} mapH={vbH} weather={weather}/>
      {/* Heat shimmer */}
      <HeatShimmer now={now} mapW={vbW} mapH={vbH} theme={theme} stats={stats}/>
      {/* Clouds */}
      {Array.from({length:clouds}).map((_,k)=>(
        <CloudShadow key={`cloud-${k}`} now={now} mapW={vbW} seed={k*17+1} weather={weather}/>
      ))}

      {/* Flyouts */}
      {flyouts.map(f=><CostFlyout key={f.id} {...f} now={now} onDone={()=>onFlyoutDone(f.id)}/>)}

      {/* Agent */}
      {agentPos&&<AgentSprite pos={agentPos} targetPos={agentTarget||agentPos} now={now} theme={theme}/>}

      {/* Guide — rendered last so tip is always on top */}
      <GuideSprite guide={level?.guide} targetTile={guideTarget} now={now} tip={sahelTip}/>

      <rect x="-20" y="-20" width={vbW} height={vbH} fill="url(#map-vignette)" pointerEvents="none"/>

      {agentPos&&<g>
        <rect x={(vbW/2)-110} y={vbH-52} width="220" height="20" rx="6" fill="rgba(42,31,18,0.72)"/>
        <text x={vbW/2} y={vbH-38} textAnchor="middle"
              style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,fontWeight:700,fill:'#FAF3E2',letterSpacing:'0.06em'}}>
          {`YOU [${agentPos.i},${agentPos.j}] · FAR = MOVE · NEAR = PLANT`}
        </text>
      </g>}

      <text x="-12" y={vbH-30} className="coord-label">{level?.coords?.split('·')[0]||'N 14°47′'}</text>
      <text x={vbW-100} y={vbH-30} className="coord-label">{level?.coords?.split('·')[1]||'E 1°22′'}</text>
    </svg>
    </div>
  );
}

export function IntelTicker({ level }) {
  const feed = level?.intelFeed || [];
  const doubled = [...feed, ...feed];
  return (
    <div className="ticker">
      <div className="ticker-label">FIELD INTEL · LIVE</div>
      <div className="ticker-track">
        <div className="ticker-rail">
          {doubled.map((line,i)=><span key={i} className="ticker-item">{line}</span>)}
        </div>
      </div>
    </div>
  );
}