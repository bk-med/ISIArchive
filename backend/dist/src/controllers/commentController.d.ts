/// <reference types="cookie-parser" />
import { Request, Response } from 'express';
export declare class CommentController {
    static getDocumentComments(req: Request, res: Response): Promise<void>;
    static createComment(req: Request, res: Response): Promise<void>;
    static updateComment(req: Request, res: Response): Promise<void>;
    static deleteComment(req: Request, res: Response): Promise<void>;
    static checkReplyPermission(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=commentController.d.ts.map