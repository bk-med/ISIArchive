import { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '../types/auth';
export declare class AuthService {
    private static readonly REFRESH_TOKEN_PREFIX;
    private static readonly USER_SESSION_PREFIX;
    private static readonly TOKEN_VERSION_PREFIX;
    static login(loginData: LoginRequest): Promise<LoginResponse>;
    static requestPasswordReset(email: string): Promise<void>;
    static resetPassword(token: string, newPassword: string): Promise<void>;
    static refreshToken(refreshData: RefreshTokenRequest): Promise<RefreshTokenResponse>;
    static logout(userId: string): Promise<void>;
    static logoutAllDevices(userId: string): Promise<void>;
    static isUserLoggedIn(userId: string): Promise<boolean>;
    static getUserSession(userId: string): Promise<any>;
    private static storeRefreshToken;
    private static updateUserSession;
    private static getOrCreateTokenVersion;
    private static getTokenVersion;
    private static incrementTokenVersion;
    private static incrementLoginCount;
}
//# sourceMappingURL=authService.d.ts.map