
import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from 'src/authentificaion/auth.guard';
import { CreateProjectDto } from './dto/create-project';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
@ApiTags("Project and task module")
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectService: ProjectsService,private readonly prisma:PrismaService) {}
  @ApiOperation({summary:"create a project by a admin user add the users associate and they taks with the system association of prisma this endpoint required a token  "})
  @Post()
  @UseGuards(JwtAuthGuard)
  async createProject(
    @Body() project: CreateProjectDto,
    @Req() req,
    @Res() res,
  ) {
    const userId = req.user.id;
    const result = await this.projectService.create(project, userId);
    if (result) {
      const msg = 'project create successfully';
      return res.status(200).json({ msg });
    }
  }
  @ApiOperation({summary:"get all project with the users and they taks"})
  @Get()
  async getAll() {
    return this.projectService.findAll();
  }
  @ApiOperation({summary:"get all project create by an user  connect this endpoint required a token "})
  @Get('/user')
  @UseGuards(JwtAuthGuard)
  async findAllByUser(@Req() req) {
    const userId = req.user.id;
    return this.projectService.findAllByUser(userId);
  }
  @ApiOperation({summary:"update a project by id of a creator this endpoint required a token"})
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    return this.projectService.update(
      parseInt(id, 10),
      updateProjectDto,
      userId,
    );
  }
  @ApiOperation({summary:"delete a project by a creator this endpoint required a token "})
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(projectId: number, userId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { creator: true },
    });

    if (!project) {
      throw new ConflictException('Project not found.');
    }

    if (project.creatorId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this project.',
      );
    }

    try {
      // Supprimer d'abord les tâches associées au projet
      await this.prisma.task.deleteMany({
        where: {
          projectId,
        },
      });

      // Ensuite, supprimer le projet lui-même
      await this.prisma.project.delete({
        where: { id: projectId },
      });
    } catch (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }
}
