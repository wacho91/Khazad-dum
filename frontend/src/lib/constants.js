export const CRITICALITY_STYLES = {
  low: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
  medium: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  high: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export const CRITICALITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

export const ASSET_STATUS_STYLES = {
  operational: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  maintenance: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  down: 'text-red-400 bg-red-500/10 border-red-500/30',
  retired: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
};

export const ASSET_STATUS_LABELS = {
  operational: 'Operativo',
  maintenance: 'Mantenimiento',
  down: 'Fuera de servicio',
  retired: 'Retirado',
};

export const WO_STATUS_STYLES = {
  draft: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
  open: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  assigned: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  in_progress: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  blocked: 'text-red-400 bg-red-500/10 border-red-500/30',
  completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  cancelled: 'text-slate-500 bg-slate-500/5 border-slate-500/20',
};

export const WO_STATUS_LABELS = {
  draft: 'Borrador',
  open: 'Abierta',
  assigned: 'Asignada',
  in_progress: 'En progreso',
  blocked: 'Bloqueada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export const PRIORITY_STYLES = {
  low: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
  medium: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  high: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  urgent: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export const PRIORITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export const WO_TYPE_LABELS = {
  preventive: 'Preventiva',
  corrective: 'Correctiva',
  predictive: 'Predictiva',
  inspection: 'Inspección',
};

export const MOVEMENT_TYPE_LABELS = {
  in: 'Entrada',
  out: 'Salida',
  adjustment: 'Ajuste',
  return: 'Devolución',
};

export const COST_CATEGORY_LABELS = {
  repair: 'Reparación',
  parts: 'Repuestos',
  labor: 'Mano de obra',
  energy: 'Energía',
  other: 'Otros',
};
