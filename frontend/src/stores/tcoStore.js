import { create } from 'zustand';

export const useTcoStore = create((set) => ({
  entries: [],
  total: 0,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setData: ({ entries, total }) => set({ entries, total, error: null }),
  reset: () => set({ entries: [], total: 0, error: null }),
}));
