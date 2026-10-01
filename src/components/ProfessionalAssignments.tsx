import { useState } from 'react';
import { adminApi, schedulingErrorMessage } from '../api/schedulingApi';
import type { CatalogItem, Professional, Specialty } from '../types';

/** Specialty checklist with an explicit primary choice among the checked ones (HU-016). */
export function SpecialtyPicker({ specialties, selected, primary, onChange }: { specialties: Specialty[]; selected: string[]; primary: string; onChange: (selected: string[], primary: string) => void }) {
  const toggle = (id: string) => { const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]; onChange(next, next.includes(primary) ? primary : next[0] ?? ''); };
  return <div className="space-y-2">
    <fieldset><legend className="mb-1">Especialidades</legend>{specialties.filter((item) => item.active !== false || selected.includes(item.id)).map((item) => <label key={item.id} className="mr-2"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} /> {item.name}</label>)}</fieldset>
    <label className="block">Especialidad primaria<select aria-label="Especialidad primaria" value={primary} disabled={!selected.length} onChange={(event) => onChange(selected, event.target.value)} className="block mt-1 p-2 border rounded-xl bg-white w-full">{!selected.length && <option value="">Marca al menos una especialidad</option>}{selected.map((id) => <option key={id} value={id}>{specialties.find((item) => item.id === id)?.name ?? id}</option>)}</select></label>
  </div>;
}

/** Location checklist limited to the two PRD sites. */
export function LocationPicker({ locations, selected, onChange }: { locations: CatalogItem[]; selected: string[]; onChange: (selected: string[]) => void }) {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((item) => item !== id) : selected.length >= 2 ? selected : [...selected, id]);
  return <fieldset><legend className="mb-1">Sedes (máximo 2)</legend>{locations.map((item) => <label key={item.id} className="mr-2"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} /> {item.name}</label>)}</fieldset>;
}

/** Inline editor to reassign specialties (with primary) and locations of an existing professional. */
export function ProfessionalAssignmentsEditor({ professional, specialties, locations, onSaved, onCancel }: { professional: Professional; specialties: Specialty[]; locations: CatalogItem[]; onSaved: () => void; onCancel: () => void }) {
  const [selected, setSelected] = useState(professional.specialtyIds); const [primary, setPrimary] = useState(professional.primarySpecialtyId && professional.specialtyIds.includes(professional.primarySpecialtyId) ? professional.primarySpecialtyId : professional.specialtyIds[0] ?? '');
  const [sites, setSites] = useState(professional.locationIds); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const save = async () => {
    if (!selected.length || !primary || !sites.length) { setError('Asigna al menos una especialidad, su primaria y una sede.'); return; }
    setSaving(true); setError('');
    try { await adminApi.assignSpecialties(professional.id, selected, primary); await adminApi.assignLocations(professional.id, sites); onSaved(); }
    catch (cause) { setError(schedulingErrorMessage(cause)); } finally { setSaving(false); }
  };
  return <div className="mt-2 p-3 bg-white border rounded-xl space-y-2 text-xs" aria-label={`Asignaciones de ${professional.name}`}>
    <SpecialtyPicker specialties={specialties} selected={selected} primary={primary} onChange={(next, nextPrimary) => { setSelected(next); setPrimary(nextPrimary); }} />
    <LocationPicker locations={locations} selected={sites} onChange={setSites} />
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <div className="flex gap-2"><button type="button" disabled={saving} onClick={save} className="px-3 py-2 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar asignaciones'}</button><button type="button" onClick={onCancel} className="px-3 py-2 text-slate-600">Cancelar</button></div>
  </div>;
}
