/// <reference types="cookie-parser" />
import { Request, Response } from 'express';
export declare class DocumentController {
    static uploadDocument(req: Request, res: Response): Promise<void>;
    static uploadPFEDocument(req: Request, res: Response): Promise<void>;
    static getDocuments(req: Request, res: Response): Promise<void>;
    static getDocumentById(req: Request, res: Response): Promise<void>;
    static updateDocument(req: Request, res: Response): Promise<void>;
    static deleteDocument(req: Request, res: Response): Promise<void>;
    static downloadDocument(req: Request, res: Response): Promise<void>;
    static getDocumentsByProfessor(req: Request, res: Response): Promise<void>;
    static getPFEDocuments(req: Request, res: Response): Promise<void>;
    static uploadCorrection(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=documentController.d.ts.map