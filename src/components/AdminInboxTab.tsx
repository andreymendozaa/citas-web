import { useEffect, useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { adminApi, appointmentsApi, catalogsApi, schedulingErrorMessage } from '../api/schedulingApi';
import type { CatalogItem, InboxItem, Professional, Specialty } from '../types';
import { AppointmentHistory } from './AppointmentHistory';
import { dateTime } from './format';

const typeLabels = { SPECIALIZED: 'Especializada', RESCHEDULE: 'Reprogramación' } as const;

/** ADMIN unified queue of specialized requests and pending reschedules (HU-031). */
export function AdminInboxTab() {
  const [items, setItems] = useState<InboxItem[]>([]); const [filters, setFilters] = useState({ locationId: '', professionalId: '', specialtyId: '', date: '' }); const [locations, setLocations] = useState<CatalogItem[]>([]); const [professionals, setProfessionals] = useState<Professional[]>([]); const [specialties, setSpecialties] = useState<Specialty[]>([]); const [reasons, setReasons] = useState<Record<string, string>>({}); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [refresh, setRefresh] = useState(0);
  useEffect(() => { Promise.all([catalogsApi.locations(), adminApi.professionals(), adminApi.specialties()]).then(([l, p, s]) => { setLocations(l); setProfessionals(p); setSpecialties(s.map((item) => ({ ...item, id: String(item.id) }))); }).catch(() => undefined); }, []);
  useEffect(() => { let current = true; setLoading(true); setError(''); const active = Object.fromEntries(Object.entries(filters).filter(([, value]) => value)); appointmentsApi.inbox(active).then((rows) => { if (current) setItems(rows); }).catch((cause) => { if (current) setError(schedulingErrorMessage(cause)); }).finally(() => { if (current) setLoading(false); }); return () => { current = false; }; }, [filters, refresh]);
  const key = (item: InboxItem) => `${item.type}-${item.id}`;
  const decide = async (item: InboxItem, decision: 'APPROVE' | 'REJECT') => {
    const reason = reasons[key(item)]?.trim(); if (decision === 'REJECT' && !reason) { setError('El rechazo requiere un motivo.'); return; }
    setError('');
    try { if (item.type === 'SPECIALIZED') await appointmentsApi.decide(item.id, decision, reason); else await appointmentsApi.decideReschedule(item.id, decision, reason); setRefresh((value) => value + 1); }
    catch (cause) { setError(schedulingErrorMessage(cause, 'La solicitud ya fue resuelta o el horario dejó de estar disponible.')); }
  };
  const select = (label: string, field: keyof typeof filters, options: { id: string; name: string }[]) => <label className="text-xs text-slate-600">{label}<select aria-label={`Filtro ${label.toLowerCase()}`} value={filters[field]} onChange={(event) => setFilters({ ...filters, [field]: event.target.value })} className="block mt-1 p-2 border rounded-lg bg-white max-w-[12rem]"><option value="">Todas</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
  return <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
    <div className="flex flex-wrap gap-3 items-end justify-between"><div><h2 className="text-lg font-bold text-slate-900">Bandeja administrativa</h2><p className="text-sm text-slate-500">Solicitudes especializadas y reprogramaciones pendientes de decisión.</p></div>
      <div className="flex flex-wrap gap-2 items-end">{select('Sede', 'locationId', locations)}{select('Profesional', 'professionalId', professionals)}{select('Especialidad', 'specialtyId', specialties)}<label className="text-xs text-slate-600">Fecha<input aria-label="Filtro fecha" type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} className="block mt-1 p-2 border rounded-lg bg-white" /></label></div></div>
    {error && <p role="alert" className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">{error}</p>}
    {loading ? <p className="text-sm text-slate-500">Cargando bandeja…</p> : items.length ? <div className="grid gap-3">{items.map((item) => <article key={key(item)} className="p-4 border rounded-2xl grid md:grid-cols-[1fr_auto] gap-3">
      <div><div className="flex flex-wrap items-center gap-2"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.type === 'SPECIALIZED' ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-800'}`}>{typeLabels[item.type]}</span><strong className="text-slate-900">{item.specialtyName}</strong></div><p className="mt-1 text-xs text-slate-500">Paciente: {item.patientName} · {item.professionalName}<br /><MapPin className="inline w-3.5 h-3.5" /> {item.locationName} · <Calendar className="inline w-3.5 h-3.5" /> {item.type === 'RESCHEDULE' ? 'Nuevo horario solicitado: ' : ''}{dateTime(item.startAt)}</p><input value={reasons[key(item)] ?? ''} maxLength={500} onChange={(event) => setReasons({ ...reasons, [key(item)]: event.target.value })} placeholder="Motivo obligatorio si rechaza" aria-label={`Motivo ${typeLabels[item.type]} ${item.id}`} className="mt-2 p-2 border rounded-lg text-xs w-full md:max-w-md" /><AppointmentHistory appointmentId={item.appointmentId} /></div>
      <div className="flex gap-2 h-fit"><button type="button" onClick={() => decide(item, 'APPROVE')} className="px-3 py-2 text-xs bg-emerald-600 text-white rounded-xl">Aprobar</button><button type="button" onClick={() => decide(item, 'REJECT')} className="px-3 py-2 text-xs bg-red-600 text-white rounded-xl">Rechazar</button></div>
    </article>)}</div> : <p className="p-5 text-center text-sm text-slate-500 bg-slate-50 rounded-xl">No hay solicitudes pendientes con estos filtros.</p>}
  </section>;
}
