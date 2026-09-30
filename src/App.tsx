import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Appointment, ScreenType, User } from './types';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { BookAppointmentModal } from './components/BookAppointmentModal';
import { ForgotPasswordScreen, ResetPasswordScreen } from './components/PasswordRecoveryScreens';
import { logout, restoreSession } from './auth/authApi';

/** Reads a recovery token from `?token=` once and removes it from the address bar so it does not stay in history. */
function takeUrlToken(): string {
  const params = new URLSearchParams(window.location.search); const token = params.get('token') ?? '';
  if (token) { params.delete('token'); const rest = params.toString(); window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}${window.location.hash}`); }
  return token;
}

export default function App() {
  const [resetToken] = useState(takeUrlToken);
  const [screen, setScreen] = useState<ScreenType>(resetToken ? 'reset-password' : 'login'); const [user, setUser] = useState<User | null>(null); const [restoring, setRestoring] = useState(!resetToken); const [bookingOpen, setBookingOpen] = useState(false); const [confirmation, setConfirmation] = useState<Appointment | null>(null); const [toast, setToast] = useState<string | null>(null); const [appointmentsVersion, setAppointmentsVersion] = useState(0);
  useEffect(() => { if (resetToken) return; let active = true; restoreSession().then((account) => { if (!active) return; if (account) { setUser(account); setScreen('dashboard'); } setRestoring(false); }); return () => { active = false; }; }, [resetToken]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(null), 3500); };
  if (restoring) return <main className="min-h-screen bg-[#F1F4F9] flex items-center justify-center text-sm text-slate-600">Verificando sesión segura…</main>;
  return <div className="min-h-screen bg-[#F1F4F9] text-slate-800 flex items-center justify-center p-3 sm:p-6 md:p-10 font-sans">
    {toast && <div className="fixed top-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl text-sm"><CheckCircle2 className="inline w-4 h-4 text-emerald-400 mr-2" />{toast}</div>}
    {screen === 'login' && <LoginScreen onLoginSuccess={(account) => { setUser(account); setScreen('dashboard'); notify(`Bienvenido/a, ${account.name}.`); }} onNavigateRegister={() => setScreen('register')} onNavigateForgot={() => setScreen('forgot-password')} />}
    {screen === 'register' && <RegisterScreen onRegisterSuccess={(account) => { setUser(account); setScreen('dashboard'); notify('Cuenta creada exitosamente.'); }} onNavigateLogin={() => setScreen('login')} />}
    {screen === 'forgot-password' && <ForgotPasswordScreen onNavigateLogin={() => setScreen('login')} onNavigateReset={() => setScreen('reset-password')} />}
    {screen === 'reset-password' && <ResetPasswordScreen initialToken={resetToken} onNavigateLogin={() => setScreen('login')} onResetSuccess={() => { setUser(null); setScreen('login'); notify('Contraseña actualizada. Inicia sesión con tu nueva contraseña.'); }} />}
    {screen === 'dashboard' && user && <DashboardScreen user={user} appointmentsVersion={appointmentsVersion} onUserChange={setUser} onOpenBooking={() => setBookingOpen(true)} onLogout={async () => { try { await logout(); setUser(null); setScreen('login'); notify('Has cerrado sesión correctamente.'); } catch { notify('No fue posible cerrar la sesión.'); } }} />}
    <BookAppointmentModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} onAppointmentBooked={(appointment) => { setConfirmation(appointment); setAppointmentsVersion((version) => version + 1); notify(appointment.status === 'APPROVED' ? 'Tu cita fue aprobada.' : 'Tu solicitud quedó pendiente de aprobación.'); }} />
    {confirmation && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60"><section className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-3"><CheckCircle2 className="w-10 h-10 text-emerald-600" /><h2 className="text-xl font-bold">{confirmation.status === 'APPROVED' ? 'Cita aprobada' : 'Solicitud registrada'}</h2><p className="text-sm text-slate-600">{confirmation.specialtyName} con {confirmation.professionalName}.</p><p className="text-xs text-slate-500">{confirmation.startAt} · {confirmation.locationName}</p><button type="button" onClick={() => setConfirmation(null)} className="w-full py-2.5 bg-blue-600 text-white text-sm rounded-xl">Entendido</button></section></div>}
  </div>;
}
