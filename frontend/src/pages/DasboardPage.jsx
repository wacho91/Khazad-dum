import { useState, useEffect } from 'react';
import LoadingState from '../components/ui/LoadingState';

export default function DashboardPage() {
  const [stats, setStats] = useState({ assets: 0, openWOs: 0, lowStock: 0 });
  const [topAssets, setTopAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('manttoflow_token');

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // 1. Buscamos el Tenant
        const resTenants = await fetch('http://localhost:8000/api/v1/tenants/', { headers });
        const tenantsData = await resTenants.json();
        const tenants = tenantsData.items || tenantsData;
        if (tenants.length === 0) { setLoading(false); return; }
        
        const tid = tenants[0].id;

        // 2. Traemos todos los datos en paralelo
        const [resAssets, resWOs, resParts] = await Promise.all([
          fetch(`http://localhost:8000/api/v1/tenants/${tid}/assets`, { headers }),
          fetch(`http://localhost:8000/api/v1/tenants/${tid}/work-orders`, { headers }),
          fetch(`http://localhost:8000/api/v1/tenants/${tid}/spare-parts`, { headers })
        ]);

        const assetsData = resAssets.ok ? (await resAssets.json()).items || [] : [];
        const wosData = resWOs.ok ? (await resWOs.json()).items || [] : [];
        const partsData = resParts.ok ? (await resParts.json()).items || [] : [];

        // 3. Calculamos las métricas
        const openWOs = wosData.filter(wo => wo.status === 'open' || wo.status === 'in_progress').length;
        const lowStock = partsData.filter(p => Number(p.stock_actual) <= Number(p.stock_minimo)).length;

        setStats({
          assets: assetsData.length,
          openWOs,
          lowStock
        });

        // 4. Top 5 máquinas más costosas
        const sorted = [...assetsData].sort((a, b) => Number(b.costo_acumulado || 0) - Number(a.costo_acumulado || 0)).slice(0, 5);
        setTopAssets(sorted);

      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const formatCurrency = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;

    if (loading) return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <LoadingState />
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Dashboard 📊</h1>
      <p className="text-slate-500 mb-8">Resumen de mantenimiento y disponibilidad de activos.</p>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-sky-600 font-medium uppercase">Activos Totales</p>
            <span className="text-2xl">🏭</span>
          </div>
          <p className="text-4xl font-bold text-slate-800">{stats.assets}</p>
          <p className="text-xs text-slate-400 mt-1">Máquinas registradas</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-amber-600 font-medium uppercase">OTs Abiertas</p>
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-4xl font-bold text-slate-800">{stats.openWOs}</p>
          <p className="text-xs text-slate-400 mt-1">Mantenimientos pendientes</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-red-600 font-medium uppercase">Stock Bajo</p>
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-4xl font-bold text-slate-800">{stats.lowStock}</p>
          <p className="text-xs text-slate-400 mt-1">Repuestos por agotarse</p>
        </div>
      </div>

      {/* Tabla de máquinas más costosas */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">🏭 Máquinas más Costosas (TCO)</h2>
        {topAssets.length === 0 ? (
          <p className="text-slate-400 italic">No hay datos disponibles.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">Código</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Nombre</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Ubicación</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Costo Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{asset.asset_tag}</td>
                    <td className="px-4 py-3 text-slate-600">{asset.name}</td>
                    <td className="px-4 py-3 text-slate-500">{asset.location || '—'}</td>
                    <td className="px-4 py-3 font-bold text-red-600 text-right">{formatCurrency(asset.costo_acumulado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}