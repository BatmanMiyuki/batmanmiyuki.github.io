const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ error: "Token manquant" });
  try {
    req.user = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Accès admin requis" });
  next();
};

module.exports = { authenticate, adminOnly };