import { Document, DocumentCategorie, UserRole } from '@prisma/client';
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
    correctionId?: string | null;
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
export declare class DocumentService {
    private static recentViews;
    static createDocument(data: CreateDocumentData): Promise<Document>;
    static createPFEDocument(data: CreatePFEDocumentData): Promise<Document>;
    static createCorrection(parentDocumentId: string, correctionData: Omit<CreateDocumentData, 'correctionId'>): Promise<Document>;
    static getDocuments(filters?: DocumentFilters, pagination?: PaginationOptions): Promise<{
        documents: ({
            matiere: ({
                filiere: {
                    niveau: import("@prisma/client/runtime").GetResult<{
                        id: string;
                        nom: string;
                        type: import(".prisma/client").NiveauType;
                        ordre: number;
                    }, unknown, never> & {};
                } & import("@prisma/client/runtime").GetResult<{
                    id: string;
                    nom: string;
                    code: string;
                    niveauId: string;
                    isDeleted: boolean;
                    deletedAt: Date | null;
                    createdAt: Date;
                }, unknown, never> & {};
                semestre: import("@prisma/client/runtime").GetResult<{
                    id: string;
                    nom: string;
                    niveauId: string;
                    ordre: number;
                }, unknown, never> & {};
            } & import("@prisma/client/runtime").GetResult<{
                id: string;
                nom: string;
                code: string;
                filiereId: string;
                semestreId: string;
                isDeleted: boolean;
                deletedAt: Date | null;
                createdAt: Date;
            }, unknown, never> & {}) | null;
            documentMatieres: ({
                matiere: {
                    filiere: {
                        niveau: import("@prisma/client/runtime").GetResult<{
                            id: string;
                            nom: string;
                            type: import(".prisma/client").NiveauType;
                            ordre: number;
                        }, unknown, never> & {};
                    } & import("@prisma/client/runtime").GetResult<{
                        id: string;
                        nom: string;
                        code: string;
                        niveauId: string;
                        isDeleted: boolean;
                        deletedAt: Date | null;
                        createdAt: Date;
                    }, unknown, never> & {};
                    semestre: import("@prisma/client/runtime").GetResult<{
                        id: string;
                        nom: string;
                        niveauId: string;
                        ordre: number;
                    }, unknown, never> & {};
                } & import("@prisma/client/runtime").GetResult<{
                    id: string;
                    nom: string;
                    code: string;
                    filiereId: string;
                    semestreId: string;
                    isDeleted: boolean;
                    deletedAt: Date | null;
                    createdAt: Date;
                }, unknown, never> & {};
            } & import("@prisma/client/runtime").GetResult<{
                id: string;
                documentId: string;
                matiereId: string;
                createdAt: Date;
            }, unknown, never> & {})[];
            uploader: {
                id: string;
                prenom: string;
                nom: string;
                role: UserRole;
            };
            documentPFE: (import("@prisma/client/runtime").GetResult<{
                id: string;
                documentId: string;
                anneeDiplome: number;
                filiereDiplome: string;
                titreProjet: string;
                resume: string | null;
                motsCles: string[];
                createdAt: Date;
            }, unknown, never> & {}) | null;
            correction: (import("@prisma/client/runtime").GetResult<{
                id: string;
                titre: string;
                description: string | null;
                cheminFichier: string;
                nomFichier: string;
                tailleFichier: bigint;
                typeMime: string;
                categorie: DocumentCategorie;
                matiereId: string | null;
                telchargePar: string;
                correctionId: string | null;
                downloadCount: number;
                viewCount: number;
                isDeleted: boolean;
                deletedAt: Date | null;
                deletedBy: string | null;
                createdAt: Date;
                updatedAt: Date;
            }, unknown, never> & {}) | null;
            correctionPour: (import("@prisma/client/runtime").GetResult<{
                id: string;
                titre: string;
                description: string | null;
                cheminFichier: string;
                nomFichier: string;
                tailleFichier: bigint;
                typeMime: string;
                categorie: DocumentCategorie;
                matiereId: string | null;
                telchargePar: string;
                correctionId: string | null;
                downloadCount: number;
                viewCount: number;
                isDeleted: boolean;
                deletedAt: Date | null;
                deletedBy: string | null;
                createdAt: Date;
                updatedAt: Date;
            }, unknown, never> & {}) | null;
            _count: {
                commentaires: number;
            };
        } & import("@prisma/client/runtime").GetResult<{
            id: string;
            titre: string;
            description: string | null;
            cheminFichier: string;
            nomFichier: string;
            tailleFichier: bigint;
            typeMime: string;
            categorie: DocumentCategorie;
            matiereId: string | null;
            telchargePar: string;
            correctionId: string | null;
            downloadCount: number;
            viewCount: number;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
            createdAt: Date;
            updatedAt: Date;
        }, unknown, never> & {})[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    static getDocumentById(id: string, userId: string, userRole: UserRole, userFiliereId?: string, userNiveauId?: string): Promise<Document | null>;
    static updateDocument(id: string, data: Partial<CreateDocumentData>, userId: string, userRole: UserRole): Promise<Document>;
    static deleteDocument(id: string, userId: string, userRole: UserRole): Promise<void>;
    static getDeletedDocuments(userId: string, userRole: UserRole, pagination?: PaginationOptions): Promise<{
        documents: ({
            matiere: ({
                filiere: {
                    niveau: import("@prisma/client/runtime").GetResult<{
                        id: string;
                        nom: string;
                        type: import(".prisma/client").NiveauType;
                        ordre: number;
                    }, unknown, never> & {};
                } & import("@prisma/client/runtime").GetResult<{
                    id: string;
                    nom: string;
                    code: string;
                    niveauId: string;
                    isDeleted: boolean;
                    deletedAt: Date | null;
                    createdAt: Date;
                }, unknown, never> & {};
                semestre: import("@prisma/client/runtime").GetResult<{
                    id: string;
                    nom: string;
                    niveauId: string;
                    ordre: number;
                }, unknown, never> & {};
            } & import("@prisma/client/runtime").GetResult<{
                id: string;
                nom: string;
                code: string;
                filiereId: string;
                semestreId: string;
                isDeleted: boolean;
                deletedAt: Date | null;
                createdAt: Date;
            }, unknown, never> & {}) | null;
            uploader: {
                id: string;
                prenom: string;
                nom: string;
                role: UserRole;
            };
            deleter: {
                id: string;
                prenom: string;
                nom: string;
                role: UserRole;
            } | null;
            documentPFE: (import("@prisma/client/runtime").GetResult<{
                id: string;
                documentId: string;
                anneeDiplome: number;
                filiereDiplome: string;
                titreProjet: string;
                resume: string | null;
                motsCles: string[];
                createdAt: Date;
            }, unknown, never> & {}) | null;
            _count: {
                commentaires: number;
            };
        } & import("@prisma/client/runtime").GetResult<{
            id: string;
            titre: string;
            description: string | null;
            cheminFichier: string;
            nomFichier: string;
            tailleFichier: bigint;
            typeMime: string;
            categorie: DocumentCategorie;
            matiereId: string | null;
            telchargePar: string;
            correctionId: string | null;
            downloadCount: number;
            viewCount: number;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
            createdAt: Date;
            updatedAt: Date;
        }, unknown, never> & {})[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    static restoreDocument(id: string, userId: string, userRole: UserRole): Promise<Document>;
    static permanentlyDeleteOldDocuments(): Promise<void>;
    static getDocumentsExpiringSoon(userId: string, userRole: UserRole): Promise<({
        matiere: ({
            filiere: {
                niveau: import("@prisma/client/runtime").GetResult<{
                    id: string;
                    nom: string;
                    type: import(".prisma/client").NiveauType;
                    ordre: number;
                }, unknown, never> & {};
            } & import("@prisma/client/runtime").GetResult<{
                id: string;
                nom: string;
                code: string;
                niveauId: string;
                isDeleted: boolean;
                deletedAt: Date | null;
                createdAt: Date;
            }, unknown, never> & {};
        } & import("@prisma/client/runtime").GetResult<{
            id: string;
            nom: string;
            code: string;
            filiereId: string;
            semestreId: string;
            isDeleted: boolean;
            deletedAt: Date | null;
            createdAt: Date;
        }, unknown, never> & {}) | null;
        uploader: {
            id: string;
            prenom: string;
            nom: string;
        };
    } & import("@prisma/client/runtime").GetResult<{
        id: string;
        titre: string;
        description: string | null;
        cheminFichier: string;
        nomFichier: string;
        tailleFichier: bigint;
        typeMime: string;
        categorie: DocumentCategorie;
        matiereId: string | null;
        telchargePar: string;
        correctionId: string | null;
        downloadCount: number;
        viewCount: number;
        isDeleted: boolean;
        deletedAt: Date | null;
        deletedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, unknown, never> & {})[]>;
    static getTrashStats(userId: string, userRole: UserRole): Promise<{
        totalDeleted: number;
        expiringSoon: number;
        recentDeletions: number;
        byCategory: Record<string, number>;
    }>;
    static getDocumentsByProfessor(professeurId: string, pagination?: PaginationOptions): Promise<{
        documents: ({
            matiere: ({
                filiere: {
                    niveau: import("@prisma/client/runtime").GetResult<{
                        id: string;
                        nom: string;
                        type: import(".prisma/client").NiveauType;
                        ordre: number;
                    }, unknown, never> & {};
                } & import("@prisma/client/runtime").GetResult<{
                    id: string;
                    nom: string;
                    code: string;
                    niveauId: string;
                    isDeleted: boolean;
                    deletedAt: Date | null;
                    createdAt: Date;
                }, unknown, never> & {};
                semestre: import("@prisma/client/runtime").GetResult<{
                    id: string;
                    nom: string;
                    niveauId: string;
                    ordre: number;
                }, unknown, never> & {};
            } & import("@prisma/client/runtime").GetResult<{
                id: string;
                nom: string;
                code: string;
                filiereId: string;
                semestreId: string;
                isDeleted: boolean;
                deletedAt: Date | null;
                createdAt: Date;
            }, unknown, never> & {}) | null;
            _count: {
                commentaires: number;
            };
        } & import("@prisma/client/runtime").GetResult<{
            id: string;
            titre: string;
            description: string | null;
            cheminFichier: string;
            nomFichier: string;
            tailleFichier: bigint;
            typeMime: string;
            categorie: DocumentCategorie;
            matiereId: string | null;
            telchargePar: string;
            correctionId: string | null;
            downloadCount: number;
            viewCount: number;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
            createdAt: Date;
            updatedAt: Date;
        }, unknown, never> & {})[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    private static checkDocumentAccess;
    static getDocumentFilePath(id: string, userId: string, userRole: UserRole, userFiliereId?: string, userNiveauId?: string): Promise<string>;
    static checkProfessorMatiereAssignment(professeurId: string, matiereId: string): Promise<boolean>;
    static canAccessPFEDocuments(niveauId: string): Promise<boolean>;
    static cleanupOrphanedFiles(): Promise<void>;
    static incrementViewCount(documentId: string): Promise<void>;
    static incrementDownloadCount(documentId: string): Promise<void>;
}
//# sourceMappingURL=documentService.d.ts.map