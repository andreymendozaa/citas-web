import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { availability, createAppointment } = vi.hoisted(() => ({
  availability: vi.fn().mockRejectedValue({ status: 409 }),
  createAppointment: vi.fn(),
}));

vi.mock('../api/schedulingApi', () => ({
  catalogsApi: {
    locations: () => Promise.resolve([{ id: '1', name: 'HIC' }]),
    specialties: () => Promise.resolve([{ id: '2', code: 'GEN', name: 'Medicina General', durationMinutes: 30, general: true, active: true }, { id: '3', code: 'TEST', name: 'Especialidad de prueba UUID', durationMinutes: 30, active: false }]),
  },
  appointmentsApi: { availability, create: createAppointment },
  schedulingErrorMessage: (error: { status?: number }) => error.status === 409 ? 'El horario dejó de estar disponible. Selecciona otro horario.' : 'Error',
}));

import { BookAppointmentModal } from './BookAppointmentModal';

describe('BookAppointmentModal', () => {
  it('shows the 409 availability conflict in the booking form', async () => {
    render(<BookAppointmentModal isOpen onClose={vi.fn()} onAppointmentBooked={vi.fn()} />);

    expect(await screen.findByRole('option', { name: /Medicina General/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Especialidad de prueba UUID/ })).not.toBeInTheDocument();
    fireEvent.change(await screen.findByLabelText('Sede'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Especialidad'), { target: { value: '2' } });

    expect(await screen.findByRole('alert')).toHaveTextContent('El horario dejó de estar disponible');
    expect(availability).toHaveBeenCalledWith(expect.objectContaining({ locationId: '1', specialtyId: '2' }));
  });

  it('confirms an approved reservation with the selected scheduling details', async () => {
    availability.mockResolvedValue([{ id: '3', name: 'Dra. Ejemplo', slots: [{ startAt: '2026-10-01T08:00:00', endAt: '2026-10-01T08:30:00' }] }]);
    createAppointment.mockResolvedValue({ id: '9', status: 'APPROVED', startAt: '2026-10-01T08:00:00', endAt: '2026-10-01T08:30:00' });
    const onAppointmentBooked = vi.fn();
    render(<BookAppointmentModal isOpen onClose={vi.fn()} onAppointmentBooked={onAppointmentBooked} />);

    fireEvent.change(await screen.findByLabelText('Sede'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Especialidad'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Fecha de atención'), { target: { value: '2026-10-01' } });
    await vi.waitFor(() => expect(availability).toHaveBeenLastCalledWith({ locationId: '1', specialtyId: '2', date: '2026-10-01' }));
    await vi.waitFor(() => expect(screen.getByRole('button', { name: /Continuar/ })).not.toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Dra\. Ejemplo/ }));
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    fireEvent.click(screen.getByRole('button', { name: /\d{2}:\d{2}/ }));
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/ }));

    await vi.waitFor(() => expect(onAppointmentBooked).toHaveBeenCalled());
    expect(onAppointmentBooked).toHaveBeenCalledWith(expect.objectContaining({ status: 'APPROVED', professionalName: 'Dra. Ejemplo', specialtyName: 'Medicina General', locationName: 'HIC', durationMinutes: 30 }));
  });
});
