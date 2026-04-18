import type { FaqItem } from '@/components/Seo';

/** Preguntas visibles en /precios y en JSON-LD FAQPage — mantener sincronizado */
export const PRECIO_FAQ_ITEMS: FaqItem[] = [
  {
    question: '¿Los precios están en pesos mexicanos?',
    answer:
      'Sí. Todos los montos mostrados en la página de precios están en MXN (pesos mexicanos), incluidos los planes de suscripción recurrente.',
  },
  {
    question: '¿Puedo empezar sin pagar?',
    answer:
      'Sí. Puedes crear una cuenta gratuita y usar las funciones del plan gratuito. Cuando quieras, puedes suscribirte a un plan de pago desde tu perfil.',
  },
  {
    question: '¿Cómo cancelo la suscripción?',
    answer:
      'Puedes cancelar en cualquier momento desde la sección de suscripción en tu perfil. El acceso a las funciones de pago permanece hasta el fin del periodo ya pagado, según lo indicado en la app.',
  },
  {
    question: '¿El cargo es recurrente?',
    answer:
      'Los planes de pago son suscripciones recurrentes en la periodicidad que elijas (por ejemplo mensual o anual), hasta que canceles desde tu cuenta.',
  },
];
