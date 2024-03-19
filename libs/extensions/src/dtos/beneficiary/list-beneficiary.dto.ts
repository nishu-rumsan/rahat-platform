import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import { PaginationDto } from '@rumsan/extensions/dtos';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ListBeneficiaryDto {
  // @IsIn(['createdAt', 'updatedAt', 'fullName', 'gender'])
  // override sort = 'createdAt';

  // override order: 'asc' | 'desc' = 'desc';

  sort: string;
  order: 'asc' | 'desc';

  @ApiProperty({ example: 1 })
  @IsNumber()
  page: number;

  @ApiProperty({ example: '10' })
  @IsNumber()
  perPage: number;

  @ApiPropertyOptional({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ example: 'MALE' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: 'REFERRED' })
  @IsString()
  @IsOptional()
  type?: string;
}

export class ListProjectBeneficiaryDto {
  sort: string;
  order: 'asc' | 'desc';

  @ApiProperty({ example: 1 })
  @IsNumber()
  page: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  perPage: number;

  @ApiProperty({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
  @IsString()
  @IsNotEmpty()
  projectId: string;
}