// src/auth/AuthModal.jsx — Email/password sign-up and sign-in modal.
// No OAuth redirects, no external dependencies beyond supabase-js.

import { useState } from 'react';
import { useAuth } from './AuthContext.jsx';

export function AuthModal({ onClose, onSuccess }) {
  const { signUp, signIn } = useAuth();
  const [tab, setTab] = useState('signup'); // 'signup' | 'signin'
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [info, setInfo]         = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setInfo('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (tab === 'signup' && !username.trim()) { setError('Choose a display name.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    if (tab === 'signup') {
      const { error: err } = await signUp(email, password, username.trim());
      setLoading(false);
      if (err) { setError(err.message); return; }
      setInfo('Account created! Check your email to confirm, then sign in.');
      setTab('signin');
    } else {
      const { error: err } = await signIn(email, password);
      setLoading(false);
      if (err) { setError(err.message); return; }
      onSuccess?.();
      onClose();
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal-card auth-modal" onClick={(e) => e.stopPropagation()}>

        <div className="auth-modal-hero">
          <span className="auth-modal-icon">🌱</span>
          <h2 className="modal-title" style={{ margin: 0 }}>
            {tab === 'signup' ? 'Start your journey' : 'Welcome back'}
          </h2>
          <p className="modal-lede" style={{ margin: '4px 0 0' }}>
            {tab === 'signup'
              ? 'Save your progress, earn XP and restore ecosystems across the planet.'
              : 'Sign in to pick up where you left off.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button className={tab === 'signup' ? 'on' : ''} onClick={() => { setTab('signup'); setError(''); setInfo(''); }}>
            Create account
          </button>
          <button className={tab === 'signin' ? 'on' : ''} onClick={() => { setTab('signin'); setError(''); setInfo(''); }}>
            Sign in
          </button>
        </div>

        <div className="auth-form">
          {tab === 'signup' && (
            <div className="auth-field">
              <label>Display name</label>
              <input type="text" placeholder="e.g. EcoStanley" value={username}
                onChange={e => setUsername(e.target.value)} autoFocus />
            </div>
          )}
          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} autoFocus={tab === 'signin'} />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="6+ characters" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} />
          </div>

          {error && <div className="auth-error">{error}</div>}
          {info  && <div className="auth-info">{info}</div>}

          <button className="btn-primary auth-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? '…' : tab === 'signup' ? 'Create account & play' : 'Sign in & play'}
          </button>
        </div>

        <button className="auth-modal-close" onClick={onClose} aria-label="Close">×</button>
      </div>
    </div>
  );
}
