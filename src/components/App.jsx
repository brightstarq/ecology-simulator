import { useState, useEffect, useMemo, useRef } from 'react';
import { ALL_LEVELS, tilesWithModifier } from '../sim/levels.js';
import { LandingPage } from './landing.jsx';
import { ProfilePage } from './ProfilePage.jsx';
import { InGameMenu } from './InGameMenu.jsx';
import { StrategyGuide } from './StrategyGuide.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { AuthModal } from '../auth/AuthModal.jsx';
import { pullProgress, pushProgress, pullRewards, pushRewards, mergeProgress, mergeRewards } from '../lib/sync.js';

// Thin wrappers that write localStorage + push to Supabase if logged in
function syncSaveRewards(rewards, userId) {
  saveRewards(rewards);
  if (userId) pushRewards(userId, rewards);
}
function syncSaveProgress(progress, userId) {
  saveProgress(progress);
  if (userId) pushProgress(userId, progress);
}
import { loadProgress, markLevelComplete, saveProgress } from '../sim/progress.js';
import {
  loadRewards, saveRewards, recordDailyVisit, evaluateAchievements,
  xpForLevelCompletion, markLevelCompleteReward, getRank, addXP,
} from '../sim/rewards.js';
import { updateSoilHealth, spreadErosion, computeMicroclimate, computePollinators, computeDetailedStats, seasonLabel } from '../sim/engine.js';
import { TWEAK_DEFAULTS } from '../sim/sim.js';
import {
  makeWorldFromConfig, recomputeIrrigation, simulateYear,
  computeStats, passiveYield, canPlace, placementBlockReason,
} from '../sim/engine.js';
import { rollEvent, TRUST_DELTAS, getTrustLevel, applyFire, spreadFire, applyFlood, drainFlood } from '../sim/sim.js';
import { startWind, stopWind, startRain, stopRain, setWindIntensity,
         playPlacement, playEventAlert, playFire as playSoundFire, playYearStep,
         playWin, playLevelStart, playOpeningMusic, stopOpeningMusic,
         startAmbience, stopAmbience, playAchievement, playClick,
         setSoundEnabled } from '../sim/sound.js';
import { isoPos, IsoMap, IntelTicker } from './Map/IsoMap.jsx';
import {
  ToHUD as TopHUD, ActionPalette, StatsPanel, ImpactPanel, OverlayLegend,
  HoverTooltip, TimeBar, ToastStack, IntroOverlay, WinModal,
  EventModal, TrustMeter, LevelTransition, GameOverModal, AchievementsModal,
  EcoFactCard, EcoDexModal, KnowledgeCheckModal, LearnModeToggle, AuthGate,
  MobileGameBar,
} from './Panels/index.jsx';
import {
  pickEcoFact, newlyUnlockedConcepts, getQuiz, SCHOLAR_XP_PER_CORRECT,
} from '../sim/education.js';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect,
         TweakToggle, TweakButton } from './TweaksPanel/index.jsx';

function BackgroundDecor({ weather, theme }) {
  return (
    <div className="bg-decor" aria-hidden="true">
      <div className="sky" style={{
        background: theme==='coastal' ? 'linear-gradient(180deg,#7DC8E0,#B8D4C8)'
          : theme==='urban'   ? 'linear-gradient(180deg,#C8C0E0,#D8D0C8)'
          : theme==='forest'  ? 'linear-gradient(180deg,#90C060,#C8A878)'
          : theme==='planet'  ? 'linear-gradient(180deg,#4060A0,#C0B0A0)'
          : 'linear-gradient(180deg,var(--sky-grad-a),var(--sky-grad-b))',
      }}/>
    </div>
  );
}

