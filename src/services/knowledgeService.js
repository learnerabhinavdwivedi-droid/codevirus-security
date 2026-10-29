/**
 * Codevirus Security — Knowledge Base Retrieval Engine
 */

const fs = require('fs');
const path = require('path');
const { ROOT_DIR } = require('../config');

const KB_DIR = path.join(ROOT_DIR, 'knowledge-base');
let kbDocuments = [];

function loadKnowledgeBase() {
  kbDocuments = [];
  if (!fs.existsSync(KB_DIR)) return;
  const files = fs.readdirSync(KB_DIR);
  for (const f of files) {
    if (f.endsWith('.md')) {
      const fullPath = path.join(KB_DIR, f);
      const text = fs.readFileSync(fullPath, 'utf8');
      kbDocuments.push({ file: f, title: f.replace('.md', ''), content: text });
    }
  }
}

// Initial load
loadKnowledgeBase();

function searchKnowledgeBase(query) {
  if (!query || typeof query !== 'string') {
    return { status: 'not_found', message: 'Empty query' };
  }

  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scored = kbDocuments
    .map((doc) => {
      let score = 0;
      const lowerContent = doc.content.toLowerCase();
      for (const t of tokens) {
        const regex = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const count = (lowerContent.match(regex) || []).length;
        score += count;
      }
      return { doc, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    return {
      status: 'not_found',
      message: 'No exact verified record in knowledge base. Deferring to admissions counselor demo session.'
    };
  }

  const bestDoc = scored[0].doc;
  const paragraphs = bestDoc.content.split('\n\n');
  const matchingParagraph =
    paragraphs.find((p) => {
      const lp = p.toLowerCase();
      return tokens.some((t) => lp.includes(t));
    }) || paragraphs[0];

  return {
    status: 'found',
    source: bestDoc.file,
    summary: matchingParagraph.trim()
  };
}

module.exports = {
  loadKnowledgeBase,
  searchKnowledgeBase
};
