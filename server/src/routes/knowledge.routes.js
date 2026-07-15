'use strict';
/**
 * Knowledge routes (Stage 3).
 *  - publicRouter  (/api/knowledge)        → approved, public, multilingual reads
 *  - adminRouter   (/api/admin/knowledge)  → full CMS lifecycle (admin only)
 *
 * All user-facing text is served from the database; admin edits + approval take
 * effect immediately (the repository invalidates its cache on every write).
 */

const express = require('express');
const { authenticate, optionalAuthenticate, requireRole } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');
const repo = require('../services/knowledge/knowledge-repository');

const LANGS = new Set(['en', 'hi', 'gu', 'mr', 'ta', 'te', 'pa']);
const langOf = (req) => (LANGS.has(req.query.lang) ? req.query.lang : 'en');

// ── Public reads (approved + public only) ────────────────────────────────────
const publicRouter = express.Router();
publicRouter.use(optionalAuthenticate);

publicRouter.get('/category/:code', async (req, res) => {
  try {
    const items = await repo.getApprovedByCategory(req.params.code, langOf(req));
    return ok(res, { category: req.params.code, lang: langOf(req), items });
  } catch (e) {
    console.error('[Knowledge:category]', e.message);
    return fail(res, 'Unable to load knowledge right now.', 500);
  }
});

publicRouter.get('/item/:key', async (req, res) => {
  try {
    const item = await repo.getApproved(req.params.key, langOf(req));
    if (!item) return fail(res, 'Not found', 404);
    return ok(res, { item });
  } catch (e) {
    console.error('[Knowledge:item]', e.message);
    return fail(res, 'Unable to load knowledge right now.', 500);
  }
});

// ── Admin CMS (admin/superadmin only) ────────────────────────────────────────
const adminRouter = express.Router();
adminRouter.use(authenticate, requireRole('admin', 'superadmin'));
const who = (req) => req.user.email || `user:${req.user.id}`;

adminRouter.get('/search', async (req, res) => {
  try {
    const rows = await repo.search({
      query: req.query.q, category: req.query.category, status: req.query.status,
      tagType: req.query.tagType, tagValue: req.query.tagValue,
      limit: req.query.limit, offset: req.query.offset,
    });
    return ok(res, { results: rows, cache: repo.cacheInfo() });
  } catch (e) { console.error('[Knowledge:search]', e.message); return fail(res, 'Search failed.', 500); }
});

adminRouter.get('/item/:key', async (req, res) => {
  const item = await repo.getItem(req.params.key);
  if (!item) return fail(res, 'Not found', 404);
  return ok(res, { item });
});

adminRouter.get('/item/:key/preview', async (req, res) => {
  const preview = await repo.previewDraft(req.params.key, langOf(req));
  if (!preview) return fail(res, 'Not found', 404);
  return ok(res, { preview });
});

adminRouter.get('/item/:key/versions', async (req, res) => {
  return ok(res, { versions: await repo.listVersions(req.params.key) });
});

adminRouter.post('/', async (req, res) => {
  try {
    const item = await repo.createDraft({ ...req.body, by: who(req) });
    return ok(res, { item }, 'Draft created', 201);
  } catch (e) { return fail(res, e.message, 400); }
});

adminRouter.patch('/item/:key', async (req, res) => {
  try {
    const item = await repo.updateItem(req.params.key, { ...req.body, by: who(req) });
    return ok(res, { item }, 'Updated');
  } catch (e) { return fail(res, e.message, 400); }
});

adminRouter.post('/item/:key/clone', async (req, res) => {
  try {
    if (!req.body?.newKey) return fail(res, 'newKey is required', 400);
    const item = await repo.clone(req.params.key, req.body.newKey, who(req));
    return ok(res, { item }, 'Cloned', 201);
  } catch (e) { return fail(res, e.message, 400); }
});

adminRouter.post('/item/:key/submit',  async (req, res) => wrap(res, () => repo.submitForReview(req.params.key, who(req)), 'Submitted for review'));
adminRouter.post('/item/:key/approve', async (req, res) => wrap(res, () => repo.approve(req.params.key, who(req)), 'Approved'));
adminRouter.post('/item/:key/archive', async (req, res) => wrap(res, () => repo.archive(req.params.key, who(req)), 'Archived'));
adminRouter.post('/item/:key/rollback', async (req, res) => {
  const v = Number(req.body?.toVersion);
  if (!Number.isInteger(v) || v < 1) return fail(res, 'toVersion (integer ≥ 1) is required', 400);
  return wrap(res, () => repo.rollback(req.params.key, v, who(req)), `Rolled back to v${v}`);
});

async function wrap(res, fn, msg) {
  try { return ok(res, await fn(), msg); } catch (e) { return fail(res, e.message, 400); }
}

module.exports = { publicRouter, adminRouter };
