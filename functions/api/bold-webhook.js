// POST /api/bold-webhook → Bold avisa aquí cuando un pago cambia de estado.
// Solo se acepta un aviso firmado con la llave secreta; si la firma no cuadra,
// se usa el aviso apenas para saber qué venta revisar y se le pregunta a Bold.
import { json, leer, actualizarDesdeBold, estadoDesdeBold, firmaWebhookValida, cambiarEstado } from '../../lib/comun.js';

export async function onRequestPost({ request, env }) {
  const cuerpo = await request.text();
  let evento = {};
  try { evento = JSON.parse(cuerpo); } catch (e) { return json({ ok: true }); }
  const datos = evento.data || {};
  const ref = datos.metadata && datos.metadata.reference;
  const reg = ref && /^LMA?-\d{6}-[A-Z0-9]{5}$/.test(ref) ? await leer(env, ref) : null;
  if (reg) {
    const nuevo = estadoDesdeBold(evento.type);
    if (await firmaWebhookValida(env, cuerpo, request.headers.get('x-bold-signature'))) {
      const pagado = datos.amount && Number(datos.amount.total);
      // Una venta aprobada por un monto distinto al de la reserva queda en revisión
      const final = nuevo === 'confirmada' && reg.pago && reg.pago.monto && pagado !== reg.pago.monto ? 'revisar' : nuevo;
      if (final !== 'esperando_pago' && final !== reg.estado) {
        await cambiarEstado(env, reg, final, { estadoBold: evento.type, transaccion: datos.payment_id || null, medio: datos.payment_method || null, montoPagado: pagado || null });
      }
    } else {
      await actualizarDesdeBold(env, reg);
    }
  }
  return json({ ok: true }); // siempre 200 para que Bold no reintente sin fin
}
