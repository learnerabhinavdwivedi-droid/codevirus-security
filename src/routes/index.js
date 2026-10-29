/**
 * Codevirus Security — Master Router Aggregator
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const leadRoutes = require('./leadRoutes');
const messagingRoutes = require('./messagingRoutes');
const knowledgeRoutes = require('./knowledgeRoutes');
const exportRoutes = require('./exportRoutes');
const webhookRoutes = require('./webhookRoutes');
const systemRoutes = require('./systemRoutes');

// Mount Subrouters
router.use('/api/auth', authRoutes);
router.use('/api/appointments', appointmentRoutes);
router.use('/api/export', exportRoutes);
router.use('/api', leadRoutes);
router.use('/api', messagingRoutes);
router.use('/api/knowledge', knowledgeRoutes);
router.use('/', webhookRoutes);
router.use('/', systemRoutes);

module.exports = router;
