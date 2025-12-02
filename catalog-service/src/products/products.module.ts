import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AdminProductsController } from './admin-products.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService, PrismaService],
})
export class ProductsModule {}
