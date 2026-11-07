/* Pagos con Bold · La María
   Pregunta al servidor si los pagos en línea están encendidos (llaves de Bold puestas
   en Cloudflare) y abre la pasarela de Bold con los datos que arma el servidor. */
(function () {
  'use strict';
  var SCRIPT = 'https://checkout.bold.co/library/boldPaymentButton.js';

  var activos = fetch('/api/config', { headers: { Accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : {}; })
    .then(function (j) { return !!(j && j.pagos); })
    .catch(function () { return false; });

  function cargarScript() {
    return new Promise(function (ok, mal) {
      if (window.BoldCheckout) return ok();
      var s = document.createElement('script');
      s.src = SCRIPT; s.onload = ok; s.onerror = mal;
      document.head.appendChild(s);
    });
  }

  // boton: los datos que devuelve el servidor (orderId, amount, apiKey, integritySignature, …)
  function abrir(boton, alFallar) {
    cargarScript()
      .then(function () { new window.BoldCheckout(boton).open(); })
      .catch(function () { alFallar('No pudimos abrir la pasarela de Bold. Revisa tu conexión o escríbenos por WhatsApp.'); });
  }

  window.LaMariaPagos = { activos: activos, abrir: abrir };
})();
