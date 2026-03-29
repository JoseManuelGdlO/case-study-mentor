import { prisma } from '../config/database.js';
export function requireRole(...roles) {
    return async (req, res, next) => {
        if (!req.user?.id) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        const userRoles = await prisma.userRole.findMany({ where: { userId: req.user.id } });
        const hasRole = userRoles.some((ur) => roles.includes(ur.role));
        if (!hasRole) {
            res.status(403).json({ error: 'Sin permisos' });
            return;
        }
        req.roles = userRoles.map((r) => r.role);
        next();
    };
}
/** admin or editor */
export function requireCaseEditor() {
    return requireRole('admin', 'editor');
}
export function requireAdmin() {
    return requireRole('admin');
}
//# sourceMappingURL=roles.js.map