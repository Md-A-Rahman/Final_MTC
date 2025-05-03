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
    console.log("[LOGIN DEBUG] Received login request:", req.body);
    const { phone, password, currentLocation } = req.body;
    console.log("[LOGIN DEBUG] Login attempt:", { phone, password });
    
    // Check for tutor
    const tutor = await Tutor.findOne({ phone }).select('+password');
    console.log("[LOGIN DEBUG] Tutor found:", tutor ? tutor.phone : "none");
    
    if (!tutor) {
      console.log("[LOGIN DEBUG] Tutor not found for phone:", phone);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, tutor.password);
    console.log("Password match:", isMatch);
    if (!isMatch) {
      console.log("[LOGIN DEBUG] Password mismatch for phone:", phone);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get the assigned center
    const center = await Center.findById(tutor.assignedCenter);
    if (!center) {
      console.log("[LOGIN DEBUG] No center assigned to tutor:", tutor.phone);
      return res.status(400).json({ message: 'No center assigned to this tutor' });
    }

    // If location is provided, verify it's within 100 meters of the center
    if (currentLocation && center.coordinates) {
      const maxDistance = 100; // 100 meters
      const distance = await Center.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: currentLocation },
            distanceField: "distance",
            maxDistance: maxDistance,
            spherical: true,
            query: { _id: center._id }
          }
        }
      ]);

      console.log("[LOGIN DEBUG] Geo check result:", distance);
      if (distance.length === 0) {
        console.log("[LOGIN DEBUG] Tutor not within 100 meters of center:", center.name);
        return res.status(403).json({ 
          message: 'You must be within 100 meters of your assigned center to log in',
          centerLocation: center.coordinates
        });
      }
    }

    // Update tutor's location if provided
    if (currentLocation) {
      tutor.location = {
        type: 'Point',
        coordinates: currentLocation
      };
      await tutor.save();
    }

    res.json({
      _id: tutor._id,
      name: tutor.name,
      phone: tutor.phone,
      role: tutor.role,
      assignedCenter: tutor.assignedCenter ? tutor.assignedCenter.toString() : null,
      centerName: center.name,
      token: generateToken(tutor._id, 'tutor')
    });
  } catch (error) {
    console.error('[LOGIN DEBUG] Login error:', error);
    res.status(500).json({ message: error.message });
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