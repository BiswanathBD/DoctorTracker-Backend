import { type Response } from 'express';

interface IApiResponse<T> {
  statusCode?: number;
  success?: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPage?: number;
  };
}

// success response
export const sendResponse = <T>(res: Response, data: IApiResponse<T>) => {
  const statusCode = data.statusCode || 200;

  return res.status(statusCode).json({
    success: data.success !== undefined ? data.success : true,
    statusCode,
    message: data.message || 'success',
    data: data.data !== undefined ? data.data : null,
    ...(data.meta && { meta: data.meta }),
  });
};
