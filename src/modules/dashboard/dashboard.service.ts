import { Doctor } from '../../models/doctor.model.js';
import { Patient } from '../../models/patient.model.js';

interface DashboardQueryOptions {
  days?: number | string;
}

// get dashboard statistics and chart data
const getDashboardStats = async (options: DashboardQueryOptions = {}) => {
  const days = Math.min(90, Math.max(7, Number(options.days) || 14));

  const rangeDate = new Date();
  rangeDate.setDate(rangeDate.getDate() - days);
  rangeDate.setHours(0, 0, 0, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // execute all aggregations and count queries in parallel
  const [
    totalDoctors,
    totalPatients,
    hospitalsList,
    activePatients,
    unassignedPatients,
    releasedPatients,
    doctorWorkload,
    specializationStats,
    conditionStats,
    patientTimeline,
    doctorTimeline,
    todayAdmissions,
    todayDoctors,
    todayReleased,
  ] = await Promise.all([
    // high-level counts
    Doctor.countDocuments(),
    Patient.countDocuments(),
    Doctor.distinct('hospital'),

    // patient status breakdown
    Patient.countDocuments({
      doctorId: { $exists: true, $ne: null },
      isReleased: { $ne: true },
    }),
    Patient.countDocuments({
      $or: [{ doctorId: null }, { doctorId: { $exists: false } }],
      isReleased: { $ne: true },
    }),
    Patient.countDocuments({
      isReleased: true,
    }),

    // doctor workload aggregation
    Doctor.aggregate([
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
          avatar: 1,
          patientCount: { $size: '$assignedPatients' },
        },
      },
      { $sort: { patientCount: -1 } },
    ]),

    // specialization distribution
    Doctor.aggregate([
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
    ]),

    // condition distribution
    Patient.aggregate([
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
    ]),

    // timeline trends
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

    // today activity report
    Patient.countDocuments({ admissionDate: { $gte: todayStart } }),
    Doctor.countDocuments({ createdAt: { $gte: todayStart } }),
    Patient.countDocuments({ isReleased: true, releaseDate: { $gte: todayStart } }),
  ]);

  const totalHospitals = hospitalsList.length;
  const activePatientPercent =
    totalPatients > 0 ? parseFloat(((activePatients / totalPatients) * 100).toFixed(1)) : 0;

  // active doctors
  const activeDoctorsList = doctorWorkload.filter((d) => d.patientCount > 0);
  const activeDoctors = activeDoctorsList.length;
  const inactiveDoctors = Math.max(0, totalDoctors - activeDoctors);
  const activeDoctorPercent =
    totalDoctors > 0 ? parseFloat(((activeDoctors / totalDoctors) * 100).toFixed(1)) : 0;

  // active hospitals
  const activeHospitalsSet = new Set(
    activeDoctorsList.map((d) => d.hospital?.trim()).filter(Boolean)
  );
  const activeHospitals = activeHospitalsSet.size;
  const activeHospitalPercent =
    totalHospitals > 0 ? parseFloat(((activeHospitals / totalHospitals) * 100).toFixed(1)) : 0;

  // doctor patient ratio
  const avgPatientsPerDoctor =
    totalDoctors > 0 ? parseFloat((totalPatients / totalDoctors).toFixed(2)) : 0;
  const avgActivePatientsPerActiveDoctor =
    activeDoctors > 0 ? parseFloat((activePatients / activeDoctors).toFixed(2)) : 0;
  const ratioText = `${totalDoctors}:${totalPatients}`;

  // top 10 doctors for caseload card
  const patientsPerDoctor = doctorWorkload.slice(0, 10);

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
    todaysReport: {
      newAdmissions: todayAdmissions,
      newDoctors: todayDoctors,
      releasedToday: todayReleased,
      activeUnderCare: activePatients,
      occupancyRate: activePatientPercent,
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
