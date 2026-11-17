// success response
export const sendResponse = (res, data) => {
    const statusCode = data.statusCode || 200;
    return res.status(statusCode).json({
        success: data.success !== undefined ? data.success : true,
        statusCode,
        message: data.message || 'success',
        data: data.data !== undefined ? data.data : null,
        ...(data.meta && { meta: data.meta }),
    });
};
