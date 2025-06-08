"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicController = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const client_1 = require("@prisma/client");
class AcademicController {
    static async getNiveaux(req, res) {
        try {
            const niveaux = await database_1.prisma.niveau.findMany({
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
        }
        catch (error) {
            logger_1.logger.error('Error getting niveaux:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la récupération des niveaux'
            });
        }
    }
    static async getFilieres(req, res) {
        try {
            const { niveauId, includeDeleted } = req.query;
            const where = {};
            if (niveauId) {
                where.niveauId = niveauId;
            }
            if (!includeDeleted || req.user?.role !== client_1.UserRole.admin) {
                where.isDeleted = false;
            }
            const filieres = await database_1.prisma.filiere.findMany({
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
        }
        catch (error) {
            logger_1.logger.error('Error getting filieres:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la récupération des filières'
            });
        }
    }
    static async createFiliere(req, res) {
        try {
            const { nom, code, niveauId } = req.body;
            const niveau = await database_1.prisma.niveau.findUnique({
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
            const existingFiliere = await database_1.prisma.filiere.findUnique({
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
            const filiere = await database_1.prisma.filiere.create({
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
            logger_1.logger.info(`Filiere created: ${filiere.code} by user ${req.user?.id}`);
            res.status(201).json({
                success: true,
                message: 'Filière créée avec succès',
                data: filiere
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating filiere:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la création de la filière'
            });
        }
    }
    static async updateFiliere(req, res) {
        try {
            const { id } = req.params;
            const { nom, code, niveauId } = req.body;
            const existingFiliere = await database_1.prisma.filiere.findUnique({
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
            if (niveauId) {
                const niveau = await database_1.prisma.niveau.findUnique({
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
            if (code && code !== existingFiliere.code) {
                const codeExists = await database_1.prisma.filiere.findUnique({
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
            const filiere = await database_1.prisma.filiere.update({
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
            logger_1.logger.info(`Filiere updated: ${filiere.code} by user ${req.user?.id}`);
            res.status(200).json({
                success: true,
                message: 'Filière mise à jour avec succès',
                data: filiere
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating filiere:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la mise à jour de la filière'
            });
        }
    }
    static async deleteFiliere(req, res) {
        try {
            const { id } = req.params;
            const existingFiliere = await database_1.prisma.filiere.findUnique({
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
            if (existingFiliere.users.length > 0) {
                res.status(400).json({
                    success: false,
                    error: 'Bad Request',
                    message: 'Impossible de supprimer une filière contenant des utilisateurs actifs'
                });
                return;
            }
            await database_1.prisma.$transaction(async (tx) => {
                await tx.matiere.updateMany({
                    where: { filiereId: id, isDeleted: false },
                    data: {
                        isDeleted: true,
                        deletedAt: new Date()
                    }
                });
                await tx.filiere.update({
                    where: { id },
                    data: {
                        isDeleted: true,
                        deletedAt: new Date()
                    }
                });
            });
            logger_1.logger.info(`Filiere deleted: ${existingFiliere.code} by user ${req.user?.id}`);
            res.status(200).json({
                success: true,
                message: 'Filière supprimée avec succès'
            });
        }
        catch (error) {
            logger_1.logger.error('Error deleting filiere:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la suppression de la filière'
            });
        }
    }
    static async getMatieres(req, res) {
        try {
            const { filiereId, semestreId, niveauId, includeDeleted } = req.query;
            const where = {};
            if (filiereId || niveauId) {
                where.filiere = {};
                if (filiereId) {
                    where.filiere.id = filiereId;
                }
                if (niveauId) {
                    where.filiere.niveauId = niveauId;
                }
            }
            if (semestreId) {
                where.semestreId = semestreId;
            }
            if (!includeDeleted || req.user?.role !== client_1.UserRole.admin) {
                where.isDeleted = false;
            }
            const matieres = await database_1.prisma.matiere.findMany({
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
        }
        catch (error) {
            logger_1.logger.error('Error getting matieres:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la récupération des matières'
            });
        }
    }
    static async getMatiere(req, res) {
        try {
            const { id } = req.params;
            const matiere = await database_1.prisma.matiere.findFirst({
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
            if (req.user?.role === client_1.UserRole.professeur) {
                const hasAccess = matiere.professeurMatieres.some(pm => pm.professeurId === req.user?.id);
                if (!hasAccess) {
                    res.status(403).json({
                        success: false,
                        error: 'Forbidden',
                        message: 'Accès non autorisé à cette matière'
                    });
                    return;
                }
            }
            else if (req.user?.role === client_1.UserRole.etudiant) {
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
        }
        catch (error) {
            logger_1.logger.error('Error getting matiere:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la récupération de la matière'
            });
        }
    }
    static async createMatiere(req, res) {
        try {
            const { nom, code, filiereId, semestreId } = req.body;
            const filiere = await database_1.prisma.filiere.findFirst({
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
            const semestre = await database_1.prisma.semestre.findUnique({
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
            const existingMatiere = await database_1.prisma.matiere.findFirst({
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
            const matiere = await database_1.prisma.matiere.create({
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
            logger_1.logger.info(`Matiere created: ${matiere.code} by user ${req.user?.id}`);
            res.status(201).json({
                success: true,
                message: 'Matière créée avec succès',
                data: matiere
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating matiere:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la création de la matière'
            });
        }
    }
    static async updateMatiere(req, res) {
        try {
            const { id } = req.params;
            const { nom, code, filiereId, semestreId } = req.body;
            const existingMatiere = await database_1.prisma.matiere.findUnique({
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
            if (filiereId) {
                const filiere = await database_1.prisma.filiere.findFirst({
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
            if (semestreId) {
                const semestre = await database_1.prisma.semestre.findUnique({
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
            if (code || filiereId) {
                const newCode = code || existingMatiere.code;
                const newFiliereId = filiereId || existingMatiere.filiereId;
                if (newCode !== existingMatiere.code || newFiliereId !== existingMatiere.filiereId) {
                    const codeExists = await database_1.prisma.matiere.findFirst({
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
            const matiere = await database_1.prisma.matiere.update({
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
            logger_1.logger.info(`Matiere updated: ${matiere.code} by user ${req.user?.id}`);
            res.status(200).json({
                success: true,
                message: 'Matière mise à jour avec succès',
                data: matiere
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating matiere:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la mise à jour de la matière'
            });
        }
    }
    static async deleteMatiere(req, res) {
        try {
            const { id } = req.params;
            const existingMatiere = await database_1.prisma.matiere.findUnique({
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
            if (existingMatiere.documents.length > 0) {
                res.status(400).json({
                    success: false,
                    error: 'Bad Request',
                    message: 'Impossible de supprimer une matière contenant des documents'
                });
                return;
            }
            await database_1.prisma.$transaction(async (tx) => {
                await tx.professeurMatiere.deleteMany({
                    where: { matiereId: id }
                });
                await tx.matiere.update({
                    where: { id },
                    data: {
                        isDeleted: true,
                        deletedAt: new Date()
                    }
                });
            });
            logger_1.logger.info(`Matiere deleted: ${existingMatiere.code} by user ${req.user?.id}`);
            res.status(200).json({
                success: true,
                message: 'Matière supprimée avec succès'
            });
        }
        catch (error) {
            logger_1.logger.error('Error deleting matiere:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la suppression de la matière'
            });
        }
    }
    static async getProfesseurMatieres(req, res) {
        try {
            const { id } = req.params;
            const user = await database_1.prisma.user.findUnique({
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
            if (user.role !== client_1.UserRole.professeur) {
                res.status(400).json({
                    success: false,
                    error: 'Bad Request',
                    message: 'L\'utilisateur n\'est pas un professeur'
                });
                return;
            }
            const professeurMatieres = await database_1.prisma.professeurMatiere.findMany({
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
            }, {});
            const matieres = Object.values(matieresWithRoles);
            res.status(200).json({
                success: true,
                message: 'Matières du professeur récupérées avec succès',
                data: matieres
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting professor matieres:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la récupération des matières du professeur'
            });
        }
    }
    static async getMatiereProfesseurs(req, res) {
        try {
            const { id } = req.params;
            const matiere = await database_1.prisma.matiere.findFirst({
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
            const professeurMatieres = await database_1.prisma.professeurMatiere.findMany({
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
            }, {});
            const professeurs = Object.values(professeursWithRoles);
            res.status(200).json({
                success: true,
                message: 'Professeurs de la matière récupérés avec succès',
                data: professeurs
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting matiere professors:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la récupération des professeurs de la matière'
            });
        }
    }
    static async assignMatiereToProf(req, res) {
        try {
            const { id } = req.params;
            const { matiereId, role } = req.body;
            if (!['cours', 'td', 'tp'].includes(role)) {
                res.status(400).json({
                    success: false,
                    error: 'Bad Request',
                    message: 'Rôle invalide. Les rôles valides sont: cours, td, tp'
                });
                return;
            }
            const professor = await database_1.prisma.user.findUnique({
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
            if (professor.role !== client_1.UserRole.professeur) {
                res.status(400).json({
                    success: false,
                    error: 'Bad Request',
                    message: 'L\'utilisateur n\'est pas un professeur'
                });
                return;
            }
            const matiere = await database_1.prisma.matiere.findFirst({
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
            const existingRoleAssignment = await database_1.prisma.professeurMatiere.findFirst({
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
            const assignment = await database_1.prisma.professeurMatiere.create({
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
            logger_1.logger.info(`Matiere ${matiere.code} assigned to professor ${professor.email} with role ${role} by user ${req.user?.id}`);
            res.status(201).json({
                success: true,
                message: 'Matière assignée au professeur avec succès',
                data: assignment
            });
        }
        catch (error) {
            logger_1.logger.error('Error assigning matiere to professor:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de l\'assignation de la matière'
            });
        }
    }
    static async removeMatiereFromProf(req, res) {
        try {
            const { id, matiereId } = req.params;
            const { role } = req.body;
            if (role && !['cours', 'td', 'tp'].includes(role)) {
                res.status(400).json({
                    success: false,
                    error: 'Bad Request',
                    message: 'Rôle invalide. Les rôles valides sont: cours, td, tp'
                });
                return;
            }
            const whereClause = {
                professeurId: id,
                matiereId
            };
            if (role) {
                whereClause.role = role;
            }
            const assignments = await database_1.prisma.professeurMatiere.findMany({
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
            await database_1.prisma.professeurMatiere.deleteMany({
                where: whereClause
            });
            const roleText = role ? ` pour le rôle ${role}` : '';
            logger_1.logger.info(`Matiere ${assignments[0].matiere.code} removed from professor ${assignments[0].professeur.email}${roleText} by user ${req.user?.id}`);
            res.status(200).json({
                success: true,
                message: 'Assignation de matière supprimée avec succès'
            });
        }
        catch (error) {
            logger_1.logger.error('Error removing matiere from professor:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la suppression de l\'assignation'
            });
        }
    }
    static async updateMatiereProfesseurs(req, res) {
        try {
            const { id } = req.params;
            const { professeurs } = req.body;
            const matiere = await database_1.prisma.matiere.findFirst({
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
            if (!Array.isArray(professeurs)) {
                res.status(400).json({
                    success: false,
                    error: 'Bad Request',
                    message: 'Le format des professeurs est invalide'
                });
                return;
            }
            const allRoles = [];
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
                const professor = await database_1.prisma.user.findUnique({
                    where: { id: prof.professeurId }
                });
                if (!professor || professor.role !== client_1.UserRole.professeur) {
                    res.status(400).json({
                        success: false,
                        error: 'Bad Request',
                        message: `Professeur invalide: ${prof.professeurId}`
                    });
                    return;
                }
            }
            await database_1.prisma.professeurMatiere.deleteMany({
                where: { matiereId: id }
            });
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
                await database_1.prisma.professeurMatiere.createMany({
                    data: newAssignments
                });
            }
            logger_1.logger.info(`Matiere ${matiere.code} professor assignments updated by user ${req.user?.id}`);
            res.status(200).json({
                success: true,
                message: 'Assignations des professeurs mises à jour avec succès'
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating matiere professors:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la mise à jour des assignations'
            });
        }
    }
}
exports.AcademicController = AcademicController;
//# sourceMappingURL=academicController.js.map