import React from 'react';
import { motion } from 'motion/react';
import { Settings, Save, Globe, Lock, Bell, User } from 'lucide-react';

export default function SettingsView() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header>
        <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-discord-muted/10 rounded-lg text-discord-muted">
                <Settings size={20} />
            </div>
            <span className="text-sm font-bold text-discord-muted uppercase tracking-widest">Bot Preferences</span>
        </div>
        <h1 className="text-4xl font-extrabold text-discord-header tracking-tight">System Settings</h1>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* Global Settings */}
        <section className="bg-discord-card rounded-2xl p-8 border border-white/5 shadow-xl space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-discord-blurple/10 rounded-xl text-discord-blurple">
                        <Globe size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-discord-header">Global Locale</h3>
                        <p className="text-xs text-discord-muted">Set the primary language for bot responses.</p>
                    </div>
                </div>
                <div className="relative">
                    <select className="bg-discord-sidebar border border-black/20 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-discord-header outline-none appearance-none cursor-pointer">
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español (ES)</option>
                        <option value="fr-FR">Français (FR)</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                        <Lock size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-discord-header">Developer Mode</h3>
                        <p className="text-xs text-discord-muted">Expose internal IDs across the dashboard UI.</p>
                    </div>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-discord-muted">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-discord-green/10 rounded-xl text-discord-green">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-discord-header">System Notifications</h3>
                        <p className="text-xs text-discord-muted">Receive dashboard alerts for critical bot errors.</p>
                    </div>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-discord-green">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
            </div>

            <div className="flex items-center justify-end">
                <button className="flex items-center space-x-2 bg-discord-blurple hover:bg-[#4752C4] text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95">
                    <Save size={18} />
                    <span>Save Preferences</span>
                </button>
            </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-500/5 rounded-2xl p-8 border border-red-500/20 shadow-xl space-y-6">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-500/10 rounded-xl text-discord-red">
                    <Lock size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-discord-red uppercase italic tracking-tighter">Danger Zone</h3>
                    <p className="text-xs text-discord-muted">Critical actions that cannot be undone.</p>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
                <div>
                    <p className="text-sm font-bold text-discord-header">Wipe Bot Data</p>
                    <p className="text-[10px] text-discord-muted">Reset all configurations, logs, and strikes to zero.</p>
                </div>
                <button className="px-6 py-2 bg-discord-red/10 hover:bg-discord-red text-discord-red hover:text-white rounded-lg text-xs font-black transition-all border border-discord-red/20 shadow-sm">
                    RESET DATA
                </button>
            </div>
        </section>
      </div>
    </div>
  );
}
