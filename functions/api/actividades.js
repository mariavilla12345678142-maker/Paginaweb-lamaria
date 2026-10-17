// POST /api/actividades → crea la reserva de cabalgata, caminata o aves y el link de pago de Bold
import Actividades from '../../public/js/actividades.js';
import Tarifas from '../../public/js/tarifas.js';
import {
  json, hoyColombia, fechaLarga, nuevaReferencia, limpiar, revisarCliente, datosCliente, crearLinkBold, guardar, urlSitio,
} from '../../lib/comun.js';

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch (e) { return json({ ok: false, error: 'Datos no válidos.' }, 400); }
  if (d.sitio) return json({ ok: false, error: 'No pudimos crear la reserva.' }, 400); // trampa para robots

  const error = revisarCliente(d);
  if (error) return json({ ok: false, error }, 400);

  const c = Actividades.cotizar(d);
  if (!c.ok) return json({ ok: false, error: c.error }, 400);
  if (!Tarifas.esFechaValida(d.fecha)) return json({ ok: false, error: 'Elige el día de la actividad.' }, 400);
  const minimo = Tarifas.sumarDias(hoyColombia(), c.diasAnticipacion);
  if (d.fecha < minimo) return json({ ok: false, error: 'Elige un día a partir del ' + fechaLarga(minimo) + '.' }, 400);
  if (!Actividades.CONFIG.horarios.includes(d.hora)) return json({ ok: false, error: 'Elige una hora de la lista.' }, 400);

  const referencia = nuevaReferencia('LMA');
  const cliente = datosCliente(d);
  const reg = {
    tipo: 'actividad', referencia, estado: 'esperando_pago', creado: new Date().toISOString(),
    actividad: c.nombre, clave: c.actividad, modalidad: c.modalidad, fecha: d.fecha, hora: d.hora,
    adultos: c.adultos, ninos: c.ninos, personas: c.personas, almuerzo: c.almuerzo,
    total: c.total, pagado: c.pagar, saldo: c.saldo, pagoCompleto: c.pagoCompleto, sujetoConfirmacion: c.sujetoConfirmacion,
    cliente, comoSupo: limpiar(d.comoSupo === 'Otro' ? 'Otro: ' + d.comoSupoOtro : d.comoSupo, 100),
    comentarios: limpiar(d.comentarios, 600),
  };

  try {
    const sitio = urlSitio(env, request);
    reg.pago = await crearLinkBold(env, {
      referencia, total: c.pagar, email: cliente.email,
      descripcion: (c.pagoCompleto ? 'Pago total ' : 'Anticipo 50% ') + c.nombre + ' ' + d.fecha + ' (' + referencia + ')',
      volverA: sitio + '/confirmacion.html?ref=' + referencia,
    });
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: 'No pudimos conectar con Bold. Intenta de nuevo en un momento o escríbenos por WhatsApp.' }, 502);
  }
  await guardar(env, reg);
  return json({ ok: true, referencia, urlPago: reg.pago.url });
}
