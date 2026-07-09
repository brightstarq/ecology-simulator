import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { COLS, ROWS } from '../../sim/engine.js';

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD3D — Full Three.js ecological simulation renderer
// ═══════════════════════════════════════════════════════════════════════════════

const TSIZE  = 1.0;
const COLS_N = COLS || 9;
const ROWS_N = ROWS || 9;
const WORLD_W = COLS_N * TSIZE;
const WORLD_D = ROWS_N * TSIZE;

// ── Grid → World coords ────────────────────────────────────────────────────────
function tw(i, j) {
  return {
    x: (i - COLS_N / 2 + 0.5) * TSIZE,
    z: (j - ROWS_N / 2 + 0.5) * TSIZE,
  };
}

function tileRole(t) {
  return t.role || (
    t.type === 'grass' ? 'pioneer' : t.type === 'tree'  ? 'canopy' :
    t.type === 'pond'  ? 'water'   : t.type === 'solar' ? 'energy' :
    t.type === 'degraded' ? 'damaged' : t.type === 'rock' ? 'obstacle' :
    t.type || 'soil'
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCEDURAL TEXTURES — Canvas-generated, no external files needed
// ═══════════════════════════════════════════════════════════════════════════════

function makeCanvas(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Perlin-like noise helper
function noise2(x, y, freq = 1) {
  return (Math.sin(x * freq * 2.1 + y * freq * 1.7) * 0.5 +
          Math.sin(x * freq * 3.3 - y * freq * 2.9) * 0.3 +
          Math.sin(x * freq * 1.9 + y * freq * 4.1) * 0.2);
}

// Sand / cracked earth
function texSand(theme) {
  const bases = { sunset:'#E8C870', coastal:'#C8BC98', urban:'#B0A890',
                   forest:'#C0986A', planet:'#7A3C2A' };
  const base = bases[theme] || '#E8C870';
  return makeCanvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    // Grain noise
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const n = noise2(x/w, y/h, 8) * 0.5 + 0.5;
        const v = Math.floor(n * 40 - 20);
        ctx.fillStyle = `rgba(${v>0?255:0},${v>0?200:0},${v>0?150:0},${Math.abs(v)*0.008})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
    // Subtle cracks
    ctx.strokeStyle = 'rgba(100,60,20,0.12)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * w, sy = Math.random() * h;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      let cx2 = sx, cy2 = sy;
      for (let s = 0; s < 6; s++) {
        cx2 += (Math.random() - 0.5) * 24;
        cy2 += (Math.random() - 0.5) * 24;
        ctx.lineTo(cx2, cy2);
      }
      ctx.stroke();
    }
  });
}

// Damaged / degraded soil
function texDamaged(theme) {
  const bases = { sunset:'#6A3010', coastal:'#080604', forest:'#2A1008',
                   urban:'#3A2A20', planet:'#C0B0B8' };
  return makeCanvas(512, 512, (ctx, w, h) => {
    const base = bases[theme] || '#6A3010';
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    // Deep cracks
    ctx.strokeStyle = theme==='coastal' ? 'rgba(40,20,80,0.6)' : 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      let x = Math.random() * w, y = Math.random() * h;
      ctx.moveTo(x, y);
      for (let s = 0; s < 8; s++) {
        x += (Math.random() - 0.5) * 40; y += (Math.random() - 0.5) * 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Oil sheen for coastal
    if (theme === 'coastal') {
      const g = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w*0.6);
      g.addColorStop(0, 'rgba(60,10,100,0.4)');
      g.addColorStop(0.4, 'rgba(10,40,100,0.3)');
      g.addColorStop(0.8, 'rgba(0,60,40,0.2)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  });
}

// Pioneer / grass cover
function texGrass(theme) {
  const bases = { sunset:'#B8CC60', coastal:'#80A050', urban:'#A8C048',
                   forest:'#98B840', planet:'#406840' };
  const darkens = { sunset:'#7A9830', coastal:'#507030', urban:'#708030',
                    forest:'#508028', planet:'#284828' };
  return makeCanvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = bases[theme] || '#B8CC60';
    ctx.fillRect(0, 0, w, h);
    const dk = darkens[theme] || '#7A9830';
    // Grass blade pattern
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const len = 6 + Math.random() * 14;
      const lean = (Math.random() - 0.5) * 0.5;
      ctx.strokeStyle = `rgba(0,50,0,${0.08 + Math.random() * 0.12})`;
      ctx.lineWidth = 0.8 + Math.random() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + lean * len, y - len * 0.6, x + lean * len * 1.5, y - len);
      ctx.stroke();
    }
    // Colour variation patches
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const g = ctx.createRadialGradient(x,y,0,x,y,20+Math.random()*30);
      g.addColorStop(0, `rgba(0,60,0,0.12)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x-40,y-40,80,80);
    }
  });
}

// Shrub canopy top
function texShrub(theme) {
  const base = { sunset:'#6AAA48', coastal:'#488A38', urban:'#58A040',
                  forest:'#407830', planet:'#50A058' }[theme] || '#6AAA48';
  return makeCanvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 200; i++) {
      const x = Math.random()*w, y = Math.random()*h, r = 4+Math.random()*12;
      const g = ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0, 'rgba(0,80,0,0.18)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
  });
}

// Forest canopy
function texCanopy(theme) {
  const base = { sunset:'#3A7838', coastal:'#286830', urban:'#307838',
                  forest:'#1A5A20', planet:'#287848' }[theme] || '#3A7838';
  return makeCanvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    // Leaf dapple
    for (let i = 0; i < 400; i++) {
      const x = Math.random()*w, y = Math.random()*h;
      const r = 2+Math.random()*8;
      ctx.fillStyle = Math.random() > 0.5 ?
        `rgba(80,180,80,${0.1+Math.random()*0.2})` :
        `rgba(0,40,0,${0.1+Math.random()*0.15})`;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
    // Light gaps
    for (let i = 0; i < 20; i++) {
      const x = Math.random()*w, y = Math.random()*h;
      const g = ctx.createRadialGradient(x,y,0,x,y,8+Math.random()*16);
      g.addColorStop(0,'rgba(200,255,180,0.25)');
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.fillRect(x-20,y-20,40,40);
    }
  });
}

