import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@manttoflow.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Error al iniciar sesión');
      }
      
      localStorage.setItem('manttoflow_token', data.access_token);
      setToken(data.access_token);
      navigate('/app');
      
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      
      {/* === FONDO DE FÁBRICA DIFUMINADO === */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop')" }}
      ></div>
      
      {/* Capa oscura difuminada para dar contraste */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/60 backdrop-blur-md"></div>
      
      {/* Marca de agua gigante con el nombre de la empresa */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <h1 className="text-[18vw] font-extrabold text-white/5 tracking-tighter select-none">
          ManttoFlow
        </h1>
      </div>

      {/* Tarjeta de Login translúcida (Glassmorphism) */}
      <div className="relative z-10 max-w-md w-full bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">ManttoFlow</h1>
          <p className="text-sky-300 mt-2 text-sm font-medium tracking-wide">FACILITY MANAGEMENT SYSTEM</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-sky-100 mb-2">Correo Electrónico</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none backdrop-blur-sm"
              placeholder="admin@manttoflow.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-sky-100 mb-2">Contraseña</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none backdrop-blur-sm"
              placeholder="********"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-sky-500/30 hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}