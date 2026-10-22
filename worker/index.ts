// The SongQuiz server, a Cloudflare Worker. Cloudflare serves the website's files itself; only
// /api/* reaches this code (see run_worker_first in wrangler.jsonc).
//
//   /api/rooms/:code/ws          WebSocket to the room's Durable Object (RoomObject)
//   /api/rooms/:code/audio/:game/:n   round n's song preview, streamed from Apple under an
//                                     address that doesn't give the song away. :game is new for
//                                     every game, so a browser never plays a song it kept from an
//                                     earlier game in the room.
import { CODE_PATTERN } from '../src/game/protocol';
import { RoomObject } from './RoomObject';

export { RoomObject };

export interface Env {
  ROOMS: DurableObjectNamespace<RoomObject>;
}

/** Apple's response headers that playback needs; the rest (ETag and the like) could identify the song. */
const AUDIO_HEADERS = ['content-type', 'content-length', 'content-range', 'accept-ranges'];

const notFound = () => new Response('Not found', { status: 404 });

/** Streams Apple's preview, passing the browser's Range header through so it can seek. */
async function streamPreview(previewUrl: string, request: Request): Promise<Response> {
  const range = request.headers.get('Range');
  const upstream = await fetch(previewUrl, {
    headers: range ? { Range: range } : {},
    // Cloudflare keeps a copy, so the other players in the room don't each fetch it from Apple.
    cf: { cacheEverything: true, cacheTtl: 86400 }
  });
  if (!upstream.ok) {
    console.warn(`Preview download failed: HTTP ${upstream.status} from ${new URL(previewUrl).host}`);
    return new Response('Preview unavailable', { status: 502 });
  }
  const headers = new Headers({ 'Cache-Control': 'private, max-age=600' });
  for (const name of AUDIO_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Apple labels its AAC previews audio/x-m4p, which not every browser accepts; it's plain MP4 audio.
  if (/m4p|m4a/.test(headers.get('content-type') ?? '')) headers.set('content-type', 'audio/mp4');
  return new Response(upstream.body, { status: upstream.status, headers });
}

export default {
  async fetch(request, env): Promise<Response> {
    const parts = new URL(request.url).pathname.split('/'); // ['', 'api', 'rooms', code, …]
    const code = parts[3] ?? '';
    if (parts[1] !== 'api' || parts[2] !== 'rooms' || !CODE_PATTERN.test(code)) return notFound();
    // One Durable Object per room code, created on first use.
    const room = env.ROOMS.get(env.ROOMS.idFromName(code));

    if (parts.length === 5 && parts[4] === 'ws') {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
        return new Response('Expected a WebSocket upgrade', { status: 426 });
      }
      return room.fetch(request);
    }

    if (parts.length === 7 && parts[4] === 'audio' && /^[0-9a-f]{1,16}$/.test(parts[5]!) && /^\d{1,3}$/.test(parts[6]!) && request.method === 'GET') {
      const previewUrl = await room.audioFor(parts[5]!, Number(parts[6]));
      return previewUrl ? streamPreview(previewUrl, request) : notFound();
    }

    return notFound();
  }
} satisfies ExportedHandler<Env>;
