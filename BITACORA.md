# Bitácora de la página web · Reserva Natural La María
Armada el 26 de octubre de 2026. Reúne los documentos de novedades del proyecto (4, 12, 13 y 17 de octubre), los pendientes y el historial del repositorio de GitHub.

**Dirección de la página:** https://reservanaturallamaria.com
**Repositorio:** mariavilla12345678142-maker/Paginaweb-lamaria · rama publicada `claude/great-ramanujan-l75dcv`
**Dónde vive:** Cloudflare Pages (cada cambio guardado en GitHub se publica solo en un par de minutos)

---

## 1. Línea de tiempo

### 1–3 de octubre · Bases del proyecto
- Correo oficial de la finca: reservanaturallamaria@gmail.com.
- Decisiones de producto que después se llevaron a la página y a las 4 plataformas: desayuno americano incluido, descuentos 20 % por semana y 40 % por mes, temporada alta a $1.732.000 fijo de 1 a 11 personas, saldo del 50 % el día de llegada, horario de 9:00 a. m. a 4:00 p. m., 6 baños, pregunta "¿Cómo supiste de nosotros?".
- Proyecto de Firebase creado ("reserva-natural-la-maria").
- Guía de WhatsApp en PDF, versión 3, terminada.

### 4 de octubre · Dominio, Blaze y rediseño
- **Dominio comprado:** reservanaturallamaria.com en Cloudflare, a nombre de Jaime Hernán Botero Ocampo, con renovación automática (vence el 4 de octubre de 2027).
- **Plan Blaze de Firebase activado** con un saldo prepago.
- **Wompi rechazó el comercio** por "políticas internas". Se pidió soporte y se dejaron como plan B: Bold, ePayco y Mercado Pago.
- Página: rediseño "Naturaleza elegante" (verde, crema y dorado), "Nuestra historia" 1997–hoy, "Antes y ahora" con fotos de 2008, videos de la piscina, hectáreas corregidas a 42, pesca sin precio en "Otras cosas para hacer en tu estadía".
- **GitHub (4 oct, 8:18 p. m.):** primer registro del repositorio — script para detectar fotos repetidas y moverlas a "_REPETIDAS".

### 5 de octubre · Fotos, aves y ajustes
- Portada con 3 fotos que cambian cada 6 segundos (hamaca → piscina → cabalgata).
- Página nueva **aves.html** con buscador y filtros: **109 especies**.
- Ajustes de galería: se quitó el jacuzzi de noche, entró la mesa servida del kiosco, foto real de patacones, tarjeta "Almuerzo campestre".
- Cabalgata pasó a cupo de 30 personas; caminata quedó en 25.
- Almuerzo: se cambió el texto a "no vendemos medias porciones".
- Carpeta definitiva para guardar los archivos: OneDrive > Escritorio > RESERVA NATURAL LA MARIA > CLAUDE > PAGINA WEB.

### 11 de octubre · El problema de la carretera
- Se detectó que las reseñas del alojamiento bajan por el camino: los huéspedes vienen de Bogotá y llegan de noche. Los de cabalgatas llegan de día desde Armenia y tienen 4,9.
- Se redactó una descripción nueva, igual para todas partes: **10 km desde El Caimo, unos 45 minutos desde Armenia, recomendación de llegar con luz y video del recorrido al reservar.**

### 12 de octubre · Publicación con reservas por WhatsApp
- Página: "Cómo llegar" corregido, preparación de cada comida $30.000 para todo el grupo, corral para bebé sin costo, parqueadero y wifi.
- WhatsApp de Jhon para cabalgatas cambiado al **321 756 8530**.
- Se agregaron Resnatur (desde 2005), Zalvia (91 puntos), el hito **"2025 – Celebramos 20 años como reserva"** con 3 fotos, la opción "Reseñas" en el menú y el bloque **"Así es el camino"** con 4 fotos.
- **Decisión:** publicar ya con reservas por WhatsApp, sin pago en línea, mientras no hubiera pasarela aprobada (interruptor `PAGOS_EN_LINEA = false`).
- Capacidad unificada en **11 personas** y precio de preparación de comidas cargado en Facebook, Airbnb, Booking, Vrbo y la página web.
- Facebook: publicación fijada con la información clave, dirección, horario, enlaces y el teléfono de Jaime (311 749 7827).

### 13 de octubre · Bold reemplaza a Wompi
- **Bold aprobado.** Wompi queda descartado.
- El motor de pagos se reescribió para Bold: firma de integridad, botón de pago, aviso automático (webhook) y consulta del estado del pago. 40 pruebas automáticas pasaron.
- Textos de la página: "Pago seguro con Bold: tarjetas, PSE, Nequi y Botón Bancolombia."
- El paquete siguió saliendo con los pagos apagados, para encenderlos aparte cuando todo estuviera listo.

