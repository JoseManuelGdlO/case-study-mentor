import nodemailer from 'nodemailer';
import { env, getFrontendBaseUrl } from '../config/env.js';

/** Usa process.env tras dotenv: evita desajustes si env se evaluó antes de cargar SMTP. */
export function isSmtpConfigured(): boolean {
  const host = (process.env.SMTP_HOST ?? env.SMTP_HOST ?? '').trim();
  const fromAddr = (process.env.SMTP_FROM ?? env.SMTP_FROM ?? '').trim();
  return host.length > 0 && fromAddr.length > 0;
}

function smtpHost(): string {
  return (process.env.SMTP_HOST ?? env.SMTP_HOST ?? '').trim();
}

function smtpFrom(): string {
  return (process.env.SMTP_FROM ?? env.SMTP_FROM ?? '').trim();
}

function smtpPort(): number {
  const raw = process.env.SMTP_PORT ?? env.SMTP_PORT;
  if (raw === undefined || raw === '') return 587;
  const n = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : 587;
}

function smtpSecure(port: number): boolean {
  const raw = process.env.SMTP_SECURE ?? env.SMTP_SECURE;
  if (raw === true || raw === 'true' || raw === '1') return true;
  if (raw === false || raw === 'false' || raw === '0') return false;
  return port === 465;
}

function smtpAuth(): { user: string; pass: string } | undefined {
  const user = (process.env.SMTP_USER ?? env.SMTP_USER ?? '').trim();
  const pass = process.env.SMTP_PASS ?? env.SMTP_PASS ?? '';
  if (user && pass) return { user, pass };
  return undefined;
}

function createTransporter() {
  if (!isSmtpConfigured()) return null;
  const host = smtpHost();
  const port = smtpPort();
  const secure = smtpSecure(port);
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: smtpAuth(),
  });
}

function profileUrl(): string {
  return `${getFrontendBaseUrl()}/dashboard/profile`;
}

