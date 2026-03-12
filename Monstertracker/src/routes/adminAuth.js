const router = require("express").Router();
const crypto = require("crypto");
const { authenticate, adminOnly } = require("../middleware/auth");

// Sessions en mémoire : userId -> { step1, step2, step3 }
const sessions = new Map();

const ADMIN_PASS  = process.env.ADMIN_PASS  || "karoline";
const TOTP_SECRET = process.env.TOTP_SECRET || "MONSTERTRACKER_TOTP_2024_SECRET";
const COMP_SECRET = process.env.COMP_SECRET || "MONSTERCOMP_COMPOSITION_2024";
const INTERVAL    = 300; // 5 minutes

function getStep() { return Math.floor(Date.now() / 1000 / INTERVAL); }

// Génère un code TOTP à 6 chiffres
function genTOTP(step) {
  const hmac = crypto.createHmac("sha1", Buffer.from(TOTP_SECRET, "utf8"));
  const buf  = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(step));
  hmac.update(buf);
  const h   = hmac.digest();
  const off = h[h.length - 1] & 0xf;
  const n   = ((h[off] & 0x7f) << 24 | h[off+1] << 16 | h[off+2] << 8 | h[off+3]) % 1_000_000;
  return n.toString().padStart(6, "0");
}

// Génère une composition de 12 caractères (maj + min + chiffres + symboles)
function genComp(step) {
  const hmac = crypto.createHmac("sha256", Buffer.from(COMP_SECRET, "utf8"));
  const buf  = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(step));
  hmac.update(buf);
  const hash  = hmac.digest();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  return Array.from({length: 12}, (_, i) => chars[hash[i] % chars.length]).join("");
}

// ── Étape 1 : mot de passe admin ──────────────────────
router.post("/step1", authenticate, adminOnly, (req, res) => {
  if (req.body.password !== ADMIN_PASS)
    return res.status(401).json({ error: "Mot de passe incorrect" });
  sessions.set(req.user.id, { step1: true });
  res.json({ success: true });
});

// ── Étape 2 : TOTP 6 chiffres ─────────────────────────
router.post("/step2", authenticate, adminOnly, (req, res) => {
  const s = sessions.get(req.user.id) || {};
  if (!s.step1) return res.status(403).json({ error: "Étape 1 non validée" });
  const { code } = req.body;
  const step = getStep();
  if (code !== genTOTP(step) && code !== genTOTP(step - 1))
    return res.status(401).json({ error: "Code incorrect ou expiré" });
  sessions.set(req.user.id, { ...s, step2: true });
  res.json({ success: true });
});

// ── Étape 3 : composition 12 caractères ───────────────
router.post("/step3", authenticate, adminOnly, (req, res) => {
  const s = sessions.get(req.user.id) || {};
  if (!s.step2) return res.status(403).json({ error: "Étape 2 non validée" });
  const { composition } = req.body;
  const step = getStep();
  if (composition !== genComp(step) && composition !== genComp(step - 1))
    return res.status(401).json({ error: "Composition incorrecte" });
  sessions.set(req.user.id, { ...s, step3: true });
  res.json({ success: true, adminVerified: true });
});

// ── Status de vérification ────────────────────────────
router.get("/status", authenticate, adminOnly, (req, res) => {
  const s = sessions.get(req.user.id) || {};
  res.json({ step1: !!s.step1, step2: !!s.step2, step3: !!s.step3,
             verified: !!(s.step1 && s.step2 && s.step3) });
});

// ── Codes actuels pour les apps séparées ──────────────
router.get("/codes", authenticate, adminOnly, (req, res) => {
  const step = getStep();
  const remaining = INTERVAL - (Math.floor(Date.now() / 1000) % INTERVAL);
  res.json({
    totp:        genTOTP(step),
    composition: genComp(step),
    remaining:   remaining,
    step:        step
  });
});

module.exports = router;
