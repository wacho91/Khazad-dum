import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import LoadingState from '../components/ui/LoadingState';

export default function SparePartsPage() {
  const navigate = useNavigate();
  const [parts, setParts] = useState([]);
  const [tenantId, setTenantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ sku: '', name: '', stock_actual: 0, stock_minimo: 0, costo_promedio: 0 });

  const token = localStorage.getItem('manttoflow_token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const resTenants = await fetch('http://localhost:8000/api/v1/tenants/', { headers });
      if (!resTenants.ok) throw new Error('Error al obtener empresa');
      
      const tenantsData = await resTenants.json();
      const tenants = tenantsData.items || tenantsData; 
      
      if (tenants.length === 0) { setLoading(false); return; }
      
      const currentTenantId = tenants[0].id;
      setTenantId(currentTenantId);

      const resParts = await fetch(`http://localhost:8000/api/v1/tenants/${currentTenantId}/spare-parts`, { headers });
      if (resParts.ok) {
        const partsData = await resParts.json();
        setParts(partsData.items || partsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lógica unificada: Si está cargando, muestra el componente centrado en toda la página
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingState />
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenantId) return Swal.fire('Error', 'No se encontró la empresa.', 'error');
    
    const method = editingId ? 'PATCH' : 'POST';
    const url = editingId 
      ? `http://localhost:8000/api/v1/tenants/${tenantId}/spare-parts/${editingId}`
      : `http://localhost:8000/api/v1/tenants/${tenantId}/spare-parts`;
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          stock_actual: Number(form.stock_actual),
          stock_minimo: Number(form.stock_minimo),
          costo_promedio: Number(form.costo_promedio)
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        let errorMsg = 'Error al guardar el repuesto';
        if (errData.detail && Array.isArray(errData.detail)) {
          errorMsg = errData.detail.map(e => `Falta el campo: ${e.loc[e.loc.length - 1]}`).join(', ');
        } else if (errData.detail) {
          errorMsg = errData.detail;
        }
        throw new Error(errorMsg);
      }
      
      Swal.fire({ icon: 'success', title: editingId ? '¡Actualizado!' : '¡Creado!', timer: 1500, showConfirmButton: false });
      setForm({ sku: '', name: '', stock_actual: 0, stock_minimo: 0, costo_promedio: 0 });
      setEditingId(null);
      fetchInitialData(); 
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleEdit = (part) => {
    setForm({
      sku: part.sku,
      name: part.name,
      stock_actual: part.stock_actual,
      stock_minimo: part.stock_minimo,
      costo_promedio: part.costo_promedio
    });
    setEditingId(part.id);
  };

  const handleCancelEdit = () => {
    setForm({ sku: '', name: '', stock_actual: 0, stock_minimo: 0, costo_promedio: 0 });
    setEditingId(null);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esta acción! El repuesto se eliminará permanentemente.",
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#d33', cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await fetch(`http://localhost:8000/api/v1/tenants/${tenantId}/spare-parts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          Swal.fire('¡Eliminado!', 'El repuesto ha sido eliminado.', 'success');
          fetchInitialData();
        } catch (err) { Swal.fire('Error', 'No se pudo eliminar.', 'error'); }
      }
    });
  };

  const formatCurrency = (value) => `$${Number(value).toLocaleString('es-CO')}`;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Repuestos 🧰</h1>
        <p className="text-slate-500">Controla el inventario de tu bodega de mantenimiento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">{editingId ? 'Editar Repuesto' : 'Nuevo Repuesto'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">SKU / Código</label>
                <input type="text" required value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-800" placeholder="ROD-6204" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-800" placeholder="Rodamiento 6204" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Stock Actual</label>
                  <input type="number" required value={form.stock_actual} onChange={(e) => setForm({...form, stock_actual: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Stock Mínimo</label>
                  <input type="number" required value={form.stock_minimo} onChange={(e) => setForm({...form, stock_minimo: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-800" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Costo Unitario</label>
                <input type="number" step="0.01" required value={form.costo_promedio} onChange={(e) => setForm({...form, costo_promedio: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-800" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="w-full bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700">
                  {editingId ? '✓ Actualizar' : '+ Crear Repuesto'}
                </button>
                {editingId && <button type="button" onClick={handleCancelEdit} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300">✕</button>}
              </div>
            </form>
          </div>
        </div>

        {/* Lista */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Inventario de Bodega</h2>
            {parts.length === 0 ? <p className="text-slate-400 italic">No hay repuestos registrados.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600">SKU</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Nombre</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Stock</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Costo</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Alerta</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parts.map((part) => {
                      const stockActual = Number(part.stock_actual);
                      const stockMinimo = Number(part.stock_minimo);
                      const isLow = stockActual <= stockMinimo;

                      return (
                        <tr key={part.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-800">{part.sku}</td>
                          <td className="px-4 py-3 text-slate-600">{part.name}</td>
                          <td className="px-4 py-3 text-slate-800 font-medium">{stockActual}</td>
                          <td className="px-4 py-3 text-slate-500">{formatCurrency(part.costo_promedio)}</td>
                          <td className="px-4 py-3">
                            {isLow ? (
                              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">⚠️ Reabastecer</span>
                            ) : (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Óptimo</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button onClick={() => handleEdit(part)} className="text-sky-600 hover:text-sky-800 font-medium mr-3">Editar</button>
                            <button onClick={() => handleDelete(part.id)} className="text-red-500 hover:text-red-700 font-medium">Eliminar</button>
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