// Water surface
function texWater(theme) {
  const base = { sunset:'#4890B8', coastal:'#2870A0', urban:'#4890B8',
                  forest:'#3888A8', planet:'#108858' }[theme] || '#4890B8';
  return makeCanvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    // Ripple rings
    for (let i = 0; i < 15; i++) {
      const x = Math.random()*w, y = Math.random()*h;
      const r = 10+Math.random()*40;
      ctx.strokeStyle = `rgba(255,255,255,${0.08+Math.random()*0.18})`;
      ctx.lineWidth = 0.8+Math.random()*2;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x,y,r*0.6,0,Math.PI*2); ctx.stroke();
    }
    // Highlight streaks
    for (let i = 0; i < 8; i++) {
      const y = Math.random()*h;
      const g = ctx.createLinearGradient(0,y,w,y);
      g.addColorStop(0,'rgba(255,255,255,0)');
      g.addColorStop(0.5,`rgba(255,255,255,${0.08+Math.random()*0.12})`);
      g.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=g; ctx.fillRect(0,y-2,w,4);
    }
  });
}

// Concrete / urban obstacle
function texConcrete() {
  return makeCanvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#A8A098';
    ctx.fillRect(0, 0, w, h);
    const bs = 80;
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2;
    for (let x = 0; x < w; x += bs) ctx.strokeRect(x, 0, bs, h);
    for (let y = 0; y < h; y += bs) ctx.strokeRect(0, y, w, bs);
    for (let i = 0; i < 1200; i++) {
      const n = Math.random();
      ctx.fillStyle = `rgba(0,0,0,${n*0.06})`;
      ctx.fillRect(Math.random()*w, Math.random()*h, Math.random()*4, Math.random()*4);
    }
    // Stain patches
    for (let i = 0; i < 12; i++) {
      const x=Math.random()*w, y=Math.random()*h;
      const g=ctx.createRadialGradient(x,y,0,x,y,20+Math.random()*40);
      g.addColorStop(0,'rgba(0,0,0,0.1)'); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.fillRect(x-50,y-50,100,100);
    }
  });
}

// Planet alien soil
function texPlanet() {
  return makeCanvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#6A3020';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) {
      const x=Math.random()*w, y=Math.random()*h, r=2+Math.random()*10;
      const col = Math.random() > 0.6 ? `rgba(180,80,40,0.4)` : `rgba(40,20,60,0.3)`;
      ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
    // Dust patches
    for (let i = 0; i < 30; i++) {
      const x=Math.random()*w, y=Math.random()*h;
      const g=ctx.createRadialGradient(x,y,0,x,y,15+Math.random()*25);
      g.addColorStop(0,'rgba(200,120,80,0.15)'); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.fillRect(x-40,y-40,80,80);
    }
  });
}

// Bark texture for tree trunks
function texBark() {
  return makeCanvas(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#4A2E10';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 6+Math.random()*4) {
      ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x < w; x += 8) ctx.lineTo(x, y+(Math.random()-0.5)*4);
      ctx.stroke();
    }
  });
}

// Normal map for tiles (gives surface depth even on flat geometry)
function texNormalFlat() {
  return makeCanvas(256, 256, (ctx, w, h) => {
    const id = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i=(y*w+x)*4;
      const n = noise2(x/w,y/h,6)*0.5+0.5;
      const bump = noise2(x/w*2,y/h*2,12)*0.5+0.5;
      id.data[i]   = 128 + (n-0.5)*20 + (bump-0.5)*10;
      id.data[i+1] = 128 + (n-0.5)*20 + (bump-0.5)*10;
      id.data[i+2] = 220 + n*25;
      id.data[i+3] = 255;
    }
    ctx.putImageData(id,0,0);
  });
}

