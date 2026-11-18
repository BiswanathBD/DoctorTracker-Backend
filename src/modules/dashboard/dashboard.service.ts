import { Doctor } from '../../models/doctor.model.js';
import { Patient } from '../../models/patient.model.js';

interface DashboardQueryOptions {
  days?: number | string;
}

// get consolidated dashboard statistics and chart data
const getDashboardStats = async (options: DashboardQueryOptions = {}) => {
  const days = Math.min(90, Math.max(7, Number(options.days) || 14));

  // 1. high-level counts
  const [totalDoctors, totalPatients, totalHospitals] = await Promise.all([
    Doctor.countDocuments(),
    Patient.countDocuments(),
    Doctor.distinct('hospital').then((h) => h.length),
  ]);

  // 2. patient status breakdown (active, unassigned, released)
  const [activePatients, unassignedPatients, releasedPatients] = await Promise.all([
    // Active patients: assigned to a doctor and not released
    Patient.countDocuments({
      doctorId: { $exists: true, $ne: null },
      isReleased: { $ne: true },
    }),
    // Unassigned patients: no doctor assigned and not released
    Patient.countDocuments({
      $or: [{ doctorId: null }, { doctorId: { $exists: false } }],
      isReleased: { $ne: true },
    }),
    // Released / discharged patients
    Patient.countDocuments({
      isReleased: true,
    }),
  ]);

  const activePatientPercent =
    totalPatients > 0 ? parseFloat(((activePatients / totalPatients) * 100).toFixed(1)) : 0;

  // 3. doctor workload aggregation (active assigned non-released patients per doctor)
  const doctorWorkload = await Doctor.aggregate([
    {
      $lookup: {
        from: 'patients',
        let: { docId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$doctorId', '$$docId'] },
                  { $ne: ['$isReleased', true] },
                ],
              },
            },
          },
        ],
        as: 'assignedPatients',
      },
    },
    {
      $project: {
        name: 1,
        specialization: 1,
        hospital: 1,
        patientCount: { $size: '$assignedPatients' },
      },
    },
    { $sort: { patientCount: -1 } },
  ]);

  // Active doctors: doctors with at least 1 active patient (patientCount > 0)
  const activeDoctorsList = doctorWorkload.filter((d) => d.patientCount > 0);
  const activeDoctors = activeDoctorsList.length;
  const inactiveDoctors = Math.max(0, totalDoctors - activeDoctors);
  const activeDoctorPercent =
    totalDoctors > 0 ? parseFloat(((activeDoctors / totalDoctors) * 100).toFixed(1)) : 0;

  // Active hospitals: count of distinct hospitals among doctors who have active patients
  const activeHospitalsSet = new Set(
    activeDoctorsList.map((d) => d.hospital?.trim()).filter(Boolean)
  );
  const activeHospitals = activeHospitalsSet.size;
  const activeHospitalPercent =
    totalHospitals > 0 ? parseFloat(((activeHospitals / totalHospitals) * 100).toFixed(1)) : 0;

  // Doctor to Patient Ratio
  const avgPatientsPerDoctor =
    totalDoctors > 0 ? parseFloat((totalPatients / totalDoctors).toFixed(2)) : 0;
  const avgActivePatientsPerActiveDoctor =
    activeDoctors > 0 ? parseFloat((activePatients / activeDoctors).toFixed(2)) : 0;
  const ratioText = `${totalDoctors}:${totalPatients}`;

  // Top 10 doctors for specialist caseload distribution card
  const patientsPerDoctor = doctorWorkload.slice(0, 10);

  // 4. specialization distribution (real doctor specialty breakdown)
  const specializationStats = await Doctor.aggregate([
    {
      $group: {
        _id: '$specialization',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 8 },
    {
      $project: {
        specialization: '$_id',
        count: 1,
        _id: 0,
      },
    },
  ]);

  // 5. patient condition distribution (real patient clinical condition breakdown)
  const conditionStats = await Patient.aggregate([
    {
      $group: {
        _id: '$condition',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 8 },
    {
      $project: {
        condition: '$_id',
        count: 1,
        _id: 0,
      },
    },
  ]);

  // 6. registration & admission timeline trends for requested timeframe (7, 14, 30 days)
  const rangeDate = new Date();
  rangeDate.setDate(rangeDate.getDate() - days);
  rangeDate.setHours(0, 0, 0, 0);

  const [patientTimeline, doctorTimeline] = await Promise.all([
    Patient.aggregate([
      {
        $match: {
          admissionDate: { $gte: rangeDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$admissionDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          patients: '$count',
          _id: 0,
        },
      },
    ]),
    Doctor.aggregate([
      {
        $match: {
          createdAt: { $gte: rangeDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          doctors: '$count',
          _id: 0,
        },
      },
    ]),
  ]);

  return {
    overview: {
      totalDoctors,
      activeDoctors,
      inactiveDoctors,
      activeDoctorPercent,

      totalPatients,
      activePatients,
      unassignedPatients,
      releasedPatients,
      activePatientPercent,

      totalHospitals,
      activeHospitals,
      activeHospitalPercent,

      avgPatientsPerDoctor,
      avgActivePatientsPerActiveDoctor,
      ratioText,
    },
    timelineDays: days,
    patientsPerDoctor,
    specializationStats,
    conditionStats,
    timeline: {
      patients: patientTimeline,
      doctors: doctorTimeline,
    },
  };
};

export const DashboardService = {
  getDashboardStats,
};
