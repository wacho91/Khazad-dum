import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function AppLayout() {
  const navigate = useNavigate();
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
      <aside className="w-64 bg-slate-900 text-white flex flex-col p-4 fixed h-full">
        <div className="mb-8 px-4 py-4">
          <h1 className="text-2xl font-bold text-sky-400">Khazad-Dum</h1>
        </div>
        <nav className="flex-1 space-y-2">
          <NavLink to="/app" end className={linkClass}>📊 Dashboard</NavLink>
          <NavLink to="/app/assets" className={linkClass}>🏭 Activos</NavLink>
          <NavLink to="#" className={linkClass}>🔧 Repuestos</NavLink>
          <NavLink to="#" className={linkClass}>📋 Órdenes</NavLink>
        </nav>
        <div className="mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-400 hover:bg-red-900/50">
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}