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
});
