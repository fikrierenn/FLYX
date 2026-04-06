import { create } from 'zustand';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuth: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuth: false,

  login: async (email, password) => {
    try {
      const res = await fetch('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, first_name: 'Admin', last_name: 'User', tenant_id: 'default' }),
      });
      if (!res.ok) {
        // Kayit basarisiz → login dene
        const loginRes = await fetch('/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, tenant_id: 'default' }),
        });
        if (!loginRes.ok) return false;
        const data = await loginRes.json();
        set({ user: data.user, token: data.accessToken, isAuth: true });
        return true;
      }
      const data = await res.json();
      set({ user: data.user, token: data.accessToken, isAuth: true });
      return true;
    } catch {
      return false;
    }
  },

  logout: () => set({ user: null, token: null, isAuth: false }),
}));
