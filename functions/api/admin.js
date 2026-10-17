// GET /api/admin  (encabezado X-Clave) → lista de reservas para el panel de Pilar
import { json, actualizarDesdeBold } from '../../lib/comun.js';

export async function onRequestGet({ request, env }) {
  const clave = request.headers.get('X-Clave') || '';
  if (!env.CLAVE_ADMIN || clave !== env.CLAVE_ADMIN) return json({ ok: false, error: 'Clave incorrecta.' }, 401);
  const reservas = [];
  let cursor;
  do {
    const pagina = await env.RESERVAS.list({ prefix: 'res:', cursor });
    const valores = await Promise.all(pagina.keys.map((k) => env.RESERVAS.get(k.name)));
    for (const v of valores) if (v) reservas.push(JSON.parse(v));
    cursor = pagina.list_complete ? null : pagina.cursor;
  } while (cursor);
  // Las que siguen esperando pago se revisan con Bold antes de mostrarlas
  await Promise.all(reservas.filter((r) => r.estado === 'esperando_pago').map((r) => actualizarDesdeBold(env, r)));
  reservas.sort((a, b) => (a.creado < b.creado ? 1 : -1));
  return json({ ok: true, reservas });
}
