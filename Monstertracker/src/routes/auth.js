const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const { query } = require("../db/database");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config");
const { authenticate } = require("../middleware/auth");

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "username, email et password requis" });
    if (password.length < 6)
      return res.status(400).json({ error: "Mot de passe min. 6 caractères" });

    const existEmail = await query("SELECT id FROM users WHERE email=$1", [email]);
    if (existEmail.rows.length > 0)
      return res.status(409).json({ error: "Cet email est déjà utilisé" });

    const existUser = await query("SELECT id FROM users WHERE LOWER(username)=LOWER($1)", [username]);
    if (existUser.rows.length > 0)
      return res.status(409).json({ error: "❌ Ce pseudo est déjà pris, choisis-en un autre" });

    const hash = await bcrypt.hash(password, 10);
    const userCode = String(Math.floor(Math.random() * 1e15)).padStart(15, '0');
    const r = await query("INSERT INTO users (username,email,password,plain_password,user_code) VALUES ($1,$2,$3,$4,$5) RETURNING id", [username,email,hash,password,userCode]);
    const id = r.rows[0].id;
    const token = jwt.sign({ id, username, role:"user" }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.status(201).json({ message:"Compte créé", token, user:{ id, username, email, role:"user", theme:"dark" } });
  } catch(err) { console.error(err); res.status(500).json({ error:"Erreur serveur" }); }
});

router.post("/check-username", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.json({ available: false });
    const r = await query("SELECT id FROM users WHERE LOWER(username)=LOWER($1)", [username]);
    res.json({ available: r.rows.length === 0 });
  } catch(err) { res.status(500).json({ error:"Erreur serveur" }); }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error:"email et password requis" });
    const r = await query("SELECT * FROM users WHERE email=$1", [email]);
    const user = r.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error:"Identifiants invalides" });
    const token = jwt.sign({ id:user.id, username:user.username, role:user.role }, JWT_SECRET, { expiresIn:JWT_EXPIRES_IN });
    res.json({ message:"Connexion réussie", token, user:{ id:user.id, username:user.username, email:user.email, role:user.role, avatar_url:user.avatar_url, theme:user.theme||"dark" } });
  } catch(err) { console.error(err); res.status(500).json({ error:"Erreur serveur" }); }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const r = await query("SELECT id,username,email,role,avatar_url,theme,created_at FROM users WHERE id=$1", [req.user.id]);
    if (!r.rows[0]) return res.status(404).json({ error:"Utilisateur introuvable" });
    res.json(r.rows[0]);
  } catch(err) { res.status(500).json({ error:"Erreur serveur" }); }
});

module.exports = router;
