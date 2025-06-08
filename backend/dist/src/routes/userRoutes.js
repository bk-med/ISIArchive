"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)(validation_1.schemas.createUser), userController_1.UserController.createUser);
router.get('/', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateQuery)(validation_1.schemas.pagination), userController_1.UserController.getUsers);
router.get('/stats', auth_1.authenticate, auth_1.requireAdmin, userController_1.UserController.getUserStats);
router.put('/bulk-update', auth_1.authenticate, auth_1.requireAdmin, userController_1.UserController.bulkUpdateUsers);
router.get('/:id', auth_1.authenticate, (0, auth_1.requireOwnershipOrAdmin)((req) => req.params.id), (0, validation_1.validateParams)(validation_1.schemas.uuidParam), userController_1.UserController.getUserById);
router.put('/:id', auth_1.authenticate, (0, auth_1.requireOwnershipOrAdmin)((req) => req.params.id), (0, validation_1.validateParams)(validation_1.schemas.uuidParam), (0, validation_1.validate)(validation_1.schemas.updateUser), userController_1.UserController.updateUser);
router.delete('/:id', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), userController_1.UserController.deleteUser);
router.patch('/:id/toggle-status', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), userController_1.UserController.toggleUserStatus);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map