import { prisma } from '../config/database.js';
import { effectivePlanFromProfile } from '../services/profile.service.js';
/**
 * Permite acceso solo a usuarios con suscripción activa.
 * Staff (admin/editor) puede pasar para gestionar contenido sin pagar plan.
 */
export async function requirePaidAccess(req, res, next) {
    const effectiveUserId = req.user?.id;
    if (!effectiveUserId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
    }
    const actorId = req.actor?.id ?? effectiveUserId;
    const actorRoles = await prisma.userRole.findMany({
        where: { userId: actorId },
        select: { role: true },
    });
    const isStaff = actorRoles.some((r) => r.role === 'admin' || r.role === 'editor');
    if (isStaff) {
        next();
        return;
    }
    const profile = await prisma.profile.findUnique({
        where: { id: effectiveUserId },
        select: { subscriptionTier: true, subscriptionExpiresAt: true },
    });
    if (!profile) {
        res.status(404).json({ error: 'Perfil no encontrado' });
        return;
    }
    const { plan } = effectivePlanFromProfile(profile);
    if (plan === 'free') {
        res.status(402).json({ error: 'Esta función está disponible solo para usuarios con suscripción activa.' });
        return;
    }
    next();
}
//# sourceMappingURL=subscription.js.map