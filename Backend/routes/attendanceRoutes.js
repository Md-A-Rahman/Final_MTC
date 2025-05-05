import express from 'express';
import { markAttendance, getAttendanceReport } from '../controllers/attendanceController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Protect all routes with authentication
router.use(auth);

// Mark attendance
router.post('/mark', markAttendance);

// Get attendance report
router.get('/report', getAttendanceReport);

export default router; 