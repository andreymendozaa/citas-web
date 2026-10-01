import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adminApi, appointmentsApi, catalogsApi, professionalApi, profileApi, auth } = vi.hoisted(() => ({
  adminApi: { specialties: vi.fn(), professionals: vi.fn(), eps: vi.fn(), createEps: vi.fn(), updateEps: vi.fn(), epsPlans: vi.fn(), createEpsPlan: vi.fn(), updateEpsPlan: vi.fn() },
  appointmentsApi: { inbox: vi.fn(), decide: vi.fn(), decideReschedule: vi.fn(), history: vi.fn() },
  catalogsApi: { locations: vi.fn(), regimes: vi.fn(), selectablePlans: vi.fn(), eps: vi.fn() },
  professionalApi: { agenda: vi.fn(), close: vi.fn() },
  profileApi: { me: vi.fn(), updatePhone: vi.fn(), affiliation: vi.fn(), changeAffiliation: vi.fn() },
  auth: { requestPasswordRecovery: vi.fn(), resetPassword: vi.fn(), updateCachedUser: vi.fn(), authErrorMessage: () => 'Error de acceso', resetErrorMessage: () => 'Código inválido' },
}));

vi.mock('../api/schedulingApi', async (original) => ({ ...(await original<typeof import('../api/schedulingApi')>()), adminApi, appointmentsApi, catalogsApi, professionalApi, profileApi }));
vi.mock('../auth/authApi', () => ({ ...auth, getAccessToken: () => null }));

import { SchedulingApiError } from '../api/schedulingApi';
import { AdminInboxTab } from './AdminInboxTab';
import { AppointmentHistory } from './AppointmentHistory';
import { InsuranceAdminTab } from './InsuranceAdminTab';
import { ForgotPasswordScreen, ResetPasswordScreen } from './PasswordRecoveryScreens';
import { ProfessionalAgendaTab } from './ProfessionalAgendaTab';
import { ProfileTab } from './ProfileTab';
import { weekRange } from './format';

const agendaItem = (id: string, endAt: string) => ({ id, patientName: `Paciente ${id}`, specialtyId: '2', specialtyName: 'Medicina General', locationId: '1', locationName: 'HIC', startAt: endAt.replace(/T\d\d/, 'T07'), endAt, durationMinutes: 30, reason: null });

