import { Doctor } from '../../models/doctor.model.js';
import { Patient } from '../../models/patient.model.js';
// get consolidated dashboard statistics and chart data
const getDashboardStats = async () => {
    // 1. high-level totals
    const [totalDoctors, totalPatients, totalHospitals] = await Promise.all([
        Doctor.countDocuments(),
        Patient.countDocuments(),
        Doctor.distinct('hospital').then((h) => h.length),
    ]);
    // average patients per doctor
    const avgPatientsPerDoctor = totalDoctors > 0 ? parseFloat((totalPatients / totalDoctors).toFixed(2)) : 0;
    // 2. patients per doctor distribution (top doctors with patient counts)
    const patientsPerDoctor = await Doctor.aggregate([
        {
            $lookup: {
                from: 'patients',
                localField: '_id',
                foreignField: 'doctorId',
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
        { $limit: 10 },
    ]);
    // 3. specialization distribution
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
    // 4. patient condition distribution
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
    // 5. registration & admission timeline trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [patientTimeline, doctorTimeline] = await Promise.all([
        Patient.aggregate([
            {
                $match: {
                    admissionDate: { $gte: thirtyDaysAgo },
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
                    createdAt: { $gte: thirtyDaysAgo },
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
            totalPatients,
            totalHospitals,
            avgPatientsPerDoctor,
        },
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
