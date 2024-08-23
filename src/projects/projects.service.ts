import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project';
import { UpdateProjectDto } from './dto/update-project.dto';

// Service de gestion des projets
@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // Création d'un nouveau projet
  async create(createProjectDto: CreateProjectDto, userId: number) {
    const { name, description, userIds, tasks } = createProjectDto;

    // Vérification de l'existence d'un projet avec le même nom et creatorId
    const existingProject = await this.prisma.project.findFirst({
      where: {
        name,
        creatorId: userId,
      },
    });

    if (existingProject) {
      throw new ConflictException(
        'Un projet avec le même nom existe déjà pour ce créateur.',
      );
    }

    // Vérification si l'utilisateur est un administrateur
    const isAdmin = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (isAdmin) {
      if (isAdmin.role == 'admin') {
        try {
          // Vérification de l'existence de chaque utilisateur assigné aux tâches
          const validTasks = await Promise.all(
            tasks?.map(async (task) => {
              const userExists = await this.prisma.user.findUnique({
                where: {
                  id: task.assignedToId,
                },
              });
              if (!userExists) {
                throw new ConflictException(
                  `L'utilisateur avec l'ID ${task.assignedToId} n'existe pas.`,
                );
              }
              return task;
            }),
          );

          // Vérification de l'existence de chaque utilisateur à connecter au projet
          const validUserIds = await Promise.all(
            userIds?.map(async (id) => {
              const userExists = await this.prisma.user.findUnique({
                where: {
                  id,
                },
              });
              if (!userExists) {
                throw new ConflictException(
                  `L'utilisateur avec l'ID ${id} n'existe pas.`,
                );
              }
              return id;
            }),
          );

          // Création du projet avec les tâches et les utilisateurs validés
          const project = await this.prisma.project.create({
            data: {
              name,
              description,
              creatorId: userId,
              users: {
                connect: validUserIds.map((id) => ({ id })),
              },
              tasks: {
                create: validTasks.map((task) => ({
                  title: task.title,
                  description: task.description,
                  status: task.status,
                  assignedToId: task.assignedToId,
                })),
              },
            },
            include: {
              tasks: true,
              users: true,
            },
          });

          return project;
        } catch (error) {
          // Gestion des erreurs lors de la création du projet
          if (error instanceof ConflictException) {
            throw error; // Relancer l'exception ConflictException pour la capturer au niveau du contrôleur
          }
          throw new Error(`Échec de la création du projet : ${error.message}`);
        }
      } else {
        throw new ForbiddenException('Accès refusé');
      }
    }
  }

  // Récupération de tous les projets avec leurs détails
  async findAll() {
    const projects = await this.prisma.project.findMany({
      include: {
        creator: true, // Inclure les détails du créateur
        users: true, // Inclure les utilisateurs associés
        tasks: true, // Inclure les tâches du projet
      },
    });

    // Suppression des mots de passe des utilisateurs pour la sécurité
    const sanitizedProjects = projects.map((project) => ({
      ...project,
      creator: {
        ...project.creator,
        password: undefined, // Exclure le mot de passe du créateur
      },
      users: project.users.map((user) => ({
        ...user,
        password: undefined, // Exclure le mot de passe des utilisateurs
      })),
    }));

    return sanitizedProjects;
  }

  // Récupération des projets associés à un utilisateur
  async findAllByUser(userId: number) {
    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { creatorId: userId }, // Projets créés par l'utilisateur
          { users: { some: { id: userId } } }, // Projets où l'utilisateur est associé
        ],
      },
      include: {
        creator: true,
        users: true,
        tasks: {
          where: {
            assignedToId: userId, // Filtrer les tâches assignées à l'utilisateur
          },
        },
      },
    });

    // Suppression des mots de passe des utilisateurs pour la sécurité
    const sanitizedProjects = projects.map((project) => ({
      ...project,
      creator: {
        ...project.creator,
        password: undefined,
      },
      users: project.users.map((user) => ({
        ...user,
        password: undefined,
      })),
    }));

    return sanitizedProjects;
  }

  // Mise à jour d'un projet par un utilisateur administrateur
  async update(
    projectId: number,
    updateProjectDto: UpdateProjectDto,
    userId: number,
  ) {
    const { name, description, userIds, tasks } = updateProjectDto;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { creator: true },
    });

    if (!project) {
      throw new ConflictException('Projet non trouvé.');
    }

    if (project.creatorId !== userId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à mettre à jour ce projet.",
      );
    }

    try {
      // Vérification des utilisateurs à associer au projet
      if (userIds) {
        await Promise.all(
          userIds.map(async (id) => {
            const userExists = await this.prisma.user.findUnique({
              where: { id },
            });
            if (!userExists) {
              throw new ConflictException(`L'utilisateur avec l'ID ${id} n'existe pas.`);
            }
          }),
        );
      }

      // Mise à jour des détails du projet et des relations
      const updatedProject = await this.prisma.project.update({
        where: { id: projectId },
        data: {
          name,
          description,
          users: userIds
            ? {
                set: userIds.map((id) => ({ id })),
              }
            : undefined,
          tasks: tasks
            ? {
                upsert: tasks.map((task) => ({
                  where: { id: task.id || 0 },
                  update: {
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    assignedToId: task.assignedToId,
                  },
                  create: {
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    assignedToId: task.assignedToId,
                  },
                })),
              }
            : undefined,
        },
        include: {
          tasks: true,
        },
      });

      return updatedProject;
    } catch (error) {
      throw new Error(`Échec de la mise à jour du projet : ${error.message}`);
    }
  }

  // Suppression d'un projet
  async delete(projectId: number, userId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { creator: true },
    });

    if (!project) {
      throw new ConflictException('Projet non trouvé.');
    }

    if (project.creatorId !== userId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à supprimer ce projet.",
      );
    }

    try {
      await this.prisma.project.delete({
        where: { id: projectId },
      });
    } catch (error) {
      throw new Error(`Échec de la suppression du projet : ${error.message}`);
    }
  }
}