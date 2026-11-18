import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const phaseInclude = {
  checklist_items: { orderBy: { order_index: 'asc' as const } },
  habits:          { orderBy: { order_index: 'asc' as const }, include: { logs: true } },
  check_in_prompts:{ orderBy: { order_index: 'asc' as const } },
};

export async function recomputeProgressForChallenge(challengeId: number): Promise<void> {
  try {
    const latestOutline = await prisma.solutionOutline.findFirst({
      where: { challenge_id: challengeId },
      orderBy: { created_at: 'desc' },
      include: {
        phases: {
          include: {
            checklist_items: true,
            habits: { include: { logs: true } },
            check_in_prompts: true,
          },
        },
      },
    });

    if (!latestOutline || latestOutline.phases.length === 0) return;

    let phaseScoreSum = 0;

    for (const p of latestOutline.phases) {
      const checklistTotal = p.checklist_items.length;
      const checklistDone  = p.checklist_items.filter(i => i.is_complete).length;

      const habitTotal      = p.habits.length;
      const habitsWithLogs  = p.habits.filter(h => h.logs.length > 0).length;

      const checkInTotal = p.check_in_prompts.length;
      const checkInsDone = p.check_in_prompts.filter(c => (c as any).response).length;

      let weightSum = 0;
      let scoreSum  = 0;
      if (checklistTotal > 0) { scoreSum += (checklistDone / checklistTotal) * 0.4; weightSum += 0.4; }
      if (habitTotal > 0)     { scoreSum += (habitsWithLogs / habitTotal) * 0.4;    weightSum += 0.4; }
      if (checkInTotal > 0)   { scoreSum += (checkInsDone / checkInTotal) * 0.2;    weightSum += 0.2; }

      phaseScoreSum += weightSum > 0 ? scoreSum / weightSum : 0;
    }

    const progress = Math.min(100, Math.max(0,
      Math.round((phaseScoreSum / latestOutline.phases.length) * 100),
    ));

    await prisma.challenge.update({
      where: { id: challengeId },
      data:  { progress },
    });
  } catch (err) {
    console.error('recomputeProgressForChallenge failed:', err);
  }
}

async function recomputeChallengeProgress(phaseId: number): Promise<void> {
  try {
    const phase = await prisma.outlinePhase.findUnique({
      where: { id: phaseId },
      select: { outline: { select: { challenge_id: true } } },
    });
    const challengeId = (phase as any)?.outline?.challenge_id;
    if (challengeId) await recomputeProgressForChallenge(challengeId);
  } catch (err) {
    console.error('recomputeChallengeProgress failed:', err);
  }
}

// Verify that an outline belongs to the requesting user via its challenge
async function ownsOutline(outlineId: number, userId: number): Promise<boolean> {
  const outline = await prisma.solutionOutline.findUnique({
    where: { id: outlineId },
    select: { user_id: true },
  });
  return outline?.user_id === userId;
}

// GET /api/challenges/:challengeId/outlines
export const listOutlines = async (req: Request, res: Response) => {
  try {
    const challengeId = parseInt(req.params.challengeId);
    const userId = (req as any).user?.userId;

    const outlines = await prisma.solutionOutline.findMany({
      where:   { challenge_id: challengeId, user_id: userId },
      include: { phases: { orderBy: { order_index: 'asc' }, include: phaseInclude } },
      orderBy: { created_at: 'desc' },
    });

    res.json({ outlines });
  } catch (error) {
    console.error('Error listing outlines:', error);
    res.status(500).json({ error: 'Failed to fetch outlines' });
  }
};

