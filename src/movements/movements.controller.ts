import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle } from '@nestjs/throttler';
import { GetUser } from 'src/auth/decorators';
import { User } from 'src/auth/entities/user.entity';
import { MovementsService } from './movements.service';
import { GetMovementsDto } from './dto/get-movements.dto';

@Controller('movements')
@UseGuards(AuthGuard())
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get()
  @SkipThrottle()
  findAll(@Query() dto: GetMovementsDto, @GetUser() user: User) {
    return this.movementsService.findAll(dto, user);
  }
}
