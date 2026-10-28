/**
 * Codevirus Security — Local Fallback Store
 * Ensures 100% functionality even when external Supabase project is paused or offline.
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR     = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const APPT_FILE    = path.join(DATA_DIR, 'appointments.json');
const DORM_FILE    = path.join(DATA_DIR, 'dormant.json');
const MSG_FILE     = path.join(DATA_DIR, 'messages.json');
const LEADS_FILE   = path.join(DATA_DIR, 'leads.json');
const ACT_FILE     = path.join(DATA_DIR, 'activity.json');

function getTodayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function getDefaultAppointments() {
  const today = getTodayIST();
  return [
    {
      id: 'appt-1',
      patient_name: 'Aarav Sharma',
      phone: '+919667172535',
      service: 'SOC Analyst Career Counseling',
      appointment_date: today,
      appointment_time: '10:00 AM',
      status: 'completed',
      source: 'sarah',
      notes: 'Interested in placement guarantee & SIEM labs',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'appt-2',
      patient_name: 'Priya Tiwari',
      phone: '+919667172535',
      service: 'VAPT & Network Security Audit',
      appointment_date: today,
      appointment_time: '2:00 PM',
      status: 'confirmed',
      source: 'sarah',
      notes: 'Enterprise web app pentesting scope',
      created_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'appt-3',
      patient_name: 'Siddharth Dubey',
      phone: '+919839012345',
      service: 'Ethical Hacking & Bug Bounty',
      appointment_date: today,
      appointment_time: '4:30 PM',
      status: 'confirmed',
      source: 'front-desk',
      notes: 'Kapoorthala offline batch inquiry',
      created_at: new Date().toISOString()
    }
  ];
}

function getDefaultDormant() {
  return [
    {
      id: 'dorm-1',
      name: 'Vikram Pratap Singh',
      phone: '+919876543210',
      last_visit: '2025-11-15',
      service_history: 'Enterprise VAPT & ISO 27001 Inquiry',
      reactivation_status: 'pending'
    },
    {
      id: 'dorm-2',
      name: 'Neha Verma',
      phone: '+919812345678',
      last_visit: '2025-10-20',
      service_history: 'SOC Analyst & SIEM Training Demo',
      reactivation_status: 'pending'
    },
    {
      id: 'dorm-3',
      name: 'Rohan Malhotra',
      phone: '+919711223344',
      last_visit: '2025-12-01',
      service_history: 'Cloud Security (AWS) Diploma Inquiry',
      reactivation_status: 'pending'
    }
  ];
}

function getDefaultActivity() {
  return [
    { id: 'act-1', type: 'call_completed', title: 'Outbound Follow-Up Completed', detail: 'Aarav Sharma (+919667172535) — SOC Analyst', time: '10 mins ago', tone: 'green' },
    { id: 'act-2', type: 'lead_booked', title: 'Consultation Confirmed', detail: 'Priya Tiwari — VAPT & Network Security Audit (2:00 PM)', time: '30 mins ago', tone: 'blue' },
    { id: 'act-3', type: 'lead_inquiry', title: 'WhatsApp Lead Captured', detail: 'New inquiry for Ethical Hacking Diploma', time: '1 hour ago', tone: 'gold' }
  ];
}

function readJSON(file, fallbackFn) {
  if (fs.existsSync(file)) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
  }
  const init = fallbackFn();
  fs.writeFileSync(file, JSON.stringify(init, null, 2), 'utf8');
  return init;
}

function writeJSON(file, data) {
  try {
    const tmp = `${file}.tmp.${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    try {
      fs.renameSync(tmp, file);
    } catch {
      fs.copyFileSync(tmp, file);
      try { fs.unlinkSync(tmp); } catch {}
    }
  } catch (err) {
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    } catch (fallbackErr) {
      console.error(`[store] Error writing ${file}:`, fallbackErr.message);
    }
  }
}

const store = {
  getAppointments() {
    return readJSON(APPT_FILE, getDefaultAppointments);
  },

  setAppointments(list) {
    writeJSON(APPT_FILE, list);
  },

  addAppointment(appt) {
    const list = store.getAppointments();
    const candidateName = appt.candidate_name || appt.patient_name || 'Prospective Candidate';
    const newRow = {
      id: appt.id || 'appt-' + Date.now(),
      patient_name: candidateName,
      candidate_name: candidateName,
      phone: appt.phone || null,
      email: appt.email || null,
      service: appt.service || 'Cybersecurity Career Counseling',
      appointment_date: appt.appointment_date || getTodayIST(),
      appointment_time: appt.appointment_time || 'TBD',
      status: appt.status || 'confirmed',
      source: appt.source || 'sarah',
      counselor: appt.counselor || 'Ankit Rai (Senior Trainer)',
      batch_preference: appt.batch_preference || 'Kapoorthala Offline Lab',
      notes: appt.notes || null,
      created_at: appt.created_at || new Date().toISOString()
    };
    list.push(newRow);
    writeJSON(APPT_FILE, list);

    store.addActivity({
      type: 'lead_booked',
      title: 'Consultation Scheduled',
      detail: `${newRow.candidate_name} — ${newRow.service} (${newRow.appointment_time})`,
      tone: 'blue'
    });

    return newRow;
  },

  updateAppointmentStatus(id, status) {
    const list = store.getAppointments();
    const row = list.find(r => r.id === id);
    if (row) {
      row.status = status;
      writeJSON(APPT_FILE, list);
      return row;
    }
    return null;
  },

  getDormant() {
    return readJSON(DORM_FILE, getDefaultDormant);
  },

  setDormant(list) {
    writeJSON(DORM_FILE, list);
  },

  updateDormantStatus(id, status) {
    const list = store.getDormant();
    const row = list.find(r => r.id === id);
    if (row) {
      row.reactivation_status = status;
      writeJSON(DORM_FILE, list);
      return row;
    }
    return null;
  },

  getMessages() {
    return readJSON(MSG_FILE, () => []);
  },

  addMessage(msg) {
    const list = store.getMessages();
    const newMsg = {
      id: 'msg-' + Date.now(),
      chat_id: msg.chat_id || '+91 96487 77706',
      sender: msg.sender || 'business',
      text: msg.text,
      is_lead: Boolean(msg.is_lead),
      processed: Boolean(msg.processed),
      created_at: new Date().toISOString()
    };
    list.push(newMsg);
    writeJSON(MSG_FILE, list);
    return newMsg;
  },

  getUnprocessedLeadMessages() {
    const list = store.getMessages();
    return list.filter(m => m.is_lead && !m.processed);
  },

  markMessageProcessed(id) {
    const list = store.getMessages();
    const m = list.find(x => x.id === id);
    if (m) {
      m.processed = true;
      writeJSON(MSG_FILE, list);
    }
  },

  getLeads() {
    return readJSON(LEADS_FILE, () => []);
  },

  addLead(lead) {
    const list = store.getLeads();
    const newLead = {
      id: 'lead-' + Date.now(),
      message_id: lead.message_id || null,
      name: lead.name || 'Prospective Lead',
      phone: lead.phone,
      treatment: lead.treatment || 'Cybersecurity Inquiry',
      notes: lead.notes || null,
      processed: false,
      created_at: new Date().toISOString()
    };
    list.push(newLead);
    writeJSON(LEADS_FILE, list);

    store.addActivity({
      type: 'lead_inquiry',
      title: 'WhatsApp Lead Extracted',
      detail: `${newLead.name} (${newLead.phone}) — ${newLead.treatment}`,
      tone: 'gold'
    });

    return newLead;
  },

  getUnprocessedLeads() {
    const list = store.getLeads();
    return list.filter(l => !l.processed);
  },

  markLeadProcessed(id) {
    const list = store.getLeads();
    const l = list.find(x => x.id === id);
    if (l) {
      l.processed = true;
      writeJSON(LEADS_FILE, list);
    }
  },

  getActivity() {
    return readJSON(ACT_FILE, getDefaultActivity);
  },

  addActivity(act) {
    const list = store.getActivity();
    const item = {
      id: 'act-' + Date.now(),
      type: act.type || 'info',
      title: act.title,
      detail: act.detail,
      time: 'Just now',
      tone: act.tone || 'blue',
      created_at: new Date().toISOString()
    };
    list.unshift(item);
    if (list.length > 20) list.pop();
    writeJSON(ACT_FILE, list);
    return item;
  },

  exportConsultationsCSV() {
    const list = store.getAppointments();
    const headers = [
      'ID',
      'Candidate / Client Name',
      'Phone Number',
      'Email',
      'Track / Service',
      'Date',
      'Time',
      'Status',
      'Source',
      'Counselor',
      'Batch Preference',
      'Notes',
      'Created At'
    ];
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };
    const rows = list.map(r => [
      escapeCSV(r.id),
      escapeCSV(r.candidate_name || r.patient_name || ''),
      escapeCSV(r.phone || ''),
      escapeCSV(r.email || ''),
      escapeCSV(r.service || ''),
      escapeCSV(r.appointment_date || ''),
      escapeCSV(r.appointment_time || ''),
      escapeCSV(r.status || ''),
      escapeCSV(r.source || ''),
      escapeCSV(r.counselor || 'Ankit Rai (Senior Trainer)'),
      escapeCSV(r.batch_preference || 'Kapoorthala Offline Lab'),
      escapeCSV(r.notes || ''),
      escapeCSV(r.created_at || '')
    ].join(','));
    return [headers.join(','), ...rows].join('\r\n');
  },

  exportLeadsCSV() {
    const list = store.getLeads();
    const headers = ['ID', 'Candidate Name', 'Phone Number', 'Inquiry / Track', 'Notes', 'Processed', 'Created At'];
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };
    const rows = list.map(l => [
      escapeCSV(l.id),
      escapeCSV(l.name || ''),
      escapeCSV(l.phone || ''),
      escapeCSV(l.treatment || ''),
      escapeCSV(l.notes || ''),
      escapeCSV(l.processed ? 'Yes' : 'No'),
      escapeCSV(l.created_at || '')
    ].join(','));
    return [headers.join(','), ...rows].join('\r\n');
  },

  generateICS(appt) {
    const id = appt.id || 'codevirus-' + Date.now();
    const title = `${appt.service || 'Cybersecurity Consultation'} - ${appt.candidate_name || appt.patient_name || 'Candidate'}`;
    const dateStr = (appt.appointment_date || getTodayIST()).replace(/-/g, '');
    
    // Parse time like "2:00 PM" into hours and minutes
    let hour = 11, minute = 0;
    const timeMatch = (appt.appointment_time || '').match(/(\d+):?(\d*)\s*(AM|PM)?/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : 'AM';
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      hour = h;
      minute = m;
    }
    
    const pad = (n) => String(n).padStart(2, '0');
    const startTimeStr = `${pad(hour)}${pad(minute)}00`;
    // 45 minute duration
    let endHour = hour;
    let endMinute = minute + 45;
    if (endMinute >= 60) {
      endHour += 1;
      endMinute -= 60;
    }
    const endTimeStr = `${pad(endHour)}${pad(endMinute)}00`;
    const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const counselor = appt.counselor || 'Ankit Rai (Senior Trainer)';
    const batch = appt.batch_preference || 'Kapoorthala Offline Lab';
    const notes = appt.notes ? `\\nNotes: ${appt.notes}` : '';
    const phone = appt.phone ? `\\nContact: ${appt.phone}` : '';

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Codevirus Security//AI Operations Suite//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${id}@codevirus.in`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;TZID=Asia/Kolkata:${dateStr}T${startTimeStr}`,
      `DTEND;TZID=Asia/Kolkata:${dateStr}T${endTimeStr}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:Codevirus Security & Academy Consultation\\nCounselor: ${counselor}\\nBatch: ${batch}${phone}${notes}`,
      'LOCATION:Codevirus Security & Academy\\, Kapoorthala\\, Aliganj\\, Lucknow\\, UP 226024',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  },

  resetDemo() {
    writeJSON(APPT_FILE, getDefaultAppointments());
    writeJSON(DORM_FILE, getDefaultDormant());
    writeJSON(MSG_FILE, []);
    writeJSON(LEADS_FILE, []);
    writeJSON(ACT_FILE, getDefaultActivity());
  }
};

module.exports = store;
