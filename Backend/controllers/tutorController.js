import Tutor from '../models/Tutor.js';
import Center from '../models/Center.js';
import bcrypt from 'bcryptjs';
import { isWithinRadius, calculateDistance } from '../utils/geoUtils.js';

// @desc    Get all tutors
// @route   GET /api/tutors
// @access  Private/Admin
export const getTutors = async (req, res) => {
  try {
    const tutors = await Tutor.find()
      .populate('assignedCenter', 'name location')
      .select('-password');
    // Add centerName to each tutor
    const tutorsWithCenterName = tutors.map(tutor => {
      const tutorObj = tutor.toObject();
      tutorObj.centerName = tutorObj.assignedCenter?.name || "Unknown Center";
      return tutorObj;
    });
    res.json(tutorsWithCenterName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single tutor
// @route   GET /api/tutors/:id
// @access  Private/Admin & Private/Self
export const getTutor = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id)
      .populate('assignedCenter', 'name location')
      .select('-password');
    
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Check if the requesting user is the tutor or an admin
    if (req.role !== 'admin' && req.user._id.toString() !== tutor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this tutor' });
    }
    // Add centerName to the tutor object
    const tutorObj = tutor.toObject();
    tutorObj.centerName = tutorObj.assignedCenter?.name || "Unknown Center";
    res.json(tutorObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new tutor
// @route   POST /api/tutors
// @access  Private/Admin
export const createTutor = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      assignedCenter,
      sessionType,
      sessionTiming,
      subjects,
      assignmentInfo,
      assignedHadiyaAmount
    } = req.body;

    // Required document fields from FormData
    const aadharNumber = req.body['documents[aadharNumber]'] || req.body.aadharNumber;
    const bankAccountNumber = req.body['documents[bankAccount][accountNumber]'] || req.body.bankAccountNumber;
    const ifscCode = req.body['documents[bankAccount][ifscCode]'] || req.body.ifscCode;

    // Required file uploads
    const aadharPhoto = req.files?.aadharPhoto ? req.files.aadharPhoto[0].path : null;
    const passbookPhoto = req.files?.passbookPhoto ? req.files.passbookPhoto[0].path : null;
    const resume = req.files?.resume ? req.files.resume[0].path : null;
    // Optional file uploads
    const certificates = req.files?.certificates ? req.files.certificates.map(f => f.path) : [];
    const memos = req.files?.memos ? req.files.memos.map(f => f.path) : [];

    // Validate required fields
    if (!aadharNumber || !aadharPhoto) {
      return res.status(400).json({ message: 'Aadhar number and photo are required' });
    }
    if (!bankAccountNumber || !ifscCode || !passbookPhoto) {
      return res.status(400).json({ message: 'Bank account number, IFSC code, and passbook photo are required' });
    }
    if (!resume) {
      return res.status(400).json({ message: 'Resume is required' });
    }

    // Check if tutor already exists
    const existingTutor = await Tutor.findOne({ email });
    if (existingTutor) {
      return res.status(400).json({ message: 'Tutor with this email already exists' });
    }

    // Create new tutor with document paths
    const tutor = new Tutor({
      name,
      email,
      phone,
      password,
      assignedCenter,
      sessionType,
      sessionTiming,
      subjects,
      assignmentInformation: assignmentInfo,
      assignedHadiyaAmount: assignedHadiyaAmount || 0,
      documents: {
        aadharNumber,
        aadharPhoto,
        bankAccount: {
          accountNumber: bankAccountNumber,
          ifscCode,
          passbookPhoto
        },
        certificates,
        memos,
        resume
      }
    });

    await tutor.save();

    res.status(201).json({
      message: 'Tutor created successfully',
      tutor: {
        _id: tutor._id,
        name: tutor.name,
        email: tutor.email,
        phone: tutor.phone,
        assignedCenter: tutor.assignedCenter,
        documents: tutor.documents
      }
    });
  } catch (error) {
    console.error('Error creating tutor:', error);
    res.status(500).json({ message: 'Error creating tutor', error: error.message });
  }
};

