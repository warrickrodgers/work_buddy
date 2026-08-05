import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import crypto from 'crypto';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function userPublicFields(user: {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  job_title: string;
  company: string;
  role: string;
  onboarding_complete: boolean;
  organisation_id: number;
}) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    job_title: user.job_title,
    company: user.company,
    role: user.role,
    onboarding_complete: user.onboarding_complete,
    organisation_id: user.organisation_id,
  };
}

export const createNewUser = async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);

    // Shadow personal org — keeps organisation_id non-null and avoids
    // cascading nullable changes in downstream models.
    const user = await prisma.user.create({
      data: {
        email,
        first_name,
        last_name,
        password_hash,
        auth_method: 'local',
        job_title: '',
        company: '',
        role: 'individual',
        onboarding_complete: false,
        organisation: {
          create: {
            name: `${first_name} ${last_name}'s Personal Workspace`,
            is_personal: true,
          },
        },
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8h' });

    res.status(201).json({ token, user: userPublicFields(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'There was an issue signing up' });
  }
};

export const createSignInUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const passwordIsValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordIsValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8h' });

    res.status(200).json({ token, user: userPublicFields(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'There was an error signing in' });
  }
};

export const createSignoutUser = async (req: Request, res: Response) => {
  // JWT is stateless — signout is handled client-side by discarding the token.
  res.status(200).json({ message: 'Signed out' });
};

export const getVerifyToken = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Missing token' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ user: userPublicFields(user) });
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Mock SSO: find an org by email domain and auto-authenticate the user.
// If the user doesn't exist in that org yet, creates them without a password.
export const mockSsoSignIn = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email required' });
      return;
    }

    const domain = email.split('@')[1].toLowerCase();
    const org = await prisma.organisation.findFirst({
      where: { email_domain: domain },
    });

    if (!org) {
      res.status(404).json({ error: 'No organisation found for this email domain' });
      return;
    }

    let user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), organisation_id: org.id },
    });

    if (!user) {
      // Auto-provision the user under this org (mock SSO behaviour)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          first_name: email.split('@')[0],
          last_name: '',
          password_hash: await bcrypt.hash(randomPassword, 12),
          auth_method: 'sso',
          job_title: '',
          company: org.name,
          role: 'member',
          onboarding_complete: true,
          organisation_id: org.id,
        },
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8h' });
    res.status(200).json({ token, user: userPublicFields(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'SSO sign-in failed' });
  }
};
