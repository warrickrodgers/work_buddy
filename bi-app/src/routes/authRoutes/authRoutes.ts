import express, { Request, Response } from 'express';
import { 
    createSignInUser,
    createNewUser,
    createSignoutUser
} from '../../controllers/authController';

const router = express.Router();

router.post('/signin', createSignInUser);
router.post('/signup', createNewUser);
router.post('/signout', createSignoutUser)

export default router;