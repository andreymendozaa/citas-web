import React, { useState } from 'react';
import { ArrowLeft, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { authErrorMessage, requestPasswordRecovery, resetErrorMessage, resetPassword } from '../auth/authApi';

const inputClass = 'block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';
const labelClass = 'block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2';
const submitClass = 'w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-75';

function AuthCard({ title, subtitle, onBack, children }: { title: string; subtitle: string; onBack: () => void; children: React.ReactNode }) {
  return <main className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-100 px-8 py-10 sm:px-10 my-auto">
    <div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-600 to-sky-400 flex items-center justify-center shadow-md shadow-blue-500/20"><KeyRound className="w-5 h-5 text-white" /></div><div><span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">Portal de Citas</span><span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Recuperación de acceso</span></div></div>
    <div className="mb-6"><h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2><p className="text-slate-500 text-sm mt-1.5">{subtitle}</p></div>
    {children}
    <div className="pt-6 mt-6 border-t border-slate-100 text-center space-y-3"><button type="button" onClick={onBack} className="text-sm font-semibold text-blue-600 hover:text-blue-700"><ArrowLeft className="inline w-4 h-4 mr-1" />Volver a iniciar sesión</button><div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400"><ShieldCheck className="w-4 h-4" />Nunca compartas tu código de recuperación.</div></div>
  </main>;
}

export function ForgotPasswordScreen({ onNavigateLogin, onNavigateReset }: { onNavigateLogin: () => void; onNavigateReset: () => void }) {
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false); const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(''); setLoading(true); try { await requestPasswordRecovery(email); setSent(true); } catch (cause) { setError(authErrorMessage(cause)); } finally { setLoading(false); } };
  return <AuthCard title="¿Olvidaste tu contraseña?" subtitle="Ingresa el correo de tu cuenta y te enviaremos un código para restablecerla." onBack={onNavigateLogin}>
    {sent ? <div className="space-y-4"><p role="status" className="p-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">Si el correo corresponde a una cuenta registrada, recibirás un código de recuperación con vigencia limitada.</p><button type="button" onClick={onNavigateReset} className={submitClass}>Ya tengo un código</button></div>
      : <form onSubmit={submit} className="space-y-5">{error && <div role="alert" className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">{error}</div>}<div><label className={labelClass} htmlFor="recovery-email">Correo electrónico</label><div className="relative"><Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input id="recovery-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="usuario@ejemplo.com" className={inputClass} /></div></div><button type="submit" disabled={loading} className={submitClass}>{loading ? 'Enviando…' : 'Enviar código'}</button><button type="button" onClick={onNavigateReset} className="w-full text-xs text-slate-500 hover:text-blue-600">Ya tengo un código de recuperación</button></form>}
  </AuthCard>;
}

export function ResetPasswordScreen({ initialToken = '', onNavigateLogin, onResetSuccess }: { initialToken?: string; onNavigateLogin: () => void; onResetSuccess: () => void }) {
  const [token, setToken] = useState(initialToken); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const mismatch = confirmation.length > 0 && password !== confirmation;
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return; } setError(''); setLoading(true); try { await resetPassword(token, password, confirmation); onResetSuccess(); } catch (cause) { setError(resetErrorMessage(cause)); } finally { setLoading(false); } };
  return <AuthCard title="Restablecer contraseña" subtitle="Define una nueva contraseña. Al confirmarla se cerrarán tus sesiones abiertas." onBack={onNavigateLogin}>
    <form onSubmit={submit} className="space-y-5">{error && <div role="alert" className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">{error}</div>}
      <div><label className={labelClass} htmlFor="reset-token">Código de recuperación</label><div className="relative"><KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input id="reset-token" required autoComplete="one-time-code" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Pega aquí el código recibido" className={inputClass} /></div></div>
      <div><label className={labelClass} htmlFor="reset-password">Nueva contraseña</label><div className="relative"><Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input id="reset-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" className={inputClass} /></div></div>
      <div><label className={labelClass} htmlFor="reset-confirmation">Confirmar contraseña</label><div className="relative"><Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input id="reset-confirmation" type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={inputClass} /></div>{mismatch && <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden.</p>}</div>
      <button type="submit" disabled={loading || mismatch} className={submitClass}>{loading ? 'Guardando…' : 'Restablecer contraseña'}</button>
    </form>
  </AuthCard>;
}
