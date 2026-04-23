import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Settings2, 
  ShieldAlert, 
  Lock, 
  Trash2, 
  UserPlus, 
  Search, 
  Filter, 
  Save, 
  History, 
  AlertTriangle,
  Gavel,
  Ghost,
  ShieldCheck,
  ChevronDown,
  Hash
} from 'lucide-react';
import { ModCase, ModerationConfig, ModCaseType, StrikeAction } from '../types';
import { MOD_CASES, CHANNELS, ROLES } from '../constants';

export default function ModerationView() {
  const [activeTab, setActiveTab] = useState<'cases' | 'settings'>('cases');
  const [typeFilter, setTypeFilter] = useState<ModCaseType | 'all'>('all');
  const [config, setConfig] = useState<ModerationConfig>({
    warnAutoAction: {
      enabled: true,
      threshold: 3,
      action: 'Timeout' as StrikeAction
    },
    jailSystem: {
      jailRoleId: '3',
      jailChannelId: '2'
    },
    modRoleId: '2'
  });

  const filteredCases = typeFilter === 'all' 
    ? MOD_CASES 
    : MOD_CASES.filter(c => c.type === typeFilter);

  const getBadgeColor = (type: ModCaseType) => {
    switch (type) {
      case 'ban': return 'bg-discord-red/10 text-discord-red border-discord-red/20';
      case 'kick': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'warn': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'timeout': return 'bg-discord-blurple/10 text-discord-blurple border-discord-blurple/20';
      default: return 'bg-discord-muted/10 text-discord-muted';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Page Header */}
      <header>
        <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-discord-blurple/10 rounded-lg text-discord-blurple">
                <Users size={20} />
            </div>
            <span className="text-sm font-bold text-discord-blurple uppercase tracking-widest">Enforcement Center</span>
        </div>
        <h1 className="text-4xl font-extrabold text-discord-header tracking-tight">System Moderation</h1>
      </header>

      {/* Tab Switcher */}
      <div className="flex space-x-1 bg-discord-sidebar p-1 rounded-xl border border-white/5 w-fit">
        <button 
            onClick={() => setActiveTab('cases')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'cases' ? 'bg-discord-card text-white shadow-lg' : 'text-discord-muted hover:text-discord-header'
            }`}
        >
            Recent Cases
        </button>
        <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'settings' ? 'bg-discord-card text-white shadow-lg' : 'text-discord-muted hover:text-discord-header'
            }`}
        >
            Settings
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'cases' ? (
          <motion.div
            key="cases"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                    <Filter size={16} className="text-discord-muted" />
                    <span className="text-[10px] font-black text-discord-muted uppercase tracking-widest">Filter by Type</span>
                    <div className="flex items-center space-x-1.5 ml-2">
                        {(['all', 'ban', 'kick', 'warn', 'timeout'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setTypeFilter(f)}
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all border ${
                                    typeFilter === f 
                                    ? 'bg-discord-blurple text-white border-transparent' 
                                    : 'bg-discord-card text-discord-muted border-white/5 hover:border-white/10'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-muted" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search cases..."
                        className="pl-10 pr-4 py-2 bg-discord-sidebar border border-black/20 rounded-lg text-xs text-discord-header focus:ring-1 focus:ring-discord-blurple outline-none w-64"
                    />
                </div>
            </div>

            {/* Cases Table */}
            <div className="bg-discord-card rounded-2xl border border-white/5 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-black/20 border-b border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black text-discord-muted uppercase tracking-wider">Case#</th>
                                <th className="px-6 py-4 text-[10px] font-black text-discord-muted uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black text-discord-muted uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-[10px] font-black text-discord-muted uppercase tracking-wider">Moderator</th>
                                <th className="px-6 py-4 text-[10px] font-black text-discord-muted uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-4 text-[10px] font-black text-discord-muted uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-discord-muted uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredCases.map((c) => (
                                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-mono font-black text-discord-blurple">#{c.id}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-tighter shadow-sm ${getBadgeColor(c.type)}`}>
                                            {c.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-discord-header">{c.user}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-discord-muted">{c.moderator}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-discord-muted truncate max-w-[200px] block">{c.reason}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-discord-muted font-medium">{c.date}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-discord-card rounded-lg text-discord-muted hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                            <History size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Warn Auto-Action */}
            <section className="bg-discord-card rounded-2xl p-8 border border-white/5 shadow-xl space-y-6 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-discord-header">Warn Auto-Action</h3>
                            <p className="text-xs text-discord-muted">Execute tasks when warnings hit a threshold.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setConfig(prev => ({ 
                            ...prev, 
                            warnAutoAction: { ...prev.warnAutoAction, enabled: !prev.warnAutoAction.enabled } 
                        }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            config.warnAutoAction.enabled ? 'bg-discord-green' : 'bg-discord-muted'
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.warnAutoAction.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className={`space-y-6 flex-1 ${!config.warnAutoAction.enabled && 'opacity-30 pointer-events-none'}`}>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">Warning Threshold</label>
                        <div className="flex items-center space-x-4">
                            <input 
                                type="number" 
                                value={config.warnAutoAction.threshold}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    warnAutoAction: { ...prev.warnAutoAction, threshold: parseInt(e.target.value) || 0 }
                                }))}
                                className="w-full bg-discord-sidebar border border-black/20 rounded-xl px-4 py-3 text-discord-header font-bold focus:ring-1 focus:ring-discord-blurple outline-none"
                            />
                            <span className="text-xs font-bold text-discord-muted">Warnings</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">Action to Take</label>
                        <div className="relative">
                            <select 
                                value={config.warnAutoAction.action}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    warnAutoAction: { ...prev.warnAutoAction, action: e.target.value as StrikeAction }
                                }))}
                                className="w-full pl-4 pr-10 py-3 bg-discord-sidebar border border-black/20 rounded-xl text-sm font-bold text-discord-header outline-none appearance-none cursor-pointer"
                            >
                                {(['None', 'Warn', 'Timeout', 'Kick', 'Ban'] as StrikeAction[]).map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-discord-muted" size={16} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Jail System */}
            <section className="bg-discord-card rounded-2xl p-8 border border-white/5 shadow-xl space-y-6">
                <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-discord-red/10 rounded-lg text-discord-red">
                        <Lock size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-discord-header">Virtual Jail System</h3>
                        <p className="text-xs text-discord-muted">Isolate users without removing them.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">Jailed Role</label>
                        <div className="relative">
                            <select 
                                value={config.jailSystem.jailRoleId || ''}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    jailSystem: { ...prev.jailSystem, jailRoleId: e.target.value }
                                }))}
                                className="w-full pl-10 pr-4 py-3 bg-discord-sidebar border border-black/20 rounded-xl text-sm font-bold text-discord-header outline-none appearance-none cursor-pointer"
                            >
                                <option value="" disabled>Select jail role</option>
                                {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-muted" size={18} />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-discord-muted" size={16} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">Jail Logic Channel</label>
                        <div className="relative">
                            <select 
                                value={config.jailSystem.jailChannelId || ''}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    jailSystem: { ...prev.jailSystem, jailChannelId: e.target.value }
                                }))}
                                className="w-full pl-10 pr-4 py-3 bg-discord-sidebar border border-black/20 rounded-xl text-sm font-bold text-discord-header outline-none appearance-none cursor-pointer"
                            >
                                <option value="" disabled>Select jail channel</option>
                                {CHANNELS.map(ch => <option key={ch.id} value={ch.id}>#{ch.name}</option>)}
                            </select>
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-muted" size={18} />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-discord-muted" size={16} />
                        </div>
                    </div>
                </div>
            </section>

            {/* General Mod Settings */}
            <section className="bg-discord-card rounded-2xl p-8 border border-white/5 shadow-xl lg:col-span-2 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-discord-blurple/10 rounded-2xl text-discord-blurple">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-discord-header">Authority Settings</h3>
                        <p className="text-sm text-discord-muted">Define who can execute administrative commands.</p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">Master Moderator Role</label>
                        <div className="relative min-w-[200px]">
                            <select 
                                value={config.modRoleId || ''}
                                onChange={(e) => setConfig(prev => ({ ...prev, modRoleId: e.target.value }))}
                                className="w-full pl-4 pr-10 py-3 bg-discord-sidebar border border-black/20 rounded-xl text-sm font-bold text-discord-header outline-none appearance-none cursor-pointer"
                            >
                                {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-discord-muted" size={16} />
                        </div>
                    </div>
                    
                    <button className="flex items-center space-x-2 bg-discord-blurple hover:bg-[#4752C4] text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 translate-y-3">
                        <Save size={18} />
                        <span>Save Config</span>
                    </button>
                </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
