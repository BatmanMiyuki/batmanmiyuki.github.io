require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const { PORT } = require("./config");
const { init }  = require("./db/database");

const app = express();
app.use(cors());
app.use(express.json({ limit:"10mb" }));
app.use(express.static(require("path").join(__dirname, "../public")));

app.use("/api/auth",       require("./routes/auth"));
app.use("/api/admin-auth", require("./routes/adminAuth"));
app.use("/api/admin",      require("./routes/admin"));
app.use("/api/users",      require("./routes/users"));
app.get("/api/health", (_,res) => res.json({ status:"ok" }));
app.get("/api/status", async (_,res) => {
  try {
    const { query } = require("./db/database");
    const r = await query("SELECT value FROM settings WHERE key='maintenance'");
    res.json({ maintenance: r.rows[0]?.value === 'true' });
  } catch(e) { res.json({ maintenance: false }); }
});
app.use((_,res) => res.status(404).json({ error:"Route introuvable" }));
app.use((err,_q,res,_n) => { console.error(err); res.status(500).json({ error:err.message||"Erreur serveur" }); });

init().then(() => {
  app.listen(PORT, "0.0.0.0", () => console.log(`\n🟢 Monster Tracker → port ${PORT}\n`));
}).catch(err => { console.error("❌ DB:",err); process.exit(1); });
