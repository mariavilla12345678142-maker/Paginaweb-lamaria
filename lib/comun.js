/* =====================================================================
   Piezas compartidas del servidor de reservas · La María
   ---------------------------------------------------------------------
   Corre en Cloudflare Pages Functions. Necesita en Cloudflare:
     - Un espacio KV enlazado con el nombre  RESERVAS
     - Variables:  BOLD_LLAVE_IDENTIDAD, SITIO_URL, CLAVE_ADMIN
                   ICAL_AIRBNB, ICAL_BOOKING, ICAL_VRBO (opcionales)
   ===================================================================== */
import Tarifas from '../public/js/tarifas.js';

export const BOLD_PAGOS = 'https://payments.api.bold.co';
export const MINUTOS_PARA_PAGAR = 30;   // tiempo que se apartan las fechas mientras el cliente paga

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function json(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function hoyColombia() { return new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10); }

export function fechaLarga(s) {
  const d = new Date(s + 'T12:00:00Z');
  return DIAS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' de ' + MESES[d.getUTCMonth()] + ' de ' + d.getUTCFullYear();
}

export function nuevaReferencia(prefijo) {
  const letras = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const r = crypto.getRandomValues(new Uint8Array(5));
  let cola = '';
  for (const b of r) cola += letras[b % letras.length];
  return prefijo + '-' + hoyColombia().slice(2).replace(/-/g, '') + '-' + cola;
}

export function limpiar(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, max); }

// Revisa los datos del cliente que llegan del formulario. Devuelve un texto de error o null.
export function revisarCliente(d) {
  const c = d.cliente || {};
  if (limpiar(c.nombre, 80).length < 5) return 'Escribe tu nombre completo.';
  if (!['CC', 'CE', 'PP', 'NIT'].includes(c.tipoDocumento)) return 'Tipo de documento no válido.';
  if (String(c.documento || '').replace(/\W/g, '').length < 5) return 'Escribe tu número de documento.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(c.email || ''))) return 'Revisa tu correo electrónico.';
  if (String(c.celular || '').replace(/\D/g, '').length < 10) return 'Escribe tu número de celular (10 dígitos).';
  if (!d.comoSupo) return 'Cuéntanos cómo supiste de nosotros.';
  if (!d.aceptaNormas || !d.aceptaDatos) return 'Para continuar, acepta las condiciones y el tratamiento de datos.';
  return null;
}

export function datosCliente(d) {
  const c = d.cliente;
  return {
    nombre: limpiar(c.nombre, 80), tipoDocumento: c.tipoDocumento, documento: limpiar(c.documento, 20),
    email: limpiar(c.email, 100), celular: limpiar(c.celular, 20),
  };
}

// ---------------------------------------------------------------------
// Bold · Botón de pagos
//   El navegador abre la pasarela de Bold con los datos que arma el servidor.
//   La firma de integridad usa la llave secreta, que nunca sale del servidor.
// ---------------------------------------------------------------------
export function pagosActivos(env) { return !!(env.BOLD_LLAVE_IDENTIDAD && env.BOLD_LLAVE_SECRETA); }

async function sha256Hex(texto) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function prepararBoton(env, { referencia, total, descripcion, cliente, sitio }) {
  if (!pagosActivos(env)) throw new Error('Faltan las llaves de Bold en Cloudflare.');
  const monto = String(Math.round(total));
  const doc = { CC: 'CC', CE: 'CE', PP: 'PA', NIT: 'NIT' }[cliente.tipoDocumento] || 'CC';
  return {
    orderId: referencia,
    currency: 'COP',
    amount: monto,
    apiKey: env.BOLD_LLAVE_IDENTIDAD,
    integritySignature: await sha256Hex(referencia + monto + 'COP' + env.BOLD_LLAVE_SECRETA),
    description: limpiar(descripcion, 100),
    redirectionUrl: sitio + '/confirmacion',
    originUrl: sitio + '/confirmacion?ref=' + referencia,
    customerData: JSON.stringify({
      email: cliente.email, fullName: cliente.nombre, phone: String(cliente.celular).replace(/\D/g, '').slice(-10),
      dialCode: '+57', documentNumber: String(cliente.documento).replace(/\W/g, ''), documentType: doc,
    }),
  };
}

