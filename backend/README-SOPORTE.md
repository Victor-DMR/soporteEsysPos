# Sistema web de gestión de soportes técnicos

## Stack

- Laravel 10, Sanctum, MySQL
- React, Vite, Tailwind CSS
- Pusher + Laravel Echo

## Variables importantes

Configura `.env` con la base de datos y credenciales Pusher:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=soporte_esys_pos
DB_USERNAME=root
DB_PASSWORD=

BROADCAST_DRIVER=pusher
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_APP_CLUSTER=mt1
PUSHER_SCHEME=https

VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
```

Sin credenciales Pusher puedes dejar `BROADCAST_DRIVER=log` para probar CRUD/chat sin tiempo real externo. Al poner credenciales reales y `BROADCAST_DRIVER=pusher`, la tabla y el chat escuchan los canales `supports` y `support.{id}`.

## Probar

El proyecto ya trae dependencias instaladas. Si la base `soporte_esys_pos` existe en MySQL:

```bash
php artisan migrate --seed
npm run build
php artisan serve
```

Usuarios demo:

- Administrador: `admin@soporte.test` / `password`
- Técnico: `tecnico@soporte.test` / `password`

Rutas:

- Cliente: `/`
- Consulta cliente: `/estado`
- Login interno: `/login`
- Dashboard admin: `/admin`
- Técnico: `/tecnico`
