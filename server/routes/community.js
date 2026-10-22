// Community: students ask questions by topic (with tags) and answer each other.
//
// GET  ?id=7                         → one thread with its replies
// GET  ?topic=&tag=&status=&q=&page= → thread list (newest activity first) + popular tags
// POST { action: 'thread', topic, title, body, tags, questionId }
// POST { action: 'reply', threadId, body }
// POST { action: 'resolve', threadId, resolved, replyId? }  → only the thread's author
// POST { action: 'delete', kind: 'thread' | 'reply', id, password } → admin only
//
// Posting needs a student profile (the campus_player cookie). Deleting needs
// the admin password, kept only in the host's environment (ADMIN_PASSWORD).
import { route } from '../route.js';
import { json, clean, readJSON, query, iso, BadRequest } from '../http.js';
import { resolvePlayerId, rollText } from './profile.js';
import { requireAdmin } from '../admin.js';

export const LIMITS = { title: 140, body: 2000, reply: 1500, tags: 5, tag: 24, page: 20 };
const TOPIC_RE = /^[a-z0-9-]{2,40}$/;
const QUESTION_RE = /^[\w-]{1,60}$/;

/** Keeps line breaks (up to two in a row); removes markup characters. */
export function cleanText(value, max) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[<>\u0000-\u0009\u000b-\u001f]/g, '')
    .split('\n').map(line => line.replace(/\s+/g, ' ').trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

export function cleanTags(value) {
  const list = Array.isArray(value) ? value : String(value ?? '').split(/[,#]/);
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const tag = clean(String(raw).replace(/[#,"'`]/g, ''), LIMITS.tag).toLowerCase();
    if (tag.length < 2 || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length === LIMITS.tags) break;
  }
  return out;
}

const author = r => ({ tag: `${r.author_name}.${rollText(r.author_roll)}`, avatar: r.author_avatar || '🚂' });

function threadView(r, me, full = false) {
  return {
    id: Number(r.id),
    topic: r.topic,
    title: r.title,
    body: full ? r.body : r.body.length > 180 ? `${r.body.slice(0, 180)}…` : r.body,
    tags: r.tags || [],
    questionId: r.question_id || null,
    resolved: r.resolved,
    solutionId: r.solution_id === null ? null : Number(r.solution_id),
    replies: r.replies,
    author: author(r),
    mine: !!me && r.author_id === me,
    createdAt: iso(r.created_at),
    activeAt: iso(r.active_at),
  };
}

const THREAD_COLUMNS = `t.id, t.author_id, t.topic, t.title, t.body, t.tags, t.question_id, t.resolved, t.solution_id, t.replies,
  t.created_at, t.active_at, s.name AS author_name, s.roll AS author_roll, s.avatar AS author_avatar`;

async function me(request, db, body = {}) {
  const id = resolvePlayerId(request, body.playerId);
  if (!id) return '';
  const rows = await db.query('SELECT id FROM students WHERE id = $1', [id]);
  return rows[0]?.id || '';
}

async function requireStudent(request, db, body) {
  const id = await me(request, db, body);
  if (!id) throw new BadRequest('প্রশ্ন বা উত্তর দিতে আগে তোমার নাম ও roll দাও।', 401, { code: 'need_profile' });
  return id;
}

async function rateLimit(db, sql, id, max, message) {
  const [row] = await db.query(sql, [id]);
  if (row.n >= max) throw new BadRequest(message, 429);
}

const toId = v => (/^\d{1,15}$/.test(String(v ?? '')) ? Number(v) : 0);


async function getThread(db, id, viewer) {
  const [[t], replies] = await db.batch([
    [`SELECT ${THREAD_COLUMNS} FROM threads t JOIN students s ON s.id = t.author_id WHERE t.id = $1`, [id]],
    [`SELECT r.id, r.author_id, r.body, r.created_at, s.name AS author_name, s.roll AS author_roll, s.avatar AS author_avatar
      FROM replies r JOIN students s ON s.id = r.author_id WHERE r.thread_id = $1 ORDER BY r.id LIMIT 300`, [id]],
  ]);
  if (!t) return null;
  return {
    ...threadView(t, viewer, true),
    replyList: replies.map(r => ({
      id: Number(r.id),
      body: r.body,
      author: author(r),
      mine: !!viewer && r.author_id === viewer,
      createdAt: iso(r.created_at),
    })),
  };
}

export default route('community', {
  async GET(request, db) {
    const q = query(request);
    const viewer = await me(request, db);
    const id = toId(q.id);
    if (q.id !== undefined) {
      const thread = id ? await getThread(db, id, viewer) : null;
      return thread ? json({ ok: true, thread }) : json({ ok: false, error: 'এই আলোচনাটি পাওয়া যায়নি—হয়তো মুছে ফেলা হয়েছে।' }, 404);
    }
    const topic = TOPIC_RE.test(q.topic || '') ? q.topic : '';
    const tag = cleanTags([q.tag || ''])[0] || '';
    const status = ['open', 'resolved'].includes(q.status) ? q.status : '';
    const search = clean(q.q, 60).replace(/[\\%_]/g, c => `\\${c}`);
    const page = Math.min(50, Math.max(0, Number.parseInt(q.page, 10) || 0));
    const [rows, tags] = await db.batch([
      [`SELECT ${THREAD_COLUMNS} FROM threads t JOIN students s ON s.id = t.author_id
        WHERE ($1 = '' OR t.topic = $1)
          AND ($2 = '' OR t.tags @> jsonb_build_array($2::text))
          AND ($3 = '' OR t.resolved = ($3 = 'resolved'))
          AND ($4 = '' OR t.title ILIKE '%' || $4 || '%' OR t.body ILIKE '%' || $4 || '%')
        ORDER BY t.active_at DESC, t.id DESC LIMIT $5 OFFSET $6`,
        [topic, tag, status, search, LIMITS.page + 1, page * LIMITS.page]],
      [`SELECT tag, count(*)::int AS n FROM (SELECT jsonb_array_elements_text(tags) AS tag FROM threads ORDER BY active_at DESC LIMIT 300) x
        GROUP BY tag ORDER BY n DESC, tag LIMIT 12`],
    ]);
    return json({
      ok: true,
      threads: rows.slice(0, LIMITS.page).map(r => threadView(r, viewer)),
      more: rows.length > LIMITS.page,
      tags: tags.map(t => ({ tag: t.tag, count: t.n })),
    });
  },

  async POST(request, db, env) {
    const body = await readJSON(request, 20_000);
    switch (body.action) {
      case 'thread': {
        const author = await requireStudent(request, db, body);
        const topic = TOPIC_RE.test(String(body.topic || '')) ? body.topic : '';
        if (!topic) throw new BadRequest('একটি topic বেছে নাও।');
        const title = cleanText(body.title, LIMITS.title).replace(/\n/g, ' ');
        if (title.length < 8) throw new BadRequest('প্রশ্নটা একটু বিস্তারিত লেখো (কমপক্ষে ৮ অক্ষর)।');
        const text = cleanText(body.body, LIMITS.body);
        const questionId = QUESTION_RE.test(String(body.questionId || '')) ? body.questionId : null;
        await rateLimit(db, "SELECT count(*)::int AS n FROM threads WHERE author_id = $1 AND created_at > now() - interval '10 minutes'",
          author, 3, 'অল্প সময়ে অনেক প্রশ্ন হয়ে গেছে—কয়েক মিনিট পরে আবার চেষ্টা করো।');
        const [row] = await db.query(
          'INSERT INTO threads (author_id, topic, title, body, tags, question_id) VALUES ($1, $2, $3, $4, $5::jsonb, $6) RETURNING id',
          [author, topic, title, text, cleanTags(body.tags), questionId],
        );
        return json({ ok: true, thread: await getThread(db, Number(row.id), author) }, 201);
      }

      case 'reply': {
        const author = await requireStudent(request, db, body);
        const threadId = toId(body.threadId);
        const text = cleanText(body.body, LIMITS.reply);
        if (text.length < 2) throw new BadRequest('উত্তরটা লেখো।');
        await rateLimit(db, "SELECT count(*)::int AS n FROM replies WHERE author_id = $1 AND created_at > now() - interval '2 minutes'",
          author, 6, 'একটু ধীরে—এক মিনিট পরে আবার উত্তর দাও।');
        const [, [updated]] = await db.batch([
          [`INSERT INTO replies (thread_id, author_id, body) SELECT id, $2::uuid, $3::text FROM threads WHERE id = $1`, [threadId, author, text]],
          ['UPDATE threads SET replies = (SELECT count(*) FROM replies WHERE thread_id = $1), active_at = now() WHERE id = $1 RETURNING id', [threadId]],
        ]);
        if (!updated) throw new BadRequest('এই আলোচনাটি আর নেই।', 404);
        return json({ ok: true, thread: await getThread(db, threadId, author) }, 201);
      }

      case 'resolve': {
        const author = await requireStudent(request, db, body);
        const threadId = toId(body.threadId);
        const replyId = body.resolved ? toId(body.replyId) || null : null;
        const [row] = await db.query(
          `UPDATE threads SET resolved = $3::boolean,
             solution_id = (SELECT id FROM replies WHERE id = $4::bigint AND thread_id = $1)
           WHERE id = $1 AND author_id = $2 RETURNING id`,
          [threadId, author, !!body.resolved, replyId],
        );
        if (!row) throw new BadRequest('শুধু প্রশ্নকারী নিজে "সমাধান হয়েছে" চিহ্ন দিতে পারে।', 403);
        return json({ ok: true, thread: await getThread(db, threadId, author) });
      }

      case 'delete': {
        await requireAdmin(body.password, env);
        const id = toId(body.id);
        if (body.kind === 'thread') {
          await db.query('DELETE FROM threads WHERE id = $1', [id]);
          return json({ ok: true });
        }
        if (body.kind === 'reply') {
          const [gone] = await db.query('DELETE FROM replies WHERE id = $1 RETURNING thread_id', [id]);
          if (gone) {
            await db.query(
              `UPDATE threads SET replies = (SELECT count(*) FROM replies WHERE thread_id = $1),
                 solution_id = CASE WHEN solution_id = $2::bigint THEN NULL ELSE solution_id END
               WHERE id = $1`,
              [gone.thread_id, id],
            );
          }
          return json({ ok: true, threadId: gone ? Number(gone.thread_id) : null });
        }
        throw new BadRequest('Unknown item.');
      }

      default:
        throw new BadRequest('Unknown action.');
    }
  },
}, 'Community-তে এই মুহূর্তে সমস্যা হচ্ছে—একটু পরে আবার চেষ্টা করো।');
