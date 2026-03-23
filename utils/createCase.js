/**
 * utils/createCase.js — Shared utility for creating moderation cases
 * Stores cases in data/mod-cases.json
 */
const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, '../data/mod-cases.json');

/**
 * Creates a moderation case and returns the case ID.
 * @param {string} guildId
 * @param {string} type - ban, kick, warn, timeout, tempban, softban, note, jail, unjail, vckick, vcban, etc.
 * @param {string} targetId - User ID of the target
 * @param {string} moderatorId - User ID of the moderator
 * @param {string} reason
 * @param {string} [duration] - Optional duration string
 * @param {number} [expiresAt] - Optional expiry timestamp
 * @returns {number} Case ID
 */
function createCase(guildId, type, targetId, moderatorId, reason, duration = null, expiresAt = null) {
  let cases = {};
  if (fs.existsSync(casesPath)) {
    try { cases = JSON.parse(fs.readFileSync(casesPath, 'utf8')); } catch {}
  }
  if (!cases[guildId]) cases[guildId] = [];
  const id = (cases[guildId].length > 0 ? Math.max(...cases[guildId].map(c => c.id)) : 0) + 1;
  const entry = { id, type, targetId, moderatorId, reason: reason || 'N/A', timestamp: Date.now() };
  if (duration) entry.duration = duration;
  if (expiresAt) entry.expiresAt = expiresAt;
  cases[guildId].push(entry);
  fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));
  return id;
}

module.exports = { createCase };
