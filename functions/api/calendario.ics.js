// GET /api/calendario.ics → calendario (iCal) con las reservas hechas en la página.
// Airbnb, Booking y Vrbo lo importan para bloquear esas fechas.
import { reservasDeLaPagina } from '../../lib/comun.js';

const sinGuiones = (f) => f.replace(/-/g, '');

export async function onRequestGet({ env }) {
  const reservas = await reservasDeLaPagina(env);
  const sello = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Reserva Natural La Maria//Reservas//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Reservas desde la pagina La Maria'];
  for (const r of reservas) {
    lineas.push('BEGIN:VEVENT', 'UID:' + r.referencia + '@reservanaturallamaria.com', 'DTSTAMP:' + sello,
      'DTSTART;VALUE=DATE:' + sinGuiones(r.llegada), 'DTEND;VALUE=DATE:' + sinGuiones(r.salida),
      'SUMMARY:Reservado (pagina web)', 'END:VEVENT');
  }
  lineas.push('END:VCALENDAR');
  return new Response(lineas.join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
