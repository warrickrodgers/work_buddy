import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  source_type: 'challenge' | 'system';
  source_id?: number;
}

const MAX_ITEMS = 8;
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export const getActionItems = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [challenges, recentCheckIns, docCount] = await Promise.all([
      prisma.challenge.findMany({
        where: { user_id: userId, status: 'ACTIVE' },
        orderBy: { created_at: 'asc' },
      }),
      prisma.challengeCheckIn.findMany({
        where: {
          challenge: { user_id: userId },
          created_at: { gte: sevenDaysAgo },
        },
        select: { challenge_id: true },
      }),
      prisma.ingestionDocument.count({
        where: {
          uploaded_by_id: userId,
          status: 'COMPLETE',
        },
      }),
    ]);

    const recentCheckInIds = new Set(recentCheckIns.map(c => c.challenge_id));
    const items: ActionItem[] = [];

    for (const c of challenges) {
      const endDate = c.end_date;

      // overdue
      if (endDate && endDate < now) {
        items.push({
          id: `overdue-${c.id}`,
          title: `"${c.title}" is past its end date`,
          description: 'This challenge has passed its deadline. Review progress or extend the end date.',
          priority: 'high',
          source_type: 'challenge',
          source_id: c.id,
        });
        continue; // overdue trumps due-soon for same challenge
      }

      // due-soon
      if (endDate) {
        const daysLeft = daysBetween(now, endDate);
        if (daysLeft >= 0 && daysLeft <= 7) {
          items.push({
            id: `due-soon-${c.id}`,
            title: `"${c.title}" is due ${daysLeft === 0 ? 'today' : `in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}`,
            description: 'Make sure you\'re on track before the deadline.',
            priority: 'high',
            source_type: 'challenge',
            source_id: c.id,
          });
        }
      }

      // stale check-in
      if (!recentCheckInIds.has(c.id)) {
        items.push({
          id: `stale-checkin-${c.id}`,
          title: `Log your progress on "${c.title}"`,
          description: 'No check-in in the past 7 days. A quick update helps Simon give better guidance.',
          priority: 'medium',
          source_type: 'challenge',
          source_id: c.id,
        });
      }

      // no end date
      if (!endDate) {
        items.push({
          id: `no-end-date-${c.id}`,
          title: `Set a deadline for "${c.title}"`,
          description: 'Challenges with deadlines are more likely to be completed.',
          priority: 'medium',
          source_type: 'challenge',
          source_id: c.id,
        });
      }

      // behind schedule — progress < 25% and more than half duration elapsed
      if (endDate && c.progress < 25) {
        const totalDays = daysBetween(new Date(c.start_date), endDate);
        const elapsedDays = daysBetween(new Date(c.start_date), now);
        if (totalDays > 0 && elapsedDays / totalDays > 0.5) {
          items.push({
            id: `behind-${c.id}`,
            title: `"${c.title}" may be falling behind`,
            description: 'More than half the time has passed but progress is under 25%.',
            priority: 'medium',
            source_type: 'challenge',
            source_id: c.id,
          });
        }
      }
    }

    // no documents
    if (docCount === 0) {
      items.push({
        id: 'no-documents',
        title: 'Upload org documents to give Simon more context',
        description: 'Surveys, policies, and reports help Simon ground coaching in your actual situation.',
        priority: 'low',
        source_type: 'system',
      });
    }

    // Sort by priority, cap at MAX_ITEMS
    items.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    const trimmed = items.slice(0, MAX_ITEMS);

    res.status(200).json({ action_items: trimmed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute action items' });
  }
};
