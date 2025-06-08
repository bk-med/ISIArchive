/// <reference types="cookie-parser" />
import { Request, Response } from 'express';
export declare class AuthController {
    static login(req: Request, res: Response): Promise<void>;
    static requestPasswordReset(req: Request, res: Response): Promise<void>;
    static resetPassword(req: Request, res: Response): Promise<void>;
    static refreshToken(req: Request, res: Response): Promise<void>;
    static logout(req: Request, res: Response): Promise<void>;
    static logoutAllDevices(req: Request, res: Response): Promise<void>;
    static getProfile(req: Request, res: Response): Promise<void>;
    static changePassword(req: Request, res: Response): Promise<void>;
    static checkAuth(req: Request, res: Response): Promise<void>;
    static updateProfile(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=authController.d.ts.map