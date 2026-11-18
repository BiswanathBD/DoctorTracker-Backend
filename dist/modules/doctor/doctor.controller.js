import { DoctorService } from './doctor.service.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ApiError } from '../../utils/ApiError.js';
// create new doctor
const createDoctor = async (req, res, next) => {
    try {
        const result = await DoctorService.createDoctor(req.body);
        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'doctor created successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// get all doctors with filters & pagination
const getAllDoctors = async (req, res, next) => {
    try {
        const { meta, data } = await DoctorService.getAllDoctors(req.query);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'doctors fetched successfully',
            meta,
            data,
        });
    }
    catch (error) {
        next(error);
    }
};
// get single doctor by id
const getDoctorById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await DoctorService.getDoctorById(id);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'doctor fetched successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// update doctor by id
const updateDoctor = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await DoctorService.updateDoctor(id, req.body);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'doctor updated successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// update doctor avatar
const updateAvatar = async (req, res, next) => {
    try {
        const id = req.params.id;
        if (!req.file || !req.file.buffer) {
            throw new ApiError(400, 'please upload an image file');
        }
        const result = await DoctorService.updateDoctorAvatar(id, req.file.buffer);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'doctor avatar updated successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// delete doctor avatar
const deleteAvatar = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await DoctorService.deleteDoctorAvatar(id);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'doctor avatar deleted successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// delete doctor by id
const deleteDoctor = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await DoctorService.deleteDoctor(id);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'doctor deleted successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// add patient to doctor
const addPatientToDoctor = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await DoctorService.addPatientToDoctor(id, req.body);
        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'patient added to doctor successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// remove patient from doctor
const removePatientFromDoctor = async (req, res, next) => {
    try {
        const id = req.params.id;
        const patientId = req.params.patientId;
        const result = await DoctorService.removePatientFromDoctor(id, patientId);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'patient removed from doctor successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// get distinct specializations
const getSpecializations = async (req, res, next) => {
    try {
        const result = await DoctorService.getSpecializations();
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'specializations fetched successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// get distinct hospitals
const getHospitals = async (req, res, next) => {
    try {
        const result = await DoctorService.getHospitals();
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'hospitals fetched successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
export const DoctorController = {
    createDoctor,
    getAllDoctors,
    getDoctorById,
    updateDoctor,
    updateAvatar,
    deleteAvatar,
    deleteDoctor,
    addPatientToDoctor,
    removePatientFromDoctor,
    getSpecializations,
    getHospitals,
};
