import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WorkOrdersPage() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [tenantId, setTenantId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Por defecto, la OT es Correctiva y de Prioridad Media
  const [form, setForm] = useState({ 
    asset_id: '', 
    description: 'Mantenimiento general', 
    priority: 'medium', 
    type: 'corrective' 
  });

  const token = localStorage.getItem('manttoflow_token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // 1. Buscamos el Tenant
      const resTenants = await fetch('http://localhost:8000/api/v1/tenants/', { headers });
      const tenantsData = await resTenants.json();
      const tenants = tenantsData.items || tenantsData;
      
      if (tenants.length === 0) { setLoading(false); return; }
      
      const currentTenantId = tenants[0].id;
      setTenantId(currentTenantId);

      // 2. Traemos los Activos (Máquinas) para el menú desplegable
      const resAssets = await fetch(`http://localhost:8000/api/v1/tenants/${currentTenantId}/assets`, { headers });
      if (resAssets.ok) {
        const assetsData = await resAssets.json();
        const assetsList = assetsData.items || assetsData;
        setAssets(assetsList);
        if (assetsList.length > 0) setForm(prev => ({ ...prev, asset_id: assetsList[0].id }));
      }

      // 3. Traemos las Órdenes de Trabajo existentes
      const resWO = await fetch(`http://localhost:8000/api/v1/tenants/${currentTenantId}/work-orders`, { headers });
      if (resWO.ok) {
        const woData = await resWO.json();
        setWorkOrders(woData.items || woData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenantId) return alert('No se encontró la empresa.');
    
    try {
      const res = await fetch(`http://localhost:8000/api/v1/tenants/${tenantId}/work-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        let errorMsg = 'Error al crear la orden';
        if (errData.detail && Array.isArray(errData.detail)) {
          errorMsg = errData.detail.map(e => `Falta: ${e.loc[e.loc.length - 1]}`).join(', ');
        } else if (errData.detail) {
          errorMsg = errData.detail;
        }
        throw new Error(errorMsg);
      }
      
      setForm(prev => ({ ...prev, description: 'Mantenimiento general' }));
      fetchInitialData(); 
    } catch (err) {
      alert(err.message);
    }
  };

  // Colores para los estados y prioridades
  const statusColor = (status) => {
    if (status === 'completed') return 'bg-green-100 text-green-700';
    if (status === 'in_progress') return 'bg-sky-100 text-sky-700';
    return 'bg-amber-100 text-amber-700'; // open
  };

  const priorityColor = (priority) => {
    if (priority === 'urgent') return 'bg-red-100 text-red-700';
    if (priority === 'high') return 'bg-orange-100 text-orange-700';
    return 'bg-slate-100 text-slate-600'; // medium/low
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Órdenes de Trajo 📋</h1>
        <p className="text-slate-500">Gestiona los mantenimientos preventivos y correctivos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Nueva Orden (OT)</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Máquina (Activo)</label>
                <select 
                  value={form.asset_id}
                  onChange={(e) => setForm({...form, asset_id: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                >
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.asset_tag})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Descripción del Trabajo</label>
                <textarea 
                  required
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                  placeholder="Cambiar rodamientos de la banda..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Tipo</label>
                  <select 
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="corrective">Correctivo</option>
                    <option value="preventive">Preventivo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Prioridad</label>
                  <select 
                    value={form.priority}
                    onChange={(e) => setForm({...form, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700">
                + Crear Orden
              </button>
            </form>
          </div>
        </div>

        {/* Lista de OTs */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Órdenes Activas e Historial</h2>
            {loading ? <p className="text-slate-400">Cargando...</p> : workOrders.length === 0 ? <p className="text-slate-400 italic">No hay órdenes de trabajo registradas.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600">ID / Fecha</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Máquina</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Descripción</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Prioridad</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {workOrders.map((wo) => {
                      const asset = assets.find(a => a.id === wo.asset_id);
                      return (
                        <tr key={wo.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {wo.id.substring(0,8)}<br/>
                            {new Date(wo.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">{asset?.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{wo.description}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${priorityColor(wo.priority)}`}>
                              {wo.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(wo.status)}`}>
                              {wo.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}