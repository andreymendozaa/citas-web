import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Video, CheckCircle2, ChevronRight, User, Shield, AlertCircle } from 'lucide-react';
import { Appointment, Doctor } from '../types';
import { DOCTORS, SPECIALTIES } from '../data/mockData';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentBooked: (appointment: Appointment) => void;
  patientName: string;
  patientId: string;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  onAppointmentBooked,
  patientName,
  patientId,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('Cardiología');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(DOCTORS[0]);
  const [modality, setModality] = useState<'presencial' | 'videoconsulta'>('presencial');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-22');
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM');
  const [reason, setReason] = useState<string>('');

  if (!isOpen) return null;

  const availableDoctors = DOCTORS.filter((doc) =>
    selectedSpecialty ? doc.specialty.toLowerCase() === selectedSpecialty.toLowerCase() : true
  );

  const availableTimeSlots = [
    '08:30 AM',
    '09:15 AM',
    '10:00 AM',
    '11:30 AM',
    '02:15 PM',
    '03:45 PM',
    '04:30 PM',
    '05:15 PM',
  ];

  const handleFinishBooking = () => {
    if (!selectedDoctor) return;

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      doctorSpecialty: selectedDoctor.specialty,
      doctorAvatar: selectedDoctor.avatar,
      patientId: patientId || 'usr-101',
      patientName: patientName || 'Carlos Andrés Méndez',
      date: selectedDate,
      time: selectedTime,
      location: modality === 'presencial' ? selectedDoctor.hospital : 'Videoconsulta Segura',
      room: modality === 'presencial' ? 'Consultorio 204 - Módulo Central' : undefined,
      meetUrl: modality === 'videoconsulta' ? `https://meet.jit.si/portal-citas-${Date.now()}` : undefined,
      type: modality,
      status: 'confirmada',
      reason: reason.trim() || 'Consulta médica programada',
      prepInstructions: [
        modality === 'presencial'
          ? 'Llegar 15 minutos antes con documento de identificación.'
          : 'Disponer de conexión estable a internet y cámara web activa.',
        'Tener a la mano estudios médicos previos o recetas vigentes.',
      ],
    };

    onAppointmentBooked(newAppointment);
    onClose();
    // Reset
    setStep(1);
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        id="booking-modal-box"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-blue-600 uppercase">
              Agendar Nueva Cita
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Paso {step} de 4: {step === 1 && 'Elige la Especialidad'}
              {step === 2 && 'Selecciona tu Especialista'}
              {step === 3 && 'Fecha, Horario y Modalidad'}
              {step === 4 && 'Motivo de Consulta y Confirmación'}
            </h3>
          </div>
          <button
            type="button"
            id="close-booking-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-blue-600 h-1.5 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: ESPECIALIDAD */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Selecciona el área médica para la cual requieres atención o seguimiento:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SPECIALTIES.map((spec) => {
                  const isSelected = selectedSpecialty === spec.name;
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      id={`spec-btn-${spec.id}`}
                      onClick={() => {
                        setSelectedSpecialty(spec.name);
                        const doc = DOCTORS.find((d) => d.specialty === spec.name) || DOCTORS[0];
                        setSelectedDoctor(doc);
                      }}
                      className={`p-4 rounded-xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-sm text-slate-900 block">
                          {spec.name}
                        </span>
                        <span className="text-xs text-slate-500 mt-1 block">
                          {spec.description}
                        </span>
                        <span className="text-[11px] font-medium text-blue-600 mt-2 block">
                          {spec.doctorCount} médicos disponibles
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs mt-0.5 ${
                          isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'
                        }`}
                      >
                        {isSelected && '✓'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: MÉDICO */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Especialistas certificados en <strong className="text-blue-600">{selectedSpecialty}</strong>:
              </p>
              <div className="space-y-3">
                {availableDoctors.length > 0 ? (
                  availableDoctors.map((doc) => {
                    const isSelected = selectedDoctor?.id === doc.id;
                    return (
                      <div
                        key={doc.id}
                        id={`doctor-card-${doc.id}`}
                        onClick={() => setSelectedDoctor(doc)}
                        className={`p-4 rounded-xl border flex items-center gap-4 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          className="w-14 h-14 rounded-xl object-cover shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900 text-sm truncate">
                              {doc.name}
                            </h4>
                            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                              ⭐ {doc.rating} ({doc.reviewsCount})
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {doc.hospital}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-600 mt-1.5">
                            <span>{doc.experienceYears} años exp.</span>
                            <span>•</span>
                            <span className="text-blue-600 font-semibold">
                              ${doc.price} USD / Seguro incluido
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'
                          }`}
                        >
                          {isSelected && '✓'}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No se encontraron médicos específicos en esta sede. Mostrando médicos generales disponibles.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: MODALIDAD, FECHA Y HORA */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Modality selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Modalidad de Atención
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    id="select-modality-presencial"
                    onClick={() => setModality('presencial')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                      modality === 'presencial'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-xs sm:text-sm block">Presencial</span>
                      <span className="text-[11px] text-slate-500 block">En consultorio médico</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="select-modality-video"
                    onClick={() => setModality('videoconsulta')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                      modality === 'videoconsulta'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Video className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-xs sm:text-sm block">Videoconsulta</span>
                      <span className="text-[11px] text-slate-500 block">Sala virtual segura</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Date selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Fecha de la Cita
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Mañana', date: '2026-09-19', day: '19 Sep' },
                    { label: 'Lunes', date: '2026-09-21', day: '21 Sep' },
                    { label: 'Martes', date: '2026-09-22', day: '22 Sep' },
                    { label: 'Jueves', date: '2026-09-24', day: '24 Sep' },
                  ].map((item) => (
                    <button
                      key={item.date}
                      type="button"
                      id={`date-btn-${item.date}`}
                      onClick={() => setSelectedDate(item.date)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedDate === item.date
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-semibold block opacity-80">
                        {item.label}
                      </span>
                      <span className="text-sm font-bold block">{item.day}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Horarios Disponibles
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableTimeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      id={`time-slot-${slot.replace(/\s+/g, '')}`}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium text-center transition-all cursor-pointer ${
                        selectedTime === slot
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: MOTIVO Y CONFIRMACIÓN */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Summary Card with matching editorial theme */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#07152B] to-[#0E2952] text-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-blue-300 font-medium">
                      Resumen de Cita Médica
                    </span>
                    <h4 className="font-semibold text-base">{selectedDoctor?.name}</h4>
                    <span className="text-xs text-slate-300">{selectedDoctor?.specialty}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium capitalize">
                    {modality}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Fecha y Hora:</span>
                    <span className="font-medium text-white">{selectedDate} • {selectedTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Sede:</span>
                    <span className="font-medium text-white truncate block">
                      {modality === 'presencial' ? selectedDoctor?.hospital : 'Enlace en Línea Seguro'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason input */}
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2"
                  htmlFor="appointment-reason"
                >
                  Motivo de la Consulta / Síntomas Principales
                </label>
                <textarea
                  id="appointment-reason"
                  rows={3}
                  className="input-transition block w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Describe brevemente tus síntomas o si se trata de un control preventivo, revisión de resultados, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                ></textarea>
              </div>

              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-800">
                <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Tu cita quedará confirmada inmediatamente. Te enviaremos un recordatorio por correo electrónico y notificación con 24 horas de antelación.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          {step > 1 ? (
            <button
              type="button"
              id="booking-step-prev-btn"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              ← Paso Anterior
            </button>
          ) : (
            <div></div>
          )}

          {step < 4 ? (
            <button
              type="button"
              id="booking-step-next-btn"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continuar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              id="confirm-booking-final-btn"
              onClick={handleFinishBooking}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar y Agendar Cita</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
