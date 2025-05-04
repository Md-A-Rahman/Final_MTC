import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import Admin from '../models/Admin.js';
import Tutor from '../models/Tutor.js';
import Center from '../models/Center.js';

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Admin Login
// @route   POST /api/auth/admin/login
// @access  Public
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for admin
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password (plain text comparison for testing)
    if (password !== admin.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin._id, 'admin')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Tutor Login
// @route   POST /api/auth/tutor/login
// @access  Public
export const tutorLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const tutor = await Tutor.findOne({ phone })
      .populate('assignedCenter', 'name location coordinates');

    if (!tutor) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await tutor.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(tutor._id, 'tutor');

    // Prepare response with tutor and center data
    const response = {
      _id: tutor._id,
      name: tutor.name,
      email: tutor.email,
      phone: tutor.phone,
      role: tutor.role,
      token,
      assignedCenter: {
        _id: tutor.assignedCenter._id,
        name: tutor.assignedCenter.name,
        location: tutor.assignedCenter.location,
        coordinates: tutor.assignedCenter.coordinates
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
};

// Fast password reset endpoint for debugging
export const forceResetTutorPassword = async (req, res) => {
  const { phone, newPassword } = req.body;
  const tutor = await Tutor.findOne({ phone });
  if (!tutor) return res.status(404).json({ message: 'Tutor not found' });
  tutor.password = await bcrypt.hash(newPassword, 10);
  await tutor.save();
  console.log('Password after manual hash:', tutor.password);
  res.json({ message: 'Password reset!' });
};

// @desc    Register Admin
// @route   POST /api/auth/admin/register
// @access  Public
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if admin exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      phone,
      password
    });

    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin._id, 'admin')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};