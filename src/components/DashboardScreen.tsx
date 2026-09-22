import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Plus,
  Search,
  Filter,
  LogOut,
  User as UserIcon,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  Phone,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import { Appointment, Doctor, User } from '../types';
import { SPECIALTIES } from '../data/mockData';

interface DashboardScreenProps {
  user: User;
  appointments: Appointment[];
  onOpenBooking: () => void;
  onOpenDetail: (appointment: Appointment) => void;
  onLogout: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  appointments,
  onOpenBooking,
  onOpenDetail,
  onLogout,
}) => {
  const [filterTab, setFilterTab] = useState<'todas' | 'proximas' | 'completadas' | 'canceladas'>('proximas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState<string>('all');

  // Filtered appointments
  const filteredAppointments = appointments.filter((apt) => {
    // Status tab filter
    if (filterTab === 'proximas' && apt.status !== 'confirmada' && apt.status !== 'pendiente') return false;
    if (filterTab === 'completadas' && apt.status !== 'completada') return false;
    if (filterTab === 'canceladas' && apt.status !== 'cancelada') return false;

    // Specialty filter
    if (selectedSpecialtyFilter !== 'all' && apt.doctorSpecialty.toLowerCase() !== selectedSpecialtyFilter.toLowerCase()) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDoc = apt.doctorName.toLowerCase().includes(q);
      const matchSpec = apt.doctorSpecialty.toLowerCase().includes(q);
      const matchReason = apt.reason.toLowerCase().includes(q);
      if (!matchDoc && !matchSpec && !matchReason) return false;
    }

    return true;
  });

  // Highlight next upcoming appointment
  const nextAppointment = appointments.find((apt) => apt.status === 'confirmada');

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12" id="patient-dashboard-container">
      {/* Top Application Header */}
      <header
        className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4"
        id="dashboard-header"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-600 to-sky-400 flex items-center justify-center shadow-md shadow-blue-500/20">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
              Portal de Citas
            </span>
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">
              Expediente Digital del Paciente
            </span>
          </div>
        </div>

        {/* User profile & logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pr-3 border-r border-slate-100 text-right hidden sm:flex">
            <div>
              <span className="text-sm font-semibold text-slate-900 block leading-tight">
                {user.name}
              </span>
              <span className="text-xs text-slate-400 block font-mono">
                Póliza: {user.insuranceId || 'PARTICULAR'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">
              {user.name.charAt(0)}
            </div>
          </div>

          <button
            type="button"
            id="book-new-appointment-btn"
            onClick={onOpenBooking}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm rounded-xl shadow-sm hover:shadow-md shadow-blue-500/15 transition-all duration-200 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Cita</span>
          </button>

          <button
            type="button"
            id="logout-btn"
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Featured Card: Próxima Cita (Styling mirroring the editorial dark panel) */}
      {nextAppointment && (
        <section
          className="relative bg-gradient-to-r from-[#07152B] via-[#0A1F3E] to-[#0E2952] rounded-3xl p-6 sm:p-8 text-white border border-slate-800/60 shadow-xl overflow-hidden"
          id="featured-next-appointment-card"
        >
          {/* Subtle glow background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/25 text-xs font-medium text-blue-200 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Tu Próxima Cita Médica Confirmada</span>
              </div>

              <div>
                <span className="text-xs font-medium tracking-wider text-blue-300 uppercase block">
                  {nextAppointment.doctorSpecialty}
                </span>
                <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mt-0.5">
                  {nextAppointment.doctorName}
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                  {nextAppointment.reason}
                </p>
              </div>

              {/* Info Badges */}
              <div className="flex flex-wrap gap-3 pt-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-white">
                  <Calendar className="w-3.5 h-3.5 text-blue-300" />
                  <span>{nextAppointment.date}</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-white">
                  <Clock className="w-3.5 h-3.5 text-blue-300" />
                  <span>{nextAppointment.time}</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-white">
                  {nextAppointment.type === 'presencial' ? (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{nextAppointment.location}</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Videoconsulta en Línea</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Column */}
            <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
              <button
                type="button"
                id="view-next-appointment-details-btn"
                onClick={() => onOpenDetail(nextAppointment)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ver Detalles e Indicaciones</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {nextAppointment.type === 'videoconsulta' && (
                <a
                  href={nextAppointment.meetUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-center"
                >
                  <Video className="w-3.5 h-3.5 text-blue-300" />
                  <span>Ingresar a Sala Virtual</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-300" />
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Specialties Quick Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Especialidades Médicas
          </span>
          <span className="text-xs text-slate-400">Selecciona para filtrar</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            id="filter-all-specialties"
            onClick={() => setSelectedSpecialtyFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedSpecialtyFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas las Especialidades
          </button>
          {SPECIALTIES.map((spec) => (
            <button
              key={spec.id}
              type="button"
              id={`filter-spec-${spec.id}`}
              onClick={() => setSelectedSpecialtyFilter(spec.name)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedSpecialtyFilter.toLowerCase() === spec.name.toLowerCase()
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spec.name}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Mis Citas Médicas
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Consulta el estado, reprograma o revisa las recetas e indicaciones de tus consultas.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="search-appointments-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar médico o motivo..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          {[
            { id: 'proximas', label: 'Próximas' },
            { id: 'completadas', label: 'Historial / Completadas' },
            { id: 'canceladas', label: 'Canceladas' },
            { id: 'todas', label: 'Todas las Citas' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              id={`tab-${tab.id}`}
              onClick={() => setFilterTab(tab.id as any)}
              className={`pb-2 px-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer relative ${
                filterTab === tab.id
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {filterTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
              )}
            </button>
          ))}
        </div>

        {/* Appointments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                id={`appointment-card-${apt.id}`}
                className="p-5 rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between bg-white space-y-4"
              >
                {/* Top: Doctor & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={apt.doctorAvatar}
                      alt={apt.doctorName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm shrink-0"
                    />
                    <div>
                      <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider block">
                        {apt.doctorSpecialty}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{apt.doctorName}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{apt.location}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize shrink-0 ${
                      apt.status === 'confirmada'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : apt.status === 'completada'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>

                {/* Middle: Details */}
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-medium text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {apt.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {apt.time}
                    </span>
                  </div>
                  <p className="text-slate-600 line-clamp-1">
                    <strong className="text-slate-700">Motivo:</strong> {apt.reason}
                  </p>
                </div>

                {/* Bottom: Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    {apt.type === 'videoconsulta' ? 'Enlace virtual disponible' : 'Atención en consultorio'}
                  </span>

                  <button
                    type="button"
                    id={`view-btn-${apt.id}`}
                    onClick={() => onOpenDetail(apt)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver Ficha</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                No se encontraron citas con estos filtros.
              </p>
              <button
                type="button"
                id="reset-filters-btn"
                onClick={() => {
                  setFilterTab('todas');
                  setSelectedSpecialtyFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs text-blue-600 hover:underline cursor-pointer"
              >
                Restablecer filtros de búsqueda
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Security & Support Guarantee Footer */}
      <footer className="p-4 bg-white rounded-2xl border border-slate-100 text-center flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Portal de Citas Médicas Verificado • Cifrado de extremo a extremo activo</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Atención al paciente: 900 123 456</span>
          <span>•</span>
          <span>Soporte 24/7</span>
        </div>
      </footer>
    </div>
  );
};
