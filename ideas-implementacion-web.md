# Ideas de Implementación — Web de Gestión de Entradas

## Qué tiene que hacer la app

Tres vistas públicas con lógica simple pero con estado persistente (necesita base de datos):

| Ruta | Función |
|---|---|
| `/` | Info de pago + contador de entradas restantes por tanda |
| `/register-sale` | Registrar comprador + código de promo → genera QR único |
| `/check-qr` | Valida un QR y dice cuántas entradas vale |

---

## Stack recomendado

### Framework: Next.js (App Router)

La opción más directa para esto. Permite escribir el frontend y el backend en el mismo proyecto (API Routes / Server Actions), lo que simplifica el deploy y evita tener dos repos separados.

- Renderizado de server components para el contador en tiempo real
- API routes para las acciones (registrar venta, validar QR)
- Fácil integración con las bases de datos más populares

**Alternativa más liviana:** SvelteKit — menos boilerplate, excelente performance, igualmente deployable en Vercel. Buena opción si el equipo no tiene experiencia previa en React.

### Base de datos: Supabase

Postgres gestionado con panel visual, autenticación lista para usar y una API automática sobre las tablas. Tiene **free tier** generoso (suficiente para este volumen de uso).

Alternativas:
- **Neon** — Postgres serverless, integración nativa con Vercel, también free tier
- **Railway** — incluye base de datos + hosting en un solo lugar, $5/mes, muy simple de configurar
- **Turso** — SQLite en la nube, cero configuración, ideal si el equipo quiere algo mínimo

### ORM: Prisma

Mapeo de la base de datos a objetos TypeScript. Permite cambiar de base de datos sin tocar lógica de negocio, y las migraciones son simples de manejar.

### QR: librería `qrcode` (npm)

Genera el QR en el servidor a partir de un token único (UUID). Se puede devolver como imagen PNG o como SVG inline.

### Estilos: Tailwind CSS

Rápido de maquetar, funciona perfecto con Next.js sin configuración extra.

---

## Plataformas de deployment

| Plataforma | Pros | Contras | Precio |
|---|---|---|---|
| **Vercel** | Deploy automático desde GitHub, integración nativa con Next.js, CDN global, dominio gratis | Base de datos requiere servicio externo (Neon, Supabase) | Free para proyectos pequeños |
| **Railway** | Todo en uno (app + DB), deploy desde GitHub, muy fácil | Menos optimizado para Next.js que Vercel | ~$5/mes |
| **Render** | Tiene free tier, soporta Docker si escala | Más lento en el arranque (cold starts en plan free) | Free / $7+ mes |
| **Fly.io** | Muy flexible, buena performance global | Requiere más configuración manual | Free tier + uso |

**Recomendación:** Vercel para el hosting + Supabase o Neon para la base de datos. Ambas tienen free tier, el deploy desde GitHub es automático y la configuración tarda menos de una hora.

---

## Esquema de base de datos

```
Batch (formerly Tanda)
──────────────────────
id            UUID (PK)
name          TEXT          -- e.g. "Batch 1 - Community"
price         INT           -- in ARS
total         INT           -- available tickets for sale
sold          INT           -- incremented on each registered sale
active        BOOLEAN
created_at    TIMESTAMP

PromoCode
─────────
id            UUID (PK)
code          TEXT (UNIQUE) -- the code the buyer enters
batch_id      UUID (FK → Batch)
uses          INT DEFAULT 0 -- how many times it has been used
created_at    TIMESTAMP

Sale
────
id            UUID (PK)
buyer_name    TEXT          -- buyer's name
promo_code_id UUID (FK → PromoCode, nullable)
qr_token      TEXT (UNIQUE) -- UUID encoded into the QR
ticket_count  INT           -- 1 normally, 2 on every 3rd use of a promo code
used          BOOLEAN DEFAULT false
used_at       TIMESTAMP
created_at    TIMESTAMP
```

---

## Lógica de negocio

### QR generation (`/register-sale`)

```
1. Receive buyer_name + promo code (optional)
2. If promo code provided:
   a. Look up PromoCode in DB
   b. Increment `uses` by 1
   c. If uses % 3 === 0 → ticket_count = 2, else → ticket_count = 1
3. Generate qr_token = random UUID
4. Insert Sale into DB
5. Increment Batch.sold
6. Generate QR image from token
7. Return QR to client (as image, or redirect to /check-qr?token=xxx)
```

The "third use" rule can be adjusted — as defined: every time a code is used a multiple of 3 times, the QR generated at that moment is worth 2 tickets. If the business logic changes (e.g. only the first time it reaches 3), it's a one-line change.

### QR validation (`/check-qr`)

```
1. Read token from QR (via camera → URL contains token as query param)
2. Look up Sale by qr_token
3. If not found → show "Invalid QR"
4. If sale.used === true → show "QR already used"
5. If valid → show buyer name, ticket count, and "Mark as used" button
6. On confirm → set sale.used = true, sale.used_at = now()
```

`/check-qr` does not auto-mark the QR as used — it requires an explicit action to avoid accidentally burning a ticket on an accidental scan.

---

## Rutas y API

```
GET  /                         → home page (alias, buttons, ticket counter)
GET  /register-sale            → registration form
POST /api/sales                → create sale, returns qr_token
GET  /api/batches/active       → active batch with remaining tickets
GET  /check-qr?token=xxx       → validation page
POST /api/qr/validate          → mark QR as used
```

---

## Consideraciones de seguridad / operación

- **Panel de admin básico:** conviene agregar una ruta `/admin` protegida con una clave simple (no hace falta auth complejo) para ver el listado de ventas, cambiar la tanda activa y deshabilitar códigos de promo.
- **El QR no expira por tiempo** — solo se invalida cuando se marca como usado. Si alguien saca una captura de pantalla, sigue siendo válido hasta que lo escaneen en la puerta.
- **El token en el QR puede ser una URL** del tipo `https://tudominio.com/check-qr?token=abc123`, así cualquier celular con cámara puede leerlo sin app adicional.
- **Rate limiting en `/api/sales`:** con un límite simple (ej: 5 requests/minuto por IP) se evita que alguien llene la base de datos de ventas falsas.

---

## Estimación de complejidad

| Parte | Complejidad | Tiempo estimado |
|---|---|---|
| Setup Next.js + Supabase + Vercel | Baja | 1-2 horas |
| Esquema DB + Prisma | Baja | 1 hora |
| Página `/` con contador | Baja | 2-3 horas |
| `/register-sale` + generación QR | Media | 3-4 horas |
| `/check-qr` + validación | Baja | 2 horas |
| Panel admin básico | Media | 3-4 horas |
| **Total estimado** | | **~12-16 horas** |

Es un proyecto de fin de semana para alguien con experiencia en Next.js, o una semana cómoda para alguien que lo esté aprendiendo.

---

## Próximos pasos sugeridos

1. Confirmar stack (Next.js + Supabase + Vercel es la ruta más directa)
2. Crear el proyecto en Vercel y conectarlo a un repo GitHub
3. Crear la DB en Supabase y definir las tablas
4. Construir primero `/check-qr` (la más crítica el día del evento) y después las demás
