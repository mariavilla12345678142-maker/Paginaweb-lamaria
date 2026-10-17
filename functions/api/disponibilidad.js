// GET /api/disponibilidad → { ok, hoy, ocupadas: ['AAAA-MM-DD', ...] }
import { json, hoyColombia, nochesOcupadas } from '../../lib/comun.js';

export async function onRequestGet({ env }) {
  try {
    return json({ ok: true, hoy: hoyColombia(), ocupadas: await nochesOcupadas(env) });
  } catch (e) {
    return json({ ok: false, error: 'No pudimos leer el calendario.' }, 500);
  }
}
