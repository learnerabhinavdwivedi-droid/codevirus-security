import React from 'react';
import { Shield, LayoutDashboard, Calendar, MessageSquare, PhoneCall, Plus, Sparkles, Activity, Lock, LogOut, User } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenBooking,
  onOpenDialer,
  onOpenVoice,
  systemHealth,
  currentUser,
  onOpenAuth,
  onLogout
}) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#0A1F44',
        borderBottom: '1px solid rgba(201, 165, 106, 0.3)',
        color: '#ffffff',
        padding: '0 24px'
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}
      >
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1E3A6E 0%, #0F172A 100%)',
              border: '1px solid rgba(201, 165, 106, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
            }}
          >
            <Shield size={22} color="#00C9A7" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#ffffff',
                  lineHeight: 1
                }}
              >
                CODEVIRUS
              </span>
              <span
                style={{
                  background: 'rgba(201, 165, 106, 0.2)',
                  color: '#C9A56A',
                  border: '1px solid rgba(201, 165, 106, 0.4)',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  letterSpacing: '0.05em'
                }}
              >
                AI OPS
              </span>
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'rgba(255, 255, 255, 0.55)',
                fontWeight: 500,
                letterSpacing: '0.06em',
                marginTop: 3
              }}
            >
              Voice Receptionist &amp; Intake Suite • Lucknow
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', padding: 4, borderRadius: 12 }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === 'dashboard' ? '#0A1F44' : 'rgba(255,255,255,0.7)',
              background: activeTab === 'dashboard' ? '#ffffff' : 'transparent',
              boxShadow: activeTab === 'dashboard' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === 'calendar' ? '#0A1F44' : 'rgba(255,255,255,0.7)',
              background: activeTab === 'calendar' ? '#ffffff' : 'transparent',
              boxShadow: activeTab === 'calendar' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Calendar size={15} />
            <span>Consultation Diary</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === 'whatsapp' ? '#ffffff' : 'rgba(255,255,255,0.7)',
              background: activeTab === 'whatsapp' ? '#00a884' : 'transparent',
              boxShadow: activeTab === 'whatsapp' ? '0 2px 8px rgba(0,168,132,0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <MessageSquare size={15} />
            <span>WhatsApp Console</span>
          </button>
        </nav>

        {/* Action Controls & Live Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* System Health indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.06)',
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 500,
              color: systemHealth ? '#00C9A7' : '#f59e0b'
            }}
            title={systemHealth ? 'Server API online' : 'Checking server…'}
          >
            <span
              className="pulse-dot"
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: systemHealth ? '#00C9A7' : '#f59e0b'
              }}
            />
            <span>{systemHealth ? 'Sarah Online' : 'Connecting…'}</span>
          </div>

          {/* WebRTC Live Call Button */}
          <button
            onClick={onOpenVoice}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(16,185,129,0.3)'
            }}
            title="Start in-browser WebRTC conversation with Sarah"
          >
            <Sparkles size={14} />
            <span>Talk to AI</span>
          </button>

          {/* Test Dialer Button */}
          <button
            onClick={onOpenDialer}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '8px 12px',
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Trigger Sarah to call your phone"
          >
            <PhoneCall size={14} color="#00C9A7" />
            <span>Dialer</span>
          </button>

          {/* Manual Book Consultation */}
          <button
            onClick={onOpenBooking}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#2563EB',
              color: '#ffffff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(37,99,235,0.3)'
            }}
          >
            <Plus size={15} />
            <span>Book</span>
          </button>

          {/* Counselor Auth Status / Login */}
          {currentUser ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 10,
                padding: '4px 10px'
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#C9A56A',
                  color: '#0A1F44',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                {currentUser.name ? currentUser.name[0] : 'S'}
              </div>
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#ffffff' }}>{currentUser.name}</div>
                <div style={{ fontSize: 9.5, color: '#00C9A7' }}>{currentUser.role}</div>
              </div>
              <button
                onClick={onLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  padding: 2,
                  marginLeft: 4
                }}
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Staff Counselor Login"
            >
              <Lock size={13} color="#C9A56A" />
              <span>Staff Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