### 15–17 de octubre · Tripadvisor y Google
- Tripadvisor cabalgatas: ficha activa desde el 15 de octubre y **reclamada con el correo de la finca** el 17. Descripción, duración, fotos y teléfono de Jhon cargados.
- Tripadvisor alojamiento: ficha existente reclamada con el correo de la finca.
- Google: se identificó **cuál es la ficha buena del alojamiento** y se cargaron teléfono adicional, categoría, desayuno, wifi, parqueadero, piscina, jacuzzi, mascotas (perros sí, gatos no), accesibilidad y horarios. Se envió la invitación como Propietario al correo de la finca.
- Enlace correcto de reseñas del alojamiento enviado a Pilar (el primero que se mandó estaba errado).
- Descripción nueva de "llegar de día": **hecha en Airbnb y en Vrbo**, pendiente en Booking.

### 17 de octubre · Publicación en Cloudflare
- **GitHub (17 oct, 12:07 p. m.):** se subió la página completa — 73 archivos: la página pública (inicio, reservar alojamiento, cabalgata, caminata y aves, confirmación, panel de administración), el motor de reservas y pagos con Bold, los estilos y todas las fotos y logos.
- La página dejó de publicarse en Firebase Hosting y pasó a **Cloudflare Pages**, con el dominio propio conectado.

### 18–25 de octubre · Ajustes del negocio
- Bold: la cuenta quedó a nombre de Jaime; falta cambiar el usuario de contacto que aparece hoy.
- Se agregó el servicio de **restaurante opcional: alimentación completa a $100.000 por persona por día** (no reemplaza la opción de $30.000 por comida).
- Para **agencias de viajes** las actividades valen $15.000 más por persona; ya está en el cotizador del alojamiento y falta en el de cabalgatas.
- Se decidió empezar a publicar el alojamiento en **Despegar**.
- Guía del visitante: se decidió dejar **dos PDF separados**, uno en español y otro en inglés.

### 26 de octubre · Pendientes anotados en el repositorio
- **GitHub (26 oct, 9:11 a. m.):** se anotaron los pendientes en el archivo LEEME.
- **GitHub (26 oct, 9:13 a. m.):** se agregó el pendiente de canalizar toda la comunicación por WhatsApp.

---

## 2. Cómo está armada la página hoy

| Parte | Qué hace |
|---|---|
| `public/` | La página que ve el visitante: textos, fotos y estilos. Precios del alojamiento en `public/js/tarifas.js` y de las actividades en `public/js/actividades.js`. |
| `functions/api/` y `lib/` | El motor de reservas en Cloudflare: calcula el precio, aparta las fechas, crea el enlace de pago de Bold y confirma el pago. |
| `public/admin.html` | Panel privado para ver las reservas (pide una clave). |

Configuración en Cloudflare: sin comando de compilación, carpeta de salida `public`, almacenamiento con el nombre RESERVAS, y las variables `BOLD_LLAVE_IDENTIDAD`, `SITIO_URL`, `CLAVE_ADMIN` y los enlaces de calendario de Airbnb, Booking y Vrbo. En Bold, el aviso automático apunta a `https://reservanaturallamaria.com/api/bold-webhook`.

---

## 3. Pendientes al 26 de octubre de 2026

### De la página y los pagos
- [ ] Canalizar **toda** la comunicación por WhatsApp (+57 311 397 7479): avisos de cada reserva a Pilar, respuesta automática en Instagram y Facebook, y WhatsApp como contacto principal en Airbnb, Booking, Vrbo y Google Maps.
- [ ] Recuperar el acceso a Bold (cambiar el celular registrado y las llaves) y pegar la llave de identidad en Cloudflare.
- [ ] Hacer una reserva de prueba y luego pasar a la llave de producción de Bold.
- [ ] Conectar los calendarios (iCal) de Airbnb, Booking y Vrbo, y poner el calendario de la página en las tres plataformas.
- [ ] Traducir la página web al inglés.

### De plataformas
- [ ] Booking: descripción nueva de "llegar de día", precio de preparación de comidas y confirmar el máximo de 11 huéspedes.
- [ ] Responder las reseñas.
- [ ] Reenviar a los 4 huéspedes el enlace correcto de reseñas de Google.
- [ ] Aceptar, desde el correo de la finca, la invitación como propietario de la ficha de Google.
- [ ] Tripadvisor: revisar que todas las fotos quedaran publicadas y con descripción.
- [ ] Cotizador de cabalgatas: agregar la opción de agencias (+$15.000 por persona).

### De contenido y fotos
- [ ] Video más largo del tramo rural para el bloque "Así es el camino".
- [ ] Fotos que faltan: jacuzzi de noche, unión del río Quindío y el río Verde, caminatas reales, fiambre cerrado en hoja de plátano, cabalgatas de la familia.
- [ ] Definir si se contrata un dron para la foto aérea.
- [ ] Organizar las fotos repetidas de OneDrive (moverlas a "_REPETIDAS", sin borrar).
- [ ] Confirmar el dato de especies de aves: la página usa 109 y la descripción de Vrbo quedó con 115.
- [ ] Confirmar en qué kilómetro del aviso de la vía queda La María (km 1 San Gabriel o km 9 Bambusa).
