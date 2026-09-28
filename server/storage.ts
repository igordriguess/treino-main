import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { get, put } from '@vercel/blob';

/**
 * Where the platform keeps its data. Every collection is one JSON document and
 * every uploaded image is one file, so both backends store exactly the same shape.
 */
export interface Storage {
  readonly kind: 'file' | 'blob';
  readJson<T>(name: string, fallback: T): Promise<T>;
  writeJson(name: string, data: unknown): Promise<void>;
  saveUpload(name: string, body: Buffer, contentType: string): Promise<void>;
  readUpload(name: string): Promise<{ body: Readable; contentType: string } | null>;
}

// --- Local disk (npm run dev / npm start) ------------------------------------

export class FileStorage implements Storage {
  readonly kind = 'file' as const;
  private queues = new Map<string, Promise<void>>();

  constructor(readonly dir: string) {}

  private jsonPath(name: string) {
    return path.join(this.dir, `${name}.json`);
  }

  private uploadPath(name: string) {
    return path.join(this.dir, 'uploads', name);
  }

  async readJson<T>(name: string, fallback: T): Promise<T> {
    try {
      return JSON.parse(await fs.readFile(this.jsonPath(name), 'utf-8')) as T;
    } catch (err: any) {
      if (err?.code === 'ENOENT') return fallback;
      throw err;
    }
  }

  // Writes are serialized per file and done via temp file + rename,
  // so a crash mid-write never leaves a truncated JSON behind.
  writeJson(name: string, data: unknown): Promise<void> {
    const previous = this.queues.get(name) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(() => this.atomicWrite(this.jsonPath(name), JSON.stringify(data, null, 2)));
    this.queues.set(name, next);
    return next;
  }

  async saveUpload(name: string, body: Buffer): Promise<void> {
    await this.atomicWrite(this.uploadPath(name), body);
  }

  async readUpload(name: string) {
    const file = this.uploadPath(name);
    try {
      await fs.access(file);
    } catch {
      return null;
    }
    const { createReadStream } = await import('node:fs');
    return { body: createReadStream(file), contentType: contentTypeFromName(name) };
  }

  private async atomicWrite(target: string, content: string | Buffer) {
    await fs.mkdir(path.dirname(target), { recursive: true });
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, content);
    await renameWithRetry(tmp, target);
  }
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

// --- Vercel Blob (serverless functions have no persistent disk) --------------

export class BlobStorage implements Storage {
  readonly kind = 'blob' as const;

  constructor(private readonly access: 'private' | 'public' = 'private') {}

  async readJson<T>(name: string, fallback: T): Promise<T> {
    // useCache: false -> always read the latest version, never a CDN copy
    const result = await get(`data/${name}.json`, { access: this.access, useCache: false });
    if (!result || result.statusCode !== 200) return fallback;
    return JSON.parse(await new Response(result.stream).text()) as T;
  }

  async writeJson(name: string, data: unknown): Promise<void> {
    await put(`data/${name}.json`, JSON.stringify(data), {
      access: this.access,
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
  }

  async saveUpload(name: string, body: Buffer, contentType: string): Promise<void> {
    // Upload names are content hashes, so an existing blob already has these bytes
    await put(`uploads/${name}`, body, {
      access: this.access,
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  }

  async readUpload(name: string) {
    const result = await get(`uploads/${name}`, { access: this.access });
    if (!result || result.statusCode !== 200) return null;
    return {
      body: Readable.fromWeb(result.stream as any),
      contentType: result.blob.contentType || contentTypeFromName(name),
    };
  }
}

export function createStorage(localDir: string): Storage {
  // Connecting a Blob Store injects BLOB_READ_WRITE_TOKEN, or BLOB_STORE_ID when using OIDC
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
    return new BlobStorage(process.env.BLOB_ACCESS === 'public' ? 'public' : 'private');
  }
  if (process.env.VERCEL) {
    // Writing to the function's disk would silently lose every change
    throw new Error(
      'Nenhum armazenamento configurado no Vercel. Crie um Blob Store (Storage > Blob) e conecte-o ao projeto.'
    );
  }
  return new FileStorage(localDir);
}

// --- Upload helpers -----------------------------------------------------------

export const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export function contentTypeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  const found = Object.entries(IMAGE_TYPES).find(([, e]) => e === ext);
  return found ? found[0] : 'application/octet-stream';
}
