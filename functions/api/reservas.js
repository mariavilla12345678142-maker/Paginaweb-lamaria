// POST /api/reservas → crea la reserva de alojamiento y el link de pago de Bold
import Tarifas from '../../public/js/tarifas.js';
import {
  json, hoyColombia, nuevaReferencia, limpiar, revisarCliente, datosCliente,
  crearLinkBold, guardar, nochesOcupadas, urlSitio,
} from '../../lib/comun.js';

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch (e) { return json({ ok: false, error: 'Datos no válidos.' }, 400); }
  if (d.sitio) return json({ ok: false, error: 'No pudimos crear la reserva.' }, 400); // trampa para robots

  const error = revisarCliente(d);
  if (error) return json({ ok: false, error }, 400);

  // El precio se calcula aquí otra vez: nunca se confía en el que manda el navegador
  const c = Tarifas.cotizar(d.llegada, d.salida, d.huespedes);
  if (!c.ok) return json({ ok: false, error: c.error }, 400);
  if (d.llegada < hoyColombia()) return json({ ok: false, error: 'La fecha de llegada ya pasó.' }, 400);

  const ocupadas = new Set(await nochesOcupadas(env));
  if (Tarifas.noches(d.llegada, d.salida).some((n) => ocupadas.has(n))) {
    return json({ ok: false, error: 'Alguien acaba de reservar una de esas noches. Elige otras fechas, por favor.' }, 409);
  }

  const referencia = nuevaReferencia('LM');
  const cliente = datosCliente(d);
  const reg = {
    tipo: 'alojamiento', referencia, estado: 'esperando_pago', creado: new Date().toISOString(),
    llegada: d.llegada, salida: d.salida, noches: c.cantidadNoches, huespedes: c.huespedes, mascotas: !!d.mascotas,
    total: c.total, anticipo: c.anticipo, saldo: c.saldo, descuento: c.descuento,
    cliente, comoSupo: limpiar(d.comoSupo === 'Otro' ? 'Otro: ' + d.comoSupoOtro : d.comoSupo, 100),
    comentarios: limpiar(d.comentarios, 600),
  };

  try {
    const sitio = urlSitio(env, request);
    reg.pago = await crearLinkBold(env, {
      referencia, total: c.anticipo, email: cliente.email,
      descripcion: 'Anticipo 50% alojamiento La María ' + d.llegada + ' a ' + d.salida + ' (' + referencia + ')',
      volverA: sitio + '/confirmacion.html?ref=' + referencia,
    });
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: 'No pudimos conectar con Bold. Intenta de nuevo en un momento o escríbenos por WhatsApp.' }, 502);
  }
  await guardar(env, reg);
  return json({ ok: true, referencia, urlPago: reg.pago.url });
}