// Roughness map
function texRoughness(base=0.85, variance=0.08) {
  return makeCanvas(128,128,(ctx,w,h)=>{
    const id=ctx.createImageData(w,h);
    for(let i=0;i<id.data.length;i+=4){
      const v=Math.floor((base+(Math.random()-0.5)*variance*2)*255);
      id.data[i]=id.data[i+1]=id.data[i+2]=v; id.data[i+3]=255;
    }
    ctx.putImageData(id,0,0);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATERIAL FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

function makeMaterial(role, theme) {
  const normalMap = texNormalFlat();
  const roughMap  = texRoughness(role==='water'?0.08:role==='energy'?0.22:0.88);

  const props = {
    normalMap, normalScale: new THREE.Vector2(
      role==='soil'?0.6:role==='damaged'?1.2:role==='water'?0.3:0.5,
      role==='soil'?0.6:role==='damaged'?1.2:role==='water'?0.3:0.5
    ),
    roughnessMap: roughMap,
    roughness: role==='water'?0.05:role==='energy'?0.20:role==='obstacle'?0.82:0.85,
    metalness: role==='energy'?0.65:role==='water'?0.04:0.0,
    envMapIntensity: role==='water'?1.8:role==='energy'?1.4:0.6,
  };

  if (role === 'soil')     return new THREE.MeshStandardMaterial({ ...props, map:texSand(theme) });
  if (role === 'damaged')  return new THREE.MeshStandardMaterial({ ...props, map:texDamaged(theme) });
  if (role === 'obstacle') return new THREE.MeshStandardMaterial({ ...props, map:texConcrete() });
  if (role === 'pioneer')  return new THREE.MeshStandardMaterial({ ...props, map:texGrass(theme) });
  if (role === 'shrub')    return new THREE.MeshStandardMaterial({ ...props, map:texShrub(theme) });
  if (role === 'canopy')   return new THREE.MeshStandardMaterial({ ...props, map:texCanopy(theme) });
  if (role === 'modifier') return new THREE.MeshStandardMaterial({ ...props, map:texSand(theme), color:0xA09080 });
  if (role === 'energy')   return new THREE.MeshStandardMaterial({
    ...props, map:texConcrete(), color:0x5A6A9A,
    emissive:0x1A2A5A, emissiveIntensity:0.12,
  });
  if (role === 'water') {
    // Animated water shader
    const waterColor = {
      sunset:'#4A90B8', coastal:'#2870A0', urban:'#4A90B8',
      forest:'#3888A8', planet:'#10A868'
    }[theme] || '#4A90B8';
    return new THREE.ShaderMaterial({
      uniforms: {
        time:    { value: 0 },
        color:   { value: new THREE.Color(waterColor) },
        opacity: { value: 0.92 },
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPos;
        void main(){
          vUv=uv; vNormal=normal; vPos=position;
          vec3 p=position;
          p.y += sin(p.x*6.0+time)*0.018 + cos(p.z*5.0+time*0.7)*0.014
               + sin(p.x*3.0-p.z*4.0+time*1.3)*0.010;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
        }`,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        uniform float opacity;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main(){
          float wave=sin(vUv.x*14.0+time)*cos(vUv.y*14.0+time*0.8)*0.05+0.95;
          float foam=pow(max(0.0,sin(vUv.x*7.0-time+1.57)*cos(vUv.y*7.0+time)),5.0)*0.30;
          float fresnel=pow(1.0-abs(dot(normalize(vNormal),vec3(0.0,1.0,0.0))),2.0)*0.4;
          vec3 c=color*wave + vec3(foam) + vec3(fresnel*0.3);
          gl_FragColor=vec4(c, opacity);
        }`,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }
  if (theme === 'planet') return new THREE.MeshStandardMaterial({ ...props, map:texPlanet() });
  return new THREE.MeshStandardMaterial({ ...props, map:texSand(theme) });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TILE HEIGHTS (gives 3D depth to the world)
// ═══════════════════════════════════════════════════════════════════════════════

const TILE_HEIGHTS = {
  soil:0.06, damaged:0.02, obstacle:0.22, pioneer:0.10,
  shrub:0.18, canopy:0.28, water:0.01, energy:0.14, modifier:0.16,
};

// ═══════════════════════════════════════════════════════════════════════════════
// VEGETATION GEOMETRY — detailed multi-mesh trees and shrubs
// ═══════════════════════════════════════════════════════════════════════════════

const barkMat  = new THREE.MeshStandardMaterial({ map:texBark(), roughness:0.95 });
const rockMat  = new THREE.MeshStandardMaterial({ color:0x887868, roughness:0.92, metalness:0.05 });

function buildPioneerClump(theme, seed) {
  const g = new THREE.Group();
  const bladeCol = {
    sunset:0xB8CC60, coastal:0x80A050, urban:0xA8C048,
    forest:0x98B840, planet:0x408840
  }[theme] || 0xB8CC60;
  const bladeMat = new THREE.MeshStandardMaterial({color:bladeCol,roughness:0.88,side:THREE.DoubleSide});
  const count = 8 + (seed%6);
  for(let i=0;i<count;i++){
    const angle=Math.random()*Math.PI*2;
    const dist=Math.random()*0.30;
    const h=0.08+Math.random()*0.14;
    const blade=new THREE.Mesh(
      new THREE.PlaneGeometry(0.025+Math.random()*0.03, h),
      bladeMat
    );
    blade.position.set(Math.cos(angle)*dist, h/2, Math.sin(angle)*dist);
    blade.rotation.y=Math.random()*Math.PI;
    blade.castShadow=true;
    g.add(blade);
  }
  // Small rocks among grass
  if(seed%3===0){
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(0.04+Math.random()*0.04,0),rockMat);
    rock.position.set((Math.random()-0.5)*0.2, 0.04, (Math.random()-0.5)*0.2);
    rock.rotation.set(Math.random(),Math.random(),Math.random());
    g.add(rock);
  }
  return g;
}

function buildShrub(theme, seed) {
  const g = new THREE.Group();
  const cols = {
    sunset:  [0x7BB75D,0x5A9A40,0x9ACA70],
    coastal: [0x5A8A45,0x3A7030,0x78A858],
    urban:   [0x5AAE50,0x3A8838,0x78BE68],
    forest:  [0x5A8A45,0x3A7030,0x70A050],
    planet:  [0x60B068,0x408048,0x88C880],
  }[theme] || [0x7BB75D,0x5A9A40,0x9ACA70];

  const numBalls = 3 + (seed%4);
  for(let i=0;i<numBalls;i++){
    const r=0.10+Math.random()*0.10;
    const mat=new THREE.MeshStandardMaterial({
      color:cols[i%cols.length], roughness:0.82, normalMap:texNormalFlat(),
      normalScale:new THREE.Vector2(0.4,0.4)
    });
    const ball=new THREE.Mesh(new THREE.SphereGeometry(r,9,7),mat);
    ball.position.set((Math.random()-0.5)*0.22, r*0.6, (Math.random()-0.5)*0.22);
    ball.castShadow=true; ball.receiveShadow=true;
    g.add(ball);
  }
  // Small trunk
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.035,0.10,7),barkMat);
  trunk.position.y=0.05; trunk.castShadow=true; g.add(trunk);
  return g;
}

function buildTree(theme, deco, seed) {
  const g = new THREE.Group();
  const isMangrove  = deco==='mangrove'||deco==='mangrove-young';
  const isDome      = deco==='dometree';
  const isPlanet    = theme==='planet';

  const trunkH = isMangrove ? 0.35 : (0.45+(seed%5)*0.18);
  const trunkR  = isMangrove ? 0.05 : (0.04+(seed%4)*0.012);

  // Mangrove prop roots
  if(isMangrove){
    const rootMat=new THREE.MeshStandardMaterial({color:0x3A2A10,roughness:0.96});
    [[-.15,.10,.28],[.12,.08,.24],[.02,.18,.26],[-.10,-.12,.22]].forEach(([ox,oz,h])=>{
      const r=new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.025,h,6),rootMat);
      r.position.set(ox,h*0.45,oz); r.rotation.z=(ox>0?1:-1)*0.35;
      r.castShadow=true; g.add(r);
    });
  }

  // Trunk
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(trunkR,trunkR*1.4,trunkH,9),barkMat);
  trunk.position.y=trunkH*0.5; trunk.castShadow=true; trunk.receiveShadow=true;
  g.add(trunk);

  // Crown colours
  const crownCols = {
    sunset:  [0x4A9A50,0x3A8040,0x5AAA60],
    coastal: [0x2A7838,0x1A6028,0x3A8A48],
    urban:   [0x3A9A48,0x289038,0x4AAA58],
    forest:  [0x1A6828,0x0E5018,0x2A7838],
    planet:  [0x38A858,0x288040,0x48B868],
  }[theme] || [0x4A9A50,0x3A8040,0x5AAA60];

  const crownMat = (k) => new THREE.MeshStandardMaterial({
    color:crownCols[k%crownCols.length], roughness:0.80,
    normalMap:texNormalFlat(), normalScale:new THREE.Vector2(0.5,0.5)
  });

  if(isDome){
    // Planet dome tree
    const inner=new THREE.Mesh(new THREE.SphereGeometry(0.22,12,9),crownMat(0));
    inner.position.y=trunkH+0.18; inner.castShadow=true; g.add(inner);
    const dome=new THREE.Mesh(
      new THREE.SphereGeometry(0.28,14,10,0,Math.PI*2,0,Math.PI*0.55),
      new THREE.MeshPhysicalMaterial({
        color:0x60D0C0,roughness:0.0,metalness:0.0,
        transparent:true,opacity:0.30,transmission:0.5,
        thickness:0.3,clearcoat:1.0,clearcoatRoughness:0.0,ior:1.5
      })
    );
    dome.position.y=trunkH+0.18; g.add(dome);
    // Glow point light inside dome
    const gl=new THREE.PointLight(0x40D0B0,0.6,0.8);
    gl.position.y=trunkH+0.2; g.add(gl);
  } else {
    // Standard layered crown
    const layers = isMangrove ? 2 : (isPlanet ? 1 : 3);
    const crownR  = isMangrove ? 0.22 : (0.20+(seed%4)*0.08);
    for(let i=0;i<layers;i++){
      const r=crownR*(1-i*0.15);
      const crown=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),crownMat(i));
      crown.position.set(
        i===0?0:(Math.random()-0.5)*0.10,
        trunkH+crownR*0.5+i*crownR*0.55,
        i===0?0:(Math.random()-0.5)*0.10
      );
      crown.scale.y=0.82;
      crown.castShadow=true; crown.receiveShadow=true;
      g.add(crown);
    }
  }

  // Fallen leaf shadow patch
  const leafShadow=new THREE.Mesh(
    new THREE.CircleGeometry(isMangrove?0.20:0.28,12),
    new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.08})
  );
  leafShadow.rotation.x=-Math.PI/2; leafShadow.position.y=0.005; g.add(leafShadow);

  return g;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIRE — animated flame geometry
