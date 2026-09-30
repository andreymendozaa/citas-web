export type ScreenType = 'login' | 'register' | 'dashboard' | 'forgot-password' | 'reset-password';
export type UserRole = 'USER' | 'ADMIN' | 'PROFESSIONAL';

export interface User { id: string; name: string; email: string; phone?: string; roles?: string[]; }
export interface CatalogItem { id: string; name: string; code?: string; active?: boolean; }
export interface Specialty extends CatalogItem { durationMinutes: 30 | 60; appointmentType?: 'GENERAL' | 'SPECIALIZED'; }
export interface Professional extends CatalogItem { professionalCode: string; licenseNumber: string; active: boolean; specialtyIds: string[]; locationIds: string[]; }
export interface CreatedProfessional { id: string; }
export interface AvailabilitySlot { startAt: string; endAt?: string; }
export interface AvailableProfessional { id: string; name: string; slots: AvailabilitySlot[]; }
export type AppointmentStatus = 'APPROVED' | 'REQUESTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export interface Appointment { id: string; status: AppointmentStatus; professionalId?: string; specialtyId?: string; locationId?: string; professionalName: string; specialtyName: string; locationName: string; startAt: string; durationMinutes: number; rejectionReason?: string; rescheduleRequestId?: string; rescheduleStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'; rescheduleRequestedStartAt?: string; rescheduleDecisionReason?: string; }
export interface ReservationResult { id: string; status: Extract<AppointmentStatus, 'APPROVED' | 'REQUESTED'>; startAt: string; endAt: string; }
export interface PendingAppointment { id: string; patientName: string; professionalName: string; specialtyName: string; locationName: string; startAt: string; endAt: string; durationMinutes: number; }
export interface AvailabilityBlock { id: string; locationId: string; date: string; start: string; end: string; }
export interface Profile { id: string; firstName: string; lastName: string; documentType: string; documentNumber: string; email: string; phone: string; roles: string[]; }
export interface Eps { id: string; code: string; name: string; active: boolean; }
export interface EpsPlan { id: string; epsId: string; regimeId: string; code: string; name: string; active: boolean; }
export interface ProfessionalAppointment { id: string; patientName: string; specialtyId: string; specialtyName: string; locationId: string; locationName: string; startAt: string; endAt: string; durationMinutes: number; reason?: string | null; }
export type InboxType = 'SPECIALIZED' | 'RESCHEDULE';
export interface InboxItem { type: InboxType; id: string; appointmentId: string; patientName: string; professionalName: string; specialtyName: string; locationId: string; locationName: string; startAt: string; endAt: string; }
export interface HistoryEntry { id: string; status: AppointmentStatus; changedByUserId?: string | null; changeSource: string; reason?: string | null; changedAt: string; }
