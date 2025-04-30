import express, { Request, Response } from 'express';
import { 
    getSignInUser,
    createNewUser
} from '../../controllers/authController';

const router = express.Router();

router.post('/signin', getSignInUser);
router.post('/signup', createNewUser);

export default router;