// @desc    Update tutor
// @route   PUT /api/tutors/:id
// @access  Private/Admin
export const updateTutor = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Only handle password if it's provided in the request
    if (req.body.password) {
      try {
        // Validate password length
        if (req.body.password.length < 6) {
          return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        updateData.password = hashedPassword;
      } catch (error) {
        console.error('Error handling password:', error);
        return res.status(400).json({ message: 'Failed to update password' });
      }
    } else {
      // If no password is provided, don't include it in the update
      delete updateData.password;
    }

    // If center is being changed
    if (req.body.assignedCenter && req.body.assignedCenter !== tutor.assignedCenter.toString()) {
      // Remove tutor from old center
      const oldCenter = await Center.findById(tutor.assignedCenter);
      if (oldCenter) {
        oldCenter.tutors = oldCenter.tutors.filter(id => id.toString() !== tutor._id.toString());
        await oldCenter.save();
      }

      // Add tutor to new center
      const newCenter = await Center.findById(req.body.assignedCenter);
      if (!newCenter) {
        return res.status(404).json({ message: 'New center not found' });
      }
      newCenter.tutors.push(tutor._id);
      await newCenter.save();
    }

    // Prepare update data - only include fields that are being updated
    const updateData = {};
    
    // Only update fields that are provided in the request
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.body.assignedCenter) updateData.assignedCenter = req.body.assignedCenter;
    if (req.body.subjects) updateData.subjects = req.body.subjects;
    if (req.body.sessionType) updateData.sessionType = req.body.sessionType;
    if (req.body.sessionTiming) updateData.sessionTiming = req.body.sessionTiming;
    if (req.body.assignmentInformation) updateData.assignmentInformation = req.body.assignmentInformation;

    // Check if all required information is complete
    const isInformationComplete = Boolean(
      req.body.name &&
      req.body.email &&
      req.body.phone &&
      req.body.assignedCenter &&
      req.body.subjects &&
      req.body.subjects.length > 0 &&
      req.body.sessionType &&
      req.body.sessionTiming
    );

    // Update status based on information completeness
    if (isInformationComplete) {
      updateData.status = 'active';
    } else {
      updateData.status = 'pending';
    }


    try {
      // Update the tutor document
      const updatedTutor = await Tutor.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: false, context: 'query' }
      )
        .select('-password')
        .populate('assignedCenter', 'name location');

      // Log the status update for debugging
      console.log(`Tutor status updated to: ${updatedTutor.status}`);

      // Add centerName to the response
      const tutorResponse = updatedTutor.toObject();
      tutorResponse.centerName = tutorResponse.assignedCenter?.name || "Unknown Center";

      if (!updatedTutor) {
        return res.status(404).json({ message: 'Tutor not found' });
      }

      res.json(tutorResponse);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'A tutor with this phone number already exists' });
      }
      console.error('Error updating tutor:', error);
      res.status(500).json({ message: 'Failed to update tutor', error: error.message });
    }

    // Add centerName to the response
    const tutorResponse = updatedTutor.toObject();
    tutorResponse.centerName = tutorResponse.assignedCenter?.name || "Unknown Center";

    res.json(tutorResponse);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A tutor with this phone number already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete tutor
// @route   DELETE /api/tutors/:id
// @access  Private/Admin
export const deleteTutor = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Remove tutor from center
    const center = await Center.findById(tutor.assignedCenter);
    if (center) {
      center.tutors = center.tutors.filter(id => id.toString() !== tutor._id.toString());
      await center.save();
    }

    await tutor.deleteOne();
    // Remove tutor from center's tutors array
    await Center.findByIdAndUpdate(tutor.assignedCenter, { $pull: { tutors: tutor._id } });
    res.json({ message: 'Tutor removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tutor attendance report
// @route   GET /api/tutors/:id/attendance
// @access  Private
export const getTutorAttendanceReport = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Check if the requesting user is the tutor or an admin
    if (req.role !== 'admin' && req.user._id.toString() !== tutor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this report' });
    }

    const { month, year } = req.query; // Expecting month (1-12) and year (YYYY)

    let filteredAttendance = tutor.attendance;

    if (month && year) {
      const numericMonth = parseInt(month, 10);
      const numericYear = parseInt(year, 10);

      if (isNaN(numericMonth) || isNaN(numericYear) || numericMonth < 1 || numericMonth > 12) {
        return res.status(400).json({ message: 'Invalid month or year format.' });
      }

      // Filter by year and month (getMonth() is 0-indexed)
      filteredAttendance = tutor.attendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === numericYear && recordDate.getMonth() === (numericMonth - 1);
      });
    }

    const attendedSessions = filteredAttendance.filter(record => record.status === 'present').length;
    
    // Placeholder for totalSessions calculation. 
    // For now, totalSessions will be the number of unique days within the filtered period where attendance was marked.
    // This means percentage will be 100% if only 'present' is marked.
    const uniqueMarkedDays = new Set(filteredAttendance.map(record => new Date(record.date).setHours(0,0,0,0))).size;
    const totalSessionsForCalc = uniqueMarkedDays; // This needs to be replaced with actual expected workdays

    const attendancePercentage = totalSessionsForCalc > 0 ? (attendedSessions / totalSessionsForCalc) * 100 : 0;

    // TODO: Refine totalSessions based on business logic (e.g., expected workdays).
    // TODO: Implement absentSessions calculation if 'absent' records are to be created or inferred.
    // TODO: Structure monthlyBreakdown if needed (e.g., array of daily statuses).

    res.json({
      tutorId: tutor._id,
      name: tutor.name,
      filter: {
        month: month ? parseInt(month, 10) : undefined,
        year: year ? parseInt(year, 10) : undefined,
      },
      attendanceStats: {
        totalExpectedSessions: totalSessionsForCalc, // Placeholder - update with actual logic
        attendedSessions: attendedSessions,
        absentSessions: totalSessionsForCalc - attendedSessions, // Placeholder - update with actual logic
        attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
        // monthlyBreakdown: [] // Example: [{ date: '2023-01-01', status: 'present' }, ...]
      },
      // rawFilteredData: filteredAttendance // Optional: for frontend to do more complex grouping/display
    });

  } catch (error) {
    console.error('Error fetching tutor attendance report:', error);
    res.status(500).json({ message: 'Error fetching attendance report', errorDetails: error.message });
  }
};

