import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@enarm.test';
  const existing = await prisma.profile.findUnique({ where: { email } });
  if (!existing) {
    const hash = await bcrypt.hash('Admin12345678', 12);
    await prisma.profile.create({
      data: {
        email,
        password: hash,
        authProvider: 'email',
        firstName: 'Admin',
        lastName: 'ENARM',
        roles: { create: [{ role: 'admin' }, { role: 'user' }] },
      },
    });
    console.log('Created admin:', email, '/ Admin12345678');
  }

  const specCount = await prisma.specialty.count();
  if (specCount === 0) {
    const s = await prisma.specialty.create({
      data: {
        name: 'Medicina Interna',
        areas: {
          create: [{ name: 'Cardiología' }, { name: 'Neurología' }],
        },
      },
      include: { areas: true },
    });
    const area = s.areas[0];
    await prisma.clinicalCase.create({
      data: {
        specialtyId: s.id,
        areaId: area.id,
        topic: 'Caso demo',
        language: 'es',
        text: 'Paciente de demostración para pruebas de la API.',
        status: 'published',
        questions: {
          create: [
            {
              text: '¿Pregunta demo?',
              summary: 'Resumen breve.',
              bibliography: 'Demo.',
              difficultyLevel: 2,
              cognitiveCompetence: false,
              previousEnarmPresence: false,
              hint: '',
              orderIndex: 0,
              options: {
                create: [
                  { label: 'A', text: 'Opción A', isCorrect: false, explanation: 'No.' },
                  { label: 'B', text: 'Opción B', isCorrect: true, explanation: 'Sí.' },
                  { label: 'C', text: 'Opción C', isCorrect: false, explanation: 'No.' },
                  { label: 'D', text: 'Opción D', isCorrect: false, explanation: 'No.' },
                ],
              },
            },
          ],
        },
      },
    });
    console.log('Seeded specialty + demo case');
  }

  const planCount = await prisma.subscriptionPlan.count();
  if (planCount === 0) {
    await prisma.subscriptionPlan.createMany({
      data: [
        {
          name: 'Plan mensual ENARM',
          price: 200,
          duration: 30,
          features: 'Exámenes ilimitados\nEstadísticas',
          isActive: true,
          highlighted: false,
          tier: 'monthly',
        },
        {
          name: 'Plan semestral ENARM',
          price: 1000,
          duration: 180,
          features: 'Exámenes ilimitados\nEstadísticas\nAhorro vs mensual',
          isActive: true,
          highlighted: false,
          tier: 'semester',
        },
        {
          name: 'Plan anual ENARM',
          price: 2100,
          duration: 365,
          features: 'Exámenes ilimitados\nEstadísticas\nMejor valor',
          isActive: true,
          highlighted: true,
          tier: 'annual',
        },
      ],
    });
    console.log('Seeded subscription_plans (precios backoffice)');
  }

  const phraseCount = await prisma.motivationalPhrase.count();
  if (phraseCount === 0) {
    await prisma.motivationalPhrase.createMany({
      data: [
        {
          text: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.',
          author: 'Robert Collier',
          isActive: true,
        },
        {
          text: 'Cree que puedes y ya estás a medio camino.',
          author: 'Theodore Roosevelt',
          isActive: true,
        },
        {
          text: 'La disciplina es el puente entre metas y logros.',
          author: 'Jim Rohn',
          isActive: true,
        },
        {
          text: 'No hay atajos para ningún lugar al que merezca la pena ir.',
          author: 'Beverly Sills',
          isActive: true,
        },
        {
          text: 'La constancia vence lo que la dicha no alcanza.',
          author: 'Proverbio',
          isActive: true,
        },
        {
          text: 'Cada caso que resuelves fortalece tu criterio clínico para el ENARM.',
          author: 'ENARM Mentor',
          isActive: true,
        },
        {
          text: 'Estudiar medicina es un maratón: ritmo sostenido vence al sprint del último día.',
          author: 'ENARM Mentor',
          isActive: true,
        },
        {
          text: 'El conocimiento se construye con repaso activo, no solo con lectura pasiva.',
          author: 'ENARM Mentor',
          isActive: true,
        },
        {
          text: 'Lo que no se revisa se olvida; lo que se aplica, se queda.',
          author: 'ENARM Mentor',
          isActive: true,
        },
        {
          text: 'Tu futuro paciente confía en que hoy eliges prepararte con seriedad.',
          author: 'ENARM Mentor',
          isActive: true,
        },
      ],
    });
    console.log('Seeded motivational_phrases (banner)');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
