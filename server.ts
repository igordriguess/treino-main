/**
 * IronTrack server: serves the frontend and persists data as JSON files on disk.
 *
 *   npm run dev    -> Vite dev middleware (HMR)
 *   npm start      -> serves the production build from dist/ (run `npm run build` first)
 *
 * Data lives in ./data (override with DATA_DIR). One file per collection.
 */
import 'dotenv/config';
import express from 'express';
import { createServer as createHttpServer } from 'node:http';
import { promises as fs, existsSync } from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT) || 8443;
const HOST = process.env.HOST || '0.0.0.0';
const IS_PROD = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
const ROOT = process.cwd();
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));

const COLLECTIONS = ['routines', 'exercises', 'students', 'sessions'] as const;
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

const DEFAULT_ADMIN: AdminAccount = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || '1234',
  name: 'Administrador',
};

// --- JSON file storage -------------------------------------------------------

const filePath = (name: string) => path.join(DATA_DIR, `${name}.json`);

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath(name), 'utf-8')) as T;
  } catch (err: any) {
    if (err?.code === 'ENOENT') return fallback;
    throw err;
  }
}

// Writes are serialized per file and done via temp file + rename,
// so a crash mid-write never leaves a truncated JSON behind.
const writeQueues = new Map<string, Promise<void>>();

function writeJson(name: string, data: unknown): Promise<void> {
  const previous = writeQueues.get(name) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(async () => {
      const target = filePath(name);
      const tmp = `${target}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
      await renameWithRetry(tmp, target);
    });
  writeQueues.set(name, next);
  return next;
}

// On Windows, replacing a file that another process (antivirus, indexer, editor)
// has open briefly fails with EPERM/EBUSY, so retry a few times before giving up.
async function renameWithRetry(from: string, to: string, attempts = 8): Promise<void> {
  for (let i = 1; ; i++) {
    try {
      await fs.rename(from, to);
      return;
    } catch (err: any) {
      const transient = ['EPERM', 'EACCES', 'EBUSY'].includes(err?.code);
      if (!transient || i >= attempts) {
        await fs.rm(from, { force: true });
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 25 * i));
    }
  }
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  for (const c of COLLECTIONS) {
    if (!existsSync(filePath(c))) await writeJson(c, []);
  }
  if (!existsSync(filePath('admin'))) await writeJson('admin', DEFAULT_ADMIN);
}

const isCollection = (value: string): value is Collection => (COLLECTIONS as readonly string[]).includes(value);

// --- API ---------------------------------------------------------------------

const app = express();
// Exercise images/GIFs are stored inline as data URLs, so payloads can be large.
app.use('/api', express.json({ limit: '50mb' }));

app.get('/api/data', async (_req, res) => {
  try {
    const entries = await Promise.all(COLLECTIONS.map(async (c) => [c, await readJson(c, [])] as const));
    res.json(Object.fromEntries(entries));
  } catch (err) {
    console.error('[api] failed to read data', err);
    res.status(500).json({ error: 'Falha ao ler os dados.' });
  }
});

app.put('/api/data/:collection', async (req, res) => {
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
    await writeJson(collection, req.body);
    res.json({ ok: true, count: req.body.length });
  } catch (err) {
    console.error(`[api] failed to write ${collection}`, err);
    res.status(500).json({ error: 'Falha ao salvar os dados.' });
  }
});

app.post('/api/login', async (req, res) => {
  const username = String(req.body?.username ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '').trim();

  try {
    const admin = await readJson<AdminAccount>('admin', DEFAULT_ADMIN);
    if (username === admin.username.toLowerCase() && password === admin.password) {
      res.json({ id: 'admin-master', name: admin.name, username: admin.username, role: 'admin' });
      return;
    }

    const students = await readJson<StudentRecord[]>('students', []);
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

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// --- Frontend ----------------------------------------------------------------

async function start() {
  await ensureDataDir();
  const httpServer = createHttpServer(app);

  if (IS_PROD) {
    const dist = path.join(ROOT, 'dist');
    if (!existsSync(dist)) {
      console.error('dist/ não encontrado. Rode "npm run build" antes de "npm start".');
      process.exit(1);
    }
    app.use(express.static(dist, { index: false }));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      appType: 'spa',
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        ws: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
        // Writing the JSON files must not trigger reloads
        watch: { ignored: [`${DATA_DIR.replace(/\\/g, '/')}/**`] },
      },
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, HOST, () => {
    console.log(`IronTrack ${IS_PROD ? '(produção)' : '(dev)'} em http://localhost:${PORT}`);
    console.log(`Dados em ${DATA_DIR}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
