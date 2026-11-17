import { DashboardService } from './dashboard.service.js';
import { sendResponse } from '../../utils/sendResponse.js';
// get consolidated dashboard statistics
const getDashboardStats = async (req, res, next) => {
    try {
        const result = await DashboardService.getDashboardStats();
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'dashboard statistics fetched successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
export const DashboardController = {
    getDashboardStats,
};
