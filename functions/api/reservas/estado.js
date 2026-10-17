// GET /api/reservas/estado?ref=LM-... → cómo va la reserva (consulta a Bold si aún no está pagada)
import { json, leer, actualizarDesdeBold, vistaAlojamiento, vistaActividad } from '../../../lib/comun.js';

export async function onRequestGet({ request, env }) {
  const ref = new URL(request.url).searchParams.get('ref') || '';
  if (!/^LMA?-\d{6}-[A-Z0-9]{5}$/.test(ref)) return json({ ok: false, error: 'Referencia no válida.' }, 400);
  let reg = await leer(env, ref);
  if (!reg) return json({ ok: false, error: 'No encontramos esa reserva.' }, 404);
  reg = await actualizarDesdeBold(env, reg);
  const vista = reg.tipo === 'actividad' ? vistaActividad(reg) : vistaAlojamiento(reg);
  return json({ ok: true, estado: reg.estado, ...vista });
}
