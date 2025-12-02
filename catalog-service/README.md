# Catalog Service

NestJS + Prisma service that stores products and their variants for both the public storefront and the admin dashboard.

## Requirements

- Node.js 20+
- npm 10+
- A MySQL schema (or any Prisma-compatible database) referenced via `DATABASE_URL`

## Setup

```powershell
npm install
copy .env.example .env   # update DATABASE_URL before continuing
npx prisma migrate deploy #migrate DB changes
```

The migrations assume a database named `mini_commerce_catalog`. Rename as needed when you create the schema.

## Running Locally

```powershell
npm run start:dev
```

The service listens on `http://localhost:3000` and exposes:

- `GET /products` – storefront listing with variants
- `GET /admin/products` – admin listing with variants
- `POST /admin/products` – create a product (optionally with variants)
- `PUT /admin/products/:id` – update product details
- `DELETE /admin/products/:id` – remove a product and its variants
- `POST /admin/products/:id/variants` – add a variant to an existing product
- `PUT /admin/products/:id/variants/:variantId` – update a variant
- `DELETE /admin/products/:id/variants/:variantId` – delete a variant

DTO contracts live in `src/products/dto` if you need to review request payloads.

## Smoke Test

With the service running:

```powershell
curl http://localhost:3000/products
curl -X POST http://localhost:3000/admin/products -H "Content-Type: application/json" -d @example-product.json
```

Use the admin area inside the web application to generate example payloads quickly.
