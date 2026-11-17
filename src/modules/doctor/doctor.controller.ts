import { type Request, type Response, type NextFunction } from 'express';
import { DoctorService } from './doctor.service.js';
import { sendResponse } from '../../utils/sendResponse.js';

// create new doctor
const createDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DoctorService.createDoctor(req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'doctor created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// get all doctors with filters & pagination
const getAllDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { meta, data } = await DoctorService.getAllDoctors(req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'doctors fetched successfully',
      meta,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// get single doctor by id
const getDoctorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await DoctorService.getDoctorById(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'doctor fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// update doctor
const updateDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await DoctorService.updateDoctor(id, req.body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'doctor updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// delete doctor
const deleteDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await DoctorService.deleteDoctor(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'doctor deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// add patient under a specific doctor
const addPatientToDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await DoctorService.addPatientToDoctor(id, req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'patient added under doctor successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// remove patient from a doctor's list
const removePatientFromDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const patientId = req.params.patientId as string;
    const result = await DoctorService.removePatientFromDoctor(id, patientId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'patient removed from doctor successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// get distinct specializations
const getSpecializations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DoctorService.getSpecializations();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'specializations fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// get distinct hospitals
const getHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DoctorService.getHospitals();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'hospitals fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const DoctorController = {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  addPatientToDoctor,
  removePatientFromDoctor,
  getSpecializations,
  getHospitals,
};