// GET /api/outlines/:id
export const getOutline = async (req: Request, res: Response) => {
  try {
    const id     = parseInt(req.params.id);
    const userId = (req as any).user?.userId;

    const outline = await prisma.solutionOutline.findUnique({
      where:   { id },
      include: { phases: { orderBy: { order_index: 'asc' }, include: phaseInclude } },
    });

    if (!outline)                    return res.status(404).json({ error: 'Outline not found' });
    if (outline.user_id !== userId)  return res.status(403).json({ error: 'Forbidden' });

    res.json({ outline });
  } catch (error) {
    console.error('Error fetching outline:', error);
    res.status(500).json({ error: 'Failed to fetch outline' });
  }
};

// PATCH /api/checklist-items/:id
export const toggleChecklistItem = async (req: Request, res: Response) => {
  try {
    const id          = parseInt(req.params.id);
    const userId      = (req as any).user?.userId;
    const { is_complete } = req.body;

    if (typeof is_complete !== 'boolean') {
      return res.status(400).json({ error: 'is_complete (boolean) is required' });
    }

    // Verify ownership
    const existing = await prisma.checklistItem.findUnique({
      where:   { id },
      include: { phase: { include: { outline: { select: { user_id: true } } } } },
    });
    if (!existing)                                      return res.status(404).json({ error: 'Item not found' });
    if (existing.phase.outline.user_id !== userId)      return res.status(403).json({ error: 'Forbidden' });

    const item = await prisma.checklistItem.update({
      where: { id },
      data:  { is_complete, completed_at: is_complete ? new Date() : null },
    });

    res.json({ item });
    recomputeChallengeProgress(existing.phase.id);
  } catch (error) {
    console.error('Error toggling checklist item:', error);
    res.status(500).json({ error: 'Failed to update checklist item' });
  }
};

// POST /api/habits/:id/log
export const logHabit = async (req: Request, res: Response) => {
  try {
    const habitId     = parseInt(req.params.id);
    const userId      = (req as any).user?.userId;
    const { logged_for, notes } = req.body;

    if (!logged_for) return res.status(400).json({ error: 'logged_for (ISO date) is required' });

    // Verify ownership
    const habit = await prisma.habit.findUnique({
      where:   { id: habitId },
      include: { phase: { include: { outline: { select: { user_id: true } } } } },
    });
    if (!habit)                                  return res.status(404).json({ error: 'Habit not found' });
    if (habit.phase.outline.user_id !== userId)  return res.status(403).json({ error: 'Forbidden' });

    const loggedForDate = new Date(logged_for);

    // Idempotent: upsert on (habit_id, logged_for)
    const log = await prisma.habitLog.upsert({
      where:  { habit_id_logged_for: { habit_id: habitId, logged_for: loggedForDate } },
      update: { notes: notes ?? null },
      create: { habit_id: habitId, logged_for: loggedForDate, notes: notes ?? null },
    });

    res.status(log ? 200 : 201).json({ log });
    recomputeChallengeProgress(habit.phase.id);
  } catch (error) {
    console.error('Error logging habit:', error);
    res.status(500).json({ error: 'Failed to log habit' });
  }
};

// PATCH /api/check-in-prompts/:id/respond
export const respondToCheckIn = async (req: Request, res: Response) => {
  try {
    const id     = parseInt(req.params.id);
    const userId = (req as any).user?.userId;
    const { response: responseText } = req.body;

    if (!responseText?.trim()) {
      return res.status(400).json({ error: 'response text is required' });
    }

    // Verify ownership
    const existing = await prisma.checkInPrompt.findUnique({
      where:   { id },
      include: { phase: { include: { outline: { select: { user_id: true } } } } },
    });
    if (!existing)                                    return res.status(404).json({ error: 'Check-in not found' });
    if (existing.phase.outline.user_id !== userId)    return res.status(403).json({ error: 'Forbidden' });

    const prompt = await prisma.checkInPrompt.update({
      where: { id },
      data:  { response: responseText, responded_at: new Date() },
    });

    res.json({ prompt });
    recomputeChallengeProgress(existing.phase.id);
  } catch (error) {
    console.error('Error saving check-in response:', error);
    res.status(500).json({ error: 'Failed to save response' });
  }
};
