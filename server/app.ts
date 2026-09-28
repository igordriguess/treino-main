import express from 'express';
import { createHash } from 'node:crypto';
import { IMAGE_TYPES, Storage } from './storage.js';

export const COLLECTIONS = ['routines', 'exercises', 'students', 'sessions'] as const;
type Collection = (typeof COLLECTIONS)[number];

interface AdminAccount {
  username: string;
  password: string;
  name: string;
}

interface StudentRecord {
  id: string;
  name: string;
  username: string;
  password: string;
}

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel functions reject bodies above 4.5MB
const UPLOAD_NAME = /^[a-f0-9]{32}\.[a-z]+$/;

const isCollection = (value: string): value is Collection => (COLLECTIONS as readonly string[]).includes(value);

/**
 * Admin login: data/admin.json when it exists, otherwise ADMIN_USERNAME / ADMIN_PASSWORD.
 * Locally it falls back to admin / 1234; on Vercel a password must be configured.
 */
async function loadAdmin(storage: Storage): Promise<AdminAccount | null> {
  const stored = await storage.readJson<AdminAccount | null>('admin', null);
  if (stored) return stored;
  const password = process.env.ADMIN_PASSWORD || (process.env.VERCEL ? '' : '1234');
  if (!password) return null;
  return { username: process.env.ADMIN_USERNAME || 'admin', password, name: 'Administrador' };
}

export function uploadName(body: Buffer, contentType: string): string {
  const hash = createHash('sha256').update(body).digest('hex').slice(0, 32);
  return `${hash}.${IMAGE_TYPES[contentType]}`;
}

export function createApp(storage: Storage) {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/data', async (_req, res) => {
    try {
      const entries = await Promise.all(COLLECTIONS.map(async (c) => [c, await storage.readJson(c, [])] as const));
      res.set('Cache-Control', 'no-store').json(Object.fromEntries(entries));
    } catch (err) {
      console.error('[api] failed to read data', err);
      res.status(500).json({ error: 'Falha ao ler os dados.' });
    }
  });

  app.put('/api/data/:collection', express.json({ limit: '50mb' }), async (req, res) => {
    const { collection } = req.params;
    if (!isCollection(collection)) {
      res.status(404).json({ error: 'Coleção inválida.' });
      return;
    }
    if (!Array.isArray(req.body)) {
      res.status(400).json({ error: 'O corpo da requisição deve ser uma lista.' });
      return;
    }
    try {
      await storage.writeJson(collection, req.body);
      res.json({ ok: true, count: req.body.length });
    } catch (err) {
      console.error(`[api] failed to write ${collection}`, err);
      res.status(500).json({ error: 'Falha ao salvar os dados.' });
    }
  });

  app.post('/api/login', express.json(), async (req, res) => {
    const username = String(req.body?.username ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '').trim();

    try {
      const admin = await loadAdmin(storage);
      if (admin && username === admin.username.toLowerCase() && password === admin.password) {
        res.json({ id: 'admin-master', name: admin.name, username: admin.username, role: 'admin' });
        return;
      }

      const students = await storage.readJson<StudentRecord[]>('students', []);
      const student = students.find((s) => s.username.toLowerCase() === username && s.password === password);
      if (student) {
        res.json({ id: student.id, name: student.name, username: student.username, role: 'student' });
        return;
      }

      res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    } catch (err) {
      console.error('[api] login failed', err);
      res.status(500).json({ error: 'Falha ao validar o login.' });
    }
  });

  // Exercise images / GIFs are stored as separate files, named by content hash
  app.post(
    '/api/uploads',
    express.raw({ type: Object.keys(IMAGE_TYPES), limit: MAX_UPLOAD_BYTES }),
    async (req, res) => {
      const contentType = String(req.headers['content-type'] || '').split(';')[0].trim();
      if (!IMAGE_TYPES[contentType] || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ error: 'Envie uma imagem JPG, PNG, GIF, WEBP ou AVIF.' });
        return;
      }
      try {
        const name = uploadName(req.body, contentType);
        await storage.saveUpload(name, req.body, contentType);
        res.status(201).json({ url: `/api/uploads/${name}` });
      } catch (err) {
        console.error('[api] upload failed', err);
        res.status(500).json({ error: 'Falha ao salvar a imagem.' });
      }
    }
  );

  app.get('/api/uploads/:name', async (req, res) => {
    const { name } = req.params;
    if (!UPLOAD_NAME.test(name)) {
      res.status(404).end();
      return;
    }
    try {
      const file = await storage.readUpload(name);
      if (!file) {
        res.status(404).end();
        return;
      }
      res.set({
        'Content-Type': file.contentType,
        // Content-addressed: the bytes behind a name never change
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      });
      file.body.on('error', () => res.destroy()).pipe(res);
    } catch (err) {
      console.error('[api] failed to read upload', err);
      res.status(500).end();
    }
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada.' });
  });

  // Oversized or malformed bodies
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err?.type === 'entity.too.large') {
      res.status(413).json({ error: 'Arquivo muito grande. O limite é de 4MB.' });
      return;
    }
    if (err?.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'JSON inválido.' });
      return;
    }
    next(err);
  });

  return app;
}

/**
 * Moves images that older versions saved inline (data:image/...;base64) out of the
 * JSON documents into upload files, which keeps the documents small.
 */
export async function extractInlineImages(storage: Storage): Promise<number> {
  let moved = 0;
  const cache = new Map<string, string>();

  const toUpload = async (dataUrl: string): Promise<string> => {
    const cached = cache.get(dataUrl);
    if (cached) return cached;
    const match = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl);
    if (!match || !IMAGE_TYPES[match[1]]) return dataUrl;
    const body = Buffer.from(match[2], 'base64');
    const name = uploadName(body, match[1]);
    await storage.saveUpload(name, body, match[1]);
    const url = `/api/uploads/${name}`;
    cache.set(dataUrl, url);
    moved++;
    return url;
  };

  const fixExercise = async (ex: any) =>
    typeof ex?.imageUrl === 'string' && ex.imageUrl.startsWith('data:')
      ? { ...ex, imageUrl: await toUpload(ex.imageUrl) }
      : ex;

  const exercises = await storage.readJson<any[]>('exercises', []);
  const fixedExercises = await Promise.all(exercises.map(fixExercise));

  const routines = await storage.readJson<any[]>('routines', []);
  const fixedRoutines = await Promise.all(
    routines.map(async (r) => {
      const { coverImage: _unused, ...rest } = r ?? {};
      return { ...rest, exercises: await Promise.all((r?.exercises ?? []).map(fixExercise)) };
    })
  );

  if (moved > 0) {
    await storage.writeJson('exercises', fixedExercises);
    await storage.writeJson('routines', fixedRoutines);
  }
  return moved;
}
