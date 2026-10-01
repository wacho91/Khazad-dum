import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AssetsPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [tenantId, setTenantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', asset_tag: '', location: '' });

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
      // 1. Buscamos el ID de la empresa (Tenant) a la que perteneces
      const resTenants = await fetch('http://localhost:8000/api/v1/tenants/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resTenants.ok) throw new Error('Error al obtener empresa');
      
      const tenantsData = await resTenants.json();
      const tenants = tenantsData.items || tenantsData; // Por si viene paginado
      
      if (tenants.length === 0) {
        alert('No hay empresas registradas.');
        setLoading(false);
        return;
      }
      
      const currentTenantId = tenants[0].id;
      setTenantId(currentTenantId);

      // 2. Traemos los activos de esa empresa
      const resAssets = await fetch(`http://localhost:8000/api/v1/tenants/${currentTenantId}/assets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resAssets.ok) {
        const assetsData = await resAssets.json();
        setAssets(assetsData.items || assetsData);
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
      const res = await fetch(`http://localhost:8000/api/v1/tenants/${tenantId}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al crear el activo');
      }
      
      setForm({ name: '', asset_tag: '', location: '' });
      fetchInitialData(); // Refrescamos la lista
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Activos 🏭</h1>
        <p className="text-slate-500">Registra las máquinas y equipos de tu planta.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Nuevo Activo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
                <input 
                  type="text" required
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  placeholder="Banda Transportadora 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tag / Código</label>
                <input 
                  type="text" required
                  value={form.asset_tag}
                  onChange={(e) => setForm({...form, asset_tag: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  placeholder="BANDA-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Ubicación</label>
                <input 
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({...form, location: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  placeholder="Línea de Producción 1"
                />
              </div>
              <button type="submit" className="w-full bg-sky-600 text-white py-2 rounded-lg font-semibold hover:bg-sky-700">
                + Crear Activo
              </button>
            </form>
          </div>
        </div>

        {/* Lista */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Máquinas Registradas</h2>
            {loading ? <p className="text-slate-400">Cargando...</p> : assets.length === 0 ? <p className="text-slate-400 italic">No hay activos registrados.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600">Código</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Nombre</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Ubicación</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{asset.asset_tag}</td>
                        <td className="px-4 py-3 text-slate-600">{asset.name}</td>
                        <td className="px-4 py-3 text-slate-500">{asset.location || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            {asset.status}
                          </span>
                        </td>
                      </tr>
                    ))}
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