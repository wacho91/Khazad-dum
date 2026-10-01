import { useCallback, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useInventoryStore } from '../stores/inventoryStore';

export function useInventory({ page = 1, pageSize = 20, auto = true } = {}) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const { items, total, loading, error, setData, setLoading, setError } =
    useInventoryStore();

  const fetchParts = useCallback(
    async (params = {}) => {
      if (!tenantId) return;
      setLoading(true);
      try {
        const data = await api.spareParts.list(tenantId, {
          page: params.page ?? page,
          page_size: params.pageSize ?? pageSize,
        });
        setData({
          items: data.items,
          total: data.total,
          page: data.page,
          pageSize: data.page_size,
        });
      } catch (err) {
        setError(err.message || 'Error al cargar inventario');
      } finally {
        setLoading(false);
      }
    },
    [tenantId, page, pageSize, setData, setLoading, setError]
  );

  useEffect(() => {
    if (auto && tenantId) fetchParts();
  }, [auto, tenantId, fetchParts]);

  const createPart = useCallback(
    async (payload) => {
      const created = await api.spareParts.create(tenantId, payload);
      await fetchParts();
      return created;
    },
    [tenantId, fetchParts]
  );

  const updatePart = useCallback(
    async (id, payload) => {
      const updated = await api.spareParts.update(tenantId, id, payload);
      await fetchParts();
      return updated;
    },
    [tenantId, fetchParts]
  );

  const deletePart = useCallback(
    async (id) => {
      await api.spareParts.remove(tenantId, id);
      await fetchParts();
    },
    [tenantId, fetchParts]
  );

  const registerMovement = useCallback(
    async (payload) => {
      const created = await api.spareParts.createMovement(tenantId, payload);
      await fetchParts();
      return created;
    },
    [tenantId, fetchParts]
  );

  return {
    items,
    total,
    loading,
    error,
    refetch: fetchParts,
    createPart,
    updatePart,
    deletePart,
    registerMovement,
  };
}
