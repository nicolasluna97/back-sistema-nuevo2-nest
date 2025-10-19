import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Like, Repository } from 'typeorm';

import { Product } from './entities/product.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { isUUID } from 'class-validator';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');
  
  constructor(

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>

  ){}

  async create(createProductDto: CreateProductDto) {
       
        try{

        const product = this.productRepository.create(createProductDto);
        await this.productRepository.save( product );

        return product;

      } catch (error) {
        this.handleDBExceptions(error);
      };

  }

// trae todos los productos
  findAll(PaginationDto: PaginationDto) {
    const {limit = 10, offset = 0 } = PaginationDto;

    return this.productRepository.find({ 
      take: limit,
      skip: offset
    });

  }

 async findOne(term: string): Promise<Product | Product[]> {
   
  console.log('Buscando término:', term);

   if (isUUID(term)) {
    // Por UUID sigue devolviendo un solo producto
    const product = await this.productRepository.findOneBy({ id: term });
    if (!product) throw new NotFoundException(`Product with id "${term}" not found`);
    return product;
    } else {
    // Por título devuelve array de productos
    const queryBuilder = this.productRepository.createQueryBuilder('prod');
    const products = await queryBuilder
      .where('UPPER(prod.title) LIKE :title', {
        title: `%${term.toUpperCase()}%`,
      })
      .getMany();

    if (products.length === 0)
      throw new NotFoundException(`No products found with term "${term}"`);
    
    return products;
    }
  };


   async update(id: string, updateProductDto: UpdateProductDto) {
    // Necesitamos un método que siempre devuelva UN producto para update
    const product = await this.findProductById(id);
    
    // Fusionar los cambios
    const updatedProduct = this.productRepository.merge(product, updateProductDto);
    
    // Guardar
    return await this.productRepository.save(updatedProduct);
  }

  async remove(id: string) {
    // Necesitamos un método que siempre devuelva UN producto para remove
    const product = await this.findProductById(id);
    await this.productRepository.remove(product);
    return { message: `Product with id ${id} deleted successfully` };
  }

  // MÉTODO NUEVO: Solo para obtener UN producto por ID (para update/remove)
  private async findProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    try {
      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.handleDBExceptions(error)
    };
    

    return product;
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505')
      throw new BadRequestException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException('Error - check logs');
  }
}
