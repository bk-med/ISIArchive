import { JwtPayload, RefreshTokenPayload } from '../types/auth';
export declare const generateAccessToken: (payload: Omit<JwtPayload, 'iat' | 'exp'>) => string;
export declare const generateRefreshToken: (payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>) => string;
export declare const verifyAccessToken: (token: string) => JwtPayload;
export declare const verifyRefreshToken: (token: string) => RefreshTokenPayload;
export declare const extractTokenFromHeader: (authHeader: string | undefined) => string | null;
export declare const getTokenExpiration: (token: string) => Date | null;
//# sourceMappingURL=jwt.d.ts.map