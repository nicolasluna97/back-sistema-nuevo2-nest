import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export type StatsMode = 'day' | 'week' | 'month' | 'year';

export class GetStatisticsDto {
  @IsIn(['day', 'week', 'month', 'year'])
  mode: StatsMode;

  @IsString()
  anchor: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : value;
  })
  @IsInt()
  tzOffset?: number;
}
