import express from 'express';
import Admin from '../models/Admin.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin - Get all admins (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router; 