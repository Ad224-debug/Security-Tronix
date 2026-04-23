import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserCheck, 
  ShieldCheck, 
  MousePointer2, 
  Binary, 
  Key, 
  Users, 
  Hash, 
  SendHorizonal, 
  Info,
  CheckCircle2,
  Lock,
  ChevronRight
} from 'lucide-react';
import { VerificationConfig, VerificationMode } from '../types';
import { CHANNELS } from '../constants';

const ModeCard = ({ 
  mode, 
  active, 
  icon: Icon, 
  title, 
  desc, 
  onClick 
}: { 
  mode: VerificationMode; 
  active: boolean; 
  icon: any; 
  title: string; 
  desc: string; 
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ y: -4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex-1 p-6 rounded-2xl border transition-all text-left group relative overflow-hidden ${
      active 
        ? 'bg-discord-blurple/10 border-discord-blurple shadow-lg ring-1 ring-discord-blurple' 
        : 'bg-discord-card border-white/5 hover:border-white/10'
    }`}
  >
    {active && (
        <div className="absolute top-0 right-0 p-2">
            <CheckCircle2 size={16} className="text-discord-blurple" />
        </div>
    )}
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
        active ? 'bg-discord-blurple text-white' : 'bg-discord-sidebar text-discord-muted group-hover:text-discord-header'
    }`}>
      <Icon size={24} />
    </div>
    <h4 className={`font-bold transition-colors ${active ? 'text-discord-header' : 'text-discord-muted group-hover:text-discord-header'}`}>{title}</h4>
    <p className="text-xs text-discord-muted mt-2 leading-relaxed">{desc}</p>
  </motion.button>
);

