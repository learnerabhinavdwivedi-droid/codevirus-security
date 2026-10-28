import React, { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Shield, X, Sparkles } from 'lucide-react';
import { useToast } from './Toast';

export default function LiveVoiceModal({ isOpen, onClose, config }) {
  const { showToast } = useToast();
  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'connecting' | 'active' | 'ended'
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [activeTranscript, setActiveTranscript] = useState('');

  const vapiRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize Vapi instance
  useEffect(() => {
    if (!config?.vapiPublicKey) return;
    try {
      const vapiInstance = new Vapi(config.vapiPublicKey);
      vapiRef.current = vapiInstance;

      vapiInstance.on('call-start', () => {
        setCallStatus('active');
        showToast('Call Connected', 'You are now speaking with Sarah (AI Receptionist)', 'success');
        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);
      });

      vapiInstance.on('call-end', () => {
        setCallStatus('ended');
        if (timerRef.current) clearInterval(timerRef.current);
        showToast('Call Ended', 'Live AI call session completed', 'info');
        setTimeout(() => {
          setCallStatus('idle');
          setDuration(0);
          onClose();
        }, 1500);
      });

      vapiInstance.on('speech-start', () => {
        setAssistantSpeaking(true);
      });

      vapiInstance.on('speech-end', () => {
        setAssistantSpeaking(false);
      });

      vapiInstance.on('volume-level', (vol) => {
        setVolumeLevel(vol);
      });

      vapiInstance.on('message', (message) => {
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          setActiveTranscript(message.transcript);
        }
      });

      vapiInstance.on('error', (err) => {
        console.error('[Vapi WebRTC Error]', err);
        setCallStatus('idle');
        if (timerRef.current) clearInterval(timerRef.current);
        showToast('Call Failed', err?.message || 'Could not connect WebRTC voice call. Check API keys.', 'error');
      });

      return () => {
        try {
          vapiInstance.stop();
        } catch {}
      };
    } catch (err) {
      console.error('[Vapi Init Error]', err);
    }
  }, [config?.vapiPublicKey, showToast, onClose]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startLiveCall = async () => {
    if (!vapiRef.current) {
      showToast('Configuration Missing', 'Vapi public key not loaded yet', 'error');
      return;
    }
    const assistantId = config?.assistantId;
    if (!assistantId) {
      showToast('Missing Assistant ID', 'No active Vapi assistant configured', 'error');
      return;
    }

    try {
      setCallStatus('connecting');
      setDuration(0);
      setActiveTranscript('');
      await vapiRef.current.start(assistantId);
    } catch (err) {
      console.error('[Start Call]', err);
      setCallStatus('idle');
      showToast('Connection Error', err?.message || 'Could not initiate audio call', 'error');
    }
  };

  const endLiveCall = () => {
    try {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    } catch (err) {
      console.error('[End Call]', err);
    }
    setCallStatus('ended');
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      setCallStatus('idle');
      setDuration(0);
      onClose();
    }, 800);
  };

  const toggleMute = () => {
    try {
      if (vapiRef.current) {
        const nextMute = !isMuted;
        vapiRef.current.setMuted(nextMute);
        setIsMuted(nextMute);
      }
    } catch (err) {
      console.error('[Mute Toggle]', err);
    }
  };

  if (!isOpen) return null;

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && callStatus === 'idle') onClose(); }}>
      <div
        className="animate-fade-in card-shadow"
        style={{
          background: '#0F172A',
          color: '#ffffff',
          borderRadius: 24,
          padding: 32,
          width: '100%',
          maxWidth: 460,
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            if (callStatus === 'active' || callStatus === 'connecting') {
              endLiveCall();
            } else {
              onClose();
            }
          }}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: 50,
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(37, 99, 235, 0.15)',
              border: '1px solid rgba(37, 99, 235, 0.35)',
              padding: '6px 14px',
              borderRadius: 999,
              marginBottom: 16
            }}
          >
            <Sparkles size={14} color="#00C9A7" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#00C9A7', letterSpacing: '0.05em' }}>
              WEB-RTC LIVE AI AGENT
            </span>
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Codevirus AI Voice Assistant
          </h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            Speak directly with Sarah (Hindi / Hinglish / English supported)
          </p>
        </div>

        {/* Central Audio Visualizer Circle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 30 }}>
          <div
            style={{
              position: 'relative',
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: callStatus === 'active'
                ? 'radial-gradient(circle, #2563EB 0%, #0F172A 70%)'
                : 'radial-gradient(circle, #1E293B 0%, #0F172A 70%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: callStatus === 'active'
                ? `0 0 ${20 + volumeLevel * 40}px rgba(37, 99, 235, 0.7)`
                : '0 4px 20px rgba(0,0,0,0.4)',
              transition: 'box-shadow 0.1s ease'
            }}
          >
            {callStatus === 'active' && (
              <div
                style={{
                  position: 'absolute',
                  inset: -10,
                  borderRadius: '50%',
                  border: '2px solid rgba(0, 201, 167, 0.4)',
                  animation: 'ringPulse 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                }}
              />
            )}

            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: '#1E293B',
                border: '2px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: callStatus === 'active' ? '#00C9A7' : '#94A3B8'
              }}
            >
              <Volume2 size={40} />
            </div>
          </div>
        </div>

        {/* Status & Speech Indicators */}
        <div style={{ textAlign: 'center', marginBottom: 26, minHeight: 48 }}>
          {callStatus === 'idle' && (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
              Ready to start. Click the button below to connect your microphone.
            </div>
          )}
          {callStatus === 'connecting' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#38BDF8' }}>
              <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#38BDF8' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Connecting to Sarah via WebRTC…</span>
            </div>
          )}
          {callStatus === 'active' && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.08em', color: '#00C9A7', marginBottom: 4 }}>
                {formatTimer(duration)}
              </div>
              <div style={{ fontSize: 13, color: assistantSpeaking ? '#38BDF8' : '#A7F3D0', fontWeight: 500 }}>
                {assistantSpeaking ? '● Sarah is speaking…' : '● Listening to your voice…'}
              </div>
              {activeTranscript && (
                <div style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.8)',
                  background: 'rgba(255,255,255,0.06)',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontStyle: 'italic',
                  maxHeight: 40,
                  overflow: 'hidden'
                }}>
                  "{activeTranscript}"
                </div>
              )}
            </div>
          )}
          {callStatus === 'ended' && (
            <div style={{ fontSize: 14, color: '#94A3B8' }}>
              Call completed. Closing session…
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          {callStatus === 'idle' ? (
            <button
              onClick={startLiveCall}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 14,
                padding: '14px 24px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(37,99,235,0.4)',
                transition: 'all 0.2s'
              }}
            >
              <Phone size={18} />
              Start Live AI Voice Call
            </button>
          ) : (
            <>
              <button
                onClick={toggleMute}
                disabled={callStatus !== 'active'}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: isMuted ? '#EF4444' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              <button
                onClick={endLiveCall}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  background: '#DC2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 14,
                  padding: '14px 20px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(220, 38, 38, 0.4)'
                }}
              >
                <PhoneOff size={18} />
                End Call
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

