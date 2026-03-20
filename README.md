# Pasarela de Pago Universitaria - MVP

MVP full-stack con React + TypeScript (frontend), Express + TypeScript (backend), PostgreSQL, Stripe y Resend.

## Requisitos

- Node.js 22+
- Docker (opcional pero recomendado para PostgreSQL)

## Estructura

- packages/frontend: UI responsive y checkout
- packages/backend: API de estudiantes, conceptos, pagos y comprobantes
- packages/shared: tipos compartidos

## Configuracion

1. Backend
- Copia `packages/backend/.env.example` a `packages/backend/.env`
- Completa `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `UNIVERSITY_FROM_EMAIL`

2. Frontend
- Copia `packages/frontend/.env.example` a `packages/frontend/.env`
- Completa `VITE_STRIPE_PUBLISHABLE_KEY`

## Base de datos local

```bash
docker compose up -d
```

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Healthcheck: http://localhost:4000/health

## Build

```bash
npm run build
```

## Flujo implementado en esta iteracion

1. Registro de estudiante.
2. Seleccion de concepto de pago.
3. Creacion de PaymentIntent en Stripe.
4. Confirmacion de pago desde frontend con Stripe Elements.
5. Persistencia de pago y envio de correo de confirmacion.
6. Generacion de comprobante PDF descargable.

## Proximos pasos recomendados

1. Validar firma real del webhook Stripe y procesar eventos asincronos.
2. Endurecer controles de idempotencia con validacion previa por llave.
3. Agregar pruebas unitarias/integracion (frontend y backend).
4. Incorporar cola/reintentos para correos fallidos.
5. Mejorar UX de error y estados de pago pendientes.
