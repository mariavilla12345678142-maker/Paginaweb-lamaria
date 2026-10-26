/* Página de reservas · La María */
(function () {
  'use strict';
  var T = window.Tarifas;
  var WHATSAPP = '573113977479';
  // false = aún sin pasarela de pagos: la reserva se envía por WhatsApp. true = pago en línea (Bold).
  var PAGOS_EN_LINEA = false;
  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  var MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  var $ = function (id) { return document.getElementById(id); };
  var estado = { hoy: null, ocupadas: {}, llegada: null, salida: null, mes: null, demo: false, cotizacion: null, enviando: false };

  document.querySelectorAll('.js-wa').forEach(function (a) {
    a.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hola, tengo una pregunta sobre reservar en La María');
    a.target = '_blank'; a.rel = 'noopener';
  });

  // Huéspedes
  for (var i = 1; i <= T.CONFIG.maxHuespedes; i++) {
    var o = document.createElement('option'); o.value = i; o.textContent = i + (i === 1 ? ' persona' : ' personas');
    $('huespedes').appendChild(o);
  }
  $('huespedes').value = String(Math.min(6, T.CONFIG.maxHuespedes));

  function fechaBonita(s, conAnio) {
    var p = s.split('-');
    return (+p[2]) + ' ' + MES_CORTO[+p[1] - 1] + (conAnio ? ' ' + p[0] : '');
  }
  function hoyColombia() { return new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10); }

  // ---------- Disponibilidad ----------
  function cargar() {
    if (!PAGOS_EN_LINEA) {
      var av = $('aviso-demo');
      av.innerHTML = '<strong>Reserva por WhatsApp.</strong> Elige tus fechas y envíanos la solicitud: te confirmamos la disponibilidad y te enviamos los datos para pagar el anticipo.';
      iniciar(hoyColombia(), [], false); av.hidden = false;
      return;
    }
    fetch('/api/disponibilidad', { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error('respuesta'); iniciar(j.hoy, j.ocupadas, false); })
      .catch(function () {
        // Sin servidor (por ejemplo, en la vista previa): datos de ejemplo
        var h = hoyColombia(), ej = [];
        [[4, 3], [11, 2], [19, 4], [33, 3]].forEach(function (x) { for (var k = 0; k < x[1]; k++) ej.push(T.sumarDias(h, x[0] + k)); });
        iniciar(h, ej, true);
      });
  }
  function iniciar(hoy, ocupadas, demo) {
    estado.hoy = hoy; estado.demo = demo; estado.ocupadas = {};
    ocupadas.forEach(function (n) { estado.ocupadas[n] = true; });
    estado.mes = hoy.slice(0, 7);
    $('aviso-demo').hidden = !demo;
    pintar();
  }

  // ---------- Calendario ----------
  function libre(f) { return f >= estado.hoy && !estado.ocupadas[f]; }
  function primeraOcupadaDespues(f) {
    for (var k = 1; k <= 31; k++) { var d = T.sumarDias(f, k); if (!libre(d)) return d; }
    return T.sumarDias(f, 31);
  }
  function mesSiguiente(ym, n) {
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n;
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    return y + '-' + String(m + 1).padStart(2, '0');
  }

  function pintarMes(ym) {
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7);
    var primero = ym + '-01';
    var dias = new Date(Date.UTC(y, m, 0)).getUTCDate();
    var inicio = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
    var limiteSalida = estado.llegada && !estado.salida ? primeraOcupadaDespues(estado.llegada) : null;

    var html = '<div class="mes"><div class="mes-titulo">' + MESES[m - 1] + ' ' + y + '</div><div class="dias-semana">' +
      DIAS.map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div><div class="dias">';
    for (var v = 0; v < inicio; v++) html += '<span></span>';
    for (var d = 1; d <= dias; d++) {
      var f = ym + '-' + String(d).padStart(2, '0');
      var clases = ['dia'], habil = false, etiqueta = d + ' de ' + MESES[m - 1];
      var pasado = f < estado.hoy, ocupado = estado.ocupadas[f];
      if (!pasado && T.tipoNoche(f).tipo === 'alta') clases.push('alta');
      if (pasado) clases.push('pasado');
      else if (ocupado) clases.push('ocupado');
      if (estado.llegada && !estado.salida) {
        // Eligiendo salida: días después de la llegada hasta la primera noche ocupada (inclusive)
        if (f > estado.llegada && f <= limiteSalida) { habil = true; clases.push('posible'); }
        else if (f < estado.llegada || f === estado.llegada) habil = !pasado && !ocupado;
      } else {
        habil = !pasado && !ocupado;
      }
      if (estado.llegada && f === estado.llegada) clases.push('inicio');
      if (estado.salida && f === estado.salida) clases.push('fin');
      if (estado.llegada && estado.salida && f > estado.llegada && f < estado.salida) clases.push('rango');
      if (ocupado && !pasado) etiqueta += ', ocupado';
      html += '<button type="button" class="' + clases.join(' ') + '" data-f="' + f + '"' + (habil ? '' : ' disabled') +
        ' aria-label="' + etiqueta + '"' + ((f === estado.llegada || f === estado.salida) ? ' aria-pressed="true"' : '') + '>' + d + '</button>';
    }
    return html + '</div></div>';
  }

  function pintar() {
    var cal = $('calendario');
    var anterior = estado.mes > estado.hoy.slice(0, 7);
    var tope = mesSiguiente(estado.hoy.slice(0, 7), 16);
    cal.innerHTML = '<div class="cal-nav"><button type="button" class="cal-flecha" id="cal-ant" aria-label="Mes anterior"' + (anterior ? '' : ' disabled') + '>‹</button>' +
      '<button type="button" class="cal-flecha" id="cal-sig" aria-label="Mes siguiente"' + (estado.mes < tope ? '' : ' disabled') + '>›</button></div>' +
      '<div class="meses">' + pintarMes(estado.mes) + pintarMes(mesSiguiente(estado.mes, 1)) + '</div>' +
      '<p class="cal-pista">' + (estado.llegada && !estado.salida ? 'Ahora elige el día de salida.' : !estado.llegada ? 'Toca el día de llegada.' : '') + '</p>';
    $('cal-ant').onclick = function () { estado.mes = mesSiguiente(estado.mes, -1); pintar(); };
    $('cal-sig').onclick = function () { estado.mes = mesSiguiente(estado.mes, 1); pintar(); };
    cal.querySelectorAll('.dia:not([disabled])').forEach(function (b) { b.onclick = function () { elegir(b.getAttribute('data-f')); }; });
    actualizar();
  }

  function elegir(f) {
    if (!estado.llegada || estado.salida || f <= estado.llegada) { estado.llegada = f; estado.salida = null; }
    else estado.salida = f;
    pintar();
  }
  $('btn-limpiar').onclick = function () { estado.llegada = null; estado.salida = null; pintar(); };
  $('huespedes').onchange = actualizar;

  // ---------- Resumen y precio ----------
  function actualizar() {
    $('txt-llegada').textContent = estado.llegada ? fechaBonita(estado.llegada, true) : 'Elige en el calendario';
    $('txt-salida').textContent = estado.salida ? fechaBonita(estado.salida, true) : '—';
    $('btn-limpiar').hidden = !estado.llegada;
    var c = null;
    $('res-error').hidden = true;
    if (estado.llegada && estado.salida) {
      c = T.cotizar(estado.llegada, estado.salida, $('huespedes').value);
      if (!c.ok) { $('res-error').textContent = c.error; $('res-error').hidden = false; c = null; }
    }
    estado.cotizacion = c;
    $('resumen-vacio').hidden = !!c;
    $('resumen-detalle').hidden = !c;
    if (c) {
      $('res-fechas').textContent = fechaBonita(estado.llegada) + ' → ' + fechaBonita(estado.salida, true) + ' · ' +
        c.cantidadNoches + (c.cantidadNoches === 1 ? ' noche' : ' noches') + ' · ' + c.huespedes + (c.huespedes === 1 ? ' persona' : ' personas');
      var grupos = {};
      c.noches.forEach(function (n) { var k = n.nombre + '|' + n.valor; grupos[k] = (grupos[k] || 0) + 1; });
      var html = Object.keys(grupos).map(function (k) {
        var p = k.split('|'), cant = grupos[k];
        return '<li><span>' + cant + ' × ' + p[0].toLowerCase() + ' (' + T.pesos(+p[1]) + ')</span><span>' + T.pesos(cant * +p[1]) + '</span></li>';
      }).join('');
      if (c.adicionales) html += '<li><span>' + c.huespedesAdicionales + ' huésped' + (c.huespedesAdicionales > 1 ? 'es' : '') + ' adicional' + (c.huespedesAdicionales > 1 ? 'es' : '') + ' × ' + c.nochesConAdicional + ' noche' + (c.nochesConAdicional > 1 ? 's' : '') + '</span><span>' + T.pesos(c.adicionales) + '</span></li>';
      if (c.descuento) html += '<li class="descuento"><span>' + c.descuentoNombre + ' (' + Math.round(c.descuentoPorcentaje * 100) + '%)' + (c.noches.some(function (n) { return n.tipo === 'alta'; }) ? ' · no aplica en temporada alta' : '') + '</span><span>−' + T.pesos(c.descuento) + '</span></li>';
      html += '<li class="incluye"><span>Desayuno americano incluido</span><span>✓</span></li>';
      $('res-lineas').innerHTML = html;
      $('res-total').textContent = T.pesos(c.total);
      $('res-anticipo').textContent = T.pesos(c.anticipo);
      $('res-saldo').textContent = T.pesos(c.saldo);
      $('res-confirmar').hidden = !(estado.llegada <= T.sumarDias(estado.hoy, 1));
    }
    var b = $('btn-pagar');
    b.disabled = !c || estado.enviando;
    b.textContent = estado.enviando ? 'Preparando el pago…' : c ? (PAGOS_EN_LINEA ? 'Pagar anticipo de ' + T.pesos(c.anticipo) : 'Enviar solicitud por WhatsApp') : (estado.llegada ? 'Elige la salida' : 'Elige tus fechas');
  }

  // ---------- Enviar ----------
  function mostrarError(msg) { var e = $('error'); e.textContent = msg; e.hidden = !msg; if (msg) e.scrollIntoView({ block: 'center', behavior: 'smooth' }); }

  $('como-supo').addEventListener('change', function () { $('campo-como-supo-otro').hidden = this.value !== 'Otro'; });
  $('formulario').addEventListener('submit', function (ev) {
    ev.preventDefault();
    mostrarError('');
    if (!estado.cotizacion || estado.enviando) return;
    var datos = {
      llegada: estado.llegada, salida: estado.salida, huespedes: +$('huespedes').value, mascotas: $('mascotas').checked,
      comentarios: $('comentarios').value, sitio: $('sitio').value,
      comoSupo: $('como-supo').value, comoSupoOtro: $('como-supo-otro').value.trim(),
      aceptaNormas: $('acepta-normas').checked, aceptaDatos: $('acepta-datos').checked,
      cliente: { nombre: $('nombre').value.trim(), tipoDocumento: $('tipo-doc').value, documento: $('documento').value.trim(),
        email: $('email').value.trim(), celular: $('celular').value.trim() }
    };
    var c = datos.cliente;
    if (c.nombre.length < 5) return mostrarError('Escribe tu nombre completo.');
    if (c.documento.replace(/\W/g, '').length < 5) return mostrarError('Escribe tu número de documento.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return mostrarError('Revisa tu correo electrónico.');
    if (c.celular.replace(/\D/g, '').length < 10) return mostrarError('Escribe tu número de celular (10 dígitos).');
    if (!datos.comoSupo) return mostrarError('Cuéntanos cómo supiste de nosotros.');
    if (datos.comoSupo === 'Otro' && datos.comoSupoOtro.length < 2) return mostrarError('Escribe dónde supiste de nosotros.');
    if (!datos.aceptaNormas || !datos.aceptaDatos) return mostrarError('Para continuar, acepta las normas de la casa y el tratamiento de datos.');

    if (!PAGOS_EN_LINEA) {
      var q = estado.cotizacion;
      var msg = 'Hola, quiero reservar el alojamiento en La María.\n' +
        'Llegada: ' + fechaBonita(estado.llegada, true) + '\nSalida: ' + fechaBonita(estado.salida, true) +
        ' (' + q.cantidadNoches + (q.cantidadNoches === 1 ? ' noche' : ' noches') + ')\n' +
        'Personas: ' + datos.huespedes + (datos.mascotas ? ' · con mascota' : '') + '\n' +
        'Total según la página: ' + T.pesos(q.total) + ' (anticipo 50%: ' + T.pesos(q.anticipo) + ')\n\n' +
        'Nombre: ' + c.nombre + '\nDocumento: ' + datos.cliente.tipoDocumento + ' ' + c.documento + '\nCorreo: ' + c.email + '\nCelular: ' + c.celular + '\n' +
        '¿Cómo supe de ustedes?: ' + datos.comoSupo + (datos.comoSupoOtro ? ' (' + datos.comoSupoOtro + ')' : '') +
        (datos.comentarios.trim() ? '\nComentarios: ' + datos.comentarios.trim() : '');
      window.location.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
      return;
    }
    if (estado.demo) {
      return mostrarError('Esta es una vista de demostración: cuando la página esté publicada, este botón te lleva a Bold para pagar ' + T.pesos(estado.cotizacion.anticipo) + '.');
    }
    estado.enviando = true; actualizar();
    fetch('/api/reservas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) })
      .then(function (r) { return r.json().then(function (j) { return { r: r, j: j }; }); })
      .then(function (x) {
        if (!x.j.ok) {
          estado.enviando = false;
          if (x.r.status === 409) { cargar(); estado.llegada = estado.salida = null; }
          actualizar(); return mostrarError(x.j.error || 'No pudimos crear la reserva.');
        }
        try { sessionStorage.setItem('lamaria_ref', x.j.referencia); } catch (e) { /* sin almacenamiento */ }
        window.location.href = x.j.urlPago;
      })
      .catch(function () { estado.enviando = false; actualizar(); mostrarError('No hay conexión. Intenta de nuevo o escríbenos por WhatsApp.'); });
  });

  if (!PAGOS_EN_LINEA) modoWhatsApp();
  function modoWhatsApp() {
    document.querySelectorAll('.politicas h3').forEach(function (h) { if (h.textContent === 'Antes de pagar') h.textContent = 'Antes de reservar'; });
    var seg = document.querySelector('.seguro');
    if (seg) seg.textContent = 'Al enviar se abre WhatsApp con tu solicitud. Te confirmamos la disponibilidad y te enviamos los datos para pagar el anticipo del 50% (transferencia, Nequi o enlace de pago).';
    var et = document.querySelector('.linea.anticipo span'); if (et) et.textContent = 'Anticipo para confirmar (50%)';
  }
  cargar();
})();
