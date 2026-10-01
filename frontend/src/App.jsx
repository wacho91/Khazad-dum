import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública para el login */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rutas privadas que usan el menú lateral (AppLayout) */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          {/* Aquí iremos agregando las demás rutas como Assets, WorkOrders, etc. */}
        </Route>
        
        {/* Si entra a cualquier otra ruta, lo mandamos al login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}