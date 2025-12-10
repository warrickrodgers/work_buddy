import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createChallenge = async (req: Request, res: Response) => {
    try {
        const {
            user_id,
            title,
            description,
            category,
            challenge_type,
            audience_type,
            employee_id,
            team_id,
            start_date,
            end_date,
            success_criteria,
            metrics,
            ai_notes
        } = req.body;

        const challenge = await prisma.challenge.create({
            data: {
                user_id,
                title,
                description,
                category,
                challenge_type,
                audience_type,
                employee_id: employee_id || null,
                team_id: team_id || null,
                start_date: new Date(start_date),
                end_date: end_date ? new Date(end_date) : null,
                success_criteria,
                metrics: metrics || null,
                ai_notes: ai_notes || null
            }
        });

        res.status(201).json(challenge);
    } catch (error) {
        console.error('Error creating challenge:', error);
        res.status(500).json({ error: 'Failed to create challenge' });
    }
};

export const getChallengesByUserId = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.user_id);

        const challenges = await prisma.challenge.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            include: {
                check_ins: {
                    orderBy: { created_at: 'desc' },
                    take: 1 // Latest check-in
                }
            }
        });

        res.json(challenges);
    } catch (error) {
        console.error('Error fetching challenges:', error);
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
};

export const getChallengeById = async (req: Request, res: Response) => {
    try {
        const challengeId = parseInt(req.params.id);

        const challenge = await prisma.challenge.findUnique({
            where: { id: challengeId },
            include: {
                conversation: true,  // Include conversation if it exists
                check_ins: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        res.json({
            ...challenge,
            conversation_id: challenge.conversation?.id
        });
    } catch (error) {
        console.error('Error fetching challenge:', error);
        res.status(500).json({ error: 'Failed to fetch challenge' });
    }
};

export const updateChallenge = async (req: Request, res: Response) => {
    try {
        const challengeId = parseInt(req.params.id);
        const updates = req.body;

        const challenge = await prisma.challenge.update({
            where: { id: challengeId },
            data: updates
        });

        res.json(challenge);
    } catch (error) {
        console.error('Error updating challenge:', error);
        res.status(500).json({ error: 'Failed to update challenge' });
    }
};

export const deleteChallenge = async (req: Request, res: Response) => {
    try {
        const challengeId = parseInt(req.params.id);

        await prisma.challenge.delete({
            where: { id: challengeId }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting challenge:', error);
        res.status(500).json({ error: 'Failed to delete challenge' });
    }
};