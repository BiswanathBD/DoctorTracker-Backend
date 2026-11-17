import { Router } from 'express';
import { DoctorController } from './doctor.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
const router = Router();
// protect all doctor routes with admin auth
router.use(protect);
// aggregate list endpoints
router.get('/specializations', DoctorController.getSpecializations);
router.get('/hospitals', DoctorController.getHospitals);
// crud endpoints
router.post('/', DoctorController.createDoctor);
router.get('/', DoctorController.getAllDoctors);
router.get('/:id', DoctorController.getDoctorById);
router.patch('/:id', DoctorController.updateDoctor);
router.delete('/:id', DoctorController.deleteDoctor);
// nested patient assignment endpoints
router.post('/:id/patients', DoctorController.addPatientToDoctor);
router.delete('/:id/patients/:patientId', DoctorController.removePatientFromDoctor);
export const DoctorRoutes = router;
