import { PatientService } from './patient.service.js';
import { sendResponse } from '../../utils/sendResponse.js';
// create new patient
const createPatient = async (req, res, next) => {
    try {
        const result = await PatientService.createPatient(req.body);
        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'patient created successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// get all patients with search, filters, and pagination
const getAllPatients = async (req, res, next) => {
    try {
        const { meta, data } = await PatientService.getAllPatients(req.query);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'patients fetched successfully',
            meta,
            data,
        });
    }
    catch (error) {
        next(error);
    }
};
// get single patient by id
const getPatientById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await PatientService.getPatientById(id);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'patient fetched successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// update patient
const updatePatient = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await PatientService.updatePatient(id, req.body);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'patient updated successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// delete patient
const deletePatient = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await PatientService.deletePatient(id);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'patient deleted successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// get distinct conditions
const getConditions = async (req, res, next) => {
    try {
        const result = await PatientService.getConditions();
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'conditions fetched successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
export const PatientController = {
    createPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    getConditions,
};
