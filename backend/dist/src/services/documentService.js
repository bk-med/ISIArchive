"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../config/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
class DocumentService {
    static async createDocument(data) {
        try {
            let matiereIds = [];
            if (data.matiereIds && data.matiereIds.length > 0) {
                matiereIds = data.matiereIds;
            }
            else if (data.matiereId) {
                matiereIds = [data.matiereId];
            }
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
            const document = await prisma.$transaction(async (tx) => {
                const newDocument = await tx.document.create({
                    data: {
                        titre: data.titre,
                        description: data.description,
                        categorie: data.categorie,
                        matiereId: data.matiereId,
                        telchargePar: data.telchargePar,
                        cheminFichier: data.cheminFichier,
                        nomFichier: data.nomFichier,
                        tailleFichier: BigInt(data.tailleFichier),
                        typeMime: data.typeMime,
                        correctionId: data.correctionId
                    }
                });
                if (matiereIds.length > 0) {
                    await tx.documentMatiere.createMany({
                        data: matiereIds.map(matiereId => ({
                            documentId: newDocument.id,
                            matiereId: matiereId
                        }))
                    });
                }
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
            logger_1.logger.info(`Document created: ${document.titre} by user ${data.telchargePar} with ${matiereIds.length} matiere(s)`);
            return document;
        }
        catch (error) {
            logger_1.logger.error('Error creating document:', error);
            throw error;
        }
    }
    static async createPFEDocument(data) {
        try {
            const result = await prisma.$transaction(async (tx) => {
                const document = await tx.document.create({
                    data: {
                        titre: data.titre,
                        description: data.description,
                        categorie: 'pfe',
                        matiereId: null,
                        telchargePar: data.telchargePar,
                        cheminFichier: data.cheminFichier,
                        nomFichier: data.nomFichier,
                        tailleFichier: BigInt(data.tailleFichier),
                        typeMime: data.typeMime
                    }
                });
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
            logger_1.logger.info(`PFE document created: ${data.titreProjet} by user ${data.telchargePar}`);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error creating PFE document:', error);
            throw error;
        }
    }
    static async createCorrection(parentDocumentId, correctionData) {
        try {
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
            const existingCorrection = await prisma.document.findFirst({
                where: {
                    correctionId: parentDocumentId,
                    isDeleted: false
                }
            });
            if (existingCorrection) {
                throw new Error('Une correction existe déjà pour ce document');
            }
            let organizedFilePath = correctionData.cheminFichier;
            if (parentDocument.matiere) {
                const baseDir = path_1.default.dirname(parentDocument.cheminFichier);
                const correctionsDir = path_1.default.join(baseDir, 'corrections');
                if (!fs_1.default.existsSync(correctionsDir)) {
                    fs_1.default.mkdirSync(correctionsDir, { recursive: true });
                }
                const fileName = path_1.default.basename(correctionData.cheminFichier);
                organizedFilePath = path_1.default.join(correctionsDir, fileName);
                try {
                    fs_1.default.renameSync(correctionData.cheminFichier, organizedFilePath);
                    logger_1.logger.info(`Correction file organized: ${organizedFilePath}`);
                }
                catch (error) {
                    logger_1.logger.error('Error organizing correction file:', error);
                    throw new Error('Erreur lors de l\'organisation du fichier de correction');
                }
            }
            const correctionDocument = await this.createDocument({
                ...correctionData,
                cheminFichier: organizedFilePath,
                correctionId: parentDocumentId,
                matiereId: parentDocument.matiereId,
                categorie: parentDocument.categorie,
                titre: `Correction - ${correctionData.titre}`
            });
            logger_1.logger.info(`Correction created for document ${parentDocumentId} by user ${correctionData.telchargePar}`);
            return correctionDocument;
        }
        catch (error) {
            logger_1.logger.error('Error creating correction:', error);
            if (fs_1.default.existsSync(correctionData.cheminFichier)) {
                try {
                    fs_1.default.unlinkSync(correctionData.cheminFichier);
                    logger_1.logger.info(`Cleaned up failed correction upload: ${correctionData.cheminFichier}`);
                }
                catch (cleanupError) {
                    logger_1.logger.error('Error cleaning up failed upload:', cleanupError);
                }
            }
            throw error;
        }
    }
    static async getDocuments(filters = {}, pagination = {}) {
        try {
            const { page = 1, limit = 20 } = pagination;
            const skip = (page - 1) * limit;
            const whereClause = {
                isDeleted: false,
                correctionId: null
            };
            if (filters.matiereId) {
                whereClause.OR = [
                    { matiereId: filters.matiereId },
                    {
                        documentMatieres: {
                            some: {
                                matiereId: filters.matiereId
                            }
                        }
                    }
                ];
            }
            if (filters.categorie) {
                whereClause.categorie = filters.categorie;
            }
            if (filters.search) {
                whereClause.OR = [
                    { titre: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } }
                ];
            }
            if (filters.userRole === 'etudiant') {
                const accessConditions = [
                    {
                        matiere: {
                            filiereId: filters.userFiliereId,
                            filiere: {
                                niveauId: filters.userNiveauId
                            }
                        }
                    },
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
                    {
                        categorie: 'pfe',
                        matiereId: null
                    }
                ];
                if (whereClause.OR) {
                    whereClause.AND = [
                        { OR: whereClause.OR },
                        { OR: accessConditions }
                    ];
                    delete whereClause.OR;
                }
                else {
                    whereClause.OR = accessConditions;
                }
            }
            else if (filters.userRole === 'professeur') {
                const accessConditions = [
                    {
                        matiere: {
                            professeurMatieres: {
                                some: {
                                    professeurId: filters.userId
                                }
                            }
                        }
                    },
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
                    {
                        categorie: 'pfe',
                        matiereId: null
                    }
                ];
                if (whereClause.OR) {
                    whereClause.AND = [
                        { OR: whereClause.OR },
                        { OR: accessConditions }
                    ];
                    delete whereClause.OR;
                }
                else {
                    whereClause.OR = accessConditions;
                }
            }
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
        }
        catch (error) {
            logger_1.logger.error('Error getting documents:', error);
            throw error;
        }
    }
    static async getDocumentById(id, userId, userRole, userFiliereId, userNiveauId) {
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
            const hasAccess = await this.checkDocumentAccess(document, userId, userRole, userFiliereId, userNiveauId);
            if (!hasAccess) {
                throw new Error('Accès non autorisé à ce document');
            }
            return document;
        }
        catch (error) {
            logger_1.logger.error('Error getting document by ID:', error);
            throw error;
        }
    }
    static async updateDocument(id, data, userId, userRole) {
        try {
            const existingDocument = await prisma.document.findFirst({
                where: {
                    id,
                    isDeleted: false
                }
            });
            if (!existingDocument) {
                throw new Error('Document non trouvé');
            }
            if (userRole !== 'admin' && existingDocument.telchargePar !== userId) {
                throw new Error('Permissions insuffisantes');
            }
            const document = await prisma.$transaction(async (tx) => {
                const updatedDocument = await tx.document.update({
                    where: { id },
                    data: {
                        ...(data.titre && { titre: data.titre }),
                        ...(data.description !== undefined && { description: data.description }),
                        ...(data.categorie && { categorie: data.categorie }),
                        ...(data.matiereId !== undefined && { matiereId: data.matiereId })
                    }
                });
                if (data.matiereIds !== undefined) {
                    await tx.documentMatiere.deleteMany({
                        where: { documentId: id }
                    });
                    if (data.matiereIds.length > 0) {
                        await tx.documentMatiere.createMany({
                            data: data.matiereIds.map(matiereId => ({
                                documentId: id,
                                matiereId: matiereId
                            }))
                        });
                    }
                }
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
            logger_1.logger.info(`Document updated: ${document.titre} by user ${userId}`);
            return document;
        }
        catch (error) {
            logger_1.logger.error('Error updating document:', error);
            throw error;
        }
    }
    static async deleteDocument(id, userId, userRole) {
        try {
            const existingDocument = await prisma.document.findFirst({
                where: {
                    id,
                    isDeleted: false
                }
            });
            if (!existingDocument) {
                throw new Error('Document non trouvé');
            }
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
            logger_1.logger.info(`Document deleted: ${existingDocument.titre} by user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Error deleting document:', error);
            throw error;
        }
    }
    static async getDeletedDocuments(userId, userRole, pagination = {}) {
        try {
            const { page = 1, limit = 20 } = pagination;
            const skip = (page - 1) * limit;
            const whereClause = {
                isDeleted: true,
                deletedAt: {
                    not: null
                }
            };
            if (userRole !== 'admin') {
                whereClause.telchargePar = userId;
            }
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
        }
        catch (error) {
            logger_1.logger.error('Error getting deleted documents:', error);
            throw error;
        }
    }
    static async restoreDocument(id, userId, userRole) {
        try {
            const existingDocument = await prisma.document.findFirst({
                where: {
                    id,
                    isDeleted: true
                }
            });
            if (!existingDocument) {
                throw new Error('Document supprimé non trouvé');
            }
            if (existingDocument.deletedAt) {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                if (existingDocument.deletedAt < thirtyDaysAgo) {
                    throw new Error('La période de récupération de 30 jours est expirée');
                }
            }
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
            logger_1.logger.info(`Document restored: ${restoredDocument.titre} by user ${userId}`);
            return restoredDocument;
        }
        catch (error) {
            logger_1.logger.error('Error restoring document:', error);
            throw error;
        }
    }
    static async permanentlyDeleteOldDocuments() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
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
                logger_1.logger.info('No old deleted documents to permanently delete');
                return;
            }
            for (const doc of documentsToDelete) {
                try {
                    if (fs_1.default.existsSync(doc.cheminFichier)) {
                        fs_1.default.unlinkSync(doc.cheminFichier);
                        logger_1.logger.info(`File deleted: ${doc.cheminFichier}`);
                    }
                }
                catch (fileError) {
                    logger_1.logger.error(`Error deleting file ${doc.cheminFichier}:`, fileError);
                }
            }
            const result = await prisma.document.deleteMany({
                where: {
                    isDeleted: true,
                    deletedAt: {
                        lt: thirtyDaysAgo
                    }
                }
            });
            logger_1.logger.info(`Permanently deleted ${result.count} old documents`);
        }
        catch (error) {
            logger_1.logger.error('Error permanently deleting old documents:', error);
            throw error;
        }
    }
    static async getDocumentsExpiringSoon(userId, userRole) {
        try {
            const now = new Date();
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const whereClause = {
                isDeleted: true,
                deletedAt: {
                    gte: thirtyDaysAgo,
                    lte: sevenDaysFromNow
                }
            };
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
        }
        catch (error) {
            logger_1.logger.error('Error getting documents expiring soon:', error);
            throw error;
        }
    }
    static async getTrashStats(userId, userRole) {
        try {
            const now = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            const baseWhere = {
                isDeleted: true,
                deletedAt: {
                    gte: thirtyDaysAgo
                }
            };
            if (userRole !== 'admin') {
                baseWhere.telchargePar = userId;
            }
            const totalDeleted = await prisma.document.count({
                where: baseWhere
            });
            const expiringSoon = await prisma.document.count({
                where: {
                    ...baseWhere,
                    deletedAt: {
                        gte: thirtyDaysAgo,
                        lte: sevenDaysFromNow
                    }
                }
            });
            const recentDeletions = await prisma.document.count({
                where: {
                    ...baseWhere,
                    deletedAt: {
                        gte: sevenDaysAgo
                    }
                }
            });
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
            }, {});
            return {
                totalDeleted,
                expiringSoon,
                recentDeletions,
                byCategory: byCategoryMap
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting trash stats:', error);
            throw error;
        }
    }
    static async getDocumentsByProfessor(professeurId, pagination = {}) {
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
        }
        catch (error) {
            logger_1.logger.error('Error getting documents by professor:', error);
            throw error;
        }
    }
    static async checkDocumentAccess(document, userId, userRole, userFiliereId, userNiveauId) {
        if (userRole === 'admin') {
            return true;
        }
        if (document.telchargePar === userId) {
            return true;
        }
        if (document.categorie === 'pfe') {
            if (userRole === 'professeur') {
                return true;
            }
            if (userRole === 'etudiant') {
                const userNiveau = await prisma.niveau.findUnique({
                    where: { id: userNiveauId }
                });
                if (userNiveau) {
                    const isTerminalSemester = (userNiveau.nom === 'L3' || userNiveau.nom === '3ING') ||
                        (userNiveau.nom === 'M2');
                    return isTerminalSemester;
                }
            }
            return false;
        }
        if (userRole === 'professeur') {
            if (document.matiere) {
                const assignment = await prisma.professeurMatiere.findFirst({
                    where: {
                        professeurId: userId,
                        matiereId: document.matiereId
                    }
                });
                return !!assignment;
            }
        }
        if (userRole === 'etudiant') {
            if (document.matiere) {
                return document.matiere.filiereId === userFiliereId &&
                    document.matiere.filiere.niveauId === userNiveauId;
            }
        }
        return false;
    }
    static async getDocumentFilePath(id, userId, userRole, userFiliereId, userNiveauId) {
        try {
            const document = await this.getDocumentById(id, userId, userRole, userFiliereId, userNiveauId);
            if (!document) {
                throw new Error('Document non trouvé');
            }
            const filePath = document.cheminFichier;
            if (!fs_1.default.existsSync(filePath)) {
                throw new Error('Fichier non trouvé sur le serveur');
            }
            return filePath;
        }
        catch (error) {
            logger_1.logger.error('Error getting document file path:', error);
            throw error;
        }
    }
    static async checkProfessorMatiereAssignment(professeurId, matiereId) {
        try {
            const assignment = await prisma.professeurMatiere.findFirst({
                where: {
                    professeurId,
                    matiereId
                }
            });
            return !!assignment;
        }
        catch (error) {
            logger_1.logger.error('Error checking professor matiere assignment:', error);
            return false;
        }
    }
    static async canAccessPFEDocuments(niveauId) {
        try {
            const niveau = await prisma.niveau.findUnique({
                where: { id: niveauId }
            });
            if (!niveau) {
                return false;
            }
            const terminalNiveaux = ['L3', '3ING', 'M2'];
            return terminalNiveaux.includes(niveau.nom);
        }
        catch (error) {
            logger_1.logger.error('Error checking PFE access:', error);
            return false;
        }
    }
    static async cleanupOrphanedFiles() {
        try {
            logger_1.logger.info('Starting cleanup of orphaned files...');
            logger_1.logger.info('Orphaned files cleanup completed');
        }
        catch (error) {
            logger_1.logger.error('Error during orphaned files cleanup:', error);
        }
    }
    static async incrementViewCount(documentId) {
        try {
            const now = Date.now();
            const lastViewTime = this.recentViews.get(documentId);
            if (lastViewTime && (now - lastViewTime) < 5000) {
                logger_1.logger.info(`View count increment skipped for document ${documentId} (rate limited)`);
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
            this.recentViews.set(documentId, now);
            for (const [docId, timestamp] of this.recentViews.entries()) {
                if (now - timestamp > 60000) {
                    this.recentViews.delete(docId);
                }
            }
            logger_1.logger.info(`View count incremented for document ${documentId}`);
        }
        catch (error) {
            logger_1.logger.error('Error incrementing view count:', error);
        }
    }
    static async incrementDownloadCount(documentId) {
        try {
            await prisma.document.update({
                where: { id: documentId },
                data: {
                    downloadCount: {
                        increment: 1
                    }
                }
            });
            logger_1.logger.info(`Download count incremented for document ${documentId}`);
        }
        catch (error) {
            logger_1.logger.error('Error incrementing download count:', error);
        }
    }
}
exports.DocumentService = DocumentService;
DocumentService.recentViews = new Map();
//# sourceMappingURL=documentService.js.map