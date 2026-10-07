// Currency Formatter (R$)
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Brazilian Phone Mask: (11) 98765-4321 or (11) 3456-7890
export function maskPhone(value: string): string {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return cleaned.substring(0, 11).replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

// CPF Mask: 123.456.789-00
export function maskCPF(value: string): string {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '').substring(0, 11);
  return cleaned
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

// Format Plate (Old ABC-1234 or Mercosul ABC1D23)
export function formatPlate(plate: string): string {
  if (!plate) return '';
  const clean = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length === 7) {
    // Check if old format e.g. ABC1234
    if (/^[A-Z]{3}\d{4}$/.test(clean)) {
      return `${clean.substring(0, 3)}-${clean.substring(3)}`;
    }
  }
  return clean;
}

// Date & Time formatting
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Calculate elapsed time in shop e.g., "2 dias", "4 horas"
export function formatElapsedTime(startDateStr: string): string {
  if (!startDateStr) return '-';
  const start = new Date(startDateStr);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  if (diffMs < 0) return 'Recém entrado';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${mins} min`;
  }
  if (diffHours < 24) {
    return `${diffHours}h`;
  }
  const days = Math.floor(diffHours / 24);
  const remHours = diffHours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

// Helper badge styles for OS Status
export function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case 'Aguardando avaliação':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'Aguardando aprovação':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'Aprovado':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Em execução':
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse';
    case 'Aguardando peça':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'Concluído':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'Entregue':
      return 'bg-slate-700/60 text-slate-300 border-slate-600/40';
    case 'Cancelado':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}
