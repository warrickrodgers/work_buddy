import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

// GET /internal/insights-data/challenges?userId=X
// Returns active challenges with embedded recent check-ins (past 7 days)
export const getInsightChallenges = async (req: Request, res: Response) => {
  const userId = parseInt(req.query.userId as string);
  if (isNaN(userId)) return res.status(400).json({ error: 'userId required' });

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);

  const challenges = await prisma.challenge.findMany({
    where: { user_id: userId, status: 'ACTIVE' },
    include: {
      check_ins: {
        where: { created_at: { gte: sevenDaysAgo } },
        orderBy: { created_at: 'desc' },
        take: 5,
      },
    },
    orderBy: { created_at: 'asc' },
  });

  res.json({ challenges });
};

// GET /internal/insights-data/check-ins?userId=X&days=14
// Returns check-in notes for a rolling window, grouped with challenge context
export const getInsightCheckIns = async (req: Request, res: Response) => {
  const userId = parseInt(req.query.userId as string);
  const days   = parseInt(req.query.days  as string) || 14;
  if (isNaN(userId)) return res.status(400).json({ error: 'userId required' });

  const since = new Date(Date.now() - days * 86_400_000);

  const checkIns = await prisma.challengeCheckIn.findMany({
    where: {
      challenge: { user_id: userId },
      created_at: { gte: since },
    },
    include: {
      challenge: { select: { id: true, title: true, category: true, progress: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  res.json({ check_ins: checkIns });
};

// GET /internal/insights-data/habits?userId=X
// Returns active habits from solution outlines with recent log data
export const getInsightHabits = async (req: Request, res: Response) => {
  const userId = parseInt(req.query.userId as string);
  if (isNaN(userId)) return res.status(400).json({ error: 'userId required' });

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);

  const habits = await prisma.habit.findMany({
    where: {
      phase: {
        outline: {
          status: 'ACTIVE',
          challenge: { user_id: userId },
        },
      },
    },
    include: {
      logs: {
        where: { created_at: { gte: sevenDaysAgo } },
        orderBy: { logged_for: 'desc' },
      },
      phase: {
        select: {
          title: true,
          outline: {
            select: {
              title: true,
              challenge: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  });

  res.json({ habits });
};

// GET /internal/insights-data/past-insights?userId=X
// Returns the most recent stored insight for longitudinal context
export const getInsightPastInsights = async (req: Request, res: Response) => {
  const userId = parseInt(req.query.userId as string);
  if (isNaN(userId)) return res.status(400).json({ error: 'userId required' });

  const insight = await prisma.insight.findFirst({
    where: { user_id: userId },
    orderBy: { generated_at: 'desc' },
  });

  res.json({ past_insight: insight ?? null });
};
