import React, { useState } from 'react';
import { ChevronDown, Bell, LogOut, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TopbarProps {
  user: { username: string; avatar: string } | null;
  guild: { id: string; name: string; icon: string | null } | null;
  guilds: { id: string; name: string; icon: string | null }[];
  onChangeServer: () => void;
}

export default function Topbar({ user, guild, guilds, onChangeServer }: TopbarProps) {
  const [showGuildMenu, setShowGuildMenu] = useState(false);

  return (
    <header className="h-16 bg-discord-bg border-b border-black/20 flex items-center justify-between px-6 z-10 shadow-sm relative">
      {/* Server selector */}
      <div className="relative">
        <button
          onClick={() => setShowGuildMenu(v => !v)}
          className="bg-discord-card px-4 py-2 rounded-lg flex items-center space-x-3 cursor-pointer hover:bg-discord-card-hover transition-colors border border-black/10"
        >
          {guild?.icon ? (
            <img src={guild.icon} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 bg-discord-blurple rounded-full flex items-center justify-center text-xs font-bold text-white">
              {guild?.name?.charAt(0) || 'S'}
            </div>
          )}
          <span className="font-semibold text-discord-header">{guild?.name || 'Seleccionar servidor'}</span>
          <ChevronDown size={18} className="text-discord-muted" />
        </button>

        <AnimatePresence>
          {showGuildMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 mt-2 w-64 bg-discord-sidebar border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-2">
                <button
                  onClick={() => { onChangeServer(); setShowGuildMenu(false); }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/5 text-discord-muted hover:text-discord-header transition-colors text-sm"
                >
                  <RefreshCw size={14} />
                  <span>Cambiar servidor</span>
                </button>
                <div className="border-t border-white/5 my-1" />
                {guilds.map(g => (
                  <button
                    key={g.id}
                    onClick={() => {
                      localStorage.setItem('selectedGuildId', g.id);
                      window.location.reload();
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm ${g.id === guild?.id ? 'text-discord-blurple font-bold' : 'text-discord-header'}`}
                  >
                    {g.icon ? (
                      <img src={g.icon} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 bg-discord-blurple rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {g.name.charAt(0)}
                      </div>
                    )}
                    <span className="truncate">{g.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-6">
        <button className="text-discord-muted hover:text-discord-header transition-colors">
          <Bell size={20} />
        </button>
        <div className="flex items-center space-x-3 group">
          <div className="text-right flex flex-col">
            <span className="text-sm font-bold text-discord-header group-hover:text-discord-blurple transition-colors">
              {user?.username || 'Usuario'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-discord-muted font-bold">Administrator</span>
          </div>
          <div className="relative">
            <img
              src={user?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
              alt="Avatar"
              className="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-discord-blurple transition-all"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-discord-green border-2 border-discord-bg rounded-full" />
          </div>
          <a href="/auth/logout" className="text-discord-muted hover:text-discord-red transition-colors ml-1">
            <LogOut size={18} />
          </a>
        </div>
      </div>
    </header>
  );
}
