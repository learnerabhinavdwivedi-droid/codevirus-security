import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Mic, Paperclip, Smile, MoreVertical, Search, Check,
  CheckCheck, Phone, Video, Shield, User, Sparkles
} from 'lucide-react';
import { useToast } from './Toast';

const TEAM_CONTACTS = [
  { id: 'sarah', name: 'Codevirus AI Receptionist', role: 'Official Intake Bot', avatar: '🤖', isBot: true },
  { id: 'ankit', name: 'Ankit Rai (Director)', role: 'Senior Trainer', avatar: 'AR', isBot: false },
  { id: 'pawan', name: 'Pawan Yadav (VAPT Lead)', role: 'Bug Bounty Specialist', avatar: 'PY', isBot: false },
  { id: 'abhishek', name: 'Abhishek Pal (SOC Lead)', role: 'SIEM / Splunk Mentor', avatar: 'AP', isBot: false },
  { id: 'admissions', name: 'Admissions Desk', role: 'Kapoorthala Center', avatar: 'AD', isBot: false }
];

const QUICK_PROMPTS = [
  'What is the fee and syllabus for the SOC Analyst course?',
  'Can I book a free demo at the Kapoorthala offline center?',
  'We need a VAPT security audit for our web application.',
  'Do you offer 100% placement assistance in Lucknow?'
];

