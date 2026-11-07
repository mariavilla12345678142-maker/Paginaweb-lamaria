// GET /api/config → { pagos: true } cuando las llaves de Bold ya están puestas en Cloudflare
import { json, pagosActivos } from '../../lib/comun.js';

export function onRequestGet({ env }) {
  return json({ ok: true, pagos: pagosActivos(env) });
}
