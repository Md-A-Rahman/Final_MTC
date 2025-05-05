import Attendance from '../models/Attendance.js';
import Tutor from '../models/Tutor.js';
import Center from '../models/Center.js';
import { startOfMonth, endOfMonth, format } from 'date-fns';

// Mark attendance for a tutor
export const markAttendance = async (req, res) => {
  try {
    const { tutorId, centerId, date, status } = req.body;
    const adminId = req.user._id; // Assuming admin is authenticated

    // Check if tutor exists
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Check if center exists
    const center = await Center.findById(centerId);
    if (!center) {
      return res.status(404).json({ message: 'Center not found' });
    }

    // Create or update attendance record
    const attendance = await Attendance.findOneAndUpdate(
      { tutor: tutorId, date },
      {
        tutor: tutorId,
        center: centerId,
        date,
        status,
        markedBy: adminId
      },
      { upsert: true, new: true }
    );

    res.status(200).json(attendance);
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Error marking attendance' });
  }
};

// Get attendance report for a specific month
export const getAttendanceReport = async (req, res) => {
  try {
    const { month, year, centerId } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get all tutors for the selected center (or all centers)
    const tutorQuery = centerId ? { assignedCenter: centerId } : {};
    const tutors = await Tutor.find(tutorQuery).populate('assignedCenter', 'name');

    // Get all attendance records for the month
    const attendanceQuery = {
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };
    if (centerId) {
      attendanceQuery.center = centerId;
    }
    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate('tutor', 'name')
      .populate('center', 'name')
      .sort({ date: 1 });

    console.log('Attendance records for report:', attendanceRecords);

    // Group attendance by tutorId and date
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      const tutorId = record.tutor._id.toString();
      if (!attendanceMap[tutorId]) attendanceMap[tutorId] = {};
      attendanceMap[tutorId][format(record.date, 'yyyy-MM-dd')] = record.status === 'present';
    });

    // Build report for all tutors
    const report = tutors.map(tutor => {
      const attendance = attendanceMap[tutor._id.toString()] || {};
      // Use assignedCenter for the center name
      let center = { name: 'N/A' };
      if (tutor.assignedCenter && tutor.assignedCenter.name) {
        center = { _id: tutor.assignedCenter._id, name: tutor.assignedCenter.name };
      }
      return {
        tutor: { _id: tutor._id, name: tutor.name },
        center,
        attendance
      };
    });

    res.status(200).json(report);
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    res.status(500).json({ message: 'Error fetching attendance report' });
  }
}; 