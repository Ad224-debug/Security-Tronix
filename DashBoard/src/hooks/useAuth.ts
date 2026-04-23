import { useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  username: string;
  avatar: string;
}

export interface AuthGuild {
  id: string;
  name: string;
  icon: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  guilds: AuthGuild[];
  loading: boolean;
  selectedGuildId: string | null;
  selectedGuild: AuthGuild | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    guilds: [],
    loading: true,
    selectedGuildId: null,
    selectedGuild: null,
  });

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          const savedGuildId = localStorage.getItem('selectedGuildId');
          const savedGuild = savedGuildId
            ? data.guilds?.find((g: AuthGuild) => g.id === savedGuildId) || null
            : null;
          setState({
            user: data.user,
            guilds: data.guilds || [],
            loading: false,
            selectedGuildId: savedGuild?.id || null,
            selectedGuild: savedGuild,
          });
        } else {
          setState(s => ({ ...s, loading: false }));
        }
      })
      .catch(() => setState(s => ({ ...s, loading: false })));
  }, []);

  const selectGuild = (guildId: string) => {
    const guild = state.guilds.find(g => g.id === guildId) || null;
    localStorage.setItem('selectedGuildId', guildId);
    setState(s => ({ ...s, selectedGuildId: guildId, selectedGuild: guild }));
  };

  const clearGuild = () => {
    localStorage.removeItem('selectedGuildId');
    setState(s => ({ ...s, selectedGuildId: null, selectedGuild: null }));
  };

  return { ...state, selectGuild, clearGuild };
}
