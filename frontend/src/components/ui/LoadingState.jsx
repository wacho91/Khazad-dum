import Logo from './Logo';

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      <div className="animate-pulse">
        {/* Usamos variant="dark" porque el fondo de la tarjeta es blanco */}
        <Logo variant="dark" />
      </div>
      <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin"></div>
      <p className="text-slate-400 text-sm font-medium">Cargando datos del servidor...</p>
    </div>
  );
}