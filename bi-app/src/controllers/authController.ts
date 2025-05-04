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
            where: {email}
        });
        if(userDoesExist) res.status(409).json({error: 'User exists'});

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

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, {expiresIn: '1h'});
        res.status(201).json({ token });
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'There was an issue signing up!'});
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
        const { email, password} = req.body.data;
        const user = await prisma.user.findUnique({
            where: {email}
        });

        if(!user) {
            res.status(401).json({ error: 'Invalid email/password combination' });
            return;
        }

        const passwordIsValid = await bcrypt.compare(password, user.password_hash);
        if(!passwordIsValid) {
            res.status(401).json({ error: 'Invalid email/password combination' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, {expiresIn: '1h'});
        res.status(200).json({ token })
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'There was an error signing in!'});
    }
}

/**
 * 
 * @param req 
 * @param res 
 */
export const createSignoutUser = async (req: Request, res: Response) => {

}