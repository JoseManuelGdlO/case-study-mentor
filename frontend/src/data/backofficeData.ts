export interface SystemUser {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'monthly' | 'semester' | 'annual';
  status: 'active' | 'suspended';
  registeredAt: string;
  lastAccess: string;
  examsCompleted: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor';
  createdAt: string;
}

export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  freeUsers: number;
  monthlySubscribers: number;
  semesterSubscribers: number;
  annualSubscribers: number;
  totalCases: number;
  totalQuestions: number;
  estimatedRevenue: number;
  avgAccuracy: number;
  abandonRate: number;
}

export const mockSystemUsers: SystemUser[] = [
  { id: 'u1', name: 'Carlos Méndez', email: 'carlos.mendez@gmail.com', plan: 'annual', status: 'active', registeredAt: '2024-01-10', lastAccess: '2024-03-27', examsCompleted: 45 },
  { id: 'u2', name: 'Ana Rodríguez', email: 'ana.rdz@hotmail.com', plan: 'monthly', status: 'active', registeredAt: '2024-02-15', lastAccess: '2024-03-26', examsCompleted: 12 },
  { id: 'u3', name: 'Luis García', email: 'luis.garcia@outlook.com', plan: 'free', status: 'active', registeredAt: '2024-03-01', lastAccess: '2024-03-25', examsCompleted: 3 },
  { id: 'u4', name: 'María López', email: 'maria.lopez@gmail.com', plan: 'semester', status: 'active', registeredAt: '2024-01-20', lastAccess: '2024-03-27', examsCompleted: 30 },
  { id: 'u5', name: 'Pedro Sánchez', email: 'pedro.sanchez@gmail.com', plan: 'free', status: 'suspended', registeredAt: '2024-02-01', lastAccess: '2024-02-28', examsCompleted: 1 },
  { id: 'u6', name: 'Diana Torres', email: 'diana.torres@yahoo.com', plan: 'annual', status: 'active', registeredAt: '2023-11-15', lastAccess: '2024-03-27', examsCompleted: 68 },
  { id: 'u7', name: 'Roberto Flores', email: 'rob.flores@gmail.com', plan: 'monthly', status: 'active', registeredAt: '2024-03-10', lastAccess: '2024-03-26', examsCompleted: 5 },
  { id: 'u8', name: 'Sofía Ramírez', email: 'sofia.rmz@hotmail.com', plan: 'free', status: 'active', registeredAt: '2024-03-20', lastAccess: '2024-03-24', examsCompleted: 2 },
  { id: 'u9', name: 'Javier Hernández', email: 'javier.hdz@gmail.com', plan: 'semester', status: 'active', registeredAt: '2024-01-05', lastAccess: '2024-03-27', examsCompleted: 38 },
  { id: 'u10', name: 'Valentina Cruz', email: 'val.cruz@outlook.com', plan: 'annual', status: 'active', registeredAt: '2023-12-01', lastAccess: '2024-03-27', examsCompleted: 52 },
];

export const mockAdminUsers: AdminUser[] = [
  { id: 'a1', name: 'Dr. Fernando Reyes', email: 'f.reyes@enarmprep.com', role: 'admin', createdAt: '2023-10-01' },
  { id: 'a2', name: 'Dra. Patricia Vega', email: 'p.vega@enarmprep.com', role: 'editor', createdAt: '2023-11-15' },
  { id: 'a3', name: 'Dr. Alejandro Ruiz', email: 'a.ruiz@enarmprep.com', role: 'editor', createdAt: '2024-01-10' },
  { id: 'a4', name: 'Dra. Camila Ortega', email: 'c.ortega@enarmprep.com', role: 'editor', createdAt: '2024-02-20' },
];

export const mockPlanConfigs: PlanConfig[] = [
  { id: 'monthly', name: 'Mensual', price: 200, period: 'mes', description: 'Acceso completo por 1 mes' },
  { id: 'semester', name: 'Semestral', price: 1000, period: '6 meses', description: 'Ahorra $200 vs mensual' },
  { id: 'annual', name: 'Anual', price: 2100, period: '12 meses', description: 'Mejor valor — Ahorra $300' },
];

export const mockSystemMetrics: SystemMetrics = {
  totalUsers: 1247,
  activeUsers: 892,
  freeUsers: 634,
  monthlySubscribers: 245,
  semesterSubscribers: 189,
  annualSubscribers: 179,
  totalCases: 156,
  totalQuestions: 624,
  estimatedRevenue: 423500,
  avgAccuracy: 71.3,
  abandonRate: 12.5,
};

export const mockWeeklyNewUsers = [
  { week: 'Sem 1', users: 32 },
  { week: 'Sem 2', users: 28 },
  { week: 'Sem 3', users: 45 },
  { week: 'Sem 4', users: 38 },
  { week: 'Sem 5', users: 52 },
  { week: 'Sem 6', users: 41 },
  { week: 'Sem 7', users: 60 },
  { week: 'Sem 8', users: 55 },
];

export const mockWeeklyExams = [
  { week: 'Sem 1', exams: 120 },
  { week: 'Sem 2', exams: 145 },
  { week: 'Sem 3', exams: 160 },
  { week: 'Sem 4', exams: 138 },
  { week: 'Sem 5', exams: 175 },
  { week: 'Sem 6', exams: 190 },
  { week: 'Sem 7', exams: 210 },
  { week: 'Sem 8', exams: 195 },
];

export const mockTopSpecialties = [
  { name: 'Medicina Interna', exams: 420 },
  { name: 'Pediatría', exams: 310 },
  { name: 'Ginecología y Obstetricia', exams: 280 },
  { name: 'Cirugía', exams: 245 },
  { name: 'Urgencias', exams: 180 },
];

export const mockPerformanceBySpecialty = [
  { specialty: 'Medicina Interna', accuracy: 74 },
  { specialty: 'Pediatría', accuracy: 69 },
  { specialty: 'Ginecología', accuracy: 72 },
  { specialty: 'Cirugía', accuracy: 65 },
  { specialty: 'Urgencias', accuracy: 78 },
];

export const mockPlanDistribution = [
  { name: 'Free', value: 634, fill: 'hsl(var(--muted-foreground))' },
  { name: 'Mensual', value: 245, fill: 'hsl(var(--secondary))' },
  { name: 'Semestral', value: 189, fill: 'hsl(var(--primary))' },
  { name: 'Anual', value: 179, fill: 'hsl(var(--success))' },
];

export const mockMostFailedQuestions = [
  { id: 'q-fail-1', text: 'Manejo de crisis hipertensiva en embarazo', specialty: 'Ginecología', failRate: 68 },
  { id: 'q-fail-2', text: 'Diagnóstico diferencial de ictericia neonatal', specialty: 'Pediatría', failRate: 62 },
  { id: 'q-fail-3', text: 'Clasificación de fracturas de pelvis', specialty: 'Cirugía', failRate: 58 },
  { id: 'q-fail-4', text: 'Criterios de Wells para TEP', specialty: 'Medicina Interna', failRate: 55 },
  { id: 'q-fail-5', text: 'Tratamiento de cetoacidosis diabética', specialty: 'Medicina Interna', failRate: 52 },
];