// @desc    Get tutor performance report
// @route   GET /api/tutors/:id/performance
// @access  Private
export const getTutorPerformanceReport = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Check if the requesting user is the tutor or an admin
    if (req.role !== 'admin' && req.user._id.toString() !== tutor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this report' });
    }

    // TODO: Implement actual performance report logic
    res.json({
      tutorId: tutor._id,
      name: tutor.name,
      performance: {
        averageRating: 0,
        totalStudents: 0,
        subjectPerformance: [],
        monthlyProgress: []
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tutor students report
// @route   GET /api/tutors/:id/students
// @access  Private
export const getTutorStudentsReport = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Check if the requesting user is the tutor or an admin
    if (req.role !== 'admin' && req.user._id.toString() !== tutor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this report' });
    }

    // TODO: Implement actual students report logic
    res.json({
      tutorId: tutor._id,
      name: tutor.name,
      location: tutor.location,
      students: {
        total: 0,
        active: 0,
        bySubject: [],
        byClass: []
      }
    });
    // console.log(tutor.name, tutor.location)
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitAttendance = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.user._id);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    const center = await Center.findById(tutor.assignedCenter);
    if (!center) {
      return res.status(404).json({ message: 'Assigned center not found' });
    }

    if (!req.body.currentLocation || !Array.isArray(req.body.currentLocation) || req.body.currentLocation.length !== 2) {
      return res.status(400).json({ message: 'Invalid location data provided' });
    }

    const [tutorLat, tutorLon] = req.body.currentLocation;
    const [centerLat, centerLon] = center.coordinates;

    // Check if tutor is within 1300 meters of the center
    const isWithinRange = isWithinRadius(
      tutorLat,
      tutorLon,
      centerLat,
      centerLon,
      1300 // 1300 meters radius
    );

    if (!isWithinRange) {
      const distance = calculateDistance(tutorLat, tutorLon, centerLat, centerLon);
      return res.status(400).json({
        message: 'You must be within 1300 meters of the center to submit attendance',
        distance: distance,
        tutorLocation: [tutorLat, tutorLon],
        centerLocation: [centerLat, centerLon]
      });
    }

    // Record attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceRecord = {
      date: today,
      status: 'present',
      location: {
        type: 'Point',
        coordinates: [tutorLon, tutorLat]
      },
      center: center._id,
      centerName: center.name
    };

    // Add to attendance array if it doesn't exist for today
    const existingAttendanceIndex = tutor.attendance.findIndex(
      record => record.date.getTime() === today.getTime()
    );

    if (existingAttendanceIndex === -1) {
      tutor.attendance.push(attendanceRecord);
    } else {
      tutor.attendance[existingAttendanceIndex] = attendanceRecord;
    }

    await tutor.save();

    res.status(200).json({
      message: 'Attendance submitted successfully',
      attendance: attendanceRecord
    });
  } catch (error) {
    console.error('Error submitting attendance:', error);
    res.status(500).json({ 
      message: 'Error submitting attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get center location for a tutor
// @route   POST /api/tutors/get-center-location
// @access  Private/Tutor
export const getCenterLocation = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.body.tutorId)
      .populate('assignedCenter', 'location coordinates');
    
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    if (!tutor.assignedCenter) {
      return res.status(404).json({ message: 'No center assigned to this tutor' });
    }

    res.json({
      centerId: tutor.assignedCenter._id,
      centerName: tutor.assignedCenter.name,
      coordinates: tutor.assignedCenter.coordinates
    });
  } catch (error) {
    console.error('Error getting center location:', error);
    res.status(500).json({ message: 'Error getting center location' });
  }
};