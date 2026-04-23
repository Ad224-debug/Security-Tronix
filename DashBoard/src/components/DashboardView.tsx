import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Ban, AlertTriangle, Zap, Shield, UserMinus, Clock, ArrowRight, History } from 'lucide-react';

interface Stats {
  totalMembers: number;
  activeBans: number;
  warningsToday: number;
  automodActionsToday: number;
  guildName: string;
  recentActivity: Activity[];
}

interface Activity {
  id: string | number;
  type: string;
  user: string;
  moderator: string;
  reason: string;
  timestamp: number;
}

const StatCard = ({ icon: Icon, label, value, color, loading }: { icon: any; label: string; value: number; color: string; loading: boolean }) => (
  <motion.div whileHover={{ y: -4 }} className="bg-discord-card border border-white/5 p-6 rounded-xl shadow-lg relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-5 group-hover:opacity-10 transition-opacity rounded-full ${color.replace('text-', 'bg-')}`} />
    <div className="flex items-center space-x-4">
      <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-')}/10`}>
        <Icon className={color} size={24} />
      </div>
      <div>
        <p className="text-discord-muted text-xs font-bold uppercase tracking-widest">{label}</p>
        {loading ? (
          <div className="h-8 w-16 bg-discord-sidebar rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-black text-discord-header mt-1">{value.toLocaleString()}</p>
        )}
      </div>
    </div>
  </motion.div>
);

const ActivityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'ban': return <div className="p-2 bg-discord-red/10 rounded-lg text-discord-red"><Ban size={16} /></div>;
    case 'kick': return <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><UserMinus size={16} /></div>;
    case 'warn': return <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400"><AlertTriangle size={16} /></div>;
    case 'timeout': return <div className="p-2 bg-discord-blurple/10 rounded-lg text-discord-blurple"><Clock size={16} /></div>;
    default: return <div className="p-2 bg-white/10 rounded-lg text-white"><Shield size={16} /></div>;
  }
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function DashboardView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const guildId = localStorage.getItem('selectedGuildId');
    if (!guildId) return;
    fetch(`/api/guild/${guildId}/stats`)
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-discord-header tracking-tight">Main Dashboard</h1>
        <p className="text-discord-muted mt-1">
          {loading ? 'Cargando...' : `Estadísticas en tiempo real de `}
          {!loading && <span className="text-discord-blurple font-bold">{stats?.guildName}</span>}
        </p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Members" value={stats?.totalMembers ?? 0} color="text-discord-blurple" loading={loading} />
        <StatCard icon={Ban} label="Active Bans" value={stats?.activeBans ?? 0} color="text-discord-red" loading={loading} />
        <StatCard icon={AlertTriangle} label="Warnings Today" value={stats?.warningsToday ?? 0} color="text-yellow-400" loading={loading} />
        <StatCard icon={Zap} label="Automod Actions" value={stats?.automodActionsToday ?? 0} color="text-white" loading={loading} />
      </section>

      {/* Activity */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-discord-card rounded-2xl border border-white/5 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-discord-header flex items-center space-x-2">
              <History className="text-discord-muted" size={20} />
              <span>Actividad Reciente</span>
            </h2>
          </div>

          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-discord-sidebar rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stats?.recentActivity?.length === 0 ? (
            <div className="p-8 text-center text-discord-muted">
              <Shield size={32} className="mx-auto mb-2 opacity-30" />
              <p>Sin actividad reciente</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {(stats?.recentActivity || []).map((action, i) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-4">
                    <ActivityIcon type={action.type} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-discord-header font-mono">{action.user}</span>
                        <span className="text-[10px] bg-discord-sidebar px-1.5 py-0.5 rounded text-discord-muted uppercase font-bold">{action.type}</span>
                      </div>
                      <p className="text-xs text-discord-muted mt-0.5 line-clamp-1">{action.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-discord-header">{action.moderator}</span>
                    <p className="text-[10px] text-discord-muted uppercase font-bold mt-0.5">{timeAgo(action.timestamp)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="space-y-6">
          <div className="bg-discord-blurple rounded-2xl p-6 text-white shadow-lg overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-16 -mt-16 rounded-full blur-2xl" />
            <h3 className="text-lg font-black leading-tight">Protección Activa</h3>
            <p className="text-white/70 text-sm mt-3 leading-relaxed">
              Anti-raid, automod y detección de phishing están monitoreando el servidor.
            </p>
            <button className="mt-6 w-full py-2.5 bg-white text-discord-blurple font-bold rounded-lg text-sm hover:bg-discord-header transition-colors">
              Ver Seguridad
            </button>
          </div>

          <div className="bg-discord-card rounded-2xl border border-white/5 p-6 shadow-xl">
            <h3 className="text-sm font-bold text-discord-header uppercase tracking-wider mb-4">Resumen</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-discord-header">Miembros</p>
                  <p className="text-[10px] text-discord-muted">Total en el servidor</p>
                </div>
                <span className="text-sm font-mono font-bold text-discord-header">
                  {loading ? '...' : stats?.totalMembers?.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-discord-header">Bans activos</p>
                  <p className="text-[10px] text-discord-muted">Usuarios baneados</p>
                </div>
                <span className="text-sm font-mono font-bold text-discord-red">
                  {loading ? '...' : stats?.activeBans?.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-discord-header">Warnings hoy</p>
                  <p className="text-[10px] text-discord-muted">Desde las 00:00</p>
                </div>
                <span className="text-sm font-mono font-bold text-yellow-400">
                  {loading ? '...' : stats?.warningsToday}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
