cat << 'EOF' > /root/qie-yap-backend/server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

const pool = new Pool({
  user: 'qie_admin',
  host: 'localhost',
  database: 'qie_yap_db',
  password: 'qie123',
  port: 5432,
});

// ============================================
// 1. ADMIN & TABLES
// ============================================
app.post('/api/admin/create-tables', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        address TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        bio TEXT,
        avatar_seed TEXT,
        is_validator BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        author_id UUID NOT NULL,
        content TEXT NOT NULL,
        media_url TEXT,
        link_preview JSONB,
        is_super_yap BOOLEAN DEFAULT false,
        is_boosted BOOLEAN DEFAULT false,
        boost_expires_at TIMESTAMPTZ,
        tx_hash TEXT,
        content_hash TEXT,
        on_chain BOOLEAN DEFAULT false,
        reply_to UUID,
        original_post_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (reply_to) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (original_post_id) REFERENCES posts(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL,
        user_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS reposts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL,
        user_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS bookmarks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL,
        user_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS follows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        follower_id UUID NOT NULL,
        following_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(follower_id, following_id),
        FOREIGN KEY (follower_id) REFERENCES profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES profiles(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS tips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL,
        from_user_id UUID NOT NULL,
        to_user_id UUID NOT NULL,
        amount NUMERIC NOT NULL,
        tx_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (from_user_id) REFERENCES profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (to_user_id) REFERENCES profiles(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL,
        author_id UUID NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE
      );
    `);
    res.json({ success: true, message: 'All tables created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/:table', async (req, res) => {
  const { table } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 100`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  try {
    await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'OK', message: 'Database connected' });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

// ============================================
// 2. PROFILES
// ============================================
app.post('/api/profiles', async (req, res) => {
  const { address } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM profiles WHERE address = $1', [address]);
    if (existing.rows.length > 0) return res.json(existing.rows[0]);
    const username = address.slice(0, 8);
    const display_name = `${address.slice(0, 6)}…${address.slice(-4)}`;
    const result = await pool.query(
      `INSERT INTO profiles (address, username, display_name, avatar_seed, is_validator)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [address, username, display_name, address, false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profiles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let result;
    if (id.includes('-')) {
      result = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]);
    } else {
      result = await pool.query('SELECT * FROM profiles WHERE address = $1', [id]);
    }
    if (result.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profiles/:id', async (req, res) => {
  const { id } = req.params;
  const { display_name, bio, avatar_seed } = req.body;
  try {
    const result = await pool.query(
      `UPDATE profiles SET display_name = $1, bio = $2, avatar_seed = $3 WHERE id = $4 RETURNING *`,
      [display_name, bio, avatar_seed, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profiles', async (req, res) => {
  const { limit = 100 } = req.query;
  try {
    const result = await pool.query(
      `SELECT id, address, username, display_name, avatar_seed, is_validator FROM profiles LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 3. POSTS (YANG BENAR DENGAN LINK PREVIEW & BOOST)
// ============================================
app.post('/api/posts', async (req, res) => {
  const { 
    author_id, 
    content, 
    media_url, 
    link_preview, 
    is_super_yap, 
    is_boosted, 
    boost_expires_at, 
    tx_hash, 
    content_hash, 
    on_chain, 
    reply_to, 
    original_post_id 
  } = req.body;

  console.log("📥 [POST] Received:", { content: content?.slice(0, 30), link_preview, is_boosted });

  try {
    const result = await pool.query(
      `INSERT INTO posts (
        author_id, 
        content, 
        media_url, 
        link_preview, 
        is_super_yap, 
        is_boosted, 
        boost_expires_at, 
        tx_hash, 
        content_hash, 
        on_chain, 
        reply_to, 
        original_post_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        author_id, 
        content, 
        media_url, 
        link_preview, 
        is_super_yap, 
        is_boosted, 
        boost_expires_at, 
        tx_hash, 
        content_hash, 
        on_chain, 
        reply_to, 
        original_post_id
      ]
    );
    console.log("✅ [POST] Saved to DB with preview & boost:", result.rows[0].id);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ [POST] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.*,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
        (SELECT COUNT(*) FROM reposts WHERE post_id = p.id) as reposts,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as replies,
        (SELECT COALESCE(SUM(amount), 0) FROM tips WHERE post_id = p.id) as tip_total,
        jsonb_build_object(
          'address', pr.address,
          'display_name', pr.display_name,
          'avatar_seed', pr.avatar_seed,
          'is_validator', pr.is_validator
        ) as author
       FROM posts p
       LEFT JOIN profiles pr ON p.author_id = pr.id
       WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/feed', async (req, res) => {
  const { limit = 10 } = req.query;
  try {
    const posts = await pool.query(
      `SELECT p.*,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
        (SELECT COUNT(*) FROM reposts WHERE post_id = p.id) as reposts,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as replies,
        (SELECT COALESCE(SUM(amount), 0) FROM tips WHERE post_id = p.id) as tip_total,
        jsonb_build_object(
          'address', pr.address,
          'display_name', pr.display_name,
          'avatar_seed', pr.avatar_seed,
          'is_validator', pr.is_validator
        ) as author
       FROM posts p
       LEFT JOIN profiles pr ON p.author_id = pr.id
       WHERE p.reply_to IS NULL
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(posts.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/replies', async (req, res) => {
  const { parent_id } = req.query;
  try {
    const posts = await pool.query(
      `SELECT p.*,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
        (SELECT COUNT(*) FROM reposts WHERE post_id = p.id) as reposts,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as replies,
        (SELECT COALESCE(SUM(amount), 0) FROM tips WHERE post_id = p.id) as tip_total,
        jsonb_build_object(
          'address', pr.address,
          'display_name', pr.display_name,
          'avatar_seed', pr.avatar_seed,
          'is_validator', pr.is_validator
        ) as author
       FROM posts p
       LEFT JOIN profiles pr ON p.author_id = pr.id
       WHERE p.reply_to = $1
       ORDER BY p.created_at DESC`,
      [parent_id]
    );
    res.json(posts.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 4. LIKES / REPOSTS / BOOKMARKS
// ============================================
app.post('/api/likes', async (req, res) => {
  const { post_id, user_id } = req.body;
  console.log("📥 [LIKE] Received:", { post_id, user_id });
  try {
    const existing = await pool.query('SELECT id FROM likes WHERE post_id = $1 AND user_id = $2', [post_id, user_id]);
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [post_id, user_id]);
      console.log("✅ [LIKE] Unliked");
      return res.json({ action: 'unliked' });
    }
    await pool.query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2)', [post_id, user_id]);
    console.log("✅ [LIKE] Liked");
    res.json({ action: 'liked' });
  } catch (err) {
    console.error("❌ [LIKE] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reposts', async (req, res) => {
  const { post_id, user_id } = req.body;
  console.log("📥 [REPOST] Received:", { post_id, user_id });
  try {
    const existing = await pool.query('SELECT id FROM reposts WHERE post_id = $1 AND user_id = $2', [post_id, user_id]);
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM reposts WHERE post_id = $1 AND user_id = $2', [post_id, user_id]);
      console.log("✅ [REPOST] Unreposted");
      return res.json({ action: 'unreposted' });
    }
    await pool.query('INSERT INTO reposts (post_id, user_id) VALUES ($1, $2)', [post_id, user_id]);
    console.log("✅ [REPOST] Reposted");
    res.json({ action: 'reposted' });
  } catch (err) {
    console.error("❌ [REPOST] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookmarks', async (req, res) => {
  const { post_id, user_id } = req.body;
  console.log("📥 [BOOKMARK] Received:", { post_id, user_id });
  try {
    const existing = await pool.query('SELECT id FROM bookmarks WHERE post_id = $1 AND user_id = $2', [post_id, user_id]);
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM bookmarks WHERE post_id = $1 AND user_id = $2', [post_id, user_id]);
      console.log("✅ [BOOKMARK] Unbookmarked");
      return res.json({ action: 'unbookmarked' });
    }
    await pool.query('INSERT INTO bookmarks (post_id, user_id) VALUES ($1, $2)', [post_id, user_id]);
    console.log("✅ [BOOKMARK] Bookmarked");
    res.json({ action: 'bookmarked' });
  } catch (err) {
    console.error("❌ [BOOKMARK] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 5. FOLLOWS
// ============================================
app.post('/api/follows', async (req, res) => {
  const { follower_id, following_id } = req.body;
  console.log("📥 [FOLLOW] Received:", { follower_id, following_id });
  if (follower_id === following_id) {
    console.warn("⚠️ [FOLLOW] Cannot follow self");
    return res.status(400).json({ error: 'You cannot follow yourself' });
  }
  try {
    const existing = await pool.query('SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2', [follower_id, following_id]);
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [follower_id, following_id]);
      console.log("✅ [FOLLOW] Unfollowed");
      return res.json({ following: false, action: 'unfollowed' });
    }
    await pool.query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)', [follower_id, following_id]);
    console.log("✅ [FOLLOW] Followed");
    res.json({ following: true, action: 'followed' });
  } catch (err) {
    console.error("❌ [FOLLOW] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/follows', async (req, res) => {
  const { following_id, follower_id, count } = req.query;
  try {
    if (count === 'followers' && following_id) {
      const result = await pool.query('SELECT COUNT(*) FROM follows WHERE following_id = $1', [following_id]);
      return res.json({ count: parseInt(result.rows[0].count) });
    }
    if (count === 'following' && follower_id) {
      const result = await pool.query('SELECT COUNT(*) FROM follows WHERE follower_id = $1', [follower_id]);
      return res.json({ count: parseInt(result.rows[0].count) });
    }
    if (follower_id && following_id) {
      const result = await pool.query(
        'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
        [follower_id, following_id]
      );
      return res.json({ isFollowing: result.rows.length > 0 });
    }
    if (following_id) {
      const result = await pool.query(
        `SELECT f.*, p.display_name, p.username, p.avatar_seed
         FROM follows f
         LEFT JOIN profiles p ON f.follower_id = p.id
         WHERE f.following_id = $1
         ORDER BY f.created_at DESC`,
        [following_id]
      );
      return res.json(result.rows);
    }
    if (follower_id) {
      const result = await pool.query(
        `SELECT f.*, p.display_name, p.username, p.avatar_seed
         FROM follows f
         LEFT JOIN profiles p ON f.following_id = p.id
         WHERE f.follower_id = $1
         ORDER BY f.created_at DESC`,
        [follower_id]
      );
      return res.json(result.rows);
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 6. TIPS
// ============================================
app.post('/api/tips', async (req, res) => {
  const { post_id, from_user_id, to_user_id, amount, tx_hash } = req.body;
  console.log("📥 [TIP] Received:", { post_id, from_user_id, to_user_id, amount, tx_hash });
  if (!post_id || !from_user_id || !to_user_id || amount === undefined || amount === null) {
    console.error("❌ [TIP] Missing fields");
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    const result = await pool.query(
      `INSERT INTO tips (post_id, from_user_id, to_user_id, amount, tx_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [post_id, from_user_id, to_user_id, numericAmount, tx_hash || null]
    );
    console.log("✅ [TIP] Saved to DB:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ [TIP] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tips', async (req, res) => {
  const { to_user_id, from_user_id, limit = 100 } = req.query;
  try {
    let query = `SELECT * FROM tips`;
    const params = [];
    const conditions = [];
    if (to_user_id) { conditions.push(`to_user_id = $${params.length + 1}`); params.push(to_user_id); }
    if (from_user_id) { conditions.push(`from_user_id = $${params.length + 1}`); params.push(from_user_id); }
    if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tips/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const { limit = 50 } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM tips
       WHERE to_user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ [TIPS-USER] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 7. COMMENTS
// ============================================
app.post('/api/comments', async (req, res) => {
  const { post_id, author_id, content } = req.body;
  console.log("📥 [COMMENT] Received:", { post_id, author_id, content });
  try {
    const result = await pool.query(
      `INSERT INTO comments (post_id, author_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [post_id, author_id, content]
    );
    console.log("✅ [COMMENT] Saved to DB:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ [COMMENT] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comments', async (req, res) => {
  const { post_id, limit = 100 } = req.query;
  try {
    let query = `SELECT * FROM comments`;
    const params = [];
    if (post_id) {
      query += ` WHERE post_id = $1`;
      params.push(post_id);
    }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 8. SEARCH
// ============================================
app.get('/api/search/users', async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q) return res.json([]);
  try {
    const result = await pool.query(
      `SELECT id, address, display_name, username, avatar_seed, is_validator
       FROM profiles
       WHERE display_name ILIKE $1 OR username ILIKE $1 OR address ILIKE $1
       LIMIT $2`,
      [`%${q}%`, limit]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 9. NOTIFICATIONS
// ============================================
app.get('/api/notifications', async (req, res) => {
  const { user_id, limit = 20 } = req.query;
  if (!user_id) return res.json([]);
  try {
    const result = await pool.query(`
      (SELECT
        'follow' as type,
        f.id as id,
        f.follower_id as from_user_id,
        NULL::numeric as amount,
        false as read,
        f.created_at as created_at,
        NULL::text as post_content
       FROM follows f
       WHERE f.following_id = $1
      )
      UNION ALL
      (SELECT
        'like' as type,
        l.id as id,
        l.user_id as from_user_id,
        NULL::numeric as amount,
        false as read,
        l.created_at as created_at,
        p.content as post_content
       FROM likes l
       JOIN posts p ON p.id = l.post_id
       WHERE p.author_id = $1
      )
      UNION ALL
      (SELECT
        'reply' as type,
        p.id as id,
        p.author_id as from_user_id,
        NULL::numeric as amount,
        false as read,
        p.created_at as created_at,
        parent.content as post_content
       FROM posts p
       JOIN posts parent ON parent.id = p.reply_to
       WHERE parent.author_id = $1 AND p.reply_to IS NOT NULL
      )
      UNION ALL
      (SELECT
        'tip' as type,
        t.id as id,
        t.from_user_id as from_user_id,
        t.amount as amount,
        false as read,
        t.created_at as created_at,
        p.content as post_content
       FROM tips t
       JOIN posts p ON p.id = t.post_id
       WHERE t.to_user_id = $1
      )
      ORDER BY created_at DESC
      LIMIT $2
    `, [user_id, limit]);
    const rows = result.rows;
    const fromIds = rows.map(r => r.from_user_id).filter(Boolean);
    let profiles = {};
    if (fromIds.length > 0) {
      const profileRes = await pool.query(
        `SELECT id, address, display_name, avatar_seed FROM profiles WHERE id = ANY($1)`,
        [fromIds]
      );
      profileRes.rows.forEach(p => { profiles[p.id] = p; });
    }
    const notifications = rows.map(r => ({
      id: r.id,
      type: r.type,
      amount: r.amount ? parseFloat(r.amount) : null,
      read: r.read,
      created_at: r.created_at,
      from: profiles[r.from_user_id] ? {
        id: profiles[r.from_user_id].id,
        display_name: profiles[r.from_user_id].display_name,
        avatar_seed: profiles[r.from_user_id].avatar_seed,
        address: profiles[r.from_user_id].address,
      } : null,
      post: r.post_content ? { content: r.post_content } : null,
    }));
    res.json(notifications);
  } catch (err) {
    console.error("❌ [NOTIFICATIONS] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/mark-read', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  try {
    console.log("✅ [NOTIFICATIONS] Mark read for user:", user_id);
    res.json({ success: true, message: 'All notifications marked as read (simulated)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notifications/unread-count', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.json({ count: 0 });
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) +
        (SELECT COUNT(*) FROM likes l JOIN posts p ON p.id = l.post_id WHERE p.author_id = $1) +
        (SELECT COUNT(*) FROM posts p WHERE p.reply_to IS NOT NULL AND p.author_id != $1 AND EXISTS (SELECT 1 FROM posts parent WHERE parent.id = p.reply_to AND parent.author_id = $1)) +
        (SELECT COUNT(*) FROM tips WHERE to_user_id = $1)
      as count
    `, [user_id]);
    const count = parseInt(result.rows[0]?.count || 0);
    res.json({ count });
  } catch (err) {
    console.error("❌ [UNREAD-COUNT] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 10. DELETE POST
// ============================================
app.delete('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(401).json({ error: 'Unauthorized: user_id required' });
  }
  try {
    const postCheck = await pool.query('SELECT author_id FROM posts WHERE id = $1', [id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (postCheck.rows[0].author_id !== user_id) {
      return res.status(403).json({ error: 'Forbidden: You are not the owner of this post' });
    }
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    console.error("❌ Delete post error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 11. LINK PREVIEW
// ============================================
app.get('/api/link-preview', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      timeout: 10000
    });
    const html = response.data;
    const $ = cheerio.load(html);
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || url;
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    const image = $('meta[property="og:image"]').attr('content') || null;
    const siteName = $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname;
    res.json({
      success: true,
      title: title.trim(),
      description: description.trim(),
      image: image ? image.trim() : null,
      siteName: siteName.trim(),
      url: url
    });
  } catch (error) {
    console.error("❌ Link preview error:", error.message);
    res.json({
      success: false,
      error: 'Failed to fetch metadata',
      fallback: {
        title: new URL(url).hostname,
        description: '',
        image: null,
        siteName: new URL(url).hostname,
        url: url
      }
    });
  }
});

// ============================================
// 12. LEADERBOARD (FIXED VERSION)
// ============================================
app.get('/api/leaderboard', async (req, res) => {
  const { timeframe = 'all', limit = 50 } = req.query;
  
  let dateFilter = '';
  if (timeframe === 'week') {
    dateFilter = `AND t.created_at >= NOW() - INTERVAL '7 days'`;
  }

  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.address,
        p.display_name,
        p.username,
        p.avatar_seed,
        p.is_validator,
        COALESCE(SUM(t.amount), 0) as total_tips_received,
        (SELECT COUNT(*) FROM posts WHERE author_id = p.id AND reply_to IS NULL) as yap_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = p.id) as follower_count
      FROM profiles p
      LEFT JOIN tips t ON t.to_user_id = p.id ${dateFilter}
      GROUP BY p.id
      ORDER BY total_tips_received DESC
      LIMIT $1
    `, [limit]);

    // Mapping badge berdasarkan total tips (JavaScript murni, tanpa TypeScript)
    const rows = result.rows.map(function(row) {
      let badge = 'shrimp';
      if (row.total_tips_received >= 100000) badge = 'whale';
      else if (row.total_tips_received >= 10000) badge = 'shark';
      else if (row.total_tips_received >= 1000) badge = 'dolphin';
      else if (row.total_tips_received >= 100) badge = 'fish';

      return {
        id: row.id,
        address: row.address,
        displayName: row.display_name || row.address.slice(0, 8),
        username: row.username || row.address.slice(0, 8),
        avatarSeed: row.avatar_seed || row.address,
        badge: badge,
        isValidator: Boolean(row.is_validator),
        totalTipsReceived: parseFloat(row.total_tips_received),
        yapCount: parseInt(row.yap_count),
        followerCount: parseInt(row.follower_count),
      };
    });

    res.json(rows);
  } catch (err) {
    console.error("❌ Leaderboard error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 13. LANDING PAGE STATISTICS
// ============================================
app.get('/api/stats', async (req, res) => {
  try {
    // 1. Total Yaps (posts tanpa reply)
    const yapsRes = await pool.query('SELECT COUNT(*) FROM posts WHERE reply_to IS NULL');
    const totalYaps = parseInt(yapsRes.rows[0].count);

    // 2. Total QIE Tipped
    const tipsRes = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM tips');
    const totalQie = parseFloat(tipsRes.rows[0].total);

    // 3. Active Users (user yang punya setidaknya 1 post atau 1 tip)
    const usersRes = await pool.query(`
      SELECT COUNT(DISTINCT id) FROM profiles 
      WHERE id IN (SELECT author_id FROM posts) 
         OR id IN (SELECT from_user_id FROM tips)
         OR id IN (SELECT to_user_id FROM tips)
    `);
    const activeUsers = parseInt(usersRes.rows[0].count);

    // 4. Total On-Chain Tx (tips + posts dengan tx_hash)
    const txRes = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM tips WHERE tx_hash IS NOT NULL) +
        (SELECT COUNT(*) FROM posts WHERE tx_hash IS NOT NULL)
      as total
    `);
    const totalTx = parseInt(txRes.rows[0].total);

    res.json({
      totalYaps,
      totalQie: totalQie.toFixed(0),
      activeUsers,
      totalTx
    });
  } catch (err) {
    console.error("❌ Stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 14. CHART DATA (7 DAYS HISTORY)
// ============================================
app.get('/api/stats/chart', async (req, res) => {
  const { days = 7 } = req.query;
  try {
    const result = await pool.query(`
      WITH days AS (
        SELECT generate_series(
          CURRENT_DATE - ($1 || ' days')::INTERVAL,
          CURRENT_DATE,
          '1 day'::INTERVAL
        ) AS day
      )
      SELECT 
        TO_CHAR(days.day, 'DD MMM') as date,
        COALESCE(COUNT(t.id), 0) as tx
      FROM days
      LEFT JOIN tips t ON DATE(t.created_at) = days.day
      GROUP BY days.day
      ORDER BY days.day ASC
    `, [days]);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Chart error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// START SERVER
// ============================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ QIE Yap Backend running on port ${PORT}`);
});
EOF
