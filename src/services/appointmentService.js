/**
 * Codevirus Security — Appointment & Consultation Service
 */

const supabase = require('../db/supabase');
const store = require('../db/localStore');
const { OFFICE_HOURS } = require('../config/constants');

function getTodayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function parseTimeToMinutes(timeStr) {
  const t = (timeStr || '').trim().toUpperCase();
  const m12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
  let h, min;
  if (m12) {
    h = parseInt(m12[1], 10);
    min = parseInt(m12[2], 10);
    if (m12[3] === 'PM' && h !== 12) h += 12;
    if (m12[3] === 'AM' && h === 12) h = 0;
  } else if (m24) {
    h = parseInt(m24[1], 10);
    min = parseInt(m24[2], 10);
  } else {
    return null;
  }
  return h * 60 + min;
}

function minutesToHHMM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addDaysISO(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

async function getOccupiedMinutes(date) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('appointment_date', date);
      if (!error && Array.isArray(data)) {
        return data
          .map((r) => parseTimeToMinutes(r.appointment_time))
          .filter((m) => m !== null);
      }
    } catch {
      // Fallback to local store
    }
  }

  const localRows = store.getAppointments().filter((r) => r.appointment_date === date);
  return localRows
    .map((r) => parseTimeToMinutes(r.appointment_time))
    .filter((m) => m !== null);
}

const overlaps = (startMin, occupied) =>
  occupied.some(
    (occStart) =>
      startMin < occStart + OFFICE_HOURS.SLOT_MINUTES &&
      occStart < startMin + OFFICE_HOURS.SLOT_MINUTES
  );

async function findSlotConflict(date, timeStr) {
  const requestedMin = parseTimeToMinutes(timeStr);
  if (requestedMin === null) return { taken: false, nextAvailable: [] };

  const occupied = await getOccupiedMinutes(date);

  if (!overlaps(requestedMin, occupied)) return { taken: false, nextAvailable: [] };

  const alternatives = [];
  for (
    let m = requestedMin + OFFICE_HOURS.SLOT_MINUTES;
    m <= OFFICE_HOURS.CLOSE_MINUTES - OFFICE_HOURS.SLOT_MINUTES && alternatives.length < 2;
    m += OFFICE_HOURS.SLOT_MINUTES
  ) {
    if (!overlaps(m, occupied)) alternatives.push(minutesToHHMM(m));
  }

  for (let daysAhead = 1; alternatives.length < 2 && daysAhead <= 14; daysAhead++) {
    const nextDate = addDaysISO(date, daysAhead);
    const nextOccupied = await getOccupiedMinutes(nextDate);
    for (
      let m = OFFICE_HOURS.OPEN_MINUTES;
      m <= OFFICE_HOURS.CLOSE_MINUTES - OFFICE_HOURS.SLOT_MINUTES && alternatives.length < 2;
      m += OFFICE_HOURS.SLOT_MINUTES
    ) {
      if (!overlaps(m, nextOccupied)) alternatives.push(`${minutesToHHMM(m)} (${nextDate})`);
    }
  }

  return { taken: true, nextAvailable: alternatives };
}

async function getAllAppointments() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        store.setAppointments(data);
        return data;
      }
    } catch {
      // Fallback to local store
    }
  }
  return store.getAppointments();
}

async function createAppointment(payload, force = false) {
  const bookingDate = payload.appointment_date || getTodayIST();
  const bookingTime = payload.appointment_time || '11:00 AM';

  if (!force) {
    const conflict = await findSlotConflict(bookingDate, bookingTime);
    if (conflict.taken) {
      return {
        conflict: true,
        error: `Slot ${bookingTime} on ${bookingDate} is already reserved.`,
        nextAvailable: conflict.nextAvailable
      };
    }
  }

  const record = {
    patient_name: payload.patient_name || payload.candidate_name,
    phone: payload.phone || null,
    service: payload.service,
    appointment_date: bookingDate,
    appointment_time: bookingTime,
    status: payload.status || 'confirmed',
    source: payload.source || 'staff-dashboard',
    notes: payload.notes || null
  };

  const saved = store.addAppointment(record);

  if (supabase) {
    try {
      await supabase.from('appointments').insert([record]);
    } catch (err) {
      console.warn('[appointments] Supabase insert warning:', err.message);
    }
  }

  return { success: true, appointment: saved };
}

async function updateAppointmentStatus(id, status) {
  const updated = store.updateAppointmentStatus(id, status);
  if (supabase) {
    try {
      await supabase.from('appointments').update({ status }).eq('id', id);
    } catch (err) {
      console.warn('[appointments] Supabase status update warning:', err.message);
    }
  }
  return updated;
}

async function deleteAppointment(id) {
  const list = store.getAppointments().filter((r) => r.id !== id);
  store.setAppointments(list);
  if (supabase) {
    try {
      await supabase.from('appointments').delete().eq('id', id);
    } catch (err) {
      console.warn('[appointments] Supabase delete warning:', err.message);
    }
  }
  return true;
}

module.exports = {
  getTodayIST,
  parseTimeToMinutes,
  minutesToHHMM,
  addDaysISO,
  findSlotConflict,
  getAllAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment
};
