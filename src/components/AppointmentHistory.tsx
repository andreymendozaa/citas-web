import { useState } from 'react';
import { History } from 'lucide-react';
import { appointmentsApi, schedulingErrorMessage, SchedulingApiError } from '../api/schedulingApi';
import type { HistoryEntry } from '../types';
import { dateTime, sourceLabels, statusLabels } from './format';

/** Read-only status timeline of one appointment (HU-032). The backend decides scope; out-of-scope answers 404. */
export function AppointmentHistory({ appointmentId }: { appointmentId: string }) {
  const [open, setOpen] = useState(false); const [entries, setEntries] = useState<HistoryEntry[] | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const toggle = async () => {
    const next = !open; setOpen(next); if (!next || entries) return;
    setLoading(true); setError('');
    try { setEntries(await appointmentsApi.history(appointmentId)); }
    catch (cause) { setError(cause instanceof SchedulingApiError && cause.status === 404 ? 'Historial no disponible para esta cita.' : schedulingErrorMessage(cause)); }
    finally { setLoading(false); }
  };
  return <div className="mt-2">
    <button type="button" onClick={toggle} aria-expanded={open} className="text-xs font-semibold text-slate-600 hover:text-blue-700"><History className="inline w-3.5 h-3.5 mr-1" />{open ? 'Ocultar historial' : 'Ver historial'}</button>
    {open && <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl">
      {loading ? <p className="text-xs text-slate-500">Cargando historial…</p> : error ? <p role="alert" className="text-xs text-red-700">{error}</p> : entries?.length ? <ol className="space-y-2 border-l-2 border-blue-100 pl-3">{entries.map((entry) => <li key={entry.id} className="text-xs"><strong className="text-slate-800">{statusLabels[entry.status] ?? entry.status}</strong><span className="text-slate-500"> · {sourceLabels[entry.changeSource] ?? entry.changeSource} · {dateTime(entry.changedAt)}</span>{entry.reason && <p className="text-slate-600 mt-0.5">Motivo: {entry.reason}</p>}</li>)}</ol> : <p className="text-xs text-slate-500">Sin registros de estado.</p>}
    </div>}
  </div>;
}
