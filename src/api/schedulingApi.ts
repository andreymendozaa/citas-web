import { getAccessToken } from '../auth/authApi';
import type { Appointment, AvailabilityBlock, AvailableProfessional, CatalogItem, CreatedProfessional, PendingAppointment, Professional, ReservationResult, Specialty } from '../types';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');
export class SchedulingApiError extends Error { constructor(public readonly status: number, message: string) { super(message); this.name = 'SchedulingApiError'; } }
function query(params: Record<string, string | undefined>): string { const entries = Object.entries(params).filter(([, value]) => value) as [string, string][]; return entries.length ? `?${new URLSearchParams(entries).toString()}` : ''; }
function normalizedId<T extends { id: string | number }>(item: T): T { return { ...item, id: String(item.id) }; }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken(); let response: Response;
  try { response = await fetch(`${API_URL}/api/v1${path}`, { ...init, credentials: 'include', headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } }); }
  catch { throw new SchedulingApiError(0, 'No fue posible conectar con el servicio de citas.'); }
  if (!response.ok) { const problem = await response.json().catch(() => null) as { detail?: string } | null; throw new SchedulingApiError(response.status, problem?.detail ?? 'No fue posible completar la solicitud.'); }
  if (response.status === 204) return undefined as T; return response.json() as Promise<T>;
}
export const catalogsApi = { locations: () => request<CatalogItem[]>('/catalogs/locations').then((items) => items.map(normalizedId)), insurancePlans: () => request<CatalogItem[]>('/catalogs/plans').then((items) => items.map(normalizedId)), specialties: () => request<Specialty[]>('/specialties').then((items) => items.map(normalizedId)) };
type AvailableResponse = { professionalId: string | number; professionalName: string; startAt: string; endAt: string };
export const appointmentsApi = {
  availability: (filters: { locationId: string; specialtyId: string; professionalId?: string; date: string }) => request<AvailableResponse[]>(`/availability${query(filters)}`).then((rows) => {
    const professionals = new Map<string, AvailableProfessional>();
    rows.forEach((row) => { const id = String(row.professionalId); const professional = professionals.get(id) ?? { id, name: row.professionalName, slots: [] }; professional.slots.push({ startAt: row.startAt, endAt: row.endAt }); professionals.set(id, professional); });
    return [...professionals.values()];
  }),
  create: (input: { professionalId: string; locationId: string; specialtyId: string; date: string; startTime: string; reason?: string }) => request<ReservationResult>('/appointments', { method: 'POST', body: JSON.stringify(input) }).then(normalizedId),
  mine: (filters: { status?: string; date?: string } = {}) => request<Appointment[]>(`/appointments/mine${query(filters)}`).then((items) => items.map(normalizedId)),
  cancel: (id: string) => request<Appointment>(`/appointments/${id}/cancel`, { method: 'POST' }).then(normalizedId),
  reschedule: (id: string, input: { locationId: string; date: string; startTime: string }) => request<{ id: string; status: string }>(`/appointments/${id}/reschedule`, { method: 'POST', body: JSON.stringify(input) }).then(normalizedId),
  pendingSpecialized: () => request<PendingAppointment[]>('/admin/appointments/pending-specialized').then((items) => items.map(normalizedId)),
  decide: (id: string, decision: 'APPROVE' | 'REJECT', reason?: string) => request<Appointment>(`/admin/appointments/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision, reason }) }),
};
export const adminApi = {
  specialties: () => request<Specialty[]>('/admin/specialties'), createSpecialty: (input: { code: string; name: string; durationMinutes: 30 | 60; general: boolean }) => request<Specialty>('/admin/specialties', { method: 'POST', body: JSON.stringify(input) }),
  updateSpecialty: (id: string, input: Partial<{ name: string; durationMinutes: 30 | 60; active: boolean }>) => request<Specialty>(`/admin/specialties/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  professionals: () => request<Professional[]>('/admin/professionals').then((items) => items.map((item) => ({ ...normalizedId(item), specialtyIds: item.specialtyIds.map(String), locationIds: item.locationIds.map(String) }))),
  createProfessional: (input: { firstName: string; lastName: string; documentType: string; documentNumber: string; email: string; phone: string; temporaryPassword: string; professionalCode: string; licenseNumber: string }) => request<CreatedProfessional>('/admin/professionals', { method: 'POST', body: JSON.stringify(input) }).then(normalizedId),
  assignSpecialties: (id: string, specialtyIds: string[], primarySpecialtyId: string) => request<void>(`/admin/professionals/${id}/specialties`, { method: 'PUT', body: JSON.stringify({ specialtyIds, primarySpecialtyId }) }),
  assignLocations: (id: string, locationIds: string[]) => request<void>(`/admin/professionals/${id}/locations`, { method: 'PUT', body: JSON.stringify({ locationIds }) }), setActive: (id: string, active: boolean) => request<Professional>(`/admin/professionals/${id}/active`, { method: 'PATCH', body: JSON.stringify({ active }) }),
};
export const availabilityApi = {
  listMine: (date?: string, locationId?: string) => request<AvailabilityBlock[]>(`/professional/availability-blocks${query({ date, locationId })}`).then((items) => items.map((item) => ({ ...normalizedId(item), locationId: String(item.locationId) }))),
  create: (input: { locationId: string; date: string; startTime: string; endTime: string }) => request<AvailabilityBlock>('/professional/availability-blocks', { method: 'POST', body: JSON.stringify(input) }).then((item) => ({ ...normalizedId(item), locationId: String(item.locationId) })),
  update: (id: string, input: Partial<{ locationId: string; date: string; startTime: string; endTime: string }>) => request<AvailabilityBlock>(`/professional/availability-blocks/${id}`, { method: 'PATCH', body: JSON.stringify(input) }).then((item) => ({ ...normalizedId(item), locationId: String(item.locationId) })), remove: (id: string) => request<void>(`/professional/availability-blocks/${id}`, { method: 'DELETE' }),
};
export function schedulingErrorMessage(error: unknown): string { if (!(error instanceof SchedulingApiError)) return 'Ocurrió un error inesperado.'; if (error.status === 401) return 'Tu sesión venció. Inicia sesión nuevamente.'; if (error.status === 403) return 'No tienes permiso para realizar esta acción.'; if (error.status === 404) return 'El recurso solicitado no está disponible.'; if (error.status === 409) return 'El horario dejó de estar disponible. Selecciona otro horario.'; if (error.status === 400) return 'Revisa los datos ingresados.'; return error.message; }
