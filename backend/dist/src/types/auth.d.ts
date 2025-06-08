import { UserRole } from '@prisma/client';
export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
export interface RefreshTokenPayload {
    userId: string;
    tokenVersion: number;
    iat?: number;
    exp?: number;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    user: {
        id: string;
        email: string;
        prenom: string;
        nom: string;
        role: UserRole;
        isActive: boolean;
    };
    accessToken: string;
    refreshToken: string;
}
export interface RefreshTokenRequest {
    refreshToken: string;
}
export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}
export interface AuthenticatedUser {
    id: string;
    email: string;
    prenom: string;
    nom: string;
    role: UserRole;
    isActive: boolean;
    filiereId?: string;
    niveauId?: string;
}
export interface CreateUserRequest {
    email: string;
    password: string;
    prenom: string;
    nom: string;
    role: UserRole;
    filiereId?: string;
    niveauId?: string;
}
export interface UpdateUserRequest {
    prenom?: string;
    nom?: string;
    role?: UserRole;
    isActive?: boolean;
    filiereId?: string;
    niveauId?: string;
}
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
//# sourceMappingURL=auth.d.ts.map