import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      tenantId: null,
      tenantName: null,
      isAuthenticated: false,
      hydrated: false,

      hydrate: () => set({ hydrated: true }),

      login: ({ user, token, tenantId, tenantName }) =>
        set({
          user,
          token,
          tenantId,
          tenantName,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          tenantId: null,
          tenantName: null,
          isAuthenticated: false,
        }),

      setTenant: (tenantId, tenantName) => set({ tenantId, tenantName }),

      hasRole: (roles = []) => {
        const role = get().user?.role;
        if (!role) return false;
        return roles.includes(role);
      },
    }),
    {
      name: 'khazad-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        tenantId: state.tenantId,
        tenantName: state.tenantName,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
