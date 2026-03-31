const fs = require('fs');
const path = './data/xp.json';

// Load XP data
function loadXP() {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, '{}');
  }
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

// Save XP data
function saveXP(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// Calculate level from XP
function getLevel(xp) {
  return Math.floor(0.1 * Math.sqrt(xp));
}

// Calculate XP needed for next level
function xpForNextLevel(level) {
  return Math.pow((level + 1) / 0.1, 2);
}

// Add XP to user
function addXP(userId, guildId, amount) {
  const data = loadXP();
  const key = `${guildId}-${userId}`;

  if (!data[key]) {
    data[key] = { xp: 0, level: 0 };
  }

  data[key].xp += amount;
  const newLevel = getLevel(data[key].xp);
  const leveledUp = newLevel > data[key].level;
  data[key].level = newLevel;

  saveXP(data);

  return {
    xp: data[key].xp,
    level: data[key].level,
    leveledUp,
  };
}

// Get user XP
function getUserXP(userId, guildId) {
  const data = loadXP();
  const key = `${guildId}-${userId}`;
  return data[key] || { xp: 0, level: 0 };
}

// Get leaderboard
function getLeaderboard(guildId, limit = 10) {
  const data = loadXP();
  return Object.entries(data)
    .filter(([key]) => key.startsWith(guildId))
    .map(([key, value]) => ({
      userId: key.replace(`${guildId}-`, ''),
      ...value,
    }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
}

module.exports = { addXP, getUserXP, getLeaderboard, getLevel, xpForNextLevel };