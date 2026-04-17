import { MentorshipStatus } from '@prisma/client';
import { prisma } from '../config/database.js';

function notFound(message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = 404;
  return err;
}

function badRequest(message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = 400;
  return err;
}

const allowedTransitions: Record<MentorshipStatus, MentorshipStatus[]> = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['scheduled', 'cancelled'],
  rejected: [],
  scheduled: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export async function createRequest(
  studentId: string,
  body: { topic: string; context?: string | null; availability?: string | null; specialtyId?: string | null }
) {
  const request = await prisma.mentorshipRequest.create({
    data: {
      studentId,
      topic: body.topic,
      context: body.context ?? null,
      availability: body.availability ?? null,
      specialtyId: body.specialtyId ?? null,
    },
    include: {
      mentor: { select: { id: true, firstName: true, lastName: true } },
      student: { select: { id: true, firstName: true, lastName: true } },
      specialty: { select: { id: true, name: true } },
    },
  });
  return {
    data: serializeRequest(request),
  };
}

export async function listMine(studentId: string) {
  const requests = await prisma.mentorshipRequest.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    include: {
      mentor: { select: { id: true, firstName: true, lastName: true } },
      student: { select: { id: true, firstName: true, lastName: true } },
      specialty: { select: { id: true, name: true } },
    },
  });
  return { data: requests.map(serializeRequest) };
}

export async function listForStaff(params: { status?: MentorshipStatus; page: number; limit: number }) {
  const skip = (params.page - 1) * params.limit;
  const where = params.status ? { status: params.status } : {};
  const [total, requests] = await Promise.all([
    prisma.mentorshipRequest.count({ where }),
    prisma.mentorshipRequest.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: params.limit,
      include: {
        mentor: { select: { id: true, firstName: true, lastName: true } },
        student: { select: { id: true, firstName: true, lastName: true } },
        specialty: { select: { id: true, name: true } },
      },
    }),
  ]);

  return { data: requests.map(serializeRequest), page: params.page, limit: params.limit, total };
}

export async function updateStatus(
  requestId: string,
  actorId: string,
  body: {
    status: MentorshipStatus;
    statusNote?: string | null;
    scheduledAt?: string | null;
    externalMeetingUrl?: string | null;
  }
) {
  const current = await prisma.mentorshipRequest.findUnique({
    where: { id: requestId },
    include: {
      mentor: { select: { id: true, firstName: true, lastName: true } },
      student: { select: { id: true, firstName: true, lastName: true } },
      specialty: { select: { id: true, name: true } },
    },
  });
  if (!current) throw notFound('Solicitud de mentoría no encontrada');

  if (!allowedTransitions[current.status].includes(body.status)) {
    throw badRequest(`No se puede cambiar de ${current.status} a ${body.status}`);
  }
  if (body.status === 'scheduled' && (!body.scheduledAt || !body.externalMeetingUrl)) {
    throw badRequest('Para agendar debes enviar scheduledAt y externalMeetingUrl');
  }

  const updated = await prisma.mentorshipRequest.update({
    where: { id: requestId },
    data: {
      status: body.status,
      statusNote: body.statusNote ?? current.statusNote,
      mentorId: current.mentorId ?? actorId,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : current.scheduledAt,
      externalMeetingUrl: body.externalMeetingUrl ?? current.externalMeetingUrl,
    },
    include: {
      mentor: { select: { id: true, firstName: true, lastName: true } },
      student: { select: { id: true, firstName: true, lastName: true } },
      specialty: { select: { id: true, name: true } },
    },
  });

  return { data: serializeRequest(updated) };
}

function serializeRequest(request: {
  id: string;
  topic: string;
  context: string | null;
  availability: string | null;
  status: MentorshipStatus;
  statusNote: string | null;
  externalMeetingUrl: string | null;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  student: { id: string; firstName: string; lastName: string };
  mentor: { id: string; firstName: string; lastName: string } | null;
  specialty: { id: string; name: string } | null;
}) {
  return {
    id: request.id,
    topic: request.topic,
    context: request.context,
    availability: request.availability,
    status: request.status,
    statusNote: request.statusNote,
    externalMeetingUrl: request.externalMeetingUrl,
    scheduledAt: request.scheduledAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    student: {
      id: request.student.id,
      name: `${request.student.firstName} ${request.student.lastName}`.trim(),
    },
    mentor: request.mentor
      ? {
          id: request.mentor.id,
          name: `${request.mentor.firstName} ${request.mentor.lastName}`.trim(),
        }
      : null,
    specialty: request.specialty,
  };
}
