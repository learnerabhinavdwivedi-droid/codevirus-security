/**
 * Codevirus Security — Appointments & Consultations Routes
 */

const express = require('express');
const router = express.Router();
const {
  getAllAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment
} = require('../services/appointmentService');
const store = require('../db/localStore');
const { requireAdminAuth } = require('../middleware/auth');
const { exportLimiter } = require('../middleware/security');

// 1. Get all appointments
router.get('/', async (_req, res) => {
  const data = await getAllAppointments();
  res.json(data);
});

// 2. Book consultation
router.post('/', async (req, res) => {
  const {
    patient_name,
    candidate_name,
    phone,
    service,
    appointment_date,
    appointment_time,
    notes,
    status,
    source,
    force
  } = req.body;

  const clientName = patient_name || candidate_name;
  if (!clientName || !service) {
    return res.status(400).json({ error: 'patient_name (or candidate_name) and service are required' });
  }

  const result = await createAppointment(
    {
      patient_name: clientName,
      phone,
      service,
      appointment_date,
      appointment_time,
      notes,
      status,
      source
    },
    force === true
  );

  if (result.conflict) {
    return res.status(409).json(result);
  }

  res.json(result);
});

// 3. Update appointment status (Supports POST, PATCH, PUT)
const handleStatusUpdate = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });

  const updated = await updateAppointmentStatus(id, status);
  res.json({ success: true, id, status, appointment: updated });
};

router.post('/:id/status', handleStatusUpdate);
router.patch('/:id', handleStatusUpdate);
router.put('/:id', handleStatusUpdate);

// 4. Delete appointment
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await deleteAppointment(id);
  res.json({ success: true, id });
});

// 5. Generate ICS Calendar Invite
router.get('/:id/calendar.ics', (req, res) => {
  const appts = store.getAppointments();
  const found = appts.find((a) => a.id === req.params.id);
  if (!found) return res.status(404).send('Consultation not found');

  const ics = store.generateICS(found);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="codevirus-consultation-${req.params.id}.ics"`);
  res.send(ics);
});

module.exports = router;
