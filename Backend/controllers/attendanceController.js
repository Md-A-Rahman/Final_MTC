import Attendance from '../models/Attendance.js';
import Tutor from '../models/Tutor.js';
import Center from '../models/Center.js';
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns';

// Mark attendance for a tutor (by Admin)
export const markAttendance = async (req, res) => {
  try {
    const { tutorId, centerId, date, status } = req.body;
    const adminId = req.user._id; // Admin who is marking

    if (!tutorId || !centerId || !date || !status) {
      return res.status(400).json({ message: 'Missing required fields: tutorId, centerId, date, status.' });
    }

    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    const center = await Center.findById(centerId);
    if (!center) {
      return res.status(404).json({ message: 'Center not found' });
    }

    const recordDate = new Date(date);
    recordDate.setHours(0, 0, 0, 0); // Normalize to start of day

    const attendanceRecord = {
      date: recordDate,
      status: status, // 'present' or 'absent' from request
      center: center._id,
      centerName: center.name,
      markedBy: adminId, // Record who marked it
      // location: null, // Location not typically provided by admin marking
    };

    const existingAttendanceIndex = tutor.attendance.findIndex(
      record => new Date(record.date).getTime() === recordDate.getTime()
    );

    if (existingAttendanceIndex > -1) {
      // Update existing record
      tutor.attendance[existingAttendanceIndex] = {
        ...tutor.attendance[existingAttendanceIndex], // Preserve existing fields like location if any
        ...attendanceRecord // Overwrite with new data
      };
    } else {
      // Add new record
      tutor.attendance.push(attendanceRecord);
    }

    await tutor.save();

    // Find the newly added/updated record to return it (optional, but good for confirmation)
    const savedRecord = tutor.attendance.find(
        record => new Date(record.date).getTime() === recordDate.getTime()
    );

    res.status(200).json({
      message: 'Attendance marked successfully',
      attendance: savedRecord
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Error marking attendance', errorDetails: error.message });
  }
};

// Get attendance report for a specific month
export const getAttendanceReport = async (req, res) => {
  try {
    const { month, year, centerId } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required query parameters.' });
    }

    const numericMonth = parseInt(month, 10);
    const numericYear = parseInt(year, 10);

    if (isNaN(numericMonth) || isNaN(numericYear) || numericMonth < 1 || numericMonth > 12) {
      return res.status(400).json({ message: 'Invalid month or year format.' });
    }

    // Define the start and end of the month for filtering and iteration
    const monthStartDate = startOfMonth(new Date(numericYear, numericMonth - 1, 1));
    const monthEndDate = endOfMonth(new Date(numericYear, numericMonth - 1, 1));
    
    // Get all tutors for the selected center (or all centers), filtering by active status
    const tutorQuery = centerId ? { assignedCenter: centerId, status: { $in: ['active', 'pending'] } } : { status: { $in: ['active', 'pending'] } };
    const tutors = await Tutor.find(tutorQuery).populate('assignedCenter', 'name');

    // Generate all calendar days in the selected month
    const allDaysInMonth = eachDayOfInterval({ start: monthStartDate, end: monthEndDate });

    // Build report for all tutors
    const report = tutors.map(tutor => {
      const dailyAttendance = {};

      // Create a quick lookup for the tutor's existing attendance records for the month
      const tutorMonthlyAttendance = {};
      tutor.attendance.forEach(record => {
        const recordDate = new Date(record.date);
        if (recordDate >= monthStartDate && recordDate <= monthEndDate) {
          tutorMonthlyAttendance[format(recordDate, 'yyyy-MM-dd')] = record.status === 'present';
        }
      });

      // Populate dailyAttendance for all days in the month
      allDaysInMonth.forEach(dayInMonth => {
        const dayString = format(dayInMonth, 'yyyy-MM-dd');
        dailyAttendance[dayString] = tutorMonthlyAttendance[dayString] || false; // false if not present or no record
      });

      let centerInfo = { name: 'N/A' };
      if (tutor.assignedCenter && tutor.assignedCenter.name) {
        centerInfo = { _id: tutor.assignedCenter._id, name: tutor.assignedCenter.name };
      }

      return {
        tutor: { _id: tutor._id, name: tutor.name },
        center: centerInfo,
        attendance: dailyAttendance // Map of 'yyyy-MM-dd': true (present) or false (absent/not marked)
      };
    });

    res.status(200).json(report);
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    res.status(500).json({ message: 'Error fetching attendance report', errorDetails: error.message });
  }
};

// Get recent attendance records
export const getRecentAttendance = async (req, res) => {
  try {
    const recent = await Attendance.find()
      .sort({ date: -1 })
      .limit(10)
      .populate('tutor', 'name email')
      .populate('center', 'name');
    res.json(recent);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recent attendance', error: error.message });
  }
}; 