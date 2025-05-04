import Tutor from '../models/Tutor.js';
import Center from '../models/Center.js';
import bcrypt from 'bcryptjs';

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

// @desc    Create new tutor
// @route   POST /api/tutors
// @access  Private/Admin
export const createTutor = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      qualifications,
      assignedCenter,
      subjects,
      sessionType,
      sessionTiming,
      documents
    } = req.body;

    // Check if tutor exists
    const tutorExists = await Tutor.findOne({ phone });
    if (tutorExists) {
      return res.status(400).json({ message: 'Tutor already exists' });
    }

    // Create tutor
    const tutor = await Tutor.create({
      name,
      email,
      phone,
      password,
      qualifications: qualifications || '',
      assignedCenter,
      subjects,
      sessionType,
      sessionTiming,
      documents: {
        aadharNumber: documents?.aadharNumber || '',
        aadharPhoto: documents?.aadharPhoto || null,
        bankAccount: {
          accountNumber: documents?.bankAccount?.accountNumber || '',
          ifscCode: documents?.bankAccount?.ifscCode || '',
          passbookPhoto: documents?.bankAccount?.passbookPhoto || null
        },
        certificates: documents?.certificates || null,
        memos: documents?.memos || null,
        resume: documents?.resume || null
      },
      location: {
        type: 'Point',
        coordinates: [0, 0] // Default coordinates
      }
    });

    res.status(201).json({
      _id: tutor._id,
      name: tutor.name,
      email: tutor.email,
      phone: tutor.phone,
      role: tutor.role,
      assignedCenter: tutor.assignedCenter
    });
  } catch (error) {
    console.error('Create tutor error:', error);
    res.status(500).json({ 
      message: 'Error creating tutor',
      error: error.message 
    });
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

    // If updating password, hash it
    if (req.body.password) {
      // Always hash the password when updating
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
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

    // Prepare update data
    const updateData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      assignedCenter: req.body.assignedCenter,
      subjects: req.body.subjects,
      sessionType: req.body.sessionType,
      sessionTiming: req.body.sessionTiming,
      assignmentInformation: req.body.assignmentInformation || tutor.assignmentInformation
    };

    // Always include password in update if it was provided
    if (req.body.password) {
      updateData.password = req.body.password;
    }

    const updatedTutor = await Tutor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('assignedCenter', 'name location');

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

    // TODO: Implement actual attendance report logic
    res.json({
      tutorId: tutor._id,
      name: tutor.name,
      attendance: {
        totalSessions: 0,
        attendedSessions: 0,
        attendancePercentage: 0,
        monthlyBreakdown: []
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      students: {
        total: 0,
        active: 0,
        bySubject: [],
        byClass: []
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};