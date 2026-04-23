/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardView from './components/DashboardView';
import LogsView from './components/LogsView';
import AntiRaidView from './components/AntiRaidView';
import SecurityView from './components/SecurityView';
import VerificationView from './components/VerificationView';
import BackupView from './components/BackupView';
import AutomodView from './components/AutomodView';
import ModerationView from './components/ModerationView';
import SettingsView from './components/SettingsView';
import Login from './pages/Login';
import SelectServer from './pages/SelectServer';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const { user, loading, selectedGuildId, selectedGuild, selectGuild, clearGuild, guilds } = useAuth();

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-discord-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-discord-blurple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No autenticado → Login
  if (!user) return <Login />;

  // Autenticado pero sin servidor seleccionado → SelectServer
  if (!selectedGuildId) return <SelectServer onSelect={selectGuild} />;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'logs':
        return <LogsView />;
      case 'automod':
        return <AutomodView />;
      case 'anti-raid':
        return <AntiRaidView />;
      case 'security':
        return <SecurityView />;
      case 'verification':
        return <VerificationView />;
      case 'moderation':
        return <ModerationView />;
      case 'backup':
        return <BackupView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-20 h-20 bg-discord-card rounded-2xl flex items-center justify-center border border-white/5 shadow-xl">
              <span className="text-4xl">🚧</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-discord-header uppercase">Under Construction</h2>
              <p className="text-discord-muted max-w-sm mt-2">The <span className="text-discord-blurple font-bold uppercase">{activeView}</span> module is currently being calibrated by Security Tronix engineers.</p>
            </div>
            <button 
              onClick={() => setActiveView('dashboard')}
              className="bg-discord-blurple text-white px-6 py-2 rounded-lg font-bold hover:bg-[#4752C4] transition-all pt-2"
            >
              Back to Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-discord-bg overflow-hidden font-sans">
      {/* Navigation Sidebar */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Container */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Topbar user={user} guild={selectedGuild} guilds={guilds} onChangeServer={clearGuild} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-discord-bg border-l border-black/10">
          <div className="p-8 pb-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
