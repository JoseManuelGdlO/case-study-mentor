import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.js';
import { requireCaseEditor } from '../middleware/roles.js';
import { env } from '../config/env.js';
export const uploadRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const ext = (mime) => {
    if (mime === 'image/png')
        return '.png';
    if (mime === 'image/jpeg' || mime === 'image/jpg')
        return '.jpg';
    if (mime === 'image/webp')
        return '.webp';
    if (mime === 'image/gif')
        return '.gif';
    return '';
};
uploadRouter.post('/image', authenticate, requireCaseEditor(), upload.single('file'), (req, res) => {
    const file = req.file;
    if (!file?.buffer) {
        res.status(400).json({ error: 'Archivo requerido' });
        return;
    }
    const e = ext(file.mimetype);
    if (!e) {
        res.status(400).json({ error: 'Tipo de imagen no soportado' });
        return;
    }
    const dir = path.resolve(process.cwd(), env.UPLOAD_DIR);
    fs.mkdirSync(dir, { recursive: true });
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${e}`;
    const dest = path.join(dir, name);
    fs.writeFileSync(dest, file.buffer);
    const url = `/uploads/${name}`;
    res.json({ data: { url } });
});
//# sourceMappingURL=upload.routes.js.map