import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateInviteToken(): string {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

// GET /api/org/me
export const getMyOrg = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organisation: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const memberCount = await prisma.user.count({
      where: { organisation_id: user.organisation_id },
    });

    res.status(200).json({
      organisation: user.organisation,
      role: user.role,
      member_count: memberCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch organisation' });
  }
};

// POST /api/org/create
// Body: { name: string, email_domain?: string }
export const createOrg = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, email_domain } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ error: 'Organisation name is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const invite_token = generateInviteToken();

    const org = await prisma.organisation.create({
      data: {
        name: name.trim(),
        is_personal: false,
        invite_token,
        email_domain: email_domain?.toLowerCase().trim() || null,
      },
    });

    // Delete the shadow personal org if it has no documents
    const oldOrgId = user.organisation_id;
    const oldOrgDocCount = await prisma.ingestionDocument.count({
      where: { organisation_id: oldOrgId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        organisation_id: org.id,
        role: 'admin',
        onboarding_complete: true,
      },
    });

    if (oldOrgDocCount === 0) {
      await prisma.organisation.delete({ where: { id: oldOrgId } });
    }

    res.status(201).json({ organisation: org, invite_token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create organisation' });
  }
};

// POST /api/org/join
// Body: { invite_token: string }
export const joinOrg = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { invite_token } = req.body;

    if (!invite_token?.trim()) {
      res.status(400).json({ error: 'Invite token is required' });
      return;
    }

    const org = await prisma.organisation.findUnique({
      where: { invite_token: invite_token.trim().toUpperCase() },
    });

    if (!org) {
      res.status(404).json({ error: 'Invalid invite token' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const oldOrgId = user.organisation_id;
    const oldOrgDocCount = await prisma.ingestionDocument.count({
      where: { organisation_id: oldOrgId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        organisation_id: org.id,
        role: 'member',
        onboarding_complete: true,
      },
    });

    if (oldOrgDocCount === 0) {
      await prisma.organisation.delete({ where: { id: oldOrgId } });
    }

    res.status(200).json({ organisation: org });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join organisation' });
  }
};

// POST /api/org/skip
// Keeps the shadow personal org and marks onboarding complete.
export const skipOrg = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { onboarding_complete: true },
      include: { organisation: true },
    });

    res.status(200).json({
      organisation: user.organisation,
      role: user.role,
      onboarding_complete: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
};

// PATCH /api/org/me  (admin only)
// Body: { name?: string, email_domain?: string | null }
export const updateOrg = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Only org admins can update organisation settings' });
      return;
    }

    const { name, email_domain } = req.body;

    // Validate email_domain format if provided
    if (email_domain !== undefined && email_domain !== null && email_domain !== '') {
      const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
      if (!domainRegex.test(email_domain.trim())) {
        res.status(400).json({ error: 'Invalid domain format. Use a bare domain like acme.com' });
        return;
      }
    }

    const org = await prisma.organisation.update({
      where: { id: user.organisation_id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(email_domain !== undefined && {
          email_domain: email_domain ? email_domain.toLowerCase().trim() : null,
        }),
      },
    });

    res.status(200).json({ organisation: org });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update organisation' });
  }
};

// GET /api/org/members
export const getOrgMembers = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Individuals only ever see themselves
    if (user.role === 'individual') {
      res.status(200).json([{
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        created_at: user.created_at,
      }]);
      return;
    }

    const members = await prisma.user.findMany({
      where: { organisation_id: user.organisation_id },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    res.status(200).json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

// POST /api/org/regenerate-token  (admin only)
export const regenerateInviteToken = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Only org admins can regenerate the invite token' });
      return;
    }

    const invite_token = generateInviteToken();
    await prisma.organisation.update({
      where: { id: user.organisation_id },
      data: { invite_token },
    });

    res.status(200).json({ invite_token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to regenerate token' });
  }
};
