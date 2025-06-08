"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/login', (0, validation_1.validate)(validation_1.schemas.login), authController_1.AuthController.login);
router.post('/forgot-password', authController_1.AuthController.requestPasswordReset);
router.post('/reset-password', authController_1.AuthController.resetPassword);
router.post('/refresh', (0, validation_1.validate)(validation_1.schemas.refreshToken), authController_1.AuthController.refreshToken);
router.post('/logout', auth_1.authenticate, authController_1.AuthController.logout);
router.post('/logout-all', auth_1.authenticate, authController_1.AuthController.logoutAllDevices);
router.get('/profile', auth_1.authenticate, authController_1.AuthController.getProfile);
router.put('/profile', auth_1.authenticate, (0, validation_1.validate)(validation_1.schemas.updateUser), authController_1.AuthController.updateProfile);
router.post('/change-password', auth_1.authenticate, (0, validation_1.validate)(validation_1.schemas.changePassword), authController_1.AuthController.changePassword);
router.get('/check', auth_1.authenticate, authController_1.AuthController.checkAuth);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map