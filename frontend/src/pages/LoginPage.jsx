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
      // Hacemos la petición real a tu backend en FastAPI
      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      // Si el backend responde con error (ej: contraseña incorrecta)
      if (!res.ok) {
        throw new Error(data.detail || 'Error al iniciar sesión');
      }
      
      // Guardamos el token real que nos dio FastAPI y entramos al sistema
      setToken(data.access_token);
      navigate('/app');
      
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-sky-500/20">
        <h1 className="text-3xl font-bold text-sky-400 mb-2 text-center">Khazad-Dum</h1>
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