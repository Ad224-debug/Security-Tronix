import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Settings, 
  Eye, 
  Zap, 
  AtSign, 
  Link2, 
  Globe, 
  Type, 
  AlertTriangle, 
  Save, 
  Info,
  ChevronRight,
  Plus,
  X,
  Target
} from 'lucide-react';
import { AutomodConfig, AutomodSeverity, StrikeAction } from '../types';

export default function AutomodView() {
  const [config, setConfig] = useState<AutomodConfig>({
    nsfwFilter: { enabled: true, severity: 'Medium' },
    spamDetection: { enabled: true, maxMessages: 5, timeWindowSeconds: 10 },
    massMentions: { enabled: true, maxMentions: 10 },
    linkFilter: { enabled: true, whitelist: ['youtube.com', 'twitch.tv'] },
    inviteFilter: { enabled: true },
    capsFilter: { enabled: false, percentage: 70 },
    strikes: {
      strike1: 'Warn',
      strike2: 'Timeout',
      strike3: 'Ban'
    }
  });

  const [newLink, setNewLink] = useState('');

  const severities: AutomodSeverity[] = ['Low', 'Medium', 'High'];
  const strikeActions: StrikeAction[] = ['None', 'Warn', 'Timeout', 'Kick', 'Ban'];

  const RuleHeader = ({ 
    icon: Icon, 
    title, 
    desc, 
    enabled, 
    onToggle 
  }: { 
    icon: any; 
    title: string; 
    desc: string; 
    enabled: boolean; 
    onToggle: () => void 
  }) => (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg transition-colors ${enabled ? 'bg-discord-blurple/10 text-discord-blurple' : 'bg-discord-muted/10 text-discord-muted'}`}>
          <Icon size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-discord-header">{title}</h3>
          <p className="text-[10px] text-discord-muted uppercase font-bold tracking-widest">{desc}</p>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          enabled ? 'bg-discord-green' : 'bg-discord-muted'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-3 mb-2"
          >
            <div className="p-2 bg-discord-blurple/10 rounded-lg text-discord-blurple">
              <ShieldAlert size={20} />
            </div>
            <span className="text-sm font-bold text-discord-blurple uppercase tracking-widest">Active Enforcement</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold text-discord-header tracking-tight"
          >
            Automod Configuration
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-discord-muted mt-2 max-w-xl"
          >
            Define automated rules to maintain server order. These systems run 24/7, intercepting violations before they affect your community.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button className="flex items-center space-x-2 bg-discord-blurple hover:bg-[#4752C4] text-white px-8 py-3 rounded-xl font-black text-sm transition-all shadow-xl active:scale-95">
            <Save size={18} />
            <span>Apply Ruleset</span>
          </button>
        </motion.div>
      </header>

      {/* Automod Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* NSFW Filter */}
        <section className="bg-discord-card rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col group">
          <RuleHeader 
            icon={Eye} 
            title="NSFW Filter" 
            desc="Media & Text Scanner"
            enabled={config.nsfwFilter.enabled}
            onToggle={() => setConfig(prev => ({ ...prev, nsfwFilter: { ...prev.nsfwFilter, enabled: !prev.nsfwFilter.enabled } }))}
          />
          <div className={`space-y-4 flex-1 ${!config.nsfwFilter.enabled && 'opacity-30 pointer-events-none transition-opacity'}`}>
            <label className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">Sensitivity Level</label>
            <div className="flex gap-2">
              {severities.map(s => (
                <button
                  key={s}
                  onClick={() => setConfig(prev => ({ ...prev, nsfwFilter: { ...prev.nsfwFilter, severity: s } }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                    config.nsfwFilter.severity === s 
                      ? 'bg-discord-blurple text-white border-transparent shadow-lg' 
                      : 'bg-discord-sidebar text-discord-muted border-black/20'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Spam Detection */}
        <section className="bg-discord-card rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col group">
          <RuleHeader 
            icon={Zap} 
            title="Spam Detection" 
            desc="Anti-Flood System"
            enabled={config.spamDetection.enabled}
            onToggle={() => setConfig(prev => ({ ...prev, spamDetection: { ...prev.spamDetection, enabled: !prev.spamDetection.enabled } }))}
          />
          <div className={`space-y-6 flex-1 ${!config.spamDetection.enabled && 'opacity-30 pointer-events-none transition-opacity'}`}>
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold text-discord-muted uppercase">Max Messages</label>
                <span className="text-xs font-bold text-discord-header">{config.spamDetection.maxMessages} Messages</span>
              </div>
              <input 
                type="range" min="1" max="20" 
                value={config.spamDetection.maxMessages}
                onChange={(e) => setConfig(prev => ({ ...prev, spamDetection: { ...prev.spamDetection, maxMessages: parseInt(e.target.value) } }))}
                className="w-full h-1.5 bg-discord-sidebar rounded-full appearance-none cursor-pointer accent-discord-blurple"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold text-discord-muted uppercase">Time Window</label>
                <span className="text-xs font-bold text-discord-header">{config.spamDetection.timeWindowSeconds} Seconds</span>
              </div>
              <input 
                type="range" min="1" max="60" 
                value={config.spamDetection.timeWindowSeconds}
                onChange={(e) => setConfig(prev => ({ ...prev, spamDetection: { ...prev.spamDetection, timeWindowSeconds: parseInt(e.target.value) } }))}
                className="w-full h-1.5 bg-discord-sidebar rounded-full appearance-none cursor-pointer accent-discord-blurple"
              />
            </div>
          </div>
        </section>

        {/* Mass Mentions */}
        <section className="bg-discord-card rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col group">
          <RuleHeader 
            icon={AtSign} 
            title="Mass Mentions" 
            desc="Ghost Ping Defense"
            enabled={config.massMentions.enabled}
            onToggle={() => setConfig(prev => ({ ...prev, massMentions: { ...prev.massMentions, enabled: !prev.massMentions.enabled } }))}
          />
          <div className={`space-y-4 flex-1 ${!config.massMentions.enabled && 'opacity-30 pointer-events-none transition-opacity'}`}>
            <label className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">Max Mentions per Message</label>
            <div className="flex items-center space-x-3">
              <input 
                type="number" 
                value={config.massMentions.maxMentions}
                onChange={(e) => setConfig(prev => ({ ...prev, massMentions: { ...prev.massMentions, maxMentions: parseInt(e.target.value) || 0 } }))}
                className="w-full bg-discord-sidebar border border-black/20 rounded-xl px-4 py-3 text-discord-header font-bold focus:ring-1 focus:ring-discord-blurple outline-none"
              />
              <span className="text-xs font-bold text-discord-muted">Mentions</span>
            </div>
          </div>
        </section>

        {/* Link Filter */}
        <section className="bg-discord-card rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col group col-span-1 md:col-span-2">
          <RuleHeader 
            icon={Link2} 
            title="Link Filter" 
            desc="URL Sanitization"
            enabled={config.linkFilter.enabled}
            onToggle={() => setConfig(prev => ({ ...prev, linkFilter: { ...prev.linkFilter, enabled: !prev.linkFilter.enabled } }))}
          />
          <div className={`flex flex-col md:flex-row gap-6 flex-1 ${!config.linkFilter.enabled && 'opacity-30 pointer-events-none transition-opacity'}`}>
            <div className="flex-1 space-y-4">
              <label className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">Trusted Domain Whitelist</label>
              <div className="bg-discord-sidebar/50 rounded-xl p-3 border border-black/20 flex flex-wrap gap-2">
                <AnimatePresence>
                  {config.linkFilter.whitelist.map(link => (
                    <motion.div 
                      key={link}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-discord-sidebar px-2 py-1 rounded-md text-[10px] font-bold text-discord-header flex items-center space-x-2 border border-white/5"
                    >
                      <span>{link}</span>
                      <button onClick={() => setConfig(prev => ({ ...prev, linkFilter: { ...prev.linkFilter, whitelist: prev.linkFilter.whitelist.filter(l => l !== link) } }))}>
                        <X size={10} className="hover:text-discord-red" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div className="flex-1 min-w-[120px]">
                  <input 
                    type="text" 
                    placeholder="Add domain (e.g. google.com)"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLink) {
                        setConfig(prev => ({ ...prev, linkFilter: { ...prev.linkFilter, whitelist: [...prev.linkFilter.whitelist, newLink] } }));
                        setNewLink('');
                      }
                    }}
                    className="w-full bg-transparent border-none outline-none text-xs text-discord-header py-1"
                  />
                </div>
              </div>
            </div>
            <div className="w-full md:w-48 bg-discord-sidebar/30 rounded-xl p-4 border border-white/5">
                <h4 className="text-[10px] font-bold text-discord-header uppercase mb-2">Policy Info</h4>
                <p className="text-[10px] text-discord-muted leading-relaxed italic">
                  Links from these domains will bypass scanning. All others will be flagged and removed.
                </p>
            </div>
          </div>
        </section>

        {/* Discord Invite Filter */}
        <section className="bg-discord-card rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col group">
          <RuleHeader 
            icon={Globe} 
            title="Invite Filter" 
            desc="Anti-Advertising"
            enabled={config.inviteFilter.enabled}
            onToggle={() => setConfig(prev => ({ ...prev, inviteFilter: { ...prev.inviteFilter, enabled: !prev.inviteFilter.enabled } }))}
          />
          <div className={`space-y-4 flex-1 ${!config.inviteFilter.enabled && 'opacity-30 pointer-events-none transition-opacity'}`}>
            <div className="flex items-start space-x-3 p-3 bg-discord-red/5 border border-discord-red/10 rounded-lg">
              <AlertTriangle className="text-discord-red shrink-0" size={16} />
              <p className="text-[10px] text-discord-muted leading-relaxed">
                Aggressively removes `discord.gg/` invites from third-party servers. 
              </p>
            </div>
            <p className="text-[10px] text-discord-muted italic">* Note: This does not affect links to your own server.</p>
          </div>
        </section>

        {/* Caps Filter */}
        <section className="bg-discord-card rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col group">
          <RuleHeader 
            icon={Type} 
            title="Caps Filter" 
            desc="Tone Regulation"
            enabled={config.capsFilter.enabled}
            onToggle={() => setConfig(prev => ({ ...prev, capsFilter: { ...prev.capsFilter, enabled: !prev.capsFilter.enabled } }))}
          />
          <div className={`space-y-6 flex-1 ${!config.capsFilter.enabled && 'opacity-30 pointer-events-none transition-opacity'}`}>
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold text-discord-muted uppercase">Max Caps Percentage</label>
                <span className="text-xs font-bold text-discord-header">{config.capsFilter.percentage}% Caps</span>
              </div>
              <input 
                type="range" min="30" max="100" 
                value={config.capsFilter.percentage}
                onChange={(e) => setConfig(prev => ({ ...prev, capsFilter: { ...prev.capsFilter, percentage: parseInt(e.target.value) } }))}
                className="w-full h-1.5 bg-discord-sidebar rounded-full appearance-none cursor-pointer accent-discord-blurple"
              />
            </div>
            <p className="text-[10px] text-discord-muted leading-relaxed">
              Messages exceeding this percentage of uppercase characters will be deleted.
            </p>
          </div>
        </section>
      </div>

      {/* RB3 Strike System Section */}
      <section className="bg-discord-card rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <Target size={120} />
        </div>
        
        <div className="flex items-center space-x-3 mb-10">
            <div className="p-2 bg-discord-red/10 rounded-lg text-discord-red">
                <AlertTriangle size={24} />
            </div>
            <div>
                <h3 className="text-2xl font-black text-discord-header">RB3 Tactical Strike System</h3>
                <p className="text-sm text-discord-muted">Define progressive punishments for repeat offenders within short timeframes.</p>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-1 w-full space-y-6">
                {[
                    { label: 'Strike 1', key: 'strike1', icon: 1 },
                    { label: 'Strike 2', key: 'strike2', icon: 2 },
                    { label: 'Strike 3', key: 'strike3', icon: 3 }
                ].map((strike, i) => (
                    <div key={strike.key} className="flex items-center space-x-6 relative">
                        <div className="flex flex-col items-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl border-4 ${
                                i === 0 ? 'bg-discord-green/20 border-discord-green text-discord-green' :
                                i === 1 ? 'bg-orange-500/20 border-orange-500 text-orange-500' :
                                'bg-discord-red/20 border-discord-red text-discord-red'
                            }`}>
                                {strike.icon}
                            </div>
                            {i < 2 && <div className="w-1 h-12 bg-white/5 my-2" />}
                        </div>
                        
                        <div className="flex-1 bg-discord-sidebar/50 rounded-2xl p-6 border border-white/5 hover:border-discord-blurple/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-black text-discord-header uppercase tracking-widest">{strike.label}</h4>
                                <p className="text-[10px] text-discord-muted">Executed upon {i + 1} Automod violation(s) within 24 hours.</p>
                            </div>
                            
                            <div className="relative min-w-[160px]">
                                <select 
                                    value={config.strikes[strike.key as keyof typeof config.strikes]}
                                    onChange={(e) => setConfig(prev => ({ 
                                      ...prev, 
                                      strikes: { ...prev.strikes, [strike.key]: e.target.value as StrikeAction } 
                                    }))}
                                    className="w-full pl-4 pr-10 py-3 bg-discord-card border border-black/20 rounded-xl text-xs font-bold text-discord-header outline-none focus:ring-1 focus:ring-discord-blurple appearance-none cursor-pointer"
                                >
                                    {strikeActions.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-discord-muted rotate-90" size={16} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="lg:w-72 w-full space-y-4">
                <div className="bg-discord-sidebar/30 rounded-2xl p-6 border border-white/5">
                    <h5 className="text-xs font-black text-discord-header uppercase tracking-widest mb-4">Tactical Summary</h5>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-discord-muted font-bold">Resets After</span>
                            <span className="text-[10px] text-discord-header font-bold uppercase">24 Hours</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-discord-muted font-bold">Strike Memory</span>
                            <span className="text-[10px] text-discord-header font-bold uppercase">Sliding Window</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-discord-muted font-bold">Escalation Mode</span>
                            <span className="text-[10px] text-discord-blurple font-black uppercase tracking-tighter">Hardened RB3</span>
                        </div>
                    </div>
                </div>
                <button className="w-full py-4 bg-discord-sidebar/50 hover:bg-discord-muted/20 border border-white/5 rounded-2xl text-[10px] font-black text-discord-muted uppercase tracking-widest transition-all">
                    Reset Global Strikes
                </button>
            </div>
        </div>
      </section>

      {/* Info Banner */}
      <div className="flex items-start space-x-3 p-4 bg-discord-sidebar/20 rounded-xl border border-white/5">
        <Info className="text-discord-muted shrink-0 mt-0.5" size={16} />
        <p className="text-[10px] text-discord-muted leading-relaxed italic">
          Automod rules are processed in real-time. Members with `Manage Messages` or higher permissions are <span className="text-discord-header font-bold">automatically exempt</span> from these filters to prevent disruption of staff duties.
        </p>
      </div>
    </div>
  );
}
