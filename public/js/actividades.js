/* =====================================================================
   PRECIOS DE LAS ACTIVIDADES · La María
   ---------------------------------------------------------------------
   Cabalgata, caminata y avistamiento de aves. Este archivo lo usan la
   página (para mostrar el precio) y el servidor (para cobrar).
   Si cambias un precio aquí y lo guardas en GitHub, Cloudflare vuelve
   a publicar la página sola en un par de minutos.
   ===================================================================== */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Actividades = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {

  var CONFIG = {
    anticipo: 0.5,              // mínimo que se paga al reservar (el cliente puede pagar el 100%)
    edadNinos: 6,               // niños de esta edad o menos pagan la mitad (donde aplique)
    almuerzo: { precio: 40000, opciones: ['Patacón', 'Fiambre'] },   // por persona (los niños pagan completo); todo el grupo come lo mismo
    horarios: ['6:00 a. m.', '7:00 a. m.', '8:00 a. m.', '9:00 a. m.', '10:00 a. m.', '11:00 a. m.',
               '12:00 m.', '1:00 p. m.', '2:00 p. m.', '3:00 p. m.'],
    actividades: {
      cabalgata: {
        nombre: 'Cabalgata con guía', precio: 120000, max: 25, ninosMitad: false, diasAnticipacion: 1,
        incluye: 'Hidratación',
      },
      caminata: {
        nombre: 'Caminata por la reserva', precio: 120000, max: 25, ninosMitad: true, diasAnticipacion: 1,
        incluye: 'Hidratación',
      },
      aves: {
        nombre: 'Avistamiento de aves', max: 8, ninosMitad: true,
        modalidades: {
          'sin-guia': { nombre: 'Sin guía profesional', precio: 60000, diasAnticipacion: 1 },
          'con-guia': { nombre: 'Con guía profesional', precio: 120000, diasAnticipacion: 3, sujetoConfirmacion: true,
                        incluye: 'Guía profesional, hidratación y seguro' },
        },
      },
    },
  };

  function pesos(n) { return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function entero(v) { var n = Math.floor(Number(v)); return isFinite(n) && n >= 0 ? n : -1; }

  // Devuelve { ok, nombre, precioPersona, lineas, total, pagar, saldo, personas, ... } o { ok:false, error }
  function cotizar(p) {
    var a = CONFIG.actividades[p.actividad];
    if (!a) return { ok: false, error: 'Actividad no válida.' };
    var precio = a.precio, dias = a.diasAnticipacion, nombre = a.nombre, incluye = a.incluye || '', modalidad = null, sujeto = !!a.sujetoConfirmacion;
    if (a.modalidades) {
      var m = a.modalidades[p.modalidad];
      if (!m) return { ok: false, error: 'Elige la modalidad del recorrido.' };
      precio = m.precio; dias = m.diasAnticipacion; nombre = a.nombre + ' · ' + m.nombre; incluye = m.incluye || ''; modalidad = p.modalidad; sujeto = !!m.sujetoConfirmacion;
    }
    var adultos = entero(p.adultos), ninos = a.ninosMitad ? entero(p.ninos || 0) : 0;
    if (adultos < 0 || ninos < 0) return { ok: false, error: 'Revisa el número de personas.' };
    var personas = adultos + ninos;
    if (adultos < 1) return { ok: false, error: 'Debe ir al menos una persona mayor de ' + CONFIG.edadNinos + ' años.' };
    if (personas > a.max) return { ok: false, error: 'El máximo es ' + a.max + ' personas por grupo. Para grupos más grandes escríbenos por WhatsApp.' };

    var almuerzo = p.almuerzo || '';
    if (almuerzo && CONFIG.almuerzo.opciones.indexOf(almuerzo) < 0) return { ok: false, error: 'Opción de almuerzo no válida.' };

    var lineas = [];
    var tAdultos = adultos * precio;
    lineas.push({ texto: adultos + (adultos === 1 ? ' persona' : ' personas') + ' × ' + pesos(precio), valor: tAdultos });
    var tNinos = ninos * Math.round(precio / 2);
    if (ninos) lineas.push({ texto: ninos + (ninos === 1 ? ' niño' : ' niños') + ' (hasta ' + CONFIG.edadNinos + ' años) × ' + pesos(Math.round(precio / 2)), valor: tNinos });
    var tAlm = almuerzo ? personas * CONFIG.almuerzo.precio : 0;
    if (almuerzo) lineas.push({ texto: 'Almuerzo (' + almuerzo.toLowerCase() + ') × ' + personas, valor: tAlm });

    var total = tAdultos + tNinos + tAlm;
    var anticipo = Math.round(total * CONFIG.anticipo);
    var pagar = p.pagoCompleto ? total : anticipo;
    return {
      ok: true, actividad: p.actividad, modalidad: modalidad, nombre: nombre, incluye: incluye, precioPersona: precio,
      adultos: adultos, ninos: ninos, personas: personas, almuerzo: almuerzo, diasAnticipacion: dias, sujetoConfirmacion: sujeto,
      lineas: lineas, total: total, anticipo: anticipo, pagoCompleto: !!p.pagoCompleto, pagar: pagar, saldo: total - pagar,
    };
  }

  return { CONFIG: CONFIG, cotizar: cotizar, pesos: pesos };
});
