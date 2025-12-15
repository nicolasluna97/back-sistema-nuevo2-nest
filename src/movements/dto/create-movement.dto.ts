import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMovementDto {
  @IsUUID()
  customerId: string;

  @IsString()
  customerName: string;

  @IsUUID()
  productId: string;

  @IsString()
  productTitle: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2, 3, 4])
  priceKey: 1 | 2 | 3 | 4;

  @IsOptional()
  @IsString()
  status?: string | null;

  @IsOptional()
  @IsString()
  employee?: string | null;
}
