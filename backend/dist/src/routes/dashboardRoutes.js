"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const dashboardController_1 = require("../controllers/dashboardController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/admin', dashboardController_1.getAdminDashboard);
router.get('/professor', dashboardController_1.getProfessorDashboard);
router.get('/student', dashboardController_1.getStudentDashboard);
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map