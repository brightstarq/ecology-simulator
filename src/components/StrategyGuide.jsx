// src/components/StrategyGuide.jsx — In-game level walkthrough modal.
// Free tier: build order + 3 tips. Premium tier: optimal combos, speed-run,
// common mistakes, real-world context. Premium content is blurred + locked.

import { useState } from 'react';
import { getGuide } from '../sim/guides.js';

export function StrategyGuide({ level, onClose }) {
  const guide = getGuide(level?.id);
  const [tab, setTab] = useState('build');

  if (!guide) return null;

  const isPremium = false; // flip to true when payment is set up

  return (
    <div className="sg-back" onClick={onClose}>
      <div className="sg-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sg-header">
          <div className="sg-header-left">
            <div className="sg-eyebrow">📖 STRATEGY GUIDE</div>
            <h2 className="sg-title">{guide.name}</h2>
            <div className="sg-meta">
              <span className="sg-badge">{guide.difficulty}</span>
              <span className="sg-sep">·</span>
              <span>⏱ {guide.timeToWin}</span>
            </div>
            <div className="sg-tagline">"{guide.tagline}"</div>
          </div>
          <button className="sg-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="sg-tabs">
          <button className={tab === 'build' ? 'on' : ''} onClick={() => setTab('build')}>
            Build Order
          </button>
          <button className={tab === 'tips' ? 'on' : ''} onClick={() => setTab('tips')}>
            Key Tips
          </button>
          <button className={tab === 'pro' ? 'on' : ''} onClick={() => setTab('pro')}>
            Pro Strategies {!isPremium && <span className="sg-lock">🔒</span>}
          </button>
        </div>

        {/* Build Order */}
        {tab === 'build' && (
          <div className="sg-content">
            <p className="sg-intro">Follow this sequence for a consistent win. Each step unlocks conditions for the next.</p>
            <div className="sg-steps">
              {guide.free.buildOrder.map((s, i) => (
                <div key={i} className="sg-step">
                  <div className="sg-step-num">{s.step}</div>
                  <div className="sg-step-icon">{s.icon}</div>
                  <div className="sg-step-body">
                    <div className="sg-step-action">{s.action}</div>
                    <div className="sg-step-tip">{s.tip}</div>
                  </div>
                  {i < guide.free.buildOrder.length - 1 && (
                    <div className="sg-step-arrow">↓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {tab === 'tips' && (
          <div className="sg-content">
            <p className="sg-intro">The three things most players get wrong — and how to avoid them.</p>
            <div className="sg-tips">
              {guide.free.tips.map((t, i) => (
                <div key={i} className="sg-tip-card">
                  <div className="sg-tip-icon">{t.icon}</div>
                  <div className="sg-tip-body">
                    <div className="sg-tip-title">{t.title}</div>
                    <div className="sg-tip-text">{t.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pro Strategies — locked */}
        {tab === 'pro' && (
          <div className="sg-content">
            {isPremium ? (
              <div className="sg-pro">
                <div className="sg-pro-section">
                  <div className="sg-pro-label">⚡ OPTIMAL COMBO</div>
                  <p>{guide.premium.optimalCombo}</p>
                </div>
                <div className="sg-pro-section">
                  <div className="sg-pro-label">🏃 SPEED-RUN ROUTE</div>
                  <p>{guide.premium.speedRun}</p>
                </div>
                <div className="sg-pro-section">
                  <div className="sg-pro-label">❌ COMMON MISTAKES</div>
                  <ul className="sg-mistakes">
                    {guide.premium.mistakes.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
                <div className="sg-pro-section">
                  <div className="sg-pro-label">🌍 REAL-WORLD PARALLEL</div>
                  <p className="sg-realworld">{guide.premium.realWorld}</p>
                </div>
              </div>
            ) : (
              <div className="sg-locked">
                {/* Blurred preview */}
                <div className="sg-locked-preview">
                  <div className="sg-pro-section">
                    <div className="sg-pro-label">⚡ OPTIMAL COMBO</div>
                    <p>{guide.premium.optimalCombo}</p>
                  </div>
                  <div className="sg-pro-section">
                    <div className="sg-pro-label">🏃 SPEED-RUN ROUTE</div>
                    <p>{guide.premium.speedRun}</p>
                  </div>
                </div>
                <div className="sg-locked-overlay">
                  <div className="sg-locked-box">
                    <div className="sg-locked-icon">🔒</div>
                    <div className="sg-locked-title">Verdant Pro</div>
                    <div className="sg-locked-desc">
                      Unlock optimal combos, speed-run routes, common mistakes and
                      real-world research notes for every level.
                    </div>
                    <button className="sg-locked-cta" disabled>
                      Coming soon · Verdant Pro
                    </button>
                    <div className="sg-locked-note">Free for educators and school accounts</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
