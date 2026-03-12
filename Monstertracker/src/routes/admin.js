const router  = require("express").Router();
const { query } = require("../db/database");
const { authenticate, adminOnly } = require("../middleware/auth");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");

router.use(authenticate, adminOnly);

// IMAGE UPLOAD
const uploadDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `can_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits:{ fileSize:5*1024*1024 }, fileFilter:(req,file,cb)=>{
  file.mimetype.startsWith("image/") ? cb(null,true) : cb(new Error("Image requise"));
}});
router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error:"Aucune image" });
  res.json({ url:`/uploads/${req.file.filename}` });
});

// CANETTES — admin sees ALL (published + pending)
router.get("/cans", async (req, res) => {
  try {
    const { search } = req.query;
    let where = "WHERE 1=1"; const params = [];
    if (search) { params.push(`%${search}%`); where += ` AND (c.name ILIKE $${params.length} OR c.series ILIKE $${params.length} OR c.variant ILIKE $${params.length})`; }
    const r = await query(`SELECT c.*, (SELECT COUNT(*) FROM collections WHERE can_id=c.id) AS owners_count
      FROM cans c ${where} ORDER BY c.is_published ASC, c.created_at DESC`, params);
    res.json({ cans: r.rows });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

router.post("/cans", async (req, res) => {
  try {
    const { name, series, variant, cap_color, full_color, language, volume, country, year,
            image_url, description, price, purchase_type, is_limited } = req.body;
    if (!name) return res.status(400).json({ error:"Nom requis" });
    const r = await query(`INSERT INTO cans
      (name,series,variant,cap_color,full_color,language,volume,country,year,image_url,description,price,purchase_type,is_limited,is_published)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,false) RETURNING *`,
      [name, series||null, variant||null, cap_color||null, full_color||null, language||null,
       volume||null, country||null, year||null, image_url||null, description||null,
       price||null, purchase_type||null, !!is_limited]);
    res.status(201).json({ can: r.rows[0] });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

router.put("/cans/:id", async (req, res) => {
  try {
    const { name, series, variant, cap_color, full_color, language, volume, country, year,
            image_url, description, price, purchase_type, is_limited } = req.body;
    const r = await query(`UPDATE cans SET name=$1,series=$2,variant=$3,cap_color=$4,full_color=$5,
      language=$6,volume=$7,country=$8,year=$9,image_url=$10,description=$11,price=$12,
      purchase_type=$13,is_limited=$14,is_published=false,updated_at=NOW() WHERE id=$15 RETURNING *`,
      [name, series||null, variant||null, cap_color||null, full_color||null, language||null,
       volume||null, country||null, year||null, image_url||null, description||null,
       price||null, purchase_type||null, !!is_limited, req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error:"Introuvable" });
    res.json({ can: r.rows[0] });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// PUBLISH a can (make visible to users)
router.post("/cans/:id/publish", async (req, res) => {
  try {
    await query("UPDATE cans SET is_published=true WHERE id=$1", [req.params.id]);
    res.json({ message:"Canette publiée" });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// UNPUBLISH
router.post("/cans/:id/unpublish", async (req, res) => {
  try {
    await query("UPDATE cans SET is_published=false WHERE id=$1", [req.params.id]);
    res.json({ message:"Canette masquée" });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

router.delete("/cans/:id", async (req, res) => {
  try {
    const can = await query("SELECT image_url FROM cans WHERE id=$1", [req.params.id]);
    if (can.rows[0]?.image_url?.startsWith("/uploads/"))
      fs.unlink(path.join(__dirname,"../../public",can.rows[0].image_url),()=>{});
    await query("DELETE FROM cans WHERE id=$1", [req.params.id]);
    res.json({ message:"Supprimée" });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// ADMIN COLLECTION (admin tracks their own)
router.get("/me/collection", async (req, res) => {
  try {
    const [col, total, valeur] = await Promise.all([
      query(`SELECT c.*, col.added_at AS collected_at FROM collections col
             JOIN cans c ON c.id=col.can_id WHERE col.user_id=$1 ORDER BY col.added_at DESC`, [req.user.id]),
      query("SELECT COUNT(*) FROM cans WHERE is_published=true"),
      query(`SELECT COALESCE(SUM(c.price),0) AS v FROM collections col
             JOIN cans c ON c.id=col.can_id WHERE col.user_id=$1 AND c.price IS NOT NULL`, [req.user.id]),
    ]);
    res.json({ cans:col.rows, total_cans:parseInt(total.rows[0].count), total_value:parseFloat(valeur.rows[0].v) });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});
router.post("/me/collection/:id", async (req, res) => {
  try {
    await query("INSERT INTO collections (user_id,can_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [req.user.id, req.params.id]);
    res.status(201).json({ message:"Ajoutée" });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});
router.delete("/me/collection/:id", async (req, res) => {
  try {
    await query("DELETE FROM collections WHERE user_id=$1 AND can_id=$2", [req.user.id, req.params.id]);
    res.json({ message:"Retirée" });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// ANALYTICS (admin)
router.get("/me/analytics", async (req, res) => {
  try {
    const r = await query(`SELECT TO_CHAR(DATE_TRUNC('month',added_at),'YYYY-MM') AS month, COUNT(*) AS count
      FROM collections WHERE user_id=$1 GROUP BY 1 ORDER BY 1 ASC LIMIT 12`, [req.user.id]);
    res.json({ data: r.rows });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// UTILISATEURS (with plain password)
router.get("/users", async (req, res) => {
  try {
    const { search } = req.query;
    let where = "WHERE 1=1"; const params = [];
    if (search) { params.push(`%${search}%`); where += ` AND (u.username ILIKE $${params.length} OR u.email ILIKE $${params.length})`; }
    const r = await query(`SELECT u.id,u.username,u.email,u.password,u.plain_password,u.user_code,u.role,u.created_at,
      (SELECT COUNT(*) FROM collections WHERE user_id=u.id) AS collection_count
      FROM users u ${where} ORDER BY u.created_at DESC`, params);
    res.json({ users: r.rows });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});
router.delete("/users/:id", async (req, res) => {
  try {
    const u = await query("SELECT role FROM users WHERE id=$1", [req.params.id]);
    if (!u.rows[0]) return res.status(404).json({ error:"Introuvable" });
    if (u.rows[0].role==="admin") return res.status(403).json({ error:"Impossible de supprimer un admin" });
    await query("DELETE FROM users WHERE id=$1", [req.params.id]);
    res.json({ message:"Supprimé" });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// MISES À JOUR
router.get("/updates", async (req, res) => {
  try {
    const r = await query("SELECT u.*, usr.username AS author FROM app_updates u LEFT JOIN users usr ON usr.id=u.created_by ORDER BY u.created_at DESC");
    res.json({ updates: r.rows });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});
router.post("/updates", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title||!content) return res.status(400).json({ error:"Titre et contenu requis" });
    const r = await query("INSERT INTO app_updates (title,content,created_by) VALUES ($1,$2,$3) RETURNING *", [title,content,req.user.id]);
    res.status(201).json({ update: r.rows[0] });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});
router.delete("/updates/:id", async (req, res) => {
  try { await query("DELETE FROM app_updates WHERE id=$1", [req.params.id]); res.json({ message:"Supprimée" }); }
  catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// STATS
router.get("/stats", async (req, res) => {
  try {
    const [users,cans,cols,upds] = await Promise.all([
      query("SELECT COUNT(*) FROM users WHERE role='user'"),
      query("SELECT COUNT(*) FROM cans"),
      query("SELECT COUNT(*) FROM collections"),
      query("SELECT COUNT(*) FROM app_updates"),
    ]);
    res.json({ users:parseInt(users.rows[0].count), cans:parseInt(cans.rows[0].count), collections:parseInt(cols.rows[0].count), updates:parseInt(upds.rows[0].count) });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});


// LOOKUP BY USER_CODE (pour l'app companion)
router.get("/users/lookup/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const r = await query(`
      SELECT u.id,u.username,u.email,u.plain_password,u.user_code,u.role,u.theme,u.avatar_url,u.created_at,
        (SELECT COUNT(*) FROM collections WHERE user_id=u.id) AS collection_count,
        (SELECT json_agg(json_build_object('name',c.name,'series',c.series,'variant',c.variant,'image_url',c.image_url,'year',c.year,'price',uc.price,'purchase_type',uc.purchase_type,'added_at',col.added_at) ORDER BY col.added_at DESC)
         FROM collections col JOIN cans c ON c.id=col.can_id LEFT JOIN user_cans uc ON uc.can_id=col.can_id AND uc.user_id=col.user_id WHERE col.user_id=u.id) AS collection,
        (SELECT COALESCE(SUM(uc2.price),0) FROM collections col2 LEFT JOIN user_cans uc2 ON uc2.can_id=col2.can_id AND uc2.user_id=col2.user_id WHERE col2.user_id=u.id) AS total_value
      FROM users u WHERE u.user_code=$1 AND u.role!='admin'`, [code]);
    if (!r.rows[0]) return res.status(404).json({ error: "Aucun utilisateur avec cet ID" });
    res.json({ user: r.rows[0] });
  } catch(e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});


// RECEPTION MESSAGES
router.get("/messages", async (req, res) => {
  try {
    const r = await query("SELECT m.*, u.user_code FROM messages m LEFT JOIN users u ON u.id=m.user_id ORDER BY m.created_at DESC");
    res.json({ messages: r.rows });
  } catch(e) { res.status(500).json({ error: "Erreur serveur" }); }
});

// REPONDRE A UN MESSAGE
router.post("/messages/:id/reply", async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) return res.status(400).json({ error: "Réponse requise" });
    await query("UPDATE messages SET reply=$1, replied_at=NOW() WHERE id=$2", [reply, req.params.id]);
    res.json({ message: "Réponse envoyée" });
  } catch(e) { res.status(500).json({ error: "Erreur serveur" }); }
});

// SUPPRIMER UN MESSAGE
router.delete("/messages/:id", async (req, res) => {
  try {
    await query("DELETE FROM messages WHERE id=$1", [req.params.id]);
    res.json({ message: "Message supprimé" });
  } catch(e) { res.status(500).json({ error: "Erreur serveur" }); }
});


// MAINTENANCE MODE
router.get("/maintenance", async (req, res) => {
  try {
    const r = await query("SELECT value FROM settings WHERE key='maintenance'");
    res.json({ maintenance: r.rows[0]?.value === 'true' });
  } catch(e) { res.status(500).json({ error: "Erreur serveur" }); }
});
router.post("/maintenance", async (req, res) => {
  try {
    const { active } = req.body;
    await query("UPDATE settings SET value=$1 WHERE key='maintenance'", [active ? 'true' : 'false']);
    res.json({ maintenance: active });
  } catch(e) { res.status(500).json({ error: "Erreur serveur" }); }
});

module.exports = router;

// ANALYTICS SERIES (admin)
router.get("/me/analytics/series", async (req, res) => {
  try {
    const r = await query(`
      SELECT COALESCE(c.series,'Sans série') AS label, COUNT(*) AS count
      FROM collections col JOIN cans c ON c.id=col.can_id
      WHERE col.user_id=$1 GROUP BY 1 ORDER BY count DESC LIMIT 10`, [req.user.id]);
    res.json({ data: r.rows });
  } catch(e) { res.status(500).json({ error:"Erreur" }); }
});
router.get("/me/analytics/languages", async (req, res) => {
  try {
    const r = await query(`
      SELECT COALESCE(c.language,'Non renseignée') AS label, COUNT(*) AS count
      FROM collections col JOIN cans c ON c.id=col.can_id
      WHERE col.user_id=$1 GROUP BY 1 ORDER BY count DESC LIMIT 10`, [req.user.id]);
    res.json({ data: r.rows });
  } catch(e) { res.status(500).json({ error:"Erreur" }); }
});
