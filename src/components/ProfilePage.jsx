// src/components/ProfilePage.jsx — Full profile, stats, achievements, leaderboard.

import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { getRank, ACHIEVEMENTS, RANKS } from '../sim/rewards.js';
import { getProfile, updateProfile, getLeaderboard } from '../lib/sync.js';
import { ALL_LEVELS } from '../sim/levels.js';

export function ProfilePage({ rewards, progress, onClose }) {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbLoading, setLbLoading] = useState(false);

  const rank = getRank(rewards.xp);
  const unlockedCount = Object.keys(rewards.unlocked || {}).length;
  const completedCount = Object.keys(progress.completedLevels || {}).length;

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then(p => {
      if (p) { setProfile(p); setUsername(p.username || ''); }
      else setUsername(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
    });
  }, [user?.id]);

  useEffect(() => {
    if (tab !== 'leaderboard') return;
    setLbLoading(true);
    getLeaderboard().then(data => { setLeaderboard(data); setLbLoading(false); });
  }, [tab]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true); setSaveMsg('');
    const { error } = await updateProfile(user.id, { username, avatar_url: profile?.avatar_url });
    setSaving(false);
    setSaveMsg(error ? `Error: ${error}` : 'Saved!');
    setTimeout(() => setSaveMsg(''), 2500);
  }

  async function handleSignOut() {
    await signOut();
    onClose();
  }

  const displayName = username || user?.email?.split('@')[0] || 'Player';

  return (
    <div className="profile-page">
      <div className="profile-page-inner">

        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar-lg">
            {user?.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} alt="" />
              : <span>{displayName[0]?.toUpperCase()}</span>}
          </div>
          <div className="profile-header-info">
            <div className="profile-display-name">{displayName}</div>
            <div className="profile-rank-badge">{rank.title}</div>
            <div className="profile-xp">{rewards.xp.toLocaleString()} XP</div>
          </div>
          <div className="profile-header-actions">
            <button className="btn-ghost profile-close-btn" onClick={onClose}>← Back</button>
            <button className="btn-ghost profile-signout-btn" onClick={handleSignOut}>Sign out</button>
          </div>
        </div>

        {/* XP bar */}
        <div className="profile-xp-section">
          <div className="profile-xp-row">
            <span className="profile-xp-rank">{rank.title}</span>
            {!rank.maxed && <span className="profile-xp-next">{rank.xpForNextRank} XP to {rank.nextTitle}</span>}
          </div>
          <div className="profile-xp-bar">
            <div className="profile-xp-fill" style={{ width: `${Math.round(rank.progressPct * 100)}%` }} />
          </div>
        </div>

        {/* Quick stats */}
        <div className="profile-stats-row">
          <div className="profile-stat-card">
            <div className="profile-stat-val">{rewards.xp.toLocaleString()}</div>
            <div className="profile-stat-lbl">Total XP</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-val">{completedCount}/{ALL_LEVELS.length}</div>
            <div className="profile-stat-lbl">Levels done</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-val">{unlockedCount}/{ACHIEVEMENTS.length}</div>
            <div className="profile-stat-lbl">Badges</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-val">{rewards.streak?.best || 0}</div>
            <div className="profile-stat-lbl">Best streak</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {['profile','levels','badges','leaderboard'].map(t => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="profile-tab-content">

          {tab === 'profile' && (
            <div className="profile-edit">
              <div className="auth-field">
                <label>Display name</label>
                <input type="text" value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Your display name" maxLength={32} />
              </div>
              <div className="auth-field" style={{ opacity: 0.6 }}>
                <label>Email</label>
                <input type="email" value={user?.email || ''} disabled />
              </div>
              <button className="btn-primary profile-save-btn" onClick={saveProfile} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              {saveMsg && <div className={`auth-${saveMsg.startsWith('Error') ? 'error' : 'info'}`}>{saveMsg}</div>}

              <div className="profile-danger">
                <div className="profile-danger-title">Account</div>
                <button className="btn-ghost profile-signout-full" onClick={handleSignOut}>
                  Sign out of Verdant
                </button>
              </div>
            </div>
          )}

          {tab === 'levels' && (
            <div className="profile-levels">
              {ALL_LEVELS.map(lvl => {
                const best = progress.completedLevels?.[lvl.id];
                const unlocked = progress.unlockedLevels?.includes(lvl.id);
                return (
                  <div key={lvl.id} className={`profile-level-card ${best ? 'done' : unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="profile-level-icon">{best ? '✅' : unlocked ? '🔓' : '🔒'}</div>
                    <div className="profile-level-body">
                      <div className="profile-level-name">{lvl.name}</div>
                      <div className="profile-level-loc">{lvl.location}</div>
                      {best && (
                        <div className="profile-level-best">
                          Year {best.year} · Score {best.score} · {Math.round(best.vegPct * 100)}% veg
                        </div>
                      )}
                    </div>
                    {best && <div className="profile-level-score">{best.score}<span>pts</span></div>}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'badges' && (
            <div className="profile-badges">
              {ACHIEVEMENTS.map(ach => {
                const isUnlocked = !!(rewards.unlocked?.[ach.id]);
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
          )}

          {tab === 'leaderboard' && (
            <div className="profile-leaderboard">
              {lbLoading ? (
                <div className="lb-loading">Loading…</div>
              ) : leaderboard.length === 0 ? (
                <div className="lb-empty">
                  <div style={{ fontSize: 40 }}>🌍</div>
                  <p>No scores yet — complete a level to appear here!</p>
                </div>
              ) : (
                <>
                  <div className="lb-header">
                    <span>#</span><span>Player</span><span>XP</span><span>Levels</span><span>Badges</span>
                  </div>
                  {leaderboard.map((entry, i) => {
                    const isMe = entry.user_id === user?.id;
                    return (
                      <div key={entry.user_id} className={`lb-row ${isMe ? 'me' : ''}`}>
                        <span className="lb-rank">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </span>
                        <span className="lb-name">
                          {entry.avatar_url
                            ? <img src={entry.avatar_url} alt="" className="lb-avatar" />
                            : <span className="lb-avatar-fallback">{entry.username?.[0]?.toUpperCase() || '?'}</span>}
                          {entry.username || 'Anonymous'}
                          {isMe && <span className="lb-you">you</span>}
                        </span>
                        <span className="lb-xp">{Number(entry.xp || 0).toLocaleString()}</span>
                        <span className="lb-levels">{entry.levels_completed || 0}</span>
                        <span className="lb-badges">{entry.achievement_count || 0}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
