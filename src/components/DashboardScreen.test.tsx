import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adminApi, appointmentsApi, availabilityApi, catalogsApi, professionalApi, profileApi } = vi.hoisted(() => ({
  adminApi: { specialties: vi.fn(), professionals: vi.fn(), createSpecialty: vi.fn(), updateSpecialty: vi.fn(), createProfessional: vi.fn(), assignSpecialties: vi.fn(), assignLocations: vi.fn(), setActive: vi.fn() },
  appointmentsApi: { mine: vi.fn(), inbox: vi.fn(), decide: vi.fn(), decideReschedule: vi.fn(), history: vi.fn(), cancel: vi.fn(), reschedule: vi.fn(), availability: vi.fn() },
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

  const futureApproved = { id: '21', status: 'APPROVED', professionalId: '7', specialtyId: '2', locationId: '1', professionalName: 'Dr. Laboratorio', specialtyName: 'Medicina General', locationName: 'HIC', startAt: '2099-01-01T08:00:00', durationMinutes: 30 };
  const userProps = { user: { id: '3', name: 'Usuario', email: 'user@example.test', roles: ['USER'] }, onOpenBooking: vi.fn(), onLogout: vi.fn() };

  it('HU-026 cancela una cita propia tras confirmar y recarga la lista', async () => {
    const user = userEvent.setup(); const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    appointmentsApi.mine.mockResolvedValue([futureApproved]); appointmentsApi.cancel.mockResolvedValue({ id: '21', status: 'CANCELLED' });
    render(<DashboardScreen {...userProps} />);

    await user.click(await screen.findByRole('button', { name: 'Cancelar cita' }));

    expect(confirm).toHaveBeenCalled();
    expect(appointmentsApi.cancel).toHaveBeenCalledWith('21');
    await vi.waitFor(() => expect(appointmentsApi.mine).toHaveBeenCalledTimes(2));
    confirm.mockRestore();
  });

  it('HU-026 no cancela si el usuario no confirma', async () => {
    const user = userEvent.setup(); const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    appointmentsApi.mine.mockResolvedValue([futureApproved]);
    render(<DashboardScreen {...userProps} />);

    await user.click(await screen.findByRole('button', { name: 'Cancelar cita' }));

    expect(appointmentsApi.cancel).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('HU-027 solicita reprogramación con el mismo profesional y la nueva franja', async () => {
    const user = userEvent.setup();
    appointmentsApi.mine.mockResolvedValue([futureApproved]);
    appointmentsApi.availability.mockResolvedValue([{ id: '7', name: 'Dr. Laboratorio', slots: [{ startAt: '2099-01-02T10:00:00', endAt: '2099-01-02T10:30:00' }] }]);
    appointmentsApi.reschedule.mockResolvedValue({ id: '5', status: 'PENDING' });
    render(<DashboardScreen {...userProps} />);

    await user.click(await screen.findByRole('button', { name: 'Reprogramar' }));
    await user.click(screen.getByRole('button', { name: 'Consultar horarios' }));
    expect(appointmentsApi.availability).toHaveBeenCalledWith(expect.objectContaining({ locationId: '1', specialtyId: '2', professionalId: '7' }));
    await user.click(await screen.findByRole('button', { name: /10:00/ }));

    expect(appointmentsApi.reschedule).toHaveBeenCalledWith('21', { locationId: '1', date: '2099-01-02', startTime: '10:00' });
    await vi.waitFor(() => expect(appointmentsApi.mine).toHaveBeenCalledTimes(2));
  });

  it('HU-027 bloquea una segunda reprogramación mientras hay una pendiente', async () => {
    appointmentsApi.mine.mockResolvedValue([{ ...futureApproved, rescheduleStatus: 'PENDING' }]);
    render(<DashboardScreen {...userProps} />);

    expect(await screen.findByRole('button', { name: 'Reprogramación pendiente' })).toBeDisabled();
  });

  it('muestra solo las pestañas del rol autenticado', () => {
    render(<DashboardScreen user={{ id: '3', name: 'Usuario', email: 'user@example.test', roles: ['USER'] }} onOpenBooking={vi.fn()} onLogout={vi.fn()} />);

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Mis citas', 'Mi perfil']);
  });
});