export async function sendTemporaryPasswordEmail(to: string, plainPassword: string): Promise<void> {
  const loginUrl = `${getFrontendBaseUrl()}/login`;
  const perfil = profileUrl();
  const subject = 'Contraseña temporal — recuperación de acceso';
  const text = [
    'Hola,',
    '',
    'Has solicitado restablecer el acceso a tu cuenta. Tu contraseña temporal es:',
    '',
    plainPassword,
    '',
    'Pasos siguientes:',
    `1) Entra en ${loginUrl} e inicia sesión con tu correo y esta contraseña temporal.`,
    `2) Ve a Mi perfil → Seguridad (${perfil}).`,
    '3) Escribe tu contraseña actual (la temporal), luego tu nueva contraseña dos veces y confirma el cambio.',
    '',
    'Por seguridad, cambia la contraseña temporal cuanto antes.',
    '',
    'Si no solicitaste este correo, ignóralo.',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p>Hola,</p>
  <p>Has solicitado restablecer el acceso a tu cuenta. Tu <strong>contraseña temporal</strong> es:</p>
  <p style="font-size: 1.1rem; font-weight: 600; letter-spacing: 0.05em;">${escapeHtml(plainPassword)}</p>
  <p><strong>Qué hacer ahora</strong></p>
  <ol>
    <li>Inicia sesión en <a href="${loginUrl}">la plataforma</a> con tu correo y la contraseña temporal.</li>
    <li>Abre <a href="${perfil}">Mi perfil → Seguridad</a>.</li>
    <li>Indica la contraseña actual (la temporal), escribe la nueva contraseña dos veces y confirma.</li>
  </ol>
  <p style="color: #555;">Cambia la contraseña temporal cuanto antes. Si no fuiste tú, ignora este mensaje.</p>
</body>
</html>`.trim();

  const transporter = createTransporter();
  if (transporter) {
    await transporter.sendMail({
      from: smtpFrom(),
      to,
      subject,
      text,
      html,
    });
    return;
  }

  console.warn('[email] SMTP no configurado — contraseña temporal (solo desarrollo):', {
    to,
    plainPassword,
    loginUrl,
    perfil,
  });
}

export async function sendGoogleAccountNoticeEmail(to: string): Promise<void> {
  const loginUrl = `${getFrontendBaseUrl()}/login`;
  const subject = 'Recuperación de acceso — cuenta con Google';
  const text = [
    'Hola,',
    '',
    'Recibimos una solicitud de recuperación de contraseña para tu correo.',
    'Tu cuenta está vinculada a Google: inicia sesión con el botón "Continuar con Google" en:',
    loginUrl,
    '',
    'No hay contraseña local que restablecer para esta cuenta.',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p>Hola,</p>
  <p>Recibimos una solicitud de recuperación de contraseña para tu correo.</p>
  <p>Tu cuenta está vinculada a <strong>Google</strong>. Inicia sesión con el botón <strong>Continuar con Google</strong> en <a href="${loginUrl}">la página de acceso</a>.</p>
  <p style="color: #555;">No gestionamos una contraseña local para esta cuenta.</p>
</body>
</html>`.trim();

  const transporter = createTransporter();
  if (transporter) {
    await transporter.sendMail({
      from: smtpFrom(),
      to,
      subject,
      text,
      html,
    });
    return;
  }

  console.warn('[email] SMTP no configurado — aviso cuenta Google (solo desarrollo):', { to });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const backofficeUsersUrl = () => `${getFrontendBaseUrl()}/backoffice/users`;

/** Aviso a administradores: registro público nuevo. */
export async function sendAdminNewRegistrationEmail(
  to: string,
  payload: { displayName: string; email: string; userId: string }
): Promise<void> {
  const usersUrl = backofficeUsersUrl();
  const subject = 'Nuevo registro — ENARMX';
  const who = payload.displayName || payload.email;
  const text = [
    'Hay un nuevo registro público en la plataforma.',
    '',
    `Nombre: ${who}`,
    `Correo: ${payload.email}`,
    `ID de usuario: ${payload.userId}`,
    '',
    `Revisa usuarios en: ${usersUrl}`,
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p><strong>Nuevo registro</strong> en ENARMX</p>
  <ul>
    <li>Nombre: ${escapeHtml(who)}</li>
    <li>Correo: ${escapeHtml(payload.email)}</li>
    <li>ID: <code>${escapeHtml(payload.userId)}</code></li>
  </ul>
  <p><a href="${usersUrl}">Abrir usuarios en el backoffice</a></p>
</body>
</html>`.trim();

  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[email] SMTP no configurado — aviso admin registro omitido', { to });
    return;
  }
  await transporter.sendMail({
    from: smtpFrom(),
    to,
    subject,
    text,
    html,
  });
}

/** Aviso a administradores: usuario pasó a plan de pago. */
export async function sendAdminNewSubscriptionEmail(
  to: string,
  payload: { displayName: string; email: string; userId: string; planLabel: string }
): Promise<void> {
  const usersUrl = backofficeUsersUrl();
  const subject = 'Nueva suscripción de pago — ENARMX';
  const who = payload.displayName || payload.email;
  const text = [
    'Un usuario pasó de plan gratuito a un plan de pago.',
    '',
    `Nombre: ${who}`,
    `Correo: ${payload.email}`,
    `Plan: ${payload.planLabel}`,
    `ID de usuario: ${payload.userId}`,
    '',
    `Revisa usuarios en: ${usersUrl}`,
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p><strong>Nueva suscripción de pago</strong> en ENARMX (usuario pasó de gratuito a pago).</p>
  <ul>
    <li>Nombre: ${escapeHtml(who)}</li>
    <li>Correo: ${escapeHtml(payload.email)}</li>
    <li>Plan: ${escapeHtml(payload.planLabel)}</li>
    <li>ID: <code>${escapeHtml(payload.userId)}</code></li>
  </ul>
  <p><a href="${usersUrl}">Abrir usuarios en el backoffice</a></p>
</body>
</html>`.trim();

  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[email] SMTP no configurado — aviso admin suscripción omitido', { to });
    return;
  }
  await transporter.sendMail({
    from: smtpFrom(),
    to,
    subject,
    text,
    html,
  });
}
