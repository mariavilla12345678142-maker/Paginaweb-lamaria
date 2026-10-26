// ===== Configuración: cambia aquí el número de WhatsApp si algún día cambia =====
var WHATSAPP = '573113977479';
var MENSAJE = 'Hola, quiero consultar disponibilidad en La María';
// WhatsApp de Jhon (reservas de cabalgatas). Mientras esté vacío, se usa el número principal.
var WHATSAPP_JHON = '573217568530';

// Todos los botones de WhatsApp de la página
document.querySelectorAll('.js-wa').forEach(function (a) {
  var texto = a.getAttribute('data-mensaje') || MENSAJE;
  var numero = (a.getAttribute('data-numero') === 'jhon' && WHATSAPP_JHON) ? WHATSAPP_JHON : WHATSAPP;
  a.href = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(texto);
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

// Comparador "2008 / Hoy" en Nuestra historia
document.querySelectorAll('.comparar').forEach(function (c) {
  var r = c.querySelector('input[type=range]');
  function mover() { c.style.setProperty('--pos', r.value + '%'); }
  r.addEventListener('input', mover);
  mover();
});

// Glosario: palabras que pueden no ser claras (se abren en una ventanita)
var GLOSARIO = {
  'silvopastoreo': {
    titulo: 'Silvopastoreo',
    texto: 'Es una forma de criar ganado y caballos en potreros con árboles. Los árboles dan sombra y alimento a los animales, protegen el suelo y el agua, y son hogar para aves y otros animales. Así se produce cuidando la tierra.',
    fotos: 'https://www.google.com/search?tbm=isch&q=silvopastoreo+Colombia',
    mas: 'https://es.wikipedia.org/wiki/Sistemas_silvopastoriles'
  },
  'rnsc': {
    titulo: 'Reserva Natural de la Sociedad Civil',
    texto: 'Es una finca privada que sus dueños deciden dedicar, por voluntad propia, a conservar la naturaleza. Queda registrada ante Parques Nacionales Naturales de Colombia y hace parte de las áreas protegidas del país.',
    fotos: 'https://www.google.com/search?tbm=isch&q=Reserva+Natural+de+la+Sociedad+Civil+Colombia',
    mas: 'https://www.google.com/search?q=Reserva+Natural+de+la+Sociedad+Civil+Parques+Nacionales'
  },
  'control-biologico': {
    titulo: 'Control biológico',
    texto: 'Es controlar las plagas con la ayuda de la misma naturaleza (insectos, aves, hongos buenos) en lugar de usar venenos.',
    fotos: 'https://www.google.com/search?tbm=isch&q=control+biol%C3%B3gico+de+plagas',
    mas: 'https://es.wikipedia.org/wiki/Control_biol%C3%B3gico'
  },
  'hide': {
    titulo: 'Hide para aves',
    texto: 'Es un escondite donde te sientas en silencio a observar y fotografiar aves de cerca, sin que se asusten.',
    fotos: 'https://www.google.com/search?tbm=isch&q=hide+avistamiento+de+aves'
  },
  'patacon': {
    titulo: 'Patacón',
    texto: 'Plátano verde frito y aplastado, crocante, típico de Colombia. Lo servimos con todo: hogao, guacamole y acompañamientos para que cada quien arme el suyo.',
    foto: 'img/almuerzo/patacon.jpg', fotoAlt: 'Patacones con hogao y guacamole servidos en la mesa de La María',
    fotos: 'https://www.google.com/search?tbm=isch&q=almuerzo+patac%C3%B3n+colombiano'
  },
  'fiambre': {
    titulo: 'Fiambre',
    texto: 'Almuerzo típico del campo colombiano que llega cerrado, envuelto en hoja de plátano como un tamal: al abrirlo encuentras arroz, carne, papa, huevo y otros acompañamientos. Ideal después de un paseo.',
    fotos: 'https://www.google.com/search?tbm=isch&q=fiambre+en+hoja+de+pl%C3%A1tano'
  }
};
(function () {
  var d = document.getElementById('glosario');
  if (!d || typeof d.showModal !== 'function') return;
  document.querySelectorAll('.glosa').forEach(function (a) {
    var g = GLOSARIO[a.getAttribute('data-glosa')];
    if (!g) return;
    a.href = g.fotos;
    a.setAttribute('title', '¿Qué es ' + g.titulo.toLowerCase() + '?');
    a.addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('glosario-titulo').textContent = g.titulo;
      document.getElementById('glosario-texto').textContent = g.texto;
      var im = document.getElementById('glosario-img');
      if (g.foto) { im.src = g.foto; im.alt = g.fotoAlt || ''; im.hidden = false; } else { im.hidden = true; im.removeAttribute('src'); }
      document.getElementById('glosario-fotos').href = g.fotos;
      var mas = document.getElementById('glosario-mas');
      if (g.mas) { mas.href = g.mas; mas.hidden = false; } else { mas.hidden = true; }
      d.showModal();
    });
  });
  d.querySelector('.glosario-cerrar').addEventListener('click', function () { d.close(); });
  d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
})();

// Portada: las fotos van cambiando cada 6 segundos (se detiene si la persona prefiere menos movimiento)
(function () {
  var fotos = document.querySelectorAll('.portada-foto.carrusel img');
  if (fotos.length < 2) return;
  // Si el equipo tiene las animaciones desactivadas, las fotos igual cambian, pero sin desvanecerse y más despacio
  var calma = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  fotos.forEach(function (f) { f.loading = 'eager'; });
  var i = 0;
  setInterval(function () {
    fotos[i].classList.remove('activa');
    i = (i + 1) % fotos.length;
    fotos[i].classList.add('activa');
  }, calma ? 9000 : 6000);
})();
