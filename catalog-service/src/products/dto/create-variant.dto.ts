import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateVariantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  priceDiff?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;
}