export default function VerificationView() {
  const [config, setConfig] = useState<VerificationConfig>({
    enabled: true,
    mode: 'Captcha',
    memberRoleId: '123456789',
    fallbackChannelId: '1',
    password: ''
  });

  const [isHoveringPreview, setIsHoveringPreview] = useState(false);

  const ROLES = [
    { id: '123456789', name: 'Verified Member', color: '#57F287' },
    { id: '987654321', name: 'Citizen', color: '#5865F2' },
  ];

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
            <div className="p-2 bg-discord-green/10 rounded-lg">
              <UserCheck className="text-discord-green" size={20} />
            </div>
            <span className="text-sm font-bold text-discord-green uppercase tracking-widest">Access Control</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold text-discord-header tracking-tight"
          >
            Verification System
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-discord-muted mt-2 max-w-xl"
          >
            Secure your server by requiring new members to complete a challenge before gaining access to your community.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center space-x-4"
        >
            <div className="flex flex-col items-end mr-2">
                <span className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">Master Switch</span>
                <button 
                  onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`mt-1 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    config.enabled ? 'bg-discord-green' : 'bg-discord-muted'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Left Side: Configuration (3/5) */}
        <div className="xl:col-span-3 space-y-8">
          
          {/* Mode Selector */}
          <section className="bg-discord-card rounded-2xl p-8 border border-white/5 shadow-xl">
            <h3 className="text-sm font-bold text-discord-muted uppercase tracking-wider mb-6 flex items-center space-x-2">
                <ShieldCheck size={16} />
                <span>Verification Mode</span>
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              <ModeCard 
                mode="Button"
                active={config.mode === 'Button'}
                icon={MousePointer2}
                title="Button Click"
                desc="Simplest method. Users click a 'Verify' button to gain access."
                onClick={() => setConfig(prev => ({ ...prev, mode: 'Button' }))}
              />
              <ModeCard 
                mode="Captcha"
                active={config.mode === 'Captcha'}
                icon={Binary}
                title="Math Captcha"
                desc="Prevents automated bots by requiring a simple math solution."
                onClick={() => setConfig(prev => ({ ...prev, mode: 'Captcha' }))}
              />
              <ModeCard 
                mode="Password"
                active={config.mode === 'Password'}
                icon={Key}
                title="Secret Password"
                desc="Users must enter a specific code. Great for private groups."
                onClick={() => setConfig(prev => ({ ...prev, mode: 'Password' }))}
              />
            </div>
          </section>

          {/* Role & Channel Selectors */}
          <section className="bg-discord-card rounded-2xl p-8 border border-white/5 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <label className="text-[10px] font-bold text-discord-muted uppercase tracking-widest block">Assign Member Role</label>
                <div className="relative">
                    <select 
                        value={config.memberRoleId || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, memberRoleId: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 bg-discord-sidebar border border-black/20 rounded-xl text-sm text-discord-header font-bold outline-none focus:ring-1 focus:ring-discord-blurple appearance-none"
                    >
                        <option value="" disabled>Select a role</option>
                        {ROLES.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-muted" size={18} />
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-discord-muted rotate-90" size={16} />
                </div>
                <p className="text-[10px] text-discord-muted italic">This role will be automatically granted upon successful verification.</p>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-bold text-discord-muted uppercase tracking-widest block">Fallback/Welcome Channel</label>
                <div className="relative">
                    <select 
                        value={config.fallbackChannelId || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, fallbackChannelId: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 bg-discord-sidebar border border-black/20 rounded-xl text-sm text-discord-header font-bold outline-none focus:ring-1 focus:ring-discord-blurple appearance-none"
                    >
                        {CHANNELS.map(ch => (
                            <option key={ch.id} value={ch.id}>#{ch.name}</option>
                        ))}
                    </select>
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-muted" size={18} />
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-discord-muted rotate-90" size={16} />
                </div>
                <p className="text-[10px] text-discord-muted italic">Used to announce new verified users or redirect failed attempts.</p>
            </div>
          </section>

          {/* Password Input (Conditional) */}
          <AnimatePresence>
            {config.mode === 'Password' && (
              <motion.section 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-discord-card rounded-2xl p-8 border border-white/5 shadow-xl overflow-hidden"
              >
                <label className="text-[10px] font-bold text-discord-muted uppercase tracking-widest block mb-4">Set Verification Password</label>
                <div className="relative">
                    <input 
                        type="text"
                        placeholder="Enter secret code..."
                        value={config.password}
                        onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full bg-discord-sidebar border border-black/20 rounded-xl pl-12 pr-4 py-4 text-discord-header font-mono focus:ring-1 focus:ring-discord-blurple outline-none"
                    />
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-discord-muted" size={24} />
                </div>
                <div className="mt-4 flex items-start space-x-2 p-3 bg-discord-blurple/5 border border-discord-blurple/10 rounded-lg">
                    <Info size={14} className="text-discord-blurple mt-0.5" />
                    <p className="text-[10px] text-discord-muted leading-relaxed">
                        In Password Mode, Security Tronix will prompt the user to type the exact code above in a dedicated ephemeral interaction.
                    </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <button className="w-full flex items-center justify-center space-x-3 bg-discord-blurple hover:bg-[#4752C4] text-white py-4 rounded-2xl font-black text-lg transition-all shadow-2xl active:scale-95 group">
            <SendHorizonal size={24} className="group-hover:translate-x-1 transition-transform" />
            <span>Send Verification Panel</span>
          </button>
        </div>

        {/* Right Side: Discord Preview (2/5) */}
        <div className="xl:col-span-2">
            <div className="sticky top-8">
                <div className="flex items-center space-x-2 mb-4 px-2 uppercase tracking-widest text-[10px] font-black text-discord-muted">
                    <div className="w-2 h-2 rounded-full bg-discord-green" />
                    <span>Real-time Preview</span>
                </div>

                <div 
                    className="bg-[#36393f] rounded-lg shadow-2xl overflow-hidden border border-black/10"
                    onMouseEnter={() => setIsHoveringPreview(true)}
                    onMouseLeave={() => setIsHoveringPreview(false)}
                >
                    {/* Channel Header Mock */}
                    <div className="h-12 bg-[#36393f] border-b border-black/10 flex items-center px-4 space-x-3">
                        <Hash size={20} className="text-[#8e9297]" />
                        <span className="font-bold text-white text-sm">verification</span>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Bot Message */}
                        <div className="flex space-x-4">
                            <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center shrink-0">
                                <span className="text-white font-bold text-xs">ST</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <span className="font-bold text-white text-sm hover:underline cursor-pointer">Security Tronix</span>
                                    <span className="bg-discord-blurple px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase flex items-center space-x-1">
                                        <ShieldCheck size={8} />
                                        <span>Bot</span>
                                    </span>
                                    <span className="text-[#a3a6aa] text-[10px] font-medium">Today at 8:45 PM</span>
                                </div>
                                
                                {/* Discord Embed UI */}
                                <div className="mt-2 border-l-4 border-discord-blurple bg-[#2f3136] rounded p-4 max-w-sm">
                                    <h5 className="font-bold text-sm text-white">{config.enabled ? 'Verify Account Access' : 'System Disabled'}</h5>
                                    <p className="text-xs text-[#dcddde] mt-2 leading-relaxed">
                                        {config.mode === 'Button' && "Please click the button below to verify your identity and gain access to all channels."}
                                        {config.mode === 'Captcha' && "Please solve the math puzzle shown below correctly to verify your identity."}
                                        {config.mode === 'Password' && "This server is protected. Please click verify and enter the secret code to proceed."}
                                    </p>

                                    {config.mode === 'Captcha' && (
                                        <div className="mt-3 bg-[#18191c] rounded p-3 text-center border border-white/5">
                                            <span className="text-xl font-mono text-discord-green font-black">7 + 12 = ?</span>
                                        </div>
                                    )}

                                    <div className="mt-4 flex flex-col space-y-2">
                                        <div className="flex items-center space-x-2 text-[10px] font-bold text-discord-muted uppercase">
                                            <div className="w-1 h-1 rounded-full bg-discord-muted" />
                                            <span>Mode: {config.mode}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Discord Buttons UI */}
                                <div className="mt-3 flex space-x-2">
                                    <div className="px-4 py-1.5 bg-[#4f545c] hover:bg-[#686d73] rounded text-white text-sm font-medium flex items-center space-x-2 cursor-pointer transition-colors shadow-lg">
                                        <UserCheck size={16} />
                                        <span>Verify Identity</span>
                                    </div>
                                    <div className="px-3 py-1.5 bg-[#4f545c]/50 rounded text-white/50 text-sm font-medium cursor-not-allowed">
                                        Help
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat Input Mock */}
                    <div className="p-4 pt-0">
                        <div className="bg-[#40444b] rounded-lg p-3 text-[#72767d] text-sm md:flex hidden items-center justify-between">
                            <span>You do not have permission to send messages in this channel.</span>
                            <Lock size={14} />
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isHoveringPreview && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="mt-4 p-4 bg-discord-card border border-discord-blurple/30 rounded-xl shadow-xl flex items-start space-x-3"
                        >
                            <div className="p-2 bg-discord-blurple/10 rounded-lg text-discord-blurple">
                                <Info size={16} />
                            </div>
                            <div>
                                <h5 className="text-xs font-bold text-discord-header">Interactive Preview</h5>
                                <p className="text-[10px] text-discord-muted mt-1 leading-relaxed">
                                    This is exactly how your members will see the verification panel in Discord. Try changing the <b>Verification Mode</b> to see the layout update in real-time.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </div>
    </div>
  );
}
