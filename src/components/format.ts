import type { AppointmentStatus } from '../types';

export const statusLabels: Record<AppointmentStatus, string> = { APPROVED: 'Aprobada', REQUESTED: 'Pendiente de aprobación', REJECTED: 'Rechazada', CANCELLED: 'Cancelada', COMPLETED: 'Completada', NO_SHOW: 'No asistió' };
export const sourceLabels: Record<string, string> = { USER: 'Paciente', ADMIN: 'Administración', PROFESSIONAL: 'Profesional', SYSTEM: 'Sistema' };
export const dateTime = (value: string) => new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date(value));
export const bogotaToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
export const bogotaNow = () => { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()); const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '00'; return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}`; };

/** Monday–Sunday week containing the given YYYY-MM-DD date. */
export function weekRange(date: string): { from: string; to: string } {
  const [year, month, day] = date.split('-').map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, day));
  const offset = (anchor.getUTCDay() + 6) % 7;
  const monday = new Date(anchor); monday.setUTCDate(anchor.getUTCDate() - offset);
  const sunday = new Date(monday); sunday.setUTCDate(monday.getUTCDate() + 6);
  return { from: monday.toISOString().slice(0, 10), to: sunday.toISOString().slice(0, 10) };
}
