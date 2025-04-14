import { json, Request, Response } from 'express';

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
 * POST Upload Endpoint controller that created a new problemRequest upload data record
 * including file storage location etc.
 * @param req - Request body
 * @param res - Response body
 */
export const createUpload = (req: Request, res: Response) => {
    const newUpload = json({});
    //TODO - Create Upload functionality
    res.status(201).json(newUpload);
}