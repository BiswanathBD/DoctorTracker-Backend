import { Doctor } from '../../models/doctor.model.js';
import { Patient } from '../../models/patient.model.js';

export interface GlobalSearchParams {
  searchTerm?: string;
  limit?: number | string;
  type?: 'all' | 'doctors' | 'patients';
}

export interface DoctorSearchResult {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  avatar?: {
    url: string;
    key?: string;
  };
}

export interface PatientSearchResult {
  _id: string;
  name: string;
  condition: string;
  isReleased: boolean;
  avatar?: {
    url: string;
    key?: string;
  };
  doctorName: string;
}

const globalSearch = async (params: GlobalSearchParams) => {
  const query = (params.searchTerm || '').trim();
  const limit = Math.max(1, Math.min(20, Number(params.limit) || 5));
  const type = params.type || 'all';

  if (!query || query.length < 2) {
    return {
      doctors: [],
      patients: [],
      total: 0,
      totalDoctors: 0,
      totalPatients: 0,
    };
  }

  // escape regex special characters to prevent regex crashes / injection
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const searchRegex = new RegExp(escapedQuery, 'i');

  const [doctors, patients] = await Promise.all([
    // 1. Doctors search: id, avatar (image), name, specialization (specialist), hospital name
    type === 'patients'
      ? Promise.resolve([])
      : Doctor.find({
          $or: [
            { name: searchRegex },
            { specialization: searchRegex },
            { hospital: searchRegex },
          ],
        })
          .select('_id name specialization hospital avatar')
          .limit(limit)
          .lean()
          .then((docs) =>
            docs.map((doc) => ({
              _id: doc._id.toString(),
              name: doc.name,
              specialization: doc.specialization,
              hospital: doc.hospital,
              avatar: doc.avatar,
            }))
          ),

    // 2. Patients search: id, name, condition, isReleased, avatar, doctor name
    type === 'doctors'
      ? Promise.resolve([])
      : Patient.find({
          $or: [
            { name: searchRegex },
            { condition: searchRegex },
          ],
        })
          .select('_id name condition isReleased avatar doctorId')
          .populate('doctorId', 'name')
          .limit(limit)
          .lean()
          .then((pts) =>
            pts.map((p) => {
              const doc = p.doctorId && typeof p.doctorId === 'object' ? (p.doctorId as { name?: string }) : null;
              return {
                _id: p._id.toString(),
                name: p.name,
                condition: p.condition,
                isReleased: Boolean(p.isReleased),
                avatar: p.avatar,
                doctorName: doc?.name || 'Unassigned',
              };
            })
          ),
  ]);

  return {
    doctors,
    patients,
    total: doctors.length + patients.length,
    totalDoctors: doctors.length,
    totalPatients: patients.length,
  };
};

export const SearchService = {
  globalSearch,
};