export default function WhatsAppConsole() {
  const { showToast } = useToast();
  const [selectedContact, setSelectedContact] = useState(TEAM_CONTACTS[0]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'sarah',
      text: 'Namaste! Welcome to Codevirus Security & Academy Lucknow. I am Sarah, your AI advisor. How may I assist you today with our cybersecurity training or security audits?',
      time: '10:00 AM',
      mine: false,
      status: 'read'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Poll server for new WhatsApp messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/messages');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Merge unique messages if needed
          }
        }
      } catch {}
    };

    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (textToSend) => {
    const text = (typeof textToSend === 'string' ? textToSend : inputValue).trim();
    if (!text) return;

    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      time: currentTime,
      mine: true,
      status: 'sent'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    // Update tick states
    setTimeout(() => {
      setMessages((prev) => prev.map((m) => (m.id === userMsg.id ? { ...m, status: 'delivered' } : m)));
    }, 400);

    setTimeout(() => {
      setMessages((prev) => prev.map((m) => (m.id === userMsg.id ? { ...m, status: 'read' } : m)));
    }, 800);

    // If talking to Sarah, call /api/chat-reply
    if (selectedContact.id === 'sarah') {
      setTimeout(() => setIsTyping(true), 600);

      try {
        const res = await fetch('/api/chat-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            chat_id: 'wa-demo-client',
            history: messages.map((m) => ({ mine: m.mine, text: m.text }))
          })
        });

        const data = await res.json();
        const replyText = data.reply ||
          'Thank you for reaching out! Our admissions team at Kapoorthala will review your requirements. Would you like to schedule a free counseling demo session?';

        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: 'sarah',
              text: replyText,
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
              mine: false,
              status: 'read'
            }
          ]);
        }, 1200);
      } catch (err) {
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: 'sarah',
              text: 'Thanks for contacting Codevirus Security! You can visit our Kapoorthala center or call us directly. Would you like us to schedule a counseling call?',
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
              mine: false,
              status: 'read'
            }
          ]);
        }, 1000);
      }
    } else {
      // Mock colleague response
      setTimeout(() => setIsTyping(true), 800);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: selectedContact.id,
            text: `Hi! Received your message regarding ${selectedContact.role}. I will look into this shortly.`,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            mine: false,
            status: 'read'
          }
        ]);
      }, 1800);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 70px)',
        backgroundColor: '#111b21',
        color: '#e9edef',
        fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
        overflow: 'hidden'
      }}
    >
      {/* LEFT RAIL / CONTACT LIST */}
      <div
        style={{
          width: 360,
          flexShrink: 0,
          borderRight: '1px solid rgba(134,150,160,0.15)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#111b21'
        }}
      >
        {/* Left Header */}
        <div
          style={{
            height: 60,
            padding: '0 16px',
            backgroundColor: '#202c33',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(134,150,160,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#005c4b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18
              }}
            >
              🛡️
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#e9edef' }}>Codevirus Security</div>
              <div style={{ fontSize: 11, color: '#00a884', fontWeight: 600 }}>WhatsApp Business Suite</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(134,150,160,0.1)' }}>
          <div
            style={{
              background: '#202c33',
              borderRadius: 8,
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <Search size={15} color="#8696a0" />
            <input
              type="text"
              placeholder="Search or start new chat"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#e9edef',
                fontSize: 13,
                width: '100%'
              }}
            />
          </div>
        </div>

        {/* Contacts List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {TEAM_CONTACTS.map((c) => {
            const isSelected = selectedContact.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedContact(c)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  backgroundColor: isSelected ? '#2a3942' : 'transparent',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(134,150,160,0.08)',
                  transition: 'background 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: c.isBot ? 'linear-gradient(135deg, #005c4b, #00a884)' : '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: c.isBot ? 20 : 14,
                    fontWeight: 700,
                    color: '#ffffff',
                    flexShrink: 0
                  }}
                >
                  {c.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: '#e9edef', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </div>
                    <span style={{ fontSize: 11, color: '#8696a0' }}>Now</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#8696a0', marginTop: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {c.role}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT MAIN CHAT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0b141a', position: 'relative' }}>
        {/* Chat Header */}
        <div
          style={{
            height: 60,
            padding: '0 20px',
            backgroundColor: '#202c33',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(134,150,160,0.1)',
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: selectedContact.isBot ? 'linear-gradient(135deg, #005c4b, #00a884)' : '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: selectedContact.isBot ? 20 : 14,
                fontWeight: 700,
                color: '#ffffff'
              }}
            >
              {selectedContact.avatar}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#e9edef' }}>{selectedContact.name}</div>
              <div style={{ fontSize: 11.5, color: '#00a884', fontWeight: 500 }}>
                {isTyping ? 'typing…' : 'Online • Verified Business'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: '#aebac1' }}>
            <Phone size={18} style={{ cursor: 'pointer' }} />
            <Video size={20} style={{ cursor: 'pointer' }} />
            <MoreVertical size={19} style={{ cursor: 'pointer' }} />
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(32, 44, 51, 0.9)',
            borderBottom: '1px solid rgba(134,150,160,0.1)',
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            zIndex: 5
          }}
        >
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              style={{
                background: '#111b21',
                border: '1px solid rgba(0,168,132,0.4)',
                color: '#e9edef',
                borderRadius: 16,
                padding: '6px 12px',
                fontSize: 11.5,
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#005c4b';
                e.currentTarget.style.borderColor = '#00a884';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#111b21';
                e.currentTarget.style.borderColor = 'rgba(0,168,132,0.4)';
              }}
            >
              💬 {prompt}
            </button>
          ))}
        </div>

        {/* Messages Feed */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            backgroundImage: "url('/chat-wallpaper.png')",
            backgroundRepeat: 'repeat',
            backgroundSize: '400px',
            backgroundColor: '#0b141a'
          }}
        >
          {/* Encryption Note */}
          <div style={{ textAlign: 'center', margin: '8px 0 16px' }}>
            <span
              style={{
                background: '#182229',
                color: '#ffd279',
                fontSize: 11,
                padding: '5px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255, 210, 121, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              🔒 Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.
            </span>
          </div>

          {messages.map((m) => {
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: m.mine ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '68%',
                    backgroundColor: m.mine ? '#005c4b' : '#202c33',
                    color: '#e9edef',
                    padding: '8px 12px 6px',
                    borderRadius: 10,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: 13.5, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{m.text}</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 4,
                      marginTop: 4,
                      fontSize: 10.5,
                      color: 'rgba(255,255,255,0.55)'
                    }}
                  >
                    <span>{m.time}</span>
                    {m.mine && (
                      <span>
                        {m.status === 'read' ? (
                          <CheckCheck size={14} color="#53bdeb" />
                        ) : m.status === 'delivered' ? (
                          <CheckCheck size={14} color="rgba(255,255,255,0.55)" />
                        ) : (
                          <Check size={14} color="rgba(255,255,255,0.55)" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  background: '#202c33',
                  padding: '8px 14px',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#00a884' }} />
                <span style={{ fontSize: 12, color: '#8696a0' }}>Sarah is typing…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div
          style={{
            height: 62,
            backgroundColor: '#202c33',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderTop: '1px solid rgba(134,150,160,0.1)'
          }}
        >
          <Smile size={24} color="#8696a0" style={{ cursor: 'pointer' }} />
          <Paperclip size={22} color="#8696a0" style={{ cursor: 'pointer' }} />

          <div
            style={{
              flex: 1,
              background: '#2a3942',
              borderRadius: 8,
              padding: '9px 14px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              placeholder="Type a message to Sarah or your team…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#e9edef',
                fontSize: 14
              }}
            />
          </div>

          {inputValue.trim() ? (
            <button
              onClick={() => handleSendMessage()}
              style={{
                background: '#00a884',
                border: 'none',
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <Send size={18} />
            </button>
          ) : (
            <Mic size={24} color="#8696a0" style={{ cursor: 'pointer' }} />
          )}
        </div>
      </div>
    </div>
  );
}
