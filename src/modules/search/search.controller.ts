import { type Request, type Response, type NextFunction } from 'express';
import { SearchService } from './search.service.js';
import { sendResponse } from '../../utils/sendResponse.js';

const globalSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const searchTerm = (req.query.q as string) || (req.query.searchTerm as string) || '';
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    const type = req.query.type as 'all' | 'doctors' | 'patients' | undefined;

    const result = await SearchService.globalSearch({
      searchTerm,
      limit,
      type,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'search results retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const SearchController = {
  globalSearch,
};

