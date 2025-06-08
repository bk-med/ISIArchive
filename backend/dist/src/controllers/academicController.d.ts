/// <reference types="cookie-parser" />
import { Request, Response } from 'express';
export declare class AcademicController {
    static getNiveaux(req: Request, res: Response): Promise<void>;
    static getFilieres(req: Request, res: Response): Promise<void>;
    static createFiliere(req: Request, res: Response): Promise<void>;
    static updateFiliere(req: Request, res: Response): Promise<void>;
    static deleteFiliere(req: Request, res: Response): Promise<void>;
    static getMatieres(req: Request, res: Response): Promise<void>;
    static getMatiere(req: Request, res: Response): Promise<void>;
    static createMatiere(req: Request, res: Response): Promise<void>;
    static updateMatiere(req: Request, res: Response): Promise<void>;
    static deleteMatiere(req: Request, res: Response): Promise<void>;
    static getProfesseurMatieres(req: Request, res: Response): Promise<void>;
    static getMatiereProfesseurs(req: Request, res: Response): Promise<void>;
    static assignMatiereToProf(req: Request, res: Response): Promise<void>;
    static removeMatiereFromProf(req: Request, res: Response): Promise<void>;
    static updateMatiereProfesseurs(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=academicController.d.ts.map