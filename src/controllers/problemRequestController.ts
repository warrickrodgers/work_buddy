import { json, Request, Response } from 'express';

/**
 * GET Problem Request Endpoint controller that fetches related problemRequest record.
 * @param req - Request body
 * @param res - Response body
 */
export const getProblemRequestsById = (req: Request, res: Response) => {
    const upload = json({});
    res.status(200).json(upload);
}

/**
 * POST Problem Request Endpoint controller that creates a new problemRequest data record
 * including problem description etc.
 * @param req - Request body
 * @param res - Response body
 */
export const createProblemRequest = (req: Request, res: Response) => {
    const newCreateProblem = json({});
    //TODO - Create createProblem functionality
    res.status(201).json(newCreateProblem);
}