import { Commentaire, UserRole } from '@prisma/client';
export interface CreateCommentData {
    contenu: string;
    documentId: string;
    userId: string;
    parentId?: string | null;
}
export interface UpdateCommentData {
    contenu?: string;
}
export interface PaginationOptions {
    page?: number;
    limit?: number;
}
export declare class CommentService {
    static canModerateComments(documentId: string, userId: string, userRole: UserRole, userFiliereId?: string, userNiveauId?: string): Promise<boolean>;
    static getDocumentComments(documentId: string, pagination: PaginationOptions | undefined, userId: string, userRole: UserRole, userFiliereId?: string, userNiveauId?: string): Promise<{
        comments: ({
            user: {
                id: string;
                prenom: string;
                nom: string;
                role: UserRole;
            };
            replies: ({
                user: {
                    id: string;
                    prenom: string;
                    nom: string;
                    role: UserRole;
                };
                replies: ({
                    user: {
                        id: string;
                        prenom: string;
                        nom: string;
                        role: UserRole;
                    };
                    replies: ({
                        user: {
                            id: string;
                            prenom: string;
                            nom: string;
                            role: UserRole;
                        };
                        replies: ({
                            user: {
                                id: string;
                                prenom: string;
                                nom: string;
                                role: UserRole;
                            };
                        } & import("@prisma/client/runtime").GetResult<{
                            id: string;
                            contenu: string;
                            documentId: string;
                            userId: string;
                            parentId: string | null;
                            isDeleted: boolean;
                            deletedAt: Date | null;
                            deletedBy: string | null;
                            isEdited: boolean;
                            createdAt: Date;
                            updatedAt: Date;
                        }, unknown, never> & {})[];
                    } & import("@prisma/client/runtime").GetResult<{
                        id: string;
                        contenu: string;
                        documentId: string;
                        userId: string;
                        parentId: string | null;
                        isDeleted: boolean;
                        deletedAt: Date | null;
                        deletedBy: string | null;
                        isEdited: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                    }, unknown, never> & {})[];
                } & import("@prisma/client/runtime").GetResult<{
                    id: string;
                    contenu: string;
                    documentId: string;
                    userId: string;
                    parentId: string | null;
                    isDeleted: boolean;
                    deletedAt: Date | null;
                    deletedBy: string | null;
                    isEdited: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                }, unknown, never> & {})[];
            } & import("@prisma/client/runtime").GetResult<{
                id: string;
                contenu: string;
                documentId: string;
                userId: string;
                parentId: string | null;
                isDeleted: boolean;
                deletedAt: Date | null;
                deletedBy: string | null;
                isEdited: boolean;
                createdAt: Date;
                updatedAt: Date;
            }, unknown, never> & {})[];
        } & import("@prisma/client/runtime").GetResult<{
            id: string;
            contenu: string;
            documentId: string;
            userId: string;
            parentId: string | null;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
            isEdited: boolean;
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
    static createComment(data: CreateCommentData, userId: string, userRole: UserRole, userFiliereId?: string, userNiveauId?: string): Promise<Commentaire>;
    static updateComment(id: string, data: UpdateCommentData, userId: string, userRole: UserRole): Promise<Commentaire>;
    static deleteComment(id: string, userId: string, userRole: UserRole): Promise<void>;
    static getCommentById(id: string): Promise<Commentaire | null>;
    static getDocumentCommentsCount(documentId: string): Promise<number>;
    static canReplyToComment(parentCommentId: string, userId: string, userRole: UserRole): Promise<{
        canReply: boolean;
        reason?: string;
    }>;
}
//# sourceMappingURL=commentService.d.ts.map