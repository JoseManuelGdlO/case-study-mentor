import { PlatformSuggestionSource } from '@prisma/client';
import { prisma } from '../config/database.js';

const MIN_LEN = 10;
const MAX_LEN = 4000;

function normalizeMessage(raw: string): string {
  return raw.trim();
}

export async function submitPlatformSuggestion(
  userId: string,
  body: { message: string; source?: PlatformSuggestionSource }
) {
  const message = normalizeMessage(body.message);
  if (message.length < MIN_LEN || message.length > MAX_LEN) {
    const err = new Error(`El mensaje debe tener entre ${MIN_LEN} y ${MAX_LEN} caracteres`) as Error & {
      status: number;
    };
    err.status = 400;
    throw err;
  }

  const source = body.source ?? PlatformSuggestionSource.mailbox;

  await prisma.$transaction(async (tx) => {
    await tx.platformSuggestion.create({
      data: {
        userId,
        message,
        source,
      },
    });
    await tx.profile.updateMany({
      where: { id: userId, platformSuggestionPromptHandledAt: null },
      data: { platformSuggestionPromptHandledAt: new Date() },
    });
  });

  return { data: { saved: true } };
}

export async function acknowledgePlatformSuggestionPrompt(userId: string) {
  await prisma.profile.updateMany({
    where: { id: userId, platformSuggestionPromptHandledAt: null },
    data: { platformSuggestionPromptHandledAt: new Date() },
  });
  return { data: { ok: true } };
}
