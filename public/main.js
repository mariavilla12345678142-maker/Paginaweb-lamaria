// ===== Configuración: cambia aquí el número de WhatsApp si algún día cambia =====
var WHATSAPP = '573113977479';
var MENSAJE = 'Hola, quiero consultar disponibilidad en La María';

// Todos los botones de WhatsApp de la página
document.querySelectorAll('.js-wa').forEach(function (a) {
  var texto = a.getAttribute('data-mensaje') || MENSAJE;
  a.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
  a.target = '_blank';
  a.rel = 'noopener';
});

// Menú del celular
var menu = document.getElementById('menu-movil');
var abrir = document.querySelector('.encabezado .boton-menu');
function cerrarMenu() { menu.classList.remove('abierto'); abrir.setAttribute('aria-expanded', 'false'); }
abrir.addEventListener('click', function () { menu.classList.add('abierto'); abrir.setAttribute('aria-expanded', 'true'); });
menu.querySelector('.cerrar').addEventListener('click', cerrarMenu);
menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', cerrarMenu); });

// Año del pie de página
document.getElementById('anio').textContent = new Date().getFullYear();
