module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || "monster_secret_change_me",
  JWT_EXPIRES_IN: "7d",
  PORT: process.env.PORT || 3000,
};