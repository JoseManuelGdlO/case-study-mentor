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
              difficulty: 'medium',
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
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
