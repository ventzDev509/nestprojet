import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray, ValidateNested } from 'class-validator';
import { CreateTaskDto } from './CreateTaskDto ';
import { Type } from 'class-transformer';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  userIds?: number[];

  @IsArray()
  @IsOptional()
  // tasks?: {
  //   title: string;
  //   description?: string;
  //   status: string;
  //   assignedToId?: number;
  // }[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskDto)
  @IsOptional()
  tasks?: CreateTaskDto[];

}
