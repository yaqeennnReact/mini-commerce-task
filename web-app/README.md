# Web App

Next.js storefront + admin console for the mini-commerce prototype.

## Requirements

- Node.js 20+
- npm 10+

## Setup

```powershell
npm install
```

The app uses the following environment variables (place them in `.env.local`):

```
NEXT_PUBLIC_CATALOG_API_URL=http://localhost:3000
NEXT_PUBLIC_SALES_API_URL=http://localhost:8000
```

## Running

```powershell
npm run dev
```

Open `http://localhost:3003` (or the port shown in the console) for the storefront and `http://localhost:3003/admin` for the admin panel.

## Features

- Product grid with variant-aware pricing
- Cart overlay + dedicated checkout page that submits to the Sales service
- Admin section for managing products, variants, and tax rate (via Sales service)

## Smoke Test

1. Start the catalog and sales services.
2. Run `npm run dev` in this folder.
3. Visit `/` to add a product to the cart, then open the cart overlay and checkout.
4. Confirm the order appears in the admin Orders tab and the product list reflects any edits.
