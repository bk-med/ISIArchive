"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const academicController_1 = require("../controllers/academicController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.get('/niveaux', auth_1.optionalAuth, academicController_1.AcademicController.getNiveaux);
router.get('/filieres', auth_1.optionalAuth, academicController_1.AcademicController.getFilieres);
router.post('/filieres', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)(validation_1.schemas.createFiliere), academicController_1.AcademicController.createFiliere);
router.put('/filieres/:id', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), (0, validation_1.validate)(validation_1.schemas.updateFiliere), academicController_1.AcademicController.updateFiliere);
router.delete('/filieres/:id', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), academicController_1.AcademicController.deleteFiliere);
router.get('/matieres', auth_1.optionalAuth, academicController_1.AcademicController.getMatieres);
router.get('/matieres/:id', auth_1.authenticate, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), academicController_1.AcademicController.getMatiere);
router.post('/matieres', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)(validation_1.schemas.createMatiere), academicController_1.AcademicController.createMatiere);
router.put('/matieres/:id', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), (0, validation_1.validate)(validation_1.schemas.updateMatiere), academicController_1.AcademicController.updateMatiere);
router.delete('/matieres/:id', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), academicController_1.AcademicController.deleteMatiere);
router.get('/professeurs/:id/matieres', auth_1.authenticate, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), academicController_1.AcademicController.getProfesseurMatieres);
router.get('/matieres/:id/professeurs', auth_1.authenticate, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), academicController_1.AcademicController.getMatiereProfesseurs);
router.post('/professeurs/:id/matieres', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), (0, validation_1.validate)(validation_1.schemas.assignMatiereWithRole), academicController_1.AcademicController.assignMatiereToProf);
router.delete('/professeurs/:id/matieres/:matiereId', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)(validation_1.schemas.professeurMatiereParams), academicController_1.AcademicController.removeMatiereFromProf);
router.put('/matieres/:id/professeurs', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), (0, validation_1.validate)(validation_1.schemas.updateMatiereProfesseurs), academicController_1.AcademicController.updateMatiereProfesseurs);
exports.default = router;
//# sourceMappingURL=academicRoutes.js.map