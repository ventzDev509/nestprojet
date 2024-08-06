import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsInt()
  @IsOptional()
  assignedToId?: number;
}
