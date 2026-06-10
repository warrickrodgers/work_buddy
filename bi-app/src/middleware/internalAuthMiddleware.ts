import { Request, Response, NextFunction } from 'express';

export const authenticateServiceToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-service-token'];
  const expected = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expected) {
    console.error('INTERNAL_SERVICE_TOKEN not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  if (!token || token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};
