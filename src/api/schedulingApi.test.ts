import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../auth/authApi', () => ({ getAccessToken: () => 'test-access-token' }));

function response(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('schedulingApi', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('sends a reservation with the access token and API contract payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ id: '17', status: 'APPROVED', startAt: '2026-10-01T08:00:00', endAt: '2026-10-01T08:30:00' }, 201));
    vi.stubGlobal('fetch', fetchMock);
    const { appointmentsApi } = await import('./schedulingApi');

    await appointmentsApi.create({ professionalId: '2', locationId: '1', specialtyId: '3', date: '2026-10-01', startTime: '08:00', reason: 'Control' });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/v1/appointments', expect.objectContaining({
      method: 'POST', credentials: 'include', headers: expect.objectContaining({ Authorization: 'Bearer test-access-token' }),
    }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({ professionalId: '2', startTime: '08:00' });
  });

  it('lists only the authenticated user appointments with optional filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response([{ id: 17, status: 'APPROVED', professionalName: 'Dra. Ejemplo', specialtyName: 'Medicina General', locationName: 'HIC', startAt: '2026-10-01T08:00:00', durationMinutes: 30 }]));
    vi.stubGlobal('fetch', fetchMock);
    const { appointmentsApi } = await import('./schedulingApi');

    await expect(appointmentsApi.mine({ status: 'APPROVED', date: '2026-10-01' })).resolves.toMatchObject([{ id: '17', status: 'APPROVED' }]);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/v1/appointments/mine?status=APPROVED&date=2026-10-01', expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-access-token' }) }));
  });

  it('maps authorization and stale-slot errors to actionable messages', async () => {
    const { SchedulingApiError, schedulingErrorMessage } = await import('./schedulingApi');

    expect(schedulingErrorMessage(new SchedulingApiError(403, 'forbidden'))).toContain('permiso');
    expect(schedulingErrorMessage(new SchedulingApiError(409, 'occupied'))).toContain('disponible');
  });

  it('sends availability blocks using the backend date and time contract', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ id: '4', locationId: '1', date: '2026-10-01', start: '08:00:00', end: '09:00:00' }, 201));
    vi.stubGlobal('fetch', fetchMock);
    const { availabilityApi } = await import('./schedulingApi');

    await availabilityApi.create({ locationId: '1', date: '2026-10-01', startTime: '08:00', endTime: '09:00' });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({ locationId: '1', date: '2026-10-01', startTime: '08:00', endTime: '09:00' });
  });

  it('patches only the phone on the own profile', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ id: 3, firstName: 'Ana', lastName: 'Ruiz', documentType: 'CC', documentNumber: '1', email: 'ana@example.test', phone: '3009999999', roles: ['USER'] }));
    vi.stubGlobal('fetch', fetchMock);
    const { profileApi } = await import('./schedulingApi');

    await expect(profileApi.updatePhone('3009999999')).resolves.toMatchObject({ id: '3', phone: '3009999999' });
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/v1/users/me');
    expect(fetchMock.mock.calls[0][1].method).toBe('PATCH');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({ phone: '3009999999' });
  });

  it('reads a missing affiliation as null and changes it with only the plan id', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(response({ planId: 11, planCode: 'PC', planName: 'Plan', epsId: 5, epsName: 'EPS', regimeId: 3, regimeName: 'Contributivo', membershipNumber: 'AUTO-3-11' }));
    vi.stubGlobal('fetch', fetchMock);
    const { profileApi } = await import('./schedulingApi');

    await expect(profileApi.affiliation()).resolves.toBeNull();
    await expect(profileApi.changeAffiliation('11')).resolves.toMatchObject({ planId: '11', epsId: '5', regimeId: '3' });
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:8080/api/v1/users/me/affiliation');
    expect(fetchMock.mock.calls[1][1].method).toBe('PUT');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({ planId: '11' });
  });

  it('queries the professional agenda and closes with the closure contract', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response([{ id: 5, patientName: 'Paciente', specialtyId: 2, specialtyName: 'Medicina', locationId: 1, locationName: 'HIC', startAt: '2026-10-01T08:00:00', endAt: '2026-10-01T08:30:00', durationMinutes: 30, reason: null }]))
      .mockResolvedValueOnce(response({ id: 5, status: 'COMPLETED' }));
    vi.stubGlobal('fetch', fetchMock);
    const { professionalApi } = await import('./schedulingApi');

    await expect(professionalApi.agenda({ from: '2026-09-28', to: '2026-10-04', locationId: '1' })).resolves.toMatchObject([{ id: '5', locationId: '1', specialtyId: '2' }]);
    await professionalApi.close('5', 'NO_SHOW', '');
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/v1/professional/appointments?from=2026-09-28&to=2026-10-04&locationId=1');
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:8080/api/v1/professional/appointments/5/closure');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({ result: 'NO_SHOW' });
  });

  it('reads the unified inbox, reschedule decisions and history', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response([{ type: 'RESCHEDULE', id: 9, appointmentId: 4, patientName: 'P', professionalName: 'Dr', specialtyName: 'S', locationId: 1, locationName: 'L', startAt: '2026-10-01T08:00:00', endAt: '2026-10-01T08:30:00' }]))
      .mockResolvedValueOnce(response({ id: 9, status: 'REJECTED' }))
      .mockResolvedValueOnce(response([{ id: 1, status: 'APPROVED', changedByUserId: null, changeSource: 'SYSTEM', reason: null, changedAt: '2026-09-29T10:00:00' }]));
    vi.stubGlobal('fetch', fetchMock);
    const { appointmentsApi } = await import('./schedulingApi');

    await expect(appointmentsApi.inbox({ date: '2026-10-01' })).resolves.toMatchObject([{ id: '9', appointmentId: '4' }]);
    await appointmentsApi.decideReschedule('9', 'REJECT', 'Sin cupo');
    await expect(appointmentsApi.history('4')).resolves.toMatchObject([{ id: '1', changedByUserId: null }]);
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      'http://localhost:8080/api/v1/admin/inbox?date=2026-10-01',
      'http://localhost:8080/api/v1/admin/reschedule-requests/9/decision',
      'http://localhost:8080/api/v1/appointments/4/history',
    ]);
  });

  it('manages EPS plans with string ids', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ id: 2, epsId: 1, regimeId: 3, code: 'P1', name: 'Plan', active: true }, 201));
    vi.stubGlobal('fetch', fetchMock);
    const { adminApi } = await import('./schedulingApi');

    await expect(adminApi.createEpsPlan({ epsId: '1', regimeId: '3', code: 'P1', name: 'Plan' })).resolves.toEqual({ id: '2', epsId: '1', regimeId: '3', code: 'P1', name: 'Plan', active: true });
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/v1/admin/eps-plans');
  });

  it('groups the slot-level availability response by professional and normalizes numeric ids', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response([
      { professionalId: 8, professionalName: 'Dra. López', startAt: '2026-10-01T08:00:00', endAt: '2026-10-01T08:30:00' },
      { professionalId: 8, professionalName: 'Dra. López', startAt: '2026-10-01T08:30:00', endAt: '2026-10-01T09:00:00' },
    ]));
    vi.stubGlobal('fetch', fetchMock);
    const { appointmentsApi } = await import('./schedulingApi');

    await expect(appointmentsApi.availability({ locationId: '1', specialtyId: '2', date: '2026-10-01' })).resolves.toEqual([
      { id: '8', name: 'Dra. López', slots: [{ startAt: '2026-10-01T08:00:00', endAt: '2026-10-01T08:30:00' }, { startAt: '2026-10-01T08:30:00', endAt: '2026-10-01T09:00:00' }] },
    ]);
  });
});
