# Página web · Reserva Natural La María

Dirección: **https://reservanaturallamaria.com**

## Qué hay aquí
- `public/` → la página web (textos, fotos, estilos). Precios del alojamiento en `public/js/tarifas.js` y de las actividades en `public/js/actividades.js`.
- `functions/api/` y `lib/` → el "motor" de reservas que corre en Cloudflare: calcula el precio, aparta las fechas, prepara el **Botón de pagos de Bold** (con la firma de integridad) y confirma el pago.
- Los pagos en línea se encienden solos cuando las dos llaves de Bold están puestas en Cloudflare. Sin ellas, las reservas se envían por WhatsApp. Las cabalgatas siempre van por WhatsApp con Jhon.
- `public/admin.html` → panel privado para ver las reservas (pide la clave `CLAVE_ADMIN`).

## Configuración en Cloudflare (Workers y Pages → proyecto de la página)
- Compilación: sin comando de compilación · carpeta de salida `public`.
- Enlace KV con el nombre **RESERVAS**.
- Variables y secretos:
  - `BOLD_LLAVE_IDENTIDAD` (secreto): llave de identidad del Botón de pagos de Bold.
  - `BOLD_LLAVE_SECRETA` (secreto): llave secreta del Botón de pagos de Bold.
  - `SITIO_URL`: `https://reservanaturallamaria.com`
  - `CLAVE_ADMIN` (secreto): clave del panel de reservas.
  - `ICAL_AIRBNB`, `ICAL_BOOKING`, `ICAL_VRBO` (opcionales): enlaces de calendario para bloquear las fechas ya reservadas en esas plataformas.

## En Bold
- Webhook: `https://reservanaturallamaria.com/api/bold-webhook`

Cada cambio guardado en GitHub se publica solo en Cloudflare en un par de minutos.

## Pendientes
- [ ] Igualar precios en Airbnb, Booking y Vrbo con la página (el cliente paga lo mismo en todas; la comisión la asume Pilar). Totales de prueba: martes 24 nov 2026, 6 personas = $900.000; viernes 27 nov, 6 personas = $1.250.000; martes 24 nov, 8 personas = $1.020.000; 21 al 23 dic, 11 personas = $3.464.000.
- [ ] Booking (revisado el 7 nov 2026): sale "no disponible" en todas las fechas probadas (nov, dic, ene) y dice 5 baños en vez de 6. Revisar el calendario y los precios.
- [ ] Faltan en la página cambios del 12 de octubre que no venían en lamaria-web-v2: bloque "Así es el camino" (4 fotos), Zalvia (91 puntos) y la opción "Reseñas" en el menú.
- [ ] Canalizar TODA la comunicación por WhatsApp (+57 311 397 7479):
  - Avisos de cada reserva a Pilar por WhatsApp (datos del cliente, fechas, valor pagado y saldo).
  - Instagram y Facebook: respuesta automática que mande a los clientes al WhatsApp y botón de WhatsApp en el perfil.
  - Airbnb, Booking, Vrbo y Google Maps: dejar el WhatsApp como contacto principal.
- [ ] Recuperar el acceso a Bold (cambiar el celular registrado y las llaves) y pegar la llave de identidad en Cloudflare.
- [ ] Hacer una reserva de prueba y luego pasar a la llave de producción de Bold.
- [ ] Poner en Cloudflare (Settings → Variables, tipo Secret) los enlaces de calendario de Airbnb, Booking y Vrbo: ICAL_AIRBNB, ICAL_BOOKING, ICAL_VRBO. Los enlaces están en el archivo lamaria-web-v2.zip (OneDrive), dentro de functions/.env. NO subirlos a GitHub: el repositorio es público.
