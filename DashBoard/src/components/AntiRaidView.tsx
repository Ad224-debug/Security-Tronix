import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Settings2, 
  Activity, 
  Clock, 
  Users, 
  AlertOctagon, 
  Lock, 
  Save, 
  Hash, 
  Info,
  History
} from 'lucide-react';
import { AntiRaidConfig, RaidSensitivity, RaidAction } from '../types';
import { CHANNELS } from '../constants';

export default function AntiRaidView() {
  const [config, setConfig] = useState<AntiRaidConfig>({
    enabled: true,
    sensitivity: 'Medium',
    maxJoins: 10,
    perSeconds: 5,
    minAccountAgeDays: 3,
    action: 'Lockdown',
    lockdownChannels: ['1', '2'],
    lockdownDurationMinutes: 60,
    alertChannelId: '2'
  });

  const sensitivities: RaidSensitivity[] = ['Low', 'Medium', 'High', 'Paranoid'];
  const actions: RaidAction[] = ['Lockdown', 'Kick', 'Ban', 'Timeout'];

  const getSensitivityColor = (s: RaidSensitivity) => {
    switch (s) {
      case 'Low': return 'bg-discord-green';
      case 'Medium': return 'bg-discord-blurple';
      case 'High': return 'bg-orange-500';
      case 'Paranoid': return 'bg-discord-red';
      default: return 'bg-discord-muted';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-3 mb-2"
          >
            <div className="p-2 bg-discord-red/10 rounded-lg">
              <ShieldAlert className="text-discord-red" size={20} />
            </div>
            <span className="text-sm font-bold text-discord-red uppercase tracking-widest">Security Module</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold text-discord-header tracking-tight"
          >
            Anti-Raid Settings
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-discord-muted mt-2 max-w-xl"
          >
            Configure automated defenses to protect your server from mass-joining bot attacks and raid attempts.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button className="flex items-center space-x-2 bg-discord-blurple hover:bg-[#4752C4] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95">
            <Save size={18} />
            <span>Apply Changes</span>
          </button>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Master Controls & Main Settings */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Master Switch & Sensitivity */}
          <section className="bg-discord-card rounded-2xl p-8 border border-white/5 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${config.enabled ? 'bg-discord-blurple/20 text-discord-blurple' : 'bg-discord-muted/10 text-discord-muted'}`}>
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-discord-header">System Master Switch</h3>
                  <p className="text-discord-muted text-sm leading-relaxed">Enable or disable all Anti-Raid protections globally.</p>
                </div>
              </div>
              <button 
                onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner ${
                  config.enabled ? 'bg-discord-green' : 'bg-discord-muted'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    config.enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-discord-header uppercase tracking-wider">Detection Sensitivity</span>
                  <div className="group relative">
                    <Info size={14} className="text-discord-muted cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity w-48 text-center pointer-events-none">
                      Higher sensitivity results in faster but stricter raid detection.
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter text-white ${getSensitivityColor(config.sensitivity)}`}>
                  {config.sensitivity} Mode
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                {sensitivities.map((s) => (
                  <button
                    key={s}
                    onClick={() => setConfig(prev => ({ ...prev, sensitivity: s }))}
                    disabled={!config.enabled}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all border ${
                      config.sensitivity === s 
                        ? `${getSensitivityColor(s)} text-white border-transparent shadow-lg scale-[1.02]` 
                        : 'bg-discord-sidebar text-discord-muted border-black/20 hover:border-white/10'
                    } ${!config.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Detailed Detection Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Join Rate Card */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-discord-card rounded-2xl p-6 border border-white/5 shadow-lg group"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-discord-blurple/10 rounded-lg group-hover:bg-discord-blurple group-hover:text-white transition-all">
                  <Activity size={18} />
                </div>
                <h4 className="font-bold text-discord-header">Join Rate Limit</h4>
              </div>
              <p className="text-xs text-discord-muted mb-6 leading-relaxed">Detects a raid if more than <span className="text-discord-header font-bold">X members</span> join within <span className="text-discord-header font-bold">Y seconds</span>.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-discord-muted">Max Joins</span>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      value={config.maxJoins}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxJoins: parseInt(e.target.value) || 0 }))}
                      className="w-16 bg-discord-sidebar border border-black/20 rounded px-2 py-1 text-sm text-center text-discord-header focus:ring-1 focus:ring-discord-blurple outline-none"
                    />
                    <span className="text-xs text-discord-muted">Members</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-discord-muted">Time Window</span>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      value={config.perSeconds}
                      onChange={(e) => setConfig(prev => ({ ...prev, perSeconds: parseInt(e.target.value) || 0 }))}
                      className="w-16 bg-discord-sidebar border border-black/20 rounded px-2 py-1 text-sm text-center text-discord-header focus:ring-1 focus:ring-discord-blurple outline-none"
                    />
                    <span className="text-xs text-discord-muted">Seconds</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Account Age Card */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-discord-card rounded-2xl p-6 border border-white/5 shadow-lg group"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-discord-green/10 rounded-lg group-hover:bg-discord-green group-hover:text-white transition-all">
                  <Clock size={18} />
                </div>
                <h4 className="font-bold text-discord-header">Account Age Filter</h4>
              </div>
              <p className="text-xs text-discord-muted mb-6 leading-relaxed">Flags or auto-bans users whose Discord account is newer than <span className="text-discord-header font-bold">X days</span>.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-discord-muted">Minimum Age</span>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="range"
                      min="0"
                      max="30"
                      value={config.minAccountAgeDays}
                      onChange={(e) => setConfig(prev => ({ ...prev, minAccountAgeDays: parseInt(e.target.value) }))}
                      className="w-24 h-1.5 bg-discord-sidebar rounded-full appearance-none cursor-pointer accent-discord-green"
                    />
                    <span className="text-xs font-bold text-discord-green">{config.minAccountAgeDays} Days</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action & Lockdown Section */}
          <section className="bg-discord-card rounded-2xl p-8 border border-white/5 shadow-xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Action Dropdown */}
              <div>
                <label className="text-[10px] uppercase font-bold text-discord-muted block mb-3 tracking-widest">Raid Detection Action</label>
                <div className="relative">
                  <select
                    value={config.action}
                    onChange={(e) => setConfig(prev => ({ ...prev, action: e.target.value as RaidAction }))}
                    className="w-full pl-4 pr-10 py-3 bg-discord-sidebar border border-black/20 rounded-xl text-discord-header font-bold focus:ring-1 focus:ring-discord-blurple outline-none appearance-none cursor-pointer"
                  >
                    {actions.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-discord-muted pointer-events-none" size={18} />
                </div>
                <p className="text-[10px] text-discord-muted mt-2 italic">* {config.action === 'Lockdown' ? 'Server will be locked down until manually resolved.' : `Offenders will be ${config.action.toLowerCase()}ed immediately.`}</p>
              </div>

              {/* Lockdown Duration */}
              <div>
                <label className="text-[10px] uppercase font-bold text-discord-muted block mb-3 tracking-widest">Default Lockdown Duration</label>
                <div className="flex items-center space-x-4">
                  <input 
                    type="number" 
                    value={config.lockdownDurationMinutes}
                    onChange={(e) => setConfig(prev => ({ ...prev, lockdownDurationMinutes: parseInt(e.target.value) || 0 }))}
                    className="flex-1 bg-discord-sidebar border border-black/20 rounded-xl px-4 py-3 text-discord-header font-bold text-center focus:ring-1 focus:ring-discord-blurple outline-none"
                  />
                  <span className="text-sm font-bold text-discord-muted">Minutes</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <label className="text-[10px] uppercase font-bold text-discord-muted block mb-4 tracking-widest">Lockdown Channel scope</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CHANNELS.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setConfig(prev => {
                        const next = prev.lockdownChannels.includes(ch.id)
                          ? prev.lockdownChannels.filter(id => id !== ch.id)
                          : [...prev.lockdownChannels, ch.id];
                        return { ...prev, lockdownChannels: next };
                      });
                    }}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                      config.lockdownChannels.includes(ch.id)
                        ? 'bg-discord-blurple/10 border-discord-blurple text-discord-blurple shadow-sm'
                        : 'bg-discord-sidebar border-black/20 text-discord-muted hover:border-white/10'
                    }`}
                  >
                    <Hash size={14} className={config.lockdownChannels.includes(ch.id) ? 'text-discord-blurple' : 'text-discord-muted'} />
                    <span>{ch.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Status & Alerts */}
        <div className="space-y-8">
          
          {/* Current Status Card */}
          <div className="bg-discord-card rounded-2xl p-8 border border-white/5 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <AlertOctagon size={80} />
            </div>
            
            <h3 className="text-sm font-bold text-discord-muted uppercase tracking-wider mb-6">Real-time Defense Status</h3>
            
            <div className="space-y-8">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full animate-pulse ${config.enabled ? 'bg-discord-green' : 'bg-discord-red'}`} />
                <div>
                  <p className="text-xl font-black text-discord-header">INACTIVE</p>
                  <p className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">Current Raid Status</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-discord-muted">
                    <History size={14} />
                    <span className="text-xs font-semibold">Last Raid Attempt</span>
                  </div>
                  <span className="text-xs font-bold text-discord-header">12 days ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-discord-muted">
                    <ShieldAlert size={14} />
                    <span className="text-xs font-semibold">Total Detections</span>
                  </div>
                  <span className="text-xs font-bold text-discord-header">24 Raids</span>
                </div>
              </div>

              <button className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 group">
                <AlertOctagon size={16} />
                <span>Emergency Lockdown</span>
              </button>
            </div>
          </div>

          {/* Alert Channel Selector */}
          <div className="bg-discord-card rounded-2xl p-6 border border-white/5 shadow-xl">
            <h3 className="text-sm font-bold text-discord-muted uppercase tracking-wider mb-4">Security Notifications</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-discord-muted font-bold block mb-2 uppercase">Alert Log Channel</label>
                <div className="relative">
                  <select
                    value={config.alertChannelId || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, alertChannelId: e.target.value }))}
                    className="w-full pl-4 pr-10 py-3 bg-discord-sidebar border border-black/20 rounded-xl text-sm text-discord-header font-bold focus:ring-1 focus:ring-discord-blurple outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select a channel</option>
                    {CHANNELS.map(ch => (
                      <option key={ch.id} value={ch.id}>#{ch.name}</option>
                    ))}
                  </select>
                  <Hash className="absolute right-4 top-1/2 -translate-y-1/2 text-discord-muted pointer-events-none" size={16} />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-discord-sidebar rounded-lg border border-black/10">
                <div className="flex items-center space-x-2">
                  <Users size={16} className="text-discord-muted" />
                  <span className="text-xs font-bold text-discord-header">Ping Staff Role</span>
                </div>
                <div className="w-8 h-4 bg-discord-blurple rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-0.5 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
