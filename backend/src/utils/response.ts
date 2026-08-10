import { Response } from 'express';

interface ApiResponseParams<T> {
    res: Response;
    statusCode: number;
    message: string;
    data?: T;
}

interface ErrorResponseParams {
    res: Response;
    statusCode?: number;
    message: string;
    errors?: any;
}

/**
 * Sends a standardized JSON success response.
 */
export const sendSuccess = <T>({
    res,
    statusCode = 200,
    message,
    data,
}: ApiResponseParams<T>): Response => {
    return res.status(statusCode).json({
        success: true,
        statusCode,
        message,
        ...(data !== undefined && { data }),
    });
};

/**
 * Sends a standardized JSON error response.
 */
export const sendError = ({
    res,
    statusCode = 500,
    message,
    errors,
}: ErrorResponseParams): Response => {
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        ...(errors && { errors }),
    });
};