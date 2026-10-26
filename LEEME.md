# Página web · Reserva Natural La María

Dirección: **https://reservanaturallamaria.com**

## Qué hay aquí
- `public/` → la página web (textos, fotos, estilos). Precios del alojamiento en `public/js/tarifas.js` y de las actividades en `public/js/actividades.js`.
- `functions/api/` y `lib/` → el "motor" de reservas que corre en Cloudflare: calcula el precio, aparta las fechas, crea el link de pago de **Bold** y confirma el pago.
- `public/admin.html` → panel privado para ver las reservas (pide la clave `CLAVE_ADMIN`).

## Configuración en Cloudflare (Workers y Pages → proyecto de la página)
- Compilación: sin comando de compilación · carpeta de salida `public`.
- Enlace KV con el nombre **RESERVAS**.
- Variables y secretos:
  - `BOLD_LLAVE_IDENTIDAD` (secreto): llave de identidad de Bold (la de pruebas para probar, la de producción para cobrar de verdad).
  - `SITIO_URL`: `https://reservanaturallamaria.com`
  - `CLAVE_ADMIN` (secreto): clave del panel de reservas.
  - `ICAL_AIRBNB`, `ICAL_BOOKING`, `ICAL_VRBO` (opcionales): enlaces de calendario para bloquear las fechas ya reservadas en esas plataformas.

## En Bold
- Webhook: `https://reservanaturallamaria.com/api/bold-webhook`

Cada cambio guardado en GitHub se publica solo en Cloudflare en un par de minutos.

## Pendientes
- [ ] Que toda la información de cada reserva (datos del cliente, fechas, valor pagado y saldo) le llegue a Pilar por WhatsApp.
- [ ] Recuperar el acceso a Bold (cambiar el celular registrado y las llaves) y pegar la llave de identidad en Cloudflare.
- [ ] Hacer una reserva de prueba y luego pasar a la llave de producción de Bold.
- [ ] Enlaces de calendario (iCal) de Airbnb, Booking y Vrbo.
