console.log('Tutor Application Routes loaded');
import express from 'express';
import { createTutorApplication, getTutorApplications } from '../controllers/tutorApplicationController.js';

const router = express.Router();

router.post('/', createTutorApplication);
router.get('/', getTutorApplications);

export default router; 