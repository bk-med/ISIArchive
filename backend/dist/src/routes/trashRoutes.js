"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const trashController_1 = require("../controllers/trashController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/documents', trashController_1.getDeletedDocuments);
router.post('/documents/:id/restore', (0, auditMiddleware_1.auditMiddleware)('DOCUMENT_RESTORE', 'document'), trashController_1.restoreDocument);
router.get('/documents/expiring', trashController_1.getDocumentsExpiringSoon);
router.delete('/documents/:id/permanent', trashController_1.permanentlyDeleteDocument);
router.get('/stats', trashController_1.getTrashStats);
exports.default = router;
//# sourceMappingURL=trashRoutes.js.map