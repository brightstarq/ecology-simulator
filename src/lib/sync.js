// src/lib/sync.js — Supabase ↔ localStorage sync for progress + rewards.
//
// Strategy: localStorage is always the source of truth for the running game.
// On load → pull from Supabase and merge (Supabase wins on conflict).
// On save → write localStorage first (instant), then push to Supabase async.
// This means the game works offline / without auth and syncs when possible.

import { supabase } from './supabaseClient.js';

// ── Progress ──────────────────────────────────────────────────────────────

export async function pullProgress(userId) {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return {
      unlockedLevels:  data.unlocked_levels || [],
      completedLevels: data.completed_levels || {},
      totalPlaytime:   data.total_playtime  || 0,
      firstLaunch:     false,
    };
  } catch { return null; }
}

export async function pushProgress(userId, progress) {
  if (!supabase || !userId) return;
  try {
    await supabase.from('progress').upsert({
      user_id:          userId,
      unlocked_levels:  progress.unlockedLevels,
      completed_levels: progress.completedLevels,
      total_playtime:   progress.totalPlaytime || 0,
      updated_at:       new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch (e) { console.warn('[sync] progress push failed:', e.message); }
}

// ── Rewards ───────────────────────────────────────────────────────────────

export async function pullRewards(userId) {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return {
      xp:               data.xp || 0,
      unlocked:         data.unlocked || {},
      streak:           data.streak   || { count: 0, lastDay: null, best: 0 },
      levelsCompleted:  data.levels_completed || 0,
    };
  } catch { return null; }
}

export async function pushRewards(userId, rewards) {
  if (!supabase || !userId) return;
  try {
    await supabase.from('rewards').upsert({
      user_id:          userId,
      xp:               rewards.xp,
      unlocked:         rewards.unlocked,
      streak:           rewards.streak,
      levels_completed: rewards.levelsCompleted,
      updated_at:       new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch (e) { console.warn('[sync] rewards push failed:', e.message); }
}

// ── Profile ───────────────────────────────────────────────────────────────

export async function getProfile(userId) {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  } catch { return null; }
}

export async function updateProfile(userId, { username, avatar_url }) {
  if (!supabase || !userId) return { error: 'Not connected' };
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, username, avatar_url, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      .select()
      .single();
    return { data, error };
  } catch (e) { return { error: e.message }; }
}

// ── Leaderboard ───────────────────────────────────────────────────────────

export async function getLeaderboard() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('xp', { ascending: false })
      .limit(50);
    if (error) return [];
    return data || [];
  } catch { return []; }
}

// ── Merge helper: take the better of local vs remote ─────────────────────
// Used on first load to decide which data source wins.

export function mergeProgress(local, remote) {
  if (!remote) return local;
  if (!local)  return remote;
  // Union unlocked levels, take higher playtime, merge completed (remote wins per level)
  const unlockedSet = new Set([...local.unlockedLevels, ...remote.unlockedLevels]);
  return {
    unlockedLevels:  [...unlockedSet],
    completedLevels: { ...local.completedLevels, ...remote.completedLevels },
    totalPlaytime:   Math.max(local.totalPlaytime || 0, remote.totalPlaytime || 0),
    firstLaunch:     false,
  };
}

export function mergeRewards(local, remote) {
  if (!remote) return local;
  if (!local)  return remote;
  return {
    xp:              Math.max(local.xp, remote.xp),
    unlocked:        { ...local.unlocked, ...remote.unlocked },
    streak:          remote.streak.count >= local.streak.count ? remote.streak : local.streak,
    levelsCompleted: Math.max(local.levelsCompleted, remote.levelsCompleted),
  };
}
