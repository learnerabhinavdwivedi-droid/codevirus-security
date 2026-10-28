import React, { useState } from 'react';
import { Lock, User, Key, ShieldCheck, X, CheckCircle, ArrowRight } from 'lucide-react';
import { useToast } from './Toast';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      showToast('Missing Fields', 'Please enter email and password', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Login Successful', `Welcome, ${data.user.name} (${data.user.role})`, 'success');
        localStorage.setItem('codevirus_auth_token', data.token);
        localStorage.setItem('codevirus_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
        onClose();
      } else {
        showToast('Authentication Failed', data.error || 'Invalid email or password', 'error');
      }
    } catch (err) {
      showToast('Network Error', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="animate-fade-in card-shadow"
        style={{
          background: '#0F172A',
          color: '#ffffff',
          borderRadius: 20,
          padding: 32,
          width: '100%',
          maxWidth: 440,
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #1E3A6E 0%, #0A1F44 100%)',
              border: '1px solid rgba(201, 165, 106, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
            }}
          >
            <Lock size={24} color="#00C9A7" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Staff &amp; Counselor Portal</h3>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            Sign in to access candidate records, exports &amp; dialer controls
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 5 }}>
              Staff Email
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="#64748B" style={{ position: 'absolute', top: 12, left: 12 }} />
              <input
                type="email"
                required
                placeholder="admin@codevirussec.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  fontSize: 13,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 5 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={16} color="#64748B" style={{ position: 'absolute', top: 12, left: 12 }} />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  fontSize: 13,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Quick Preset Buttons for Evaluation */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6, fontWeight: 600 }}>Quick Demo Logins:</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@codevirussec.in', 'codevirus2026')}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#C9A56A',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Director Access
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('counselor@codevirussec.in', 'counselor2026')}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#38BDF8',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Counselor Desk
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 20px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#ffffff',
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37,99,235,0.4)'
            }}
          >
            <span>{isSubmitting ? 'Authenticating…' : 'Sign In to Portal'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

