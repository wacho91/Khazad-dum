import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function AppLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado para el menú móvil
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
      isActive ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-slate-100 flex">
      
      {/* === BARRA SUPERIOR (Solo visible en celulares) === */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white p-4 flex items-center justify-between z-50">
        <h1 className="text-xl font-bold text-sky-400">ManttoFlow 🏭</h1>
        <button onClick={() => setIsSidebarOpen(true)} className="text-white focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>

      {/* === OVERLAY (Fondo oscuro al abrir menú en móvil) === */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* === SIDEBAR (Menú Lateral) === */}
      <aside className={`fixed top-0 left-0 w-64 bg-slate-900 text-white flex flex-col p-4 h-full z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="mb-8 px-4 py-4 mt-12 md:mt-0 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-sky-400">ManttoFlow 🏭</h1>
          {/* Botón de cerrar (Solo en móvil) */}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <nav className="flex-1 space-y-2">
          <NavLink to="/app" end className={linkClass} onClick={() => setIsSidebarOpen(false)}>
            <span>📊</span> Dashboard
          </NavLink>
          <NavLink to="/app/assets" className={linkClass} onClick={() => setIsSidebarOpen(false)}>
            <span>🏭</span> Activos
          </NavLink>
          <NavLink to="/app/spare-parts" className={linkClass} onClick={() => setIsSidebarOpen(false)}>
            <span>🔧</span> Repuestos
          </NavLink>
          <NavLink to="/app/work-orders" className={linkClass} onClick={() => setIsSidebarOpen(false)}>
            <span>📋</span> Órdenes
          </NavLink>
        </nav>
        
        <div className="mt-auto pb-12 md:pb-0">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-400 hover:bg-red-900/50 transition-colors"
          >
            <span>🚪</span> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* === CONTENIDO PRINCIPAL === */}
      <main className="flex-1 md:ml-64 p-8 pt-24 md:pt-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}