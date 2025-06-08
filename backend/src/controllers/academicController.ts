import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { UserRole } from '@prisma/client';

export class AcademicController {
  /**
   * Get all niveaux
   */
  static async getNiveaux(req: Request, res: Response): Promise<void> {
    try {
      const niveaux = await prisma.niveau.findMany({
        orderBy: { ordre: 'asc' },
        include: {
          filieres: {
            where: { isDeleted: false },
            select: {
              id: true,
              nom: true,
              code: true
            }
          },
          semestres: {
            orderBy: { ordre: 'asc' },
            select: {
              id: true,
              nom: true,
              ordre: true
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Niveaux récupérés avec succès',
        data: niveaux
      });
    } catch (error) {
      logger.error('Error getting niveaux:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des niveaux'
      });
    }
  }

  /**
   * Get all filieres
   */
  static async getFilieres(req: Request, res: Response): Promise<void> {
    try {
      const { niveauId, includeDeleted } = req.query;
      
      const where: any = {};
      
      if (niveauId) {
        where.niveauId = niveauId as string;
      }
      
      // Only admins can see deleted filieres
      if (!includeDeleted || req.user?.role !== UserRole.admin) {
        where.isDeleted = false;
      }

      const filieres = await prisma.filiere.findMany({
        where,
        include: {
          niveau: {
            select: {
              id: true,
              nom: true,
              type: true
            }
          },
          matieres: {
            where: { isDeleted: false },
            select: {
              id: true,
              nom: true,
              code: true
            }
          }
        },
        orderBy: [
          { niveau: { ordre: 'asc' } },
          { nom: 'asc' }
        ]
      });

      res.status(200).json({
        success: true,
        message: 'Filières récupérées avec succès',
        data: filieres
      });
    } catch (error) {
      logger.error('Error getting filieres:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des filières'
      });
    }
  }

  /**
   * Create a new filiere (Admin only)
   */
  static async createFiliere(req: Request, res: Response): Promise<void> {
    try {
      const { nom, code, niveauId } = req.body;

      // Check if niveau exists
      const niveau = await prisma.niveau.findUnique({
        where: { id: niveauId }
      });

      if (!niveau) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Niveau non trouvé'
        });
        return;
      }

      // Check if code already exists
      const existingFiliere = await prisma.filiere.findUnique({
        where: { code }
      });

