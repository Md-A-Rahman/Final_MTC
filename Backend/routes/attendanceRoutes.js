import express from 'express';
import { markAttendance, getAttendanceReport, getRecentAttendance } from '../controllers/attendanceController.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes with authentication
router.use(auth);

// Mark attendance
router.post('/mark', adminOnly, markAttendance);

// Get attendance report
router.get('/report', adminOnly, getAttendanceReport);

// Get recent attendance
router.get('/recent', getRecentAttendance);

export default router; 