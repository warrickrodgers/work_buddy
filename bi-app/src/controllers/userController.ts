import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { organisation: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      job_title: user.job_title,
      company: user.company,
      role: user.role,
      onboarding_complete: user.onboarding_complete,
      organisation_id: user.organisation_id,
      organisation: {
        id: user.organisation.id,
        name: user.organisation.name,
        is_personal: user.organisation.is_personal,
        invite_token: user.role === 'admin' ? user.organisation.invite_token : undefined,
        email_domain: user.organisation.email_domain,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, job_title, company } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(first_name !== undefined && { first_name: first_name.trim() }),
        ...(last_name !== undefined && { last_name: last_name.trim() }),
        ...(job_title !== undefined && { job_title: job_title.trim() }),
        ...(company !== undefined && { company: company.trim() }),
      },
      include: { organisation: true },
    });

    res.status(200).json({
      id: updated.id,
      email: updated.email,
      first_name: updated.first_name,
      last_name: updated.last_name,
      job_title: updated.job_title,
      company: updated.company,
      role: updated.role,
      onboarding_complete: updated.onboarding_complete,
      organisation_id: updated.organisation_id,
      organisation: {
        id: updated.organisation.id,
        name: updated.organisation.name,
        is_personal: updated.organisation.is_personal,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
