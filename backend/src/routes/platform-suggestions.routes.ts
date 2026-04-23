import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { platformSuggestionSubmitSchema } from '../schemas/platform-suggestion.schema.js';
import {
  acknowledgePlatformSuggestionPrompt,
  submitPlatformSuggestion,
} from '../services/platform-suggestion.service.js';

export const platformSuggestionsRouter = Router();

platformSuggestionsRouter.post(
  '/',
  authenticate,
  validateBody(platformSuggestionSubmitSchema),
  async (req, res, next) => {
    try {
      if (!req.user || !req.actor) throw new Error('No user');
      if (req.actor.id !== req.user.id) {
        res.status(403).json({ error: 'No puedes enviar sugerencias en modo vista' });
        return;
      }
      const result = await submitPlatformSuggestion(req.user.id, {
        message: req.body.message,
        ...(req.body.source != null ? { source: req.body.source } : {}),
      });
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

platformSuggestionsRouter.post('/prompt-handled', authenticate, async (req, res, next) => {
  try {
    if (!req.user || !req.actor) throw new Error('No user');
    if (req.actor.id !== req.user.id) {
      res.status(403).json({ error: 'No puedes modificar esto en modo vista' });
      return;
    }
    const result = await acknowledgePlatformSuggestionPrompt(req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});
