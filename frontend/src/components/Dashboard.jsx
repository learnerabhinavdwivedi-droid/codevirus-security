import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, CheckCircle2, AlertTriangle, PhoneForwarded, Search, Filter,
  Calendar, Phone, MessageSquare, Trash2, Download, ArrowUpRight,
  Clock, Sparkles, RefreshCw, X, ShieldAlert, ChevronRight, UserCheck
} from 'lucide-react';
import { useToast } from './Toast';

export default function Dashboard({
  appointments,
  dormantLeads,
  activityFeed,
  onRefresh,
  onOpenBookingModal,
  onOpenDialerModal,
  isBookingOpen,
  setIsBookingOpen,
  isDialerOpen,
  setIsDialerOpen
}) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual Booking Form State
  const [bookingForm, setBookingForm] = useState({
    candidate_name: '',
    phone: '+91',
    email: '',
    counselor: 'Ankit Rai (Senior Trainer)',
    service: 'SOC Analyst Career Counseling',
    batch_preference: 'Kapoorthala Offline Lab',
    appointment_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
    appointment_time: '11:30 AM',
    notes: ''
  });

  // Outbound Dialer Form State
  const [dialerForm, setDialerForm] = useState({
    candidate_name: 'Test Candidate',
    phone: '+919667172535',
    call_type: 'follow_up'
  });

  // KPI Calculations
  const stats = useMemo(() => {
    const total = appointments.length;
    const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const noShows = appointments.filter((a) => a.status === 'no_show').length;
    const followUps = appointments.filter((a) => a.status === 'follow_up_sent').length;
    const confirmRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

    return {
      total,
      confirmed,
      completed,
      noShows,
      followUps,
      confirmRate,
      dormantCount: dormantLeads.length
    };
  }, [appointments, dormantLeads]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((row) => {
      const name = (row.candidate_name || row.patient_name || '').toLowerCase();
      const phone = (row.phone || '').toLowerCase();
      const service = (row.service || '').toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
                            phone.includes(searchTerm.toLowerCase()) ||
                            service.includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' ? true : row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  // Handle No-Show Action
  const handleMarkNoShow = async (id) => {
    const row = appointments.find((a) => a.id === id);
    const candidateName = row?.candidate_name || row?.patient_name || 'Candidate';
    const phone = row?.phone || '';

    try {
      await fetch(`/api/appointments/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'no_show' })
      });

      if (phone) {
        const res = await fetch('/trigger-outbound', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, patient_name: candidateName, call_type: 'no_show' })
        });
        if (res.ok) {
          showToast('No-Show Recorded', `Recovery call triggered to ${candidateName}`, 'success');
        } else {
          showToast('Status Updated', `No-show recorded for ${candidateName}`, 'info');
        }
      } else {
        showToast('Status Updated', `No-show recorded for ${candidateName}`, 'info');
      }
      onRefresh();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Handle Follow-Up Action
  const handleTriggerFollowUp = async (id) => {
    const row = appointments.find((a) => a.id === id);
    const candidateName = row?.candidate_name || row?.patient_name || 'Candidate';
    const phone = row?.phone;

    if (!phone) {
      showToast('Missing Phone', `No phone number for ${candidateName}`, 'error');
      return;
    }

    try {
      const res = await fetch('/trigger-outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, patient_name: candidateName, call_type: 'follow_up' })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Follow-Up Call Placed', `Sarah is calling ${candidateName}`, 'success');
        await fetch(`/api/appointments/${id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'follow_up_sent' })
        });
        onRefresh();
      } else {
        showToast('Call Error', data.error || 'Failed to place follow-up call', 'error');
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Handle Delete
  const handleDeleteAppointment = async (id) => {
    const row = appointments.find((a) => a.id === id);
    const candidateName = row?.candidate_name || row?.patient_name || 'Candidate';
    if (!window.confirm(`Delete consultation record for ${candidateName}?`)) return;

    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Removed', 'Consultation deleted successfully', 'info');
        onRefresh();
      } else {
        showToast('Error', 'Could not delete record', 'error');
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Handle Dormant Lead Call
  const handleCallDormant = async (lead) => {
    if (!lead.phone) {
      showToast('No Phone', `No contact number for ${lead.name}`, 'error');
      return;
    }

    try {
      const res = await fetch('/trigger-outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: lead.phone,
          patient_name: lead.name,
          call_type: 'reactivation'
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Reactivation Call Placed', `Sarah is dialing ${lead.name}`, 'success');
        await fetch(`/api/dormant/${lead.id}/reactivate`, { method: 'POST' });
        onRefresh();
      } else {
        showToast('Call Notice', data.error || 'Call queued', 'info');
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Submit Manual Booking Modal
  const submitBooking = async (e) => {
    e.preventDefault();
    if (!bookingForm.candidate_name) {
      showToast('Missing Field', 'Please enter candidate/client name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: bookingForm.candidate_name,
          candidate_name: bookingForm.candidate_name,
          phone: bookingForm.phone || null,
          email: bookingForm.email || null,
          counselor: bookingForm.counselor,
          batch_preference: bookingForm.batch_preference,
          service: bookingForm.service,
          appointment_date: bookingForm.appointment_date,
          appointment_time: bookingForm.appointment_time,
          notes: bookingForm.notes || null,
          status: 'confirmed',
          source: 'staff-react-dashboard'
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Consultation Booked!', `${bookingForm.candidate_name} scheduled for ${bookingForm.appointment_time}`, 'success');
        setIsBookingOpen(false);
        setBookingForm({
          candidate_name: '',
          phone: '+91',
          email: '',
          counselor: 'Ankit Rai (Senior Trainer)',
          service: 'SOC Analyst Career Counseling',
          batch_preference: 'Kapoorthala Offline Lab',
          appointment_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
          appointment_time: '11:30 AM',
          notes: ''
        });
        onRefresh();
      } else {
        showToast('Booking Error', data.error || 'Failed to save appointment', 'error');
      }
    } catch (err) {
      showToast('Network Error', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Dialer Call
  const submitDialer = async (e) => {
    e.preventDefault();
    if (!dialerForm.phone || dialerForm.phone.length < 8) {
      showToast('Invalid Phone', 'Please provide a valid E.164 phone number with country code (e.g. +91)', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/trigger-outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: dialerForm.phone,
          patient_name: dialerForm.candidate_name,
          call_type: dialerForm.call_type
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Call Placed!', `Sarah is calling ${dialerForm.phone} right now. Answer your phone!`, 'success');
        setIsDialerOpen(false);
      } else {
        showToast('Call Error', data.error || 'Failed to place call', 'error');
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="badge-confirmed" style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 600 }}>Confirmed</span>;
      case 'completed':
        return <span className="badge-completed" style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 600 }}>Completed</span>;
      case 'no_show':
        return <span className="badge-no-show" style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 600 }}>No-Show</span>;
      case 'follow_up_sent':
        return <span className="badge-follow-up" style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 600 }}>Follow-Up Sent</span>;
      default:
        return <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>{status}</span>;
    }
  };

  const getAvatarGradient = (str) => {
    const hash = (str || 'A').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const gradients = [
      'linear-gradient(135deg, #1E3A6E, #0A1F44)',
      'linear-gradient(135deg, #2563EB, #1D4ED8)',
      'linear-gradient(135deg, #059669, #047857)',
      'linear-gradient(135deg, #D97706, #B45309)',
      'linear-gradient(135deg, #7C3AED, #6D28D9)'
    ];
    return gradients[hash % gradients.length];
  };

  const getInitials = (name) => {
    if (!name) return 'CD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 24px 48px' }}>
      {/* Top Banner / Ticker */}
      {activityFeed.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(90deg, #FFFBEB 0%, #FEF3C7 100%)',
            border: '1px solid #FDE68A',
            borderRadius: 12,
            padding: '10px 18px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12.5,
            color: '#92400E'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Latest Activity:</span>
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {activityFeed[0]?.message || 'Sarah scheduled a new consultation'}
            </span>
          </div>
          <button
            onClick={onRefresh}
            style={{
              background: 'none',
              border: 'none',
              color: '#B45309',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600
            }}
          >
            <RefreshCw size={13} />
            <span>Sync</span>
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="glass-panel card-shadow card-hover" style={{ borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Total Consultations</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EBF1FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#1E3A6E" />
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0A1F44', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {stats.total}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Active bookings in CRM &amp; Supabase</span>
          </div>
        </div>

        <div className="glass-panel card-shadow card-hover" style={{ borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Confirmed Sessions</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#059669', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {stats.confirmed}
          </div>
          <div style={{ fontSize: 12, color: '#059669', marginTop: 8, fontWeight: 500 }}>
            {stats.confirmRate}% confirmation rate
          </div>
        </div>

        <div className="glass-panel card-shadow card-hover" style={{ borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>No-Shows</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="#DC2626" />
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#DC2626', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {stats.noShows}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>
            {stats.noShows > 0 ? `${stats.noShows} queued for recovery call` : 'Zero missed sessions'}
          </div>
        </div>

        <div className="glass-panel card-shadow card-hover" style={{ borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Dormant Leads</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(201,165,106,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhoneForwarded size={18} color="#B58F52" />
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#B58F52', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {stats.dormantCount}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>
            Ready for AI batch reactivation
          </div>
        </div>
      </div>

      {/* Main Section: Consultations Table */}
      <div className="glass-panel card-shadow" style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 32 }}>
        {/* Table Controls Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0A1F44', margin: '0 0 4px' }}>
              Scheduled Consultations &amp; Audits
            </h2>
            <p style={{ fontSize: 12.5, color: '#64748B', margin: 0 }}>
              Live intake diary managed by Sarah AI Voice Assistant &amp; Staff Desk
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: 10,
                padding: '6px 12px'
              }}
            >
              <Search size={15} color="#64748B" />
              <input
                type="text"
                placeholder="Search candidates, phone, course…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: 12.5,
                  width: 220,
                  color: '#0A1F44'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', background: '#F1F5F9', padding: 3, borderRadius: 10 }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'confirmed', label: 'Confirmed' },
                { id: 'completed', label: 'Completed' },
                { id: 'no_show', label: 'No-Show' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: statusFilter === tab.id ? '#0A1F44' : '#64748B',
                    background: statusFilter === tab.id ? '#ffffff' : 'transparent',
                    boxShadow: statusFilter === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Export CSV Button */}
            <a
              href="/api/export/consultations.csv"
              download
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#ffffff',
                border: '1px solid #CBD5E1',
                borderRadius: 10,
                padding: '7px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#1E3A6E',
                textDecoration: 'none'
              }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Table Body */}
        {filteredAppointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
            <Calendar size={36} color="#CBD5E1" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>No consultations found</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
              {searchTerm ? 'Try adjusting your search criteria' : 'Sarah will book consultations automatically as calls arrive'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 24px' }}>Candidate / Client</th>
                  <th style={{ padding: '14px 20px' }}>Program / Service</th>
                  <th style={{ padding: '14px 20px' }}>Slot / Date</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 24px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((row) => {
                  const name = row.candidate_name || row.patient_name || 'Valued Candidate';
                  const phone = row.phone || '';
                  const cleanPhone = phone.replace(/[^\d]/g, '');

                  return (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Name & Avatar */}
                      <td style={{ padding: '14px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: getAvatarGradient(name),
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 700,
                              flexShrink: 0
                            }}
                          >
                            {getInitials(name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0A1F44' }}>{name}</div>
                            <div style={{ fontSize: 11.5, color: '#64748B', fontVariantNumeric: 'tabular-nums' }}>
                              {phone || '—'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Service / Counselor */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 500, color: '#1E3A6E' }}>{row.service || 'Security Consultation'}</div>
                        <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{row.counselor || 'Admissions Desk'}</div>
                      </td>

                      {/* Time / Date */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#0A1F44', fontVariantNumeric: 'tabular-nums' }}>
                          {row.appointment_time || '—'}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>
                          {row.appointment_date || 'Today'}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px' }}>
                        {getStatusBadge(row.status)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          {/* WhatsApp Chat link */}
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(name)}%2C%20this%20is%20Codevirus%20Security%20regarding%20your%20consultation.`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '5px 9px',
                                borderRadius: 7,
                                background: 'rgba(0,168,132,0.1)',
                                color: '#00a884',
                                border: '1px solid rgba(0,168,132,0.25)',
                                textDecoration: 'none',
                                fontSize: 11.5,
                                fontWeight: 600
                              }}
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare size={13} />
                              <span>WA</span>
                            </a>
                          )}

                          {/* ICS Download */}
                          <a
                            href={`/api/appointments/${row.id}/calendar.ics`}
                            download
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '5px 9px',
                              borderRadius: 7,
                              background: 'rgba(37,99,235,0.08)',
                              color: '#2563EB',
                              border: '1px solid rgba(37,99,235,0.2)',
                              textDecoration: 'none',
                              fontSize: 11.5,
                              fontWeight: 600
                            }}
                            title="Add to Calendar (.ics)"
                          >
                            <Calendar size={13} />
                            <span>.ics</span>
                          </a>

                          {/* No-Show / Follow-Up Buttons */}
                          {row.status === 'confirmed' && (
                            <button
                              onClick={() => handleMarkNoShow(row.id)}
                              style={{
                                border: '1px solid rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.08)',
                                color: '#DC2626',
                                borderRadius: 7,
                                padding: '5px 9px',
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              No-Show
                            </button>
                          )}

                          {row.status === 'completed' && (
                            <button
                              onClick={() => handleTriggerFollowUp(row.id)}
                              style={{
                                border: '1px solid rgba(201,165,106,0.4)',
                                background: 'rgba(201,165,106,0.1)',
                                color: '#B58F52',
                                borderRadius: 7,
                                padding: '5px 9px',
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Follow-Up
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteAppointment(row.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#94A3B8',
                              padding: 4,
                              borderRadius: 4
                            }}
                            title="Delete consultation"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dormant Leads Section */}
      <div className="glass-panel card-shadow" style={{ borderRadius: 20, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0A1F44', margin: '0 0 4px' }}>
              Dormant Prospects &amp; Course Inquiries
            </h2>
            <p style={{ fontSize: 12.5, color: '#64748B', margin: 0 }}>
              Re-engage past inquiries with Sarah AI automated voice outreach
            </p>
          </div>
        </div>

        {dormantLeads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8', fontSize: 13 }}>
            No dormant prospects found
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {dormantLeads.map((lead) => {
              const lastDate = lead.last_visit ? new Date(lead.last_visit) : new Date();
              const daysAgo = Math.floor((Date.now() - lastDate.getTime()) / 86400000);

              return (
                <div
                  key={lead.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #E2E8F0',
                    borderRadius: 14,
                    padding: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: getAvatarGradient(lead.name),
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12.5,
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {getInitials(lead.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0A1F44' }}>{lead.name}</div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>
                        {lead.service_history || 'Inquiry'} • <span style={{ fontWeight: 600, color: '#D97706' }}>{daysAgo} days ago</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCallDormant(lead)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(37,99,235,0.08)',
                      border: '1px solid rgba(37,99,235,0.25)',
                      color: '#2563EB',
                      padding: '7px 12px',
                      borderRadius: 9,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Phone size={13} />
                    <span>Call</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: MANUAL BOOKING */}
      {isBookingOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsBookingOpen(false); }}>
          <div
            className="animate-fade-in card-shadow"
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: 28,
              width: '100%',
              maxWidth: 540,
              border: '1px solid #E2E8F0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0A1F44', margin: 0 }}>
                  Book Consultation or Audit
                </h3>
                <span style={{ fontSize: 12, color: '#64748B' }}>Direct desk booking into Codevirus database</span>
              </div>
              <button
                onClick={() => setIsBookingOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitBooking}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 5 }}>
                    Candidate Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Verma"
                    value={bookingForm.candidate_name}
                    onChange={(e) => setBookingForm({ ...bookingForm, candidate_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 5 }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 5 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="rahul@example.com"
                    value={bookingForm.email}
                    onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 5 }}>
                    Assigned Counselor
                  </label>
                  <select
                    value={bookingForm.counselor}
                    onChange={(e) => setBookingForm({ ...bookingForm, counselor: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13, background: '#fff' }}
                  >
                    <option value="Ankit Rai (Senior Trainer)">Ankit Rai (Senior Trainer)</option>
                    <option value="Pawan Yadav (VAPT Lead)">Pawan Yadav (VAPT Lead)</option>
                    <option value="Abhishek Pal (SOC Lead)">Abhishek Pal (SOC Lead)</option>
                    <option value="Admissions Desk">Admissions Desk</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 5 }}>
                    Program / Service
                  </label>
                  <select
                    value={bookingForm.service}
                    onChange={(e) => setBookingForm({ ...bookingForm, service: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13, background: '#fff' }}
                  >
                    <option value="SOC Analyst Career Counseling">SOC Analyst Career Counseling (SIEM/Splunk)</option>
                    <option value="VAPT & Network Security Audit">VAPT &amp; Network Security Audit</option>
                    <option value="Ethical Hacking & Bug Bounty">Ethical Hacking &amp; Bug Bounty (Burp Suite)</option>
                    <option value="Cloud Security & AWS Diploma">Cloud Security &amp; AWS Diploma</option>
                    <option value="ISO 27001 Readiness Consultation">ISO 27001 Readiness Consultation</option>
                    <option value="B.Tech Summer Internship Demo">B.Tech Summer Internship Demo</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 5 }}>
                    Batch Mode
                  </label>
                  <select
                    value={bookingForm.batch_preference}
                    onChange={(e) => setBookingForm({ ...bookingForm, batch_preference: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13, background: '#fff' }}
                  >
                    <option value="Kapoorthala Offline Lab">Kapoorthala Offline Lab</option>
                    <option value="Live Online Interactive">Live Online Interactive</option>
                    <option value="Weekend Fast-Track">Weekend Fast-Track</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 5 }}>
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingForm.appointment_date}
                    onChange={(e) => setBookingForm({ ...bookingForm, appointment_date: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 5 }}>
                    Time Slot
                  </label>
                  <select
                    value={bookingForm.appointment_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, appointment_time: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13, background: '#fff' }}
                  >
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                    <option value="06:30 PM">06:30 PM</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 5 }}>
                  Notes / Objective
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kapoorthala offline demo, placement assistance"
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: '#F1F5F9',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 10,
                    background: '#2563EB',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                  }}
                >
                  {isSubmitting ? 'Confirming…' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LIVE AI TEST DIALER */}
      {isDialerOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsDialerOpen(false); }}>
          <div
            className="animate-fade-in card-shadow"
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: 28,
              width: '100%',
              maxWidth: 480,
              border: '1px solid #E2E8F0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneCall size={18} color="#00C9A7" />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0A1F44', margin: 0 }}>Live AI Test Dialer</h3>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Sarah will call your real mobile phone via Vapi</span>
                </div>
              </div>
              <button
                onClick={() => setIsDialerOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitDialer}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 5 }}>
                  Candidate / Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ansh Sharma"
                  value={dialerForm.candidate_name}
                  onChange={(e) => setDialerForm({ ...dialerForm, candidate_name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 5 }}>
                  Phone Number (with Country Code)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+919667172535"
                  value={dialerForm.phone}
                  onChange={(e) => setDialerForm({ ...dialerForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 5 }}>
                  AI Call Scenario / Persona
                </label>
                <select
                  value={dialerForm.call_type}
                  onChange={(e) => setDialerForm({ ...dialerForm, call_type: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13, background: '#fff' }}
                >
                  <option value="follow_up">Post-Consultation Follow-Up (Curriculum & Next Steps)</option>
                  <option value="no_show">Missed Session Recovery (Reschedule Consultation)</option>
                  <option value="reactivation">Dormant Lead Re-engagement (New Batch Openings)</option>
                </select>
              </div>

              <div
                style={{
                  background: 'rgba(37,99,235,0.06)',
                  border: '1px solid rgba(37,99,235,0.18)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  marginBottom: 20
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', marginBottom: 2 }}>PRO-TIP:</div>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.45 }}>
                  Keep your mobile phone nearby. After clicking "Dial My Phone", your phone will ring within 4 to 8 seconds.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsDialerOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: '#F1F5F9',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 22px',
                    borderRadius: 10,
                    background: '#0F172A',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(15,23,42,0.3)'
                  }}
                >
                  <Phone size={14} color="#00C9A7" />
                  <span>{isSubmitting ? 'Placing Call…' : 'Dial My Phone'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
