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
export const signUpNewUser = async (req: Request, res: Response) => {
    try {
        const { email, password, first_name, last_name } = req.body;
        const userDoesExist = await prisma.user.findUnique({
            where: {email}
        });
        if(userDoesExist) return res.status(409).json({error: 'User exists'});

        const password_hash = await bcrypt.hash(password, 10);
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
        return res.status(500).json({error: 'There was an issue signing up!'});
    }
}