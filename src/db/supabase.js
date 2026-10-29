/**
 * Codevirus Security — Supabase Database Client
 */

const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_SERVICE } = require('../config');

let supabase = null;

if (SUPABASE_URL && SUPABASE_SERVICE && !SUPABASE_URL.includes('your-project')) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
      auth: { persistSession: false }
    });
  } catch (err) {
    console.warn('[db] Supabase client initialization notice:', err.message);
  }
}

module.exports = supabase;