      if (existingFiliere) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Une filière avec ce code existe déjà'
        });
        return;
      }

      const filiere = await prisma.filiere.create({
        data: {
          nom,
          code,
          niveauId
        },
        include: {
          niveau: {
            select: {
              id: true,
              nom: true,
              type: true
            }
          }
        }
      });

      logger.info(`Filiere created: ${filiere.code} by user ${req.user?.id}`);

      res.status(201).json({
        success: true,
        message: 'Filière créée avec succès',
        data: filiere
      });
    } catch (error) {
      logger.error('Error creating filiere:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la création de la filière'
      });
    }
  }

  /**
   * Update a filiere (Admin only)
   */
  static async updateFiliere(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nom, code, niveauId } = req.body;

      // Check if filiere exists
      const existingFiliere = await prisma.filiere.findUnique({
        where: { id }
      });

      if (!existingFiliere) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Filière non trouvée'
        });
        return;
      }

      // Check if niveau exists (if provided)
      if (niveauId) {
        const niveau = await prisma.niveau.findUnique({
          where: { id: niveauId }
        });

        if (!niveau) {
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Niveau non trouvé'
          });
          return;
        }
      }

      // Check if code already exists (if provided and different)
      if (code && code !== existingFiliere.code) {
        const codeExists = await prisma.filiere.findUnique({
          where: { code }
        });

        if (codeExists) {
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Une filière avec ce code existe déjà'
          });
          return;
        }
      }

      const filiere = await prisma.filiere.update({
        where: { id },
        data: {
          ...(nom && { nom }),
          ...(code && { code }),
          ...(niveauId && { niveauId })
        },
        include: {
          niveau: {
            select: {
              id: true,
              nom: true,
              type: true
            }
          }
        }
      });

      logger.info(`Filiere updated: ${filiere.code} by user ${req.user?.id}`);

      res.status(200).json({
        success: true,
        message: 'Filière mise à jour avec succès',
        data: filiere
      });
    } catch (error) {
      logger.error('Error updating filiere:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la mise à jour de la filière'
      });
    }
  }

  /**
   * Delete a filiere (Admin only) - Soft delete
   */
  static async deleteFiliere(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if filiere exists
      const existingFiliere = await prisma.filiere.findUnique({
        where: { id },
        include: {
          users: { where: { isActive: true } },
          matieres: { where: { isDeleted: false } }
        }
      });

      if (!existingFiliere) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Filière non trouvée'
        });
        return;
      }

      if (existingFiliere.isDeleted) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Filière déjà supprimée'
        });
        return;
      }

      // Check if there are active users in this filiere
      if (existingFiliere.users.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Impossible de supprimer une filière contenant des utilisateurs actifs'
        });
        return;
      }

      // Soft delete the filiere and its matieres
      await prisma.$transaction(async (tx) => {
        // Soft delete all matieres in this filiere
        await tx.matiere.updateMany({
          where: { filiereId: id, isDeleted: false },
          data: { 
            isDeleted: true, 
            deletedAt: new Date() 
          }
        });

        // Soft delete the filiere
        await tx.filiere.update({
          where: { id },
          data: { 
            isDeleted: true, 
            deletedAt: new Date() 
          }
        });
      });

      logger.info(`Filiere deleted: ${existingFiliere.code} by user ${req.user?.id}`);

      res.status(200).json({
        success: true,
        message: 'Filière supprimée avec succès'
      });
    } catch (error) {
      logger.error('Error deleting filiere:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la suppression de la filière'
      });
    }
  }

  /**
   * Get all matieres
   */
  static async getMatieres(req: Request, res: Response): Promise<void> {
    try {
      const { filiereId, semestreId, niveauId, includeDeleted } = req.query;
      
      const where: any = {};
      
      // Build filiere filter if needed
      if (filiereId || niveauId) {
        where.filiere = {};
        if (filiereId) {
          where.filiere.id = filiereId as string;
        }
        if (niveauId) {
          where.filiere.niveauId = niveauId as string;
        }
      }
      
      if (semestreId) {
        where.semestreId = semestreId as string;
      }
      
      // Only admins can see deleted matieres
      if (!includeDeleted || req.user?.role !== UserRole.admin) {
        where.isDeleted = false;
      }

      const matieres = await prisma.matiere.findMany({
        where,
        include: {
          filiere: {
            select: {
              id: true,
              nom: true,
              code: true,
              niveau: {
                select: {
                  id: true,
                  nom: true,
                  type: true
                }
              }
            }
          },
          semestre: {
            select: {
              id: true,
              nom: true,
              ordre: true
            }
          },
          professeurMatieres: {
            include: {
              professeur: {
                select: {
                  id: true,
                  prenom: true,
                  nom: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: [
          { filiere: { niveau: { ordre: 'asc' } } },
          { filiere: { nom: 'asc' } },
          { semestre: { ordre: 'asc' } },
          { nom: 'asc' }
        ]
      });

      res.status(200).json({
        success: true,
        message: 'Matières récupérées avec succès',
        data: matieres
      });
    } catch (error) {
      logger.error('Error getting matieres:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des matières'
      });
    }
  }

  /**
   * Get a single matiere by ID
   */
  static async getMatiere(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const matiere = await prisma.matiere.findFirst({
        where: { 
          id,
          isDeleted: false
        },
        include: {
          filiere: {
            select: {
              id: true,
              nom: true,
              code: true,
              niveau: {
                select: {
                  id: true,
                  nom: true,
                  type: true
                }
              }
            }
          },
          semestre: {
            select: {
              id: true,
              nom: true,
              ordre: true
            }
          },
          professeurMatieres: {
            include: {
              professeur: {
                select: {
                  id: true,
                  prenom: true,
                  nom: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!matiere) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Matière non trouvée'
        });
        return;
      }

      // Check if user has access to this matiere
      if (req.user?.role === UserRole.professeur) {
        const hasAccess = matiere.professeurMatieres.some(
          pm => pm.professeurId === req.user?.id
        );
        
        if (!hasAccess) {
          res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: 'Accès non autorisé à cette matière'
          });
          return;
        }
      } else if (req.user?.role === UserRole.etudiant) {
        // Students can only access matières from their filière and niveau
        const hasAccess = matiere.filiereId === req.user.filiereId && 
                          matiere.filiere?.niveau?.id === req.user.niveauId;
        
        if (!hasAccess) {
          res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: 'Accès non autorisé à cette matière'
          });
          return;
        }
      }

      res.status(200).json({
        success: true,
        message: 'Matière récupérée avec succès',
        data: matiere
      });
    } catch (error) {
      logger.error('Error getting matiere:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération de la matière'
      });
    }
  }

  /**
   * Create a new matiere (Admin only)
   */
  static async createMatiere(req: Request, res: Response): Promise<void> {
    try {
      const { nom, code, filiereId, semestreId } = req.body;

      // Check if filiere exists and is not deleted
      const filiere = await prisma.filiere.findFirst({
        where: { id: filiereId, isDeleted: false }
      });

      if (!filiere) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Filière non trouvée'
        });
        return;
      }

      // Check if semestre exists
      const semestre = await prisma.semestre.findUnique({
        where: { id: semestreId }
      });

      if (!semestre) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Semestre non trouvé'
        });
        return;
      }

      // Check if code already exists in this filiere
      const existingMatiere = await prisma.matiere.findFirst({
        where: { 
          code, 
          filiereId,
          isDeleted: false
        }
      });

      if (existingMatiere) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Une matière avec ce code existe déjà dans cette filière'
        });
        return;
      }

      const matiere = await prisma.matiere.create({
        data: {
          nom,
          code,
          filiereId,
          semestreId
        },
        include: {
          filiere: {
            select: {
              id: true,
              nom: true,
              code: true
            }
          },
          semestre: {
            select: {
              id: true,
              nom: true,
              ordre: true
            }
          }
        }
      });

      logger.info(`Matiere created: ${matiere.code} by user ${req.user?.id}`);

      res.status(201).json({
        success: true,
        message: 'Matière créée avec succès',
        data: matiere
      });
    } catch (error) {
      logger.error('Error creating matiere:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la création de la matière'
      });
    }
  }

  /**
   * Update a matiere (Admin only)
   */
  static async updateMatiere(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nom, code, filiereId, semestreId } = req.body;

      // Check if matiere exists
      const existingMatiere = await prisma.matiere.findUnique({
        where: { id }
      });

      if (!existingMatiere) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Matière non trouvée'
        });
        return;
      }

      // Check if filiere exists (if provided)
      if (filiereId) {
        const filiere = await prisma.filiere.findFirst({
          where: { id: filiereId, isDeleted: false }
        });

        if (!filiere) {
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Filière non trouvée'
          });
          return;
        }
      }

      // Check if semestre exists (if provided)
      if (semestreId) {
        const semestre = await prisma.semestre.findUnique({
          where: { id: semestreId }
        });

        if (!semestre) {
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Semestre non trouvé'
          });
          return;
        }
      }

      // Check if code already exists in the filiere (if code or filiere is being changed)
      if (code || filiereId) {
        const newCode = code || existingMatiere.code;
        const newFiliereId = filiereId || existingMatiere.filiereId;
        
        if (newCode !== existingMatiere.code || newFiliereId !== existingMatiere.filiereId) {
          const codeExists = await prisma.matiere.findFirst({
            where: { 
              code: newCode, 
              filiereId: newFiliereId,
              isDeleted: false,
              id: { not: id }
            }
          });

          if (codeExists) {
            res.status(400).json({
              success: false,
              error: 'Bad Request',
              message: 'Une matière avec ce code existe déjà dans cette filière'
            });
            return;
          }
        }
      }

      const matiere = await prisma.matiere.update({
        where: { id },
        data: {
          ...(nom && { nom }),
          ...(code && { code }),
          ...(filiereId && { filiereId }),
          ...(semestreId && { semestreId })
        },
        include: {
          filiere: {
            select: {
              id: true,
              nom: true,
              code: true
            }
          },
          semestre: {
            select: {
              id: true,
              nom: true,
              ordre: true
            }
          }
        }
      });

      logger.info(`Matiere updated: ${matiere.code} by user ${req.user?.id}`);

      res.status(200).json({
        success: true,
        message: 'Matière mise à jour avec succès',
        data: matiere
      });
    } catch (error) {
      logger.error('Error updating matiere:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la mise à jour de la matière'
      });
    }
  }

  /**
   * Delete a matiere (Admin only) - Soft delete
   */
  static async deleteMatiere(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if matiere exists
      const existingMatiere = await prisma.matiere.findUnique({
        where: { id },
        include: {
          documents: { where: { isDeleted: false } },
          professeurMatieres: true
        }
      });

      if (!existingMatiere) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Matière non trouvée'
        });
        return;
      }

      if (existingMatiere.isDeleted) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Matière déjà supprimée'
        });
        return;
      }

      // Check if there are documents in this matiere
      if (existingMatiere.documents.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Impossible de supprimer une matière contenant des documents'
        });
        return;
      }

      // Soft delete the matiere and remove professor assignments
      await prisma.$transaction(async (tx) => {
        // Remove professor assignments
        await tx.professeurMatiere.deleteMany({
          where: { matiereId: id }
        });

        // Soft delete the matiere
        await tx.matiere.update({
          where: { id },
          data: { 
            isDeleted: true, 
            deletedAt: new Date() 
          }
        });
      });

      logger.info(`Matiere deleted: ${existingMatiere.code} by user ${req.user?.id}`);

      res.status(200).json({
        success: true,
        message: 'Matière supprimée avec succès'
      });
    } catch (error) {
      logger.error('Error deleting matiere:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la suppression de la matière'
      });
    }
  }

  /**
   * Get professor's matieres with roles
   */
  static async getProfesseurMatieres(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if user exists and is a professor
      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Utilisateur non trouvé'
        });
        return;
      }

      if (user.role !== UserRole.professeur) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'L\'utilisateur n\'est pas un professeur'
        });
        return;
      }

      const professeurMatieres = await prisma.professeurMatiere.findMany({
        where: { professeurId: id },
        include: {
          matiere: {
            include: {
              filiere: {
                select: {
                  id: true,
                  nom: true,
                  code: true,
                  niveau: {
                    select: {
                      id: true,
                      nom: true,
                      type: true
                    }
                  }
                }
              },
              semestre: {
                select: {
                  id: true,
                  nom: true,
                  ordre: true
                }
              }
            }
          }
        },
        orderBy: {
          matiere: {
            nom: 'asc'
          }
        }
      });

      // Group by matiere and collect roles
      const matieresWithRoles = professeurMatieres.reduce((acc, pm) => {
        const matiereId = pm.matiere.id;
        if (!acc[matiereId]) {
          acc[matiereId] = {
            ...pm.matiere,
            roles: []
          };
        }
        acc[matiereId].roles.push(pm.role);
        return acc;
      }, {} as any);

      const matieres = Object.values(matieresWithRoles);

      res.status(200).json({
        success: true,
        message: 'Matières du professeur récupérées avec succès',
        data: matieres
      });
    } catch (error) {
      logger.error('Error getting professor matieres:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des matières du professeur'
      });
    }
  }

  /**
   * Get matiere professors with their roles
   */
  static async getMatiereProfesseurs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // matiere id

      // Check if matiere exists
      const matiere = await prisma.matiere.findFirst({
        where: { id, isDeleted: false }
      });

      if (!matiere) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Matière non trouvée'
        });
        return;
      }

      const professeurMatieres = await prisma.professeurMatiere.findMany({
        where: { matiereId: id },
        include: {
          professeur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true
            }
          }
        },
        orderBy: {
          role: 'asc'
        }
      });

      // Group by professor and collect roles
      const professeursWithRoles = professeurMatieres.reduce((acc, pm) => {
        const profId = pm.professeur.id;
        if (!acc[profId]) {
          acc[profId] = {
            ...pm.professeur,
            roles: []
          };
        }
        acc[profId].roles.push(pm.role);
        return acc;
      }, {} as any);

      const professeurs = Object.values(professeursWithRoles);

      res.status(200).json({
        success: true,
        message: 'Professeurs de la matière récupérés avec succès',
        data: professeurs
      });
    } catch (error) {
      logger.error('Error getting matiere professors:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des professeurs de la matière'
      });
    }
  }

  /**
   * Assign matiere to professor with role (Admin only)
   */
  static async assignMatiereToProf(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // professor id
      const { matiereId, role } = req.body;

      // Validate role
      if (!['cours', 'td', 'tp'].includes(role)) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Rôle invalide. Les rôles valides sont: cours, td, tp'
        });
        return;
      }

      // Check if professor exists
      const professor = await prisma.user.findUnique({
        where: { id }
      });

      if (!professor) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Professeur non trouvé'
        });
        return;
      }

      if (professor.role !== UserRole.professeur) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'L\'utilisateur n\'est pas un professeur'
        });
        return;
      }

      // Check if matiere exists
      const matiere = await prisma.matiere.findFirst({
        where: { id: matiereId, isDeleted: false }
      });

      if (!matiere) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Matière non trouvée'
        });
        return;
      }

      // Check if there's already a professor assigned to this role for this matiere
      const existingRoleAssignment = await prisma.professeurMatiere.findFirst({
        where: {
          matiereId,
          role
        },
        include: {
          professeur: {
            select: {
              prenom: true,
              nom: true
            }
          }
        }
      });

      if (existingRoleAssignment) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: `Un professeur (${existingRoleAssignment.professeur.prenom} ${existingRoleAssignment.professeur.nom}) est déjà assigné au rôle ${role} pour cette matière`
        });
        return;
      }

      // Create assignment
      const assignment = await prisma.professeurMatiere.create({
        data: {
          professeurId: id,
          matiereId,
          role
        },
        include: {
          matiere: {
            include: {
              filiere: {
                select: {
                  nom: true,
                  code: true
                }
              }
            }
          }
        }
      });

      logger.info(`Matiere ${matiere.code} assigned to professor ${professor.email} with role ${role} by user ${req.user?.id}`);

      res.status(201).json({
        success: true,
        message: 'Matière assignée au professeur avec succès',
        data: assignment
      });
    } catch (error) {
      logger.error('Error assigning matiere to professor:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de l\'assignation de la matière'
      });
    }
  }

  /**
   * Remove specific matiere assignment from professor (Admin only)
   */
  static async removeMatiereFromProf(req: Request, res: Response): Promise<void> {
    try {
      const { id, matiereId } = req.params;
      const { role } = req.body;

      // Validate role if provided
      if (role && !['cours', 'td', 'tp'].includes(role)) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Rôle invalide. Les rôles valides sont: cours, td, tp'
        });
        return;
      }

      const whereClause: any = {
        professeurId: id,
        matiereId
      };

      if (role) {
        whereClause.role = role;
      }

      // Check if assignment exists
      const assignments = await prisma.professeurMatiere.findMany({
        where: whereClause,
        include: {
          professeur: {
            select: {
              email: true
            }
          },
          matiere: {
            select: {
              code: true
            }
          }
        }
      });

      if (assignments.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Assignation non trouvée'
        });
        return;
      }

      // Remove assignments
      await prisma.professeurMatiere.deleteMany({
        where: whereClause
      });

      const roleText = role ? ` pour le rôle ${role}` : '';
      logger.info(`Matiere ${assignments[0].matiere.code} removed from professor ${assignments[0].professeur.email}${roleText} by user ${req.user?.id}`);

      res.status(200).json({
        success: true,
        message: 'Assignation de matière supprimée avec succès'
      });
    } catch (error) {
      logger.error('Error removing matiere from professor:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la suppression de l\'assignation'
      });
    }
  }

  /**
   * Update professor assignments for a matiere (Admin only)
   */
  static async updateMatiereProfesseurs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // matiere id
      const { professeurs } = req.body; // Array of { professeurId, roles: ['cours', 'td', 'tp'] }

      // Check if matiere exists
      const matiere = await prisma.matiere.findFirst({
        where: { id, isDeleted: false }
      });

      if (!matiere) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Matière non trouvée'
        });
        return;
      }

      // Validate input
      if (!Array.isArray(professeurs)) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Le format des professeurs est invalide'
        });
        return;
      }

      // Collect all roles to check for duplicates
      const allRoles: string[] = [];
      
      // Validate each professor assignment
      for (const prof of professeurs) {
        if (!prof.professeurId || !Array.isArray(prof.roles)) {
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Format invalide pour les assignations de professeurs'
          });
          return;
        }

        for (const role of prof.roles) {
          if (!['cours', 'td', 'tp'].includes(role)) {
            res.status(400).json({
              success: false,
              error: 'Bad Request',
              message: `Rôle invalide: ${role}. Les rôles valides sont: cours, td, tp`
            });
            return;
          }
          
          // Check for duplicate roles
          if (allRoles.includes(role)) {
            res.status(400).json({
              success: false,
              error: 'Bad Request',
              message: `Le rôle ${role} ne peut être assigné qu'à un seul professeur par matière`
            });
            return;
          }
          allRoles.push(role);
        }

        // Check if professor exists
        const professor = await prisma.user.findUnique({
          where: { id: prof.professeurId }
        });

        if (!professor || professor.role !== UserRole.professeur) {
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: `Professeur invalide: ${prof.professeurId}`
          });
          return;
        }
      }

      // Remove all existing assignments for this matiere
      await prisma.professeurMatiere.deleteMany({
        where: { matiereId: id }
      });

      // Create new assignments
      const newAssignments = [];
      for (const prof of professeurs) {
        for (const role of prof.roles) {
          newAssignments.push({
            professeurId: prof.professeurId,
            matiereId: id,
            role
          });
        }
      }

      if (newAssignments.length > 0) {
        await prisma.professeurMatiere.createMany({
          data: newAssignments
        });
      }

      logger.info(`Matiere ${matiere.code} professor assignments updated by user ${req.user?.id}`);

      res.status(200).json({
        success: true,
        message: 'Assignations des professeurs mises à jour avec succès'
      });
    } catch (error) {
      logger.error('Error updating matiere professors:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la mise à jour des assignations'
      });
    }
  }
} 