// ═══════════════════════════════════════════════════════════════════════════════

function buildFireGroup() {
  const g = new THREE.Group();
  const configs = [
    { color:0xFF6600, emissive:0xFF3300, r:0.11, h:0.35, ox:0,    oz:0    },
    { color:0xFF3300, emissive:0xFF1100, r:0.08, h:0.28, ox:-0.08, oz:0.05 },
    { color:0xFFAA00, emissive:0xFF8800, r:0.08, h:0.28, ox:0.07,  oz:-0.05},
    { color:0xFF8800, emissive:0xFF5500, r:0.06, h:0.22, ox:-0.05, oz:-0.08},
    { color:0xFFCC00, emissive:0xFFAA00, r:0.05, h:0.18, ox:0.06,  oz:0.08 },
  ];
  configs.forEach((c,i)=>{
    const flame=new THREE.Mesh(
      new THREE.ConeGeometry(c.r, c.h, 7),
      new THREE.MeshStandardMaterial({
        color:c.color, emissive:c.emissive, emissiveIntensity:2.2,
        transparent:true, opacity:0.88,
      })
    );
    flame.position.set(c.ox, c.h/2, c.oz);
    flame.name=`fl${i}`; flame.castShadow=false;
    g.add(flame);
  });
  // Ember glow
  const glow=new THREE.PointLight(0xFF5500,3.5,2.2);
  glow.position.y=0.2; glow.name='glow'; g.add(glow);
  return g;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT CHARACTER — detailed 3D figure per level theme
// ═══════════════════════════════════════════════════════════════════════════════

function buildAgent3D(theme) {
  const themes = {
    sunset:  { body:0xF37A30, hat:0x5C3A20, skin:0xC8905A, pants:0x4A4230 },
    coastal: { body:0x2A6A8A, hat:0x1A3A50, skin:0xA07850, pants:0x1A3040 },
    urban:   { body:0x6A8A5A, hat:0xE0B010, skin:0xC8A878, pants:0x3A3840 },
    forest:  { body:0x5A7A2A, hat:0x3A4A10, skin:0x8A6A3A, pants:0x3A4820 },
    planet:  { body:0xC8D0E0, hat:0xA0A8B8, skin:0xA8B0C0, pants:0x808898 },
  };
  const c = themes[theme] || themes.sunset;
  const g = new THREE.Group();

  const skin = new THREE.MeshStandardMaterial({color:c.skin,roughness:0.88});
  const body = new THREE.MeshStandardMaterial({color:c.body,roughness:0.85});
  const pants= new THREE.MeshStandardMaterial({color:c.pants,roughness:0.90});
  const hat  = new THREE.MeshStandardMaterial({color:c.hat,roughness:0.88});

  // Ground shadow disc
  const sh=new THREE.Mesh(new THREE.CircleGeometry(0.20,16),
    new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.18}));
  sh.rotation.x=-Math.PI/2; sh.position.y=0.002; g.add(sh);

  // Feet / boots
  [-0.07,0.07].forEach((x,k)=>{
    const boot=new THREE.Mesh(new THREE.CapsuleGeometry(0.038,0.05,5,8),
      new THREE.MeshStandardMaterial({color:0x2A1808,roughness:0.92}));
    boot.position.set(x,0.04,0.04); g.add(boot);
  });

  // Legs (pants)
  [-0.07,0.07].forEach((x,k)=>{
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(0.040,0.22,6,8),pants);
    leg.position.set(x,0.20,0); leg.name=`leg${k}`; leg.castShadow=true; g.add(leg);
  });

  // Torso
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(0.095,0.22,8,12),body);
  torso.position.y=0.47; torso.castShadow=true; g.add(torso);

  // Arms
  [-0.16,0.16].forEach((x,k)=>{
    const arm=new THREE.Mesh(new THREE.CapsuleGeometry(0.033,0.18,6,8),body);
    arm.position.set(x,0.45,0); arm.rotation.z=(x<0?1:-1)*0.28;
    arm.name=`arm${k}`; arm.castShadow=true; g.add(arm);
    // Hand
    const hand=new THREE.Mesh(new THREE.SphereGeometry(0.036,8,6),skin);
    hand.position.set(x+(x<0?-0.06:0.06),0.32,0); g.add(hand);
  });

  // Neck
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.040,0.045,0.06,8),skin);
  neck.position.y=0.60; g.add(neck);

  // Head
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.108,12,10),skin);
  head.position.y=0.68; head.castShadow=true; g.add(head);

  // Facial features
  const eyeM=new THREE.MeshBasicMaterial({color:0x1A0A08});
  [[-0.040,0.074],[0.040,0.074]].forEach(([x,z])=>{
    const e=new THREE.Mesh(new THREE.SphereGeometry(0.016,7,6),eyeM);
    e.position.set(x,0.68,z); g.add(e);
  });
  // Nose
  const nose=new THREE.Mesh(new THREE.SphereGeometry(0.012,6,5),skin);
  nose.position.set(0,0.66,0.095); g.add(nose);

  if(theme==='planet'){
    // Space helmet
    const helm=new THREE.Mesh(new THREE.SphereGeometry(0.130,14,11),
      new THREE.MeshPhysicalMaterial({
        color:0xC0C8D8,roughness:0.04,metalness:0.08,
        transparent:true,opacity:0.48,clearcoat:1.0,clearcoatRoughness:0.0
      })
    );
    helm.position.y=0.68; g.add(helm);
    // Visor tint
    const visor=new THREE.Mesh(
      new THREE.SphereGeometry(0.112,10,8,0.8,Math.PI*0.9,0.5,Math.PI*0.55),
      new THREE.MeshPhysicalMaterial({color:0x4080C0,transparent:true,opacity:0.55,roughness:0.0})
    );
    visor.position.y=0.68; g.add(visor);
    // Backpack oxygen tank
    const tank=new THREE.Mesh(new THREE.CylinderGeometry(0.048,0.048,0.22,10),
      new THREE.MeshStandardMaterial({color:0xA0A8B8,metalness:0.6,roughness:0.3}));
    tank.position.set(0,0.46,-0.12); g.add(tank);
  } else {
    // Hat brim
    const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.155,0.155,0.022,16),hat);
    brim.position.y=0.80; g.add(brim);
    // Hat crown
    const crown=new THREE.Mesh(new THREE.CylinderGeometry(0.080,0.100,0.12,12),hat);
    crown.position.y=0.87; g.add(crown);
  }

  // Tool per theme
  if(theme==='desert'||theme==='sunset'){
    // Shovel
    const handle=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.45,7),barkMat);
    handle.position.set(0.22,0.38,0.05); handle.rotation.z=-0.25; g.add(handle);
    const blade=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.10,0.02),
      new THREE.MeshStandardMaterial({color:0x909090,metalness:0.7,roughness:0.3}));
    blade.position.set(0.30,0.18,0.05); blade.rotation.z=-0.25; g.add(blade);
  } else if(theme==='coastal'){
    // Clipboard
    const clip=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.10,0.012),
      new THREE.MeshStandardMaterial({color:0xD4A060,roughness:0.7}));
    clip.position.set(0.18,0.46,0.08); clip.rotation.z=-0.15; g.add(clip);
  } else if(theme==='forest'){
    // Machete handle + blade
    const mHandle=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.18,7),
      new THREE.MeshStandardMaterial({color:0x5C3A1E,roughness:0.95}));
    mHandle.position.set(0.19,0.40,0.04); mHandle.rotation.z=-0.30; g.add(mHandle);
    const mBlade=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.14,0.006),
      new THREE.MeshStandardMaterial({color:0xB0B0B0,metalness:0.8,roughness:0.2}));
    mBlade.position.set(0.24,0.28,0.04); mBlade.rotation.z=-0.30; g.add(mBlade);
  } else if(theme==='planet'){
    // Probe rod
    const rod=new THREE.Mesh(new THREE.CylinderGeometry(0.010,0.010,0.40,7),
      new THREE.MeshStandardMaterial({color:0x909898,metalness:0.7,roughness:0.3}));
    rod.position.set(0.21,0.36,0.04); rod.rotation.z=-0.20; g.add(rod);
    const probe=new THREE.Mesh(new THREE.SphereGeometry(0.030,10,8),
      new THREE.MeshStandardMaterial({color:0x40D0C0,emissive:0x20A090,emissiveIntensity:0.8}));
    probe.position.set(0.27,0.20,0.04); g.add(probe);
    const pLight=new THREE.PointLight(0x40D0C0,0.4,0.4);
    pLight.position.copy(probe.position); g.add(pLight);
  }

  return g;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKY / ATMOSPHERE per theme
