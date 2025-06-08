import { PrismaClient, Document, DocumentCategorie, UserRole } from '@prisma/client';
import { logger } from '../config/logger';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export interface CreateDocumentData {
  titre: string;
  description?: string;
  categorie: DocumentCategorie;
  matiereId?: string | null;
  matiereIds?: string[];
  telchargePar: string;
  cheminFichier: string;
  nomFichier: string;
  tailleFichier: number;
  typeMime: string;
  correctionId?: string | null; // For correction documents
}

export interface CreatePFEDocumentData extends CreateDocumentData {
  anneeDiplome: number;
  filiereDiplome: string;
  titreProjet: string;
  resume?: string;
  motsCles: string[];
}

export interface DocumentFilters {
  matiereId?: string;
  categorie?: DocumentCategorie;
  search?: string;
  userId?: string;
  userRole?: UserRole;
  userFiliereId?: string;
  userNiveauId?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export class DocumentService {
  // Store recent view increments to prevent double counting
  private static recentViews = new Map<string, number>();

  /**
   * Create a new document with support for multiple matieres
   */
  static async createDocument(data: CreateDocumentData): Promise<Document> {
    try {
      // Determine which matieres to use
      let matiereIds: string[] = [];
      
      if (data.matiereIds && data.matiereIds.length > 0) {
        // Use new multiple matieres approach
        matiereIds = data.matiereIds;
      } else if (data.matiereId) {
        // Use legacy single matiere approach for backward compatibility
        matiereIds = [data.matiereId];
      }

      // Validate matieres exist if provided
      if (matiereIds.length > 0) {
        const matieres = await prisma.matiere.findMany({
          where: {
            id: { in: matiereIds },
            isDeleted: false
          }
        });

        if (matieres.length !== matiereIds.length) {
          throw new Error('Une ou plusieurs matières non trouvées');
        }
      }

      // Validate parent document exists if this is a correction
      if (data.correctionId) {
        const parentDocument = await prisma.document.findFirst({
          where: {
            id: data.correctionId,
            isDeleted: false
          }
        });

        if (!parentDocument) {
          throw new Error('Document parent non trouvé');
        }

        // Check if a correction already exists for this document
        const existingCorrection = await prisma.document.findFirst({
          where: {
            correctionId: data.correctionId,
            isDeleted: false
          }
        });

        if (existingCorrection) {
          throw new Error('Une correction existe déjà pour ce document');
        }
      }

      // Create document and matiere relationships in a transaction
      const document = await prisma.$transaction(async (tx) => {
        // Create the document
        const newDocument = await tx.document.create({
          data: {
            titre: data.titre,
            description: data.description,
            categorie: data.categorie,
            matiereId: data.matiereId, // Keep for backward compatibility
            telchargePar: data.telchargePar,
            cheminFichier: data.cheminFichier,
            nomFichier: data.nomFichier,
            tailleFichier: BigInt(data.tailleFichier),
            typeMime: data.typeMime,
            correctionId: data.correctionId
          }
        });

        // Create document-matiere relationships
        if (matiereIds.length > 0) {
          await tx.documentMatiere.createMany({
            data: matiereIds.map(matiereId => ({
              documentId: newDocument.id,
              matiereId: matiereId
            }))
          });
        }

        // Return document with all relationships
        return await tx.document.findUnique({
          where: { id: newDocument.id },
          include: {
            matiere: {
              include: {
                filiere: {
                  include: {
                    niveau: true
                  }
                },
                semestre: true
              }
            },
            documentMatieres: {
              include: {
                matiere: {
                  include: {
                    filiere: {
                      include: {
                        niveau: true
                      }
                    },
                    semestre: true
                  }
                }
              }
            },
            uploader: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                role: true
              }
            },
            correctionPour: true,
            correction: true
          }
        });
      });

      logger.info(`Document created: ${document!.titre} by user ${data.telchargePar} with ${matiereIds.length} matiere(s)`);
      return document!;
    } catch (error) {
      logger.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * Create a PFE document
   */
  static async createPFEDocument(data: CreatePFEDocumentData): Promise<Document> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create the document
        const document = await tx.document.create({
          data: {
            titre: data.titre,
            description: data.description,
            categorie: 'pfe',
            matiereId: null, // PFE documents don't belong to a specific matiere
            telchargePar: data.telchargePar,
            cheminFichier: data.cheminFichier,
            nomFichier: data.nomFichier,
            tailleFichier: BigInt(data.tailleFichier),
            typeMime: data.typeMime
          }
        });

        // Create PFE metadata
        await tx.documentPFE.create({
          data: {
            documentId: document.id,
            anneeDiplome: data.anneeDiplome,
            filiereDiplome: data.filiereDiplome,
            titreProjet: data.titreProjet,
            resume: data.resume,
            motsCles: data.motsCles
          }
        });

        return document;
      });

      logger.info(`PFE document created: ${data.titreProjet} by user ${data.telchargePar}`);
      return result;
    } catch (error) {
      logger.error('Error creating PFE document:', error);
      throw error;
    }
  }

  /**
   * Create a correction for an existing document
   */
  static async createCorrection(
    parentDocumentId: string,
    correctionData: Omit<CreateDocumentData, 'correctionId'>
  ): Promise<Document> {
    try {
      // Get the parent document to inherit its matiere and organization info
      const parentDocument = await prisma.document.findFirst({
        where: {
          id: parentDocumentId,
          isDeleted: false
        },
        include: {
          matiere: {
            include: {
              filiere: {
                include: {
                  niveau: true
                }
              },
              semestre: true
            }
          }
        }
      });

      if (!parentDocument) {
        throw new Error('Document parent non trouvé');
      }

      // Check if a correction already exists
      const existingCorrection = await prisma.document.findFirst({
        where: {
          correctionId: parentDocumentId,
          isDeleted: false
        }
      });

      if (existingCorrection) {
        throw new Error('Une correction existe déjà pour ce document');
      }

      // Organize the correction file in the same directory as the parent document
      let organizedFilePath = correctionData.cheminFichier;
      
      if (parentDocument.matiere) {
        // For regular documents, organize in corrections subdirectory
        const baseDir = path.dirname(parentDocument.cheminFichier);
        const correctionsDir = path.join(baseDir, 'corrections');
        
        // Ensure corrections directory exists
        if (!fs.existsSync(correctionsDir)) {
          fs.mkdirSync(correctionsDir, { recursive: true });
        }
        
        // Move file from temp to corrections directory
        const fileName = path.basename(correctionData.cheminFichier);
        organizedFilePath = path.join(correctionsDir, fileName);
        
        try {
          fs.renameSync(correctionData.cheminFichier, organizedFilePath);
          logger.info(`Correction file organized: ${organizedFilePath}`);
        } catch (error) {
          logger.error('Error organizing correction file:', error);
          throw new Error('Erreur lors de l\'organisation du fichier de correction');
        }
      }

      // Create the correction document
      const correctionDocument = await this.createDocument({
        ...correctionData,
        cheminFichier: organizedFilePath,
        correctionId: parentDocumentId,
        matiereId: parentDocument.matiereId, // Inherit matiere from parent
        categorie: parentDocument.categorie, // Inherit category from parent
        titre: `Correction - ${correctionData.titre}`
      });

      logger.info(`Correction created for document ${parentDocumentId} by user ${correctionData.telchargePar}`);
      return correctionDocument;
    } catch (error) {
      logger.error('Error creating correction:', error);
      // Clean up the uploaded file if organization failed
      if (fs.existsSync(correctionData.cheminFichier)) {
        try {
          fs.unlinkSync(correctionData.cheminFichier);
          logger.info(`Cleaned up failed correction upload: ${correctionData.cheminFichier}`);
        } catch (cleanupError) {
          logger.error('Error cleaning up failed upload:', cleanupError);
        }
      }
      throw error;
    }
  }

  /**
   * Get documents with filtering and pagination
   */
  static async getDocuments(
    filters: DocumentFilters = {},
    pagination: PaginationOptions = {}
  ) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      // Build where clause based on filters and user permissions
      const whereClause: any = {
        isDeleted: false,
        correctionId: null // Exclude corrections from main document list
      };

      // Apply matiere filter - support both old and new approach
      if (filters.matiereId) {
        whereClause.OR = [
          // Old approach: direct matiere relationship
          { matiereId: filters.matiereId },
          // New approach: through DocumentMatiere junction table
          {
            documentMatieres: {
              some: {
                matiereId: filters.matiereId
              }
            }
          }
        ];
      }

      // Apply category filter
      if (filters.categorie) {
        whereClause.categorie = filters.categorie;
      }

      // Apply search filter
      if (filters.search) {
        whereClause.OR = [
          { titre: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      // Apply access control based on user role
      if (filters.userRole === 'etudiant') {
        // Students can only see documents from their filiere/niveau
        const accessConditions = [
          // Regular documents from their filiere (old approach)
          {
            matiere: {
              filiereId: filters.userFiliereId,
              filiere: {
                niveauId: filters.userNiveauId
              }
            }
          },
          // Regular documents from their filiere (new approach)
          {
            documentMatieres: {
              some: {
                matiere: {
                  filiereId: filters.userFiliereId,
                  filiere: {
                    niveauId: filters.userNiveauId
                  }
                }
              }
            }
          },
          // PFE documents (only for terminal semesters)
          {
            categorie: 'pfe',
            matiereId: null
          }
        ];

        if (whereClause.OR) {
          // If there's already an OR clause (from search), combine them
          whereClause.AND = [
            { OR: whereClause.OR },
            { OR: accessConditions }
          ];
          delete whereClause.OR;
        } else {
          whereClause.OR = accessConditions;
        }
      } else if (filters.userRole === 'professeur') {
        // Professors can see documents from their assigned matieres
        const accessConditions = [
          // Documents from their assigned matieres (old approach)
          {
            matiere: {
              professeurMatieres: {
                some: {
                  professeurId: filters.userId
                }
              }
            }
          },
          // Documents from their assigned matieres (new approach)
          {
            documentMatieres: {
              some: {
                matiere: {
                  professeurMatieres: {
                    some: {
                      professeurId: filters.userId
                    }
                  }
                }
              }
            }
          },
          // PFE documents
          {
            categorie: 'pfe',
            matiereId: null
          }
        ];

        if (whereClause.OR) {
          // If there's already an OR clause (from search), combine them
          whereClause.AND = [
            { OR: whereClause.OR },
            { OR: accessConditions }
          ];
          delete whereClause.OR;
        } else {
          whereClause.OR = accessConditions;
        }
      }
      // Admins can see all documents (no additional filters)

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where: whereClause,
          include: {
            matiere: {
              include: {
                filiere: {
                  include: {
                    niveau: true
                  }
                },
                semestre: true
              }
            },
            documentMatieres: {
              include: {
                matiere: {
                  include: {
                    filiere: {
                      include: {
                        niveau: true
                      }
                    },
                    semestre: true
                  }
                }
              }
            },
            uploader: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                role: true
              }
            },
            documentPFE: true,
            correction: true,
            correctionPour: true,
            _count: {
              select: {
                commentaires: {
                  where: { isDeleted: false }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.document.count({ where: whereClause })
      ]);

      return {
        documents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting documents:', error);
      throw error;
    }
  }

  /**
   * Get document by ID with access control
   */
  static async getDocumentById(
    id: string,
    userId: string,
    userRole: UserRole,
    userFiliereId?: string,
    userNiveauId?: string
  ): Promise<Document | null> {
    try {
      const document = await prisma.document.findFirst({
        where: {
          id,
          isDeleted: false
        },
        include: {
          matiere: {
            include: {
              filiere: {
                include: {
                  niveau: true
                }
              },
              semestre: true,
              professeurMatieres: {
                include: {
                  professeur: {
                    select: {
                      id: true,
                      prenom: true,
                      nom: true
                    }
                  }
                }
              }
            }
          },
          documentMatieres: {
            include: {
              matiere: {
                include: {
                  filiere: {
                    include: {
                      niveau: true
                    }
                  },
                  semestre: true,
                  professeurMatieres: {
                    include: {
                      professeur: {
                        select: {
                          id: true,
                          prenom: true,
                          nom: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          uploader: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              role: true
            }
          },
          documentPFE: true,
          correction: true,
          correctionPour: true,
          _count: {
            select: {
              commentaires: {
                where: { isDeleted: false }
              }
            }
          }
        }
      });

      if (!document) {
        return null;
      }

      // Check access permissions
      const hasAccess = await this.checkDocumentAccess(
        document,
        userId,
        userRole,
        userFiliereId,
        userNiveauId
      );

      if (!hasAccess) {
        throw new Error('Accès non autorisé à ce document');
      }

      return document;
    } catch (error) {
      logger.error('Error getting document by ID:', error);
      throw error;
    }
  }

  /**
   * Update document
   */
  static async updateDocument(
    id: string,
    data: Partial<CreateDocumentData>,
    userId: string,
    userRole: UserRole
  ): Promise<Document> {
    try {
      // Check if document exists and user has permission
      const existingDocument = await prisma.document.findFirst({
        where: {
          id,
          isDeleted: false
        }
      });

      if (!existingDocument) {
        throw new Error('Document non trouvé');
      }

      // Check permissions (owner or admin)
      if (userRole !== 'admin' && existingDocument.telchargePar !== userId) {
        throw new Error('Permissions insuffisantes');
      }

      // Update document and matiere relationships in a transaction
      const document = await prisma.$transaction(async (tx) => {
        // Update the document
        const updatedDocument = await tx.document.update({
          where: { id },
          data: {
            ...(data.titre && { titre: data.titre }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.categorie && { categorie: data.categorie }),
            ...(data.matiereId !== undefined && { matiereId: data.matiereId })
          }
        });

        // Update matiere relationships if matiereIds is provided
        if (data.matiereIds !== undefined) {
          // Remove existing relationships
          await tx.documentMatiere.deleteMany({
            where: { documentId: id }
          });

          // Add new relationships
          if (data.matiereIds.length > 0) {
            await tx.documentMatiere.createMany({
              data: data.matiereIds.map(matiereId => ({
                documentId: id,
                matiereId: matiereId
              }))
            });
          }
        }

        // Return updated document with all relationships
        return await tx.document.findUnique({
          where: { id },
          include: {
            matiere: {
              include: {
                filiere: {
                  include: {
                    niveau: true
                  }
                },
                semestre: true
              }
            },
            documentMatieres: {
              include: {
                matiere: {
                  include: {
                    filiere: {
                      include: {
                        niveau: true
                      }
                    },
                    semestre: true
                  }
                }
              }
            },
            uploader: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                role: true
              }
            }
          }
        });
      });

      logger.info(`Document updated: ${document!.titre} by user ${userId}`);
      return document!;
    } catch (error) {
      logger.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * Delete document (soft delete)
   */
  static async deleteDocument(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    try {
      // Check if document exists and user has permission
      const existingDocument = await prisma.document.findFirst({
        where: {
          id,
          isDeleted: false
        }
      });

      if (!existingDocument) {
        throw new Error('Document non trouvé');
      }

      // Check permissions (owner or admin)
      if (userRole !== 'admin' && existingDocument.telchargePar !== userId) {
        throw new Error('Permissions insuffisantes');
      }

      await prisma.document.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId
        }
      });

      logger.info(`Document deleted: ${existingDocument.titre} by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Get deleted documents (trash) for a user
   */
  static async getDeletedDocuments(
    userId: string,
    userRole: UserRole,
    pagination: PaginationOptions = {}
  ) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      // Build where clause based on user role
      const whereClause: any = {
        isDeleted: true,
        deletedAt: {
          not: null
        }
      };

      // Users can only see their own deleted documents, admins can see all
      if (userRole !== 'admin') {
        whereClause.telchargePar = userId;
      }

      // Only show documents deleted within the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      whereClause.deletedAt.gte = thirtyDaysAgo;

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where: whereClause,
          include: {
            matiere: {
              include: {
                filiere: {
                  include: {
                    niveau: true
                  }
                },
                semestre: true
              }
            },
            uploader: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                role: true
              }
            },
            deleter: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                role: true
              }
            },
            documentPFE: true,
            _count: {
              select: {
                commentaires: {
                  where: { isDeleted: false }
                }
              }
            }
          },
          orderBy: {
            deletedAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.document.count({ where: whereClause })
      ]);

      return {
        documents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting deleted documents:', error);
      throw error;
    }
  }

  /**
   * Restore a deleted document
   */
  static async restoreDocument(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<Document> {
    try {
      // Check if document exists and is deleted
      const existingDocument = await prisma.document.findFirst({
        where: {
          id,
          isDeleted: true
        }
      });

      if (!existingDocument) {
        throw new Error('Document supprimé non trouvé');
      }

      // Check if document is still within recovery period (30 days)
      if (existingDocument.deletedAt) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (existingDocument.deletedAt < thirtyDaysAgo) {
          throw new Error('La période de récupération de 30 jours est expirée');
        }
      }

      // Check permissions (owner or admin)
      if (userRole !== 'admin' && existingDocument.telchargePar !== userId) {
        throw new Error('Permissions insuffisantes');
      }

      const restoredDocument = await prisma.document.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null
        },
        include: {
          matiere: {
            include: {
              filiere: {
                include: {
                  niveau: true
                }
              },
              semestre: true
            }
          },
          uploader: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              role: true
            }
          }
        }
      });

      logger.info(`Document restored: ${restoredDocument.titre} by user ${userId}`);
      return restoredDocument;
    } catch (error) {
      logger.error('Error restoring document:', error);
      throw error;
    }
  }

  /**
   * Permanently delete documents older than 30 days (cleanup job)
   */
  static async permanentlyDeleteOldDocuments(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find documents to permanently delete
      const documentsToDelete = await prisma.document.findMany({
        where: {
          isDeleted: true,
          deletedAt: {
            lt: thirtyDaysAgo
          }
        },
        select: {
          id: true,
          cheminFichier: true,
          titre: true
        }
      });

      if (documentsToDelete.length === 0) {
        logger.info('No old deleted documents to permanently delete');
        return;
      }

      // Delete files from filesystem
      for (const doc of documentsToDelete) {
        try {
          if (fs.existsSync(doc.cheminFichier)) {
            fs.unlinkSync(doc.cheminFichier);
            logger.info(`File deleted: ${doc.cheminFichier}`);
          }
        } catch (fileError) {
          logger.error(`Error deleting file ${doc.cheminFichier}:`, fileError);
        }
      }

      // Permanently delete from database
      const result = await prisma.document.deleteMany({
        where: {
          isDeleted: true,
          deletedAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      logger.info(`Permanently deleted ${result.count} old documents`);
    } catch (error) {
      logger.error('Error permanently deleting old documents:', error);
      throw error;
    }
  }

  /**
   * Get documents expiring soon (within 7 days)
   */
  static async getDocumentsExpiringSoon(
    userId: string,
    userRole: UserRole
  ) {
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Build where clause based on user role
      const whereClause: any = {
        isDeleted: true,
        deletedAt: {
          gte: thirtyDaysAgo,
          lte: sevenDaysFromNow
        }
      };

      // Users can only see their own deleted documents, admins can see all
      if (userRole !== 'admin') {
        whereClause.telchargePar = userId;
      }

      const documents = await prisma.document.findMany({
        where: whereClause,
        include: {
          matiere: {
            include: {
              filiere: {
                include: {
                  niveau: true
                }
              }
            }
          },
          uploader: {
            select: {
              id: true,
              prenom: true,
              nom: true
            }
          }
        },
        orderBy: {
          deletedAt: 'asc'
        }
      });

      return documents;
    } catch (error) {
      logger.error('Error getting documents expiring soon:', error);
      throw error;
    }
  }

  /**
   * Get trash statistics
   */
  static async getTrashStats(
    userId: string,
    userRole: UserRole
  ) {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      // Build base where clause
      const baseWhere: any = {
        isDeleted: true,
        deletedAt: {
          gte: thirtyDaysAgo
        }
      };

      // Users can only see their own deleted documents, admins can see all
      if (userRole !== 'admin') {
        baseWhere.telchargePar = userId;
      }

      // Get total deleted documents
      const totalDeleted = await prisma.document.count({
        where: baseWhere
      });

      // Get documents expiring soon (within 7 days)
      const expiringSoon = await prisma.document.count({
        where: {
          ...baseWhere,
          deletedAt: {
            gte: thirtyDaysAgo,
            lte: sevenDaysFromNow
          }
        }
      });

      // Get recent deletions (last 7 days)
      const recentDeletions = await prisma.document.count({
        where: {
          ...baseWhere,
          deletedAt: {
            gte: sevenDaysAgo
          }
        }
      });

      // Get documents by category
      const byCategory = await prisma.document.groupBy({
        by: ['categorie'],
        where: baseWhere,
        _count: {
          id: true
        }
      });

      const byCategoryMap = byCategory.reduce((acc, item) => {
        acc[item.categorie] = item._count.id;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalDeleted,
        expiringSoon,
        recentDeletions,
        byCategory: byCategoryMap
      };
    } catch (error) {
      logger.error('Error getting trash stats:', error);
      throw error;
    }
  }

  /**
   * Get documents by professor
   */
  static async getDocumentsByProfessor(
    professeurId: string,
    pagination: PaginationOptions = {}
  ) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where: {
            telchargePar: professeurId,
            isDeleted: false
          },
          include: {
            matiere: {
              include: {
                filiere: {
                  include: {
                    niveau: true
                  }
                },
                semestre: true
              }
            },
            _count: {
              select: {
                commentaires: {
                  where: { isDeleted: false }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.document.count({
          where: {
            telchargePar: professeurId,
            isDeleted: false
          }
        })
      ]);

      return {
        documents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting documents by professor:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to document
   */
  private static async checkDocumentAccess(
    document: any,
    userId: string,
    userRole: UserRole,
    userFiliereId?: string,
    userNiveauId?: string
  ): Promise<boolean> {
    // Admin has access to all documents
    if (userRole === 'admin') {
      return true;
    }

    // Owner has access to their documents
    if (document.telchargePar === userId) {
      return true;
    }

    // For PFE documents, check if user is in terminal semester
    if (document.categorie === 'pfe') {
      if (userRole === 'professeur') {
        return true; // Professors can access PFE documents
      }
      
      if (userRole === 'etudiant') {
        // Check if student is in terminal semester (S6 for L3/3ING, S4 for M2)
        const userNiveau = await prisma.niveau.findUnique({
          where: { id: userNiveauId }
        });
        
        if (userNiveau) {
          const isTerminalSemester = 
            (userNiveau.nom === 'L3' || userNiveau.nom === '3ING') ||
            (userNiveau.nom === 'M2');
          return isTerminalSemester;
        }
      }
      return false;
    }

    // For regular documents
    if (userRole === 'professeur') {
      // Check if professor is assigned to any of the document's matieres
      
      // Check single matiere (backward compatibility)
      if (document.matiere) {
        const assignment = await prisma.professeurMatiere.findFirst({
          where: {
            professeurId: userId,
            matiereId: document.matiereId
          }
        });
        if (assignment) return true;
      }
      
      // Check multiple matieres
      if (document.documentMatieres && document.documentMatieres.length > 0) {
        for (const docMatiere of document.documentMatieres) {
          const assignment = await prisma.professeurMatiere.findFirst({
            where: {
              professeurId: userId,
              matiereId: docMatiere.matiereId
            }
          });
          if (assignment) return true;
        }
      }
      
      return false;
    }

    if (userRole === 'etudiant') {
      // Check if document is from student's filiere/niveau
      
      // Check single matiere (backward compatibility)
      if (document.matiere) {
        const hasAccess = document.matiere.filiereId === userFiliereId &&
                         document.matiere.filiere.niveauId === userNiveauId;
        if (hasAccess) return true;
      }
      
      // Check multiple matieres
      if (document.documentMatieres && document.documentMatieres.length > 0) {
        for (const docMatiere of document.documentMatieres) {
          const hasAccess = docMatiere.matiere.filiereId === userFiliereId &&
                           docMatiere.matiere.filiere.niveauId === userNiveauId;
          if (hasAccess) return true;
        }
      }
      
      return false;
    }

    return false;
  }

  /**
   * Get file path for download
   */
  static async getDocumentFilePath(
    id: string,
    userId: string,
    userRole: UserRole,
    userFiliereId?: string,
    userNiveauId?: string
  ): Promise<string> {
    try {
      const document = await this.getDocumentById(
        id,
        userId,
        userRole,
        userFiliereId,
        userNiveauId
      );

      if (!document) {
        throw new Error('Document non trouvé');
      }

      const filePath = document.cheminFichier;
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('Fichier non trouvé sur le serveur');
      }

      return filePath;
    } catch (error) {
      logger.error('Error getting document file path:', error);
      throw error;
    }
  }

  /**
   * Check if professor is assigned to a matiere
   */
  static async checkProfessorMatiereAssignment(
    professeurId: string,
    matiereId: string
  ): Promise<boolean> {
    try {
      const assignment = await prisma.professeurMatiere.findFirst({
        where: {
          professeurId,
          matiereId
        }
      });
      return !!assignment;
    } catch (error) {
      logger.error('Error checking professor matiere assignment:', error);
      return false;
    }
  }

  /**
   * Check if user can access PFE documents based on their niveau
   */
  static async canAccessPFEDocuments(niveauId: string): Promise<boolean> {
    try {
      const niveau = await prisma.niveau.findUnique({
        where: { id: niveauId }
      });

      if (!niveau) {
        return false;
      }

      // Terminal semesters: L3, 3ING (S6), M2 (S4)
      const terminalNiveaux = ['L3', '3ING', 'M2'];
      return terminalNiveaux.includes(niveau.nom);
    } catch (error) {
      logger.error('Error checking PFE access:', error);
      return false;
    }
  }

  /**
   * Clean up orphaned files (files without database records)
   */
  static async cleanupOrphanedFiles(): Promise<void> {
    try {
      // This would be run as a scheduled job
      logger.info('Starting cleanup of orphaned files...');
      
      // Implementation would scan upload directories and compare with database
      // This is a placeholder for the actual implementation
      
      logger.info('Orphaned files cleanup completed');
    } catch (error) {
      logger.error('Error during orphaned files cleanup:', error);
    }
  }

  /**
   * Increment view count for a document (with rate limiting to prevent double counting)
   */
  static async incrementViewCount(documentId: string): Promise<void> {
    try {
      const now = Date.now();
      const lastViewTime = this.recentViews.get(documentId);
      
      // Only increment if more than 5 seconds have passed since last increment for this document
      if (lastViewTime && (now - lastViewTime) < 5000) {
        logger.info(`View count increment skipped for document ${documentId} (rate limited)`);
        return;
      }

      await prisma.document.update({
        where: { id: documentId },
        data: {
          viewCount: {
            increment: 1
          }
        }
      });

      // Store the timestamp of this view
      this.recentViews.set(documentId, now);
      
      // Clean up old entries (older than 1 minute)
      for (const [docId, timestamp] of this.recentViews.entries()) {
        if (now - timestamp > 60000) {
          this.recentViews.delete(docId);
        }
      }

      logger.info(`View count incremented for document ${documentId}`);
    } catch (error) {
      logger.error('Error incrementing view count:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Increment download count for a document
   */
  static async incrementDownloadCount(documentId: string): Promise<void> {
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          downloadCount: {
            increment: 1
          }
        }
      });
      logger.info(`Download count incremented for document ${documentId}`);
    } catch (error) {
      logger.error('Error incrementing download count:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }
} 