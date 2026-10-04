import { useState, useEffect } from 'react';
import LoadingState from '../components/ui/LoadingState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState({ assets: 0, openWOs: 0, lowStock: 0 });
  const [topAssets, setTopAssets] = useState([]);
  const [urgentWOs, setUrgentWOs] = useState([]);
  const [costBreakdown, setCostBreakdown] = useState([{ name: 'Repuestos', value: 0 }, { name: 'Mano de Obra', value: 0 }]);
  const [monthlyCosts, setMonthlyCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('manttoflow_token');

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const resTenants = await fetch('http://localhost:8000/api/v1/tenants/', { headers });
        const tenantsData = await resTenants.json();
        const tenants = tenantsData.items || tenantsData;
        if (tenants.length === 0) { setLoading(false); return; }
        
        const tid = tenants[0].id;

        const [resAssets, resWOs, resParts] = await Promise.all([
          fetch(`http://localhost:8000/api/v1/tenants/${tid}/assets`, { headers }),
          fetch(`http://localhost:8000/api/v1/tenants/${tid}/work-orders`, { headers }),
          fetch(`http://localhost:8000/api/v1/tenants/${tid}/spare-parts`, { headers })
        ]);

        const assetsData = resAssets.ok ? (await resAssets.json()).items || [] : [];
        const woRaw = resWOs.ok ? await resWOs.json() : [];
        const wosData = woRaw.items ? woRaw.items : (Array.isArray(woRaw) ? woRaw : []);

        // 1. KPIs Básicos
        const openWOs = wosData.filter(wo => wo.status !== 'completed').length;
        const lowStock = partsData.filter(p => Number(p.stock_actual) <= Number(p.stock_minimo)).length;
        setStats({ assets: assetsData.length, openWOs, lowStock });

        // 2. Top 5 Máquinas Costosas
        const sorted = [...assetsData].sort((a, b) => Number(b.costo_acumulado || 0) - Number(a.costo_acumulado || 0)).slice(0, 5);
        setTopAssets(sorted);

        // 3. OTs Urgentes (Abiertas)
        const openList = wosData.filter(wo => wo.status !== 'completed').slice(0, 5);
        setUrgentWOs(openList);

        // 4. Distribución de Costos (Pie Chart)
        let totalParts = 0;
        let totalLabor = 0;
        wosData.forEach(wo => {
          if (wo.status === 'completed') {
            totalParts += Number(wo.parts_cost || 0);
            totalLabor += Number(wo.labor_cost || 0);
          }
        });
        setCostBreakdown([
          { name: 'Repuestos', value: totalParts },
          { name: 'Mano de Obra', value: totalLabor }
        ]);

        // 5. Histórico de Costos por Mes (Bar Chart) - Últimos 6 meses
        const monthsMap = {};
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const name = d.toLocaleString('es-CO', { month: 'short' });
          monthsMap[key] = { name: name.charAt(0).toUpperCase() + name.slice(1), costos: 0 };
        }

        wosData.forEach(wo => {
          if (wo.status === 'completed' && wo.closed_at) {
            const date = new Date(wo.closed_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthsMap[key]) {
              monthsMap[key].costos += Number(wo.parts_cost || 0) + Number(wo.labor_cost || 0);
            }
          }
        });
        setMonthlyCosts(Object.values(monthsMap));

      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const formatCurrency = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
  const COLORS = ['#6366f1', '#38bdf8']; // Índigo y Sky para el pie chart

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingState />
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Dashboard 📊</h1>
      <p className="text-slate-500 mb-8">Centro de control de mantenimiento y costos.</p>
      
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

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Histórico de Costos (Bar Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Histórico de Gastos de Mantenimiento (6 meses)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCosts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="costos" name="Costo Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución de Costos (Pie Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Distribución de Costos</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={costBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                  {costBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tablas Inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Máquinas más Costosas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">🏭 Máquinas más Costosas (TCO)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">Código</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Nombre</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Costo Acum.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topAssets.length === 0 ? (
                  <tr><td colSpan="3" className="px-4 py-4 text-center text-slate-400 italic">Sin datos</td></tr>
                ) : topAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{asset.asset_tag}</td>
                    <td className="px-4 py-3 text-slate-600">{asset.name}</td>
                    <td className="px-4 py-3 font-bold text-red-600 text-right">{formatCurrency(asset.costo_acumulado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* OTs Urgentes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">🚨 OTs Pendientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Descripción</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Prioridad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {urgentWOs.length === 0 ? (
                  <tr><td colSpan="3" className="px-4 py-4 text-center text-slate-400 italic">No hay OTs pendientes</td></tr>
                ) : urgentWOs.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(wo.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">{wo.description}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        wo.priority === 'urgent' ? 'bg-red-100 text-red-700' : 
                        wo.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {wo.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}