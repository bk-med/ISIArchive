/// <reference types="cookie-parser" />
import { Request, Response } from 'express';
export declare class UserController {
    static createUser(req: Request, res: Response): Promise<void>;
    static getUsers(req: Request, res: Response): Promise<void>;
    static getUserById(req: Request, res: Response): Promise<void>;
    static updateUser(req: Request, res: Response): Promise<void>;
    static deleteUser(req: Request, res: Response): Promise<void>;
    static getUserStats(req: Request, res: Response): Promise<void>;
    static toggleUserStatus(req: Request, res: Response): Promise<void>;
    static bulkUpdateUsers(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=userController.d.ts.map