import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { json, Request, Response } from 'express';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

/**
 * POST Request to signup a new user
 * TODO - Test this
 * @param req - Request body
 * @param res - Response body
 */
export const createNewUser = async (req: Request, res: Response) => {
    try {
        const { email, password, first_name, last_name } = req.body;
        const userDoesExist = await prisma.user.findUnique({
            where: { email }
        });
        if (userDoesExist) {
            res.status(409).json({ error: 'User exists' });
            return; // Add return here
        }

        const password_hash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: {
                email,
                first_name,
                last_name,
                password_hash,
                auth_method: 'local',
                job_title: '',
                company: ''
            },
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        
        // Return both token and user data
        res.status(201).json({ 
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                job_title: user.job_title,
                company: user.company
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'There was an issue signing up!' });
    }
}

/**
 * The main sign in authentication controller
 * @param req - Request body
 * @param res - Response body
 * @returns 
 */
export const createSignInUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid email/password combination' });
            return;
        }

        const passwordIsValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordIsValid) {
            res.status(401).json({ error: 'Invalid email/password combination' });
            return; // Add return here to prevent continuing
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        
        // Return both token and user data (excluding password_hash)
        res.status(200).json({ 
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                job_title: user.job_title,
                company: user.company
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'There was an error signing in!' });
    }
}

/**
 * TODO- Update documentation
 * @param req 
 * @param res 
 */
export const createSignoutUser = async (req: Request, res: Response) => {

}

/**
 * TODO- Update documentation
 * @param req 
 * @param res 
 */
export const getVerifyToken = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Missing token' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.status(200).json({ user: decoded });
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}