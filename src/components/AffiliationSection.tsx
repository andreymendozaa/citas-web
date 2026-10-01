import { useEffect, useState } from 'react';
import { ShieldPlus } from 'lucide-react';
import { catalogsApi, profileApi, schedulingErrorMessage } from '../api/schedulingApi';
import type { Affiliation, CatalogItem, InsurancePlan } from '../types';

/** HU-011: the USER consults and changes their own EPS affiliation; the backend prevents duplicated plans. */
export function AffiliationSection() {
  const [current, setCurrent] = useState<Affiliation | null>(null); const [plans, setPlans] = useState<InsurancePlan[]>([]); const [eps, setEps] = useState<CatalogItem[]>([]); const [regimes, setRegimes] = useState<CatalogItem[]>([]);
  const [planId, setPlanId] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([profileApi.affiliation(), catalogsApi.selectablePlans(), catalogsApi.eps(), catalogsApi.regimes()])
      .then(([affiliation, nextPlans, nextEps, nextRegimes]) => { if (!active) return; setCurrent(affiliation); setPlanId(affiliation?.planId ?? ''); setPlans(nextPlans); setEps(nextEps); setRegimes(nextRegimes); })
      .catch((cause) => { if (active) setError(schedulingErrorMessage(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const label = (plan: InsurancePlan) => `${eps.find((item) => item.id === plan.epsId)?.name ?? 'EPS'} — ${plan.name} (${regimes.find((item) => item.id === plan.regimeId)?.name ?? 'régimen'})`;
  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try { setCurrent(await profileApi.changeAffiliation(planId)); setSaved(true); }
    catch (cause) { setError(schedulingErrorMessage(cause, 'Ese plan ya es tu afiliación vigente.')); }
    finally { setSaving(false); }
  };
  return <div className="space-y-3 pt-4 border-t border-slate-100" aria-label="Mi afiliación">
    <div className="flex items-center gap-2"><ShieldPlus className="w-5 h-5 text-blue-600" /><h3 className="text-base font-bold text-slate-900">Mi afiliación</h3></div>
    {loading ? <p className="text-sm text-slate-500">Cargando afiliación…</p> : <>
      {current ? <dl className="grid sm:grid-cols-3 gap-3 text-sm">
        <div className="p-3 bg-slate-50 rounded-xl"><dt className="text-xs text-slate-500">EPS</dt><dd className="font-semibold text-slate-900">{current.epsName}</dd></div>
        <div className="p-3 bg-slate-50 rounded-xl"><dt className="text-xs text-slate-500">Plan</dt><dd className="font-semibold text-slate-900">{current.planName}</dd></div>
        <div className="p-3 bg-slate-50 rounded-xl"><dt className="text-xs text-slate-500">Régimen</dt><dd className="font-semibold text-slate-900">{current.regimeName}</dd></div>
      </dl> : <p className="p-3 text-sm text-slate-600 bg-slate-50 rounded-xl">No tienes una afiliación registrada. Es un dato administrativo opcional y no afecta tus citas.</p>}
      <div className="flex flex-wrap gap-2 items-end"><label className="flex-1 min-w-[14rem] text-xs font-semibold text-slate-700 uppercase tracking-wider">{current ? 'Cambiar a otro plan' : 'Asociar un plan'}<select aria-label="Plan de afiliación" value={planId} onChange={(event) => { setPlanId(event.target.value); setSaved(false); }} className="block mt-2 w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-white normal-case tracking-normal font-normal"><option value="">Selecciona un plan</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{label(plan)}</option>)}</select></label>
        <button type="button" onClick={save} disabled={saving || !planId || planId === current?.planId} className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar afiliación'}</button></div>
    </>}
    {error && <p role="alert" className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">{error}</p>}
    {saved && <p role="status" className="text-xs text-emerald-700">Afiliación actualizada.</p>}
  </div>;
}
