'use strict';
/**
 * Per-kundli AI answer cache (Session 57) — table kundli_ai_answers.
 * Keyed by (kundli_id int PK, question_key, lang). Used by the Ask-a-Question
 * suggestion chips + background warmer so answers return instantly.
 */

const db = require('../config/db');

async function getCached(kundliId, key, lang) {
  try {
    const row = await db('kundli_ai_answers')
      .where({ kundli_id: kundliId, question_key: key, lang })
      .first();
    return row ? { answer: row.answer, model: row.model } : null;
  } catch { return null; }
}

async function setCached(kundliId, key, lang, answer, model) {
  if (!answer) return;
  try {
    await db('kundli_ai_answers')
      .insert({ kundli_id: kundliId, question_key: key, lang, answer, model })
      .onConflict(['kundli_id', 'question_key', 'lang'])
      .merge({ answer, model, created_at: db.fn.now() });
  } catch { /* cache write is best-effort */ }
}

async function cachedKeySet(kundliId, lang) {
  try {
    const rows = await db('kundli_ai_answers')
      .where({ kundli_id: kundliId, lang })
      .select('question_key');
    return new Set(rows.map((r) => r.question_key));
  } catch { return new Set(); }
}

module.exports = { getCached, setCached, cachedKeySet };
