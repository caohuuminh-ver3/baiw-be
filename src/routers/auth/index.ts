import express from 'express';

import asyncHandler from '../../utils/async-handler';
import authController from '../../controllers/auth.controller';
import validateDto from '../../middlewares/validate';
import { RegisterDto, LoginDto, RefreshTokenDto } from '../../dtos/auth.dto';
import { authenticate } from '../../middlewares/jwt.middleware';

const router = express.Router();

router.post('/signup', validateDto(RegisterDto), asyncHandler(authController.signup));
router.post('/login', validateDto(LoginDto), asyncHandler(authController.login));
router.post('/refresh-token', asyncHandler(authController.refreshToken));
router.post('/logout', authenticate, asyncHandler(authController.logout));

export default router;
