import { Types } from 'mongoose';
import { Doctor } from '../../models/doctor.model.js';
import { Patient } from '../../models/patient.model.js';
import { ApiError } from '../../utils/ApiError.js';
// create a new doctor
const createDoctor = async (payload) => {
    // check if email already exists
    if (payload.email) {
        const existingDoctor = await Doctor.findOne({ email: payload.email.toLowerCase().trim() });
        if (existingDoctor) {
            throw new ApiError(400, 'doctor with this email already exists');
        }
    }
    const doctor = await Doctor.create(payload);
    return doctor;
};
// get all doctors with search, filters, pagination and patient count
const getAllDoctors = async (query) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;
    // build match filter
    const filter = {};
    // search across name, specialization, hospital, email
    if (query.searchTerm) {
        const searchRegex = new RegExp(query.searchTerm.trim(), 'i');
        filter.$or = [
            { name: searchRegex },
            { specialization: searchRegex },
            { hospital: searchRegex },
            { email: searchRegex },
        ];
    }
    // exact or regex filter for specialization
    if (query.specialization) {
        filter.specialization = new RegExp(`^${query.specialization.trim()}$`, 'i');
    }
    // filter for hospital
    if (query.hospital) {
        filter.hospital = new RegExp(`^${query.hospital.trim()}$`, 'i');
    }
    // date range filter on createdAt
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
    // sort options
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };
    // aggregation pipeline for optimized lookup with patient counts
    const pipeline = [
        { $match: filter },
        { $sort: sortOptions },
        {
            $facet: {
                data: [
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
                ],
                totalCount: [{ $count: 'count' }],
            },
        },
    ];
    const result = await Doctor.aggregate(pipeline);
    const data = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.count || 0;
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
// get single doctor by id with full patient list
const getDoctorById = async (id) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'invalid doctor id');
    }
    const doctor = await Doctor.findById(id).lean();
    if (!doctor) {
        throw new ApiError(404, 'doctor not found');
    }
    // fetch assigned patients
    const patients = await Patient.find({ doctorId: id }).sort({ createdAt: -1 }).lean();
    return {
        ...doctor,
        patientCount: patients.length,
        patients,
    };
};
// update doctor by id
const updateDoctor = async (id, payload) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'invalid doctor id');
    }
    // check email conflict if updating email
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
// delete doctor and remove assigned patients
const deleteDoctor = async (id) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'invalid doctor id');
    }
    const deletedDoctor = await Doctor.findByIdAndDelete(id);
    if (!deletedDoctor) {
        throw new ApiError(404, 'doctor not found');
    }
    // cascade delete assigned patients
    await Patient.deleteMany({ doctorId: id });
    return deletedDoctor;
};
// add a patient directly under a specific doctor
const addPatientToDoctor = async (doctorId, payload) => {
    if (!Types.ObjectId.isValid(doctorId)) {
        throw new ApiError(400, 'invalid doctor id');
    }
    const doctorExists = await Doctor.exists({ _id: doctorId });
    if (!doctorExists) {
        throw new ApiError(404, 'doctor not found');
    }
    // create patient with doctor association
    const patient = await Patient.create({
        ...payload,
        doctorId,
    });
    return patient;
};
// remove patient from doctor's list
const removePatientFromDoctor = async (doctorId, patientId) => {
    if (!Types.ObjectId.isValid(doctorId) || !Types.ObjectId.isValid(patientId)) {
        throw new ApiError(400, 'invalid doctor id or patient id');
    }
    const patient = await Patient.findOneAndDelete({
        _id: patientId,
        doctorId,
    });
    if (!patient) {
        throw new ApiError(404, 'patient not found under this doctor');
    }
    return patient;
};
// get list of distinct specializations
const getSpecializations = async () => {
    const list = await Doctor.distinct('specialization');
    return list.sort();
};
// get list of distinct hospitals
const getHospitals = async () => {
    const list = await Doctor.distinct('hospital');
    return list.sort();
};
export const DoctorService = {
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
