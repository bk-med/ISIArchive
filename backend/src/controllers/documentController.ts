import { Request, Response } from 'express';
import { DocumentService, CreateDocumentData, CreatePFEDocumentData } from '../services/documentService';
import { logger } from '../config/logger';
import { getFileInfo, cleanupUploadedFile } from '../middleware/upload';
import { prepareDocumentForResponse, prepareDocumentsForResponse } from '../utils/bigint';
import { logAuditEvent } from '../middleware/auditMiddleware';
import fs from 'fs';

export class DocumentController {
  /**
   * Upload and create a new document
   */
  static async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const { titre, description, categorie, matiereId, matiereIds } = req.body;
      const file = req.file;
      const userId = req.user!.id;

      if (!file) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Aucun fichier fourni'
        });
        return;
      }

      // Validate required fields
      if (!titre || !categorie) {
        cleanupUploadedFile(file.path);
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Titre et catégorie sont requis'
        });
        return;
      }

      // Parse matiereIds if provided as string
      let parsedMatiereIds: string[] = [];
      if (matiereIds) {
        try {
          parsedMatiereIds = typeof matiereIds === 'string' ? JSON.parse(matiereIds) : matiereIds;
        } catch (error) {
          cleanupUploadedFile(file.path);
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Format des IDs de matières invalide'
          });
          return;
        }
      }

      // Validate matiere requirements for non-PFE documents
      if (categorie !== 'pfe') {
        if (!matiereId && (!parsedMatiereIds || parsedMatiereIds.length === 0)) {
          cleanupUploadedFile(file.path);
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Au moins une matière est requise pour les documents non-PFE'
          });
          return;
        }
      }

      // Check if user can upload to these matieres (for professors)
      if (req.user!.role === 'professeur') {
        const matieresToCheck = parsedMatiereIds.length > 0 ? parsedMatiereIds : (matiereId ? [matiereId] : []);
        console.log('Checking professor assignments for matieres:', matieresToCheck);
        
        for (const matId of matieresToCheck) {
          console.log('Checking assignment for matiere:', matId);
          const assignment = await DocumentService.checkProfessorMatiereAssignment(userId, matId);
          console.log('Assignment result for matiere', matId, ':', assignment);
          if (!assignment) {
            console.log('Professor not assigned to matiere:', matId);
            cleanupUploadedFile(file.path);
            res.status(403).json({
              success: false,
              error: 'Forbidden',
              message: 'Vous n\'êtes pas assigné à une ou plusieurs matières sélectionnées'
            });
            return;
          }
        }
        console.log('All professor assignments validated successfully');
      }

      const fileInfo = getFileInfo(file);
      
      const documentData: CreateDocumentData = {
        titre,
        description,
        categorie,
        matiereId: categorie === 'pfe' ? null : matiereId,
        matiereIds: categorie === 'pfe' ? undefined : parsedMatiereIds,
        telchargePar: userId,
        cheminFichier: fileInfo.path,
        nomFichier: fileInfo.originalName,
        tailleFichier: fileInfo.size,
        typeMime: fileInfo.mimeType
      };

      console.log('Creating document with data:', documentData);
      const document = await DocumentService.createDocument(documentData);
      console.log('Document created successfully:', document.id);

      // Log document upload
      await logAuditEvent(
        userId,
        'DOCUMENT_UPLOAD',
        'document',
        document.id,
        {
          documentTitle: document.titre,
          categorie: document.categorie,
          matiereId: document.matiereId,
          matiereIds: parsedMatiereIds,
          fileName: fileInfo.originalName,
          fileSize: fileInfo.size
        },
        req
      );

      res.status(201).json({
        success: true,
        message: 'Document téléchargé avec succès',
        data: prepareDocumentForResponse(document)
      });
    } catch (error) {
      // Cleanup uploaded file on error
      if (req.file) {
        cleanupUploadedFile(req.file.path);
      }
      
      console.error('Error in uploadDocument:', error);
      logger.error('Error uploading document:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors du téléchargement du document'
      });
    }
  }

  /**
   * Upload and create a PFE document (Admin only)
   */
  static async uploadPFEDocument(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Aucun fichier fourni'
        });
        return;
      }

      const fileInfo = getFileInfo(req.file);
      const {
        titre,
        description,
        anneeDiplome,
        filiereDiplome,
        titreProjet,
        resume,
        motsCles
      } = req.body;

      const pfeData: CreatePFEDocumentData = {
        titre,
        description,
        categorie: 'pfe',
        telchargePar: req.user!.id,
        cheminFichier: req.file.path,
        nomFichier: fileInfo.originalName,
        tailleFichier: fileInfo.size,
        typeMime: fileInfo.mimeType,
        anneeDiplome: parseInt(anneeDiplome),
        filiereDiplome,
        titreProjet,
        resume,
        motsCles: motsCles ? motsCles.split(',').map((tag: string) => tag.trim()) : []
      };

      const document = await DocumentService.createPFEDocument(pfeData);

      res.status(201).json({
        success: true,
        message: 'Document PFE téléchargé avec succès',
        data: prepareDocumentForResponse(document)
      });
    } catch (error) {
      logger.error('Error uploading PFE document:', error);
      
      // Clean up uploaded file on error
      if (req.file) {
        cleanupUploadedFile(req.file.path);
      }

      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: 'Upload Error',
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Erreur lors du téléchargement du document PFE'
        });
      }
    }
  }

  /**
   * Get documents with filtering and pagination
   */
  static async getDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        matiereId, 
        categorie, 
        search 
      } = req.query;

      const user = req.user!;
      
      const filters = {
        matiereId: matiereId as string,
        categorie: categorie as any,
        search: search as string,
        userId: user.id,
        userRole: user.role,
        userFiliereId: user.filiereId,
        userNiveauId: user.niveauId
      };

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const result = await DocumentService.getDocuments(filters, pagination);

      // Log page access
      await logAuditEvent(
        user.id,
        'PAGE_ACCESS',
        'documents',
        undefined,
        {
          page: 'documents',
          filters: {
            matiereId,
            categorie,
            search
          },
          pagination: {
            page: pagination.page,
            limit: pagination.limit
          }
        },
        req
      );

      res.status(200).json({
        success: true,
        message: 'Documents récupérés avec succès',
        data: prepareDocumentsForResponse(result.documents),
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error getting documents:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des documents'
      });
    }
  }

  /**
   * Get document by ID
   */
  static async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      const document = await DocumentService.getDocumentById(
        id,
        user.id,
        user.role,
        user.filiereId,
        user.niveauId
      );

      if (!document) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Document non trouvé'
        });
        return;
      }

      // Increment view count
      await DocumentService.incrementViewCount(id);

      // Log document view
      await logAuditEvent(
        user.id,
        'DOCUMENT_VIEW',
        'document',
        id,
        {
          documentTitle: document.titre,
          categorie: document.categorie
        },
        req
      );

      res.status(200).json({
        success: true,
        message: 'Document récupéré avec succès',
        data: prepareDocumentForResponse(document)
      });
    } catch (error) {
      logger.error('Error getting document by ID:', error);
      
      if (error instanceof Error && error.message === 'Accès non autorisé à ce document') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération du document'
      });
    }
  }

  /**
   * Update document
   */
  static async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { titre, description, categorie, matiereId } = req.body;
      const user = req.user!;

      const updateData = {
        ...(titre && { titre }),
        ...(description !== undefined && { description }),
        ...(categorie && { categorie }),
        ...(matiereId !== undefined && { matiereId })
      };

      const document = await DocumentService.updateDocument(
        id,
        updateData,
        user.id,
        user.role
      );

      res.status(200).json({
        success: true,
        message: 'Document mis à jour avec succès',
        data: prepareDocumentForResponse(document)
      });
    } catch (error) {
      logger.error('Error updating document:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Document non trouvé') {
          res.status(404).json({
            success: false,
            error: 'Not Found',
            message: error.message
          });
          return;
        }
        
        if (error.message === 'Permissions insuffisantes') {
          res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la mise à jour du document'
      });
    }
  }

  /**
   * Delete document
   */
  static async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      await DocumentService.deleteDocument(id, user.id, user.role);

      res.status(200).json({
        success: true,
        message: 'Document supprimé avec succès'
      });
    } catch (error) {
      logger.error('Error deleting document:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Document non trouvé') {
          res.status(404).json({
            success: false,
            error: 'Not Found',
            message: error.message
          });
          return;
        }
        
        if (error.message === 'Permissions insuffisantes') {
          res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la suppression du document'
      });
    }
  }

  /**
   * Download document
   */
  static async downloadDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      const filePath = await DocumentService.getDocumentFilePath(
        id,
        user.id,
        user.role,
        user.filiereId,
        user.niveauId
      );

      // Get document info for proper filename
      const document = await DocumentService.getDocumentById(
        id,
        user.id,
        user.role,
        user.filiereId,
        user.niveauId
      );

      if (!document) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Document non trouvé'
        });
        return;
      }

      // Set appropriate headers with properly encoded filename
      const encodedFilename = encodeURIComponent(document.nomFichier);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
      res.setHeader('Content-Type', document.typeMime);
      res.setHeader('Content-Length', document.tailleFichier.toString());

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        logger.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Erreur lors du téléchargement du fichier'
          });
        }
      });

      // Increment download count on successful stream start
      fileStream.on('open', async () => {
        try {
          await DocumentService.incrementDownloadCount(id);
          
          // Log document download
          await logAuditEvent(
            user.id,
            'DOCUMENT_DOWNLOAD',
            'document',
            id,
            {
              documentTitle: document.titre,
              fileName: document.nomFichier,
              fileSize: document.tailleFichier.toString()
            },
            req
          );
        } catch (error) {
          logger.error('Error incrementing download count:', error);
        }
      });

      logger.info(`Document downloaded: ${document.titre} by user ${user.id}`);
    } catch (error) {
      logger.error('Error downloading document:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Document non trouvé' || error.message === 'Fichier non trouvé sur le serveur') {
          res.status(404).json({
            success: false,
            error: 'Not Found',
            message: error.message
          });
          return;
        }
        
        if (error.message === 'Accès non autorisé à ce document') {
          res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors du téléchargement du document'
      });
    }
  }

  /**
   * Get documents by professor
   */
  static async getDocumentsByProfessor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const user = req.user!;

      // Check permissions (admin or the professor themselves)
      if (user.role !== 'admin' && user.id !== id) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Permissions insuffisantes'
        });
        return;
      }

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const result = await DocumentService.getDocumentsByProfessor(id, pagination);

      res.status(200).json({
        success: true,
        message: 'Documents du professeur récupérés avec succès',
        data: prepareDocumentsForResponse(result.documents),
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error getting documents by professor:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des documents du professeur'
      });
    }
  }

  /**
   * Get PFE documents
   */
  static async getPFEDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const user = req.user!;

      // Check if user can access PFE documents
      if (user.role === 'etudiant') {
        // Check if student is in terminal semester
        const canAccessPFE = await DocumentService.canAccessPFEDocuments(
          user.niveauId!
        );
        
        if (!canAccessPFE) {
          res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: 'Accès aux documents PFE réservé aux étudiants en semestre terminal'
          });
          return;
        }
      }

      const filters = {
        categorie: 'pfe' as any,
        search: search as string,
        userId: user.id,
        userRole: user.role,
        userFiliereId: user.filiereId,
        userNiveauId: user.niveauId
      };

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const result = await DocumentService.getDocuments(filters, pagination);

      res.status(200).json({
        success: true,
        message: 'Documents PFE récupérés avec succès',
        data: prepareDocumentsForResponse(result.documents),
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error getting PFE documents:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des documents PFE'
      });
    }
  }

  /**
   * Upload correction for a document
   */
  static async uploadCorrection(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Aucun fichier fourni'
        });
        return;
      }

      const { parentDocumentId } = req.params;
      const fileInfo = getFileInfo(req.file);
      const { titre, description } = req.body;

      const correctionData = {
        titre,
        description,
        categorie: req.body.categorie || 'cours', // Default to cours, but will be inherited from parent
        telchargePar: req.user!.id,
        cheminFichier: req.file.path,
        nomFichier: fileInfo.originalName,
        tailleFichier: fileInfo.size,
        typeMime: fileInfo.mimeType
      };

      const document = await DocumentService.createCorrection(parentDocumentId, correctionData);

      res.status(201).json({
        success: true,
        message: 'Correction téléchargée avec succès',
        data: prepareDocumentForResponse(document)
      });
    } catch (error) {
      logger.error('Error uploading correction:', error);
      
      // Clean up uploaded file on error
      if (req.file) {
        cleanupUploadedFile(req.file.path);
      }

      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: 'Upload Error',
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Erreur lors du téléchargement de la correction'
        });
      }
    }
  }
} 