import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  userIds?: number[];

  @IsArray()
  @IsOptional()
  tasks?: {
    id?: number;
    title: string;
    description?: string;
    status: string;
    assignedToId?: number;
  }[];
}
