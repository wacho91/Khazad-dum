import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import LoadingState from '../components/ui/LoadingState';

export default function WorkOrdersPage() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [parts, setParts] = useState([]);
  const [tenantId, setTenantId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({ 
    asset_id: '', 
    description: 'Mantenimiento general', 
    priority: 'medium', 
    type: 'corrective' 
  });

  const token = localStorage.getItem('manttoflow_token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const resTenants = await fetch('http://localhost:8000/api/v1/tenants/', { headers });
      const tenantsData = await resTenants.json();
      const tenants = tenantsData.items || tenantsData;
      
      if (tenants.length === 0) { setLoading(false); return; }
      
      const currentTenantId = tenants[0].id;
      setTenantId(currentTenantId);

      const resAssets = await fetch(`http://localhost:8000/api/v1/tenants/${currentTenantId}/assets`, { headers });
      if (resAssets.ok) {
        const assetsList = (await resAssets.json()).items || [];
        setAssets(assetsList);
        if (assetsList.length > 0) setForm(prev => ({ ...prev, asset_id: assetsList[0].id }));
      }

      const resParts = await fetch(`http://localhost:8000/api/v1/tenants/${currentTenantId}/spare-parts`, { headers });
      if (resParts.ok) {
        const partsList = (await resParts.json()).items || [];
        setParts(partsList);
      }

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
    if (!tenantId) return Swal.fire('Error', 'No se encontró la empresa.', 'error');
    
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
      
      Swal.fire({ icon: 'success', title: '¡OT Creada!', timer: 1500, showConfirmButton: false });
      setForm(prev => ({ ...prev, description: 'Mantenimiento general' }));
      fetchInitialData(); 
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleCloseWO = async (wo) => {
    if (parts.length === 0) {
      return Swal.fire('Atención', 'No tienes repuestos en la bodega para asignar a la OT. Crea repuestos primero.', 'warning');
    }

    const { value: formValues } = await Swal.fire({
      title: `Cerrar OT: ${wo.description.substring(0, 20)}...`,
      html: `
        <p class="text-sm text-slate-500 mb-4">Registra los repuestos usados y el costo de mano de obra.</p>
        <select id="swal-part" class="swal2-select">
          ${parts.map(p => `<option value="${p.id}">${p.name} (Stock: ${p.stock_actual})</option>`).join('')}
        </select>
        <input type="number" id="swal-qty" class="swal2-input" placeholder="Cantidad usada" step="0.1" min="0.1">
        <input type="number" id="swal-labor" class="swal2-input" placeholder="Costo de Mano de Obra (ej. 50000)" step="0.01" min="0">
      `,
      confirmButtonText: 'Cerrar y Calcular Costos',
      confirmButtonColor: '#4f46e5',
      focusConfirm: false,
      preConfirm: () => {
        const partId = document.getElementById('swal-part').value;
        const qty = document.getElementById('swal-qty').value;
        const labor = document.getElementById('swal-labor').value;

        if (!qty || parseFloat(qty) <= 0) {
          Swal.showValidationMessage('La cantidad usada debe ser mayor a 0');
        }
        
        return {
          used_parts: [{ spare_part_id: partId, quantity: parseFloat(qty) }],
          labor_cost: labor ? parseFloat(labor) : 0
        };
      }
    });

    if (formValues) {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/tenants/${tenantId}/work-orders/${wo.id}/close`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(formValues)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Error al cerrar la OT');

        Swal.fire({
          icon: 'success',
          title: '¡OT Cerrada!',
          text: 'Los repuestos fueron descontados y el costo sumado a la máquina.',
          confirmButtonColor: '#4f46e5'
        });
        fetchInitialData();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  // === LA MAGIA: VER EL RECIBO ===
  const handleViewReceipt = async (wo) => {
    try {
      Swal.fire({ title: 'Cargando recibo...', didOpen: () => Swal.showLoading() });
      
      const res = await fetch(`http://localhost:8000/api/v1/tenants/${tenantId}/work-orders/${wo.id}/cost-breakdown`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Error al obtener el recibo');

      const itemsHtml = data.items.map(item => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px; text-align: left;">${item.name}</td>
          <td style="padding: 8px; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; text-align: right;">$${item.unit_price.toLocaleString('es-CO')}</td>
          <td style="padding: 8px; text-align: right;">$${item.total.toLocaleString('es-CO')}</td>
        </tr>
      `).join('');

      Swal.fire({
        title: `🧾 Recibo de Mantenimiento`,
        html: `
          <div style="text-align: left; font-size: 14px; color: #334155;">
            <p style="margin-bottom: 5px;"><b>OT:</b> ${data.description}</p>
            <p style="margin-bottom: 15px;"><b>Fecha de Cierre:</b> ${new Date(data.closed_at).toLocaleDateString()}</p>
            <div style="border-top: 1px solid #e2e8f0; margin-bottom: 15px;"></div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px;">
                  <th style="padding: 8px; text-align: left;">Repuesto</th>
                  <th style="padding: 8px; text-align: center;">Cant.</th>
                  <th style="padding: 8px; text-align: right;">V. Unit.</th>
                  <th style="padding: 8px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div style="border-top: 2px solid #e2e8f0; margin-top: 15px; padding-top: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Costo de Repuestos:</span>
                <span style="font-weight: bold;">$${data.parts_cost.toLocaleString('es-CO')}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span>Mano de Obra:</span>
                <span style="font-weight: bold;">$${data.labor_cost.toLocaleString('es-CO')}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; color: #4f46e5; background: #f8fafc; padding: 10px; border-radius: 8px;">
                <span>TOTAL OT:</span>
                <span>$${data.total_cost.toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>
        `,
        confirmButtonColor: '#4f46e5',
        confirmButtonText: 'Cerrar',
        width: '600px'
      });

    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const statusColor = (status) => {
    if (status === 'completed') return 'bg-green-100 text-green-700';
    if (status === 'in_progress') return 'bg-sky-100 text-sky-700';
    return 'bg-amber-100 text-amber-700';
  };

  const priorityColor = (priority) => {
    if (priority === 'urgent') return 'bg-red-100 text-red-700';
    if (priority === 'high') return 'bg-orange-100 text-orange-700';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Órdenes de Trabajo 📋</h1>
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
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
            {loading ? <LoadingState /> : workOrders.length === 0 ? <p className="text-slate-400 italic">No hay órdenes de trabajo registradas.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600">Fecha</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Máquina</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Prioridad</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Estado</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {workOrders.map((wo) => {
                      const asset = assets.find(a => a.id === wo.asset_id);
                      return (
                        <tr key={wo.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {new Date(wo.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">{asset?.name || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${priorityColor(wo.priority)}`}>
                              {wo.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(wo.status)}`}>
                              {wo.status === 'completed' ? 'Completada' : wo.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {wo.status === 'completed' ? (
                              <button onClick={() => handleViewReceipt(wo)} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-slate-200">
                                🧾 Ver Recibo
                              </button>
                            ) : (
                              <button onClick={() => handleCloseWO(wo)} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-indigo-200">
                                🔒 Cerrar OT
                              </button>
                            )}
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