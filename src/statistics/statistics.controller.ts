// src/statistics/statistics.controller.ts
import { BadRequestException, Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatisticsService } from './statistics.service';
import { GetStatisticsDto } from './dto/get-statistics.dto';

@Controller('statistics')
@UseGuards(AuthGuard())
export class StatisticsController {
  constructor(private readonly statsSvc: StatisticsService) {}

  @Get()
  getStatistics(@Req() req: any, @Query() dto: GetStatisticsDto) {
    const tzOffset = dto.tzOffset !== undefined ? Number(dto.tzOffset) : 0;

    // tzOffset debe ser entero (minutos)
    if (!Number.isInteger(tzOffset)) {
      throw new BadRequestException('tzOffset must be an integer number');
    }

    return this.statsSvc.getStatistics(req.user.id, {
      mode: dto.mode,
      anchor: dto.anchor,
      tzOffset,
    });
  }
}
