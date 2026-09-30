import React, { useEffect, useState } from 'react';
import { adminApi, catalogsApi, schedulingErrorMessage } from '../api/schedulingApi';
import type { CatalogItem, Eps, EpsPlan } from '../types';

const duplicate = 'Ya existe un registro con ese código o la EPS está inactiva.';

function InlineName({ value, onSave }: { value: string; onSave: (name: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false); const [name, setName] = useState(value);
  if (!editing) return <button type="button" onClick={() => { setName(value); setEditing(true); }} className="ml-2 text-blue-600">Renombrar</button>;
  return <form onSubmit={async (event) => { event.preventDefault(); if (!name.trim()) return; await onSave(name.trim()); setEditing(false); }} className="inline-flex gap-1 ml-2"><input aria-label="Nuevo nombre" autoFocus required maxLength={150} value={name} onChange={(event) => setName(event.target.value)} className="p-1 border rounded text-xs" /><button className="text-blue-600">Guardar</button><button type="button" onClick={() => setEditing(false)} className="text-slate-500">Cancelar</button></form>;
}

/** ADMIN catalog of EPS and their plans (HU-012/HU-013): logical deactivation only, same pattern as specialties. */
export function InsuranceAdminTab() {
  const [eps, setEps] = useState<Eps[]>([]); const [plans, setPlans] = useState<EpsPlan[]>([]); const [regimes, setRegimes] = useState<CatalogItem[]>([]); const [selectedEps, setSelectedEps] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const [epsForm, setEpsForm] = useState({ code: '', name: '' }); const [planForm, setPlanForm] = useState({ regimeId: '', code: '', name: '' });
  const fail = (cause: unknown) => setError(schedulingErrorMessage(cause, duplicate));
  const loadEps = () => adminApi.eps().then(setEps).catch(fail);
  const loadPlans = () => adminApi.epsPlans(selectedEps || undefined).then(setPlans).catch(fail);
  useEffect(() => { Promise.all([loadEps(), catalogsApi.regimes().then(setRegimes).catch(fail)]).finally(() => setLoading(false)); }, []);
  useEffect(() => { loadPlans(); }, [selectedEps]);
  const run = async (action: () => Promise<unknown>) => { setError(''); try { await action(); await Promise.all([loadEps(), loadPlans()]); return true; } catch (cause) { fail(cause); return false; } };
  const createEps = async (event: React.FormEvent) => { event.preventDefault(); if (await run(() => adminApi.createEps({ code: epsForm.code.trim(), name: epsForm.name.trim() }))) setEpsForm({ code: '', name: '' }); };
  const createPlan = async (event: React.FormEvent) => { event.preventDefault(); if (!selectedEps) { setError('Selecciona la EPS del plan.'); return; } if (await run(() => adminApi.createEpsPlan({ epsId: selectedEps, ...planForm, code: planForm.code.trim(), name: planForm.name.trim() }))) setPlanForm({ regimeId: '', code: '', name: '' }); };
  const epsName = (id: string) => eps.find((item) => item.id === id)?.name ?? id; const regimeName = (id: string) => regimes.find((item) => item.id === id)?.name ?? id;
  return <div className="grid lg:grid-cols-2 gap-6">
    {error && <p role="alert" className="lg:col-span-2 p-3 text-sm text-red-700 bg-red-50 rounded-xl">{error}</p>}
    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4"><h2 className="text-lg font-bold">EPS</h2>
      <form onSubmit={createEps} className="grid grid-cols-2 gap-2"><input required maxLength={30} value={epsForm.code} onChange={(event) => setEpsForm({ ...epsForm, code: event.target.value })} placeholder="Código" aria-label="Código EPS" className="p-2 border rounded-xl text-sm" /><input required maxLength={150} value={epsForm.name} onChange={(event) => setEpsForm({ ...epsForm, name: event.target.value })} placeholder="Nombre de la EPS" aria-label="Nombre EPS" className="p-2 border rounded-xl text-sm" /><button className="col-span-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">Crear EPS</button></form>
      {loading ? <p className="text-sm text-slate-500">Cargando EPS…</p> : eps.length ? <div className="space-y-2">{eps.map((item) => <div key={item.id} className={`p-3 rounded-xl flex flex-wrap justify-between gap-2 text-sm ${selectedEps === item.id ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}><button type="button" onClick={() => setSelectedEps(selectedEps === item.id ? '' : item.id)} className="text-left"><strong>{item.name}</strong> <span className="text-xs text-slate-500">{item.code}</span></button><span className="text-xs text-slate-500">{item.active ? 'Activa' : 'Inactiva'}<InlineName value={item.name} onSave={async (name) => { await run(() => adminApi.updateEps(item.id, { name })); }} /><button type="button" onClick={() => run(() => adminApi.updateEps(item.id, { active: !item.active }))} className="ml-2 text-blue-600">{item.active ? 'Desactivar' : 'Activar'}</button></span></div>)}</div> : <p className="text-sm text-slate-500">Aún no hay EPS registradas.</p>}
    </section>
    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4"><div><h2 className="text-lg font-bold">Planes de EPS</h2><p className="text-xs text-slate-500">{selectedEps ? `Mostrando planes de ${epsName(selectedEps)}. Selecciona de nuevo la EPS para ver todos.` : 'Selecciona una EPS para filtrar y crear planes.'}</p></div>
      <form onSubmit={createPlan} className="grid grid-cols-2 gap-2"><select required value={planForm.regimeId} onChange={(event) => setPlanForm({ ...planForm, regimeId: event.target.value })} aria-label="Régimen" className="col-span-2 p-2 border rounded-xl text-sm bg-white"><option value="">Selecciona el régimen</option>{regimes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input required maxLength={50} value={planForm.code} onChange={(event) => setPlanForm({ ...planForm, code: event.target.value })} placeholder="Código del plan" aria-label="Código plan" className="p-2 border rounded-xl text-sm" /><input required maxLength={150} value={planForm.name} onChange={(event) => setPlanForm({ ...planForm, name: event.target.value })} placeholder="Nombre del plan" aria-label="Nombre plan" className="p-2 border rounded-xl text-sm" /><button disabled={!selectedEps || eps.find((item) => item.id === selectedEps)?.active === false} className="col-span-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50">Crear plan</button></form>
      {plans.length ? <div className="space-y-2">{plans.map((plan) => <div key={plan.id} className="p-3 bg-slate-50 rounded-xl flex flex-wrap justify-between gap-2 text-sm"><span><strong>{plan.name}</strong> <span className="text-xs text-slate-500">{plan.code} · {epsName(plan.epsId)} · {regimeName(plan.regimeId)}</span></span><span className="text-xs text-slate-500">{plan.active ? 'Activo' : 'Inactivo'}<InlineName value={plan.name} onSave={async (name) => { await run(() => adminApi.updateEpsPlan(plan.id, { name })); }} /><button type="button" onClick={() => run(() => adminApi.updateEpsPlan(plan.id, { active: !plan.active }))} className="ml-2 text-blue-600">{plan.active ? 'Desactivar' : 'Activar'}</button></span></div>)}</div> : <p className="text-sm text-slate-500">No hay planes con este filtro.</p>}
    </section>
  </div>;
}
