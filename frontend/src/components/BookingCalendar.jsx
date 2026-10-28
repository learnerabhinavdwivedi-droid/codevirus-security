import React, { useState, useMemo } from 'react';
import { Printer, Download, Plus, Clock, User, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from './Toast';

const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

function formatHour(h) {
  if (h === 12) return '12 PM';
  if (h > 12) return `${h - 12} PM`;
  return `${h} AM`;
}

function parseTimeToDecimal(timeStr) {
  if (!timeStr) return null;
  const clean = timeStr.trim().toUpperCase();
  const m12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    if (m12[3] === 'PM' && h !== 12) h += 12;
    if (m12[3] === 'AM' && h === 12) h = 0;
    return h + min / 60;
  }
  const m24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const min = parseInt(m24[2], 10);
    return h + min / 60;
  }
  return null;
}

export default function BookingCalendar({ appointments, onOpenBookingModal }) {
  const { showToast } = useToast();
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Get Monday-Sunday dates for the current week view
  const weekDays = useMemo(() => {
    const now = new Date();
    // Offset by week if navigating
    now.setDate(now.getDate() + currentWeekOffset * 7);

    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoDate = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      days.push({
        date: d,
        isoDate,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    return days;
  }, [currentWeekOffset]);

  // Current IST time position
  const nowDecimal = useMemo(() => {
    const istDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const h = istDate.getHours();
    const m = istDate.getMinutes();
    return h + m / 60;
  }, []);

  const todayIso = useMemo(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  }, []);

  // Stats
  const todayConsultations = useMemo(() => {
    return appointments.filter((a) => a.appointment_date === todayIso).length;
  }, [appointments, todayIso]);

  const sarahBooked = useMemo(() => {
    return appointments.filter((a) => a.source !== 'staff-react-dashboard').length;
  }, [appointments]);

  // Map appointments to days
  const appointmentsByDate = useMemo(() => {
    const map = {};
    weekDays.forEach((w) => { map[w.isoDate] = []; });
    appointments.forEach((appt) => {
      const dateKey = appt.appointment_date;
      if (map[dateKey]) {
        map[dateKey].push(appt);
      }
    });
    return map;
  }, [appointments, weekDays]);

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 24px 60px' }}>
      {/* Top Header Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(201,165,106,0.4)',
          paddingBottom: 20,
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 32,
                fontWeight: 700,
                color: '#0A1F44',
                letterSpacing: '-0.01em'
              }}
            >
              Consultation Diary
            </span>
            <span
              style={{
                background: 'rgba(37,99,235,0.1)',
                color: '#2563EB',
                border: '1px solid rgba(37,99,235,0.2)',
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700
              }}
            >
              10:00 – 22:00 IST
            </span>
          </div>
          <div
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic',
              fontSize: 16,
              color: '#2563EB',
              marginTop: 4
            }}
          >
            Every client &amp; student intake, precisely scheduled.
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Week Navigators */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #CBD5E1', borderRadius: 999, padding: 2 }}>
            <button
              onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
              style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', color: '#0A1F44' }}
              title="Previous Week"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentWeekOffset(0)}
              style={{ background: 'none', border: 'none', padding: '6px 10px', fontSize: 11.5, fontWeight: 600, color: '#0A1F44', cursor: 'pointer' }}
            >
              Today
            </button>
            <button
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
              style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', color: '#0A1F44' }}
              title="Next Week"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => window.print()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#ffffff',
              border: '1px solid rgba(10,31,68,0.15)',
              borderRadius: 999,
              padding: '8px 16px',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
              color: '#0A1F44',
              letterSpacing: '0.04em'
            }}
          >
            <Printer size={14} />
            <span>Print Diary</span>
          </button>

          <a
            href="/api/export/consultations.csv"
            download
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#ffffff',
              border: '1px solid rgba(201,165,106,0.6)',
              borderRadius: 999,
              padding: '8px 16px',
              fontSize: 11.5,
              fontWeight: 600,
              color: '#0A1F44',
              textDecoration: 'none',
              letterSpacing: '0.04em'
            }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </a>

          <button
            onClick={onOpenBookingModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#2563EB',
              border: 'none',
              borderRadius: 999,
              padding: '8px 18px',
              fontSize: 11.5,
              fontWeight: 600,
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.28)'
            }}
          >
            <Plus size={14} />
            <span>Book Consultation</span>
          </button>
        </div>
      </div>

      {/* Luxury Stats Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          background: '#ffffff',
          border: '1px solid rgba(201,165,106,0.45)',
          marginBottom: 28,
          boxShadow: '0 4px 20px rgba(10,31,68,0.04)'
        }}
      >
        <div style={{ textAlign: 'center', padding: '24px 20px', borderRight: '1px solid rgba(201,165,106,0.3)' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 700, color: '#0A1F44', lineHeight: 1 }}>
            {todayConsultations}
          </div>
          <div style={{ width: 32, height: 1, background: '#C9A56A', margin: '10px auto' }} />
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', color: '#64748B', textTransform: 'uppercase' }}>
            Today's Consultations
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '24px 20px', borderRight: '1px solid rgba(201,165,106,0.3)' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 700, color: '#2563EB', lineHeight: 1 }}>
            {sarahBooked}
          </div>
          <div style={{ width: 32, height: 1, background: '#C9A56A', margin: '10px auto' }} />
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', color: '#64748B', textTransform: 'uppercase' }}>
            Booked By Sarah AI
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '24px 20px' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 44, fontWeight: 700, color: '#059669', lineHeight: 1.15 }}>
            Available
          </div>
          <div style={{ width: 32, height: 1, background: '#C9A56A', margin: '10px auto' }} />
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', color: '#64748B', textTransform: 'uppercase' }}>
            Next Free Slot: 11:30 AM
          </div>
        </div>
      </div>

      {/* Week Grid Layout */}
      <div
        className="glass-panel card-shadow"
        style={{
          borderRadius: 16,
          border: '1px solid rgba(201,165,106,0.4)',
          overflow: 'hidden',
          background: '#ffffff'
        }}
      >
        {/* Day Column Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', borderBottom: '1px solid rgba(201,165,106,0.3)', background: '#FAF8F5' }}>
          <div style={{ borderRight: '1px solid rgba(201,165,106,0.25)', padding: 12 }} />
          {weekDays.map((w) => {
            const isToday = w.isoDate === todayIso;
            return (
              <div
                key={w.isoDate}
                style={{
                  padding: '14px 10px',
                  textAlign: 'center',
                  borderRight: '1px solid rgba(201,165,106,0.25)',
                  background: isToday ? 'rgba(37,99,235,0.05)' : 'transparent'
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? '#2563EB' : '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {w.dayName}
                </div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 700, color: isToday ? '#2563EB' : '#0A1F44', marginTop: 2 }}>
                  {w.dayNum} {w.monthName}
                </div>
              </div>
            );
          })}
        </div>

        {/* Timetable Body (12 Hours x 7 Days) */}
        <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', height: 720, position: 'relative' }}>
          {/* Time Labels (Y-Axis) */}
          <div style={{ borderRight: '1px solid rgba(201,165,106,0.25)', position: 'relative', background: '#FCFBF9' }}>
            {HOURS.map((h, idx) => (
              <div
                key={h}
                style={{
                  height: 60,
                  borderBottom: '1px solid rgba(201,165,106,0.15)',
                  padding: '6px 8px 0 0',
                  textAlign: 'right',
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: '#64748B',
                  fontFamily: 'Jost, sans-serif'
                }}
              >
                {formatHour(h)}
              </div>
            ))}
          </div>

          {/* 7 Day Columns */}
          {weekDays.map((w) => {
            const isToday = w.isoDate === todayIso;
            const dayAppts = appointmentsByDate[w.isoDate] || [];

            return (
              <div
                key={w.isoDate}
                style={{
                  borderRight: '1px solid rgba(201,165,106,0.2)',
                  position: 'relative',
                  background: isToday ? 'rgba(37,99,235,0.02)' : 'transparent'
                }}
              >
                {/* 12 Hour grid lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    onClick={() => {
                      showToast('Selected Slot', `Booking slot clicked for ${w.dayName} ${formatHour(h)}`, 'info');
                      onOpenBookingModal();
                    }}
                    style={{
                      height: 60,
                      borderBottom: '1px solid rgba(201,165,106,0.12)',
                      cursor: 'pointer'
                    }}
                    title={`Click to book on ${w.dayName} at ${formatHour(h)}`}
                  />
                ))}

                {/* NOW Indicator Line (if today) */}
                {isToday && nowDecimal >= 10 && nowDecimal <= 22 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: `${((nowDecimal - 10) / 12) * 100}%`,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: '#C9A56A',
                      zIndex: 10,
                      boxShadow: '0 0 6px rgba(201,165,106,0.8)'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: 2,
                        top: -12,
                        background: '#C9A56A',
                        color: '#ffffff',
                        fontSize: 8.5,
                        fontWeight: 700,
                        padding: '1px 4px',
                        borderRadius: 3
                      }}
                    >
                      NOW
                    </span>
                  </div>
                )}

                {/* Render Appointments Plotted in this column */}
                {dayAppts.map((appt) => {
                  const dec = parseTimeToDecimal(appt.appointment_time);
                  if (dec === null || dec < 10 || dec > 22) return null;

                  const topPercent = ((dec - 10) / 12) * 100;
                  const heightPercent = (1 / 12) * 100; // default 1 hour block

                  const isConfirmed = appt.status === 'confirmed';
                  const isCompleted = appt.status === 'completed';

                  return (
                    <div
                      key={appt.id}
                      style={{
                        position: 'absolute',
                        top: `${topPercent}%`,
                        left: 4,
                        right: 4,
                        minHeight: 52,
                        borderRadius: 8,
                        background: isConfirmed
                          ? 'linear-gradient(135deg, #1E3A6E 0%, #0A1F44 100%)'
                          : isCompleted
                          ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                          : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                        color: '#ffffff',
                        padding: '6px 8px',
                        fontSize: 11,
                        boxShadow: '0 3px 10px rgba(10,31,68,0.2)',
                        borderLeft: '3px solid #C9A56A',
                        zIndex: 5,
                        overflow: 'hidden'
                      }}
                      title={`${appt.candidate_name || appt.patient_name} - ${appt.service}`}
                    >
                      <div style={{ fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {appt.candidate_name || appt.patient_name}
                      </div>
                      <div style={{ fontSize: 9.5, opacity: 0.85, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {appt.service}
                      </div>
                      <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>
                        {appt.appointment_time} • {appt.counselor ? appt.counselor.split(' ')[0] : 'Desk'}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

