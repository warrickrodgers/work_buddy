import { json, Request, Response } from 'express';
import { HttpError } from "../lib/errors";
import { PrismaClient } from '@prisma/client';
import { Status } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * GET Problem Request Endpoint controller that fetches related problemRequest record.
 * TODO - Test this
 * @param req - Request body
 * @param res - Response body
 */
export const getProblemRequestById = async (req: Request, res: Response) => {
    try {
        if(!req.params.id) {
            throw new HttpError(400, 'id required')
        }
        const upload = await prisma.problemRequest.findUnique({
            where: {id: Number(req.params.id) }
        })
        res.status(200).json(upload);
    } catch (err) {
        const status = err instanceof HttpError ? err.status : 500;
        res.status(status).json({ error: err.message ?? "Something went wrong" });
    }
}

/**
 * GET Problem Request Endpoint controller that fetches all problemRequests per user.
 * TODO - Test this
 * @param req - Request body
 * @param res - Response body
 */
export const getProblemRequestsByUserId = async (req: Request, res: Response) => {
    try {
        if(!req.params.user_id) {
            throw new HttpError(400, 'user_id required')
        }
        const upload = await prisma.problemRequest.findMany({
            where: {user_id: Number(req.params.user_id) }
        })
        res.status(200).json(upload);
    } catch (err) {
        const status = err instanceof HttpError ? err.status : 500;
        res.status(status).json({ error: err.message ?? "Something went wrong" });
    }
}

/**
 * POST Problem Request Endpoint controller that creates a new problemRequest data record
 * including problem description etc.
 * TODO - Test this
 * @param req - Request body
 * @param res - Response body
 */
export const createProblemRequest = async (req: Request, res: Response) => {
    try {
        if(!(
            req.body.user_id ||
            req.body.role_description ||
            req.body.problem_description
        )) {
            throw new HttpError(400, 'Malformed request body') //Yes ChatGPT I know... I'll differentiate later when I beef everything up
        }
        const newCreateProblem = await prisma.problemRequest.create({
            data: {
                user_id: req.body.user_id,
                role_description: req.body.role_description,
                problem_description: req.body.problem_description,
                problem_parameters: parametrizeProblemInsights(req.body.problem_description),
                problem_insights: "", 
                solution_summary: "",
                status: Status.PENDING,
    
            }
        });
        res.status(201).json(newCreateProblem);
    } catch (err) {

    }
}


const parametrizeProblemInsights = (insights: String) => {
    return ""; //TODO - Implement parametrization logic
}