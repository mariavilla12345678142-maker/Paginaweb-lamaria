/* Reserva de actividades (cabalgata, caminata, avistamiento de aves) · La María */
(function () {
  'use strict';
  var A = window.Actividades, C = A.CONFIG;
  var WHATSAPP = '573113977479';
  var WHATSAPP_JHON = '573217568530';   // WhatsApp de Jhon (cabalgatas). Vacío = número principal
  // false = aún sin pasarela de pagos: la reserva se envía por WhatsApp. true = pago en línea (Bold).
  var PAGOS_EN_LINEA = false;
  var $ = function (id) { return document.getElementById(id); };
  var clave = document.body.getAttribute('data-actividad');
  var act = C.actividades[clave];
  var NUMERO = (clave === 'cabalgata' && WHATSAPP_JHON) ? WHATSAPP_JHON : WHATSAPP;
  var estado = { cot: null, enviando: false };

  document.querySelectorAll('.js-wa').forEach(function (a) {
    var numero = (clave === 'cabalgata' && WHATSAPP_JHON) ? WHATSAPP_JHON : WHATSAPP;
    a.href = 'https://wa.me/' + numero + '?text=' + encodeURIComponent('Hola, tengo una pregunta sobre la reserva de ' + act.nombre.toLowerCase() + ' en La María');
    a.target = '_blank'; a.rel = 'noopener';
  });

  function hoyColombia() { return new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10); }
  function sumarDias(s, n) { var d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function fechaLarga(s) { var d = new Date(s + 'T12:00:00Z'); return DIAS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' de ' + MESES[d.getUTCMonth()]; }

  // ---- Modalidad (solo aves) ----
  function modalidad() { var r = document.querySelector('input[name="modalidad"]:checked'); return r ? r.value : null; }
  function diasMinimos() { return act.modalidades ? (act.modalidades[modalidad()] || {}).diasAnticipacion || 1 : act.diasAnticipacion; }
  function ajustarFechaMinima() {
    var min = sumarDias(hoyColombia(), diasMinimos());
    $('fecha').min = min; $('fecha').max = sumarDias(hoyColombia(), 366);
    if ($('fecha').value && $('fecha').value < min) $('fecha').value = '';
    var m = act.modalidades ? (act.modalidades[modalidad()] || {}) : act;
    $('nota-fecha').textContent = (diasMinimos() > 1 ? 'Reserva con al menos ' + diasMinimos() + ' días de anticipación para programar el guía.' : 'Reserva con al menos un día de anticipación. Las reservas para mañana quedan sujetas a confirmación.') +
      (m.sujetoConfirmacion ? ' Sujeto a confirmación de la disponibilidad del guía: te escribimos por WhatsApp para confirmarte.' : '');
  }

  // ---- Horas ----
  C.horarios.forEach(function (h) { var o = document.createElement('option'); o.value = h; o.textContent = h; $('hora').appendChild(o); });

  // ---- Personas ----
  function llenar(sel, desde, hasta, sing, plur) {
    var v = sel.value; sel.innerHTML = '';
    for (var i = desde; i <= hasta; i++) { var o = document.createElement('option'); o.value = i; o.textContent = i + ' ' + (i === 1 ? sing : plur); sel.appendChild(o); }
    sel.value = v && +v <= hasta ? v : String(desde);
  }
  function actualizarPersonas() {
    var ninos = act.ninosMitad ? +$('ninos').value || 0 : 0;
    llenar($('adultos'), 1, act.max - ninos, act.ninosMitad ? 'persona' : 'persona', 'personas');
    if (act.ninosMitad) llenar($('ninos'), 0, act.max - (+$('adultos').value || 1), 'niño', 'niños');
  }
  $('max-personas').textContent = act.max;
  if (!act.ninosMitad) $('campo-ninos').hidden = true;
  llenar($('adultos'), 1, act.max, 'persona', 'personas');
  if (act.ninosMitad) llenar($('ninos'), 0, act.max - 1, 'niño', 'niños');

  // ---- Cotizar y pintar el resumen ----
  function datosCotizacion() {
    var alm = document.querySelector('input[name="almuerzo"]:checked');
    var pago = document.querySelector('input[name="pago"]:checked');
    return { actividad: clave, modalidad: modalidad(), adultos: +$('adultos').value, ninos: act.ninosMitad ? +$('ninos').value : 0,
      almuerzo: alm ? alm.value : '', pagoCompleto: pago && pago.value === 'completo' };
  }
  function actualizar() {
    var cot = A.cotizar(datosCotizacion());
    estado.cot = cot.ok ? cot : null;
    $('res-error').hidden = cot.ok; if (!cot.ok) $('res-error').textContent = cot.error;
    if (cot.ok) {
      $('res-nombre').textContent = cot.nombre;
      $('res-cuando').textContent = $('fecha').value ? fechaLarga($('fecha').value) + ' · ' + $('hora').value : 'Elige el día';
      $('res-lineas').innerHTML = cot.lineas.map(function (l) { return '<li><span>' + l.texto + '</span><span>' + A.pesos(l.valor) + '</span></li>'; }).join('');
      $('res-total').textContent = A.pesos(cot.total);
      $('res-pagar-etq').textContent = cot.pagoCompleto ? 'Pagas hoy (100%)' : 'Pagas hoy (50%)';
      $('res-pagar').textContent = A.pesos(cot.pagar);
      $('res-saldo').textContent = A.pesos(cot.saldo);
      $('linea-saldo').hidden = !cot.saldo;
      $('res-incluye').hidden = !cot.incluye; $('res-incluye').textContent = cot.incluye ? 'Incluye: ' + cot.incluye : '';
      var porConfirmar = !!$('fecha').value && ($('fecha').value <= sumarDias(hoyColombia(), 1) || cot.sujetoConfirmacion);
      $('res-confirmar').hidden = !porConfirmar;
      $('pago-50').textContent = A.pesos(cot.anticipo); $('pago-100').textContent = A.pesos(cot.total);
    }
    var listo = cot.ok && $('fecha').value;
    $('btn-pagar').disabled = !listo || estado.enviando;
    $('btn-pagar').textContent = estado.enviando ? 'Conectando con Bold…' : !$('fecha').value ? 'Elige el día' : cot.ok ? (PAGOS_EN_LINEA ? 'Pagar ' + A.pesos(cot.pagar) + ' con Bold' : 'Enviar solicitud por WhatsApp') : 'Revisa los datos';
    if (!PAGOS_EN_LINEA && cot.ok) $('res-pagar-etq').textContent = cot.pagoCompleto ? 'Pago para confirmar (100%)' : 'Anticipo para confirmar (50%)';
  }

  ['adultos', 'ninos'].forEach(function (id) { $(id).addEventListener('change', function () { actualizarPersonas(); actualizar(); }); });
  ['fecha', 'hora'].forEach(function (id) { $(id).addEventListener('change', actualizar); });
  document.querySelectorAll('input[name="almuerzo"], input[name="pago"]').forEach(function (r) { r.addEventListener('change', actualizar); });
  document.querySelectorAll('input[name="modalidad"]').forEach(function (r) { r.addEventListener('change', function () { ajustarFechaMinima(); actualizar(); }); });
  $('como-supo').addEventListener('change', function () { $('campo-como-supo-otro').hidden = this.value !== 'Otro'; });
  $('almuerzo-precio').textContent = A.pesos(C.almuerzo.precio);
  if (!PAGOS_EN_LINEA) {
    document.querySelectorAll('.politicas h3').forEach(function (h) { if (h.textContent === 'Antes de pagar') h.textContent = 'Antes de reservar'; });
    document.querySelectorAll('.subpaso').forEach(function (h) { if (h.textContent === '¿Cuánto quieres pagar hoy?') h.textContent = '¿Cuánto quieres pagar para confirmar?'; });
    var seg = document.querySelector('.seguro');
    if (seg) seg.textContent = 'Al enviar se abre WhatsApp con tu solicitud. Te confirmamos la disponibilidad y te enviamos los datos para el pago (transferencia, Nequi o enlace de pago).';
  }
  ajustarFechaMinima();
  actualizar();

  function mostrarError(t) { $('error').hidden = !t; $('error').textContent = t || ''; if (t) $('error').scrollIntoView({ behavior: 'smooth', block: 'center' }); }

  $('formulario').addEventListener('submit', function (ev) {
    ev.preventDefault();
    mostrarError('');
    if (!estado.cot || estado.enviando) return;
    var d = datosCotizacion();
    d.fecha = $('fecha').value; d.hora = $('hora').value;
    d.comentarios = $('comentarios').value; d.sitio = $('sitio').value;
    d.comoSupo = $('como-supo').value; d.comoSupoOtro = $('como-supo-otro').value.trim();
    d.aceptaNormas = $('acepta-normas').checked; d.aceptaDatos = $('acepta-datos').checked;
    d.cliente = { nombre: $('nombre').value.trim(), tipoDocumento: $('tipo-doc').value, documento: $('documento').value.trim(),
      email: $('email').value.trim(), celular: $('celular').value.trim() };
    var c = d.cliente;
    if (!d.fecha || d.fecha < $('fecha').min) return mostrarError('Elige un día a partir del ' + fechaLarga($('fecha').min) + '.');
    if (c.nombre.length < 5) return mostrarError('Escribe tu nombre completo.');
    if (c.documento.replace(/\W/g, '').length < 5) return mostrarError('Escribe tu número de documento.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return mostrarError('Revisa tu correo electrónico.');
    if (c.celular.replace(/\D/g, '').length < 10) return mostrarError('Escribe tu número de celular (10 dígitos).');
    if (!d.comoSupo) return mostrarError('Cuéntanos cómo supiste de nosotros.');
    if (d.comoSupo === 'Otro' && d.comoSupoOtro.length < 2) return mostrarError('Escribe dónde supiste de nosotros.');
    if (!d.aceptaNormas || !d.aceptaDatos) return mostrarError('Para continuar, acepta las condiciones y el tratamiento de datos.');

    if (!PAGOS_EN_LINEA) {
      var q = estado.cot;
      var msg = 'Hola, quiero reservar: ' + q.nombre + ' en La María.\n' +
        'Día: ' + fechaLarga(d.fecha) + ' · ' + d.hora + '\n' +
        q.lineas.map(function (l) { return '- ' + l.texto + ': ' + A.pesos(l.valor); }).join('\n') + '\n' +
        'Total según la página: ' + A.pesos(q.total) + ' (quiero pagar ' + (q.pagoCompleto ? 'el 100%' : 'el 50%') + ': ' + A.pesos(q.pagar) + ')\n\n' +
        'Nombre: ' + c.nombre + '\nDocumento: ' + c.tipoDocumento + ' ' + c.documento + '\nCorreo: ' + c.email + '\nCelular: ' + c.celular + '\n' +
        '¿Cómo supe de ustedes?: ' + d.comoSupo + (d.comoSupoOtro ? ' (' + d.comoSupoOtro + ')' : '') +
        (d.comentarios.trim() ? '\nComentarios: ' + d.comentarios.trim() : '');
      location.href = 'https://wa.me/' + NUMERO + '?text=' + encodeURIComponent(msg);
      return;
    }
    estado.enviando = true; actualizar();
    fetch('/api/actividades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) { estado.enviando = false; actualizar(); return mostrarError(j.error || 'No pudimos crear la reserva.'); }
        try { sessionStorage.setItem('lamaria_ref', j.referencia); } catch (e) {}
        location.href = j.urlPago;
      })
      .catch(function () {
        estado.enviando = false; actualizar();
        mostrarError('Esta es una vista de demostración: cuando la página esté publicada, este botón te lleva a Bold para pagar ' + A.pesos(estado.cot.pagar) + '.');
      });
  });
})();
