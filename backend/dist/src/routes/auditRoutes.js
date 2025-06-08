"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auditController_1 = require("../controllers/auditController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/logs', auditController_1.getAuditLogs);
router.get('/users/:userId/activity', auditController_1.getUserActivitySummary);
router.get('/stats', auditController_1.getSystemStats);
router.get('/actions', auditController_1.getAuditActions);
router.post('/cleanup', auditController_1.cleanupOldLogs);
exports.default = router;
//# sourceMappingURL=auditRoutes.js.map