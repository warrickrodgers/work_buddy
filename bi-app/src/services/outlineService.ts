import { PrismaClient, SolutionOutline } from '@prisma/client';

const prisma = new PrismaClient();

export interface OutlinePayload {
  title: string;
  why: string;
  phases: Array<{
    order_index: number;
    title: string;
    timeframe?: string;
    purpose: string;
    checklist_items: Array<{ order_index: number; description: string; why_it_matters?: string }>;
    habits: Array<{ order_index: number; description: string; cadence: 'DAILY' | 'WEEKLY'; why_it_matters?: string }>;
    check_in_prompts: Array<{ order_index: number; question: string; scheduled_for?: string | null }>;
  }>;
}

export async function persistOutline(
  challengeId: number,
  userId: number,
  payload: OutlinePayload
): Promise<SolutionOutline> {
  return prisma.$transaction(async (tx) => {
    const outline = await tx.solutionOutline.create({
      data: {
        challenge_id: challengeId,
        user_id:      userId,
        title:        payload.title,
        why:          payload.why,
      },
    });

    for (const phase of payload.phases) {
      const dbPhase = await tx.outlinePhase.create({
        data: {
          outline_id:  outline.id,
          order_index: phase.order_index,
          title:       phase.title,
          timeframe:   phase.timeframe ?? null,
          purpose:     phase.purpose,
        },
      });

      if (phase.checklist_items?.length) {
        await tx.checklistItem.createMany({
          data: phase.checklist_items.map((item) => ({
            phase_id:       dbPhase.id,
            order_index:    item.order_index,
            description:    item.description,
            why_it_matters: item.why_it_matters ?? null,
          })),
        });
      }

      if (phase.habits?.length) {
        await tx.habit.createMany({
          data: phase.habits.map((h) => ({
            phase_id:       dbPhase.id,
            order_index:    h.order_index,
            description:    h.description,
            cadence:        h.cadence,
            why_it_matters: h.why_it_matters ?? null,
          })),
        });
      }

      if (phase.check_in_prompts?.length) {
        await tx.checkInPrompt.createMany({
          data: phase.check_in_prompts.map((p) => ({
            phase_id:      dbPhase.id,
            order_index:   p.order_index,
            question:      p.question,
            scheduled_for: p.scheduled_for ? new Date(p.scheduled_for) : null,
          })),
        });
      }
    }

    return outline;
  });
}
