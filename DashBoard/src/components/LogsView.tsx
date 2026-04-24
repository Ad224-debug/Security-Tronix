import React, { useState, useEffect, useRef } from 'react';
import LogCard from './LogCard';
import { INITIAL_LOGS } from '../constants';
import { LogConfig } from '../types';
import { Search, Save, Settings2, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Channel { id: string; name: string; }

async function saveLogs(guildId: string, logs: LogConfig[]) {
  const payload: Record<string, string> = {};
  for (const log of logs) {
    if (log.enabled && log.channelId) {
      payload[log.id] = log.channelId;
    }
  }
  console.log('[saveLogs] payload:', payload);
  return fetch(`/api/guild/${guildId}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export default function LogsView() {
  const [logs, setLogs] = useState<LogConfig[]>(INITIAL_LOGS);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const loadedRef = useRef(false);

  const guildId = localStorage.getItem('selectedGuildId');

  useEffect(() => {
    if (!guildId) return;
    Promise.all([
      fetch(`/api/guild/${guildId}/logs`).then(r => r.json()),
      fetch(`/api/guild/${guildId}/channels`).then(r => r.json()),
    ]).then(([logsData, channelsData]) => {
      setLogs(INITIAL_LOGS.map(log => ({
        ...log,
        enabled: !!logsData[log.id],
        channelId: logsData[log.id] || null,
      })));
      setChannels(channelsData);
      setLoading(false);
      loadedRef.current = true;
    }).catch(() => setLoading(false));
  }, [guildId]);

  const handleToggle = (id: string) => {
    setLogs(prev => prev.map(log =>
      log.id === id ? { ...log, enabled: !log.enabled } : log
    ));
  };

  const handleChannelChange = (id: string, channelId: string) => {
    setLogs(prev => prev.map(log =>
      log.id === id ? { ...log, channelId, enabled: true } : log
    ));
  };

  const handleSave = async () => {
    if (!guildId || saving) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await saveLogs(guildId, logs);
      setSaveStatus(res.ok ? 'success' : 'error');
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enabledCount = logs.filter(l => l.enabled && l.channelId).length;

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-discord-blurple/10 rounded-lg">
              <Settings2 className="text-discord-blurple" size={20} />
            </div>
            <span className="text-sm font-bold text-discord-blurple uppercase tracking-widest">Configuration</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-discord-header tracking-tight">
            Logs Configuration
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-discord-muted mt-2 max-w-xl">
            {loading ? 'Cargando configuración...' : `${enabledCount} de ${logs.length} logs activos`}
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-muted" size={16} />
            <input
              type="text"
              placeholder="Buscar logs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-discord-sidebar border border-black/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-discord-blurple w-64 transition-all text-discord-header"
            />
          </div>

          {saving && (
            <div className="flex items-center space-x-2 text-discord-muted text-sm">
              <Loader size={14} className="animate-spin" />
              <span>Guardando...</span>
            </div>
          )}
          {saveStatus === 'success' && !saving && (
            <div className="flex items-center space-x-2 text-discord-green text-sm">
              <CheckCircle size={14} />
              <span>¡Guardado!</span>
            </div>
          )}
          {saveStatus === 'error' && !saving && (
            <div className="flex items-center space-x-2 text-discord-red text-sm">
              <AlertCircle size={14} />
              <span>Error al guardar</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center space-x-2 bg-discord-blurple hover:bg-[#4752C4] disabled:opacity-50 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-lg active:scale-95"
          >
            {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Guardar</span>
          </button>
        </motion.div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-discord-card rounded-xl p-5 border border-white/5 h-36 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
          <AnimatePresence mode="popLayout">
            {filteredLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <LogCard
                  log={log}
                  channels={channels}
                  onToggle={handleToggle}
                  onChannelChange={handleChannelChange}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && filteredLogs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search size={32} className="text-discord-muted mb-2" />
          <h3 className="text-xl font-bold text-discord-header">No se encontraron logs</h3>
        </div>
      )}
    </div>
  );
}
