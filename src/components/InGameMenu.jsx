// src/components/InGameMenu.jsx — In-game pause menu with level select.
// Replaces the old "go back to landing page" behaviour. Players can switch
// levels, open their profile, or resume — without leaving the game context.

import { useState } from 'react';
import { ALL_LEVELS } from '../sim/levels.js';
import { useAuth } from '../auth/AuthContext.jsx';

const THEME_COLORS = {
  forest:  { bg: 'linear-gradient(135deg,#1a3520,#2d5a3d)', accent: '#6fbf73' },
  sunset:  { bg: 'linear-gradient(135deg,#3d2010,#8b4513)', accent: '#f4a460' },
  coastal: { bg: 'linear-gradient(135deg,#0d2b3e,#1a5276)', accent: '#5dade2' },
  urban:   { bg: 'linear-gradient(135deg,#1a1a2e,#2d3561)', accent: '#a29bfe' },
  planet:  { bg: 'linear-gradient(135deg,#0d0d1a,#1a0a2e)', accent: '#c39bd3' },
};

const LEVEL_IMAGES = {
  schoolyard: '/screen-forest.png',
  desert:     '/screen-desert.png',
  coastal:    '/screen-coastal.png',
  urban:      '/screen-urban.png',
  forest:     '/screen-forest.png',
  planet:     '/screen-planet.png',
};

const LEVEL_EMOJIS = {
  schoolyard: '🌸',
  desert:     '🌵',
  coastal:    '🌊',
  urban:      '🏙️',
  forest:     '🌳',
  planet:     '🪐',
};

export function InGameMenu({
  currentLevelId,
  progress,
  rewards,
  onResume,
  onSelectLevel,
  onOpenProfile,
  onGoHome,
}) {
  const { user } = useAuth();
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="igm-back" onClick={onResume}>
      <div className="igm-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="igm-header">
          <div className="igm-header-left">
            <div className="igm-logo">🌿 Verdant</div>
            <div className="igm-paused">PAUSED</div>
          </div>
          <div className="igm-header-right">
            {user && (
              <button className="igm-profile-btn" onClick={onOpenProfile}>
                {user.user_metadata?.avatar_url
                  ? <img src={user.user_metadata.avatar_url} alt="" className="igm-avatar"/>
                  : <span className="igm-avatar igm-avatar-fallback">
                      {(user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase()}
                    </span>}
                <span>{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
              </button>
            )}
            <button className="igm-resume-btn" onClick={onResume}>
              ▶ Resume
            </button>
          </div>
        </div>

        {/* Level grid */}
        <div className="igm-section-label">SELECT MISSION</div>
        <div className="igm-levels">
          {ALL_LEVELS.map(lvl => {
            const isCurrent  = lvl.id === currentLevelId;
            const isUnlocked = progress.unlockedLevels?.includes(lvl.id);
            const best       = progress.completedLevels?.[lvl.id];
            const colors     = THEME_COLORS[lvl.theme] || THEME_COLORS.forest;

            return (
              <button
                key={lvl.id}
                className={`igm-level-card ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}`}
                onClick={() => isUnlocked && onSelectLevel(lvl.id)}
                onMouseEnter={() => setHoveredId(lvl.id)}
                onMouseLeave={() => setHoveredId(null)}
                disabled={!isUnlocked}
              >
                {/* Background image */}
                <div className="igm-card-img">
                  <img src={LEVEL_IMAGES[lvl.id]} alt={lvl.name}/>
                  <div className="igm-card-gradient" style={{background: colors.bg.replace('135deg', '180deg')}}/>
                </div>

                {/* Lock overlay */}
                {!isUnlocked && (
                  <div className="igm-card-lock">🔒</div>
                )}

                {/* Content */}
                <div className="igm-card-body">
                  <div className="igm-card-top">
                    <span className="igm-card-num">
                      LVL {String(lvl.number).padStart(2,'0')}
                    </span>
                    {isCurrent && <span className="igm-card-playing">▶ PLAYING</span>}
                    {best && !isCurrent && <span className="igm-card-done">✓ DONE</span>}
                  </div>
                  <div className="igm-card-emoji">{LEVEL_EMOJIS[lvl.id]}</div>
                  <div className="igm-card-name">{lvl.name}</div>
                  <div className="igm-card-loc">{lvl.location?.split('·')[0]?.trim()}</div>
                  {best && (
                    <div className="igm-card-score">
                      {Math.round(best.vegPct * 100)}% veg · {best.score}pts
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="igm-footer">
          <button className="igm-footer-btn" onClick={onGoHome}>
            ← Back to homepage
          </button>
          <button className="igm-resume-btn-lg" onClick={onResume}>
            ▶ Resume current mission
          </button>
        </div>

      </div>
    </div>
  );
}
