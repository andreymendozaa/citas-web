import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adminApi, appointmentsApi, availabilityApi, catalogsApi, professionalApi, profileApi } = vi.hoisted(() => ({
  adminApi: { specialties: vi.fn(), professionals: vi.fn(), createSpecialty: vi.fn(), updateSpecialty: vi.fn(), createProfessional: vi.fn(), assignSpecialties: vi.fn(), assignLocations: vi.fn(), setActive: vi.fn() },
  appointmentsApi: { mine: vi.fn(), inbox: vi.fn(), decide: vi.fn(), decideReschedule: vi.fn(), history: vi.fn() },
  availabilityApi: { listMine: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  catalogsApi: { locations: vi.fn() },
  professionalApi: { agenda: vi.fn(), close: vi.fn() },
  profileApi: { me: vi.fn(), updatePhone: vi.fn() },
}));

vi.mock('../api/schedulingApi', () => ({ adminApi, appointmentsApi, availabilityApi, catalogsApi, professionalApi, profileApi, SchedulingApiError: class extends Error {}, schedulingErrorMessage: () => 'Error controlado' }));

import { DashboardScreen } from './DashboardScreen';

describe('DashboardScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    catalogsApi.locations.mockResolvedValue([{ id: '1', name: 'Sede Norte' }]);
    adminApi.specialties.mockResolvedValue([]); adminApi.professionals.mockResolvedValue([]); appointmentsApi.mine.mockResolvedValue([]); appointmentsApi.inbox.mockResolvedValue([]);
    availabilityApi.listMine.mockResolvedValue([]); professionalApi.agenda.mockResolvedValue([]);
  });

  it('muestra profesionales ADMIN sin exponer sus datos de acceso', async () => {
    const user = userEvent.setup();
    adminApi.professionals.mockResolvedValue([{ id: '7', name: 'Dra. Prueba', professionalCode: 'MED-7', licenseNumber: 'LIC-7', active: true, specialtyIds: ['2'], locationIds: ['1'] }]);
    render(<DashboardScreen user={{ id: '1', name: 'Admin', email: 'admin@example.test', roles: ['ADMIN'] }} onOpenBooking={vi.fn()} onLogout={vi.fn()} />);

    expect(await screen.findByText('No hay solicitudes pendientes con estos filtros.')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Oferta' }));

    expect(await screen.findByText('MED-7', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(/@example\.test/)).not.toBeInTheDocument();
  });

  it('carga un bloque propio en el formulario de edición profesional', async () => {
    const user = userEvent.setup();
    availabilityApi.listMine.mockResolvedValue([{ id: '4', locationId: '1', date: '2026-10-10', start: '08:00:00', end: '09:00:00' }]);
    render(<DashboardScreen user={{ id: '2', name: 'Profesional', email: 'professional@example.test', roles: ['PROFESSIONAL'] }} onOpenBooking={vi.fn()} onLogout={vi.fn()} />);

    await user.click(screen.getByRole('tab', { name: 'Disponibilidad' }));
    await user.click(await screen.findByRole('button', { name: 'Editar' }));

    expect(screen.getByRole('heading', { name: 'Editar bloque de disponibilidad' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-10-10T08:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-10-10T09:00')).toBeInTheDocument();
  });

  it('muestra las citas propias y recarga al cambiar la versión de agenda', async () => {
    appointmentsApi.mine.mockResolvedValue([{ id: '8', status: 'REJECTED', professionalName: 'Dr. Laboratorio', specialtyName: 'Cardiología Laboratorio', locationName: 'ICV', startAt: '2026-10-06T08:00:00', durationMinutes: 60, rejectionReason: 'Motivo sintético' }]);
    const props = { user: { id: '3', name: 'Usuario', email: 'user@example.test', roles: ['USER'] }, onOpenBooking: vi.fn(), onLogout: vi.fn() };
    const { rerender } = render(<DashboardScreen {...props} appointmentsVersion={0} />);

    expect(await screen.findByText('Cardiología Laboratorio')).toBeInTheDocument();
    expect(screen.getByText(/Motivo de rechazo: Motivo sintético/)).toBeInTheDocument();
    expect(appointmentsApi.mine).toHaveBeenLastCalledWith({ status: undefined, date: undefined });

    rerender(<DashboardScreen {...props} appointmentsVersion={1} />);
    await vi.waitFor(() => expect(appointmentsApi.mine).toHaveBeenCalledTimes(2));
  });

  it('muestra solo las pestañas del rol autenticado', () => {
    render(<DashboardScreen user={{ id: '3', name: 'Usuario', email: 'user@example.test', roles: ['USER'] }} onOpenBooking={vi.fn()} onLogout={vi.fn()} />);

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Mis citas', 'Mi perfil']);
  });
});