// Consulta el estado del pago con la referencia de la venta (Bold lo guarda hasta 24 horas)
export async function consultarPagoBold(env, referencia) {
  const r = await fetch((env.BOLD_PAGOS_URL || BOLD_PAGOS) + '/v2/payment-voucher/' + encodeURIComponent(referencia), {
    headers: { Authorization: 'x-api-key ' + env.BOLD_LLAVE_IDENTIDAD },
  });
  if (!r.ok) throw new Error('Bold respondió ' + r.status);
  return r.json();
}

// Traduce el estado de Bold al estado de nuestra reserva
export function estadoDesdeBold(estadoBold) {
  switch (String(estadoBold || '').toUpperCase()) {
    case 'APPROVED': case 'SALE_APPROVED': return 'confirmada';
    case 'REJECTED': case 'FAILED': case 'SALE_REJECTED': return 'rechazada';
    case 'VOIDED': case 'VOID_APPROVED': return 'anulada';
    default: return 'esperando_pago';   // NO_TRANSACTION_FOUND, PROCESSING, PENDING
  }
}

// Firma del webhook: HMAC-SHA256 (hex) del cuerpo en Base64, con la llave secreta
export async function firmaWebhookValida(env, cuerpo, firma) {
  if (!firma || !env.BOLD_LLAVE_SECRETA) return false;
  const llave = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.BOLD_LLAVE_SECRETA),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const base64 = btoa(String.fromCharCode(...new TextEncoder().encode(cuerpo)));
  const mac = await crypto.subtle.sign('HMAC', llave, new TextEncoder().encode(base64));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex === String(firma).toLowerCase();
}

// Cambia el estado de una reserva y la guarda
export async function cambiarEstado(env, reg, nuevo, info) {
  reg.estado = nuevo;
  reg.pago = Object.assign(reg.pago || {}, info, { actualizado: new Date().toISOString() });
  await guardar(env, reg);
  return reg;
}

// ---------------------------------------------------------------------
// Guardado de reservas en KV
//   res:<referencia>   → la reserva completa (metadata con lo necesario para el calendario)
// ---------------------------------------------------------------------
function metadata(reg) {
  const m = { tipo: reg.tipo, estado: reg.estado, creado: reg.creado };
  if (reg.tipo === 'alojamiento') { m.llegada = reg.llegada; m.salida = reg.salida; }
  return m;
}

export async function guardar(env, reg) {
  await env.RESERVAS.put('res:' + reg.referencia, JSON.stringify(reg), { metadata: metadata(reg) });
}

export async function leer(env, referencia) {
  const v = await env.RESERVAS.get('res:' + referencia);
  return v ? JSON.parse(v) : null;
}

// Pregunta a Bold cómo va el pago y actualiza la reserva si cambió.
// Se siguen revisando las rechazadas y vencidas del último día: el cliente puede reintentar.
export async function actualizarDesdeBold(env, reg) {
  if (!['esperando_pago', 'rechazada', 'vencida'].includes(reg.estado) || !pagosActivos(env)) return reg;
  if (reg.estado !== 'esperando_pago' && Date.now() - Date.parse(reg.creado) > 24 * 3600000) return reg;
  let info;
  try { info = await consultarPagoBold(env, reg.referencia); } catch (e) { return reg; }
  let nuevo = estadoDesdeBold(info.payment_status);
  // Un pago aprobado por un monto distinto al de la reserva queda en revisión
  if (nuevo === 'confirmada' && reg.pago && reg.pago.monto && Number(info.total) !== reg.pago.monto) nuevo = 'revisar';
  if (nuevo !== 'esperando_pago' && nuevo !== reg.estado) {
    return cambiarEstado(env, reg, nuevo, { estadoBold: info.payment_status, transaccion: info.transaction_id || null, medio: info.payment_method || null });
  }
  // Nadie pagó a tiempo: se liberan las fechas
  if (reg.estado === 'esperando_pago' && Date.now() - Date.parse(reg.creado) > (MINUTOS_PARA_PAGAR + 30) * 60000) {
    return cambiarEstado(env, reg, 'vencida', {});
  }
  return reg;
}

