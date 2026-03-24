import formidable, { Fields, Files } from 'formidable';
import { NextRequest } from 'next/server';
import { Readable } from 'stream';
import { IncomingMessage } from 'http';

export async function parseForm(req: NextRequest): Promise<{ fields: Fields; files: Files }> {
  const form = formidable({
    maxFileSize: 50 * 1024 * 1024, // 50MB
    keepExtensions: true,
    multiples: true,
  });

  // Convert NextRequest to a Node.js IncomingMessage-like object
  const buf = await req.arrayBuffer();
  const readable = new Readable();
  readable.push(Buffer.from(buf));
  readable.push(null);

  const msg = Object.assign(readable, {
    headers: Object.fromEntries(req.headers.entries()),
    method: req.method,
    url: req.url,
  }) as unknown as IncomingMessage;

  return new Promise((resolve, reject) => {
    form.parse(msg, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}
