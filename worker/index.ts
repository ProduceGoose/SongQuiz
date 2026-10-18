// The SongQuiz server, a Cloudflare Worker. Cloudflare serves the website's files itself; only
// /api/* reaches this code (see run_worker_first in wrangler.jsonc).
//
//   /api/rooms/:code/ws   WebSocket to the room's Durable Object (RoomObject)
import { CODE_PATTERN } from '../src/game/protocol';
import { RoomObject } from './RoomObject';

export { RoomObject };

export interface Env {
  ROOMS: DurableObjectNamespace<RoomObject>;
}

export default {
  async fetch(request, env): Promise<Response> {
    const parts = new URL(request.url).pathname.split('/'); // ['', 'api', 'rooms', code, 'ws']
    if (parts.length !== 5 || parts[1] !== 'api' || parts[2] !== 'rooms' || parts[4] !== 'ws' || !CODE_PATTERN.test(parts[3]!)) {
      return new Response('Not found', { status: 404 });
    }
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected a WebSocket upgrade', { status: 426 });
    }
    // One Durable Object per room code, created on first use.
    return env.ROOMS.get(env.ROOMS.idFromName(parts[3]!)).fetch(request);
  }
} satisfies ExportedHandler<Env>;
