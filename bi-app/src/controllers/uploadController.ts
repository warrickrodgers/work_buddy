import { json, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { HttpError } from '../lib/errors';
import { connect } from 'http2';

const prisma = new PrismaClient();

/**
 * GET Upload endpoint controller that fetches related problemRequest upload data
 * such as CSV file, interpretations etc.
 * @param req - Request body
 * @param res - Response body
 */
export const getUploadById = (req: Request, res: Response) => {
    const upload = json({});
    res.status(200).json(upload);
}

/**
 * GET Upload endpoint controller that fetches upload by problemRequestID
 * such as CSV file, interpretations etc.
 * @param req - Request body
 * @param res - Response body
 */
export const getUploadByProblemRequestId = (req: Request, res: Response) => {
    const upload = json({});
    res.status(200).json(upload);
} 

/**
 * POST Upload Endpoint controller that created a new problemRequest upload data record
 * including file storage location etc.
 * @param req - Request body
 * @param res - Response body
 */
export const createUpload = async (req: Request, res: Response) => {
    try {
        const { problem_request_id } = req.body;
        const userId = (req as any).user?.userId;
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No files uploaded' });
            return;
        }

        const uploadRecords = await Promise.all(
            files.map(file =>
                prisma.dataUpload.create({
                data: {
                    problem_request:{
                        connect: {id: parseInt(problem_request_id)}
                    },
                    filename: file.originalname,
                    file_url: file.path,
                    source_type: file.mimetype
                },
                })
            )
        );
        console.log(uploadRecords)
      
        res.status(201).json({ message: 'Files uploaded successfully', uploads: uploadRecords });
        return;
    } catch (err) {
        res.status(500).json({error: "There was an error uploading the files"});
        return;
    }
}