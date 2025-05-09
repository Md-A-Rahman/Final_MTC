import express from 'express';
import { markAttendance, getAttendanceReport, getRecentAttendance } from '../controllers/attendanceController.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes with authentication
router.use(auth);

// Mark attendance
router.post('/mark', adminOnly, markAttendance);

// Get recent attendance (accessible to both tutors and admins)
router.get('/recent', getRecentAttendance);

// Get attendance report
router.get('/report', adminOnly, getAttendanceReport);

export default router; 