// POST /api/bold-webhook → Bold avisa aquí cuando un pago cambia de estado.
// No confiamos en lo que dice el aviso: con él solo sabemos qué link revisar,
// y el estado real se le pregunta directamente a Bold.
import { json, leer, actualizarDesdeBold } from '../../lib/comun.js';

export async function onRequestPost({ request, env }) {
  let evento = {};
  try { evento = await request.json(); } catch (e) { return json({ ok: true }); }
  const datos = evento.data || {};
  const candidatos = [datos.metadata && datos.metadata.reference, datos.reference, datos.payment_link].filter(Boolean);
  for (const c of candidatos) {
    const ref = String(c).startsWith('LNK_') ? await env.RESERVAS.get('link:' + c) : String(c);
    const reg = ref && await leer(env, ref);
    if (reg) { await actualizarDesdeBold(env, reg); break; }
  }
  return json({ ok: true }); // siempre 200 para que Bold no reintente sin fin
}
