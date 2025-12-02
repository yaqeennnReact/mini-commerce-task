import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      include: { variants: { orderBy: { id: 'asc' } } },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: { orderBy: { id: 'asc' } } },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async createProduct(dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        price: dto.price,
        variants: dto.variants
          ? {
              create: dto.variants.map((variant) => ({
                name: variant.name,
                priceDiff: variant.priceDiff ?? null,
                stock: variant.stock ?? 0,
              })),
            }
          : undefined,
      },
      include: { variants: { orderBy: { id: 'asc' } } },
    });

    return product;
  }

  async updateProduct(id: number, dto: UpdateProductDto) {
    await this.ensureProductExists(id);

    const data: Prisma.ProductUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.imageUrl !== undefined) {
      data.imageUrl = dto.imageUrl;
    }

    if (dto.price !== undefined) {
      data.price = dto.price;
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data,
      include: { variants: { orderBy: { id: 'asc' } } },
    });

    return updated;
  }

  async removeProduct(id: number) {
    await this.ensureProductExists(id);
    await this.prisma.$transaction([
      this.prisma.variant.deleteMany({ where: { productId: id } }),
      this.prisma.product.delete({ where: { id } }),
    ]);
  }

  async addVariant(productId: number, dto: CreateVariantDto) {
    await this.ensureProductExists(productId);
    await this.prisma.variant.create({
      data: {
        productId,
        name: dto.name,
        priceDiff: dto.priceDiff ?? null,
        stock: dto.stock ?? 0,
      },
    });

    return this.findOne(productId);
  }

  async updateVariant(productId: number, variantId: number, dto: UpdateVariantDto) {
    await this.ensureVariantBelongsToProduct(productId, variantId);

    const data: Prisma.VariantUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.priceDiff !== undefined) {
      data.priceDiff = dto.priceDiff;
    }

    if (dto.stock !== undefined) {
      data.stock = dto.stock;
    }

    await this.prisma.variant.update({
      where: { id: variantId },
      data,
    });

    return this.findOne(productId);
  }

  async removeVariant(productId: number, variantId: number) {
    await this.ensureVariantBelongsToProduct(productId, variantId);
    await this.prisma.variant.delete({ where: { id: variantId } });
  }

  private async ensureProductExists(id: number) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Product not found');
    }
  }

  private async ensureVariantBelongsToProduct(productId: number, variantId: number) {
    const variant = await this.prisma.variant.findUnique({ where: { id: variantId } });
    if (!variant || variant.productId !== productId) {
      throw new NotFoundException('Variant not found');
    }
  }
}
