import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import BookingCalendar from './components/BookingCalendar';
import WhatsAppConsole from './components/WhatsAppConsole';
import LiveVoiceModal from './components/LiveVoiceModal';
import AuthModal from './components/AuthModal';
import { ToastProvider, useToast } from './components/Toast';

function MainApp() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [config, setConfig] = useState(null);
  const [systemHealth, setSystemHealth] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [dormantLeads, setDormantLeads] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);

  // Auth state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('codevirus_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('codevirus_auth_token');
    localStorage.removeItem('codevirus_user');
    setCurrentUser(null);
    showToast('Signed Out', 'You have been logged out successfully.', 'info');
  };

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [bookingPreset, setBookingPreset] = useState(null);

  const handleOpenBooking = (preset = null) => {
    setBookingPreset(preset);
    setIsBookingOpen(true);
  };

  // Fetch Config & Health
  useEffect(() => {
    fetch('/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setConfig(data);
      })
      .catch((err) => console.error('[Config Fetch Error]', err));

    const checkHealth = () => {
      fetch('/health')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          setSystemHealth(data?.status === 'ok');
        })
        .catch(() => setSystemHealth(false));
    };

    checkHealth();
    const healthInterval = setInterval(checkHealth, 15000);
    return () => clearInterval(healthInterval);
  }, []);

  // Fetch Appointments, Dormant, Activity
  const loadData = useCallback(async () => {
    try {
      const [apptsRes, dormantRes, actRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/dormant'),
        fetch('/api/activity')
      ]);

      if (apptsRes.ok) {
        const appts = await apptsRes.json();
        if (Array.isArray(appts)) setAppointments(appts);
      }
      if (dormantRes.ok) {
        const dormant = await dormantRes.json();
        if (Array.isArray(dormant)) setDormantLeads(dormant);
      }
      if (actRes.ok) {
        const act = await actRes.json();
        if (Array.isArray(act)) setActivityFeed(act);
      }
    } catch (err) {
      console.error('[Load Data Error]', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const pollInterval = setInterval(loadData, 6000);
    return () => clearInterval(pollInterval);
  }, [loadData]);

  return (
    <div className="bg-noise" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBooking={() => handleOpenBooking(null)}
        onOpenDialer={() => setIsDialerOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
        systemHealth={systemHealth}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <Dashboard
            appointments={appointments}
            dormantLeads={dormantLeads}
            activityFeed={activityFeed}
            onRefresh={loadData}
            onOpenBookingModal={handleOpenBooking}
            onOpenDialerModal={() => setIsDialerOpen(true)}
            isBookingOpen={isBookingOpen}
            setIsBookingOpen={setIsBookingOpen}
            isDialerOpen={isDialerOpen}
            setIsDialerOpen={setIsDialerOpen}
            bookingPreset={bookingPreset}
          />
        )}

        {activeTab === 'calendar' && (
          <BookingCalendar
            appointments={appointments}
            onOpenBookingModal={(preset) => {
              handleOpenBooking(preset);
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'whatsapp' && <WhatsAppConsole />}
      </main>

      {/* WebRTC Live AI Voice Modal */}
      <LiveVoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        config={config}
      />

      {/* Staff Counselor Login Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
