import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Plus, 
  Calendar, 
  HardDrive, 
  RefreshCcw, 
  Trash2, 
  Clock, 
  ShieldCheck, 
  Download, 
  Cloud,
  CheckCircle2,
  AlertCircle,
  FileBox
} from 'lucide-react';
import { BackupConfig, BackupEntry, BackupSchedule } from '../types';

export default function BackupView() {
  const [config, setConfig] = useState<BackupConfig>({
    autoBackup: true,
    schedule: 'Daily',
    backups: [
      { id: '1', name: 'Server State - Pre Mod Event', date: '2024-03-20 14:30', size: '1.2 MB', type: 'Manual' },
      { id: '2', name: 'Auto System Snapshot', date: '2024-03-19 04:00', size: '1.1 MB', type: 'Auto' },
      { id: '3', name: 'Member Hierarchy Backup', date: '2024-03-18 04:00', size: '1.0 MB', type: 'Auto' },
      { id: '4', name: 'Permissions Lockdown State', date: '2024-03-15 09:15', size: '0.9 MB', type: 'Manual' },
      { id: '5', name: 'Seasonal Event Config', date: '2024-03-10 16:45', size: '1.5 MB', type: 'Manual' },
    ],
    usedStorageMB: 45.5,
    totalStorageMB: 512,
    lastBackupDate: '2024-03-20 14:30'
  });

  const [isBackupInProgress, setIsBackupInProgress] = useState(false);

  const createBackup = () => {
    setIsBackupInProgress(true);
    // Simulate backup delay
    setTimeout(() => {
      const newBackup: BackupEntry = {
        id: Math.random().toString(36).substr(2, 9),
        name: `Manual Snapshot - ${new Date().toLocaleDateString()}`,
        date: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        size: '1.3 MB',
        type: 'Manual'
      };
      
      setConfig(prev => ({
        ...prev,
        backups: [newBackup, ...prev.backups],
        lastBackupDate: newBackup.date,
        usedStorageMB: prev.usedStorageMB + 1.3
      }));
      setIsBackupInProgress(false);
    }, 2000);
  };

  const deleteBackup = (id: string) => {
    setConfig(prev => ({
      ...prev,
      backups: prev.backups.filter(b => b.id !== id)
    }));
  };

  const progressPercentage = (config.usedStorageMB / config.totalStorageMB) * 100;

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
              <Database className="text-discord-blurple" size={20} />
            </div>
            <span className="text-sm font-bold text-discord-blurple uppercase tracking-widest">Disaster Recovery</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold text-discord-header tracking-tight"
          >
            Backup Management
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-discord-muted mt-2 max-w-xl"
          >
            Secure your server configuration, moderation logs, and member database with redundant snapshots.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button 
            onClick={createBackup}
            disabled={isBackupInProgress}
            className={`flex items-center space-x-3 bg-discord-blurple hover:bg-[#4752C4] text-white px-8 py-3 rounded-xl font-black text-sm transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isBackupInProgress ? (
              <RefreshCcw size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            <span>{isBackupInProgress ? 'Capturing Snapshot...' : 'Create New Backup'}</span>
          </button>
        </motion.div>
      </header>

      {/* Top Section: Storage & Auto-Backup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Storage Bar Card */}
        <section className="lg:col-span-2 bg-discord-card rounded-2xl p-8 border border-white/5 shadow-xl space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <HardDrive size={100} />
            </div>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-discord-green/10 rounded-lg text-discord-green">
                        <Cloud size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-discord-header">Cloud Storage Allocation</h3>
                        <p className="text-xs text-discord-muted">Standard Spark Plan Storage</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xl font-black text-discord-header">{config.usedStorageMB.toFixed(1)} MB</span>
                    <span className="text-xs text-discord-muted block">of {config.totalStorageMB} MB used</span>
                </div>
            </div>

            <div className="space-y-2">
                <div className="w-full h-3 bg-discord-sidebar rounded-full overflow-hidden border border-black/20 p-0.5">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        className={`h-full rounded-full bg-gradient-to-r from-discord-blurple to-[#4752C4] shadow-[0_0_10px_rgba(88,101,242,0.3)]`}
                    />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-discord-muted uppercase">
                    <span>Low Usage</span>
                    <span>{progressPercentage.toFixed(1)}% Capacity</span>
                </div>
            </div>
        </section>

        {/* Auto-Backup & Schedule */}
        <section className="bg-discord-card rounded-2xl p-8 border border-white/5 shadow-xl flex flex-col justify-between">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Clock className="text-discord-blurple" size={18} />
                        <span className="text-sm font-bold text-discord-header uppercase tracking-wider">Auto-Backup</span>
                    </div>
                    <button 
                        onClick={() => setConfig(prev => ({ ...prev, autoBackup: !prev.autoBackup }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            config.autoBackup ? 'bg-discord-green' : 'bg-discord-muted'
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.autoBackup ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className={`space-y-4 transition-opacity ${!config.autoBackup && 'opacity-30 pointer-events-none'}`}>
                    <label className="text-[10px] font-bold text-discord-muted uppercase block">Backup Interval</label>
                    <div className="grid grid-cols-2 gap-2">
                        {(['Daily', 'Weekly'] as BackupSchedule[]).map(s => (
                            <button
                                key={s}
                                onClick={() => setConfig(prev => ({ ...prev, schedule: s }))}
                                className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                                    config.schedule === s 
                                        ? 'bg-discord-blurple text-white border-transparent' 
                                        : 'bg-discord-sidebar text-discord-muted border-black/20 hover:border-white/10'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 flex items-center space-x-3 p-3 bg-discord-blurple/10 rounded-xl border border-discord-blurple/20">
                <CheckCircle2 size={16} className="text-discord-blurple shrink-0" />
                <div className="text-[10px] text-discord-muted">
                    <span className="block font-bold text-discord-header uppercase">Next Snapshot</span>
                    <span>Scheduled for tomorrow at 04:00 AM UTC</span>
                </div>
            </div>
        </section>
      </div>

      {/* Prominent Last Backup Info */}
      <section className="bg-discord-sidebar/50 backdrop-blur-sm p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-discord-green/10 flex items-center justify-center text-discord-green">
                <ShieldCheck size={20} />
            </div>
            <div>
                <span className="text-[10px] font-black text-discord-muted uppercase tracking-widest block">System Integrity Guaranteed</span>
                <p className="text-xs text-discord-header font-bold">Your data is safe. All recovery points are encrypted and verified.</p>
            </div>
        </div>
        <div className="flex flex-col items-center md:items-end">
            <span className="text-[10px] font-black text-discord-muted uppercase tracking-widest block">Last Successful Backup</span>
            <div className="flex items-center space-x-2">
                <Clock size={14} className="text-discord-green" />
                <span className="text-sm font-black text-discord-header">{config.lastBackupDate}</span>
            </div>
        </div>
      </section>

      {/* Backup Table */}
      <section className="bg-discord-card rounded-2xl border border-white/5 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <FileBox className="text-discord-blurple" size={20} />
                <h3 className="font-bold text-discord-header">Available Snapshots</h3>
            </div>
            <span className="text-[10px] font-bold text-discord-muted uppercase bg-black/20 px-2 py-1 rounded">Total: {config.backups.length} Recovery Points</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/20">
                <th className="px-6 py-4 text-[10px] font-black text-discord-muted uppercase tracking-wider">Snapshot Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-discord-muted uppercase tracking-wider">Created Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-discord-muted uppercase tracking-wider">Size</th>
                <th className="px-6 py-4 text-[10px] font-black text-discord-muted uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-discord-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence initial={false}>
                {config.backups.map(backup => (
                  <motion.tr 
                    key={backup.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-discord-sidebar flex items-center justify-center text-discord-muted group-hover:text-discord-blurple transition-colors">
                                <Database size={16} />
                            </div>
                            <span className="text-sm font-bold text-discord-header">{backup.name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs text-discord-muted font-medium">{backup.date}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-discord-header">{backup.size}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                        backup.type === 'Auto' ? 'bg-discord-blurple text-white' : 'bg-discord-sidebar text-discord-muted border border-white/5'
                      }`}>
                        {backup.type}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-discord-blurple hover:text-white text-discord-blurple rounded-lg transition-all" title="Restore Snapshot">
                          <RefreshCcw size={16} />
                        </button>
                        <button className="p-2 hover:bg-discord-muted hover:text-white text-discord-muted rounded-lg transition-all" title="Download Snapshot">
                          <Download size={16} />
                        </button>
                        <button 
                            onClick={() => deleteBackup(backup.id)}
                            className="p-2 hover:bg-discord-red hover:text-white text-discord-red rounded-lg transition-all" 
                            title="Delete Snapshot"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </section>

      {/* Help Section */}
      <div className="flex items-start space-x-3 p-4 bg-discord-sidebar/30 rounded-xl border border-white/5">
        <AlertCircle className="text-discord-muted shrink-0 mt-0.5" size={16} />
        <p className="text-[10px] text-discord-muted leading-relaxed">
            Restoring a backup will revert the bot's configuration to a previous state. This includes automod filters, security settings, and logging preferences. This action <span className="font-bold text-discord-red uppercase">does not affect</span> roles or channels within the actual Discord server, only the bot's processing state.
        </p>
      </div>
    </div>
  );
}
