import express from 'express';
import {
  createSignInUser,
  createNewUser,
  createSignoutUser,
  getVerifyToken,
  mockSsoSignIn,
} from '../../controllers/authController';

const router = express.Router();

router.post('/signin', createSignInUser);
router.post('/signup', createNewUser);
router.post('/signout', createSignoutUser);
router.post('/mock-sso', mockSsoSignIn);
router.get('/verify', getVerifyToken);

export default router;