import { Types } from 'mongoose';
import { Doctor, type IDoctor } from '../../models/doctor.model.js';
import { Patient, type IPatient } from '../../models/patient.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/fileUploader.js';

interface QueryParams {
  page?: number | string;
  limit?: number | string;
  searchTerm?: string;
  specialization?: string;
  hospital?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// create doctor
const createDoctor = async (payload: Partial<IDoctor>): Promise<IDoctor> => {
  if (payload.email) {
    const existingDoctor = await Doctor.findOne({ email: payload.email.toLowerCase().trim() });
    if (existingDoctor) {
      throw new ApiError(400, 'doctor with this email already exists');
    }
  }

  const doctor = await Doctor.create(payload);
  return doctor;
};

// get all doctors with filters, search and pagination
const getAllDoctors = async (query: QueryParams) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  if (query.searchTerm) {
    const searchRegex = new RegExp(query.searchTerm.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { specialization: searchRegex },
      { hospital: searchRegex },
      { email: searchRegex },
    ];
  }

  if (query.specialization) {
    filter.specialization = { $regex: new RegExp(`^${query.specialization.trim()}$`, 'i') };
  }

  if (query.hospital) {
    filter.hospital = { $regex: new RegExp(`^${query.hospital.trim()}$`, 'i') };
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder };

  // fetch doctors aggregation and total count in parallel
  const [doctors, total] = await Promise.all([
    Doctor.aggregate([
      { $match: filter },
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'doctorId',
          as: 'patients',
        },
      },
      {
        $addFields: {
          patientCount: { $size: '$patients' },
        },
      },
      {
        $project: {
          patients: 0,
        },
      },
    ]),
    Doctor.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: doctors,
  };
};

// get single doctor by id with patients
const getDoctorById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'invalid doctor id');
  }

  // fetch doctor and assigned patients concurrently
  const [doctor, patients] = await Promise.all([
    Doctor.findById(id).lean(),
    Patient.find({ doctorId: id }).sort({ createdAt: -1 }).lean(),
  ]);

  if (!doctor) {
    throw new ApiError(404, 'doctor not found');
  }

  return {
    ...doctor,
    patientCount: patients.length,
    patients,
  };
};

// update doctor by id
const updateDoctor = async (id: string, payload: Partial<IDoctor>): Promise<IDoctor> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'invalid doctor id');
  }

  if (payload.email) {
    const existing = await Doctor.findOne({
      email: payload.email.toLowerCase().trim(),
      _id: { $ne: id },
    });
    if (existing) {
      throw new ApiError(400, 'email already in use by another doctor');
    }
  }

  const updatedDoctor = await Doctor.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedDoctor) {
    throw new ApiError(404, 'doctor not found');
  }

  return updatedDoctor;
};

// update doctor avatar
const updateDoctorAvatar = async (doctorId: string, fileBuffer: Buffer) => {
  if (!Types.ObjectId.isValid(doctorId)) {
    throw new ApiError(400, 'invalid doctor id');
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new ApiError(404, 'doctor not found');
  }

  if (doctor.avatar?.key) {
    await deleteFromCloudinary(doctor.avatar.key);
  }

  const { url, key } = await uploadToCloudinary(fileBuffer, 'doctor-tracker/doctors');
  doctor.avatar = { url, key };
  await doctor.save();

  return doctor;
};

// delete doctor avatar
const deleteDoctorAvatar = async (doctorId: string) => {
  if (!Types.ObjectId.isValid(doctorId)) {
    throw new ApiError(400, 'invalid doctor id');
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new ApiError(404, 'doctor not found');
  }

  if (doctor.avatar?.key) {
    await deleteFromCloudinary(doctor.avatar.key);
  }

  doctor.avatar = { url: '', key: '' };
  await doctor.save();

  return doctor;
};

// delete doctor and remove assigned patients
const deleteDoctor = async (id: string): Promise<IDoctor> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'invalid doctor id');
  }

  const deletedDoctor = await Doctor.findByIdAndDelete(id);
  if (!deletedDoctor) {
    throw new ApiError(404, 'doctor not found');
  }

  if (deletedDoctor.avatar?.key) {
    await deleteFromCloudinary(deletedDoctor.avatar.key);
  }

  await Patient.deleteMany({ doctorId: id });

  return deletedDoctor;
};

// add a patient directly under a doctor
const addPatientToDoctor = async (doctorId: string, payload: Partial<IPatient>): Promise<IPatient> => {
  if (!Types.ObjectId.isValid(doctorId)) {
    throw new ApiError(400, 'invalid doctor id');
  }

  const doctorExists = await Doctor.exists({ _id: doctorId });
  if (!doctorExists) {
    throw new ApiError(404, 'doctor not found');
  }

  const patient = await Patient.create({
    ...payload,
    doctorId,
  });

  return patient;
};

// unassign patient from doctor
const removePatientFromDoctor = async (doctorId: string, patientId: string) => {
  if (!Types.ObjectId.isValid(doctorId) || !Types.ObjectId.isValid(patientId)) {
    throw new ApiError(400, 'invalid doctor id or patient id');
  }

  const patient = await Patient.findOneAndUpdate(
    {
      _id: patientId,
      doctorId,
    },
    {
      $set: { doctorId: null },
    },
    { new: true }
  );

  if (!patient) {
    throw new ApiError(404, 'patient not found under this doctor');
  }

  return patient;
};

// get distinct specializations
const getSpecializations = async (): Promise<string[]> => {
  const list = await Doctor.distinct('specialization');
  return list.sort();
};

// get distinct hospitals
const getHospitals = async (): Promise<string[]> => {
  const list = await Doctor.distinct('hospital');
  return list.sort();
};

export const DoctorService = {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorAvatar,
  deleteDoctorAvatar,
  deleteDoctor,
  addPatientToDoctor,
  removePatientFromDoctor,
  getSpecializations,
  getHospitals,
};
