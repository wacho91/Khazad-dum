export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Dashboard 📊</h1>
      <p className="text-slate-500 mb-8">Resumen de mantenimiento y disponibilidad de activos.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-sky-600 font-medium mb-1 uppercase">Activos Totales</p>
          <p className="text-4xl font-bold text-slate-800">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-amber-600 font-medium mb-1 uppercase">OTs Abiertas</p>
          <p className="text-4xl font-bold text-slate-800">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-red-600 font-medium mb-1 uppercase">Stock Bajo</p>
          <p className="text-4xl font-bold text-slate-800">0</p>
        </div>
      </div>
    </div>
  );
}