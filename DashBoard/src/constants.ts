import { LogConfig } from './types';

export const CHANNELS = [
  { id: '1', name: 'logs-general' },
  { id: '2', name: 'mod-logs' },
  { id: '3', name: 'voice-logs' },
  { id: '4', name: 'admin-only' },
];

export const INITIAL_LOGS: LogConfig[] = [
  { id: 'messages', name: '💬 Messages', description: 'Log message edits, deletions, and bulk deletes.', enabled: false, channelId: null },
  { id: 'voice', name: '🔊 Voice', description: 'Track when users join, leave, or move voice channels.', enabled: false, channelId: null },
  { id: 'members', name: '👥 Members', description: 'Monitor member joins, leaves, and nickname changes.', enabled: false, channelId: null },
  { id: 'bans', name: '🔨 Bans', description: 'Log ban and unban events with moderator info.', enabled: false, channelId: null },
  { id: 'kicks', name: '👢 Kicks', description: 'Track when members are kicked from the server.', enabled: false, channelId: null },
  { id: 'warnings', name: '⚠️ Warnings', description: 'Keep track of formal warnings issued to members.', enabled: false, channelId: null },
  { id: 'timeouts', name: '⏱️ Timeouts', description: 'Log when members are timed out or untimed out.', enabled: false, channelId: null },
  { id: 'automod', name: '🤖 Automod', description: 'Log actions taken by the automatic moderation system.', enabled: false, channelId: null },
  { id: 'server', name: '🏠 Server', description: 'Track server updates, role changes, and channel edits.', enabled: false, channelId: null },
  { id: 'invites', name: '🔗 Invites', description: 'Log invite creation, deletion, and usage.', enabled: false, channelId: null },
  { id: 'commands', name: '⌨️ Commands', description: 'Monitor usage of bot and application commands.', enabled: false, channelId: null },
  { id: 'webhooks', name: '🔌 Webhooks', description: 'Log webhook creation, updates, and deletions.', enabled: false, channelId: null },
  { id: 'pins', name: '📌 Pins', description: 'Track when messages are pinned or unpinned.', enabled: false, channelId: null },
];

export const MOD_CASES: never[] = [];
export const ROLES: never[] = [];
