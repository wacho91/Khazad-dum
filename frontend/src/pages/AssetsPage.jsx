import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import LoadingState from '../components/ui/LoadingState';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';

export default function AssetsPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [tenantId, setTenantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', asset_tag: '', location: '' });

  const token = localStorage.getItem('manttoflow_token');

  // === MAGIA: Paginación global (8 items por página) ===
  const { currentItems, currentPage, totalPages, goToPage } = usePagination(assets, 8);
  // ======================================================

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const resTenants = await fetch('http://localhost:8000/api/v1/tenants/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resTenants.ok) throw new Error('Error al obtener empresa');
      const tenantsData = await resTenants.json();
      const tenants = tenantsData.items || tenantsData; 
      if (tenants.length === 0) { setLoading(false); return; }
      
      const currentTenantId = tenants[0].id;
      setTenantId(currentTenantId);

      const resAssets = await fetch(`http://localhost:8000/api/v1/tenants/${currentTenantId}/assets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resAssets.ok) {
        const assetsData = await resAssets.json();
        setAssets(assetsData.items || assetsData);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]"><LoadingState /></div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenantId) return Swal.fire('Error', 'No se encontró la empresa.', 'error');
    setSaving(true);
    const method = editingId ? 'PATCH' : 'POST';
    const url = editingId ? `http://localhost:8000/api/v1/tenants/${tenantId}/assets/${editingId}` : `http://localhost:8000/api/v1/tenants/${tenantId}/assets`;
    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(form)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al guardar');
      }
      Swal.fire({ icon: 'success', title: editingId ? '¡Actualizado!' : '¡Creado!', timer: 1500, showConfirmButton: false });
      setForm({ name: '', asset_tag: '', location: '' });
      setEditingId(null);
      fetchInitialData(); 
    } catch (err) { Swal.fire('Error', err.message, 'error'); } 
    finally { setSaving(false); }
  };

  const handleEdit = (asset) => {
    setForm({ name: asset.name, asset_tag: asset.asset_tag, location: asset.location || '' });
    setEditingId(asset.id);
  };

  const handleCancelEdit = () => { setForm({ name: '', asset_tag: '', location: '' }); setEditingId(null); };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?', text: "¡No podrás revertir esta acción!",
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await fetch(`http://localhost:8000/api/v1/tenants/${tenantId}/assets/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
          Swal.fire('¡Eliminado!', 'El activo ha sido eliminado.', 'success');
          fetchInitialData();
        } catch (err) { Swal.fire('Error', 'No se pudo eliminar.', 'error'); }
      }
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Activos 🏭</h1>
        <p className="text-slate-500">Registra las máquinas y equipos de tu planta.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">{editingId ? 'Editar Activo' : 'Nuevo Activo'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className=" bg-white w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-800" placeholder="Banda Transportadora 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tag / Código</label>
                <input type="text" required value={form.asset_tag} onChange={(e) => setForm({...form, asset_tag: e.target.value})} className="bg-white w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-800" placeholder="BANDA-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Ubicación</label>
                <input type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} className=" bg-white w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-800" placeholder="Línea de Producción 1" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="w-full bg-sky-600 text-white py-2 rounded-lg font-semibold hover:bg-sky-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : (editingId ? '✓ Actualizar' : '+ Crear Activo')}
                </button>
                {editingId && <button type="button" onClick={handleCancelEdit} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300">✕</button>}
              </div>
            </form>
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Máquinas Registradas</h2>
            {assets.length === 0 ? <p className="text-slate-400 italic">No hay activos registrados.</p> : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-600">Código</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Nombre</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Ubicación</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Costo Acumulado</th>
                        <th className="px-4 py-3 font-semibold text-slate-600 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentItems.map((asset) => (
                        <tr key={asset.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-800">{asset.asset_tag}</td>
                          <td className="px-4 py-3 text-slate-600">{asset.name}</td>
                          <td className="px-4 py-3 text-slate-500">{asset.location || '—'}</td>
                          <td className="px-4 py-3 font-bold text-red-600">${Number(asset.costo_acumulado || 0).toLocaleString('es-CO')}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button onClick={() => handleEdit(asset)} className="text-sky-600 hover:text-sky-800 font-medium mr-3">Editar</button>
                            <button onClick={() => handleDelete(asset.id)} className="text-red-500 hover:text-red-700 font-medium">Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}