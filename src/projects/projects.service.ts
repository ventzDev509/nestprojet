import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

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
        'A project with the same name already exists for this creator.',
      );
    }
    const isAdmin = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (isAdmin) {
      if (isAdmin.role == 'admin') {
        try {
          // Vérification de chaque assignedToId avant la création des tâches
          const validTasks = await Promise.all(
            tasks?.map(async (task) => {
              const userExists = await this.prisma.user.findUnique({
                where: {
                  id: task.assignedToId,
                },
              });
              if (!userExists) {
                throw new ConflictException(
                  `User with ID ${task.assignedToId} does not exist.`,
                );
              }
              return task;
            }),
          );

          // Vérification de chaque userId avant la connexion des utilisateurs au projet
          const validUserIds = await Promise.all(
            userIds?.map(async (id) => {
              const userExists = await this.prisma.user.findUnique({
                where: {
                  id,
                },
              });
              if (!userExists) {
                throw new ConflictException(
                  `User with ID ${id} does not exist.`,
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
          // Capturer et gérer l'erreur ici pour éviter le crash du serveur
          if (error instanceof ConflictException) {
            throw error; // Ré-lance l'exception ConflictException pour la capturer au niveau du contrôleur
          }
          throw new Error(`Failed to create project: ${error.message}`);
        }
      } else {
        throw new ForbiddenException('Access denied');
      }
    }
  }

  async findAll() {
    // Récupérer tous les projets avec leurs détails de créateur, utilisateurs et tâches
    const projects = await this.prisma.project.findMany({
      include: {
        creator: true, // Inclure les détails du créateur
        users: true, // Inclure les utilisateurs associés
        tasks: true, // Inclure les tâches du projet
      },
    });

    // Supprimer les mots de passe des utilisateurs
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

  async findAllByUser(userId: number) {
    // Récupérer tous les projets auxquels l'utilisateur fait partie
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

    // Supprimer les mots de passe des utilisateurs
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

  // update a project by a admin user

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
      throw new ConflictException('Project not found.');
    }

    if (project.creatorId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this project.',
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
              throw new ConflictException(`User with ID ${id} does not exist.`);
            }
          }),
        );
      }

      // Update project details and relations
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
      throw new Error(`Failed to update project: ${error.message}`);
    }
  }

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
      await this.prisma.project.delete({
        where: { id: projectId },
      });
    } catch (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }
}
