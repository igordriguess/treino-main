/**
 * Vercel Function entry: every /api/* request is rewritten here (see vercel.json)
 * and handled by the same Express app used locally. Data lives in Vercel Blob.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../server/app.js';
import { createStorage } from '../server/storage.js';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

let handler: Handler;
try {
  handler = createApp(createStorage('/tmp/irontrack'));
} catch (err) {
  // Missing Blob store: answer every request with the setup instructions instead of crashing
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  handler = (_req, res) => {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: message }));
  };
}

export default handler;
