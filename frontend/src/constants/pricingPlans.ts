import type { UserPlan } from '@/contexts/UserContext';

export type PaidSubscriptionPlanId = Exclude<UserPlan, 'free'>;

export interface SubscriptionPricingPlan {
  id: PaidSubscriptionPlanId;
  name: string;
  price: number;
  period: string;
  monthly: number;
  savings?: string;
  popular?: boolean;
}

export const subscriptionPricingPlans: SubscriptionPricingPlan[] = [
  { id: 'monthly', name: 'Mensual', price: 200, period: '/mes', monthly: 200 },
  { id: 'semester', name: 'Semestral', price: 1000, period: '/6 meses', monthly: 167, savings: 'Ahorra $200' },
  { id: 'annual', name: 'Anual', price: 2100, period: '/año', monthly: 175, savings: 'Ahorra $300', popular: true },
];

export const paidPlanFeatureBullets: string[] = [
  'Plan de hoy completo (bloque diario)',
  'Exámenes ilimitados',
  'Todas las preguntas',
  'Estadísticas completas',
  'Explicaciones detalladas',
  'Bibliografía incluida',
];

export const freePlanTitle = 'Gratis';

export const freePlanDescription =
  'Crea una cuenta sin costo e incluye hasta 2 exámenes de prueba de 10 preguntas cada uno.';

export const freePlanBullets: string[] = [
  'Registro sin tarjeta',
  '2 exámenes de prueba (10 preguntas c/u)',
  'Ideal para conocer la plataforma',
];
