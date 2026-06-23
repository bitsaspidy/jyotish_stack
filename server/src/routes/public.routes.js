'use strict';
const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const db = require('../config/db');
const { ok, fail } = require('../utils/response');
const { sendEmail, departmentInbox, DEPARTMENTS, DEPT_LABELS } = require('../services/email.service');

const VALID_DEPARTMENTS = ['sales', 'team', 'account', 'general'];

// ─── Blog ─────────────────────────────────────────────────────────────────────

// GET /api/public/blog — published posts, paginated
router.get('/blog', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(24, parseInt(req.query.limit) || 9);
    const offset = (page - 1) * limit;
    const { category, search } = req.query;

    let q = db('blog_posts as p')
      .leftJoin('blog_categories as c', 'p.category_id', 'c.id')
      .where('p.status', 'published');

    if (category) q = q.where('c.slug', category);
    if (search)   q = q.where(function() {
      this.whereILike('p.title', `%${search}%`).orWhereILike('p.excerpt', `%${search}%`);
    });

    const [{ count }, posts] = await Promise.all([
      q.clone().count('p.id as count').first(),
      q.clone()
        .select(
          'p.id', 'p.title', 'p.slug', 'p.excerpt', 'p.cover_image',
          'p.author', 'p.tags', 'p.view_count', 'p.published_at',
          'c.name as category_name', 'c.slug as category_slug', 'c.color as category_color'
        )
        .orderBy('p.published_at', 'desc')
        .limit(limit).offset(offset),
    ]);

    const total = Number(count);
    return ok(res, { posts, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } });
  } catch (e) {
    console.error('[public/blog]', e.message);
    return fail(res, 'Failed to load blog', 500);
  }
});

// GET /api/public/blog/categories
router.get('/blog-categories', async (_req, res) => {
  try {
    const cats = await db('blog_categories').select('id', 'name', 'slug', 'color').orderBy('name');
    return ok(res, { categories: cats });
  } catch (e) {
    return fail(res, 'Failed to load categories', 500);
  }
});

// GET /api/public/blog/:slug — single post (also bumps view_count)
router.get('/blog/:slug', async (req, res) => {
  try {
    const post = await db('blog_posts as p')
      .leftJoin('blog_categories as c', 'p.category_id', 'c.id')
      .where({ 'p.slug': req.params.slug, 'p.status': 'published' })
      .select('p.*', 'c.name as category_name', 'c.slug as category_slug', 'c.color as category_color')
      .first();
    if (!post) return fail(res, 'Post not found', 404);

    db('blog_posts').where({ id: post.id }).increment('view_count', 1).catch(() => {});
    return ok(res, { post });
  } catch (e) {
    return fail(res, 'Failed to load post', 500);
  }
});

// ─── Testimonials ─────────────────────────────────────────────────────────────

router.get('/testimonials', async (_req, res) => {
  try {
    const testimonials = await db('testimonials')
      .where({ is_featured: true })
      .orderBy([{ column: 'sort_order', order: 'asc' }, { column: 'created_at', order: 'desc' }])
      .select('id', 'name', 'role', 'location', 'content', 'rating', 'avatar');
    return ok(res, { testimonials });
  } catch (e) {
    return fail(res, 'Failed to load testimonials', 500);
  }
});

// ─── Team ─────────────────────────────────────────────────────────────────────

router.get('/team', async (_req, res) => {
  try {
    const team = await db('team_members')
      .where({ is_active: true })
      .orderBy([{ column: 'sort_order', order: 'asc' }, { column: 'created_at', order: 'asc' }])
      .select('id', 'name', 'role', 'bio', 'avatar', 'linkedin', 'twitter');
    return ok(res, { team });
  } catch (e) {
    return fail(res, 'Failed to load team', 500);
  }
});

// ─── Contact form ─────────────────────────────────────────────────────────────

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  message: { success: false, message: 'Too many messages. Please try again in an hour.' },
  standardHeaders: true, legacyHeaders: false,
});

router.post('/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return fail(res, 'Name, email and message are required', 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(res, 'Please enter a valid email address', 400);
    }
    if (message.trim().length < 10) {
      return fail(res, 'Message must be at least 10 characters', 400);
    }

    const department = VALID_DEPARTMENTS.includes(req.body.department) ? req.body.department : 'general';
    const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();

    const cleaned = {
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      phone:   phone?.trim()   || null,
      subject: subject?.trim() || 'General Inquiry',
      message: message.trim(),
    };

    await db('inquiries').insert({
      ...cleaned,
      department,
      status:  'new',
      source:  'website',
      ip_address: ip || null,
    });

    // Route email to the right mailbox (sales@ / team@ / account@). Non-fatal — the
    // inquiry is already stored, so a mail failure must not fail the request.
    const inbox = departmentInbox(department);                  // 'sales' | 'team' | 'account'
    const label = DEPT_LABELS[department] || 'Support';
    const inboxAddress = DEPARTMENTS[inbox]?.address;

    if (inboxAddress) {
      // 1) Notify the internal department inbox, with Reply-To set to the customer
      sendEmail({
        to: inboxAddress, template: 'contact_notify', from: inbox,
        replyTo: cleaned.email,
        data: { ...cleaned, departmentLabel: label },
      }).catch(() => {});
      // 2) Acknowledge the customer, sent from that department mailbox
      sendEmail({
        to: cleaned.email, template: 'contact_ack', from: inbox,
        data: { name: cleaned.name, message: cleaned.message, departmentLabel: label },
      }).catch(() => {});
    }

    return ok(res, {}, 'Message sent! We\'ll get back to you soon.');
  } catch (e) {
    console.error('[public/contact]', e.message);
    return fail(res, 'Failed to send message. Please try again.', 500);
  }
});

// ─── Mantras ──────────────────────────────────────────────────────────────────

// GET /api/public/mantras — active mantras, optionally filtered by category
router.get('/mantras', async (req, res) => {
  try {
    const { category } = req.query;
    let q = db('mantras').where('is_active', true).orderBy('display_order');
    if (category) q = q.where('category', category);
    const rows = await q;
    return ok(res, { mantras: rows });
  } catch (e) {
    console.error('[public/mantras]', e.message);
    return fail(res, 'Failed to load mantras', 500);
  }
});

module.exports = router;
