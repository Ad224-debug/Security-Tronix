import React from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Hash } from 'lucide-react';
import { LogConfig } from '../types';

interface Channel { id: string; name: string; }

interface LogCardProps {
  log: LogConfig;
  channels: Channel[];
  onToggle: (id: string) => void;
  onChannelChange: (id: string, channelId: string) => void;
}

export default function LogCard({ log, channels, onToggle, onChannelChange }: LogCardProps) {
  return (
    <motion.div
      layout
      className={`bg-discord-card rounded-xl p-5 border transition-colors shadow-lg ${
        log.enabled ? 'border-discord-blurple/40' : 'border-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 pr-3">
          <h3 className="text-discord-header font-bold text-base">{log.name}</h3>
          <p className="text-discord-muted text-xs mt-1 leading-relaxed">{log.description}</p>
        </div>

        {/* Toggle */}
        <button
          onClick={() => onToggle(log.id)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
            log.enabled ? 'bg-discord-green' : 'bg-discord-muted/50'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            log.enabled ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-discord-muted uppercase tracking-wider whitespace-nowrap">Canal</span>

        <div className="relative flex-1 max-w-[200px]">
          <select
            value={log.channelId || ''}
            onChange={e => onChannelChange(log.id, e.target.value)}
            disabled={!log.enabled}
            className={`w-full pl-7 pr-8 py-1.5 rounded-lg text-sm bg-discord-sidebar border border-black/20 focus:outline-none focus:ring-1 focus:ring-discord-blurple appearance-none transition-opacity text-discord-header ${
              !log.enabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-[#1a1c1e]'
            }`}
          >
            <option value="" disabled>Seleccionar canal</option>
            {channels.map(ch => (
              <option key={ch.id} value={ch.id}>#{ch.name}</option>
            ))}
          </select>
          <Hash className="absolute left-2 top-1/2 -translate-y-1/2 text-discord-muted pointer-events-none" size={13} />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-discord-muted pointer-events-none" size={13} />
        </div>
      </div>

      {log.enabled && !log.channelId && (
        <p className="text-xs text-yellow-400 mt-2">⚠️ Seleccioná un canal para activar este log</p>
      )}
    </motion.div>
  );
}
