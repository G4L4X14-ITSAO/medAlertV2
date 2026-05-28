export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (time: string) => {
  return time.slice(0, 5);
};

export const getTriageColor = (triage: string) => {
  switch (triage) {
    case 'ROJO':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'AMARILLO':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-800';
    case 'PAUSED':
      return 'bg-slate-100 text-slate-700';
    case 'PENDING_APPROVAL':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-rose-100 text-rose-800';
  }
};
