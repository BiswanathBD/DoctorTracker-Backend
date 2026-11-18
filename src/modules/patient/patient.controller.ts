import { type Request, type Response, type NextFunction } from 'express';
import { PatientService } from './patient.service.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ApiError } from '../../utils/ApiError.js';

// create new patient
const createPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PatientService.createPatient(req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'patient created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// get all patients with search, filters, and pagination
const getAllPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { meta, data } = await PatientService.getAllPatients(req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'patients fetched successfully',
      meta,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// get single patient by id
const getPatientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await PatientService.getPatientById(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'patient fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// update patient by id
const updatePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await PatientService.updatePatient(id, req.body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'patient updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// update patient avatar
const updateAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (!req.file || !req.file.buffer) {
      throw new ApiError(400, 'please upload an image file');
    }

    const result = await PatientService.updatePatientAvatar(id, req.file.buffer);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'patient avatar updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// delete patient avatar
const deleteAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await PatientService.deletePatientAvatar(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'patient avatar deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// delete patient by id
const deletePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await PatientService.deletePatient(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'patient deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// get distinct conditions
const getConditions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PatientService.getConditions();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'conditions fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// release patient
const releasePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { releaseDate, note } = req.body;
    const result = await PatientService.releasePatient(id, releaseDate, note);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'patient released successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// readmit patient
const readmitPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { doctorId } = req.body;
    const result = await PatientService.readmitPatient(id, doctorId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'patient readmitted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const PatientController = {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  updateAvatar,
  deleteAvatar,
  deletePatient,
  releasePatient,
  readmitPatient,
  getConditions,
};
