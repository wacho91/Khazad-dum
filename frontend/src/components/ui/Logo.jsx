export default function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icono: Engranaje hexagonal (Representa industria y mantenimiento) */}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2L29 9.5V22.5L16 30L3 22.5V9.5L16 2Z" fill="url(#paint0_linear_kd)" />
        <path d="M16 8L22 11.5V18.5L16 22L10 18.5V11.5L16 8Z" fill="#0f172a" />
        <circle cx="16" cy="15" r="3" fill="#38bdf8" />
        <defs>
          <linearGradient id="paint0_linear_kd" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-extrabold text-xl text-slate-100 tracking-tight">Khazad-dum</span>
        <span className="text-[10px] font-medium text-sky-400 tracking-widest uppercase">Facility Mgmt</span>
      </div>
    </div>
  );
}