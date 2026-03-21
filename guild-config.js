/**
 * guild-config.js — Persistent guild configuration backed by SQLite
 * Drop-in replacement for reading/writing config.json
 * Data survives Railway deploys (stored in data/cache.db)
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'cache.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS guild_config (
    guild_id TEXT NOT NULL,
    key      TEXT NOT NULL,
    value    TEXT NOT NULL,
    PRIMARY KEY (guild_id, key)
  );
`);

const getStmt  = db.prepare('SELECT value FROM guild_config WHERE guild_id = ? AND key = ?');
const setStmt  = db.prepare('INSERT OR REPLACE INTO guild_config (guild_id, key, value) VALUES (?, ?, ?)');
const delStmt  = db.prepare('DELETE FROM guild_config WHERE guild_id = ? AND key = ?');
const allStmt  = db.prepare('SELECT key, value FROM guild_config WHERE guild_id = ?');

/**
 * Get a config value for a guild.
 * @param {string} guildId
 * @param {string} key
 * @param {*} defaultValue
 */
function get(guildId, key, defaultValue = null) {
  const row = getStmt.get(guildId, key);
  if (!row) return defaultValue;
  try { return JSON.parse(row.value); } catch { return row.value; }
}

/**
 * Set a config value for a guild.
 * @param {string} guildId
 * @param {string} key
 * @param {*} value
 */
function set(guildId, key, value) {
  setStmt.run(guildId, key, JSON.stringify(value));
}

/**
 * Delete a config key for a guild.
 */
function del(guildId, key) {
  delStmt.run(guildId, key);
}

/**
 * Get all config for a guild as a plain object.
 */
function getAll(guildId) {
  const rows = allStmt.all(guildId);
  const result = {};
  for (const row of rows) {
    try { result[row.key] = JSON.parse(row.value); } catch { result[row.key] = row.value; }
  }
  return result;
}

module.exports = { get, set, del, getAll };
