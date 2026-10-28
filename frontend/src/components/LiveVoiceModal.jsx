import React, { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Shield, X, Sparkles, Radio } from 'lucide-react';
import { useToast } from './Toast';

export default function LiveVoiceModal({ isOpen, onClose, config }) {
  const { showToast } = useToast();
  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'connecting' | 'active' | 'ended'
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [activeTranscript, setActiveTranscript] = useState('');
  const [voiceEngine, setVoiceEngine] = useState('vapi'); // 'vapi' | 'browser'

  const vapiRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis || null);

  // Initialize Vapi instance if public key exists
  useEffect(() => {
    if (!config?.vapiPublicKey) {
      setVoiceEngine('browser');
      return;
    }

    try {
      const vapiInstance = new Vapi(config.vapiPublicKey);
      vapiRef.current = vapiInstance;

      vapiInstance.on('call-start', () => {
        setCallStatus('active');
        showToast('WebRTC Connected', 'Connected to Sarah via Vapi Voice Stream', 'success');
        startTimer();
      });

      vapiInstance.on('call-end', () => {
        handleCallFinished();
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
        console.warn('[Vapi WebRTC Warning]', err?.message);
        // Seamless fallback to browser voice simulation mode
        if (callStatus === 'connecting' || callStatus === 'active') {
          showToast('Switching Engine', 'Connecting via Interactive Browser Voice Mode…', 'info');
          startBrowserVoiceMode();
        }
      });

      return () => {
        try { vapiInstance.stop(); } catch {}
      };
    } catch (err) {
      console.warn('[Vapi Init Error]', err);
      setVoiceEngine('browser');
    }
  }, [config?.vapiPublicKey, showToast]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const handleCallFinished = () => {
    setCallStatus('ended');
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    showToast('Call Completed', 'Voice session finished', 'info');
    setTimeout(() => {
      setCallStatus('idle');
      setDuration(0);
      onClose();
    }, 1200);
  };

  // Browser Voice Engine (Web Speech API Fallback)
  const startBrowserVoiceMode = () => {
    setVoiceEngine('browser');
    setCallStatus('active');
    startTimer();

    // Sarah speaks initial welcome
    speakResponse("Namaste! I am Sarah from Codevirus Security Lucknow. How can I help you with our courses or security audits?");

    // Setup speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Indian English / Hindi mix

      recognition.onresult = async (event) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const text = lastResult[0].transcript.trim();
          if (text) {
            setActiveTranscript(text);
            setAssistantSpeaking(false);
            try {
              const res = await fetch('/api/chat-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, chat_id: 'browser-voice-session' })
              });
              const data = await res.json();
              const reply = data.reply || "Thank you! I will note that and connect you with our admissions counselor.";
              speakResponse(reply);
            } catch {
              speakResponse("Our Kapoorthala center is open Monday to Saturday. Would you like to attend a free counseling demo session?");
            }
          }
        }
      };

      recognition.onerror = (e) => {
        console.warn('[Speech Recognition Notice]', e.error);
      };

      recognition.onend = () => {
        if (callStatus === 'active') {
          try { recognition.start(); } catch {}
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch {}
    }
  };

  const speakResponse = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    setAssistantSpeaking(true);
    setVolumeLevel(0.65);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Pick Indian English or female voice if available
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find((v) =>
      v.lang.includes('IN') || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('female')
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      setAssistantSpeaking(false);
      setVolumeLevel(0.1);
    };

    utterance.onerror = () => {
      setAssistantSpeaking(false);
      setVolumeLevel(0);
    };

    synthRef.current.speak(utterance);
  };

  const startLiveCall = async () => {
    setCallStatus('connecting');
    setDuration(0);
    setActiveTranscript('');

    if (vapiRef.current && config?.assistantId && config?.vapiPublicKey) {
      try {
        setVoiceEngine('vapi');
        await vapiRef.current.start(config.assistantId);
      } catch (err) {
        console.warn('[Vapi start failed, using browser voice fallback]', err?.message);
        startBrowserVoiceMode();
      }
    } else {
      startBrowserVoiceMode();
    }
  };

  const endLiveCall = () => {
    if (vapiRef.current && voiceEngine === 'vapi') {
      try { vapiRef.current.stop(); } catch {}
    }
    handleCallFinished();
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (vapiRef.current && voiceEngine === 'vapi') {
      try { vapiRef.current.setMuted(nextMute); } catch {}
    }
    if (recognitionRef.current) {
      if (nextMute) {
        try { recognitionRef.current.stop(); } catch {}
      } else {
        try { recognitionRef.current.start(); } catch {}
      }
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

        {/* Header Badge */}
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
            <Radio size={14} color="#00C9A7" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#00C9A7', letterSpacing: '0.05em' }}>
              {voiceEngine === 'vapi' ? 'VAPI AI WEBRTC AGENT' : 'INTERACTIVE BROWSER VOICE AGENT'}
            </span>
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Codevirus AI Voice Assistant
          </h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            Speak directly with Sarah (Hindi, Hinglish &amp; English supported)
          </p>
        </div>

        {/* Central Visualizer */}
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

        {/* Status Text & Dynamic Transcripts */}
        <div style={{ textAlign: 'center', marginBottom: 26, minHeight: 48 }}>
          {callStatus === 'idle' && (
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)' }}>
              Click below to start talking. Your microphone will connect instantly.
            </div>
          )}
          {callStatus === 'connecting' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#38BDF8' }}>
              <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#38BDF8' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Connecting live voice stream…</span>
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
                  color: 'rgba(255,255,255,0.85)',
                  background: 'rgba(255,255,255,0.08)',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontStyle: 'italic',
                  maxHeight: 45,
                  overflow: 'hidden'
                }}>
                  "{activeTranscript}"
                </div>
              )}
            </div>
          )}
          {callStatus === 'ended' && (
            <div style={{ fontSize: 14, color: '#94A3B8' }}>
              Call session completed.
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
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
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
