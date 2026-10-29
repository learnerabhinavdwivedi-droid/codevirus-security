/**
 * Codevirus Security — Knowledge Base Search Route
 */

const express = require('express');
const router = express.Router();
const { searchKnowledgeBase } = require('../services/knowledgeService');

router.get('/search', (req, res) => {
  const query = req.query.q || req.query.query;
  const result = searchKnowledgeBase(query);
  res.json(result);
});

module.exports = router;
