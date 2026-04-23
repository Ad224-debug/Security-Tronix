export interface LogConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  channelId: string | null;
}

export interface Server {
  id: string;
  name: string;
  icon: string;
}

export interface User {
  id: string;
  username: string;
  avatar: string;
}

export interface Activity {
  id: string;
  type: 'ban' | 'kick' | 'warn' | 'timeout' | 'automod';
  user: string;
  moderator: string;
  timestamp: string;
  reason: string;
}

export interface DashboardStats {
  totalMembers: number;
  activeBans: number;
  warningsToday: number;
  automodActionsToday: number;
}

export type RaidSensitivity = 'Low' | 'Medium' | 'High' | 'Paranoid';
export type RaidAction = 'Lockdown' | 'Kick' | 'Ban' | 'Timeout';

export interface AntiRaidConfig {
  enabled: boolean;
  sensitivity: RaidSensitivity;
  maxJoins: number;
  perSeconds: number;
  minAccountAgeDays: number;
  action: RaidAction;
  lockdownChannels: string[];
  lockdownDurationMinutes: number;
  alertChannelId: string | null;
}

export interface AllowedBot {
  id: string;
  name: string;
  avatar: string;
}

export interface SecurityConfig {
  ipReputation: boolean;
  phishingDetection: boolean;
  altDetection: boolean;
  altMinAgeDays: number;
  botProtection: boolean;
  allowedBots: AllowedBot[];
  trustScoreThreshold: number;
  alertChannelId: string | null;
  displayJoinScore: boolean;
}

export type VerificationMode = 'Button' | 'Captcha' | 'Password';

export interface VerificationConfig {
  enabled: boolean;
  mode: VerificationMode;
  memberRoleId: string | null;
  fallbackChannelId: string | null;
  password?: string;
}

export type BackupSchedule = 'Daily' | 'Weekly';

export interface BackupEntry {
  id: string;
  name: string;
  date: string;
  size: string;
  type: 'Auto' | 'Manual';
}

export interface BackupConfig {
  autoBackup: boolean;
  schedule: BackupSchedule;
  backups: BackupEntry[];
  usedStorageMB: number;
  totalStorageMB: number;
  lastBackupDate: string;
}

export type AutomodSeverity = 'Low' | 'Medium' | 'High';
export type StrikeAction = 'Warn' | 'Timeout' | 'Kick' | 'Ban' | 'None';

export interface AutomodConfig {
  nsfwFilter: { enabled: boolean; severity: AutomodSeverity };
  spamDetection: { enabled: boolean; maxMessages: number; timeWindowSeconds: number };
  massMentions: { enabled: boolean; maxMentions: number };
  linkFilter: { enabled: boolean; whitelist: string[] };
  inviteFilter: { enabled: boolean };
  capsFilter: { enabled: boolean; percentage: number };
  strikes: {
    strike1: StrikeAction;
    strike2: StrikeAction;
    strike3: StrikeAction;
  };
}

export type ModCaseType = 'ban' | 'kick' | 'warn' | 'timeout';

export interface ModCase {
  id: string;
  type: ModCaseType;
  user: string;
  moderator: string;
  reason: string;
  date: string;
}

export interface ModerationConfig {
  warnAutoAction: {
    enabled: boolean;
    threshold: number;
    action: StrikeAction;
  };
  jailSystem: {
    jailRoleId: string | null;
    jailChannelId: string | null;
  };
  modRoleId: string | null;
}