describe('pantallas S4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    catalogsApi.locations.mockResolvedValue([{ id: '1', name: 'HIC' }]); catalogsApi.regimes.mockResolvedValue([{ id: '3', name: 'Contributivo' }]);
    adminApi.specialties.mockResolvedValue([]); adminApi.professionals.mockResolvedValue([]); adminApi.eps.mockResolvedValue([]); adminApi.epsPlans.mockResolvedValue([]);
    professionalApi.agenda.mockResolvedValue([]); appointmentsApi.inbox.mockResolvedValue([]);
    profileApi.affiliation.mockResolvedValue(null);
    catalogsApi.selectablePlans.mockResolvedValue([{ id: '11', name: 'Plan Contributivo', epsId: '5', regimeId: '3' }, { id: '12', name: 'Plan Subsidiado', epsId: '5', regimeId: '4' }]);
    catalogsApi.eps.mockResolvedValue([{ id: '5', name: 'EPS Sintética' }]);
    catalogsApi.regimes.mockResolvedValue([{ id: '3', name: 'Contributivo' }, { id: '4', name: 'Subsidiado' }]);
  });

  const baseProfile = { id: '3', firstName: 'Ana', lastName: 'Ruiz', documentType: 'CC', documentNumber: '900', email: 'ana@example.test', phone: '3001111111', roles: ['USER'] };

  it('HU-011 asocia un plan cuando el usuario no tiene afiliación', async () => {
    const user = userEvent.setup();
    profileApi.me.mockResolvedValue(baseProfile);
    profileApi.changeAffiliation.mockResolvedValue({ planId: '11', planCode: 'PC', planName: 'Plan Contributivo', epsId: '5', epsName: 'EPS Sintética', regimeId: '3', regimeName: 'Contributivo', membershipNumber: 'AUTO-3-11' });
    render(<ProfileTab />);

    expect(await screen.findByText(/No tienes una afiliación registrada/)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'EPS Sintética — Plan Contributivo (Contributivo)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar afiliación' })).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Plan de afiliación'), '11');
    await user.click(screen.getByRole('button', { name: 'Guardar afiliación' }));

    expect(profileApi.changeAffiliation).toHaveBeenCalledWith('11');
    expect(await screen.findByText('Afiliación actualizada.')).toBeInTheDocument();
    expect(screen.getByText('Plan Contributivo', { selector: 'dd' })).toBeInTheDocument();
  });

  it('HU-011 muestra la afiliación vigente y no permite guardar el mismo plan', async () => {
    const user = userEvent.setup();
    profileApi.me.mockResolvedValue(baseProfile);
    profileApi.affiliation.mockResolvedValue({ planId: '11', planCode: 'PC', planName: 'Plan Contributivo', epsId: '5', epsName: 'EPS Sintética', regimeId: '3', regimeName: 'Contributivo', membershipNumber: 'AUTO-3-11' });
    profileApi.changeAffiliation.mockRejectedValue(new SchedulingApiError(409, 'El plan ya es tu afiliación vigente'));
    render(<ProfileTab />);

    expect(await screen.findByText('EPS Sintética', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByLabelText('Plan de afiliación')).toHaveValue('11');
    expect(screen.getByRole('button', { name: 'Guardar afiliación' })).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Plan de afiliación'), '12');
    await user.click(screen.getByRole('button', { name: 'Guardar afiliación' }));
    expect(profileApi.changeAffiliation).toHaveBeenCalledWith('12');
    expect(await screen.findByRole('alert')).toHaveTextContent('Ese plan ya es tu afiliación vigente.');
  });

  it('HU-008 responde con un mensaje neutral exista o no la cuenta', async () => {
    const user = userEvent.setup(); auth.requestPasswordRecovery.mockResolvedValue(undefined);
    render(<ForgotPasswordScreen onNavigateLogin={vi.fn()} onNavigateReset={vi.fn()} />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'nadie@example.test');
    await user.click(screen.getByRole('button', { name: 'Enviar código' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Si el correo corresponde a una cuenta registrada');
    expect(auth.requestPasswordRecovery).toHaveBeenCalledWith('nadie@example.test');
  });

  it('HU-009 precarga el código, bloquea confirmaciones distintas y restablece', async () => {
    const user = userEvent.setup(); const onResetSuccess = vi.fn(); auth.resetPassword.mockResolvedValue(undefined);
    render(<ResetPasswordScreen initialToken="token-url" onNavigateLogin={vi.fn()} onResetSuccess={onResetSuccess} />);

    expect(screen.getByLabelText('Código de recuperación')).toHaveValue('token-url');
    await user.type(screen.getByLabelText('Nueva contraseña'), 'Nueva123*');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Otra123*');
    expect(screen.getByRole('button', { name: 'Restablecer contraseña' })).toBeDisabled();

    await user.clear(screen.getByLabelText('Confirmar contraseña'));
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Nueva123*');
    await user.click(screen.getByRole('button', { name: 'Restablecer contraseña' }));

    expect(auth.resetPassword).toHaveBeenCalledWith('token-url', 'Nueva123*', 'Nueva123*');
    expect(onResetSuccess).toHaveBeenCalled();
  });

  it('HU-010 muestra identidad en solo lectura y actualiza únicamente el teléfono', async () => {
    const user = userEvent.setup(); const profile = { id: '3', firstName: 'Ana', lastName: 'Ruiz', documentType: 'CC', documentNumber: '900', email: 'ana@example.test', phone: '3001111111', roles: ['USER'] };
    profileApi.me.mockResolvedValue(profile); profileApi.updatePhone.mockResolvedValue({ ...profile, phone: '3002222222' });
    render(<ProfileTab />);

    expect(await screen.findByText('Ana Ruiz')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('ana@example.test')).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText('Teléfono de contacto'));
    await user.type(screen.getByLabelText('Teléfono de contacto'), '3002222222');
    await user.click(screen.getByRole('button', { name: 'Guardar teléfono' }));

    expect(profileApi.updatePhone).toHaveBeenCalledWith('3002222222');
    expect(await screen.findByText('Teléfono actualizado.')).toBeInTheDocument();
  });

  it('HU-012 crea una EPS y la desactiva de forma lógica', async () => {
    const user = userEvent.setup();
    adminApi.eps.mockResolvedValueOnce([]).mockResolvedValue([{ id: '1', code: 'EPS-S', name: 'EPS Sintética', active: true }]);
    adminApi.createEps.mockResolvedValue({ id: '1' }); adminApi.updateEps.mockResolvedValue({});
    render(<InsuranceAdminTab />);

    await user.type(await screen.findByLabelText('Código EPS'), 'EPS-S');
    await user.type(screen.getByLabelText('Nombre EPS'), 'EPS Sintética');
    await user.click(screen.getByRole('button', { name: 'Crear EPS' }));
    expect(adminApi.createEps).toHaveBeenCalledWith({ code: 'EPS-S', name: 'EPS Sintética' });

    await user.click(await screen.findByRole('button', { name: 'Desactivar' }));
    expect(adminApi.updateEps).toHaveBeenCalledWith('1', { active: false });
  });

  it('HU-013 crea un plan dentro de la EPS seleccionada con su régimen', async () => {
    const user = userEvent.setup();
    adminApi.eps.mockResolvedValue([{ id: '1', code: 'EPS-S', name: 'EPS Sintética', active: true }]); adminApi.createEpsPlan.mockResolvedValue({});
    render(<InsuranceAdminTab />);

    await user.click(await screen.findByRole('button', { name: /EPS Sintética/ }));
    await waitFor(() => expect(adminApi.epsPlans).toHaveBeenLastCalledWith('1'));
    await user.selectOptions(screen.getByLabelText('Régimen'), '3');
    await user.type(screen.getByLabelText('Código plan'), 'PLAN-1');
    await user.type(screen.getByLabelText('Nombre plan'), 'Plan Básico');
    await user.click(screen.getByRole('button', { name: 'Crear plan' }));

    expect(adminApi.createEpsPlan).toHaveBeenCalledWith({ epsId: '1', regimeId: '3', code: 'PLAN-1', name: 'Plan Básico' });
  });

  it('HU-029 consulta la semana lunes-domingo y filtra por sede', async () => {
    const user = userEvent.setup();
    render(<ProfessionalAgendaTab />);

    fireEvent.change(screen.getByLabelText('Fecha de agenda'), { target: { value: '2026-10-01' } });
    await user.click(screen.getByRole('button', { name: 'Semana' }));
    await waitFor(() => expect(professionalApi.agenda).toHaveBeenLastCalledWith({ from: '2026-09-28', to: '2026-10-04', locationId: undefined }));
    await user.selectOptions(screen.getByLabelText('Sede de agenda'), '1');
    await waitFor(() => expect(professionalApi.agenda).toHaveBeenLastCalledWith({ from: '2026-09-28', to: '2026-10-04', locationId: '1' }));
    expect(weekRange('2026-10-04')).toEqual({ from: '2026-09-28', to: '2026-10-04' });
  });

  it('HU-030 permite cerrar solo citas finalizadas', async () => {
    const user = userEvent.setup();
    professionalApi.agenda.mockResolvedValue([agendaItem('1', '2020-01-01T08:30:00'), agendaItem('2', '2099-01-01T08:30:00')]); professionalApi.close.mockResolvedValue({});
    render(<ProfessionalAgendaTab />);

    expect(await screen.findByText('Paciente 1')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Atendida' })).toHaveLength(1);
    expect(screen.getByText('Podrás cerrar la atención cuando finalice el horario.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Atendida' }));

    expect(professionalApi.close).toHaveBeenCalledWith('1', 'COMPLETED', '');
    expect(await screen.findByText('Atención registrada como completada.')).toBeInTheDocument();
  });

  it('HU-031 enruta cada decisión al endpoint de su tipo y exige motivo al rechazar', async () => {
    const user = userEvent.setup(); const base = { patientName: 'P', professionalName: 'Dr', specialtyName: 'Cardiología', locationId: '1', locationName: 'HIC', startAt: '2026-10-01T08:00:00', endAt: '2026-10-01T09:00:00' };
    appointmentsApi.inbox.mockResolvedValue([{ ...base, type: 'SPECIALIZED', id: '4', appointmentId: '4' }, { ...base, type: 'RESCHEDULE', id: '9', appointmentId: '5' }]);
    appointmentsApi.decide.mockResolvedValue({}); appointmentsApi.decideReschedule.mockResolvedValue({});
    render(<AdminInboxTab />);

    expect(await screen.findByText('Especializada')).toBeInTheDocument();
    const [approveSpecialized] = screen.getAllByRole('button', { name: 'Aprobar' });
    await user.click(approveSpecialized);
    expect(appointmentsApi.decide).toHaveBeenCalledWith('4', 'APPROVE', undefined);

    await user.click(screen.getAllByRole('button', { name: 'Rechazar' })[1]);
    expect(await screen.findByText('El rechazo requiere un motivo.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Motivo Reprogramación 9'), 'Sin cupo');
    await user.click(screen.getAllByRole('button', { name: 'Rechazar' })[1]);
    expect(appointmentsApi.decideReschedule).toHaveBeenCalledWith('9', 'REJECT', 'Sin cupo');
  });

  it('HU-032 muestra el historial en solo lectura y oculta lo que está fuera de alcance', async () => {
    const user = userEvent.setup();
    appointmentsApi.history.mockResolvedValueOnce([{ id: '1', status: 'REQUESTED', changeSource: 'USER', changedAt: '2026-09-29T10:00:00' }, { id: '2', status: 'REJECTED', changeSource: 'ADMIN', reason: 'Sin cupo', changedAt: '2026-09-29T11:00:00' }])
      .mockRejectedValueOnce(new SchedulingApiError(404, 'not found'));
    render(<><AppointmentHistory appointmentId="4" /><AppointmentHistory appointmentId="99" /></>);

    const [first, second] = screen.getAllByRole('button', { name: 'Ver historial' });
    await user.click(first);
    expect(await screen.findByText('Rechazada')).toBeInTheDocument();
    expect(screen.getByText('Motivo: Sin cupo')).toBeInTheDocument();
    expect(screen.getByText(/Administración/)).toBeInTheDocument();

    await user.click(second);
    expect(await screen.findByText('Historial no disponible para esta cita.')).toBeInTheDocument();
  });
});
