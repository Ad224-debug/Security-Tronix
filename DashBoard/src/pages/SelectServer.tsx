import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, ChevronRight, Plus } from 'lucide-react';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

interface User {
  username: string;
  avatar: string;
}

export default function SelectServer({ onSelect }: { onSelect: (guildId: string) => void }) {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(data => {
        setUser(data.user);
        setGuilds(data.guilds || []);
        setLoading(false);
      })
      .catch(() => {
        window.location.href = '/';
      });
  }, []);

  const filtered = guilds.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-discord-blurple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-bg flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-discord-blurple rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-black text-xl">ST</span>
          </div>
          {user && (
            <div className="flex items-center justify-center space-x-2 mb-2">
              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
              <span className="text-discord-muted text-sm">Conectado como <span className="text-discord-header font-bold">{user.username}</span></span>
            </div>
          )}
          <h1 className="text-3xl font-black text-discord-header">Seleccionar Servidor</h1>
          <p className="text-discord-muted mt-2">Elegí el servidor que querés configurar</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-discord-muted" size={18} />
          <input
            type="text"
            placeholder="Buscar servidor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-discord-card border border-white/5 rounded-xl text-discord-header placeholder-discord-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
          />
        </div>

        {/* Server list */}
        <div className="bg-discord-card border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-discord-muted">
              <p>No se encontraron servidores donde seas administrador y el bot esté presente.</p>
              <a
                href={`https://discord.com/oauth2/authorize?client_id=${window.__BOT_CLIENT_ID__}&permissions=8&scope=bot+applications.commands`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 mt-4 text-discord-blurple hover:underline font-bold"
              >
                <Plus size={16} />
                <span>Agregar el bot a un servidor</span>
              </a>
            </div>
          ) : (
            filtered.map((guild, i) => (
              <motion.button
                key={guild.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onSelect(guild.id)}
                className="w-full flex items-center space-x-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
              >
                {guild.icon ? (
                  <img src={guild.icon} alt="" className="w-12 h-12 rounded-xl" />
                ) : (
                  <div className="w-12 h-12 bg-discord-blurple rounded-xl flex items-center justify-center text-white font-black text-lg">
                    {guild.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p className="font-bold text-discord-header group-hover:text-discord-blurple transition-colors">{guild.name}</p>
                  <p className="text-xs text-discord-muted">ID: {guild.id}</p>
                </div>
                <ChevronRight className="text-discord-muted group-hover:text-discord-blurple transition-colors" size={20} />
              </motion.button>
            ))
          )}
        </div>

        <div className="text-center mt-4">
          <a href="/auth/logout" className="text-discord-muted text-sm hover:text-discord-header transition-colors">
            Cerrar sesión
          </a>
        </div>
      </motion.div>
    </div>
  );
}
