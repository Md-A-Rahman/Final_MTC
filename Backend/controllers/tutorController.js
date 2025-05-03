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

// @desc    Create tutor
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

    // Check if tutor exists by phone number
    const tutorExists = await Tutor.findOne({ phone });
    if (tutorExists) {
      return res.status(400).json({ message: 'Tutor with this phone number already exists' });
    }

    // Check if center exists
    const center = await Center.findById(assignedCenter);
    if (!center) {
      return res.status(404).json({ message: 'Center not found' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create tutor with optional fields
    const tutor = await Tutor.create({
      name,
      email,
      phone,
      password: hashedPassword,
      qualifications: qualifications || '',
      assignedCenter,
      subjects: Array.isArray(subjects) ? subjects : [subjects],
      sessionType,
      sessionTiming,
      documents: documents || {
        aadharNumber: '',
        aadharPhoto: null,
        bankAccount: {
          accountNumber: '',
          ifscCode: '',
          passbookPhoto: null
        },
        certificates: null,
        memos: null,
        resume: null
      },
      status: 'pending'
    });

    // Add tutor to center
    center.tutors.push(tutor._id);
    await center.save();

    // Return tutor data without password
    const tutorResponse = await Tutor.findById(tutor._id)
      .select('-password')
      .populate('assignedCenter', 'name location');

    res.status(201).json(tutorResponse);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Tutor with this phone number already exists' });
    }
    res.status(500).json({ message: error.message });
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

    const updatedTutor = await Tutor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('assignedCenter', 'name location');

    res.json(updatedTutor);
  } catch (error) {
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