import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // default constructor

async function main() {
  const products = await prisma.product.findMany();
  console.log(products);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
