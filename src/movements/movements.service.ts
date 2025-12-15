import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Movement } from './entities/movement.entity';
import { GetMovementsDto } from './dto/get-movements.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(Movement)
    private readonly movementRepo: Repository<Movement>,
  ) {}

  async create(dto: CreateMovementDto, user: User) {
    const movement = this.movementRepo.create({
      ...dto,
      userId: user.id,
      status: dto.status ?? null,
      employee: dto.employee ?? null,
    });
    return this.movementRepo.save(movement);
  }

  async findAll(dto: GetMovementsDto, user: User) {
    const range = dto.range ?? '24h';
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const where: any = { userId: user.id };

    if (range !== 'all') {
      const now = new Date();
      const from = new Date(now);
      if (range === '24h') from.setHours(from.getHours() - 24);
      if (range === '7d') from.setHours(from.getHours() - 168);

      where.createdAt = MoreThanOrEqual(from);
    }

    const [data, total] = await this.movementRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data,
      page,
      limit,
      total,
      totalPages,
    };
  }
}
