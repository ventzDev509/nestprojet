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

@ApiTags("Module de projet et de tâche")
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectService: ProjectsService, private readonly prisma: PrismaService) {}

  @ApiOperation({summary: "Créer un projet par un utilisateur admin, ajouter les utilisateurs associés et leurs tâches avec l'association système de Prisma. Cet endpoint nécessite un token."})
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
      const msg = 'Projet créé avec succès';
      return res.status(200).json({ msg });
    }
  }

  @ApiOperation({summary: "Obtenir tous les projets avec les utilisateurs et leurs tâches"})
  @Get()
  async getAll() {
    return this.projectService.findAll();
  }

  @ApiOperation({summary: "Obtenir tous les projets créés par un utilisateur. Cet endpoint nécessite un token."})
  @Get('/user')
  @UseGuards(JwtAuthGuard)
  async findAllByUser(@Req() req) {
    const userId = req.user.id;
    return this.projectService.findAllByUser(userId);
  }

  @ApiOperation({summary: "Mettre à jour un projet par son id pour le créateur. Cet endpoint nécessite un token."})
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

  @ApiOperation({summary: "Supprimer un projet par son créateur. Cet endpoint nécessite un token."})
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') projectId: string, @Req() req) {
    const userId = req.user.id;
    const project = await this.prisma.project.findUnique({
      where: { id: parseInt(projectId, 10) },
      include: { creator: true },
    });

    if (!project) {
      throw new ConflictException('Projet non trouvé.');
    }

    if (project.creatorId !== userId) {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à supprimer ce projet.',
      );
    }

    try {
      // Suppression de toutes les tâches associées au projet
      await this.prisma.task.deleteMany({
        where: {
          projectId: parseInt(projectId, 10),
        },
      });

      // Suppression du projet
      await this.prisma.project.delete({
        where: { id: parseInt(projectId, 10) },
      });

      return { message: 'Projet et tâches associées supprimés avec succès.' };
    } catch (error) {
      throw new Error(`Échec de la suppression du projet : ${error.message}`);
    }
  }
}