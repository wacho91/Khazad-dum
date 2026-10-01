import { create } from 'zustand';

export const useWorkOrderStore = create((set) => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setData: ({ items, total, page, pageSize }) =>
    set({ items, total, page, pageSize, error: null }),
  reset: () =>
    set({ items: [], total: 0, page: 1, pageSize: 20, error: null }),
}));
