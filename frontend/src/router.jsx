import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DasboardPage';
import AssetsPage from './pages/AssetsPage'; // <-- NUEVA IMPORTACIÓN

export default function AppRouter() {
  return (
    <Routes>
      {/* Ruta pública para el login */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rutas privadas que usan el menú lateral (AppLayout) */}
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="assets" element={<AssetsPage />} /> {/* <-- NUEVA RUTA */}
      </Route>
      
      {/* Si entra a cualquier otra ruta, lo mandamos al login */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}