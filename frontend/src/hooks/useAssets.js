import { useCallback, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useAssetStore } from '../stores/assetStore';

export function useAssets({ page = 1, pageSize = 20, auto = true } = {}) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const { items, total, loading, error, setData, setLoading, setError } =
    useAssetStore();

  const fetchAssets = useCallback(
    async (params = {}) => {
      if (!tenantId) return;
      setLoading(true);
      try {
        const data = await api.assets.list(tenantId, {
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
        setError(err.message || 'Error al cargar activos');
      } finally {
        setLoading(false);
      }
    },
    [tenantId, page, pageSize, setData, setLoading, setError]
  );

  useEffect(() => {
    if (auto && tenantId) fetchAssets();
  }, [auto, tenantId, fetchAssets]);

  const createAsset = useCallback(
    async (payload) => {
      const created = await api.assets.create(tenantId, payload);
      await fetchAssets();
      return created;
    },
    [tenantId, fetchAssets]
  );

  const updateAsset = useCallback(
    async (id, payload) => {
      const updated = await api.assets.update(tenantId, id, payload);
      await fetchAssets();
      return updated;
    },
    [tenantId, fetchAssets]
  );

  const deleteAsset = useCallback(
    async (id) => {
      await api.assets.remove(tenantId, id);
      await fetchAssets();
    },
    [tenantId, fetchAssets]
  );

  const changeStatus = useCallback(
    async (id, payload) => {
      const updated = await api.assets.changeStatus(tenantId, id, payload);
      await fetchAssets();
      return updated;
    },
    [tenantId, fetchAssets]
  );

  return {
    items,
    total,
    loading,
    error,
    refetch: fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    changeStatus,
  };
}

export function useAsset(id) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tenantId || !id) return;
    let cancelled = false;
    setLoading(true);
    api.assets
      .get(tenantId, id)
      .then((data) => !cancelled && setAsset(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tenantId, id]);

  return { asset, loading, error };
}
