import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@manttoflow.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulamos el login para que puedas entrar al Dashboard rápido
    setTimeout(() => {
      setToken('dummy_token_dev');
      navigate('/app');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-sky-500/20">
        <h1 className="text-3xl font-bold text-sky-400 mb-2 text-center">ManttoFlow</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">Facility Management System</p>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Correo Electrónico</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-sky-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-sky-600 text-white font-bold py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50">
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}