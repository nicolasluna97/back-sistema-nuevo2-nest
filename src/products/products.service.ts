import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUUID } from 'class-validator';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { User } from '../auth/entities/user.entity';

// OJO: este import tiene que existir realmente en tu proyecto.
// Si tu ruta es distinta, ajustala.
import { MovementsService } from 'src/movements/movements.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly movementsService: MovementsService,
  ) {}

  async create(createProductDto: CreateProductDto, user: User) {
    try {
      const product = this.productRepository.create({
        ...createProductDto,
        user,
        userId: user.id,
      });

      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto, user: User) {
    const { limit = 10, offset = 0 } = paginationDto;

    return await this.productRepository.find({
      where: { userId: user.id },
      take: limit,
      skip: offset,
      relations: ['user'],
    });
  }

  async findOne(term: string, user: User): Promise<Product | Product[]> {
    if (isUUID(term)) {
      const product = await this.productRepository.findOne({
        where: { id: term, userId: user.id },
      });

      if (!product) {
        throw new NotFoundException(`Product with id "${term}" not found`);
      }

      return product;
    }

    const products = await this.productRepository
      .createQueryBuilder('prod')
      .where('prod.userId = :userId', { userId: user.id })
      .andWhere('UPPER(prod.title) LIKE :title', {
        title: `%${term.toUpperCase()}%`,
      })
      .getMany();

    if (products.length === 0) {
      throw new NotFoundException(`No products found with term "${term}"`);
    }

    return products;
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const product = await this.findProductByIdAndUser(id, user);

    const updatedProduct = this.productRepository.merge(product, updateProductDto);
    return await this.productRepository.save(updatedProduct);
  }

  /**
   * Descuenta stock de un producto del usuario autenticado.
   * - Usa transacción + lock pesimista para evitar stock negativo con ventas simultáneas.
   * - Registra un movimiento básico (sin cliente/precio todavía).
   */
  async decreaseStock(id: string, quantity: number, user: User) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0.');
    }

    // 1) Descontar stock de forma segura
    const updatedProduct = await this.productRepository.manager.transaction(
      async (manager) => {
        const repo = manager.getRepository(Product);

        const product = await repo.findOne({
          where: { id, userId: user.id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with id "${id}" not found or you don't have permission to access it`,
          );
        }

        if (product.stock < quantity) {
          throw new BadRequestException(
            `No hay suficiente stock para "${product.title}". Stock: ${product.stock}, pedido: ${quantity}.`,
          );
        }

        product.stock = product.stock - quantity;
        await repo.save(product);

        return product;
      },
    );

    // 2) Registrar movimiento (MVP)
    //    NOTA: acá no tenemos customerId / unitPrice / priceKey porque el endpoint actual no lo envía.
    //    Cuando adaptemos el DTO del endpoint, esto se completa.
    try {
      await this.movementsService.create(
        {
          // customerId: null,
          // customerName: null,
          productId: updatedProduct.id,
          productTitle: updatedProduct.title,
          quantity,
          // unitPrice: null,
          // priceKey: null,
          // status: null,
          // employee: null,
        } as any,
        user,
      );
    } catch (err) {
      // Preferible loguear para no “romper” la venta si el movimiento falla.
      // Si querés consistencia 100%, lo movemos a una transacción compartida con Movements.
      this.logger.error('No se pudo registrar el movimiento (venta ya aplicada).', err);
    }

    return updatedProduct;
  }

  async remove(id: string, user: User) {
    const product = await this.findProductByIdAndUser(id, user);
    await this.productRepository.remove(product);
    return { message: `Product with id ${id} deleted successfully` };
  }

  private async findProductByIdAndUser(id: string, user: User): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, userId: user.id },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with id "${id}" not found or you don't have permission to access it`,
      );
    }

    return product;
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error);
    throw new InternalServerErrorException('Error - check logs');
  }
}
