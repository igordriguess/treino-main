/**
 * IronTrack local server: the API from server/app.ts plus the frontend.
 *
 *   npm run dev    -> Vite dev middleware (HMR)
 *   npm start      -> serves the production build from dist/ (run `npm run build` first)
 *
 * Data is saved as JSON files in ./data (override with DATA_DIR).
 * On Vercel the same API runs from api/index.ts and stores data in Vercel Blob.
 */
import 'dotenv/config';
import express from 'express';
import { createServer as createHttpServer } from 'node:http';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createApp, extractInlineImages } from './server/app.js';
import { createStorage } from './server/storage.js';

const PORT = Number(process.env.PORT) || 8443;
const HOST = process.env.HOST || '0.0.0.0';
const IS_PROD = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
const ROOT = process.cwd();
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));

async function start() {
  const storage = createStorage(DATA_DIR);
  const moved = await extractInlineImages(storage);
  if (moved > 0) console.log(`${moved} imagem(ns) movida(s) do JSON para arquivos em uploads/`);

  const app = createApp(storage);
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
        ws: { server: httpServer },
        // Writing the JSON files must not trigger reloads
        watch: { ignored: [`${DATA_DIR.replace(/\\/g, '/')}/**`] },
      },
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, HOST, () => {
    console.log(`IronTrack ${IS_PROD ? '(produção)' : '(dev)'} em http://localhost:${PORT}`);
    console.log(storage.kind === 'file' ? `Dados em ${DATA_DIR}` : 'Dados no Vercel Blob');
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
