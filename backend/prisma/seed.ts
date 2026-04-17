import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

  const communityCount = await prisma.communityThread.count();
  if (communityCount < 25) {
    const users = await prisma.profile.findMany({
      select: { id: true },
    });
    const specialties = await prisma.specialty.findMany({
      select: { id: true },
    });

    if (users.length >= 2) {
      const topics = [
        'Duda sobre manejo inicial en urgencias',
        'Consejos para resolver casos de cardiología',
        'Cómo mejorar rendimiento en simuladores',
        'Repaso rápido de choque séptico',
        'Errores comunes en preguntas de pediatría',
        'Estrategia para estudiar gineco-obstetricia',
        '¿Cómo priorizar temas de alta frecuencia?',
        'Discusión de caso clínico neurológico',
        'Tips para interpretar gasometría arterial',
        'Diferencias clave entre guías clínicas',
      ];

      const bodies = [
        '<p>Comparto esta pregunta porque me costó decidir la conducta inicial 😵‍💫.</p><p><strong>¿Qué algoritmo usan</strong> para priorizar diagnósticos en guardia?</p>',
        '<p>En mis últimos simuladores he fallado en este tema 😓.</p><ul><li>¿Qué repasan primero?</li><li>¿Qué trampas del ENARM han visto?</li></ul>',
        '<p>Dejo el escenario clínico resumido para discutir razonamiento 🧠.</p><blockquote><p>Paciente con dolor torácico + diaforesis + hipotensión.</p></blockquote>',
        '<p>¿Qué bibliografía recomiendan para reforzar este tema sin perder tiempo? 📚</p><p>Busco algo práctico y de alta frecuencia.</p>',
        '<p>Me gustaría comparar estrategias entre quienes ya subieron su puntaje 🚀.</p><p>Gracias por compartir tips reales 🙌.</p>',
      ];

      const replyTemplates = [
        '<p>Yo lo abordo primero por <strong>estabilidad hemodinámica</strong> y luego diferencial ✅.</p>',
        '<p>Me funcionó repasar guías con tarjetas + preguntas dirigidas 🎯.</p>',
        '<p>Buen caso 👏. La clave para mí es identificar signos de alarma desde el inicio.</p>',
        '<p>Coincido, y además revisaría criterios diagnósticos para evitar confusiones frecuentes.</p>',
        '<p>Gracias por compartir 🙏, estas discusiones ayudan muchísimo para fijar conceptos.</p>',
      ];

      const threadsToCreate = 30 - communityCount;
      const createCount = Math.max(0, threadsToCreate);

      for (let i = 0; i < createCount; i++) {
        const author = randomItem(users);
        const maybeSpecialty = Math.random() > 0.25 && specialties.length > 0 ? randomItem(specialties).id : null;

        const thread = await prisma.communityThread.create({
          data: {
            authorId: author.id,
            specialtyId: maybeSpecialty,
            title: `${randomItem(topics)} #${i + 1}`,
            body: randomItem(bodies),
          },
        });

        const replies = randomInt(1, 5);
        for (let j = 0; j < replies; j++) {
          const replyAuthor = randomItem(users);
          await prisma.communityPost.create({
            data: {
              threadId: thread.id,
              authorId: replyAuthor.id,
              body: randomItem(replyTemplates),
            },
          });
        }
      }

      console.log(`Seeded community threads/posts. Threads now: >= ${Math.max(communityCount, 30)}`);
    } else {
      console.log('Skipped community seed: not enough users');
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
