/**
 * cache.js — SQLite-based local cache para evitar hits repetidos a APIs externas
 * TTL por defecto: 6 horas para IPs, 24 horas para URLs
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'cache.db'));

// Crear tabla si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS cache (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_expires ON cache(expires_at);
`);

// Limpiar entradas expiradas al iniciar
db.prepare('DELETE FROM cache WHERE expires_at < ?').run(Date.now());

const get = (key) => {
  const row = db.prepare('SELECT value, expires_at FROM cache WHERE key = ?').get(key);
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    db.prepare('DELETE FROM cache WHERE key = ?').run(key);
    return null;
  }
  return JSON.parse(row.value);
};

const set = (key, value, ttlMs = 6 * 60 * 60 * 1000) => {
  db.prepare('INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)')
    .run(key, JSON.stringify(value), Date.now() + ttlMs);
};

const del = (key) => {
  db.prepare('DELETE FROM cache WHERE key = ?').run(key);
};

// Limpiar expirados cada hora
setInterval(() => {
  db.prepare('DELETE FROM cache WHERE expires_at < ?').run(Date.now());
}, 60 * 60 * 1000);

module.exports = { get, set, del };
