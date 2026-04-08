import { APP_NAME } from '@/lib/site';

export type SharePlatform = 'whatsapp' | 'facebook' | 'instagram';

type ShareTextInput = {
  score: number;
  correct: number;
  totalAnswered: number;
  examUrl?: string;
};

type SharePredictionInput = {
  specialty: string;
  placementProbability: number;
  estimatedPercentile: number;
  examUrl?: string;
};

type ShareImageInput = {
  title: string;
  subtitle: string;
  highlightA: string;
  highlightB: string;
  footer: string;
};

export function buildResultShareText(input: ShareTextInput): string {
  const lines = [
    `Termine mi examen en ${APP_NAME}.`,
    `Calificacion: ${Math.round(input.score)}% (${input.correct}/${input.totalAnswered} correctas).`,
    'Sigo preparandome para el ENARM.',
  ];
  if (input.examUrl) lines.push(input.examUrl);
  return lines.join('\n');
}

export function buildPredictionShareText(input: SharePredictionInput): string {
  const lines = [
    `Mi prediccion ENARM en ${APP_NAME}:`,
    `${input.specialty} -> ${Math.round(input.placementProbability)}% probabilidad de plaza, P${Math.round(input.estimatedPercentile)}.`,
    'Seguimos mejorando cada simulador.',
  ];
  if (input.examUrl) lines.push(input.examUrl);
  return lines.join('\n');
}

export function buildPlatformUrl(platform: SharePlatform, text: string, url?: string): string | null {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url ?? window.location.href);
  if (platform === 'whatsapp') {
    return `https://wa.me/?text=${encodedText}`;
  }
  if (platform === 'facebook') {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
  }
  return null;
}

export async function shareWithFallback(title: string, text: string, url?: string): Promise<'native' | 'clipboard'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    await navigator.share({ title, text, url });
    return 'native';
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return 'clipboard';
  }
  throw new Error('No se pudo compartir ni copiar al portapapeles en este dispositivo');
}

export async function copyText(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Este navegador no permite copiar al portapapeles');
  }
  await navigator.clipboard.writeText(text);
}

export function openShareUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function generateShareImage(input: ShareImageInput): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo generar la imagen para compartir');

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#1d4ed8');
  gradient.addColorStop(1, '#7c3aed');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(64, 64, 952, 952);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 64px Inter, Arial, sans-serif';
  wrapText(ctx, input.title, 96, 220, 888, 84);

  ctx.font = '500 40px Inter, Arial, sans-serif';
  wrapText(ctx, input.subtitle, 96, 380, 888, 54);

  ctx.font = '700 88px Inter, Arial, sans-serif';
  ctx.fillText(input.highlightA, 96, 580);
  ctx.fillText(input.highlightB, 96, 720);

  ctx.font = '400 34px Inter, Arial, sans-serif';
  wrapText(ctx, input.footer, 96, 860, 888, 44);

  ctx.font = '600 30px Inter, Arial, sans-serif';
  ctx.fillStyle = '#dbeafe';
  ctx.fillText(APP_NAME, 96, 980);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('No se pudo crear la imagen PNG');
  return blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export async function shareImageOrDownload(blob: Blob, filename: string, textToCopy: string): Promise<'native-file' | 'downloaded'> {
  if (typeof navigator !== 'undefined' && navigator.share && typeof File !== 'undefined') {
    const file = new File([blob], filename, { type: 'image/png' });
    const canShare = typeof navigator.canShare === 'function' ? navigator.canShare({ files: [file] }) : true;
    if (canShare) {
      await navigator.share({ files: [file], text: textToCopy, title: APP_NAME });
      return 'native-file';
    }
  }

  downloadBlob(blob, filename);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(textToCopy);
  }
  return 'downloaded';
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, currentY);
      line = `${word} `;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line.trim(), x, currentY);
}
