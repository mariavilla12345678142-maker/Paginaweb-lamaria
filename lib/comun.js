/* =====================================================================
   Piezas compartidas del servidor de reservas · La María
   ---------------------------------------------------------------------
   Corre en Cloudflare Pages Functions. Necesita en Cloudflare:
     - Un espacio KV enlazado con el nombre  RESERVAS
     - Variables:  BOLD_LLAVE_IDENTIDAD, SITIO_URL, CLAVE_ADMIN
                   ICAL_AIRBNB, ICAL_BOOKING, ICAL_VRBO (opcionales)
   ===================================================================== */
import Tarifas from '../public/js/tarifas.js';

export const BOLD_API = 'https://integrations.api.bold.co';
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
// Bold · API de Links de pago
// ---------------------------------------------------------------------
export async function crearLinkBold(env, { referencia, total, descripcion, email, volverA }) {
  if (!env.BOLD_LLAVE_IDENTIDAD) throw new Error('Falta la llave de identidad de Bold en Cloudflare.');
  const vence = (BigInt(Date.now() + MINUTOS_PARA_PAGAR * 60000) * 1000000n).toString(); // Bold pide nanosegundos
  const cuerpo = {
    amount_type: 'CLOSE',
    amount: { currency: 'COP', total_amount: Math.round(total), tip_amount: 0, taxes: [] },
    reference: referencia,
    description: limpiar(descripcion, 100),
    callback_url: volverA,
    payer_email: email,
    expiration_date: '__VENCE__',
  };
  // El número es demasiado grande para JavaScript: se escribe tal cual en el texto
  const texto = JSON.stringify(cuerpo).replace('"__VENCE__"', vence);
  const r = await fetch((env.BOLD_API_URL || BOLD_API) + '/online/link/v1', {
    method: 'POST',
    headers: { Authorization: 'x-api-key ' + env.BOLD_LLAVE_IDENTIDAD, 'Content-Type': 'application/json' },
    body: texto,
  });
  const j = await r.json().catch(() => ({}));
  const p = j.payload || j;
  if (!r.ok || !p.url || !p.payment_link) {
    throw new Error('Bold no creó el link de pago (' + r.status + '): ' + JSON.stringify(j.errors || j).slice(0, 300));
  }
  return { link: p.payment_link, url: p.url };
}

export async function consultarLinkBold(env, link) {
  const r = await fetch((env.BOLD_API_URL || BOLD_API) + '/online/link/v1/' + encodeURIComponent(link), {
    headers: { Authorization: 'x-api-key ' + env.BOLD_LLAVE_IDENTIDAD },
  });
  if (!r.ok) throw new Error('Bold respondió ' + r.status);
  const j = await r.json();
  return j.payload || j;
}

// Traduce el estado del link de Bold al estado de nuestra reserva
export function estadoDesdeBold(estadoBold) {
  switch (String(estadoBold || '').toUpperCase()) {
    case 'PAID': return 'confirmada';
    case 'REJECTED': return 'rechazada';
    case 'EXPIRED':
    case 'CANCELLED': return 'vencida';
    default: return 'esperando_pago';   // ACTIVE, PROCESSING
  }
}

// ---------------------------------------------------------------------
// Guardado de reservas en KV
//   res:<referencia>   → la reserva completa (metadata con lo necesario para el calendario)
//   link:<LNK_...>     → referencia (para encontrar la reserva desde el webhook)
// ---------------------------------------------------------------------
function metadata(reg) {
  const m = { tipo: reg.tipo, estado: reg.estado, creado: reg.creado };
  if (reg.tipo === 'alojamiento') { m.llegada = reg.llegada; m.salida = reg.salida; }
  return m;
}

export async function guardar(env, reg) {
  await env.RESERVAS.put('res:' + reg.referencia, JSON.stringify(reg), { metadata: metadata(reg) });
  if (reg.pago && reg.pago.link) await env.RESERVAS.put('link:' + reg.pago.link, reg.referencia);
}

export async function leer(env, referencia) {
  const v = await env.RESERVAS.get('res:' + referencia);
  return v ? JSON.parse(v) : null;
}

// Pregunta a Bold cómo va el pago y actualiza la reserva si cambió
export async function actualizarDesdeBold(env, reg) {
  // Un pago rechazado se sigue revisando: el cliente puede reintentar en el mismo link
  if (!['esperando_pago', 'rechazada'].includes(reg.estado) || !reg.pago || !reg.pago.link) return reg;
  let info;
  try { info = await consultarLinkBold(env, reg.pago.link); } catch (e) { return reg; }
  const nuevo = estadoDesdeBold(info.status);
  if (nuevo === 'esperando_pago' || nuevo === reg.estado) {
    if (reg.estado !== 'esperando_pago') return reg;
    // Bold no venció el link pero ya pasó el tiempo: lo damos por vencido para liberar las fechas
    if (Date.now() - Date.parse(reg.creado) > (MINUTOS_PARA_PAGAR + 30) * 60000) { reg.estado = 'vencida'; await guardar(env, reg); }
    return reg;
  }
  reg.estado = nuevo;
  reg.pago.estadoBold = info.status;
  reg.pago.transaccion = info.transaction_id || info.payment_id || reg.pago.transaccion || null;
  reg.pago.actualizado = new Date().toISOString();
  await guardar(env, reg);
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
