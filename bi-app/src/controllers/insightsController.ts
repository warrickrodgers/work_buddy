import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { agentClient } from '../services/agentClient';

const prisma = new PrismaClient();

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// POST /api/insights/generate
// Returns cached insight if < 7 days old, otherwise triggers agent-server generation
export const generateInsights = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organisation_id: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Return cached if fresh
    const cached = await prisma.insight.findFirst({
      where: {
        user_id: userId,
        generated_at: { gte: new Date(Date.now() - CACHE_TTL_MS) },
      },
      orderBy: { generated_at: 'desc' },
    });

    if (cached) {
      return res.json({ insight: cached, cached: true });
    }

    // Generate via agent-server
    const result = await agentClient.generateInsights(userId, user.organisation_id);

    const now         = new Date();
    const periodStart = new Date(now.getTime() - CACHE_TTL_MS);

    const insight = await prisma.insight.create({
      data: {
        user_id:      userId,
        summary:      result.insights as any,
        period_start: periodStart,
        period_end:   now,
      },
    });

    res.json({ insight, cached: false });
  } catch (err: any) {
    console.error('Failed to generate insights:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
};

// GET /api/insights/latest
// Returns the most recent insight for the user (null if none)
export const getLatestInsight = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const insight = await prisma.insight.findFirst({
      where:   { user_id: userId },
      orderBy: { generated_at: 'desc' },
    });

    res.json({ insight: insight ?? null });
  } catch (err) {
    console.error('Failed to fetch latest insight:', err);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
};
