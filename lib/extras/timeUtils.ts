export function parseTimeToDecimal(time: string): number {
  if (!time || !time.includes(':')) return 0;
  const [hh, mm] = time.split(':').map(Number);
  if (isNaN(hh) || isNaN(mm)) return 0;
  return hh + mm / 60;
}

export function formatDecimalToHours(decimal: number): string {
  const totalMinutes = Math.round(Math.abs(decimal) * 60);
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  const sign = decimal < 0 ? '-' : '';
  return `${sign}${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function calculateDuration(start: string, end: string): number {
  const startDec = parseTimeToDecimal(start);
  const endDec = parseTimeToDecimal(end);

  if (startDec === 0 && endDec === 0) return 0;

  let diff = endDec - startDec;
  if (diff < 0) diff += 24;

  return diff;
}

export function getWeekStartDate(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEndDate(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 5);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateArg(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export const DAY_LABELS: Record<string, string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mié',
  thursday: 'Jue',
  friday: 'Vie',
  saturday: 'Sáb',
  sunday: 'Dom',
};

export const DAY_LABELS_FULL: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};
