import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovementsController } from './movements.controller';
import { MovementsService } from './movements.service';
import { Movement } from './entities/movement.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Movement]), AuthModule],
  controllers: [MovementsController],
  providers: [MovementsService],
  exports: [MovementsService, TypeOrmModule],
})
export class MovementsModule {}
