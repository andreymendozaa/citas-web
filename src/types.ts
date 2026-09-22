export type ScreenType = 'login' | 'register' | 'dashboard';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  insuranceId?: string;
  avatarUrl?: string;
  roles?: string[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  rating: number;
  reviewsCount: number;
  availableDays: string[];
  price: number;
  avatar: string;
  experienceYears: number;
  consultationType: 'presencial' | 'videoconsulta' | 'ambas';
}

export type AppointmentStatus = 'confirmada' | 'pendiente' | 'completada' | 'cancelada';

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  patientId: string;
  patientName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  room?: string;
  type: 'presencial' | 'videoconsulta';
  meetUrl?: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  prepInstructions?: string[];
  prescription?: {
    diagnosis: string;
    medicines: { name: string; dose: string; frequency: string; duration: string }[];
    notes: string;
  };
}

export interface Specialty {
  id: string;
  name: string;
  iconName: string;
  doctorCount: number;
  description: string;
}
