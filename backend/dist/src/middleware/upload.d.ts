/// <reference types="qs" />
import { Request } from 'express';
export declare const uploadDocument: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const handleUploadError: (error: any, req: Request, res: any, next: any) => any;
export declare const cleanupUploadedFile: (filePath: string) => void;
export declare const getFileInfo: (file: Express.Multer.File) => {
    originalName: string;
    filename: string;
    path: string;
    size: number;
    mimeType: string;
};
export declare const organizeUploadedFile: (req: Request, res: any, next: any) => any;
//# sourceMappingURL=upload.d.ts.map