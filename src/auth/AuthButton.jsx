// src/auth/AuthButton.jsx — Account chip that opens the auth modal.

import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';

export function AuthButton({ className = '', onOpenAuth, onOpenProfile }) {
  const { user, loading, signOut } = useAuth();

  if (loading) return <button className={`auth-btn auth-btn-loading ${className}`} disabled>…</button>;

  if (!user) {
    return (
      <button className={`auth-btn auth-btn-signin ${className}`} onClick={onOpenAuth}>
        Create account
      </button>
    );
  }

  const avatar = user.user_metadata?.avatar_url;
  const name = user.user_metadata?.full_name || user.email;

  return (
    <button className={`auth-chip-btn auth-chip-btn-standalone ${className}`} onClick={onOpenProfile}>
      {avatar
        ? <img src={avatar} alt="" className="auth-avatar" />
        : <span className="auth-avatar auth-avatar-fallback">{name?.[0]?.toUpperCase() ?? '?'}</span>}
      <span className="auth-name">{name}</span>
    </button>
  );
}