// ---------------------------------------------------------------------
// Calendario: noches ocupadas
// ---------------------------------------------------------------------
function nochesDeIcal(texto) {
  const noches = [];
  const eventos = texto.replace(/\r?\n[ \t]/g, '').split('BEGIN:VEVENT').slice(1);
  for (const ev of eventos) {
    const ini = /DTSTART[^:\n]*:(\d{8})/.exec(ev), fin = /DTEND[^:\n]*:(\d{8})/.exec(ev);
    if (!ini) continue;
    const a = ini[1].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    const b = fin ? fin[1].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : Tarifas.sumarDias(a, 1);
    for (let d = a, i = 0; d < b && i < 400; d = Tarifas.sumarDias(d, 1), i++) noches.push(d);
  }
  return noches;
}

async function leerIcal(url) {
  try {
    const r = await fetch(url, { cf: { cacheTtl: 600, cacheEverything: true } });
    return r.ok ? nochesDeIcal(await r.text()) : [];
  } catch (e) { return []; }
}

export async function nochesOcupadas(env, { sinReferencia } = {}) {
  const hoy = hoyColombia();
  const ocupadas = new Set();
  const urls = [env.ICAL_AIRBNB, env.ICAL_BOOKING, env.ICAL_VRBO].filter(Boolean);
  (await Promise.all(urls.map(leerIcal))).forEach((l) => l.forEach((n) => ocupadas.add(n)));

  let cursor;
  do {
    const pagina = await env.RESERVAS.list({ prefix: 'res:', cursor });
    for (const k of pagina.keys) {
      const m = k.metadata || {};
      if (m.tipo !== 'alojamiento' || k.name === 'res:' + sinReferencia || !m.salida || m.salida <= hoy) continue;
      const apartada = m.estado === 'esperando_pago' && Date.now() - Date.parse(m.creado) < (MINUTOS_PARA_PAGAR + 5) * 60000;
      if (m.estado !== 'confirmada' && !apartada) continue;
      Tarifas.noches(m.llegada, m.salida).forEach((n) => ocupadas.add(n));
    }
    cursor = pagina.list_complete ? null : pagina.cursor;
  } while (cursor);

  return [...ocupadas].filter((n) => n >= hoy).sort();
}

// ---------------------------------------------------------------------
// Lo que ve el cliente en la página de confirmación
// ---------------------------------------------------------------------
export function vistaAlojamiento(reg) {
  return {
    tipo: 'alojamiento', referencia: reg.referencia, nombre: reg.cliente.nombre.split(' ')[0],
    llegada: fechaLarga(reg.llegada), salida: fechaLarga(reg.salida), huespedes: reg.huespedes,
    total: reg.total, anticipo: reg.anticipo, saldo: reg.saldo,
  };
}

export function vistaActividad(reg) {
  return {
    tipo: 'actividad', referencia: reg.referencia, nombre: reg.cliente.nombre.split(' ')[0],
    actividad: reg.actividad, fecha: fechaLarga(reg.fecha), hora: reg.hora,
    personas: reg.personas + (reg.ninos ? ' (' + reg.ninos + (reg.ninos === 1 ? ' niño)' : ' niños)') : ''),
    almuerzo: reg.almuerzo, total: reg.total, anticipo: reg.pagado, saldo: reg.saldo,
  };
}

export function urlSitio(env, request) {
  return (env.SITIO_URL || new URL(request.url).origin).replace(/\/+$/, '');
}