// ═══════════════════════════════════════════════════════════════════════════════

const ATMOSPHERES = {
  sunset:  { bg:0xF0D890, fog:0xE8C870, fogD:0.020, sunCol:0xFFE080, sunI:1.55, ambCol:0xFFDDA0, ambI:0.30, hTop:0xF0D890, hBot:0xB88840 },
  coastal: { bg:0x90C0E0, fog:0xA8D8F0, fogD:0.016, sunCol:0xFFF0E0, sunI:1.35, ambCol:0xC8EEF8, ambI:0.28, hTop:0x80B8E0, hBot:0x506878 },
  urban:   { bg:0xC0B8A8, fog:0xC8C0B0, fogD:0.022, sunCol:0xFFEECC, sunI:1.15, ambCol:0xD8D0C0, ambI:0.28, hTop:0xB8B0A0, hBot:0x685848 },
  forest:  { bg:0x88B070, fog:0x98B878, fogD:0.018, sunCol:0xFFF5D0, sunI:1.45, ambCol:0xC0E0A8, ambI:0.32, hTop:0x80A860, hBot:0x384820 },
  planet:  { bg:0x180C24, fog:0x200810, fogD:0.014, sunCol:0xFF8040, sunI:0.95, ambCol:0x401828, ambI:0.22, hTop:0x180C24, hBot:0x0C0408 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function World3D({
  tiles, level, year, maxYears,
  selectedAction, onTileClick, onTileHover,
  canPlace, agentPos,
}) {
  // Keep latest callbacks in refs so closures never go stale
  const onTileClickRef = useRef(onTileClick);
  const onTileHoverRef = useRef(onTileHover);
  const canPlaceRef    = useRef(canPlace);
  const selectedActionRef = useRef(selectedAction);
  useEffect(() => { onTileClickRef.current = onTileClick; }, [onTileClick]);
  useEffect(() => { onTileHoverRef.current = onTileHover; }, [onTileHover]);
  useEffect(() => { canPlaceRef.current = canPlace; }, [canPlace]);
  useEffect(() => { selectedActionRef.current = selectedAction; }, [selectedAction]);
  const mountRef = useRef(null);
  const S        = useRef(null);  // all scene state

  const theme = level?.theme || 'sunset';

  // ── INIT (once per theme) ─────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el || S.current) return;

    const atmo  = ATMOSPHERES[theme] || ATMOSPHERES.sunset;
    const W = el.clientWidth, H = el.clientHeight;
    const D = Math.max(WORLD_W, WORLD_D);

    // ─ Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = theme==='planet' ? 0.75 : 1.20;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    // ─ Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(atmo.bg);
    scene.fog = new THREE.FogExp2(atmo.fog, atmo.fogD);

    // ─ Camera ─────────────────────────────────────────────────────────────────
    const cam = new THREE.PerspectiveCamera(50, W/H, 0.1, 200);
    const sph = new THREE.Spherical(D*0.95, Math.PI/3.8, -Math.PI*0.08);
    cam.position.setFromSpherical(sph);
    cam.lookAt(0, 0, 0);

    // ─ Lights ─────────────────────────────────────────────────────────────────
    // Hemisphere (sky + ground bounce)
    const hemi = new THREE.HemisphereLight(atmo.hTop, atmo.hBot, 0.70);
    scene.add(hemi);

    // Main directional sun
    const sun = new THREE.DirectionalLight(atmo.sunCol, atmo.sunI);
    sun.position.set(D*0.75, D*0.90, D*0.45);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sd = D * 0.72;
    sun.shadow.camera.set?.(); // just in case
    sun.shadow.camera.left  = -sd; sun.shadow.camera.right = sd;
    sun.shadow.camera.top   =  sd; sun.shadow.camera.bottom= -sd;
    sun.shadow.camera.near  = 0.5; sun.shadow.camera.far   = D*5;
    sun.shadow.bias   = -0.0003;
    sun.shadow.radius = 4;
    scene.add(sun);

    // Soft fill from opposite side
    const fill = new THREE.DirectionalLight(atmo.sunCol, atmo.sunI * 0.25);
    fill.position.set(-D*0.6, D*0.5, -D*0.4);
    scene.add(fill);

    // Ambient
    scene.add(new THREE.AmbientLight(atmo.ambCol, atmo.ambI));

    // ─ Ground plane ───────────────────────────────────────────────────────────
    const gndTex = texSand(theme);
    gndTex.repeat.set(4, 4);
    const gnd = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_W+8, WORLD_D+8, 1, 1),
      new THREE.MeshStandardMaterial({
        map:gndTex, normalMap:texNormalFlat(),
        normalScale:new THREE.Vector2(0.8,0.8),
        roughness:0.95, metalness:0.0,
      })
    );
    gnd.rotation.x = -Math.PI/2;
    gnd.receiveShadow = true;
    gnd.userData.isGround = true;
    scene.add(gnd);

    // ─ Orbit controls ─────────────────────────────────────────────────────────
    let isDrag=false, lastM={x:0,y:0};
    const mouse = new THREE.Vector2();

    const onMD = e => {
      if(e.button===0) { isDrag=true; lastM={x:e.clientX,y:e.clientY}; }
    };
    const onMU = () => { isDrag=false; };
    const onMM = e => {
      const r=el.getBoundingClientRect();
      mouse.x = ((e.clientX-r.left)/r.width)*2-1;
      mouse.y = -((e.clientY-r.top)/r.height)*2+1;
      if(!isDrag) return;
      const dx=(e.clientX-lastM.x)*0.007, dy=(e.clientY-lastM.y)*0.007;
      sph.theta -= dx;
      sph.phi    = Math.max(0.15, Math.min(Math.PI/2.05, sph.phi+dy));
      lastM={x:e.clientX,y:e.clientY};
      cam.position.setFromSpherical(sph);
      cam.lookAt(0,0,0);
    };
    const onWh = e => {
      sph.radius = Math.max(3, Math.min(D*1.6, sph.radius+e.deltaY*0.018));
      cam.position.setFromSpherical(sph);
      cam.lookAt(0,0,0);
    };
    const onCl = () => {
      const rc=new THREE.Raycaster();
      rc.setFromCamera(mouse, cam);
      const hits=rc.intersectObjects(Object.values(S.current.meshMap||{}),false);
      if(hits.length && hits[0].object.userData.tile) {
        onTileClickRef.current?.(hits[0].object.userData.tile);
      }
    };
    const onRS = () => {
      cam.aspect=el.clientWidth/el.clientHeight;
      cam.updateProjectionMatrix();
      renderer.setSize(el.clientWidth,el.clientHeight);
    };

    el.addEventListener('mousedown', onMD);
    window.addEventListener('mouseup', onMU);
    el.addEventListener('mousemove', onMM);
    el.addEventListener('wheel', onWh, {passive:true});
    el.addEventListener('click', onCl);
    window.addEventListener('resize', onRS);

    // ─ Agent ──────────────────────────────────────────────────────────────────
    const agent = buildAgent3D(theme);
    agent.visible = false;
    scene.add(agent);

    // ─ Clock ──────────────────────────────────────────────────────────────────
    const clock = new THREE.Clock();

    // ─ Store state ────────────────────────────────────────────────────────────
    S.current = {
      renderer, scene, cam, sun, fill, hemi, agent, clock,
      meshMap:{}, vegMap:{}, fireMap:{}, extraLights:[],
      waterMats:[], agentTarget:{x:0,z:0}, mouse, agentMoved:false,
      animId: null,
      cleanup() {
        el.removeEventListener('mousedown',onMD);
        window.removeEventListener('mouseup',onMU);
        el.removeEventListener('mousemove',onMM);
        el.removeEventListener('wheel',onWh);
        el.removeEventListener('click',onCl);
        window.removeEventListener('resize',onRS);
      }
    };

    // ─ Render loop ────────────────────────────────────────────────────────────
    const animate = () => {
      S.current.animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const s = S.current;

      // Water animation
      s.waterMats.forEach(m => { if(m.uniforms) m.uniforms.time.value=t; });

      // Fire flicker + ember glow
      Object.values(s.fireMap).forEach(fg => {
        fg.children.forEach(child => {
          if(child.name?.startsWith('fl')){
            const k=parseInt(child.name.slice(2));
            child.scale.y=0.78+Math.sin(t*9+k*2.1)*0.26;
            child.scale.x=0.85+Math.sin(t*7+k*1.8)*0.18;
            child.rotation.y+=0.05;
            child.material.emissiveIntensity=1.8+Math.sin(t*14+k)*0.7;
          }
          if(child.name==='glow'){
            child.intensity=3.0+Math.sin(t*11)*1.0;
          }
        });
      });

      // Vegetation sway
      Object.values(s.vegMap).forEach(vg => {
        const ph=vg.userData.swayPhase||0;
        vg.rotation.z=Math.sin(t*0.65+ph)*0.024;
        vg.rotation.x=Math.cos(t*0.52+ph)*0.014;
      });

      // Agent walk animation
      const ag=s.agent;
      if(ag&&ag.visible){
        const {x:tx,z:tz}=s.agentTarget;
        const dx=tx-ag.position.x, dz=tz-ag.position.z;
        const dist=Math.sqrt(dx*dx+dz*dz);
        const moving=dist>0.05;
        if(moving){
          const spd=0.055;
          ag.position.x+=dx/dist*spd;
          ag.position.z+=dz/dist*spd;
          ag.rotation.y=Math.atan2(dx,dz);
          const walk=Math.sin(t*9)*0.25;
          ['leg0','leg1','arm0','arm1'].forEach((n,k)=>{
            const o=ag.getObjectByName(n);
            if(o) o.rotation.x=(k%2===0?1:-1)*walk*(k<2?1:0.55);
          });
        } else {
          // Idle breathing
          ag.scale.y=1.0+Math.sin(t*1.8)*0.010;
        }
        ag.position.y=moving?Math.abs(Math.sin(t*9))*0.010:0;
      }

      // Sun position drift across year
      if(s.sun && maxYears>0){
        const prog=(year||0)/maxYears;
        const ang=Math.PI*0.25+prog*Math.PI*0.55;
        s.sun.position.x=Math.cos(ang)*D*0.85;
        s.sun.position.z=Math.sin(ang)*D*0.35;
        // Warm dawn → bright noon → warm dusk
        const warmth=Math.abs(Math.sin(ang));
        s.sun.color.setRGB(1.0, 0.86+warmth*0.14, 0.65+warmth*0.33);
        s.sun.intensity=(atmo.sunI)*(0.80+warmth*0.35);
        // Hemi sky also shifts
        s.hemi.intensity=0.55+warmth*0.20;
      }

      renderer.render(scene,cam);
    };
    animate();

    return () => {
      cancelAnimationFrame(S.current?.animId);
      S.current?.cleanup?.();
      if(renderer.domElement.parentNode===el) el.removeChild(renderer.domElement);
      renderer.dispose();
      S.current = null;
    };
  }, [theme]);

  // ── SYNC TILES → 3D ────────────────────────────────────────────────────────
  useEffect(() => {
    const s = S.current;
    if(!s || !tiles) return;
    const {scene,meshMap,vegMap,fireMap,extraLights,waterMats}=s;

    // Dispose old
    Object.values(meshMap).forEach(m=>{
      scene.remove(m); m.geometry.dispose();
      if(m.material.dispose) m.material.dispose();
    });
    Object.values(vegMap).forEach(g=>scene.remove(g));
    Object.values(fireMap).forEach(g=>scene.remove(g));
    extraLights.forEach(l=>scene.remove(l));
    Object.keys(meshMap).forEach(k=>delete meshMap[k]);
    Object.keys(vegMap).forEach(k=>delete vegMap[k]);
    Object.keys(fireMap).forEach(k=>delete fireMap[k]);
    extraLights.length=0; waterMats.length=0;

    tiles.forEach(t => {
      const role = tileRole(t);
      const h    = TILE_HEIGHTS[role] || 0.06;
      const {x,z} = tw(t.i, t.j);
      const k    = `${t.i},${t.j}`;
      const seed = t.i * 7 + t.j * 13;

      // ── Tile mesh ──────────────────────────────────────────────────────────
      const mat = makeMaterial(role, theme);
      if(mat.uniforms) waterMats.push(mat);

      // Use plane + Y offset instead of box — no visible tile walls
      const geo  = new THREE.PlaneGeometry(TSIZE*0.990, TSIZE*0.990, 4, 4);
      geo.rotateX(-Math.PI/2);
      // Add subtle height displacement based on role
      const pos = geo.attributes.position;
      for(let vi=0;vi<pos.count;vi++){
        const vx=pos.getX(vi), vz=pos.getZ(vi);
        const bump = noise2(vx*2+t.i,vz*2+t.j,3)*0.012*(role==='water'?0:1);
        pos.setY(vi, h + bump);
      }
      pos.needsUpdate=true;
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0, z);
      mesh.receiveShadow = true;
      mesh.castShadow    = false;
      mesh.userData.tile = t;
      scene.add(mesh);
      meshMap[k] = mesh;

      const groundY = h;

      // ── Fire ──────────────────────────────────────────────────────────────
      if(t.burning || t.fire){
        const fg=buildFireGroup();
        fg.position.set(x, groundY, z);
        scene.add(fg); fireMap[k]=fg;
      }

      // ── Vegetation ────────────────────────────────────────────────────────
      if(role==='pioneer'){
        const vg=buildPioneerClump(theme,seed);
        vg.position.set(x,groundY,z);
        vg.userData.swayPhase=seed*0.8;
        scene.add(vg); vegMap[k]=vg;
      } else if(role==='shrub'){
        const vg=buildShrub(theme,seed);
        vg.position.set(x,groundY,z);
        vg.userData.swayPhase=seed*0.7;
        scene.add(vg); vegMap[k]=vg;
      } else if(role==='canopy'){
        const vg=buildTree(theme,t.deco||'canopy',seed);
        vg.position.set(x,groundY,z);
        vg.userData.swayPhase=seed*0.65;
        scene.add(vg); vegMap[k]=vg;
      }

      // ── Solar panel extra mesh ─────────────────────────────────────────────
      if(role==='energy'){
        const panelMat=new THREE.MeshStandardMaterial({
          color:0x304060,metalness:0.88,roughness:0.08,
          emissive:0x101830,emissiveIntensity:0.18
        });
        const panel=new THREE.Mesh(new THREE.BoxGeometry(TSIZE*0.58,0.022,TSIZE*0.42),panelMat);
        panel.position.set(x,groundY+0.16,z); panel.rotation.x=-0.22;
        panel.castShadow=true; scene.add(panel);
        extraLights.push(panel); // just to track for cleanup
      }

      // ── Rocks on obstacle tiles ────────────────────────────────────────────
      if(role==='obstacle'){
        for(let r=0;r<2+(seed%3);r++){
          const rk=new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.06+Math.random()*0.10,0),
            new THREE.MeshStandardMaterial({
              color:0x887868+(seed%30)*0x010101,
              roughness:0.90,normalMap:texNormalFlat(),
              normalScale:new THREE.Vector2(0.8,0.8)
            })
          );
          rk.position.set(x+(Math.random()-0.5)*0.35,groundY+(0.06+Math.random()*0.06),z+(Math.random()-0.5)*0.35);
          rk.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);
          rk.castShadow=true; rk.receiveShadow=true; scene.add(rk);
          extraLights.push(rk);
        }
      }
    });
  }, [tiles, theme]);

  // ── HOVER HIGHLIGHT (registered once, uses refs) ──────────────────────────
  useEffect(()=>{
    // Wait for scene to init
    const timer = setInterval(()=>{
      const s=S.current; if(!s) return;
      const el=mountRef.current; if(!el) return;
      clearInterval(timer);
      const rc=new THREE.Raycaster();
      let last=null;
      const onMM=()=>{
        rc.setFromCamera(s.mouse,s.cam);
        const hits=rc.intersectObjects(Object.values(s.meshMap),false);
        const tile=hits.length?hits[0].object.userData.tile:null;
        if(tile===last) return;
        if(last){
          const m=s.meshMap[`${last.i},${last.j}`];
          if(m?.material?.emissive) m.material.emissive.setHex(0x000000);
        }
        if(tile){
          const m=s.meshMap[`${tile.i},${tile.j}`];
          if(m?.material?.emissive){
            const canP=selectedActionRef.current&&canPlaceRef.current?.(tile);
            m.material.emissive.setHex(canP?0x00CC55:0x555500);
          }
          onTileHoverRef.current?.(tile);
        }
        last=tile;
      };
      el.addEventListener('mousemove',onMM);
      s.hoverCleanup=()=>el.removeEventListener('mousemove',onMM);
    },100);
    return ()=>{ clearInterval(timer); S.current?.hoverCleanup?.(); };
  },[]);

  // ── AGENT POSITION ──────────────────────────────────────────────────────────
  useEffect(()=>{
    const s=S.current; if(!s||!agentPos) return;
    const {x,z}=tw(agentPos.i,agentPos.j);
    s.agentTarget={x,z};
    s.agent.visible=true;
    if(!s.agentMoved){ s.agent.position.set(x,0,z); s.agentMoved=true; }
  },[agentPos]);

  return (
    <div ref={mountRef} style={{
      width:'100%', height:'100%',
      position:'relative', overflow:'hidden',
      cursor:'grab',
    }}>
      <div style={{
        position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)',
        fontFamily:'JetBrains Mono,monospace', fontSize:8,
        letterSpacing:'0.14em', color:'rgba(42,31,18,0.28)',
        pointerEvents:'none', userSelect:'none',
      }}>
        DRAG · ORBIT &nbsp;|&nbsp; SCROLL · ZOOM
      </div>
    </div>
  );
}

// Legacy export
export function isoPos(i,j){
  const TW=64,TH=32,C=COLS||9,R=ROWS||9;
  const ox=((C+R)*TW)/4-TW/2;
  return {cx:(i-j)*(TW/2)+ox,cy:(i+j)*(TH/2)+TH/2};
}