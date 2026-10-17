/* =====================================================================
   TARIFAS Y TEMPORADAS · La María
   ---------------------------------------------------------------------
   Este archivo lo usan la página (para mostrar el precio) y el servidor
   (para cobrar). Si cambias algo aquí y lo guardas en GitHub,
   Cloudflare vuelve a publicar la página sola en un par de minutos.
   ===================================================================== */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Tarifas = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {

  var CONFIG = {
    // Precio por noche de la casa completa, en pesos colombianos
    entreSemana: 900000,      // noches de domingo a jueves
    finDeSemana: 1250000,     // noches de viernes y sábado
    temporadaAlta: 1732000,   // precio FIJO: Semana Santa, 15 jun–15 ago, receso de octubre, dic–ene y puentes festivos

    huespedesIncluidos: 6,    // temporada baja: la tarifa incluye hasta 6 personas
    huespedAdicional: 60000,  // temporada baja: por persona adicional, por noche
    adicionalEnTemporadaAlta: false, // en temporada alta el precio es fijo (1 a 11 personas)
    maxHuespedes: 11,

    minimoNoches: 1,
    minimoNochesTemporadaAlta: 2,

    anticipo: 0.5,            // 50% al reservar, el resto el día de llegada

    // Temporadas altas por fechas fijas (mes-día, inclusive; son NOCHES)
    temporadasFijas: [
      { nombre: 'Vacaciones de mitad de año', desde: '06-15', hasta: '08-15' },
      { nombre: 'Diciembre y enero',          desde: '12-15', hasta: '01-15' }
    ],
    semanaSanta: true,        // desde el sábado antes del Domingo de Ramos hasta el sábado santo
    recesoOctubre: true,      // receso escolar: del sábado al domingo antes del festivo del 12 de octubre
    puentesFestivos: true,    // las 3 noches de cada puente festivo
    fechasAltasExtra: ['2026-10-12', '2026-12-05', '2026-12-06', '2026-12-07', '2026-12-08'], // noches sueltas en temporada alta (decisión de Pilar, 4 oct 2026: igual que Airbnb)

    // Descuentos por estadía larga (iguales en Airbnb, Booking y Vrbo).
    // Se aplican solo a las noches de temporada baja (y sus personas adicionales);
    // las noches de temporada alta no tienen descuento.
    descuentos: [
      { nombre: 'Descuento por mes',    desdeNoches: 28, porcentaje: 0.40 },
      { nombre: 'Descuento por semana', desdeNoches: 7,  porcentaje: 0.20 }
    ]
  };

  // ---------- Fechas (siempre como texto AAAA-MM-DD, sin horas) ----------
  function aFecha(s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function aTexto(d) { return d.toISOString().slice(0, 10); }
  function sumarDias(s, n) { var d = aFecha(s); d.setUTCDate(d.getUTCDate() + n); return aTexto(d); }
  function diaSemana(s) { return aFecha(s).getUTCDay(); } // 0 domingo … 6 sábado
  function noches(llegada, salida) {
    var r = [], d = llegada;
    while (d < salida) { r.push(d); d = sumarDias(d, 1); }
    return r;
  }
  function esFechaValida(s) {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && aTexto(aFecha(s)) === s;
  }

  // ---------- Festivos de Colombia (Ley 51 de 1983, "Ley Emiliani") ----------
  function pascua(anio) {
    var a = anio % 19, b = Math.floor(anio / 100), c = anio % 100, d = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451), mes = Math.floor((h + l - 7 * m + 114) / 31),
        dia = ((h + l - 7 * m + 114) % 31) + 1;
    return aTexto(new Date(Date.UTC(anio, mes - 1, dia)));
  }
  function alLunes(s) { var w = diaSemana(s); return w === 1 ? s : sumarDias(s, (8 - w) % 7); }
  var cacheFestivos = {};
  function festivos(anio) {
    if (cacheFestivos[anio]) return cacheFestivos[anio];
    var y = anio + '-', P = pascua(anio);
    var lista = [y + '01-01', y + '05-01', y + '07-20', y + '08-07', y + '12-08', y + '12-25',
      sumarDias(P, -3), sumarDias(P, -2)];
    ['01-06', '03-19', '06-29', '08-15', '10-12', '11-01', '11-11'].forEach(function (md) { lista.push(alLunes(y + md)); });
    lista.push(sumarDias(P, 43), sumarDias(P, 64), sumarDias(P, 71)); // Ascensión, Corpus, Sagrado Corazón
    cacheFestivos[anio] = lista.sort();
    return cacheFestivos[anio];
  }

  // ---------- ¿Qué tipo de noche es? ----------
  function enRangoAnual(s, desde, hasta) {
    var md = s.slice(5);
    return desde <= hasta ? (md >= desde && md <= hasta) : (md >= desde || md <= hasta);
  }
  function nochesDePuente(anio) {
    var r = {};
    festivos(anio).concat(festivos(anio + 1).slice(0, 3)).forEach(function (f) {
      var w = diaSemana(f);
      if (w === 1) { r[sumarDias(f, -3)] = 1; r[sumarDias(f, -2)] = 1; r[sumarDias(f, -1)] = 1; }   // vie, sáb, dom
      if (w === 5) { r[sumarDias(f, -1)] = 1; r[f] = 1; r[sumarDias(f, 1)] = 1; }                     // jue, vie, sáb
      if (w === 6) { r[sumarDias(f, -1)] = 1; r[f] = 1; }                                             // vie, sáb
    });
    return r;
  }
  function tipoNoche(s) {
    var anio = +s.slice(0, 4);
    for (var i = 0; i < CONFIG.temporadasFijas.length; i++) {
      var t = CONFIG.temporadasFijas[i];
      if (enRangoAnual(s, t.desde, t.hasta)) return { tipo: 'alta', nombre: t.nombre };
    }
    if (CONFIG.semanaSanta) {
      var P = pascua(anio);
      if (s >= sumarDias(P, -9) && s <= P) return { tipo: 'alta', nombre: 'Semana Santa' }; // viernes antes de Ramos hasta la noche del Domingo de Pascua
    }
    if (CONFIG.recesoOctubre) {
      var f12 = alLunes(anio + '-10-12'); // festivo del 12 de octubre (se corre al lunes)
      if (s >= sumarDias(f12, -9) && s <= sumarDias(f12, -1)) return { tipo: 'alta', nombre: 'Receso de octubre' };
    }
    if ((CONFIG.fechasAltasExtra || []).indexOf(s) >= 0) return { tipo: 'alta', nombre: 'Temporada alta' };
    if (CONFIG.puentesFestivos && nochesDePuente(anio)[s]) return { tipo: 'alta', nombre: 'Puente festivo' };
    var w = diaSemana(s);
    if (w === 5 || w === 6) return { tipo: 'finde', nombre: 'Fin de semana' };
    return { tipo: 'semana', nombre: 'Entre semana' };
  }
  function precioNoche(s) {
    var t = tipoNoche(s).tipo;
    return t === 'alta' ? CONFIG.temporadaAlta : t === 'finde' ? CONFIG.finDeSemana : CONFIG.entreSemana;
  }

  // ---------- Cotización completa ----------
  // Devuelve { ok, error?, noches:[{fecha,tipo,nombre,valor}], subtotal, adicionales, descuento, total, anticipo, saldo }
  function cotizar(llegada, salida, huespedes) {
    if (!esFechaValida(llegada) || !esFechaValida(salida)) return { ok: false, error: 'Fechas no válidas.' };
    if (salida <= llegada) return { ok: false, error: 'La salida debe ser después de la llegada.' };
    huespedes = parseInt(huespedes, 10);
    if (!(huespedes >= 1 && huespedes <= CONFIG.maxHuespedes)) return { ok: false, error: 'El número de huéspedes debe estar entre 1 y ' + CONFIG.maxHuespedes + '.' };
    var ns = noches(llegada, salida);
    if (ns.length > 30) return { ok: false, error: 'Para estadías de más de 30 noches escríbenos por WhatsApp.' };
    var detalle = ns.map(function (f) { var t = tipoNoche(f); return { fecha: f, tipo: t.tipo, nombre: t.nombre, valor: precioNoche(f) }; });
    var hayAlta = detalle.some(function (n) { return n.tipo === 'alta'; });
    var minimo = hayAlta ? CONFIG.minimoNochesTemporadaAlta : CONFIG.minimoNoches;
    if (ns.length < minimo) return { ok: false, error: 'En estas fechas la estadía mínima es de ' + minimo + ' noches.' };
    var subtotal = detalle.reduce(function (a, n) { return a + n.valor; }, 0);
    var extra = Math.max(0, huespedes - CONFIG.huespedesIncluidos);
    var nochesConAdicional = detalle.filter(function (n) { return CONFIG.adicionalEnTemporadaAlta || n.tipo !== 'alta'; }).length;
    var adicionales = extra * CONFIG.huespedAdicional * nochesConAdicional;
    // Descuento por semana o por mes: solo sobre las noches de temporada baja y sus adicionales
    var desc = null;
    for (var j = 0; j < CONFIG.descuentos.length; j++) {
      if (ns.length >= CONFIG.descuentos[j].desdeNoches) { desc = CONFIG.descuentos[j]; break; }
    }
    var descuento = 0;
    if (desc) {
      var base = detalle.reduce(function (a, n) { return n.tipo === 'alta' ? a : a + n.valor + extra * CONFIG.huespedAdicional; }, 0);
      descuento = Math.round(base * desc.porcentaje);
    }
    var total = subtotal + adicionales - descuento;
    var anticipo = Math.round(total * CONFIG.anticipo);
    return { ok: true, noches: detalle, cantidadNoches: ns.length, huespedes: huespedes, huespedesAdicionales: nochesConAdicional ? extra : 0, nochesConAdicional: nochesConAdicional,
             subtotal: subtotal, adicionales: adicionales,
             descuento: descuento, descuentoNombre: descuento ? desc.nombre : null, descuentoPorcentaje: descuento ? desc.porcentaje : 0,
             total: total, anticipo: anticipo, saldo: total - anticipo };
  }

  function pesos(n) { return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

  return { CONFIG: CONFIG, cotizar: cotizar, tipoNoche: tipoNoche, precioNoche: precioNoche, festivos: festivos,
           pascua: pascua, noches: noches, sumarDias: sumarDias, esFechaValida: esFechaValida, pesos: pesos };
});
