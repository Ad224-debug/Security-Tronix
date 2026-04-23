import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  ShieldAlert, 
  Lock, 
  Users, 
  ShieldCheck, 
  UserCheck, 
  History, 
  Settings 
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active = false, 
  onClick 
}: { 
  icon: any; 
  label: string; 
  active?: boolean;
  onClick: () => void;
}) => (
  <motion.button
    onClick={onClick}
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
      active 
        ? 'bg-discord-blurple text-white shadow-lg' 
        : 'text-discord-muted hover:bg-white/5 hover:text-discord-header'
    }`}
  >
    <Icon size={20} className={active ? 'text-white' : 'text-discord-muted group-hover:text-discord-header'} />
    <span className={`text-sm font-semibold tracking-wide ${active ? 'text-white' : ''}`}>{label}</span>
    {active && (
      <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
    )}
  </motion.button>
);

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'automod', label: 'Automod', icon: ShieldAlert },
    { id: 'anti-raid', label: 'Anti-Raid', icon: ShieldCheck },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'verification', label: 'Verification', icon: UserCheck },
    { id: 'moderation', label: 'Moderation', icon: Users },
    { id: 'backup', label: 'Backup', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-discord-sidebar flex flex-col py-6 px-4 border-r border-black/20 shrink-0">
      <div className="flex items-center space-x-3 px-2 mb-8">
        <div className="w-10 h-10 bg-discord-blurple rounded-xl flex items-center justify-center text-white font-black text-lg shadow-inner">
          ST
        </div>
        <div className="flex flex-col">
          <span className="text-discord-header font-black leading-tight tracking-tight text-lg">SECURITY</span>
          <span className="text-discord-blurple font-bold text-[10px] uppercase tracking-[0.2em] -mt-1">Tronix Bot</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
        {navItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeView === item.id}
            onClick={() => onViewChange(item.id)}
          />
        ))}
      </nav>

      <div className="mt-6 pt-6 border-t border-white/5 px-2">
        <div className="bg-[#1e2124] rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-discord-green rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-discord-muted uppercase tracking-wider">Bot Online</span>
          </div>
          <span className="text-[10px] font-bold text-discord-muted uppercase tracking-wider">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
}
