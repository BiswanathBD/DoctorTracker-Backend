import { Router } from 'express';
import { PatientController } from './patient.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { upload } from '../../utils/fileUploader.js';
const router = Router();
// protect all patient routes with admin auth
router.use(protect);
// aggregate list endpoints
router.get('/conditions', PatientController.getConditions);
// crud endpoints
router.post('/', PatientController.createPatient);
router.get('/', PatientController.getAllPatients);
router.get('/:id', PatientController.getPatientById);
router.patch('/:id', PatientController.updatePatient);
router.patch('/:id/avatar', upload.single('avatar'), PatientController.updateAvatar);
router.delete('/:id', PatientController.deletePatient);
export const PatientRoutes = router;
