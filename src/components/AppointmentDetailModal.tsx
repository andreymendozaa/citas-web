import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Video, FileText, CheckCircle, AlertTriangle, ShieldCheck, Download, ExternalLink } from 'lucide-react';
import { Appointment } from '../types';

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  onClose: () => void;
  onCancelAppointment: (id: string) => void;
  onRescheduleAppointment: (id: string, newDate: string, newTime: string) => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  onClose,
  onCancelAppointment,
  onRescheduleAppointment,
}) => {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('2026-09-28');
  const [newTime, setNewTime] = useState('11:00 AM');
  const [isDownloading, setIsDownloading] = useState(false);

  if (!appointment) return null;

  const handleDownloadProof = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      // Create a downloadable summary text file as proof
      const text = `================================================
PORTAL DE CITAS - COMPROBANTE MÉDICO
================================================
ID CITA: ${appointment.id}
PACIENTE: ${appointment.patientName}
ESPECIALISTA: ${appointment.doctorName} (${appointment.doctorSpecialty})
FECHA: ${appointment.date} a las ${appointment.time}
MODALIDAD: ${appointment.type.toUpperCase()}
LUGAR/ENLACE: ${appointment.location} ${appointment.room ? `(${appointment.room})` : ''}
ESTADO: ${appointment.status.toUpperCase()}
MOTIVO: ${appointment.reason}
${appointment.prescription ? `\nDIAGNÓSTICO: ${appointment.prescription.diagnosis}\nINDICACIONES: ${appointment.prescription.notes}` : ''}
================================================
Comprobante generado con firma digital médica segura.`;

      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comprobante-${appointment.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        id="appointment-detail-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                appointment.status === 'confirmada'
                  ? 'bg-blue-100 text-blue-700'
                  : appointment.status === 'completada'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Cita {appointment.status}
            </span>
            <span className="text-xs text-slate-400">ID: {appointment.id}</span>
          </div>

          <button
            type="button"
            id="close-detail-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Doctor Header Banner */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <img
              src={appointment.doctorAvatar}
              alt={appointment.doctorName}
              className="w-16 h-16 rounded-xl object-cover shadow-sm border border-white"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
                {appointment.doctorSpecialty}
              </span>
              <h3 className="text-base font-bold text-slate-900 truncate">
                {appointment.doctorName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {appointment.location} {appointment.room ? `• ${appointment.room}` : ''}
              </p>
            </div>
          </div>

          {/* Date & Time Highlights */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Fecha</span>
              </div>
              <span className="font-semibold text-sm text-slate-900">{appointment.date}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Horario</span>
              </div>
              <span className="font-semibold text-sm text-slate-900">{appointment.time}</span>
            </div>
          </div>

          {/* Virtual Join Button if video */}
          {appointment.type === 'videoconsulta' && appointment.status !== 'cancelada' && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-md shadow-blue-500/15">
              <div className="space-y-0.5">
                <span className="text-xs text-blue-100 font-medium">Videoconsulta Activa</span>
                <p className="text-sm font-semibold">Sala Médica Virtual Cifrada</p>
              </div>
              <a
                href={appointment.meetUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-white text-blue-600 hover:bg-blue-50 font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <span>Entrar a la Consulta</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Reason */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Motivo de Atención
            </h4>
            <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {appointment.reason}
            </p>
          </div>

          {/* Prep Instructions */}
          {appointment.prepInstructions && appointment.prepInstructions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Indicaciones Previas
              </h4>
              <ul className="space-y-1.5">
                {appointment.prepInstructions.map((instruction, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Medical Prescription (if completed) */}
          {appointment.prescription && (
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase tracking-wider">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Receta y Diagnóstico Médico</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Diagnóstico:</span>
                <span className="text-sm font-medium text-slate-800">
                  {appointment.prescription.diagnosis}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Medicamentos:</span>
                <div className="space-y-1.5">
                  {appointment.prescription.medicines.map((med, idx) => (
                    <div key={idx} className="text-xs bg-white p-2.5 rounded-lg border border-emerald-100 flex justify-between items-center">
                      <div>
                        <strong className="text-slate-800 block">{med.name}</strong>
                        <span className="text-slate-500">{med.frequency} • {med.duration}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {med.dose}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-600 italic">
                Nota del especialista: "{appointment.prescription.notes}"
              </p>
            </div>
          )}

          {/* Reschedule View */}
          {isRescheduling && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
              <h5 className="font-semibold text-xs text-amber-900 uppercase tracking-wider">
                Reprogramar Cita
              </h5>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 block mb-1">Nueva Fecha</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-700 block mb-1">Nuevo Horario</label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRescheduleAppointment(appointment.id, newDate, newTime);
                    setIsRescheduling(false);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Guardar Nuevo Horario
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
          <button
            type="button"
            id="download-proof-btn"
            onClick={handleDownloadProof}
            disabled={isDownloading}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-blue-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'Generando...' : 'Descargar Comprobante'}</span>
          </button>

          {appointment.status === 'confirmada' && (
            <div className="flex items-center gap-2">
              {!isRescheduling && (
                <button
                  type="button"
                  id="reschedule-trigger-btn"
                  onClick={() => setIsRescheduling(true)}
                  className="px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
                >
                  Reprogramar
                </button>
              )}
              <button
                type="button"
                id="cancel-appointment-btn"
                onClick={() => {
                  if (confirm('¿Estás seguro de cancelar esta cita médica?')) {
                    onCancelAppointment(appointment.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar Cita
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
