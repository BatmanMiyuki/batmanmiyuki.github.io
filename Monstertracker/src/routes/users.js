const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { query } = require("../db/database");
const { authenticate } = require("../middleware/auth");
// MOT DE PASSE OUBLIÉ (public)
router.post("/forgot-password", async (req, res) => {
  try {
    const { pseudo } = req.body;
    if (!pseudo) return res.status(400).json({ error: "Pseudo requis" });
    const r = await query("SELECT id,username,email,plain_password FROM users WHERE LOWER(username)=LOWER($1) AND role='user'", [pseudo]);
    if (!r.rows[0]) return res.status(404).json({ error: "Aucun compte avec ce pseudo" });
    const u = r.rows[0];
    await query(
      "INSERT INTO messages (user_id,username,category,content) VALUES ($1,$2,$3,$4)",
      [u.id, u.username, "Mot de passe oublié",
       `L'utilisateur "${u.username}" a demandé son mot de passe.\n\nEmail : ${u.email}\nMot de passe : ${u.plain_password||"(non disponible)"}\n\nMerci d'envoyer ces informations à l'utilisateur par email.`
      ]);
    res.json({ message: "Demande envoyée. L'admin te contactera par email dès que possible." });
  } catch(e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.use(authenticate);

// CATALOGUE — only published cans
router.get("/cans", async (req, res) => {
  try {
    const { search } = req.query;
    const uid = req.user.id;
    const params = [uid, uid];
    let where = "WHERE c.is_published=true";
    if (search) { params.push(`%${search}%`); where += ` AND (c.name ILIKE $${params.length} OR c.series ILIKE $${params.length} OR c.variant ILIKE $${params.length})`; }
    const r = await query(`
      SELECT c.*, (col.user_id IS NOT NULL) AS in_collection, (wl.user_id IS NOT NULL) AS in_wishlist,
        (SELECT COUNT(*) FROM collections WHERE can_id=c.id) AS owners_count
      FROM cans c
      LEFT JOIN collections col ON col.can_id=c.id AND col.user_id=$1
      LEFT JOIN wishlists   wl  ON wl.can_id=c.id  AND wl.user_id=$2
      ${where} ORDER BY c.name ASC`, params);
    res.json({ cans: r.rows });
  } catch(e) { console.error(e); res.status(500).json({ error:"Erreur serveur" }); }
});

// COLLECTION
router.get("/me/collection", async (req, res) => {
  try {
    const r = await query(`SELECT c.*, col.added_at AS collected_at FROM collections col
      JOIN cans c ON c.id=col.can_id WHERE col.user_id=$1 ORDER BY col.added_at DESC`, [req.user.id]);
    res.json({ cans: r.rows });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});
router.post("/me/collection/:id", async (req, res) => {
  try {
    const { price, purchase_type } = req.body;
    await query("INSERT INTO collections (user_id,can_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [req.user.id, req.params.id]);
    await query("DELETE FROM wishlists WHERE user_id=$1 AND can_id=$2", [req.user.id, req.params.id]);
    if (price || purchase_type) {
      await query(`INSERT INTO user_cans (user_id,can_id,price,purchase_type) VALUES ($1,$2,$3,$4)
        ON CONFLICT (user_id,can_id) DO UPDATE SET price=$3,purchase_type=$4`,
        [req.user.id, req.params.id, price||null, purchase_type||null]);
    }
    res.status(201).json({ message:"Ajoutée" });
  } catch(e) { console.error(e); res.status(500).json({ error:"Erreur serveur" }); }
});
router.delete("/me/collection/:id", async (req, res) => {
  try {
    await query("DELETE FROM collections WHERE user_id=$1 AND can_id=$2", [req.user.id, req.params.id]);
    res.json({ message:"Retirée" });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// WISHLIST
router.get("/me/wishlist", async (req, res) => {
  try {
    const r = await query(`SELECT c.*, wl.added_at FROM wishlists wl
      JOIN cans c ON c.id=wl.can_id WHERE wl.user_id=$1 ORDER BY wl.added_at DESC`, [req.user.id]);
    res.json({ cans: r.rows });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});
router.post("/me/wishlist/:id", async (req, res) => {
  try {
    const inCol = await query("SELECT 1 FROM collections WHERE user_id=$1 AND can_id=$2", [req.user.id, req.params.id]);
    if (inCol.rows[0]) return res.status(409).json({ error:"Tu possèdes déjà cette canette" });
    await query("INSERT INTO wishlists (user_id,can_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [req.user.id, req.params.id]);
    res.status(201).json({ message:"Ajoutée à la wishlist" });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});
router.delete("/me/wishlist/:id", async (req, res) => {
  try {
    await query("DELETE FROM wishlists WHERE user_id=$1 AND can_id=$2", [req.user.id, req.params.id]);
    res.json({ message:"Retirée" });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// STATS + VALEUR
router.get("/me/stats", async (req, res) => {
  try {
    const [col, wl, total, recent, valeur] = await Promise.all([
      query("SELECT COUNT(*) FROM collections WHERE user_id=$1", [req.user.id]),
      query("SELECT COUNT(*) FROM wishlists   WHERE user_id=$1", [req.user.id]),
      query("SELECT COUNT(*) FROM cans WHERE is_published=true"),
      query(`SELECT c.name,c.image_url,col.added_at FROM collections col
             JOIN cans c ON c.id=col.can_id WHERE col.user_id=$1 ORDER BY col.added_at DESC LIMIT 5`, [req.user.id]),
      query(`SELECT COALESCE(SUM(uc.price),0) AS total_value FROM collections col
             LEFT JOIN user_cans uc ON uc.can_id=col.can_id AND uc.user_id=col.user_id
             WHERE col.user_id=$1 AND uc.price IS NOT NULL`, [req.user.id]),
    ]);
    res.json({
      collection_count: parseInt(col.rows[0].count),
      wishlist_count:   parseInt(wl.rows[0].count),
      total_cans:       parseInt(total.rows[0].count),
      total_value:      parseFloat(valeur.rows[0].total_value),
      recent:           recent.rows,
    });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// ANALYTICS — collections par mois
router.get("/me/analytics", async (req, res) => {
  try {
    const r = await query(`
      SELECT TO_CHAR(DATE_TRUNC('month', added_at),'YYYY-MM') AS month, COUNT(*) AS count
      FROM collections WHERE user_id=$1
      GROUP BY 1 ORDER BY 1 ASC LIMIT 12`, [req.user.id]);
    res.json({ data: r.rows });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// PROFIL / SETTINGS
router.put("/me/profile", async (req, res) => {
  try {
    const { username, theme, avatar_url } = req.body;
    if (username) {
      const exist = await query("SELECT id FROM users WHERE LOWER(username)=LOWER($1) AND id!=$2", [username, req.user.id]);
      if (exist.rows[0]) return res.status(409).json({ error:"Ce pseudo est déjà pris" });
    }
    await query("UPDATE users SET username=COALESCE($1,username), theme=COALESCE($2,theme), avatar_url=COALESCE($4,avatar_url) WHERE id=$3",
      [username||null, theme||null, req.user.id, avatar_url||null]);
    const updated = await query("SELECT id,username,email,role,theme,avatar_url FROM users WHERE id=$1", [req.user.id]);
    res.json({ user: updated.rows[0] });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});
router.put("/me/password", async (req, res) => {
  try {
    const { current, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error:"Min. 6 caractères" });
    const r = await query("SELECT password FROM users WHERE id=$1", [req.user.id]);
    if (!(await bcrypt.compare(current, r.rows[0].password))) return res.status(401).json({ error:"Mot de passe actuel incorrect" });
    const hash = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password=$1,plain_password=$2 WHERE id=$3", [hash, req.body.newPassword, req.user.id]);
    res.json({ message:"Mis à jour" });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// FAVORIS
router.get("/me/favorites", async (req, res) => {
  try {
    const r = await query("SELECT f.position, c.* FROM favorites f JOIN cans c ON c.id=f.can_id WHERE f.user_id=$1 ORDER BY f.position", [req.user.id]);
    res.json({ favorites: r.rows });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});
router.post("/me/favorites", async (req, res) => {
  try {
    const { can_id, position } = req.body;
    if (![1,2,3].includes(Number(position))) return res.status(400).json({ error:"Position 1,2,3" });
    await query("INSERT INTO favorites (user_id,can_id,position) VALUES ($1,$2,$3) ON CONFLICT (user_id,position) DO UPDATE SET can_id=$2", [req.user.id, can_id, position]);
    res.json({ message:"OK" });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});
router.delete("/me/favorites/:position", async (req, res) => {
  try {
    await query("DELETE FROM favorites WHERE user_id=$1 AND position=$2", [req.user.id, req.params.position]);
    res.json({ message:"OK" });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// AMIS
router.get("/me/friends", async (req, res) => {
  try {
    const r = await query(`SELECT u.id,u.username,u.avatar_url,
      (SELECT COUNT(*) FROM collections WHERE user_id=u.id) AS collection_count,
      f.created_at AS friends_since,
      COALESCE((
        SELECT COUNT(*) FROM chat_messages cm
        JOIN chats ch ON ch.id=cm.chat_id
        WHERE ((ch.user1_id=$1 AND ch.user2_id=u.id) OR (ch.user1_id=u.id AND ch.user2_id=$1))
        AND cm.sender_id=u.id AND cm.seen=FALSE
      ),0) AS unread_count
      FROM friends f JOIN users u ON u.id=f.friend_id WHERE f.user_id=$1 ORDER BY u.username`, [req.user.id]);
    res.json({ friends: r.rows });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

router.delete("/me/friends/:id", async (req, res) => {
  try {
    await query("DELETE FROM friends WHERE user_id=$1 AND friend_id=$2", [req.user.id, req.params.id]);
    await query("DELETE FROM friends WHERE user_id=$1 AND friend_id=$2", [req.params.id, req.user.id]);
    res.json({ message:"Retiré" });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// MISES À JOUR
router.get("/updates", async (req, res) => {
  try {
    const r = await query("SELECT u.*, usr.username AS author FROM app_updates u LEFT JOIN users usr ON usr.id=u.created_by ORDER BY u.created_at DESC");
    res.json({ updates: r.rows });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});


// ENVOYER UN MESSAGE
router.post("/me/messages", async (req, res) => {
  try {
    const { category, content, attachment_url } = req.body;
    if (!category || !content) return res.status(400).json({ error: "Categorie et contenu requis" });
    const u = await query("SELECT username FROM users WHERE id=$1", [req.user.id]);
    const username = u.rows[0]?.username || "inconnu";
    await query("INSERT INTO messages (user_id, username, category, content, attachment_url) VALUES ($1,$2,$3,$4,$5)",
      [req.user.id, username, category, content, attachment_url || null]);
    res.json({ message: "Message envoyé ✓" });
  } catch(e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

// MES NOTIFICATIONS (updates + réponses à mes messages)
router.get("/me/notifications", async (req, res) => {
  try {
    const [updates, replies] = await Promise.all([
      query("SELECT u.id, u.title, u.content, u.created_at, usr.username AS author FROM app_updates u LEFT JOIN users usr ON usr.id=u.created_by ORDER BY u.created_at DESC"),
      query("SELECT id, category, content, attachment_url, reply, replied_at, seen_reply, created_at FROM messages WHERE user_id=$1 AND reply IS NOT NULL ORDER BY replied_at DESC", [req.user.id])
    ]);
    // Mark unseen replies as seen
    await query("UPDATE messages SET seen_reply=TRUE WHERE user_id=$1 AND reply IS NOT NULL AND seen_reply=FALSE", [req.user.id]).catch(()=>{});
    res.json({ updates: updates.rows, replies: replies.rows });
  } catch(e) { res.status(500).json({ error: "Erreur serveur" }); }
});

// BADGE COUNT — unseen replies only, doesn't mark as seen
router.get("/me/notifications/count", async (req, res) => {
  try {
    const r = await query("SELECT COUNT(*) AS cnt FROM messages WHERE user_id=$1 AND reply IS NOT NULL AND seen_reply=FALSE", [req.user.id]);
    res.json({ count: parseInt(r.rows[0].cnt) });
  } catch(e) { res.status(500).json({ error: "Erreur serveur" }); }
});


// SUPPRIMER SON PROPRE COMPTE
router.delete("/me/account", async (req, res) => {
  try {
    if(req.user.role === 'admin') return res.status(403).json({ error: "L'admin ne peut pas supprimer son propre compte" });
    await query("DELETE FROM users WHERE id=$1", [req.user.id]);
    res.json({ message: "Compte supprimé avec succès" });
  } catch(e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

// ── FRIEND SEARCH (preview, no add) ──
router.get("/users/search", async (req, res) => {
  try {
    const { pseudo } = req.query;
    if (!pseudo) return res.json({ user: null });
    const r = await query(
      `SELECT u.id, u.username, u.avatar_url, (SELECT COUNT(*) FROM collections WHERE user_id=u.id) AS collection_count,
        (SELECT 1 FROM friends WHERE user_id=$1 AND friend_id=u.id) AS is_friend,
        (SELECT status FROM friend_requests WHERE from_id=$1 AND to_id=u.id ORDER BY created_at DESC LIMIT 1) AS sent_status,
        (SELECT id FROM friend_requests WHERE from_id=u.id AND to_id=$1 AND status='pending' LIMIT 1) AS incoming_request_id
      FROM users u WHERE LOWER(u.username)=LOWER($2) AND u.role='user' AND u.id != $1`,
      [req.user.id, pseudo]);
    res.json({ user: r.rows[0] || null });
  } catch(e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

// ── FRIEND REQUESTS ──
router.post("/me/friend-requests", async (req, res) => {
  try {
    const { to_id } = req.body;
    if (to_id === req.user.id) return res.status(400).json({ error: "Tu ne peux pas t'ajouter toi-même" });
    const already = await query("SELECT 1 FROM friends WHERE user_id=$1 AND friend_id=$2", [req.user.id, to_id]);
    if (already.rows[0]) return res.status(409).json({ error: "Déjà amis" });
    const existing = await query("SELECT id,status FROM friend_requests WHERE from_id=$1 AND to_id=$2", [req.user.id, to_id]);
    if (existing.rows[0]) {
      if (existing.rows[0].status === 'pending') return res.status(409).json({ error: "Demande déjà envoyée" });
      await query("UPDATE friend_requests SET status='pending',created_at=NOW() WHERE from_id=$1 AND to_id=$2", [req.user.id, to_id]);
      return res.json({ message: "Demande renvoyée" });
    }
    await query("INSERT INTO friend_requests (from_id,to_id) VALUES ($1,$2)", [req.user.id, to_id]);
    res.json({ message: "Demande envoyée ✓" });
  } catch(e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/me/friend-requests", async (req, res) => {
  try {
    const r = await query(
      `SELECT fr.id, fr.from_id, u.username AS from_username, fr.created_at
       FROM friend_requests fr JOIN users u ON u.id=fr.from_id
       WHERE fr.to_id=$1 AND fr.status='pending' ORDER BY fr.created_at DESC`, [req.user.id]);
    res.json({ requests: r.rows });
  } catch(e) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/me/friend-requests/count", async (req, res) => {
  try {
    const r = await query("SELECT COUNT(*) AS cnt FROM friend_requests WHERE to_id=$1 AND status='pending'", [req.user.id]);
    res.json({ count: parseInt(r.rows[0].cnt) });
  } catch(e) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/me/friend-requests/:id/accept", async (req, res) => {
  try {
    const fr = await query("SELECT * FROM friend_requests WHERE id=$1 AND to_id=$2 AND status='pending'", [req.params.id, req.user.id]);
    if (!fr.rows[0]) return res.status(404).json({ error: "Demande introuvable" });
    const { from_id } = fr.rows[0];
    await query("UPDATE friend_requests SET status='accepted' WHERE id=$1", [req.params.id]);
    await query("INSERT INTO friends (user_id,friend_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [req.user.id, from_id]);
    await query("INSERT INTO friends (user_id,friend_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [from_id, req.user.id]);
    res.json({ message: "Ami ajouté ✓" });
  } catch(e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/me/friend-requests/:id/reject", async (req, res) => {
  try {
    await query("UPDATE friend_requests SET status='rejected' WHERE id=$1 AND to_id=$2", [req.params.id, req.user.id]);
    res.json({ message: "Demande refusée" });
  } catch(e) { res.status(500).json({ error: "Erreur serveur" }); }
});

// ── FRIEND COLLECTION VIEW ──
router.get("/users/:id/collection", async (req, res) => {
  try {
    const isFriend = await query("SELECT 1 FROM friends WHERE user_id=$1 AND friend_id=$2", [req.user.id, req.params.id]);
    if (!isFriend.rows[0]) return res.status(403).json({ error: "Vous n'êtes pas amis" });
    const [col, userRow] = await Promise.all([
      query(`SELECT c.*, col.added_at FROM collections col JOIN cans c ON c.id=col.can_id WHERE col.user_id=$1 AND c.is_published=TRUE ORDER BY col.added_at DESC`, [req.params.id]),
      query("SELECT username FROM users WHERE id=$1", [req.params.id])
    ]);
    res.json({ cans: col.rows, username: userRow.rows[0]?.username });
  } catch(e) { res.status(500).json({ error: "Erreur serveur" }); }
});

// ── CHAT ──
router.get("/me/chats/:friendId", async (req, res) => {
  try {
    const fid = parseInt(req.params.friendId);
    const isFriend = await query("SELECT 1 FROM friends WHERE user_id=$1 AND friend_id=$2", [req.user.id, fid]);
    if (!isFriend.rows[0]) return res.status(403).json({ error: "Vous n'êtes pas amis" });
    let chat = await query("SELECT id FROM chats WHERE (user1_id=$1 AND user2_id=$2) OR (user1_id=$2 AND user2_id=$1)", [req.user.id, fid]);
    if (!chat.rows[0]) {
      const nc = await query("INSERT INTO chats (user1_id,user2_id) VALUES ($1,$2) RETURNING id", [req.user.id, fid]);
      chat = nc;
    }
    const chatId = chat.rows[0].id;
    const msgs = await query("SELECT cm.*, u.username AS sender_name FROM chat_messages cm JOIN users u ON u.id=cm.sender_id WHERE cm.chat_id=$1 ORDER BY cm.created_at ASC", [chatId]);
    await query("UPDATE chat_messages SET seen=TRUE WHERE chat_id=$1 AND sender_id!=$2", [chatId, req.user.id]);
    res.json({ chatId, messages: msgs.rows });
  } catch(e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/me/chats/:friendId", async (req, res) => {
  try {
    const fid = parseInt(req.params.friendId);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Message vide" });
    let chat = await query("SELECT id FROM chats WHERE (user1_id=$1 AND user2_id=$2) OR (user1_id=$2 AND user2_id=$1)", [req.user.id, fid]);
    if (!chat.rows[0]) {
      const nc = await query("INSERT INTO chats (user1_id,user2_id) VALUES ($1,$2) RETURNING id", [req.user.id, fid]);
      chat = nc;
    }
    const chatId = chat.rows[0].id;
    const msg = await query("INSERT INTO chat_messages (chat_id,sender_id,content) VALUES ($1,$2,$3) RETURNING *", [chatId, req.user.id, content.trim()]);
    res.json({ message: msg.rows[0] });
  } catch(e) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/me/chat-unread", async (req, res) => {
  try {
    const r = await query(
      `SELECT SUM(unseen) AS total FROM (
        SELECT COUNT(*) AS unseen FROM chat_messages cm
        JOIN chats ch ON ch.id=cm.chat_id
        WHERE (ch.user1_id=$1 OR ch.user2_id=$1) AND cm.sender_id!=$1 AND cm.seen=FALSE
      ) sub`, [req.user.id]);
    res.json({ count: parseInt(r.rows[0]?.total||0) });
  } catch(e) { res.status(500).json({ error: "Erreur serveur" }); }
});

// ── USER CAN DATA (price + purchase_type per user) ──
router.get("/me/can-data/:canId", async (req, res) => {
  try {
    const r = await query("SELECT purchase_type,price FROM user_cans WHERE user_id=$1 AND can_id=$2", [req.user.id, req.params.canId]);
    res.json(r.rows[0] || {});
  } catch(e) { res.status(500).json({ error: "Erreur serveur" }); }
});
router.put("/me/can-data/:canId", async (req, res) => {
  try {
    const { purchase_type, price } = req.body;
    await query(
      `INSERT INTO user_cans (user_id,can_id,purchase_type,price) VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id,can_id) DO UPDATE SET purchase_type=$3,price=$4`,
      [req.user.id, req.params.canId, purchase_type||null, price||null]);
    res.json({ message: "Enregistré ✓" });
  } catch(e) { res.status(500).json({ error: "Erreur serveur" }); }
});




// ANALYTICS SERIES
router.get("/me/analytics/series", async (req, res) => {
  try {
    const r = await query(`
      SELECT COALESCE(c.series,'Sans série') AS label, COUNT(*) AS count
      FROM collections col JOIN cans c ON c.id=col.can_id
      WHERE col.user_id=$1 GROUP BY 1 ORDER BY count DESC LIMIT 10`, [req.user.id]);
    res.json({ data: r.rows });
  } catch(e) { res.status(500).json({ error:"Erreur" }); }
});

// ANALYTICS LANGUES
router.get("/me/analytics/languages", async (req, res) => {
  try {
    const r = await query(`
      SELECT COALESCE(c.language,'Non renseignée') AS label, COUNT(*) AS count
      FROM collections col JOIN cans c ON c.id=col.can_id
      WHERE col.user_id=$1 GROUP BY 1 ORDER BY count DESC LIMIT 10`, [req.user.id]);
    res.json({ data: r.rows });
  } catch(e) { res.status(500).json({ error:"Erreur" }); }
});

module.exports = router;
