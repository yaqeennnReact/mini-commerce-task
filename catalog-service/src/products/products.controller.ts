import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products') // <-- this defines the endpoint
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll() {
    return this.productsService.findAll();
  }
}
