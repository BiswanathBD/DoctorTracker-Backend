import { Types } from 'mongoose';
import { Patient, type IPatient } from '../../models/patient.model.js';
import { Doctor } from '../../models/doctor.model.js';
import { ApiError } from '../../utils/ApiError.js';

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
  const populated = await patient.populate('doctorId', 'name specialization hospital email phone');
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

  // condition filter
  if (query.condition) {
    filter.condition = new RegExp(`^${query.condition.trim()}$`, 'i');
  }

  // gender filter
  if (query.gender) {
    filter.gender = query.gender;
  }

  // doctor id filter
  if (query.doctorId) {
    if (!Types.ObjectId.isValid(query.doctorId)) {
      throw new ApiError(400, 'invalid doctor id filter');
    }
    filter.doctorId = new Types.ObjectId(query.doctorId);
  }

  // date range filter on admissionDate or createdAt
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

  // sort options
  const sortBy = query.sortBy || 'admissionDate';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder };

  // query total and paginated docs concurrently
  const [total, data] = await Promise.all([
    Patient.countDocuments(filter),
    Patient.find(filter)
      .populate('doctorId', 'name specialization hospital email phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data,
  };
};

// get single patient by id
const getPatientById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'invalid patient id');
  }

  const patient = await Patient.findById(id)
    .populate('doctorId', 'name specialization hospital email phone')
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
  }).populate('doctorId', 'name specialization hospital email phone');

  if (!updatedPatient) {
    throw new ApiError(404, 'patient not found');
  }

  return updatedPatient;
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
  deletePatient,
  getConditions,
};
