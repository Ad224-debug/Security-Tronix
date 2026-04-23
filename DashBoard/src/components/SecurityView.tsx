import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Globe, 
  Link2, 
  Users, 
  Bot, 
  BarChart3, 
  Plus, 
  Trash2, 
  Save, 
  Hash, 
  ExternalLink,
  Lock,
  Search,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { SecurityConfig, AllowedBot } from '../types';
import { CHANNELS } from '../constants';

const IntegrationBadge = ({ name, color = "bg-[#7289da]" }: { name: string; color?: string }) => (
  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter text-white ${color} flex items-center space-x-1 shadow-sm`}>
    <span>{name}</span>
    <CheckCircle2 size={8} />
  </span>
);

export default function SecurityView() {
  const [config, setConfig] = useState<SecurityConfig>({
    ipReputation: true,
    phishingDetection: true,
    altDetection: true,
    altMinAgeDays: 7,
    botProtection: false,
    allowedBots: [
      { id: '1', name: 'MEE6', avatar: 'https://cdn.discordapp.com/avatars/159985870458322944/b50adff099924dd5e6b7ffc3113ebff1.webp' },
      { id: '2', name: 'Dyno', avatar: 'https://cdn.discordapp.com/avatars/155149108183695360/37fd6919a32c66863675e0f735ac96ab.webp' }
    ],
    trustScoreThreshold: 45,
    alertChannelId: '2',
    displayJoinScore: true
  });

  const [newBotId, setNewBotId] = useState('');

  const removeBot = (id: string) => {
    setConfig(prev => ({
      ...prev,
      allowedBots: prev.allowedBots.filter(b => b.id !== id)
    }));
  };

  const addBot = () => {
    if (!newBotId) return;
    const newBot: AllowedBot = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Entity ${newBotId.substr(0, 4)}`,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${newBotId}`
    };
    setConfig(prev => ({
      ...prev,
      allowedBots: [...prev.allowedBots, newBot]
    }));
    setNewBotId('');
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-discord-red';
    if (score < 60) return 'text-orange-500';
    return 'text-discord-green';
  };

  const getScoreBg = (score: number) => {
    if (score < 30) return 'bg-discord-red';
    if (score < 60) return 'bg-orange-500';
    return 'bg-discord-green';
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
            <div className="p-2 bg-discord-blurple/10 rounded-lg">
              <Lock className="text-discord-blurple" size={20} />
            </div>
            <span className="text-sm font-bold text-discord-blurple uppercase tracking-widest">Protection Matrix</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold text-discord-header tracking-tight"
          >
            Security Settings
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-discord-muted mt-2 max-w-xl"
          >
            Enhanced threat detection systems including IP reputation, phishing link filtering, and identity verification.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button className="flex items-center space-x-2 bg-discord-blurple hover:bg-[#4752C4] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95">
            <Save size={18} />
            <span>Save Security Matrix</span>
          </button>
        </motion.div>
      </header>

      {/* Grid of Security Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        
        {/* IP Reputation Check */}
        <section className="bg-discord-card rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col justify-between group">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-all text-blue-500">
                  <Globe size={20} />
                </div>
                <h3 className="text-lg font-bold text-discord-header">IP Reputation Check</h3>
              </div>
              <button 
                onClick={() => setConfig(prev => ({ ...prev, ipReputation: !prev.ipReputation }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    config.ipReputation ? 'bg-discord-green' : 'bg-discord-muted'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.ipReputation ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className="text-sm text-discord-muted leading-relaxed mb-6">
              Blocks connections from known malicious IP addresses, VPNs, and proxies associated with spam and attacks.
            </p>
          </div>
          <div className="flex items-center space-x-2 pt-4 border-t border-white/5">
            <span className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">Powered by</span>
            <IntegrationBadge name="AbuseIPDB" color="bg-[#1e1e1e]" />
          </div>
        </section>

        {/* Phishing Detection */}
        <section className="bg-discord-card rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col justify-between group">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-discord-red/10 rounded-lg group-hover:bg-discord-red group-hover:text-white transition-all text-discord-red">
                  <Link2 size={20} />
                </div>
                <h3 className="text-lg font-bold text-discord-header">Phishing Detection</h3>
              </div>
              <button 
                onClick={() => setConfig(prev => ({ ...prev, phishingDetection: !prev.phishingDetection }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    config.phishingDetection ? 'bg-discord-green' : 'bg-discord-muted'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.phishingDetection ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className="text-sm text-discord-muted leading-relaxed mb-6">
              Scans all messages for suspicious links and deletes known phishing campaigns before your users click them.
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-2 pt-4 border-t border-white/5">
            <span className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">Connected Databases</span>
            <IntegrationBadge name="FishFish" />
            <IntegrationBadge name="OTX AlienVault" color="bg-discord-blurple" />
            <IntegrationBadge name="ThreatFox" color="bg-orange-600" />
          </div>
        </section>

        {/* Alt Account Detection */}
        <section className="bg-discord-card rounded-2xl p-6 border border-white/5 shadow-xl group">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-discord-green/10 rounded-lg group-hover:bg-discord-green group-hover:text-white transition-all text-discord-green">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-bold text-discord-header">Alt Account Detection</h3>
            </div>
            <button 
              onClick={() => setConfig(prev => ({ ...prev, altDetection: !prev.altDetection }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  config.altDetection ? 'bg-discord-green' : 'bg-discord-muted'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.altDetection ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className="text-sm text-discord-muted leading-relaxed mb-6">
            Automatically flags users trying to bypass bans using fresh accounts.
          </p>
          
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-discord-muted uppercase">Min Account Age</label>
              <span className="text-sm font-bold text-discord-header">{config.altMinAgeDays} Days</span>
            </div>
            <input 
              type="range"
              min="0"
              max="90"
              value={config.altMinAgeDays}
              onChange={(e) => setConfig(prev => ({ ...prev, altMinAgeDays: parseInt(e.target.value) }))}
              disabled={!config.altDetection}
              className={`w-full h-1.5 bg-discord-sidebar rounded-full appearance-none cursor-pointer accent-discord-green ${!config.altDetection ? 'opacity-30' : ''}`}
            />
          </div>
        </section>

        {/* Bot Protection */}
        <section className="bg-discord-card rounded-2xl p-6 border border-white/5 shadow-xl group flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-discord-blurple/10 rounded-lg group-hover:bg-discord-blurple group-hover:text-white transition-all text-discord-blurple">
                <Bot size={20} />
              </div>
              <h3 className="text-lg font-bold text-discord-header">Bot Protection</h3>
            </div>
            <button 
              onClick={() => setConfig(prev => ({ ...prev, botProtection: !prev.botProtection }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  config.botProtection ? 'bg-discord-green' : 'bg-discord-muted'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.botProtection ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <div className="flex-1 space-y-4">
            <p className="text-sm text-discord-muted mb-4 leading-relaxed">
              Kicks any unverified bot that joins the server. Whitelist specific bots below.
            </p>
            
            <div className={`space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2 transition-opacity ${!config.botProtection ? 'opacity-30 pointer-events-none' : ''}`}>
              <AnimatePresence>
                {config.allowedBots.map(bot => (
                  <motion.div 
                    key={bot.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-2 bg-discord-sidebar rounded-lg border border-white/5"
                  >
                    <div className="flex items-center space-x-2">
                        <img src={bot.avatar} className="w-5 h-5 rounded-full" alt="Bot" />
                        <span className="text-xs font-bold text-discord-header">{bot.name}</span>
                    </div>
                    <button onClick={() => removeBot(bot.id)} className="text-discord-muted hover:text-discord-red transition-colors">
                        <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className={`flex items-center space-x-2 mt-2 transition-opacity ${!config.botProtection ? 'opacity-30 pointer-events-none' : ''}`}>
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-discord-muted" size={12} />
                <input 
                  type="text" 
                  placeholder="Bot User ID..."
                  value={newBotId}
                  onChange={(e) => setNewBotId(e.target.value)}
                  className="w-full bg-discord-sidebar border border-black/20 rounded-lg pl-8 pr-2 py-1.5 text-xs text-discord-header outline-none focus:border-discord-blurple transition-colors"
                />
              </div>
              <button 
                onClick={addBot}
                className="p-1.5 bg-discord-blurple text-white rounded-lg hover:bg-[#4752C4] transition-colors shadow-lg active:scale-95"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Join Analysis Section */}
      <section className="bg-discord-card rounded-2xl p-8 border border-white/5 shadow-xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <BarChart3 size={120} />
        </div>
        
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                    <BarChart3 size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-discord-header">Join Analysis & Trust Scoring</h3>
                    <p className="text-sm text-discord-muted">Calculate a trust score (0-100) for every user who joins.</p>
                </div>
            </div>
            
            <div className="flex items-center space-x-4 bg-discord-sidebar p-2 rounded-xl border border-black/10">
                 <div className="flex items-center space-x-2 px-3 border-r border-white/5">
                    <span className="text-[10px] font-bold text-discord-muted uppercase">Show in logs</span>
                    <button 
                        onClick={() => setConfig(prev => ({ ...prev, displayJoinScore: !prev.displayJoinScore }))}
                        className={`w-8 h-4 rounded-full relative transition-colors ${config.displayJoinScore ? 'bg-discord-blurple' : 'bg-discord-muted'}`}
                    >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${config.displayJoinScore ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                 </div>
                 <div className="flex items-center space-x-3 px-3">
                    <span className="text-[10px] font-bold text-discord-muted uppercase">Alert Channel</span>
                    <div className="relative">
                        <select 
                            value={config.alertChannelId || ''}
                            onChange={(e) => setConfig(prev => ({ ...prev, alertChannelId: e.target.value }))}
                            className="bg-transparent text-xs font-bold text-discord-header outline-none appearance-none pr-6 cursor-pointer"
                        >
                            {CHANNELS.map(ch => (
                                <option key={ch.id} value={ch.id}>#{ch.name}</option>
                            ))}
                        </select>
                        <Hash className="absolute right-0 top-1/2 -translate-y-1/2 text-discord-muted pointer-events-none" size={12} />
                    </div>
                 </div>
            </div>
        </div>

        <div className="space-y-10">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-discord-header uppercase tracking-wider">Minimum Trust Threshold</span>
                        <AlertCircle size={14} className="text-discord-muted" />
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className={`text-3xl font-black ${getScoreColor(config.trustScoreThreshold)}`}>
                            {config.trustScoreThreshold}
                        </span>
                        <div className="flex flex-col text-[10px] font-bold uppercase tracking-widest text-discord-muted">
                            <span>Points</span>
                            <span>Required</span>
                        </div>
                    </div>
                </div>

                <div className="relative pt-1">
                    {/* Multi-zone Color Track */}
                    <div className="absolute top-1 left-0 w-full h-2 rounded-full flex overflow-hidden translate-y-2 opacity-20">
                        <div className="w-[30%] bg-discord-red" />
                        <div className="w-[30%] bg-orange-500" />
                        <div className="w-[40%] bg-discord-green" />
                    </div>
                    <input 
                        type="range"
                        min="0"
                        max="100"
                        value={config.trustScoreThreshold}
                        onChange={(e) => setConfig(prev => ({ ...prev, trustScoreThreshold: parseInt(e.target.value) }))}
                        className={`w-full h-2 rounded-full appearance-none cursor-pointer relative z-10 transition-all ${getScoreBg(config.trustScoreThreshold)}`}
                        style={{
                            background: `linear-gradient(to right, #ED4245 0%, #ED4245 30%, #f97316 30%, #f97316 60%, #57F287 60%, #57F287 100%)`
                        }}
                    />
                    <div className="flex justify-between mt-4">
                        <div className="text-center">
                            <span className="text-[10px] font-bold text-discord-red uppercase block">Red Zone</span>
                            <span className="text-[9px] text-discord-muted">0-30: Untrusted</span>
                        </div>
                        <div className="text-center">
                            <span className="text-[10px] font-bold text-orange-500 uppercase block">Yellow Zone</span>
                            <span className="text-[9px] text-discord-muted">31-60: Suspect</span>
                        </div>
                        <div className="text-center">
                            <span className="text-[10px] font-bold text-discord-green uppercase block">Green Zone</span>
                            <span className="text-[9px] text-discord-muted">61-100: Safe</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-discord-sidebar/50 rounded-xl p-4 border border-white/5 flex items-start space-x-3">
                <Info className="text-discord-blurple shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-discord-muted leading-relaxed">
                    Users with a score <span className="text-discord-header font-bold">below {config.trustScoreThreshold}</span> will be flagged in the alert channel. Security Tronix calculates scores based on account history, verified status, profile metadata, and behavioral patterns.
                </p>
            </div>
        </div>
      </section>

      {/* Footer Meta */}
      <footer className="flex items-center justify-between text-discord-muted">
        <div className="flex items-center space-x-4">
            <button className="text-xs hover:text-white flex items-center space-x-1 transition-colors">
                <ExternalLink size={12} />
                <span>Security Whitepaper</span>
            </button>
            <span className="text-white/10">|</span>
            <button className="text-xs hover:text-white flex items-center space-x-1 transition-colors">
                <ShieldCheck size={12} />
                <span>Audited System</span>
            </button>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest">Bot Encryption: AES-256 Enabled</span>
      </footer>
    </div>
  );
}