// Convert level-specific resource names to universal {budget,primary,secondary,energy}
function makeDiffResources(level, difficulty) {
  const d = level.difficulty[difficulty] || level.difficulty.normal;
  return { budget: d.budget, primary: d.primary, secondary: d.secondary, energy: d.energy, years: d.years };
}

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const level = ALL_LEVELS[currentLevelIdx];

  // ── Game state ────────────────────────────────────────────────────────────
  const [introShown, setIntroShown]   = useState(true);
  const [tiles, setTiles]             = useState(()=>recomputeIrrigation(makeWorldFromConfig({ seed:11, damagedRate:0.40, obstacleRate:0.30, pioneerSeeds:[[1,1,'shrub'],[2,1,'pioneer'],[1,2,'pioneer']] })));
  const diff = t.difficulty || 'normal';
  const startRes = useMemo(()=>makeDiffResources(level,diff),[level,diff]);
  const [resources, setResources]     = useState(startRes);
  const [lastDelta, setLastDelta]     = useState({budget:0,primary:0,secondary:0,energy:0});
  const [year, setYear]               = useState(0);
  const [selected, setSelected]       = useState(null);
  const [hovered, setHovered]         = useState(null);
  const [playing, setPlaying]         = useState(false);
  const [speed, setSpeed]             = useState(1);
  const [log, setLog]                 = useState([{y:0,kind:'mission',text:`Welcome to ${level.name}. ${level.blurb}`}]);
  const [completed, setCompleted]     = useState(false);
  const [gameOver, setGameOver]       = useState(false);
  const [winShown, setWinShown]       = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [toasts, setToasts]           = useState([]);
  const [flyouts, setFlyouts]         = useState([]);
  const [history, setHistory]         = useState([]);
  const [agentPos, setAgentPos]       = useState({i:3,j:3});
  const [agentTarget, setAgentTarget] = useState({i:3,j:3});
  const [pendingEvent, setPendingEvent] = useState(null);
  const [trust, setTrust]             = useState(50);
  const [soundOn, setSoundOn]         = useState(true);
  const [sahelTip, setSahelTip]       = useState(null);
  const { user, signInWithGoogle } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingLevelId, setPendingLevelId] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [inGameMenuOpen, setInGameMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  // Pull from Supabase when user logs in, merge with localStorage
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [remoteProgress, remoteRewards] = await Promise.all([
        pullProgress(user.id),
        pullRewards(user.id),
      ]);
      if (remoteProgress) {
        const merged = mergeProgress(loadProgress(), remoteProgress);
        saveProgress(merged);
        setProgress(merged);
      }
      if (remoteRewards) {
        const merged = mergeRewards(loadRewards(), remoteRewards);
        saveRewards(merged);
        setRewards(merged);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (user && pendingLevelId) {
      const idx = ALL_LEVELS.findIndex(l => l.id === pendingLevelId);
      if (idx >= 0) hardReset(idx);
      setPendingLevelId(null);
      setShowLanding(false);
    }
  }, [user, pendingLevelId]);
  const [showLanding, setShowLanding]  = useState(true);
  const [drawerOpen, setDrawerOpen]    = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = e => { setIsMobile(e.matches); if (!e.matches) setDrawerOpen(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const [progress, setProgress]       = useState(() => loadProgress());
  const [rewards, setRewards]         = useState(() => {
    const withStreak = recordDailyVisit(loadRewards());
    syncSaveRewards(withStreak, user?.id);
    return withStreak;
  });
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  // ── Education / Learn Mode ─────────────────────────────────────────────────
  const [learnMode, setLearnMode] = useState(() => {
    try { return localStorage.getItem('verdant-learn-mode') === '1'; } catch { return false; }
  });
  const [ecoFact, setEcoFact]           = useState(null);
  const [ecoDexOpen, setEcoDexOpen]     = useState(false);
  const [quizOpen, setQuizOpen]         = useState(false);
  const [concepts, setConcepts]         = useState(() => {
    try { return JSON.parse(localStorage.getItem('verdant-concepts') || '[]'); } catch { return []; }
  });
  const seenFactsRef = useRef(new Set());
  const prevStatsRef = useRef(null);
  const prevObjRef = useRef({});
  const prevBioRef = useRef(0);

  // Auto-enable Learn Mode on the educational (schoolyard) level the first time.
  useEffect(() => {
    if (level?.educational && !learnMode) {
      const seen = localStorage.getItem('verdant-learn-autoprompt');
      if (!seen) { setLearnMode(true); localStorage.setItem('verdant-learn-autoprompt', '1'); }
    }
  }, [level?.id]);

  useEffect(() => {
    try { localStorage.setItem('verdant-learn-mode', learnMode ? '1' : '0'); } catch {}
  }, [learnMode]);

  function unlockConcepts(ctx) {
    const fresh = newlyUnlockedConcepts(ctx, new Set(concepts));
    if (fresh.length) {
      const ids = [...concepts, ...fresh.map(c => c.id)];
      setConcepts(ids);
      try { localStorage.setItem('verdant-concepts', JSON.stringify(ids)); } catch {}
      return fresh;
    }
    return [];
  }

  const stats = useMemo(()=>({...computeDetailedStats(tiles, year), trust}),[tiles, year, trust]);

  // Compute which actions are locked by prereqs — only for educational levels
  const lockedActions = useMemo(() => {
    if (!level.educational) return {};
    const locked = {};
    for (const a of (level.actions || [])) {
      if (!a.prereq) continue;
      const val = stats[a.prereq.stat];
      if (val === undefined || val < a.prereq.min) {
        locked[a.id] = a.prereq.label;
      }
    }
    return locked;
  }, [level, stats]);
  const objectives = useMemo(()=>level.objectives.map(o=>({
    ...o, done:o.check({...stats,modifiers:stats.modifiers}),
    p: Math.min(1, o.pct({...stats,modifiers:stats.modifiers})),
  })),[level,stats]);

  // ── Theme ─────────────────────────────────────────────────────────────────
  useEffect(()=>{ document.documentElement.dataset.theme = level.theme || t.theme; },[level,t.theme]);

  // ── Sound / weather ───────────────────────────────────────────────────────
  useEffect(()=>{
    if(!soundOn){ stopWind(); stopRain(); return; }
    startWind();
    if(t.weather==='storm'){ startRain(); setWindIntensity(0.9); }
    else if(t.weather==='cloudy'){ stopRain(); setWindIntensity(0.4); }
    else { stopRain(); setWindIntensity(0.15); }
  },[t.weather, soundOn]);

  // ── Sahel guide tip rotation ──────────────────────────────────────────────
  useEffect(()=>{
    const tips = level.narration
      ? [0,4,8,14,18].map(y=>level.narration(y,false,stats,{}))
      : ['"Start here."'];
    let idx=0; setSahelTip(tips[0]);
    const id=setInterval(()=>{ idx=(idx+1)%tips.length; setSahelTip(tips[idx]); },9000);
    return()=>clearInterval(id);
  },[level]);

  // ── Achievement toasts ────────────────────────────────────────────────────
  useEffect(()=>{
    const newToasts=[];
    for(const o of objectives){
      if(o.done&&!prevObjRef.current[o.id]){
        newToasts.push({id:`obj-${o.id}-${Date.now()}`,kind:'achievement',title:'Objective complete',body:o.label});
      }
      prevObjRef.current[o.id]=o.done;
    }
    // Wildlife species unlock toasts
    for(const sp of level.wildlife||[]){
      if(stats.bio>=sp.bioMin&&prevBioRef.current<sp.bioMin){
        newToasts.push({id:`wild-${sp.id}-${Date.now()}`,kind:'species',title:`${sp.label} spotted`,body:`Biodiversity passed ${Math.round(sp.bioMin*100)}%.`});
        setLog(L=>[...L,{y:year,kind:'wildlife',text:`${sp.label} returned to the site.`}]);
      }
    }
    prevBioRef.current=stats.bio;

    // Reward-system achievements (badges + XP), independent of level objectives
    const { rewards: updatedRewards, newlyUnlocked } = evaluateAchievements(
      { stats, trust, year, level, isLevelComplete: false }, rewards
    );
    if (newlyUnlocked.length) {
      for (const ach of newlyUnlocked) {
        newToasts.push({
          id:`ach-${ach.id}-${Date.now()}`, kind:'achievement',
          title:`★ ${ach.title}`, body:`${ach.desc} (+${ach.xp} XP)`,
        });
      }
      if (soundOn) playAchievement();
      setRewards(updatedRewards);
      syncSaveRewards(updatedRewards, user?.id);
    }

    if(newToasts.length) setToasts(T=>[...T,...newToasts]);

    // ── Education layer: contextual facts + concept unlocks ──────────────────
    const eduCtx = { stats, prev: prevStatsRef.current, trust, year, level };
    const freshConcepts = unlockConcepts(eduCtx);
    if (freshConcepts.length) {
      setToasts(T=>[...T, ...freshConcepts.map(c=>({
        id:`concept-${c.id}-${Date.now()}`, kind:'achievement',
        title:`📖 New idea: ${c.term}`, body:c.kid,
      }))]);
    }
    if (learnMode && !ecoFact) {
      const fact = pickEcoFact(eduCtx, seenFactsRef.current);
      if (fact) { seenFactsRef.current.add(fact.id); setEcoFact(fact); }
    }
    prevStatsRef.current = stats;
  },[stats,year]);

  // ── Win condition ─────────────────────────────────────────────────────────
  useEffect(()=>{
    if(completed||gameOver) return;
    if(objectives.every(o=>o.done)){
      setCompleted(true); setWinShown(true); setPlaying(false);
      setShowTransition(true); playWin();
      setLog(L=>[...L,{y:year,kind:'win',text:'All objectives met!'}]);

      // ── Persist progress + award XP/achievements for this completion ─────
      const nextLevel = ALL_LEVELS[currentLevelIdx+1] || null;
      markLevelComplete(level.id, nextLevel?.id, stats, year, trust);
      setProgress(loadProgress());

      const gainedXp = xpForLevelCompletion(stats, trust);
      let updated = addXP(rewards, gainedXp);
      updated = markLevelCompleteReward(updated);
      const { rewards: withAchievements, newlyUnlocked } = evaluateAchievements(
        { stats, trust, year, level, isLevelComplete: true }, updated
      );
      setRewards(withAchievements);
      syncSaveRewards(withAchievements, user?.id);
      // Also sync progress after level completion
      const p = loadProgress();
      syncSaveProgress(p, user?.id);

      const winToasts = [{
        id:`xp-level-${Date.now()}`, kind:'achievement',
        title:'Mission complete', body:`+${gainedXp} XP for restoring ${level.name}`,
      }];
      for (const ach of newlyUnlocked) {
        winToasts.push({
          id:`ach-${ach.id}-${Date.now()}`, kind:'achievement',
          title:`★ ${ach.title}`, body:`${ach.desc} (+${ach.xp} XP)`,
        });
      }
      setToasts(T=>[...T,...winToasts]);

      // Learn Mode: offer a friendly knowledge check if this level has one.
      if (learnMode && getQuiz(level.id)) {
        setTimeout(() => setQuizOpen(true), 900);
      }
    }
  },[objectives,completed,gameOver,year]);

  function goToNextLevel() {
    const nextIdx = currentLevelIdx+1;
    if (nextIdx >= ALL_LEVELS.length) return;
    const nextLevel = ALL_LEVELS[nextIdx];
    if (!progress.unlockedLevels.includes(nextLevel.id)) return;
    setWinShown(false);
    hardReset(nextIdx);
  }

  // ── Auto-step ─────────────────────────────────────────────────────────────
  useEffect(()=>{
    if(!playing||pendingEvent) return;
    const ms=1500/speed;
    const id=setTimeout(()=>step(),ms);
    return()=>clearTimeout(id);
  },[playing,speed,year,tiles,pendingEvent]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  // Stamp level vocab deco onto tiles so IsoMap can read t.deco directly
  function stampDeco(tiles, lvl) {
    const vocab = lvl?.vocab || {};
    return tiles.map(t => {
      const role = t.role || t.type || 'soil';
      const deco = vocab[role]?.deco || role;
      return t.deco === deco ? t : { ...t, deco };
    });
  }

  function hardReset(nextLevelIdx=currentLevelIdx) {
    const lvl = ALL_LEVELS[nextLevelIdx];
    const cfg = lvl.worldConfig || { seed:11, damagedRate:0.40, obstacleRate:0.30,
      pioneerSeeds:[[1,1,'shrub'],[2,1,'pioneer'],[1,2,'pioneer']] };
    setCurrentLevelIdx(nextLevelIdx);
    setTiles(stampDeco(recomputeIrrigation(makeWorldFromConfig(cfg)), lvl));
    setResources(makeDiffResources(lvl,diff));
    setLastDelta({budget:0,primary:0,secondary:0,energy:0});
    setYear(0); setPlaying(false); setCompleted(false);
    setGameOver(false); setWinShown(false); setShowTransition(false);
    setHistory([]); setAgentPos({i:3,j:3}); setAgentTarget({i:3,j:3});
    setPendingEvent(null); setTrust(50);
    prevObjRef.current={}; prevBioRef.current=0;
    prevStatsRef.current=null; seenFactsRef.current=new Set();
    setEcoFact(null); setQuizOpen(false);
    setSelected(lvl.actions?.[0]?.id||null);
    setLog([{y:0,kind:'mission',text:`Welcome to ${lvl.name}. ${lvl.blurb}`}]);
  }

  function canAffordAction(action) {
    if(!action) return false;
    const c=action.cost||{};
    return resources.budget>=(c.budget||0)
        && resources.primary>=(c.primary||0)
        && resources.secondary>=(c.secondary||0)
        && resources.energy>=(c.energy||0);
  }

  function canPlaceTile(action, tile) {
    if(!action) return false;
    return canPlace(level, action, tile);
  }

  function applyResourceChange(delta) {
    setResources(r=>({
      budget:    r.budget   +(delta.budget   ||0),
      primary:   r.primary  +(delta.primary  ||0),
      secondary: r.secondary+(delta.secondary||0),
      energy:    r.energy   +(delta.energy   ||0),
    }));
    setLastDelta(delta);
    setTimeout(()=>setLastDelta({budget:0,primary:0,secondary:0,energy:0}),1200);
  }

  function spawnFlyout(tile,text,color) {
    const {cx,cy}=isoPos(tile.i,tile.j);
    setFlyouts(F=>[...F,{id:`f-${performance.now()}-${Math.random()}`,x:cx,y:cy,text,color,startTime:performance.now()}]);
  }

  function applyAction(action,tile) {
    if(action.targetRole==='remove') {
      const roles=['pioneer','shrub','canopy','water','energy'];
      if(!roles.includes(tile.role)) return;
      const orig=level.actions.find(a=>a.targetRole===tile.role);
      if(orig){
        const refund={budget:Math.round((orig.cost.budget||0)*0.5),primary:0,secondary:0,energy:0};
        applyResourceChange(refund);
        if(refund.budget) spawnFlyout(tile,`+$${refund.budget}`,'var(--good)');
      }
      setTiles(TS=>recomputeIrrigation(TS.map(x=>x.i===tile.i&&x.j===tile.j?{...x,role:'soil',age:0,modifier:false}:x)));
      setTrust(tr=>Math.max(0,tr+(TRUST_DELTAS.remove||0)));
      setLog(L=>[...L,{y:year,kind:'info',text:`Cleared ${tile.role} at [${tile.i},${tile.j}].`}]);
      return;
    }
    if(!canPlaceTile(action,tile)||!canAffordAction(action)) return;
    const c=action.cost||{};
    applyResourceChange({budget:-(c.budget||0),primary:-(c.primary||0),secondary:-(c.secondary||0),energy:-(c.energy||0)});
    const costStr=[c.budget&&`-$${c.budget}`,c.primary&&`-${c.primary}`,c.secondary&&`-${c.secondary}`].filter(Boolean).join(' ');
    if(costStr) spawnFlyout(tile,costStr,'var(--bad)');

    if(action.targetRole==='modifier'){
      setTiles(TS=>stampDeco(TS.map(x=>x.i===tile.i&&x.j===tile.j?{...x,role:'modifier',modifier:true,placedAt:performance.now()}:x), level));
    } else {
      setTiles(TS=>stampDeco(recomputeIrrigation(TS.map(x=>x.i===tile.i&&x.j===tile.j?{...x,role:action.targetRole,age:0,placedAt:performance.now()}:x)), level));
    }
    const trustKey=action.id;
    const delta=TRUST_DELTAS[trustKey]||TRUST_DELTAS[action.kind]||0;
    if(delta) setTrust(tr=>Math.min(100,Math.max(0,tr+delta)));
    playPlacement(action.kind);
    setLog(L=>[...L,{y:year,kind:action.kind,text:`${action.kind==='plant'?'Planted':'Built'} ${action.name.toLowerCase()} at [${tile.i},${tile.j}].`}]);
  }

  function handleTileClick(tile) {
    const action=level.actions?.find(a=>a.id===selected)||{targetRole:'remove'};
    const dist=Math.abs(tile.i-agentPos.i)+Math.abs(tile.j-agentPos.j);
    if(dist>2){
      setAgentTarget({i:tile.i,j:tile.j});
      setTimeout(()=>setAgentPos({i:tile.i,j:tile.j}),430);
      return;
    }
    applyAction(action,tile);
  }

  function step() {
    const maxYears=makeDiffResources(level,diff).years;
    if(year>=maxYears){
      setPlaying(false);
      if(!completed){ setGameOver(true); }
      return;
    }
    // Simulate — pass the level's simulateTwist if it has one
    setTiles(prev=>{
      let next=simulateYear(prev,level);
      next=updateSoilHealth(next);
      next=spreadErosion(next, t.weather);
      next=computeMicroclimate(next);
      next=computePollinators(next);
      next=next.map(t=>t.flooded?{...t,flooded:false}:t);
      return stampDeco(next, level);
    });
    setYear(y=>y+1);
    playYearStep();

    // Passive yield using engine
    const yieldR=passiveYield(tiles);
    applyResourceChange({
      budget: 6+yieldR.budget,
      primary: 2+yieldR.primary,
      secondary: 1+yieldR.secondary,
      energy: yieldR.energy,
    });

    const s=computeStats(tiles);
    setHistory(H=>[...H,{year:year+1,vegPct:s.vegPct,hydPct:s.hydPct,bio:s.bio,carbon:s.carbon}]);

    // Roll event
    const evt=rollEvent(year+1,tiles,s,level);
    if(evt){ setPendingEvent(evt); playEventAlert(); }
  }

  function handleEventChoice(choice) {
    const result=choice.apply(tiles,resources);
    let newTiles=result.tiles;
    if(result.fire){ const[fi,fj]=result.fire; newTiles=applyFire(newTiles,fi,fj); playSoundFire(); }
    if(result.flood){ const[fi,fj]=result.flood; newTiles=applyFlood(newTiles,fi,fj); }
    setTiles(recomputeIrrigation(newTiles));
    setResources(result.resources);
    if(choice.trustDelta) setTrust(tr=>Math.min(100,Math.max(0,tr+(choice.trustDelta||0))));
    setLog(L=>[...L,{y:year,kind:'mission',text:result.log}]);
    setPendingEvent(null); setPlaying(false);
  }

  const season = stats.seasonLabel || '';
  const narration=useMemo(()=>
    level.narration?.(year,completed,stats,makeDiffResources(level,diff))
    || '"Keep building."'
  ,[level,year,completed,stats,diff]);

  const selectedAction=level.actions?.find(a=>a.id===selected)||{id:'remove',name:'Inspect/clear',targetRole:'remove'};
  const trustLevel=getTrustLevel(trust);
  const maxYears=makeDiffResources(level,diff).years;

  if (showLanding) return (
    <>
      <LandingPage
        progress={progress}
        onPlay={(levelId) => {
          if (!user) { setPendingLevelId(levelId); setAuthModalOpen(true); return; }
          const idx = ALL_LEVELS.findIndex(l=>l.id===levelId);
          if (idx >= 0) hardReset(idx);
          setShowLanding(false);
        }}
        onSelectLevel={(levelId) => {
          if (!user) { setPendingLevelId(levelId); setAuthModalOpen(true); return; }
          const idx = ALL_LEVELS.findIndex(l=>l.id===levelId);
          if (idx >= 0) hardReset(idx);
          setShowLanding(false);
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            if (pendingLevelId) {
              const idx = ALL_LEVELS.findIndex(l=>l.id===pendingLevelId);
              if (idx >= 0) hardReset(idx);
              setPendingLevelId(null);
              setShowLanding(false);
            }
          }}
        />
      )}
      {profileOpen && user && (
        <ProfilePage rewards={rewards} progress={progress} onClose={() => setProfileOpen(false)} />
      )}
    </>
  );

  return (
    <div className="shell">
      <BackgroundDecor weather={t.weather} theme={level.theme}/>

      <header className="shell-header">
        <TopHUD
          year={year} maxYears={maxYears}
          resources={resources} lastDelta={lastDelta} stats={stats}
          level={level} onMenu={()=>{ setPlaying(false); setInGameMenuOpen(true); }}
          rewards={rewards} onOpenAchievements={()=>setAchievementsOpen(true)}
          onOpenProfile={()=>setProfileOpen(true)} user={user}
        />
        <div className="trust-meter-row">
          <TrustMeter trust={trust} level={trustLevel}/>
        </div>
      </header>

      <div className="body">
        {/* Desktop: action palette in left rail */}
        {!isMobile && (
          <div className={`action-palette-wrapper${drawerOpen ? ' expanded' : ''}`}>
            <ActionPalette
              actions={level.actions||[]}
              selected={selected} onSelect={(id) => {
                if (lockedActions[id]) {
                  setToasts(T=>[...T,{ id:`lock-${id}-${Date.now()}`, kind:'warn', title:'🔒 Not yet!', body: lockedActions[id] }]);
                  return;
                }
                setSelected(id);
              }}
              resources={resources}
              level={level}
              lockedActions={lockedActions}
              tip={level.narration?.(0,false,stats,makeDiffResources(level,diff))}
            />
          </div>
        )}

        <div className="map-stage">
          <div className="map-stage-inner">
            <IsoMap
              tiles={tiles}
              overlay={t.overlay}
              showGrid={t.showGrid}
              showWildlife={t.showWildlife}
              weather={t.weather}
              hovered={hovered}
              selectedAction={selectedAction}
              onHover={setHovered}
              onClick={handleTileClick}
              canPlace={(tile)=>canPlaceTile(selectedAction,tile)}
              canAfford={()=>canAffordAction(selectedAction)}
              flyouts={flyouts}
              onFlyoutDone={(id)=>setFlyouts(F=>F.filter(f=>f.id!==id))}
              agentPos={agentPos}
              agentTarget={agentTarget}
              sahelTip={sahelTip}
              level={level}
            />
          </div>
          <OverlayLegend overlay={t.overlay}/>
          <HoverTooltip
            tile={hovered?tiles.find(x=>x.i===hovered.i&&x.j===hovered.j):null}
            action={selectedAction}
            level={level}
            reason={hovered&&placementBlockReason(level,selectedAction,tiles.find(x=>x.i===hovered.i&&x.j===hovered.j)||{})}
          />
          <IntelTicker level={level}/>
        </div>

        {!isMobile && (
          <StatsPanel
            stats={stats} year={year} log={log}
            objectives={objectives} history={history}
            showImpact={t.showImpact} level={level}
          />
        )}
      </div>

      {/* Desktop time bar */}
      {!isMobile && (
        <TimeBar
          year={year} maxYears={maxYears} playing={playing} speed={speed}
          completed={completed} narration={narration}
          onPlay={()=>setPlaying(p=>!p)} onStep={step}
          onSpeed={setSpeed} onReset={()=>hardReset()}
          guide={level.guide}
          learnMode={learnMode} onToggleLearn={()=>setLearnMode(m=>!m)}
          onOpenEcoDex={()=>setEcoDexOpen(true)} conceptCount={concepts.length}
          onOpenGuide={()=>setGuideOpen(true)}
        />
      )}

      {/* Mobile tabbed game bar */}
      {isMobile && (
        <MobileGameBar
          year={year} maxYears={maxYears} playing={playing} speed={speed}
          onPlay={()=>setPlaying(p=>!p)} onStep={step}
          onSpeed={setSpeed} onReset={()=>hardReset()}
          narration={narration} guide={level.guide}
          learnMode={learnMode} onToggleLearn={()=>setLearnMode(m=>!m)}
          onOpenEcoDex={()=>setEcoDexOpen(true)} conceptCount={concepts.length}
          onOpenGuide={()=>setGuideOpen(true)}
          actions={level.actions||[]}
          selected={selected}
          onSelect={(id) => {
            if (lockedActions[id]) {
              setToasts(T=>[...T,{ id:`lock-${id}-${Date.now()}`, kind:'warn', title:'🔒 Not yet!', body: lockedActions[id] }]);
              return;
            }
            setSelected(id);
          }}
          resources={resources}
          level={level}
          lockedActions={lockedActions}
          stats={stats}
          objectives={objectives}
          history={history}
          log={log}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={(id)=>setToasts(T=>T.filter(x=>x.id!==id))}/>

      {introShown&&<IntroOverlay level={level} onBegin={()=>{
        setIntroShown(false);
        if(soundOn){ playLevelStart(); startAmbience(level.theme); }
      }}/>}
      {winShown&&!showTransition&&
        <WinModal year={year} stats={stats} level={level} rewards={rewards}
          hasNext={!!ALL_LEVELS[currentLevelIdx+1] && progress.unlockedLevels.includes(ALL_LEVELS[currentLevelIdx+1].id)}
          nextLevelName={ALL_LEVELS[currentLevelIdx+1]?.name}
          onContinue={()=>setWinShown(false)} onReset={()=>hardReset()} onNext={goToNextLevel}/>}
      {achievementsOpen &&
        <AchievementsModal rewards={rewards} onClose={()=>setAchievementsOpen(false)}/>}

      {ecoFact && <EcoFactCard fact={ecoFact} onClose={()=>setEcoFact(null)}/>}
      {ecoDexOpen && <EcoDexModal unlockedIds={concepts} onClose={()=>setEcoDexOpen(false)}/>}
      {quizOpen &&
        <KnowledgeCheckModal levelId={level.id}
          onSkip={()=>setQuizOpen(false)}
          onComplete={(correct)=>{
            setQuizOpen(false);
            if (correct > 0) {
              const bonus = correct * SCHOLAR_XP_PER_CORRECT;
              const updated = addXP(rewards, bonus);
              setRewards(updated); syncSaveRewards(updated, user?.id);
              setToasts(T=>[...T,{
                id:`quiz-${Date.now()}`, kind:'achievement',
                title:'🧠 Scholar bonus', body:`${correct} correct · +${bonus} XP`,
              }]);
            }
          }}/>}
      {showTransition&&(
        <LevelTransition
          level={level} stats={stats} year={year} trust={trust}
          allLevels={ALL_LEVELS}
          onContinue={(choice)=>{
            setShowTransition(false);
            if(choice==='replay') hardReset();
            else {
              const idx=ALL_LEVELS.findIndex(l=>l.id===choice);
              if(idx>=0) hardReset(idx);
              else setShowTransition(false);
            }
          }}
        />
      )}
      {gameOver&&<GameOverModal year={year} stats={stats} objectives={objectives}
        level={level} onReplay={()=>hardReset()} onMenu={()=>setIntroShown(true)}/>}
      {pendingEvent&&<EventModal event={pendingEvent} onChoice={handleEventChoice}/>}

      {inGameMenuOpen && (
        <InGameMenu
          currentLevelId={level.id}
          progress={progress}
          rewards={rewards}
          onResume={() => setInGameMenuOpen(false)}
          onSelectLevel={(levelId) => {
            const idx = ALL_LEVELS.findIndex(l => l.id === levelId);
            if (idx >= 0) hardReset(idx);
            setInGameMenuOpen(false);
          }}
          onOpenProfile={() => { setInGameMenuOpen(false); setProfileOpen(true); }}
          onGoHome={() => { setInGameMenuOpen(false); setShowLanding(true); }}
        />
      )}
      {profileOpen && user && (
        <ProfilePage rewards={rewards} progress={progress} onClose={() => setProfileOpen(false)} />
      )}
      {guideOpen && (
        <StrategyGuide level={level} onClose={() => setGuideOpen(false)} />
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Visual"/>
        <TweakRadio label="Overlay" value={t.overlay}
          options={['none','hydration','heat','biodiversity']} onChange={v=>setTweak('overlay',v)}/>
        <TweakRadio label="Weather" value={t.weather}
          options={['clear','cloudy','storm']} onChange={v=>setTweak('weather',v)}/>
        <TweakToggle label="Grid lines"   value={t.showGrid}    onChange={v=>setTweak('showGrid',v)}/>
        <TweakToggle label="Wildlife"     value={t.showWildlife} onChange={v=>setTweak('showWildlife',v)}/>
        <TweakToggle label="Impact panel" value={t.showImpact}  onChange={v=>setTweak('showImpact',v)}/>
        <TweakSection label="Gameplay"/>
        <TweakRadio label="Difficulty" value={t.difficulty}
          options={['easy','normal','hard']} onChange={v=>setTweak('difficulty',v)}/>
        <TweakSection label="Audio"/>
        <TweakToggle label="Sound" value={soundOn} onChange={v=>{setSoundOn(v);setSoundEnabled(v);}}/>
        <TweakSection label="Levels"/>
        {ALL_LEVELS.map((lvl,i)=>(
          <TweakButton key={lvl.id} label={`${lvl.number}. ${lvl.name}`}
            onClick={()=>hardReset(i)} secondary={currentLevelIdx!==i}/>
        ))}
        <TweakButton label="Replay current" onClick={()=>hardReset()} secondary/>
        <TweakButton label="↩ Main menu" onClick={()=>setInGameMenuOpen(true)} secondary/>
      </TweaksPanel>
    </div>
  );
}