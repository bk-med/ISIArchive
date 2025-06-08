import { UserRole } from '@prisma/client';
import { CreateUserRequest, UpdateUserRequest, ChangePasswordRequest, AuthenticatedUser } from '../types/auth';
export declare class UserService {
    static createUser(userData: CreateUserRequest, createdBy: string): Promise<AuthenticatedUser>;
    static getUserById(userId: string): Promise<AuthenticatedUser | null>;
    static getUsers(options: {
        page?: number;
        limit?: number;
        search?: string;
        role?: UserRole;
        isActive?: boolean;
    }): Promise<{
        users: {
            id: string;
            email: string;
            prenom: string;
            nom: string;
            role: UserRole;
            isActive: boolean;
            filiereId: string | undefined;
            niveauId: string | undefined;
            filiere: {
                id: string;
                nom: string;
                code: string;
            } | undefined;
            niveau: {
                id: string;
                nom: string;
                type: import(".prisma/client").NiveauType;
            } | undefined;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static updateUser(userId: string, updateData: UpdateUserRequest, updatedBy: string): Promise<AuthenticatedUser>;
    static deleteUser(userId: string, deletedBy: string): Promise<void>;
    static changePassword(userId: string, passwordData: ChangePasswordRequest): Promise<void>;
    static getUserStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        inactiveUsers: number;
        roleDistribution: Record<UserRole, number>;
    }>;
}
//# sourceMappingURL=userService.d.ts.map