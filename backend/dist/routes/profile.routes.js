import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { changePasswordSchema, profileUpdateSchema, wellbeingNotificationPreferencesSchema, wellbeingPushSubscribeSchema, wellbeingPushUnsubscribeSchema, } from '../schemas/profile.schema.js';
import * as profileService from '../services/profile.service.js';
import { getUserVapidPublicKey, isUserPushConfigured, getUserWellbeingNotificationPreferences, subscribeUserPush, unsubscribeUserPush, updateUserWellbeingNotificationPreferences, } from '../services/user-push.service.js';
export const profileRouter = Router();
profileRouter.get('/', authenticate, async (req, res, next) => {
    try {
        if (!req.user || !req.actor)
            throw new Error('No user');
        const result = await profileService.getProfile(req.user.id);
        if (req.actor.id !== req.user.id) {
            res.json({
                ...result,
                data: {
                    ...result.data,
                    impersonation: { actorEmail: req.actor.email },
                },
            });
            return;
        }
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
profileRouter.put('/', authenticate, validateBody(profileUpdateSchema), async (req, res, next) => {
    try {
        if (!req.user || !req.actor)
            throw new Error('No user');
        if (req.actor.id !== req.user.id) {
            res.status(403).json({ error: 'No puedes editar el perfil en modo vista' });
            return;
        }
        const result = await profileService.updateProfile(req.user.id, req.body);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
profileRouter.post('/password', authenticate, validateBody(changePasswordSchema), async (req, res, next) => {
    try {
        if (!req.user || !req.actor)
            throw new Error('No user');
        if (req.actor.id !== req.user.id) {
            res.status(403).json({ error: 'No puedes cambiar la contraseña en modo vista' });
            return;
        }
        const { currentPassword, newPassword } = req.body;
        const result = await profileService.changePassword(req.user.id, {
            currentPassword,
            newPassword,
        });
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
profileRouter.put('/onboarding', authenticate, async (req, res, next) => {
    try {
        if (!req.user || !req.actor)
            throw new Error('No user');
        if (req.actor.id !== req.user.id) {
            res.status(403).json({ error: 'No puedes completar el onboarding en modo vista' });
            return;
        }
        const result = await profileService.completeOnboarding(req.user.id);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
profileRouter.get('/wellbeing-notifications', authenticate, async (req, res, next) => {
    try {
        if (!req.user || !req.actor)
            throw new Error('No user');
        const prefs = await getUserWellbeingNotificationPreferences(req.user.id);
        res.json({
            data: {
                pushConfigured: isUserPushConfigured(),
                vapidPublicKey: getUserVapidPublicKey(),
                wellbeingPushEnabled: prefs?.wellbeingPushEnabled ?? false,
                wellbeingReminderTime: prefs?.wellbeingReminderTime ?? null,
                wellbeingReminderDays: prefs?.wellbeingReminderDays
                    ? prefs.wellbeingReminderDays.split(',').filter(Boolean)
                    : [],
            },
        });
    }
    catch (e) {
        next(e);
    }
});
profileRouter.post('/wellbeing-notifications/subscription', authenticate, validateBody(wellbeingPushSubscribeSchema), async (req, res, next) => {
    try {
        if (!req.user || !req.actor)
            throw new Error('No user');
        if (req.actor.id !== req.user.id) {
            res.status(403).json({ error: 'No puedes modificar notificaciones en modo vista' });
            return;
        }
        await subscribeUserPush(req.user.id, req.body);
        res.status(201).json({ data: { ok: true } });
    }
    catch (e) {
        next(e);
    }
});
profileRouter.delete('/wellbeing-notifications/subscription', authenticate, validateBody(wellbeingPushUnsubscribeSchema), async (req, res, next) => {
    try {
        if (!req.user || !req.actor)
            throw new Error('No user');
        if (req.actor.id !== req.user.id) {
            res.status(403).json({ error: 'No puedes modificar notificaciones en modo vista' });
            return;
        }
        await unsubscribeUserPush(req.user.id, req.body.endpoint);
        res.json({ data: { ok: true } });
    }
    catch (e) {
        next(e);
    }
});
profileRouter.patch('/wellbeing-notifications/preferences', authenticate, validateBody(wellbeingNotificationPreferencesSchema), async (req, res, next) => {
    try {
        if (!req.user || !req.actor)
            throw new Error('No user');
        if (req.actor.id !== req.user.id) {
            res.status(403).json({ error: 'No puedes modificar notificaciones en modo vista' });
            return;
        }
        const updated = await updateUserWellbeingNotificationPreferences(req.user.id, {
            wellbeingPushEnabled: req.body.wellbeingPushEnabled,
            wellbeingReminderTime: req.body.wellbeingReminderTime,
            wellbeingReminderDays: req.body.wellbeingReminderDays,
        });
        res.json({
            data: {
                wellbeingPushEnabled: updated.wellbeingPushEnabled,
                wellbeingReminderTime: updated.wellbeingReminderTime,
                wellbeingReminderDays: updated.wellbeingReminderDays
                    ? updated.wellbeingReminderDays.split(',').filter(Boolean)
                    : [],
            },
        });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=profile.routes.js.map