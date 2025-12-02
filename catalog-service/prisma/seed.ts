import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const client = prisma as any; // Cast keeps the seed script working even if the generated client is missing.

const products = [
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with adjustable DPI.',
    imageUrl: 'https://example.com/images/mouse.jpg',
    price: 29.99,
    variants: [
      { name: 'Black', priceDiff: 29.99, stock: 25 },
      { name: 'White', priceDiff: 29.99, stock: 18 }
    ]
  },
  {
    name: 'Mechanical Keyboard',
    description: 'Compact mechanical keyboard with RGB backlighting.',
    imageUrl: 'https://example.com/images/keyboard.jpg',
    price: 89.99,
    variants: [
      { name: 'Blue Switches', priceDiff: 89.99, stock: 12 },
      { name: 'Red Switches', priceDiff: 89.99, stock: 15 }
    ]
  },
  {
    name: 'Noise-Cancelling Headphones',
    description: 'Over-ear headphones with active noise cancellation.',
    imageUrl: 'https://example.com/images/headphones.jpg',
    price: 149.99,
    variants: [
      { name: 'Standard', priceDiff: 149.99, stock: 10 },
      { name: 'Travel Bundle', priceDiff: 169.99, stock: 6 }
    ]
  }
];

async function seed() {
  await client.variant.deleteMany();
  await client.product.deleteMany();

  for (const product of products) {
    await client.product.create({
      data: {
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price,
        variants: {
          create: product.variants.map((variant: any) => ({
            name: variant.name,
            priceDiff: variant.priceDiff,
            stock: variant.stock
          }))
        }
      }
    });
  }
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
