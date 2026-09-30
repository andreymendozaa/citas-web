import React, { useEffect, useState } from 'react';
import { Phone, UserRound } from 'lucide-react';
import { profileApi, schedulingErrorMessage } from '../api/schedulingApi';
import { updateCachedUser } from '../auth/authApi';
import type { Profile, User } from '../types';

/** Own profile (HU-010): identity data is read-only; only the phone can change. */
export function ProfileTab({ onUserChange }: { onUserChange?: (user: User) => void }) {
  const [profile, setProfile] = useState<Profile | null>(null); const [phone, setPhone] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [saved, setSaved] = useState(false);
  const accept = (value: Profile) => { setProfile(value); setPhone(value.phone ?? ''); const cached = updateCachedUser({ name: `${value.firstName} ${value.lastName}`.trim(), phone: value.phone }); if (cached) onUserChange?.(cached); };
  useEffect(() => { let current = true; profileApi.me().then((value) => { if (current) accept(value); }).catch((cause) => { if (current) setError(schedulingErrorMessage(cause)); }).finally(() => { if (current) setLoading(false); }); return () => { current = false; }; }, []);
  const save = async (event: React.FormEvent) => { event.preventDefault(); setError(''); setSaved(false); setSaving(true); try { accept(await profileApi.updatePhone(phone.trim())); setSaved(true); } catch (cause) { setError(schedulingErrorMessage(cause)); } finally { setSaving(false); } };
  const unchanged = !profile || phone.trim() === (profile.phone ?? '') || !phone.trim();
  return <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5 max-w-2xl">
    <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><UserRound /></div><div><h2 className="text-lg font-bold text-slate-900">Mi perfil</h2><p className="text-sm text-slate-500">Tus datos de identidad solo pueden ser corregidos por administración.</p></div></div>
    {error && <p role="alert" className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">{error}</p>}
    {loading ? <p className="text-sm text-slate-500">Cargando tu perfil…</p> : profile && <>
      <dl className="grid sm:grid-cols-2 gap-3 text-sm">
        <div className="p-3 bg-slate-50 rounded-xl"><dt className="text-xs text-slate-500">Nombre</dt><dd className="font-semibold text-slate-900">{profile.firstName} {profile.lastName}</dd></div>
        <div className="p-3 bg-slate-50 rounded-xl"><dt className="text-xs text-slate-500">Documento</dt><dd className="font-semibold text-slate-900">{profile.documentType} {profile.documentNumber}</dd></div>
        <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2"><dt className="text-xs text-slate-500">Correo electrónico</dt><dd className="font-semibold text-slate-900">{profile.email}</dd></div>
      </dl>
      <form onSubmit={save} className="space-y-2"><label htmlFor="profile-phone" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Teléfono de contacto</label><div className="flex flex-wrap gap-2"><div className="relative flex-1 min-w-[12rem]"><Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input id="profile-phone" type="tel" required maxLength={40} value={phone} onChange={(event) => { setPhone(event.target.value); setSaved(false); }} className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm" /></div><button type="submit" disabled={saving || unchanged} className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar teléfono'}</button></div>{saved && <p role="status" className="text-xs text-emerald-700">Teléfono actualizado.</p>}</form>
    </>}
  </section>;
}
