import { Types } from 'mongoose';
import { Patient, type IPatient } from '../../models/patient.model.js';
import { Doctor } from '../../models/doctor.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/fileUploader.js';

interface PatientQueryParams {
  page?: number | string;
  limit?: number | string;
  searchTerm?: string;
  condition?: string;
  gender?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// create a new patient
const createPatient = async (payload: Partial<IPatient>): Promise<IPatient> => {
  if (!payload.doctorId || !Types.ObjectId.isValid(payload.doctorId.toString())) {
    throw new ApiError(400, 'valid doctor id is required');
  }

  // verify assigned doctor exists
  const doctorExists = await Doctor.exists({ _id: payload.doctorId });
  if (!doctorExists) {
    throw new ApiError(404, 'assigned doctor not found');
  }

  const patient = await Patient.create(payload);
  const populated = await patient.populate('doctorId', 'name specialization hospital email phone avatar');
  return populated;
};

// get all patients with search, filters, and pagination
const getAllPatients = async (query: PatientQueryParams) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  // build match filter
  const filter: Record<string, any> = {};

  // search across name, condition, phone, email
  if (query.searchTerm) {
    const searchRegex = new RegExp(query.searchTerm.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { condition: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
    ];
  }

  // filter by condition
  if (query.condition) {
    filter.condition = { $regex: new RegExp(`^${query.condition.trim()}$`, 'i') };
  }

  // filter by gender
  if (query.gender) {
    filter.gender = query.gender;
  }

  // filter by assigned doctor
  if (query.doctorId) {
    if (!Types.ObjectId.isValid(query.doctorId)) {
      throw new ApiError(400, 'invalid doctor id filter');
    }
    filter.doctorId = new Types.ObjectId(query.doctorId);
  }

  // filter by admission date range
  if (query.startDate || query.endDate) {
    filter.admissionDate = {};
    if (query.startDate) {
      filter.admissionDate.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.admissionDate.$lte = end;
    }
  }

  // dynamic sorting
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .populate('doctorId', 'name specialization hospital email phone avatar')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    Patient.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: patients,
  };
};

// get single patient by id
const getPatientById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'invalid patient id');
  }

  const patient = await Patient.findById(id)
    .populate('doctorId', 'name specialization hospital email phone avatar')
    .lean();

  if (!patient) {
    throw new ApiError(404, 'patient not found');
  }

  return patient;
};

// update patient by id
const updatePatient = async (id: string, payload: Partial<IPatient>) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'invalid patient id');
  }

  // if doctorId is being updated, verify target doctor exists
  if (payload.doctorId) {
    if (!Types.ObjectId.isValid(payload.doctorId.toString())) {
      throw new ApiError(400, 'invalid doctor id');
    }
    const doctorExists = await Doctor.exists({ _id: payload.doctorId });
    if (!doctorExists) {
      throw new ApiError(404, 'assigned doctor not found');
    }
  }

  const updatedPatient = await Patient.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).populate('doctorId', 'name specialization hospital email phone avatar');

  if (!updatedPatient) {
    throw new ApiError(404, 'patient not found');
  }

  return updatedPatient;
};

// update patient avatar
const updatePatientAvatar = async (patientId: string, fileBuffer: Buffer) => {
  if (!Types.ObjectId.isValid(patientId)) {
    throw new ApiError(400, 'invalid patient id');
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new ApiError(404, 'patient not found');
  }

  if (patient.avatar?.key) {
    await deleteFromCloudinary(patient.avatar.key);
  }

  const { url, key } = await uploadToCloudinary(fileBuffer, 'doctor-tracker/patients');
  patient.avatar = { url, key };
  await patient.save();

  return patient;
};

// delete patient avatar
const deletePatientAvatar = async (patientId: string) => {
  if (!Types.ObjectId.isValid(patientId)) {
    throw new ApiError(400, 'invalid patient id');
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new ApiError(404, 'patient not found');
  }

  if (patient.avatar?.key) {
    await deleteFromCloudinary(patient.avatar.key);
  }

  patient.avatar = { url: '', key: '' };
  await patient.save();

  return patient;
};

// delete patient by id
const deletePatient = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'invalid patient id');
  }

  const deletedPatient = await Patient.findByIdAndDelete(id);
  if (!deletedPatient) {
    throw new ApiError(404, 'patient not found');
  }

  if (deletedPatient.avatar?.key) {
    await deleteFromCloudinary(deletedPatient.avatar.key);
  }

  return deletedPatient;
};

// get list of distinct patient conditions
const getConditions = async (): Promise<string[]> => {
  const list = await Patient.distinct('condition');
  return list.sort();
};

export const PatientService = {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  updatePatientAvatar,
  deletePatientAvatar,
  deletePatient,
  getConditions,
};
