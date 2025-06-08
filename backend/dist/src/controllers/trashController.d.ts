import { Request, Response } from 'express';
export declare const getDeletedDocuments: (req: Request, res: Response) => Promise<void>;
export declare const restoreDocument: (req: Request, res: Response) => Promise<void>;
export declare const getDocumentsExpiringSoon: (req: Request, res: Response) => Promise<void>;
export declare const permanentlyDeleteDocument: (req: Request, res: Response) => Promise<void>;
export declare const getTrashStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=trashController.d.ts.map