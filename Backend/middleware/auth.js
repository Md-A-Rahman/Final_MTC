import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Tutor from '../models/Tutor.js';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = admin;
    req.role = decoded.role;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Export both auth and protect (for backward compatibility)
export const protect = auth;
export default auth;

export const adminOnly = (req, res, next) => {
  if (req.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

export const tutorOnly = (req, res, next) => {
  if (req.role !== 'tutor') {
    return res.status(403).json({ message: 'Access denied. Tutor only.' });
  }
  next();
};